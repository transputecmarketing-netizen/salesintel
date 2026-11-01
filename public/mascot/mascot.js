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
    full: [40, 110, 1220, 2470],
    bust: [100, 160, 1100, 1270]
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

  class Spring {
    constructor(value, k = 120, d = 18) { this.value = value; this.target = value; this.velocity = 0; this.k = k; this.d = d; }
    set(t) { this.target = t; return this; }
    snap(v) { this.value = this.target = v; this.velocity = 0; return this; }
    kick(v) { this.velocity += v; return this; }
    step(dt) {
      // two half steps keep stiff springs stable at low frame rates
      for (let i = 0; i < 2; i++) {
        const h = dt / 2, a = (this.target - this.value) * this.k - this.velocity * this.d;
        this.velocity += a * h; this.value += this.velocity * h;
      }
      return this.value;
    }
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
    relaxed: { fingers: [0.8, 0.74, 0.7, 0.64], thumb: 0.8, thumbAngle: -26, spread: 0.12 },
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
    R: { shoulder: 0, elbow: -8, wrist: -4, hand: "relaxed", side: 1, z: "mid" },
    L: { shoulder: -26, elbow: 22, wrist: 8, hand: "relaxed", side: 1, z: "mid" }
  };
  const GESTURES = {
    none: {},
    wave:     { R: { target: [1085, 1075], handAngle: 182, hand: "open", side: -1, wave: 1 }, face: "happy" },
    hello:    { R: { target: [1050, 660], handAngle: 188, hand: "open", side: -1, wave: 1 }, face: "happy", body: { lean: -1.5 } },
    hi5:      { R: { target: [1060, 1010], handAngle: 180, hand: "flat", side: -1 }, face: "happy" },
    idea:     { R: { target: [975, 1000], handAngle: 174, hand: "point", side: -1, fsU: 0.6 }, face: "surprised", faceAfter: "happy" },
    count2:   { R: { target: [980, 1000], handAngle: 176, hand: "two", side: -1, fsU: 0.6 } },
    thumbsUp: { R: { target: [930, 1160], handAngle: -88, hand: "thumbUp", side: 1, fsU: 0.6, fsF: 0.6, elbowOut: 1.2 }, face: "happy" },
    point:    { R: { target: [1090, 930], handAngle: 140, hand: "point", side: -1, fsU: 0.8 }, body: { lean: 1 }, look: [9, -4] },
    think:    { L: { target: [572, 1045], handAngle: 172, hand: "point", side: 1, z: "top", fsU: 0.6 }, face: "thinking" },
    cheer:    { R: { target: [1010, 640], handAngle: 184, hand: "open", side: -1, wave: 0.35 },
                L: { target: [300, 650], handAngle: 176, hand: "open", side: 1, wave: 0.35, z: "back" }, face: "laugh", body: { hop: true } },
    shrug:    { R: { target: [1055, 1440], handAngle: 118, hand: "soft", side: -1 },
                L: { target: [265, 1455], handAngle: -112, hand: "soft", side: -1 }, face: "neutral", body: { shrug: 28, tilt: 7 } },
    belly:    { R: { target: [745, 1575], handAngle: -76, hand: "soft", side: 1 }, face: "laugh" },
    explain:  { R: { target: [1000, 1350], handAngle: -138, hand: "soft", side: -1, beat: 1, fsU: 0.75, fsF: 0.85, elbowOut: 1 } },
    shy:      { R: { target: [700, 1620], handAngle: -60, hand: "soft", side: 1 },
                L: { target: [640, 1640], handAngle: 60, hand: "soft", side: 1, z: "top" }, face: "shy" }
  };
  const PUBLIC_GESTURES = ["none", "wave", "hello", "hi5", "idea", "count2", "thumbsUp", "point", "think", "cheer", "shrug", "belly", "explain", "shy"];

  // Mouth shapes for lip sync: [open, width]
  const VISEME = {
    a: [0.82, 1.05], e: [0.5, 1.18], i: [0.32, 1.22], o: [0.7, 0.6], u: [0.42, 0.52], y: [0.34, 1.1],
    m: [0, 0.85], b: [0, 0.85], p: [0, 0.85], f: [0.12, 1.02], v: [0.12, 1.02],
    w: [0.3, 0.58], r: [0.28, 0.78], l: [0.36, 1], t: [0.24, 1.05], d: [0.26, 1.02], n: [0.22, 1],
    s: [0.16, 1.15], z: [0.16, 1.15], c: [0.2, 1.08], k: [0.3, 0.98], g: [0.3, 0.98], h: [0.42, 1], j: [0.25, 0.9]
  };

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
      .mascot-svg .rig{font:600 24px ui-monospace,Menlo,monospace;fill:var(--mascot-rig,#e0306b)}
      .mascot-svg .rig-dot{fill:var(--mascot-rig,#e0306b)}
    `;
    const g = el("g", { id: "mascot" }, svg);
    const parts = {};
    parts.shadow = el("ellipse", { class: "shadow", cx: 615, cy: P.ground, rx: 300, ry: 22 }, g);
    parts.layerBack = el("g", { id: "layerBack" }, g);

    // ---- legs, trousers and shoes (rebuilt every frame)
    const legs = parts.legs = el("g", { id: "legs" }, g);
    parts.pelvis = el("path", { class: "solid", id: "pelvis",
      d: "M410,1740 L812,1740 L822,1885 C760,1915 470,1915 404,1885 Z" }, legs);
    parts.shoeL = el("g", { id: "shoeL" }, legs);
    parts.legL = el("path", { class: "solid", id: "legL" }, legs);
    parts.hemL = el("path", { class: "cut", "stroke-width": 6 }, legs);
    parts.shoeR = el("g", { id: "shoeR" }, legs);
    parts.legR = el("path", { class: "solid", id: "legR" }, legs);
    parts.legCut = el("path", { class: "cut", "stroke-width": 8 }, legs);
    parts.hemR = el("path", { class: "cut", "stroke-width": 6 }, legs);
    parts.pocket = el("path", { class: "cut", "stroke-width": 7 }, legs);
    for (const shoe of [parts.shoeL, parts.shoeR]) {
      el("path", { class: "skin", d: "M40,-24 C60,-6 66,34 60,60 L-136,60 C-176,60 -186,28 -158,10 C-120,-8 -70,-8 -34,-28 Z" }, shoe);
      el("path", { class: "solid", d: "M64,42 C66,58 62,74 52,76 L-138,76 C-174,76 -190,60 -176,42 Z" }, shoe);
      el("path", { class: "ink", d: "M-56,-14 L-76,8 M-84,-4 L-104,14 M-150,40 C-128,30 -110,30 -96,40" }, shoe);
    }

    // ---- torso
    const torso = parts.torso = el("g", { id: "torso" }, g);
    parts.shirt = el("path", { class: "paper", id: "shirt" }, torso);
    el("path", { class: "ink", id: "torsoSides",
      d: "M440,1110 C420,1230 398,1340 384,1420 C374,1520 372,1660 376,1786 M778,1110 C784,1350 792,1560 804,1786" }, torso);
    el("path", { class: "ink", id: "hem", d: "M376,1786 C500,1806 700,1806 804,1786" }, torso);
    parts.shoulderLine = el("path", { class: "ink", id: "shoulders" }, torso);
    el("path", { class: "ink", id: "collar", d: "M697,941 L541,983 L551,1030 L722,969" }, torso);

    parts.layerMid = el("g", { id: "layerMid" }, g);
    parts.neckFill = el("path", { class: "paper", id: "neckFill" }, g);
    parts.neck = el("path", { class: "ink", id: "neck" }, g);

    // ---- head
    const head = parts.head = el("g", { id: "head" }, g);
    el("path", { class: "paper", id: "faceFill",
      d: "M370,566 C342,578 324,606 327,638 C330,668 344,690 362,702 L383,705 C392,760 430,808 490,830 C515,840 532,850 541,866 L698,844 C715,805 760,775 790,750 L800,762 C852,760 888,735 893,697 C898,662 880,630 845,628 L845,540 L381,520 Z" }, head);
    parts.earL = el("g", { id: "earL" }, head);
    el("path", { class: "ink", d: "M370,566 C342,578 324,606 327,638 C330,668 344,690 362,702" }, parts.earL);
    parts.earR = el("g", { id: "earR" }, head);
    el("path", { class: "ink", d: "M845,628 C880,630 898,662 893,697 C888,735 852,760 800,762" }, parts.earR);
    el("path", { class: "ink", d: "M800,704 L846,688" }, parts.earR);
    parts.faceL = el("path", { class: "ink", id: "faceL" }, head);
    parts.faceR = el("path", { class: "ink", id: "faceR" }, head);

    const face = parts.face = el("g", { id: "features" }, head);
    parts.blush = el("g", { id: "blush", opacity: 0 }, face);
    el("path", { class: "ink", d: "M420,690 l10,-14 M440,692 l10,-14 M640,676 l10,-14 M660,678 l10,-14" }, parts.blush);
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
    parts.dimples = el("path", { class: "ink", id: "dimples", "stroke-width": 7, opacity: 0 }, face);

    parts.lock = el("g", { id: "hairLock" }, head);
    el("path", { class: "solid",
      d: "M722,500 L728,560 C730,610 734,650 752,671 C760,679 771,670 777,655 C783,640 790,631 802,626 L840,520 Z" }, parts.lock);
    const cap = parts.cap = el("g", { id: "cap" }, head);
    el("path", { class: "solid", id: "capDome",
      d: "M398,402 C396,300 472,204 600,198 C722,193 822,240 882,302 C926,350 948,420 945,492 C943,560 921,610 890,627 L795,631 L728,526 Z" }, cap);
    parts.button = el("g", { id: "capButton" }, cap);
    el("circle", { class: "solid", cx: 860, cy: 268, r: 36 }, parts.button);
    el("rect", { class: "paper", id: "capStripe", x: 481, y: 338, width: 128, height: 23, rx: 11.5, transform: "rotate(15 545 349.5)" }, cap);
    el("path", { class: "cut", d: "M236,402 C262,388 288,384 312,387 C345,392 378,406 420,420 L712,517", "stroke-width": 18 }, cap);
    el("path", { class: "solid", id: "capBrim",
      d: "M207,470 C204,425 245,388 300,386 C340,386 380,405 420,420 L702,512 C716,518 714,532 698,532 L300,537 C250,537 210,512 207,470 Z" }, cap);
    parts.fringe = el("g", { id: "fringe" }, head);
    parts.fringe1 = el("path", { class: "solid", id: "fringeL", d: "M330,520 C328,548 352,572 380,568 C420,563 466,550 490,520 Z" }, parts.fringe);
    parts.fringe2 = el("path", { class: "solid", id: "fringeR", d: "M512,520 C518,548 555,570 590,568 C630,566 672,550 694,520 Z" }, parts.fringe);

    parts.layerTop = el("g", { id: "layerTop" }, g);
    parts.rig = el("g", { id: "rigOverlay", style: "display:none" }, g);
    return { svg, parts };
  }

  function buildArm(uid, side) {
    const A = ARMS[side];
    const g = el("g", { id: `arm${side}` });
    const defs = el("defs", {}, g);
    const skinU = el("g", { id: `${uid}-upper${side}` }, defs);
    const skinL = el("g", { id: `${uid}-lower${side}` }, defs);
    const upper = el("path", {}, skinU), elbow = el("circle", {}, skinU);
    const fore = el("path", {}, skinL), palm = el("path", {}, skinL), thumb = el("path", {}, skinL);
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
    const fingersG = el("g", {}, g);
    const fingers = [];
    for (let i = 3; i >= 0; i--) {
      const fg = el("g", {}, fingersG);
      fingers[i] = { fill: el("path", { class: "paper" }, fg), line: el("path", { class: "ink" }, fg), crease: el("path", { class: "ink", "stroke-width": 7 }, fg) };
    }
    el("path", { class: "paper", d: A.sleeve.fill }, sleeve);
    const sleeveInner = el("path", { class: "ink", d: A.sleeve.inner }, sleeve);
    el("path", { class: "ink", d: A.sleeve.outer }, sleeve);
    return { g, upper, elbow, fore, palm, thumb, fingers, sleeve, sleeveInner, lowerBack, lowerFront, folded };
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
    "feet.lift":    { key: "feetLift", min: 0, max: 160, about: "Lifts both feet off the ground, for jumps." }
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
  const ACTIONS = ["blink", "wink", "nod", "shakeHead", "wiggleEars", "hop", "poke", "laughBurst", "stretch"];

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
    { name: "mascot_view", description: "Frame the mascot: 'full' shows the whole body, 'bust' matches the original head-and-shoulders crop.",
      inputSchema: { type: "object", properties: { view: { type: "string", enum: Object.keys(VIEWS) } }, required: ["view"] } },
    { name: "mascot_get_state", description: "Read the current expression, gesture, view, speaking status and every rig point's live value.",
      inputSchema: { type: "object", properties: {} } },
    { name: "mascot_list_params", description: "List every rig point mascot_set accepts, with its range and meaning.",
      inputSchema: { type: "object", properties: {} } }
  ];

  // ------------------------------------------------------------ runtime
  class MascotRig {
    constructor(container, options = {}) {
      this.opts = Object.assign({ follow: true, idle: true, view: "full", talkGestures: true, reducedMotion: undefined }, options);
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

      const S = (v, k, d) => new Spring(v, k, d);
      this.s = {
        smile: S(1, 140, 18), open: S(0, 340, 26), width: S(1, 180, 19), happy: S(0, 140, 18), squeeze: S(0, 140, 18),
        eyeH: S(1, 160, 18), blink: S(1, 1100, 46), winkL: S(1, 500, 30), winkR: S(1, 500, 30),
        lookX: S(0, 220, 22), lookY: S(0, 220, 22),
        brow: S(0, 150, 16), browTilt: S(0, 150, 16), browShow: S(0, 130, 18), blush: S(0, 60, 14),
        tilt: S(0, 80, 11), turn: S(0, 90, 13), nod: S(0, 150, 14),
        earL: S(0, 260, 9), earR: S(0, 260, 9), earPerk: S(0, 120, 14),
        fringe: S(0, 70, 5), lock: S(0, 60, 4), button: S(0, 160, 6),
        lean: S(0, 40, 9), sway: S(0, 28, 8), bob: S(0, 150, 13), shrug: S(0, 110, 12),
        feetLift: S(0, 230, 19), footTilt: S(0, 200, 16), view: S(0, 50, 13)
      };
      for (const side of ["R", "L"]) {
        const r = REST[side], h = HANDS[r.hand];
        this.s["sh" + side] = S(r.shoulder, 55, 11);
        this.s["el" + side] = S(r.elbow, 85, 11.5);
        this.s["wr" + side] = S(r.wrist, 130, 12);
        this.s["side" + side] = S(r.side, 120, 16);
        this.s["spread" + side] = S(h.spread, 150, 15);
        this.s["thumb" + side] = S(h.thumb, 160, 15);
        this.s["thumbAng" + side] = S(h.thumbAngle, 160, 15);
        this.s["wave" + side] = S(0, 60, 12);
        this.s["fsU" + side] = S(1, 90, 13);   // upper arm foreshortening (pointing at the camera)
        this.s["fsF" + side] = S(1, 90, 13);
        for (let i = 0; i < 4; i++) this.s[`f${i}${side}`] = S(h.fingers[i], 170 - i * 12, 14);
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
      this.wavePhase = 0;
      this.shakeT = 0;
      this.laughT = 0;
      this.beat = 0;
      this.nodPulse = 0;
      this.idleSway = 0;
      this.attention = 0;

      this._onMove = (e) => { this.pointer = [e.clientX, e.clientY]; };
      this._onLeave = () => { this.pointer = null; };
      this._onClick = () => this.poke();
      if (this.opts.follow) {
        root.addEventListener("pointermove", this._onMove, { passive: true });
        root.document.addEventListener("pointerleave", this._onLeave);
      }
      svg.addEventListener("click", this._onClick);
      svg.style.cursor = "pointer";

      this.express("smile", { instant: true });
      this._render();
      this._last = performance.now();
      this._raf = requestAnimationFrame((t) => this._tick(t));
    }

    // -------------------------------------------------- public API
    express(name, { instant = false, hold = 0 } = {}) {
      const e = EXPRESSIONS[name];
      if (!e) return this;
      this.expression = name;
      for (const k of ["smile", "open", "width", "happy", "squeeze", "eyeH", "brow", "browTilt", "browShow", "blush"]) {
        instant ? this.s[k].snap(e[k]) : this.s[k].set(e[k]);
        delete this.held[k];
      }
      this.exprLook = [e.lookX || 0, e.lookY || 0];
      const post = Object.assign({ shrug: 0, lean: 0, nod: 0, tilt: 0 }, POSTURE[name] || {});
      this.posture = post;
      for (const k of ["shrug", "lean", "nod", "tilt"]) { this.s[k].set(post[k]); delete this.held[k]; }
      this.s.earPerk.set(name === "surprised" ? 1 : 0);
      if (name === "happy") this.wiggleEars();
      if (name === "laugh") this.laughBurst();
      if (name === "surprised" && !instant) { this.s.bob.kick(-420); this.s.shrug.kick(260); }
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
      const b = g.body || {};
      if (b.lean != null) this.s.lean.set(b.lean);
      if (b.shrug != null) this.s.shrug.set(b.shrug);
      if (b.tilt != null) this.s.tilt.set(b.tilt);
      if (b.hop) this.hop();
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

    blink() { this.s.blink.set(0); this._later(0.075, () => this.s.blink.set(1)); return this; }
    wink(side = "R") {
      const s = this.s["wink" + side];
      s.set(0); this.s.smile.kick(5); this.s.tilt.kick(30);
      this._later(0.4, () => s.set(1));
      return this;
    }
    nod(times = 2) {
      for (let i = 0; i < times; i++) {
        this._later(i * 0.4, () => this.s.nod.set(13 + (this.posture?.nod || 0)));
        this._later(i * 0.4 + 0.18, () => this.s.nod.set(this.posture?.nod || 0));
      }
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
      s.bob.set(42); s.shrug.set(-6);
      this._later(0.13, () => { s.bob.set(-175); s.feetLift.set(125); s.footTilt.set(16); s.shrug.set(10); });
      this._later(0.42, () => { s.bob.set(38); s.feetLift.set(0); s.footTilt.set(0); s.shrug.set(-4); });
      this._later(0.62, () => { s.bob.set(0); s.shrug.set(this.posture?.shrug || 0); });
      return this;
    }
    laughBurst(seconds = 1.6) { this.laughT = Math.max(this.laughT, seconds); return this; }
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
          if (this.opts.talkGestures && this.gestureName === "none" && tk.autoGesture) this._applyArm("R", REST.R);
          this._emit("speechend", { text: raw });
          resolve();
        };
        this.talk = { units, total, t: 0, i: 0, done, autoGesture: startGesture === "none" };
        this._emit("speechstart", { text: raw });
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
      return { expression: this.expression, gesture: this.gestureName, view: this.view, speaking: !!this.talk,
        held: Object.keys(PARAMS).filter((n) => PARAMS[n].key in this.held), params };
    }
    on(event, fn) { (this.listeners[event] ||= []).push(fn); return () => this.off(event, fn); }
    off(event, fn) { this.listeners[event] = (this.listeners[event] || []).filter((h) => h !== fn); }
    _emit(event, detail) { for (const h of this.listeners[event] || []) { try { h(detail); } catch (_) { /* listeners never stop the rig */ } } }

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
            if (!VIEWS[args.view]) return fail(`Unknown view "${args.view}". Use full or bust.`);
            this.setView(args.view); break;
          case "mascot_get_state": break;
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
      cancelAnimationFrame(this._raf);
      this.timers.forEach(clearTimeout);
      clearTimeout(this._exprHold); clearTimeout(this._gestureHold);
      root.removeEventListener("pointermove", this._onMove);
      root.document.removeEventListener("pointerleave", this._onLeave);
      this.svg.remove();
    }

    // -------------------------------------------------- internals
    _later(sec, fn) { this.timers.push(setTimeout(fn, sec * 1000)); }

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
      const near = (spring, target) => { let t = target; while (t - spring.value > 180) t -= 360; while (t - spring.value < -180) t += 360; spring.set(t); };
      near(s["sh" + side], shoulder);
      s["el" + side].set(wrap(elbow));
      s["wr" + side].set(clamp(wrap(wrist), -95, 95));
      s["side" + side].set(pose.side ?? 1);
      const h = HANDS[pose.hand || "relaxed"];
      h.fingers.forEach((v, i) => s[`f${i}${side}`].set(v));
      s["thumb" + side].set(h.thumb); s["thumbAng" + side].set(h.thumbAngle); s["spread" + side].set(h.spread);
      s["wave" + side].set(pose.wave || 0);
      s["fsU" + side].set(pose.fsU ?? 1); s["fsF" + side].set(pose.fsF ?? 1);
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
      const r = this.svg.getBoundingClientRect();
      if (!r.width) return null;
      const vb = this.viewBox;
      return [vb[0] + ((this.pointer[0] - r.left) / r.width) * vb[2], vb[1] + ((this.pointer[1] - r.top) / r.height) * vb[3]];
    }

    _tick(now) {
      const dt = Math.min(0.05, (now - this._last) / 1000);
      this._last = now; this.t += dt;
      this._behave(dt);
      for (const k in this.s) this.s[k].step(dt);
      this._render();
      this._raf = requestAnimationFrame((t) => this._tick(t));
    }

    // Autonomous life and the talking director.
    _behave(dt) {
      const s = this.s, calm = this.opts.reducedMotion;
      const want = (k, v) => { if (!(k in this.held)) s[k].set(v); };

      if (this.opts.idle) {
        this.nextBlink -= dt;
        if (this.nextBlink <= 0) {
          this.blink();
          if (Math.random() < 0.18) this._later(0.2, () => this.blink());
          this.nextBlink = 2 + Math.random() * 4;
        }
        this.nextSaccade -= dt;
        if (this.nextSaccade <= 0) { this.saccade = [(Math.random() - 0.5) * 7, (Math.random() - 0.5) * 4]; this.nextSaccade = 0.6 + Math.random() * 2.2; }
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
      want("sway", this.idleSway);

      // gaze and attention
      let lx = this.saccade[0], ly = this.saccade[1], turn = 0;
      const p = this._pointerInSvg();
      this.attention = 0;
      if (p && this.opts.follow) {
        const dx = (p[0] - 600) / 480, dy = (p[1] - 640) / 480;
        lx = clamp(dx, -1, 1) * 9; ly = clamp(dy, -1, 1) * 7; turn = clamp(dx, -1, 1) * 10;
        this.attention = clamp(dx, -1, 1);
      }
      if (this.exprLook && (this.exprLook[0] || this.exprLook[1]) && !p) { lx = this.exprLook[0]; ly = this.exprLook[1]; }
      want("lookX", lx); want("lookY", ly);
      if (this.shakeT > 0) { this.shakeT -= dt; turn += Math.sin(this.t * 21) * 13 * clamp(this.shakeT * 3, 0, 1); }
      want("turn", turn);

      // laughing: the whole body bounces and the shoulders shake
      const post = this.posture || {};
      if (this.laughT > 0 && !calm) {
        this.laughT -= dt;
        const env = clamp(this.laughT / 0.6, 0, 1);
        want("bob", 10 + Math.sin(this.t * 15) * 12 * env);
        want("shrug", (post.shrug || 0) + 6 + Math.sin(this.t * 15 + 0.6) * 9 * env);
        want("nod", (post.nod || 0) + Math.sin(this.t * 15 + 1.2) * 3 * env);
        s.open.set(0.55 + 0.35 * Math.abs(Math.sin(this.t * 15)));
      } else if (this._laughWas) {
        want("bob", 0); want("shrug", post.shrug || 0); want("nod", post.nod || 0);
        if (!this.talk) s.open.set(EXPRESSIONS[this.expression].open);
      }
      this._laughWas = this.laughT > 0;

      // talking director: visemes, head beats, hand beats, prosody
      const e = EXPRESSIONS[this.expression];
      if (this.talk) {
        const tk = this.talk;
        tk.t += dt;
        while (tk.i < tk.units.length - 1 && tk.units[tk.i + 1].t <= tk.t) {
          tk.i++;
          const u = tk.units[tk.i];
          if (u.wordStart && !calm) {
            s.nod.kick(-28 - u.stress * 40);
            this.beat = 0.6 + u.stress;
            if (u.stress > 0.5) { s.browShow.set(Math.max(e.browShow, 0.7)); s.brow.set(e.brow - 6); this._later(0.25, () => { if (this.talk) { s.brow.set(e.brow); s.browShow.set(e.browShow); } }); }
          }
          if (u.ch === "?") { s.tilt.set((post.tilt || 0) + 5); s.browShow.set(1); s.brow.set(-9); }
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
          s.width.set(lerp(e.width, lerp(cur[1], nx[1], k * 0.6), 0.85));
        }
      } else if (this._analyser || this.mouthOverride != null) {
        const lvl = this._analyser ? this._analyser() : this.mouthOverride;
        s.open.set(lvl * 0.85); s.width.set(lerp(e.width, 0.9, lvl));
        if (lvl > 0.5 && Math.random() < 0.05) this.beat = 0.8;
      } else if (this.laughT <= 0) {
        want("width", e.width);
      }
      this.beat = Math.max(0, this.beat - dt * 3.2);

      // secondary motion: hair, cap button lag behind the head
      const headVel = s.tilt.velocity + s.turn.velocity * 0.6 + s.nod.velocity * 0.3 + s.lean.velocity;
      s.fringe.set(-headVel * 0.12); s.lock.set(-headVel * 0.16);
      s.button.set(-headVel * 0.25 + s.bob.velocity * 0.012);

      this.wavePhase += dt * (calm ? 3 : 9.5);
    }

    _render() {
      const s = this.s, parts = this.parts, t = this.t, calm = this.opts.reducedMotion;

      // camera: blend between full-body and bust framing
      const vt = smooth(s.view.value);
      this.viewBox = VIEWS.full.map((v, i) => lerp(v, VIEWS.bust[i], vt));
      this.svg.setAttribute("viewBox", this.viewBox.map(f).join(" "));

      // body transform: breathing scales the torso from the hips, then lean, sway, bob
      const breath = calm ? 0 : Math.sin(t * 1.6) * 0.5 + 0.5;
      const sy = 1 + breath * 0.009;
      const hip = P.hip, lean = s.lean.value, sway = s.sway.value, bob = s.bob.value;
      const bodyPt = ([x, y]) => {
        const q = rotAround([x, hip[1] + (y - hip[1]) * sy], hip, lean);
        return [q[0] + sway, q[1] + bob];
      };
      parts.torso.setAttribute("transform", `translate(${f(sway)} ${f(bob)}) rotate(${f(lean)} ${hip[0]} ${hip[1]}) translate(0 ${f(hip[1] * (1 - sy))}) scale(1 ${sy.toFixed(4)})`);

      // shoulders: shrug lifts both, breathing nudges them
      const shrug = s.shrug.value;
      const shR = [866, 1008 - shrug], shL = [446, 1058 - shrug * 0.8];
      parts.shoulderLine.setAttribute("d",
        `M716,932 C766.4,944 ${f(821.8)},${f(969 - shrug * 0.5)} ${pt(shR)} M548,1003 C512,1012 ${f(478)},${f(1030 - shrug * 0.5)} ${pt(shL)}`);
      parts.shirt.setAttribute("d",
        `M556,975 L716,932 C766.4,944 821.8,${f(969 - shrug * 0.5)} ${pt(shR)} L800,1060 L778,1110 C784,1350 792,1560 804,1786 C700,1806 500,1806 376,1786 C372,1660 374,1520 384,1420 C398,1340 420,1230 440,1110 L${pt(shL)} C478,${f(1030 - shrug * 0.5)} 512,1012 548,1003 Z`);

      // legs from planted feet
      this._renderLegs(bodyPt);

      // neck and head
      const hp = bodyPt(P.headPivot);
      const sway2 = calm ? 0 : Math.sin(t * 0.7) * 1.1 + Math.sin(t * 1.3 + 1) * 0.5;
      const tilt = s.tilt.value + sway2 + this.attention * 2.5 + s.turn.value * 0.08 + lean * 0.45;
      const hx = hp[0] - P.headPivot[0] + s.turn.value * 0.6;
      const hy = hp[1] - P.headPivot[1] + s.nod.value * 0.9;
      parts.head.setAttribute("transform", `translate(${f(hx)} ${f(hy)}) rotate(${f(tilt)} ${P.headPivot[0]} ${P.headPivot[1]})`);
      const headPt = (q) => add(rotAround(q, P.headPivot, tilt), [hx, hy]);
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
      const lx = s.lookX.value, ly = s.lookY.value;
      const open = clamp(s.blink.value, 0, 1);
      const sq = clamp(s.squeeze.value, 0, 1);
      const eye = (cx, cy, wink) => {
        const k = clamp(s.happy.value, 0, 1);
        const h = 21 * s.eyeH.value * Math.max(0.04, open * wink);
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
      const corner = -sm * 3;
      const mx = P.mouth[0] + lx * 0.5, my = P.mouth[1] + ly * 0.3;
      const M = (x, y) => rotAround([mx + x, my + y], [mx, my], P.mouthTilt);
      const d = `M${pt(M(-hw, corner))} Q${pt(M(0, upper))} ${pt(M(hw, corner))} Q${pt(M(0, lower))} ${pt(M(-hw, corner))} Z`;
      parts.mouth.setAttribute("d", d);
      parts.mouthClip.setAttribute("d", d);
      const teethH = 12 * smooth((op - 0.22) / 0.3) * (1 - round * 1.2);
      const upperMid = (upper + corner) / 2;
      parts.teeth.setAttribute("d", teethH > 0.5
        ? `M${pt(M(-hw, corner - 6))} Q${pt(M(0, upper - 6))} ${pt(M(hw, corner - 6))} L${pt(M(hw, corner + teethH))} Q${pt(M(0, upperMid + teethH + 4))} ${pt(M(-hw, corner + teethH))} Z`
        : "M0,0");
      const tongueOn = smooth((op - 0.45) / 0.3);
      const tc = M(4, lower * 0.5 + 4);
      parts.tongue.setAttribute("cx", f(tc[0])); parts.tongue.setAttribute("cy", f(tc[1]));
      parts.tongue.setAttribute("rx", f(hw * 0.55 * tongueOn)); parts.tongue.setAttribute("ry", f(14 * tongueOn));
      const dimple = smooth((sm - 1.05) / 0.25);
      const c1 = M(-hw - 4, corner), c2 = M(hw + 4, corner);
      parts.dimples.setAttribute("d", `M${pt(add(c1, [-4, -9]))} Q${pt(add(c1, [-9, 0]))} ${pt(add(c1, [-3, 8]))} M${pt(add(c2, [4, -9]))} Q${pt(add(c2, [9, 0]))} ${pt(add(c2, [3, 8]))}`);
      parts.dimples.setAttribute("opacity", dimple.toFixed(2));
    }

    _renderLegs(bodyPt) {
      const s = this.s, parts = this.parts;
      parts.legs.setAttribute("data-lift", f(s.feetLift.value));
      parts.pelvis.setAttribute("transform", `translate(${f(s.sway.value)} ${f(s.bob.value)}) rotate(${f(s.lean.value * 0.4)} ${P.hip[0]} ${P.hip[1]})`);
      const lift = s.feetLift.value;
      const legs = {};
      for (const side of ["L", "R"]) {
        const H = bodyPt(P["hip" + side]);
        const A = [P["ankle" + side][0] + (side === "L" ? 0 : 0), P["ankle" + side][1] - lift];
        // knees point forward, which is screen-left for this 3/4 view
        const ik = solveIK(H, A, LEG.Lt, LEG.Ls, (a, b) => a[0] < b[0]);
        const K = add(H, mul(dirOf(ik.shoulder), LEG.Lt));
        const A2 = add(K, mul(dirOf(ik.fore), LEG.Ls));
        legs[side] = { H, K, A: A2, up: ik.shoulder, fore: ik.fore };
        const d = taper(H, K, LEG.r0, LEG.rK) + " " + taper(K, A2, LEG.rK, LEG.rA) +
          ` M${pt(add(K, [-LEG.rK, 0]))} a${LEG.rK},${LEG.rK} 0 1,0 ${LEG.rK * 2},0 a${LEG.rK},${LEG.rK} 0 1,0 ${-LEG.rK * 2},0` +
          ` M${pt(add(H, [-LEG.r0, 0]))} a${LEG.r0},${LEG.r0} 0 1,0 ${LEG.r0 * 2},0 a${LEG.r0},${LEG.r0} 0 1,0 ${-LEG.r0 * 2},0`;
        parts["leg" + side].setAttribute("d", d);
        parts["shoe" + side].setAttribute("transform", `translate(${pt(A2)}) rotate(${f(s.footTilt.value * (side === "L" ? 1.2 : 1))})`);
        // rolled hem just above the shoe
        const n = perpOf(ik.fore), hemC = add(A2, mul(dirOf(ik.fore), -30));
        parts["hem" + side].setAttribute("d", `M${pt(add(hemC, mul(n, -LEG.rA * 0.85)))} L${pt(add(hemC, mul(n, LEG.rA * 0.85)))}`);
      }
      // a paper line along the near leg's inner edge separates it from the far leg
      const R = legs.R, nU = perpOf(R.up), nF = perpOf(R.fore);
      const side = nU[0] < 0 ? 1 : -1; // pick the normal that points screen-left
      const e1 = add(add(R.H, mul(dirOf(R.up), 90)), mul(nU, side * LEG.r0 * 0.93));
      const e2 = add(R.K, mul(nU, side * LEG.rK));
      const e3 = add(add(R.A, mul(dirOf(R.fore), -40)), mul(nF, side * LEG.rA));
      parts.legCut.setAttribute("d", `M${pt(e1)} L${pt(e2)} L${pt(e3)}`);
      const pk = bodyPt([772, 1815]);
      parts.pocket.setAttribute("d", `M${pt(pk)} q-14,40 8,70`);
      // shadow shrinks while airborne
      const sc = 1 - clamp(lift / 260, 0, 0.45);
      parts.shadow.setAttribute("rx", f(300 * sc)); parts.shadow.setAttribute("cx", f(615 + s.sway.value * 0.4));
      this.legPts = legs;
    }

    _renderArm(side, bodyPt) {
      const s = this.s, A = ARMS[side], arm = this.arms[side], calm = this.opts.reducedMotion;
      const waveAmp = calm ? 0 : s["wave" + side].value;
      const ph = this.wavePhase + (side === "L" ? Math.PI : 0);
      const beat = side === "R" && this.talk ? this.beat : 0;
      const lean = s.lean.value;
      const shrug = s.shrug.value;

      const S = add(bodyPt(A.S), [0, -shrug * (side === "R" ? 1 : 0.8)]);
      // follow-through: the forearm and hand trail the shoulder's motion
      const drag = clamp(s["sh" + side].velocity * 0.06, -14, 14);
      const shAng = s["sh" + side].value + lean * 0.7 + (calm ? 0 : Math.sin(this.t * 1.6) * 0.6);
      const elAng = s["el" + side].value + Math.sin(ph) * 16 * waveAmp - drag - beat * 9;
      const wrAng = s["wr" + side].value + Math.sin(ph - 1) * 22 * waveAmp - drag * 1.4 + beat * 6;
      const foreAng = shAng + elAng, handAng = foreAng + wrAng;
      const fsU = s["fsU" + side].value, fsF = s["fsF" + side].value;
      const E = add(S, mul(dirOf(shAng), A.Lu * fsU)), W = add(E, mul(dirOf(foreAng), A.Lf * fsF));
      const U = frame(S, shAng);
      // perspective: the near arm is foreshortened toward the viewer at rest,
      // so it slims down as it swings away from the body
      const lift = Math.abs(wrap(shAng - REST[side].shoulder));
      const slim = side === "R" ? lerp(1, 0.74, smooth(lift / 80)) : 1;
      const slimY = side === "R" ? lerp(1, 0.74, smooth(lift / 80)) : 1;

      // skin union: upper arm below the sleeve, elbow, forearm, palm, thumb
      const ua = U(A.ox * slim, A.start * slimY * fsU);
      const rE = A.rE * lerp(1, 0.92, 1 - slim) , rW = A.rW;
      arm.upper.setAttribute("d", taper(ua, add(E, mul(perpOf(shAng), A.ox * 0.4 * slim)), A.r0 * slim, rE * slim));
      arm.elbow.setAttribute("cx", f(E[0])); arm.elbow.setAttribute("cy", f(E[1])); arm.elbow.setAttribute("r", f(rE * slim));
      arm.fore.setAttribute("d", taper(E, W, rE * slim, rW));

      const side01 = s["side" + side].value, sx = (Math.abs(side01) < 0.12 ? Math.sign(side01 || 1) * 0.12 : side01) * A.hs;
      const H = frame(W, handAng);
      const hmap = (x, y) => H(x * sx, y * A.hs);
      arm.palm.setAttribute("d", HAND.palm.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => pt(hmap(+x, +y))));
      const ta = s["thumbAng" + side].value, te = clamp(s["thumb" + side].value, 0, 1);
      const tu = [Math.sin(ta * DEG), Math.cos(ta * DEG)];
      const tLen = HAND.thumbLen * (0.45 + 0.55 * te) * (1 + 0.35 * smooth((-ta - 70) / 20));
      arm.thumb.setAttribute("d", capsule(hmap, HAND.thumbBase, tu, tLen, HAND.thumbR));

      // fingers: each keeps its own outline; curled fingers fold to knuckles
      const spread = s["spread" + side].value;
      for (let i = 0; i < 4; i++) {
        const fg = arm.fingers[i];
        const ext = clamp(s[`f${i}${side}`].value + (waveAmp ? Math.sin(ph * 1.2 - i * 0.5) * 0.05 * waveAmp : 0), 0, 1);
        const beta = (HAND.fan[i] + spread * HAND.spreadFan[i] + (1 - ext) * 4) * DEG;
        const u = [Math.sin(beta), Math.cos(beta)];
        const k = HAND.knuckles[i];
        const b = sub(k, mul(u, 14));
        const L = 14 + Math.max(HAND.fingerR * 1.3, HAND.lengths[i] * (0.26 + 0.74 * ext));
        fg.fill.setAttribute("d", capsule(hmap, b, u, L, HAND.fingerR, "fill"));
        fg.line.setAttribute("d", capsule(hmap, b, u, L, HAND.fingerR, true));
        const curl = smooth((0.62 - ext) / 0.32);
        if (curl > 0.02) {
          const n = [u[1], -u[0]], c = add(b, mul(u, 22));
          fg.crease.setAttribute("d", `M${pt(hmap(...add(c, mul(n, -HAND.fingerR * 0.7))))} Q${pt(hmap(...add(c, mul(u, 6))))} ${pt(hmap(...add(c, mul(n, HAND.fingerR * 0.7))))}`);
          fg.crease.setAttribute("opacity", curl.toFixed(2));
        } else fg.crease.setAttribute("opacity", "0");
      }

      // sleeve rides the upper arm; its inner seam only shows once the arm lifts
      arm.sleeve.setAttribute("transform", `${matrixOf(S, shAng)} scale(${slim.toFixed(3)} ${(slimY * fsU).toFixed(3)})`);
      const isFolded = Math.abs(wrap(elAng)) > 62 || fsU < 0.85;
      arm.folded.style.display = isFolded ? "" : "none";
      arm.lowerBack.style.display = arm.lowerFront.style.display = isFolded ? "none" : "";
      arm.sleeveInner.setAttribute("opacity", smooth((lift - 8) / 22).toFixed(2));
      this["joints" + side] = { S, E, W };
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
