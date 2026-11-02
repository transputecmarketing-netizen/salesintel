// Shared building blocks for the extra boards (Mega, Nano, ESP32, Pico,
// Jetson): PCB slabs, silkscreen layers, header strips, SMD chips, LEDs,
// buttons and connectors. Units are centimetres, y is up, parts are built
// with their bottom at y=0 so a board can drop them onto its PCB top.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, mesh, box, cyl, at, canvasTexture, roundedRectShape, slab, glowSprite } from '../kit.js';

export const PITCH = 0.254;
export const FEMALE_H = 0.85; // female header height (matches board.js)
export const MALE_BASE_H = 0.25; // plastic strip of a male header
export const MALE_TIP = 0.85; // pin tip height above the PCB top
export const SILK = '#eef0f6';
export const FONT = '"Barlow Semi Condensed", sans-serif';
export const MONO = '"IBM Plex Mono", monospace';

const UP = new THREE.Vector3(0, 1, 0);

/** Material with a texture map, built directly (kit.mat() would JSON-serialise the texture). */
export function texMat(map, opts = {}) {
  return new THREE.MeshStandardMaterial({
    map,
    color: opts.color ?? 0xffffff,
    roughness: opts.rough ?? 0.6,
    metalness: opts.metal ?? 0,
    transparent: !!opts.transparent,
    side: opts.side ?? THREE.FrontSide,
  });
}

export const pinMetal = () => mat(0xd9d4c2, { rough: 0.3, metal: 0.65 });
export const shellMetal = () => mat(0xd4d2cb, { rough: 0.32, metal: 0.6 });
export const blackPlastic = () => mat(0x23262e, { rough: 0.8 });

// ---------------------------------------------------------------- RNG
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- PCB
/**
 * FR4 core + coloured solder-mask slab with optional mounting holes.
 * holes: [[x, z, r]]. Returns the y of the PCB top surface.
 */
export function makePCB(g, { w, d, color, radius = 0.15, holes = [], baseT = 0.05, thick = 0.12, shape, ringColor = 0xd9d5c8 }) {
  const sh = shape ?? roundedRectShape(w, d, radius);
  for (const [hx, hz, r = 0.16] of holes) {
    const hole = new THREE.Path();
    hole.absarc(hx, -hz, r, 0, Math.PI * 2, true);
    sh.holes.push(hole);
  }
  g.add(slab(sh, baseT, mat(0xe2cfa5, { rough: 0.9 })));
  const p = slab(sh, thick, mat(color, { rough: 0.55 }));
  p.position.y = baseT;
  g.add(p);
  const top = baseT + thick;
  for (const [hx, hz, r = 0.16] of holes) {
    const ring = mesh(new THREE.RingGeometry(r, r * 1.6, 24), mat(ringColor, { metal: 0.4, rough: 0.4 }), { outline: false });
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(hx, top + 0.002, hz);
    g.add(ring);
  }
  return top;
}

/**
 * Transparent silkscreen layer covering the board. draw(ctx, t) where
 * t = { px(x), pz(z), s (px per cm), cw, ch } maps board cm to canvas px.
 */
export function makeSilk(g, w, d, top, draw, res = 2048) {
  const s = res / Math.max(w, d);
  const cw = Math.round(w * s), ch = Math.round(d * s);
  const px = (x) => (x + w / 2) * s;
  const pz = (z) => (z + d / 2) * s;
  const tex = canvasTexture(cw, ch, (ctx) => {
    ctx.clearRect(0, 0, cw, ch);
    ctx.lineCap = ctx.lineJoin = 'round';
    draw(ctx, { px, pz, s, cw, ch });
  });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = top + 0.003;
  m.receiveShadow = true;
  g.add(m);
  return m;
}

