// Fetch, decode, execute: a tiny 8-instruction CPU (3-bit opcode + 5-bit address) you can step through.
import { scene, lerp } from '../../engine.js';
import { panel } from '../../kit.js';

const OPS = ['LDA', 'ADD', 'SUB', 'STA', 'LDI', 'JMP', 'JZ', 'OUT'];
const SAY = {
  LDA: (n) => `load A with the number in box ${n}`, ADD: (n) => `add box ${n} to A`, SUB: (n) => `subtract box ${n} from A`,
  STA: (n) => `store A into box ${n}`, LDI: (n) => `load A with ${n}`, JMP: (n) => `jump to box ${n}`,
  JZ: (n) => `if A is 0, jump to box ${n}`, OUT: () => 'show A on the display',
};
const ins = (op, n = 0) => (OPS.indexOf(op) << 5) | n;
const PROGRAMS = {
  count: { name: 'Count down', mem: [ins('LDA', 7), ins('OUT'), ins('JZ', 6), ins('SUB', 8), ins('STA', 7), ins('JMP', 0), ins('JMP', 6), 3, 1, 0], code: 7 },
  add: { name: 'Add 12 + 30', mem: [ins('LDA', 5), ins('ADD', 6), ins('STA', 7), ins('OUT'), ins('JMP', 4), 12, 30, 0, 0, 0], code: 5 },
};
const bin = (v) => v.toString(2).padStart(8, '0');

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A tiny CPU with a program counter, instruction register, control unit, ALU and memory',
  steps: [
    'Program and data share memory: numbered boxes of 8 bits each.',
    'Fetch: the program counter says which box to read next.',
    'Decode: the control unit works out what the instruction means.',
    'Execute: the ALU calculates and the A register keeps the result.',
    'The program counter moves on, and the cycle repeats.',
    'Your turn: step through the program one phase at a time.',
  ],
  build(S) {
    const { d, C } = S;
    const cpu = { prog: 'count', mem: [], pc: 0, ir: 0, a: 0, out: null, phase: 'fetch', halted: false, codeLen: 7 };
    const reset = () => { const P = PROGRAMS[cpu.prog]; cpu.mem = P.mem.slice(); cpu.codeLen = P.code; cpu.pc = 0; cpu.ir = 0; cpu.a = 0; cpu.out = null; cpu.phase = 'fetch'; cpu.halted = false; };
    reset();
    const fx = { pc: 0, ir: 0, cu: 0, a: 0, alu: 0, out: 0, row: -1, rowT: 0 };
    const focus = { mem: 1, pc: 1, ir: 1, cu: 1, alu: 1 };

    // ---------- memory (right)
    const memG = d.g();
    const MX = 540, RY = (k) => 80 + k * 38;
    const rows = [];
    d.into(memG, () => {
      panel(S, MX, 42, 250, 400, { parent: memG, fill: '#fff' });
      d.text(MX + 125, 60, 'memory', { size: 15, fill: C.muted, mono: true });
      for (let k = 0; k < 10; k++) {
        const hi = d.el('rect', { x: MX + 8, y: RY(k) - 16, width: 234, height: 32, rx: 16, fill: C.yellow, opacity: 0 }, memG);
        d.text(MX + 26, RY(k), String(k), { size: 16, fill: C.ink, mono: true, weight: 500 });
        const b = d.text(MX + 52, RY(k), '', { size: 15, fill: C.ink, mono: true, anchor: 'start' });
        const m = d.text(MX + 236, RY(k), '', { size: 13, fill: C.muted, mono: true, anchor: 'end' });
        rows.push({ hi, b, m });
      }
    });
    // ---------- CPU parts (left)
    panel(S, 14, 42, 500, 400);
    d.text(264, 60, 'processor', { size: 15, fill: C.muted, mono: true });
    const box = (x, y, w, h, t) => { const g = d.g(); const f = d.el('rect', { x, y, width: w, height: h, rx: 10, fill: C.yellow, opacity: 0 }, g); d.into(g, () => { d.rect(x, y, w, h, { fill: 'none', stroke: C.ink, strokeWidth: 2.2 }); d.text(x + w / 2, y - 12, t, { size: 13, fill: C.muted, mono: true }); }); return { g, f }; };
    const PC = box(40, 92, 120, 64, 'program counter');
    const pcT = d.text(100, 125, '', { size: 30, fill: C.ink, mono: true, weight: 500, parent: PC.g });
    const IR = box(200, 92, 290, 64, 'instruction register');
    const irOp = d.text(290, 125, '', { size: 26, fill: C.accentInk, mono: true, weight: 500, anchor: 'end', parent: IR.g });
    const irN = d.text(300, 125, '', { size: 26, fill: C.irisInk, mono: true, weight: 500, anchor: 'start', parent: IR.g });
    const CU = box(40, 196, 450, 84, 'control unit (decoder)');
    const chips = OPS.map((op, k) => {
      const x = 52 + k * 55;
      const r = d.el('rect', { x, y: 210, width: 50, height: 30, rx: 15, fill: '#fff', stroke: C.line2, 'stroke-width': 1.5 }, CU.g);
      const t = d.text(x + 25, 225, op, { size: 13, fill: C.ink2, mono: true, weight: 500, parent: CU.g });
      return { r, t };
    });
    const sayT = d.text(265, 262, '', { size: 15, fill: C.ink, parent: CU.g });
    const A = box(40, 322, 120, 64, 'A register');
    const aT = d.text(100, 355, '', { size: 30, fill: C.ink, mono: true, weight: 500, parent: A.g });
    const zT = d.text(100, 402, '', { size: 12, fill: C.muted, mono: true, parent: A.g });
    const ALU = d.g();
    const aluF = d.el('path', { d: 'M200 322 L290 322 L310 352 L330 322 L420 322 L380 386 L240 386 Z', fill: C.yellow, opacity: 0 }, ALU);
    d.into(ALU, () => { d.path('M200 322 L290 322 L310 352 L330 322 L420 322 L380 386 L240 386 Z', { fill: 'none', stroke: C.ink, strokeWidth: 2.2 }); d.text(310, 374, 'ALU', { size: 16, fill: C.ink2, mono: true, weight: 500 }); d.text(310, 310, 'calculator', { size: 13, fill: C.muted, mono: true }); });
    const OUT = box(436, 322, 64, 64, 'display');
    const outT = d.text(468, 356, '', { size: 30, fill: C.accent, mono: true, weight: 500, parent: OUT.g });
    const phaseT = d.text(264, 428, '', { size: 16, fill: C.ink, mono: true, weight: 500 });
    // buses
    d.line(520, 60, 520, 430, { stroke: C.line2, strokeWidth: 6, roughness: 0.3 });
    d.text(520, 450, 'bus', { size: 12, fill: C.muted, mono: true });
    const pk = d.g(S.layers.top, { opacity: 0 });
    const pkR = d.el('rect', { x: -30, y: -14, width: 60, height: 28, rx: 14, fill: C.iris }, pk);
    const pkT = d.text(0, 1, '', { size: 14, fill: '#fff', mono: true, weight: 500, parent: pk });

    // ---------- animation helpers
    const P = { pc: [160, 124], ir: [490, 124], irN: [400, 140], a: [160, 354], alu: [310, 322], aluOut: [240, 386], out: [436, 354], cu: [265, 196] };
    const rowPt = (k) => [MX, RY(k)];
    const route = (a, b) => { const pts = [a]; if (a[0] < 520 !== b[0] < 520 || a[0] >= 520) { pts.push([520, a[1]], [520, b[1]]); } pts.push(b); return pts; };
    let speed = 1;
    const send = async (w, label, a, b, color = C.iris) => {
      const pts = a[0] < 520 && b[0] < 520 ? [a, [Math.min(505, Math.max(a[0], b[0]) + 20), a[1]], [Math.min(505, Math.max(a[0], b[0]) + 20), b[1]], b] : route(a, b);
      const lens = []; let L = 0;
      for (let k = 1; k < pts.length; k++) { const l = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); lens.push(l); L += l; }
      pkT.textContent = label; pkR.setAttribute('fill', color);
      const wpx = Math.max(44, label.length * 9 + 18); pkR.setAttribute('x', -wpx / 2); pkR.setAttribute('width', wpx);
      pk.setAttribute('opacity', 1);
      const tw = S.tween({ dur: (0.35 + L / 700) / speed, ease: 'inOut', onUpdate: (k) => {
        let s = k * L, i = 0;
        while (i < lens.length - 1 && s > lens[i]) { s -= lens[i]; i++; }
        const f = lens[i] ? s / lens[i] : 0;
        S.at(pk, lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f));
      } });
      await tw.promise; w.check();
      pk.setAttribute('opacity', 0);
    };
    const flash = (k) => { fx[k] = 1; S.to(fx, { [k]: 0 }, 0.9 / speed, { ease: 'out' }); };
    const pause = (w, s) => w(s / speed);

    async function phase(w) {
      if (cpu.halted) return;
      const op = OPS[cpu.ir >> 5], n = cpu.ir & 31;
      if (cpu.phase === 'fetch') {
        flash('pc');
        await send(w, `${cpu.pc}`, P.pc, rowPt(cpu.pc), C.accent);
        fx.row = cpu.pc; fx.rowT = 1;
        await pause(w, 0.25);
        await send(w, bin(cpu.mem[cpu.pc]), rowPt(cpu.pc), P.ir);
        cpu.ir = cpu.mem[cpu.pc]; flash('ir');
        cpu.phase = 'decode';
      } else if (cpu.phase === 'decode') {
        await send(w, OPS[cpu.ir >> 5], [345, 156], P.cu, C.accent);
        flash('cu');
        cpu.phase = 'execute';
      } else if (cpu.phase === 'execute') {
        let jumped = false;
        if (op === 'LDA') { await send(w, `${n}`, P.irN, rowPt(n), C.accent); fx.row = n; fx.rowT = 1; await send(w, `${cpu.mem[n]}`, rowPt(n), P.a); cpu.a = cpu.mem[n]; flash('a'); }
        if (op === 'ADD' || op === 'SUB') {
          await send(w, `${n}`, P.irN, rowPt(n), C.accent); fx.row = n; fx.rowT = 1;
          await send(w, `${cpu.mem[n]}`, rowPt(n), P.alu);
          await send(w, `${cpu.a}`, P.a, [240, 340]);
          flash('alu');
          const res = (op === 'ADD' ? cpu.a + cpu.mem[n] : cpu.a - cpu.mem[n] + 256) & 255; // 8-bit result
          await pause(w, 0.3);
          await send(w, `${res}`, P.aluOut, P.a, C.accent); cpu.a = res; flash('a');
        }
        if (op === 'STA') { await send(w, `${n}`, P.irN, rowPt(n), C.accent); await send(w, `${cpu.a}`, P.a, rowPt(n)); cpu.mem[n] = cpu.a; fx.row = n; fx.rowT = 1; }
        if (op === 'LDI') { await send(w, `${n}`, P.irN, P.a); cpu.a = n; flash('a'); }
        if (op === 'OUT') { await send(w, `${cpu.a}`, P.a, P.out); cpu.out = cpu.a; flash('out'); }
        if (op === 'JMP' || (op === 'JZ' && cpu.a === 0)) {
          if (op === 'JMP' && n === cpu.pc) cpu.halted = true;
          await send(w, `${n}`, P.irN, P.pc, C.accent); cpu.pc = n; flash('pc'); jumped = true;
        }
        if (op === 'JZ' && cpu.a !== 0) { await pause(w, 0.4); }
        cpu.phase = 'next';
        cpu.jumped = jumped;
      } else {
        if (!cpu.jumped) { cpu.pc = (cpu.pc + 1) & 31; flash('pc'); }
        cpu.phase = 'fetch';
        await pause(w, 0.2);
      }
    }
    let running = false;
    const run = (loop = false) => S.play(async (w) => {
      running = true;
      try {
        for (;;) {
          if (cpu.halted) { if (!loop) break; await w(3); reset(); }
          await phase(w); await pause(w, 0.35);
        }
      } finally { running = false; }
    });

    const progC = S.ui.choice({ options: [['count', 'Count down'], ['add', 'Add 12 + 30']], value: 'count', onChange: (v) => { cpu.prog = v; reset(); } });
    const stepB = S.ui.button({ label: 'Step', icon: 'step-forward', primary: true, onClick: () => { if (!running) S.play((w) => phase(w)); } });
    const runB = S.ui.button({ label: 'Run', icon: 'play', onClick: () => { if (!running) { speed = 1; run(); } } });
    S.ui.button({ label: 'Reset', icon: 'rotate-ccw', onClick: () => reset() });

    S.onTick((dt) => {
      memG.setAttribute('opacity', (0.35 + 0.65 * focus.mem).toFixed(2));
      PC.g.setAttribute('opacity', (0.35 + 0.65 * focus.pc).toFixed(2)); IR.g.setAttribute('opacity', (0.35 + 0.65 * focus.ir).toFixed(2));
      CU.g.setAttribute('opacity', (0.35 + 0.65 * focus.cu).toFixed(2));
      for (const g of [A.g, ALU, OUT.g]) g.setAttribute('opacity', (0.35 + 0.65 * focus.alu).toFixed(2));
      fx.rowT = Math.max(0, fx.rowT - dt * 0.8);
      rows.forEach((r, k) => {
        const v = cpu.mem[k];
        r.b.textContent = k < cpu.codeLen ? `${bin(v).slice(0, 3)} ${bin(v).slice(3)}` : bin(v);
        r.m.textContent = k < cpu.codeLen ? `${OPS[v >> 5]}${OPS[v >> 5] === 'OUT' ? '' : ' ' + (v & 31)}` : `= ${v}`;
        r.m.setAttribute('fill', k < cpu.codeLen ? C.ink2 : C.irisInk);
        r.hi.setAttribute('opacity', (k === fx.row ? fx.rowT * 0.7 : 0) + (k === cpu.pc ? 0.12 : 0));
      });
      PC.f.setAttribute('opacity', (fx.pc * 0.6).toFixed(2)); IR.f.setAttribute('opacity', (fx.ir * 0.6).toFixed(2)); CU.f.setAttribute('opacity', (fx.cu * 0.4).toFixed(2));
      A.f.setAttribute('opacity', (fx.a * 0.6).toFixed(2)); aluF.setAttribute('opacity', (fx.alu * 0.7).toFixed(2)); OUT.f.setAttribute('opacity', (fx.out * 0.6).toFixed(2));
      pcT.textContent = String(cpu.pc);
      const ib = bin(cpu.ir);
      irOp.textContent = ib.slice(0, 3); irN.textContent = ib.slice(3);
      const op = OPS[cpu.ir >> 5], n = cpu.ir & 31, decoded = cpu.phase !== 'decode' && cpu.phase !== 'fetch' || (cpu.phase === 'fetch' && cpu.ir);
      chips.forEach((c, k) => { const on = decoded && OPS[k] === op; c.r.setAttribute('fill', on ? C.accent : '#fff'); c.r.setAttribute('stroke', on ? C.accent : C.line2); c.t.setAttribute('fill', on ? '#fff' : C.ink2); });
      sayT.textContent = decoded ? `${op}${op === 'OUT' ? '' : ' ' + n}: ${SAY[op](n)}` : '';
      aT.textContent = String(cpu.a);
      zT.textContent = cpu.a === 0 ? 'A is zero' : '';
      outT.textContent = cpu.out == null ? '' : String(cpu.out);
      phaseT.textContent = cpu.halted ? 'finished: it now jumps to itself forever' : `next: ${cpu.phase === 'next' ? 'move the program counter on' : cpu.phase}`;
    }, { essential: true });

    const FOCUS = [{ mem: 1, pc: 0, ir: 0, cu: 0, alu: 0 }, { mem: 1, pc: 1, ir: 1, cu: 0, alu: 0 }, { mem: 0, pc: 0, ir: 1, cu: 1, alu: 0 }, { mem: 0.6, pc: 0, ir: 0.6, cu: 0, alu: 1 }, { mem: 1, pc: 1, ir: 1, cu: 1, alu: 1 }, { mem: 1, pc: 1, ir: 1, cu: 1, alu: 1 }];
    return {
      step(i) {
        S.to(focus, FOCUS[i], 0.5);
        stepB.show(i === 5); runB.show(i === 5); progC.show(i === 5);
        if (i < 5) { if (i === 0) { cpu.prog = 'count'; progC.set('count', false); reset(); } speed = 1.1; run(true); }
        else { cpu.prog = 'count'; progC.set('count', false); reset(); speed = 1; S.play(async (w) => { await w(1); await S.hand.press(stepB.el); await phase(w); await w(0.4); S.hand.hide(); }); }
      },
    };
  },
});
