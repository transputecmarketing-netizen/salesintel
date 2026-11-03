import HL from './vendor/hairline-kernel.js';
/**
 * Solar: a solar panel on a two-axis tracker, the kind a weather station or
 * a garden sensor runs on. A ground plate, a post, a yoke, and the panel:
 * a framed plate ruled into its cells. The pointer is the sun: across the
 * screen it sets the panel's azimuth, up and down the sun's height, and the
 * panel turns to face it on two springs, its normal drawn as a dashed ray.
 * The reach is clamped, so the panel always shows its cells. At rest it
 * leans toward the morning. The slider is the azimuth reach, in degrees.
 *
 * The aim reads only the pointer's offset on screen, never what is drawn.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rad, rings, rrect, seg, circ,
  spring, stepS, disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const PW = 34, PH = 23, TK = 2.4, ZP = 40, AZ0 = 45, REST = [18, 34];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value, over = null;
  const C = Cam(45, 0.5, 2.6);
  const az = spring(REST[0], { eps: 0.02 }), tl = spring(REST[1], { eps: 0.02 });

  /** The panel's frame for azimuth a (where it faces) and tilt t (0 lies flat, 90 stands up). */
  const frame = (a, t) => {
    const ca = Math.cos(rad(a)), sa = Math.sin(rad(a)), ct = Math.cos(rad(t)), st = Math.sin(rad(t));
    return { u: [-sa, ca, 0], v: [-ca * ct, -sa * ct, st], n: [ca * st, sa * st, ct] };
  };
  const at = (F, a, b, w) => [F.u[0] * a + F.v[0] * b + F.n[0] * w, F.u[1] * a + F.v[1] * b + F.n[1] * w, ZP + F.u[2] * a + F.v[2] * b + F.n[2] * w];
  const pts = [[-24, -24, 0], [24, 24, 0], [24, -24, 0], [-24, 24, 0]];
  for (const a of [AZ0 - 62, AZ0 + 62]) for (const t of [12, 72]) { const F = frame(a, t); for (const [x, y] of [[-PW, -PH], [PW, -PH], [PW, PH], [-PW, PH]]) pts.push(at(F, x, y, 0)); pts.push(at(F, 0, 0, 30)); }
  fit(C, pts, 200, 166);
  const P = proj(C), front = facing(C), Pv = (q) => P(q[0], q[1], q[2]);
  const g = mk('g', {}, svg);

  // the ground plate and its four anchor bolts, the post, the yoke's bearing
  const [br, bi] = rings(-20, -20, 20, 20, 5, 1.5);
  put(solid(g), prism(P, front, br, bi, 0, 3.5));
  for (const [x, y] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) place(flatDot(g, C, 1.1, 'dot m'), P(x, y, 3.5));
  put(solid(g), prism(P, front, circ(6, 32), circ(5, 32), 3.5, 7));
  put(solid(g), prism(P, front, circ(3, 24), circ(2.3, 24), 7, ZP - 5));
  const yoke = solid(g);
  const panel = solid(g), cells = mk('path', { class: 'nf lo' }, panel.g);
  // the normal leaves the panel's face toward the sun, so it is painted after the panel
  const ray = mk('path', { class: 'nf dash' }, g), tip = flatDot(g, C, 0.9, 'dot m');
  panel.sil.classList.add('hi');
  const outline = rrect(-PW, -PH, PW, PH, 2.5, 4), inset = rrect(-PW + 1.6, -PH + 1.6, PW - 1.6, PH - 1.6, 1.4, 4);

  let drawn = '';
  function draw(a, t) {
    const key = a.toFixed(2) + ',' + t.toFixed(2);
    if (key === drawn) return;
    drawn = key;
    const F = frame(a, t), face = (ring, w) => ring.map((q) => Pv(at(F, q.u, q.v, w)));
    // the yoke: a short block turned with the azimuth, holding the tilt axis
    const ca = Math.cos(rad(a)), sa = Math.sin(rad(a));
    const yr = rrect(-4, -9, 4, 9, 2.5, 4).map((q) => ({ u: q.u * ca - q.v * sa, v: q.u * sa + q.v * ca, nu: q.nu * ca - q.nv * sa, nv: q.nu * sa + q.nv * ca }));
    put(yoke, prism(P, front, yr, yr.map((q) => ({ ...q, u: q.u * 0.8, v: q.v * 0.85 })), ZP - 5, ZP - 2));
    put(panel, { sil: poly(hull(face(outline, 0).concat(face(outline, -TK)))), crease: poly(face(inset, 0)) });
    panel.cr.setAttribute('class', 'nf lo');
    // six by four cells, as the bus lines between them
    const lines = [];
    for (let i = 1; i < 6; i++) { const x = -PW + 1.6 + (i * (2 * PW - 3.2)) / 6; lines.push(seg(Pv(at(F, x, -PH + 1.6, 0)), Pv(at(F, x, PH - 1.6, 0)))); }
    for (let j = 1; j < 4; j++) { const y = -PH + 1.6 + (j * (2 * PH - 3.2)) / 4; lines.push(seg(Pv(at(F, -PW + 1.6, y, 0)), Pv(at(F, PW - 1.6, y, 0)))); }
    cells.setAttribute('d', lines.join(''));
    ray.setAttribute('d', open([Pv(at(F, 0, 0, 0)), Pv(at(F, 0, 0, 30))]));
    place(tip, Pv(at(F, 0, 0, 30)));
  }

  const B = register(stage, (dt) => { const m1 = stepS(az, dt), m2 = stepS(tl, dt); draw(az.x, tl.x); return m1 || m2; });
  bag.add(B.unregister);

  const hub = P(0, 0, ZP);
  function aim() {
    if (over) {
      // across the screen sets the azimuth (right faces right), up and down the sun's height
      az.t = AZ0 - reach * Math.tanh((over[0] - hub[0]) / 110);
      tl.t = clamp(14 + (over[1] - 40) * 0.26, 14, 70);
      read.textContent = `az ${String(Math.round((az.t + 360) % 360)).padStart(3, '0')}° · tilt ${Math.round(tl.t)}°`;
    } else { az.t = REST[0]; tl.t = REST[1]; read.textContent = 'rest'; }
    B.wake();
  }
  bag.add(pointer(stage, { move: (p) => { over = p; aim(); }, leave: () => { over = null; aim(); } }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; if (over) aim(); }, destroy: bag.dispose };
}

export default {
  name: 'solar',
  means: 'A solar panel on a two-axis tracker turns on two springs to face the pointer, as if the pointer were the sun.',
  rules: [3, 5, 8, 9],
  range: [25, 45, 62],
  tour: [[320, 70], [200, 60], [80, 150], null],
  mount,
};