/** Text on a silkscreen canvas. size is in px. */
export function text(ctx, str, x, y, { size, weight = 600, align = 'center', baseline = 'middle', rot = 0, maxW, color = SILK, mono = false } = {}) {
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.font = `${weight} ${size}px ${mono ? MONO : FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (maxW) ctx.fillText(str, 0, 0, maxW);
  else ctx.fillText(str, 0, 0);
  ctx.restore();
}

/** Procedural copper traces (Manhattan + 45°) with vias, clipped to rects. */
export function drawTraces(ctx, t, { rects, n = 30, seed = 7, color = 'rgba(120,150,220,.32)', via = 'rgba(200,210,235,.5)', width = 0.05 }) {
  const r = rng(seed);
  const { px, pz, s } = t;
  ctx.strokeStyle = color;
  ctx.lineWidth = width * s;
  const ends = [];
  for (let i = 0; i < n; i++) {
    const [x0, z0, x1, z1] = rects[i % rects.length];
    let x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0);
    const pts = [[x, z]];
    let dir = Math.floor(r() * 8);
    const segs = 2 + Math.floor(r() * 3);
    for (let k = 0; k < segs; k++) {
      const len = 0.15 + r() * (k === 1 ? 1.2 : 0.5);
      const a = (dir * Math.PI) / 4;
      x = Math.min(x1, Math.max(x0, x + Math.cos(a) * len));
      z = Math.min(z1, Math.max(z0, z + Math.sin(a) * len));
      pts.push([x, z]);
      dir = (dir + (r() > 0.5 ? 1 : 7)) % 8; // turn 45°
    }
    ctx.beginPath();
    pts.forEach(([a, b], j) => (j ? ctx.lineTo(px(a), pz(b)) : ctx.moveTo(px(a), pz(b))));
    ctx.stroke();
    ends.push(pts[0], pts[pts.length - 1]);
  }
  ctx.fillStyle = via;
  for (const [a, b] of ends) {
    if (r() > 0.55) continue;
    ctx.beginPath();
    ctx.arc(px(a), pz(b), width * 1.4 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Copper / gold pad (filled rounded rect or circle) on the silk layer. */
export function pad(ctx, t, x, z, w, d = w, { round = false, color = '#d6b46a', hole = false } = {}) {
  const { px, pz, s } = t;
  ctx.fillStyle = color;
  ctx.beginPath();
  if (round) ctx.arc(px(x), pz(z), (w / 2) * s, 0, Math.PI * 2);
  else ctx.roundRect(px(x - w / 2), pz(z - d / 2), w * s, d * s, 0.02 * s);
  ctx.fill();
  if (hole) {
    ctx.fillStyle = '#16171b';
    ctx.beginPath();
    ctx.arc(px(x), pz(z), w * 0.25 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Outline box drawn on the silk (component courtyard). */
export function outline(ctx, t, x, z, w, d, lw = 0.025) {
  const { px, pz, s } = t;
  ctx.strokeStyle = SILK;
  ctx.lineWidth = lw * s;
  ctx.strokeRect(px(x - w / 2), pz(z - d / 2), w * s, d * s);
}

// ---------------------------------------------------------------- headers
let cellTex;
function cellMaterial(rx, ry, hole = false) {
  cellTex ??= canvasTexture(64, 64, (ctx) => {
    ctx.fillStyle = '#2a2d36';
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = '#15161b';
    ctx.lineWidth = 5;
    ctx.strokeRect(2.5, 2.5, 59, 59);
  });
  const tx = cellTex.clone();
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.repeat.set(rx, ry);
  tx.needsUpdate = true;
  return texMat(tx, { rough: 0.8 });
}

/** Black plastic strip of a male header (cols along x, rows along z). */
export function headerBase(cols, rows = 1) {
  const top = cellMaterial(cols, rows);
  const sx = cellMaterial(rows, 1);
  const sz = cellMaterial(cols, 1);
  const m = mesh(new THREE.BoxGeometry(cols * PITCH, MALE_BASE_H, rows * PITCH), [sx, sx, top, top, sz, sz]);
  m.position.y = MALE_BASE_H / 2;
  return m;
}

let pinGeom;
function malePinGeometry() {
  if (pinGeom) return pinGeom;
  const shaftH = MALE_TIP - 0.05;
  const shaft = new THREE.CylinderGeometry(0.046, 0.046, shaftH, 4);
  shaft.rotateY(Math.PI / 4);
  shaft.translate(0, shaftH / 2, 0);
  const tip = new THREE.CylinderGeometry(0.018, 0.046, 0.05, 4);
  tip.rotateY(Math.PI / 4);
  tip.translate(0, shaftH + 0.025, 0);
  pinGeom = mergeGeometries([shaft.toNonIndexed(), tip.toNonIndexed()]);
  pinGeom.computeVertexNormals();
  return pinGeom;
}

/** All male pins of a board as one InstancedMesh. pts: [[x, z]] in board coords. */
export function pinField(pts, top, material = pinMetal()) {
  const im = new THREE.InstancedMesh(malePinGeometry(), material, pts.length);
  const m = new THREE.Matrix4();
  pts.forEach(([x, z], i) => im.setMatrixAt(i, m.makeTranslation(x, top, z)));
  im.castShadow = true;
  im.receiveShadow = true;
  im.instanceMatrix.needsUpdate = true;
  return im;
}

/** Simple 2-row male header group (used for ICSP etc.). Pins included. */
export function smallMaleHeader(cols, rows) {
  const g = new THREE.Group();
  g.add(headerBase(cols, rows));
  const pts = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) pts.push([(c - (cols - 1) / 2) * PITCH, (r - (rows - 1) / 2) * PITCH]);
  g.add(pinField(pts, 0));
  return g;
}

// ---------------------------------------------------------------- chips
/**
 * Generic SMD IC: black body with a printed top, gull-wing legs on the
 * ±z sides (legsX per side, spread along x) and ±x sides (legsZ per side).
 * lines: [{ t, size, y, weight }] with size / y as fractions of the top height.
 */
export function chipIC({ w, d = w, h = 0.1, legsX = 0, legsZ = 0, legLen = 0.08, legW = 0.026, pitch, lines = [], color = 0x1d1e23, dot = true, res = 256, pads = false }) {
  const g = new THREE.Group();
  const lift = 0.025;
  const cw = res, ch = Math.round((res * d) / w);
  const hex = `#${new THREE.Color(color).getHexString()}`;
  const tex = canvasTexture(cw, ch, (ctx) => {
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, cw, ch);
    if (dot) {
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.beginPath();
      ctx.arc(cw * 0.13, ch * 0.16, Math.min(cw, ch) * 0.055, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.12)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(205,209,220,.62)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const l of lines) {
      ctx.font = `${l.weight ?? 600} ${Math.round(l.size * ch)}px ${l.font === 'sans' ? FONT : MONO}`;
      ctx.fillText(l.t, cw / 2, l.y * ch, cw * 0.9);
    }
  });
  const side = mat(color, { rough: 0.55 });
  const top = texMat(tex, { rough: 0.5 });
  const body = mesh(new THREE.BoxGeometry(w, h, d), [side, side, top, side, side, side]);
  body.position.y = lift + h / 2;
  g.add(body);
  const legs = [];
  const px = pitch ?? (legsX > 1 ? (w * 0.82) / (legsX - 1) : 0);
  const pz = pitch ?? (legsZ > 1 ? (d * 0.82) / (legsZ - 1) : 0);
  for (let i = 0; i < legsX; i++)
    for (const s of [-1, 1]) legs.push([(i - (legsX - 1) / 2) * px, s * (d / 2 + legLen / 2 - 0.01), legW, legLen]);
  for (let i = 0; i < legsZ; i++)
    for (const s of [-1, 1]) legs.push([s * (w / 2 + legLen / 2 - 0.01), (i - (legsZ - 1) / 2) * pz, legLen, legW]);
  if (legs.length) {
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), pinMetal(), legs.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    legs.forEach(([x, z, sx, sz], i) => im.setMatrixAt(i, m.compose(new THREE.Vector3(x, pads ? 0.012 : 0.03, z), q, new THREE.Vector3(sx, pads ? 0.024 : 0.026, sz))));
    im.castShadow = true;
    g.add(im);
  }
  return g;
}

