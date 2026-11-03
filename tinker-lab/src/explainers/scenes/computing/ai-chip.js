// How AI chips think: a real (tiny) neural network that tells vertical from horizontal lines, its matrix multiply,
// and a grid of multiply-add units like the ones inside NPUs and tensor cores.
import { scene, clamp } from '../../engine.js';
import { panel } from '../../kit.js';

// hidden neurons 0–2 look for a column, 3–5 for a row: +1 for pixels on their line, −0.5 elsewhere, bias −1.5
const W = Array.from({ length: 6 }, (_, k) => Array.from({ length: 9 }, (_, p) => ((k < 3 ? p % 3 === k : Math.floor(p / 3) === k - 3) ? 1 : -0.5)));
const BIAS = -1.5;

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A small neural network looking at a 3 by 3 picture',
  steps: [
    'A neural network: layers of tiny calculators called neurons.',
    'Each input is multiplied by a weight. Thick lines count more.',
    'A neuron adds up what arrives. If the total is positive, it lights up.',
    'The brightest output is the answer: a vertical line!',
    'A whole layer is one big grid of multiply-adds: a matrix multiply.',
    'AI chips run grids of multiply-adds at once: trillions every second.',
    'Your turn: tap pixels to draw a line and see what it thinks.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { px: [0, 1, 0, 0, 1, 0, 0, 1, 0], edges: 0, sums: 0, out: 0, mat: 0, sys: 0, net: 1 };
    const GX = 60, GY = 150, CS = 56;
    const HX = 440, HY = (k) => 92 + k * 62, OX = 660, OY = [190, 330];
    const netG = d.g();
    const edgeG = d.g(netG), pulseG = d.g(netG);
    const edges = [];
    for (let k = 0; k < 6; k++) for (let p = 0; p < 9; p++) {
      const x1 = GX + (p % 3) * CS + CS / 2, y1 = GY + Math.floor(p / 3) * CS + CS / 2, w = W[k][p];
      edges.push({ k, p, w, x1, y1, x2: HX - 22, y2: HY(k), el: d.el('line', { x1, y1, x2: HX - 22, y2: HY(k), stroke: w > 0 ? C.accent : C.iris, 'stroke-width': Math.abs(w) * 2.6, 'stroke-linecap': 'round' }, edgeG), dot: d.el('circle', { r: 4, fill: w > 0 ? C.accent : C.iris }, pulseG) });
    }
    const outEdges = [];
    for (let k = 0; k < 6; k++) { const o = k < 3 ? 0 : 1; outEdges.push({ k, o, el: d.el('line', { x1: HX + 22, y1: HY(k), x2: OX - 30, y2: OY[o], stroke: C.accent, 'stroke-width': 2.6 }, edgeG) }); }
    // the pixel grid
    const cells = [];
    d.into(netG, () => {
      d.text(GX + 84, GY - 26, 'input: 9 pixels', { size: 15, fill: C.muted, mono: true });
      for (let p = 0; p < 9; p++) {
        const g = d.g(netG);
        const r = d.el('rect', { x: GX + (p % 3) * CS + 3, y: GY + Math.floor(p / 3) * CS + 3, width: CS - 6, height: CS - 6, rx: 6, stroke: C.ink, 'stroke-width': 2 }, g);
        S.tap(g, () => { st.px[p] ^= 1; }, `Pixel ${p + 1}`);
        cells.push(r);
      }
      d.text(HX, 40, 'hidden neurons', { size: 15, fill: C.muted, mono: true });
      d.text(OX + 40, 120, 'answer', { size: 15, fill: C.muted, mono: true });
    });
    const hidden = Array.from({ length: 6 }, (_, k) => ({ c: d.el('circle', { cx: HX, cy: HY(k), r: 22, stroke: C.ink, 'stroke-width': 2 }, netG), t: d.text(HX + 34, HY(k), '', { size: 13, fill: C.ink2, mono: true, anchor: 'start', parent: netG }) }));
    const outs = OY.map((y, o) => {
      const c = d.el('circle', { cx: OX, cy: y, r: 30, stroke: C.ink, 'stroke-width': 2.4 }, netG);
      const glyph = d.el('path', { d: o === 0 ? `M${OX} ${y - 16} V${y + 16}` : `M${OX - 16} ${y} H${OX + 16}`, stroke: C.ink, 'stroke-width': 5, 'stroke-linecap': 'round' }, netG);
      const bar = d.el('rect', { x: OX + 44, y: y - 10, height: 20, rx: 10, fill: C.accent }, netG);
      const t = d.text(OX + 50, y + 34, '', { size: 14, fill: C.ink, mono: true, anchor: 'start', parent: netG });
      return { c, glyph, bar, t };
    });
    // ---------- matrix view
    const mG = d.g(S.layers.top, { opacity: 0 });
    const mx = [], hv = [];
    d.into(mG, () => {
      panel(S, 30, 40, 740, 420, { parent: mG, fill: '#fff' });
      d.text(400, 70, 'weights (6 × 9)   ×   pixels (9)   =   sums (6)', { size: 16, fill: C.ink2, mono: true });
      for (let k = 0; k < 6; k++) for (let p = 0; p < 9; p++) d.el('rect', { x: 80 + p * 36, y: 110 + k * 48, width: 32, height: 42, rx: 4, fill: W[k][p] > 0 ? C.accent : C.iris, opacity: Math.abs(W[k][p]) * 0.8 }, mG);
      for (let k = 0; k < 6; k++) for (let p = 0; p < 9; p++) d.text(96 + p * 36, 131 + k * 48, W[k][p] > 0 ? '1' : '−½', { size: 12, fill: '#fff', mono: true, parent: mG });
      d.text(424, 250, '×', { size: 34, fill: C.ink });
      for (let p = 0; p < 9; p++) mx.push(d.el('rect', { x: 460, y: 106 + p * 33, width: 40, height: 30, rx: 4, stroke: C.ink, 'stroke-width': 1.5 }, mG));
      d.text(540, 250, '=', { size: 34, fill: C.ink });
      for (let k = 0; k < 6; k++) hv.push(d.text(620, 131 + k * 48, '', { size: 20, fill: C.ink, mono: true, weight: 500, parent: mG }));
      d.text(400, 430, '54 multiplications and adds for this tiny layer; real networks need billions', { size: 14, fill: C.muted, mono: true });
    });
    // ---------- systolic array
    const sG = d.g(S.layers.top, { opacity: 0 });
    const macs = [], flowA = [], flowB = [];
    d.into(sG, () => {
      panel(S, 30, 40, 740, 420, { parent: sG, fill: '#fff' });
      d.text(400, 70, 'inside an AI chip: a grid of multiply-add units', { size: 16, fill: C.ink2, mono: true });
      for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) macs.push(d.el('rect', { x: 160 + c * 62, y: 100 + r * 52, width: 52, height: 42, rx: 6, fill: C.irisSoft, stroke: C.iris, 'stroke-width': 1.6 }, sG));
      for (let r = 0; r < 6; r++) flowA.push(d.el('circle', { r: 7, fill: C.accent }, sG));
      for (let c = 0; c < 8; c++) flowB.push(d.el('circle', { r: 7, fill: C.green }, sG));
      d.text(110, 240, 'data', { size: 14, fill: C.accentInk, mono: true });
      d.text(400, 432, 'Jetson Orin Nano: up to 40 TOPS · phone NPUs: tens of TOPS', { size: 15, fill: C.ink, mono: true });
      d.text(400, 456, '1 TOPS = a trillion operations every second', { size: 13, fill: C.muted, mono: true });
    });

    S.onTick((dt, t) => {
      netG.setAttribute('opacity', st.net.toFixed(2));
      mG.setAttribute('opacity', st.mat.toFixed(2)); sG.setAttribute('opacity', st.sys.toFixed(2));
      cells.forEach((r, p) => r.setAttribute('fill', st.px[p] ? C.ink : '#fff'));
      const h = W.map((row) => Math.max(0, row.reduce((s, w, p) => s + w * st.px[p], 0) + BIAS)); // ReLU
      const vSum = h[0] + h[1] + h[2], hSum = h[3] + h[4] + h[5];
      const pv = Math.exp(2 * vSum) / (Math.exp(2 * vSum) + Math.exp(2 * hSum));
      edges.forEach((e) => {
        const active = st.px[e.p];
        e.el.setAttribute('opacity', (st.edges * (active ? 0.75 : 0.12)).toFixed(2));
        const ph = (t * 0.8 + e.p * 0.07) % 1;
        e.dot.setAttribute('cx', (e.x1 + (e.x2 - e.x1) * ph).toFixed(1)); e.dot.setAttribute('cy', (e.y1 + (e.y2 - e.y1) * ph).toFixed(1));
        e.dot.setAttribute('opacity', (active && st.edges > 0.5 ? 0.8 : 0).toString());
      });
      hidden.forEach((n, k) => { n.c.setAttribute('fill', st.sums > 0.5 && h[k] > 0 ? C.yellow : '#fff'); n.t.textContent = st.sums > 0.5 ? (h[k] > 0 ? `+${h[k].toFixed(1)}` : '0') : ''; });
      outEdges.forEach((e) => e.el.setAttribute('opacity', (st.edges * (h[e.k] > 0 ? 0.9 : 0.15)).toFixed(2)));
      outs.forEach((o, k) => {
        const p = k === 0 ? pv : 1 - pv, win = p > 0.6;
        o.c.setAttribute('fill', st.out > 0.5 && win ? C.yellow : '#fff');
        o.bar.setAttribute('width', (st.out * 70 * p).toFixed(1));
        o.t.textContent = st.out > 0.5 ? `${Math.round(p * 100)} %` : '';
      });
      mx.forEach((r, p) => r.setAttribute('fill', st.px[p] ? C.ink : '#fff'));
      hv.forEach((tx, k) => { tx.textContent = (W[k].reduce((s, w, p) => s + w * st.px[p], 0)).toFixed(1); });
      // systolic: data enters from the left, weights from the top, every unit multiplies and passes them on
      flowA.forEach((c, r) => { const x = 140 + (((t * 120) + r * 30) % 520); c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', 121 + r * 52); });
      flowB.forEach((c, k) => { const y = 90 + (((t * 90) + k * 25) % 320); c.setAttribute('cx', 186 + k * 62); c.setAttribute('cy', y.toFixed(1)); });
      macs.forEach((m, k) => m.setAttribute('fill', Math.sin(t * 6 - (k % 8) * 0.6 - Math.floor(k / 8) * 0.6) > 0.6 ? C.yellow : C.irisSoft));
    }, { essential: true });

    return {
      step(i) {
        S.to(st, { edges: i >= 1 ? 1 : 0, sums: i >= 2 ? 1 : 0, out: i >= 3 ? 1 : 0, mat: i === 4 ? 1 : 0, sys: i === 5 ? 1 : 0, net: i === 4 || i === 5 ? 0.15 : 1 }, 0.6);
        if (i <= 4) st.px = [0, 1, 0, 0, 1, 0, 0, 1, 0];
        if (i === 6) { st.px = [0, 0, 0, 0, 0, 0, 0, 0, 0]; S.play(async (w) => { for (const p of [3, 4, 5]) { await w(0.5); await S.hand.tap(GX + (p % 3) * CS + CS / 2, GY + Math.floor(p / 3) * CS + CS / 2); st.px[p] = 1; } await w(0.4); S.hand.hide(); }); }
      },
    };
  },
});
