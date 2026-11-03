// GPS: satellites with atomic clocks, signal delay → distance, trilateration and the fourth satellite.
import { scene, clamp } from '../../engine.js';
import { panel } from '../../kit.js';

const M_PER_PX = 5; // on the map: 5 m per drawing unit
const SATS = [[120, 90, 'accent'], [690, 120, 'iris'], [380, 440, 'blue'], [90, 400, 'green']];

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'GPS satellites around Earth, and circles of distance meeting on a map',
  steps: [
    'About 31 GPS satellites circle Earth. Each carries an atomic clock.',
    'Each one keeps broadcasting who it is and exactly what time it is.',
    'Your phone times the trip: delay × light speed = distance.',
    'One distance puts you on a circle. Two leave just two spots.',
    'Three circles meet at one point: you are here!',
    'A clock error of one millionth of a second puts you 300 m out.',
    'A fourth satellite lets the receiver work out its own clock error.',
  ],
  build(S) {
    const { d, C } = S;
    const col = (k) => C[k];
    const st = { space: 1, map: 0, n: 0, err: 0, pulses: 0, link: 0, fix: 0, rx: 430, ry: 250 };

    // ---------- A. Earth and orbits, to scale (Earth radius 6,371 km, orbits 26,571 km from the centre)
    const aG = d.g();
    const EX = 400, EY = 262, ER = 54, OR = ER * (26571 / 6371);
    const orbits = [];
    d.into(aG, () => {
      for (let k = 0; k < 6; k++) {
        const rot = k * 30, g = d.g(aG, { transform: `rotate(${rot} ${EX} ${EY})` });
        d.ellipse(EX, EY, OR * 2, OR * 0.7, { fill: 'none', stroke: C.line2, strokeWidth: 1.3, roughness: 0.6, parent: g });
        orbits.push({ rot, sats: [0, 1, 2, 3].map((j) => ({ ph: j * 1.57 + k * 0.5, el: d.el('rect', { width: 14, height: 8, x: -7, y: -4, fill: '#9a9ca3', stroke: C.ink, 'stroke-width': 1 }, aG) })) });
      }
      d.circle(EX, EY, ER * 2, { fill: C.blueSoft, stroke: C.blue, strokeWidth: 2.4 });
      d.path(`M${EX - 30} ${EY - 20} q14 -10 26 0 q8 14 -6 22 q-16 4 -20 -22 Z M${EX + 8} ${EY + 10} q18 -6 24 8 q-6 16 -22 10 Z`, { fill: C.green, stroke: 'none', roughness: 1 });
      d.text(EX, EY + ER + 22, 'Earth', { size: 15, fill: C.blue, mono: true });
      d.text(690, 470, 'orbits drawn to scale', { size: 14, fill: C.muted, mono: true });
    });
    const pulseG = d.g(S.layers.fx);
    const rings = Array.from({ length: 6 }, () => d.el('circle', { fill: 'none', stroke: C.iris, 'stroke-width': 2 }, pulseG));
    const stamps = Array.from({ length: 3 }, () => d.text(0, 0, '', { size: 12, fill: C.irisInk, mono: true, parent: pulseG }));
    const linkG = d.g(S.layers.top, { opacity: 0 });
    const linkL = d.el('line', { stroke: C.accent, 'stroke-width': 2.4, 'stroke-dasharray': '6 6' }, linkG);
    const linkT = d.text(0, 0, '', { size: 15, fill: C.accentInk, mono: true, parent: linkG });
    const phone = d.el('rect', { width: 10, height: 16, x: EX - 5, y: EY - ER - 16, rx: 2, fill: C.ink }, linkG);

    // ---------- B. the map
    const bG = d.g(undefined, { opacity: 0 });
    d.into(bG, () => {
      panel(S, 30, 30, 740, 440, { parent: bG, fill: '#fbfaf5' });
      d.path('M30 330 C 200 300, 300 380, 470 340 S 700 300, 770 320', { stroke: '#a9c4f0', strokeWidth: 14, fill: 'none', roughness: 0.8 });
      d.path('M120 30 C 160 160, 260 220, 300 470 M30 180 L770 210', { stroke: C.line2, strokeWidth: 8, fill: 'none', roughness: 0.8 });
      d.text(700, 452, '300 m', { size: 13, fill: C.muted, mono: true });
      d.line(670, 438, 730, 438, { stroke: C.muted, strokeWidth: 2, roughness: 0.2 });
      d.text(400, 52, 'a flat map: real GPS solves the same puzzle in 3-D', { size: 14, fill: C.muted, mono: true });
    });
    const clipId = `${S.uid}map`;
    const cp = d.el('clipPath', { id: clipId }, S.svg.querySelector('defs'));
    d.el('rect', { x: 32, y: 32, width: 736, height: 436 }, cp);
    const circG = d.g(bG, { 'clip-path': `url(#${clipId})` });
    const circles = SATS.map(([x, y, k]) => {
      const c = d.el('circle', { cx: x, cy: y, fill: 'none', stroke: col(k), 'stroke-width': 3, opacity: 0 }, circG);
      const s = d.g(bG, { opacity: 0 });
      d.into(s, () => { d.rect(x - 16, y - 9, 32, 18, { fill: '#c7c9cf', stroke: C.ink, strokeWidth: 1.6 }); d.rect(x - 40, y - 5, 22, 10, { fill: C.blueSoft, stroke: C.ink, strokeWidth: 1.2 }); d.rect(x + 18, y - 5, 22, 10, { fill: C.blueSoft, stroke: C.ink, strokeWidth: 1.2 }); });
      return { c, s, x, y };
    });
    const marks = d.g(bG);
    const pin = d.g(S.layers.top, { opacity: 0 });
    d.into(pin, () => { d.path('M0 0 C -14 -16, -14 -34, 0 -34 C 14 -34, 14 -16, 0 0 Z', { fill: C.accent, stroke: C.ink, strokeWidth: 1.8 }); d.circle(0, -23, 10, { fill: '#fff', stroke: 'none' }); });
    const youT = d.text(0, 0, 'you are here', { size: 16, fill: C.accentInk, weight: 500, parent: S.layers.top, opacity: 0 });
    const rxEl = d.el('circle', { r: 7, fill: C.ink }, bG);
    const rxHit = d.el('circle', { r: 30, fill: 'transparent' }, bG);
    S.drag(rxHit, { move: (x, y) => { st.rx = clamp(x, 200, 600); st.ry = clamp(y, 150, 360); } });
    const errS = S.ui.slider({ label: 'Clock error', min: 0, max: 2, step: 0.1, value: 0, format: (v) => `${v.toFixed(1)} µs`, onInput: (v) => (st.err = v) }).show(false);
    const rdD = S.ui.readout({ label: 'Signal delay', color: C.accent });

    const intersections = (a, b, ra, rb) => {
      const dx = b.x - a.x, dy = b.y - a.y, D = Math.hypot(dx, dy);
      if (D > ra + rb || D < Math.abs(ra - rb)) return [];
      const l = (ra * ra - rb * rb + D * D) / (2 * D), h = Math.sqrt(Math.max(0, ra * ra - l * l));
      const mx = a.x + (dx * l) / D, my = a.y + (dy * l) / D;
      return [[mx + (h * dy) / D, my - (h * dx) / D], [mx - (h * dy) / D, my + (h * dx) / D]];
    };
    let t0 = 0;
    S.onTick((dt, t) => {
      aG.setAttribute('opacity', st.space.toFixed(2));
      for (const o of orbits) for (const s of o.sats) {
        s.ph += dt * 0.12; // one orbit takes about 12 hours; shown very fast
        const x = Math.cos(s.ph) * OR, y = Math.sin(s.ph) * OR * 0.35, r = (o.rot * Math.PI) / 180;
        s.el.setAttribute('transform', `translate(${(EX + x * Math.cos(r) - y * Math.sin(r)).toFixed(1)} ${(EY + x * Math.sin(r) + y * Math.cos(r)).toFixed(1)})`);
        s.el.setAttribute('opacity', st.space.toFixed(2));
      }
      pulseG.setAttribute('opacity', (st.pulses * st.space).toFixed(2));
      t0 += dt;
      rings.forEach((rg, k) => {
        const s = orbits[k].sats[0], m = s.el.getAttribute('transform').match(/[-\d.]+/g);
        const ph = ((t0 * 0.5 + k / 6) % 1);
        rg.setAttribute('cx', m[0]); rg.setAttribute('cy', m[1]); rg.setAttribute('r', (ph * 60).toFixed(1)); rg.setAttribute('opacity', (1 - ph).toFixed(2));
        if (k < 3) { stamps[k].setAttribute('x', +m[0] + 12); stamps[k].setAttribute('y', +m[1] - 12); stamps[k].textContent = `sat ${k + 1} · 12:00:0${Math.floor(t0) % 10}.${String(Math.floor((t0 % 1) * 1e6)).padStart(6, '0')}`; }
      });
      linkG.setAttribute('opacity', (st.link * st.space).toFixed(2));
      {
        const s = orbits[0].sats[1], m = s.el.getAttribute('transform').match(/[-\d.]+/g);
        linkL.setAttribute('x1', EX); linkL.setAttribute('y1', EY - ER - 8); linkL.setAttribute('x2', m[0]); linkL.setAttribute('y2', m[1]);
        linkT.setAttribute('x', (EX + +m[0]) / 2 + 10); linkT.setAttribute('y', (EY - ER + +m[1]) / 2);
        linkT.textContent = '20,200 km or more · ≈ 0.07 s';
        rdD.set('≈ 67–86 ms');
      }
      // ---------- map: distances = (true range + clock error × c), shown as circles
      bG.setAttribute('opacity', st.map.toFixed(2));
      const extra = (st.err * (1 - st.fix) * 299.792458) / M_PER_PX; // 1 µs → 300 m → 60 units
      const rs = circles.map((c) => Math.hypot(c.x - st.rx, c.y - st.ry) + extra);
      circles.forEach((c, k) => { c.c.setAttribute('r', rs[k].toFixed(1)); const on = clamp(st.n - k); c.c.setAttribute('opacity', (on * 0.9).toFixed(2)); c.s.setAttribute('opacity', on.toFixed(2)); });
      rxEl.setAttribute('cx', st.rx); rxEl.setAttribute('cy', st.ry); rxHit.setAttribute('cx', st.rx); rxHit.setAttribute('cy', st.ry);
      rxEl.setAttribute('opacity', st.n >= 3 && extra < 1 ? 0 : 0.25);
      d.seed = 8800;
      while (marks.firstChild) marks.firstChild.remove();
      if (st.n >= 1.9 && st.n < 2.9) for (const [x, y] of intersections(circles[0], circles[1], rs[0], rs[1])) d.el('circle', { cx: x, cy: y, r: 9, fill: 'none', stroke: C.ink, 'stroke-width': 2.5 }, marks);
      const good = st.n >= 2.9 && extra < 2;
      pin.setAttribute('opacity', good ? 1 : 0); youT.setAttribute('opacity', good ? 1 : 0);
      S.at(pin, st.rx, st.ry); youT.setAttribute('x', st.rx); youT.setAttribute('y', st.ry + 22);
      if (st.n >= 2.9 && extra >= 2) for (let a = 0; a < 3; a++) for (const [x, y] of intersections(circles[a], circles[(a + 1) % 3], rs[a], rs[(a + 1) % 3])) d.el('circle', { cx: x, cy: y, r: 6, fill: C.ink, opacity: 0.6 }, marks);
    }, { essential: true });

    return {
      step(i) {
        errS.show(i >= 5); rdD.show(i <= 2);
        S.to(st, { space: i <= 2 ? 1 : 0, map: i >= 3 ? 1 : 0, pulses: i === 1 || i === 2 ? 1 : 0, link: i === 2 ? 1 : 0 }, 0.6);
        if (i <= 4) { errS.set(0); st.fix = 0; }
        if (i === 3) { st.n = 0; S.play(async (w) => { await w(0.4); await w.to(st, { n: 1 }, 0.8); await w(1.2); await w.to(st, { n: 2 }, 0.8); }); }
        if (i === 4) { st.n = 2; S.play(async (w) => { await w(0.5); await w.to(st, { n: 3 }, 0.8); }); }
        if (i === 5) { st.n = 3; st.fix = 0; errS.set(0); S.play(async (w) => { await w(0.6); await S.hand.slide(errS, 1, 1.4); await w(0.4); S.hand.hide(); }); }
        if (i === 6) { st.n = 3; errS.set(1); st.fix = 0; S.play(async (w) => { await w(0.6); await w.to(st, { n: 4 }, 0.8); await w(0.6); await w.to(st, { fix: 1 }, 1.4); }); }
      },
    };
  },
});