/** SOT-223 regulator (tab on -z side, 3 legs on +z). */
export function sot223(label = 'AMS1117') {
  const g = chipIC({ w: 0.65, d: 0.35, h: 0.16, lines: [{ t: label, size: 0.24, y: 0.55 }], dot: false, res: 192 });
  g.add(at(box(0.3, 0.025, 0.2, pinMetal(), { outline: false }), 0, 0.012, -0.26));
  for (const x of [-0.23, 0, 0.23]) g.add(at(box(0.07, 0.025, 0.16, pinMetal(), { outline: false }), x, 0.012, 0.25));
  return g;
}

/** SOT-23 (3 legs) tiny transistor / regulator. */
export function sot23() {
  const g = new THREE.Group();
  g.add(at(box(0.29, 0.1, 0.13, mat(0x1d1e23), { outline: false }), 0, 0.07, 0));
  for (const [x, z] of [[-0.095, 0.1], [0.095, 0.1], [0, -0.1]]) g.add(at(box(0.04, 0.02, 0.08, pinMetal(), { outline: false }), x, 0.012, z));
  return g;
}

/**
 * Scatter of SMD passives as two InstancedMeshes (bodies + end caps).
 * items: [x, z, rotY, kind] with kind 'r' (black resistor), 'c' (tan cap), 'C' (larger cap), 'd' (diode, grey band)
 */
