// x86 vs ARM: instruction lengths (real encodings), a pipeline, micro-ops, power, big.LITTLE and the phone SoC.
import { scene } from '../../engine.js';
import { panel } from '../../kit.js';

const X86 = [['ret', 'C3'], ['add eax, ebx', '01 D8'], ['mov eax, 1', 'B8 01 00 00 00'], ['add [rbx+rcx*4+16], 5', '83 44 8B 10 05'], ['mov rax, big number', '48 B8 88 77 66 55 44 33 22 11']];
const ARM = [['add w0, w0, w1', '0B 01 00 00'], ['mov w0, #1', '52 80 00 20'], ['ldr w0, [x1]', 'B9 40 00 20'], ['ret', 'D6 5F 03 C0']];

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'How x86 and ARM processors encode, pipeline and schedule instructions',
  steps: [
    'Instructions are the words a processor understands: just numbers.',
    'x86 (Intel, AMD): lots of instructions, from 1 to 15 bytes long.',
    'ARM (almost every phone): simpler instructions, all 4 bytes long.',
    'A pipeline is a factory line: fetch, decode, execute, all at once.',
    'x86 chips chop complex instructions into simple micro-ops first.',
    'Simpler decoding helps, but phone chips are mainly designed to sip power.',
    'big.LITTLE: big cores for bursts of speed, small cores for light work.',
    'A phone’s system-on-chip packs CPU, GPU, NPU and modem together.',
  ],
  build(S) {
    const { d, C } = S;
    const V = Array(8).fill(0);
    const views = [];
    const view = () => { const g = d.g(undefined, { opacity: 0 }); views.push(g); return g; };
    const bytes = (x, y, hex, col, parent, bw = 30) => {
      const bs = hex.split(' ');
      bs.forEach((b, k) => { d.rect(x + k * bw, y, bw - 3, 34, { fill: col, stroke: C.ink, strokeWidth: 1.4, roughness: 0.4, parent }); d.text(x + k * bw + (bw - 3) / 2, y + 17, b, { size: 13, fill: '#fff', mono: true, weight: 500, parent }); });
      return bs.length * bw;
    };
    // 0: words → numbers
    const g0 = view();
    d.into(g0, () => {
      d.text(400, 110, '“add the number in B to A”', { size: 26, fill: C.ink });
      d.arrow(400, 140, 400, 200, { strokeWidth: 2.4, head: 12 });
      d.text(220, 230, 'x86', { size: 18, fill: C.ink2, mono: true, weight: 500 });
      bytes(160, 250, '01 D8', C.ink2, g0, 60);
      d.text(580, 230, 'ARM', { size: 18, fill: C.accentInk, mono: true, weight: 500 });
      bytes(470, 250, '0B 01 00 00', C.accent, g0, 60);
      d.text(400, 350, 'Same idea, different “language”: each chip family has its own instruction set.', { size: 16, fill: C.muted });
      d.text(400, 380, 'Code compiled for one will not run on the other.', { size: 16, fill: C.muted });
    });
    // 1 & 2: tapes
    const g1 = view();
    const tapeX = d.g(g1), tapeA = d.g(g1);
    d.into(g1, () => {
      d.text(60, 80, 'x86', { size: 20, fill: C.ink, mono: true, weight: 500, anchor: 'start' });
      let y = 104;
      for (const [t, h] of X86) { const w = bytes(60, y, h, C.ink2, tapeX, 30); d.text(70 + w, y + 17, t, { size: 14, fill: C.ink2, mono: true, anchor: 'start', parent: tapeX }); d.text(40, y + 17, String(h.split(' ').length), { size: 13, fill: C.muted, mono: true, parent: tapeX }); y += 44; }
      d.text(60, 336, 'ARM', { size: 20, fill: C.accentInk, mono: true, weight: 500, anchor: 'start', parent: tapeA });
      ARM.forEach(([t, h], k) => { const x = 60 + (k % 2) * 360, yy = 356 + Math.floor(k / 2) * 44; const w = bytes(x, yy, h, C.accent, tapeA, 30); d.text(x + w + 10, yy + 17, t, { size: 14, fill: C.accentInk, mono: true, anchor: 'start', parent: tapeA }); });
    });
    // 3: pipeline
    const g3 = view();
    const tokens = [];
    const stages = ['fetch', 'decode', 'execute', 'write back'];
    d.into(g3, () => {
      stages.forEach((s, k) => { d.rect(90 + k * 160, 150, 140, 160, { fill: C.subtle, stroke: C.ink, strokeWidth: 2 }); d.text(160 + k * 160, 130, s, { size: 18, fill: C.ink, weight: 500 }); });
      d.text(400, 370, 'four instructions in flight: one finishes every tick', { size: 16, fill: C.muted, mono: true });
      const cols = [C.accent, C.iris, C.blue, C.green, C.yellow, C.ink2];
      for (let k = 0; k < 6; k++) tokens.push({ g: d.el('rect', { width: 100, height: 60, rx: 12, fill: cols[k] }, g3), t: d.text(0, 0, `#${k + 1}`, { size: 18, fill: '#fff', mono: true, weight: 500, parent: g3 }) });
    });
    const tickT = d.text(400, 420, '', { size: 16, fill: C.ink2, mono: true, parent: g3 });
    // 4: micro-ops
    const g4 = view();
    const uops = [];
    d.into(g4, () => {
      bytes(60, 210, '83 44 8B 10 05', C.ink2, g4, 34);
      d.text(145, 270, 'add 5 to a value in memory', { size: 14, fill: C.ink2, mono: true });
      d.rect(300, 170, 170, 120, { fill: C.irisSoft, stroke: C.iris, strokeWidth: 3 });
      d.text(385, 230, 'decoder', { size: 20, fill: C.irisInk, weight: 500 });
      d.arrow(240, 227, 296, 227, { strokeWidth: 2.4, head: 10 });
      ['1. load from memory', '2. add 5', '3. store to memory'].forEach((t, k) => uops.push({ g: d.g(g4), t, k }));
      uops.forEach((u) => d.into(u.g, () => { d.rect(520, 150 + u.k * 64, 220, 46, { fill: C.accent, stroke: C.ink, strokeWidth: 1.6 }); d.text(630, 173 + u.k * 64, u.t, { size: 15, fill: '#fff', mono: true }); }));
      d.text(400, 400, 'ARM already uses simple steps like these, so its decoder is smaller', { size: 15, fill: C.muted, mono: true });
    });
    // 5: power
    const g5 = view();
    let glowA, glowB;
    d.into(g5, () => {
      d.rect(140, 160, 120, 120, { fill: '#2a2b31', stroke: C.ink, strokeWidth: 2 });
      glowA = d.glow(200, 220, 100, C.accent, g5);
      d.text(200, 310, 'phone chip', { size: 18, fill: C.ink, weight: 500 });
      d.text(200, 336, '≈ 3–8 W, no fan', { size: 15, fill: C.green, mono: true });
      d.rect(500, 140, 160, 160, { fill: '#3a3c44', stroke: C.ink, strokeWidth: 2 });
      glowB = d.glow(580, 220, 170, C.accent, g5);
      d.text(580, 330, 'desktop processor', { size: 18, fill: C.ink, weight: 500 });
      d.text(580, 356, '≈ 65–250 W, big cooler', { size: 15, fill: C.accentInk, mono: true });
      d.text(400, 430, 'Apple’s laptop chips are ARM too; Intel and AMD also build efficient designs.', { size: 14, fill: C.muted });
    });
    // 6: big.LITTLE
    const g6 = view();
    const cores = [];
    const taskEls = [];
    let pwrBar;
    d.into(g6, () => {
      d.rect(240, 110, 320, 260, { fill: '#2a2b31', stroke: C.ink, strokeWidth: 2.4 });
      for (let k = 0; k < 2; k++) cores.push({ big: 1, x: 300 + k * 110, y: 170, r: d.el('rect', { x: 260 + k * 110, y: 130, width: 90, height: 90, rx: 8, fill: '#4a4b52' }, g6) });
      for (let k = 0; k < 4; k++) cores.push({ big: 0, x: 280 + k * 72, y: 300, r: d.el('rect', { x: 256 + k * 72, y: 270, width: 52, height: 52, rx: 6, fill: '#4a4b52' }, g6) });
      d.text(400, 240, 'big cores', { size: 14, fill: '#fff', mono: true }); d.text(400, 344, 'little cores', { size: 14, fill: '#fff', mono: true });
      d.text(680, 120, 'battery use', { size: 14, fill: C.muted, mono: true });
      d.rect(660, 140, 40, 200, { fill: '#fff', stroke: C.ink, strokeWidth: 2 });
      pwrBar = d.el('rect', { x: 664, width: 32, fill: C.accent }, g6);
      ['music', 'messages', 'step count', 'game'].forEach((t, k) => taskEls.push({ t, heavy: t === 'game', g: d.g(g6), k }));
      taskEls.forEach((tk) => d.into(tk.g, () => { d.rect(-48, -16, 96, 32, { fill: tk.heavy ? C.accent : C.iris, stroke: 'none' }); d.text(0, 1, tk.t, { size: 13, fill: '#fff', mono: true, weight: 500 }); }));
    });
    // 7: SoC
    const g7 = view();
    d.into(g7, () => {
      d.rect(150, 70, 500, 360, { fill: '#2a2b31', stroke: C.ink, strokeWidth: 2.6 });
      const b = (x, y, w, h, t, c, s) => { d.rect(x, y, w, h, { fill: c, stroke: 'none', roughness: 0.5 }); d.text(x + w / 2, y + h / 2 - (s ? 8 : 0), t, { size: 15, fill: '#fff', weight: 500 }); if (s) d.text(x + w / 2, y + h / 2 + 12, s, { size: 11, fill: '#fff', mono: true }); };
      b(170, 90, 200, 130, 'CPU', C.accent, 'big + little cores');
      b(380, 90, 250, 130, 'GPU', C.green, 'graphics, games');
      b(170, 230, 140, 90, 'NPU', C.iris, 'AI maths');
      b(320, 230, 150, 90, 'ISP', C.blue, 'camera photos');
      b(480, 230, 150, 90, 'modem', '#8a5a2a', '5G, LTE');
      b(170, 330, 220, 80, 'memory controller', '#5a5c66');
      b(400, 330, 230, 80, 'security · audio · video', '#5a5c66');
      d.text(400, 456, 'all on one piece of silicon, smaller than a fingernail', { size: 15, fill: C.muted, mono: true });
    });

    const gameT = S.ui.toggle({ label: 'Start a game', value: false, onChange: () => {} }).show(false);
    let tick = 0, tt = 0;
    S.onTick((dt, t) => {
      views.forEach((g, k) => g.setAttribute('opacity', V[k].toFixed(2)));
      tapeA.setAttribute('opacity', V[1] && S.step >= 2 ? 1 : 0.15);
      tapeX.setAttribute('opacity', S.step === 2 ? 0.35 : 1);
      // pipeline: tokens advance one stage per tick
      tt += dt; if (tt > 1.1) { tt = 0; tick++; }
      const ease = S.ease.inOut(Math.min(1, tt / 0.5));
      tokens.forEach((tk, k) => {
        const pos = tick - k + ease - 1; // stage index (fractional while moving)
        const vis = pos > -0.6 && pos < 3.6;
        const x = 110 + Math.max(-1, Math.min(4, pos)) * 160, y = 200;
        tk.g.setAttribute('x', x); tk.g.setAttribute('y', y); tk.t.setAttribute('x', x + 50); tk.t.setAttribute('y', y + 31);
        tk.g.setAttribute('opacity', vis ? 1 : 0); tk.t.setAttribute('opacity', vis ? 1 : 0);
      });
      if (tick > 9) tick = 0;
      tickT.textContent = `tick ${tick}`;
      // micro-ops appear one by one
      const u = (t * 0.7) % 4;
      uops.forEach((x) => x.g.setAttribute('opacity', u > x.k + 0.5 ? 1 : 0.1));
      glowA.setAttribute('opacity', (0.25 + 0.1 * Math.sin(t * 3)).toFixed(2)); glowB.setAttribute('opacity', (0.8 + 0.15 * Math.sin(t * 3)).toFixed(2));
      // big.LITTLE scheduling
      const gaming = gameT.value;
      let pw = 0;
      cores.forEach((c, k) => {
        const busy = c.big ? gaming : k - 2 < 3;
        c.r.setAttribute('fill', busy ? (c.big ? C.accent : C.iris) : '#4a4b52');
        pw += busy ? (c.big ? 0.36 : 0.06) : 0;
      });
      taskEls.forEach((tk) => {
        const show = !tk.heavy || gaming;
        const target = tk.heavy ? cores[0] : cores[2 + Math.min(tk.k, 3)];
        tk.g.setAttribute('transform', `translate(${tk.heavy ? 355 : target.x} ${tk.heavy ? 175 : target.y - 2})`);
        tk.g.setAttribute('opacity', show ? 1 : 0);
      });
      pwrBar.setAttribute('y', (336 - 192 * pw).toFixed(1)); pwrBar.setAttribute('height', (192 * pw).toFixed(1));
    }, { essential: true });

    return {
      step(i) {
        const map = [0, 1, 1, 2, 3, 4, 5, 6];
        for (let k = 0; k < 7; k++) S.to(V, { [k]: map[i] === k ? 1 : 0 }, 0.5);
        gameT.show(i === 6);
        if (i === 6) { gameT.set(false); S.play(async (w) => { await w(1.6); await S.hand.press(gameT.el); gameT.set(true); await w(0.4); S.hand.hide(); }); }
        if (i === 3) { tick = 0; tt = 0; }
      },
    };
  },
});
