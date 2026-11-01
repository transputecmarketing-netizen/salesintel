/* Blue Cap mascot: a rigged, line-art SVG character with a small animation
 * runtime. No dependencies. Works in any page:
 *
 *   <div id="buddy"></div>
 *   <script src="/mascot/mascot.js"></script>
 *   <script>
 *     const buddy = Mascot.mount(document.getElementById("buddy"));
 *     buddy.express("happy");
 *     buddy.gesture("wave");
 *     buddy.say("Hi! Ready to revise cardiology?");
 *   </script>
 *
 * Colours come from CSS custom properties on any ancestor:
 *   --mascot-ink   (line and fill colour, default #1543e6)
 *   --mascot-paper (background the drawing sits on, default #ffffff)
 *
 * Coordinates are in the space of the original 1200 x 1600 drawing, so every
 * pivot below can be checked against the source artwork.
 */
(function (root) {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const VIEWBOX = "100 160 1000 1270"; // a little wider than the source so hands have room
  const HS = 1.4; // hand scale relative to the base finger geometry
  const DEG = Math.PI / 180;

  // Pivots and anchor points for every movable part (original drawing space).
  const P = {
    headPivot: [620, 860],     // base of the skull, head tilts around this
    neckL: [541, 862],         // jaw meets neck (head space)
    neckR: [698, 840],
    neckBaseL: [556, 975],     // neck meets collar (body space)
    neckBaseR: [716, 932],
    bodyPivot: [620, 1430],    // breathing scales the torso from the bottom edge
    eyeL: [462, 630],
    eyeR: [606, 630],
    mouth: [541, 696],
    mouthTilt: -9.7,           // the original smile is drawn slightly tilted
    earL: [372, 640],
    earR: [800, 705],
    fringe: [410, 525],
    fringe2: [600, 525],
    lock: [745, 560],
    button: [860, 268],
    elbowR: [1010, 1680],      // gesture arms enter from below the frame
    elbowL: [430, 1680]
  };

  // ---------------------------------------------------------------- utilities
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rot = (x, y, cx, cy, deg) => {
    const r = deg * DEG, c = Math.cos(r), s = Math.sin(r);
    return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
  };
  const f = (n) => Math.round(n * 10) / 10;
  const el = (tag, attrs, parent) => {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  };

  // A critically-damped-ish spring per animated value.
  class Spring {
    constructor(value, stiffness = 120, damping = 18) {
      this.value = value; this.target = value; this.velocity = 0;
      this.k = stiffness; this.d = damping;
    }
    set(target) { this.target = target; return this; }
    snap(value) { this.value = this.target = value; this.velocity = 0; return this; }
    kick(v) { this.velocity += v; return this; }
    step(dt) {
      const a = (this.target - this.value) * this.k - this.velocity * this.d;
      this.velocity += a * dt;
      this.value += this.velocity * dt;
      return this.value;
    }
  }

  // ------------------------------------------------------------ the drawing
  function buildSVG() {
    const svg = el("svg", {
      viewBox: VIEWBOX, xmlns: NS, role: "img",
      "aria-label": "Blue cap mascot", class: "mascot-svg"
    });
    el("style", {}, svg).textContent = `
      .mascot-svg{overflow:hidden;display:block;width:100%;height:auto}
      .mascot-svg .ink{fill:none;stroke:var(--mascot-ink,#1543e6);stroke-width:9;stroke-linecap:round;stroke-linejoin:round}
      .mascot-svg .solid{fill:var(--mascot-ink,#1543e6)}
      .mascot-svg .paper{fill:var(--mascot-paper,#ffffff)}
      .mascot-svg .cut{fill:none;stroke:var(--mascot-paper,#ffffff);stroke-width:9;stroke-linecap:round}
      .mascot-svg .skin{fill:var(--mascot-paper,#ffffff);stroke:var(--mascot-ink,#1543e6);stroke-width:9;stroke-linecap:round;stroke-linejoin:round}
      .mascot-svg .mouth{fill:var(--mascot-ink,#1543e6);stroke:var(--mascot-ink,#1543e6);stroke-width:9;stroke-linecap:round;stroke-linejoin:round}
      .mascot-svg .rig{font:600 22px ui-monospace,Menlo,monospace;fill:var(--mascot-rig,#e0306b)}
      .mascot-svg .rig-dot{fill:var(--mascot-rig,#e0306b)}
      .mascot-svg .rig-line{stroke:var(--mascot-rig,#e0306b);stroke-width:2;stroke-dasharray:6 6;fill:none}
    `;
    const g = el("g", { id: "mascot" }, svg);
    const parts = {};

    // ---- body
    const body = parts.body = el("g", { id: "body" }, g);
    el("path", { class: "ink", id: "shoulderR",
      d: "M716,932 C800,952 898,1008 934,1104 C955,1160 960,1250 951,1322" }, body);
    el("path", { class: "ink", id: "shoulderL",
      d: "M548,1003 C512,1012 478,1030 446,1058 C388,1110 330,1190 296,1262" }, body);
    el("path", { class: "ink", id: "collar",
      d: "M697,941 L541,983 L551,1030 L722,969" }, body);
    // Sleeve cuffs and the arms below them, kept as the original framing.
    parts.cuffL = el("g", { id: "cuffL" }, body);
    el("path", { class: "ink", d: "M296,1262 L403,1382 L386,1410 L270,1306 Z" }, parts.cuffL);
    el("path", { class: "ink", d: "M270,1330 L234,1404" }, parts.cuffL);
    parts.cuffR = el("g", { id: "cuffR" }, body);
    el("path", { class: "ink", d: "M690,1325 L951,1322 L946,1357 L694,1358 Z" }, parts.cuffR);
    el("path", { class: "ink", d: "M692,1358 L693,1414 M912,1358 L912,1414" }, parts.cuffR);

    // ---- neck (redrawn every frame so head and body stay joined)
    parts.neck = el("path", { class: "ink", id: "neck" }, g);

    // ---- head
    const head = parts.head = el("g", { id: "head" }, g);

    parts.earL = el("g", { id: "earL" }, head);
    el("path", { class: "ink",
      d: "M370,566 C342,578 324,606 327,638 C330,668 344,690 362,702" }, parts.earL);

    parts.earR = el("g", { id: "earR" }, head);
    el("path", { class: "ink",
      d: "M845,628 C880,630 898,662 893,697 C888,735 852,760 800,762" }, parts.earR);
    el("path", { class: "ink", d: "M800,704 L846,688" }, parts.earR);

    // The face outline: left cheek and jaw, right jaw line.
    el("path", { class: "ink", id: "faceL",
      d: "M381,560 L383,700 C392,760 430,808 490,830 C515,840 532,850 541,862" }, head);
    el("path", { class: "ink", id: "faceR", d: "M790,750 C760,775 715,805 698,840" }, head);

    // Features sit in their own layer so a head turn can slide them (parallax).
    const face = parts.face = el("g", { id: "features" }, head);
    parts.blush = el("g", { id: "blush", opacity: 0 }, face);
    el("path", { class: "ink", d: "M420,690 l10,-14 M440,692 l10,-14 M640,676 l10,-14 M660,678 l10,-14" }, parts.blush);
    parts.browL = el("path", { class: "ink", id: "browL", opacity: 0 }, face);
    parts.browR = el("path", { class: "ink", id: "browR", opacity: 0 }, face);
    parts.eyeL = el("path", { class: "ink", id: "eyeL", "stroke-width": 10 }, face);
    parts.eyeR = el("path", { class: "ink", id: "eyeR", "stroke-width": 10 }, face);
    parts.mouth = el("path", { class: "mouth", id: "mouth" }, face);

    // Hair and cap, layered back to front.
    parts.lock = el("g", { id: "hairLock" }, head);
    el("path", { class: "solid",
      d: "M722,500 L728,560 C730,610 734,650 752,671 C760,679 771,670 777,655 C783,640 790,631 802,626 L840,520 Z" }, parts.lock);

    const cap = parts.cap = el("g", { id: "cap" }, head);
    el("path", { class: "solid", id: "capDome",
      d: "M398,402 C396,300 472,204 600,198 C722,193 822,240 882,302 C926,350 948,420 945,492 C943,560 921,610 890,627 L795,631 L728,526 Z" }, cap);
    parts.button = el("g", { id: "capButton" }, cap);
    el("circle", { class: "solid", cx: 860, cy: 268, r: 36 }, parts.button);
    el("rect", { class: "paper", id: "capStripe", x: 481, y: 338, width: 128, height: 23, rx: 11.5,
      transform: "rotate(15 545 349.5)" }, cap);
    // A thin paper-coloured gap separates brim from dome, as in the original.
    el("path", { class: "cut", d: "M236,402 C262,388 288,384 312,387 C345,392 378,406 420,420 L712,517", "stroke-width": 18 }, cap);
    el("path", { class: "solid", id: "capBrim",
      d: "M207,470 C204,425 245,388 300,386 C340,386 380,405 420,420 L702,512 C716,518 714,532 698,532 L300,537 C250,537 210,512 207,470 Z" }, cap);

    parts.fringe = el("g", { id: "fringe" }, head);
    parts.fringe1 = el("path", { class: "solid", id: "fringeL",
      d: "M330,520 C328,548 352,572 380,568 C420,563 466,550 490,520 Z" }, parts.fringe);
    parts.fringe2 = el("path", { class: "solid", id: "fringeR",
      d: "M512,520 C518,548 555,570 590,568 C630,566 672,550 694,520 Z" }, parts.fringe);

    // ---- gesture arms, in front of the body so a hand can cross the chest
    parts.armL = el("g", { id: "gestureL" }, g);
    parts.armR = el("g", { id: "gestureR" }, g);

    parts.rig = el("g", { id: "rigOverlay", style: "display:none" }, g);
    return { svg, parts };
  }

  // A forearm and hand drawn in the same line style. Elbow at local (0,0),
  // forearm points up the -y axis, the hand sits on the wrist.
  function buildArm(parent, mirror) {
    const FOREARM = 560, W = 62;
    const arm = el("g", {}, parent);
    el("path", { class: "paper", d: `M${-W - 4},40 L${-W},${-FOREARM - 40} L${W},${-FOREARM - 40} L${W + 4},40 Z` }, arm);
    el("path", { class: "ink", d: `M${-W - 4},40 L${-W},${-FOREARM - 40} M${W},${-FOREARM - 40} L${W + 4},40` }, arm);
    const wrist = el("g", {}, arm);
    const hand = el("g", { transform: mirror ? "scale(-1,1)" : "" }, wrist);
    const fingers = [];
    // index, middle, ring, little: x at the knuckle and full length.
    // The thumb sits on the -x side, next to the index finger.
    const spec = [
      { x: -45, len: 76 }, { x: -15, len: 86 }, { x: 15, len: 80 }, { x: 45, len: 64 }
    ];
    // little finger first so the index overlaps it
    for (let i = spec.length - 1; i >= 0; i--) {
      const path = el("path", { class: "skin" }, hand);
      fingers[i] = { path, x: spec[i].x * HS, len: spec[i].len * HS };
    }
    const palm = "M-62,0 C-66,-50 -64,-95 -50,-110 L50,-110 C64,-95 66,-50 62,0 Z".replace(/-?\d+(\.\d+)?/g, (n) => f(n * HS));
    el("path", { class: "paper", d: palm }, hand);
    el("path", { class: "ink", d: "M-50,-110 C-64,-95 -66,-50 -62,0 M62,0 C66,-50 64,-95 50,-110".replace(/-?\d+(\.\d+)?/g, (n) => f(n * HS)) }, hand);
    // thumb last, so it can fold across the palm or stand up out of a fist
    const thumb = { path: el("path", { class: "skin" }, hand), len: 68 * HS };
    return { arm, wrist, hand, fingers, thumb, FOREARM };
  }

  // Finger capsule from the knuckle line. ext: 0 = curled stub, 1 = straight.
  function fingerPath(x, len, ext, spread) {
    const r = 14 * HS, base = -96 * HS;
    const L = Math.max(r * 1.4, len * (0.28 + 0.72 * ext));
    const tip = base - L;
    const lean = spread * (x / (45 * HS)) * 14;
    return `M${x - r},${base} L${f(x - r + lean)},${f(tip + r)} A${r},${r} 0 0 1 ${f(x + r + lean)},${f(tip + r)} L${x + r},${base}`;
  }
  function thumbPath(len, ext, up) {
    // up = 0: thumb folds across the palm side; 1: points straight up
    const L = len * (0.35 + 0.65 * ext) * (1 + 0.6 * up), r = 14 * HS;
    const ang = lerp(-60, -5, up) * DEG; // angle from vertical, leaning out to the left
    const bx = -50 * HS, by = -40 * HS;
    const dx = Math.sin(ang), dy = -Math.cos(ang);
    const nx = -dy, ny = dx;
    const tx = bx + dx * L, ty = by + dy * L;
    return `M${f(bx + nx * r)},${f(by + ny * r)} L${f(tx + nx * r)},${f(ty + ny * r)} A${r},${r} 0 0 0 ${f(tx - nx * r)},${f(ty - ny * r)} L${f(bx - nx * r)},${f(by - ny * r)}`;
  }

  // ------------------------------------------------------------ poses
  const EXPRESSIONS = {
    smile:     { smile: 1, open: 0, width: 1, happy: 0, eyeH: 1, brow: 0, browTilt: 0, browShow: 0, blush: 0 },
    neutral:   { smile: 0.25, open: 0, width: 0.9, happy: 0, eyeH: 1, brow: 0, browTilt: 0, browShow: 0, blush: 0 },
    happy:     { smile: 1.25, open: 0.32, width: 1.1, happy: 1, eyeH: 1, brow: 0, browTilt: 0, browShow: 0, blush: 1 },
    laugh:     { smile: 1.3, open: 0.75, width: 1.15, happy: 1, eyeH: 1, brow: -4, browTilt: 0, browShow: 0, blush: 1 },
    surprised: { smile: 0, open: 0.85, width: 0.62, happy: 0, eyeH: 1.3, brow: -14, browTilt: 0, browShow: 1, blush: 0 },
    sad:       { smile: -0.7, open: 0, width: 0.8, happy: 0, eyeH: 0.85, brow: -2, browTilt: 1, browShow: 1, blush: 0 },
    thinking:  { smile: 0.1, open: 0, width: 0.65, happy: 0, eyeH: 0.95, brow: -6, browTilt: -0.5, browShow: 1, blush: 0, lookX: 6, lookY: -7 },
    shy:       { smile: 0.8, open: 0, width: 0.75, happy: 0.35, eyeH: 0.9, brow: 0, browTilt: 0.4, browShow: 0, blush: 1, lookX: -4, lookY: 6 },
    sleepy:    { smile: 0.3, open: 0, width: 0.8, happy: 0, eyeH: 0.18, brow: 3, browTilt: 0, browShow: 0, blush: 0 },
    angry:     { smile: -0.4, open: 0, width: 0.85, happy: 0, eyeH: 0.9, brow: 4, browTilt: -1, browShow: 1, blush: 0 }
  };

  // Gesture poses: angle of forearm from vertical, wrist bend, finger extension
  // [index, middle, ring, little], thumb extension and how upright the thumb is.
  const GESTURES = {
    none:     { R: null, L: null },
    wave:     { R: { raise: 1, lift: 170, angle: -6, wrist: 0, fingers: [1, 1, 1, 1], spread: 1, thumb: 1, thumbUp: 0.2, waveAmp: 1 } },
    hi5:      { R: { raise: 1, lift: 120, angle: -3, wrist: 0, fingers: [1, 1, 1, 1], spread: 0.4, thumb: 1, thumbUp: 0.1 } },
    idea:     { R: { raise: 1, lift: 140, angle: -6, wrist: -6, fingers: [1, 0, 0, 0], spread: 0, thumb: 0, thumbUp: 0 } },
    thumbsUp: { R: { raise: 1, lift: 60, angle: -8, wrist: 10, fingers: [0, 0, 0, 0], spread: 0, thumb: 1, thumbUp: 1 } },
    think:    { L: { raise: 1, lift: 0, angle: 14, wrist: -10, fingers: [1, 0, 0, 0], spread: 0, thumb: 0, thumbUp: 0 } },
    cheer:    { R: { raise: 1, lift: 200, angle: -2, wrist: 0, fingers: [1, 1, 1, 1], spread: 1, thumb: 1, thumbUp: 0.2, waveAmp: 0.35 },
                L: { raise: 1, lift: 200, angle: -14, wrist: 0, fingers: [1, 1, 1, 1], spread: 1, thumb: 1, thumbUp: 0.2, waveAmp: 0.35 } },
    count2:   { R: { raise: 1, lift: 120, angle: -6, wrist: 0, fingers: [1, 1, 0, 0], spread: 0.9, thumb: 0, thumbUp: 0 } }
  };

  // Rough mouth shapes for lip sync: [open, width]
  const VISEME = {
    a: [0.8, 1.05], e: [0.5, 1.15], i: [0.32, 1.2], o: [0.7, 0.62], u: [0.45, 0.55],
    m: [0, 0.85], b: [0, 0.85], p: [0, 0.85], f: [0.14, 1], v: [0.14, 1],
    w: [0.35, 0.6], r: [0.3, 0.8], l: [0.35, 1], " ": [0, 1], ".": [0, 1], ",": [0, 1]
  };

  // ------------------------------------------------------------ agent hooks
  // Every rig point an agent may drive directly, with its range and meaning.
  // Names are stable; agents read this list through mascot_list_params.
  const PARAMS = {
    "mouth.smile":  { key: "smile", min: -1, max: 1.5, about: "Mouth curve: -1 frown, 0 flat, 1 resting smile, 1.4 big grin." },
    "mouth.open":   { key: "open", min: 0, max: 1, about: "Jaw opening: 0 closed line, 1 wide open." },
    "mouth.width":  { key: "width", min: 0.4, max: 1.3, about: "Mouth width: under 0.7 rounds the mouth into an O." },
    "eyes.open":    { key: "eyeH", min: 0.1, max: 1.4, about: "Eye height: 0.2 sleepy, 1 normal, 1.3 wide." },
    "eyes.happy":   { key: "happy", min: 0, max: 1, about: "Bends the eyes into smiling arcs." },
    "eyes.lookX":   { key: "lookX", min: -10, max: 10, about: "Gaze left (-) or right (+)." },
    "eyes.lookY":   { key: "lookY", min: -8, max: 8, about: "Gaze up (-) or down (+)." },
    "brows.show":   { key: "browShow", min: 0, max: 1, about: "Brow visibility; they are hidden at rest." },
    "brows.raise":  { key: "brow", min: -16, max: 6, about: "Brow height: negative raises, positive lowers." },
    "brows.tilt":   { key: "browTilt", min: -1, max: 1, about: "Inner brow tilt: +1 worried, -1 cross." },
    "cheeks.blush": { key: "blush", min: 0, max: 1, about: "Blush marks under the eyes." },
    "head.tilt":    { key: "tilt", min: -12, max: 12, about: "Head roll in degrees." },
    "head.turn":    { key: "turn", min: -12, max: 12, about: "Head turn left (-) or right (+); features slide for a 3/4 view." },
    "head.nod":     { key: "nod", min: -10, max: 16, about: "Head pitch: positive looks down." },
    "ears.perk":    { key: "earPerk", min: 0, max: 1, about: "Ears lift and flare." }
  };
  const FINGERS = ["index", "middle", "ring", "little"];
  for (const [side, S] of [["right", "R"], ["left", "L"]]) {
    PARAMS[`hand.${side}.raise`] = { key: "raise" + S, min: 0, max: 1, about: `Brings the ${side} arm into frame (0 hidden, 1 up).` };
    PARAMS[`hand.${side}.lift`] = { key: "lift" + S, min: 0, max: 220, about: "Extra height for the hand, in drawing px." };
    PARAMS[`hand.${side}.angle`] = { key: "angle" + S, min: -30, max: 40, about: "Forearm angle from vertical, in degrees." };
    PARAMS[`hand.${side}.wrist`] = { key: "wrist" + S, min: -45, max: 45, about: "Wrist bend, in degrees." };
    PARAMS[`hand.${side}.spread`] = { key: "spread" + S, min: 0, max: 1, about: "Finger spread." };
    PARAMS[`hand.${side}.thumb`] = { key: "thumb" + S, min: 0, max: 1, about: "Thumb extension." };
    PARAMS[`hand.${side}.thumbUp`] = { key: "thumbUp" + S, min: 0, max: 1, about: "Thumb angle: 0 out to the side, 1 straight up." };
    FINGERS.forEach((name, i) => {
      PARAMS[`hand.${side}.${name}`] = { key: `f${i}${S}`, min: 0, max: 1, about: `${name} finger: 0 curled, 1 straight.` };
    });
  }

  const ACTIONS = ["blink", "wink", "nod", "shakeHead", "wiggleEars", "hop", "poke"];

  // MCP-shaped tool definitions. The same list is served by mcp-server.mjs,
  // by rig.listen() over postMessage, and is callable in-page via rig.call().
  const TOOLS = [
    { name: "mascot_express", description: "Set the facial expression. Optionally return to the resting smile after hold_seconds.",
      inputSchema: { type: "object", properties: {
        expression: { type: "string", enum: Object.keys(EXPRESSIONS) },
        hold_seconds: { type: "number", minimum: 0 } }, required: ["expression"] } },
    { name: "mascot_gesture", description: "Play a hand gesture. 'none' lowers both hands. Optionally lower after hold_seconds.",
      inputSchema: { type: "object", properties: {
        gesture: { type: "string", enum: Object.keys(GESTURES) },
        hold_seconds: { type: "number", minimum: 0 } }, required: ["gesture"] } },
    { name: "mascot_say", description: "Speak a line with lip sync. Resolves when the line ends. speak=true also voices it with the browser's speech engine. expression and gesture are applied first.",
      inputSchema: { type: "object", properties: {
        text: { type: "string" }, speak: { type: "boolean" }, rate: { type: "number", minimum: 0.5, maximum: 2 },
        expression: { type: "string", enum: Object.keys(EXPRESSIONS) },
        gesture: { type: "string", enum: Object.keys(GESTURES) } }, required: ["text"] } },
    { name: "mascot_action", description: "Play a short one-shot action.",
      inputSchema: { type: "object", properties: { action: { type: "string", enum: ACTIONS } }, required: ["action"] } },
    { name: "mascot_look", description: "Point the gaze and head. x and y run from -1 (left/up) to 1 (right/down). release=true gives control back to the cursor and idle glances.",
      inputSchema: { type: "object", properties: {
        x: { type: "number", minimum: -1, maximum: 1 }, y: { type: "number", minimum: -1, maximum: 1 },
        release: { type: "boolean" } } } },
    { name: "mascot_set", description: "Low-level control. Set any rig points by name (see mascot_list_params); values ease in on springs and are held until released or overridden by an expression or gesture. release lists names to hand back, or true for all.",
      inputSchema: { type: "object", properties: {
        params: { type: "object", additionalProperties: { type: "number" } },
        release: { oneOf: [{ type: "boolean" }, { type: "array", items: { type: "string" } }] } } } },
    { name: "mascot_perform", description: "Run a timeline of tool calls in order. Each step is {tool, arguments, wait_seconds}. wait_seconds pauses after the step; mascot_say steps wait for the line to finish.",
      inputSchema: { type: "object", properties: {
        steps: { type: "array", items: { type: "object", properties: {
          tool: { type: "string" }, arguments: { type: "object" }, wait_seconds: { type: "number", minimum: 0 } }, required: ["tool"] } } },
        required: ["steps"] } },
    { name: "mascot_get_state", description: "Read the current expression, gesture, speaking status and every rig point's live value.",
      inputSchema: { type: "object", properties: {} } },
    { name: "mascot_list_params", description: "List every rig point that mascot_set accepts, with its range and meaning.",
      inputSchema: { type: "object", properties: {} } }
  ];

  // ------------------------------------------------------------ the runtime
  class MascotRig {
    constructor(container, options = {}) {
      this.opts = Object.assign({ follow: true, idle: true, reducedMotion: undefined }, options);
      if (this.opts.reducedMotion === undefined) {
        this.opts.reducedMotion = !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
      }
      const { svg, parts } = buildSVG();
      this.svg = svg; this.parts = parts;
      container.appendChild(svg);

      this.arms = {
        R: Object.assign(buildArm(parts.armR, false), { elbow: P.elbowR }),
        L: Object.assign(buildArm(parts.armL, true), { elbow: P.elbowL })
      };

      const S = (v, k, d) => new Spring(v, k, d);
      this.s = {
        // face
        smile: S(1, 140, 18), open: S(0, 320, 26), width: S(1, 160, 18),
        happy: S(0, 140, 18), eyeH: S(1, 160, 18), blink: S(1, 900, 40),
        winkL: S(1, 500, 30), winkR: S(1, 500, 30),
        lookX: S(0, 200, 22), lookY: S(0, 200, 22),
        brow: S(0, 140, 16), browTilt: S(0, 140, 16), browShow: S(0, 120, 18), blush: S(0, 60, 14),
        // head and body
        tilt: S(0, 90, 12), turn: S(0, 90, 14), nod: S(0, 160, 14), hop: S(0, 180, 12),
        earL: S(0, 260, 9), earR: S(0, 260, 9), earPerk: S(0, 120, 14),
        fringe: S(0, 70, 5), lock: S(0, 60, 4), button: S(0, 160, 6)
      };
      for (const side of ["R", "L"]) {
        this.s["raise" + side] = S(0, 70, 13);
        this.s["lift" + side] = S(0, 70, 13);
        this.s["angle" + side] = S(0, 90, 13);
        this.s["wrist" + side] = S(0, 120, 12);
        this.s["spread" + side] = S(0, 120, 14);
        this.s["thumb" + side] = S(1, 160, 16);
        this.s["thumbUp" + side] = S(0, 160, 16);
        for (let i = 0; i < 4; i++) this.s[`f${i}${side}`] = S(1, 180, 15);
      }

      this.expression = "smile";
      this.gestureName = "none";
      this.pointer = null;
      this.talk = null;
      this.mouthOverride = null;
      this.t = 0;
      this.nextBlink = 1.5 + Math.random() * 2;
      this.nextSaccade = 0.8;
      this.nextTwitch = 4 + Math.random() * 5;
      this.saccade = [0, 0];
      this.wavePhase = 0;
      this.shake = 0;
      this.timers = [];
      this.held = {};       // rig keys an agent has pinned with set()
      this.listeners = {};  // event name -> handlers

      this._onMove = (e) => this._pointer(e);
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
      for (const k of ["smile", "open", "width", "happy", "eyeH", "brow", "browTilt", "browShow", "blush"]) {
        instant ? this.s[k].snap(e[k]) : this.s[k].set(e[k]);
        delete this.held[k];
      }
      this.exprLook = [e.lookX || 0, e.lookY || 0];
      if (name === "happy" || name === "laugh") this.wiggleEars();
      if (name === "surprised") { this.s.earPerk.set(1); this.s.hop.kick(-260); }
      else this.s.earPerk.set(0);
      if (name === "sad") this.s.tilt.set(-4); else if (name === "thinking") this.s.tilt.set(5); else if (name === "shy") this.s.tilt.set(-6); else this.s.tilt.set(0);
      this.s.nod.set(name === "sad" ? 10 : name === "shy" ? 6 : 0);
      // A newer expression always cancels an older one's timed return.
      clearTimeout(this._exprHold);
      if (hold) this._exprHold = setTimeout(() => this.express("smile"), hold * 1000);
      this._emit("state", this.getState());
      return this;
    }

    gesture(name, { hold = 0 } = {}) {
      const g = GESTURES[name];
      if (!g) return this;
      this.gestureName = name;
      for (const side of ["R", "L"]) {
        const p = g[side];
        if (!p) { this.s["raise" + side].set(0); continue; }
        for (const k of ["raise", "lift", "angle", "wrist", "spread", "thumb", "thumbUp", "f0", "f1", "f2", "f3"]) delete this.held[k + side];
        this.s["raise" + side].set(p.raise);
        this.s["lift" + side].set(p.lift || 0);
        this.s["angle" + side].set(p.angle);
        this.s["wrist" + side].set(p.wrist);
        this.s["spread" + side].set(p.spread);
        this.s["thumb" + side].set(p.thumb);
        this.s["thumbUp" + side].set(p.thumbUp);
        p.fingers.forEach((v, i) => this.s[`f${i}${side}`].set(v));
      }
      this.waveAmps = { R: g.R?.waveAmp || 0, L: g.L?.waveAmp || 0 };
      if (name === "think") this.express("thinking");
      if (name === "cheer") this.express("laugh");
      if (name === "wave" || name === "hi5") this.express("happy");
      if (name === "thumbsUp") this.express("happy");
      clearTimeout(this._gestureHold);
      if (hold) this._gestureHold = setTimeout(() => { this.gesture("none"); this.express("smile"); }, hold * 1000);
      this._emit("state", this.getState());
      return this;
    }

    blink() { this.s.blink.snap(1).set(0); this._later(0.09, () => this.s.blink.set(1)); return this; }
    wink(side = "R") {
      const s = this.s["wink" + side];
      s.set(0); this.s.smile.kick(4);
      this._later(0.35, () => s.set(1));
      return this;
    }
    nod(times = 2) {
      for (let i = 0; i < times; i++) {
        this._later(i * 0.42, () => this.s.nod.set(14));
        this._later(i * 0.42 + 0.2, () => this.s.nod.set(0));
      }
      return this;
    }
    shakeHead(times = 3) { this.shake = times * 0.35; return this; }
    wiggleEars() {
      [0, 0.12, 0.24, 0.36].forEach((t, i) => this._later(t, () => {
        this.s.earL.kick(i % 2 ? 90 : -90); this.s.earR.kick(i % 2 ? -90 : 90);
      }));
      return this;
    }
    hop() { this.s.hop.kick(-420); return this; }
    poke() {
      const prev = this.expression === "laugh" ? "smile" : this.expression;
      this.express("laugh"); this.hop();
      this._later(1.1, () => this.express(prev === "laugh" ? "smile" : prev));
      return this;
    }

    // Eyes and head look toward a point in page coordinates; null releases.
    lookAt(clientX, clientY) {
      if (clientX == null) { this.pointer = null; return this; }
      this.pointer = [clientX, clientY];
      return this;
    }
    follow(on) {
      this.opts.follow = !!on;
      root.removeEventListener("pointermove", this._onMove);
      if (on) root.addEventListener("pointermove", this._onMove, { passive: true });
      else this.pointer = null;
      return this;
    }

    // Lip-sync to text. Returns a promise that resolves when the line ends.
    // Pass { speak: true } to also voice it with the browser's speech engine.
    say(text, { speak = false, rate = 1, voice } = {}) {
      this.stopTalking();
      const chars = String(text).toLowerCase().split("");
      const per = 0.068 / rate;
      return new Promise((resolve) => {
        const done = () => {
          this.talk = null; this.s.open.set(EXPRESSIONS[this.expression].open);
          this._emit("speechend", { text }); resolve();
        };
        this.talk = { chars, per, t: 0, done };
        this._emit("speechstart", { text });
        if (speak && root.speechSynthesis && root.SpeechSynthesisUtterance) {
          try {
            const u = new SpeechSynthesisUtterance(text);
            u.rate = rate; if (voice) u.voice = voice;
            // Sync the mouth to the engine's word boundaries when it reports them.
            u.onboundary = (ev) => { if (this.talk) this.talk.t = ev.charIndex * per; };
            u.onend = () => { if (this.talk) this.talk.t = 1e9; };
            this.talk.utterance = u;
            this.talk.waitForVoice = true;
            root.speechSynthesis.cancel();
            root.speechSynthesis.speak(u);
          } catch (_) { /* speech is optional */ }
        }
      });
    }
    stopTalking() {
      if (this.talk) {
        if (this.talk.utterance && root.speechSynthesis) root.speechSynthesis.cancel();
        const d = this.talk.done; this.talk = null; d();
      }
      return this;
    }
    // Drive the mouth from an external level (0..1), e.g. a TTS stream.
    setMouthOpen(level) { this.mouthOverride = level == null ? null : clamp(level, 0, 1); return this; }
    // Lip-sync to an <audio> element using Web Audio loudness.
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

    showRig(on = true) {
      const g = this.parts.rig;
      g.style.display = on ? "" : "none";
      if (on && !g.childNodes.length) this._drawRig();
      return this;
    }

    // ---------------------------------------------- agent-facing API
    // Pin rig points by name, e.g. set({"mouth.open": 0.6, "head.tilt": -5}).
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
      return {
        expression: this.expression, gesture: this.gestureName, speaking: !!this.talk,
        held: Object.keys(PARAMS).filter((n) => PARAMS[n].key in this.held), params
      };
    }
    on(event, fn) { (this.listeners[event] ||= []).push(fn); return () => this.off(event, fn); }
    off(event, fn) { this.listeners[event] = (this.listeners[event] || []).filter((h) => h !== fn); }
    _emit(event, detail) { for (const h of this.listeners[event] || []) { try { h(detail); } catch (_) { /* a listener must not stop the rig */ } } }

    // Execute one MCP-style tool call. Always resolves to a JSON-safe result.
    async call(name, args = {}) {
      this._emit("command", { name, arguments: args });
      const fail = (message) => ({ ok: false, error: message });
      try {
        switch (name) {
          case "mascot_express":
            if (!EXPRESSIONS[args.expression]) return fail(`Unknown expression "${args.expression}". Use one of: ${Object.keys(EXPRESSIONS).join(", ")}.`);
            this.express(args.expression, { hold: args.hold_seconds || 0 });
            break;
          case "mascot_gesture":
            if (!GESTURES[args.gesture]) return fail(`Unknown gesture "${args.gesture}". Use one of: ${Object.keys(GESTURES).join(", ")}.`);
            this.gesture(args.gesture, { hold: args.hold_seconds || 0 });
            break;
          case "mascot_say":
            if (typeof args.text !== "string" || !args.text.trim()) return fail("text is required.");
            if (args.expression && EXPRESSIONS[args.expression]) this.express(args.expression);
            if (args.gesture && GESTURES[args.gesture]) this.gesture(args.gesture);
            await this.say(args.text, { speak: !!args.speak, rate: args.rate || 1 });
            break;
          case "mascot_action":
            if (!ACTIONS.includes(args.action)) return fail(`Unknown action "${args.action}". Use one of: ${ACTIONS.join(", ")}.`);
            this[args.action]();
            break;
          case "mascot_look":
            if (args.release) { this.release(["eyes.lookX", "eyes.lookY", "head.turn"]); break; }
            this.set({
              "eyes.lookX": clamp(+args.x || 0, -1, 1) * 9, "eyes.lookY": clamp(+args.y || 0, -1, 1) * 7,
              "head.turn": clamp(+args.x || 0, -1, 1) * 10
            });
            break;
          case "mascot_set": {
            if (args.release) this.release(args.release);
            const unknown = args.params ? this.set(args.params) : [];
            if (unknown.length) {
              this._emit("state", this.getState());
              return Object.assign(fail(`Ignored unknown or non-numeric params: ${unknown.join(", ")}. Call mascot_list_params for valid names.`), { state: this.getState() });
            }
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
          case "mascot_get_state":
            break;
          case "mascot_list_params":
            return { ok: true, params: Object.fromEntries(Object.entries(PARAMS).map(([n, p]) => [n, { min: p.min, max: p.max, about: p.about }])) };
          default:
            return fail(`Unknown tool "${name}".`);
        }
      } catch (err) {
        return fail(String(err && err.message || err));
      }
      const state = this.getState();
      this._emit("state", state);
      return { ok: true, state };
    }

    // Answer MCP-style JSON-RPC over postMessage (iframes, extensions, parent apps).
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

    _pointer(e) { this.pointer = [e.clientX, e.clientY]; }

    _pointerInSvg() {
      if (!this.pointer) return null;
      const r = this.svg.getBoundingClientRect();
      if (!r.width) return null;
      const [vx, vy, vw, vh] = VIEWBOX.split(" ").map(Number);
      return [vx + ((this.pointer[0] - r.left) / r.width) * vw, vy + ((this.pointer[1] - r.top) / r.height) * vh];
    }

    _tick(now) {
      const dt = Math.min(0.05, (now - this._last) / 1000);
      this._last = now; this.t += dt;
      this._behave(dt);
      for (const k in this.s) this.s[k].step(dt);
      this._render();
      this._raf = requestAnimationFrame((t) => this._tick(t));
    }

    // Autonomous life: blinking, eye darts, breathing, ear twitches, lip sync.
    _behave(dt) {
      const s = this.s, calm = this.opts.reducedMotion;

      if (this.opts.idle) {
        this.nextBlink -= dt;
        if (this.nextBlink <= 0) {
          this.blink();
          if (Math.random() < 0.18) this._later(0.22, () => this.blink());
          this.nextBlink = 2 + Math.random() * 4;
        }
        this.nextSaccade -= dt;
        if (this.nextSaccade <= 0) {
          this.saccade = [(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4];
          this.nextSaccade = 0.6 + Math.random() * 2.2;
        }
        this.nextTwitch -= dt;
        if (this.nextTwitch <= 0 && !calm) {
          (Math.random() < 0.5 ? s.earL : s.earR).kick(Math.random() < 0.5 ? 70 : -70);
          this.nextTwitch = 5 + Math.random() * 7;
        }
      }

      // Where to look: pointer first, then expression, then idle darts.
      let lx = this.saccade[0], ly = this.saccade[1], turn = 0, tiltFromLook = 0;
      const p = this._pointerInSvg();
      if (p && this.opts.follow) {
        const dx = (p[0] - 600) / 420, dy = (p[1] - 640) / 420;
        lx = clamp(dx, -1, 1) * 9; ly = clamp(dy, -1, 1) * 7;
        turn = clamp(dx, -1, 1) * 10; tiltFromLook = clamp(dx, -1, 1) * 2.5;
      }
      if (this.exprLook && (this.exprLook[0] || this.exprLook[1]) && !p) { lx = this.exprLook[0]; ly = this.exprLook[1]; }
      const want = (k, v) => { if (!(k in this.held)) s[k].set(v); };
      want("lookX", lx); want("lookY", ly);
      if (this.shake > 0) {
        this.shake -= dt;
        turn += Math.sin(this.t * 22) * 14 * clamp(this.shake * 3, 0, 1);
      }
      want("turn", turn);
      this.tiltFromLook = tiltFromLook;

      // Mouth: text lip sync, external level, or the expression's resting shape.
      const e = EXPRESSIONS[this.expression];
      if (this.talk) {
        const tk = this.talk;
        tk.t += dt;
        const i = Math.floor(tk.t / tk.per);
        if (i >= tk.chars.length && !(tk.waitForVoice && tk.t < 1e8 && root.speechSynthesis?.speaking)) { tk.done(); }
        else {
          const ch = tk.chars[Math.min(i, tk.chars.length - 1)] || " ";
          const v = VISEME[ch] || (/[a-z0-9]/.test(ch) ? [0.38, 0.95] : [0, 1]);
          s.open.set(Math.max(v[0], e.open * 0.5));
          delete this.held.open;
          s.width.set(lerp(e.width, v[1], 0.8));
          if (ch === "!" || ch === "?") s.brow.set(-8);
        }
      } else if (this._analyser || this.mouthOverride != null) {
        const lvl = this._analyser ? this._analyser() : this.mouthOverride;
        s.open.set(lvl * 0.85); s.width.set(lerp(e.width, 0.9, lvl));
      } else {
        want("width", e.width);
      }

      // Secondary motion: hair, cap button and ears lag behind head velocity.
      const headVel = s.tilt.velocity + s.turn.velocity * 0.6 + s.nod.velocity * 0.3;
      s.fringe.set(-headVel * 0.12);
      s.lock.set(-headVel * 0.16);
      s.button.set(-headVel * 0.25 - s.hop.velocity * 0.012);

      // Arms: waving oscillation layered on the pose.
      this.wavePhase += dt * (calm ? 3 : 9);
    }

    _render() {
      const s = this.s, parts = this.parts, t = this.t, calm = this.opts.reducedMotion;

      // Breathing: torso scales from its bottom edge, head rides on top.
      const breath = calm ? 0 : Math.sin(t * 1.6) * 0.5 + 0.5;
      const sy = 1 + breath * 0.008;
      const [bpx, bpy] = P.bodyPivot;
      parts.body.setAttribute("transform", `translate(0 ${f(bpy * (1 - sy))}) scale(1 ${sy.toFixed(4)})`);
      const rise = (P.neckBaseR[1] - bpy) * (sy - 1); // negative = up

      // Head: idle sway + tilt + nod + hop + turn parallax.
      const sway = calm ? 0 : Math.sin(t * 0.7) * 1.2 + Math.sin(t * 1.3 + 1) * 0.6;
      const tilt = s.tilt.value + sway + (this.tiltFromLook || 0) + s.turn.value * 0.08;
      const hop = s.hop.value * 0.06;
      const hx = s.turn.value * 0.6;
      const hy = rise + s.nod.value * 0.9 + Math.min(0, hop * 10);
      const [hpx, hpy] = P.headPivot;
      parts.head.setAttribute("transform", `translate(${f(hx)} ${f(hy)}) rotate(${f(tilt)} ${hpx} ${hpy})`);
      const headPt = ([x, y]) => { const [rx, ry] = rot(x, y, hpx, hpy, tilt); return [rx + hx, ry + hy]; };

      // Features slide further than the skull to fake a 3/4 turn.
      parts.face.setAttribute("transform", `translate(${f(s.turn.value * 1.1)} ${f(s.nod.value * 0.8)})`);
      // Cap and hair lag a little behind for weight.
      parts.cap.setAttribute("transform", `translate(${f(-s.turn.value * 0.25)} ${f(-s.nod.value * 0.2)})`);

      // Neck joins the moving head to the breathing body.
      const nl = headPt(P.neckL), nr = headPt(P.neckR);
      const bl = [P.neckBaseL[0], P.neckBaseL[1] + rise], br = [P.neckBaseR[0], P.neckBaseR[1] + rise];
      parts.neck.setAttribute("d", `M${f(nl[0])},${f(nl[1])} L${f(bl[0])},${f(bl[1])} M${f(nr[0])},${f(nr[1])} L${f(br[0])},${f(br[1])}`);

      parts.fringe1.setAttribute("transform", `rotate(${f(s.fringe.value * 0.8)} 410 522)`);
      parts.fringe2.setAttribute("transform", `rotate(${f(s.fringe.value * 0.7)} 600 522)`);
      parts.lock.setAttribute("transform", `rotate(${f(s.lock.value)} ${P.lock[0]} ${P.lock[1]})`);
      parts.button.setAttribute("transform", `translate(0 ${f(s.button.value * 0.4)}) rotate(${f(s.button.value * 1.5)} 860 300)`);
      const perk = s.earPerk.value;
      parts.earL.setAttribute("transform", `rotate(${f(s.earL.value * 0.25 - perk * 6)} ${P.earL[0]} ${P.earL[1]}) translate(0 ${f(-perk * 6)})`);
      parts.earR.setAttribute("transform", `rotate(${f(s.earR.value * 0.25 + perk * 6)} ${P.earR[0]} ${P.earR[1]}) translate(0 ${f(-perk * 6)})`);

      // Eyes: vertical strokes that bend into happy arcs, blink and look.
      const lx = s.lookX.value, ly = s.lookY.value;
      const open = clamp(s.blink.value, 0, 1);
      const eye = (cx, cy, wink) => {
        const k = clamp(s.happy.value, 0, 1);
        const h = 21 * s.eyeH.value * Math.max(0.04, open * wink);
        const x = cx + lx, y = cy + ly;
        // neutral: straight vertical line; happy: upside-down U
        const ax = lerp(x, x - 17, k), ay = lerp(y - h, y + 5, k);
        const bx = lerp(x, x + 17, k), by = lerp(y + h, y + 5, k);
        const qx = x, qy = lerp(y, y - 16 * Math.max(0.15, open * wink) - 4, k);
        return `M${f(ax)},${f(ay)} Q${f(qx)},${f(qy)} ${f(bx)},${f(by)}`;
      };
      parts.eyeL.setAttribute("d", eye(P.eyeL[0], P.eyeL[1], clamp(s.winkL.value, 0, 1)));
      parts.eyeR.setAttribute("d", eye(P.eyeR[0], P.eyeR[1], clamp(s.winkR.value, 0, 1)));

      // Brows only show when an expression needs them.
      const bshow = clamp(s.browShow.value, 0, 1);
      const brow = (cx, inner) => {
        const y = 582 + s.brow.value + ly * 0.4, x = cx + lx * 0.6;
        const tiltY = s.browTilt.value * 8;
        const yi = y - tiltY, yo = y + tiltY * 0.4;
        const xi = x + inner * 16, xo = x - inner * 16;
        return `M${f(xo)},${f(yo)} Q${f(x)},${f(Math.min(yi, yo) - 5)} ${f(xi)},${f(yi)}`;
      };
      parts.browL.setAttribute("d", brow(P.eyeL[0], 1));
      parts.browR.setAttribute("d", brow(P.eyeR[0], -1));
      parts.browL.setAttribute("opacity", bshow.toFixed(2));
      parts.browR.setAttribute("opacity", bshow.toFixed(2));
      parts.blush.setAttribute("opacity", clamp(s.blush.value, 0, 1).toFixed(2));

      // Mouth: one closed path; a line when shut, a filled shape when open.
      const hw = 41 * s.width.value;
      const sm = s.smile.value, op = clamp(s.open.value, 0, 1.2);
      const round = clamp(1 - s.width.value, 0, 0.6);
      const upper = 34 * sm * (1 - op * 0.5) - op * (10 + 40 * round);
      const lower = 34 * sm + op * 64;
      const corner = -sm * 3;
      const [mx, my] = [P.mouth[0] + lx * 0.5, P.mouth[1] + ly * 0.3];
      const M = (x, y) => rot(mx + x, my + y, mx, my, P.mouthTilt).map(f).join(",");
      parts.mouth.setAttribute("d",
        `M${M(-hw, corner)} Q${M(0, upper)} ${M(hw, corner)} Q${M(0, lower)} ${M(-hw, corner)} Z`);

      // Gesture arms.
      for (const side of ["R", "L"]) this._renderArm(side);
    }

    _renderArm(side) {
      const s = this.s, A = this.arms[side];
      const raise = s["raise" + side].value;
      const amp = (this.waveAmps && this.waveAmps[side]) || 0;
      const wave = this.opts.reducedMotion ? 0 : Math.sin(this.wavePhase + (side === "L" ? Math.PI : 0)) * amp;
      // Hidden pose swings the forearm down and out of the frame.
      const hiddenAngle = side === "R" ? 40 : -40;
      const angle = lerp(hiddenAngle, s["angle" + side].value + wave * 9, clamp(raise, 0, 1));
      const drop = (1 - clamp(raise, 0, 1)) * 260 - s["lift" + side].value * clamp(raise, 0, 1);
      const [ex, ey] = A.elbow;
      A.arm.setAttribute("transform", `translate(${ex} ${f(ey + drop)}) rotate(${f(angle)})`);
      A.wrist.setAttribute("transform", `translate(0 ${-A.FOREARM}) rotate(${f(s["wrist" + side].value + wave * 14)})`);
      const spread = s["spread" + side].value;
      A.fingers.forEach((fg, i) => {
        const wiggle = amp && !this.opts.reducedMotion ? Math.sin(this.wavePhase * 1.3 + i) * 0.04 : 0;
        fg.path.setAttribute("d", fingerPath(fg.x, fg.len, clamp(s[`f${i}${side}`].value + wiggle, 0, 1), spread));
      });
      A.thumb.path.setAttribute("d", thumbPath(A.thumb.len, clamp(s["thumb" + side].value, 0, 1), clamp(s["thumbUp" + side].value, 0, 1)));
      A.arm.style.display = raise < 0.01 ? "none" : "";
    }

    // Labels every movable part with its pivot, for designers and developers.
    _drawRig() {
      const g = this.parts.rig;
      const items = [
        ["head", P.headPivot, 760, 900], ["eyeL", P.eyeL, 250, 600], ["eyeR", P.eyeR, 640, 560],
        ["mouth", P.mouth, 470, 790], ["earL", P.earL, 220, 700], ["earR", P.earR, 900, 780],
        ["fringe", [410, 545], 250, 520], ["hairLock", [752, 640], 860, 600],
        ["capButton", P.button, 900, 210], ["neck", [628, 930], 760, 960],
        ["body", [620, 1150], 700, 1180], ["gestureL", [430, 1400], 200, 1420], ["gestureR", [960, 1380], 1000, 1300]
      ];
      for (const [name, [x, y], tx, ty] of items) {
        el("path", { class: "rig-line", d: `M${x},${y} L${tx},${ty}` }, g);
        el("circle", { class: "rig-dot", cx: x, cy: y, r: 8 }, g);
        el("text", { class: "rig", x: tx + (tx < x ? -6 : 6), y: ty - 6, "text-anchor": tx < x ? "end" : "start" }, g).textContent = name;
      }
    }
  }

  // Connect a mounted rig to mcp-server.mjs so MCP clients (Claude, other
  // agents) can drive it. Commands arrive over Server-Sent Events and results
  // go back with a POST. Returns a function that disconnects.
  function connect(rig, url = "http://localhost:4545") {
    if (!root.EventSource) return () => {};
    const base = url.replace(/\/$/, "");
    const es = new EventSource(base + "/events");
    es.onmessage = async (ev) => {
      let cmd;
      try { cmd = JSON.parse(ev.data); } catch (_) { return; }
      const result = await rig.call(cmd.name, cmd.arguments || {});
      fetch(base + "/result", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: cmd.id, result }) })
        .catch(() => {});
    };
    return () => es.close();
  }

  const api = {
    mount: (container, options) => new MascotRig(container, options),
    connect,
    expressions: Object.keys(EXPRESSIONS),
    gestures: Object.keys(GESTURES),
    actions: ACTIONS,
    params: PARAMS,
    tools: TOOLS,
    pivots: P
  };
  root.Mascot = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
