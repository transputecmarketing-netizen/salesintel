import HL from './vendor/hairline-kernel.js';
/**
 * Gearbox: a three-gear train on a mounting plate, as in a toy motor kit: a
 * big driver with a crank pin and lightening holes, an idler, and a small
 * output gear, each on its axle. Turning the pointer round the big gear turns
 * it, on a spring, by the angle swept; the idler and the output follow, each
 * the other way and faster by its tooth ratio, meshing tooth in gap. The
 * output is bright at rest, where the eye should start; the driver takes the
 * bright while the pointer holds it. The slider is the drive: degrees of turn
 * per degree swept.
 *
 * The drive reads only the pointer's angle round the driver's fixed axle.
 */
const {
  Cam, circ, clamp, facing, fillet, fit, poly, prism, proj, rad, rings, unproj,
  spring, stepS, disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const M = 2.9, Z0 = 9.4, Z1 = 11.6, TAU = Math.PI * 2;
const GEARS = [
  { n: 20, c: [0, 0] },
  { n: 10, psi: 0 },
  { n: 8, psi: 100 },
];
// place each gear at the pitch distance from the one before, along psi
GEARS.forEach((G, i) => {
  G.r = (M * G.n) / 2;
  if (i) { const A = GEARS[i - 1], d = A.r + G.r; G.c = [A.c[0] + d * Math.cos(rad(G.psi)), A.c[1] + d * Math.sin(rad(G.psi))]; }
});

/** A gear's outline at angle a: trapezoid teeth between the root and tip circles, as world [x, y]. */
function teeth(G, a) {
  const p = TAU / G.n, ro = G.r + M, rr = G.r - 1.25 * M, out = [];
  for (let k = 0; k < G.n; k++) {
    const t = a + k * p;
    for (const [f, r] of [[-0.5, rr], [-0.28, rr], [-0.14, ro], [0.14, ro], [0.28, rr]]) out.push([G.c[0] + r * Math.cos(t + f * p), G.c[1] + r * Math.sin(t + f * p)]);
  }
  return out;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let gain = value, prev = null;
  const drive = spring(0, { eps: 0.002 });
  const C = Cam(45, 0.5, 2.6);
  const xs = GEARS.flatMap((G) => [G.c[0] - G.r - 8, G.c[0] + G.r + 8]), ys = GEARS.flatMap((G) => [G.c[1] - G.r - 8, G.c[1] + G.r + 8]);
  const X0 = Math.min(...xs), X1 = Math.max(...xs), Y0 = Math.min(...ys), Y1 = Math.max(...ys);
  fit(C, [[X0, Y0, 0], [X1, Y1, 0], [X1, Y0, 0], [X0, Y1, 0], [X0, Y0, Z1], [X1, Y0, Z1]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk('g', {}, svg);

  // the plate, its four screws, and an axle under each gear
  const [pr, pi] = rings(X0, Y0, X1, Y1, 7, 1.8);
  put(solid(g), prism(P, front, pr, pi, 0, 4));
  for (const [x, y] of [[X0 + 5, Y0 + 5], [X1 - 5, Y0 + 5], [X0 + 5, Y1 - 5], [X1 - 5, Y1 - 5]]) place(flatDot(g, C, 1.2, 'dot off'), P(x, y, 4));
  const on = (ring, [cx, cy]) => ring.map((q) => ({ ...q, u: q.u + cx, v: q.v + cy }));
  // gears painted back to front by x + y; meshing teeth interleave, so their faces never overlap
  const order = GEARS.map((G, i) => i).sort((i, j) => GEARS[i].c[0] + GEARS[i].c[1] - GEARS[j].c[0] - GEARS[j].c[1]);
  const els = [];
  for (const i of order) {
    const G = GEARS[i];
    put(solid(g), prism(P, front, on(circ(3.4, 24), G.c), on(circ(2.7, 24), G.c), 4, Z0));
    const gg = mk('g', {}, g);
    els[i] = {
      under: mk('path', { class: 'sil' }, gg), top: mk('path', { class: 'sil' }, gg),
      holes: mk('path', { class: 'nf lo' }, gg), hub: mk('path', { class: 'nf lo' }, gg),
      pin: flatDot(gg, C, i === 0 ? 1.8 : 1.1, 'dot m'), drawn: NaN,
    };
    els[i].hub.setAttribute('d', poly(circ(Math.min(5, G.r * 0.4), 24).map((q) => P(G.c[0] + q.u, G.c[1] + q.v, Z1))));
    place(flatDot(gg, C, 1, 'dot off'), P(G.c[0], G.c[1], Z1));
  }

  /** Each gear's angle from the driver's: counter-rotating by the tooth ratio, phased so a tooth meets a gap. */
  function angles(a0) {
    const out = [a0];
    for (let i = 1; i < GEARS.length; i++) {
      const A = GEARS[i - 1], G = GEARS[i], psi = rad(G.psi), pA = TAU / A.n, pG = TAU / G.n;
      const s = (psi - out[i - 1]) / pA;
      out.push(psi + Math.PI - pG / 2 + pG * s);
    }
    return out;
  }
  function draw(a0) {
    angles(a0).forEach((a, i) => {
      const G = GEARS[i], E = els[i];
      if (a === E.drawn) return;
      E.drawn = a;
      // every tooth corner rounded, as rule 09 asks
      const raw = teeth(G, a), t = fillet(raw, raw.map(() => 0.7), 2);
      E.under.setAttribute('d', poly(t.map(([x, y]) => P(x, y, Z0))));
      E.top.setAttribute('d', poly(t.map(([x, y]) => P(x, y, Z1))));
      // the driver has five lightening holes; the others, one index hole; each turns with its gear
      const k = i === 0 ? 5 : 1, rh = i === 0 ? G.r * 0.55 : G.r * 0.5, sz = i === 0 ? 3.6 : 1.4;
      E.holes.setAttribute('d', Array.from({ length: i === 0 ? k : 0 }, (_, j) => poly(circ(sz, 20).map((q) => P(G.c[0] + rh * Math.cos(a + (j * TAU) / k) + q.u, G.c[1] + rh * Math.sin(a + (j * TAU) / k) + q.v, Z1)))).join(''));
      const pr2 = i === 0 ? G.r * 0.82 : rh;
      place(E.pin, P(G.c[0] + pr2 * Math.cos(a + 0.6), G.c[1] + pr2 * Math.sin(a + 0.6), Z1));
    });
  }
  const B = register(stage, (dt) => { const m = stepS(drive, dt); draw(drive.x); return m; });
  bag.add(B.unregister);

  const deg = (a) => String(Math.round((((a * 180) / Math.PI) % 360 + 360) % 360)).padStart(3, '0');
  function bright(holding) {
    els[0].top.classList.toggle('hi', holding);
    els[GEARS.length - 1].top.classList.toggle('hi', !holding);
  }
  bright(false);
  bag.add(pointer(stage, {
    move: (p) => {
      const [x, y] = unproj(C, p[0], p[1], Z1), phi = Math.atan2(y - GEARS[0].c[1], x - GEARS[0].c[0]);
      if (Math.hypot(x, y) > 6 && prev !== null) {
        const d = ((phi - prev + 3 * Math.PI) % TAU) - Math.PI;
        drive.t += clamp(d, -0.6, 0.6) * gain;
      }
      prev = phi;
      bright(true);
      const a = angles(drive.t);
      read.textContent = `in ${deg(a[0])}° · out ${deg(a[a.length - 1])}°`;
      B.wake();
    },
    leave: () => { prev = null; bright(false); read.textContent = 'rest'; },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { gain = v; }, destroy: bag.dispose };
}

export default {
  name: 'gearbox',
  means: 'A gear train: turning the pointer round the big gear drives it, and the smaller gears follow, faster and the other way.',
  rules: [1, 5, 8, 9],
  range: [0.5, 1, 2],
  tour: [[137, 114], [225, 114], [225, 158], [137, 158], null],
  mount,
};
