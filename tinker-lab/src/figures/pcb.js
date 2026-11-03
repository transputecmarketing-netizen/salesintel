import HL from './vendor/hairline-kernel.js';
/**
 * PCB: a small circuit board, its silkscreen, and the copper on it: an
 * eight-pin chip footprint, a resistor and a capacitor, an LED, a test point
 * and a four-pin header, joined by six nets of traces. The trace under the
 * pointer lifts off the board, and the pads on its net follow it up one by
 * one, the nearest first, so you see what that copper connects. Dashed drops
 * tie the lifted copper to where it sits. At rest the data net stands half
 * lifted, bright. The slider is the lift, in world units.
 *
 * Picking projects the pointer onto the board's top, which never moves, and
 * measures it against each net's RESTING copper.
 */
const {
  Cam, circ, extremes, facing, fit, poly, prism, proj, ringAt, rings, rrect, seg, unproj,
  tdone, tset, tval, tween, disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const BX = 60, BY = 42, T = 3, W = 1.3, STEP = 60, REST = 2;
/** Pads: [x, y, half-width, half-height, round]. */
const PADS = {
  u1: [-24, -9], u2: [-24, -3], u3: [-24, 3], u4: [-24, 9], u5: [-6, 9], u6: [-6, 3], u7: [-6, -3], u8: [-6, -9],
  ra: [10, -28], rb: [24, -28], ca: [10, 28], cb: [24, 28], la: [-46, -30], lb: [-46, -18], tp: [-46, 22],
  j1: [48, -18], j2: [48, -6], j3: [48, 6], j4: [48, 18],
};
const SHAPE = (k) => (k[0] === 'u' ? [3, 1.4, 0.6] : k[0] === 'j' || k === 'tp' ? [2.8, 2.8, 2.8] : [2.2, 2.2, 0.8]);
const NETS = [
  { name: 'VCC', pads: ['j1', 'rb'], path: [[48, -18], [38, -28], [24, -28]] },
  { name: 'LED', pads: ['ra', 'u8', 'la'], path: [[10, -28], [0, -28], [-6, -22], [-6, -9]], more: [[-24, -9], [-34, -9], [-46, -21], [-46, -30]] },
  { name: 'SDA', pads: ['u7', 'j2'], path: [[-6, -3], [30, -3], [33, -6], [48, -6]] },
  { name: 'SCL', pads: ['u6', 'j3'], path: [[-6, 3], [30, 3], [33, 6], [48, 6]] },
  { name: 'GND', pads: ['j4', 'cb', 'lb'], path: [[48, 18], [38, 28], [24, 28]], more: [[-46, -18], [-38, -12], [-38, 14], [-32, 20]] },
  { name: 'ADC', pads: ['ca', 'u5', 'u3', 'tp'], path: [[10, 28], [0, 28], [-6, 22], [-6, 9]], more: [[-24, 3], [-36, 3], [-46, 13], [-46, 22]] },
];

/** A trace's outline: the polyline offset both ways, with round caps, as one closed ring of world points. */
function ribbon(pts) {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    const k = i === 0 || i === n - 1 ? 1 : 1 / Math.cos(Math.PI / 8);
    L.push([pts[i][0] - (dy / l) * W * k, pts[i][1] + (dx / l) * W * k]);
    R.push([pts[i][0] + (dy / l) * W * k, pts[i][1] - (dx / l) * W * k]);
  }
  const cap = (p, q, from) => { const a0 = Math.atan2(q[1] - p[1], q[0] - p[0]) + from, out = []; for (let s = 1; s < 6; s++) out.push([p[0] + W * Math.cos(a0 + (s / 6) * Math.PI), p[1] + W * Math.sin(a0 + (s / 6) * Math.PI)]); return out; };
  return [...L, ...cap(pts[n - 1], pts[n - 2], -Math.PI / 2), ...R.reverse(), ...cap(pts[0], pts[1], -Math.PI / 2)];
}
const dseg = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy))); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let LIFT = value;
  const C = Cam(45, 0.5, 2.0);
  fit(C, [[-BX, -BY, 0], [BX, BY, 0], [BX, -BY, 0], [-BX, BY, 0], [-BX, -BY, T + 22], [BX, -BY, T + 22]], 200, 168);
  const P = proj(C), front = facing(C);
  const g = mk('g', {}, svg);

  // the board, its mounting holes, and the silkscreen: the chip's outline and pin-1 dot, the parts' outlines
  const [br, bi] = rings(-BX, -BY, BX, BY, 5, 1.8);
  put(solid(g), prism(P, front, br, bi, 0, T));
  for (const [x, y] of [[-54, -36], [54, -36], [-54, 36], [54, 36]]) mk('path', { d: poly(circ(2.6, 20).map((q) => P(x + q.u, y + q.v, T))), class: 'nf lo' }, g);
  const silk = [[-20, -14, -10, 14], [6, -32, 28, -24], [6, 24, 28, 32], [42, -24, 54, 24], [-51, -35, -41, -13]].map(([a, b, c, d]) => poly(ringAt(P, rrect(a, b, c, d, 1.5, 3), T)));
  mk('path', { d: silk.join(''), class: 'nf lo' }, g);
  place(flatDot(g, C, 0.9, 'dot off'), P(-17.5, -11.5, T));

  // the pads on no net: the chip's three spare pins
  for (const k of ['u1', 'u2', 'u4']) { const [x, y] = PADS[k], [hw, hh, r] = SHAPE(k); put(solid(g), prism(P, front, ...rings(x - hw, y - hh, x + hw, y + hh, r, 0.5), T, T + 0.6)); }
  const layer = mk('g', {}, g);
  const nets = NETS.map((N) => {
    const ng = mk('g', {}, layer), drop = mk('path', { class: 'nf dash' }, ng);
    const runs = [N.path, N.more].filter(Boolean);
    const tr = runs.map(() => mk('path', {}, ng));
    const pads = N.pads.map((k) => {
      const [x, y] = PADS[k], [hw, hh, r] = SHAPE(k), [ring, inner] = rings(x - hw, y - hh, x + hw, y + hh, r, 0.5);
      return { x, y, ring, inner, ext: extremes(P, ring), el: solid(ng), tw: tween(0) };
    });
    return { ...N, g: ng, drop, runs, tr, pads, tw: tween(0), drawn: '' };
  });

  function draw(N, now) {
    const f = tval(N.tw, now), fs = N.pads.map((p) => tval(p.tw, now)), key = [f, ...fs, LIFT].join();
    if (key === N.drawn) return;
    N.drawn = key;
    const z = T + 0.05 + f * LIFT, d = [];
    N.runs.forEach((pts, i) => N.tr[i].setAttribute('d', poly(ribbon(pts).map(([x, y]) => P(x, y, z)))));
    if (f > 0.02) for (const pts of N.runs) for (const [x, y] of pts.slice(1, -1)) d.push(seg(P(x, y, z), P(x, y, T)));
    N.pads.forEach((p, k) => {
      const zp = T + fs[k] * LIFT;
      put(p.el, prism(P, front, p.ring, p.inner, zp, zp + 0.6));
      if (fs[k] > 0.02) for (const q of p.ext) d.push(seg(P(q.u, q.v, zp), P(q.u, q.v, T)));
    });
    N.drop.setAttribute('d', d.join(''));
  }

  const B = register(stage, (_dt, now) => {
    let m = false;
    for (const N of nets) { draw(N, now); if (!tdone(N.tw, now) || N.pads.some((p) => !tdone(p.tw, now))) m = true; }
    return m;
  });
  bag.add(B.unregister);

  let act = -2;
  function choose(a, at) {
    if (a === act) return;
    const now = performance.now(), on = a >= 0 ? a : REST, peak = a >= 0 ? 1 : 0.5;
    act = a;
    nets.forEach((N, i) => {
      const up = i === on;
      tset(N.tw, up ? peak : 0, now, 0);
      // the pads follow the trace, nearest the pointer first
      const from = at || N.runs[0][0];
      const order = N.pads.map((p, k) => [k, Math.hypot(p.x - from[0], p.y - from[1])]).sort((x, y) => x[1] - y[1]);
      order.forEach(([k], rank) => tset(N.pads[k].tw, up ? peak : 0, now, (rank + 1) * STEP));
      N.tr.forEach((el) => el.setAttribute('class', up ? 'hi' : ''));
      N.pads.forEach((p) => p.el.sil.classList.toggle('hi', up));
      if (up) layer.appendChild(N.g);
    });
    read.textContent = a < 0 ? 'rest' : `${NETS[a].name} · ${NETS[a].pads.length} pads`;
    B.wake();
  }
  /** The net whose resting copper is nearest the point on the board, within reach of it, or -1. */
  function hit(p) {
    const q = unproj(C, p[0], p[1], T);
    let best = -1, bd = 3.2;
    nets.forEach((N, i) => {
      for (const pts of N.runs) for (let k = 1; k < pts.length; k++) { const d = dseg(q, pts[k - 1], pts[k]); if (d < bd) { bd = d; best = i; } }
      for (const pd of N.pads) { const d = Math.hypot(q[0] - pd.x, q[1] - pd.y) - 2; if (d < bd) { bd = d; best = i; } }
    });
    return [best, q];
  }
  choose(-1);
  bag.add(pointer(stage, { move: (p) => { const [a, q] = hit(p); choose(a, q); }, leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { LIFT = v; nets.forEach((N) => { N.drawn = ''; }); B.wake(); }, destroy: bag.dispose };
}

export default {
  name: 'pcb',
  means: 'A circuit board: the trace under the pointer lifts off, and the pads on its net follow it up, the nearest first.',
  rules: [1, 2, 4, 6],
  range: [10, 16, 24],
  tour: [[293, 194], [210, 223], [146, 158], null],
  mount,
};
