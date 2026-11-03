// Ultrasonic echo: a 40 kHz chirp, the trip to a wall and back, distance = time × speed ÷ 2.
import { scene, clamp } from '../../engine.js';
import { arcs, panel } from '../../kit.js';

const C_SOUND = 343; // m/s in air at 20 °C
const SX = 160, SY = 220, PX_PER_CM = 590 / 200; // sensor front edge; 200 cm across the stage

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'An ultrasonic sensor timing an echo from a wall you can drag',
  steps: [
    'The sensor chirps a sound too high for us to hear: 40 kHz.',
    'The sound races out at 343 metres per second…',
    '…bounces off the wall, and the echo comes back.',
    'Time there and back: distance = time × speed ÷ 2.',
    'Drag the wall: a longer trip means a longer echo.',
    'Bats, ships and parking sensors all use the same trick.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { wall: SX + 100 * PX_PER_CM, t: 0, run: 1, out: 1, back: 0, math: 0, bats: 0 };
    const V = 170; // animation speed of the wavefront in px/s (real sound is far faster)

    // ---------- the HC-SR04-style sensor
    d.shadow(100, 330, 170);
    d.rect(40, 130, 112, 180, { fill: C.blue, stroke: C.ink, roughness: 0.6 });
    for (const [y, t] of [[180, 'T'], [262, 'R']]) {
      d.circle(118, y, 66, { fill: '#c7c9cf', stroke: C.ink, strokeWidth: 2 });
      d.circle(118, y, 40, { fill: '#9a9ca3', fillStyle: 'cross-hatch', hachureGap: 4, stroke: C.ink, strokeWidth: 1.4 });
      d.text(64, y, t, { size: 18, fill: '#fff', mono: true, weight: 500 });
    }
    d.text(96, 350, 'T: speaker   R: microphone', { size: 14, fill: C.muted, mono: true });
    // ---------- the wall
    const wallG = d.g();
    d.into(wallG, () => {
      d.rect(0, 90, 34, 270, { fill: C.subtle2, fillStyle: 'hachure', hachureGap: 7, stroke: C.ink, strokeWidth: 2 });
      d.circle(17, 70, 26, { fill: C.accent, stroke: C.ink, strokeWidth: 1.5 });
      d.path('M10 70 h14 M17 63 v14', { stroke: '#fff', strokeWidth: 2.5, roughness: 0 });
    });
    const wallHit = d.el('rect', { x: -30, y: 40, width: 94, height: 330, fill: 'transparent' }, wallG);
    S.drag(wallHit, { move: (x) => { st.wall = clamp(x, SX + 30, SX + 200 * PX_PER_CM); st.t = 0; } });
    // ---------- wavefronts
    const outA = arcs(S, 152, 180, { n: 4, gap: 14, spread: 0.55, color: C.iris, width: 3.5 });
    const backA = arcs(S, 0, SY, { n: 4, gap: 14, spread: 0.55, color: C.accent, width: 3.5, angle: Math.PI });
    // the distance ruler
    const ruler = d.g();
    const distT = d.text(0, 392, '', { size: 22, fill: C.ink, mono: true, weight: 500 });
    // ---------- timeline (echo pin)
    panel(S, 40, 410, 720, 80);
    d.text(56, 432, 'echo pin', { size: 14, fill: C.muted, mono: true, anchor: 'start' });
    const pinP = d.el('path', { fill: 'none', stroke: C.ink, 'stroke-width': 3, 'stroke-linejoin': 'round' });
    const timeT = d.text(744, 432, '', { size: 16, fill: C.ink, mono: true, anchor: 'end', weight: 500 });
    const slowT = d.text(744, 476, '', { size: 13, fill: C.muted, mono: true, anchor: 'end' });
    // the formula
    const mathG = d.g(S.layers.top, { opacity: 0 });
    const mathT = d.text(470, 60, '', { size: 21, fill: C.ink, mono: true, parent: mathG });
    // bats and a parking sensor
    const batG = d.g(S.layers.top, { opacity: 0 });
    let bat;
    d.into(batG, () => {
      d.rect(150, 20, 620, 380, { fill: '#fff', stroke: 'none' });
      bat = d.g(batG);
      d.into(bat, () => {
        d.path('M0 0 C -20 -30, -60 -30, -80 -10 C -66 -8, -60 4, -54 10 C -44 0, -30 0, -20 10 C -12 2, -6 2, 0 6 C 6 2, 12 2, 20 10 C 30 0, 44 0, 54 10 C 60 4, 66 -8, 80 -10 C 60 -30, 20 -30, 0 0 Z', { fill: C.ink, stroke: C.ink, roughness: 0.5 });
        d.path('M-6 -6 l3 -8 l3 6 l3 -6 l3 8', { stroke: C.ink, strokeWidth: 2, fill: 'none' });
      });
      d.circle(640, 230, 30, { fill: C.yellow, stroke: C.ink });
      d.text(470, 330, 'bats hear their own echoes to catch insects in the dark', { size: 17, fill: C.ink2, mono: true });
      d.text(470, 360, 'cars beep closer and closer as you reverse', { size: 17, fill: C.ink2, mono: true });
    });
    const batArc = arcs(S, 0, 0, { n: 3, gap: 14, spread: 0.5, color: C.iris, parent: batG });

    const rdD = S.ui.readout({ label: 'Distance', color: C.ink });
    const rdT = S.ui.readout({ label: 'Echo time', color: C.accent });

    let bt = 0;
    S.onTick((dt) => {
      const wx = st.wall;
      S.at(wallG, wx, 0);
      const Dpx = wx - 152, cm = (wx - SX) / PX_PER_CM, m = cm / 100;
      const echoUs = (2 * m / C_SOUND) * 1e6;
      const total = (2 * Dpx) / V;
      if (st.run) { st.t += dt; if (st.t > total + 1.1) st.t = 0; }
      const r = st.t * V;
      outA.set(r <= Dpx + 30 ? r : -1, st.out * (r <= Dpx ? 1 : clamp(1 - (r - Dpx) / 30)));
      const rb = r - Dpx;
      backA.g.setAttribute('transform', `translate(${wx} 0)`);
      backA.set(rb > 0 && rb < Dpx + 30 ? rb : -1, st.back * (rb < Dpx ? 1 : clamp(1 - (rb - Dpx) / 30)));
      // ruler
      d.seed = 70;
      d.redraw(ruler, () => {
        d.line(SX, 380, wx, 380, { stroke: C.ink2, strokeWidth: 1.6, roughness: 0.3 });
        d.line(SX, 372, SX, 388, { stroke: C.ink2, strokeWidth: 1.6, roughness: 0.2 });
        d.line(wx, 372, wx, 388, { stroke: C.ink2, strokeWidth: 1.6, roughness: 0.2 });
      });
      distT.setAttribute('x', (SX + wx) / 2); distT.textContent = `${cm.toFixed(0)} cm`;
      // echo pin trace: HIGH from the chirp until the echo is heard
      const x0 = 150, x1 = 720, k = clamp(st.t / total), span = (x1 - x0) * 0.8;
      const hi = 444, lo = 476, xe = x0 + span;
      const xNow = x0 + span * Math.min(1.25, st.t / total);
      let pd = `M${x0 - 60} ${lo} L${x0} ${lo} L${x0} ${hi}`;
      pd += k < 1 ? ` L${xNow.toFixed(1)} ${hi}` : ` L${xe} ${hi} L${xe} ${lo} L${Math.min(x1, xNow).toFixed(1)} ${lo}`;
      pinP.setAttribute('d', pd);
      timeT.textContent = `${Math.round(echoUs * (k < 1 ? k : 1))} µs`;
      slowT.textContent = `slow motion: ${Math.round(total / (echoUs / 1e6)).toLocaleString('en')} × slower than real`;
      mathG.setAttribute('opacity', st.math.toFixed(2));
      mathT.textContent = `${Math.round(echoUs)} µs × 343 m/s ÷ 2 = ${cm.toFixed(0)} cm`;
      rdD.set(`${cm.toFixed(0)} cm`); rdT.set(`${Math.round(echoUs)} µs`);
      batG.setAttribute('opacity', st.bats.toFixed(2));
      if (st.bats > 0.01) {
        bt += dt;
        S.at(bat, 360 + Math.sin(bt * 0.8) * 30, 200 + Math.sin(bt * 1.7) * 14);
        const ph = (bt * 0.9) % 1;
        batArc.g.setAttribute('transform', `translate(${380 + Math.sin(bt * 0.8) * 30} ${196 + Math.sin(bt * 1.7) * 14})`);
        batArc.set(ph * 220, 1 - ph);
      }
    }, { essential: true });

    return {
      step(i) {
        S.to(st, { out: 1, back: i >= 2 ? 1 : 0, math: i === 3 || i === 4 ? 1 : 0, bats: i === 5 ? 1 : 0 }, 0.4);
        st.t = 0;
        if (i === 4) S.play(async (w) => {
          await w(0.6);
          const x0 = st.wall;
          await S.hand.drag(x0 + 17, 220, x0 - 160, 220, 1.6, (k) => { st.wall = x0 - 177 * k + 0; st.t = 0; });
          await w(0.3); S.hand.hide();
        });
      },
    };
  },
});
