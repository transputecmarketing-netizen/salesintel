import HL from './vendor/hairline-kernel.js';
/**
 * Radar: a round range plate with its range rings and bearing ticks, three
 * contacts standing on it, and in the middle a mast whose antenna bar sweeps
 * round, the beam drawn on the plate. Each time the beam passes a contact an
 * echo rises over it as a dot and fades. The pointer on the plate is a
 * target too: when the beam crosses its bearing, a bright echo rises there
 * and the beam gives up the bright. Ambient: it sweeps while on screen and
 * sleeps when it is not; under reduced motion it holds still. The slider is
 * the sweep rate, in turns a second.
 *
 * The target is the pointer projected onto the plate, which never moves.
 */
const {
  Cam, circ, clamp, EASE_LIFT, facing, fit, open, poly, prism, proj, reducedMotion, rings, seg, unproj,
  disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const R = 70, ZM = 22, BAR = 21, LIFE = 2600, RISE = 12, TAU = Math.PI * 2;
const CONTACTS = [[38, -24, 9, 6, 8], [-32, 30, 7, 7, 6], [20, 44, 5, 9, 11]];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let rate = value, theta = 2.2, over = null, echoes = [];
  const C = Cam(45, 0.5, 1.95);
  fit(C, [[-R, -R, -4], [R, R, -4], [R, -R, -4], [-R, R, -4], [0, 0, ZM + 6], [-R * 0.7, -R * 0.7, RISE + 2]], 200, 168);
  const P = proj(C), front = facing(C);
  const g = mk('g', {}, svg);

  // the plate: a large round, so built from many-sided rings; two range rings and twelve bearing ticks
  put(solid(g), prism(P, front, circ(R, 120), circ(R - 2, 120), -4, 0));
  mk('path', { d: [24, 47].map((r) => poly(circ(r, 72).map((q) => P(q.u, q.v, 0)))).join(''), class: 'nf dash' }, g);
  for (let k = 0; k < 12; k++) place(flatDot(g, C, k % 3 ? 0.6 : 1, 'dot off'), P(64 * Math.cos((k * TAU) / 12), 64 * Math.sin((k * TAU) / 12), 0));
  const beam = mk('path', { class: 'nf hi' }, g);

  // contacts and the mast share one layer, painted back to front by x + y
  const items = CONTACTS.map(([x, y, w, d, h]) => ({ key: x + y, draw: (el) => put(el, prism(P, front, ...rings(x - w, y - d, x + w, y + d, 2, 0.9), 0, h)) }));
  items.push({ key: 0, mast: true });
  items.sort((a, b) => a.key - b.key);
  let bar = null;
  for (const it of items) {
    if (!it.mast) { it.draw(solid(g)); continue; }
    put(solid(g), prism(P, front, circ(8, 40), circ(7, 40), 0, 5));
    put(solid(g), prism(P, front, circ(3, 24), circ(2.3, 24), 5, ZM));
    bar = solid(g);
  }
  const echoG = mk('g', {}, g);

  let drawnT = NaN;
  function draw(t) {
    if (t === drawnT) return;
    drawnT = t;
    const c = Math.cos(t), s = Math.sin(t);
    beam.setAttribute('d', seg(P(0, 0, 0), P(66 * c, 66 * s, 0)));
    // the antenna: a long slotted bar across the beam, turned with it
    const turn = (ring) => ring.map((q) => ({ u: q.u * c - q.v * s, v: q.u * s + q.v * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c }));
    const [ar, ai] = rings(-2.4, -BAR, 2.4, BAR, 2.2, 0.8);
    put(bar, prism(P, front, turn(ar), turn(ai), ZM, ZM + 4));
  }

  /** An echo over a point: a dot that rises on the lift curve and steps down through the dot weights. */
  function echo(x, y, z0, bright) {
    if (echoes.length > 8) echoes.shift().g.remove();
    const eg = mk('g', {}, echoG);
    echoes.push({ x, y, z0, bright, t0: performance.now(), g: eg, drop: mk('path', { class: 'nf dash' }, eg), dot: flatDot(eg, C, bright ? 2.6 : 1.8, bright ? 'dot' : 'dot m'), cls: '' });
  }
  const bearing = (x, y) => (Math.atan2(y, x) + TAU) % TAU;
  const crossed = (b, a0, a1) => { const d = (b - a0 + TAU) % TAU; return d > 0 && d <= a1 - a0; };

  const B = register(stage, (dt, now) => {
    if (reducedMotion()) { draw(theta); return false; }
    const a0 = theta % TAU, step = dt * rate * TAU;
    theta += step;
    for (const [x, y, , , h] of CONTACTS) if (crossed(bearing(x, y), a0, a0 + step)) echo(x, y, h, false);
    if (over && crossed(bearing(over[0], over[1]), a0, a0 + step)) echo(over[0], over[1], 0, true);
    draw(theta % TAU);
    echoes = echoes.filter((e) => {
      const age = now - e.t0;
      if (age > LIFE) { e.g.remove(); return false; }
      const z = e.z0 + RISE * EASE_LIFT(clamp(age / 700, 0, 1));
      place(e.dot, P(e.x, e.y, z));
      e.drop.setAttribute('d', open([P(e.x, e.y, z), P(e.x, e.y, e.z0)]));
      const k = age < LIFE * 0.4 ? (e.bright ? 'dot' : 'dot m') : age < LIFE * 0.75 ? 'dot m' : 'dot off';
      if (k !== e.cls) { e.cls = k; e.dot.setAttribute('class', k); }
      return true;
    });
    return true;
  });
  bag.add(B.unregister);

  bag.add(pointer(stage, {
    move: (p) => {
      const q = unproj(C, p[0], p[1], 0), r = Math.hypot(q[0], q[1]);
      over = r < R - 4 && r > 9 ? q : null;
      beam.setAttribute('class', over ? 'nf sil' : 'nf hi');
      read.textContent = over ? `rng ${Math.round(r)} · ${String(Math.round((bearing(q[0], q[1]) * 180) / Math.PI)).padStart(3, '0')}°` : 'rest';
      B.wake();
    },
    leave: () => { over = null; beam.setAttribute('class', 'nf hi'); read.textContent = 'rest'; },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { rate = v; }, destroy: bag.dispose };
}

export default {
  name: 'radar',
  means: 'A radar sweeps its range plate; each pass raises an echo over every contact, and a bright one where the pointer is.',
  rules: [1, 4, 7, 10],
  range: [0.12, 0.22, 0.4],
  tour: [[290, 190], [130, 210], [200, 120], null],
  mount,
};
