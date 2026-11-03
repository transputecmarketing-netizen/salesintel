// Adding with gates: binary addition, half adder, full adder, and a 4-bit ripple-carry adder.
import { scene } from '../../engine.js';
import { panel } from '../../kit.js';

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'Four full adders adding two 4-bit binary numbers, with the carry rippling across',
  steps: [
    'Binary sums: 1 + 1 = 10, so write 0 and carry 1.',
    'A half adder: XOR makes the sum, AND makes the carry.',
    'A full adder also adds the carry coming from its right.',
    'Chain four full adders to add two 4-bit numbers.',
    'Watch the carry ripple from right to left, one column at a time.',
    'Your turn: tap the bits of A and B, then check the answer.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { A: 5, B: 3, t: 99, table: 1, zoom: 0, full: 0, chain: 0, loop: 0 };
    const XS = [590, 460, 330, 200]; // bit 0 (right) to bit 3 (left)
    // ---------- binary addition table
    const tG = d.g(S.layers.top);
    d.into(tG, () => {
      panel(S, 220, 150, 360, 230, { parent: tG, fill: '#fff' });
      [['0 + 0', '0'], ['0 + 1', '1'], ['1 + 0', '1'], ['1 + 1', '10']].forEach(([q, a], k) => {
        d.text(330, 196 + k * 46, q, { size: 30, fill: C.ink, mono: true });
        d.text(420, 196 + k * 46, '=', { size: 30, fill: C.muted, mono: true });
        d.text(490, 196 + k * 46, a, { size: 30, fill: k === 3 ? C.accentInk : C.ink, mono: true, weight: 500 });
      });
      d.text(400, 366, '“10” in binary is two: write 0, carry 1', { size: 15, fill: C.muted, mono: true });
    });
    // ---------- the chain
    const cG = d.g();
    const cells = [];
    d.into(cG, () => {
      d.text(100, 92, 'A', { size: 24, fill: C.accentInk, weight: 500 });
      d.text(100, 152, 'B', { size: 24, fill: C.iris, weight: 500 });
      for (let k = 0; k < 4; k++) {
        const x = XS[k];
        d.text(x, 56, String(2 ** k), { size: 14, fill: C.muted, mono: true });
        const a = d.g(cG), b = d.g(cG);
        d.into(a, () => d.rect(x - 22, 70, 44, 44, { fill: '#fff', stroke: C.accent, strokeWidth: 2.2 }));
        d.into(b, () => d.rect(x - 22, 130, 44, 44, { fill: '#fff', stroke: C.iris, strokeWidth: 2.2 }));
        const at = d.text(x, 93, '', { size: 24, fill: C.ink, mono: true, weight: 500, parent: cG });
        const bt = d.text(x, 153, '', { size: 24, fill: C.ink, mono: true, weight: 500, parent: cG });
        S.tap(a, () => { st.A ^= 1 << k; st.t = 0; }, `A bit ${k}`);
        S.tap(b, () => { st.B ^= 1 << k; st.t = 0; }, `B bit ${k}`);
        d.line(x, 174, x, 222, { strokeWidth: 2, stroke: C.ink2 });
        d.rect(x - 50, 222, 100, 80, { fill: C.subtle, stroke: C.ink, strokeWidth: 2.2 });
        d.text(x, 262, 'full adder', { size: 14, fill: C.ink2, mono: true });
        d.line(x, 302, x, 342, { strokeWidth: 2, stroke: C.ink2 });
        const box = d.el('rect', { x: x - 50, y: 222, width: 100, height: 80, fill: C.yellow, opacity: 0 }, cG);
        const s = d.text(x, 372, '', { size: 30, fill: C.ink, mono: true, weight: 500, parent: cG });
        const carry = d.el('path', { d: `M${x - 50} 280 C ${x - 64} 280, ${x - 66} 280, ${x - 80} 280`, fill: 'none', 'stroke-width': 3.5 }, cG);
        const cT = d.text(x - 66, 266, '', { size: 14, fill: C.accentInk, mono: true, parent: cG });
        cells.push({ at, bt, s, carry, cT, box });
      }
      d.line(660, 280, 640, 280, { stroke: C.ink2, strokeWidth: 2 });
      d.text(680, 280, '0', { size: 16, fill: C.muted, mono: true });
      d.text(100, 372, '', { size: 30, fill: C.ink, mono: true, weight: 500 });
    });
    const s4 = d.text(110, 372, '', { size: 30, fill: C.ink, mono: true, weight: 500, parent: cG });
    const sumLine = d.text(400, 432, '', { size: 26, fill: C.ink });
    // ---------- zoom: half adder / full adder from gates
    const zG = d.g(S.layers.top, { opacity: 0 });
    const zv = {};
    d.into(zG, () => {
      panel(S, 110, 60, 580, 400, { parent: zG, fill: '#fff' });
      const box = (x, y, t) => { d.rect(x - 44, y - 26, 88, 52, { fill: C.irisSoft, stroke: C.iris, strokeWidth: 2.4 }); d.text(x, y, t, { size: 18, fill: C.irisInk, mono: true, weight: 500 }); };
      zv.half = d.g(zG); zv.fullG = d.g(zG);
      d.into(zv.half, () => {
        box(400, 170, 'XOR'); box(400, 310, 'AND');
        d.lines([[200, 160], [356, 160]]); d.lines([[200, 200], [260, 200], [260, 320], [356, 320]]);
        d.lines([[230, 160], [230, 300], [356, 300]]); d.lines([[300, 200], [300, 180], [356, 180]]);
        d.lines([[444, 170], [560, 170]]); d.lines([[444, 310], [560, 310]]);
        d.text(180, 160, 'A', { size: 22, fill: C.accentInk, weight: 500 }); d.text(180, 200, 'B', { size: 22, fill: C.iris, weight: 500 });
        d.text(590, 170, 'sum', { size: 18, fill: C.ink, mono: true, anchor: 'start' }); d.text(590, 310, 'carry', { size: 18, fill: C.ink, mono: true, anchor: 'start' });
      });
      d.into(zv.fullG, () => {
        box(300, 150, 'half'); box(460, 200, 'half'); box(560, 330, 'OR');
        d.lines([[160, 140], [256, 140]]); d.lines([[160, 170], [256, 170]]); d.lines([[160, 250], [380, 250], [380, 210], [416, 210]]);
        d.lines([[344, 150], [380, 150], [380, 190], [416, 190]]); d.lines([[504, 190], [640, 190]]);
        d.lines([[300, 176], [300, 330], [516, 330]]); d.lines([[460, 226], [460, 344], [516, 344]]); d.lines([[604, 337], [640, 337]]);
        d.text(140, 140, 'A', { size: 20, fill: C.accentInk, weight: 500 }); d.text(140, 170, 'B', { size: 20, fill: C.iris, weight: 500 }); d.text(140, 250, 'carry in', { size: 14, fill: C.ink2, mono: true, anchor: 'end' });
        d.text(650, 190, 'sum', { size: 18, fill: C.ink, mono: true, anchor: 'start' }); d.text(650, 337, 'carry out', { size: 16, fill: C.ink, mono: true, anchor: 'start' });
      });
    });
    const zT = d.text(400, 420, '', { size: 18, fill: C.ink, mono: true, parent: zG });

    const rd = S.ui.readout({ label: 'A + B', color: C.accent });
    S.ui.button({ label: 'Add again', icon: 'play', onClick: () => (st.t = 0) });

    S.onTick((dt) => {
      st.t += dt;
      if (st.loop && st.t > 4.2) st.t = 0;
      tG.setAttribute('opacity', st.table.toFixed(2));
      cG.setAttribute('opacity', (st.chain * (1 - st.zoom * 0.9)).toFixed(2));
      zG.setAttribute('opacity', st.zoom.toFixed(2));
      zv.half.setAttribute('opacity', (1 - st.full).toFixed(2)); zv.fullG.setAttribute('opacity', st.full.toFixed(2));
      let c = 0, S4 = 0;
      for (let k = 0; k < 4; k++) {
        const a = (st.A >> k) & 1, b = (st.B >> k) & 1, sum = a ^ b ^ c, co = (a & b) | (c & (a ^ b));
        const done = st.t > (k + 1) * 0.7;
        const cl = cells[k];
        cl.at.textContent = String(a); cl.bt.textContent = String(b);
        cl.s.textContent = done ? String(sum) : '·';
        cl.carry.setAttribute('stroke', done && co ? C.accent : C.line2);
        cl.cT.textContent = done && co ? 'carry 1' : '';
        cl.box.setAttribute('opacity', st.t > k * 0.7 && !done ? 0.35 : 0);
        S4 |= sum << k;
        c = co;
      }
      S4 |= c << 4;
      const all = st.t > 2.8;
      s4.textContent = all ? String(c) : '·';
      sumLine.textContent = all ? `${st.A} + ${st.B} = ${S4}   (${S4.toString(2).padStart(5, '0')})` : 'adding…';
      rd.set(`${st.A} + ${st.B} = ${st.A + st.B}`);
      const a0 = st.A & 1, b0 = st.B & 1;
      zT.textContent = st.full > 0.5 ? 'it takes A, B and the carry in: three bits' : `A = ${a0}, B = ${b0}: sum ${a0 ^ b0}, carry ${a0 & b0}`;
    }, { essential: true });

    return {
      step(i) {
        S.to(st, { table: i === 0 ? 1 : 0, zoom: i === 1 || i === 2 ? 1 : 0, full: i === 2 ? 1 : 0, chain: i >= 1 ? 1 : 0 }, 0.5);
        st.loop = i === 4 ? 1 : 0;
        if (i === 1) S.play(async (w) => { for (const [a, b] of [[1, 0], [1, 1], [0, 1]]) { await w(1.4); st.A = (st.A & ~1) | a; st.B = (st.B & ~1) | b; } });
        if (i >= 3) { st.t = 0; }
        if (i === 3) { st.A = 5; st.B = 3; }
        if (i === 4) { st.A = 7; st.B = 9; st.t = 0; }
        if (i === 5) { st.A = 6; st.B = 11; st.t = 0; S.play(async (w) => { await w(3.2); await S.hand.tap(XS[0], 92); st.A ^= 1; st.t = 0; await w(0.4); S.hand.hide(); }); }
      },
    };
  },
});
