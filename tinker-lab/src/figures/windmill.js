import HL from './vendor/hairline-kernel.js';
/**
 * Windmill: a model wind turbine on a plinth, wired to a panel meter. A
 * tapering tower, a nacelle, a hub, three blades, and at its foot the meter,
 * its needle over a dotted scale. A breeze keeps the rotor turning; moving
 * the pointer across the figure is wind, the faster the stronger, and the
 * rotor speeds up under it and coasts back down when it stops, with the slider's
 * coast. The generator's volts follow the rotor's speed, and the needle reads
 * them. Ambient: the rotor turns while on screen and sleeps when it is not;
 * under reduced motion it stands still.
 *
 * Nothing is picked: the wind reads only how fast the pointer moves.
 */
const {
  Cam, circ, clamp, facing, fit, hull, open, poly, prism, proj, rad, reducedMotion, ringAt, rings, seg,
  disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const ZT = 104, BL = 44, AX = 65, BREEZE = 0.32, GUST = 1.9, VMAX = 12;
const MX = 42, MY = -12, MW = 13, MD = 8, MH = 36;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let coast = value, w = BREEZE, gust = 0, last = null, touching = false;
  const C = Cam(45, 0.5, 1.72);
  const h = [Math.cos(rad(AX)), Math.sin(rad(AX)), 0], e = [-h[1], h[0], 0];
  const add = (a, v, s) => [a[0] + v[0] * s, a[1] + v[1] * s, a[2] + v[2] * s];
  const hubC = add([0, 0, ZT + 3], h, 11);
  fit(C, [[-28, -28, 0], [28, 28, 0], [28, -28, 0], [-28, 28, 0], [MX + MD, MY - MW, 0], add(hubC, [0, 0, 1], BL + 2), add(hubC, e, BL + 2), add(hubC, e, -BL - 2), add(hubC, [0, 0, 1], -BL - 2)], 200, 162);
  const P = proj(C), front = facing(C), Pv = (q) => P(q[0], q[1], q[2]), S = C.S;
  const g = mk('g', {}, svg);

  // the plinth, the cable to the meter, the meter box with its dial on the face that looks at us
  const [pr, pi] = rings(-26, -26, 26, 26, 6, 1.8);
  put(solid(g), prism(P, front, pr, pi, 0, 4));
  // the tower, behind the meter: a hull of its foot and its top, rounded rings, tapering
  put(solid(g), { sil: poly(hull(ringAt(P, circ(5.6, 40), 4).concat(ringAt(P, circ(2.8, 32), ZT)))), crease: '' });
  mk('path', { d: open([P(4, -3, 4), P(16, -10, 4), P(MX - MD, MY, 4)]), class: 'nf' }, g);
  const [mr, mi] = rings(MX - MD, MY - MW, MX + MD, MY + MW, 2.4, 1);
  put(solid(g), prism(P, front, mr, mi, 4, MH));
  // the dial on the box's +x face: a scale of dots from 0 to VMAX, and the needle (the one bright stroke)
  const face = (u, v) => P(MX + MD + 0.01, MY - u, v);
  const PIV = [0, 12], NR = 11, ang = (k) => rad(160 - 140 * k);
  mk('path', { d: poly(rings(-MW + 2, 8, MW - 2, MH - 3, 2, 0.6)[0].map((q) => face(q.u, q.v))), class: 'nf lo' }, g);
  for (let k = 0; k <= 6; k++) place(flatDot(g, C, k % 3 ? 0.6 : 0.9, 'dot m'), face(PIV[0] + (NR + 2) * Math.cos(ang(k / 6)), PIV[1] + (NR + 2) * Math.sin(ang(k / 6))));
  const needle = mk('path', { class: 'nf hi' }, g);
  place(flatDot(g, C, 0.8, 'dot m'), face(...PIV));

  // the nacelle: a capsule along the rotor's axis, then the blades and the spinner in front of it
  const circle = (p, r, n = 24) => { const c = Pv(p); return Array.from({ length: n }, (_, k) => [c[0] + r * S * Math.cos((k / n) * 6.2832), c[1] + r * S * Math.sin((k / n) * 6.2832)]); };
  mk('path', { d: poly(hull(circle(add([0, 0, ZT + 3], h, -9), 4.2).concat(circle(add([0, 0, ZT + 3], h, 7), 4.8)))), class: 'sil' }, g);
  const blades = [0, 1, 2].map(() => mk('path', { class: 'sil' }, g));
  const spinner = mk('path', { class: 'sil' }, g);
  spinner.setAttribute('d', poly(circle(hubC, 3.6)));

  let drawnA = NaN, drawnV = NaN;
  function draw(a, v) {
    if (a !== drawnA) {
      drawnA = a;
      blades.forEach((b, j) => {
        const t = a + (j * 2 * Math.PI) / 3, d = add([0, 0, 0], e, Math.cos(t)), dir = [d[0], d[1], Math.sin(t)];
        // a blade: broad near the root, a fine tip, as the hull of three circles along it
        b.setAttribute('d', poly(hull(circle(add(hubC, dir, 4), 2.2, 16).concat(circle(add(hubC, dir, 14), 2.9, 16), circle(add(hubC, dir, BL), 0.8, 12)))));
      });
    }
    const k = clamp(v / VMAX, 0, 1);
    if (k !== drawnV) { drawnV = k; needle.setAttribute('d', seg(face(...PIV), face(PIV[0] + NR * Math.cos(ang(k)), PIV[1] + NR * Math.sin(ang(k))))); }
  }

  let angle = 0.4;
  const B = register(stage, (dt) => {
    if (reducedMotion()) { draw(angle, w * 5); return false; }
    gust *= Math.exp(-dt / 0.35);
    // the rotor's speed chases the wind with the slider's coast: a first-order lag, not a timer
    const want = BREEZE + gust * GUST;
    w += (want - w) * (1 - Math.exp((-dt * 1000) / coast));
    angle += dt * w * 2 * Math.PI;
    const volts = w * 5;
    draw(angle, volts);
    if (touching) read.textContent = `${volts.toFixed(1)} V`;
    return true;
  });
  bag.add(B.unregister);

  bag.add(pointer(stage, {
    move: (p) => {
      const now = performance.now();
      if (last) {
        const dtm = Math.max(8, now - last.t), speed = Math.hypot(p[0] - last.p[0], p[1] - last.p[1]) / (dtm / 1000);
        gust = Math.max(gust, clamp(speed / 700, 0, 1));
      }
      last = { p, t: now };
      touching = true;
      B.wake();
    },
    leave: () => { last = null; touching = false; read.textContent = 'rest'; },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { coast = v; }, destroy: bag.dispose };
}

export default {
  name: 'windmill',
  means: 'A model wind turbine turns in a breeze; moving the pointer fast is wind, and its meter reads the generator volts.',
  rules: [3, 4, 7, 8],
  range: [300, 900, 2000],
  tour: [[60, 120], [340, 140], [60, 200], [340, 220], null],
  mount,
};
