// Track — Edge AI with Jetson Nano: Python 3 on a Linux single-board computer,
// GPIO with Jetson.GPIO, I²C with smbus2, a CSI camera with OpenCV and neural
// networks with jetson_inference / jetson_utils.
// The AI is simulated truthfully: every "detection" is derived from the real
// 3D props in front of the virtual camera (their projected boxes), never made up.
import * as THREE from 'three';
import { makeJetson, makeCSICamera, makeRibbon } from '../scene/boards/jetson.js';
import { makeLED, makeResistor, makeButton, makeBuzzer, makeTO92, makeServo, makeCar } from '../scene/components.js';
import { makePerson, makeMPU6050 } from '../scene/modules.js';
import { mat, mesh, cyl, at, canvasTexture } from '../scene/kit.js';
import { v, clamp, LED_COLORS } from './helpers.js';

// ================================================================ shared helpers
const BBJ = [10.8, -2.2]; // breadboard to the right of the 40-pin header
const MAT_H = 0.12; // desk-mat thickness: props stand on top of it
const CAM = v(-8.3, 0, -0.2); // CSI camera stand, facing +z, left of the board
const MAT_Z0 = 4.5; // desk mat starts just in front of the board's front edge

/** LED brightness for a series resistor on a 3.3 V GPIO (≈ 2 V across the LED). */
const gain33 = (ohms) => clamp(((1.3 / ohms) * 1000) / 4, 0.12, 1);
const OHMS33 = [[220, '220 Ω'], [330, '330 Ω'], [1000, '1 kΩ'], [2200, '2.2 kΩ']];
const fmtOhms = (o) => (o >= 1000 ? `${o / 1000} kΩ` : `${o} Ω`);
const pad2 = (n) => String(n).padStart(2, '0');
const stamp = (d = new Date()) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;

/** Resistor + LED from a header pin to ground (3.3 V logic). */
function jLed(ctx, bb, { pin, col, color = 'red', gnd = 'GND', ohms = 330, wire = 'orange' }) {
  const n = /\d+/.exec(pin)[0];
  const res = ctx.add(makeResistor(bb.hole(col, 'd'), bb.hole(col + 4, 'd'), ohms));
  const led = ctx.add(makeLED(color, bb.hole(col + 4, 'c'), bb.hole(col + 5, 'c')));
  const sig = ctx.wire(ctx.board.pin(pin), bb.hole(col, 'b'), wire, { signal: `pin ${n}` });
  const gw = ctx.wire(ctx.board.pin(gnd), bb.hole(col + 5, 'a'), 'black', { signal: 'GND', dir: -1 });
  const state = { gain: gain33(ohms) };
  ctx.interact(led, {
    name: 'LED', hint: 'Click to change its colour',
    controls: [{ type: 'choice', label: 'Colour', options: LED_COLORS, get: () => led.color, set: (c) => led.setColor(c) }],
  });
  ctx.interact(res, {
    name: 'Resistor', hint: 'Click to try other values',
    controls: [{
      type: 'choice', label: 'Resistance', options: OHMS33, get: () => res.ohms,
      set: (o) => { res.setValue(o); state.gain = gain33(o); if (led.level > 0) led.set(state.gain); },
    }],
    note: () => `${fmtOhms(res.ohms)} on 3.3 V → ≈ ${((1.3 / res.ohms) * 1000).toFixed(1)} mA${res.ohms < 300 ? ' — more than the header’s level shifters like to give' : ''}`,
  });
  return { res, led, sig, gw, state, on: (x = 1) => led.set(x * state.gain), off: () => led.set(0) };
}

// ---------------------------------------------------------------- desk props (miniature, cm)
function prop(g, pos, anchorY) {
  g.position.copy(pos);
  g.updateMatrixWorld(true);
  return { group: g, pick: g, get anchor() { return g.position.clone().add(v(0, anchorY, 0)); } };
}

function makeMug(pos, color = 0xf3f1e8) {
  const g = new THREE.Group();
  const c = mat(color, { rough: 0.4 });
  g.add(at(cyl(0.62, 0.56, 1.35, c, { seg: 32 }), 0, 0.675, 0));
  g.add(at(cyl(0.55, 0.55, 0.02, mat(0x4a2c1a, { rough: 0.3 }), { seg: 32, outline: false }), 0, 1.25, 0));
  const handle = mesh(new THREE.TorusGeometry(0.33, 0.09, 10, 24, Math.PI), c);
  handle.rotation.z = -Math.PI / 2;
  g.add(at(handle, 0.6, 0.7, 0));
  g.add(at(cyl(0.63, 0.63, 0.22, mat(0x3b78e7, { rough: 0.5 }), { seg: 32, outline: false }), 0, 0.85, 0));
  return prop(g, pos, 1.9);
}

function makeBottle(pos, color = 0x7fc3e8) {
  const g = new THREE.Group();
  const glass = mat(color, { rough: 0.15, opacity: 0.78 });
  g.add(at(cyl(0.45, 0.45, 1.9, glass, { seg: 28 }), 0, 0.95, 0));
  g.add(at(cyl(0.2, 0.45, 0.5, glass, { seg: 28 }), 0, 2.15, 0));
  g.add(at(cyl(0.2, 0.2, 0.3, glass, { seg: 20 }), 0, 2.55, 0));
  g.add(at(cyl(0.23, 0.23, 0.25, mat(0x2f6fd8, { rough: 0.4 }), { seg: 20 }), 0, 2.82, 0));
  g.add(at(cyl(0.46, 0.46, 0.7, mat(0xf3f1e8, { rough: 0.6 }), { seg: 28, outline: false }), 0, 1.0, 0));
  return prop(g, pos, 3.4);
}

function makeBanana(pos) {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const a = -0.9 + (i / 12) * 1.8;
    pts.push(new THREE.Vector3(Math.sin(a) * 1.5, 0.32 + (1 - Math.cos(a)) * 1.1, 0));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, 40, 0.3, 10, false);
  // taper towards both ends
  const p = geo.attributes.position;
  const tmp = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const u = Math.floor(i / 11) / 40;
    const k = 0.35 + 0.65 * Math.sin(Math.PI * u);
    const c = curve.getPointAt(u);
    tmp.fromBufferAttribute(p, i).sub(c).multiplyScalar(k).add(c);
    p.setXYZ(i, tmp.x, tmp.y, tmp.z);
  }
  geo.computeVertexNormals();
  g.add(mesh(geo, mat(0xf5d33a, { rough: 0.5 })));
  for (const end of [0, 1]) {
    const tip = curve.getPointAt(end);
    g.add(at(cyl(0.07, 0.09, 0.22, mat(0x5a3b1e), { seg: 8, outline: false }), tip.x, tip.y + 0.05, tip.z));
  }
  return prop(g, pos, 2.6);
}

function makeOrange(pos) {
  const g = new THREE.Group();
  const s = mesh(new THREE.SphereGeometry(0.75, 28, 20), mat(0xf08a2c, { rough: 0.7 }));
  s.scale.y = 0.92;
  g.add(at(s, 0, 0.7, 0));
  g.add(at(cyl(0.05, 0.06, 0.12, mat(0x5a3b1e), { seg: 8, outline: false }), 0, 1.42, 0));
  const leaf = mesh(new THREE.SphereGeometry(0.22, 12, 8), mat(0x3fa34d, { rough: 0.6 }), { outline: false });
  leaf.scale.set(1, 0.25, 0.5);
  leaf.rotation.z = 0.4;
  g.add(at(leaf, 0.2, 1.45, 0));
  return prop(g, pos, 2.1);
}

/** Desk mat the props stand on (cutting-mat look). */
function deskMat(w, d) {
  const tex = canvasTexture(1024, Math.round((1024 * d) / w), (c, W, H) => {
    c.fillStyle = '#2f6b5a';
    c.fillRect(0, 0, W, H);
    const s = W / w;
    for (let x = 0; x <= w; x += 1) {
      c.strokeStyle = x % 5 ? 'rgba(220,240,230,.13)' : 'rgba(220,240,230,.3)';
      c.lineWidth = x % 5 ? 1 : 2;
      c.beginPath(); c.moveTo(x * s, 0); c.lineTo(x * s, H); c.stroke();
    }
    for (let z = 0; z <= d; z += 1) {
      c.strokeStyle = z % 5 ? 'rgba(220,240,230,.13)' : 'rgba(220,240,230,.3)';
      c.lineWidth = z % 5 ? 1 : 2;
      c.beginPath(); c.moveTo(0, z * s); c.lineTo(W, z * s); c.stroke();
    }
  });
  const side = mat(0x285c4d, { rough: 0.8 });
  return mesh(new THREE.BoxGeometry(w, MAT_H, d), [side, side, mat(0xffffff, { map: tex, rough: 0.85, unique: true }), side, side, side]);
}

/** A room only the virtual camera sees (layer 1): a table top running up to a wall. */
function feedRoom(cx, cz, farZ) {
  const g = new THREE.Group();
  const wallTex = canvasTexture(1024, 512, (c, W, H) => {
    const gr = c.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#cfd6e2');
    gr.addColorStop(1, '#e9e4d8');
    c.fillStyle = gr;
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#f7f4ec'; // window
    c.fillRect(W * 0.6, H * 0.3, W * 0.22, H * 0.45);
    const sky = c.createLinearGradient(0, H * 0.3, 0, H * 0.75);
    sky.addColorStop(0, '#8fc3ea');
    sky.addColorStop(1, '#d8ecf7');
    c.fillStyle = sky;
    c.fillRect(W * 0.61, H * 0.32, W * 0.2, H * 0.41);
    c.fillStyle = '#f7f4ec';
    c.fillRect(W * 0.708, H * 0.32, W * 0.004, H * 0.41);
    c.fillRect(W * 0.61, H * 0.52, W * 0.2, H * 0.008);
    c.fillStyle = '#e5412e'; // poster
    c.fillRect(W * 0.2, H * 0.34, W * 0.1, H * 0.26);
    c.fillStyle = '#f5c02a';
    c.beginPath(); c.arc(W * 0.25, H * 0.45, W * 0.03, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#a07a52'; // shelf with books
    c.fillRect(W * 0.38, H * 0.67, W * 0.14, H * 0.02);
    c.fillStyle = '#3b78e7';
    c.fillRect(W * 0.4, H * 0.59, W * 0.02, H * 0.08);
    c.fillStyle = '#3fbf5f';
    c.fillRect(W * 0.43, H * 0.61, W * 0.025, H * 0.06);
    c.fillStyle = '#b9a07c'; // skirting
    c.fillRect(0, H * 0.94, W, H * 0.06);
  });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(64, 32), new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 }));
  wall.position.set(cx, 15.6, farZ);
  wall.rotation.y = Math.PI;
  g.add(wall);
  const tableTex = canvasTexture(512, 512, (c, W, H) => {
    c.fillStyle = '#c9a77c';
    c.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) {
      c.strokeStyle = `rgba(120,80,40,${0.05 + (i % 5) * 0.02})`;
      c.lineWidth = 1 + (i % 3);
      const y = (i / 60) * H;
      c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(W * 0.3, y + 6, W * 0.7, y - 6, W, y + 3); c.stroke();
    }
  }, { repeat: [4, 2] });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(64, farZ - cz + 6), new THREE.MeshStandardMaterial({ map: tableTex, roughness: 0.8 }));
  top.rotation.x = -Math.PI / 2;
  top.position.set(cx, -0.02, (farZ + cz - 6) / 2);
  g.add(top);
  g.traverse((o) => { o.layers.set(1); o.raycast = () => {}; });
  return g;
}

/**
 * Camera scene: CSI camera to the left of the board (ribbon into J13), a desk
 * mat in front of it, a feed-only room and the camera-feed panel.
 */
function aiDesk(ctx, o = {}) {
  const { title = 'CSI camera', sub = 'simulated inference · idle', fov = 50, matW = 18, matD = 13, matX = CAM.x, look = 9, lookY = 1.9 } = o;
  const cam = makeCSICamera(CAM);
  ctx.addObject(cam.group);
  const ribbon = makeRibbon(ctx.board.csi, cam.ribbonEnd, 1.6, { dirB: cam.ribbonDir, axisA: ctx.board.csiAxis, axisB: cam.ribbonAxis, bendB: cam.ribbonBend });
  ctx.addObject(ribbon.group);
  const desk = deskMat(matW, matD);
  desk.position.set(matX, MAT_H / 2, MAT_Z0 + matD / 2);
  ctx.addObject(desk);
  ctx.addObject(feedRoom(CAM.x, CAM.z, CAM.z + 30));
  const eye = cam.lensWorld.clone().addScaledVector(cam.lookDir, 0.08);
  const target = eye.clone().addScaledVector(cam.lookDir, look);
  target.y = lookY;
  const feed = ctx.camera({ position: eye, target, fov, title, sub });
  feed.camera.layers.enable(1);
  // The feed is rendered into the WebGL canvas *behind* the dock, so keep the
  // panel body see-through (the shared panel CSS paints it opaque).
  feed.el.style.background = 'transparent';
  feed.el.querySelector('.panel-body')?.style.setProperty('background', 'transparent');
  feed.el.querySelector('header')?.style.setProperty('background', 'var(--paper-solid)');
  const subEl = feed.el.querySelector('header small');
  const feedEl = feed.el.querySelector('.feed');
  ctx.interact(cam, { name: 'Camera module', hint: '8 MP IMX219-style sensor on a 15-way CSI ribbon', ...(o.camInteract ?? {}) });
  ctx.anchor('cam', cam.anchor);
  ctx.anchor('ribbon', ribbon.curve.getPointAt(0.5));
  return {
    cam, feed, ribbon, desk, eye, target,
    setSub: (t) => { if (subEl && subEl.textContent !== t) subEl.textContent = t; },
    /** Feed size in CSS pixels (0 when the panel is minimised). */
    size: () => { const r = feedEl?.getBoundingClientRect(); return r && r.width > 10 ? r : null; },
  };
}

