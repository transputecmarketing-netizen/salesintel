// Thermistors and LDRs: resistance curves, and a voltage divider that turns resistance into a reading.
import { scene, si, clamp } from '../../engine.js';
import { wire, resistor, graph, panel } from '../../kit.js';

const ntc = (T) => 10000 * Math.exp(3950 * (1 / (T + 273.15) - 1 / 298.15)); // 10 kΩ at 25 °C, B = 3950
const ldr = (lux) => Math.min(1e6, 15000 * (lux / 10) ** -0.7); // a GL5528-style LDR (≈ 15 kΩ at 10 lux)

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A thermistor or light sensor in a voltage divider, with its resistance curve',
  steps: [
    'Some materials change their resistance with heat or with light.',
    'A thermistor (NTC): warmer means lower resistance.',
    'The curve drops steeply when cold, then flattens out.',
    'A light sensor (LDR): more light means lower resistance.',
    'In a divider, that change becomes a voltage the Arduino can read.',
    'Your turn: warm it, cool it, light it, darken it.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { kind: 'ntc', T: 25, L: 2, div: 0 };
    // ---------- circuit
    const X = 160;
    d.text(X, 50, '5 V', { size: 20, fill: C.accentInk, mono: true, weight: 500 });
    wire(S, [[X, 64], [X, 110]]);
    const sensG = d.g();
    wire(S, [[X, 200], [X, 260]]);
    const fixed = resistor(S, X, 310, { vertical: true, len: 70, lead: 16, bands: ['brown', 'black', 'orange', 'gold'] });
    d.text(X + 30, 310, '10 kΩ', { size: 15, fill: C.ink2, mono: true, anchor: 'start' });
    wire(S, [[X, 361], [X, 410]]);
    d.line(X - 22, 410, X + 22, 410, { strokeWidth: 3 }); d.line(X - 14, 418, X + 14, 418, { strokeWidth: 3 }); d.line(X - 6, 426, X + 6, 426, { strokeWidth: 3 });
    d.circle(X, 232, 12, { fill: C.ink });
    const divG = d.g(undefined, { opacity: 0 });
    let a0T, vT;
    d.into(divG, () => {
      wire(S, [[X, 232], [300, 232]], { parent: divG });
      d.rect(300, 192, 100, 84, { fill: '#1f6f8b', stroke: C.ink, roughness: 0.6 });
      d.text(350, 212, 'Arduino A0', { size: 12, fill: '#fff', mono: true });
      a0T = d.text(350, 246, '', { size: 26, fill: '#fff', mono: true, weight: 500 });
      vT = d.text(230, 214, '', { size: 15, fill: C.ink, mono: true });
    });
    const rT = d.text(X - 34, 155, '', { size: 15, fill: C.ink, mono: true, anchor: 'end', weight: 500 });
    // heat / light source next to the sensor
    const flame = d.g();
    d.into(flame, () => d.path('M0 0 C -24 -10, -18 -40, 0 -66 C 6 -44, 26 -36, 18 -12 C 14 -2, 6 2, 0 0 Z', { fill: C.yellow, stroke: C.accent, strokeWidth: 2.2 }));
    const ice = d.g();
    d.into(ice, () => { d.rect(-26, -50, 52, 46, { fill: C.blueSoft, stroke: C.blue, strokeWidth: 2 }); d.line(-16, -40, -4, -24, { stroke: '#fff', strokeWidth: 3 }); });
    const sun = d.g();
    const sunGlow = d.glow(0, 0, 90, C.yellow, sun);
    d.into(sun, () => { d.circle(0, 0, 44, { fill: C.yellow, stroke: C.accent, strokeWidth: 2 }); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; d.line(Math.cos(a) * 30, Math.sin(a) * 30, Math.cos(a) * 44, Math.sin(a) * 44, { stroke: C.accent, strokeWidth: 2.5 }); } });
    const darkG = d.el('rect', { x: 0, y: 0, width: 800, height: 500, fill: '#0c0c0e', opacity: 0, 'pointer-events': 'none' }, S.layers.back);
    const drawSensor = () => {
      d.seed = 333;
      d.redraw(sensG, () => {
        if (st.kind === 'ntc') {
          d.line(X, 110, X, 138, { stroke: '#9a9ca3', strokeWidth: 2.5 }); d.line(X, 172, X, 200, { stroke: '#9a9ca3', strokeWidth: 2.5 });
          d.ellipse(X, 155, 40, 50, { fill: '#6b4a2a', stroke: C.ink, strokeWidth: 2 });
          d.text(X + 34, 150, 'thermistor', { size: 15, fill: C.ink2, mono: true, anchor: 'start' });
        } else {
          d.line(X, 110, X, 124, { stroke: '#9a9ca3', strokeWidth: 2.5 }); d.line(X, 186, X, 200, { stroke: '#9a9ca3', strokeWidth: 2.5 });
          d.circle(X, 155, 62, { fill: '#e6b85c', stroke: C.ink, strokeWidth: 2 });
          d.path(`M${X - 20} 140 h40 M${X - 20} 150 h40 M${X - 20} 160 h40 M${X - 20} 170 h40`, { stroke: '#8a2a1a', strokeWidth: 3, roughness: 0.6 });
          d.text(X + 40, 150, 'light sensor (LDR)', { size: 15, fill: C.ink2, mono: true, anchor: 'start' });
        }
      });
    };
    drawSensor();

    // ---------- graph
    panel(S, 450, 40, 330, 420);
    const gG = d.g();
    let gr = null, dot = null;
    const drawGraph = () => {
      d.seed = 777;
      d.redraw(gG, () => {
        if (st.kind === 'ntc') {
          gr = graph(S, 510, 100, 230, 260, { xMin: -10, xMax: 80, yMax: 60000, xLabel: 'temperature (°C)', yLabel: 'resistance', xTicks: [[0, '0'], [25, '25'], [50, '50'], [80, '80']], yTicks: [[10000, '10k'], [30000, '30k'], [60000, '60k']], parent: gG });
          gr.line(ntc, { color: C.accent, width: 4 });
        } else {
          gr = graph(S, 510, 100, 230, 260, { xMin: -1, xMax: 4, yMin: 2, yMax: 6, xLabel: 'light (lux, log scale)', yLabel: 'resistance (log)', xTicks: [[-1, '0.1'], [1, '10'], [3, '1000']], yTicks: [[3, '1k'], [4, '10k'], [5, '100k'], [6, '1M']], parent: gG });
          gr.line((x) => Math.log10(ldr(10 ** x)), { color: C.iris, width: 4 });
        }
        dot = gr.dot(C.ink, 9);
      });
    };
    drawGraph();

    const kindC = S.ui.choice({ options: [['ntc', 'Thermistor'], ['ldr', 'Light sensor']], value: 'ntc', onChange: (v) => { st.kind = v; drawSensor(); drawGraph(); } });
    const tS = S.ui.slider({ label: 'Temp', min: -10, max: 80, step: 1, value: 25, format: (v) => `${v} °C`, onInput: (v) => (st.T = v) });
    const lS = S.ui.slider({ label: 'Light', min: -1, max: 4, step: 0.1, value: 2, format: (v) => `${si(10 ** v, '')} lux`, onInput: (v) => (st.L = v) });
    const rdR = S.ui.readout({ label: 'Resistance', color: C.ink });

    S.onTick(() => {
      const R = st.kind === 'ntc' ? ntc(st.T) : ldr(10 ** st.L);
      rT.textContent = si(R, 'Ω');
      rdR.set(si(R, 'Ω'));
      if (st.kind === 'ntc') dot.at(st.T, R); else dot.at(st.L, Math.log10(R));
      const hot = clamp((st.T - 25) / 55), cold = clamp((25 - st.T) / 35);
      const ntcOn = st.kind === 'ntc';
      flame.setAttribute('transform', `translate(${X - 90} 200) scale(${(0.5 + hot).toFixed(2)})`); flame.setAttribute('opacity', ntcOn ? hot.toFixed(2) : 0);
      ice.setAttribute('transform', `translate(${X - 90} 190)`); ice.setAttribute('opacity', ntcOn ? cold.toFixed(2) : 0);
      const lit = clamp((st.L + 1) / 5);
      S.at(sun, X - 100, 110, 0, 0.5 + lit * 0.6); sun.setAttribute('opacity', ntcOn ? 0 : (0.25 + lit * 0.75).toFixed(2)); sunGlow.setAttribute('opacity', lit.toFixed(2));
      darkG.setAttribute('opacity', ntcOn ? 0 : ((1 - lit) * 0.12).toFixed(3));
      tS.show(ntcOn); lS.show(!ntcOn);
      const V = (5 * 10000) / (R + 10000);
      divG.setAttribute('opacity', st.div.toFixed(2));
      vT.textContent = `${V.toFixed(2)} V`;
      a0T.textContent = String(Math.round((V / 5) * 1023));
    }, { essential: true });

    return {
      step(i) {
        S.to(st, { div: i >= 4 ? 1 : 0 }, 0.5);
        if (i <= 2) { kindC.set('ntc'); tS.set(i === 1 ? 10 : 25); }
        if (i === 1) S.play(async (w) => { await w(0.6); await S.hand.slide(tS, 70, 1.8); await w(0.4); S.hand.hide(); });
        if (i === 2) S.play(async (w) => { await w(0.4); tS.set(-10); await S.hand.slide(tS, 80, 3); await w(0.4); S.hand.hide(); });
        if (i === 3) { kindC.set('ldr'); lS.set(0); S.play(async (w) => { await w(0.6); await S.hand.slide(lS, 3.5, 1.8); await w(0.4); S.hand.hide(); }); }
        if (i === 4) { kindC.set('ntc'); tS.set(25); }
      },
    };
  },
});