export function passives(items, top) {
  const sizes = { r: [0.16, 0.05, 0.08], c: [0.16, 0.07, 0.08], C: [0.32, 0.12, 0.16], d: [0.36, 0.1, 0.18], R: [0.32, 0.06, 0.16] };
  const colors = { r: 0x1c1d22, c: 0xb9915d, C: 0xa8834f, d: 0x2a2b30, R: 0x1c1d22 };
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat(0xffffff, { rough: 0.6 }), items.length);
  const caps = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), pinMetal(), items.length * 2);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  items.forEach(([x, z, rot = 0, kind = 'r'], i) => {
    const [w, h, d] = sizes[kind];
    q.setFromAxisAngle(UP, rot);
    bodies.setMatrixAt(i, m.compose(new THREE.Vector3(x, top + h / 2, z), q, new THREE.Vector3(w * 0.7, h, d)));
    bodies.setColorAt(i, c.setHex(colors[kind]));
    for (const s of [-1, 1]) {
      const off = new THREE.Vector3(s * w * 0.42, 0, 0).applyQuaternion(q);
      caps.setMatrixAt(i * 2 + (s > 0 ? 1 : 0), m.compose(new THREE.Vector3(x + off.x, top + h / 2, z + off.z), q, new THREE.Vector3(w * 0.17, h * 1.02, d * 1.02)));
    }
  });
  bodies.castShadow = caps.castShadow = true;
  const g = new THREE.Group();
  g.add(bodies, caps);
  return g;
}

/** Small metal SMD crystal (3225 / HC-49 SMD look). */
export function crystal({ w = 0.32, d = 0.25, h = 0.08, hc49 = false } = {}) {
  const g = new THREE.Group();
  if (hc49) {
    g.add(at(box(w + 0.1, 0.04, d + 0.06, mat(0x2b2d33)), 0, 0.02, 0));
    const capsule = mesh(new THREE.CapsuleGeometry(d / 2, w - d, 6, 16), mat(0xdedad0, { metal: 0.6, rough: 0.28 }));
    capsule.rotation.z = Math.PI / 2;
    capsule.scale.set(1, 1, 0.75);
    g.add(at(capsule, 0, 0.04 + d * 0.38, 0));
    return g;
  }
  g.add(at(box(w, h, d, mat(0xd7d4cb, { metal: 0.6, rough: 0.3 })), 0, h / 2, 0));
  return g;
}

/** Aluminium electrolytic cap (SMD can on a black base). */
export function canCap(r = 0.25, h = 0.45) {
  const g = new THREE.Group();
  g.add(at(box(r * 2.1, 0.06, r * 2.1, mat(0x24262c)), 0, 0.03, 0));
  g.add(at(cyl(r, r, h, mat(0xc9cbc8, { metal: 0.45, rough: 0.35 })), 0, 0.06 + h / 2, 0));
  g.add(at(cyl(r * 0.98, r * 0.98, 0.012, mat(0x2a2c33), { outline: false, thetaLength: Math.PI / 2 }), 0, 0.06 + h + 0.006, 0));
  return g;
}

