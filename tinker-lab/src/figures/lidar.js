import HL from './vendor/hairline-kernel.js';
/**
 * Lidar: a cut-away room seen from above, its two far walls standing, a
 * sofa and a shelf against them, a waste bin, and on the floor a robot
 * vacuum with a spinning lidar turret. The laser sweeps round in a plane a
 * little above the floor, and every hit leaves a dot where it struck, so
 * the room's outline builds up as a point cloud that fades a turn later.
 * The pointer moves the bin on two springs; the dots it returns are bright,
 * and the beam gives up the bright to them. At rest the bin waits in a
 * corner. Ambient: it scans while on screen, sleeps when it is not, and
 * holds still under reduced motion. The slider is the scan rate, in turns a second.
 *
 * The bin follows the pointer projected onto the floor, which never moves.
 */
const {
  Cam, circ, clamp, facing, fit, prism, proj, reducedMotion, rings, seg, unproj,
  spring, stepS, disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const X0 = -62, X1 = 62, Y0 = -46, Y1 = 46, WH = 20, WT = 3, ZL = 6, NB = 120, BR = 6.5, TAU = Math.PI * 2;
const ROBOT = [6, 10], FURN = [[-56, -40, -20, -26, 12], [16, -42, 44, -34, 18], [-58, 2, -46, 30, 9]], REST = [44, 28];

/** Distance along a ray from o in direction d to the nearest box, wall or the bin, and whether the bin was hit. */
function cast(o, d, bin) {
  let best = 1e9, onBin = false;
  const slab = (a0, a1, b0, b1) => {
    const tx0 = (a0 - o[0]) / d[0], tx1 = (a1 - o[0]) / d[0], ty0 = (b0 - o[1]) / d[1], ty1 = (b1 - o[1]) / d[1];
    const tn = Math.max(Math.min(tx0, tx1), Math.min(ty0, ty1)), tf = Math.min(Math.max(tx0, tx1), Math.max(ty0, ty1));
    return tf >= tn && tn > 0 ? tn : 1e9;
  };
  // the room: the ray leaves through the box it starts in
  const ex = Math.min(d[0] > 0 ? (X1 - WT - o[0]) / d[0] : (X0 + WT - o[0]) / d[0], d[1] > 0 ? (Y1 - o[1]) / d[1] : (Y0 + WT - o[1]) / d[1]);
  best = ex;
  for (const [a0, b0, a1, b1] of FURN) best = Math.min(best, slab(a0, a1, b0, b1));
  const fx = o[0] - bin[0], fy = o[1] - bin[1], b = fx * d[0] + fy * d[1], c = fx * fx + fy * fy - BR * BR, disc = b * b - c;
  if (disc > 0) { const t = -b - Math.sqrt(disc); if (t > 0 && t < best) { best = t; onBin = true; } }
  return [best, onBin];
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let rate = value, theta = 0, over = null;
  const C = Cam(45, 0.5, 1.95);
  fit(C, [[X0, Y0, -3], [X1, Y1, -3], [X1, Y0, -3], [X0, Y1, -3], [X0, Y0, WH]], 200, 168);
  const P = proj(C), front = facing(C);
  const g = mk('g', {}, svg);

  // the floor, then the two far walls: the room is cut away on the near sides
  put(solid(g), prism(P, front, ...rings(X0, Y0, X1, Y1, 4, 1.5), -3, 0));
  put(solid(g), prism(P, front, ...rings(X0, Y0, X0 + WT, Y1 - 6, 1.2, 0.5), 0, WH));
  put(solid(g), prism(P, front, ...rings(X0, Y0, X1 - 6, Y0 + WT, 1.2, 0.5), 0, WH));
  // furniture, the robot and the bin, painted back to front by x + y (the bin's place in that order changes)
  const layer = mk('g', {}, g);
  const items = FURN.map(([a0, b0, a1, b1, h]) => { const el = solid(layer); put(el, prism(P, front, ...rings(a0, b0, a1, b1, 2.5, 1), 0, h)); return { el, key: a0 + a1 + b0 + b1 }; });
  const robot = solid(layer), turret = solid(mk('g', {}, robot.g));
  put(robot, prism(P, front, circ(10, 48).map((q) => ({ ...q, u: q.u + ROBOT[0], v: q.v + ROBOT[1] })), circ(9, 48).map((q) => ({ ...q, u: q.u + ROBOT[0], v: q.v + ROBOT[1] })), 0, 4));
  put(turret, prism(P, front, circ(3.6, 24).map((q) => ({ ...q, u: q.u + ROBOT[0], v: q.v + ROBOT[1] })), circ(2.8, 24).map((q) => ({ ...q, u: q.u + ROBOT[0], v: q.v + ROBOT[1] })), 4, ZL + 1.5));
  items.push({ el: robot, key: ROBOT[0] * 2 + ROBOT[1] * 2 });
  const bin = solid(layer);
  items.push({ el: bin, key: 0, bin: true });
  // the beam, then the point cloud: one dot per bearing bin, drawn over the solids that the laser can see
  const beam = mk('path', { class: 'nf hi' }, g);
  const dots = Array.from({ length: NB }, () => ({ el: flatDot(g, C, 0.85, 'dot off'), t: -1e9, hit: false, cls: '' }));
  const bx = spring(REST[0], { eps: 0.02 }), by = spring(REST[1], { eps: 0.02 });
  let order = '', drawnBin = '';

  function drawBin() {
    const key = bx.x.toFixed(2) + ',' + by.x.toFixed(2);
    if (key === drawnBin) return;
    drawnBin = key;
    const at = (r) => circ(r, 36).map((q) => ({ ...q, u: q.u + bx.x, v: q.v + by.x }));
    put(bin, prism(P, front, at(BR), at(BR - 1), 0, 14));
    items.find((it) => it.bin).key = 2 * (bx.x + by.x);
    const ord = items.map((it, i) => i).sort((i, j) => items[i].key - items[j].key), sig = ord.join();
    if (sig !== order) { order = sig; ord.forEach((i) => layer.appendChild(items[i].el.g)); }
  }

  const B = register(stage, (dt, now) => {
    const m = stepS(bx, dt) | stepS(by, dt);
    drawBin();
    if (reducedMotion()) return !!m;
    const turn = 1000 / rate, from = theta;
    theta += dt * rate * TAU;
    // every bin the beam swept this frame takes a fresh hit
    for (let k = Math.ceil((from / TAU) * NB); k <= Math.floor((theta / TAU) * NB); k++) {
      const a = (k / NB) * TAU, d = [Math.cos(a), Math.sin(a)], [t, onBin] = cast(ROBOT, d, [bx.x, by.x]), D = dots[((k % NB) + NB) % NB];
      place(D.el, P(ROBOT[0] + d[0] * t, ROBOT[1] + d[1] * t, ZL));
      D.t = now; D.hit = onBin;
    }
    const a = theta % TAU, d = [Math.cos(a), Math.sin(a)], [t] = cast(ROBOT, d, [bx.x, by.x]);
    beam.setAttribute('d', seg(P(ROBOT[0], ROBOT[1], ZL), P(ROBOT[0] + d[0] * t, ROBOT[1] + d[1] * t, ZL)));
    // the cloud fades through the three dot weights over a turn
    for (const D of dots) {
      const age = (now - D.t) / turn, k = age < 0.35 ? (D.hit && over ? 'dot' : 'dot m') : age < 1 ? 'dot m' : 'dot off';
      if (k !== D.cls) { D.cls = k; D.el.setAttribute('class', k); }
    }
    return true;
  });
  bag.add(B.unregister);

  function aim() {
    if (over) {
      bx.t = clamp(over[0], X0 + WT + BR + 1, X1 - BR - 2);
      by.t = clamp(over[1], Y0 + WT + BR + 1, Y1 - BR - 2);
      const dx = bx.t - ROBOT[0], dy = by.t - ROBOT[1];
      read.textContent = `bin ${Math.round(Math.hypot(dx, dy))} · ${String(Math.round(((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360)).padStart(3, '0')}°`;
    } else { bx.t = REST[0]; by.t = REST[1]; read.textContent = 'rest'; }
    beam.setAttribute('class', over ? 'nf sil' : 'nf hi');
    bin.sil.classList.toggle('hi', !!over);
    B.wake();
  }
  bag.add(pointer(stage, { move: (p) => { over = unproj(C, p[0], p[1], 0); aim(); }, leave: () => { over = null; aim(); } }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { rate = v; }, destroy: bag.dispose };
}

export default {
  name: 'lidar',
  means: 'A robot vacuum’s lidar sweeps the room and leaves a fading point cloud; the pointer moves the bin it finds.',
  rules: [3, 4, 5, 7],
  range: [0.25, 0.45, 0.8],
  tour: [[150, 200], [280, 150], [220, 240], null],
  mount,
};
