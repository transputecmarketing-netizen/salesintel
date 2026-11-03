// Capacitors: charge piles onto plates, the RC curve, time constant τ = R × C, in real time.
import { scene, si } from '../../engine.js';
import { wire, battery, resistor, graph, pathOf, panel } from '../../kit.js';

const RS = [1000, 4700, 10000, 22000];
const CS = [100e-6, 220e-6, 470e-6];
const VS = 5;

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A capacitor charging and discharging through a resistor, with its voltage graph',
  steps: [
    'A capacitor: two metal plates with an insulator in between.',
    'Charging: electrons pile onto one plate and leave the other.',
    'It fills fast at first, then slower and slower.',
    'After one time constant, τ = R × C, it is 63 % full.',
    'Flip the switch: it empties through the resistor the same way.',
    'Bigger R or C: slower. That is how circuits keep time.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { Vc: 0, mode: 'charge', R: 10000, C: 100e-6, t: 0, run: 0, tau: 0, labels: 1 };
    const tau = () => st.R * st.C;

    // ---------- circuit
    const bat = battery(S, 100, 265, { len: 110, h: 44, label: '5 V' });
    bat.g.setAttribute('transform', 'rotate(-90 100 265)');
    const res = resistor(S, 285, 110, { len: 84, lead: 18, bands: ['brown', 'black', 'orange', 'gold'] });
    const PX = 200, PY = 110, A = [150, 110], Bc = [165, 72];
    wire(S, [A, [100, 110], [100, 192]]);
    wire(S, [[100, 330], [100, 420], [380, 420], [380, 282]]);
    wire(S, [Bc, [165, 46], [46, 46], [46, 420], [100, 420]]);
    wire(S, [[PX, PY], res.a], { r: 0 });
    wire(S, [res.b, [380, 110], [380, 238]]);
    d.circle(A[0], A[1], 12, { fill: '#fff' }); d.circle(Bc[0], Bc[1], 12, { fill: '#fff' }); d.circle(PX, PY, 13, { fill: '#fff' });
    const lever = d.g();
    d.into(lever, () => { d.line(PX, PY, PX - 54, PY, { strokeWidth: 5, roughness: 0.4 }); d.circle(PX - 36, PY - 12, 16, { fill: C.accent, strokeWidth: 1.5 }); });
    const swLab = d.text(118, 150, 'charge', { size: 15, fill: C.accentInk, mono: true });
    const swHit = d.el('rect', { x: 130, y: 40, width: 90, height: 100, fill: 'transparent' });
    S.tap(swHit, () => modeC.set(st.mode === 'charge' ? 'discharge' : 'charge'), 'Flip the switch');
    // the capacitor: two plates
    d.rect(318, 226, 124, 12, { fill: '#9a9ca3', stroke: C.ink, strokeWidth: 1.8, roughness: 0.4 });
    d.rect(318, 282, 124, 12, { fill: '#9a9ca3', stroke: C.ink, strokeWidth: 1.8, roughness: 0.4 });
    d.rect(322, 240, 116, 40, { fill: C.yellowSoft, stroke: 'none', roughness: 0.6 });
    const capLab = d.g(S.layers.top);
    d.into(capLab, () => {
      d.text(452, 232, 'metal plate', { size: 17, anchor: 'start', fill: C.ink2 });
      d.text(452, 260, 'insulator', { size: 17, anchor: 'start', fill: C.ink2 });
      d.text(452, 288, 'metal plate', { size: 17, anchor: 'start', fill: C.ink2 });
    });
    const chG = d.g(S.layers.top);
    const plus = [], minus = [];
    for (let i = 0; i < 10; i++) {
      const x = 326 + i * 12;
      plus.push(d.text(x, 218, '+', { size: 18, fill: C.accentInk, weight: 500, parent: chG }));
      minus.push(d.el('circle', { cx: x, cy: 302, r: 5, fill: C.blue }, chG));
    }
    const fChargeTop = S.flow(pathOf([[380, 238], [380, 110], [PX, PY], A, [100, 110], [100, 196]]), { gap: 30, r: 5.5, speed: 0, on: false, parent: S.layers.back });
    const fChargeBot = S.flow(pathOf([[100, 330], [100, 420], [380, 420], [380, 296]]), { gap: 30, r: 5.5, speed: 0, on: false, parent: S.layers.back });
    const fDis = S.flow(pathOf([[380, 296], [380, 420], [46, 420], [46, 46], [165, 46], Bc, [PX, PY], [380, 110], [380, 238]]), { gap: 30, r: 5.5, speed: 0, on: false, parent: S.layers.back });

    // ---------- graph
    panel(S, 500, 40, 290, 400);
    const G = { x: 552, y: 110, w: 214, h: 230 };
    let gr = null, trace = null, pts = [], markG = null;
    const gG = d.g();
    const drawGraph = () => {
      const T = tau();
      d.seed = 5100;
      d.redraw(gG, () => {
        gr = graph(S, G.x, G.y, G.w, G.h, { xMax: 5 * T, yMax: 5.5, xLabel: 'seconds', yLabel: 'volts on the capacitor', xTicks: [[0, '0'], [T, `τ`], [5 * T, `${+(5 * T).toPrecision(2)}`]], yTicks: [[5, '5'], [0, '0']], parent: gG });
        markG = d.g(gG);
        d.into(markG, () => {
          d.line(gr.px(T), gr.py(0), gr.px(T), gr.py(5), { stroke: C.iris, strokeWidth: 1.5, roughness: 0.3 });
          d.line(gr.px(0), gr.py(VS * 0.632), gr.px(T), gr.py(VS * 0.632), { stroke: C.iris, strokeWidth: 1.5, roughness: 0.3 });
          d.text(gr.px(T) + 8, gr.py(VS * 0.632) - 12, '63 %', { size: 15, fill: C.irisInk, mono: true, anchor: 'start' });
          d.line(gr.px(0), gr.py(VS * 0.368), gr.px(T), gr.py(VS * 0.368), { stroke: C.iris, strokeWidth: 1.5, roughness: 0.3, opacity: 0.6 });
          d.text(gr.px(T) + 8, gr.py(VS * 0.368) + 14, '37 %', { size: 15, fill: C.irisInk, mono: true, anchor: 'start' });
        });
        trace = d.el('path', { fill: 'none', stroke: C.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gG);
      });
      gr.dot0 = gr.dot(C.accent, 8);
      pts = [];
    };
    drawGraph();
    const tauT = d.text(645, 400, '', { size: 18, fill: C.ink2, mono: true });

    const modeC = S.ui.choice({ options: [['charge', 'Charge'], ['discharge', 'Discharge']], value: 'charge', onChange: (v) => { st.mode = v; st.t = 0; pts = []; } });
    const rS = S.ui.slider({ label: 'R', min: 0, max: 3, step: 1, value: 2, format: (i) => si(RS[i], 'Ω'), onInput: (i) => { st.R = RS[i]; drawGraph(); st.t = 0; } });
    const cS = S.ui.slider({ label: 'C', min: 0, max: 2, step: 1, value: 0, format: (i) => si(CS[i], 'F'), onInput: (i) => { st.C = CS[i]; drawGraph(); st.t = 0; } });
    const rdV = S.ui.readout({ label: 'Capacitor', color: C.accent });

    S.onTick((dt) => {
      const T = tau(), Vs = st.mode === 'charge' ? VS : 0;
      if (st.run) {
        st.Vc = Vs + (st.Vc - Vs) * Math.exp(-dt / T);
        st.t += dt;
        if (st.t <= 5 * T * 1.02) { pts.push([st.t, st.Vc]); }
      }
      const I = Math.abs(Vs - st.Vc) / st.R;
      const sp = Math.min(260, (I / (VS / st.R)) * 200);
      const live = st.run && I > (VS / st.R) * 0.01;
      fChargeTop.set(live && st.mode === 'charge'); fChargeBot.set(live && st.mode === 'charge'); fDis.set(live && st.mode === 'discharge');
      fChargeTop.setSpeed(sp); fChargeBot.setSpeed(sp); fDis.setSpeed(sp);
      lever.setAttribute('transform', `rotate(${st.mode === 'charge' ? 0 : 47} ${PX} ${PY})`);
      swLab.textContent = st.mode; swLab.setAttribute('fill', st.mode === 'charge' ? C.accentInk : C.irisInk);
      const n = Math.round((st.Vc / VS) * 10);
      plus.forEach((p, i) => p.setAttribute('opacity', i < n ? 1 : 0));
      minus.forEach((p, i) => p.setAttribute('opacity', i < n ? 1 : 0));
      if (pts.length > 1) trace.setAttribute('d', 'M' + pts.filter((_, i) => i % 2 === 0 || i === pts.length - 1).map(([a, b]) => `${gr.px(a).toFixed(1)} ${gr.py(b).toFixed(1)}`).join(' L'));
      else trace.setAttribute('d', '');
      gr.dot0.at(Math.min(st.t, 5 * T), st.Vc);
      markG.setAttribute('opacity', st.tau.toFixed(2));
      capLab.setAttribute('opacity', st.labels.toFixed(2));
      tauT.textContent = `τ = ${si(st.R, 'Ω')} × ${si(st.C, 'F')} = ${+T.toPrecision(2)} s`;
      rdV.set(`${st.Vc.toFixed(2)} V`);
    }, { essential: true });

    const start = (mode, from) => { st.Vc = from; st.t = 0; pts = []; modeC.set(mode); st.run = 1; };
    return {
      step(i) {
        S.to(st, { tau: i >= 3 ? 1 : 0, labels: i === 0 ? 1 : 0 }, 0.5);
        if (i <= 4) { rS.set(2, false); cS.set(0, false); st.R = 10000; st.C = 100e-6; drawGraph(); }
        if (i === 0) { st.run = 0; st.Vc = 0; modeC.set('charge', false); st.mode = 'charge'; pts = []; st.t = 0; }
        if (i === 1 || i === 2 || i === 3) start('charge', 0);
        if (i === 4) { start('charge', VS * 0.995); st.run = 0; S.play(async (w) => { await w(0.8); await S.hand.tap(175, 90); start('discharge', st.Vc); await w(0.4); S.hand.hide(); }); }
        if (i === 5) { st.run = 1; start('charge', 0); }
      },
    };
  },
});
