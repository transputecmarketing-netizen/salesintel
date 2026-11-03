// "Run my code" for lessons: the code card becomes an editor, and the learner's own
// sketch runs on the Tinker Lab Arduino runtime against the lesson's circuit (lesson.hw).
// Guided (scripted) runs stay available; Python lessons are always guided.
import { compile } from '../index.js';
import { boardInfo } from '../types.js';
import { createEditor } from './editor.js';
import { lucide } from '../../brand/lucide.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const LS = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage full or blocked */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* blocked */ } },
};
const draftKey = (id) => `tinkerlab:code:${id}`;
const NODEMCU = { 16: 'D0', 5: 'D1', 4: 'D2', 0: 'D3', 2: 'D4', 14: 'D5', 12: 'D6', 13: 'D7', 15: 'D8', 3: 'D9', 1: 'D10', 17: 'A0' };

/** Signal keys a pin number may carry on a lesson's wires. */
function pinKeys(pin, board) {
  const info = boardInfo(board);
  if (board === 'esp32') return [`GPIO${pin}`, pin === 36 ? 'VP' : pin === 39 ? 'VN' : `D${pin}`];
  if (board === 'nodemcu') return [NODEMCU[pin], `GPIO${pin}`].filter(Boolean);
  if (info.analogBase != null && pin >= info.analogBase) return [`A${pin - info.analogBase}`, `D${pin}`];
  return [`D${pin}`];
}
const builtinPin = (board) => (board === 'esp32' || board === 'nodemcu' ? 2 : 13);

export class CodeLab {
  /**
   * hooks: { card, app, getLesson, getBuilt, getBoard, getWires, print(text, cls), clearConsole(),
   *          setSignal(key, text, live), showRunState(running, info), setStatus(text), audio, toast, onRan() }
   */
  constructor(hooks) {
    this.h = hooks;
    this.mode = 'guided';
    this.modes = new Map();
    this.bps = new Map();
    this.vm = null;
    this.lesson = null;
    this.problems = [];
    this.runtimeProblems = [];
    this.tab = 'problems';
    this.openPaths = new Set();
    this.tall = LS.get('tinkerlab:codeTall') === '1';
    this.buildDom();
  }

