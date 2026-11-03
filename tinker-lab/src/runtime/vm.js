// The virtual board: runs a compiled sketch against a HAL with a simulated clock.
// Execution is a stack of generators; every statement calls vm.tick(line), which
// lets the VM yield for the frame budget, breakpoints, stepping and interrupts.
import { RuntimeError, Reset, FnRef, Ptr, decodeBytes, makeRandom } from './values.js';
import { zeroValue, typeName, canon, sizeOf, isString } from './types.js';
import { toBytes } from './lexer.js';
import { formatValue } from './inspect.js';

const CHUNK = 512; // statements between slow-path checks
const STMT_US = 1; // simulated cost of one statement (µs) — a teaching model, not cycle accurate

const raf = typeof requestAnimationFrame === 'function' ? (fn) => requestAnimationFrame(fn) : (fn) => setTimeout(() => fn(now()), 16);
const caf = typeof cancelAnimationFrame === 'function' ? (id) => cancelAnimationFrame(id) : (id) => clearTimeout(id);
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export class VM {
  constructor(program, hal = {}, opts = {}) {
    this.P = program;
    this.T = program.T;
    this.board = program.board;
    this.info = this.T.info;
    this.hal = hal;
    this.devices = hal.devices ?? {};
    this.speed = opts.speed ?? 1;
    this.state = 'idle';
    this.line = 0;
    this.listeners = new Map();
    this.bp = new Uint8Array(program.lineCount + 2);
    this.us = 0;
    this.bootUs = 0;
    this.frozenUs = 0;
    this.limitUs = Infinity;
    this.budget = CHUNK;
    this.stack = [];
    this.stackBytes = 0;
    this.gens = [];
    this.wakeUs = 0;
    this.timers = [];
    this.warned = new Set();
    this.oobSeen = new Set();
    this.random = makeRandom(1);
    this.libState = new Map();
    this.resetCount = 0;
    this.wakeCause = 0;
    this.initPins();
  }

  // ------------------------------------------------------------------ events
  on(ev, fn) {
    if (!this.listeners.has(ev)) this.listeners.set(ev, new Set());
    this.listeners.get(ev).add(fn);
    return () => this.listeners.get(ev)?.delete(fn);
  }
  emit(ev, data) {
    const ls = this.listeners.get(ev);
    if (ls) for (const fn of ls) { try { fn(data); } catch (e) { console.error(e); } }
  }
  setState(s) {
    if (this.state === s) return;
    this.state = s;
    this.emit('state', s);
  }

  // ------------------------------------------------------------------ lifecycle
  initPins() {
    this.mode = new Array(128).fill(null);
    this.out = new Uint8Array(128);
    this.irqs = new Map();
    this.irqEnabled = true;
    this.irqPending = false;
    this.inIsr = false;
    this.irqSeq = 0;
    this.rx = '';
    this.ports = new Map();
  }

  /** Library state that survives for the life of this VM (created on demand). */
  lib(key, make) {
    if (!this.libState.has(key)) this.libState.set(key, make());
    return this.libState.get(key);
  }

  initGlobals(keepRtc = false) {
    const P = this.P;
    const old = this.G;
    this.G = new Array(P.globals.length);
    for (const g of P.globals) {
      if (keepRtc && g.rtc && old) { this.G[g.slot] = old[g.slot]; continue; }
      if (g.isLib) this.G[g.slot] = g.lib.create(this);
      else if (g.initConst !== undefined) this.G[g.slot] = g.initConst;
      else if (canon(g.type).k === 'class') this.G[g.slot] = null;
      else this.G[g.slot] = zeroValue(g.type, this);
    }
    this.globalBytes = P.globals.reduce((n, g) => n + (g.isLib || g.hidden ? 0 : sizeOf(g.type, this.T)), 0);
  }

  *mainGen(keepRtc) {
    const P = this.P;
    const f = { s: [], g: this.G, vm: this, up: null };
    const keep = keepRtc;
    for (const g of P.globals) {
      if (g.init && !(keep && g.rtc)) this.G[g.slot] = yield* g.init(f);
    }
    yield* P.setupFn.run(this, [], null);
    this.setupDone = true;
    for (;;) {
      if (this.tick(0)) yield 0;
      yield* P.loopFn.run(this, [], null);
      this.loops = (this.loops ?? 0) + 1;
      // serialEventRun / ESP32 loopTask overhead
      this.us += 2;
    }
  }

  boot(keepRtc = false) {
    this.initGlobals(keepRtc);
    this.stack = [];
    this.stackBytes = 0;
    this.inIsr = false;
    this.wakeUs = 0;
    this.setupDone = false;
    this.gens = [this.mainGen(keepRtc)];
  }

  start() {
    if (this.state === 'running') return;
    if (this.state === 'idle' || this.state === 'stopped' || this.state === 'error') {
      if (this.state !== 'idle') { this.us = 0; this.bootUs = 0; this.frozenUs = 0; this.initPins(); this.libState.clear(); }
      this.boot();
    }
    this.targetUs = this.us;
    this.lastReal = now();
    this.setState('running');
    this.schedule();
  }

  schedule() {
    if (this.manual) return;
    caf(this.rafId);
    this.rafId = raf((t) => this.frame(t ?? now()));
  }

  frame(t) {
    if (this.state !== 'running') return;
    const real = now();
    const dt = Math.min(250, Math.max(0, real - this.lastReal));
    this.lastReal = real;
    this.targetUs = Math.max(this.targetUs, this.us) + dt * 1000 * this.speed;
    if (this.targetUs - this.us > 250000 * this.speed) this.targetUs = this.us + 250000 * this.speed;
    this.runSlice(this.targetUs, real + 10);
    if (this.line !== this.lastLineEmitted) { this.lastLineEmitted = this.line; this.emit('line', this.line); }
    this.emit('frame', this.us);
    if (this.state === 'running') this.schedule();
    void t;
  }

  /** Run headless for `ms` simulated milliseconds (tests, fast-forward). */
  advance(ms) {
    this.manual = true;
    if (this.state === 'idle' || this.state === 'stopped') {
      if (this.state !== 'idle') { this.us = 0; this.bootUs = 0; this.frozenUs = 0; this.initPins(); this.libState.clear(); }
      this.boot();
    }
    if (this.state !== 'paused' && this.state !== 'error') this.setState('running');
    const target = this.us + ms * 1000;
    let guard = 0;
    while (this.state === 'running' && this.us < target && guard++ < 1e7) {
      this.runSlice(target, Infinity);
    }
    return this;
  }

  stop() {
    caf(this.rafId);
    for (const [pin] of this.toneOn ?? []) this.hal.noTone?.(pin);
    this.toneOn?.clear();
    this.gens = [];
    this.stack = [];
    this.setState('stopped');
  }

  pause() {
    if (this.state !== 'running') return;
    if (this.wakeUs > this.us || !this.gens.length) { this.doPause('user'); return; }
    this.pauseReq = true;
    this.budget = 0;
  }

  resume() {
    if (this.state !== 'paused') return;
    this.stepMode = null;
    this.lastReal = now();
    this.targetUs = this.us;
    this.setState('running');
    this.schedule();
  }

  step() { this.beginStep('into'); }
  stepOver() { this.beginStep('over'); }
  stepOut() { this.beginStep('out'); }
  beginStep(kind) {
    if (this.state !== 'paused') return;
    this.stepMode = { kind, depth: this.stack.length, from: this.line };
    this.budget = 0;
    this.lastReal = now();
    this.targetUs = this.us;
    this.setState('running');
    if (this.manual) { this.runSlice(Infinity, Infinity); return; }
    this.schedule();
  }

  setBreakpoints(lines) {
    this.bp.fill(0);
    for (const l of lines) if (l > 0 && l < this.bp.length) this.bp[l] = 1;
    this.breakpoints = [...lines];
  }

  doPause(reason) {
    this.pauseReq = false;
    this.stepMode = null;
    this.setState('paused');
    this.emit('line', this.line);
    this.lastLineEmitted = this.line;
    this.emit('pause', { line: this.line, reason });
  }

  // ------------------------------------------------------------------ the scheduler
  runSlice(targetUs, deadline) {
    this.limitUs = targetUs;
    this.deadline = deadline;
    this.pollInterrupts();
    let spins = 0;
    while (this.state === 'running') {
      if (++spins > 200000) break;
      this.runTimers();
      if (this.wakeUs > this.us) {
        if (this.irqPending && this.irqEnabled && !this.inIsr) { this.startIsr(); continue; }
        const next = Math.min(this.wakeUs, this.nextTimer());
        if (next <= targetUs) {
          this.us = next;
          if (this.us >= this.wakeUs) this.wakeUs = 0;
          this.pollInterrupts();
          continue;
        }
        this.us = Math.max(this.us, targetUs);
        break;
      }
      if (this.us >= targetUs) break;
      const top = this.gens[this.gens.length - 1];
      if (!top) { this.setState('stopped'); break; }
      this.yieldReason = null;
      this.budget = this.stepMode || this.pauseReq || this.irqPending ? 0 : CHUNK;
      let r;
      try {
        r = top.next();
      } catch (e) {
        this.handleThrow(e);
        break;
      }
      if (r.done) {
        this.gens.pop();
        if (top.isr) { this.inIsr = false; if (this.isrAt && this.stack.length > this.isrAt.depth) this.stack.length = this.isrAt.depth; }
        if (!this.gens.length) { this.setState('stopped'); break; }
        continue;
      }
      const why = this.yieldReason;
      if (why === 'pause') { this.doPause(this.pauseWhy); break; }
      if (why === 'isr') { this.startIsr(); continue; }
      if (why === 'wait') continue;
      if (why === 'slice') break;
      if (why === 'time') break;
    }
  }

  handleThrow(e) {
    if (e instanceof Reset) {
      this.reboot(e);
      return;
    }
    if (e instanceof RuntimeError) {
      this.fatal(e.message, e.hint);
      return;
    }
    console.error(e);
    this.fatal(`internal simulator error: ${e.message}`);
  }

  fatal(message, hint) {
    this.gens = [];
    for (const [pin] of this.toneOn ?? []) this.hal.noTone?.(pin);
    this.toneOn?.clear();
    this.errorInfo = { line: this.line, message, hint };
    this.emit('line', this.line);
    this.emit('error', { line: this.line, message, hint, fatal: true });
    this.setState('error');
  }

  reboot(e) {
    this.resetCount++;
    this.wakeCause = e.cause ?? 0;
    this.emit('reset', { reason: e.reason, cause: e.cause });
    this.bootUs = this.us;
    this.frozenUs = 0;
    const irqs = this.irqs;
    this.initPins();
    void irqs;
    for (const fn of this.onReboot ?? []) fn();
    this.boot(e.reason === 'deepsleep');
  }

  // ------------------------------------------------------------------ the statement hook
  tick(line) {
    this.line = line;
    this.us += STMT_US;
    if (--this.budget > 0 && this.us < this.limitUs && !this.bp[line]) return false;
    return this.slow(line);
  }

  slow(line) {
    if (this.bp[line] && line && !this.skipBpOnce) {
      if (!(this.stepMode && this.stepMode.from === line && this.stack.length === this.stepMode.depth && this.stepMode.kind !== 'into' && false)) {
        this.yieldReason = 'pause'; this.pauseWhy = 'breakpoint'; return true;
      }
    }
    this.skipBpOnce = false;
    if (this.pauseReq && line) { this.yieldReason = 'pause'; this.pauseWhy = 'user'; return true; }
    if (this.stepMode && line) {
      const d = this.stack.length, m = this.stepMode;
      if (m.kind === 'into' || (m.kind === 'over' && d <= m.depth) || (m.kind === 'out' && d < m.depth)) {
        this.yieldReason = 'pause'; this.pauseWhy = 'step'; return true;
      }
      this.budget = 0;
    }
    if (this.irqPending && this.irqEnabled && !this.inIsr) { this.yieldReason = 'isr'; return true; }
    if (this.us >= this.limitUs) { this.yieldReason = 'time'; return true; }
    if (this.budget <= 0) {
      this.pollCount = (this.pollCount ?? 0) + 1;
      if (this.irqs.size) this.pollInterrupts();
      if (this.timers.length && this.nextTimer() <= this.us) this.runTimers();
      if (this.deadline !== Infinity && now() > this.deadline) { this.yieldReason = 'slice'; return true; }
      if (!this.stepMode) this.budget = CHUNK;
      if (this.irqPending && this.irqEnabled && !this.inIsr) { this.yieldReason = 'isr'; return true; }
    }
    return false;
  }

  // ------------------------------------------------------------------ functions & call stack
  enter(info, f) {
    const callerLine = this.line;
    if (this.stack.length) this.stack[this.stack.length - 1].line = callerLine;
    if (info.frameBytes === undefined) info.frameBytes = info.locals.reduce((n, l) => n + (l.ref ? this.T.ptrSize : sizeOf(l.type, this.T)), 0) + (this.T.avr ? 4 : 16);
    this.stackBytes += info.frameBytes;
    this.stack.push({ fn: info, f, line: info.line, bytes: info.frameBytes });
    const ramLeft = this.info.ram - (this.globalBytes ?? 0) - (this.T.avr ? 200 : 1024);
    if (this.stackBytes > ramLeft || this.stack.length > 3000) {
      const depth = this.stack.length;
      this.fail(`stack overflow: ${depth} nested calls used about ${this.stackBytes} bytes of the ${this.info.ram}-byte RAM`,
        info.name !== 'loop' && this.stack.filter((s) => s.fn === info).length > 2 ? `${info.name}() keeps calling itself. Every recursive function needs a case that stops the recursion.` : 'Too many nested function calls for this board\'s memory.');
    }
  }
  leave() {
    const fr = this.stack.pop();
    if (fr) this.stackBytes -= fr.bytes;
    if (this.stack.length) this.line = this.stack[this.stack.length - 1].line;
  }

  /** Call a function value (FnRef) from library code: yield* vm.callRef(ref, args). */
  *callRef(ref, args = []) {
    if (!ref) this.fail('call through a null function pointer');
    const fn = ref instanceof FnRef ? ref.fn : ref.fn ?? ref;
    if (!fn.run) this.fail('call through an invalid function pointer');
    const a = args.slice(0, fn.params.length);
    while (a.length < fn.params.length) a.push(0);
    return yield* fn.run(this, a, ref.up ?? null);
  }

  callStack() {
    return this.stack.map((s, i) => ({ fn: s.fn.isLambda ? 'lambda' : s.fn.name, line: i === this.stack.length - 1 ? this.line : s.line }));
  }

  scopes(frameIndex = this.stack.length - 1) {
    const out = [];
    const fr = this.stack[frameIndex];
    const line = frameIndex === this.stack.length - 1 ? this.line : fr?.line;
    if (fr) {
      const vars = [];
      const seen = new Set();
      const locs = fr.fn.locals.filter((l) => line >= l.from && line <= l.to && (l.param || line > l.line || (line === l.line && fr.f.s[l.slot] !== undefined)));
      for (let i = locs.length - 1; i >= 0; i--) {
        const l = locs[i];
        if (seen.has(l.name)) continue;
        seen.add(l.name);
        let v = fr.f.s[l.slot];
        if (v === undefined) continue;
        if (l.ref && v instanceof Ptr) v = v.b[v.o];
        vars.unshift({ name: l.name, type: typeName(l.type, { aka: false }) + (l.ref ? '&' : ''), ...formatValue(v, l.type, this.T) });
      }
      out.push({ name: 'Locals', fn: fr.fn.isLambda ? 'lambda' : fr.fn.name, vars });
    }
    const gvars = [];
    for (const g of this.P.globals) {
      if (g.isLib || g.hidden || !this.G) continue;
      const v = this.G[g.slot];
      gvars.push({ name: g.staticLocal ? g.name.replace(/^.*::/, 'static ') : g.name, type: typeName(g.type, { aka: false }), ...formatValue(v, g.type, this.T) });
    }
    out.push({ name: 'Globals', vars: gvars });
    return out;
  }

  // ------------------------------------------------------------------ time
  millis() { return Math.floor((this.us - this.bootUs - this.frozenUs) / 1000) >>> 0; }
  micros() {
    const t = Math.floor(this.us - this.bootUs - this.frozenUs);
    return (this.T.avr ? t - (t % 4) : t) >>> 0;
  }

  /** Block the sketch for `us` microseconds of simulated time. */
  *sleep(us) {
    if (!(us > 0)) { return; }
    if (us < 50) { this.us += us; return; } // short waits: just advance the clock
    this.wakeUs = this.us + us;
    this.yieldReason = 'wait';
    yield 0;
  }

  /** Wait until pred() is true, checking every `stepUs`, at most `maxUs`. */
  *waitFor(pred, maxUs = Infinity, stepUs = 1000) {
    const end = this.us + maxUs;
    while (!pred()) {
      if (this.us >= end) return false;
      yield* this.sleep(Math.min(stepUs, end - this.us));
    }
    return true;
  }

  addTimer(atUs, fn) {
    this.timers.push({ at: atUs, fn });
    this.timers.sort((a, b) => a.at - b.at);
  }
  nextTimer() { return this.timers.length ? this.timers[0].at : Infinity; }
  runTimers() {
    while (this.timers.length && this.timers[0].at <= this.us) {
      const t = this.timers.shift();
      try { t.fn(); } catch (e) { console.error(e); }
    }
  }

  // ------------------------------------------------------------------ diagnostics at run time
  fail(message, hint) { throw new RuntimeError(message, hint); }

  /** A sanitizer-style warning: reported once per line, execution continues. */
  oob(line, message, hint) {
    const key = `${line}:${message}`;
    if (this.oobSeen.has(key)) return;
    this.oobSeen.add(key);
    this.emit('error', { line: line || this.line, message, hint, fatal: false });
  }

  warnOnce(key, message, hint) {
    if (this.warned.has(key)) return;
    this.warned.add(key);
    this.emit('warning', { line: this.line, message, hint });
  }

  // ------------------------------------------------------------------ pins
  pinMode(pin, mode) {
    const name = mode === 1 ? 'OUTPUT' : mode === 2 ? 'INPUT_PULLUP' : mode === 3 ? 'INPUT_PULLDOWN' : 'INPUT';
    this.mode[pin & 127] = name;
    this.hal.pinMode?.(pin, name);
    this.emit('pin', { pin, kind: 'mode', mode: name });
  }

  digitalWrite(pin, v) {
    v = v ? 1 : 0;
    const p = pin & 127;
    this.out[p] = v;
    if (this.T.avr && this.mode[p] !== 'OUTPUT') this.mode[p] = v ? 'INPUT_PULLUP' : this.mode[p] === 'INPUT_PULLUP' ? 'INPUT' : this.mode[p];
    if (this.pwm?.has(p)) this.pwm.delete(p);
    this.hal.digitalWrite?.(pin, v);
    this.emit('pin', { pin, kind: 'digital', value: v });
    if (this.irqs.has(p)) this.pollInterrupts();
  }

  /** Level on a pin as the hardware sees it (input or our own output). */
  readRaw(pin) {
    const p = pin & 127;
    if (this.mode[p] === 'OUTPUT') return this.out[p];
    const r = this.hal.digitalRead?.(pin);
    if (r === undefined || r === null) return this.mode[p] === 'INPUT_PULLUP' ? 1 : 0;
    return r ? 1 : 0;
  }

  digitalRead(pin) {
    this.us += this.T.avr ? 3 : 1;
    return this.readRaw(pin);
  }

  analogChannel(pin) {
    const info = this.info;
    if (info.analogBase == null) return pin; // ESP32: GPIO number
    if (pin >= info.analogBase) return pin - info.analogBase;
    return pin;
  }

  analogRead(pin) {
    this.us += this.T.avr ? 112 : 10;
    const ch = this.analogChannel(pin);
    let v = this.hal.analogRead?.(ch, pin) ?? 0;
    v = Math.max(0, Math.min(1023, Number(v) || 0));
    const bits = this.adcBits ?? this.info.adcBits;
    if (bits !== 10) v = Math.round((v * ((1 << bits) - 1)) / 1023);
    return Math.round(v);
  }

  isPwm(pin) {
    const pw = this.info.pwm;
    return pw === 'all' || pw.includes(pin);
  }

  analogWrite(pin, v) {
    const p = pin & 127;
    if (this.mode[p] !== 'OUTPUT') { this.mode[p] = 'OUTPUT'; this.hal.pinMode?.(pin, 'OUTPUT'); }
    if (!this.isPwm(pin)) {
      this.warnOnce(`pwm${pin}`, `analogWrite() on pin ${pin}: not a PWM pin on the ${this.info.name}, so it is only ever fully on or off`, `PWM pins: ${this.info.pwm.join(', ')} (marked ~ on the board).`);
      this.digitalWrite(pin, v >= 128 ? 1 : 0);
      return;
    }
    let duty;
    if (this.T.avr) duty = v === 0 ? 0 : v === 255 ? 255 : v & 255;
    else duty = Math.max(0, Math.min(255, v));
    this.pwm ??= new Map();
    this.pwm.set(p, duty);
    this.out[p] = duty >= 128 ? 1 : 0;
    if (this.hal.analogWrite) this.hal.analogWrite(pin, duty);
    else this.hal.digitalWrite?.(pin, duty >= 128 ? 1 : 0);
    this.emit('pin', { pin, kind: 'pwm', value: duty });
  }

  tone(pin, freq, dur) {
    this.toneOn ??= new Map();
    const id = (this.toneSeq = (this.toneSeq ?? 0) + 1);
    this.toneOn.set(pin, id);
    this.hal.tone?.(pin, freq, dur);
    this.emit('pin', { pin, kind: 'tone', value: freq });
    if (dur > 0) this.addTimer(this.us + dur * 1000, () => { if (this.toneOn.get(pin) === id) this.noTone(pin); });
  }
  noTone(pin) {
    this.toneOn?.delete(pin);
    this.hal.noTone?.(pin);
    this.emit('pin', { pin, kind: 'tone', value: 0 });
  }

  // ------------------------------------------------------------------ interrupts
  attachInterrupt(num, fn, mode) {
    const info = this.info;
    let pin = num;
    if (info.interrupts !== 'all') {
      const e = Object.entries(info.interrupts).find(([, n]) => n === num);
      if (!e) { this.warnOnce(`irq${num}`, `attachInterrupt(${num}, …): there is no external interrupt ${num} on the ${info.name}`, 'Use digitalPinToInterrupt(pin) to get the right number.'); return; }
      pin = Number(e[0]);
    }
    this.irqs.set(pin & 127, { pin, fn, mode, last: this.readRaw(pin), flag: false });
  }
  detachInterrupt(num) {
    const info = this.info;
    let pin = num;
    if (info.interrupts !== 'all') {
      const e = Object.entries(info.interrupts).find(([, n]) => n === num);
      if (!e) return;
      pin = Number(e[0]);
    }
    this.irqs.delete(pin & 127);
  }

  /** Check interrupt pins for edges / levels. */
  pollInterrupts() {
    if (!this.irqs.size) return;
    for (const irq of this.irqs.values()) {
      const v = this.readRaw(irq.pin);
      const last = irq.last;
      irq.last = v;
      let hit = false;
      switch (irq.mode) {
        case 'RISING': hit = !last && v; break;
        case 'FALLING': hit = last && !v; break;
        case 'CHANGE': hit = last !== v; break;
        case 'LOW': hit = !v; break;
        case 'HIGH': hit = !!v; break;
        default: break;
      }
      if (hit) { irq.flag = true; this.irqPending = true; this.budget = 0; }
    }
  }

  startIsr() {
    const irq = [...this.irqs.values()].find((x) => x.flag);
    this.irqPending = [...this.irqs.values()].filter((x) => x.flag).length > 1;
    if (!irq) { this.irqPending = false; return; }
    irq.flag = false;
    this.irqSeq++;
    this.inIsr = true;
    const self = this;
    const depth = this.stack.length;
    this.isrAt = { depth };
    const g = (function* () { yield* self.callRef(irq.fn, []); })();
    g.isr = true;
    this.gens.push(g);
    // re-check LOW-level interrupts after the ISR returns
  }

  // ------------------------------------------------------------------ serial ports
  port(n = 0) {
    if (!this.ports.has(n)) {
      this.ports.set(n, { n, begun: false, baud: 9600, rx: '', txBusy: 0, dec: typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null, timeout: 1000, line: '' });
    }
    return this.ports.get(n);
  }

  /** Bytes typed into the serial monitor. */
  serialInput(text) {
    const p = this.port(0);
    p.rx += toBytes(String(text));
  }

  /** Write bytes (a byte string) to a UART; blocks when the 64-byte TX buffer is full. */
  *uartWrite(n, bytes) {
    const p = this.port(n);
    if (!bytes.length) return 0;
    if (!p.begun) {
      this.warnOnce(`serial${n}`, `Serial${n || ''}.print() was called before Serial${n || ''}.begin(), so nothing is sent`, `Add Serial${n || ''}.begin(9600); at the start of setup().`);
      return bytes.length;
    }
    let text;
    if (p.dec) {
      const u = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) u[i] = bytes.charCodeAt(i);
      text = p.dec.decode(u, { stream: true });
    } else text = decodeBytes(bytes);
    if (n === 0) {
      if (text) { this.hal.serialWrite?.(text); this.emit('serial', text); }
    } else {
      const dev = this.devices[`serial${n}`];
      if (dev?.write) dev.write(text, bytes); else if (text) this.emit(`serial${n}`, text);
    }
    // timing: 10 bits per byte at the baud rate, 64-byte buffer
    const byteUs = 1e7 / p.baud;
    p.txBusy = Math.max(p.txBusy, this.us) + bytes.length * byteUs;
    const ahead = p.txBusy - this.us - 64 * byteUs;
    if (ahead > 0) yield* this.sleep(ahead);
    return bytes.length;
  }

  /** Pull any device-provided input into a port's RX buffer. */
  uartFill(n) {
    const p = this.port(n);
    if (n !== 0) {
      const dev = this.devices[`serial${n}`];
      const got = dev?.read?.();
      if (got) p.rx += toBytes(String(got));
    }
    return p;
  }

  // misc helpers for libraries
  cls(name) { return this.P.registry.classes[name]; }
  isStringValue(v) { return isString(v); }
}