// ---------------------------------------------------------------- LEDs & buttons
/** Tiny SMD LED with a glow sprite. set(level 0..1). */
export function smdLed(color, { w = 0.16, d = 0.1, h = 0.08, glowSize = 1.0, glowColor = color } = {}) {
  const g = new THREE.Group();
  g.add(at(box(w, h * 0.45, d, mat(0xf1efe6), { outline: false }), 0, h * 0.225, 0));
  const lens = mat(color, { emissive: color, emissiveIntensity: 0, unique: true, rough: 0.3 });
  g.add(at(box(w * 0.86, h * 0.55, d * 0.86, lens, { outline: false }), 0, h * 0.45 + h * 0.275, 0));
  const glow = glowSprite(glowColor, glowSize);
  glow.position.y = h + 0.12;
  g.add(glow);
  let level = 0;
  return {
    group: g,
    get level() { return level; },
    set(v) {
      level = Math.max(0, Math.min(1, v));
      lens.emissiveIntensity = level * 2.2;
      glow.material.opacity = level * 0.9;
      glow.scale.setScalar(glow.userData.baseSize * (0.7 + level * 0.4));
    },
  };
}

/** SMD tactile switch: metal frame, black body, round cap. */
export function tactSwitch({ w = 0.42, d = 0.36, capColor = 0x24262c, bodyColor = 0x2d3038, capR, h = 0.14 } = {}) {
  const g = new THREE.Group();
  g.add(at(box(w, h * 0.55, d, mat(bodyColor, { rough: 0.6 })), 0, (h * 0.55) / 2, 0));
  g.add(at(box(w * 1.02, 0.02, d * 0.75, shellMetal(), { outline: false }), 0, h * 0.55 + 0.01, 0));
  const r = capR ?? Math.min(w, d) * 0.3;
  g.add(at(cyl(r, r, h * 0.5, mat(capColor, { rough: 0.5 }), { seg: 20 }), 0, h * 0.55 + h * 0.25, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(at(box(0.07, 0.02, 0.05, pinMetal(), { outline: false }), sx * (w / 2 + 0.03), 0.01, sz * d * 0.32));
  return g;
}

// ---------------------------------------------------------------- connectors (openings face -x)
export function microUSB() {
  const g = new THREE.Group();
  const shell = shellMetal();
  g.add(at(box(0.56, 0.27, 0.76, shell), 0, 0.135, 0));
  g.add(at(box(0.02, 0.17, 0.62, mat(0x15161a), { outline: false }), -0.285, 0.14, 0));
  g.add(at(box(0.025, 0.05, 0.42, mat(0x34363d), { outline: false }), -0.29, 0.15, 0));
  for (const s of [-1, 1]) g.add(at(box(0.18, 0.18, 0.06, shell, { outline: false }), 0.05, 0.09, s * 0.41));
  return g;
}

export function miniUSB() {
  const g = new THREE.Group();
  const shell = shellMetal();
  g.add(at(box(0.92, 0.4, 0.77, shell), 0, 0.2, 0));
  g.add(at(box(0.02, 0.28, 0.6, mat(0x15161a), { outline: false }), -0.465, 0.21, 0));
  g.add(at(box(0.025, 0.08, 0.4, mat(0x34363d), { outline: false }), -0.47, 0.23, 0));
  for (const s of [-1, 1]) g.add(at(box(0.3, 0.26, 0.06, shell, { outline: false }), 0.15, 0.13, s * 0.42));
  return g;
}

export function usbB() {
  const g = new THREE.Group();
  g.add(at(box(1.6, 1.08, 1.22, mat(0xd8d1bf, { rough: 0.35, metal: 0.45 })), 0, 0.54, 0));
  g.add(at(box(0.05, 0.62, 0.7, mat(0x3a3a3a)), -0.81, 0.56, 0));
  g.add(at(box(0.06, 0.3, 0.4, mat(0xf2efe6)), -0.8, 0.56, 0));
  return g;
}

export function barrelJack({ w = 0.9, h = 1.1, d = 1.4 } = {}) {
  const g = new THREE.Group();
  g.add(at(box(d, h, w, mat(0x25272d)), 0, h / 2, 0));
  const bore = cyl(0.32, 0.32, 0.1, mat(0x0c0c0e), { seg: 20 });
  bore.rotation.z = Math.PI / 2;
  g.add(at(bore, -d / 2 - 0.01, h * 0.55, 0));
  const pinC = cyl(0.08, 0.08, 0.12, shellMetal(), { seg: 12, outline: false });
  pinC.rotation.z = Math.PI / 2;
  g.add(at(pinC, -d / 2 - 0.02, h * 0.55, 0));
  return g;
}

/** Stack of two USB-A (3.0, blue tongues). */
export function usbAStack() {
  const g = new THREE.Group();
  const D = 1.75, H = 1.55, W = 1.45;
  g.add(at(box(D, H, W, shellMetal()), 0, H / 2, 0));
  for (const y of [0.42, 1.12]) {
    g.add(at(box(0.03, 0.56, 1.24, mat(0x101114), { outline: false }), -D / 2 - 0.005, y, 0));
    g.add(at(box(0.04, 0.17, 1.06, mat(0x2f6fd8, { rough: 0.5 }), { outline: false }), -D / 2 - 0.01, y + 0.08, 0));
  }
  g.add(at(box(0.04, 0.06, W * 0.95, shellMetal(), { outline: false }), -D / 2 - 0.02, H / 2 + 0.02, 0));
  return g;
}

export function rj45() {
  const g = new THREE.Group();
  const D = 2.1, H = 1.35, W = 1.6;
  g.add(at(box(D, H, W, shellMetal()), 0, H / 2, 0));
  g.add(at(box(0.03, 0.72, 1.18, mat(0x101114), { outline: false }), -D / 2 - 0.005, 0.5, 0));
  g.add(at(box(0.035, 0.22, 0.42, mat(0x101114), { outline: false }), -D / 2 - 0.006, 0.92, 0));
  const leds = [];
  for (const [z, c] of [[-0.6, 0x4fdc6a], [0.6, 0xf2a93b]]) {
    const l = box(0.035, 0.13, 0.22, mat(c, { emissive: c, emissiveIntensity: 0.5, unique: true }), { outline: false });
    g.add(at(l, -D / 2 - 0.008, 1.12, z));
    leds.push(l);
  }
  g.userData.leds = leds;
  return g;
}

export function hdmi({ w = 1.5, h = 0.6, d = 1.15, dp = false } = {}) {
  const g = new THREE.Group();
  g.add(at(box(d, h, w, shellMetal()), 0, h / 2, 0));
  // trapezoid opening
  const s = new THREE.Shape();
  const ow = w * 0.86, oh = h * 0.55, ch = oh * 0.38;
  s.moveTo(-ow / 2, oh / 2);
  s.lineTo(ow / 2, oh / 2);
  if (dp) {
    s.lineTo(ow / 2, -oh / 2 + ch);
    s.lineTo(ow / 2 - ch, -oh / 2);
  } else {
    s.lineTo(ow / 2, 0);
    s.lineTo(ow / 2 - ch, -oh / 2);
    s.lineTo(-ow / 2 + ch, -oh / 2);
  }
  if (dp) s.lineTo(-ow / 2, -oh / 2);
  else s.lineTo(-ow / 2, 0);
  s.closePath();
  const geo = new THREE.ShapeGeometry(s);
  const hole = new THREE.Mesh(geo, mat(0x101114));
  hole.rotation.y = -Math.PI / 2;
  hole.position.set(-d / 2 - 0.006, h / 2, 0);
  g.add(hole);
  g.add(at(box(0.03, oh * 0.25, ow * 0.7, mat(0x34363d), { outline: false }), -d / 2 - 0.01, h / 2, 0));
  return g;
}

// ---------------------------------------------------------------- pin API
/** Builds pin()/resolve() over a local pin map with alias support. */
export function pinLookup(boardName, g, map, aliases = {}, resolver) {
  const has = (k) => k != null && Object.hasOwn(map, k);
  const resolve = (name) => {
    const key = String(name).trim();
    if (has(key)) return key;
    const up = key.toUpperCase();
    if (has(up)) return up;
    const a = (Object.hasOwn(aliases, key) ? aliases[key] : null) ?? (Object.hasOwn(aliases, up) ? aliases[up] : null) ?? resolver?.(up);
    if (has(a)) return a;
    throw new Error(`${boardName}: unknown pin "${name}". Valid pins: ${Object.keys(map).join(', ')}`);
  };
  return {
    resolve,
    pin(name) {
      return map[resolve(name)].clone().applyMatrix4(g.matrixWorld);
    },
  };
}

export { UP };
