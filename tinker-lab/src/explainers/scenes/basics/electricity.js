// What is electricity? Atoms, free electrons, drift, the "full tube" push and an honest water loop.
import { scene, clamp } from '../../engine.js';
import { panel } from '../../kit.js';

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'Atoms, free electrons in a copper wire, and a water-loop analogy',
  steps: [
    'Everything is made of tiny atoms. This is one copper atom.',
    'Copper has one loose electron on the outside.',
    'In a wire, loose electrons wander between the atoms.',
    'Connect a battery: they all drift towards the + end.',
    'The drift is slow: about 0.07 mm per second.',
    'But the push arrives almost instantly, like marbles in a full tube.',
    'Like water in a closed pipe loop: a pump pushes, a narrow pipe resists.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { atom: 1, outer: 0, lattice: 0, drift: 0, snail: 0, marbles: 0, water: 0 };

    // ---------- 1. the copper atom (Bohr picture: 2, 8, 18, 1 electrons)
    const atomG = d.g();
    const cx = 400, cy = 262;
    const shells = [[44, 2, 1.3], [78, 8, 0.8], [116, 18, 0.5], [160, 1, 0.32]];
    const shellEls = [];
    d.into(atomG, () => {
      for (const [r] of shells) d.circle(cx, cy, r * 2, { stroke: C.line2, strokeWidth: 1.6, roughness: 0.7, fill: 'none' });
      // nucleus: 29 protons (+) and neutrons, drawn as a cluster
      for (let i = 0; i < 22; i++) {
        const a = i * 2.4, rr = 5 + Math.sqrt(i) * 4.2;
        d.circle(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 11, { fill: i % 2 ? C.accent : '#b9bcc2', stroke: C.ink, strokeWidth: 1, roughness: 0.4 });
      }
      for (const [r, n] of shells) {
        const g = d.g(atomG);
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2;
          d.el('circle', { cx: cx + Math.cos(a) * r, cy: cy + Math.sin(a) * r, r: n === 1 ? 8 : 6, fill: C.blue, stroke: '#fff', 'stroke-width': 1.5 }, g);
        }
        shellEls.push(g);
      }
    });
    const outerGlow = d.glow(cx + 160, cy, 46, C.blue);
    const atomLab = d.g(atomG);
    d.into(atomLab, () => {
      d.text(cx - 250, cy - 70, 'nucleus', { size: 22, fill: C.ink2 });
      d.text(cx - 250, cy - 44, '29 protons (+)', { size: 17, fill: C.accentInk, mono: true });
      d.line(cx - 190, cy - 56, cx - 30, cy - 8, { stroke: C.muted, strokeWidth: 1.4 });
      d.text(cx + 250, cy + 150, '29 electrons (−)', { size: 17, fill: C.blue, mono: true });
    });
    const outerLab = d.text(cx + 250, cy - 60, 'the loose one', { size: 22, fill: C.blue, weight: 500, opacity: 0 });

    // ---------- 2–4. the copper lattice inside a wire
    const latG = d.g(undefined, { opacity: 0 });
    const X0 = 70, X1 = 730, Y0 = 170, Y1 = 350;
    let snailEl, batL, batR;
    d.into(latG, () => {
      d.rect(X0, Y0, X1 - X0, Y1 - Y0, { fill: C.copperSoft, stroke: C.copper, strokeWidth: 3, roughness: 0.8 });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) {
        const x = X0 + 45 + c * 63 + (r % 2) * 30, y = Y0 + 32 + r * 58;
        d.circle(x, y, 34, { fill: C.copper, stroke: C.ink, strokeWidth: 1.4, roughness: 0.5 });
        d.text(x, y + 1, '+', { size: 20, fill: '#fff', weight: 500 });
      }
      batL = d.g(latG, { opacity: 0 });
      d.into(batL, () => { d.rect(X0 - 56, Y0 + 40, 46, 100, { fill: C.ink, roughness: 0.5 }); d.text(X0 - 33, Y0 + 90, '−', { size: 36, fill: '#fff', weight: 500 }); });
      batR = d.g(latG, { opacity: 0 });
      d.into(batR, () => { d.rect(X1 + 10, Y0 + 40, 46, 100, { fill: C.accent, roughness: 0.5 }); d.text(X1 + 33, Y0 + 90, '+', { size: 36, fill: '#fff', weight: 500 }); });
    });
    const eG = d.g(S.layers.fx, { opacity: 0 });
    const es = Array.from({ length: 30 }, (_, i) => ({
      x: X0 + 20 + ((i * 137) % (X1 - X0 - 40)), y: Y0 + 14 + ((i * 59) % (Y1 - Y0 - 28)), a: i * 1.7, t: 0,
      el: d.el('circle', { r: 7, fill: C.blue, stroke: '#fff', 'stroke-width': 1.6 }, eG),
    }));
    // tag one electron so its slow progress is easy to follow
    es[0].el.setAttribute('fill', C.iris);
    es[0].el.setAttribute('r', 9);

    // the snail and the numbers (step 5)
    const snailG = d.g(S.layers.top, { opacity: 0 });
    d.into(snailG, () => {
      panel(S, 210, 384, 380, 104, { parent: snailG });
      snailEl = d.g(snailG);
      d.into(snailEl, () => {
        d.path('M0 0 q30 -6 52 4 l8 -16 m-8 16 l14 -12', { stroke: C.ink, strokeWidth: 2, fill: 'none' });
        d.path('M-8 0 c-30 4 -34 -46 -4 -48 c26 -2 30 34 4 32 c-16 0 -16 -20 -2 -20', { stroke: C.ink, strokeWidth: 2.2, fill: C.yellowSoft });
      });
      d.text(380, 418, '1 A in a 1 mm² copper wire:', { size: 18, fill: C.ink2, anchor: 'start', mono: true });
      d.text(380, 448, 'drift ≈ 0.07 mm/s', { size: 22, fill: C.ink, anchor: 'start', mono: true, weight: 500 });
      d.text(380, 474, 'random speed ≈ 1500 km/s', { size: 15, fill: C.muted, anchor: 'start', mono: true });
    });

    // ---------- 6. marbles in a full tube
    const mG = d.g(undefined, { opacity: 0 });
    const TY = 250, TX0 = 150, TX1 = 650, MD = 41;
    const marbles = [];
    let hand;
    d.into(mG, () => {
      d.rect(TX0, TY - 26, TX1 - TX0, 52, { fill: C.subtle, stroke: C.ink, strokeWidth: 2.2, roughness: 0.8 });
      for (let i = 0; i < 14; i++) marbles.push(d.el('circle', { r: 19, fill: C.blue, stroke: C.ink, 'stroke-width': 1.6 }, mG));
      hand = d.g(mG);
      d.into(hand, () => d.path('M0 -16 h-40 c-10 0 -10 32 0 32 h40 z M0 -10 h16 c6 0 6 8 0 8 h-16', { fill: '#fff', stroke: C.ink, strokeWidth: 2 }));
      d.text(TX0 + 10, TY + 66, 'push one in…', { size: 21, fill: C.ink2, anchor: 'start' });
      d.text(TX1 - 10, TY + 66, '…one pops out at once', { size: 21, fill: C.ink2, anchor: 'end' });
      d.text(400, TY - 70, 'the wire is always full of electrons', { size: 20, fill: C.muted });
    });

    // ---------- 7. the water loop
    const wG = d.g(undefined, { opacity: 0 });
    const wp = 'M200 380 L200 140 L470 140 L600 140 L600 380 Z';
    let imp, waterFlow;
    d.into(wG, () => {
      d.path(wp, { stroke: '#7b8db8', strokeWidth: 30, fill: 'none', roughness: 0.6 });
      d.path(wp, { stroke: '#dbe5ff', strokeWidth: 22, fill: 'none', roughness: 0.3 });
      waterFlow = d.el('path', { d: wp, stroke: C.blue, 'stroke-width': 6, fill: 'none', 'stroke-dasharray': '14 22', 'stroke-linecap': 'round' });
      // narrow section on the right side
      d.rect(586, 210, 28, 100, { fill: '#fff', stroke: 'none', roughness: 0.2 });
      d.path('M586 200 L596 222 L596 298 L586 320 M614 200 L604 222 L604 298 L614 320', { stroke: '#7b8db8', strokeWidth: 4, fill: 'none' });
      d.line(600, 222, 600, 298, { stroke: C.blue, strokeWidth: 4 });
      // pump on the left side
      d.circle(200, 260, 92, { fill: '#fff', stroke: C.ink, strokeWidth: 2.4 });
      imp = d.g(wG);
      d.into(imp, () => { for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; d.line(200, 260, 200 + Math.cos(a) * 36, 260 + Math.sin(a) * 36, { stroke: C.accent, strokeWidth: 4 }); } });
      d.text(118, 260, 'pump', { size: 22, anchor: 'end', fill: C.ink });
      d.text(118, 286, '= battery', { size: 17, anchor: 'end', fill: C.accentInk, mono: true });
      d.text(632, 252, 'narrow pipe', { size: 22, anchor: 'start', fill: C.ink });
      d.text(632, 278, '= resistor', { size: 17, anchor: 'start', fill: C.accentInk, mono: true });
      d.text(400, 112, 'pressure ≈ voltage   ·   flow ≈ current', { size: 19, fill: C.ink2, mono: true });
      d.text(400, 420, 'Pipes are always full, just like wires.', { size: 20, fill: C.muted });
    });

    let mt = 0;
    S.onTick((dt, t) => {
      atomG.setAttribute('opacity', st.atom.toFixed(3));
      shellEls.forEach((g, i) => g.setAttribute('transform', `rotate(${(t * shells[i][2] * 40) % 360} ${cx} ${cy})`));
      const oa = (t * shells[3][2] * 40 * Math.PI) / 180;
      outerGlow.setAttribute('cx', cx + Math.cos(oa) * 160); outerGlow.setAttribute('cy', cy + Math.sin(oa) * 160);
      outerGlow.setAttribute('opacity', (st.outer * st.atom * (0.75 + 0.25 * Math.sin(t * 4))).toFixed(3));
      outerLab.setAttribute('opacity', (st.outer * st.atom).toFixed(3));
      atomLab.setAttribute('opacity', (1 - st.outer).toFixed(3));

      latG.setAttribute('opacity', st.lattice.toFixed(3));
      eG.setAttribute('opacity', st.lattice.toFixed(3));
      batL.setAttribute('opacity', clamp(st.drift * 5).toFixed(3)); batR.setAttribute('opacity', clamp(st.drift * 5).toFixed(3));
      if (st.lattice > 0.01) for (const e of es) {
        e.t -= dt;
        if (e.t <= 0) { e.a = Math.random() * Math.PI * 2; e.t = 0.15 + Math.random() * 0.3; } // scattered by an ion
        e.x += (Math.cos(e.a) * 150 + st.drift * 34) * dt;
        e.y += Math.sin(e.a) * 150 * dt;
        if (e.y < Y0 + 10) { e.y = Y0 + 10; e.a = -e.a; }
        if (e.y > Y1 - 10) { e.y = Y1 - 10; e.a = -e.a; }
        if (e.x > X1 - 8) e.x -= X1 - X0 - 16;
        if (e.x < X0 + 8) e.x += X1 - X0 - 16;
        e.el.setAttribute('cx', e.x.toFixed(1)); e.el.setAttribute('cy', e.y.toFixed(1));
      }
      snailG.setAttribute('opacity', st.snail.toFixed(3));
      S.at(snailEl, 260 + ((t * 8) % 60), 452);

      mG.setAttribute('opacity', st.marbles.toFixed(3));
      if (st.marbles > 0.01) {
        mt += dt / 1.8;
        const ph = mt % 1, push = clamp((ph - 0.35) / 0.25);
        const s = S.ease.inOut(push);
        marbles.forEach((m, i) => {
          let x = TX0 + 21 + (i - 1 + s) * MD, y = TY;
          if (i === 0) { x = TX0 - 30 + s * 51; }
          if (i === 13) { y = TY + (s > 0.6 ? (s - 0.6) * 200 : 0); m.setAttribute('opacity', (1 - clamp((s - 0.6) * 2.5)).toFixed(2)); }
          m.setAttribute('cx', x.toFixed(1)); m.setAttribute('cy', y.toFixed(1));
        });
        S.at(hand, TX0 - 50 + s * 51, TY);
      }
      wG.setAttribute('opacity', st.water.toFixed(3));
      imp.setAttribute('transform', `rotate(${(t * 120) % 360} 200 260)`);
      waterFlow.setAttribute('stroke-dashoffset', (-t * 70).toFixed(1));
    });

    const show = (o) => S.to(st, { atom: 0, outer: 0, lattice: 0, drift: 0, snail: 0, marbles: 0, water: 0, ...o }, 0.7);
    return {
      step(i) {
        if (i === 0) show({ atom: 1 });
        if (i === 1) show({ atom: 1, outer: 1 });
        if (i === 2) show({ lattice: 1 });
        if (i === 3) show({ lattice: 1, drift: 1 });
        if (i === 4) show({ lattice: 1, drift: 0.2, snail: 1 });
        if (i === 5) { mt = 0; show({ marbles: 1 }); }
        if (i === 6) show({ water: 1 });
      },
    };
  },
});
