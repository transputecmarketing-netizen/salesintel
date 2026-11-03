import HL from './vendor/hairline-kernel.js';
/**
 * Breadboard: a solderless breadboard with its hidden spring clips. Every
 * column of five holes on either side of the centre channel is one metal clip,
 * and each power rail is one long clip. The hole under the pointer lifts its
 * clip out of the board, so you see which holes are joined: a strip of five,
 * or a whole rail rising as one. Its neighbours rise a little after it,
 * staggered by distance, and settle back when the pointer leaves. At rest one
 * strip stands half out, bright. The slider is the lift, in viewBox units.
 *
 * Picking projects the pointer onto the board's top, which never moves, and
 * finds the clip whose resting slot holds it: a lifted clip cannot flip it.
 */
const {
  Cam, clamp, extremes, facing, fit, prism, proj, ringAt, rings, rrect, seg, poly, unproj,
  tdone, tset, tval, tween, disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const NC = 12, PX = 6.5, T = 6, HROWS = [-26, -20, -14, -8, -2], LROWS = [6, 12, 18, 24, 30];
const RAILS = [-40, -34, 40, 46], X0 = -9, X1 = (NC - 1) * PX + 9, Y0 = -48, Y1 = 54;
const STEP = 45, REST_I = 4, FALL = [1, 0.34, 0.12];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let LIFT = value;
  const C = Cam(45, 0.5, 2.3);
  fit(C, [[X0, Y0, 0], [X1, Y1, 0], [X1, Y0, 0], [X0, Y1, 0], [X0, Y0, T + 26], [X1, Y0, T + 26]], 200, 170);
  const P = proj(C), front = facing(C);
  const g = mk('g', {}, svg);

  // the board, its centre channel, and the stripes that mark each pair of rails
  const [br, bi] = rings(X0, Y0, X1, Y1, 5, 1.8);
  put(solid(g), prism(P, front, br, bi, 0, T));
  const marks = [seg(P(X0 + 4, 1.2, T), P(X1 - 4, 1.2, T)), seg(P(X0 + 4, 2.8, T), P(X1 - 4, 2.8, T))];
  for (const y of [-45, -29, 35, 51]) marks.push(seg(P(2, y, T), P(X1 - 11, y, T)));
  mk('path', { d: marks.join(''), class: 'nf lo' }, g);

  // the clips: 24 strips of five, then four rails of twelve
  const items = [];
  for (const [h, rows] of [[0, HROWS], [1, LROWS]]) for (let c = 0; c < NC; c++) {
    const x = c * PX;
    items.push({ kind: 's', c, h, x0: x - 2.4, y0: rows[0] - 2.4, x1: x + 2.4, y1: rows[4] + 2.4, holes: rows.map((y) => [x, y]) });
  }
  RAILS.forEach((y, r) => items.push({ kind: 'r', c: r, h: r < 2 ? 0 : 1, x0: -2.4, y0: y - 2.4, x1: (NC - 1) * PX + 2.4, y1: y + 2.4, holes: Array.from({ length: NC }, (_, c) => [c * PX, y]) }));
  // each clip's slot, cut in the board's top: drawn on the board, under every clip
  mk('path', { d: items.map((it) => poly(ringAt(P, rrect(it.x0 - 0.6, it.y0 - 0.6, it.x1 + 0.6, it.y1 + 0.6, 2, 3), T))).join(''), class: 'nf lo' }, g);
  const layer = mk('g', {}, g);
  for (const it of items) {
    it.key = (it.x0 + it.x1 + it.y0 + it.y1) / 2;
    [it.ring, it.inner] = rings(it.x0, it.y0, it.x1, it.y1, 2.2, 0.7);
    it.ext = extremes(P, it.ring);
    it.g = mk('g', {}, layer);
    it.drop = mk('path', { class: 'nf dash' }, it.g);
    it.el = solid(it.g);
    it.dots = it.holes.map(() => flatDot(it.g, C, 0.95, 'dot off'));
    it.tw = tween(0);
    it.drawn = NaN;
  }

  function draw(it, f) {
    const z0 = T + f * LIFT, z1 = f > 0.02 ? z0 + 1 + 2.2 * clamp(f * 3, 0, 1) : T;
    const key = z0 + ',' + LIFT;
    if (key === it.drawn) return;
    it.drawn = key;
    it.drop.setAttribute('d', f > 0.02 ? it.ext.map((q) => seg(P(q.u, q.v, z0), P(q.u, q.v, T))).join('') : '');
    // flush, a clip is only its five holes in the slot; it shows as a solid once it lifts
    const up = f > 0.02;
    it.el.g.setAttribute('visibility', up ? 'visible' : 'hidden');
    if (up) put(it.el, prism(P, front, it.ring, it.inner, z0, z1));
    it.holes.forEach(([x, y], k) => place(it.dots[k], P(x, y, z1)));
  }

  // lifted clips paint after the flat ones, back to front: re-appended only when that order changes
  let order = '';
  function sortLayer(now) {
    const up = items.filter((it) => it.tw.to > 0 || tval(it.tw, now) > 0.01).sort((a, b) => a.key - b.key);
    const sig = up.map((it) => items.indexOf(it)).join();
    if (sig !== order) { order = sig; for (const it of up) layer.appendChild(it.g); }
  }

  const B = register(stage, (_dt, now) => {
    let m = false;
    for (const it of items) { draw(it, tval(it.tw, now)); if (!tdone(it.tw, now)) m = true; }
    sortLayer(now);
    return m;
  });
  bag.add(B.unregister);

  /** How far clip j is from clip a, in clips: along the columns, plus one across the channel. */
  function dist(a, j) {
    const A = items[a], J = items[j];
    if (A.kind === 'r' || J.kind === 'r') return A === J ? 0 : A.kind === J.kind && A.h === J.h ? 1 : 9;
    return Math.abs(A.c - J.c) + (A.h === J.h ? 0 : 1);
  }
  let act = -2;
  function choose(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act >= 0 ? act : REST_I;
    act = a;
    const centre = a >= 0 ? a : REST_I, peak = a >= 0 ? 1 : 0.62;
    items.forEach((it, j) => {
      const d = dist(centre, j);
      tset(it.tw, d < FALL.length ? peak * FALL[d] : 0, now, dist(from, j) * STEP);
      const on = j === centre;
      it.el.sil.classList.toggle('hi', on);
      it.dots.forEach((el) => el.setAttribute('class', on ? 'dot' : 'dot off'));
    });
    const it = items[a];
    read.textContent = a < 0 ? 'rest' : it.kind === 'r' ? `rail ${it.c < 2 ? 'top' : 'bottom'} ${['−', '+', '+', '−'][it.c]}` : `col ${String(it.c + 1).padStart(2, '0')} · ${it.h ? 'f–j' : 'a–e'}`;
    B.wake();
  }
  /** The clip whose resting slot holds the point on the board's top, or -1. */
  function hit(p) {
    const [x, y] = unproj(C, p[0], p[1], T);
    return items.findIndex((it) => x > it.x0 - 1.6 && x < it.x1 + 1.6 && y > it.y0 - 1.6 && y < it.y1 + 1.6);
  }
  choose(-1);

  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return {
    set: (v) => { LIFT = v; B.wake(); },
    destroy: bag.dispose,
  };
}

export default {
  name: 'breadboard',
  means: 'A breadboard whose clips lift out: the hole under the pointer raises its five-hole strip, a power rail rises as one.',
  rules: [1, 2, 4, 6],
  range: [8, 14, 20],
  tour: [[201, 163], [202, 215], [272, 161], null],
  mount,
};