  // ------------------------------------------------------------------ DOM
  buildDom() {
    const card = this.h.card;
    const ic = (n, s = 17) => lucide(n, { size: s, stroke: 1.8 });
    const bar = document.createElement('div');
    bar.className = 'lab-bar';
    bar.innerHTML = `
      <div class="lab-mode" role="radiogroup" aria-label="How the code runs">
        <button type="button" role="radio" data-mode="guided" aria-checked="true" title="A guided simulation that follows the lesson's sketch step by step">Guided</button>
        <button type="button" role="radio" data-mode="code" aria-checked="false" title="Edit the sketch and run your own code on the virtual board">${ic('square-pen', 15)}<span>My code</span></button>
      </div>
      <span class="lab-note" aria-live="polite"></span>
      <div class="lab-tools" role="toolbar" aria-label="Run and debug">
        <button type="button" class="lab-btn" data-act="pause" title="Pause (F8)" aria-label="Pause">${ic('pause')}</button>
        <button type="button" class="lab-btn" data-act="step" title="Step into (F11)" aria-label="Step into">${ic('arrow-down-to-line')}</button>
        <button type="button" class="lab-btn" data-act="over" title="Step over (F10)" aria-label="Step over">${ic('redo-dot')}</button>
        <button type="button" class="lab-btn" data-act="out" title="Step out (Shift+F11)" aria-label="Step out">${ic('arrow-up-from-line')}</button>
        <span class="lab-sep" aria-hidden="true"></span>
        <button type="button" class="lab-btn" data-act="reset" title="Reset to the lesson's original code" aria-label="Reset to original code">${ic('rotate-ccw')}</button>
      </div>`;
    card.querySelector('header').after(bar);
    this.bar = bar;
    const wrap = card.querySelector('.code-wrap');
    const host = document.createElement('div');
    host.className = 'lab-editor';
    wrap.insertBefore(host, wrap.querySelector('.console'));
    this.host = host;
    const drawer = document.createElement('div');
    drawer.className = 'lab-drawer';
    drawer.innerHTML = `
      <div class="lab-tabs" role="tablist">
        <button type="button" role="tab" data-tab="problems">Problems <b class="lab-count"></b></button>
        <button type="button" role="tab" data-tab="vars">Variables</button>
        <button type="button" role="tab" data-tab="stack">Stack</button>
        <span class="lab-state"></span>
        <button type="button" class="lab-collapse" aria-label="Hide panel" title="Hide panel">${ic('chevrons-down', 15)}</button>
      </div>
      <div class="lab-panel" role="tabpanel"></div>`;
    wrap.insertBefore(drawer, wrap.querySelector('.console'));
    this.drawer = drawer;
    this.panel = drawer.querySelector('.lab-panel');

    bar.addEventListener('click', (e) => {
      const m = e.target.closest('[data-mode]');
      if (m) { this.setMode(m.dataset.mode, { user: true }); return; }
      const b = e.target.closest('[data-act]');
      if (b && !b.disabled) this.act(b.dataset.act);
    });
    drawer.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tab]');
      if (t) { this.openTab(t.dataset.tab === this.tab && this.drawerOpen ? null : t.dataset.tab); return; }
      if (e.target.closest('.lab-collapse')) { this.openTab(null); return; }
      const go = e.target.closest('[data-line]');
      if (go) this.editor?.goto(Number(go.dataset.line));
    });
    this.panel.addEventListener('toggle', (e) => {
      const d = e.target.closest('details[data-path]');
      if (!d) return;
      if (d.open) this.openPaths.add(d.dataset.path); else this.openPaths.delete(d.dataset.path);
    }, true);
    card.addEventListener('keydown', (e) => {
      if (this.mode !== 'code') return;
      const k = e.key;
      const map = { F5: e.shiftKey ? 'stop' : this.vm?.state === 'paused' ? 'pause' : 'run', F8: 'pause', F10: 'over', F11: e.shiftKey ? 'out' : 'step' };
      if (k === 'F9' && this.editor) {
        e.preventDefault();
        const v = this.editor.view;
        const line = v.state.doc.lineAt(v.state.selection.main.head).number;
        const cur = this.editor.breakpoints();
        this.editor.setBreakpoints(cur.includes(line) ? cur.filter((x) => x !== line) : [...cur, line]);
        return;
      }
      if (map[k]) { e.preventDefault(); this.act(map[k]); }
    });
  }

  ensureEditor() {
    if (this.editor) return;
    this.editor = createEditor(this.host, {
      doc: '',
      onChange: (text) => this.changed(text),
      onBreakpoints: (lines) => {
        if (this.lesson) this.bps.set(this.lesson.id, lines);
        this.vm?.setBreakpoints(lines);
      },
    });
  }

  // ------------------------------------------------------------------ lessons & modes
  get active() { return this.mode === 'code'; }
  get running() { return !!this.vm && (this.vm.state === 'running' || this.vm.state === 'paused'); }

  original() {
    const L = this.lesson;
    const p = this.params ?? {};
    return L.code.replace(/\{\{(\w+)\}\}/g, (_, k) => String(p[k] ?? L.params?.[k]?.value ?? ''));
  }
  text() { return this.editor ? this.editor.text : this.original(); }

  load(lesson, params) {
    this.stop();
    this.lesson = lesson;
    this.params = params;
    this.problems = [];
    this.runtimeProblems = [];
    const cpp = lesson.lang !== 'python' && !!lesson.code && !lesson.explainer;
    this.bar.hidden = !lesson.code || !!lesson.explainer;
    this.bar.classList.toggle('is-python', !cpp);
    const mode = cpp ? (this.modes.get(lesson.id) ?? (lesson.hw ? 'code' : 'guided')) : 'guided';
    this.loaded = false;
    this.setMode(mode);
    this.loaded = true;
  }

  setMode(mode, { user = false } = {}) {
    const L = this.lesson;
    if (!L) return;
    const cpp = L.lang !== 'python' && !!L.code;
    if (!cpp) mode = 'guided';
    if (user && mode !== this.mode) {
      this.h.stopGuided?.();
      this.stop();
    }
    this.mode = mode;
    if (user && cpp) this.modes.set(L.id, mode);
    const card = this.h.card;
    card.classList.toggle('is-lab', mode === 'code');
    this.h.app.classList.toggle('is-lab-mode', mode === 'code');
    this.h.app.classList.toggle('is-lab-tall', mode === 'code' && this.tall);
    this.bar.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === mode)));
    const note = this.bar.querySelector('.lab-note');
    if (!cpp) note.textContent = 'Python runs as a guided simulation';
    else if (mode === 'guided') note.textContent = L.hw ? '' : '';
    else note.textContent = '';
    note.title = !cpp ? 'Python and MicroPython programs are shown step by step; the browser does not execute them.' : '';
    const exp = document.getElementById('code-expand');
    if (exp) {
      exp.setAttribute('aria-expanded', String(mode === 'code' && this.tall));
      exp.title = mode === 'code' ? (this.tall ? 'Shrink the editor' : 'Make room for the editor') : 'Expand code';
    }
    if (mode === 'code') {
      this.ensureEditor();
      const draft = LS.get(draftKey(L.id));
      const text = draft ?? this.original();
      this.suppress = true;
      if (this.editor.text !== text) this.editor.replaceAll(text);
      this.suppress = false;
      this.editor.setBreakpoints(this.bps.get(L.id) ?? []);
      this.editor.setExecLine(0);
      this.check(text);
      this.h.card.classList.add('has-console', 'has-input');
      this.h.setStatus?.('Stopped');
      this.updateTools();
      this.renderDrawer();
    } else {
      this.h.card.classList.toggle('has-input', !!L.serialInput);
      if (user) this.h.card.classList.remove('has-console');
    }
    this.updateNote();
  }

  updateNote() {
    const L = this.lesson;
    if (!L || this.mode !== 'code') return;
    const note = this.bar.querySelector('.lab-note');
    const dirty = LS.get(draftKey(L.id)) != null;
    const bits = [];
    if (dirty) bits.push('Edited');
    if (!L.hw) bits.push('Pins and Serial only');
    note.textContent = bits.join(' · ');
    note.title = !L.hw ? 'This circuit is not wired to the runtime yet: your code runs, the serial monitor and pin chips work, but the 3D parts only respond in Guided mode.' : dirty ? 'Your edits are saved in this browser. Reset brings back the lesson\'s code.' : '';
  }

  toggleTall() {
    this.tall = !this.tall;
    LS.set('tinkerlab:codeTall', this.tall ? '1' : '0');
    this.setMode(this.mode);
  }

  changed(text) {
    if (this.suppress || !this.lesson) return;
    clearTimeout(this.saveT);
    this.saveT = setTimeout(() => {
      if (text === this.original()) LS.del(draftKey(this.lesson.id)); else LS.set(draftKey(this.lesson.id), text);
      this.updateNote();
    }, 300);
    clearTimeout(this.checkT);
    this.checkT = setTimeout(() => this.check(text), 450);
  }

  /** Compile for diagnostics only (live checking while typing). */
  check(text) {
    if (!this.lesson) return null;
    let r;
    try { r = compile(text, { board: this.lesson.board }); } catch (e) {
      console.error(e);
      r = { ok: false, diagnostics: [{ severity: 'error', line: 1, col: 1, message: `internal compiler error: ${e.message}` }] };
    }
    this.problems = r.diagnostics;
    if (!this.running) this.runtimeProblems = [];
    this.editor?.setProblems([...this.problems, ...this.runtimeProblems]);
    this.renderDrawer();
    return r;
  }

  // ------------------------------------------------------------------ run / debug
  act(a) {
    if (a === 'reset') return this.resetCode();
    if (a === 'run') return this.vm?.state === 'paused' ? this.vm.resume() : this.running ? null : this.run();
    if (a === 'stop') return this.stop();
    if (!this.vm) { if (a !== 'pause') this.run({ pauseFirst: true }); return; }
    if (a === 'pause') { if (this.vm.state === 'paused') this.vm.resume(); else this.vm.pause(); return; }
    if (this.vm.state !== 'paused') return;
    if (a === 'step') this.vm.step();
    if (a === 'over') this.vm.stepOver();
    if (a === 'out') this.vm.stepOut();
  }

  toggle() { if (this.running) this.stop(); else this.run(); }

  resetCode() {
    if (!this.lesson || !this.editor) return;
    const orig = this.original();
    if (this.editor.text === orig) { this.h.toast?.('This is already the lesson\'s original code'); return; }
    this.stop();
    this.editor.replaceAll(orig);
    LS.del(draftKey(this.lesson.id));
    this.updateNote();
    this.check(orig);
    this.h.toast?.('Code reset to the original · Ctrl+Z to undo');
  }

  run({ pauseFirst = false } = {}) {
    const L = this.lesson;
    if (!L || this.mode !== 'code') return;
    this.h.stopGuided?.();
    this.stop();
    const text = this.text();
    this.h.clearConsole();
    this.h.card.classList.add('has-console');
    const info = boardInfo(L.board);
    this.h.print('Compiling sketch…', 'sys');
    const r = this.check(text);
    if (!r?.ok) {
      const errs = r?.diagnostics.filter((d) => d.severity === 'error') ?? [];
      for (const d of errs.slice(0, 6)) this.h.print(`Error (line ${d.line}): ${d.message}`, 'err');
      this.h.print(`Compilation failed with ${errs.length} error${errs.length === 1 ? '' : 's'}. Fix it and press Run again.`, 'sys');
      this.openTab('problems');
      if (errs[0]) this.editor.goto(errs[0].line);
      return;
    }
    const warns = r.diagnostics.filter((d) => d.severity === 'warning').length;
    this.h.print(`Done${warns ? ` (${warns} warning${warns === 1 ? '' : 's'})` : ''}. Running on a simulated ${info.name}.`, 'sys');
    this.runtimeProblems = [];
    const vm = r.program.instantiate(this.makeHal(L), { speed: 1 });
    this.vm = vm;
    this.serialBuf = '';
    this.partialEl = null;
    vm.setBreakpoints(this.editor.breakpoints());
    vm.on('serial', (t) => this.serial(t));
    vm.on('pin', (e) => this.pinEvent(e));
    vm.on('baud', (e) => { if (e.port === 0) this.h.setStatus?.(`Running · ${e.baud} baud`); });
    vm.on('line', (line) => { if (vm.state === 'running') this.editor.setExecLine(line); });
    vm.on('pause', (p) => this.paused(p));
    vm.on('state', (s) => this.stateChanged(s));
    vm.on('warning', (w) => { this.flushSerial(); this.h.print(`Warning (line ${w.line}): ${w.message}`, 'sys'); });
    vm.on('error', (e) => this.runtimeError(e));
    vm.on('reset', (e) => { this.flushSerial(); this.h.print(e.reason === 'deepsleep' ? '— woke from deep sleep: the board restarts at setup() —' : '— the board restarted —', 'sys'); });
    vm.on('sleep', (e) => { this.flushSerial(); this.h.print(e.mode === 'deep' ? '— deep sleep —' : '— sleeping until an interrupt —', 'sys'); });
    vm.on('frame', () => this.frame());
    this.h.showRunState(true, { lang: 'cpp' });
    this.h.setStatus?.('Running');
    this.startedAt = performance.now();
    vm.start();
    if (pauseFirst) vm.pause();
    this.updateTools();
    this.renderDrawer();
  }

  stop() {
    if (!this.vm) return;
    const vm = this.vm;
    this.vm = null;
    vm.stop();
    this.flushSerial();
    this.h.audio?.noTone();
    const L = this.lesson;
    try { L?.reset?.(this.h.getBuilt(), this.lessonIo()); } catch (e) { console.warn(e); }
    this.h.getBoard()?.setBuiltinLed?.(0);
    this.h.showRunState(false);
    this.editor?.setExecLine(0);
    this.updateTools();
    this.renderDrawer();
  }

  stateChanged(s) {
    if (!this.vm) return;
    if (s === 'running') this.editor.setExecLine(this.vm.line);
    if (s === 'stopped') this.h.print('— the sketch ended —', 'sys');
    this.updateTools();
    this.renderDrawer();
  }

  paused(p) {
    this.flushSerial();
    this.editor.setExecLine(p.line, { paused: true, scroll: true });
    this.h.setStatus?.(`Paused · line ${p.line}`);
    this.h.audio?.noTone();
    if (!this.drawerOpen || this.tab === 'problems') this.openTab('vars');
    this.updateTools();
    this.renderDrawer();
  }

  runtimeError(e) {
    this.flushSerial();
    this.h.print(`${e.fatal ? 'Runtime error' : 'Warning'} (line ${e.line}): ${e.message}`, 'err');
    if (e.hint) this.h.print(e.hint, 'sys');
    this.runtimeProblems.push({ severity: e.fatal ? 'error' : 'warning', line: e.line, col: 1, message: e.message, hint: e.hint, runtime: true });
    this.editor?.setProblems([...this.problems, ...this.runtimeProblems]);
    if (e.fatal) {
      this.editor.setExecLine(e.line, { error: true, scroll: true });
      this.h.setStatus?.('Stopped · error');
      this.h.audio?.noTone();
      this.h.showRunState(false, { keepLine: true });
      this.openTab('problems');
    }
    this.renderDrawer();
  }

  frame() {
    const now = performance.now();
    if (now - (this.lastPoll ?? 0) > 120) {
      this.lastPoll = now;
      this.pollInputs();
      const stateEl = this.drawer.querySelector('.lab-state');
      if (this.vm?.state === 'running') stateEl.textContent = `Running · ${(this.vm.millis() / 1000).toFixed(1)} s`;
      if (this.drawerOpen && this.tab !== 'problems' && this.vm?.state === 'running') this.renderDrawer();
      if (performance.now() - this.startedAt > 3000) this.h.onRan?.();
    }
  }

  sendSerial(text) {
    if (!this.vm) return false;
    this.vm.serialInput(text.endsWith('\n') ? text : `${text}\n`);
    return true;
  }

  // ------------------------------------------------------------------ serial monitor
  serial(text) {
    this.serialBuf += text;
    const parts = this.serialBuf.split('\n');
    this.serialBuf = parts.pop();
    if (parts.length) {
      this.partialEl?.remove();
      this.partialEl = null;
      for (const line of parts.slice(-300)) this.h.print(line.replace(/\r$/, ''));
    }
    if (this.serialBuf) {
      if (!this.partialEl || !this.partialEl.isConnected) { this.h.print(''); this.partialEl = this.h.lastLine?.(); }
      if (this.partialEl) this.partialEl.textContent = this.serialBuf.replace(/\r$/, '');
    }
  }
  flushSerial() {
    if (this.serialBuf) { if (!this.partialEl?.isConnected) this.h.print(this.serialBuf); this.serialBuf = ''; }
    this.partialEl = null;
  }

  // ------------------------------------------------------------------ the HAL for this lesson
  lessonIo() {
    const h = this.h;
    return {
      board: h.getBoard(),
      pin: (key, text, live) => h.setSignal(key, text, live),
      print: (t) => h.print(t),
      tone: (f) => h.audio?.tone(f),
      noTone: () => h.audio?.noTone(),
      line: () => {},
      delay: () => Promise.resolve(),
      readLine: () => null,
      available: () => 0,
    };
  }

  makeHal(L) {
    const io = this.lessonIo();
    let lh = {};
    if (L.hw) {
      try { lh = L.hw(this.h.getBuilt(), io) ?? {}; } catch (e) { console.error(`hw() of ${L.id} failed`, e); lh = {}; }
    }
    this.signalKeys = new Set((this.h.getWires() ?? []).map((w) => w.signal).filter(Boolean));
    this.inputs = new Map();
    this.store ??= new Map();
    const st = this.store.get(L.id) ?? { eeprom: new Uint8Array(boardInfo(L.board).eeprom).fill(0xff), sd: new Map() };
    this.store.set(L.id, st);
    const self = this;
    const devices = { eeprom: st.eeprom, sd: { files: st.sd }, ...(lh.devices ?? {}) };
    return {
      pinMode: (p, m) => lh.pinMode?.(p, m),
      digitalWrite: (p, v) => lh.digitalWrite?.(p, v),
      digitalRead: (p) => { const v = lh.digitalRead?.(p); self.inputs.set(p, { kind: 'd', v }); return v; },
      analogWrite: (p, v) => lh.analogWrite?.(p, v),
      analogRead: (ch, pin) => { const v = lh.analogRead?.(ch, pin) ?? 0; self.inputs.set(pin, { kind: 'a', v }); return v; },
      tone: (p, f, d) => { lh.tone?.(p, f, d); self.h.audio?.tone(f); },
      noTone: (p) => { lh.noTone?.(p); self.h.audio?.noTone(); },
      pulseIn: (p, level, t) => lh.pulseIn?.(p, level, t) ?? 0,
      touchRead: lh.touchRead,
      serialWrite: lh.serialWrite,
      devices,
    };
  }

  chip(pin, text, live) {
    if (!this.lesson) return;
    for (const k of pinKeys(pin, this.lesson.board)) if (this.signalKeys?.has(k)) this.h.setSignal(k, text, live);
  }

  pinEvent(e) {
    const L = this.lesson;
    if (!L) return;
    const bl = builtinPin(L.board);
    switch (e.kind) {
      case 'digital':
        this.chip(e.pin, e.value ? 'HIGH' : 'LOW', !!e.value);
        if (e.pin === bl) this.h.getBoard()?.setBuiltinLed?.(L.board === 'nodemcu' ? (e.value ? 0 : 1) : e.value);
        break;
      case 'pwm':
        this.chip(e.pin, `PWM ${e.value}`, e.value > 0);
        if (e.pin === bl) this.h.getBoard()?.setBuiltinLed?.(L.board === 'nodemcu' ? 1 - e.value / 255 : e.value / 255);
        break;
      case 'tone': this.chip(e.pin, e.value ? `${e.value} Hz` : 'LOW', !!e.value); break;
      case 'servo': this.chip(e.pin, `${e.value}°`, true); break;
      case 'neopixel': case 'display': this.chip(e.pin, 'DATA', true); break;
      default: break;
    }
  }

  pollInputs() {
    if (!this.inputs) return;
    for (const [pin, r] of this.inputs) {
      const key = `${pin}:${r.kind}:${r.v}`;
      if (r.last === key) continue;
      r.last = key;
      if (r.kind === 'a') this.chip(pin, String(Math.round(r.v ?? 0)), (r.v ?? 0) > 0);
      else if (this.vm) { const v = this.vm.readRaw(pin); this.chip(pin, v ? 'HIGH' : 'LOW', !!v); }
    }
  }

  // ------------------------------------------------------------------ toolbar & drawer
  updateTools() {
    const s = this.vm?.state;
    const q = (a) => this.bar.querySelector(`[data-act="${a}"]`);
    const paused = s === 'paused', running = s === 'running';
    const runBtn = document.getElementById('code-run');
    if (runBtn && this.mode === 'code') runBtn.title = this.vm ? 'Stop (Shift+F5)' : 'Compile and run my code (F5)';
    q('pause').disabled = !running && !paused;
    q('pause').innerHTML = lucide(paused ? 'play' : 'pause', { size: 17, stroke: 1.8 });
    q('pause').title = paused ? 'Continue (F8)' : 'Pause (F8)';
    q('pause').setAttribute('aria-label', paused ? 'Continue' : 'Pause');
    for (const a of ['step', 'over', 'out']) q(a).disabled = !paused && !!this.vm;
    this.bar.classList.toggle('is-running', running);
    this.bar.classList.toggle('is-paused', paused);
    const stateEl = this.drawer.querySelector('.lab-state');
    stateEl.textContent = paused ? `Paused at line ${this.vm.line}` : running ? `Running · ${(this.vm.millis() / 1000).toFixed(1)} s` : s === 'error' ? 'Stopped with an error' : '';
  }

  openTab(tab) {
    this.drawerOpen = !!tab;
    if (tab) this.tab = tab;
    this.drawer.classList.toggle('is-open', this.drawerOpen);
    this.renderDrawer();
  }

  renderDrawer() {
    if (this.mode !== 'code') return;
    const all = [...this.problems, ...this.runtimeProblems];
    const nErr = all.filter((d) => d.severity === 'error').length;
    const nWarn = all.length - nErr;
    const count = this.drawer.querySelector('.lab-count');
    count.textContent = all.length ? String(all.length) : '';
    count.className = `lab-count${nErr ? ' is-error' : nWarn ? ' is-warning' : ''}`;
    this.drawer.querySelectorAll('[data-tab]').forEach((b) => {
      const on = this.drawerOpen && b.dataset.tab === this.tab;
      b.setAttribute('aria-selected', String(on));
      b.classList.toggle('is-active', on);
    });
    this.updateTools();
    if (!this.drawerOpen) { this.panel.innerHTML = ''; return; }
    const icon = (sev) => lucide(sev === 'error' ? 'circle-alert' : 'triangle-alert', { size: 15, stroke: 2 });
    if (this.tab === 'problems') {
      this.panel.innerHTML = all.length
        ? `<ul class="lab-problems">${all.map((d) => `<li class="is-${d.severity}"><button type="button" data-line="${d.line}">${icon(d.severity)}<span><b>Line ${d.line}${d.runtime ? ' · while running' : ''}</b> ${esc(d.message)}${d.hint ? `<small>${esc(d.hint).replace(/\n/g, '<br>')}</small>` : ''}</span></button></li>`).join('')}</ul>`
        : '<p class="lab-empty">No problems. The sketch compiles.</p>';
      return;
    }
    const vm = this.vm;
    if (!vm || !vm.stack.length) {
      this.panel.innerHTML = `<p class="lab-empty">${this.tab === 'vars' ? 'Variables appear here while the sketch runs. Click a line number to set a breakpoint, then press Run.' : 'The call stack appears here while the sketch runs.'}</p>`;
      return;
    }
    if (this.tab === 'stack') {
      const st = vm.callStack().slice().reverse();
      this.panel.innerHTML = `<ol class="lab-stack">${st.map((f, i) => `<li class="${i === 0 ? 'is-top' : ''}"><button type="button" data-line="${f.line}"><b>${esc(f.fn)}()</b><span>line ${f.line}</span></button></li>`).join('')}</ol>`;
      return;
    }
    const scopes = vm.scopes();
    const row = (v, path) => {
      const head = `<span class="n">${esc(v.name)}</span><span class="t">${esc(v.type)}</span><span class="v">${esc(v.value)}</span>`;
      if (v.children?.length) {
        const p = `${path}/${v.name}`;
        return `<details data-path="${esc(p)}"${this.openPaths.has(p) ? ' open' : ''}><summary class="var">${head}</summary><div class="kids">${v.children.map((c) => row(c, p)).join('')}</div></details>`;
      }
      return `<div class="var">${head}</div>`;
    };
    this.panel.innerHTML = scopes.map((s) => `<div class="lab-scope"><h5>${s.name === 'Locals' ? `Locals · ${esc(s.fn)}()` : 'Globals'}</h5>${s.vars.length ? s.vars.map((v) => row(v, s.name)).join('') : '<p class="lab-empty">none</p>'}</div>`).join('');
  }
}
