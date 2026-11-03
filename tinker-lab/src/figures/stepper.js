import HL from './vendor/hairline-kernel.js';
/**
 * Stepper: a NEMA 17 stepper motor, the one in every 3D printer: a square
 * can with rounded corners in three bands (two end caps and the stator stack),
 * four mounting screws, a round boss, the side connector, and a dial needle
 * on the shaft over a ring of sixteen detents printed on the face. The rotor
 * never glides: when the pointer picks a detent, the needle steps there one
 * detent at a time, the shorter way round, each step a quick snap scheduled
 * after the last, so the motion is a row of clicks. At rest it sits on detent
 * three. The slider is the time between steps.
 *
 * The pick reads the pointer's angle on a fixed plane through the needle,
 * round the shaft, which never moves.
 */
const {
  Cam, circ, facing, fit, hull, open, poly, prism, proj, rad, ringAt, rings, run, unproj,
  tset, tval, tween, disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const N = 16, HW = 21, H = 34, ZN = 39.5, LEN = 18.5, REST = 3, SNAP = 220;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let STEP = value;
  const C = Cam(45, 0.5, 3.75);
  fit(C, [[-HW, -HW, 0], [HW, HW, 0], [HW, -HW, 0], [-HW, HW, 0], [-HW, -HW, H], [HW + 4, -HW, ZN + 1]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk('g', {}, svg);

  // the can: one rounded solid, the two seams where the end caps meet the stack, the screws
  const [br, bi] = rings(-HW, -HW, HW, HW, 5.5, 1.5);
  put(solid(g), prism(P, front, br, bi, 0, H));
  mk('path', { d: [8, 26].map((z) => open(ringAt(P, run(br, front), z))).join(''), class: 'nf lo' }, g);
  for (const [x, y] of [[-15.5, -15.5], [15.5, -15.5], [-15.5, 15.5], [15.5, 15.5]]) place(flatDot(g, C, 1.3, 'dot off'), P(x, y, H));
  // the connector on the near side
  const [kr, ki] = rings(HW - 1, -6, HW + 4, 6, 1.2, 0.6);
  put(solid(g), prism(P, front, kr, ki, 3, 9));
  // sixteen detents round the shaft, then the boss
  const dirOf = (k) => [Math.cos(rad(k * 360 / N)), Math.sin(rad(k * 360 / N))];
  const det = [];
  for (let k = 0; k < N; k++) { const [c, s] = dirOf(k); det.push(flatDot(g, C, k % 4 ? 0.7 : 1, 'dot off')); place(det[k], P(16.2 * c, 16.2 * s, H)); }
  put(solid(g), prism(P, front, circ(11, 48), circ(9.8, 48), H, H + 2));
  put(solid(g), prism(P, front, circ(3.6, 24), circ(2.8, 24), H + 2, ZN));

  // the needle: a thin plate, hull of its tail, hub and tip
  const needle = solid(g);
  needle.sil.classList.add('hi');
  needle.cr.setAttribute('class', 'nf lo');
  const hubDot = flatDot(needle.g, C, 0.9, 'dot m');
  const disc = (cx, cy, r, z) => circ(r, 18).map((q) => P(cx + q.u, cy + q.v, z));
  let drawn = NaN;
  function draw(a) {
    if (a === drawn) return;
    drawn = a;
    const c = Math.cos(rad(a)), s = Math.sin(rad(a)), z1 = ZN + 1.3;
    const shape = (z, k) => disc(0, 0, 3.4 * k, z).concat(disc(LEN * c, LEN * s, 0.9 * k, z), disc(-6 * c, -6 * s, 2 * k, z));
    put(needle, { sil: poly(hull(shape(ZN, 1).concat(shape(z1, 1)))), crease: poly(hull(shape(z1, 0.7))) });
    place(hubDot, P(0, 0, z1));
  }

  // the steps in flight: each a snap of one detent, starting STEP ms after the one before
  let base = REST, steps = [], goal = REST;
  const shown = (now) => base + steps.reduce((v, s) => v + tval(s.tw, now), 0);
  const B = register(stage, (_dt, now) => {
    draw(shown(now) * 360 / N);
    if (steps.length && steps.every((s) => now >= s.tw.t0 + SNAP)) { base += steps.reduce((v, s) => v + s.d, 0); steps = []; }
    return steps.length > 0;
  });
  bag.add(B.unregister);

  function go(k) {
    const now = performance.now();
    // keep the steps already taken; the ones not yet begun are dropped and planned again
    steps = steps.filter((s) => s.tw.t0 <= now);
    const from = base + steps.reduce((v, s) => v + s.d, 0);
    const d = ((((k - from) % N) + N + N / 2) % N) - N / 2;
    const last = steps.length ? steps[steps.length - 1].tw.t0 : -1e9;
    const t0 = Math.max(now, last + STEP);
    for (let i = 0; i < Math.abs(d); i++) {
      const s = { d: Math.sign(d), tw: tween(0, SNAP) };
      tset(s.tw, s.d, t0, i * STEP);
      steps.push(s);
    }
    det[((goal % N) + N) % N].setAttribute('class', 'dot off');
    goal = k;
    det[k].setAttribute('class', 'dot m');
    B.wake();
  }
  go(REST);
  read.textContent = 'rest';

  bag.add(pointer(stage, {
    move: (p) => {
      const [x, y] = unproj(C, p[0], p[1], ZN);
      if (Math.hypot(x, y) < 3) return;
      const k = ((Math.round(Math.atan2(y, x) / rad(360 / N)) % N) + N) % N;
      if (k !== goal) go(k);
      read.textContent = `step ${String(k).padStart(2, '0')} · ${(k * 360 / N).toFixed(1)}°`;
    },
    leave: () => { go(REST); read.textContent = 'rest'; },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { STEP = v; }, destroy: bag.dispose };
}

export default {
  name: 'stepper',
  means: 'A stepper motor: its dial needle steps toward the pointer one detent at a time, the shorter way round.',
  rules: [1, 2, 5, 8],
  range: [160, 100, 55],
  tour: [[262, 70], [150, 118], [110, 80], null],
  mount,
};
