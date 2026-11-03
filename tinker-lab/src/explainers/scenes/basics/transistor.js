// The transistor: a small base current controls a big collector current (switch and amplifier).
import { scene, si, clamp } from '../../engine.js';
import { wire, battery, bulb, resistor, graph, pathOf, panel } from '../../kit.js';

const BETA = 100, ISAT = (9 - 0.2) / 60; // gain ≈ 100, a 60 Ω bulb on 9 V

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A transistor switching a bulb, with a graph of collector current',
  steps: [
    'A transistor is an electronic switch with no moving parts.',
    'A tiny current flows into the base…',
    '…and lets a current 100 times bigger flow through.',
    'Like a small tap that opens a big gate.',
    'As a switch: enough base current turns the bulb fully on.',
    'As an amplifier: a small wiggle in makes a big wiggle out.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { Ib: 0, water: 0, graph: 1, amp: 0, wig: 0 };
    const BX = 290, BY = 270; // base bar of the symbol

    // ---------- circuit (conventional current shown in red)
    const bl = bulb(S, 330, 70, { r: 32 });
    const bat = battery(S, 470, 290, { len: 120, h: 44, label: '9 V' });
    bat.g.setAttribute('transform', 'rotate(-90 470 290)');
    // control source on the left
    d.rect(40, 230, 90, 80, { fill: C.subtle, stroke: C.ink, roughness: 0.6 });
    d.text(85, 262, 'control', { size: 16, fill: C.ink2, mono: true });
    const ctlT = d.text(85, 288, '', { size: 16, fill: C.accentInk, mono: true, weight: 500 });
    const rb = resistor(S, 190, BY, { len: 60, lead: 14, bands: ['brown', 'black', 'red', 'gold'] });
    wire(S, [[130, BY], rb.a], { r: 0 });
    wire(S, [rb.b, [BX, BY]], { r: 0 });
    wire(S, [[85, 310], [85, 420], [470, 420], [470, 354]]);
    wire(S, [[470, 216], [470, 140], [bl.right[0], 140], bl.right]);
    wire(S, [bl.left, [bl.left[0], 140], [330, 140], [330, 228], [BX + 2, 250]], { r: 6 });
    wire(S, [[BX + 2, 290], [330, 312], [330, 420]], { r: 6 });
    // NPN symbol
    d.circle(316, 270, 96, { fill: 'none', stroke: C.ink, strokeWidth: 2 });
    d.line(BX, 236, BX, 304, { strokeWidth: 5, roughness: 0.3 });
    d.poly([[330, 312], [312, 309], [322, 296]], { fill: C.ink, roughness: 0.2 });
    const cbe = d.g(S.layers.top);
    d.into(cbe, () => {
      d.text(352, 214, 'C', { size: 22, fill: C.ink, weight: 500 });
      d.text(268, 246, 'B', { size: 22, fill: C.ink, weight: 500 });
      d.text(352, 330, 'E', { size: 22, fill: C.ink, weight: 500 });
      d.text(352, 180, 'collector', { size: 15, fill: C.muted, mono: true, anchor: 'start' });
      d.text(228, 214, 'base', { size: 15, fill: C.muted, mono: true });
      d.text(352, 372, 'emitter', { size: 15, fill: C.muted, mono: true, anchor: 'start' });
    });
    const fBase = S.flow(pathOf([[130, BY], [BX, BY], [BX + 6, 288], [330, 312], [330, 420], [85, 420], [85, 310]]), { gap: 30, r: 4.5, color: C.accent, speed: 0, on: false, parent: S.layers.back });
    const fMain = S.flow(pathOf([[470, 216], [470, 140], [bl.right[0], 140], bl.right, bl.left, [bl.left[0], 140], [330, 140], [330, 228], [BX + 6, 252], [BX + 6, 288], [330, 312], [330, 420], [470, 420], [470, 354]]), { gap: 26, r: 6.5, color: C.accent, speed: 0, on: false, parent: S.layers.back });
    d.text(60, 450, 'red dots: current, from + to −', { size: 15, fill: C.accentInk, mono: true, anchor: 'start' });

    // ---------- right: Ic vs Ib graph
    const RX = 540;
    const gG = d.g();
    panel(S, RX - 10, 40, 270, 410);
    const gr = graph(S, RX + 40, 110, 200, 220, { xMax: 2e-3, yMax: 0.17, xLabel: 'base current', yLabel: 'big current', xTicks: [[0, '0'], [1e-3, '1 mA'], [2e-3, '2']], yTicks: [[0.1, '100m']], parent: gG });
    gr.line((x) => Math.min(BETA * x, ISAT), { color: C.ink, width: 3 });
    const gdot = gr.dot(C.accent);
    d.into(gG, () => {
      d.text(gr.px(0.00095), gr.py(0.05), 'amplifies', { size: 15, fill: C.muted, mono: true, anchor: 'start' });
      d.text(gr.px(1.75e-3), gr.py(ISAT) - 18, 'fully on', { size: 15, fill: C.muted, mono: true });
    });
    const gainT = d.text(RX + 130, 420, '', { size: 18, fill: C.ink, mono: true, parent: gG });

    // ---------- right: water analogy
    const wG = d.g(undefined, { opacity: 0 });
    let gate, paddle;
    const bigDots = [], smallDots = [];
    d.into(wG, () => {
      d.rect(RX, 50, 250, 390, { fill: '#fff', stroke: 'none', roughness: 0.2 });
      panel(S, RX - 10, 40, 270, 410, { parent: wG });
      d.rect(RX + 10, 290, 230, 60, { fill: '#e6edff', stroke: '#7b8db8', strokeWidth: 3, roughness: 0.5 });
      d.rect(RX + 96, 120, 18, 170, { fill: '#e6edff', stroke: '#7b8db8', strokeWidth: 2, roughness: 0.5 });
      gate = d.g(wG);
      d.into(gate, () => d.rect(RX + 140, 286, 16, 68, { fill: C.ink2, stroke: C.ink, roughness: 0.3 }));
      paddle = d.g(wG);
      d.into(paddle, () => { d.line(RX + 105, 270, RX + 148, 250, { strokeWidth: 3 }); });
      for (let i = 0; i < 12; i++) bigDots.push(d.el('circle', { r: 7, fill: C.blue }, wG));
      for (let i = 0; i < 6; i++) smallDots.push(d.el('circle', { r: 4, fill: C.blue }, wG));
      d.text(RX + 105, 100, 'small flow (base)', { size: 16, fill: C.ink2, mono: true });
      d.text(RX + 125, 384, 'big flow (collector)', { size: 16, fill: C.ink2, mono: true });
    });

    // ---------- right: amplifier scopes
    const aG = d.g(undefined, { opacity: 0 });
    const inP = d.el('path', { fill: 'none', stroke: C.iris, 'stroke-width': 3 }, aG);
    const outP = d.el('path', { fill: 'none', stroke: C.accent, 'stroke-width': 3.5 }, aG);
    d.into(aG, () => {
      d.rect(RX, 50, 250, 390, { fill: '#fff', stroke: 'none', roughness: 0.2 });
      panel(S, RX - 10, 40, 270, 410, { parent: aG });
      d.text(RX + 125, 76, 'in: base current', { size: 16, fill: C.irisInk, mono: true });
      d.line(RX + 15, 150, RX + 235, 150, { stroke: C.line2, strokeWidth: 1.2 });
      d.text(RX + 125, 236, 'out: bulb current (× 100)', { size: 16, fill: C.accentInk, mono: true });
      d.line(RX + 15, 380, RX + 235, 380, { stroke: C.line2, strokeWidth: 1.2 });
    });
    aG.appendChild(inP); aG.appendChild(outP);

    const ibS = S.ui.slider({ label: 'Base', min: 0, max: 2, step: 0.05, value: 0, format: (v) => `${v.toFixed(2)} mA`, onInput: (v) => (st.Ib = v / 1000) });
    const rdC = S.ui.readout({ label: 'Bulb current', color: C.accent });

    let ph = 0;
    S.onTick((dt, t) => {
      ph += dt;
      const Ib = clamp(st.Ib + st.wig * 0.3e-3 * Math.sin(ph * 2.4), 0, 2e-3);
      const Ic = Math.min(BETA * Ib, ISAT);
      bl.set((Ic / ISAT) ** 2 * 1.1);
      fBase.set(Ib > 1e-5); fBase.setSpeed(30 + Ib * 30000);
      fMain.set(Ic > 1e-3); fMain.setSpeed(30 + Ic * 1400);
      ctlT.textContent = si(Ib, 'A');
      gdot.at(Ib, Ic);
      gainT.textContent = Ib > 1e-5 ? (Ic >= ISAT * 0.999 ? 'fully on (saturated)' : `${si(Ic, 'A')} ÷ ${si(Ib, 'A')} = ${Math.round(Ic / Ib)}×`) : 'no base current: off';
      rdC.set(si(Ic, 'A'));
      gG.setAttribute('opacity', st.graph.toFixed(3));
      wG.setAttribute('opacity', st.water.toFixed(3));
      const open = Ic / ISAT;
      S.at(gate, 0, -open * 62);
      paddle.setAttribute('transform', `rotate(${(-open * 18).toFixed(1)} ${RX + 105} 270)`);
      bigDots.forEach((b, i) => { const x = RX + 16 + (((i / 12) + t * open * 0.5) % 1) * 220; b.setAttribute('cx', x.toFixed(1)); b.setAttribute('cy', 320 + Math.sin(i * 2.1) * 14); b.setAttribute('opacity', open > 0.02 || x < RX + 140 ? 1 : 0.3); });
      smallDots.forEach((b, i) => { const y = 124 + (((i / 6) + t * (Ib / 2e-3) * 0.6) % 1) * 150; b.setAttribute('cy', y.toFixed(1)); b.setAttribute('cx', RX + 105); b.setAttribute('opacity', Ib > 1e-5 ? 1 : 0); });
      aG.setAttribute('opacity', st.amp.toFixed(3));
      if (st.amp > 0.01) {
        let a = '', b = '';
        for (let k = 0; k <= 60; k++) {
          const tt = ph - (60 - k) * 0.05, ib = clamp(st.Ib + st.wig * 0.3e-3 * Math.sin(tt * 2.4), 0, 2e-3), ic = Math.min(BETA * ib, ISAT);
          const x = RX + 15 + k * (220 / 60);
          a += `${k ? 'L' : 'M'}${x.toFixed(1)} ${(150 - (ib - st.Ib) * 40000).toFixed(1)}`;
          b += `${k ? 'L' : 'M'}${x.toFixed(1)} ${(380 - ic * 900).toFixed(1)}`;
        }
        inP.setAttribute('d', a); outP.setAttribute('d', b);
      }
    }, { essential: true });

    return {
      step(i) {
        S.to(st, { water: i === 3 ? 1 : 0, amp: i === 5 ? 1 : 0, graph: i === 3 || i === 5 ? 0 : 1, wig: i === 5 ? 1 : 0 }, 0.5);
        if (i === 0) ibS.set(0);
        if (i === 1) { ibS.set(0); S.play(async (w) => { await w(0.6); await S.hand.slide(ibS, 0.5, 1.4); await w(0.4); S.hand.hide(); }); }
        if (i === 2) ibS.set(0.5);
        if (i === 3) { ibS.set(0.2); S.play(async (w) => { await w(0.8); await S.hand.slide(ibS, 1.2, 1.8); await w(0.4); S.hand.hide(); }); }
        if (i === 4) { ibS.set(0.3); S.play(async (w) => { await w(0.6); await S.hand.slide(ibS, 2, 1.4); await w(0.4); S.hand.hide(); }); }
        if (i === 5) ibS.set(0.7);
      },
    };
  },
});