/** Clip a feed-space box to the frame. Returns null if (almost) nothing is visible. */
function clipBox(b, w, h) {
  if (!b.visible || !Number.isFinite(b.x)) return null;
  const x0 = Math.max(0, b.x), y0 = Math.max(0, b.y), x1 = Math.min(w, b.x + b.w), y1 = Math.min(h, b.y + b.h);
  if (x1 - x0 < 3 || y1 - y0 < 3) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, frac: ((x1 - x0) * (y1 - y0)) / Math.max(1, b.w * b.h) };
}

/**
 * Simulated detector: projects each prop into the camera feed and reports
 * those that are actually in view, with a confidence that drops for small or
 * partly visible objects. items: [{ obj, cls, base, seed }].
 * Returns detections with feed-pixel boxes and 1280×720 coordinates.
 */
function simDetect(d, items, threshold, t) {
  const r = d.size();
  if (!r) return [];
  const out = [];
  for (const it of items) {
    if (it.obj.group.visible === false) continue;
    const b = clipBox(d.feed.boxOf(it.obj.group), r.width, r.height);
    if (!b) continue;
    const size = clamp(0.62 + (b.h / r.height) * 1.2, 0.62, 1);
    const vis = clamp(0.3 + b.frac * 0.7, 0, 1);
    const conf = clamp(it.base * size * vis + 0.025 * Math.sin(t * 2.1 + it.seed * 7.3), 0.05, 0.99);
    if (conf < threshold) continue;
    const sx = 1280 / r.width, sy = 720 / r.height;
    out.push({ it, cls: it.cls, conf, box: b, px: { cx: (b.x + b.w / 2) * sx, cy: (b.y + b.h / 2) * sy, w: b.w * sx, h: b.h * sy } });
  }
  return out;
}

const CLS_COLOR = { person: '#2ee6a6', car: '#ffb547', bottle: '#6ec3ff', cup: '#ff7ab6', banana: '#f5e04a', orange: '#ff9a3c' };

function idleHint(g, w, h, text = 'Press Run to start the script') {
  g.fillStyle = 'rgba(13,16,32,.6)';
  g.fillRect(0, 0, w, 24);
  g.fillStyle = '#e9ecf5';
  g.font = '600 11px "IBM Plex Mono", monospace';
  g.fillText(text, 10, 16);
}

/** Text with a dark backing box (like jetson_utils.cudaFont overlays). */
function feedText(g, text, x, y, { color = '#ffffff', bg = 'rgba(40,44,60,.72)', size = 12 } = {}) {
  g.font = `600 ${size}px "IBM Plex Mono", monospace`;
  const w = g.measureText(text).width;
  if (bg) { g.fillStyle = bg; g.fillRect(x - 4, y - size, w + 8, size + 6); }
  g.fillStyle = color;
  g.fillText(text, x, y);
}

function flashFeed(g, w, h, k) {
  if (k <= 0) return;
  g.fillStyle = `rgba(255,255,255,${(k * 0.8).toFixed(3)})`;
  g.fillRect(0, 0, w, h);
}

/** A figure walking back and forth along x between a and b at depth z. */
function walker(ctx, { z, a, b, speed = 1.6, phase = 0, dir = 1, shirt, trousers }) {
  const p = ctx.add(makePerson(v(a, MAT_H, z), { shirt, trousers, rotY: Math.PI / 2 }));
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const st = { x: lo + (hi - lo) * phase, dir, t: phase * 9, walking: true };
  const place = () => {
    p.group.position.set(st.x, MAT_H + (st.walking ? Math.abs(Math.sin(st.t * 7)) * 0.12 : 0), z);
    p.group.rotation.y = st.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
  };
  place();
  return {
    person: p, st, place,
    step(dt) {
      if (!st.walking) return;
      st.t += dt;
      st.x += st.dir * speed * dt;
      if (st.x > hi) { st.x = hi; st.dir = -1; }
      if (st.x < lo) { st.x = lo; st.dir = 1; }
      place();
    },
  };
}

/** Breadboard with the Jetson power LED kept on (the board is running Linux). */
function powerOn(ctx) { ctx.board.setBuiltinLed?.(1); }

