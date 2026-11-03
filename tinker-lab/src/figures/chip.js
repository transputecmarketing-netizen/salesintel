import HL from './vendor/hairline-kernel.js';
/**
 * Chip: an integrated circuit taken apart into its four layers, the way it is
 * built: the lead frame (a die paddle and ten leads), the silicon die, the
 * gold bond wires that join the die's pads to the leads, and the moulded lid
 * with its pin-1 dimple. The pointer's x scrubs the gap between the layers on
 * a spring; its height picks a layer, which takes the bright edge and goes to
 * the read-out. At rest the stack stands half open and the die is bright.
 *
 * Picking reads the pointer's height against each layer's TARGET height, not
 * the one on screen, so a layer moving out from under the pointer cannot flip
 * the choice. Dashed drops go in before the plate they belong to.
 */
const {
  Cam, clamp, circ, extremes, facing, fit, lerp, open, poly, prism, proj, ringAt, rings, seg,
  spring, stepS, disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const BX = 48, BY = 30, LX = [-32, -16, 0, 16, 32], LW = 4, LIN = 21, LOUT = 46, FT = 1.5, DT = 2.6, LT = 9;
const PADX = [-8, -4, 0, 4, 8], PADY = 8.4, REST = 0.5, NAMES = ['frame', 'die', 'wires', 'lid'];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let GAP = value, act = -1, over = null;
  const e = spring(REST, { eps: 0.002 });
  const C = Cam(45, 0.5, 1.55);
  const H = 3 * 30 + LT;
  fit(C, [[-BX, -LOUT, 0], [BX, LOUT, 0], [BX, -LOUT, 0], [-BX, LOUT, 0], [-BX, -BY, H], [BX, -BY, H]], 200, 164);
  const P = proj(C), front = facing(C);
  const g = mk('g', {}, svg);

  // layer 0, the lead frame: the paddle and ten leads, painted back to front (ascending x + y)
  const frame = mk('g', {}, g), parts = [];
  parts.push({ r: rings(-14, -14, 14, 14, 3, 1.1), k: 0 });
  for (const s of [-1, 1]) for (const x of LX) {
    const y0 = s < 0 ? -LOUT : LIN, y1 = s < 0 ? -LIN : LOUT;
    parts.push({ r: rings(x - LW, y0, x + LW, y1, 1.6, 0.8), k: x + (y0 + y1) / 2 });
  }
  parts.sort((a, b) => a.k - b.k);
  const frameEls = parts.map((p) => ({ ...p, el: solid(frame) }));

  // layer 1, the die: guide, plate, its grid and its ten bond pads
  const dieGuide = mk('path', { class: 'nf dash' }, g);
  const [dr, di] = rings(-11, -11, 11, 11, 1.6, 1);
  const die = solid(g), dieGrid = mk('path', { class: 'nf lo' }, die.g);
  const pads = [];
  for (const s of [-1, 1]) for (const x of PADX) pads.push({ x, y: s * PADY, el: flatDot(die.g, C, 0.8, 'dot off') });

  // layer 2, the bond wires: one arc per pad, out to its lead's tip, with a ball at each end
  const wireGuide = mk('path', { class: 'nf dash' }, g);
  const wiresG = mk('g', {}, g), wires = mk('path', { class: 'nf' }, wiresG);
  const balls = pads.map(() => flatDot(wiresG, C, 0.7, 'dot m'));

  // layer 3, the lid: guide, body, the pin-1 dimple and the moulded recess on top
  const lidGuide = mk('path', { class: 'nf dash' }, g);
  const [lr, li] = rings(-BX + 6, -BY, BX - 6, BY, 5, 1.6);
  const lid = solid(g), dimple = mk('path', { class: 'nf lo' }, lid.g);
  const dimRing = circ(3.4, 28).map((q) => ({ ...q, u: q.u - BX + 15, v: q.v - BY + 9 }));
  const els = [frameEls, die, wiresG, lid];

  const zOf = (i, s) => i * GAP * s;
  const tops = [FT, DT, 0, LT];
  const exDie = extremes(P, dr), exLid = extremes(P, lr);
  const tip = (p) => [LX[PADX.indexOf(p.x)], Math.sign(p.y) * (LIN + 2)];

  let drawn = NaN;
  function draw() {
    const s = e.x;
    if (s === drawn) return;
    drawn = s;
    for (const p of frameEls) put(p.el, prism(P, front, p.r[0], p.r[1], 0, FT));
    const z1 = zOf(1, s) + FT, z1t = z1 + DT;
    dieGuide.setAttribute('d', exDie.map((q) => seg(P(q.u, q.v, z1), P(q.u, q.v, FT))).join(''));
    put(die, prism(P, front, dr, di, z1, z1t));
    dieGrid.setAttribute('d', [-3.5, 3.5].map((v) => seg(P(-6, v, z1t), P(6, v, z1t)) + seg(P(v, -6, z1t), P(v, 6, z1t))).join(''));
    pads.forEach((p) => place(p.el, P(p.x, p.y, z1t)));
    // the wires leave the die's pads at the die layer's height and land at the lead tips, arching up between
    const z2 = zOf(2, s) + FT + DT, w = [];
    pads.forEach((p, k) => {
      const [tx, ty] = tip(p), pts = [];
      for (let t = 0; t <= 1.0001; t += 0.125) pts.push(P(lerp(p.x, tx, t), lerp(p.y, ty, t), z2 + 7 * Math.sin(Math.PI * Math.min(1, t * 1.25))));
      w.push(open(pts));
      place(balls[k], P(p.x, p.y, z2));
    });
    wires.setAttribute('d', w.join(''));
    wireGuide.setAttribute('d', [pads[0], pads[4], pads[5], pads[9]].map((p) => { const [tx, ty] = tip(p); return seg(P(tx, ty, z2), P(tx, ty, FT)); }).join(''));
    const z3 = zOf(3, s) + FT;
    lidGuide.setAttribute('d', exLid.map((q) => seg(P(q.u, q.v, z3), P(q.u, q.v, FT))).join(''));
    put(lid, prism(P, front, lr, li, z3, z3 + LT));
    dimple.setAttribute('d', poly(ringAt(P, dimRing, z3 + LT)));
  }

  /** The layer whose target height is nearest the pointer's: read from the spring's target, never what is drawn. */
  function pick(p) {
    if (!p) return -1;
    let best = -1, d = 1e9;
    for (let i = 0; i < 4; i++) {
      const y = P(0, 0, zOf(i, e.t) + FT + tops[i] / 2)[1], dd = Math.abs(p[1] - y);
      if (dd < d) { d = dd; best = i; }
    }
    return best;
  }
  function hiOf(a) {
    const on = (i) => (a < 0 ? i === 1 : i === a);
    frameEls.forEach((p) => p.el.sil.classList.toggle('hi', on(0)));
    die.sil.classList.toggle('hi', on(1));
    wires.classList.toggle('hi', on(2));
    lid.sil.classList.toggle('hi', on(3));
  }
  function setAct(a) {
    act = a;
    hiOf(a);
    read.textContent = a < 0 ? 'rest' : `${NAMES[a]} · gap ${Math.round(GAP * e.t)}`;
    B.wake();
  }

  const B = register(stage, (dt) => { const m = stepS(e, dt); draw(); return m; });
  bag.add(B.unregister);
  hiOf(-1);

  const aim = () => { e.t = over ? REST + (1 - REST) * clamp((over[0] - 70) / 260, 0, 1) : REST; setAct(pick(over)); };
  bag.add(pointer(stage, {
    move: (p) => { over = p; aim(); },
    leave: () => { over = null; aim(); },
  }));
  bag.add(() => svg.replaceChildren());
  void els;

  return { set: (v) => { GAP = v; drawn = NaN; aim(); }, destroy: bag.dispose };
}

export default {
  name: 'chip',
  means: 'An IC in its layers: lead frame, die, bond wires, lid. Moving across opens the gap; height picks a layer.',
  rules: [1, 6, 8, 9],
  range: [12, 22, 30],
  tour: [[130, 120], [290, 175], [320, 245], null],
  mount,
};
