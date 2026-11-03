import HL from './vendor/hairline-kernel.js';
/**
 * Processor: a CPU package, its substrate and pin-1 mark, and on it the die:
 * eight cores in two rows, and between them the shared cache, one slice per
 * core, each slice ruled with its cache lines. At rest every core stands at
 * its own load, a bar chart in silicon, and the busiest is bright. The core
 * under the pointer takes the whole load and rises; its cache slice follows
 * it up a beat later, and the other cores fall idle, staggered outwards from
 * it. The slider is the rise, in world units.
 *
 * The cores are stepped parts, so the pick unprojects the pointer onto each
 * core's resting top and takes the one that puts it nearest its middle.
 */
const {
  Cam, clamp, facing, fit, prism, proj, ringAt, rings, rrect, seg, unproj, poly,
  tdone, tset, tval, tween, disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const SUB = 46, ZS = 2.6, ZD = 4.6, LOAD = [14, 6, 22, 9, 4, 17, 8, 12], IDLE = 3, STEP = 50, CW = 13, CX = (i) => -31 + (i % 4) * 15.5;
const ROWY = [[-27, -9], [9, 27]], SLY = [[-7, -1.2], [1.2, 7]];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let RISE = value;
  const C = Cam(45, 0.5, 2.25);
  fit(C, [[-SUB, -SUB, 0], [SUB, SUB, 0], [SUB, -SUB, 0], [-SUB, SUB, 0], [-SUB, -SUB, ZD + 42], [SUB, -SUB, ZD + 42]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk('g', {}, svg);

  // the substrate with its pin-1 mark and the decoupling pads, then the die
  const [sr, si] = rings(-SUB, -SUB, SUB, SUB, 4, 1.4);
  put(solid(g), prism(P, front, sr, si, 0, ZS));
  place(flatDot(g, C, 1.6, 'dot m'), P(-SUB + 6, -SUB + 6, ZS));
  mk('path', { d: [[-40, 36], [-34, 36], [34, -40], [34, -34], [36, 40], [40, 34]].map(([x, y]) => poly(ringAt(P, rrect(x - 1.8, y - 1.2, x + 1.8, y + 1.2, 0.6, 2), ZS))).join(''), class: 'nf lo' }, g);
  const [dr, di] = rings(-35, -31, 35, 31, 2.4, 1);
  put(solid(g), prism(P, front, dr, di, ZS, ZD));

  // sixteen blocks, cores and slices, painted back to front by x + y; their footprints never overlap
  const blocks = [];
  for (let i = 0; i < 8; i++) {
    const row = i < 4 ? 0 : 1, x = CX(i);
    blocks.push({ i, core: true, row, x0: x, x1: x + CW, y0: ROWY[row][0], y1: ROWY[row][1], h0: LOAD[i] });
    blocks.push({ i, core: false, row, x0: x, x1: x + CW, y0: SLY[row][0], y1: SLY[row][1], h0: 2.2 });
  }
  blocks.sort((a, b) => a.x0 + a.x1 + a.y0 + a.y1 - (b.x0 + b.x1 + b.y0 + b.y1));
  for (const b of blocks) {
    [b.ring, b.inner] = rings(b.x0, b.y0, b.x1, b.y1, 1.8, 0.8);
    b.el = solid(g);
    b.marks = mk('path', { class: 'nf lo' }, b.el.g);
    b.tw = tween(b.h0);
    b.drawn = NaN;
  }
  const cores = [...Array(8)].map((_, i) => blocks.find((b) => b.core && b.i === i));
  const slices = [...Array(8)].map((_, i) => blocks.find((b) => !b.core && b.i === i));

  function draw(b, h) {
    if (h === b.drawn) return;
    b.drawn = h;
    const z = ZD + h;
    put(b.el, prism(P, front, b.ring, b.inner, ZD, z));
    // a core shows its register file as two dim rules; a slice, its cache lines
    b.marks.setAttribute('d', b.core
      ? [0.35, 0.65].map((f) => seg(P(b.x0 + 2.5, lerpY(b, f), z), P(b.x1 - 2.5, lerpY(b, f), z))).join('')
      : [0.3, 0.5, 0.7].map((f) => seg(P(b.x0 + f * CW, b.y0 + 1.2, z), P(b.x0 + f * CW, b.y1 - 1.2, z))).join(''));
  }
  const lerpY = (b, f) => b.y0 + (b.y1 - b.y0) * f;

  const B = register(stage, (_dt, now) => {
    let m = false;
    for (const b of blocks) { draw(b, tval(b.tw, now)); if (!tdone(b.tw, now)) m = true; }
    return m;
  });
  bag.add(B.unregister);

  const busiest = LOAD.indexOf(Math.max(...LOAD));
  const dist = (i, j) => Math.abs((i % 4) - (j % 4)) + Math.abs((i >> 2) - (j >> 2));
  let act = -2;
  function choose(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act >= 0 ? act : busiest;
    act = a;
    for (let i = 0; i < 8; i++) {
      const d = dist(from, i) * STEP;
      tset(cores[i].tw, a < 0 ? LOAD[i] : i === a ? RISE : IDLE, now, d);
      // the slice follows its core a beat later
      tset(slices[i].tw, a < 0 ? 2.2 : i === a ? clamp(RISE * 0.55, 6, 30) : 1.2, now, d + 2 * STEP);
      const on = i === (a < 0 ? busiest : a);
      cores[i].el.sil.classList.toggle('hi', on);
      slices[i].el.sil.classList.toggle('hi', on && a >= 0);
    }
    read.textContent = a < 0 ? 'rest' : `core ${a}`;
    B.wake();
  }
  /** The core whose RESTING top puts the pointer nearest its middle; a slice picks its core. */
  function hit(p) {
    let best = -1, bd = 1e9;
    for (const b of blocks) {
      const [x, y] = unproj(C, p[0], p[1], ZD + b.h0);
      const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
      if (Math.abs(x - cx) > CW / 2 + 1.2 || Math.abs(y - cy) > (b.y1 - b.y0) / 2 + 1.2) continue;
      const d = Math.hypot(x - cx, y - cy) / (b.core ? 1 : 1.4);
      if (d < bd) { bd = d; best = b.i; }
    }
    return best;
  }
  choose(-1);
  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { RISE = v; if (act >= 0) { const a = act; act = -2; choose(a); } }, destroy: bag.dispose };
}

export default {
  name: 'processor',
  means: 'A processor with eight cores at their load: the core under the pointer rises, and its cache slice follows it up.',
  rules: [1, 2, 5, 6],
  range: [20, 30, 40],
  tour: [[190, 141], [264, 194], [182, 206], null],
  mount,
};
