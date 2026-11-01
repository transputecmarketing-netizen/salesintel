/* Blue Cap mascot: a rigged, full-body line-art SVG character with an
 * animation runtime and agent hooks. No dependencies.
 *
 *   <div id="buddy"></div>
 *   <script src="/mascot/mascot.js"></script>
 *   <script>
 *     const buddy = Mascot.mount(document.getElementById("buddy"), { view: "full" });
 *     buddy.express("happy");
 *     buddy.gesture("wave");
 *     buddy.say("Hi! Ready to revise cardiology?");
 *   </script>
 *
 * Colours come from CSS custom properties on any ancestor:
 *   --mascot-ink   (line and fill colour, default #1543e6)
 *   --mascot-paper (background the drawing sits on, default #ffffff)
 *
 * Coordinates are in the space of the original 1200 x 1600 drawing; the body
 * below the original crop continues in the same space.
 *
 * How it is built
 * - Head, cap, hair, collar and shoulders are traced from the source sketch.
 * - Arms are two-bone chains (shoulder, elbow, wrist). The T-shirt sleeves
 *   belong to the arms, so at rest they sit exactly where the sketch has them.
 * - Skin (arm, palm, thumb) is drawn as one union: a thick ink pass under a
 *   paper pass, so joints never show internal lines. Fingers are layered on
 *   top so each one keeps its own outline and can curl on its own.
 * - Legs are solved with inverse kinematics from planted feet, so knees bend
 *   naturally when the body bobs, sways or crouches.
 */
