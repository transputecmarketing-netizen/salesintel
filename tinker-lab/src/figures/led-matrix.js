import HL from './vendor/hairline-kernel.js';
/**
 * LED matrix: an 8 × 8 dot-matrix module, the kind driven by a MAX7219: a
 * square board with its header pads at the front, and the matrix block on
 * it, sixty-four LEDs in a grid. When nobody touches it, it plays a loop, a
 * ripple from the centre and then a diagonal sweep; the pointer paints the
 * LEDs instead, and every LED fades like phosphor, through the three dot
 * weights, at the slider's afterglow. The loop fades back in after the
 * pointer leaves. Ambient: it runs while on screen, and the shared loop puts
 * it to sleep when it is not. Under reduced motion it rests on the ripple's
 * widest ring.
 */
const {
  Cam, clamp, facing, fit, lerp, poly, prism, proj, reducedMotion, ringAt, rings, rrect, unproj,
  disposer, flatDot, mk, place, pointer, put, register, solid,
} = HL;

const N = 8, PITCH = 6.6, HALF = (PITCH * N) / 2 + 2.6, BT = 1.6, ZB = BT + 7, FRAME = 105, LOOP = 34, RESUME = 1200, RAMP = 400;
const SPLASH = [[0, 0, 1], [1, 0, 0.45], [-1, 0, 0.45], [0, 1, 0.45], [0, -1, 0.45]];
const mid = (N - 1) / 2;

/** Whether LED (r, c) is lit in loop frame f: a ripple out from the centre, a pause, a diagonal sweep, a pause. */
function lit(f, r, c) {
  if (f < 8) return Math.abs(Math.hypot(r - mid, c - mid) - f * 0.62) < 0.48;
  if (f >= 12 && f < 27) return r + c === f - 12;
  return false;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let tau = value, clock = 0, lastF = -1, leftAt = -1e9, painting = false, prev = null;
  const C = Cam(45, 0.5, 2.9);
  fit(C, [[-HALF - 4, -HALF - 4, 0], [HALF + 4, HALF + 14, 0], [HALF + 4, -HALF - 4, 0], [-HALF - 4, HALF + 14, 0], [-HALF, -HALF, ZB]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk('g', {}, svg);

  // the board, its four corner holes, the header's five pads at the front
  const [pr, pi] = rings(-HALF - 4, -HALF - 4, HALF + 4, HALF + 14, 3, 1.2);
  put(solid(g), prism(P, front, pr, pi, 0, BT));
  for (const [x, y] of [[-HALF, -HALF], [HALF, -HALF], [-HALF, HALF + 10], [HALF, HALF + 10]]) place(flatDot(g, C, 1.3, 'dot off'), P(x, y, BT));
  mk('path', { d: poly(ringAt(P, rrect(-15, HALF + 6.2, 15, HALF + 11.8, 1.5, 3), BT)), class: 'nf lo' }, g);
  for (let k = 0; k < 5; k++) place(flatDot(g, C, 1, 'dot m'), P(-12 + k * 6, HALF + 9, BT));
  // the matrix block and the inset rim of its face
  const [mr, mi] = rings(-HALF, -HALF, HALF, HALF, 2.6, 1.1);
  put(solid(g), prism(P, front, mr, mi, BT, ZB));
  mk('path', { d: poly(ringAt(P, rrect(-HALF + 1.8, -HALF + 1.8, HALF - 1.8, HALF - 1.8, 1.6, 4), ZB)), class: 'nf lo' }, g);

  const I = new Float32Array(N * N), cls = new Array(N * N).fill(''), dots = [];
  const xy = (r, c) => [(c - mid) * PITCH, (r - mid) * PITCH];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const d = flatDot(g, C, 2.1, 'dot off');
    place(d, P(...xy(r, c), ZB));
    dots.push(d);
  }

  /** Lights the LED nearest a point on the face, and its four neighbours less, never dimming what is brighter. */
  function excite(x, y) {
    const c = Math.round(x / PITCH + mid), r = Math.round(y / PITCH + mid);
    for (const [dr, dc, k] of SPLASH) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < N && cc >= 0 && cc < N) I[rr * N + cc] = Math.max(I[rr * N + cc], k);
    }
    return [r, c];
  }

  const B = register(stage, (dt, now) => {
    const decay = Math.exp((-dt * 1000) / tau);
    for (let i = 0; i < N * N; i++) I[i] *= decay;
    // a pointer held still keeps its LED lit
    if (painting && prev) excite(prev[0], prev[1]);
    const still = reducedMotion() && !painting;
    if (still) for (let i = 0; i < N * N; i++) I[i] = Math.max(I[i], lit(4, Math.floor(i / N), i % N) ? 1 : 0);
    else {
      const gain = painting ? 0 : clamp((now - leftAt - RESUME) / RAMP, 0, 1);
      if (gain > 0) {
        clock += dt * 1000;
        const f = Math.floor(clock / FRAME) % LOOP;
        if (f !== lastF) { lastF = f; for (let i = 0; i < N * N; i++) if (lit(f, Math.floor(i / N), i % N)) I[i] = Math.max(I[i], gain); }
      }
    }
    // three weights, and a dot is only rewritten when its weight changes
    let any = false;
    for (let i = 0; i < N * N; i++) {
      const k = I[i] > 0.55 ? 'dot' : I[i] > 0.2 ? 'dot m' : 'dot off';
      if (I[i] > 0.2) any = true;
      if (k !== cls[i]) { cls[i] = k; dots[i].setAttribute('class', k); }
    }
    return !still || any;
  });
  bag.add(B.unregister);

  bag.add(pointer(stage, {
    move: (p) => {
      painting = true;
      const q = unproj(C, p[0], p[1], ZB);
      let rc = null;
      // fill in between moves, so a fast stroke leaves a line, not dots
      if (prev) {
        const n = Math.max(1, Math.ceil(Math.hypot(q[0] - prev[0], q[1] - prev[1]) / 2.5));
        for (let k = 1; k <= n; k++) rc = excite(lerp(prev[0], q[0], k / n), lerp(prev[1], q[1], k / n));
      } else rc = excite(q[0], q[1]);
      prev = q;
      const [r, c] = rc, on = r >= 0 && r < N && c >= 0 && c < N;
      read.textContent = on ? `led ${r + 1}·${c + 1}` : 'paint';
      B.wake();
    },
    // the loop's return is a timestamp the tick reads, not a timer: nothing to cancel
    leave: () => { painting = false; prev = null; leftAt = performance.now(); clock = 0; lastF = -1; read.textContent = 'rest'; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { tau = v; }, destroy: bag.dispose };
}

export default {
  name: 'led-matrix',
  means: 'An 8 × 8 LED matrix that plays a loop, and glows where the pointer paints it, fading like phosphor.',
  rules: [4, 5, 7, 10],
  range: [150, 520, 1500],
  tour: [[140, 146], [210, 112], [280, 146], [210, 180], null],
  mount,
};
