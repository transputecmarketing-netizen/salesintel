import HL from './vendor/hairline-kernel.js';
/**
 * Robot arm: a desktop arm on a round work table. A base, a turret that
 * yaws, a yoke, two links on the shoulder and elbow, a wrist that keeps the
 * gripper pointing down, and two fingers. The pointer on the table is the
 * target: the tip follows it on three springs, the shoulder and elbow are
 * solved with two-link inverse kinematics, the reach is clamped, and the
 * gripper closes once the tip has arrived. Over the part block the target is
 * the block's top, so the arm picks it. At rest it hovers over the block,
 * open. The slider is the reach, in world units from the axis.
 *
 * Links are capsules: a sphere projects to a circle, so a capsule's outline
 * is the hull of two circles on screen; each joint shows its axle as a dim
 * ellipse. Parts are depth-sorted by x + y, with height breaking ties.
 */
const {
  Cam, circ, clamp, facing, fit, hull, poly, prism, proj, rings, unproj,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const ZS = 27, L1 = 40, L2 = 36, WR = 5, FING = 11, RMIN = 22, TR = 78, CH = 7;
const CUBE = [36, -26, 13], REST = [CUBE[0], CUBE[1], CUBE[2] + 7];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value, over = null;
  const C = Cam(45, 0.5, 1.78);
  fit(C, [[-TR, -TR, -5], [TR, TR, -5], [TR, -TR, -5], [-TR, TR, -5], [0, 0, ZS + L1 + 6], [-50, -50, ZS + 50]], 200, 170);
  const P = proj(C), front = facing(C), S = C.S;
  const g = mk('g', {}, svg);
  // a round table, from many-sided rings, as rule 09 asks for a large round
  put(solid(g), prism(P, front, circ(TR, 96), circ(TR - 2, 96), -5, 0));
  const ring = mk('path', { class: 'nf dash' }, g);
  const layer = mk('g', {}, g);

  // static parts: the base plate, the part block
  const base = solid(layer);
  put(base, prism(P, front, circ(17, 48), circ(15.8, 48), 0, 4));
  const block = solid(layer), [cr, ci] = rings(CUBE[0] - CH, CUBE[1] - CH, CUBE[0] + CH, CUBE[1] + CH, 2.2, 1);
  put(block, prism(P, front, cr, ci, 0, CUBE[2]));
  // moving parts, redrawn each frame
  const turret = solid(layer), yoke = solid(layer), link1 = solid(layer), link2 = solid(layer), wrist = solid(layer);
  const fingers = solid(layer), palm = solid(layer);
  fingers.sil.classList.add('hi');
  fingers.cr.setAttribute('class', 'nf');
  const parts = [base, block, turret, yoke, link1, link2, wrist, palm, fingers];

  const circle = (p, r, n = 20) => { const c = P(...p); return Array.from({ length: n }, (_, k) => [c[0] + r * S * Math.cos((k / n) * 6.2832), c[1] + r * S * Math.sin((k / n) * 6.2832)]); };
  const capsule = (a, b, r) => poly(hull(circle(a, r).concat(circle(b, r))));
  const add = (a, v, s) => [a[0] + v[0] * s, a[1] + v[1] * s, a[2] + v[2] * s];
  /** A joint's axle, a disc in the arm's plane (spanned by h and up), seen as a dim ellipse. */
  const axle = (c, h, r) => poly(Array.from({ length: 24 }, (_, k) => { const t = (k / 24) * 6.2832; return P(...add(add(c, h, r * Math.cos(t)), [0, 0, 1], r * Math.sin(t))); }));

  const sp = REST.map((v) => spring(v, { eps: 0.02 }));
  const grip = spring(5, { eps: 0.01 });
  let order = '', drawn = '';
  function draw() {
    const [x, y, z] = sp.map((s) => s.x), key = [x, y, z, grip.x].map((v) => v.toFixed(2)).join();
    if (key === drawn) return;
    drawn = key;
    const yaw = Math.atan2(y, x), h = [Math.cos(yaw), Math.sin(yaw), 0], e = [-h[1], h[0], 0];
    const r = clamp(Math.hypot(x, y), RMIN, reach), zw = z + FING + WR;
    // two-link IK in the arm's plane, elbow up; the reach is clamped so the triangle always closes
    const dd = clamp(Math.hypot(r, zw - ZS), Math.abs(L1 - L2) + 4, L1 + L2 - 0.5);
    const a = Math.acos((L1 * L1 + dd * dd - L2 * L2) / (2 * L1 * dd)), b = Math.atan2(zw - ZS, r);
    const s0 = [0, 0, ZS], el = add(add(s0, h, L1 * Math.cos(a + b)), [0, 0, 1], L1 * Math.sin(a + b));
    const wr = add(add(s0, h, (dd * Math.cos(b))), [0, 0, 1], dd * Math.sin(b)), g0 = add(wr, [0, 0, -WR], 1);
    const turn = (x0, y0, x1, y1, rr) => rings(x0, y0, x1, y1, rr, 1).map((ring) => ring.map((q) => ({ u: q.u * h[0] - q.v * h[1], v: q.u * h[1] + q.v * h[0], nu: q.nu * h[0] - q.nv * h[1], nv: q.nu * h[1] + q.nv * h[0] })));
    put(turret, prism(P, front, circ(12.5, 40), circ(11.4, 40), 4, 15));
    const [yr, yi] = turn(-8, -7, 8, 7, 3.5);
    put(yoke, prism(P, front, yr, yi, 15, ZS - 2));
    put(link1, { sil: capsule(s0, el, 4.8), crease: axle(s0, h, 3.2) + axle(el, h, 2.8) });
    put(link2, { sil: capsule(el, wr, 3.9), crease: axle(wr, h, 2.4) });
    put(wrist, { sil: capsule(wr, g0, 3), crease: '' });
    const o = grip.x;
    put(palm, { sil: capsule(add(g0, e, -o - 1.6), add(g0, e, o + 1.6), 1.9), crease: '' });
    put(fingers, { sil: capsule(add(g0, e, -o), add(add(g0, e, -o), [0, 0, -FING], 1), 1.3) + capsule(add(g0, e, o), add(add(g0, e, o), [0, 0, -FING], 1), 1.3), crease: '' });
    // paint order: x + y, then height; re-appended only when it changes
    const mid = (p, q) => p[0] + q[0] + p[1] + q[1] + (p[2] + q[2]) * 0.5;
    const keys = [0, CUBE[0] * 2 + CUBE[1] * 2 + CUBE[2], 4, 12, mid(s0, el), mid(el, wr), mid(wr, g0), mid(g0, g0) + 0.1, mid(g0, g0) + 0.2];
    const ord = parts.map((p, i) => i).sort((i, j) => keys[i] - keys[j]);
    const sig = ord.join();
    if (sig !== order) { order = sig; ord.forEach((i) => layer.appendChild(parts[i].g)); }
  }

  const B = register(stage, (dt) => {
    let m = false;
    for (const s of sp) if (stepS(s, dt)) m = true;
    // the gripper closes once the tip has arrived where the pointer asks
    const near = over && Math.hypot(sp[0].x - sp[0].t, sp[1].x - sp[1].t, sp[2].x - sp[2].t) < 3;
    grip.t = near ? 2.2 : 5;
    if (stepS(grip, dt)) m = true;
    draw();
    return m || (over && grip.t !== grip.x);
  });
  bag.add(B.unregister);

  function aim() {
    let t = REST;
    if (over) {
      // the block is a stepped part: the pointer is unprojected onto its own top to test it
      const [bx, by] = unproj(C, over[0], over[1], CUBE[2]);
      const onBlock = Math.abs(bx - CUBE[0]) < CH + 1 && Math.abs(by - CUBE[1]) < CH + 1;
      let [x, y] = onBlock ? [bx, by] : unproj(C, over[0], over[1], 0);
      const r = Math.hypot(x, y), k = clamp(r, RMIN, reach) / (r || 1);
      x *= k; y *= k;
      t = [x, y, onBlock ? CUBE[2] + 0.5 : 0.5];
      const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
      read.textContent = `${onBlock ? 'block' : 'r ' + Math.round(Math.hypot(x, y))} · ${String(Math.round(deg)).padStart(3, '0')}°`;
      ring.setAttribute('d', poly(circ(5, 24).map((q) => P(x + q.u, y + q.v, t[2]))));
    } else { read.textContent = 'rest'; ring.setAttribute('d', ''); }
    t.forEach((v, i) => { sp[i].t = v; });
    B.wake();
  }
  bag.add(pointer(stage, {
    move: (p) => { over = p; aim(); },
    leave: () => { over = null; aim(); },
  }));
  aim();
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; if (over) aim(); drawn = ''; B.wake(); }, destroy: bag.dispose };
}

export default {
  name: 'robot-arm',
  means: 'A robot arm reaches the pointer on its table with two-link IK, and its gripper closes once it has arrived.',
  rules: [1, 3, 8, 9],
  range: [46, 60, 74],
  tour: [[187, 252], [106, 230], [278, 196], null],
  mount,
};
