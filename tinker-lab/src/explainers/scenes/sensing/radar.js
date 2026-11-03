// Radar: radio echoes, time of flight at light speed, the Doppler speed gun and a sweeping scope.
import { scene, clamp } from '../../engine.js';
import { arcs, panel } from '../../kit.js';

const F0 = 24.125e9, CL = 299792458; // a K-band speed gun

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A radar dish timing echoes, a speed gun measuring a car, and a radar scope',
  steps: [
    'Radar sends out radio waves and listens for the echo.',
    'Radio travels at the speed of light: 300,000 km every second.',
    'Echo time gives distance: each microsecond there and back is 150 m.',
    'A car driving towards you squashes the reflected waves closer together.',
    'The squash changes the frequency. Measure it: that is a speed gun.',
    'A spinning antenna sweeps around and paints a map of echoes.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { a: 1, b: 0, c: 0, kmh: 90, t: 0, plane: 0 };

    // ---------- A. dish and plane
    const aG = d.g();
    let plane;
    d.into(aG, () => {
      d.line(40, 420, 760, 420, { stroke: C.line2, strokeWidth: 2 });
      d.path('M70 420 L104 318 L138 420 M86 372 L122 372', { stroke: C.ink, strokeWidth: 2.4, fill: 'none' });
      d.path('M66 232 Q 70 330 170 318 Z', { fill: C.subtle, stroke: C.ink, strokeWidth: 2.6 });
      d.line(104, 300, 146, 270, { stroke: C.ink, strokeWidth: 2.2 });
      d.circle(148, 270, 12, { fill: C.ink, stroke: 'none' });
      d.text(110, 446, 'radar dish', { size: 15, fill: C.muted, mono: true });
      plane = d.g(aG);
      d.into(plane, () => {
        d.path('M-50 0 L40 -6 Q56 0 40 6 L-50 4 Z', { fill: '#fff', stroke: C.ink, strokeWidth: 2.2 });
        d.path('M-4 -2 L-24 -30 L-12 -30 L14 -2 Z M-4 4 L-24 32 L-12 32 L14 4 Z', { fill: '#e6e8ee', stroke: C.ink, strokeWidth: 1.8 });
        d.path('M-48 0 L-56 -18 L-44 -18 L-38 -2 Z', { fill: C.accent, stroke: C.ink, strokeWidth: 1.6 });
      });
    });
    const out = arcs(S, 150, 268, { n: 3, gap: 16, spread: 0.32, color: C.iris, angle: -0.25, parent: aG });
    const back = arcs(S, 0, 0, { n: 3, gap: 16, spread: 0.35, color: C.accent, angle: Math.PI - 0.25, parent: aG });
    const aT = d.text(400, 460, '', { size: 18, fill: C.ink2, mono: true, parent: aG });

    // ---------- B. speed gun and car
    const bG = d.g(undefined, { opacity: 0 });
    let car;
    const wOut = d.el('path', { fill: 'none', stroke: C.iris, 'stroke-width': 3 }, bG);
    const wBack = d.el('path', { fill: 'none', stroke: C.accent, 'stroke-width': 3 }, bG);
    d.into(bG, () => {
      d.line(40, 390, 760, 390, { stroke: C.line2, strokeWidth: 2 });
      d.rect(60, 210, 90, 60, { fill: '#2a2b31', stroke: C.ink, roughness: 0.5 });
      d.path('M90 270 L100 330 L120 330 L118 270', { fill: '#2a2b31', stroke: C.ink, strokeWidth: 2 });
      d.rect(70, 222, 50, 26, { fill: '#cfd8c4', stroke: C.ink, strokeWidth: 1.4, roughness: 0.3 });
      d.text(110, 200, 'speed gun', { size: 15, fill: C.muted, mono: true });
      car = d.g(bG);
      d.into(car, () => {
        d.path('M0 0 L0 -36 L30 -40 L56 -70 L130 -70 L160 -40 L190 -34 L190 0 Z', { fill: C.blueSoft, stroke: C.ink, strokeWidth: 2.4 });
        d.path('M64 -64 L84 -42 L150 -42 L128 -64 Z', { fill: '#fff', stroke: C.ink, strokeWidth: 1.6 });
        d.circle(44, 0, 44, { fill: '#2a2b31', stroke: C.ink }); d.circle(150, 0, 44, { fill: '#2a2b31', stroke: C.ink });
        d.circle(44, 0, 16, { fill: '#c7c9cf', stroke: 'none' }); d.circle(150, 0, 16, { fill: '#c7c9cf', stroke: 'none' });
      });
      d.text(300, 196, 'sent', { size: 15, fill: C.irisInk, mono: true, anchor: 'start' });
      d.text(170, 340, 'echo (squashed: hugely exaggerated)', { size: 15, fill: C.accentInk, mono: true, anchor: 'start' });
    });
    const fT = d.text(400, 450, '', { size: 18, fill: C.ink, mono: true, parent: bG });

    // ---------- C. the scope
    const cG = d.g(undefined, { opacity: 0 });
    const PX = 400, PY = 262, PR = 200;
    let sweep;
    const blips = [];
    d.into(cG, () => {
      d.circle(PX, PY, PR * 2, { fill: '#f6f7fb', stroke: C.ink, strokeWidth: 2.4 });
      for (const r of [0.33, 0.66]) d.circle(PX, PY, PR * 2 * r, { fill: 'none', stroke: C.line2, strokeWidth: 1.2, roughness: 0.4 });
      d.line(PX - PR, PY, PX + PR, PY, { stroke: C.line2, strokeWidth: 1, roughness: 0.3 });
      d.line(PX, PY - PR, PX, PY + PR, { stroke: C.line2, strokeWidth: 1, roughness: 0.3 });
      sweep = d.g(cG);
      for (let k = 0; k < 10; k++) d.el('path', { d: `M${PX} ${PY} L${PX + PR} ${PY} A${PR} ${PR} 0 0 0 ${PX + PR * Math.cos(-0.04 * (k + 1))} ${PY + PR * Math.sin(-0.04 * (k + 1))} Z`, fill: C.iris, opacity: 0.05 * (10 - k) / 10, transform: `rotate(${-k * 2.3} ${PX} ${PY})` }, sweep);
      d.el('line', { x1: PX, y1: PY, x2: PX + PR, y2: PY, stroke: C.iris, 'stroke-width': 3 }, sweep);
      [[0.6, 0.8, 0.3], [2.4, 0.5, -0.2], [4.0, 0.75, 0.15], [5.2, 0.35, 0.25]].forEach(([a, r, v]) => blips.push({ a, r, v, life: 0, el: d.el('circle', { r: 8, fill: C.accent }, cG) }));
      d.text(PX, PY + PR + 26, 'each dot is an echo: a plane or a ship', { size: 15, fill: C.muted, mono: true });
    });

    const spd = S.ui.slider({ label: 'Car speed', min: 0, max: 150, step: 5, value: 90, format: (v) => `${v} km/h`, onInput: (v) => (st.kmh = v) }).show(false);
    const rdF = S.ui.readout({ label: 'Echo shift', color: C.accent }).show(false);

    let sw = 0;
    S.onTick((dt, t) => {
      aG.setAttribute('opacity', st.a.toFixed(2)); bG.setAttribute('opacity', st.b.toFixed(2)); cG.setAttribute('opacity', st.c.toFixed(2));
      // A: a pulse to the plane and back, in very slow motion
      st.plane = (st.plane + dt * 8) % 200;
      const px = 640 - st.plane * 0.3, py = 150;
      S.at(plane, px, py);
      const D = Math.hypot(px - 150, py - 282);
      st.t = (st.t + dt * 260) % (2 * D + 120);
      const r1 = st.t, r2 = st.t - D;
      out.set(r1 < D ? r1 : -1, 1);
      back.g.setAttribute('transform', `translate(${px - 40} ${py + 10})`);
      back.set(r2 > 0 && r2 < D ? r2 : -1, 1);
      const km = 30 + (D - 500) * 0.04; // the drawing stands for about 30 km
      aT.textContent = `plane ≈ ${km.toFixed(1)} km away · echo after ${Math.round((2 * km * 1000 / CL) * 1e6)} µs`;
      // B: Doppler
      const v = st.kmh / 3.6;
      const lam0 = 42, lam1 = lam0 * (1 - 0.45 * (st.kmh / 150));
      const cx = 520 + Math.sin(t * 0.7) * 6;
      S.at(car, cx, 368);
      let a = '', b = '';
      for (let x = 160; x <= cx; x += 4) a += `${a ? 'L' : 'M'}${x} ${(230 + Math.sin(((x - t * 120) / lam0) * Math.PI * 2) * 14).toFixed(1)}`;
      for (let x = cx; x >= 160; x -= 4) b += `${b ? 'L' : 'M'}${x} ${(290 + Math.sin(((x + t * 120) / lam1) * Math.PI * 2) * 14).toFixed(1)}`;
      wOut.setAttribute('d', a); wBack.setAttribute('d', b);
      const df = (2 * v * F0) / CL;
      fT.textContent = `${st.kmh} km/h → echo is ${Math.round(df).toLocaleString('en')} Hz higher (of 24.125 GHz)`;
      rdF.set(`${Math.round(df).toLocaleString('en')} Hz`);
      // C: sweep and blips
      sw = (sw + dt * 1.6) % (Math.PI * 2);
      sweep.setAttribute('transform', `rotate(${((sw * 180) / Math.PI).toFixed(1)} ${PX} ${PY})`);
      for (const bl of blips) {
        bl.a += bl.v * dt * 0.05;
        const diff = (sw - bl.a + Math.PI * 4) % (Math.PI * 2);
        if (diff < 0.08) bl.life = 1;
        bl.life = Math.max(0, bl.life - dt * 0.35);
        bl.el.setAttribute('cx', PX + Math.cos(bl.a) * bl.r * PR); bl.el.setAttribute('cy', PY + Math.sin(bl.a) * bl.r * PR);
        bl.el.setAttribute('opacity', bl.life.toFixed(2));
      }
    }, { essential: true });

    return {
      step(i) {
        S.to(st, { a: i <= 2 ? 1 : 0, b: i === 3 || i === 4 ? 1 : 0, c: i === 5 ? 1 : 0 }, 0.5);
        spd.show(i === 3 || i === 4); rdF.show(i === 4);
        if (i === 4) S.play(async (w) => { await w(0.6); spd.set(40); await S.hand.slide(spd, 140, 1.8); await w(0.4); S.hand.hide(); });
      },
    };
  },
});