export const jetson = [
  // ------------------------------------------------------------------ 1
  {
    id: 'jetson-meet', title: 'Meet the Jetson Nano', icon: 'chip',
    thumb: () => makeJetson().group,
    view: { center: [0, 1.3, 0.2], size: 12.5 },
    build(ctx) {
      powerOn(ctx);
      const st = { mode: 'MAXN', load: 15, cpu: 33, gpu: 31.5 };
      const target = () => 30 + (st.load / 100) * (st.mode === 'MAXN' ? 30 : 16);
      ctx.onTick((dt) => {
        const k = 1 - Math.exp(-dt / 5);
        st.cpu += (target() - st.cpu) * k;
        st.gpu += (target() - 1.5 + (st.load / 100) * 2 - st.gpu) * k;
        ctx.board.setFan?.(clamp((st.cpu - 30) / 24, 0.15, 1));
      });
      ctx.interact(ctx.board, {
        name: 'Jetson Nano-style dev kit', hint: 'Change the power mode and the workload',
        controls: [
          { type: 'choice', label: 'Power mode (nvpmodel)', options: [['MAXN', '10 W · MAXN (mode 0)'], ['5W', '5 W (mode 1)']], get: () => st.mode, set: (m) => (st.mode = m) },
          { type: 'range', label: 'Workload', min: 0, max: 100, step: 1, get: () => st.load, set: (x) => (st.load = x), format: (x) => `${x}%` },
        ],
        note: () => `CPU ${st.cpu.toFixed(1)} °C · fan ${Math.round((ctx.board.fanSpeed ?? 0) * 100)}%`,
      });
      return { st };
    },
    callouts: [
      { anchor: 'fan', x: 0.04, y: 0.17, icon: 'gear', title: 'Heatsink + fan', text: 'Click the board to load it — the fan speeds up as it warms.' },
      { anchor: 'module', x: 0.36, y: 0.12, icon: 'chip', title: 'Compute module', text: '4-core Arm A57 CPU, 128-core Maxwell GPU and 4 GB RAM.' },
      { anchor: 'gpio', x: 0.7, y: 0.17, icon: 'pins', title: '40-pin header', text: 'Pi-compatible GPIO, I²C, SPI, UART and PWM at 3.3 V.' },
      { anchor: 'csi', x: 0.04, y: 0.68, icon: 'radar', title: 'CSI camera port', text: 'A MIPI CSI-2 camera plugs in with a ribbon.' },
      { anchor: 'power', x: 0.36, y: 0.74, icon: 'bolt', title: '5 V barrel jack', text: '5 V 4 A for MAXN; micro-USB is fine for 5 W mode.' },
      { anchor: 'usb', x: 0.7, y: 0.68, icon: 'usb', title: 'USB 3.0 · LAN · HDMI', text: 'Keyboard, screen and network — it’s a full computer.' },
    ],
    overview: {
      heading: 'A computer built for AI',
      text: 'Unlike a microcontroller, the Jetson Nano runs Ubuntu Linux (JetPack) from a microSD card. Its 128-core GPU runs neural networks, the 40-pin header talks to electronics, and <code>nvpmodel</code> switches between a 10 W and a 5 W power budget. Your programs are ordinary Python 3 scripts.',
      features: [['chip', 'Quad-core Cortex-A57 @ 1.43 GHz + 128-core Maxwell GPU'], ['code', 'Linux exposes hardware as files under <code>/sys</code> and <code>/proc</code>'], ['bolt', '<code>sudo nvpmodel -m 0</code> = 10 W MAXN, <code>-m 1</code> = 5 W']],
    },
    pinout: [['J41', '40-pin expansion header', '3.3 V GPIO, I²C, SPI, UART, PWM'], ['J13', 'CSI camera connector', 'MIPI CSI-2, 2 lanes'], ['J25', 'DC barrel jack', '5 V ⎓ 4 A (fit J48 jumper)'], ['J28', 'Micro-USB', '5 V ⎓ 2 A, or USB device mode'], ['USB / RJ45', '4× USB 3.0, Gigabit Ethernet', ''], ['J15', '4-pin fan header', '5 V PWM fan']],
    example: {
      text: 'Jetson boards sit inside delivery robots, drones, smart traffic cameras and factory inspection stations — anywhere a neural network must run right next to the sensor, without a round trip to the cloud.',
      points: ['Change the sleep interval to log faster or slower', 'Run <code>sudo tegrastats</code> on a real board to see live CPU/GPU load and power', 'Try <code>sudo nvpmodel -m 1</code>, then run the script again'],
    },
    specs: [['CPU', '4× Arm Cortex-A57 @ 1.43 GHz'], ['GPU', '128-core Maxwell, ≈ 472 GFLOPS (FP16)'], ['Memory', '4 GB 64-bit LPDDR4, shared CPU/GPU'], ['Storage', 'microSD (32 GB+ recommended)'], ['Power modes', '10 W (MAXN) / 5 W'], ['OS', 'JetPack 4.6 · Ubuntu 18.04 · Python 3.6'], ['Size', '100 × 80 mm carrier']],
    quiz: [
      { q: 'What makes the Jetson Nano good at running neural networks?', options: ['A very fast clock', 'Its 128-core GPU runs thousands of multiply-adds in parallel', 'It has no operating system', 'It uses 5 V logic'], answer: 1, explain: 'Neural networks are mostly huge batches of multiply-adds — exactly what a GPU does in parallel.' },
      { q: 'What does `sudo nvpmodel -m 1` do on a Nano?', options: ['Updates the OS', 'Switches to the 5 W power mode', 'Enables the camera', 'Formats the SD card'], answer: 1, explain: 'nvpmodel selects a power budget: mode 0 = MAXN (10 W), mode 1 = 5 W with two cores and lower clocks.' },
      { q: 'The file thermal_zone1/temp contains 41500. What is the temperature?', options: ['415 °C', '41.5 °C', '4.15 °C', '41500 °C'], answer: 1, explain: 'Linux thermal zones report millidegrees Celsius, so divide by 1000.' },
      { q: 'How is the Jetson different from an Uno-style board?', options: ['It has no GPIO pins', 'It is a full Linux computer that runs Python programs from files', 'It can only run C++', 'It needs no power supply'], answer: 1, explain: 'The Jetson boots Linux from storage and runs normal programs; a microcontroller runs one bare-metal sketch.' },
    ],
    challenges: ['Also print the free memory from <code>/proc/meminfo</code>.', 'Log the temperatures to a CSV file with a timestamp on each line.', 'Print a warning when the CPU passes 60 °C and count how long it stays there.'],
    code: `import glob
import os
import platform
import subprocess
import time

def read(path):
    with open(path) as f:
        return f.read().replace('\\x00', '').strip()

def temperatures():
    temps = {}
    for zone in glob.glob('/sys/devices/virtual/thermal/thermal_zone*'):
        temps[read(zone + '/type')] = int(read(zone + '/temp')) / 1000
    return temps                       # millidegrees -> degrees C

print('Model  :', read('/proc/device-tree/model'))
print('System :', platform.system(), platform.machine(), platform.release())
print('Python :', platform.python_version())
print('CPUs   :', os.cpu_count())
mode = subprocess.run(['nvpmodel', '-q'], stdout=subprocess.PIPE,
                      universal_newlines=True)
print('Power  :', mode.stdout.splitlines()[0])

while True:
    t = temperatures()
    load = os.getloadavg()[0]
    print('CPU {:.1f} C | GPU {:.1f} C | load {:.2f}'.format(
        t['CPU-therm'], t['GPU-therm'], load))
    time.sleep({{interval}})`,
    params: { interval: { value: 2, min: 1, max: 5 } },
    async setup(io, b) {
      const st = b.st;
      io.line("print('Model"); io.print('Model  : NVIDIA Jetson Nano Developer Kit'); await io.delay(150);
      io.line("print('System"); io.print('System : Linux aarch64 4.9.253-tegra'); await io.delay(120);
      io.line("print('Python"); io.print('Python : 3.6.9'); await io.delay(120);
      io.line("print('CPUs"); io.print('CPUs   : 4'); await io.delay(120);
      io.line('mode = subprocess'); await io.delay(250);
      io.line("print('Power"); io.print(`Power  : NV Power Mode: ${st.mode}`); await io.delay(150);
    },
    async loop(io, b, p) {
      const st = b.st;
      io.line('t = temperatures()');
      const cpu = Math.round((st.cpu + (Math.random() - 0.5) * 0.6) * 2) / 2;
      const gpu = Math.round((st.gpu + (Math.random() - 0.5) * 0.6) * 2) / 2;
      io.line('getloadavg');
      const load = (st.load / 100) * (st.mode === 'MAXN' ? 4 : 2) + 0.08 + Math.random() * 0.06;
      io.line("print('CPU");
      io.print(`CPU ${cpu.toFixed(1)} C | GPU ${gpu.toFixed(1)} C | load ${load.toFixed(2)}`);
      io.line('time.sleep'); await io.delay(p.interval * 1000);
    },
    reset() {},
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'jetson-gpio-blink', title: 'GPIO from Python', icon: 'led',
    thumb: () => makeLED('red', v(0.13, 0, 0), v(-0.13, 0, 0)).group,
    view: { center: [5.6, 0.8, -1.8], size: 17, az: 18 },
    build(ctx) {
      powerOn(ctx);
      const bb = ctx.breadboard(...BBJ);
      const c = jLed(ctx, bb, { pin: 'PIN12', col: 8 });
      ctx.anchor('led', c.led.anchor);
      ctx.anchor('res', c.res.anchor);
      ctx.anchor('sig', c.sig.mid);
      ctx.anchor('gndw', c.gw.mid);
      return c;
    },
    callouts: [
      { anchor: 'gpio', x: 0.04, y: 0.17, icon: 'pins', title: '40-pin header', text: 'Pi-compatible layout, 3.3 V logic. Never feed a pin 5 V.' },
      { anchor: 'sig', x: 0.36, y: 0.12, icon: 'pins', title: 'Pin 12 (BOARD)', text: '<code>GPIO.output()</code> switches it between 3.3 V and 0 V.' },
      { anchor: 'led', x: 0.7, y: 0.17, icon: 'led', title: 'LED', text: 'Lights while pin 12 is HIGH.' },
      { anchor: 'gndw', x: 0.04, y: 0.68, icon: 'gnd', title: 'GND · pin 6', text: 'The return path back to the board.' },
      { anchor: 'res', x: 0.7, y: 0.68, icon: 'resistor', title: '330 Ω resistor', text: 'Keeps the current to ≈ 4 mA.' },
    ],
    overview: {
      heading: 'GPIO from Python',
      text: 'The Jetson runs full Linux, so you control pins from an ordinary Python 3 script with <code>Jetson.GPIO</code> — the same API as RPi.GPIO. Choose BOARD numbering, make pin 12 an output and blink an LED. A <code>try/finally</code> releases the pins however the script ends.',
      features: [['code', '<code>Jetson.GPIO</code>: RPi.GPIO-compatible API'], ['pins', 'BOARD numbering = physical pin numbers'], ['bolt', '3.3 V logic and only a few mA per pin']],
    },
    pinout: [['Pin 12', '330 Ω → LED (+)', 'GPIO79, output'], ['Pin 6 (GND)', 'LED (–)', 'Short leg'], ['Resistor', '330 Ω', 'Orange · orange · brown']],
    example: {
      text: 'Robots, kiosks and smart cameras built on Jetson boards use the header for status lights, relays and buttons while the GPU runs the neural networks.',
      points: ['Change the two <code>time.sleep()</code> values to change the rhythm', 'On a real board press Ctrl+C — the <code>finally</code> block still runs <code>GPIO.cleanup()</code>'],
    },
    specs: [['Library', 'Jetson.GPIO (pre-installed in JetPack)'], ['Logic level', '3.3 V'], ['Numbering', 'GPIO.BOARD (physical pins)'], ['LED current', '≈ 4 mA with 330 Ω'], ['Drive strength', 'A few mA — use a transistor for more'], ['Permissions', 'User in the <code>gpio</code> group']],
    quiz: [
      { q: 'With GPIO.setmode(GPIO.BOARD), what does the number 12 refer to?', options: ['Linux GPIO number 12', 'Physical pin 12 on the 40-pin header', 'The 12th LED', 'Pin 12 of the CPU package'], answer: 1, explain: 'BOARD numbering uses the physical position on the header, so code ports cleanly between Pi-style boards.' },
      { q: 'Why wrap the loop in try / finally?', options: ['To make it faster', 'So GPIO.cleanup() always runs, even after Ctrl+C or an error', 'Python requires it for GPIO', 'To catch syntax errors'], answer: 1, explain: 'finally runs however the try block ends, releasing the pins and leaving them as safe inputs.' },
      { q: 'What voltage does a Jetson header pin output when HIGH?', options: ['5 V', '3.3 V', '1.8 V', '12 V'], answer: 1, explain: 'The header uses 3.3 V logic; 5 V on a GPIO pin can damage the board.' },
    ],
    challenges: ['Blink a heartbeat: two quick flashes, then a pause.', 'Add a green LED on pin 13 and alternate the two.', 'Read the blink period from a command-line argument with <code>sys.argv</code>.'],
    code: `import time
import Jetson.GPIO as GPIO

LED_PIN = 12  # physical pin 12

GPIO.setmode(GPIO.BOARD)
GPIO.setup(LED_PIN, GPIO.OUT, initial=GPIO.LOW)
print("Blinking pin", LED_PIN, "- Ctrl+C to stop")

try:
    while True:
        GPIO.output(LED_PIN, GPIO.HIGH)
        print("pin 12 -> HIGH")
        time.sleep({{on}} / 1000)
        GPIO.output(LED_PIN, GPIO.LOW)
        print("pin 12 -> LOW")
        time.sleep({{off}} / 1000)
finally:
    GPIO.cleanup()  # release the pins`,
    params: { on: { value: 500, min: 50, max: 3000 }, off: { value: 500, min: 50, max: 3000 } },
    async setup(io) {
      io.line('setmode'); await io.delay(120);
      io.line('GPIO.setup'); await io.delay(120);
      io.line('print("Blinking'); io.print('Blinking pin 12 - Ctrl+C to stop');
    },
    async loop(io, b, p) {
      io.line('GPIO.HIGH)'); b.on(); io.pin('pin 12', 'HIGH', true);
      io.line('-> HIGH'); io.print('pin 12 -> HIGH');
      io.line('time.sleep', 1); await io.delay(p.on);
      io.line('GPIO.LOW)', 2); b.off(); io.pin('pin 12', 'LOW', false);
      io.line('-> LOW'); io.print('pin 12 -> LOW');
      io.line('time.sleep', 2); await io.delay(p.off);
    },
    reset(b) { b.off(); },
  },

  // ------------------------------------------------------------------ 3
  {
    id: 'jetson-button', title: 'Events, not polling', icon: 'button',
    thumb: () => makeButton([v(-0.25, 0, -0.38), v(0.25, 0, -0.38), v(-0.25, 0, 0.38), v(0.25, 0, 0.38)]).group,
    view: { center: [6.0, 0.8, -1.6], size: 17, az: 18 },
    build(ctx) {
      powerOn(ctx);
      const bb = ctx.breadboard(...BBJ);
      const c = jLed(ctx, bb, { pin: 'PIN12', col: 3 });
      const btn = ctx.add(makeButton([bb.hole(18, 'e'), bb.hole(20, 'e'), bb.hole(18, 'f'), bb.hole(20, 'f')]));
      const pull = ctx.add(makeResistor(bb.hole(18, 'c'), bb.hole(22, 'c'), 10000));
      const w18 = ctx.wire(ctx.board.pin('PIN18'), bb.hole(18, 'a'), 'yellow', { signal: 'pin 18' });
      const w33 = ctx.wire(ctx.board.pin('PIN17'), bb.hole(22, 'a'), 'red', { signal: '3V3' });
      ctx.wire(ctx.board.pin('PIN20'), bb.hole(20, 'j'), 'black', { signal: 'GND', dir: -1, lift: 2.2 });
      const st = { edges: [], lastAccepted: -1e9, ledOn: false, presses: 0 };
      ctx.interact(btn, {
        name: 'Push button', hint: 'Press and hold to push it',
        hold: {
          down: () => {
            btn.press(true);
            // real contacts bounce: one press can make several falling edges within ~3 ms
            const t = performance.now();
            const n = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < n; i++) st.edges.push(t + i * 1.4);
          },
          up: () => btn.press(false),
        },
      });
      ctx.interact(pull, { name: '10 kΩ pull-up', hint: 'Holds pin 18 at 3.3 V until the button pulls it to GND', note: () => 'Jetson.GPIO can’t enable internal pull-ups on the Nano header' });
      ctx.anchor('btn', btn.anchor);
      ctx.anchor('pull', pull.anchor);
      ctx.anchor('w18', w18.mid);
      ctx.anchor('w33', w33.mid);
      ctx.anchor('led', c.led.anchor);
      return { ...c, btn, st };
    },
    callouts: [
      { anchor: 'led', x: 0.04, y: 0.17, icon: 'led', title: 'LED · pin 12', text: 'Toggles on every accepted press.' },
      { anchor: 'w18', x: 0.36, y: 0.12, icon: 'pins', title: 'Pin 18 · input', text: 'A falling edge (3.3 V → 0 V) fires the callback.' },
      { anchor: 'pull', x: 0.7, y: 0.17, icon: 'resistor', title: '10 kΩ pull-up', text: 'External: the Nano’s header has no software pull-ups.' },
      { anchor: 'w33', x: 0.04, y: 0.68, icon: 'bolt', title: '3.3 V · pin 17', text: 'Feeds the pull-up — never use 5 V on an input.' },
      { anchor: 'btn', x: 0.7, y: 0.68, icon: 'hand', title: 'Push button', text: 'Click and hold to press. Try a tiny bouncetime!' },
    ],
    overview: {
      heading: 'Events, not polling',
      text: 'Instead of checking the button thousands of times a second, ask the kernel to watch pin 18 and call your function when it falls from HIGH to LOW. <code>bouncetime</code> ignores the extra edges a bouncing switch makes, and the main loop stays free for other work.',
      features: [['hand', 'Hold the 3D button to press it'], ['code', '<code>GPIO.add_event_detect(…, callback=…)</code>'], ['timer', '<code>bouncetime</code> in ms filters contact bounce']],
    },
    pinout: [['Pin 18', 'Button leg + 10 kΩ to 3.3 V', 'Input, idle HIGH'], ['Pin 17 (3.3 V)', 'Pull-up resistor', ''], ['Pin 20 (GND)', 'Other button leg', 'Pressed = LOW'], ['Pin 12', '330 Ω → LED', 'Output'], ['Pin 6 (GND)', 'LED (–)', '']],
    example: {
      text: 'A Jetson-powered camera might use a button to start recording or trigger a photo while the main loop keeps processing video — events make that easy.',
      points: ['Set <code>bouncetime</code> to 0 and press a few times — some presses count twice', 'Change <code>GPIO.FALLING</code> to <code>GPIO.BOTH</code> to see releases too'],
    },
    specs: [['Library', 'Jetson.GPIO'], ['Edge', 'GPIO.FALLING (press)'], ['Debounce', '<code>bouncetime</code> = 200 ms'], ['Pull-up', 'External 10 kΩ to 3.3 V'], ['Callback', 'Runs in a separate thread']],
    quiz: [
      { q: 'Why is an event callback better than polling in a tight loop?', options: ['It uses no electricity', 'The CPU isn’t wasted checking the pin, and the main loop is free for other work', 'It makes the LED brighter', 'Polling is impossible in Python'], answer: 1, explain: 'The kernel watches for the edge and wakes your callback, so your program doesn’t burn CPU time.' },
      { q: 'What does bouncetime=200 do?', options: ['Delays the LED by 200 ms', 'Ignores further edges for 200 ms after one is accepted', 'Presses the button 200 times', 'Sets the PWM frequency'], answer: 1, explain: 'Switch contacts chatter for a few ms; bouncetime drops edges that arrive too soon after the last one.' },
      { q: 'Why does this circuit need an external 10 kΩ resistor?', options: ['To limit LED current', 'The Nano’s header pins can’t enable a pull-up from software, so the input would float', 'To protect the button', 'It is optional decoration'], answer: 1, explain: 'Without a pull-up, the pin floats and reads random values while the button is open.' },
      { q: 'With a pull-up and the button to GND, which edge means “pressed”?', options: ['Rising', 'Falling', 'Both', 'Neither'], answer: 1, explain: 'The pin sits at 3.3 V and drops to 0 V when the button connects it to ground — a falling edge.' },
    ],
    challenges: ['Print how long each press lasted using <code>GPIO.BOTH</code> and <code>time.time()</code>.', 'Make a long press (over 1 s) turn the LED off whatever its state.', 'Add a second button on pin 16 that resets the press counter.'],
    code: `import time
import Jetson.GPIO as GPIO

LED_PIN = 12
BUTTON_PIN = 18     # 10 kOhm pull-up to 3.3 V, button to GND
led_on = False
presses = 0

def on_press(channel):
    global led_on, presses
    led_on = not led_on
    presses += 1
    GPIO.output(LED_PIN, led_on)
    print("press {} on pin {} -> LED {}".format(
        presses, channel, "ON" if led_on else "OFF"))

GPIO.setmode(GPIO.BOARD)
GPIO.setup(LED_PIN, GPIO.OUT, initial=GPIO.LOW)
GPIO.setup(BUTTON_PIN, GPIO.IN)
GPIO.add_event_detect(BUTTON_PIN, GPIO.FALLING,
                      callback=on_press, bouncetime={{bounce}})
print("Waiting for presses - Ctrl+C to quit")

try:
    while True:
        time.sleep(1)   # the main thread is free for other work
finally:
    GPIO.cleanup()`,
    params: { bounce: { value: 200, min: 0, max: 1000 } },
    async setup(io, b) {
      const st = b.st;
      st.edges.length = 0; st.ledOn = false; st.presses = 0; st.lastAccepted = -1e9;
      io.line('setmode'); await io.delay(100);
      io.line('GPIO.setup(BUTTON_PIN'); io.pin('pin 18', 'HIGH', false); await io.delay(100);
      io.line('add_event_detect'); await io.delay(150);
      io.line('print("Waiting'); io.print('Waiting for presses - Ctrl+C to quit');
    },
    async loop(io, b, p) {
      const st = b.st;
      io.line('time.sleep(1)');
      for (let i = 0; i < 20; i++) {
        io.pin('pin 18', b.btn.pressed ? 'LOW' : 'HIGH', b.btn.pressed);
        while (st.edges.length) {
          const t = st.edges.shift();
          if (t - st.lastAccepted < p.bounce) continue; // inside bouncetime: ignored
          st.lastAccepted = t;
          io.line('def on_press');
          st.ledOn = !st.ledOn;
          st.presses++;
          io.line('GPIO.output(LED_PIN, led_on)');
          if (st.ledOn) b.on(); else b.off();
          io.pin('pin 12', st.ledOn ? 'HIGH' : 'LOW', st.ledOn);
          io.line('print("press');
          io.print(`press ${st.presses} on pin 18 -> LED ${st.ledOn ? 'ON' : 'OFF'}`);
          await io.delay(60);
          io.line('time.sleep(1)');
        }
        await io.delay(50);
      }
    },
    reset(b) { b.off(); b.st.edges.length = 0; },
  },

  // ------------------------------------------------------------------ 4
  {
    id: 'jetson-pwm', title: 'Hardware PWM', icon: 'servo',
    thumb: () => { const s = makeServo(v(0, 0, 0)); s.set(60); return s.group; },
    view: { center: [1.6, 1.2, -3.2], size: 14, az: 25 },
    build(ctx) {
      powerOn(ctx);
      const servo = ctx.add(makeServo(v(0.6, 0, -7.4)));
      const [gnd, pwr, sig] = servo.leads;
      const wg = ctx.wire(gnd, ctx.board.pin('PIN34'), 'brown', { signal: 'GND', lift: 1.4 });
      const wp = ctx.wire(pwr, ctx.board.pin('PIN4'), 'red', { signal: '5V', lift: 1.8, dir: -1 });
      const ws = ctx.wire(sig, ctx.board.pin('PIN33'), 'orange', { signal: 'pin 33', lift: 1.0, dir: -1 });
      servo.set(90);
      ctx.interact(servo, { name: 'Micro servo', hint: 'Its angle follows the pulse width on pin 33', note: () => '0.5 ms = 0°, 1.5 ms = 90°, 2.5 ms = 180°' });
      ctx.anchor('servo', servo.anchor);
      ctx.anchor('sig', ws.mid);
      ctx.anchor('pwr', wp.mid);
      ctx.anchor('gndw', wg.mid);
      return { servo, angle: 90 };
    },
    callouts: [
      { anchor: 'sig', x: 0.36, y: 0.12, icon: 'pwm', title: 'Pin 33 · PWM2', text: 'Hardware PWM: a 50 Hz pulse train from a timer, not Python.' },
      { anchor: 'servo', x: 0.7, y: 0.17, icon: 'servo', title: 'Micro servo', text: 'The pulse width (0.5–2.5 ms) sets the angle.' },
      { anchor: 'pwr', x: 0.04, y: 0.17, icon: 'plug', title: '5 V · pin 4', text: 'Servo power. Big servos need their own supply.' },
      { anchor: 'module', x: 0.04, y: 0.68, icon: 'gear', title: 'Enable it first', text: 'Run <code>sudo /opt/nvidia/jetson-io/jetson-io.py</code> and turn on pwm2.' },
      { anchor: 'gndw', x: 0.7, y: 0.68, icon: 'gnd', title: 'GND · pin 34', text: 'Servo and Jetson must share ground.' },
    ],
    overview: {
      heading: 'Hardware PWM',
      text: 'Pins 32 and 33 are connected to real PWM hardware, so the pulse timing stays perfect even while Linux is busy. <code>GPIO.PWM(33, 50)</code> makes a 50 Hz signal; the duty cycle sets the pulse width, and the pulse width sets the servo’s angle. First enable the pin’s PWM function with <code>jetson-io</code>.',
      features: [['pwm', '<code>GPIO.PWM(pin, Hz)</code> on pins 32 / 33 only'], ['gear', 'Pinmux: <code>jetson-io.py</code> → Configure header → pwm2, then reboot'], ['servo', 'Duty % = pulse ms ÷ 20 ms × 100']],
    },
    pinout: [['Pin 33 (PWM2)', 'Servo signal (orange)', 'Needs pinmux via jetson-io'], ['Pin 4 (5 V)', 'Servo power (red)', '≤ 1 A total from the header'], ['Pin 34 (GND)', 'Servo ground (brown)', 'Common ground']],
    example: {
      text: 'Pan-tilt camera mounts, robot grippers and steering on small robot cars are all servos — on a Jetson they often aim the camera at whatever the neural network just detected.',
      points: ['Make the sweep smoother with a smaller <code>step</code>', 'Point the servo at an angle typed into the terminal with <code>input()</code>'],
    },
    specs: [['PWM pins', '32 (PWM0) and 33 (PWM2)'], ['Frequency', '50 Hz → 20 ms period'], ['Pulse range', '0.5–2.5 ms → 2.5–12.5 % duty'], ['Servo', 'SG90-style, 4.8–6 V'], ['Signal level', '3.3 V (accepted by most servos)']],
    quiz: [
      { q: 'At 50 Hz, what duty cycle gives a 1.5 ms pulse?', options: ['1.5 %', '7.5 %', '15 %', '50 %'], answer: 1, explain: 'The period is 20 ms, and 1.5 / 20 = 0.075 → 7.5 %.' },
      { q: 'Why use pins 32/33 instead of any GPIO for a servo?', options: ['They are 5 V pins', 'They drive PWM hardware, so the timing doesn’t jitter when Linux is busy', 'They are closer to the fan', 'Other pins are input-only'], answer: 1, explain: 'Software-timed pulses wobble with CPU load; servos twitch. The PWM controller times pulses in hardware.' },
      { q: 'What must you do before GPIO.PWM(33, 50) works on a fresh Nano?', options: ['Install Arduino', 'Enable the pin’s PWM function in the pinmux with jetson-io.py and reboot', 'Solder a jumper', 'Nothing'], answer: 1, explain: 'By default pins 32/33 are plain GPIO; jetson-io reconfigures the pinmux so the PWM controller drives them.' },
    ],
    challenges: ['Move to 0°, 90° and 180° with a one-second pause at each.', 'Read an angle from the terminal with <code>input()</code> and go there.', 'Control a 5 V PWM fan on pin 32 at 25 kHz with a transistor (fans need far more current than a pin).'],
    code: `import time
import Jetson.GPIO as GPIO

SERVO_PIN = 33   # PWM2 - enable it with jetson-io.py first
FREQ = 50        # 50 Hz = one pulse every 20 ms

def duty_for(angle):
    pulse_ms = 0.5 + angle / 180 * 2.0   # 0.5 .. 2.5 ms
    return pulse_ms / 20 * 100           # % of the period

GPIO.setmode(GPIO.BOARD)
GPIO.setup(SERVO_PIN, GPIO.OUT)
pwm = GPIO.PWM(SERVO_PIN, FREQ)
pwm.start(duty_for(90))

try:
    while True:
        for angle in range(0, 181, {{step}}):      # sweep up
            pwm.ChangeDutyCycle(duty_for(angle))
            time.sleep({{pause}} / 1000)
        print("{:3d} deg  duty {:.2f} %".format(angle, duty_for(angle)))
        for angle in range(180, -1, -{{step}}):    # sweep down
            pwm.ChangeDutyCycle(duty_for(angle))
            time.sleep({{pause}} / 1000)
        print("{:3d} deg  duty {:.2f} %".format(angle, duty_for(angle)))
finally:
    pwm.stop()
    GPIO.cleanup()`,
    params: { step: { value: 5, min: 1, max: 45 }, pause: { value: 30, min: 10, max: 500 } },
    async setup(io, b) {
      const duty = (a) => ((0.5 + (a / 180) * 2) / 20) * 100;
      io.line('setmode'); await io.delay(100);
      io.line('GPIO.setup'); await io.delay(100);
      io.line('pwm = GPIO.PWM'); await io.delay(100);
      io.line('pwm.start'); b.servo.set(90); b.angle = 90; io.pin('pin 33', `${duty(90).toFixed(2)} %`, true); await io.delay(300);
    },
    async loop(io, b, p) {
      const duty = (a) => ((0.5 + (a / 180) * 2) / 20) * 100;
      let last = 0;
      for (let a = 0; a <= 180; a += p.step) {
        io.line('ChangeDutyCycle', 1); b.servo.set(a); last = a; io.pin('pin 33', `${duty(a).toFixed(2)} %`, true);
        io.line('time.sleep', 1); await io.delay(p.pause);
      }
      io.line('print("{:3d}', 1); io.print(`${String(last).padStart(3)} deg  duty ${duty(last).toFixed(2)} %`);
      for (let a = 180; a >= 0; a -= p.step) {
        io.line('ChangeDutyCycle', 2); b.servo.set(a); last = a; io.pin('pin 33', `${duty(a).toFixed(2)} %`, true);
        io.line('time.sleep', 2); await io.delay(p.pause);
      }
      io.line('print("{:3d}', 2); io.print(`${String(last).padStart(3)} deg  duty ${duty(last).toFixed(2)} %`);
    },
    reset(b) { b.servo.set(90); },
  },

  // ------------------------------------------------------------------ 5
  {
    id: 'jetson-i2c', title: 'Talk I²C', icon: 'wave',
    thumb: () => { const m = makeMPU6050(v(0, 0, 0)); m.setTilt(15, -10); return m.group; },
    view: { center: [3.6, 1.0, -1.6], size: 15, az: 10 },
    build(ctx) {
      powerOn(ctx);
      const mpu = ctx.add(makeMPU6050(v(8.6, 0, -3.4)));
      const wv = ctx.wire(ctx.board.pin('PIN1'), mpu.pin('VCC'), 'red', { signal: '3V3' });
      ctx.wire(ctx.board.pin('PIN6'), mpu.pin('GND'), 'black', { signal: 'GND', dir: -1 });
      const wsda = ctx.wire(ctx.board.pin('PIN3'), mpu.pin('SDA'), 'blue', { signal: 'SDA' });
      const wscl = ctx.wire(ctx.board.pin('PIN5'), mpu.pin('SCL'), 'yellow', { signal: 'SCL' });
      const plot = ctx.plotter({ title: 'Tilt', series: [{ name: 'pitch °', color: '#e5412e', min: -90, max: 90 }, { name: 'roll °', color: '#3b78e7', min: -90, max: 90 }] });
      const st = { pitch: 0, roll: 0, auto: true, t: 0, prev: [0, 0] };
      ctx.onTick((dt) => {
        if (st.auto) {
          st.t += dt;
          st.pitch = 28 * Math.sin(st.t * 0.9);
          st.roll = 20 * Math.sin(st.t * 0.55 + 1);
        }
        mpu.setTilt(st.pitch, st.roll);
      });
      ctx.interact(mpu, {
        name: 'MPU-6050', hint: 'Tilt the sensor',
        controls: [
          { type: 'range', label: 'Pitch', min: -80, max: 80, step: 1, get: () => Math.round(st.pitch), set: (x) => { st.auto = false; st.pitch = x; }, format: (x) => `${x}°` },
          { type: 'range', label: 'Roll', min: -80, max: 80, step: 1, get: () => Math.round(st.roll), set: (x) => { st.auto = false; st.roll = x; }, format: (x) => `${x}°` },
          { type: 'toggle', label: 'Wobble by itself', get: () => st.auto, set: (x) => (st.auto = x) },
        ],
      });
      ctx.anchor('mpu', mpu.anchor);
      ctx.anchor('sda', wsda.mid);
      ctx.anchor('scl', wscl.mid);
      ctx.anchor('vcc', wv.mid);
      return { mpu, plot, st };
    },
    callouts: [
      { anchor: 'sda', x: 0.04, y: 0.17, icon: 'wave', title: 'SDA · pin 3', text: 'Data line of I²C bus 1 (/dev/i2c-1).' },
      { anchor: 'scl', x: 0.36, y: 0.12, icon: 'timer', title: 'SCL · pin 5', text: 'The clock the Jetson drives, 400 kHz max here.' },
      { anchor: 'mpu', x: 0.7, y: 0.17, icon: 'hand', title: 'MPU-6050', text: 'Click it to tilt. Accelerometer + gyro at address 0x68.' },
      { anchor: 'vcc', x: 0.04, y: 0.68, icon: 'bolt', title: '3.3 V · pin 1', text: 'Powers the module; GND on pin 6.' },
    ],
    overview: {
      heading: 'Talk I²C',
      text: 'I²C lets many chips share two wires. With <code>smbus2</code> you wake the MPU-6050, read 14 bytes of raw accelerometer and gyro data in one go, and turn the direction of gravity into pitch and roll angles. Check the address first with <code>i2cdetect -y -r 1</code>.',
      features: [['wave', '<code>smbus2.SMBus(1)</code> = pins 3 and 5'], ['code', 'Combine two bytes into a signed 16-bit value'], ['hand', 'Tilt the sensor and watch the plot']],
    },
    pinout: [['Pin 1 (3.3 V)', 'VCC', ''], ['Pin 6 (GND)', 'GND', ''], ['Pin 3 (SDA)', 'SDA', 'I²C bus 1'], ['Pin 5 (SCL)', 'SCL', 'I²C bus 1'], ['AD0', 'Not connected', 'Address 0x68 (0x69 if HIGH)']],
    example: {
      text: 'Drones, self-balancing robots, phone screens that rotate and camera gimbals all measure tilt with an accelerometer and gyro like this.',
      points: ['Run <code>i2cdetect -y -r 1</code> on the Jetson — you should see 68', 'Print the chip’s temperature: bytes 6–7, raw / 340 + 36.53 °C'],
    },
    specs: [['Bus', 'I²C bus 1, /dev/i2c-1'], ['Address', '0x68'], ['Accel range', '±2 g → 16384 LSB/g'], ['Gyro range', '±250 °/s → 131 LSB/(°/s)'], ['Library', 'smbus2 (<code>pip3 install smbus2</code>)']],
    quiz: [
      { q: 'Which header pins carry I²C bus 1 on the Jetson Nano?', options: ['Pins 27 and 28', 'Pins 3 (SDA) and 5 (SCL)', 'Pins 32 and 33', 'Pins 8 and 10'], answer: 1, explain: 'Pins 3/5 are bus 1 (/dev/i2c-1); pins 27/28 are bus 0.' },
      { q: 'Why subtract 65536 when the combined value is above 32767?', options: ['To convert to volts', 'The sensor sends signed two’s-complement numbers', 'To remove noise', 'I²C requires it'], answer: 1, explain: 'Readings can be negative; values ≥ 32768 represent negative numbers in 16-bit two’s complement.' },
      { q: 'The sensor lies flat and still. What does it read on the Z axis?', options: ['0 g', 'About +1 g', '−9.8 g', '16384 g'], answer: 1, explain: 'It measures gravity: lying flat, the whole 1 g appears on Z (raw ≈ 16384).' },
    ],
    challenges: ['Print the temperature sensor too (bytes 6–7).', 'Light an LED on pin 12 when the board tips past 30°.', 'Smooth the angles with a complementary filter that blends in the gyro.'],
    code: `import math
import time
from smbus2 import SMBus

ADDR = 0x68             # MPU-6050 with AD0 low
PWR_MGMT_1 = 0x6B
ACCEL_XOUT_H = 0x3B

def word(hi, lo):
    value = (hi << 8) | lo
    return value - 65536 if value > 32767 else value

with SMBus(1) as bus:   # /dev/i2c-1 = pins 3 and 5
    bus.write_byte_data(ADDR, PWR_MGMT_1, 0)   # wake up
    while True:
        d = bus.read_i2c_block_data(ADDR, ACCEL_XOUT_H, 14)
        ax, ay, az = (word(d[i], d[i + 1]) / 16384 for i in (0, 2, 4))
        gx, gy, gz = (word(d[i], d[i + 1]) / 131 for i in (8, 10, 12))
        pitch = math.degrees(math.atan2(-ax, math.sqrt(ay * ay + az * az)))
        roll = math.degrees(math.atan2(ay, az))
        print("pitch {:5.1f}  roll {:5.1f}  gyro {:4.0f} {:4.0f} {:4.0f}".format(
            pitch, roll, gx, gy, gz))
        time.sleep({{rate}} / 1000)`,
    params: { rate: { value: 200, min: 20, max: 2000 } },
    async setup(io, b) {
      io.line('with SMBus(1)'); await io.delay(100);
      io.line('write_byte_data'); io.pin('SDA', '0x68 ← 0x6B 0x00', true); io.pin('SCL', '400 kHz', true); await io.delay(200);
      b.plot.reset(); b.prev = null;
    },
    async loop(io, b, p) {
      const st = b.st;
      const r = Math.PI / 180;
      const th = st.pitch * r, ph = st.roll * r;
      const n = () => (Math.random() - 0.5) * 0.012;
      // gravity in the sensor frame, as raw 16-bit counts (±2 g range)
      const raw = (g) => clamp(Math.round(g * 16384), -32768, 32767);
      const ax = raw(-Math.sin(th) + n()) / 16384, ay = raw(Math.sin(ph) * Math.cos(th) + n()) / 16384, az = raw(Math.cos(ph) * Math.cos(th) + n()) / 16384;
      const now = performance.now();
      const dts = b.prev ? Math.max(0.01, (now - b.prev.t) / 1000) : 1;
      const gx = b.prev ? (st.roll - b.prev.roll) / dts : 0, gy = b.prev ? (st.pitch - b.prev.pitch) / dts : 0;
      b.prev = { t: now, pitch: st.pitch, roll: st.roll };
      const gn = () => (Math.random() - 0.5) * 0.6;
      io.line('read_i2c_block_data'); io.pin('SDA', '14 bytes @ 0x3B', true);
      io.line('ax, ay, az');
      io.line('pitch = math');
      const pitch = (Math.atan2(-ax, Math.sqrt(ay * ay + az * az)) * 180) / Math.PI;
      const roll = (Math.atan2(ay, az) * 180) / Math.PI;
      b.plot.push(pitch, roll);
      io.line('print("pitch');
      const f = (x) => x.toFixed(1).padStart(5);
      const gf = (x) => x.toFixed(0).padStart(4);
      io.print(`pitch ${f(pitch)}  roll ${f(roll)}  gyro ${gf(gx + gn())} ${gf(gy + gn())} ${gf(gn())}`);
      io.line('time.sleep'); await io.delay(p.rate);
    },
    reset() {},
  },

  // ------------------------------------------------------------------ 6
  {
    id: 'jetson-camera', title: 'Capture from the camera', icon: 'radar',
    thumb: () => makeCSICamera(v(0, 0, 0)).group,
    view: { center: [-5.2, 1.2, 6.2], size: 21, az: -12 },
    serialInput: { placeholder: 's = save snapshot · q = quit' },
    build(ctx) {
      powerOn(ctx);
      const st = { t: 0, running: false, fps: 0, flash: 0, keys: [], carX: -11, quit: false, flip: 0 };
      const d = aiDesk(ctx, {
        title: 'CSI camera', sub: 'OpenCV · idle',
        camInteract: { controls: [{ type: 'button', label: 'Press “s” in the preview (snapshot)', press: () => st.keys.push('s') }] },
      });
      const mug = ctx.add(makeMug(v(-4.6, MAT_H, 9.2)));
      const orange = ctx.add(makeOrange(v(-7.3, MAT_H, 7.4)));
      const bottle = ctx.add(makeBottle(v(-12.4, MAT_H, 10.6)));
      const banana = ctx.add(makeBanana(v(-9.6, MAT_H, 12.2)));
      const car = ctx.add(makeCar(v(-11, MAT_H, 14.2)));
      car.group.rotation.y = Math.PI / 2;
      ctx.onTick((dt) => {
        st.t += dt;
        st.flash = Math.max(0, st.flash - dt * 3);
        st.carX = -8.3 + Math.sin(st.t * 0.35) * 6.5;
        car.group.position.x = st.carX;
        car.group.rotation.y = Math.cos(st.t * 0.35) >= 0 ? -Math.PI / 2 : Math.PI / 2;
      });
      ctx.interact(orange, { name: 'Orange', hint: 'Roll it around the desk', controls: [{ type: 'range', label: 'Left ↔ right', min: -14, max: -2.5, step: 0.1, get: () => orange.group.position.x, set: (x) => (orange.group.position.x = x) }] });
      d.feed.draw((g, w, h) => {
        if (!st.running) return idleHint(g, w, h);
        // cv2.putText(frame, "29.9 fps", (20, 40), FONT_HERSHEY_SIMPLEX, 1.0, green, 2)
        g.font = '700 13px "IBM Plex Mono", monospace';
        g.lineWidth = 3;
        g.strokeStyle = 'rgba(0,0,0,.55)';
        g.strokeText(`${st.fps.toFixed(1)} fps`, (20 / 1280) * w, (40 / 720) * h + 6);
        g.fillStyle = '#00ff00';
        g.fillText(`${st.fps.toFixed(1)} fps`, (20 / 1280) * w, (40 / 720) * h + 6);
        flashFeed(g, w, h, st.flash);
      });
      ctx.anchor('mug', mug.anchor);
      ctx.anchor('car', car.anchor);
      return { ...d, st };
    },
    callouts: [
      { anchor: 'cam', x: 0.04, y: 0.17, icon: 'radar', title: 'Camera module', text: 'Sends raw frames to the Jetson’s ISP over 2 CSI lanes.' },
      { anchor: 'ribbon', x: 0.36, y: 0.12, icon: 'pins', title: 'CSI ribbon → J13', text: 'Contacts face the heatsink; lift the latch first.' },
      { anchor: 'chip', x: 0.7, y: 0.17, icon: 'chip', title: 'ISP + GStreamer', text: '<code>nvarguscamerasrc</code> debayers and scales on the hardware.' },
      { anchor: 'car', x: 0.04, y: 0.68, icon: 'car', title: 'Desk scene', text: 'Click the camera to take a snapshot, or the orange to move it.' },
    ],
    overview: {
      heading: 'Capture from the camera',
      text: 'A CSI camera’s frames go through the Jetson’s image processor, so you open it with a GStreamer pipeline: <code>nvarguscamerasrc</code> → <code>nvvidconv</code> → BGR into OpenCV’s <code>VideoCapture</code>. The script measures the real frame rate, stamps it on the image and saves a snapshot when you press <b>s</b>.',
      features: [['code', 'OpenCV + GStreamer (<code>cv2.CAP_GSTREAMER</code>)'], ['timer', 'Measure FPS over 30 frames with <code>time.time()</code>'], ['hand', 'Type <b>s</b> in the terminal (or click the camera) to save a JPEG']],
    },
    pinout: [['J13 (CSI)', 'Camera ribbon', 'Blue stiffener faces away from the heatsink'], ['sensor-id=0', 'First CSI camera', ''], ['flip-method', '0 = normal, 2 = rotate 180°', 'For upside-down mounts']],
    example: {
      text: 'Every vision project starts here: inspection cameras on production lines, plant-growth time-lapses, bird feeders that photograph visitors and robots that map rooms.',
      points: ['Set <code>FLIP</code> to 2 to see what an upside-down mount looks like', 'Ask for 60 fps — the IMX219 can do 1280×720 at 60'],
    },
    specs: [['Sensor', 'IMX219-style, 8 MP (3280 × 2464)'], ['Modes used', '1280×720 up to 60 fps'], ['Interface', 'MIPI CSI-2, 15-pin ribbon'], ['Libraries', 'OpenCV 4.1 (JetPack) with GStreamer'], ['Field of view', '≈ 62° horizontal']],
    quiz: [
      { q: 'Why open the CSI camera with a GStreamer pipeline instead of cv2.VideoCapture(0)?', options: ['It is the only way to use colour', 'CSI frames must pass through the Jetson’s ISP via nvarguscamerasrc', 'USB is faster', 'OpenCV cannot read cameras'], answer: 1, explain: 'The raw Bayer data needs the hardware ISP; nvarguscamerasrc does that and nvvidconv converts it for OpenCV.' },
      { q: 'What does cv2.waitKey(1) & 0xFF == ord("s") check?', options: ['Whether the camera is ready', 'Whether the s key was pressed in the preview window', 'The frame rate', 'If the file was saved'], answer: 1, explain: 'waitKey returns the key code pressed during the 1 ms wait (or −1); & 0xFF keeps the low byte.' },
      { q: '30 frames arrive in 1.02 s. What FPS is printed?', options: ['30.0', '29.4', '1.0', '32.0'], answer: 1, explain: 'fps = frames / elapsed = 30 / 1.02 ≈ 29.4.' },
    ],
    challenges: ['Save a snapshot automatically every 10 seconds (a time-lapse).', 'Convert each frame to greyscale with <code>cv2.cvtColor</code> before showing it.', 'Detect motion by comparing each frame with the previous one using <code>cv2.absdiff</code>.'],
    code: `import time
import cv2

WIDTH, HEIGHT, FPS, FLIP = 1280, 720, {{fps}}, {{flip}}

pipeline = (
    "nvarguscamerasrc sensor-id=0 ! "
    f"video/x-raw(memory:NVMM), width={WIDTH}, height={HEIGHT}, framerate={FPS}/1 ! "
    f"nvvidconv flip-method={FLIP} ! "
    f"video/x-raw, width={WIDTH}, height={HEIGHT}, format=BGRx ! "
    "videoconvert ! video/x-raw, format=BGR ! appsink drop=1"
)
cap = cv2.VideoCapture(pipeline, cv2.CAP_GSTREAMER)
frames, t0, fps, shots = 0, time.time(), 0.0, 0

while cap.isOpened():
    ok, frame = cap.read()
    if not ok:
        break
    frames += 1
    if frames == 30:                       # measure over 30 frames
        fps, frames, t0 = 30 / (time.time() - t0), 0, time.time()
        print("FPS: {:.1f}".format(fps))
    cv2.putText(frame, "{:.1f} fps".format(fps), (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
    cv2.imshow("CSI camera", frame)
    key = cv2.waitKey(1) & 0xFF
    if key == ord("s"):
        shots += 1
        name = "snapshot_{:04d}.jpg".format(shots)
        cv2.imwrite(name, frame)
        print("saved", name)
    elif key == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()`,
    params: { fps: { value: 30, min: 1, max: 60 }, flip: { value: 0, min: 0, max: 2 } },
    async setup(io, b, p) {
      const st = b.st;
      st.quit = false; st.frames = 0; st.shots = 0; st.fps = 0; st.keys.length = 0;
      // flip-method: 0 = none, 1 = rotate 90° counter-clockwise, 2 = rotate 180°
      b.feed.camera.up.set(...[[0, 1, 0], [1, 0, 0], [0, -1, 0]][p.flip]);
      b.feed.camera.lookAt(b.target);
      io.line('pipeline = ('); await io.delay(120);
      io.line('cap = cv2.VideoCapture');
      io.print('GST_ARGUS: Creating output stream');
      io.print(`GST_ARGUS: Running with following settings: Camera index = 0, Camera mode = ${p.fps > 30 ? 5 : 4}, Output Stream W = 1280 H = 720`);
      await io.delay(500);
      st.running = true; st.t0 = performance.now();
    },
    async loop(io, b, p) {
      const st = b.st;
      if (st.quit) { await io.delay(500); return; }
      io.line('cap.read()');
      st.frames++;
      if (st.frames === 30) {
        const now = performance.now();
        st.fps = 30 / ((now - st.t0) / 1000);
        st.frames = 0; st.t0 = now;
        io.line('print("FPS'); io.print(`FPS: ${st.fps.toFixed(1)}`);
      }
      b.setSub(`OpenCV · 1280×720 · ${st.fps ? st.fps.toFixed(1) : '…'} fps`);
      io.line('cv2.imshow');
      const typed = io.readLine();
      const key = (typed ?? st.keys.shift() ?? '').trim().toLowerCase()[0];
      if (key === 's') {
        io.line('cv2.imwrite');
        st.shots++; st.flash = 1;
        io.line('print("saved"'); io.print(`saved snapshot_${String(st.shots).padStart(4, '0')}.jpg`);
      } else if (key === 'q') {
        io.line('cap.release'); io.print('GST_ARGUS: Cleaning up');
        st.quit = true; st.running = false; b.setSub('OpenCV · closed');
        return;
      }
      // camera-paced: each read waits for the next frame (≈ 1/FPS s, a little overhead)
      await io.delay(1000 / p.fps + 0.4);
    },
    reset(b) {
      b.st.running = false; b.st.flash = 0; b.setSub('OpenCV · idle');
      b.feed.camera.up.set(0, 1, 0); b.feed.camera.lookAt(b.target);
    },
  },

  // ------------------------------------------------------------------ 7
  {
    id: 'jetson-classify', title: 'Image classification', icon: 'palette',
    thumb: () => makeMug(v(0, 0, 0)).group,
    view: { center: [-6.6, 1.2, 6.6], size: 20, az: -12 },
    build(ctx) {
      powerOn(ctx);
      const d = aiDesk(ctx, { title: 'imageNet · googlenet', fov: 30, look: 8.6, lookY: 1.25 });
      const spot = v(CAM.x, MAT_H, 9.0);
      const tt = new THREE.Group();
      tt.add(at(cyl(1.7, 1.8, 0.16, mat(0x2b2e36, { rough: 0.5 }), { seg: 40 }), 0, 0.08, 0));
      tt.add(at(cyl(1.55, 1.55, 0.02, mat(0x3a3e4a, { rough: 0.6 }), { seg: 40, outline: false }), 0, 0.17, 0));
      tt.position.copy(spot);
      ctx.addObject(tt);
      const items = [
        { key: 'mug', label: 'Coffee mug', obj: ctx.add(makeMug(v(-15.6, MAT_H, 5.4))), id: 504, desc: 'coffee mug', base: 0.93 },
        { key: 'bottle', label: 'Water bottle', obj: ctx.add(makeBottle(v(-13.8, MAT_H, 5.4))), id: 898, desc: 'water bottle', base: 0.86 },
        { key: 'orange', label: 'Orange', obj: ctx.add(makeOrange(v(-12.1, MAT_H, 5.4))), id: 950, desc: 'orange', base: 0.9 },
        { key: 'banana', label: 'Banana', obj: ctx.add(makeBanana(v(-3.6, MAT_H, 5.6))), id: 954, desc: 'banana', base: 0.96 },
        { key: 'car', label: 'Toy car', obj: ctx.add(makeCar(v(-15.0, MAT_H, 9.6))), id: 817, desc: 'sports car, sport car', base: 0.74 },
      ];
      items[4].obj.group.rotation.y = 0.15;
      for (const it of items) it.home = it.obj.group.position.clone();
      items[0].obj.group.position.set(spot.x, MAT_H + 0.17, spot.z);
      const st = { sel: 'mug', t: 0, spin: 0, running: false, top: null };
      ctx.onTick((dt) => {
        st.t += dt;
        st.spin += dt * 0.6;
        tt.children[1].rotation.y = st.spin;
        for (const it of items) {
          const g = it.obj.group;
          const goal = it.key === st.sel ? v(spot.x, MAT_H + 0.17, spot.z) : it.home;
          g.position.lerp(goal, 1 - Math.exp(-dt * 2.2));
          if (it.key === st.sel && g.position.distanceTo(goal) < 0.4) g.rotation.y = st.spin;
        }
      });
      const choose = { type: 'choice', label: 'Object on the turntable', options: items.map((it) => [it.key, it.label]), get: () => st.sel, set: (k) => (st.sel = k) };
      for (const it of items) ctx.interact(it.obj, { name: it.label, hint: 'Choose what the camera sees', controls: [choose] });
      ctx.interact({ group: tt, pick: tt }, { name: 'Turntable', hint: 'Choose what the camera sees', controls: [choose] });
      d.feed.draw((g, w, h) => {
        if (!st.running) return idleHint(g, w, h);
        if (st.top) feedText(g, `${(st.top.conf * 100).toFixed(2).padStart(5, '0')}% ${st.top.desc}`, 9, 19, { size: 13 });
      });
      ctx.anchor('tt', tt.position.clone().add(v(0, 0.4, 1.4)));
      ctx.anchor('shelf', items[1].home.clone().add(v(0, 3.2, 0)));
      return { ...d, st, items };
    },
    callouts: [
      { anchor: 'cam', x: 0.36, y: 0.12, icon: 'radar', title: 'CSI camera', text: 'Each frame is resized to 224×224 for GoogLeNet.' },
      { anchor: 'chip', x: 0.7, y: 0.17, icon: 'chip', title: 'GPU', text: 'TensorRT runs the network in FP16, ≈ 2 ms per frame.' },
      { anchor: 'shelf', x: 0.04, y: 0.17, icon: 'hand', title: 'Pick an object', text: 'Click any object to put a different one on the turntable.' },
      { anchor: 'tt', x: 0.04, y: 0.68, icon: 'info', title: 'Turntable', text: 'The network sees the object from every side.' },
    ],
    overview: {
      heading: 'Image classification',
      text: '<code>imageNet</code> loads GoogLeNet, trained on the 1000 ImageNet classes, and optimises it with TensorRT the first time it runs. <code>Classify()</code> returns the most likely class and its confidence for the whole image, which the script draws on the frame with <code>cudaFont</code>.',
      features: [['palette', '1000 classes: mugs, fruit, cars, dogs…'], ['code', '<code>class_id, confidence = net.Classify(img)</code>'], ['hand', 'Click an object to swap what the camera sees']],
    },
    pinout: [['CSI J13', 'Camera ribbon', ''], ['videoSource', '"csi://0"', 'Frames arrive in GPU memory'], ['Network', 'googlenet', 'Also resnet-18, alexnet…']],
    example: {
      text: 'Recycling sorters, plant-disease apps, quality checks that sort good parts from bad and “what bird is that?” cameras all use image classifiers.',
      points: ['Swap to <code>imageNet("resnet-18")</code> and compare speed and accuracy', 'Raise <code>MIN_CONF</code> so only confident answers are printed'],
    },
    specs: [['Network', 'GoogLeNet (ILSVRC-2012, 1000 classes)'], ['Input', '224 × 224 RGB'], ['Speed on a Nano', '≈ 60–70 fps network time (FP16)'], ['Library', 'jetson_inference / jetson_utils'], ['Simulation', 'The class comes from what is really in front of the camera']],
    quiz: [
      { q: 'What does an image classifier output?', options: ['A box around every object', 'One label (and confidence) for the whole image', 'The distance to objects', 'A depth map'], answer: 1, explain: 'Classification names the image as a whole; detection (next lesson) also locates each object.' },
      { q: 'Why is the first run of imageNet("googlenet") slow?', options: ['It downloads Linux', 'TensorRT builds an optimised engine for this GPU and caches it', 'The camera warms up', 'Python compiles the script'], answer: 1, explain: 'TensorRT profiles and fuses layers into a GPU-specific engine; later runs load the cached file.' },
      { q: 'GoogLeNet says “orange” at 41 %. What is the most sensible reading?', options: ['It’s definitely an orange', 'It’s unsure — maybe partly hidden or unusual lighting', 'The camera is broken', 'Confidence is always 41 %'], answer: 1, explain: 'Low confidence means the network isn’t sure; real systems ignore results below a threshold.' },
    ],
    challenges: ['Only print a result after it has been the top class for 10 frames in a row.', 'Light an LED on pin 12 whenever a banana is detected.', 'Write the class and confidence to a CSV log with a timestamp.'],
    code: `from jetson_inference import imageNet
from jetson_utils import videoSource, videoOutput, cudaFont

MIN_CONF = {{minconf}} / 100

net = imageNet("googlenet")
camera = videoSource("csi://0")
display = videoOutput("display://0")
font = cudaFont()
last = None

while display.IsStreaming():
    img = camera.Capture()
    if img is None:                  # capture timeout
        continue
    class_id, confidence = net.Classify(img)
    label = net.GetClassDesc(class_id)
    font.OverlayText(img, img.width, img.height,
                     "{:05.2f}% {}".format(confidence * 100, label),
                     5, 5, font.White, font.Gray40)
    display.Render(img)
    display.SetStatus("imageNet | {:.0f} FPS".format(net.GetNetworkFPS()))
    if class_id != last and confidence > MIN_CONF:
        print("class {:4d}  {:5.1%}  {}".format(class_id, confidence, label))
        last = class_id`,
    params: { minconf: { value: 40, min: 0, max: 99 } },
    async setup(io, b) {
      io.line('imageNet("googlenet")'); io.print('[TRT]    loading network plan engine: googlenet.caffemodel.1.1.FP16.engine'); await io.delay(500);
      io.print('[TRT]    imageNet -- loaded 1000 class info entries');
      io.line('videoSource'); io.print('[gstreamer] gstCamera -- nvarguscamerasrc sensor-id=0, 1280x720 @ 30 fps'); await io.delay(300);
      io.line('cudaFont()'); await io.delay(100);
      b.st.running = true; b.st.last = null;
    },
    async loop(io, b, p) {
      const st = b.st;
      io.line('camera.Capture');
      io.line('net.Classify');
      const r = b.size();
      let best = null;
      if (r) {
        for (const it of b.items) {
          const bx = clipBox(b.feed.boxOf(it.obj.group), r.width, r.height);
          if (!bx) continue;
          const area = (bx.w * bx.h) / (r.width * r.height);
          const size = clamp(area / 0.06, 0.25, 1);
          const conf = it.base * size * bx.frac ** 1.3 * (0.94 + 0.05 * Math.cos(st.spin * 2 + it.id));
          if (!best || conf > best.conf) best = { conf, id: it.id, desc: it.desc };
        }
      }
      // an empty turntable / a blurry, half-visible object: GoogLeNet falls back to the scene
      if (!best || best.conf < 0.3) best = { conf: 0.24 + 0.03 * Math.sin(st.t), id: 532, desc: 'dining table, board' };
      st.top = best;
      io.line('font.OverlayText');
      const fps = 30 - Math.random() * 0.6;
      b.setSub(`simulated · net ${(66 + Math.sin(st.t) * 3).toFixed(0)} fps · ${fps.toFixed(0)} fps`);
      io.line('display.Render');
      if (best.id !== st.last && best.conf > p.minconf / 100) {
        io.line('print("class');
        io.print(`class ${String(best.id).padStart(4)}  ${(best.conf * 100).toFixed(1).padStart(5)}%  ${best.desc}`);
        st.last = best.id;
      }
      await io.delay(1000 / fps);
    },
    reset(b) { b.st.running = false; b.st.top = null; b.setSub('simulated inference · idle'); },
  },

  // ------------------------------------------------------------------ 8
  {
    id: 'jetson-detect', title: 'Object detection', icon: 'radar',
    thumb: () => makePerson(v(0, 0, 0), { rotY: 0.5 }).group,
    view: { center: [-5.4, 1.4, 6.8], size: 21, az: -12 },
    build(ctx) {
      powerOn(ctx);
      const d = aiDesk(ctx, { title: 'detectNet', sub: 'simulated inference · idle' });
      const w1 = walker(ctx, { z: 14.0, a: -17.5, b: 0.8, speed: 1.5, phase: 0.35 });
      const car = ctx.add(makeCar(v(-11, MAT_H, 11.0)));
      car.group.rotation.y = Math.PI / 2;
      const mug = ctx.add(makeMug(v(-4.5, MAT_H, 7.6)));
      const bottle = ctx.add(makeBottle(v(-11.9, MAT_H, 8.6)));
      const banana = ctx.add(makeBanana(v(-8.0, MAT_H, 6.6)));
      const orange = ctx.add(makeOrange(v(-14.2, MAT_H, 13.6)));
      const st = { t: 0, carX: -11, carAuto: true, dets: [], running: false, frame: 0 };
      ctx.onTick((dt) => {
        st.t += dt;
        w1.step(dt);
        if (st.carAuto) {
          st.carX = -8.3 + Math.sin(st.t * 0.4) * 6;
          car.group.rotation.y = Math.cos(st.t * 0.4) >= 0 ? -Math.PI / 2 : Math.PI / 2;
        }
        car.group.position.x = st.carX;
      });
      ctx.interact(car, {
        name: 'Toy car', hint: 'Drive it yourself or let it roam',
        controls: [
          { type: 'range', label: 'Position', min: -17, max: 0.5, step: 0.1, get: () => st.carX, set: (x) => { st.carAuto = false; st.carX = x; }, format: (x) => `${Number(x).toFixed(1)} cm` },
          { type: 'toggle', label: 'Drive automatically', get: () => st.carAuto, set: (x) => (st.carAuto = x) },
        ],
      });
      ctx.interact(w1.person, { name: 'Person', hint: 'Walks across the room', controls: [{ type: 'toggle', label: 'Walking', get: () => w1.st.walking, set: (x) => { w1.st.walking = x; w1.place(); } }] });
      const items = [
        { obj: w1.person, cls: 'person', base: 0.95, seed: 1 },
        { obj: car, cls: 'car', base: 0.88, seed: 2 },
        { obj: mug, cls: 'cup', base: 0.82, seed: 3 },
        { obj: bottle, cls: 'bottle', base: 0.86, seed: 4 },
        { obj: banana, cls: 'banana', base: 0.8, seed: 5 },
        { obj: orange, cls: 'orange', base: 0.74, seed: 6 },
      ];
      d.feed.draw((g, w, h) => {
        if (!st.running) return idleHint(g, w, h);
        for (const det of st.dets) d.feed.label(g, det.box, `${det.cls} ${(det.conf * 100).toFixed(0)}%`, CLS_COLOR[det.cls]);
      });
      ctx.anchor('person', w1.person.anchor);
      ctx.anchor('car', car.anchor);
      ctx.anchor('mug', mug.anchor);
      ctx.anchor('bottle', bottle.anchor);
      return { ...d, st, items };
    },
    callouts: [
      { anchor: 'cam', x: 0.36, y: 0.12, icon: 'radar', title: 'CSI camera', text: '<code>videoSource("csi://0")</code> delivers frames straight into GPU memory.' },
      { anchor: 'chip', x: 0.7, y: 0.17, icon: 'chip', title: '128-core GPU', text: 'TensorRT runs SSD-MobileNet-v2 in FP16.' },
      { anchor: 'bottle', x: 0.04, y: 0.17, icon: 'hand', title: 'Things to find', text: 'Person, car, cup, bottle, banana, orange — 90 COCO classes in all.' },
      { anchor: 'car', x: 0.04, y: 0.68, icon: 'car', title: 'Moving targets', text: 'Click the car to drive it out of view and watch its box vanish.' },
    ],
    overview: {
      heading: 'Object detection',
      text: 'Classification names one thing; detection finds <em>every</em> object and where it is. <code>detectNet</code> runs SSD-MobileNet-v2 (trained on the COCO dataset) and returns a box, class and confidence for each object above the threshold — fast enough for live video.',
      features: [['radar', '<code>detectNet("ssd-mobilenet-v2", threshold=…)</code>'], ['code', 'Each detection: ClassID, Confidence, Left/Top/Right/Bottom, Center'], ['knob', 'Edit <code>THRESHOLD</code> to trade misses for false alarms']],
    },
    pinout: [['CSI J13', 'Camera ribbon', ''], ['videoSource', '"csi://0"', '1280×720 by default'], ['videoOutput', '"display://0"', 'Or rtp://…, file.mp4']],
    example: {
      text: 'Shop footfall analytics, wildlife cameras, safety zones around factory machines and robots that pick up litter all start with an object detector like this one.',
      points: ['Lower <code>THRESHOLD</code> to 20 and watch weak detections appear', 'Drive the car out of the frame and see its box disappear'],
    },
    specs: [['Network', 'SSD-MobileNet-v2 (COCO, 91 labels)'], ['Speed on a Nano', '≈ 20–25 fps at 1280×720'], ['Precision', 'FP16 via TensorRT'], ['Library', 'jetson_inference / jetson_utils'], ['Simulation', 'Boxes come from the real 3D props in view']],
    quiz: [
      { q: 'What does detectNet give you that imageNet does not?', options: ['Faster training', 'A bounding box for every object found', 'Higher resolution', 'Colour correction'], answer: 1, explain: 'Detection localises each object with a box, class and confidence; classification only labels the whole image.' },
      { q: 'What happens if you raise the threshold from 0.5 to 0.8?', options: ['More objects are reported', 'Fewer, more certain detections are reported', 'The network runs faster', 'Boxes get bigger'], answer: 1, explain: 'Only detections whose confidence clears the threshold are returned.' },
      { q: 'Why does SSD-MobileNet run in real time on a Nano?', options: ['It runs on the CPU', 'It is a lightweight network compiled by TensorRT for the GPU', 'It skips most frames', 'It runs in the cloud'], answer: 1, explain: 'MobileNet is designed for small devices, and TensorRT turns it into fast FP16 GPU kernels.' },
      { q: 'An object is only half in the frame. What usually happens?', options: ['It is always detected at 99 %', 'Its confidence drops and it may fall below the threshold', 'The program crashes', 'The box covers the whole frame'], answer: 1, explain: 'With less of the object visible the network is less sure, so the confidence falls.' },
    ],
    challenges: ['Print only detections of people.', 'Count how many cups and bottles are on the desk in each frame.', 'Save a crop of every car with <code>cudaAllocMapped</code> + <code>cudaCrop()</code>.'],
    code: `from jetson_inference import detectNet
from jetson_utils import videoSource, videoOutput

THRESHOLD = {{threshold}} / 100

net = detectNet("ssd-mobilenet-v2", threshold=THRESHOLD)
camera = videoSource("csi://0")      # MIPI CSI camera
display = videoOutput("display://0")
frame = 0

while display.IsStreaming():
    img = camera.Capture()
    if img is None:                  # capture timeout
        continue
    detections = net.Detect(img)     # draws boxes + labels on img
    display.Render(img)
    display.SetStatus("detectNet | {:.0f} FPS".format(net.GetNetworkFPS()))
    frame += 1
    if frame % 30 == 0:
        for d in detections:
            print("{:8s} {:4.0%}  centre ({:.0f}, {:.0f})".format(
                net.GetClassDesc(d.ClassID), d.Confidence, *d.Center))
        print("--- {} objects".format(len(detections)))`,
    params: { threshold: { value: 50, min: 5, max: 95 } },
    async setup(io, b) {
      io.line('detectNet("ssd'); io.print('[TRT]    loading network plan engine: ssd-mobilenet-v2 (FP16)'); await io.delay(600);
      io.print('[TRT]    detectNet -- loaded 91 class info entries');
      io.line('videoSource'); io.print('[gstreamer] gstCamera -- nvarguscamerasrc sensor-id=0, 1280x720 @ 30 fps'); await io.delay(300);
      io.line('videoOutput'); await io.delay(150);
      b.st.running = true; b.st.frame = 0;
    },
    async loop(io, b, p) {
      const st = b.st;
      io.line('camera.Capture');
      io.line('net.Detect');
      st.dets = simDetect(b, b.items, p.threshold / 100, st.t);
      const fps = 22.5 + Math.sin(st.t * 0.7) * 1.2 - st.dets.length * 0.25;
      b.setSub(`simulated inference · ${fps.toFixed(0)} fps`);
      io.line('display.Render');
      st.frame++;
      if (st.frame % 30 === 0) {
        io.line('print("{:8s}');
        for (const det of st.dets) io.print(`${det.cls.padEnd(8)} ${(det.conf * 100).toFixed(0).padStart(3)}%  centre (${det.px.cx.toFixed(0)}, ${det.px.cy.toFixed(0)})`);
        io.line('print("---'); io.print(`--- ${st.dets.length} objects`);
      }
      await io.delay(1000 / fps);
    },
    reset(b) { b.st.running = false; b.st.dets = []; b.setSub('simulated inference · idle'); },
  },

  // ------------------------------------------------------------------ 9
  {
    id: 'jetson-counter', title: 'People counter', icon: 'hand',
    thumb: () => { const g = new THREE.Group(); g.add(makePerson(v(-0.9, 0, 0), { rotY: 0.4 }).group, makePerson(v(0.9, 0, -0.6), { shirt: 0xe5412e, rotY: -0.4 }).group); return g; },
    view: { center: [-6.0, 1.4, 7.4], size: 22, az: -12 },
    build(ctx) {
      powerOn(ctx);
      const d = aiDesk(ctx, { title: 'detectNet · people counter', matW: 22, matX: -9.6, matD: 13 });
      const walkers = [
        walker(ctx, { z: 9.2, a: -19.5, b: 1.2, speed: 1.9, phase: 0.1, shirt: 0x3b78e7 }),
        walker(ctx, { z: 11.6, a: -19.5, b: 1.2, speed: 1.35, phase: 0.75, dir: -1, shirt: 0xe5412e, trousers: 0x3a3f55 }),
        walker(ctx, { z: 14.4, a: -19.5, b: 1.2, speed: 1.1, phase: 0.45, shirt: 0x3fbf5f, trousers: 0x5a4632 }),
      ];
      const st = { t: 0, running: false, tracks: new Map(), nextId: 0, cin: 0, cout: 0, people: [], lineX: 640 };
      ctx.onTick((dt) => { st.t += dt; for (const w of walkers) w.step(dt); });
      walkers.forEach((w, i) => ctx.interact(w.person, {
        name: `Person ${i + 1}`, hint: 'Walks across the camera’s view',
        controls: [{ type: 'toggle', label: 'Walking', get: () => w.st.walking, set: (x) => { w.st.walking = x; w.place(); } }, { type: 'button', label: 'Turn around', press: () => { w.st.dir *= -1; w.place(); } }],
      }));
      d.feed.draw((g, w, h) => {
        if (!st.running) return idleHint(g, w, h);
        const lx = (st.lineX / 1280) * w;
        g.strokeStyle = 'rgba(255,200,0,.9)';
        g.lineWidth = 3;
        g.beginPath(); g.moveTo(lx, 0); g.lineTo(lx, h); g.stroke();
        for (const pp of st.people) d.feed.label(g, pp.box, `person ID ${pp.id}`, '#2ee6a6');
        feedText(g, `in ${st.cin}  out ${st.cout}`, 9, 19, { size: 13, color: '#ffd84a' });
      });
      ctx.anchor('p1', walkers[0].person.anchor);
      ctx.anchor('p3', walkers[2].person.anchor);
      return { ...d, st, walkers, items: walkers.map((w, i) => ({ obj: w.person, cls: 'person', base: 0.95, seed: i * 2 + 1 })) };
    },
    callouts: [
      { anchor: 'cam', x: 0.36, y: 0.12, icon: 'radar', title: 'Camera', text: 'Detects every person in each frame with SSD-MobileNet-v2.' },
      { anchor: 'p3', x: 0.04, y: 0.17, icon: 'hand', title: 'Walking people', text: 'Click someone to stop them or turn them around.' },
      { anchor: 'chip', x: 0.7, y: 0.17, icon: 'code', title: 'Centroid tracker', text: 'Matches each box to the nearest one from the last frame.' },
      { anchor: 'p1', x: 0.04, y: 0.68, icon: 'pins', title: 'Virtual line', text: 'Crossing left → right counts “in”, right → left “out”.' },
    ],
    overview: {
      heading: 'People counter',
      text: 'Detection alone can’t count people walking past — the same person appears in hundreds of frames. A tiny <em>tracker</em> gives each person an ID by matching every box to the nearest centre from the previous frame. When a tracked centre crosses the virtual line, the counter goes up.',
      features: [['radar', 'Keep only <code>person</code> detections'], ['code', 'Nearest-centroid tracking with a max jump'], ['pins', 'Move the line with <code>LINE_X</code> (% of width)']],
    },
    pinout: [['CSI J13', 'Camera ribbon', ''], ['LINE_X', 'Virtual line position', '% of the frame width'], ['MAX_JUMP', 'Max movement per frame', 'In pixels']],
    example: {
      text: 'Shops, museums, buses and lifts count visitors this way to plan staff, ventilation and timetables — without storing any images.',
      points: ['Move the line to 25 % and watch when counts happen', 'Stop two people close together and see whether their IDs stay stable'],
    },
    specs: [['Detector', 'SSD-MobileNet-v2, person class only'], ['Tracker', 'Nearest centroid, 80 px max jump'], ['Frame rate', '≈ 20 fps (simulated)'], ['Privacy', 'Only counts are kept, no images'], ['Drawing', '<code>cudaDrawLine()</code> from jetson_utils']],
    quiz: [
      { q: 'Why does a people counter need tracking, not just detection?', options: ['Detection is too slow', 'Without IDs, the same person would be counted in every frame', 'Tracking makes boxes bigger', 'Detection only works on cars'], answer: 1, explain: 'Tracking links detections across frames so each person is counted once, when they cross the line.' },
      { q: 'A centre moves from x = 600 to x = 655 and the line is at 640. What happens?', options: ['Nothing', 'count_in goes up by one', 'count_out goes up by one', 'A new ID is created'], answer: 1, explain: 'It was left of the line and is now right of it (600 < 640 ≤ 655): a left-to-right crossing.' },
      { q: 'What is MAX_JUMP for?', options: ['To limit the frame rate', 'To avoid matching two different people who are far apart', 'To set the line width', 'To skip frames'], answer: 1, explain: 'If the nearest previous centre is too far away, the box is treated as a new person.' },
    ],
    challenges: ['Show the current occupancy (in − out) and warn above 3.', 'Use a horizontal line so people walking towards the camera are counted.', 'Forget tracks that haven’t been seen for 15 frames so a returning person gets a new ID.'],
    code: `from jetson_inference import detectNet
from jetson_utils import videoSource, videoOutput, cudaDrawLine

LINE_X = {{line}}       # % of the frame width
MAX_JUMP = 80         # px a person may move between frames

net = detectNet("ssd-mobilenet-v2", threshold=0.5)
camera = videoSource("csi://0")
display = videoOutput("display://0")
tracks = {}           # id -> (x, y) centre in the previous frame
next_id = 0
count_in = count_out = 0

def dist(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])

while display.IsStreaming():
    img = camera.Capture()
    if img is None:
        continue
    line_x = img.width * LINE_X / 100
    people = [d for d in net.Detect(img)
              if net.GetClassDesc(d.ClassID) == "person"]
    new_tracks = {}
    for d in people:
        c = d.Center
        best = min(tracks, key=lambda t: dist(tracks[t], c), default=None)
        if best is not None and dist(tracks[best], c) < MAX_JUMP:
            tid, prev_x = best, tracks.pop(best)[0]
            if prev_x < line_x <= c[0]:
                count_in += 1
                print("ID {} crossed ->  in {}  out {}".format(tid, count_in, count_out))
            elif c[0] < line_x <= prev_x:
                count_out += 1
                print("ID {} crossed <-  in {}  out {}".format(tid, count_in, count_out))
        else:
            tid, next_id = next_id, next_id + 1
            print("new person, ID", tid)
        new_tracks[tid] = c
    tracks = new_tracks
    cudaDrawLine(img, (line_x, 0), (line_x, img.height), (255, 200, 0, 220), 4)
    display.Render(img)
    display.SetStatus("in {}  out {}  | {:.0f} FPS".format(count_in, count_out, net.GetNetworkFPS()))`,
    params: { line: { value: 50, min: 10, max: 90 } },
    async setup(io, b, p) {
      const st = b.st;
      st.tracks = new Map(); st.nextId = 0; st.cin = 0; st.cout = 0; st.people = [];
      st.lineX = (1280 * p.line) / 100;
      io.line('detectNet("ssd'); io.print('[TRT]    loading network plan engine: ssd-mobilenet-v2 (FP16)'); await io.delay(500);
      io.line('videoSource'); io.print('[gstreamer] gstCamera -- nvarguscamerasrc sensor-id=0, 1280x720 @ 30 fps'); await io.delay(300);
      st.running = true;
    },
    async loop(io, b, p) {
      const st = b.st;
      st.lineX = (1280 * p.line) / 100;
      io.line('camera.Capture');
      io.line('people = [d for d');
      const dets = simDetect(b, b.items, 0.5, st.t);
      const dist = (a, c) => Math.abs(a.x - c.x) + Math.abs(a.y - c.y);
      const next = new Map();
      const shown = [];
      for (const det of dets) {
        const c = { x: det.px.cx, y: det.px.cy };
        let best = null;
        for (const [id, prev] of st.tracks) if (best === null || dist(prev, c) < dist(st.tracks.get(best), c)) best = id;
        let tid;
        if (best !== null && dist(st.tracks.get(best), c) < 80) {
          tid = best;
          const px = st.tracks.get(best).x;
          st.tracks.delete(best);
          if (px < st.lineX && st.lineX <= c.x) {
            st.cin++; io.line('crossed ->'); io.print(`ID ${tid} crossed ->  in ${st.cin}  out ${st.cout}`);
          } else if (c.x < st.lineX && st.lineX <= px) {
            st.cout++; io.line('crossed <-'); io.print(`ID ${tid} crossed <-  in ${st.cin}  out ${st.cout}`);
          }
        } else {
          tid = st.nextId++;
          io.line('new person'); io.print(`new person, ID ${tid}`);
        }
        next.set(tid, c);
        shown.push({ id: tid, box: det.box });
      }
      st.tracks = next;
      st.people = shown;
      io.line('cudaDrawLine');
      const fps = 21 + Math.sin(st.t) * 1.2;
      b.setSub(`simulated · in ${st.cin} out ${st.cout} · ${fps.toFixed(0)} fps`);
      io.line('display.Render');
      await io.delay(1000 / fps);
    },
    reset(b) { b.st.running = false; b.st.people = []; b.setSub('simulated inference · idle'); },
  },

  // ------------------------------------------------------------------ 10
  {
    id: 'jetson-security-cam', title: 'AI security camera', icon: 'sound',
    thumb: () => { const g = new THREE.Group(); g.add(makeCSICamera(v(-1.4, 0, 0), { yaw: 0.4 }).group, makePerson(v(1.6, 0, 1.4), { shirt: 0x24262c, rotY: -0.5 }).group); g.scale.setScalar(0.8); return g; },
    view: { center: [-2.8, 1.2, 3.8], size: 27, az: -8 },
    build(ctx) {
      powerOn(ctx);
      const d = aiDesk(ctx, { title: 'Security camera', sub: 'disarmed', matW: 21, matX: -9.5 });
      const bb = ctx.breadboard(...BBJ);
      const led = jLed(ctx, bb, { pin: 'PIN12', col: 3, color: 'red' });
      const q = ctx.add(makeTO92([bb.hole(15, 'h'), bb.hole(16, 'h'), bb.hole(17, 'h')], 'NPN'));
      const rb = ctx.add(makeResistor(bb.hole(12, 'g'), bb.hole(16, 'g'), 1000));
      const bz = ctx.add(makeBuzzer(bb.hole(21, 'f'), bb.hole(24, 'f')));
      const w16 = ctx.wire(ctx.board.pin('PIN16'), bb.hole(12, 'j'), 'yellow', { signal: 'pin 16', lift: 2.6 });
      ctx.wire(ctx.board.pin('PIN14'), bb.hole(15, 'j'), 'black', { signal: 'GND', dir: -1, lift: 2.4 });
      ctx.wire(bb.hole(17, 'j'), bb.hole(21, 'j'), 'white', { lift: 0.5 });
      const w5 = ctx.wire(ctx.board.pin('PIN2'), bb.hole(24, 'j'), 'red', { signal: '5V', lift: 3.0 });
      const intruder = walker(ctx, { z: 11.5, a: -18.5, b: -7.6, speed: 2.2, phase: 0, shirt: 0x24262c, trousers: 0x3a3f55 });
      intruder.st.walking = false;
      const mug = ctx.add(makeMug(v(-5.4, MAT_H, 7.2)));
      const bottle = ctx.add(makeBottle(v(-12.6, MAT_H, 7.8)));
      const st = { t: 0, running: false, auto: true, plan: 'out', wait: 1.5, dets: [], seen: 0, alarm: false, buzz: false, flash: 0, lastAlarm: -1e9, log: 0 };
      const send = (where) => { st.plan = where; intruder.st.walking = true; intruder.st.dir = where === 'in' ? 1 : -1; };
      ctx.onTick((dt) => {
        st.t += dt;
        st.flash = Math.max(0, st.flash - dt * 2.5);
        intruder.step(dt);
        const ws = intruder.st;
        if (ws.walking && ((st.plan === 'in' && ws.x >= -7.6) || (st.plan === 'out' && ws.x <= -18.5))) {
          ws.walking = false; intruder.place(); st.wait = st.plan === 'in' ? 4 : 5;
        }
        if (st.auto && !ws.walking) {
          st.wait -= dt;
          if (st.wait <= 0) send(st.plan === 'in' ? 'out' : 'in');
        }
      });
      const ctl = [
        { type: 'button', label: 'Walk in now', press: () => send('in') },
        { type: 'button', label: 'Walk out', press: () => send('out') },
        { type: 'toggle', label: 'Come and go automatically', get: () => st.auto, set: (x) => (st.auto = x) },
      ];
      ctx.interact(intruder.person, { name: 'Visitor', hint: 'Send them into the camera’s view', controls: ctl });
      ctx.interact(bz, { name: 'Active buzzer', hint: 'Switched by the NPN transistor from 5 V' });
      ctx.interact(q, { name: 'NPN transistor', hint: 'Pin 16 (3.3 V, a few mA) switches the buzzer’s ≈ 25 mA' });
      d.feed.draw((g, w, h) => {
        if (!st.running) return idleHint(g, w, h);
        for (const det of st.dets) d.feed.label(g, det.box, `${det.cls} ${(det.conf * 100).toFixed(0)}%`, det.cls === 'person' ? (st.alarm ? '#ff5a4f' : '#2ee6a6') : CLS_COLOR[det.cls]);
        feedText(g, st.alarm ? `ALERT  person ${st.seen} frames` : `armed  person ${st.seen} frames`, 9, 19, { size: 12, color: st.alarm ? '#ff8a80' : '#9df0c8' });
        feedText(g, new Date().toLocaleTimeString('en-GB'), w - 76, 19, { size: 11 });
        flashFeed(g, w, h, st.flash);
      });
      ctx.anchor('led', led.led.anchor);
      ctx.anchor('bz', bz.anchor);
      ctx.anchor('q', q.anchor);
      ctx.anchor('w16', w16.mid);
      ctx.anchor('w5', w5.mid);
      ctx.anchor('intruder', intruder.person.anchor);
      return {
        ...d, st, led, bz, intruder,
        items: [{ obj: intruder.person, cls: 'person', base: 0.95, seed: 1 }, { obj: mug, cls: 'cup', base: 0.8, seed: 2 }, { obj: bottle, cls: 'bottle', base: 0.85, seed: 3 }],
      };
    },
    callouts: [
      { anchor: 'intruder', x: 0.04, y: 0.17, icon: 'hand', title: 'Visitor', text: 'Walks in and out on their own — click to send them in now.' },
      { anchor: 'cam', x: 0.36, y: 0.12, icon: 'radar', title: 'Camera + detectNet', text: 'A person must be seen for N frames in a row.' },
      { anchor: 'led', x: 0.7, y: 0.17, icon: 'led', title: 'Alarm LED · pin 12', text: 'On while the alarm is active.' },
      { anchor: 'w16', x: 0.04, y: 0.68, icon: 'transistor', title: 'Pin 16 → NPN', text: 'A transistor switches the buzzer from 5 V.' },
      { anchor: 'bz', x: 0.36, y: 0.74, icon: 'sound', title: 'Buzzer', text: 'Beeps for one second, then the cooldown starts.' },
    ],
    overview: {
      heading: 'AI security camera',
      text: 'Put it all together: detectNet watches the room, and when a person has been seen for <code>CONFIRM_FRAMES</code> frames in a row the Jetson lights the red LED, sounds the buzzer and saves a time-stamped snapshot. A cooldown stops one visitor triggering a flood of alarms.',
      features: [['radar', 'Detection with a confirm-frames filter'], ['led', 'GPIO outputs: LED + transistor-switched buzzer'], ['timer', 'Cooldown and timestamps with <code>time</code> / <code>datetime</code>']],
    },
    pinout: [['Pin 12', '330 Ω → red LED', 'Alarm light'], ['Pin 16', '1 kΩ → NPN base', 'Buzzer switch'], ['Pin 14 (GND)', 'NPN emitter', ''], ['Pin 2 (5 V)', 'Buzzer (+)', 'Buzzer (–) → NPN collector'], ['Pin 6 (GND)', 'LED (–)', ''], ['CSI J13', 'Camera ribbon', '']],
    example: {
      text: 'Smart doorbells, wildlife-trail cameras and workshop safety monitors work like this: they run the detector locally and only raise an alert (or upload an image) when something important happens.',
      points: ['Set <code>CONFIRM_FRAMES</code> to 1 and see how jumpy it gets', 'Make the cooldown 30 s so one visit gives one alarm'],
    },
    specs: [['Detector', 'SSD-MobileNet-v2, threshold 0.6'], ['Confirm', '<code>CONFIRM_FRAMES</code> in a row'], ['Outputs', 'LED (pin 12), buzzer via NPN (pin 16)'], ['Snapshots', '<code>saveImage()</code> → intruder-YYYYMMDD-HHMMSS.jpg'], ['Transistor', 'NPN, e.g. 2N2222, 1 kΩ base resistor']],
    quiz: [
      { q: 'Why wait for several consecutive frames before raising the alarm?', options: ['To save power', 'To ignore one-frame false detections', 'The camera needs time to focus', 'GPIO is slow'], answer: 1, explain: 'A single wrong detection in one frame shouldn’t trigger an alarm; requiring N frames in a row filters them out.' },
      { q: 'Why is the buzzer switched by a transistor?', options: ['To make it louder than 5 V', 'A header pin can only supply a few mA; the buzzer needs more', 'Buzzers need AC', 'Transistors save snapshots'], answer: 1, explain: 'The pin only drives the transistor’s base; the buzzer current comes from the 5 V supply.' },
      { q: 'What does the cooldown do?', options: ['Cools the GPU', 'Stops a second alarm (and snapshot) until COOLDOWN_S seconds have passed', 'Slows the frame rate', 'Turns the LED off'], answer: 1, explain: 'Without it, a visitor standing in view would trigger an alarm and save a picture every frame.' },
      { q: 'Where does the snapshot’s timestamp come from?', options: ['The camera', 'datetime.now().strftime(...) on the Jetson', 'The GPU', 'The file system picks it'], answer: 1, explain: 'strftime formats the current date and time into the file name.' },
    ],
    challenges: ['Ignore people in the left third of the frame (a “privacy zone”).', 'Arm and disarm the system with the button from the events lesson.', 'Send the snapshot to your phone (e.g. with an HTTP POST) instead of only saving it.'],
    code: `import time
from datetime import datetime
import Jetson.GPIO as GPIO
from jetson_inference import detectNet
from jetson_utils import videoSource, saveImage

LED_PIN, BUZZER_PIN = 12, 16
CONFIRM_FRAMES = {{frames}}   # person seen this many frames in a row
COOLDOWN_S = {{cooldown}}      # seconds between alarms

GPIO.setmode(GPIO.BOARD)
GPIO.setup([LED_PIN, BUZZER_PIN], GPIO.OUT, initial=GPIO.LOW)
net = detectNet("ssd-mobilenet-v2", threshold=0.6)
camera = videoSource("csi://0")
seen, last_alarm = 0, 0.0
print("Armed")

try:
    while True:
        img = camera.Capture()
        if img is None:
            continue
        people = [d for d in net.Detect(img)
                  if net.GetClassDesc(d.ClassID) == "person"]
        seen = seen + 1 if people else 0
        now = time.time()
        if seen >= CONFIRM_FRAMES and now - last_alarm > COOLDOWN_S:
            last_alarm = now
            stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
            saveImage("intruder-{}.jpg".format(stamp), img)
            print("{} ALERT person x{} -> intruder-{}.jpg".format(stamp, len(people), stamp))
        GPIO.output(LED_PIN, seen >= CONFIRM_FRAMES)
        GPIO.output(BUZZER_PIN, now - last_alarm < 1.0)
finally:
    GPIO.cleanup()`,
    params: { frames: { value: 5, min: 1, max: 60 }, cooldown: { value: 10, min: 1, max: 120 } },
    async setup(io, b) {
      const st = b.st;
      st.seen = 0; st.lastAlarm = -1e9; st.alarm = false;
      io.line('setmode'); await io.delay(80);
      io.line('GPIO.setup(['); io.pin('pin 12', 'LOW', false); io.pin('pin 16', 'LOW', false); await io.delay(100);
      io.line('detectNet("ssd'); io.print('[TRT]    loading network plan engine: ssd-mobilenet-v2 (FP16)'); await io.delay(500);
      io.line('videoSource'); io.print('[gstreamer] gstCamera -- nvarguscamerasrc sensor-id=0, 1280x720 @ 30 fps'); await io.delay(250);
      io.line('print("Armed'); io.print('Armed');
      st.running = true; b.setSub('armed');
    },
    async loop(io, b, p) {
      const st = b.st;
      io.line('camera.Capture');
      io.line('people = [d for d');
      st.dets = simDetect(b, b.items, 0.6, st.t);
      const people = st.dets.filter((x) => x.cls === 'person');
      io.line('seen = seen + 1');
      st.seen = people.length ? st.seen + 1 : 0;
      const now = performance.now() / 1000;
      if (st.seen >= p.frames && now - st.lastAlarm > p.cooldown) {
        st.lastAlarm = now;
        const s = stamp();
        io.line('saveImage'); st.flash = 1;
        io.line('print("{} ALERT'); io.print(`${s} ALERT person x${people.length} -> intruder-${s}.jpg`);
      }
      io.line('GPIO.output(LED_PIN');
      const alarm = st.seen >= p.frames;
      if (alarm !== st.alarm) { st.alarm = alarm; if (alarm) b.led.on(); else b.led.off(); io.pin('pin 12', alarm ? 'HIGH' : 'LOW', alarm); }
      io.line('GPIO.output(BUZZER_PIN');
      const buzz = now - st.lastAlarm < 1.0;
      if (buzz !== st.buzz) { st.buzz = buzz; b.bz.set(buzz, 2400); if (buzz) io.tone(2400); else io.noTone(); io.pin('pin 16', buzz ? 'HIGH' : 'LOW', buzz); }
      const fps = 21.5 + Math.sin(st.t * 0.8);
      b.setSub(`${st.alarm ? 'ALERT' : 'armed'} · simulated · ${fps.toFixed(0)} fps`);
      await io.delay(1000 / fps);
    },
    reset(b, io) {
      const st = b.st;
      st.running = false; st.dets = []; st.alarm = false; st.buzz = false; st.seen = 0;
      b.led.off(); b.bz.set(false); io?.noTone?.(); b.setSub('disarmed');
    },
  },
];

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['chip', 'Jetson Nano-style dev kit', 'Linux computer with a 128-core GPU for running neural networks at the edge.', 'jetson-meet'],
  ['pins', '40-pin header (Jetson)', 'Pi-compatible GPIO, I²C, SPI, UART and PWM — 3.3 V logic only.', 'jetson-gpio-blink'],
  ['radar', 'CSI camera module', '8 MP MIPI CSI-2 camera on a flat ribbon cable.', 'jetson-camera'],
  ['wave', 'MPU-6050', '3-axis accelerometer + 3-axis gyro on I²C (address 0x68).', 'jetson-i2c'],
  ['gear', 'Heatsink fan', '5 V PWM fan that keeps the Jetson module cool under load.', 'jetson-meet'],
  ['sound', 'Active buzzer', 'Beeps by itself when powered; switch it with a transistor.', 'jetson-security-cam'],
];
