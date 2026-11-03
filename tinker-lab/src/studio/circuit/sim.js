// The live circuit: board pins (driven by the running sketch through the HAL)
// + the project's netlist + every part's electrical model, solved with MNA.
//
// Pin model: OUTPUT = Thevenin source (logic level, ~25 Ω on AVR, ~40 Ω on
// ESP32); INPUT_PULLUP = logic level through the internal pull-up; INPUT =
// high impedance; every connected GPIO has ESD clamp diodes to VCC and GND.
// PWM (analogWrite, tone) is solved exactly as a time average: one DC solve
// per interval in which the set of HIGH outputs is constant, weighted by the
// interval's share of the PWM period.
import { Circuit, solve, elementCurrent, diodeIV, VT } from './mna.js';
import { buildNetlist, WIRE_OHMS, boardKey } from './netlist.js';

const POWER_RS = { '5V': 0.05, '5V_2': 0.05, '5V_3': 0.05, IOREF: 0.5, '3V3': 0.6, VIN: 0.4 };
const POWER_MAX = { '5V': 0.5, '3V3': 0.15, VIN: 1.0 };

export class Sim {
  constructor() {
    this.pins = new Map();
    this.cache = new Map();
    this.version = 0;
    this.lastV = null;
    this.states = new Map();
  }

  /** (Re)build the topology. states: Map partId → mutable runtime state. */
  configure({ project, board, legKeys, defs, states }) {
    this.project = project;
    this.board = board;
    this.defs = defs;
    this.states = states;
    this.net = buildNetlist(project, board, legKeys, defs);
    this.parts = project.parts.filter((p) => defs[p.type] && this.net.partPins.has(p.id));
    this.invalidate();
  }

  invalidate() {
    this.cache.clear();
    this.version++;
  }

  // ---------------------------------------------------------------- pin state (from the HAL)
  pin(num) {
    let s = this.pins.get(num);
    if (!s) this.pins.set(num, (s = { mode: 'INPUT', value: 0, duty: null, tone: 0 }));
    return s;
  }
  resetPins() { this.pins.clear(); }
  signature() {
    let s = '';
    for (const [n, p] of this.pins) if (p.mode !== 'INPUT' || p.value) s += `${n}${p.mode[0]}${p.mode.length}${p.value}${p.duty ?? ''}${p.tone ? 't' : ''}|`;
    return s;
  }
  snapshot() { return new Map([...this.pins].map(([k, v]) => [k, { ...v }])); }

  /** Drive level 0–1 of an output pin (PWM duty, 50 % for tone()). */
  static level(p) {
    if (p.tone) return 0.5;
    if (p.duty != null) return p.duty;
    return p.value ? 1 : 0;
  }

  // ---------------------------------------------------------------- solving
  /** Solve for the current pin state (cached). */
  solve() { return this.solveFor(this.pins, this.signature()); }

  solveFor(pins, sig) {
    const key = `${this.version}#${sig}`;
    const hit = this.cache.get(key);
    if (hit) return hit;
    let res = null;
    for (let pass = 0; pass < 5; pass++) {
      res = this.#solveOnce(pins);
      let changed = false;
      for (const part of this.parts) {
        const def = this.defs[part.type];
        if (def.settle && def.settle(this.state(part.id), res.parts.get(part.id) ?? {})) changed = true;
      }
      if (!changed) break;
    }
    if (this.cache.size > 96) this.cache.delete(this.cache.keys().next().value);
    this.cache.set(key, res);
    return res;
  }

  state(id) {
    let s = this.states.get(id);
    if (!s) this.states.set(id, (s = {}));
    return s;
  }

  #nodeOfBoard(name) { return this.net.nodeOf(boardKey(name, this.board)); }

