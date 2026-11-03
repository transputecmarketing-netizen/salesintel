import HL from './vendor/hairline-kernel.js';
/**
 * Conveyor: a sorting line. Crates ride a belt, growing in at one end and
 * out at the other, each with its serial as a 3 × 3 dot code on its lid.
 * Half way along, a diverter arm stands on a post by the far edge, and a
 * chute leaves the belt toward us. The pointer tags the crate under it: the
 * crate takes the bright edge and its code lights, and as it nears the gate
 * the diverter swings across the belt and pushes it onto the chute. Then the
 * arm swings back. At rest the belt runs and the diverter is bright. The
 * slider is the belt's speed. Ambient: it runs while on screen and sleeps
 * when it is not; under reduced motion the belt stands still.
 *
 * The pick projects the pointer onto the belt's top and takes the nearest
 * crate still before the gate; the belt moves on its own clock, not the pointer's.
 */
const {
  Cam, clamp, facing, fit, lerp, prism, proj, r2, reducedMotion, rings, seg,
  tset, tval, tween, disposer, flatDot, mk, place, pointer, put, register, solid, unproj,
} = HL;

const L = 190, BW = 24, BT = 7, CUBE = 13, NC = 6, SPEED = 0.072, GX = 126, CH = 46, ARM = 34, PX = GX - 27, PY = -3, ON = 33;
const size = (u) => { const a = clamp(u / 12, 0, 1); return a * a * (3 - 2 * a); };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let rate = value, clock = 1.3, tagged = -1, over = null;
  const C = Cam(45, 0.5, 1.92);
  fit(C, [[0, 0, 0], [L, BW, 0], [L, 0, 0], [0, BW, 0], [GX - 16, BW + CH, 0], [GX + 16, BW + CH, 0], [0, 0, BT + CUBE], [PX, PY, BT + 14]], 200, 160);
  const P = proj(C), front = facing(C);
  const g = mk('g', {}, svg);

  // the belt's frame, its slats, the chute toward us (with its two side rails)
  put(solid(g), prism(P, front, ...rings(0, 0, L, BW, 5, 1.3), 0, BT));
  const slats = mk('path', { class: 'nf lo' }, g);
  put(solid(g), prism(P, front, ...rings(GX - 15, BW - 2, GX + 15, BW + CH, 4, 1.2), 0, 4));
  mk('path', { d: [GX - 12, GX + 12].map((x) => seg(P(x, BW + 2, 4), P(x, BW + CH - 4, 4))).join(''), class: 'nf lo' }, g);

  // one layer for the crates, the post and the arm, sorted by x + y each frame
  const layer = mk('g', {}, g);
  const pool = [];
  for (let j = 0; j < NC; j++) {
    const el = { ...solid(layer), dots: [] };
    for (let k = 0; k < 9; k++) el.dots.push(flatDot(el.g, C, 1, 'dot off'));
    pool.push(el);
  }
  const post = solid(layer), arm = solid(layer);
  put(post, prism(P, front, ...rings(PX - 3, PY - 3, PX + 3, PY + 3, 2.6, 0.8), BT - 2, BT + 13));
  arm.sil.classList.add('hi');
  const div = tween(0);
  let order = '', drawnA = NaN;

  /** Where crate j is: on the belt, or once tagged and past the gate, on the chute. */
  function where(j) {
    const q = j / NC + clock * SPEED, lap = Math.floor(q), d = (q - lap) * L, serial = 141 + lap * NC + j;
    if (serial === tagged && d >= GX) {
      const off = d - GX;
      return { j, serial, x: GX, y: BW / 2 + off, z: lerp(BT, 4, clamp(off / (BW / 2 + 4), 0, 1)), s: size(BW / 2 + CH - 8 - off), d };
    }
    return { j, serial, x: d, y: BW / 2, z: BT, s: Math.min(size(d), size(L - d)), d };
  }

  const B = register(stage, (dt, now) => {
    const still = reducedMotion();
    if (!still) clock += dt * rate;
    const items = pool.map((_, j) => where(j));
    // the tag ends once its crate has left the chute or gone round
    const t = items.find((it) => it.serial === tagged);
    if (tagged >= 0 && (!t || (t.d >= GX && t.s === 0))) { tagged = -1; read.textContent = over ? 'belt' : 'rest'; }
    // the arm swings across while the tagged crate comes up to the gate, and back once it is through
    const busy = t && tagged >= 0 && t.d > GX - 44 && t.d < GX + 14;
    tset(div, busy ? ON : 0, now, 0);
    const a = tval(div, now);
    if (a !== drawnA) {
      drawnA = a;
      const c = Math.cos((a * Math.PI) / 180), s = Math.sin((a * Math.PI) / 180);
      const turn = (r) => r.map((q) => ({ u: PX + q.u * c - q.v * s, v: PY + q.u * s + q.v * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c }));
      const [ar, ai] = rings(0, -1.4, ARM, 1.4, 1.3, 0.5);
      put(arm, prism(P, front, turn(ar), turn(ai), BT + 2, BT + 11));
    }
    arm.sil.classList.toggle('hi', tagged < 0);
    const draw = [{ id: 'p', key: PX + PY, g: post.g }, { id: 'a', key: PX + PY + (ARM / 2) * (Math.cos(a / 57.3) + Math.sin(a / 57.3)), g: arm.g }];
    items.forEach((it, k) => {
      const el = pool[k], sz = CUBE * it.s;
      draw.push({ id: k, key: it.x + it.y, g: el.g });
      if (sz < 0.4) { el.g.setAttribute('visibility', 'hidden'); return; }
      el.g.removeAttribute('visibility');
      put(el, prism(P, front, ...rings(it.x - sz / 2, it.y - sz / 2, it.x + sz / 2, it.y + sz / 2, 2.4 * it.s, 0.9 * it.s), it.z, it.z + sz));
      const hot = it.serial === tagged, pitch = sz * 0.22, rr = r2(0.55 * it.s * C.S);
      el.sil.classList.toggle('hi', hot);
      el.dots.forEach((d, b) => {
        place(d, P(it.x + ((b % 3) - 1) * pitch, it.y + (Math.floor(b / 3) - 1) * pitch, it.z + sz));
        d.setAttribute('rx', String(rr)); d.setAttribute('ry', String(r2(rr * C.k)));
        d.setAttribute('class', (it.serial >> b) & 1 ? (hot ? 'dot' : 'dot m') : 'dot off');
      });
    });
    draw.sort((p, q) => p.key - q.key);
    const sig = draw.map((d) => d.id).join();
    if (sig !== order) { order = sig; draw.forEach((d) => layer.appendChild(d.g)); }
    const off = (((clock * SPEED * L) % 19) + 19) % 19, sl = [];
    for (let x = off; x < L; x += 19) if (x > 5 && x < L - 5) sl.push(seg(P(x, 3.5, BT), P(x, BW - 3.5, BT)));
    slats.setAttribute('d', sl.join(''));
    return !still || tagged >= 0;
  });
  bag.add(B.unregister);

  bag.add(pointer(stage, {
    move: (p) => {
      over = unproj(C, p[0], p[1], BT);
      const [x, y] = over;
      if (tagged < 0 && y > -8 && y < BW + 8) {
        let best = null;
        for (let j = 0; j < NC; j++) { const it = where(j); if (it.s > 0.7 && it.d < GX - 10 && Math.abs(it.x - x) < 12 && (!best || Math.abs(it.x - x) < Math.abs(best.x - x))) best = it; }
        if (best) tagged = best.serial;
      }
      read.textContent = tagged >= 0 ? `#${String(tagged).padStart(4, '0')} → chute` : 'belt';
      B.wake();
    },
    leave: () => { over = null; if (tagged < 0) read.textContent = 'rest'; },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { rate = v; }, destroy: bag.dispose };
}

export default {
  name: 'conveyor',
  means: 'A sorting conveyor: the crate under the pointer is tagged, and the diverter swings to push it onto the chute.',
  rules: [4, 7, 8, 10],
  range: [0.6, 1, 1.6],
  tour: [[125, 128], [180, 155], [302, 216], null],
  mount,
};
