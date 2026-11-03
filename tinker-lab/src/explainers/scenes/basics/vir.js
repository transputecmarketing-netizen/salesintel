// Voltage, current and resistance: a live circuit beside its "energy hill".
import { scene, si } from '../../engine.js';
import { wire, battery, resistor, pathOf, panel } from '../../kit.js';

const RS = [100, 220, 470, 1000];
const sup = (n) => String(n).replace(/[-0-9]/g, (c) => '⁻⁰¹²³⁴⁵⁶⁷⁸⁹'['-0123456789'.indexOf(c)]);
const sci = (v) => { const e = Math.floor(Math.log10(v)); return `${(v / 10 ** e).toFixed(1)} × 10${sup(e)}`; };

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A battery and resistor circuit with an energy-hill picture of voltage',
  steps: [
    'Voltage is the push: the battery lifts electrons up an energy hill.',
    'More volts: a taller hill and a harder push.',
    'Current is the flow: how many electrons pass each second.',
    'Resistance slows the flow, like a long, bumpy slope.',
    'Your turn: change the push and the resistance. Watch the flow.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { V: 4.5, R: 220, count: 0 };
    const B = 400, T = 110, L = 50, Rr = 350;

    // ---------- the circuit
    const bat = battery(S, 200, B, { label: '', len: 130 });
    const vLab = d.text(186, B + 1, '', { size: 18, fill: '#fff', mono: true, weight: 500 });
    const res = resistor(S, 200, T, { len: 92, lead: 22, bands: ['red', 'red', 'brown', 'gold'] });
    wire(S, [bat.minus, [L, B], [L, T], res.a]);
    wire(S, [res.b, [Rr, T], [Rr, B], bat.plus]);
    const flowD = pathOf([bat.minus, [L, B], [L, T], [Rr, T], [Rr, B], bat.plus]);
    const fl = S.flow(flowD, { gap: 34, r: 6.5, parent: S.layers.back });
    // the counter: a gate on the wire that counts electrons going by
    const gate = d.g(S.layers.top);
    d.into(gate, () => {
      d.ellipse(L, 255, 58, 22, { stroke: C.iris, strokeWidth: 3, fill: 'none' });
      d.text(L + 40, 236, 'electrons per second', { size: 15, fill: C.irisInk, anchor: 'start', mono: true });
    });
    const countT = d.text(L + 40, 262, '', { size: 21, fill: C.ink, anchor: 'start', mono: true, weight: 500, parent: gate });
    const gateGlow = d.glow(L, 255, 60, C.iris);
    d.text(200, T - 40, 'resistor', { size: 19, fill: C.muted, mono: true });
    d.text(200, B + 46, 'battery', { size: 19, fill: C.muted, mono: true });

    // ---------- the energy hill (same loop, drawn by height = energy)
    panel(S, 410, 40, 380, 420);
    d.text(600, 70, 'the same loop, as an energy hill', { size: 18, fill: C.muted, mono: true });
    const hillG = d.g();
    const HX0 = 470, HX1 = 580, HX2 = 742, HB = 420;
    let hfl = null, key = '';
    const hillPts = (h, R) => {
      const pts = [[HX0, HB], [HX0, HB - h], [HX1, HB - h]];
      const n = 24, bump = 3 + (R / 1000) * 12;
      for (let i = 1; i <= n; i++) {
        const f = i / n;
        pts.push([HX1 + (HX2 - HX1) * f, HB - h + h * f + (i < n ? Math.sin(i * 2.1) * bump : 0)]);
      }
      pts.push([HX0 + 6, HB]);
      return pts;
    };
    const drawHill = () => {
      const h = 50 + (st.V / 9) * 250;
      d.seed = 900;
      d.redraw(hillG, () => {
        const pts = hillPts(h, st.R);
        d.lines(pts.slice(2, -1), { stroke: C.ink, strokeWidth: 3, roughness: 0.4 });
        d.line(HX1, HB - h, HX0, HB - h, { strokeWidth: 3, roughness: 0.4 });
        d.line(HX2, HB, HX0, HB, { strokeWidth: 3, roughness: 0.4 });
        // the lift (battery): a ladder of steps
        d.rect(HX0 - 18, HB - h, 36, h, { fill: C.accentSoft, stroke: C.accent, strokeWidth: 2.2, roughness: 0.6 });
        for (let y = HB - 12; y > HB - h + 6; y -= 18) d.line(HX0 - 18, y, HX0 + 18, y, { stroke: C.accent, strokeWidth: 1.4, roughness: 0.4 });
        d.text(HX0 - 28, HB - h / 2, 'battery lifts', { size: 17, anchor: 'end', fill: C.accentInk, mono: true, baseline: 'middle' });
        d.text((HX0 + HX1) / 2 + 10, HB - h - 16, 'wire', { size: 16, fill: C.muted, mono: true });
        d.text((HX1 + HX2) / 2 + 22, HB - h / 2 - 22, 'resistor', { size: 17, fill: C.ink2, mono: true, anchor: 'start' });
        d.arrow(HX2 + 26, HB, HX2 + 26, HB - h, { stroke: C.accent, strokeWidth: 2.2, head: 10 });
        d.text(HX2 + 26, HB - h - 16, `${st.V.toFixed(1)} V`, { size: 18, fill: C.accentInk, mono: true, weight: 500 });
        d.text((HX0 + HX2) / 2, HB + 22, '0 V', { size: 15, fill: C.muted, mono: true });
      });
      hfl?.remove();
      hfl = S.flow(pathOf(hillPts(h, st.R), 4), { gap: 32, r: 6.5, speed: fl.speed });
    };

    const vS = S.ui.slider({ label: 'Voltage', min: 1.5, max: 9, step: 1.5, value: st.V, format: (v) => `${v.toFixed(1)} V`, onInput: (v) => (st.V = v) });
    const rS = S.ui.slider({ label: 'Resistance', min: 0, max: 3, step: 1, value: 1, format: (i) => si(RS[i], 'Ω'), onInput: (i) => (st.R = RS[i]) });
    const rdI = S.ui.readout({ label: 'Current', color: C.blue });

    const names = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'];
    let lastR = 0;
    S.onTick((dt, t) => {
      const I = st.V / st.R;
      const k = `${st.V}|${st.R}`;
      if (k !== key) { key = k; drawHill(); }
      if (st.R !== lastR) { lastR = st.R; const s = String(st.R); res.setBands([names[+s[0]], names[+s[1]], names[s.length - 2], 'gold']); }
      const sp = 22 + I * 2400;
      fl.setSpeed(sp); hfl?.setSpeed(sp * 0.9);
      vLab.textContent = `${st.V.toFixed(1)} V`;
      countT.textContent = `${sci(I / 1.602e-19)}`;
      gateGlow.setAttribute('opacity', (st.count * (0.6 + 0.4 * Math.sin(t * 5))).toFixed(3));
      rdI.set(si(I, 'A'));
    }, { essential: true });

    return {
      step(i) {
        S.to(st, { count: i === 2 ? 1 : 0 }, 0.5);
        if (i === 0) { vS.set(4.5); rS.set(1); }
        if (i === 1) { vS.set(3); rS.set(1); S.play(async (w) => { await w(0.6); await S.hand.slide(vS, 9, 1.6); await w(0.4); S.hand.hide(); }); }
        if (i === 2) { vS.set(4.5); rS.set(1); }
        if (i === 3) { vS.set(6); rS.set(0); S.play(async (w) => { await w(0.6); await S.hand.slide(rS, 3, 1.6); await w(0.4); S.hand.hide(); }); }
      },
    };
  },
});