  #build(pins) {
    const b = this.board, net = this.net;
    const c = new Circuit(net.nodeCount);
    const vcc = c.node();
    c.V(vcc, 0, b.logic, 0.02);
    const power = [], gpio = [], clamps = [];
    for (const [name, volts] of Object.entries(b.power)) {
      const node = this.#nodeOfBoard(name);
      if (node == null || node === 0) continue;
      power.push({ name, node, el: c.V(node, 0, volts, POWER_RS[name] ?? 0.5) });
    }
    for (const [name, p] of Object.entries(b.pins)) {
      const node = this.#nodeOfBoard(name);
      if (node == null) continue;
      const st = pins.get(p.num) ?? { mode: 'INPUT', value: 0 };
      const entry = { name, num: p.num, node, mode: st.mode };
      if (st.mode === 'OUTPUT' && !p.inputOnly) {
        entry.el = c.V(node, 0, 0, b.outR);
        entry.level = Sim.level(st);
      } else if (st.mode === 'INPUT_PULLUP' || (st.mode === 'INPUT' && st.value && b.logic === 5)) entry.el = c.V(node, 0, b.logic, b.pullup);
      else if (st.mode === 'INPUT_PULLDOWN') entry.el = c.V(node, 0, 0, b.pullup);
      if (node !== 0) {
        clamps.push(c.D(node, vcc, 1e-12, 1.2), c.D(0, node, 1e-12, 1.2));
      }
      gpio.push(entry);
    }
    const wires = [];
    for (const w of net.wires) if (w.na !== w.nb) wires.push({ id: w.id, el: c.R(w.na, w.nb, WIRE_OHMS) });
    const handles = new Map();
    const lastV = this.lastV;
    for (const part of this.parts) {
      const def = this.defs[part.type];
      const map = net.partPins.get(part.id);
      const n = (pin) => net.nodeOf(map[pin]);
      const powered = (a, bb, min) => {
        if (!lastV) return false;
        const na = n(a), nb = n(bb);
        return na != null && nb != null && (lastV[na] ?? 0) - (lastV[nb] ?? 0) >= min;
      };
      handles.set(part.id, def.circuit({ c, n, props: part.props, state: this.state(part.id), board: b, powered }) ?? {});
    }
    return { c, power, gpio, wires, handles, vcc };
  }

  #solveOnce(pins) {
    const b = this.board;
    const built = this.#build(pins);
    const { c, gpio } = built;
    const outs = gpio.filter((g) => g.level != null);
    const cuts = [...new Set(outs.map((g) => g.level).filter((l) => l > 0 && l < 1))].sort((x, y) => x - y);
    const edges = [0, ...cuts, 1];
    const phases = [];
    let guess = this.lastV && this.lastV.length === c.n ? this.lastV : null;
    let ok = true;
    for (let i = 0; i < edges.length - 1; i++) {
      const w = edges[i + 1] - edges[i];
      if (w <= 0) continue;
      const t = (edges[i] + edges[i + 1]) / 2;
      for (const g of outs) g.el.e = g.level > t ? b.logic : 0;
      let r = solve(c, guess);
      if (!r.ok) r = solve(c, null, { maxIter: 400 });
      ok &&= r.ok;
      phases.push({ w, v: r.v });
      guess = r.v;
    }
    this.lastV = phases[phases.length - 1]?.v ?? null;
    // PWM-averaged accessors
    const avg = (f) => phases.reduce((s, ph) => s + ph.w * f(ph.v), 0);
    const sol = {
      V: (node) => (node == null ? 0 : avg((v) => v[node] ?? 0)),
      I: (el) => (el ? avg((v) => elementCurrent(el, v)) : 0),
      Vd: (el) => avg((v) => v[el.a] - v[el.kOuter ?? el.k]),
      P: (el) => avg((v) => { const i = elementCurrent(el, v); return el.kind === 'R' ? i * i * el.r : Math.abs(i * (v[el.a] - v[el.b])); }),
      Iq: (el) => {
        let ic = 0, ib = 0;
        for (const ph of phases) { const q = elementCurrent(el, ph.v); ic += ph.w * q.ic; ib += ph.w * q.ib; }
        return { ic, ib };
      },
      /** Peak (worst phase) current: for the instantaneous over-current checks. */
      Ipeak: (el) => Math.max(...phases.map((ph) => Math.abs(elementCurrent(el, ph.v)))),
    };
    const nodeV = new Float64Array(c.n);
    for (let k = 0; k < c.n; k++) nodeV[k] = sol.V(k);
    const parts = new Map();
    for (const part of this.parts) {
      const def = this.defs[part.type];
      const h = built.handles.get(part.id);
      parts.set(part.id, def.read ? def.read(h, sol, part.props, this.state(part.id)) : {});
    }
    const pinI = new Map(), pinPeak = new Map(), pinV = new Map();
    for (const g of gpio) {
      pinV.set(g.name, nodeV[g.node]);
      if (g.el) {
        pinI.set(g.name, -sol.I(g.el));
        pinPeak.set(g.name, sol.Ipeak(g.el));
      }
    }
    const powerI = new Map();
    for (const p of built.power) {
      if (p.node == null) continue;
      powerI.set(p.name, -sol.I(p.el));
      pinV.set(p.name, nodeV[p.node]);
    }
    const wireI = new Map();
    for (const w of built.wires) wireI.set(w.id, sol.I(w.el));
    const res = { ok, nodeV, parts, pinI, pinPeak, pinV, powerI, wireI, handles: built.handles, sol, phases: phases.length, circuit: c };
    res.warnings = this.#warnings(res);
    return res;
  }

  /** Thevenin resistance seen at a board pin's node (to spot floating inputs). */
  impedanceAt(name) {
    const node = this.#nodeOfBoard(name);
    if (node == null) return Infinity;
    if (node === 0) return 0;
    const key = `${this.version}#${this.signature()}#Z${name}`;
    if (this.cache.has(key)) return this.cache.get(key);
    const built = this.#build(this.pins);
    for (const g of built.gpio) if (g.level != null) g.el.e = g.level >= 0.5 ? this.board.logic : 0;
    const base = solve(built.c, this.lastV);
    built.c.I(0, node, 1e-6);
    const pert = solve(built.c, base.v);
    const z = Math.abs(pert.v[node] - base.v[node]) / 1e-6;
    this.cache.set(key, z);
    return z;
  }

  /** Voltage on a board pin (time-averaged), or null when nothing is connected to it. */
  pinVoltage(name) {
    const node = this.#nodeOfBoard(name);
    if (node == null) return null;
    return this.solve().nodeV[node];
  }

  /** Voltage at any point key (hole / pin) for the hover read-out. */
  voltageAt(key) {
    const node = this.net?.nodeOf(key);
    if (node == null) return null;
    return this.solve().nodeV[node];
  }

  // ---------------------------------------------------------------- checks
  #warnings(res) {
    const b = this.board, out = [];
    const mA = (i) => `${(Math.abs(i) * 1000).toFixed(Math.abs(i) < 0.1 ? 1 : 0)} mA`;
    for (const [name, i] of res.pinI) {
      const peak = res.pinPeak.get(name) ?? Math.abs(i);
      if (peak > 0.12) {
        out.push({ id: `short:${name}`, level: 'danger', pin: name, title: `Short circuit on ${name}`,
          text: `${name} is trying to push ${mA(peak)} — it is wired almost straight to ${i > 0 ? 'GND' : 'a supply'}. A real pin would be damaged within seconds.`,
          fix: 'Check for a wire from the pin straight to GND or 5V, and put a resistor (or the part you meant to drive) in between.' });
      } else if (peak > b.maxPinMA / 1000) {
        out.push({ id: `pin:${name}`, level: 'danger', pin: name, title: `${name} is overloaded`,
          text: `It is supplying ${mA(peak)}; the absolute maximum for a pin is ${b.maxPinMA} mA (keep it under ${b.recPinMA} mA).`,
          fix: 'Add a series resistor, or let the pin switch a transistor that carries the big current.' });
      }
    }
    for (const [name, i] of res.powerI) {
      const max = POWER_MAX[name.replace(/_\d$/, '')] ?? 0.5;
      if (i > 2) out.push({ id: `rail:${name}`, level: 'danger', title: `${name} is shorted to GND`, text: `${mA(i)} would flow straight from ${name} to GND. On a real board the USB fuse trips and the board resets.`, fix: `Find the wire or part that joins ${name} directly to GND and remove it.` });
      else if (i > max) out.push({ id: `rail:${name}`, level: 'warn', title: `${name} is overloaded`, text: `The circuit draws ${mA(i)} from ${name}; it can supply about ${max * 1000} mA.`, fix: 'Power big loads (motors, long LED strips) from a separate supply and join the grounds.' });
    }
    for (const [name, v] of res.pinV) {
      if (b.pins[name] && v > b.logic + 0.6) {
        out.push({ id: `over:${name}`, level: 'danger', pin: name, title: `${v.toFixed(1)} V on ${name}`, text: `This board's pins are ${b.logic} V logic. Higher voltages force current through the protection diodes and damage the chip.`, fix: b.logic < 5 ? 'Use a level shifter or a voltage divider (e.g. 1 kΩ + 2 kΩ) for 5 V signals.' : 'Keep inputs between 0 V and 5 V.' });
      }
    }
    for (const part of this.parts) {
      const def = this.defs[part.type];
      const r = res.parts.get(part.id) ?? {};
      if (def.type === 'resistor' && r.p > 0.25) out.push({ id: `hot:${part.id}`, level: 'warn', part: part.id, title: 'Resistor overheating', text: `It is dissipating ${r.p.toFixed(2)} W; a standard resistor is rated ¼ W.`, fix: 'Use a larger resistance (or a power resistor).' });
      if (def.type === 'npn' && r.i > 0.6) out.push({ id: `q:${part.id}`, level: 'warn', part: part.id, title: 'Transistor overloaded', text: `Collector current is ${mA(r.i)}; this transistor is rated 600 mA.`, fix: 'Use a MOSFET or a motor driver for big loads.' });
    }
    return out;
  }
}

export { diodeIV, VT };