(function (root) {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const DEG = Math.PI / 180;
  const VIEWS = {
    full: [40, 40, 1220, 2540],
    bust: [100, 160, 1160, 1270]
  };
  let uidCounter = 0;

  // ------------------------------------------------------------ anatomy
  const P = {
    headPivot: [620, 860],
    neckL: [541, 862], neckR: [698, 840],          // jaw meets neck (head space)
    neckBaseL: [556, 975], neckBaseR: [716, 932],  // neck meets collar (body space)
    hip: [610, 1790],                              // body leans and breathes around this
    eyeL: [462, 630], eyeR: [606, 630],
    mouth: [541, 696], mouthTilt: -9.7,
    earL: [372, 640], earR: [800, 705],
    lock: [745, 560], button: [860, 268],
    hipL: [530, 1850], hipR: [700, 1850],
    ankleL: [512, 2430], ankleR: [716, 2440],
    ground: 2514
  };

  // Arms. R is the near arm (screen right), L the far arm. Sleeve shapes are
  // in the upper arm's local frame: +y runs down the bone, +x across it.
  const ARMS = {
    R: {
      // the arm only shows below the sleeve, so it starts well inside it
      S: [812, 1080], Lu: 400, Lf: 290, start: 200, r0: 104, rE: 84, rW: 58, ox: -10, hs: 1,
      // the sleeve morphs from the sketch's shape (rest) to one that hugs the
      // arm (tube) as the arm lifts; both share one point structure
      sleeveRest: [[53.9, -72.2], [83.3, -46.4], [107.6, -14.4], [122, 24], [143, 80], [148, 170], [139, 242], [134, 278], [-118, 278], [-122, 242], [-124, 150], [-123, 64], [-113, 12], [-96, -58], [-22, -96]],
      sleeveTube: [[30, -66], [60, -56], [88, -30], [96, 12], [102, 70], [100, 140], [96, 205], [92, 238], [-98, 238], [-102, 205], [-106, 140], [-108, 70], [-102, 10], [-90, -46], [-28, -80]],
      sleeve: {
        outer: "M53.9,-72.2 C83.3,-46.4 107.6,-14.4 122,24 C143,80 148,170 139,242 L134,278 L-118,278 L-122,242 L139,242",
        inner: "M-122,242 C-124,150 -123,64 -113,12 C-96,-58 -22,-96 53.9,-72.2",
        fill: "M53.9,-72.2 C83.3,-46.4 107.6,-14.4 122,24 C143,80 148,170 139,242 L134,278 L-118,278 L-122,242 C-124,150 -123,64 -113,12 C-96,-58 -22,-96 53.9,-72.2 Z"
      }
    },
    L: {
      S: [470, 1080], Lu: 350, Lf: 258, start: 200, r0: 62, rE: 54, rW: 42, ox: -4, hs: 0.76,
      sleeve: {
        outer: "M-31,-9 C-60.6,62.9 -77.7,160.2 -77,240 L72,301 L69,333 L-81,291 L-77,240",
        inner: "M72,301 C70,200 66,112 58,52 C46,-18 2,-40 -31,-9",
        fill: "M-31,-9 C-60.6,62.9 -77.7,160.2 -77,240 L-81,291 L69,333 L72,301 C70,200 66,112 58,52 C46,-18 2,-40 -31,-9 Z"
      }
    }
  };
  const LEG = { Lt: 302, Ls: 288, r0: 112, rK: 86, rA: 70 };

  // Hand, in hand-local units before scaling: wrist at the origin, fingers
  // point down +y, the thumb sits on the -x side.
  const HAND = {
    palm: "M-56,0 C-62,30 -67,72 -63,104 Q-60,124 -40,126 L40,126 Q60,124 63,104 C67,72 62,30 56,0 Z",
    knuckles: [[-44, 112], [-14, 118], [16, 116], [43, 104]],
    lengths: [82, 94, 86, 68],
    fan: [-5, 0, 4, 10],
    spreadFan: [-15, -5, 6, 17],
    fingerR: 16.5,
    thumbBase: [-46, 42], thumbR: 19, thumbLen: 80
  };

  // ------------------------------------------------------------ math
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const f = (n) => Math.round(n * 10) / 10;
  const dirOf = (deg) => [Math.sin(deg * DEG), Math.cos(deg * DEG)];   // 0 = down, +90 = screen right
  const perpOf = (deg) => [Math.cos(deg * DEG), -Math.sin(deg * DEG)];
  const angleOf = (dx, dy) => Math.atan2(dx, dy) / DEG;
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const len = (a) => Math.hypot(a[0], a[1]);
  const pt = (p) => `${f(p[0])},${f(p[1])}`;
  const rotAround = (p, c, deg) => {
    const r = deg * DEG, cs = Math.cos(r), sn = Math.sin(r);
    return [c[0] + (p[0] - c[0]) * cs - (p[1] - c[1]) * sn, c[1] + (p[0] - c[0]) * sn + (p[1] - c[1]) * cs];
  };
  const wrap = (deg) => ((deg + 540) % 360) - 180;
  const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  // local (x across, y along) frame at origin o pointing at angle deg
  const frame = (o, deg) => { const d = dirOf(deg), p = perpOf(deg); return (x, y) => [o[0] + p[0] * x + d[0] * y, o[1] + p[1] * x + d[1] * y]; };
  const matrixOf = (o, deg) => { const d = dirOf(deg), p = perpOf(deg); return `matrix(${f(p[0] * 1000) / 1000} ${f(p[1] * 1000) / 1000} ${f(d[0] * 1000) / 1000} ${f(d[1] * 1000) / 1000} ${f(o[0])} ${f(o[1])})`; };

  // Tapered segment from a to b with half-widths ra, rb.
  function taper(a, b, ra, rb) {
    const ang = angleOf(b[0] - a[0], b[1] - a[1]), n = perpOf(ang);
    return `M${pt(add(a, mul(n, -ra)))} L${pt(add(b, mul(n, -rb)))} L${pt(add(b, mul(n, rb)))} L${pt(add(a, mul(n, ra)))} Z`;
  }
  // Rounded-tip capsule in a local frame (map), from base b along unit u.
  function capsule(map, b, u, L, r, openBase) {
    const n = [u[1], -u[0]];
    const t = add(b, mul(u, L - r)), tip = add(t, mul(u, r)), k = 0.552 * r;
    const A = add(t, mul(n, -r)), B = add(t, mul(n, r));
    const s = [
      `M${pt(map(...add(b, mul(n, -r))))}`, `L${pt(map(...A))}`,
      `C${pt(map(...add(A, mul(u, k))))} ${pt(map(...add(tip, mul(n, -k))))} ${pt(map(...tip))}`,
      `C${pt(map(...add(tip, mul(n, k))))} ${pt(map(...add(B, mul(u, k))))} ${pt(map(...B))}`,
      `L${pt(map(...add(b, mul(n, r))))}`
    ];
    if (openBase === "fill") {
      s.push(`L${pt(map(...add(add(b, mul(n, r)), mul(u, -20))))} L${pt(map(...add(add(b, mul(n, -r)), mul(u, -20))))} Z`);
    } else if (!openBase) s.push("Z");
    return s.join(" ");
  }
  // Smooth spline (Catmull-Rom as cubic Beziers) through a list of points.
  function spline(pts, move) {
    let d = move ? `M${pt(pts[0])}` : "";
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      d += ` C${pt(add(p1, mul(sub(p2, p0), 1 / 6)))} ${pt(sub(p2, mul(sub(p3, p1), 1 / 6)))} ${pt(p2)}`;
    }
    return d;
  }
  // An organic limb: one continuous outline around a chain of points with a
  // radius profile. At each bend the outside swells to a soft point and the
  // inside pinches, so elbows and knees read as joints rather than pipes.
  function limb(P, R, hose) {
    const n = P.length, plus = [], minus = [];
    for (let i = 0; i < n; i++) {
      const a = i > 0 ? sub(P[i], P[i - 1]) : sub(P[1], P[0]);
      const b = i < n - 1 ? sub(P[i + 1], P[i]) : sub(P[n - 1], P[n - 2]);
      const ua = mul(a, 1 / (len(a) || 1)), ub = mul(b, 1 / (len(b) || 1));
      let t = add(ua, ub); const tl = len(t);
      t = tl < 1e-3 ? ua : mul(t, 1 / tl);
      const nrm = [t[1], -t[0]];
      let rp = R[i], rm = R[i];
      if (i > 0 && i < n - 1 && !hose) {
        const cosHalf = Math.sqrt((1 + clamp(ua[0] * ub[0] + ua[1] * ub[1], -1, 1)) / 2);
        if (cosHalf < 0.985) {
          const inner = R[i] * Math.max(0.3, cosHalf), outer = R[i] / Math.max(0.64, cosHalf);
          if (ua[0] * ub[1] - ua[1] * ub[0] < 0) { rp = inner; rm = outer; } else { rm = inner; rp = outer; }
        }
      }
      plus.push(add(P[i], mul(nrm, rp))); minus.push(add(P[i], mul(nrm, -rm)));
    }
    return { plus, minus, d: `${spline(plus, true)} L${pt(minus[n - 1])}${spline(minus.slice().reverse(), false)} Z` };
  }
  const mapPath = (d, fn) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => pt(fn([+x, +y])));
  const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  const unit = (v) => mul(v, 1 / (len(v) || 1));

  // Two-bone IK. Returns absolute upper angle and relative elbow angle.
  function solveIK(S, W, L1, L2, prefer) {
    const v = sub(W, S), D = clamp(len(v), Math.abs(L1 - L2) + 1, L1 + L2 - 1);
    const base = angleOf(v[0], v[1]);
    const A = Math.acos(clamp((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D), -1, 1)) / DEG;
    const options = [base + A, base - A].map((up) => {
      const E = add(S, mul(dirOf(up), L1));
      return { up, E, fore: angleOf(W[0] - E[0], W[1] - E[1]) };
    });
    const pick = prefer(options[0].E, options[1].E) ? options[0] : options[1];
    return { shoulder: pick.up, elbow: wrap(pick.fore - pick.up), fore: pick.fore };
  }

  // A CSS cubic-bezier as a function of progress.
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (u) => ((ax * u + bx) * u + cx) * u, Y = (u) => ((ay * u + by) * u + cy) * u, dX = (u) => (3 * ax * u + 2 * bx) * u + cx;
    return (t) => {
      if (t <= 0) return 0; if (t >= 1) return 1;
      let u = t;
      for (let i = 0; i < 8; i++) { const e = X(u) - t, d = dX(u); if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break; u -= e / d; }
      if (!(u >= 0 && u <= 1)) { let lo = 0, hi = 1; for (let i = 0; i < 24; i++) { u = (lo + hi) / 2; if (X(u) < t) lo = u; else hi = u; } }
      return Y(u);
    };
  }
  // The lift curve: a quick start and a long, soft landing.
  const EASE = bezier(0.32, 0.72, 0, 1);

  // Two clocks, as in Hairline. Anything that follows a moving target is a
  // spring (default k 100, c 18: just under critical, so it settles without
  // wobble), integrated in 240 Hz sub-steps so it is smooth at any frame
  // rate. A discrete change (a gesture, an expression) is a tween on the lift
  // curve, always starting from wherever the value is now, so nothing jumps.
  class Spring {
    constructor(value, k = 100, d = 18) { this.value = value; this.target = value; this.velocity = 0; this.k = k; this.d = d; this.segs = null; }
    set(t) { this.segs = null; this.target = t; return this; }
    snap(v) { this.segs = null; this.value = this.target = v; this.velocity = 0; return this; }
    kick(v) { this.velocity += v; return this; }
    // wait out a stagger, then let the spring carry it there (overshoot and settle).
    // While waiting it keeps heading where it was going, with its momentum:
    // a living part never stops dead between two moves.
    aim(to, delay = 0) {
      if (delay <= 0) { this.segs = null; this.target = to; return this; }
      const hold = this.segs ? this.segs[this.segs.length - 1].to : this.target;
      this.segs = [{ to, wait: delay / 1000, spring: true, hold }]; this.target = to; return this;
    }
    go(to, ms = 700, delay = 0, queue = false) {
      const hold = this.segs ? this.segs[this.segs.length - 1].to : this.target;
      const seg = { to, dur: Math.max(0.001, ms / 1000), wait: delay / 1000, from: null, t: 0, hold };
      if (queue && this.segs) this.segs.push(seg); else this.segs = [seg];
      this.target = to;
      return this;
    }
    step(dt) {
      if (this.segs) {
        const seg = this.segs[0];
        if (seg.wait > 0) {
          seg.wait -= dt; this._phys(dt, seg.hold);
          return this.value;
        }
        if (seg.spring) { this.segs = null; this.target = seg.to; return this.step(dt); }
        if (seg.from == null) seg.from = this.value;
        seg.t += dt;
        const prev = this.value;
        // the tween carries the momentum it started with, fading out, so a
        // part already moving does not stop and restart
        if (seg.v0 == null) seg.v0 = this.velocity;
        const tau = 0.12, carry = seg.v0 * tau * (1 - Math.exp(-seg.t / tau)) * (1 - EASE(clamp(seg.t / seg.dur, 0, 1)));
        this.value = lerp(seg.from, seg.to, EASE(clamp(seg.t / seg.dur, 0, 1))) + carry;
        this.velocity = (this.value - prev) / (dt || 1e-3);
        if (seg.t >= seg.dur) { this.segs.shift(); if (!this.segs.length) { this.segs = null; this.velocity = 0; } }
        return this.value;
      }
      this._phys(dt, this.target);
      return this.value;
    }
    _phys(dt, target) {
      const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
      for (let i = 0; i < n; i++) {
        const a = (target - this.value) * this.k - this.velocity * this.d;
        this.velocity += a * h; this.value += this.velocity * h;
      }
    }
  }

  // Smooth 1-D value noise. Living things drift; they do not loop on sines.
  function makeNoise(seed) {
    const v = []; let x = seed * 9301 + 49297;
    for (let i = 0; i < 256; i++) { x = (x * 16807) % 2147483647; v.push((x / 2147483647) * 2 - 1); }
    const n = (t) => { const i = Math.floor(t), fr = t - i, u = fr * fr * (3 - 2 * fr); return lerp(v[i & 255], v[(i + 1) & 255], u); };
    return (t) => n(t) * 0.62 + n(t * 2.3 + 17) * 0.28 + n(t * 5.7 + 31) * 0.1;
  }

  const el = (tag, attrs, parent) => {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  };

  // ------------------------------------------------------------ poses
  const EXPRESSIONS = {
    smile:     { smile: 1, open: 0, width: 1, happy: 0, squeeze: 0, eyeH: 1, brow: 0, browTilt: 0, browShow: 0, blush: 0 },
    neutral:   { smile: 0.25, open: 0, width: 0.9, happy: 0, squeeze: 0, eyeH: 1, brow: 0, browTilt: 0, browShow: 0, blush: 0 },
    happy:     { smile: 1.25, open: 0.3, width: 1.1, happy: 1, squeeze: 0, eyeH: 1, brow: -2, browTilt: 0, browShow: 0, blush: 1 },
    laugh:     { smile: 1.35, open: 0.8, width: 1.15, happy: 1, squeeze: 1, eyeH: 1, brow: -5, browTilt: 0.2, browShow: 0.6, blush: 1 },
    surprised: { smile: 0, open: 0.85, width: 0.6, happy: 0, squeeze: 0, eyeH: 1.32, brow: -15, browTilt: 0, browShow: 1, blush: 0 },
    sad:       { smile: -0.7, open: 0, width: 0.8, happy: 0, squeeze: 0, eyeH: 0.85, brow: -2, browTilt: 1, browShow: 1, blush: 0 },
    thinking:  { smile: 0.1, open: 0, width: 0.65, happy: 0, squeeze: 0, eyeH: 0.95, brow: -6, browTilt: -0.5, browShow: 1, blush: 0, lookX: 6, lookY: -7 },
    shy:       { smile: 0.8, open: 0, width: 0.75, happy: 0.35, squeeze: 0, eyeH: 0.9, brow: 0, browTilt: 0.4, browShow: 0, blush: 1, lookX: -4, lookY: 6 },
    sleepy:    { smile: 0.3, open: 0, width: 0.8, happy: 0, squeeze: 0, eyeH: 0.18, brow: 3, browTilt: 0, browShow: 0, blush: 0 },
    angry:     { smile: -0.45, open: 0, width: 0.85, happy: 0, squeeze: 0, eyeH: 0.9, brow: 5, browTilt: -1, browShow: 1, blush: 0 }
  };
  // Body attitude that goes with each expression.
  const POSTURE = {
    smile: {}, neutral: {}, happy: { shrug: -3, nod: -2 },
    laugh: { nod: -7, lean: -1.5 },
    surprised: { shrug: 18, lean: -2.5, nod: -4 },
    sad: { shrug: -12, lean: 2.5, nod: 10, tilt: -4 },
    thinking: { tilt: 5, nod: -2 },
    shy: { shrug: 8, nod: 7, tilt: -6, lean: 1 },
    sleepy: { shrug: -8, nod: 8, tilt: 3 },
    angry: { shrug: 10, lean: 3, nod: 3 }
  };

  const HANDS = {
    relaxed: { fingers: [0.92, 0.88, 0.84, 0.8], thumb: 0.9, thumbAngle: -24, spread: 0.04 },
    open:    { fingers: [1, 1, 1, 1], thumb: 1, thumbAngle: -58, spread: 0.65 },
    flat:    { fingers: [1, 1, 1, 1], thumb: 0.95, thumbAngle: -30, spread: 0.12 },
    fist:    { fingers: [0, 0, 0, 0], thumb: 0.55, thumbAngle: -14, spread: 0 },
    point:   { fingers: [1, 0, 0, 0], thumb: 0.5, thumbAngle: -10, spread: 0 },
    two:     { fingers: [1, 1, 0, 0], thumb: 0.45, thumbAngle: -8, spread: 0.55 },
    thumbUp: { fingers: [0, 0, 0, 0], thumb: 1, thumbAngle: -92, spread: 0 },
    soft:    { fingers: [0.92, 0.88, 0.84, 0.8], thumb: 0.9, thumbAngle: -40, spread: 0.3 }
  };

  // Arm poses: either joint angles (shoulder absolute, elbow and wrist
  // relative) or an IK target for the wrist plus an absolute hand angle.
  const REST = {
    // a hanging hand is seen mostly from the side, palm toward the thigh
    // A relaxed arm: the hand hangs straight down in line with the forearm,
    // no bend at the wrist, palm toward the thigh, thumb to the front.
    R: { shoulder: 1, elbow: -9, wrist: 6, hand: "relaxed", side: 0.88, z: "mid" },
    L: { shoulder: -24, elbow: 26, wrist: -2, hand: "relaxed", side: 0.88, z: "mid" }
  };
  const GESTURES = {
    none: {},
    wave:     { R: { target: [1085, 1075], handAngle: 182, hand: "open", side: -1, wave: 1 }, face: "happy" },
    hello:    { R: { target: [1050, 660], handAngle: 188, hand: "open", side: -1, wave: 1 }, face: "happy", body: { lean: -1.5 } },
    hi5:      { R: { target: [1060, 1010], handAngle: 180, hand: "flat", side: -1 }, face: "happy" },
    idea:     { R: { target: [975, 1000], handAngle: 174, hand: "point", side: -1, fsU: 0.6 }, face: "surprised", faceAfter: "happy" },
    count2:   { R: { target: [980, 1000], handAngle: 176, hand: "two", side: -1, fsU: 0.6 } },
    thumbsUp: { R: { target: [930, 1160], handAngle: -88, hand: "thumbUp", side: 1, fsU: 0.6, fsF: 0.6, elbowOut: 1.2 }, face: "happy" },
    point:    { R: { target: [1090, 930], handAngle: 140, hand: "point", side: -1, fsU: 0.8 }, body: { lean: 1, twist: 0.45 }, look: [9, -4] },
    // the classic: one hand at the chin, the other arm across the chest holding that elbow
    think:    { L: { target: [572, 1045], handAngle: 172, hand: "point", side: 1, z: "top", fsU: 0.6 },
                R: { target: [560, 1330], handAngle: -84, hand: "soft", side: 1, fsU: 0.92, fsF: 0.82, elbowOut: 0.3 }, face: "thinking", body: { twist: -0.3, lean: 1 } },
    cheer:    { R: { target: [1010, 640], handAngle: 184, hand: "open", side: -1, wave: 0.35 },
                L: { target: [300, 650], handAngle: 176, hand: "open", side: -1, wave: 0.35, z: "back" }, face: "laugh", body: { hop: true } },
    shrug:    { R: { target: [1055, 1440], handAngle: 118, hand: "soft", side: -1 },
                L: { target: [265, 1455], handAngle: -112, hand: "soft", side: -1 }, face: "neutral", body: { shrug: 28, tilt: 7 } },
    // laughing: both hands on the belly, leaning back into it
    belly:    { R: { target: [745, 1575], handAngle: -76, hand: "soft", side: 1 },
                L: { target: [520, 1560], handAngle: 78, hand: "soft", side: 1, fsU: 0.9 }, face: "laugh", body: { lean: -2.5 } },
    // talking hand: elbow at the side, forearm coming toward you, palm open
    explain:  { R: { shoulder: 9, elbow: 58, wrist: 22, hand: "soft", side: -1, beat: 1, fsF: 0.58 } },
    // shy: hands clasped behind the back, a little twist and sway
    shy:      { R: { target: [700, 1600], handAngle: -40, hand: "relaxed", side: 1, z: "back", fsF: 0.75 },
                L: { target: [610, 1610], handAngle: 40, hand: "relaxed", side: 1, z: "back", fsF: 0.75 }, face: "shy", body: { twist: -0.35, tilt: -6 } },
    behind:   { R: { target: [700, 1600], handAngle: -40, hand: "relaxed", side: 1, z: "back", fsF: 0.75 },
                L: { target: [610, 1610], handAngle: 40, hand: "relaxed", side: 1, z: "back", fsF: 0.75 }, body: { lean: -1 } }
  };
  const PUBLIC_GESTURES = ["none", "wave", "hello", "hi5", "idea", "count2", "thumbsUp", "point", "think", "cheer", "shrug", "belly", "explain", "shy", "behind"];

  // Mouth shapes for lip sync: [open, width]
  const VISEME = {
    a: [0.82, 1.05], e: [0.5, 1.18], i: [0.32, 1.22], o: [0.7, 0.6], u: [0.42, 0.52], y: [0.34, 1.1],
    m: [0, 0.85], b: [0, 0.85], p: [0, 0.85], f: [0.12, 1.02], v: [0.12, 1.02],
    w: [0.3, 0.58], r: [0.28, 0.78], l: [0.36, 1], t: [0.24, 1.05], d: [0.26, 1.02], n: [0.22, 1],
    s: [0.16, 1.15], z: [0.16, 1.15], c: [0.2, 1.08], k: [0.3, 0.98], g: [0.3, 0.98], h: [0.42, 1], j: [0.25, 0.9]
  };

  // The T-shirt's sides: fuller at the chest, in at the waist, flaring at the hem.
  const TORSO_SIDES = "M440,1110 C406,1220 390,1330 392,1440 C392,1560 382,1690 368,1786 M778,1110 C806,1210 814,1330 806,1450 C800,1560 806,1690 816,1786";
  const TORSO_HEM = "M368,1786 C500,1810 700,1810 816,1786";

  // How much of the upper teeth each sound shows.
  const TEETH = { e: 0.7, i: 0.9, y: 0.6, s: 1, z: 1, c: 0.8, t: 0.6, d: 0.5, n: 0.3, l: 0.4, f: 1, v: 1, j: 0.6 };

  // ------------------------------------------------------------ drawing
  function buildSVG(uid) {
    const svg = el("svg", { viewBox: VIEWS.full.join(" "), xmlns: NS, role: "img", "aria-label": "Blue cap mascot", class: "mascot-svg" });
    el("style", {}, svg).textContent = `
      .mascot-svg{overflow:hidden;display:block;width:100%;height:auto}
      .mascot-svg .ink{fill:none;stroke:var(--mascot-ink,#1543e6);stroke-width:9;stroke-linecap:round;stroke-linejoin:round}
      .mascot-svg .solid{fill:var(--mascot-ink,#1543e6)}
      .mascot-svg .paper{fill:var(--mascot-paper,#ffffff)}
      .mascot-svg .cut{fill:none;stroke:var(--mascot-paper,#ffffff);stroke-width:9;stroke-linecap:round;stroke-linejoin:round}
      .mascot-svg .skin{fill:var(--mascot-paper,#ffffff);stroke:var(--mascot-ink,#1543e6);stroke-width:9;stroke-linecap:round;stroke-linejoin:round}
      .mascot-svg .mouth{fill:var(--mascot-ink,#1543e6);stroke:var(--mascot-ink,#1543e6);stroke-width:9;stroke-linecap:round;stroke-linejoin:round}
      .mascot-svg .u-back{fill:var(--mascot-ink,#1543e6);stroke:var(--mascot-ink,#1543e6);stroke-width:18;stroke-linejoin:round}
      .mascot-svg .u-front{fill:var(--mascot-paper,#ffffff);stroke:none}
      .mascot-svg .shadow{fill:var(--mascot-ink,#1543e6);opacity:.1}
      /* bright outside, dim inside: inner details are lighter and thinner than the silhouette */
      .mascot-svg .ink.sep{stroke-width:7}
      .mascot-svg.is-hairline .ink.sep{stroke-width:1.4px}
      .mascot-svg .ink.lo{stroke:color-mix(in srgb,var(--mascot-ink,#1543e6) 60%,var(--mascot-paper,#fff));stroke-width:6.5}
      .mascot-svg .ink,.mascot-svg .solid,.mascot-svg .skin{transition:stroke 260ms cubic-bezier(.32,.72,0,1),fill 260ms cubic-bezier(.32,.72,0,1)}
      /* hairline: the same drawing in fine, non-scaling lines, solids drawn as outlines */
      .mascot-svg.is-hairline .ink,.mascot-svg.is-hairline .skin,.mascot-svg.is-hairline .mouth{stroke-width:1.7px;vector-effect:non-scaling-stroke}
      .mascot-svg.is-hairline .ink.lo,.mascot-svg.is-hairline .cut{stroke:color-mix(in srgb,var(--mascot-ink,#1543e6) 50%,var(--mascot-paper,#fff));stroke-width:1.1px;vector-effect:non-scaling-stroke}
      .mascot-svg.is-hairline .solid{fill:var(--mascot-paper,#fff);stroke:var(--mascot-ink,#1543e6);stroke-width:1.7px;vector-effect:non-scaling-stroke;stroke-linejoin:round}
      .mascot-svg.is-hairline .u-back{stroke-width:4px;vector-effect:non-scaling-stroke}
      .mascot-svg.is-hairline #eyeL,.mascot-svg.is-hairline #eyeR{stroke-width:2.4px}
      .mascot-svg.is-hairline #capStripe{stroke:var(--mascot-ink,#1543e6);stroke-width:1.1px;vector-effect:non-scaling-stroke}
      .mascot-svg.is-hairline #capGap,.mascot-svg.is-hairline #legCut{display:none}
      .mascot-svg.is-hairline .shadow{opacity:.06}
      .mascot-svg .rig{font:600 24px ui-monospace,Menlo,monospace;fill:var(--mascot-rig,#e0306b)}
      .mascot-svg .rig-dot{fill:var(--mascot-rig,#e0306b)}
    `;
    const g = el("g", { id: "mascot" }, svg);
    const parts = {};
    parts.shadow = el("ellipse", { class: "shadow", cx: 615, cy: P.ground, rx: 300, ry: 22 }, g);
    // everything that squashes lives in one group; the shadow stays on the floor
    const body = parts.squash = el("g", { id: "squash" }, g);
    parts.layerBack = el("g", { id: "layerBack" }, body);

    // ---- legs, trousers and shoes (rebuilt every frame)
    const legs = parts.legs = el("g", { id: "legs" }, body);
    parts.pelvis = el("path", { class: "solid", id: "pelvis",
      d: "M410,1740 L812,1740 L822,1885 C760,1915 470,1915 404,1885 Z" }, legs);
    parts.shoeL = el("g", { id: "shoeL" }, legs);
    parts.legL = el("path", { class: "solid", id: "legL" }, legs);
    parts.hemL = el("path", { class: "cut", "stroke-width": 6 }, legs);
    parts.shoeR = el("g", { id: "shoeR" }, legs);
    parts.legR = el("path", { class: "solid", id: "legR" }, legs);
    parts.legCut = el("path", { class: "cut", id: "legCut", "stroke-width": 8 }, legs);
    parts.hemR = el("path", { class: "cut", "stroke-width": 6 }, legs);
    parts.pocket = el("path", { class: "cut", "stroke-width": 7 }, legs);
    parts.kneeL = el("path", { class: "cut", "stroke-width": 6 }, legs);
    parts.kneeR = el("path", { class: "cut", "stroke-width": 6 }, legs);
    for (const shoe of [parts.shoeL, parts.shoeR]) {
      el("path", { class: "skin", d: "M40,-24 C60,-6 66,34 60,60 L-136,60 C-176,60 -186,28 -158,10 C-120,-8 -70,-8 -34,-28 Z" }, shoe);
      el("path", { class: "solid", d: "M64,42 C66,58 62,74 52,76 L-138,76 C-174,76 -190,60 -176,42 Z" }, shoe);
      el("path", { class: "ink lo", d: "M-56,-14 L-76,8 M-84,-4 L-104,14 M-150,40 C-128,30 -110,30 -96,40" }, shoe);
    }

    // ---- torso
    const torso = parts.torso = el("g", { id: "torso" }, body);
    parts.shirt = el("path", { class: "paper", id: "shirt" }, torso);
    parts.torsoSides = el("path", { class: "ink", id: "torsoSides",
      d: "M440,1110 C420,1230 398,1340 384,1420 C374,1520 372,1660 376,1786 M778,1110 C784,1350 792,1560 804,1786" }, torso);
    parts.hem = el("path", { class: "ink", id: "hem" }, torso);
    parts.folds = el("path", { class: "ink lo", id: "shirtFolds", opacity: 0 }, torso);
    parts.shoulderLine = el("path", { class: "ink", id: "shoulders" }, torso);
    parts.collar = el("path", { class: "ink", id: "collar" }, torso);

    parts.layerMid = el("g", { id: "layerMid" }, body);
    parts.neckFill = el("path", { class: "paper", id: "neckFill" }, body);
    parts.neck = el("path", { class: "ink", id: "neck" }, body);

    // ---- head
    const head = parts.head = el("g", { id: "head" }, body);
    el("path", { class: "paper", id: "faceFill",
      d: "M370,566 C342,578 324,606 327,638 C330,668 344,690 362,702 L383,705 C392,760 430,808 490,830 C515,840 532,850 541,866 L698,844 C715,805 760,775 790,750 L800,762 C852,760 888,735 893,697 C898,662 880,630 845,628 L845,540 L381,520 Z" }, head);
    parts.earL = el("g", { id: "earL" }, head);
    el("path", { class: "ink", d: "M370,566 C342,578 324,606 327,638 C330,668 344,690 362,702" }, parts.earL);
    parts.earR = el("g", { id: "earR" }, head);
    el("path", { class: "ink", d: "M845,628 C880,630 898,662 893,697 C888,735 852,760 800,762" }, parts.earR);
    el("path", { class: "ink lo", d: "M800,704 L846,688" }, parts.earR);
    parts.faceL = el("path", { class: "ink", id: "faceL" }, head);
    parts.faceR = el("path", { class: "ink", id: "faceR" }, head);

    const face = parts.face = el("g", { id: "features" }, head);
    parts.blush = el("g", { id: "blush", opacity: 0 }, face);
    el("path", { class: "ink lo", d: "M420,690 l10,-14 M440,692 l10,-14 M640,676 l10,-14 M660,678 l10,-14" }, parts.blush);
    parts.browL = el("path", { class: "ink", id: "browL", opacity: 0 }, face);
    parts.browR = el("path", { class: "ink", id: "browR", opacity: 0 }, face);
    parts.eyeL = el("path", { class: "ink", id: "eyeL", "stroke-width": 10 }, face);
    parts.eyeR = el("path", { class: "ink", id: "eyeR", "stroke-width": 10 }, face);
    const clip = el("clipPath", { id: `${uid}-mouth` }, face);
    parts.mouthClip = el("path", {}, clip);
    parts.mouth = el("path", { class: "mouth", id: "mouth" }, face);
    const inside = el("g", { "clip-path": `url(#${uid}-mouth)` }, face);
    parts.teeth = el("path", { class: "paper", id: "teeth" }, inside);
    parts.tongue = el("ellipse", { class: "paper", id: "tongue" }, inside);
    parts.dimples = el("path", { class: "ink lo", id: "dimples", opacity: 0 }, face);

    parts.lock = el("g", { id: "hairLock" }, head);
    el("path", { class: "solid",
      d: "M722,500 L728,560 C730,610 734,650 752,671 C760,679 771,670 777,655 C783,640 790,631 802,626 L840,520 Z" }, parts.lock);
    // the fringe hangs under the brim, so it is painted before the cap
    parts.fringe = el("g", { id: "fringe" }, head);
    parts.fringe1 = el("path", { class: "solid", id: "fringeL", d: "M330,520 C328,548 352,572 380,568 C420,563 466,550 490,520 Z" }, parts.fringe);
    parts.fringe2 = el("path", { class: "solid", id: "fringeR", d: "M512,520 C518,548 555,570 590,568 C630,566 672,550 694,520 Z" }, parts.fringe);
    const cap = parts.cap = el("g", { id: "cap" }, head);
    el("path", { class: "solid", id: "capDome",
      d: "M398,402 C396,300 472,204 600,198 C722,193 822,240 882,302 C926,350 948,420 945,492 C943,560 921,610 890,627 L795,631 L728,526 Z" }, cap);
    parts.button = el("g", { id: "capButton" }, cap);
    el("circle", { class: "solid", cx: 860, cy: 268, r: 36 }, parts.button);
    el("rect", { class: "paper", id: "capStripe", x: 481, y: 338, width: 128, height: 23, rx: 11.5, transform: "rotate(15 545 349.5)" }, cap);
    el("path", { class: "cut", id: "capGap", d: "M236,402 C262,388 288,384 312,387 C345,392 378,406 420,420 L712,517", "stroke-width": 18 }, cap);
    el("path", { class: "solid", id: "capBrim",
      d: "M207,470 C204,425 245,388 300,386 C340,386 380,405 420,420 L702,512 C716,518 714,532 698,532 L300,537 C250,537 210,512 207,470 Z" }, cap);

    parts.layerTop = el("g", { id: "layerTop" }, body);
    parts.rig = el("g", { id: "rigOverlay", style: "display:none" }, body);
    return { svg, parts };
  }

  function buildArm(uid, side) {
    const A = ARMS[side];
    const g = el("g", { id: `arm${side}` });
    const defs = el("defs", {}, g);
    const skinU = el("g", { id: `${uid}-upper${side}` }, defs);
    const skinL = el("g", { id: `${uid}-lower${side}` }, defs);
    const upper = el("path", {}, skinU), elbow = el("circle", {}, skinU);
    const fore = el("path", {}, skinL), elbow2 = el("circle", { r: 0 }, skinL), palm = el("path", {}, skinL), thumb = el("path", {}, skinL);
    // fingers are part of the skin union, so palm, thumb and fingers share one clean silhouette
    const digits = [0, 1, 2, 3].map(() => el("path", {}, skinL));
    // straight arm: both groups merge into one outline under the sleeve
    el("use", { href: `#${uid}-upper${side}`, class: "u-back" }, g);
    const lowerBack = el("use", { href: `#${uid}-lower${side}`, class: "u-back" }, g);
    el("use", { href: `#${uid}-upper${side}`, class: "u-front" }, g);
    const lowerFront = el("use", { href: `#${uid}-lower${side}`, class: "u-front" }, g);
    const sleeve = el("g", {}, g);
    // folded arm: the forearm comes toward the viewer, in front of the sleeve
    const folded = el("g", { style: "display:none" }, g);
    el("use", { href: `#${uid}-lower${side}`, class: "u-back" }, folded);
    el("use", { href: `#${uid}-lower${side}`, class: "u-front" }, folded);
    const crease = el("path", { class: "ink lo", opacity: 0 }, g);
    const fingersG = el("g", {}, g);
    const palmLine = el("path", { class: "ink lo", opacity: 0 }, fingersG);
    // short lines between fingers that touch; they stop before the palm
    const seps = el("path", { class: "ink sep" }, fingersG);
    const sleeveFill = el("path", { class: "paper", d: A.sleeve.fill }, sleeve);
    const sleeveInner = el("path", { class: "ink", d: A.sleeve.inner }, sleeve);
    const sleeveOuter = el("path", { class: "ink", d: A.sleeve.outer }, sleeve);
    return { g, upper, elbow, elbow2, fore, palm, thumb, digits, seps, crease, palmLine, sleeve, sleeveFill, sleeveInner, sleeveOuter, lowerBack, lowerFront, folded };
  }

  // ------------------------------------------------------------ agent hooks
  const PARAMS = {
    "mouth.smile":  { key: "smile", min: -1, max: 1.5, about: "Mouth curve: -1 frown, 0 flat, 1 resting smile, 1.4 big grin." },
    "mouth.open":   { key: "open", min: 0, max: 1, about: "Jaw opening: 0 closed, 1 wide open. The chin drops with it; teeth and tongue show when wide." },
    "mouth.width":  { key: "width", min: 0.4, max: 1.3, about: "Mouth width: under 0.7 rounds the mouth into an O." },
    "eyes.open":    { key: "eyeH", min: 0.1, max: 1.4, about: "Eye height: 0.2 sleepy, 1 normal, 1.3 wide." },
    "eyes.happy":   { key: "happy", min: 0, max: 1, about: "Bends the eyes into smiling arcs." },
    "eyes.squeeze": { key: "squeeze", min: 0, max: 1, about: "Squeezes happy eyes shut, as in a laugh." },
    "eyes.lookX":   { key: "lookX", min: -10, max: 10, about: "Gaze left (-) or right (+)." },
    "eyes.lookY":   { key: "lookY", min: -8, max: 8, about: "Gaze up (-) or down (+)." },
    "brows.show":   { key: "browShow", min: 0, max: 1, about: "Brow visibility; hidden at rest." },
    "brows.raise":  { key: "brow", min: -16, max: 6, about: "Brow height: negative raises, positive lowers." },
    "brows.tilt":   { key: "browTilt", min: -1, max: 1, about: "Inner brow tilt: +1 worried, -1 cross." },
    "cheeks.blush": { key: "blush", min: 0, max: 1, about: "Blush marks under the eyes." },
    "head.tilt":    { key: "tilt", min: -12, max: 12, about: "Head roll in degrees." },
    "head.turn":    { key: "turn", min: -12, max: 12, about: "Head turn left (-) or right (+); the face slides for a 3/4 view." },
    "head.nod":     { key: "nod", min: -10, max: 16, about: "Head pitch: positive looks down." },
    "ears.perk":    { key: "earPerk", min: 0, max: 1, about: "Ears lift and flare." },
    "body.lean":    { key: "lean", min: -8, max: 8, about: "Upper body lean in degrees: negative leans back, positive forward." },
    "body.sway":    { key: "sway", min: -40, max: 40, about: "Weight shift left (-) or right (+), in drawing px. Knees follow." },
    "body.bob":     { key: "bob", min: -200, max: 70, about: "Body height: positive crouches, negative rises." },
    "shoulders.shrug": { key: "shrug", min: -15, max: 35, about: "Shoulder lift: negative droops." },
    "feet.lift":    { key: "feetLift", min: 0, max: 160, about: "Lifts both feet off the ground, for jumps." },
    "body.squash":  { key: "squash", min: -0.25, max: 0.3, about: "Squash and stretch, volume preserved: positive squashes (shorter, wider), negative stretches (taller, thinner). Normally automatic." }
  };
  const FINGER_NAMES = ["index", "middle", "ring", "little"];
  for (const [name, S] of [["right", "R"], ["left", "L"]]) {
    PARAMS[`hand.${name}.shoulder`] = { key: "sh" + S, min: -200, max: 200, about: `${name} upper arm angle: 0 hangs down, 90 points screen-right, 180 points up, -90 screen-left.` };
    PARAMS[`hand.${name}.elbow`] = { key: "el" + S, min: -160, max: 160, about: "Elbow bend, relative to the upper arm, in degrees." };
    PARAMS[`hand.${name}.wrist`] = { key: "wr" + S, min: -95, max: 95, about: "Wrist bend, relative to the forearm, in degrees." };
    PARAMS[`hand.${name}.palm`] = { key: "side" + S, min: -1, max: 1, about: "Which way the hand faces: 1 thumb forward, -1 turned over. Passing through 0 shows the hand edge-on." };
    PARAMS[`hand.${name}.spread`] = { key: "spread" + S, min: 0, max: 1, about: "Finger spread." };
    PARAMS[`hand.${name}.thumb`] = { key: "thumb" + S, min: 0, max: 1, about: "Thumb extension." };
    PARAMS[`hand.${name}.thumbAngle`] = { key: "thumbAng" + S, min: -120, max: 10, about: "Thumb angle from the fingers: -15 tucked, -60 open, -90 at right angles." };
    FINGER_NAMES.forEach((f2, i) => {
      PARAMS[`hand.${name}.${f2}`] = { key: `f${i}${S}`, min: 0, max: 1, about: `${f2} finger: 0 curled into the palm, 1 straight.` };
    });
  }
  const ACTIONS = ["blink", "wink", "nod", "shakeHead", "wiggleEars", "hop", "bounce", "poke", "laughBurst", "stretch"];

  const TOOLS = [
    { name: "mascot_express", description: "Set the facial expression; the body posture follows (a sad face droops the shoulders, surprise jolts). Optionally return to the resting smile after hold_seconds.",
      inputSchema: { type: "object", properties: { expression: { type: "string", enum: Object.keys(EXPRESSIONS) }, hold_seconds: { type: "number", minimum: 0 } }, required: ["expression"] } },
    { name: "mascot_gesture", description: "Play a whole-arm gesture. 'none' relaxes both arms. Optionally relax after hold_seconds.",
      inputSchema: { type: "object", properties: { gesture: { type: "string", enum: PUBLIC_GESTURES }, hold_seconds: { type: "number", minimum: 0 } }, required: ["gesture"] } },
    { name: "mascot_say", description: "Speak a line with lip sync, head beats and natural hand gestures. Resolves when the line ends. speak=true also voices it with the browser's speech engine. expression and gesture are applied first.",
      inputSchema: { type: "object", properties: { text: { type: "string" }, speak: { type: "boolean" }, rate: { type: "number", minimum: 0.5, maximum: 2 },
        expression: { type: "string", enum: Object.keys(EXPRESSIONS) }, gesture: { type: "string", enum: PUBLIC_GESTURES } }, required: ["text"] } },
    { name: "mascot_action", description: "Play a one-shot action.",
      inputSchema: { type: "object", properties: { action: { type: "string", enum: ACTIONS } }, required: ["action"] } },
    { name: "mascot_look", description: "Aim gaze and head. x and y run from -1 (left/up) to 1 (right/down). release=true hands control back to the cursor and idle glances.",
      inputSchema: { type: "object", properties: { x: { type: "number", minimum: -1, maximum: 1 }, y: { type: "number", minimum: -1, maximum: 1 }, release: { type: "boolean" } } } },
    { name: "mascot_set", description: "Low-level control of any rig point by name (see mascot_list_params). Values ease in on springs and are held until released or replaced by an expression or gesture. release takes a list of names, or true for all.",
      inputSchema: { type: "object", properties: { params: { type: "object", additionalProperties: { type: "number" } }, release: { oneOf: [{ type: "boolean" }, { type: "array", items: { type: "string" } }] } } } },
    { name: "mascot_perform", description: "Run a timeline of tool calls in order. Each step is {tool, arguments, wait_seconds}. mascot_say steps wait for the line to finish.",
      inputSchema: { type: "object", properties: { steps: { type: "array", items: { type: "object", properties: { tool: { type: "string" }, arguments: { type: "object" }, wait_seconds: { type: "number", minimum: 0 } }, required: ["tool"] } } }, required: ["steps"] } },
    { name: "mascot_view", description: "Frame the mascot ('full' body or the original 'bust' crop) and/or set the line weight ('bold' brand lines or fine 'hairline').",
      inputSchema: { type: "object", properties: { view: { type: "string", enum: Object.keys(VIEWS) }, line: { type: "string", enum: ["bold", "hairline"] } } } },
    { name: "mascot_ascii", description: "See the mascot: returns the current frame drawn as ASCII text (cols characters wide), so an agent can look at the pose and expression it just set.",
      inputSchema: { type: "object", properties: { cols: { type: "number", minimum: 32, maximum: 140 } } } },
    { name: "mascot_get_state", description: "Read the current expression, gesture, view, speaking status and every rig point's live value.",
      inputSchema: { type: "object", properties: {} } },
    { name: "mascot_list_params", description: "List every rig point mascot_set accepts, with its range and meaning.",
      inputSchema: { type: "object", properties: {} } }
  ];

  // ------------------------------------------------------------ runtime
  class MascotRig {
    constructor(container, options = {}) {
      // Hairline's five options (intensity, theme, label, onRead, play), plus
      // the framing, the line weight and the mascot's own behaviour switches.
      this.opts = Object.assign({ follow: true, idle: true, view: "full", line: "bold", talkGestures: true, reducedMotion: undefined,
        intensity: 0.5, theme: "auto", label: "Blue cap mascot", onRead: null, play: false }, options);
      this.opts.intensity = typeof this.opts.intensity === "number" ? clamp(this.opts.intensity, 0, 1) : 0.5;
      if (this.opts.reducedMotion === undefined) {
        this.opts.reducedMotion = !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
      }
      this.uid = `mascot${++uidCounter}`;
      const { svg, parts } = buildSVG(this.uid);
      this.svg = svg; this.parts = parts;
      this.arms = { R: buildArm(this.uid, "R"), L: buildArm(this.uid, "L") };
      parts.layerMid.appendChild(this.arms.L.g);
      parts.layerMid.appendChild(this.arms.R.g);
      container.appendChild(svg);
      this.update({ theme: this.opts.theme, label: this.opts.label, line: this.opts.line, play: this.opts.play });

      const S = (v, k, d) => new Spring(v, k, d);
      this.s = {
        smile: S(1, 140, 21), open: S(0, 340, 33), width: S(1, 180, 24), happy: S(0, 140, 21), squeeze: S(0, 140, 21),
        eyeH: S(1, 160, 18), blink: S(1, 1100, 46), winkL: S(1, 500, 30), winkR: S(1, 500, 30),
        lookX: S(0, 420, 34), lookY: S(0, 420, 34),      // eyes are fast; the head follows
        cornerL: S(-3, 150, 15), cornerR: S(-3, 150, 15),
        brow: S(0, 150, 16), browTilt: S(0, 150, 16), browShow: S(0, 130, 18), blush: S(0, 60, 14),
        tilt: S(0, 100, 13), turn: S(0, 100, 13.5), nod: S(0, 150, 17),
        earL: S(0, 260, 9), earR: S(0, 260, 9), earPerk: S(0, 120, 14),
        fringe: S(0, 70, 5), lock: S(0, 60, 4), button: S(0, 160, 6),
        lean: S(0, 40, 9), sway: S(0, 28, 8), bob: S(0, 150, 15), shrug: S(0, 110, 15),
        hipTilt: S(0, 26, 8), twist: S(0, 38, 9), teeth: S(0, 260, 29),
        swingR: S(0, 55, 4.3), swingL: S(0, 55, 4.3),   // arms hang like pendulums
        // squash & stretch and soft-body: elastic, so they overshoot and jiggle back
        squash: S(0, 240, 8.5), headSq: S(0, 300, 9), softX: S(0, 70, 4.6), softY: S(0, 170, 6.5),
        flopR: S(0, 170, 8.5), flopL: S(0, 170, 8.5),
        feetLift: S(0, 230, 19), footTilt: S(0, 200, 16), view: S(0, 50, 13)
      };
      for (const side of ["R", "L"]) {
        const r = REST[side], h = HANDS[r.hand];
        // proximal joints are heavy and calm, distal ones light and lively
        this.s["sh" + side] = S(r.shoulder, 52, 11.5);   // heavy, calm
        this.s["el" + side] = S(r.elbow, 78, 13.5);
        this.s["wr" + side] = S(r.wrist, 110, 12);
        this.s["lag" + side] = S(0, 150, 13.5);   // wrist drag from forearm speed: real mass, a little bounce
        this.s["lift" + side] = S(0, 95, 11);     // one-sided shoulder lift
        this.s["side" + side] = S(r.side, 120, 14);
        this.s["spread" + side] = S(h.spread, 150, 13);
        this.s["thumb" + side] = S(h.thumb, 160, 14);
        this.s["thumbAng" + side] = S(h.thumbAngle, 160, 14);
        this.s["wave" + side] = S(0, 60, 12);
        this.s["fsU" + side] = S(1, 110, 15);   // upper arm foreshortening (pointing at the camera)
        this.s["fsF" + side] = S(1, 140, 16);
        for (let i = 0; i < 4; i++) this.s[`f${i}${side}`] = S(h.fingers[i], 150, 13);
      }

      this.expression = "smile";
      this.gestureName = "none";
      this.armPose = { R: REST.R, L: REST.L };
      this.view = this.opts.view in VIEWS ? this.opts.view : "full";
      this.s.view.snap(this.view === "bust" ? 1 : 0);
      this.pointer = null;
      this.talk = null;
      this.mouthOverride = null;
      this.held = {};
      this.listeners = {};
      this.timers = [];
      this.t = 0;
      this.nextBlink = 1.5 + Math.random() * 2;
      this.nextSaccade = 0.8;
      this.nextTwitch = 4 + Math.random() * 5;
      this.nextShift = 3 + Math.random() * 3;
      this.nextFidget = 6 + Math.random() * 5;
      this.saccade = [0, 0];
      this.addSq = 0; this.prevLift = 0;
      this.idleTurn = 0; this.idleTilt = 0; this.idleLook = null; this.nextIdle = 2 + Math.random() * 2;
      this.wavePhase = 0;
      this.shakeT = 0;
      this.laughT = 0;
      this.beat = 0;
      this.nodPulse = 0;
      this.idleSway = 0;
      this.attention = 0;
      // noise channels for posture, head drift, breathing and hands
      this.nz = {}; ["sway", "lean", "tilt", "nod", "turn", "breath", "hand", "laugh", "wave", "talk"].forEach((k, i) => { this.nz[k] = makeNoise(11 + i * 13); });
      this.base = { lean: 0, tilt: 0, nod: 0, shrug: 0, twist: 0 };
      this.lid = 1; this.blinkT = null;   // set by expressions and gestures
      this.add = { shrug: 0, nod: 0, tilt: 0 };             // short-lived offsets from actions
      this.breathPhase = 0; this.breath = 0; this.breathAmp = 1; this.nextSigh = 16 + Math.random() * 14;
      this.turnLag = 0; this.greetToken = 0; this.armToken = { R: 0, L: 0 }; this.foreVel = { R: 0, L: 0 }; this.prevFore = {};

      this._onMove = (e) => { this.pointer = [e.clientX, e.clientY]; this._lastPointer = performance.now(); };
      this._onLeave = () => { this.pointer = null; };
      this._onClick = () => this.poke();
      if (this.opts.follow) {
        root.addEventListener("pointermove", this._onMove, { passive: true });
        root.document.addEventListener("pointerleave", this._onLeave);
      }
      svg.addEventListener("click", this._onClick);
      svg.style.cursor = "pointer";

      // the loop sleeps while the figure is offscreen or the tab is hidden
      this.visible = true;
      if (root.IntersectionObserver) {
        this._io = new IntersectionObserver((es) => { for (const en of es) this.visible = en.isIntersecting; this._resume(); }, { rootMargin: "80px" });
        this._io.observe(svg);
      }
      this._onVis = () => this._resume();
      root.document.addEventListener("visibilitychange", this._onVis);

      this.express("smile", { instant: true });
      this._render();
      this._last = performance.now();
      this._raf = requestAnimationFrame((t) => this._tick(t));
    }

    // -------------------------------------------------- public API
    // Change options after mount. A key left out stays as it is.
    update(o = {}) {
      if ("intensity" in o) this.opts.intensity = typeof o.intensity === "number" ? clamp(o.intensity, 0, 1) : 0.5;
      if ("label" in o) this.svg.setAttribute("aria-label", o.label || "Blue cap mascot");
      if ("onRead" in o) this.opts.onRead = o.onRead;
      if ("line" in o) { this.opts.line = o.line === "hairline" ? "hairline" : "bold"; this.svg.classList.toggle("is-hairline", this.opts.line === "hairline"); }
      if ("theme" in o) {
        this.opts.theme = o.theme || "auto";
        const st = this.svg.style;
        if (this.opts.theme === "light") { st.setProperty("--mascot-ink", "#1543e6"); st.setProperty("--mascot-paper", "#ffffff"); }
        else if (this.opts.theme === "dark") { st.setProperty("--mascot-ink", "#7d97ff"); st.setProperty("--mascot-paper", "#12132a"); }
        else { st.removeProperty("--mascot-ink"); st.removeProperty("--mascot-paper"); }
      }
      if ("view" in o) this.setView(o.view);
      if ("play" in o) this._setPlay(!!o.play);
      return this;
    }

    // play: walks through a short tour on its own until a pointer arrives,
    // and picks it up again a few seconds after the pointer leaves.
    _setPlay(on) {
      this.opts.play = on;
      clearInterval(this._playTimer);
      this._playIdx = 0;
      if (!on || this.opts.reducedMotion) return;
      const TOUR = [["wave", "happy"], ["none", "smile"], ["idea", null], ["none", "smile"], ["think", null], ["thumbsUp", null], ["none", "smile"]];
      this._playTimer = setInterval(() => {
        if (this.talk || (this._lastPointer && performance.now() - this._lastPointer < 5000)) return;
        const [g, e] = TOUR[this._playIdx++ % TOUR.length];
        this.gesture(g); if (e) this.express(e);
      }, 2600);
    }

    express(name, { instant = false, hold = 0 } = {}) {
      const e = EXPRESSIONS[name];
      if (!e) return this;
      this.expression = name;
      // the face changes as one gesture spreading out from the mouth:
      // mouth first, then eyes, then brows, then the cheeks colour
      const FACE = { smile: [0, 420], open: [0, 360], width: [0, 420], happy: [40, 380], squeeze: [40, 380], eyeH: [40, 380], brow: [80, 360], browTilt: [80, 360], browShow: [80, 360], blush: [140, 700] };
      for (const k in FACE) {
        if (instant) this.s[k].snap(e[k]); else this._go(this.s[k], e[k], FACE[k][1], FACE[k][0]);
        delete this.held[k];
      }
      this.exprLook = [e.lookX || 0, e.lookY || 0];
      const post = Object.assign({ shrug: 0, lean: 0, nod: 0, tilt: 0 }, POSTURE[name] || {});
      this.posture = post;
      for (const k of ["shrug", "lean", "nod", "tilt"]) { this.base[k] = post[k]; delete this.held[k]; }
      // smiles build unevenly: one corner of the mouth leads the other
      const cornerGoal = -e.smile * 3 - Math.max(0, e.smile - 1) * 7;
      const first = Math.random() < 0.5 ? "cornerL" : "cornerR", second = first === "cornerL" ? "cornerR" : "cornerL";
      if (instant) { this.s.cornerL.snap(cornerGoal); this.s.cornerR.snap(cornerGoal); }
      else { this._go(this.s[first], cornerGoal, 420, 0); this._go(this.s[second], cornerGoal, 420, 80 + Math.random() * 70); }
      this.s.earPerk.set(name === "surprised" ? 1 : 0);
      if (name === "happy") this.wiggleEars();
      if (name === "laugh") this.laughBurst();
      if (name === "surprised" && !instant) { this.s.bob.kick(-420); this.s.shrug.kick(260); this.blink(); this.s.squash.kick(-1); this.s.headSq.kick(-0.9); }
      clearTimeout(this._exprHold);
      if (hold) this._exprHold = setTimeout(() => this.express("smile"), hold * 1000);
      this._emit("state", this.getState());
      return this;
    }

    gesture(name, { hold = 0 } = {}) {
      const g = GESTURES[name];
      if (!g) return this;
      this.gestureName = name;
      for (const side of ["R", "L"]) this._applyArm(side, g[side] || REST[side]);
      if (g.face) this.express(g.face);
      if (g.faceAfter) this._later(0.9, () => { if (this.gestureName === name) this.express(g.faceAfter); });
      if (g.look) this.exprLook = g.look;
      const b = g.body || {}, post = this.posture || {};
      // each gesture starts from the expression's own posture
      this.base.lean = post.lean || 0; this.base.tilt = post.tilt || 0; this.base.shrug = post.shrug || 0;
      this.base.twist = b.twist ?? 0;
      if (b.lean != null) this.base.lean = b.lean;
      if (b.shrug != null) this.base.shrug = b.shrug;
      if (b.tilt != null) this.base.tilt = b.tilt;
      if (b.hop) this.hop();
      this.s.liftR.set(0); this.s.liftL.set(0);
      if (name === "wave" || name === "hello" || name === "hi5") this._greet(name);
      clearTimeout(this._gestureHold);
      if (hold) this._gestureHold = setTimeout(() => { this.gesture("none"); this.express("smile"); }, hold * 1000);
      this._emit("state", this.getState());
      return this;
    }

    setView(view) {
      if (!VIEWS[view]) return this;
      this.view = view;
      this.s.view.set(view === "bust" ? 1 : 0);
      this._emit("state", this.getState());
      return this;
    }

    blink() { this.blinkT = 0; return this; }
    wink(side = "R") {
      const s = this.s["wink" + side];
      s.set(0); this.s.smile.kick(5); this.s.tilt.kick(30);
      this._later(0.4, () => s.set(1));
      return this;
    }
    nod(times = 2) {
      for (let i = 0; i < times; i++) {
        this._later(i * 0.42, () => { this.add.nod = 12 - i * 2; });
        this._later(i * 0.42 + 0.19, () => { this.add.nod = -1.5; });
      }
      this._later(times * 0.42 + 0.1, () => { this.add.nod = 0; });
      return this;
    }
    shakeHead(times = 3) { this.shakeT = times * 0.33; return this; }
    wiggleEars() {
      [0, 0.12, 0.24, 0.36].forEach((t, i) => this._later(t, () => { this.s.earL.kick(i % 2 ? 90 : -90); this.s.earR.kick(i % 2 ? -90 : 90); }));
      return this;
    }
    // Anticipation, launch, airtime, landing squash, settle.
    hop() {
      if (this.opts.reducedMotion) { this.s.bob.kick(-200); return this; }
      const s = this.s;
      const a = this.add;
      // anticipation: squash down; launch: stretch up; apex: round again;
      // landing: squash hard and let the elastic jiggle settle it
      s.bob.set(38); a.shrug = -6; a.nod = 4; this.addSq = 0.07;
      this._later(0.14, () => { s.bob.set(-120); s.feetLift.set(88); s.footTilt.set(14); a.shrug = 9; a.nod = -4; this.addSq = -0.07; });
      this._later(0.3, () => { this.addSq = 0; });
      this._later(0.43, () => { s.bob.set(32); s.feetLift.set(0); s.footTilt.set(0); a.shrug = -4; a.nod = 4; this.addSq = 0.08; s.squash.kick(0.9); });
      this._later(0.58, () => { this.addSq = 0; });
      this._later(0.64, () => { s.bob.set(0); a.shrug = 0; a.nod = 0; });
      return this;
    }
    laughBurst(seconds = 1.6) { this.laughT = Math.max(this.laughT, seconds); return this; }
    // A springy bounce in place, feet on the ground: squash, stretch, settle.
    bounce(times = 3) {
      if (this.opts.reducedMotion) return this;
      for (let i = 0; i < times; i++) {
        const k = 1 - i * 0.28;
        this._later(i * 0.34, () => { this.addSq = 0.07 * k; this.s.bob.set(26 * k); });
        this._later(i * 0.34 + 0.17, () => { this.addSq = -0.05 * k; this.s.bob.set(-12 * k); });
      }
      this._later(times * 0.34, () => { this.addSq = 0; this.s.bob.set(0); });
      return this;
    }
    stretch() {
      const prev = this.gestureName;
      this.gesture("cheer");
      this.express("sleepy");
      this.s.lean.set(-4);
      this._later(1.6, () => { this.gesture(prev === "cheer" ? "none" : prev); this.express("smile"); });
      return this;
    }
    poke() {
      const prevFace = this.expression === "laugh" ? "smile" : this.expression;
      const prevGesture = this.gestureName;
      this.express("laugh"); this.hop();
      if (prevGesture === "none") this.gesture("belly");
      this._later(1.4, () => {
        this.express(prevFace);
        if (this.gestureName === "belly") this.gesture(prevGesture);
      });
      return this;
    }

    lookAt(clientX, clientY) { this.pointer = clientX == null ? null : [clientX, clientY]; return this; }
    follow(on) {
      this.opts.follow = !!on;
      root.removeEventListener("pointermove", this._onMove);
      if (on) root.addEventListener("pointermove", this._onMove, { passive: true });
      else this.pointer = null;
      return this;
    }

    // Lip sync to text. Returns a promise that resolves when the line ends.
    say(text, { speak = false, rate = 1, voice } = {}) {
      this.stopTalking();
      const units = [];
      const raw = String(text);
      let t = 0, wordStart = true;
      for (let i = 0; i < raw.length; i++) {
        const ch = raw[i], lo = ch.toLowerCase();
        let dur = 0.055, shape = VISEME[lo] || null, pause = false;
        if ("aeiouy".includes(lo)) dur = 0.085;
        if (lo === " ") { dur = 0.045; shape = null; pause = true; }
        if (",;:".includes(lo)) { dur = 0.22; shape = null; pause = true; }
        if (".!?".includes(lo)) { dur = 0.34; shape = null; pause = true; }
        if (!shape && !pause && /[a-z0-9]/i.test(ch)) shape = [0.34, 0.98];
        const isWordStart = wordStart && /[a-z0-9]/i.test(ch);
        if (isWordStart) wordStart = false;
        if (pause) wordStart = true;
        // capitalised or long words get a little more emphasis
        let stress = 0;
        if (isWordStart) {
          const word = raw.slice(i).match(/^[A-Za-z0-9']+/)?.[0] || "";
          stress = (word.length > 6 ? 0.6 : 0.3) + (/^[A-Z]/.test(word) && i > 0 ? 0.3 : 0);
        }
        units.push({ ch: lo, t, dur: dur / rate, shape, wordStart: isWordStart, stress, index: i });
        t += dur / rate;
      }
      const total = t;
      const startGesture = this.gestureName;
      if (this.opts.talkGestures && startGesture === "none") this._applyArm("R", GESTURES.explain.R);
      return new Promise((resolve) => {
        const done = () => {
          if (!this.talk) return;
          const tk = this.talk;
          this.talk = null;
          this.s.open.set(EXPRESSIONS[this.expression].open);
          this.s.width.set(EXPRESSIONS[this.expression].width);
          this.s.teeth.set(0);
          if (this.opts.talkGestures && this.gestureName === "none" && tk.autoGesture) this._applyArm("R", REST.R);
          this._emit("speechend", { text: raw }); this._emit("state", this.getState());
          resolve();
        };
        this.talk = { units, total, t: 0, i: 0, done, autoGesture: startGesture === "none" };
        this._emit("speechstart", { text: raw }); this._emit("state", this.getState());
        if (speak && root.speechSynthesis && root.SpeechSynthesisUtterance) {
          try {
            const u = new SpeechSynthesisUtterance(raw);
            u.rate = rate; if (voice) u.voice = voice;
            // keep the mouth on the engine's clock when it reports word boundaries
            u.onboundary = (ev) => { if (this.talk) { const unit = units.find((x) => x.index >= ev.charIndex); if (unit) this.talk.t = unit.t; } };
            u.onend = () => { if (this.talk) this.talk.t = total + 1; this.talk && (this.talk.voiceDone = true); };
            this.talk.utterance = u; this.talk.waitForVoice = true;
            root.speechSynthesis.cancel(); root.speechSynthesis.speak(u);
          } catch (_) { /* speech is optional */ }
        }
      });
    }
    stopTalking() {
      if (this.talk) { if (this.talk.utterance && root.speechSynthesis) root.speechSynthesis.cancel(); this.talk.done(); }
      return this;
    }
    setMouthOpen(level) { this.mouthOverride = level == null ? null : clamp(level, 0, 1); return this; }
    lipSync(audioEl) {
      const Ctx = root.AudioContext || root.webkitAudioContext;
      if (!Ctx) return this;
      const ctx = this._audioCtx || (this._audioCtx = new Ctx());
      const src = ctx.createMediaElementSource(audioEl);
      const an = ctx.createAnalyser(); an.fftSize = 512;
      src.connect(an); an.connect(ctx.destination);
      const buf = new Uint8Array(an.fftSize);
      this._analyser = () => {
        an.getByteTimeDomainData(buf);
        let sum = 0; for (const v of buf) sum += (v - 128) * (v - 128);
        return clamp(Math.sqrt(sum / buf.length) / 30, 0, 1);
      };
      audioEl.addEventListener("ended", () => { this._analyser = null; this.setMouthOpen(null); });
      return this;
    }
    showRig(on = true) { this.parts.rig.style.display = on ? "" : "none"; this.rigOn = on; if (on && !this.rigNodes) this._buildRig(); return this; }

    // -------------------------------------------------- agent API
    set(params = {}) {
      const unknown = [];
      for (const [name, value] of Object.entries(params)) {
        const spec = PARAMS[name];
        if (!spec || typeof value !== "number" || !isFinite(value)) { unknown.push(name); continue; }
        const v = clamp(value, spec.min, spec.max);
        this.held[spec.key] = v;
        this.s[spec.key].set(v);
      }
      return unknown;
    }
    release(names = true) {
      if (names === true) { this.held = {}; return this; }
      for (const n of [].concat(names)) { const spec = PARAMS[n]; if (spec) delete this.held[spec.key]; }
      return this;
    }
    getState() {
      const params = {};
      for (const [name, spec] of Object.entries(PARAMS)) params[name] = Math.round(this.s[spec.key].value * 100) / 100;
      return { expression: this.expression, gesture: this.gestureName, view: this.view, line: this.opts.line, caption: this.caption(), speaking: !!this.talk,
        held: Object.keys(PARAMS).filter((n) => PARAMS[n].key in this.held), params };
    }
    on(event, fn) { (this.listeners[event] ||= []).push(fn); return () => this.off(event, fn); }
    off(event, fn) { this.listeners[event] = (this.listeners[event] || []).filter((h) => h !== fn); }
    caption() {
      if (this.talk) return "talking";
      if (this.laughT > 0) return "laughing";
      if (this.gestureName !== "none") return this.gestureName;
      return this.expression === "smile" ? "rest" : this.expression;
    }
    _emit(event, detail) {
      if (event === "state" && this.opts.onRead) { const c = this.caption(); if (c !== this._lastRead) { this._lastRead = c; try { this.opts.onRead(c); } catch (_) { /* never stop the rig */ } } } for (const h of this.listeners[event] || []) { try { h(detail); } catch (_) { /* listeners never stop the rig */ } } }

    async call(name, args = {}) {
      this._emit("command", { name, arguments: args });
      const fail = (message) => ({ ok: false, error: message });
      try {
        switch (name) {
          case "mascot_express":
            if (!EXPRESSIONS[args.expression]) return fail(`Unknown expression "${args.expression}". Use one of: ${Object.keys(EXPRESSIONS).join(", ")}.`);
            this.express(args.expression, { hold: args.hold_seconds || 0 }); break;
          case "mascot_gesture":
            if (!PUBLIC_GESTURES.includes(args.gesture)) return fail(`Unknown gesture "${args.gesture}". Use one of: ${PUBLIC_GESTURES.join(", ")}.`);
            this.gesture(args.gesture, { hold: args.hold_seconds || 0 }); break;
          case "mascot_say":
            if (typeof args.text !== "string" || !args.text.trim()) return fail("text is required.");
            if (args.expression && EXPRESSIONS[args.expression]) this.express(args.expression);
            if (args.gesture && GESTURES[args.gesture]) this.gesture(args.gesture);
            await this.say(args.text, { speak: !!args.speak, rate: args.rate || 1 }); break;
          case "mascot_action":
            if (!ACTIONS.includes(args.action)) return fail(`Unknown action "${args.action}". Use one of: ${ACTIONS.join(", ")}.`);
            this[args.action](); break;
          case "mascot_look":
            if (args.release) { this.release(["eyes.lookX", "eyes.lookY", "head.turn"]); break; }
            this.set({ "eyes.lookX": clamp(+args.x || 0, -1, 1) * 9, "eyes.lookY": clamp(+args.y || 0, -1, 1) * 7, "head.turn": clamp(+args.x || 0, -1, 1) * 10 });
            break;
          case "mascot_set": {
            if (args.release) this.release(args.release);
            const unknown = args.params ? this.set(args.params) : [];
            if (unknown.length) return Object.assign(fail(`Ignored unknown or non-numeric params: ${unknown.join(", ")}. Call mascot_list_params for valid names.`), { state: this.getState() });
            break;
          }
          case "mascot_perform": {
            if (!Array.isArray(args.steps)) return fail("steps must be an array.");
            const results = [];
            for (const step of args.steps) {
              if (step.tool === "mascot_perform") { results.push(fail("Nested timelines are not allowed.")); continue; }
              results.push(await this.call(step.tool, step.arguments || {}));
              if (step.wait_seconds) await new Promise((r) => setTimeout(r, step.wait_seconds * 1000));
            }
            return { ok: results.every((r) => r.ok), steps: results, state: this.getState() };
          }
          case "mascot_view":
            if (args.view != null && !VIEWS[args.view]) return fail(`Unknown view "${args.view}". Use full or bust.`);
            if (args.line != null && !["bold", "hairline"].includes(args.line)) return fail(`Unknown line "${args.line}". Use bold or hairline.`);
            if (args.view) this.setView(args.view);
            if (args.line) this.update({ line: args.line });
            break;
          case "mascot_get_state": break;
          case "mascot_ascii": {
            const cols = Math.round(clamp(+args.cols || 72, 32, 140));
            return { ok: true, cols, ascii: await asciiFrame(this, cols), state: this.getState() };
          }
          case "mascot_list_params":
            return { ok: true, params: Object.fromEntries(Object.entries(PARAMS).map(([n, p]) => [n, { min: p.min, max: p.max, about: p.about }])) };
          default:
            return fail(`Unknown tool "${name}".`);
        }
      } catch (err) {
        return fail(String((err && err.message) || err));
      }
      const state = this.getState();
      this._emit("state", state);
      return { ok: true, state };
    }

    listen(target = root) {
      const handler = async (ev) => {
        const msg = ev.data;
        if (!msg || msg.jsonrpc !== "2.0" || !msg.method) return;
        let result;
        if (msg.method === "tools/list") result = { tools: TOOLS };
        else if (msg.method === "tools/call") result = await this.call(msg.params?.name, msg.params?.arguments || {});
        else return;
        (ev.source || target).postMessage({ jsonrpc: "2.0", id: msg.id, result }, ev.origin && ev.origin !== "null" ? ev.origin : "*");
      };
      target.addEventListener("message", handler);
      return () => target.removeEventListener("message", handler);
    }

    destroy() {
      this.destroyed = true;
      cancelAnimationFrame(this._raf);
      this._io?.disconnect();
      root.document.removeEventListener("visibilitychange", this._onVis);
      clearInterval(this._playTimer);
      this.timers.forEach(clearTimeout);
      clearTimeout(this._exprHold); clearTimeout(this._gestureHold);
      root.removeEventListener("pointermove", this._onMove);
      root.document.removeEventListener("pointerleave", this._onLeave);
      this.svg.remove();
    }

    // -------------------------------------------------- internals
    _later(sec, fn) { this.timers.push(setTimeout(fn, sec * 1000)); }
    _go(spring, to, ms, delay = 0, queue = false) {
      if (this.opts.reducedMotion) spring.snap(to); else spring.go(to, ms, delay, queue);
    }
    _aim(spring, to, delay = 0) { if (this.opts.reducedMotion) spring.snap(to); else spring.aim(to, delay); }

    // One small idle action. With someone present, only quiet, attentive ones.
    _idleAct(alone) {
      const s = this.s, e = EXPRESSIONS[this.expression];
      const look = (x, y, sec) => { this.idleLook = [x, y]; this.idleTurn = x * 0.7; if (Math.hypot(x, y) > 5 && Math.random() < 0.6) this.blink(); this._later(sec, () => { this.idleLook = null; this.idleTurn = 0; }); };
      const acts = alone ? [
        [3, () => look((Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 5), (Math.random() - 0.6) * 6, 1 + Math.random() * 1.4)],   // glance away
        [2, () => { look(0, 0, 2); this._go(s.smile, e.smile + 0.25, 420); this._go(s.happy, Math.min(1, e.happy + 0.35), 420, 60); this._later(1.6, () => { this._go(s.smile, e.smile, 700); this._go(s.happy, e.happy, 700); }); }], // finds you, smiles
        [2, () => { this.idleTilt = (Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 3); this._later(1.4 + Math.random(), () => { this.idleTilt = 0; }); }], // curious tilt
        [1.5, () => { this._go(s.width, 0.82, 260); this._go(s.smile, e.smile - 0.3, 260); this._later(0.7, () => { this._go(s.width, e.width, 500); this._go(s.smile, e.smile, 500); }); }], // presses lips
        [1, () => { this._go(s.browShow, 0.7, 240); this._go(s.brow, -8, 240); this._later(0.9, () => { this._go(s.brow, e.brow, 600); this._go(s.browShow, e.browShow, 600); }); }], // a lifted brow
        [2.5, () => { this.idleSway = (Math.random() - 0.5) * 34; }],                                                     // shifts weight
        [1, () => { look(7, 7, 1.8); this._applyArm("R", { shoulder: 6, elbow: -46, wrist: -18, hand: "soft", side: 1, z: "mid" }); this._later(1.7, () => { if (this.gestureName === "none") this._applyArm("R", REST.R); }); }], // looks at his hand
        [0.35, () => this.stretch()]
      ] : [
        [3, () => { this.blink(); }],
        [2, () => { this.idleTilt = (Math.random() < 0.5 ? -1 : 1) * 4; this._later(1.2, () => { this.idleTilt = 0; }); }],
        [2, () => { this._go(s.smile, e.smile + 0.2, 380); this._later(1.2, () => this._go(s.smile, e.smile, 600)); }],
        [1, () => { this.add.nod = 5; this._later(0.25, () => { this.add.nod = 0; }); }]
      ];
      let r = Math.random() * acts.reduce((t, x) => t + x[0], 0);
      for (const [w, fn] of acts) { if ((r -= w) <= 0) { fn(); break; } }
    }

    // A greeting is a whole-body event, not an arm animation: eyes find you,
    // brows flash, the head tilts toward the hand, the shoulder rises, weight
    // shifts away for balance, the smile builds, then the wave decays.
    _greet(name) {
      const s = this.s, token = ++this.greetToken;
      const live = (fn) => () => { if (this.greetToken === token && (this.gestureName === name)) fn(); };
      this.exprLook = [0, 0];
      // eyebrow flash: up quickly, held a beat, then down softly
      this._go(s.browShow, 0.9, 200); this._go(s.brow, -13, 220);
      this._later(0.42, live(() => { this._go(s.brow, EXPRESSIONS[this.expression].brow, 600); this._go(s.browShow, EXPRESSIONS[this.expression].browShow, 600); }));
      this._later(0.08, live(() => { this.base.tilt = name === "hello" ? 7 : 5.5; this.base.lean = name === "hi5" ? 2 : -1.6; this.idleSway = -14; this.base.twist = 0.4; }));
      this._later(0.12, live(() => s.liftR.set(name === "hello" ? 16 : 11)));
      this._later(0.3, live(() => { s.open.set(0.38); s.width.set(0.95); }));     // "hi"
      this._later(0.55, live(() => s.open.set(EXPRESSIONS[this.expression].open)));
      this._later(0.95, live(() => this.blink()));
      if (name !== "hi5") {
        // the wave itself: strong at first, then a gentler, hand-held rhythm
        this._later(1.9, live(() => s.waveR.set(0.7)));
        this._later(3.1, live(() => s.waveR.set(0.28)));
        this._later(3.2, live(() => { this.base.tilt = 3; s.liftR.set(6); }));
      }
    }

    // Turn a pose into joint targets. IK poses aim the wrist at a point.
    _applyArm(side, pose) {
      const A = ARMS[side], s = this.s;
      let shoulder = pose.shoulder, elbow = pose.elbow, wrist = pose.wrist;
      if (pose.target) {
        // elbows hang low and slightly out from the body, like real ones
        const sx = side === "R" ? 1 : -1, bend = pose.elbowOut ?? 0.25;
        const natural = (a, b) => a[1] + a[0] * sx * bend > b[1] + b[0] * sx * bend;
        const ik = solveIK(A.S, pose.target, A.Lu * (pose.fsU ?? 1), A.Lf * (pose.fsF ?? 1), natural);
        shoulder = ik.shoulder; elbow = ik.elbow; wrist = wrap(pose.handAngle - ik.fore);
      }
      const near = (spring, target) => { let t = target; while (t - spring.value > 180) t -= 360; while (t - spring.value < -180) t += 360; return t; };
      const shGoal = near(s["sh" + side], shoulder);
      const h = HANDS[pose.hand || "relaxed"];
      // Successive breaking of joints, as Hairline staggers by distance: each
      // joint starts a step later the further it is down the chain, all on
      // the 700ms lift curve, so the arm moves as one gesture. Big swings
      // start with a small dip the other way (anticipation).
      const g = (key, to, ms, delay, queue) => this._go(s[key + side], to, ms, delay, queue);
      const STEP = 45;
      const delta = shGoal - s["sh" + side].value;
      const big = Math.abs(delta) > 30 && !this.opts.reducedMotion;
      const t0 = 0;
      // anticipation is a small push the other way, not a separate stop-start move
      if (big && Math.abs(shGoal) > Math.abs(s["sh" + side].value)) s["sh" + side].kick(-Math.sign(delta) * Math.min(70, Math.abs(delta) * 0.6));
      // Raising: the elbow folds first, so the hand travels up close to the
      // body. Lowering: the elbow stays bent until the arm is nearly down,
      // so the hand never swings out wide.
      const elGoal = wrap(elbow), elNow = s["el" + side].value;
      const folding = Math.abs(elGoal) > Math.abs(elNow) + 35;
      const opening = Math.abs(elGoal) + 35 < Math.abs(elNow);
      const a0 = (key, to, delay) => this._aim(s[key + side], to, delay);
      a0("sh", shGoal, folding ? 50 : 0);
      a0("el", elGoal, folding ? 0 : opening ? 90 : STEP);
      if ((folding || opening) && !this.opts.reducedMotion) {
        // the forearm swings toward the viewer on its way, so in 2D it
        // shortens mid-move and the hand rises in front of the body
        g("fsF", 0.42, folding ? 280 : 380, t0);
        g("fsF", pose.fsF ?? 1, 480, 0, true);
        g("fsU", Math.min(pose.fsU ?? 1, 0.88), 300, t0);
        g("fsU", pose.fsU ?? 1, 520, 0, true);
      } else { g("fsF", pose.fsF ?? 1, 650, t0 + STEP); g("fsU", pose.fsU ?? 1, 700, t0); }
      // the hand has its own mass: wrist and fingers ride springs that start
      // after the arm, so they overshoot a touch and settle, like a real hand
      const a = (key, to, delay) => this._aim(s[key + side], to, delay);
      a("wr", clamp(wrap(wrist), -95, 95), t0 + 3 * STEP);
      a("side", pose.side ?? 1, t0 + 2 * STEP);
      a("thumb", h.thumb, t0 + 3.5 * STEP); a("thumbAng", h.thumbAngle, t0 + 3.5 * STEP); a("spread", h.spread, t0 + 3.5 * STEP);
      const unfurl = h.fingers.reduce((acc, v, i) => acc + v - s[`f${i}${side}`].target, 0) > 0;
      h.fingers.forEach((v, i) => a(`f${i}`, v, t0 + 4 * STEP + (unfurl ? i : 3 - i) * 40));
      g("wave", pose.wave || 0, 500, pose.wave ? t0 + 420 : 0);
      for (const k of ["sh", "el", "wr", "side", "spread", "thumb", "thumbAng", "f0", "f1", "f2", "f3"]) delete this.held[k + side];
      this.armPose[side] = pose;
      const layer = { back: this.parts.layerBack, mid: this.parts.layerMid, top: this.parts.layerTop }[pose.z || "mid"];
      const node = this.arms[side].g;
      if (node.parentNode !== layer) {
        // keep the far arm behind the near one inside a shared layer
        if (side === "L" && layer.firstChild) layer.insertBefore(node, layer.firstChild); else layer.appendChild(node);
      }
    }

    _pointerInSvg() {
      if (!this.pointer) return null;
      const r = (this.hitEl || this.svg).getBoundingClientRect();
      if (!r.width) return null;
      const vb = this.viewBox;
      return [vb[0] + ((this.pointer[0] - r.left) / r.width) * vb[2], vb[1] + ((this.pointer[1] - r.top) / r.height) * vb[3]];
    }

    _tick(now) {
      const dt = Math.min(0.05, (now - this._last) / 1000);
      this._last = now; this.t += dt; this._dt = dt;
      this._behave(dt);
      for (const k in this.s) this.s[k].step(dt);
      this._render();
      this._raf = this.visible && !root.document.hidden ? requestAnimationFrame((t) => this._tick(t)) : 0;
    }
    _resume() {
      if (this.visible && !root.document.hidden && !this._raf && !this.destroyed) {
        this._last = performance.now();
        this._raf = requestAnimationFrame((t) => this._tick(t));
      }
    }

    // Autonomous life and the talking director.
    _behave(dt) {
      const s = this.s, calm = this.opts.reducedMotion;
      const want = (k, v) => { if (!(k in this.held) && !s[k].segs) s[k].set(v); };

      if (this.opts.idle) {
        this.nextBlink -= dt;
        if (this.nextBlink <= 0) {
          this.blink();
          if (Math.random() < 0.18) this._later(0.2, () => this.blink());
          this.nextBlink = 2 + Math.random() * 4;
        }
        this.nextSaccade -= dt;
        if (this.nextSaccade <= 0) {
          const next = [(Math.random() - 0.5) * 8, (Math.random() - 0.5) * 4.5];
          // people often blink when their gaze jumps
          if (Math.hypot(next[0] - this.saccade[0], next[1] - this.saccade[1]) > 4.5 && Math.random() < 0.4) this.blink();
          this.saccade = next; this.nextSaccade = 0.5 + Math.random() * 2.4;
        }
        this.nextTwitch -= dt;
        if (this.nextTwitch <= 0 && !calm) { (Math.random() < 0.5 ? s.earL : s.earR).kick(Math.random() < 0.5 ? 70 : -70); this.nextTwitch = 5 + Math.random() * 7; }
        // shift weight from foot to foot now and then
        this.nextShift -= dt;
        if (this.nextShift <= 0 && !calm) { this.idleSway = (Math.random() - 0.5) * 30; this.nextShift = 4 + Math.random() * 5; }
        // small finger fidget on the near hand when it is relaxed
        this.nextFidget -= dt;
        if (this.nextFidget <= 0 && !calm && this.armPose.R === REST.R && !this.talk) {
          [0, 0.16, 0.32].forEach((t, i) => this._later(t, () => { s.f0R.set(i % 2 ? 0.55 : 0.95); s.f1R.set(i % 2 ? 0.95 : 0.6); }));
          this._later(0.5, () => { if (this.armPose.R === REST.R) { s.f0R.set(0.8); s.f1R.set(0.74); } });
          this.nextFidget = 7 + Math.random() * 6;
        }
      }
      // blink curve: lids fall fast, hold a moment, lift more slowly
      if (this.blinkT != null) {
        const b = (this.blinkT += dt);
        this.lid = b < 0.055 ? 1 - smooth(b / 0.055) : b < 0.095 ? 0 : b < 0.25 ? smooth((b - 0.095) / 0.155) : 1;
        if (b >= 0.25) this.blinkT = null;
      }

      // An idle mind. Left alone he is never still: every few seconds he does
      // one small thing a person would do, then settles.
      const quiet = !this.talk && this.gestureName === "none" && !(this._lastPointer && performance.now() - this._lastPointer < 2500) && this.laughT <= 0;
      if (this.opts.idle && !calm) {
        this.nextIdle -= dt;
        if (this.nextIdle <= 0) { this.nextIdle = 2.4 + Math.random() * 3.6; if (quiet || Math.random() < 0.35) this._idleAct(quiet); }
      }

      // breathing: quick inhale, slow exhale, rate drifting; an occasional sigh
      const nz = this.nz, T = this.t;
      if (!calm) {
        const rate = 0.25 + 0.05 * nz.breath(T * 0.05);
        this.breathPhase += dt * rate;
        if (this.breathPhase >= 1) {
          this.breathPhase -= 1;
          this.nextSigh -= 1 / rate;
          this.breathAmp = 1;
          if (this.nextSigh <= 0 && !this.talk) { this.breathAmp = 2.6; this.nextSigh = 18 + Math.random() * 16; this._later(2.2, () => { this.add.nod = 3; }); this._later(3.6, () => { this.add.nod = 0; }); }
        }
        const u = this.breathPhase;
        this.breath = (u < 0.38 ? smooth(u / 0.38) : 1 - smooth((u - 0.38) / 0.62)) * this.breathAmp;
      } else this.breath = 0;

      // posture drifts like a person standing, never like a metronome
      const talking = !!this.talk, energy = talking ? 1.8 : 1;
      want("sway", this.idleSway + (calm ? 0 : nz.sway(T * 0.11) * 11));
      want("lean", this.base.lean + (calm ? 0 : nz.lean(T * 0.09) * 1.3));
      want("shrug", this.base.shrug + this.add.shrug + this.breath * 4.5);
      // contrapposto: the hip over the standing leg rises, the shoulders answer
      want("hipTilt", clamp(-s.sway.value * 0.17, -5.5, 5.5));
      want("twist", this.base.twist + (calm ? 0 : nz.lean(T * 0.07 + 40) * 0.15) + this.attention * 0.14);
      // arms hang from the shoulders: when the body moves, they swing a little
      s.swingR.set(clamp(-s.sway.velocity * 0.11 - s.lean.velocity * 0.9 - s.bob.velocity * 0.01, -9, 9));
      s.swingL.set(clamp(-s.sway.velocity * 0.11 - s.lean.velocity * 0.9 + s.bob.velocity * 0.01, -9, 9));
      const post = this.posture || {};

      // gaze and attention
      let lx = this.saccade[0], ly = this.saccade[1], turn = 0;
      const p = this._pointerInSvg();
      this.attention = 0;
      if (p && this.opts.follow) {
        const dx = (p[0] - 600) / 480, dy = (p[1] - 640) / 480, k = 0.4 + 1.2 * this.opts.intensity;
        lx = clamp(dx, -1, 1) * 9 * Math.min(1.2, 0.6 + k * 0.4); ly = clamp(dy, -1, 1) * 7; turn = clamp(dx, -1, 1) * 10 * k;
        this.attention = clamp(dx, -1, 1);
      }
      if (this.exprLook && (this.exprLook[0] || this.exprLook[1]) && !p) { lx = this.exprLook[0]; ly = this.exprLook[1]; }
      if (this.idleLook && !p) { lx = this.idleLook[0]; ly = this.idleLook[1]; }
      // living eyes are never perfectly still: tiny jumps (microsaccades) a
      // few times a second while holding a gaze, on top of a slow drift
      this.nextMicro = (this.nextMicro ?? 0) - dt;
      if (this.nextMicro <= 0) { this.micro = [(Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.1]; this.nextMicro = 0.25 + Math.random() * 0.6; }
      if (!calm && this.micro) { lx += this.micro[0]; ly += this.micro[1]; }
      want("lookX", lx); want("lookY", ly);
      // the head follows the eyes a beat later, and only part of the way
      this.turnLag += (turn - this.turnLag) * (1 - Math.exp(-dt / 0.24));
      let headTurn = this.turnLag + this.idleTurn + (calm ? 0 : nz.turn(T * 0.13) * 3.2 * energy);
      if (this.shakeT > 0) { this.shakeT -= dt; headTurn += Math.sin(this.t * 19) * 12 * clamp(this.shakeT * 3, 0, 1); }
      want("turn", headTurn);
      want("tilt", this.base.tilt + this.add.tilt + this.idleTilt + this.attention * 1.5 + (calm ? 0 : nz.tilt(T * 0.12) * 2.6 * energy));

      // laughing comes in uneven "ha-ha" bursts that shake the shoulders and
      // bounce the body, with the head thrown back a little
      let nodExtra = 0;
      if (this.laughT > 0 && !calm) {
        this.laughT -= dt;
        const env = clamp(this.laughT / 0.7, 0, 1);
        this.laughPh = (this.laughPh || 0) + dt * (13 + 4 * nz.laugh(T * 0.7));
        const burst = 0.55 + 0.45 * smooth(0.5 + nz.laugh(T * 1.3 + 5));
        const ha = Math.abs(Math.sin(this.laughPh)) * burst;
        want("bob", 8 + ha * 14 * env);
        s.shrug.set(this.base.shrug + 5 + ha * 10 * env);
        nodExtra = -3 + ha * 4 * env;
        s.open.set(0.45 + 0.45 * ha);
      } else if (this._laughWas) {
        want("bob", 0);
        if (!this.talk) s.open.set(EXPRESSIONS[this.expression].open);
      }
      this._laughWas = this.laughT > 0;
      want("nod", this.base.nod + this.add.nod + nodExtra - this.breath * 1.4 + (calm ? 0 : nz.nod(T * 0.1) * 2 * energy));

      // talking director: visemes, head beats, hand beats, prosody
      const e = EXPRESSIONS[this.expression];
      if (this.talk) {
        const tk = this.talk;
        tk.t += dt;
        while (tk.i < tk.units.length - 1 && tk.units[tk.i + 1].t <= tk.t) {
          tk.i++;
          const u = tk.units[tk.i];
          if (u.wordStart && !calm) {
            // beats vary in size and direction, the way real emphasis does
            s.nod.kick(-(18 + Math.random() * 18) - u.stress * 40);
            if (Math.random() < 0.35) s.tilt.kick((Math.random() - 0.5) * 40);
            this.beat = (0.4 + Math.random() * 0.5 + u.stress) * (Math.random() < 0.8 ? 1 : -0.6);
            if (u.stress > 0.5) { s.browShow.set(Math.max(e.browShow, 0.7)); s.brow.set(e.brow - 6); this._later(0.25, () => { if (this.talk) { s.brow.set(e.brow); s.browShow.set(e.browShow); } }); }
          }
          if (u.ch === "?") { this.add.tilt = 5; s.browShow.set(1); s.brow.set(-9); this._later(0.9, () => { this.add.tilt = 0; }); }
          if (u.ch === "!") { s.brow.set(-9); s.browShow.set(1); this.beat = 1.4; }
        }
        const u = tk.units[tk.i], next = tk.units[tk.i + 1];
        const finished = tk.t >= tk.total && !(tk.waitForVoice && !tk.voiceDone && root.speechSynthesis?.speaking);
        if (finished) tk.done();
        else if (u) {
          // blend toward the next shape as the current one ends (coarticulation)
          const cur = u.shape || [0, e.width], nx = (next && next.shape) || cur;
          const k = smooth((tk.t - u.t) / Math.max(0.001, u.dur) - 0.4);
          s.open.set(Math.max(lerp(cur[0], nx[0], k * 0.6), e.open * 0.4));
          s.teeth.set(TEETH[u.ch] || 0);
          s.width.set(lerp(e.width, lerp(cur[1], nx[1], k * 0.6), 0.85));
        }
      } else if (this._analyser || this.mouthOverride != null) {
        const lvl = this._analyser ? this._analyser() : this.mouthOverride;
        s.open.set(lvl * 0.85); s.width.set(lerp(e.width, 0.9, lvl));
        if (lvl > 0.5 && Math.random() < 0.05) this.beat = 0.8;
      } else if (this.laughT <= 0) {
        want("width", e.width);
      }
      this.beat = this.beat > 0 ? Math.max(0, this.beat - dt * 3.2) : Math.min(0, this.beat + dt * 3.2);

      // follow-through: the wrist trails the forearm's real angular speed
      for (const side of ["R", "L"]) {
        s["lag" + side].set(clamp(-this.foreVel[side] * 0.075, -32, 32));
      }

      // Squash & stretch: crouching squashes, fast vertical motion stretches
      // along the direction of travel, actions add their own, and a landing
      // kicks the elastic so it jiggles. Volume is preserved when drawn.
      if (!("squash" in this.held)) {
        const crouch = Math.max(0, s.bob.value) / 1000;
        const speed = clamp(Math.abs(s.bob.velocity) / 5000, 0, 0.05) * (s.feetLift.value > 8 ? 1 : 0.4);
        let laughSq = 0;
        if (this.laughT > 0 && this.laughPh) laughSq = Math.abs(Math.sin(this.laughPh)) * 0.035;
        s.squash.set(calm ? 0 : clamp(this.addSq + crouch - speed + laughSq, -0.09, 0.12));
      }
      if (this.prevLift > 40 && s.feetLift.value < 12 && !calm) s.squash.kick(0.7);
      this.prevLift = s.feetLift.value;
      // Soft body: the upper body lags behind the hips and wobbles back, the
      // trunk compresses and rebounds, the head squashes on quick moves, and
      // fingers flop back when the hand moves fast.
      if (!calm) {
        s.softX.set(clamp(-s.sway.velocity * 0.07 - s.twist.velocity * 5, -10, 10));
        s.softY.set(clamp(s.bob.velocity * 0.009, -9, 10));
        s.headSq.set(clamp(-s.nod.velocity * 0.0006 + s.bob.velocity * 0.00025 + (this.laughT > 0 ? 0.015 : 0), -0.045, 0.05));
        for (const side of ["R", "L"]) s["flop" + side].set(clamp(-Math.abs(this.foreVel[side]) * 0.0016, -0.32, 0));
      }

      // secondary motion: hair, cap button lag behind the head
      const headVel = s.tilt.velocity + s.turn.velocity * 0.6 + s.nod.velocity * 0.3 + s.lean.velocity;
      s.fringe.set(-headVel * 0.12); s.lock.set(-headVel * 0.16);
      s.button.set(-headVel * 0.25 + s.bob.velocity * 0.012);

      // a real wave is about two swings a second, never perfectly regular
      this.wavePhase += dt * (calm ? 3 : 12.5 * (1 + 0.16 * nz.wave(T * 0.8)));
    }

    _render() {
      const s = this.s, parts = this.parts, t = this.t, calm = this.opts.reducedMotion;

      // camera: blend between full-body and bust framing
      const vt = smooth(s.view.value);
      this.viewBox = VIEWS.full.map((v, i) => lerp(v, VIEWS.bust[i], vt));
      this.svg.setAttribute("viewBox", this.viewBox.map(f).join(" "));

      // squash & stretch for the whole figure, volume preserved: it squashes
      // about the feet on the ground and about its middle in the air
      const q = s.squash.value, air = clamp(s.feetLift.value / 80, 0, 1);
      const sqY = 1 - q, sqX = 1 / Math.sqrt(Math.max(0.5, sqY)) * (1 + 0.12 * q);
      const pivY = lerp(P.ground, 1650 + s.bob.value, air), pivX = 615 + s.sway.value * 0.5;
      parts.squash.setAttribute("transform", `translate(${f(pivX)} ${f(pivY)}) scale(${sqX.toFixed(4)} ${sqY.toFixed(4)}) translate(${f(-pivX)} ${f(-pivY)})`);

      // body transform: breathing scales the torso from the hips, then lean, sway, bob
      const breath = this.breath;
      const sy = 1 + breath * 0.016;
      const hip = P.hip, lean = s.lean.value, sway = s.sway.value, bob = s.bob.value;
      const hipTilt = s.hipTilt.value, twist = s.twist.value;
      // The torso is not a board. The spine curves (the chest leans more than
      // the pelvis), the pelvis tilts over the standing leg while the
      // shoulders tilt the other way, the chest twists toward what he is
      // doing, the pelvis carries the weight shift more than the chest, and
      // breathing widens the ribcage.
      const bodyPt = ([x, y]) => {
        const h = clamp((hip[1] - y) / 850, 0, 1);
        const rib = smooth((h - 0.35) / 0.4);
        // soft body: the chest lags sideways and the trunk compresses and widens
        const soft = s.softY.value * h;
        const px = x + (x - hip[0]) * (breath * 0.012 * rib + soft * 0.0016) + twist * 36 * h + s.softX.value * h * h;
        const ang = lean * (0.35 + 0.65 * h) + hipTilt * (1 - smooth(h / 0.35)) - hipTilt * 0.55 * smooth(h);
        const qq = rotAround([px, hip[1] + (y - hip[1]) * sy + soft], hip, ang);
        return [qq[0] + sway * (1 - 0.45 * h), qq[1] + bob];
      };
      this.bodyPt = bodyPt;

      // shoulders: shrug lifts both, breathing nudges them
      const shrug = s.shrug.value, upR = shrug + s.liftR.value, upL = shrug * 0.8 + s.liftL.value;
      const shR = [866, 1008 - upR], shL = [446, 1058 - upL];
      parts.shoulderLine.setAttribute("d", mapPath(
        `M716,932 C766.4,944 ${f(821.8)},${f(969 - upR * 0.5)} ${pt(shR)} M548,1003 C512,1012 ${f(478)},${f(1030 - upL * 0.5)} ${pt(shL)}`, bodyPt));
      parts.torsoSides.setAttribute("d", mapPath(TORSO_SIDES, bodyPt));
      parts.hem.setAttribute("d", mapPath(TORSO_HEM, bodyPt));
      parts.collar.setAttribute("d", mapPath("M697,941 L541,983 L551,1030 L722,969", bodyPt));
      // fabric gathers at the waist on the side the hip pushes up
      const gather = clamp(hipTilt / 4.5, -1, 1);
      parts.folds.setAttribute("d", mapPath(gather < 0
        ? "M800,1712 C786,1716 774,1722 766,1730"
        : "M380,1712 C394,1716 406,1722 414,1730", bodyPt));
      parts.folds.setAttribute("opacity", "0");
      parts.shirt.setAttribute("d", mapPath(
        `M556,975 L716,932 C766.4,944 821.8,${f(969 - upR * 0.5)} ${pt(shR)} L800,1060 L778,1110 C806,1210 814,1330 806,1450 C800,1560 806,1690 816,1786 C700,1810 500,1810 368,1786 C382,1690 392,1560 392,1440 C390,1330 406,1220 440,1110 L${pt(shL)} C478,${f(1030 - upL * 0.5)} 512,1012 548,1003 Z`, bodyPt));

      // legs from planted feet
      this._renderLegs(bodyPt);

      // neck and head
      const hp = bodyPt(P.headPivot);
      const tilt = s.tilt.value + s.turn.value * 0.08 + lean * 0.45;
      const hx = hp[0] - P.headPivot[0] + s.turn.value * 0.6;
      const hy = hp[1] - P.headPivot[1] + s.nod.value * 0.9;
      // the head is soft too: it squashes about the neck and springs back
      const hq = s.headSq.value, hsy = 1 - hq, hsx = 1 / Math.sqrt(Math.max(0.6, hsy));
      const [hpx2, hpy2] = P.headPivot;
      parts.head.setAttribute("transform", `translate(${f(hx)} ${f(hy)}) rotate(${f(tilt)} ${hpx2} ${hpy2}) translate(${hpx2} ${hpy2}) scale(${hsx.toFixed(4)} ${hsy.toFixed(4)}) translate(${-hpx2} ${-hpy2})`);
      const headPt = (q) => add(rotAround([hpx2 + (q[0] - hpx2) * hsx, hpy2 + (q[1] - hpy2) * hsy], P.headPivot, tilt), [hx, hy]);
      this.headPt = headPt;
      parts.face.setAttribute("transform", `translate(${f(s.turn.value * 1.1)} ${f(s.nod.value * 0.8)})`);
      parts.cap.setAttribute("transform", `translate(${f(-s.turn.value * 0.25)} ${f(-s.nod.value * 0.2)})`);
      const nl = headPt(P.neckL), nr = headPt(P.neckR), bl = bodyPt(P.neckBaseL), br = bodyPt(P.neckBaseR);
      parts.neck.setAttribute("d", `M${pt(nl)} L${pt(bl)} M${pt(nr)} L${pt(br)}`);
      parts.neckFill.setAttribute("d", `M${pt(nl)} L${pt(bl)} L${pt(br)} L${pt(nr)} Z`);

      // jaw drops with the mouth
      const jaw = clamp(s.open.value, 0, 1.2) * 11;
      parts.faceL.setAttribute("d", `M381,560 L383,700 C392,${f(760 + jaw * 0.3)} 430,${f(808 + jaw * 0.8)} 490,${f(830 + jaw)} C515,${f(840 + jaw)} 532,${f(850 + jaw * 0.5)} 541,862`);
      parts.faceR.setAttribute("d", `M790,750 C760,${f(775 + jaw * 0.3)} 715,${f(805 + jaw * 0.6)} 698,840`);

      // secondary motion
      parts.fringe1.setAttribute("transform", `rotate(${f(s.fringe.value * 0.8)} 410 522)`);
      parts.fringe2.setAttribute("transform", `rotate(${f(s.fringe.value * 0.7)} 600 522)`);
      parts.lock.setAttribute("transform", `rotate(${f(s.lock.value)} ${P.lock[0]} ${P.lock[1]})`);
      parts.button.setAttribute("transform", `translate(0 ${f(s.button.value * 0.4)}) rotate(${f(s.button.value * 1.5)} 860 300)`);
      const perk = s.earPerk.value;
      parts.earL.setAttribute("transform", `rotate(${f(s.earL.value * 0.25 - perk * 6)} ${P.earL[0]} ${P.earL[1]}) translate(0 ${f(-perk * 6)})`);
      parts.earR.setAttribute("transform", `rotate(${f(s.earR.value * 0.25 + perk * 6)} ${P.earR[0]} ${P.earR[1]}) translate(0 ${f(-perk * 6)})`);

      this._renderFace();
      for (const side of ["R", "L"]) this._renderArm(side, bodyPt);
      if (this.rigOn) this._updateRig(bodyPt);
    }

    _renderFace() {
      const s = this.s, parts = this.parts;
      const drift = this.opts.reducedMotion ? 0 : 1;
      const lx = s.lookX.value + this.nz.talk(this.t * 0.6) * 0.6 * drift, ly = s.lookY.value + this.nz.hand(this.t * 0.5 + 7) * 0.45 * drift;
      const open = clamp(this.lid, 0, 1);
      const sq = clamp(s.squeeze.value, 0, 1);
      const eye = (cx, cy, wink) => {
        const k = clamp(s.happy.value, 0, 1);
        // a genuine smile pushes the cheeks up and narrows the eyes
        const squint = 1 - 0.16 * smooth((s.smile.value - 0.95) / 0.4) * (1 - k);
        const h = 21 * s.eyeH.value * squint * Math.max(0.04, open * wink);
        const x = cx + lx, y = cy + ly + sq * 3;
        const w = 17 + sq * 3;
        const ax = lerp(x, x - w, k), ay = lerp(y - h, y + 5, k);
        const bx = lerp(x, x + w, k), by = lerp(y + h, y + 5, k);
        const qy = lerp(y, y - (16 + sq * 6) * Math.max(0.15, open * wink) - 4, k);
        return `M${f(ax)},${f(ay)} Q${f(x)},${f(qy)} ${f(bx)},${f(by)}`;
      };
      parts.eyeL.setAttribute("d", eye(P.eyeL[0], P.eyeL[1], clamp(s.winkL.value, 0, 1)));
      parts.eyeR.setAttribute("d", eye(P.eyeR[0], P.eyeR[1], clamp(s.winkR.value, 0, 1)));

      // brows grow in from the middle rather than just fading
      const bshow = clamp(s.browShow.value, 0, 1);
      const brow = (cx, inner) => {
        const y = 582 + s.brow.value + ly * 0.4, x = cx + lx * 0.6;
        const tl = s.browTilt.value * 8, half = 16 * (0.4 + 0.6 * bshow);
        const yi = y - tl, yo = y + tl * 0.4, xi = x + inner * half, xo = x - inner * half;
        return `M${f(xo)},${f(yo)} Q${f(x)},${f(Math.min(yi, yo) - 5)} ${f(xi)},${f(yi)}`;
      };
      parts.browL.setAttribute("d", brow(P.eyeL[0], 1));
      parts.browR.setAttribute("d", brow(P.eyeR[0], -1));
      parts.browL.setAttribute("opacity", bshow.toFixed(2));
      parts.browR.setAttribute("opacity", bshow.toFixed(2));
      parts.blush.setAttribute("opacity", clamp(s.blush.value, 0, 1).toFixed(2));

      // mouth: one closed path, plus teeth and tongue clipped inside it
      const hw = 41 * s.width.value;
      const sm = s.smile.value, op = clamp(s.open.value, 0, 1.2);
      const round = clamp(1 - s.width.value, 0, 0.6);
      const upper = 34 * sm * (1 - op * 0.5) - op * (10 + 40 * round);
      const lower = 34 * sm + op * 64;
      const cL = s.cornerL.value, cR = s.cornerR.value;
      const corner = (cL + cR) / 2;
      const mx = P.mouth[0] + lx * 0.5, my = P.mouth[1] + ly * 0.3;
      const M = (x, y) => rotAround([mx + x, my + y], [mx, my], P.mouthTilt);
      const d = `M${pt(M(-hw, cL))} Q${pt(M(0, upper))} ${pt(M(hw, cR))} Q${pt(M(0, lower))} ${pt(M(-hw, cL))} Z`;
      parts.mouth.setAttribute("d", d);
      parts.mouthClip.setAttribute("d", d);
      const teethH = Math.max(12 * smooth((op - 0.22) / 0.3), 10 * s.teeth.value * smooth(op / 0.12)) * (1 - round * 1.2);
      const upperMid = (upper + corner) / 2;
      parts.teeth.setAttribute("d", teethH > 0.5
        ? `M${pt(M(-hw, cL - 6))} Q${pt(M(0, upper - 6))} ${pt(M(hw, cR - 6))} L${pt(M(hw, cR + teethH))} Q${pt(M(0, upperMid + teethH + 4))} ${pt(M(-hw, cL + teethH))} Z`
        : "M0,0");
      const tongueOn = smooth((op - 0.45) / 0.3);
      const tc = M(4, lower * 0.5 + 4);
      parts.tongue.setAttribute("cx", f(tc[0])); parts.tongue.setAttribute("cy", f(tc[1]));
      parts.tongue.setAttribute("rx", f(hw * 0.55 * tongueOn)); parts.tongue.setAttribute("ry", f(14 * tongueOn));
      const dimple = smooth((sm - 1.05) / 0.25);
      const c1 = M(-hw - 4, cL), c2 = M(hw + 4, cR);
      parts.dimples.setAttribute("d", `M${pt(add(c1, [-4, -9]))} Q${pt(add(c1, [-9, 0]))} ${pt(add(c1, [-3, 8]))} M${pt(add(c2, [4, -9]))} Q${pt(add(c2, [9, 0]))} ${pt(add(c2, [3, 8]))}`);
      parts.dimples.setAttribute("opacity", dimple.toFixed(2));
    }

    _renderLegs(bodyPt) {
      const s = this.s, parts = this.parts;
      parts.legs.setAttribute("data-lift", f(s.feetLift.value));
      parts.pelvis.setAttribute("d", mapPath("M410,1740 L812,1740 L822,1885 C760,1915 470,1915 404,1885 Z", bodyPt));
      const lift = s.feetLift.value;
      const legs = {};
      for (const side of ["L", "R"]) {
        const H = bodyPt(P["hip" + side]);
        const A = [P["ankle" + side][0] + (side === "L" ? 0 : 0), P["ankle" + side][1] - lift];
        // knees point forward, which is screen-left for this 3/4 view
        const ik = solveIK(H, A, LEG.Lt, LEG.Ls, (a, b) => a[0] < b[0]);
        const K = add(H, mul(dirOf(ik.shoulder), LEG.Lt));
        const A2 = add(K, mul(dirOf(ik.fore), LEG.Ls));
        // thigh swells at the front, calf at the back; the knee is a soft point
        const uT = unit(sub(K, H)), uS = unit(sub(A2, K));
        const fwdT = [uT[1], -uT[0]][0] < 0 ? [uT[1], -uT[0]] : [-uT[1], uT[0]];
        const fwdS = [uS[1], -uS[0]][0] < 0 ? [uS[1], -uS[0]] : [-uS[1], uS[0]];
        const top = add(H, mul(uT, -40));
        const Tm = add(add(H, mul(sub(K, H), 0.42)), mul(fwdT, 7));
        const Cm = add(add(K, mul(sub(A2, K), 0.3)), mul(fwdS, -9));
        const L = limb([top, Tm, K, Cm, A2], [LEG.r0, LEG.r0 * 0.97, LEG.rK, LEG.rK * 0.97, LEG.rA]);
        legs[side] = { H, K, A: A2, up: ik.shoulder, fore: ik.fore, outline: L, fwdS, fwdT };
        parts["leg" + side].setAttribute("d", L.d);
        // fabric folds behind the knee when it bends
        const bend = Math.abs(wrap(ik.fore - ik.shoulder));
        const back = mul(fwdT, -1), kb = add(K, mul(back, LEG.rK * 0.15));
        // one soft fold line tucked into the back of the knee
        const kf = add(K, mul(back, LEG.rK * 0.55));
        parts["knee" + side].setAttribute("d", `M${pt(add(kf, mul(uT, -30)))} Q${pt(add(kf, mul(back, -10)))} ${pt(add(kf, mul(uS, 26)))}`);
        parts["knee" + side].setAttribute("opacity", smooth((bend - 20) / 22).toFixed(2));
        parts["shoe" + side].setAttribute("transform", `translate(${pt(A2)}) rotate(${f(s.footTilt.value * (side === "L" ? 1.2 : 1))})`);
        // rolled hem just above the shoe
        const n = perpOf(ik.fore), hemC = add(A2, mul(dirOf(ik.fore), -30));
        parts["hem" + side].setAttribute("d", `M${pt(add(hemC, mul(n, -LEG.rA * 0.85)))} L${pt(add(hemC, mul(n, LEG.rA * 0.85)))}`);
      }
      // a paper line along the near leg's inner edge separates it from the far leg
      const R = legs.R;
      const inner = R.outline.plus[2][0] < R.outline.minus[2][0] ? R.outline.plus : R.outline.minus;
      const e3 = add(inner[4], mul(unit(sub(inner[4], inner[3])), -36));
      parts.legCut.setAttribute("d", spline([inner[1], inner[2], inner[3], e3], true));
      const pk = bodyPt([772, 1815]);
      parts.pocket.setAttribute("d", `M${pt(pk)} q-14,40 8,70`);
      // shadow shrinks while airborne
      const sc = 1 - clamp(lift / 260, 0, 0.45);
      parts.shadow.setAttribute("rx", f(300 * sc * (1 + Math.max(0, s.squash.value) * 0.9))); parts.shadow.setAttribute("cx", f(615 + s.sway.value * 0.4));
      this.legPts = legs;
    }

    _renderArm(side, bodyPt) {
      const s = this.s, A = ARMS[side], arm = this.arms[side], calm = this.opts.reducedMotion;
      const waveAmp = calm ? 0 : s["wave" + side].value;
      const ph = this.wavePhase + (side === "L" ? Math.PI : 0);
      const beat = side === "R" && this.talk ? this.beat : 0;
      const lean = s.lean.value;
      const shrug = s.shrug.value;

      const S = add(bodyPt(A.S), [0, -(shrug * (side === "R" ? 1 : 0.8) + s["lift" + side].value)]);
      // A wave is a chain: the forearm swings from the elbow, the wrist
      // follows a quarter-beat late and flicks further, the palm turns a
      // little on each pass, and the shoulder joins in slightly.
      const amp = waveAmp * (0.85 + 0.25 * this.nz.hand(this.t * 0.9 + (side === "L" ? 9 : 0)));
      const drag = clamp(s["sh" + side].velocity * 0.05, -12, 12);
      const hang = Math.max(0, 1 - Math.abs(wrap(s["sh" + side].value - REST[side].shoulder)) / 40); // pendulum only when hanging
      const sw = s["swing" + side].value * hang;
      const shAng = s["sh" + side].value + lean * 0.7 + sw + Math.sin(ph + 0.7) * 3 * amp + (calm ? 0 : this.breath * 1.6);
      const elAng = s["el" + side].value + Math.sin(ph) * 13 * amp - drag * 0.6 - beat * 8 + sw * 0.7;
      const wrAng = s["wr" + side].value + Math.sin(ph - 1.25) * 24 * amp + s["lag" + side].value + beat * 7;
      const foreAng = shAng + elAng, handAng = foreAng + wrAng;
      const fsU = s["fsU" + side].value, fsF = s["fsF" + side].value;
      const Er = add(S, mul(dirOf(shAng), A.Lu * fsU)), Wr = add(Er, mul(dirOf(foreAng), A.Lf * fsF));

      // ---- jelly limb. The pose above is only where the arm wants to be.
      // What is drawn is a soft chain (elbow, mid-forearm, wrist) on springs
      // that chases it: each point springs to its place and to its offset
      // from the point before it, so motion flows from the shoulder out to
      // the hand like a whip, lags, overshoots and wobbles back. The arm
      // bends as one smooth curve instead of two sticks on a hinge.
      const tgt = [Er, lerp2(Er, Wr, 0.5), Wr];
      const dt = this._dt || 0;
      let sim = this.soft?.[side];
      this.soft = this.soft || {};
      if (!sim || calm || !dt || len(sub(sim.p[2], Wr)) > 900) {
        sim = this.soft[side] = { p: tgt.map((q) => q.slice()), v: tgt.map(() => [0, 0]) };
      } else {
        const K = [150, 115, 95], C = [11, 8.6, 7.6], KC = 70;
        const steps = Math.max(1, Math.ceil(dt * 240)), h = dt / steps;
        for (let it = 0; it < steps; it++) {
          for (let i = 0; i < 3; i++) {
            const p = sim.p[i], v = sim.v[i];
            const prev = i === 0 ? S : sim.p[i - 1], prevT = i === 0 ? S : tgt[i - 1];
            const want = add(prev, sub(tgt[i], prevT));
            const ax = (tgt[i][0] - p[0]) * K[i] + (want[0] - p[0]) * KC - v[0] * C[i];
            const ay = (tgt[i][1] - p[1]) * K[i] + (want[1] - p[1]) * KC - v[1] * C[i];
            v[0] += ax * h; v[1] += ay * h; p[0] += v[0] * h; p[1] += v[1] * h;
          }
        }
      }
      const E = sim.p[0], Fs = sim.p[1], W = sim.p[2];
      const foreJ = angleOf(W[0] - Fs[0], W[1] - Fs[1]), handJ = foreJ + wrAng;
      if (this.prevFore[side] != null && this._dt) this.foreVel[side] = wrap(foreJ - this.prevFore[side]) / this._dt;
      this.prevFore[side] = foreJ;
      const U = frame(S, shAng);
      // perspective: the near arm is foreshortened toward the viewer at rest,
      // so it slims down as it swings away from the body
      const lift = Math.abs(wrap(shAng - REST[side].shoulder));
      const slim = side === "R" ? lerp(1, 0.74, smooth(lift / 80)) : 1;

      // skin: one organic outline from under the sleeve through elbow to wrist
      const morph = A.sleeveTube ? smooth(lift / 70) : 0;
      const ua = U(A.ox * slim, A.start * lerp(1, 0.78, morph) * fsU);
      const turn01 = Math.abs(clamp(s["side" + side].value + Math.sin(ph - 0.5) * 0.24 * amp, -1, 1));
      const rE = A.rE * lerp(1, 0.92, 1 - slim) * slim, rW = A.rW * lerp(0.6, 1, Math.max(turn01, 0.3 + 0.14 * Math.sqrt(1 - turn01 * turn01)));
      const Um = add(lerp2(ua, E, 0.55), mul(perpOf(shAng), A.ox * 0.2 * slim));
      const Fm = lerp2(lerp2(E, W, 0.3), Fs, 0.6);
      const rU = A.r0 * slim, rF = lerp(rE, rW, 0.3) * 1.07;
      const isFolded = Math.abs(wrap(elAng)) > 62 || fsU < 0.85;
      // the forearm flows into the heel of the hand instead of meeting it at a step
      const palmHalf = 60 * A.hs * Math.max(Math.abs(turn01 + 0.14 * Math.sqrt(1 - turn01 * turn01)), 0.3);
      const W2 = add(W, mul(dirOf(foreJ + wrAng * 0.5), 26 * A.hs));
      const rW2 = Math.max(rW * 0.96, palmHalf * 0.94);
      if (!isFolded) {
        arm.upper.setAttribute("d", limb([ua, Um, E, Fm, W, W2], [rU, rU * 1.03, rE, rF, rW, rW2], true).d);
        arm.elbow.setAttribute("r", 0); arm.elbow2.setAttribute("r", 0); arm.fore.setAttribute("d", "M0,0");
      } else {
        arm.upper.setAttribute("d", limb([ua, Um, E], [rU, rU * 1.03, rE], true).d);
        arm.fore.setAttribute("d", limb([E, Fm, W, W2], [rE, rF, rW, rW2], true).d);
        for (const c of [arm.elbow, arm.elbow2]) { c.setAttribute("cx", f(E[0])); c.setAttribute("cy", f(E[1])); }
        arm.elbow.setAttribute("r", f(rE)); arm.elbow2.setAttribute("r", f(rE * 0.97));
      }
      // a crease on the inside of a bent elbow
      const bendEl = Math.abs(wrap(elAng));
      const inSide = wrap(elAng) > 0 ? -1 : 1, nE = perpOf((shAng + foreAng) / 2);
      const ci = add(E, mul(nE, inSide * rE * 0.45));
      arm.crease.setAttribute("d", `M${pt(add(ci, mul(dirOf(shAng), -18)))} Q${pt(add(ci, mul(nE, -inSide * 6)))} ${pt(add(ci, mul(dirOf(foreAng), 16)))}`);
      arm.crease.setAttribute("opacity", "0");

      // ---- the hand, built in 3D and projected. x runs across the palm, y
      // along the fingers, z out of the back of the hand. "side" is how far
      // the forearm has turned: 1 shows the back of the hand, -1 the palm,
      // 0 the edge, where curled fingers show as real curves.
      const sd = clamp(s["side" + side].value + Math.sin(ph - 0.5) * 0.24 * amp, -1, 1);
      const sn = Math.sqrt(Math.max(0, 1 - sd * sd));
      let fx = sd + 0.14 * sn;                       // a little perspective keeps edge-on fingers apart
      if (Math.abs(fx) < 0.3) fx = 0.3 * (fx < 0 ? -1 : 1);
      const H0 = frame(W, handJ);
      // squash & stretch for the hand: it elongates along a fast motion
      const vw = sim.v[2], vm = len(vw), vh = vm > 1 ? mul(vw, 1 / vm) : [1, 0];
      const st = 1 + Math.min(0.16, vm / 6000);
      const H = (x, y) => {
        const q = H0(x, y), r = sub(q, W);
        const a = r[0] * vh[0] + r[1] * vh[1], b = -r[0] * vh[1] + r[1] * vh[0];
        return [W[0] + vh[0] * a * st - vh[1] * b / st, W[1] + vh[1] * a * st + vh[0] * b / st];
      };
      // handedness: the near arm carries his left hand, the far arm his right,
      // its mirror image; "side" then means the same for both (1 back, -1 palm)
      const hand = side === "R" ? 1 : -1;
      const hmap = (x, y) => H(x * fx * hand * A.hs, y * A.hs);
      const h3 = (q) => H((q[0] * fx * hand + q[2] * sn) * A.hs, q[1] * A.hs);
      arm.palm.setAttribute("d", HAND.palm.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => pt(hmap(+x, +y))));
      const v3 = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
      const n3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
      // A jointed digit: a chain of 3-D points drawn as one organic outline
      // that tapers to a round pad at the tip. Its base sits inside the palm,
      // and the skin union merges it into the hand's single silhouette.
      const digit = (chain, radii) => {
        const P2 = chain.map(h3), R2 = radii.map((r) => r * A.hs);
        const L = limb(P2, R2), n = P2.length - 1;
        const C = P2[n], r = R2[n], u = unit(sub(P2[n], P2[n - 1]));
        const a = L.plus[n], b = L.minus[n], na = unit(sub(a, C)), k = 0.552 * r, tip = add(C, mul(u, r));
        const cap = ` C${pt(add(a, mul(u, k)))} ${pt(add(tip, mul(na, k)))} ${pt(tip)}` +
          ` C${pt(add(tip, mul(na, -k)))} ${pt(add(b, mul(u, k)))} ${pt(b)}`;
        return { P2, R2, d: `${spline(L.plus, true)}${cap}${spline(L.minus.slice().reverse(), false)} Z` };
      };

      // thumb: abducts in the palm plane, and swings across toward the palm
      // as the hand closes (opposition)
      const ta = s["thumbAng" + side].value * DEG, te = clamp(s["thumb" + side].value, 0, 1), tc = 1 - te;
      const tLen = HAND.thumbLen * (0.62 + 0.38 * te) * (1 + 0.3 * smooth((-ta / DEG - 70) / 20));
      const tb = [HAND.thumbBase[0], HAND.thumbBase[1], 0];
      const t0d = n3([Math.sin(ta), Math.cos(ta), -(0.2 + 0.45 * tc)]);
      const t1 = v3(tb, t0d, tLen * 0.5);
      const t1d = n3([t0d[0] + tc * 0.75, t0d[1], t0d[2] - tc * 0.6]);
      const t2 = v3(t1, t1d, tLen * 0.42);
      arm.thumb.setAttribute("d", digit([v3(tb, t0d, -16), tb, t1, t2], [24, 21, 18, 15.5]).d);
      // when the palm faces us, the crease at the base of the thumb shows
      arm.palmLine.setAttribute("d", `M${pt(hmap(-30, 30))} Q${pt(hmap(-10, 62))} ${pt(hmap(-14, 104))}`);
      arm.palmLine.setAttribute("opacity", smooth((-sd - 0.35) / 0.4).toFixed(2));

      // fingers: three joints each, curling progressively from the knuckle,
      // tips drawing together as they close. Seen face-on, the part that
      // folds behind the hand is left out; seen edge-on, the whole curl shows.
      const spread = s["spread" + side].value, frontal = Math.abs(sd) > 0.55;
      const drawn = [];
      for (let i = 0; i < 4; i++) {
        // in a wave the fingers ripple one after another behind the wrist
        const ext = clamp(s[`f${i}${side}`].value + s["flop" + side].value * (0.6 + i * 0.15) + (amp ? Math.sin(ph - 1.6 - i * 0.45) * 0.13 * amp : 0), 0, 1);
        const curl = 1 - ext;
        const beta = (HAND.fan[i] + spread * HAND.spreadFan[i]) * (1 - 0.5 * curl) * DEG;
        const sb = Math.sin(beta), cb = Math.cos(beta);
        const flex = [3 + curl * 82, 6 + curl * 96, 4 + curl * 62];
        const segs = [0.47, 0.31, 0.22].map((q) => q * HAND.lengths[i]);
        const k = [HAND.knuckles[i][0], HAND.knuckles[i][1], 0];
        // fingers taper a little toward the pad; the little finger is slimmer
        const r0 = i === 3 ? 14.5 : 16.2;
        const chain = [v3(k, [sb, cb, 0], -22), k], radii = [r0 + 1, r0];
        let p = k, cum = 0;
        for (let j = 0; j < 3; j++) {
          cum += flex[j];
          const c = Math.cos(cum * DEG);
          if (frontal && c < 0.06) break;           // folded out of sight behind the hand
          p = v3(p, [sb * c, cb * c, -Math.sin(cum * DEG)], segs[j]);
          chain.push(p); radii.push(r0 * (0.95 - j * 0.06));
        }
        if (chain.length < 3) { chain.push(v3(k, [sb, cb, 0], 9)); radii.push(r0); }
        const D = digit(chain, radii);
        arm.digits[i].setAttribute("d", D.d);
        drawn.push(D);
      }
      // where two neighbouring fingers touch, one short line between them,
      // from just above the knuckles to before the shorter fingertip
      let sepD = "";
      for (let i = 0; i < 3; i++) {
        const A1 = drawn[i], B1 = drawn[i + 1], n = Math.min(A1.P2.length, B1.P2.length) - 1;
        if (n < 2) continue;
        const gap = len(sub(A1.P2[2], B1.P2[2])), touch = (A1.R2[2] + B1.R2[2]) * 1.3;
        if (gap > touch) continue;
        const mid = [];
        for (let j = 1; j <= n; j++) mid.push(lerp2(A1.P2[j], B1.P2[j], 0.5));
        const endR = Math.min(A1.R2[n], B1.R2[n]);
        const last = mid[mid.length - 1], dir = unit(sub(last, mid[mid.length - 2]));
        mid[mid.length - 1] = add(last, mul(dir, -endR * 0.9));
        mid[0] = add(mid[0], mul(unit(sub(mid[1], mid[0])), 10 * A.hs));
        // too short to read as a line (a folded finger): leave it out rather than draw a dot
        let run = 0; for (let j = 1; j < mid.length; j++) run += len(sub(mid[j], mid[j - 1]));
        if (run < 24 * A.hs) continue;
        sepD += spline(mid, true);
      }
      arm.seps.setAttribute("d", sepD || "M0,0");

      // sleeve rides the upper arm; its inner seam only shows once the arm lifts
      if (A.sleeveTube) {
        arm.sleeve.setAttribute("transform", `${matrixOf(S, shAng)} scale(1 ${fsU.toFixed(3)})`);
        const q = A.sleeveRest.map((p, i) => lerp2(p, A.sleeveTube[i], morph)), Q = (i) => pt(q[i]);
        arm.sleeveFill.setAttribute("d", `M${Q(0)} C${Q(1)} ${Q(2)} ${Q(3)} C${Q(4)} ${Q(5)} ${Q(6)} L${Q(7)} L${Q(8)} L${Q(9)} C${Q(10)} ${Q(11)} ${Q(12)} C${Q(13)} ${Q(14)} ${Q(0)} Z`);
        arm.sleeveOuter.setAttribute("d", `M${Q(0)} C${Q(1)} ${Q(2)} ${Q(3)} C${Q(4)} ${Q(5)} ${Q(6)} L${Q(7)} L${Q(8)} L${Q(9)} L${Q(6)}`);
        arm.sleeveInner.setAttribute("d", `M${Q(9)} C${Q(10)} ${Q(11)} ${Q(12)} C${Q(13)} ${Q(14)} ${Q(0)}`);
      } else arm.sleeve.setAttribute("transform", `${matrixOf(S, shAng)} scale(1 ${fsU.toFixed(3)})`);
      arm.folded.style.display = isFolded ? "" : "none";
      arm.lowerBack.style.display = arm.lowerFront.style.display = isFolded ? "none" : "";
      arm.sleeveInner.setAttribute("opacity", smooth((lift - 8) / 22).toFixed(2));
      this["joints" + side] = { S, E, W, handAng: handJ };
    }

    _buildRig() {
      const g = this.parts.rig;
      this.rigNodes = {};
      const names = ["head", "eyes", "mouth", "earL", "earR", "capButton", "shoulderR", "elbowR", "wristR", "shoulderL", "elbowL", "wristL", "hipR", "kneeR", "ankleR", "hipL", "kneeL", "ankleL"];
      for (const n of names) {
        const dot = el("circle", { class: "rig-dot", r: 9 }, g);
        const label = el("text", { class: "rig" }, g);
        label.textContent = n;
        this.rigNodes[n] = { dot, label };
      }
    }
    _updateRig(bodyPt) {
      const hp = this.headPt, J = { R: this.jointsR, L: this.jointsL }, Lg = this.legPts || {};
      const pos = {
        head: hp(P.headPivot), eyes: hp([534, 630]), mouth: hp(P.mouth), earL: hp(P.earL), earR: hp(P.earR), capButton: hp(P.button),
        shoulderR: J.R.S, elbowR: J.R.E, wristR: J.R.W, shoulderL: J.L.S, elbowL: J.L.E, wristL: J.L.W,
        hipR: Lg.R?.H, kneeR: Lg.R?.K, ankleR: Lg.R?.A, hipL: Lg.L?.H, kneeL: Lg.L?.K, ankleL: Lg.L?.A
      };
      for (const [n, node] of Object.entries(this.rigNodes)) {
        const p = pos[n]; if (!p) continue;
        const leftSide = n.endsWith("L") || n === "eyes" || n === "mouth";
        node.dot.setAttribute("cx", f(p[0])); node.dot.setAttribute("cy", f(p[1]));
        node.label.setAttribute("x", f(p[0] + (leftSide ? -16 : 16))); node.label.setAttribute("y", f(p[1] - 12));
        node.label.setAttribute("text-anchor", leftSide ? "end" : "start");
      }
    }
  }

  // ------------------------------------------------------------ ASCII
  // The same rig, drawn in text. Each frame is rasterised, then every
  // character cell is chosen from what the ink does inside it, the way edge-
  // aware ASCII shaders work: solid ink becomes a dense glyph, a stroke
  // becomes / \ | - _ along its direction (the cell's ink moments give the
  // stroke's angle), and a speck becomes a dot. Every rig point (brows,
  // lids, mouth, fingers, jelly arms, squash) shows up in the text.
  const RAMP = " .:-=+*#%@";
  // How each class paints, on a black-on-white raster: [fill, stroke, width]
  const PAINT = {
    ink: [null, "#000", 9], solid: ["#000", null, 0], paper: ["#fff", null, 0], cut: [null, "#fff", 9],
    skin: ["#fff", "#000", 9], mouth: ["#000", "#000", 9], "u-back": ["#000", "#000", 18], "u-front": ["#fff", null, 0]
  };
  // Draw the live svg onto a canvas, synchronously: each shape is drawn
  // with its own transform (getCTM), in paint order, honouring display,
  // opacity, <use> and the mouth's clip path.
  function rasterRig(rig, W, H) {
    const cv = rig._asciiCanvas || (rig._asciiCanvas = root.document.createElement("canvas"));
    if (cv.width !== W) cv.width = W; if (cv.height !== H) cv.height = H;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
    const svg = rig.svg, sw = svg.clientWidth || svg.getBoundingClientRect().width, k = W / (sw || W);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const shape = (el) => {
      const t = el.tagName;
      if (t === "path") { const d = el.getAttribute("d"); return d && d.length > 3 ? new Path2D(d) : null; }
      const p = new Path2D(), g = (a) => +el.getAttribute(a) || 0;
      if (t === "circle") { if (g("r") <= 0) return null; p.arc(g("cx"), g("cy"), g("r"), 0, Math.PI * 2); return p; }
      if (t === "ellipse") { if (g("rx") <= 0 || g("ry") <= 0) return null; p.ellipse(g("cx"), g("cy"), g("rx"), g("ry"), 0, 0, Math.PI * 2); return p; }
      if (t === "rect") { p.roundRect ? p.roundRect(g("x"), g("y"), g("width"), g("height"), g("rx")) : p.rect(g("x"), g("y"), g("width"), g("height")); return p; }
      return null;
    };
    const paintOf = (el, inherit) => {
      const cl = el.classList; let pick = inherit;
      for (const c in PAINT) if (cl.contains(c)) pick = PAINT[c];
      if (cl.contains("lo")) pick = [null, "#000", 6]; if (cl.contains("sep")) pick = [null, "#000", 7];
      return pick;
    };
    const draw = (el, m, op, inherit, ctm) => {
      const p = shape(el); if (!p || !inherit) return;
      const [fill, stroke, w] = inherit;
      ctx.setTransform(ctm.a * k, ctm.b * k, ctm.c * k, ctm.d * k, ctm.e * k, ctm.f * k);
      ctx.globalAlpha = op;
      if (fill) { ctx.fillStyle = fill; ctx.fill(p); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.stroke(p); }
    };
    const walk = (el, op, inherit, useCtm) => {
      if (el.nodeType !== 1) return;
      const t = el.tagName;
      if (t === "defs" || t === "style" || t === "clipPath" || t === "text" || el.id === "rigOverlay") return;
      if (el.style && el.style.display === "none") return;
      const o = el.getAttribute("opacity"); if (o != null) op *= +o; if (op < 0.03) return;
      if (el.classList.contains("shadow")) return;
      const paint = paintOf(el, inherit);
      if (t === "use") {
        const ref = svg.querySelector(el.getAttribute("href"));
        if (ref) { const base = el.getCTM(); for (const ch of ref.querySelectorAll("path,circle")) draw(ch, null, op, paint, base); }
        return;
      }
      const clip = el.getAttribute("clip-path");
      if (clip) {
        const cp = svg.querySelector(clip.slice(4, -1).replace(/"/g, ""))?.firstElementChild, cm = cp && cp.getCTM ? el.getCTM() : null;
        ctx.save();
        if (cp && cm) { ctx.setTransform(cm.a * k, cm.b * k, cm.c * k, cm.d * k, cm.e * k, cm.f * k); ctx.clip(new Path2D(cp.getAttribute("d") || "M0,0")); }
        for (const ch of el.children) walk(ch, op, paint);
        ctx.restore(); return;
      }
      if (t === "g" || t === "svg") { for (const ch of el.children) walk(ch, op, paint); return; }
      const ctm = el.getCTM(); if (ctm) draw(el, null, op, paint, ctm);
    };
    walk(svg, 1, null);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    return ctx.getImageData(0, 0, W, H).data;
  }

  async function asciiFrame(rig, cols = 96, aspect = 0.55) {
    if (!root.document) return "";
    const vb = rig.viewBox, W = cols * 4, H = Math.round((W * vb[3]) / vb[2]);
    const px = rasterRig(rig, W, H);
    const cw = W / cols, ch = cw / aspect, rows = Math.floor(H / ch);
    // pass 1: what the ink does in each cell
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x0 = Math.floor(c * cw), x1 = Math.floor((c + 1) * cw), y0 = Math.floor(r * ch), y1 = Math.floor((r + 1) * ch);
      let sum = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, n = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * W + x) * 4, ink = 1 - (px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11) / 255;
        n++; if (ink < 0.08) continue;
        const lx = x - x0, ly = y - y0;
        sum += ink; sx += ink * lx; sy += ink * ly; sxx += ink * lx * lx; syy += ink * ly * ly; sxy += ink * lx * ly;
      }
      const cover = sum / (n || 1);
      let kind = "empty", deg = 0, my = 0, aniso = 0;
      if (cover >= 0.07) {
        if (cover > 0.6) kind = "fill";
        else {
          const mx = sx / sum; my = sy / sum;
          const cxx = sxx / sum - mx * mx, cyy = syy / sum - my * my, cxy = sxy / sum - mx * my;
          aniso = Math.sqrt((cxx - cyy) ** 2 + 4 * cxy * cxy) / (cxx + cyy + 1e-6);
          deg = (0.5 * Math.atan2(2 * cxy, cxx - cyy) * 180) / Math.PI;
          kind = aniso < 0.35 ? "dot" : "line";
        }
      }
      cells.push({ cover, kind, deg, my });
    }
    const at = (r, c) => (r < 0 || c < 0 || r >= rows || c >= cols ? null : cells[r * cols + c]);
    // pass 2: one character per cell; a stroke keeps only its strongest cell
    // across its width (non-maximum suppression), so lines stay one glyph thick
    const grid = [];
    for (let r = 0; r < rows; r++) {
      const line = [];
      grid.push(line);
      for (let c = 0; c < cols; c++) {
        const e = at(r, c);
        if (e.kind === "empty") { line.push(" "); continue; }
        if (e.kind === "fill") { line.push(RAMP[Math.min(9, 6 + Math.floor((e.cover - 0.6) * 10))]); continue; }
        if (e.kind === "dot") { line.push(e.cover < 0.2 ? "." : e.cover < 0.35 ? "o" : "O"); continue; }
        const a = Math.abs(e.deg);
        const across = a < 22 ? [[-1, 0], [1, 0]] : [[0, -1], [0, 1]];
        let weaker = false;
        for (const [dr, dc] of across) {
          const nb = at(r + dr, c + dc);
          if (nb && nb.kind === "line" && Math.abs(nb.deg - e.deg) < 35 && (nb.cover > e.cover + 0.02 || (Math.abs(nb.cover - e.cover) <= 0.02 && (dr < 0 || dc < 0)))) weaker = true;
        }
        if (weaker) { line.push(" "); continue; }
        if (a < 22) line.push(e.my > ch * 0.62 ? "_" : e.my < ch * 0.3 ? "\u203e" : "-");
        else if (a > 68) line.push("|");
        else line.push(e.deg > 0 ? "\\" : "/");
      }
    }
    asciiFace(rig, grid, (x, y) => [Math.floor(((x - vb[0]) * W) / vb[2] / cw), Math.floor(((y - vb[1]) * H) / vb[3] / ch)]);
    return grid.map((l) => l.join("").replace(/\s+$/, "")).join("\n").replace(/^\n+|\n+$/g, "");
  }

  // The face is too small for the raster to carry, so it is drawn from a
  // glyph vocabulary (the way kaomoji are), chosen by the rig's live values
  // and stamped where each feature really is.
  function asciiFace(rig, grid, cell) {
    const s = rig.s, hp = rig.headPt;
    if (!hp) return;
    const off = [s.turn.value * 1.1 + s.lookX.value * 0.6, s.nod.value * 0.8 + s.lookY.value * 0.4];
    const at = (q) => cell(...hp([q[0] + off[0], q[1] + off[1]]));
    // write a glyph string centred on a cell, wiping the raster's guesses around it
    const put = ([c, r], str, wipe) => {
      if (!grid[r]) return;
      const x0 = c - Math.floor(str.length / 2);
      if (wipe) for (let dr = -1; dr <= 1; dr++) for (let x = x0 - 1; x <= x0 + str.length; x++) {
        const row = grid[r + dr];
        if (row && row[x] != null && "@%#".indexOf(row[x]) < 0) row[x] = " ";
      }
      for (let i = 0; i < str.length; i++) if (grid[r][x0 + i] != null) grid[r][x0 + i] = str[i];
    };
    const lid = clamp(rig.lid, 0, 1), happy = s.happy.value, eyeH = s.eyeH.value;
    const angry = s.browTilt.value < -0.5 && s.brow.value > 1;
    const eye = (wink, left) => {
      if (Math.min(lid, wink) < 0.35) return "-";
      if (happy > 0.5) return "^";
      if (eyeH > 1.15) return "O";
      if (eyeH < 0.4) return "_";
      if (angry) return left ? "\\" : "/";
      return "|";
    };
    const eL = at(P.eyeL), eR = at(P.eyeR), mo = at([P.mouth[0], P.mouth[1] + 6]);
    // clear the face between the cheek lines, from brow height to below the mouth
    for (let y = 572; y <= 760; y += 8) {
      const [c0, r] = cell(...hp([400, y])), [c1] = cell(...hp([770, y]));
      const row = grid[r]; if (!row) continue;
      for (let c = c0 + 1; c < c1; c++) if (row[c] != null && "@%#".indexOf(row[c]) < 0) row[c] = " ";
    }
    put(eL, eye(s.winkL.value, true)); put(eR, eye(s.winkR.value, false));
    if (s.browShow.value > 0.4) {
      const t = s.browTilt.value, up = s.brow.value < -7;
      const bL = t > 0.4 ? "/" : t < -0.4 ? "\\" : "\u203e", bR = t > 0.4 ? "\\" : t < -0.4 ? "/" : "\u203e";
      put([eL[0], eL[1] - (up ? 2 : 1)], bL); put([eR[0], eR[1] - (up ? 2 : 1)], bR);
    }
    const op = s.open.value, sm = s.smile.value, round = s.width.value < 0.72;
    let mouth;
    if (op > 0.62) mouth = sm > 0.9 ? "\\O/" : "(O)";
    else if (op > 0.32) mouth = round ? "O" : sm > 0.9 ? "\\o/" : "o";
    else if (op > 0.14) mouth = round ? "o" : "-o-";
    else if (sm > 1.12) mouth = "\\__/";
    else if (sm > 0.6) mouth = "\\_/";
    else if (sm < -0.3) mouth = "/\u203e\\";
    else mouth = "--";
    put(mo, mouth);
    if (s.blush.value > 0.5) { put([eL[0] - 1, eL[1] + 1], "//"); put([eR[0] + 1, eR[1] + 1], "//"); }
  }

  // Draw a mounted rig as live ASCII into a <pre>. The svg stays where it
  // is (it can be hidden); the text is what people see. Returns a stop function.
  function attachAscii(rig, pre, { cols = 96, fps = 30 } = {}) {
    let busy = false, last = 0, raf = 0, stopped = false;
    pre.classList.add("mascot-ascii");
    pre.setAttribute("aria-label", rig.svg.getAttribute("aria-label") || "Blue cap mascot");
    pre.setAttribute("role", "img");
    rig.hitEl = pre;
    const onClick = () => rig.poke();
    pre.addEventListener("click", onClick);
    const fit = () => {
      const w = pre.clientWidth || pre.parentElement?.clientWidth || 400;
      pre.style.fontSize = `${w / (cols * 0.6)}px`;
      pre.style.lineHeight = `${0.6 / 0.55}`;
    };
    fit(); root.addEventListener("resize", fit);
    const loop = (t) => {
      if (stopped) return;
      raf = requestAnimationFrame(loop);
      if (busy || t - last < 1000 / fps) return;
      busy = true; last = t;
      asciiFrame(rig, cols).then((text) => { rig.asciiText = text; pre.textContent = text; busy = false; });
    };
    raf = requestAnimationFrame(loop);
    return () => { stopped = true; cancelAnimationFrame(raf); root.removeEventListener("resize", fit); pre.removeEventListener("click", onClick); rig.hitEl = null; };
  }

  function connect(rig, url = "http://localhost:4545") {
    if (!root.EventSource) return () => {};
    const base = url.replace(/\/$/, "");
    const es = new EventSource(base + "/events");
    es.onmessage = async (ev) => {
      let cmd;
      try { cmd = JSON.parse(ev.data); } catch (_) { return; }
      const result = await rig.call(cmd.name, cmd.arguments || {});
      fetch(base + "/result", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: cmd.id, result }) }).catch(() => {});
    };
    return () => es.close();
  }

  const api = {
    mount: (container, options) => new MascotRig(container, options),
    connect,
    attachAscii,
    asciiFrame,
    expressions: Object.keys(EXPRESSIONS),
    gestures: PUBLIC_GESTURES,
    actions: ACTIONS,
    views: Object.keys(VIEWS),
    params: PARAMS,
    tools: TOOLS,
    pivots: P
  };
  root.Mascot = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
