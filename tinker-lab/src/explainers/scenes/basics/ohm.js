// Ohm's law: a power supply, an optional LED, a resistor and a 100 mA fuse, with live sliders.
import { scene, si, clamp } from '../../engine.js';
import { wire, led, resistor, graph, pathOf } from '../../kit.js';

const RS = [47, 100, 150, 200, 220, 330, 470, 1000];
const VF = 2.0; // red LED forward voltage (≈)
const FUSE = 0.1; // 100 mA fast-blow fuse
const P_MAX = 0.25; // a ¼ W resistor

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A circuit with a power supply, LED, resistor and fuse, and a graph of current against voltage',
  steps: [
    'V = I × R: the push equals the flow times the resistance.',
    'Double the voltage: the current doubles too.',
    'Double the resistance: the current halves.',
    'Add an LED: it uses about 2 V. The resistor gets the rest.',
    'Too little resistance, too much current: the fuse blows!',
    'Your turn: make the LED glow without blowing the fuse.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { V: 2, R: 100, led: 0, blown: false, I: 0 };
    const L = 70, Rt = 560, T = 130, B = 395;

    // --- power supply (bottom centre)
    d.shadow(310, 448, 220);
    d.rect(225, 352, 170, 90, { fill: C.subtle, stroke: C.ink, roughness: 0.7 });
    d.rect(250, 366, 120, 40, { fill: '#26282e', stroke: C.ink, roughness: 0.5 });
    const vText = d.text(310, 387, '', { size: 24, fill: C.yellow, mono: true, weight: 500 });
    d.text(310, 425, 'power supply', { size: 16, fill: C.muted, mono: true });
    d.circle(225, B, 20, { fill: C.accent, stroke: C.ink });
    d.circle(395, B, 20, { fill: C.ink, stroke: C.ink });
    d.text(204, B - 26, '+', { size: 26, weight: 500, fill: C.accentInk });
    d.text(416, B - 26, '−', { size: 26, weight: 500, fill: C.ink });

    // --- wires
    const ledX = 200;
    wire(S, [[215, B], [L, B], [L, T], [ledX - 9, T], [ledX - 9, T - 8]]);
    const bypass = d.g();
    wire(S, [[ledX - 9, T], [ledX + 9, T]], { parent: bypass, width: 3 });
    wire(S, [[ledX + 9, T - 20], [ledX + 9, T], [262, T]]);
    wire(S, [[418, T], [440, T]]);
    wire(S, [[500, T], [Rt, T], [Rt, B], [405, B]]);

    // --- LED (anode on the left: current enters from the + side)
    const ledG = d.g();
    const LED = led(S, ledX, 64, { color: C.accent, leg: 20, parent: ledG });
    const hot = d.text(ledX, 18, 'too much current!', { size: 18, fill: C.accentInk, weight: 500, opacity: 0 });

    // --- resistor + its heat
    const resHeat = d.glow(340, T, 70, C.accent);
    const res = resistor(S, 340, T, { len: 100, bands: ['brown', 'black', 'brown', 'gold'], lead: 22 });
    const resHot = d.text(340, T + 40, 'resistor overheating', { size: 16, fill: C.accentInk, opacity: 0 });

    // --- fuse (glass tube, thin wire)
    d.rect(440, T - 12, 60, 24, { fill: 'rgba(36,86,245,0.05)', stroke: C.ink, strokeWidth: 1.8, roughness: 0.5 });
    d.rect(436, T - 14, 12, 28, { fill: '#c7c9cf', stroke: C.ink, strokeWidth: 1.6, roughness: 0.4 });
    d.rect(492, T - 14, 12, 28, { fill: '#c7c9cf', stroke: C.ink, strokeWidth: 1.6, roughness: 0.4 });
    const fuseWire = d.el('path', { d: `M448 ${T} q13 -6 26 0 q13 6 26 0`, stroke: C.ink2, 'stroke-width': 1.6, fill: 'none' });
    const fuseBroken = d.g(undefined, { opacity: 0 });
    d.into(fuseBroken, () => {
      d.el('path', { d: `M448 ${T} q8 -5 15 -3`, stroke: C.ink2, 'stroke-width': 1.6, fill: 'none' });
      d.el('path', { d: `M486 ${T + 2} q8 3 14 -2`, stroke: C.ink2, 'stroke-width': 1.6, fill: 'none' });
      d.ellipse(472, T, 30, 14, { fill: 'rgba(12,12,14,0.18)', stroke: 'none', roughness: 1.4 });
    });
    d.text(470, T - 34, '100 mA fuse', { size: 16, fill: C.muted, mono: true });
    const spark = d.g(S.layers.fx, { opacity: 0 });
    d.into(spark, () => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        d.line(470 + Math.cos(a) * 14, T + Math.sin(a) * 14, 470 + Math.cos(a) * 34, T + Math.sin(a) * 34, { stroke: i % 2 ? C.yellow : C.accent, strokeWidth: 3, roughness: 0.4 });
      }
    });

    // --- electrons (they leave the − terminal and return to +)
    const flowPath = pathOf([[405, B], [Rt, B], [Rt, T], [L, T], [L, B], [215, B]], 14);
    const fl = S.flow(flowPath, { gap: 30, speed: 0, parent: S.layers.back, r: 5 });
    d.text(Rt + 22, 262, 'electrons', { size: 16, fill: C.blue, anchor: 'start', mono: true });
    d.arrow(Rt + 14, 300, Rt + 14, 230, { stroke: C.blue, strokeWidth: 2, head: 9 });

    // --- formula and graph (right)
    const fx = 690;
    const formula = d.text(fx, 46, 'V = I × R', { size: 40, weight: 400, fill: C.ink });
    const fNums = d.text(fx, 88, '', { size: 18, fill: C.ink2, mono: true });
    const gr = graph(S, 616, 160, 150, 190, { xMax: 12, yMax: 0.12, xLabel: 'volts', yLabel: 'current', xTicks: [[0, '0'], [6, '6'], [12, '12']], yTicks: [[0.05, '50m'], [0.1, '100m']] });
    gr.line([[0, FUSE], [12, FUSE]], { color: C.accent, width: 1.6, dash: '5 5', parent: gr.g });
    d.text(766, gr.py(FUSE) - 12, 'fuse', { size: 15, fill: C.accentInk, anchor: 'end', mono: true });
    const curve = gr.line(() => 0, { color: C.ink, width: 3 });
    const dot = gr.dot(C.blue);

    // --- controls
    const vS = S.ui.slider({ label: 'Voltage', min: 0, max: 12, step: 0.5, value: st.V, format: (v) => `${v.toFixed(1)} V`, onInput: (v) => { st.V = v; } });
    const rS = S.ui.slider({ label: 'Resistor', min: 0, max: RS.length - 1, step: 1, value: RS.indexOf(st.R), format: (i) => si(RS[i], 'Ω'), onInput: (i) => { st.R = RS[i]; } });
    const ledT = S.ui.toggle({ label: 'LED', value: false, onChange: (on) => S.to(st, { led: on ? 1 : 0 }, 0.5) });
    const iR = S.ui.readout({ label: 'Current', color: C.blue });
    const fix = S.ui.button({ label: 'New fuse', icon: 'rotate-ccw', onClick: () => { st.blown = false; } }).show(false);

    const bands = (R) => {
      const s = String(R), m = s.length - 2;
      const names = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'];
      return [names[+s[0]], names[+s[1]], names[m], 'gold'];
    };
    let lastR = 0, sparkT = 0, lastCurve = '';
    S.onTick((dt, t) => {
      const ledIn = st.led > 0.5;
      const drop = ledIn ? VF : 0;
      let I = Math.max(0, (st.V - drop) / st.R);
      if (I > FUSE && !st.blown) { st.blown = true; sparkT = 1; S.toast?.('Pop! The fuse blew and broke the circuit.'); }
      if (st.blown) I = 0;
      st.I = I;
      // visuals
      vText.textContent = `${st.V.toFixed(1)} V`;
      if (st.R !== lastR) { res.setBands(bands(st.R)); lastR = st.R; }
      ledG.setAttribute('opacity', st.led.toFixed(2));
      bypass.setAttribute('opacity', (1 - st.led).toFixed(2));
      LED.set(ledIn ? clamp(I / 0.02) : 0);
      hot.setAttribute('opacity', ledIn && I > 0.03 ? (0.6 + 0.4 * Math.sin(t * 8)).toFixed(2) : 0);
      const P = I * I * st.R;
      resHeat.setAttribute('opacity', clamp((P - P_MAX) / P_MAX).toFixed(2));
      resHot.setAttribute('opacity', P > P_MAX ? 1 : 0);
      fuseWire.setAttribute('opacity', st.blown ? 0 : 1);
      fuseBroken.setAttribute('opacity', st.blown ? 1 : 0);
      sparkT = Math.max(0, sparkT - dt * 1.6);
      spark.setAttribute('opacity', sparkT.toFixed(2));
      spark.setAttribute('transform', `translate(470 ${T}) scale(${(1 + (1 - sparkT) * 0.6).toFixed(2)}) translate(-470 ${-T})`);
      fix.show(st.blown);
      fl.set(I > 0.0005);
      fl.setSpeed(40 + I * 1400);
      const vr = st.V - (ledIn && I > 0 ? VF : ledIn ? st.V : 0);
      fNums.textContent = st.blown ? 'fuse blown: no current' : `${Math.max(0, vr).toFixed(1)} V = ${si(I, 'A')} × ${si(st.R, 'Ω')}`;
      iR.set(si(I, 'A'));
      const key = `${st.R}|${ledIn}`;
      if (key !== lastCurve) { lastCurve = key; curve.setAttribute('d', gr.dOf((v) => Math.max(0, (v - drop) / st.R))); }
      dot.at(st.V, Math.min(I, 0.12));
      formula.setAttribute('fill', st.blown ? C.muted : C.ink);
    }, { essential: true });

    const setR = (R) => rS.set(RS.indexOf(R));
    return {
      step(i) {
        if (i <= 2) { ledT.set(false); }
        if (i === 0) { st.blown = false; vS.set(2); setR(100); }
        if (i === 1) { st.blown = false; vS.set(2); setR(100); S.play(async (w) => { await w(0.6); await S.hand.slide(vS, 4); await w(0.4); S.hand.hide(); }); }
        if (i === 2) { st.blown = false; vS.set(4); setR(100); S.play(async (w) => { await w(0.6); await S.hand.slide(rS, RS.indexOf(200)); await w(0.4); S.hand.hide(); }); }
        if (i === 3) { st.blown = false; vS.set(4); setR(100); S.play(async (w) => { await w(0.5); await S.hand.press(ledT.el); ledT.set(true); await w(0.5); S.hand.hide(); }); }
        if (i === 4) { st.blown = false; ledT.set(true); vS.set(8); setR(220); S.play(async (w) => { await w(0.6); await S.hand.slide(rS, 0, 1.6); await w(0.6); S.hand.hide(); }); }
        if (i === 5) { st.blown = false; ledT.set(true); vS.set(5); setR(150); }
      },
    };
  },
});
