// PIR motion sensor: body heat, two sensing halves, Fresnel-lens zones and a signal that only reacts to change.
import { scene, clamp } from '../../engine.js';
import { panel } from '../../kit.js';

const NZ = 10; // detection zones fanned out by the lens
const SX = 400, SY = 470, A0 = -Math.PI / 2 - 0.95, A1 = -Math.PI / 2 + 0.95; // about 110° wide

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A PIR sensor watching zones in a room as a warm person walks across',
  steps: [
    'Warm bodies glow with infrared light that we cannot see.',
    'A PIR sensor has two halves that look side by side.',
    'Its dome, a Fresnel lens, splits the room into many zones.',
    'Walk across: each half sees the heat at a different moment.',
    'That change flips the output HIGH: motion detected!',
    'Stand still and the signal goes quiet. No change, no alarm.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { zones: 0, inset: 0, heat: 1, walk: 0, x: 140, sig: 0, out: 0, hold: 0, trace: 0, graph: 0 };
    // ---------- zones
    const zG = d.g(S.layers.back, { opacity: 0 });
    for (let k = 0; k < NZ; k++) {
      const a = A0 + ((A1 - A0) * k) / NZ, b = A0 + ((A1 - A0) * (k + 1)) / NZ, R = 440;
      d.el('path', { d: `M${SX} ${SY} L${SX + Math.cos(a) * R} ${SY + Math.sin(a) * R} A${R} ${R} 0 0 1 ${SX + Math.cos(b) * R} ${SY + Math.sin(b) * R} Z`, fill: k % 2 ? C.iris : C.accent, opacity: 0.09 }, zG);
      d.text(SX + Math.cos((a + b) / 2) * 400, SY + Math.sin((a + b) / 2) * 400, k % 2 ? 'B' : 'A', { size: 15, fill: k % 2 ? C.irisInk : C.accentInk, mono: true, parent: zG });
    }
    // ---------- sensor (dome on a board)
    d.rect(SX - 60, SY - 6, 120, 40, { fill: '#2e8b57', stroke: C.ink, roughness: 0.6 });
    d.path(`M${SX - 44} ${SY - 4} A44 44 0 0 1 ${SX + 44} ${SY - 4} Z`, { fill: '#f4f3ef', stroke: C.ink, strokeWidth: 2 });
    for (let i = -3; i <= 3; i++) d.line(SX + i * 11, SY - 6, SX + i * 13, SY - 38 + Math.abs(i) * 4, { stroke: C.line2, strokeWidth: 1.2, roughness: 0.4 });
    const outLed = d.glow(SX + 80, SY + 10, 40, C.accent);
    d.circle(SX + 80, SY + 10, 14, { fill: '#fff', stroke: C.ink, strokeWidth: 1.4 });
    d.text(SX + 80, SY - 16, 'OUT', { size: 13, fill: C.muted, mono: true });
    // ---------- inset: the two halves of the element
    const iG = d.g(S.layers.top, { opacity: 0 });
    let halfA, halfB;
    d.into(iG, () => {
      panel(S, 560, 300, 210, 140, { parent: iG, fill: '#fff' });
      d.rect(600, 330, 130, 80, { fill: '#2a2b31', stroke: C.ink, roughness: 0.5 });
      halfA = d.el('rect', { x: 614, y: 344, width: 46, height: 52, fill: C.accent, opacity: 0.35 }, iG);
      halfB = d.el('rect', { x: 670, y: 344, width: 46, height: 52, fill: C.iris, opacity: 0.35 }, iG);
      d.text(637, 370, 'A', { size: 20, fill: '#fff', weight: 500 }); d.text(693, 370, 'B', { size: 20, fill: '#fff', weight: 500 });
      d.text(665, 428, 'inside: two heat sensors', { size: 13, fill: C.muted, mono: true });
      d.line(560, 400, SX + 30, SY - 30, { stroke: C.muted, strokeWidth: 1.2, strokeLineDash: [4, 5] });
    });
    // ---------- person (top-down: head and shoulders) with heat glow
    const person = d.g();
    const heatG = d.glow(0, 0, 90, C.accent, person);
    heatG.setAttribute('opacity', 0.9);
    d.into(person, () => {
      d.ellipse(0, 0, 76, 36, { fill: C.accentSoft, stroke: C.ink, strokeWidth: 2 });
      d.circle(0, -2, 34, { fill: '#e8b48a', stroke: C.ink, strokeWidth: 2 });
      d.path('M-14 -8 q14 -14 28 0', { stroke: '#5a3a24', strokeWidth: 5, fill: 'none' });
    });
    const PY = 210;
    const pHit = d.el('rect', { x: -50, y: -40, width: 100, height: 80, fill: 'transparent' }, person);
    S.drag(pHit, { move: (x) => { st.walk = 0; st.x = clamp(x, 60, 740); } });
    const tLab = d.text(0, 0, '37 °C', { size: 14, fill: C.accentInk, mono: true, parent: person });
    tLab.setAttribute('y', 36);
    // ---------- signal graph
    const gG = d.g(S.layers.top, { opacity: 0 });
    let sigP, outP;
    d.into(gG, () => {
      panel(S, 30, 20, 230, 150, { parent: gG, fill: '#fff' });
      d.text(44, 40, 'difference A − B', { size: 13, fill: C.muted, mono: true, anchor: 'start' });
      d.line(44, 80, 248, 80, { stroke: C.line2, strokeWidth: 1, roughness: 0.2 });
      d.text(44, 120, 'OUT pin', { size: 13, fill: C.muted, mono: true, anchor: 'start' });
      sigP = d.el('path', { fill: 'none', stroke: C.iris, 'stroke-width': 2.6 }, gG);
      outP = d.el('path', { fill: 'none', stroke: C.accent, 'stroke-width': 2.6 }, gG);
    });
    const hist = [], ohist = [];
    const alarm = d.text(660, 440, 'MOTION!', { size: 34, fill: C.accent, weight: 500, opacity: 0 });

    const zoneVal = (x) => { // which zone sees the person: +1 for an A zone, −1 for B, smooth at the edges
      const a = Math.atan2(PY - SY, x - SX);
      const f = (a - A0) / (A1 - A0);
      if (f < 0 || f > 1) return 0;
      return Math.sin(f * NZ * Math.PI);
    };
    let prev = 0, dir = 1;
    S.onTick((dt) => {
      zG.setAttribute('opacity', st.zones.toFixed(2));
      iG.setAttribute('opacity', st.inset.toFixed(2));
      gG.setAttribute('opacity', st.graph.toFixed(2));
      if (st.walk && dt) { st.x += dir * 110 * dt; if (st.x > 720) dir = -1; if (st.x < 80) dir = 1; }
      S.at(person, st.x, PY);
      const z = zoneVal(st.x);
      // the pyroelectric element responds to change, then fades back to zero
      const dz = dt ? (z - prev) / dt : 0;
      prev = z;
      st.sig += ((clamp(dz / 4, -1, 1)) - st.sig) * Math.min(1, dt * 8);
      if (Math.abs(st.sig) > 0.25) st.hold = 2.5; // OUT stays HIGH for a few seconds after the last change
      st.hold = Math.max(0, st.hold - dt);
      const out = st.hold > 0 ? 1 : 0;
      if (dt) { hist.push(st.sig); ohist.push(out); if (hist.length > 120) { hist.shift(); ohist.shift(); } }
      sigP.setAttribute('d', 'M' + hist.map((v, i) => `${(44 + i * 1.7).toFixed(1)} ${(80 - v * 26).toFixed(1)}`).join(' L'));
      outP.setAttribute('d', 'M' + ohist.map((v, i) => `${(44 + i * 1.7).toFixed(1)} ${(158 - v * 24).toFixed(1)}`).join(' L'));
      halfA.setAttribute('opacity', (0.25 + 0.6 * Math.max(0, z)).toFixed(2));
      halfB.setAttribute('opacity', (0.25 + 0.6 * Math.max(0, -z)).toFixed(2));
      outLed.setAttribute('opacity', st.trace * out);
      alarm.setAttribute('opacity', st.trace * out);
    }, { essential: true });

    const walkT = S.ui.toggle({ label: 'Walk', value: false, onChange: (on) => (st.walk = on ? 1 : 0) });
    return {
      step(i) {
        S.to(st, { zones: i >= 2 ? 1 : 0, inset: i === 1 || i === 3 ? 1 : 0, graph: i >= 3 ? 1 : 0, trace: i >= 4 ? 1 : 0 }, 0.5);
        walkT.show(i >= 3);
        if (i <= 2) { walkT.set(false); st.x = 150; }
        if (i === 3 || i === 4) walkT.set(true);
        if (i === 5) { walkT.set(true); S.play(async (w) => { await w(2.5); walkT.set(false); }); }
      },
    };
  },
});
