import HL from './vendor/hairline-kernel.js';
/**
 * Servo: a hobby micro servo, as on every robot kit. A body with mounting
 * tabs, the output shaft set off to one end on its boss, the gear bump beside
 * it, a cable out of the far end, and a single-arm horn on the shaft. The
 * horn follows the pointer's angle round the shaft on a spring, clamped to
 * the servo's travel, 0 to 180 degrees, which a dashed arc shows. At rest it
 * stands at 120 degrees. The slider is the spring's stiffness: how fast the
 * servo answers.
 *
 * The aim reads only the pointer's angle on a fixed plane through the horn,
 * against the shaft, which never moves: nothing can flicker.
 */
const {
  Cam, circ, clamp, facing, fit, hull, open, poly, prism, proj, rad, rings, unproj,
  spring, stepS, disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const SX = 16, ZT = 36, ZH = 42, HT = 2.4, ARM = 25, REST = 120;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const th = spring(REST, { k: value, c: 1.7 * Math.sqrt(value), eps: 0.02 });
  const C = Cam(45, 0.5, 2.95);
  fit(C, [[-52, -26, 0], [SX + ARM + 4, 26, 0], [SX + ARM + 4, -26, ZH + 4], [-52, 26, 0], [-38, -26, ZH], [SX, -ARM - 4, ZH + 4]], 200, 168);
  const P = proj(C), front = facing(C);
  const g = mk('g', {}, svg);
  const at = (ring, cx, cy) => ring.map((q) => ({ ...q, u: q.u + cx, v: q.v + cy }));

  // the cable: three wires leaving the far end and curling away on the desk
  const cable = [-1.6, 0, 1.6].map((o) => {
    const pts = [];
    for (let t = 0; t <= 1.0001; t += 0.1) pts.push(P(-28 - 22 * t, o + 10 * t * t, 5 * (1 - t) + 0.6));
    return open(pts);
  });
  mk('path', { d: cable.join(''), class: 'nf' }, g);
  // the body, its mounting tabs (with their holes) and the top of the case
  const [lr, li] = rings(-28, -12, 28, 12, 3, 1.2);
  put(solid(g), prism(P, front, lr, li, 0, 26));
  const [tr, ti] = rings(-39, -12, 39, 12, 3.5, 1.2);
  put(solid(g), prism(P, front, tr, ti, 26, 28.4));
  for (const x of [-34, 34]) place(flatDot(g, C, 1.5, 'dot off'), P(x, 0, 28.4));
  const [ur, ui] = rings(-28, -12, 28, 12, 3, 1.2);
  put(solid(g), prism(P, front, ur, ui, 28.4, ZT));
  // the gear bump, then the boss and the splined shaft
  put(solid(g), prism(P, front, at(circ(5, 28), 4, 0), at(circ(4, 28), 4, 0), ZT, ZT + 2.2));
  put(solid(g), prism(P, front, at(circ(8.5, 40), SX, 0), at(circ(7.4, 40), SX, 0), ZT, ZT + 4));
  put(solid(g), prism(P, front, at(circ(2.6, 20), SX, 0), at(circ(1.8, 20), SX, 0), ZT + 4, ZH));

  // the travel: a dashed arc at the horn's height, its two ends, and where the horn is headed
  const ang = (t) => rad(t - 90), onArc = (t, r) => P(SX + r * Math.cos(ang(t)), r * Math.sin(ang(t)), ZH + HT / 2);
  const arc = [];
  for (let t = 0; t <= 180; t += 6) arc.push(onArc(t, ARM + 3));
  mk('path', { d: open(arc), class: 'nf dash' }, g);
  for (const t of [0, 90, 180]) place(flatDot(g, C, 0.9, 'dot off'), onArc(t, ARM + 3));
  const goal = flatDot(g, C, 1.1, 'dot m');

  // the horn: a hub and a tapering arm, a thin plate: its outline, its top edge, its holes and the screw
  const horn = solid(g), holes = [9, 13.5, 18, 22.5].map(() => flatDot(horn.g, C, 0.75, 'dot off'));
  const screw = flatDot(horn.g, C, 1.4, 'dot m');
  horn.sil.classList.add('hi');
  const disc = (cx, cy, r, z, n) => circ(r, n).map((q) => P(cx + q.u, cy + q.v, z));

  let drawn = NaN;
  function draw(t) {
    if (t === drawn) return;
    drawn = t;
    const c = Math.cos(ang(t)), s = Math.sin(ang(t)), tx = SX + ARM * c, ty = ARM * s;
    const top = disc(SX, 0, 5.6, ZH + HT, 32).concat(disc(tx, ty, 3, ZH + HT, 20));
    put(horn, {
      sil: poly(hull(top.concat(disc(SX, 0, 5.6, ZH, 32), disc(tx, ty, 3, ZH, 20)))),
      crease: poly(hull(disc(SX, 0, 4.8, ZH + HT, 32).concat(disc(tx, ty, 2.2, ZH + HT, 20)))),
    });
    horn.cr.setAttribute('class', 'nf lo');
    [9, 13.5, 18, 22.5].forEach((r, k) => place(holes[k], P(SX + r * c, r * s, ZH + HT)));
    place(screw, P(SX, 0, ZH + HT));
  }

  const B = register(stage, (dt) => { const m = stepS(th, dt); draw(th.x); return m; });
  bag.add(B.unregister);

  function aim(target, label) {
    th.t = target;
    place(goal, onArc(target, ARM + 3));
    read.textContent = label;
    B.wake();
  }
  aim(REST, 'rest');
  bag.add(pointer(stage, {
    move: (p) => {
      const [x, y] = unproj(C, p[0], p[1], ZH + HT / 2), dx = x - SX, dy = y;
      if (Math.hypot(dx, dy) < 3) return;
      const phi = (Math.atan2(dy, dx) * 180) / Math.PI;
      const t = Math.round(phi > 90 ? 180 : phi < -90 ? 0 : clamp(phi + 90, 0, 180));
      aim(t, `${String(t).padStart(3, '0')}°`);
    },
    leave: () => aim(REST, 'rest'),
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { th.k = v; th.c = 1.7 * Math.sqrt(v); B.wake(); },
    destroy: bag.dispose,
  };
}

export default {
  name: 'servo',
  means: 'A hobby servo: the horn follows the pointer round its shaft on a spring, clamped to its travel of 0 to 180 degrees.',
  rules: [1, 3, 8, 9],
  range: [40, 100, 220],
  tour: [[312, 104], [300, 152], [205, 162], null],
  mount,
};
