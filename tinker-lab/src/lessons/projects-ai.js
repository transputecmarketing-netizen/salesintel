// Track — Physical AI: Jetson Python capstones where a camera and a neural
// network decide and something in the real world moves. The AI is simulated
// truthfully: every classification, detection and hand landmark is derived from
// the 3D props actually in front of the virtual camera (their projected boxes
// or joints), never invented. Confidence drops for small, dim or partly visible
// objects; the networks themselves are not run in the browser.
import * as THREE from 'three';
import { makeCSICamera, makeRibbon } from '../scene/boards/jetson.js';
import { makeESP32 } from '../scene/boards/esp32.js';
import { makeLED, makeResistor, makeTrafficLight, makeCar } from '../scene/components.js';
import { makeRobotCar } from '../scene/modules.js';
import { mat, mesh, box, cyl, at, canvasTexture } from '../scene/kit.js';
import {
  makeSorter, makePCA9685, makeUSBCam, makePlasticBottle, makeCan, makePaper, makeBananaPeel, makeCrispPacket,
  makeFox, makeDeer, makeBird, makeBush, makeHand, makeLeafSample, LEAF_CONDITIONS, makeRoadCross,
} from '../scene/modules/planet.js';
import { v, clamp } from './helpers.js';

// ================================================================ shared helpers
const BBJ = [10.8, -2.2]; // breadboard to the right of the 40-pin header
const MAT_H = 0.12;
const CAM = v(-8.3, 0, -0.2);
const MAT_Z0 = 4.5;
const now = () => performance.now();
const K = (part, kind, label) => Object.assign(part, { kind, label });
const follow = (vec) => ({ clone: () => vec });
const pad2 = (n) => String(n).padStart(2, '0');
const stamp = (d = new Date()) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
/** Deterministic wobble for confidences (no Math.random flicker). */
const wob = (t, seed) => 0.5 * Math.sin(t * 2.3 + seed * 7.1) + 0.5 * Math.sin(t * 0.7 + seed * 3.3);
const gain33 = (ohms) => clamp(((1.3 / ohms) * 1000) / 4, 0.12, 1);

function jLed(ctx, bb, { pin, col, color = 'red', ohms = 330, wire = 'orange' }) {
  const n = /\d+/.exec(pin)[0];
  ctx.step(`${ohms} Ω resistor and ${color} LED for pin ${n}`);
  const res = ctx.add(K(makeResistor(bb.hole(col, 'd'), bb.hole(col + 4, 'd'), ohms), 'resistor', `${ohms} Ω resistor`));
  const led = ctx.add(K(makeLED(color, bb.hole(col + 4, 'c'), bb.hole(col + 5, 'c')), 'led', `${color} LED`));
  const sig = ctx.wire(ctx.board.pin(pin), bb.hole(col, 'b'), wire, { signal: `pin ${n}` });
  ctx.wire(bb.hole(col + 5, 'a'), bb.hole(col + 5, 'top-'), 'black', { signal: 'GND', dir: -1, lift: 0.4 });
  const g = gain33(ohms);
  return { res, led, sig, on: (x = 1) => led.set(x ? g : 0) };
}

/** Breadboard right of the header with Jetson GND on its – rail. */
function jetsonBench(ctx) {
  ctx.step('Breadboard to the right of the 40-pin header; pin 6 (GND) to the – rail');
  const bb = ctx.breadboard(...BBJ);
  ctx.wire(ctx.board.pin('GND'), bb.hole(2, 'top-'), 'black', { signal: 'GND', dir: -1, lift: 1.6 });
  return bb;
}

function deskMat(w, d, colors = ['#2f6b5a', 'rgba(220,240,230,.13)', 'rgba(220,240,230,.3)']) {
  const tex = canvasTexture(1024, Math.round((1024 * d) / w), (c, W, H) => {
    c.fillStyle = colors[0];
    c.fillRect(0, 0, W, H);
    const s = W / w;
    for (let x = 0; x <= w; x += 1) { c.strokeStyle = x % 5 ? colors[1] : colors[2]; c.lineWidth = x % 5 ? 1 : 2; c.beginPath(); c.moveTo(x * s, 0); c.lineTo(x * s, H); c.stroke(); }
    for (let z = 0; z <= d; z += 1) { c.strokeStyle = z % 5 ? colors[1] : colors[2]; c.lineWidth = z % 5 ? 1 : 2; c.beginPath(); c.moveTo(0, z * s); c.lineTo(W, z * s); c.stroke(); }
  });
  const side = mat(0x285c4d, { rough: 0.8 });
  return mesh(new THREE.BoxGeometry(w, MAT_H, d), [side, side, mat(0xffffff, { map: tex, rough: 0.85, unique: true }), side, side, side]);
}

/** Things only the virtual camera sees (layer 1): keeps the feed looking like a real room or field. */
function feedOnly(g) { g.traverse((o) => { o.layers.set(1); o.raycast = () => {}; }); return g; }

function feedWall(cx, y, z, w, h, draw) {
  const tex = canvasTexture(1024, 512, draw);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
  wall.position.set(cx, y, z);
  wall.rotation.y = Math.PI;
  return wall;
}

function roomWall(c, W, H) {
  const gr = c.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#cfd6e2'); gr.addColorStop(1, '#e9e4d8');
  c.fillStyle = gr; c.fillRect(0, 0, W, H);
  c.fillStyle = '#f7f4ec'; c.fillRect(W * 0.6, H * 0.3, W * 0.22, H * 0.45);
  c.fillStyle = '#9fcbea'; c.fillRect(W * 0.61, H * 0.32, W * 0.2, H * 0.41);
  c.fillStyle = '#b9a07c'; c.fillRect(0, H * 0.94, W, H * 0.06);
}

function floorPlane(cx, cz, w, d, color = '#c9a77c') {
  const tex = canvasTexture(512, 512, (c, W, H) => {
    c.fillStyle = color; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) { c.strokeStyle = `rgba(90,70,40,${0.04 + (i % 5) * 0.015})`; c.lineWidth = 1 + (i % 3); const y = (i / 60) * H; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(W * 0.3, y + 6, W * 0.7, y - 6, W, y + 3); c.stroke(); }
  }, { repeat: [4, 4] });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(cx, -0.03, cz);
  return m;
}

/** Make the camera panel see-through (the feed is drawn into the WebGL canvas behind it). */
function feedPanel(ctx, { position, target, fov, title, sub }) {
  const feed = ctx.camera({ position, target, fov, title, sub });
  feed.camera?.layers.enable(1);
  if (feed.el) {
    feed.el.style.background = 'transparent';
    feed.el.querySelector('.panel-body')?.style.setProperty('background', 'transparent');
    feed.el.querySelector('header')?.style.setProperty('background', 'var(--paper-solid)');
  }
  const subEl = feed.el?.querySelector('header small');
  const feedEl = feed.el?.querySelector('.feed');
  return {
    feed,
    setSub: (t) => { if (subEl && subEl.textContent !== t) subEl.textContent = t; },
    size: () => { const r = feedEl?.getBoundingClientRect(); return r && r.width > 10 ? r : null; },
  };
}

/** CSI camera on its stand (optionally on a riser) with the ribbon into J13 and a feed panel. */
function csiRig(ctx, { pos = CAM, riser = 0, look = 9, lookY, fov = 50, title, sub = 'simulated inference · idle' } = {}) {
  if (riser > 0) {
    ctx.step('A riser block lifts the camera to the right height');
    const r = new THREE.Group();
    r.add(at(box(3.0, riser, 3.0, mat(0xd8cdb4, { rough: 0.8 })), 0, riser / 2, -0.4));
    r.position.set(pos.x, 0, pos.z);
    r.userData.label = 'Camera riser block';
    ctx.addObject(r);
  }
  ctx.step('CSI camera, facing the scene; its ribbon goes into the J13 connector');
  const cam = makeCSICamera(v(pos.x, riser, pos.z));
  cam.group.userData.label = 'CSI camera module';
  ctx.addObject(cam.group);
  const ribbon = makeRibbon(ctx.board.csi, cam.ribbonEnd, 1.6, { dirB: cam.ribbonDir, axisA: ctx.board.csiAxis, axisB: cam.ribbonAxis, bendB: cam.ribbonBend });
  ctx.addObject(ribbon.group);
  const eye = cam.lensWorld.clone().addScaledVector(cam.lookDir, 0.08);
  const target = eye.clone().addScaledVector(cam.lookDir, look);
  target.y = lookY ?? eye.y;
  const p = feedPanel(ctx, { position: eye, target, fov, title, sub });
  ctx.interact(cam, { name: 'CSI camera', hint: '8 MP IMX219-style sensor on a 15-way ribbon' });
  ctx.anchor('cam', cam.anchor);
  return { cam, ribbon, eye, target, ...p };
}

/** Clip a feed-space box to the frame. Returns null if (almost) nothing is visible. */
function clipBox(b, w, h) {
  if (!b.visible || !Number.isFinite(b.x)) return null;
  const x0 = Math.max(0, b.x), y0 = Math.max(0, b.y), x1 = Math.min(w, b.x + b.w), y1 = Math.min(h, b.y + b.h);
  if (x1 - x0 < 3 || y1 - y0 < 3) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, frac: ((x1 - x0) * (y1 - y0)) / Math.max(1, b.w * b.h) };
}

/** Detection from what is really in view: box, size and visible fraction set the confidence. */
function seeObj(rig, obj, base, t, seed) {
  const r = rig.size();
  if (!r || obj.group.visible === false) return null;
  const b = clipBox(rig.feed.boxOf(obj.group), r.width, r.height);
  if (!b) return null;
  const size = clamp(0.6 + (b.h / r.height) * 1.3, 0.6, 1);
  const vis = clamp(0.25 + b.frac * 0.75, 0, 1);
  const conf = clamp(base * size * vis + 0.02 * wob(t, seed), 0.03, 0.99);
  const sx = 1280 / r.width, sy = 720 / r.height;
  return { box: b, conf, px: { cx: (b.x + b.w / 2) * sx, cy: (b.y + b.h / 2) * sy, w: b.w * sx, h: b.h * sy }, frame: r };
}

function idleHint(g, w, text = 'Press Run to start the script') {
  g.fillStyle = 'rgba(13,16,32,.6)';
  g.fillRect(0, 0, w, 24);
  g.fillStyle = '#e9ecf5';
  g.font = '600 11px "IBM Plex Mono", monospace';
  g.fillText(text, 10, 16);
}

function feedText(g, text, x, y, { color = '#ffffff', bg = 'rgba(40,44,60,.72)', size = 12 } = {}) {
  g.font = `600 ${size}px "IBM Plex Mono", monospace`;
  const w = g.measureText(text).width;
  if (bg) { g.fillStyle = bg; g.fillRect(x - 4, y - size, w + 8, size + 6); }
  g.fillStyle = color;
  g.fillText(text, x, y);
}

function powerOn(ctx) { ctx.board.setBuiltinLed?.(1); }

/** A plain 5 V bench supply for servos (posts + / -). */
function makeSupply5V(pos) {
  const g = new THREE.Group();
  g.add(at(box(4.0, 1.6, 2.6, mat(0x3a3d46, { rough: 0.6 })), 0, 0.8, 0));
  g.add(at(box(2.2, 0.6, 0.05, mat(0x9fc6a0)), -0.5, 1.0, 1.31));
  const posts = [];
  for (const [x, c] of [[1.0, 0xd8443a], [1.6, 0x2a2c33]]) {
    g.add(at(cyl(0.18, 0.18, 0.4, mat(c), { seg: 12 }), x, 1.8, 0.5));
    g.add(at(cyl(0.06, 0.06, 0.3, mat(0xd6b46a, { metal: 0.6 }), { seg: 8, outline: false }), x, 2.15, 0.5));
    posts.push(v(x, 2.3, 0.5).add(pos));
  }
  g.position.copy(pos);
  g.updateMatrixWorld(true);
  return K({ group: g, pick: g, anchor: v(pos.x, pos.y + 2.8, pos.z), plus: posts[0], minus: posts[1] }, 'module', '5 V 4 A servo supply');
}

/** Little signal head on a pole (mirrors the breadboard modules). set(name) lights one lamp. */
function signalHead(pos, rotY = 0) {
  const g = new THREE.Group();
  g.add(at(cyl(0.08, 0.08, 2.6, mat(0x5a5e68), { seg: 8 }), 0, 1.3, 0));
  g.add(at(box(0.6, 1.5, 0.45, mat(0x24262c)), 0, 3.0, 0));
  const lamps = {};
  [['red', 3.45, 0xe5412e], ['amber', 3.0, 0xf5c02a], ['green', 2.55, 0x3fbf5f]].forEach(([n, y, c]) => {
    const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(c).multiplyScalar(0.35), emissive: c, emissiveIntensity: 0 });
    g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), m), 0, y, 0.24));
    lamps[n] = m;
  });
  g.position.copy(pos);
  g.rotation.y = rotY;
  return { group: g, set(name) { for (const [n, m] of Object.entries(lamps)) m.emissiveIntensity = n === name ? 1.6 : 0; } };
}

// ================================================================ lessons
export const projectsAI = [
  // ------------------------------------------------------------------ 1 waste sorter
  {
    id: 'ai-waste-sorter', title: 'AI waste sorter', icon: 'servo',
    thumb: () => makeSorter(v(0, 0, 0)).group,
    view: { center: [-7.5, 5, 0], size: 34, az: -8 },
    build(ctx) {
      powerOn(ctx);
      const SX = -15, SZ = 2;
      ctx.step('Sorter: a tray with a servo trapdoor over a servo-turned chute and three bins');
      const sorter = ctx.add(makeSorter(v(SX, 0, SZ)));
      ctx.step('Camera mast behind the sorter');
      const mast = new THREE.Group();
      mast.add(at(box(2.4, 0.3, 2.4, mat(0x3a3d46)), 0, 0.15, 0));
      mast.add(at(cyl(0.18, 0.18, 14.6, mat(0x9aa0a8, { metal: 0.4 }), { seg: 12 }), 0, 7.4, 0));
      mast.add(at(box(0.3, 0.3, 6.8, mat(0x9aa0a8, { metal: 0.4 })), 0, 14.6, 3.2));
      mast.position.set(SX, 0, SZ - 7.6);
      mast.userData.label = 'Camera mast';
      ctx.addObject(mast);
      ctx.step('USB webcam looking straight down at the tray; its cable goes to a USB port');
      const tray = sorter.trayCenter;
      const cam = ctx.add(makeUSBCam(v(tray.x, 13.9, tray.z), { pitch: Math.PI / 2, cableTo: v(0.83, 0.6, 4.6) }));
      cam.extras.forEach((o) => ctx.addObject(o));
      ctx.addObject(feedOnly(floorPlane(SX, SZ, 60, 60, '#b9bcc2')));
      const rig = feedPanel(ctx, { position: cam.lensWorld, target: cam.lensWorld.clone().add(v(0, -6, 0.6)), fov: 46, title: 'Sorter camera', sub: 'simulated inference · idle' });
      ctx.step('PCA9685 servo driver on I²C: 3V3 → VCC, pin 3 → SDA, pin 5 → SCL, pin 6 → GND');
      const pca = ctx.add(makePCA9685(v(-6, 0, -8)));
      ctx.wire(ctx.board.pin('PIN1'), pca.pin('VCC'), 'red', { signal: '3V3', lift: 1.6 });
      const wSda = ctx.wire(ctx.board.pin('PIN3'), pca.pin('SDA'), 'blue', { signal: 'pin 3', lift: 1.9 });
      ctx.wire(ctx.board.pin('PIN5'), pca.pin('SCL'), 'yellow', { signal: 'pin 5', lift: 2.2 });
      ctx.wire(ctx.board.pin('PIN9'), pca.pin('GND'), 'black', { signal: 'GND', lift: 1.3, dir: -1 });
      ctx.step('Servo power from a separate 5 V supply into the V+ terminal');
      const psu = ctx.add(makeSupply5V(v(-6.5, 0, -12.5)));
      ctx.wire(psu.plus, pca.pin('TERM_V+'), 'red', { lift: 1.4 });
      ctx.wire(psu.minus, pca.pin('TERM_GND'), 'black', { lift: 1.2, dir: -1 });
      ctx.step('Trapdoor servo on channel 0, chute servo on channel 1');
      const sw = [];
      for (const [nm, ch] of [['FLAP', 0], ['CHUTE', 1]]) {
        ctx.wire(sorter.pin(`${nm}_GND`), pca.pin(`S${ch}_GND`), 'brown', { lift: 2.2 + ch * 0.4 });
        ctx.wire(sorter.pin(`${nm}_V+`), pca.pin(`S${ch}_V+`), 'red', { lift: 2.4 + ch * 0.4 });
        sw.push(ctx.wire(sorter.pin(`${nm}_S`), pca.pin(`S${ch}`), 'orange', { lift: 2.6 + ch * 0.4, signal: `CH${ch}` }));
      }
      // items: a small pool of each kind
      const KINDS = [
        ['plastic_bottle', makePlasticBottle, 0.93], ['can', makeCan, 0.92], ['paper', makePaper, 0.84],
        ['food_waste', makeBananaPeel, 0.9], ['crisp_packet', makeCrispPacket, 0.8],
      ];
      ctx.step('Things to sort: bottles, cans, paper, banana peel, crisp packets');
      const pool = [];
      KINDS.forEach(([cls, make, base]) => {
        for (let k = 0; k < 2; k++) {
          const it = ctx.add(make(v(SX - 9 + pool.length * 1.6, 0, 9)));
          it.group.visible = false;
          pool.push({ obj: it, cls, base, state: 'idle', seed: pool.length + 1 });
        }
      });
      const st = { running: false, auto: true, next: 'plastic_bottle', light: 1, current: null, wait: 1.2, t: 0, label: 'empty', conf: 0, counts: [0, 0, 0], streak: 0, last: null, busy: false };
      const place = (cls) => {
        let it = pool.find((p) => p.cls === cls && p.state === 'idle');
        if (!it) { pool.forEach((p) => { if (p.state === 'binned') { p.state = 'idle'; p.obj.group.visible = false; } }); sorter.resetBins(); it = pool.find((p) => p.cls === cls && p.state === 'idle'); }
        it.state = 'tray';
        it.obj.group.position.copy(tray);
        it.obj.group.rotation.set(0, Math.random() * 6.28, 0);
        it.obj.group.visible = true;
        st.current = it;
      };
      const order = ['plastic_bottle', 'food_waste', 'can', 'crisp_packet', 'paper'];
      let oi = 0;
      ctx.onTick((dt) => {
        st.t += dt;
        if (!st.current && !st.busy) {
          st.wait -= dt;
          if (st.auto && st.wait <= 0) { place(order[oi++ % order.length]); st.wait = 1.5; }
        }
      });
      ctx.interact(sorter, {
        name: 'Feed the sorter', hint: 'Drop an item on the tray',
        controls: [
          { type: 'choice', label: 'Item', options: KINDS.map(([c]) => [c, c.replace('_', ' ')]), get: () => st.next, set: (c) => (st.next = c) },
          { type: 'button', label: 'Drop it on the tray', press: () => { if (!st.current && !st.busy) place(st.next); } },
          { type: 'toggle', label: 'Feed automatically', get: () => st.auto, set: (x) => (st.auto = x) },
          { type: 'choice', label: 'Lighting', options: [[1, 'Good'], [0.7, 'Dim'], [0.45, 'Very dim']], get: () => st.light, set: (x) => (st.light = +x) },
        ],
        note: () => `Bins: recycling ${st.counts[0]} · compost ${st.counts[1]} · landfill ${st.counts[2]}`,
      });
      ctx.interact(pca, { name: 'PCA9685', hint: '16 servo channels over I²C (0x40); 50 Hz from its own oscillator' });
      rig.feed.draw((g, w, h) => {
        if (st.light < 1) { g.fillStyle = `rgba(10,12,20,${(1 - st.light) * 0.8})`; g.fillRect(0, 0, w, h); }
        if (!st.running) return idleHint(g, w);
        const bx = st.box;
        if (bx && st.label !== 'empty') rig.feed.label(g, bx, `${st.label} ${(st.conf * 100).toFixed(0)}%`, st.conf >= st.threshold ? '#2ee6a6' : '#ffb547');
        feedText(g, `${st.label} ${(st.conf * 100).toFixed(0)}%`, 9, 19);
        feedText(g, `R ${st.counts[0]}  C ${st.counts[1]}  L ${st.counts[2]}`, w - 108, 19, { size: 11 });
      });
      ctx.anchor('tray', tray);
      ctx.anchor('camU', cam.anchor);
      ctx.anchor('pca', pca.anchor);
      ctx.anchor('bins', sorter.binAnchor(0));
      ctx.anchor('sda', wSda.mid);
      ctx.anchor('servo', sw[1].mid);
      return { ...rig, st, sorter, pool, tray };
    },
    callouts: [
      { anchor: 'camU', x: 0.04, y: 0.17, icon: 'radar', title: 'USB webcam', text: '<code>videoSource("/dev/video0")</code> looks straight down at the tray.' },
      { anchor: 'tray', x: 0.36, y: 0.12, icon: 'hand', title: 'Tray + trapdoor', text: 'Click it to drop an item, or dim the lights.' },
      { anchor: 'pca', x: 0.7, y: 0.17, icon: 'servo', title: 'PCA9685 · I²C', text: 'Hardware PWM for both servos: the Jetson only sends angles.' },
      { anchor: 'bins', x: 0.04, y: 0.68, icon: 'check', title: 'Three bins', text: 'Recycling, compost, landfill. Unsure goes to landfill: it never contaminates recycling.' },
      { anchor: 'servo', x: 0.36, y: 0.74, icon: 'bolt', title: 'Servo power', text: 'From a separate 5 V supply; only GND is shared with the logic.' },
    ],
    overview: {
      heading: 'AI waste sorter',
      text: 'Image classification (<b>Image classification</b>) meets servos (<b>Hardware PWM</b>): a fine-tuned ResNet-18 names the item on the tray, a chute servo aims at the right bin and a trapdoor drops it. A confirm count and a confidence threshold keep mistakes out of the recycling.',
      features: [['palette', '<code>imageNet</code> with your own ONNX model and labels'], ['servo', 'adafruit-servokit on a PCA9685 over I²C'], ['check', 'N frames in a row, then sort; unsure → landfill']],
    },
    pinout: [
      ['Pin 1 (3V3)', 'PCA9685 VCC', 'Logic supply'],
      ['Pin 3 / pin 5', 'PCA9685 SDA / SCL', 'I²C bus 1, address 0x40'],
      ['Pin 9 (GND)', 'PCA9685 GND', 'Common ground'],
      ['5 V supply + / –', 'PCA9685 V+ / GND terminal', 'Servo power, ≥ 2 A'],
      ['Channel 0', 'Trapdoor servo', '0° closed, 90° open'],
      ['Channel 1', 'Chute servo', '52° / 90° / 128° = the three bins'],
      ['USB', 'UVC webcam', '/dev/video0'],
    ],
    example: {
      text: 'Recycling plants use cameras and AI to pick plastics, cans and paper off fast conveyor belts with air jets or robot arms, and smart bins sort a single item at a time just like this one.',
      points: ['Dim the lights: confidence falls below the threshold and items go to landfill', 'Raise CONFIRM to wait longer before sorting', 'Train your own model with <code>train.py</code> on photos of your own rubbish (100+ per class)'],
    },
    specs: [
      ['Model', 'ResNet-18 fine-tuned (transfer learning) on 6 classes incl. “empty”'],
      ['Speed', '≈ 60–100 classifications/s at 224 × 224 on a Nano (TensorRT FP16)'],
      ['Servo driver', 'PCA9685, 12-bit PWM, 16 channels, I²C'],
      ['Servos', '2 × MG90S-style, 5 V from a separate supply'],
      ['Libraries', 'jetson_inference, jetson_utils, adafruit-circuitpython-servokit'],
      ['Simulation', 'Class = the item really on the tray; confidence from its size, visibility and the light'],
    ],
    quiz: [
      { q: 'Why does an unsure item go to landfill instead of recycling?', options: ['Landfill is closer', 'One wrong item can contaminate a whole batch of recycling', 'The model is always wrong', 'Servos prefer it'], answer: 1, explain: '“When in doubt, throw it out” is real recycling advice: contamination costs more than a lost item.' },
      { q: 'Why use a PCA9685 rather than toggling GPIO pins for the servos?', options: ['Linux cannot time 1–2 ms pulses reliably; the PCA9685 generates them in hardware', 'GPIO pins are 5 V', 'Servos need I²C', 'It is cheaper than a servo'], answer: 0, explain: 'The chip makes steady 50 Hz pulses by itself; Python only writes the angle.' },
      { q: 'What is the “empty” class for?', options: ['Nothing', 'So the model has a correct answer when the tray is bare, instead of guessing an item', 'To count bins', 'To train faster'], answer: 1, explain: 'A classifier always picks some class; giving it “empty” stops it inventing items.' },
      { q: 'Why wait for CONFIRM identical answers in a row?', options: ['The camera is slow', 'An item is still moving or half-seen right after it lands; agreement filters out one-frame mistakes', 'Servos need warming up', 'It saves memory'], answer: 1, explain: 'Requiring agreement over several frames trades a little speed for fewer wrong sorts.' },
    ],
    challenges: ['Print a running percentage for each bin.', 'Light a red LED and refuse to sort when the tray is “empty” for 30 s while items are expected (a jam).', 'Add a fourth bin for glass and retrain the model with a glass class.'],
    code: `import time
from adafruit_servokit import ServoKit
from jetson_inference import imageNet
from jetson_utils import videoSource, videoOutput, cudaFont

THRESHOLD = {{threshold}} / 100      # below this: not sure -> landfill
CONFIRM = {{confirm}}                # same answer this many frames in a row
BIN_FOR = {"plastic_bottle": 0, "can": 0, "paper": 0,
           "food_waste": 1, "crisp_packet": 2}
BIN_NAME = ["recycling", "compost", "landfill"]
CHUTE_ANGLE = [52, 90, 128]          # servo angle that aims at each bin
FLAP, CHUTE = 0, 1                   # PCA9685 channels

kit = ServoKit(channels=16)          # I2C bus 1, address 0x40
kit.servo[FLAP].angle = 0            # trapdoor closed
net = imageNet(model="waste/resnet18.onnx", labels="waste/labels.txt",
               input_blob="input_0", output_blob="output_0")
camera = videoSource("/dev/video0")  # USB webcam (V4L2)
display = videoOutput("display://0")
font = cudaFont()
last, streak, counts = None, 0, [0, 0, 0]

def sort_into(b):
    kit.servo[CHUTE].angle = CHUTE_ANGLE[b]
    time.sleep(0.4)                  # let the chute arrive
    kit.servo[FLAP].angle = 90       # open the trapdoor
    time.sleep(0.8)
    kit.servo[FLAP].angle = 0
    counts[b] += 1

while display.IsStreaming():
    img = camera.Capture()
    if img is None:
        continue
    class_id, conf = net.Classify(img)
    label = net.GetClassDesc(class_id)
    font.OverlayText(img, img.width, img.height, "{} {:.0%}".format(label, conf),
                     5, 5, font.White, font.Gray40)
    display.Render(img)
    if label == "empty":
        last, streak = None, 0
        continue
    streak = streak + 1 if label == last else 1
    last = label
    if streak < CONFIRM:
        continue
    b = BIN_FOR.get(label, 2) if conf >= THRESHOLD else 2   # unsure -> landfill
    print("{:14s} {:4.0%} -> {}".format(label, conf, BIN_NAME[b]))
    sort_into(b)
    last, streak = None, 0
    print("  totals: recycling {} | compost {} | landfill {}".format(*counts))`,
    params: { threshold: { value: 70, min: 30, max: 99 }, confirm: { value: 8, min: 1, max: 60 } },
    async setup(io, b, p) {
      const st = b.st;
      Object.assign(st, { counts: [0, 0, 0], streak: 0, last: null, threshold: p.threshold / 100 });
      io.line('kit = ServoKit'); io.pin('pin 3', 'SDA', true); await io.delay(150);
      io.line('kit.servo[FLAP].angle = 0'); b.sorter.setFlap(0); await io.delay(80);
      io.line('net = imageNet'); io.print('[TRT]    loading network plan engine: waste/resnet18.onnx (FP16)'); await io.delay(500);
      io.print('[TRT]    imageNet -- loaded 6 class info entries');
      io.line('videoSource("/dev/video0")'); io.print('[gstreamer] gstCamera -- v4l2src device=/dev/video0, 1280x720 @ 30 fps'); await io.delay(250);
      st.running = true;
    },
    async loop(io, b, p) {
      const st = b.st;
      st.threshold = p.threshold / 100;
      io.line('img = camera.Capture()');
      io.line('class_id, conf = net.Classify(img)');
      const it = b.st.current;
      const d = it && it.state === 'tray' ? seeObj(b, it.obj, it.base, st.t, it.seed) : null;
      if (d) {
        st.label = it.cls;
        st.conf = clamp(d.conf * (0.5 + 0.5 * st.light) - (1 - st.light) * 0.12, 0.05, 0.99);
        st.box = d.box;
      } else { st.label = 'empty'; st.conf = 0.96 + 0.02 * wob(st.t, 9); st.box = null; }
      b.setSub(`simulated inference · ${st.label} ${(st.conf * 100).toFixed(0)}%`);
      io.line('display.Render(img)');
      await io.delay(1000 / 30);
      if (st.label === 'empty') { io.line('if label == "empty":'); st.last = null; st.streak = 0; return; }
      io.line('streak = streak + 1');
      st.streak = st.label === st.last ? st.streak + 1 : 1;
      st.last = st.label;
      if (st.streak < p.confirm) return;
      const BIN_FOR = { plastic_bottle: 0, can: 0, paper: 0, food_waste: 1, crisp_packet: 2 };
      const NAMES = ['recycling', 'compost', 'landfill'];
      io.line('b = BIN_FOR.get(label');
      const bin = st.conf >= p.threshold / 100 ? BIN_FOR[st.label] ?? 2 : 2;
      io.line('print("{:14s}'); io.print(`${st.label.padEnd(14)} ${(st.conf * 100).toFixed(0).padStart(3)}% -> ${NAMES[bin]}${st.conf < p.threshold / 100 ? '  (unsure)' : ''}`);
      st.busy = true;
      io.line('kit.servo[CHUTE].angle = CHUTE_ANGLE[b]'); b.sorter.setChute(b.sorter.chuteAngle(bin)); io.pin('CH1', `${b.sorter.chuteAngle(bin)}°`, true);
      io.line('time.sleep(0.4)'); await io.delay(400);
      io.line('kit.servo[FLAP].angle = 90'); b.sorter.setFlap(90); io.pin('CH0', '90°', true);
      it.state = 'binned'; b.sorter.drop(it.obj.group, bin); st.current = null;
      io.line('time.sleep(0.8)'); await io.delay(800);
      io.line('kit.servo[FLAP].angle = 0', 2); b.sorter.setFlap(0); io.pin('CH0', '0°', false);
      st.counts[bin]++;
      st.busy = false; st.wait = 1.2;
      st.last = null; st.streak = 0;
      io.line('print("  totals'); io.print(`  totals: recycling ${st.counts[0]} | compost ${st.counts[1]} | landfill ${st.counts[2]}`);
    },
    reset(b) { Object.assign(b.st, { running: false, busy: false, box: null }); b.sorter.setFlap(0); b.setSub('simulated inference · idle'); },
  },

  // ------------------------------------------------------------------ 2 wildlife
  {
    id: 'ai-wildlife-cam', title: 'Wildlife camera trap', icon: 'radar',
    thumb: () => makeFox(v(0, 0, 0), { rotY: 0.6 }).group,
    view: { center: [-6.5, 2.2, 7], size: 28, az: -10 },
    build(ctx) {
      powerOn(ctx);
      const rig = csiRig(ctx, { title: 'Camera trap', look: 12, lookY: 2.6 });
      ctx.step('A patch of forest floor in front of the camera');
      const floor = deskMat(26, 16, ['#6f8f4a', 'rgba(60,80,30,.0)', 'rgba(60,80,30,.0)']);
      floor.position.set(CAM.x, MAT_H / 2, MAT_Z0 + 8);
      floor.userData.label = 'Forest floor';
      ctx.addObject(floor);
      ctx.addObject(feedOnly(feedWall(CAM.x, 14, MAT_Z0 + 26, 70, 30, (c, W, H) => {
        const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#bcd6e6'); gr.addColorStop(1, '#dfe9df'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
        for (let i = 0; i < 40; i++) { const x = (i * 97) % W, h = H * (0.35 + ((i * 37) % 20) / 50); c.fillStyle = i % 2 ? '#3a6b3e' : '#2f5c36'; c.beginPath(); c.moveTo(x, H); c.lineTo(x + 26, H - h); c.lineTo(x + 52, H); c.fill(); }
        c.fillStyle = '#4f6e34'; c.fillRect(0, H * 0.92, W, H * 0.08);
      })));
      ctx.addObject(feedOnly(floorPlane(CAM.x, MAT_Z0 + 18, 70, 30, '#6f8f4a')));
      ctx.step('Bushes that sway in the wind');
      const bushes = [[-14.5, 9.5, 1.0], [-2.2, 8.0, 0.8], [-10.5, 17, 1.2], [-4.5, 18, 1.1], [-17.5, 16, 1.0]].map(([x, z, s], i) => ctx.add(makeBush(v(x, MAT_H, z), { scale: s, seed: i + 2 })));
      ctx.step('Visitors: a fox, a deer and a bird');
      const fox = ctx.add(makeFox(v(-26, MAT_H, 13), { rotY: Math.PI / 2 }));
      const deer = ctx.add(makeDeer(v(-26, MAT_H, 15.5), { rotY: Math.PI / 2 }));
      const bird = ctx.add(makeBird(v(-26, MAT_H, 11), { rotY: Math.PI / 2 }));
      const animals = { fox: { a: fox, base: 0.9, speed: 2.2, z: 13 }, deer: { a: deer, base: 0.93, speed: 2.6, z: 15.5 }, bird: { a: bird, base: 0.82, speed: 4, z: 11 } };
      for (const k in animals) Object.assign(animals[k], { phase: 'off', x: -26, wait: 0, y: 0 });
      const st = { running: false, auto: true, wind: 0.5, t: 0, next: 6, motion: 0, dets: [], prevBoxes: new Map(), seen: {}, absent: {}, visits: {}, ignored: 0, flash: 0 };
      const send = (k) => { const an = animals[k]; if (an.phase !== 'off') return; Object.assign(an, { phase: 'in', x: -24, wait: 2 + Math.random() * 3 }); an.a.group.visible = true; };
      ctx.onTick((dt) => {
        st.t += dt;
        st.flash = Math.max(0, st.flash - dt * 2.5);
        bushes.forEach((b) => b.setWind(st.wind));
        for (const [k, an] of Object.entries(animals)) {
          const g = an.a.group;
          if (an.phase === 'off') { g.visible = false; continue; }
          const stopX = -9 + (k === 'bird' ? 1.5 : 0);
          if (an.phase === 'in') { an.x += an.speed * dt; an.a.walk?.(dt * an.speed * 0.4); if (an.x >= stopX) an.phase = 'stay'; }
          else if (an.phase === 'stay') { an.wait -= dt; an.a.stand?.(); if (an.wait <= 0) an.phase = 'out'; }
          else { an.x += an.speed * dt; an.a.walk?.(dt * an.speed * 0.4); if (an.x > 8) { an.phase = 'off'; an.x = -26; } }
          if (k === 'bird') { an.y = an.phase === 'stay' ? 0 : 2.2 + Math.sin(st.t * 3) * 0.3; an.a.flap(an.phase !== 'stay'); }
          g.position.set(an.x, MAT_H + an.y, an.z);
          g.rotation.y = Math.PI / 2;
        }
        if (st.auto) { st.next -= dt; if (st.next <= 0) { st.next = 9 + Math.random() * 6; const ks = Object.keys(animals).filter((k) => animals[k].phase === 'off'); if (ks.length) send(ks[Math.floor(Math.random() * ks.length)]); } }
      });
      ctx.interact(fox, {
        name: 'Visitors', hint: 'Send an animal past the camera',
        controls: [
          { type: 'button', label: 'Send the fox', press: () => send('fox') },
          { type: 'button', label: 'Send the deer', press: () => send('deer') },
          { type: 'button', label: 'Send the bird', press: () => send('bird') },
          { type: 'toggle', label: 'Visitors come by themselves', get: () => st.auto, set: (x) => (st.auto = x) },
        ],
      });
      ctx.interact(deer, { name: 'Roe deer', hint: 'Walks across and stops to look around', controls: [{ type: 'button', label: 'Send the deer', press: () => send('deer') }] });
      bushes.forEach((bs) => ctx.interact(bs, {
        name: 'Bush', hint: 'The wind moves the leaves',
        controls: [{ type: 'range', label: 'Wind', min: 0, max: 100, step: 5, get: () => Math.round(st.wind * 100), set: (x) => (st.wind = x / 100), format: (x) => `${x} %` }],
      }));
      rig.feed.draw((g, w, h) => {
        if (!st.running) return idleHint(g, w);
        for (const d of st.dets) rig.feed.label(g, d.box, `${d.cls} ${(d.conf * 100).toFixed(0)}%`, '#2ee6a6');
        feedText(g, `motion ${(st.motion * 100).toFixed(1)}%${st.motion >= st.motionMin ? '  detector ON' : ''}`, 9, 19, { color: st.motion >= st.motionMin ? '#ffd27a' : '#ffffff' });
        const v1 = Object.entries(st.visits).map(([k, n]) => `${k} ${n}`).join('  ');
        if (v1) feedText(g, v1, 9, h - 10, { size: 11 });
        if (st.flash > 0) { g.fillStyle = `rgba(255,255,255,${(st.flash * 0.7).toFixed(3)})`; g.fillRect(0, 0, w, h); }
      });
      ctx.anchor('fox', follow(fox.group.position));
      ctx.anchor('bush', bushes[1].anchor);
      ctx.anchor('deer', v(-9, 3.5, 14));
      return { ...rig, st, animals, bushes };
    },
    callouts: [
      { anchor: 'cam', x: 0.36, y: 0.12, icon: 'radar', title: 'Camera trap', text: 'Cheap frame differencing wakes the detector only when something moves.' },
      { anchor: 'chip', x: 0.7, y: 0.17, icon: 'chip', title: 'Custom detector', text: 'SSD-MobileNet retrained on fox, deer, badger, bird… with <code>train_ssd.py</code>.' },
      { anchor: 'bush', x: 0.04, y: 0.17, icon: 'wave', title: 'Swaying leaves', text: 'They make motion but never an animal, so they are logged as ignored.' },
      { anchor: 'deer', x: 0.04, y: 0.68, icon: 'hand', title: 'Visitors', text: 'Click an animal to send it past, or let them come by themselves.' },
    ],
    overview: {
      heading: 'Wildlife camera trap',
      text: 'Build on object detection (<b>Object detection</b>) and the security camera (<b>AI security camera</b>): a motion check decides when to run the network, a confirm count stops one-frame mistakes, and each visit is logged once per species with a snapshot and a CSV row.',
      features: [['wave', 'OpenCV frame differencing on a small grey copy'], ['radar', '<code>detectNet</code> with a custom ONNX wildlife model'], ['code', 'Per-species visit counting with a “gone” timeout']],
    },
    pinout: [
      ['CSI J13', 'Camera ribbon', 'csi://0'],
      ['GPIO', 'Not used', 'Add an IR illuminator on a pin for night'],
      ['microSD / USB drive', 'sightings.csv + snapshots', 'A 64 GB card holds ~100 000 JPEGs'],
    ],
    example: {
      text: 'Conservation projects run AI camera traps in forests and savannahs to count species without disturbing them; doing the detection on the device means only interesting pictures are stored or sent over a satellite link.',
      points: ['Turn the wind up with no animals: motion rises, the detector runs, nothing is logged', 'Send the bird: small and fast, it may need a few frames to be confirmed', 'A deer that stands still makes no motion: why the “gone” timeout is long'],
    },
    specs: [
      ['Detector', 'SSD-MobileNet-v1/v2 retrained (transfer learning), 300 × 300 input'],
      ['Speed', '≈ 20–25 fps on a Nano when running; idle when nothing moves'],
      ['Motion', 'Grey 320 × 180, blur 9 × 9, |Δ| > 25 levels'],
      ['Log', 'sightings.csv: time, species, visit number; species-time.jpg'],
      ['Libraries', 'jetson_inference, jetson_utils, OpenCV (cv2), NumPy'],
      ['Simulation', 'Motion from objects’ real movement in the feed; boxes from the props in view'],
    ],
    quiz: [
      { q: 'Why run the detector only when motion is found?', options: ['The network cannot see still animals', 'It saves power and heat on a battery-powered trap', 'OpenCV requires it', 'It makes boxes bigger'], answer: 1, explain: 'Frame differencing costs almost nothing; the neural network is the expensive part.' },
      { q: 'Leaves are moving and the motion check passes, but no animal is found. What does the script do?', options: ['Logs a “leaf” sighting', 'Prints “ignored” and logs nothing', 'Crashes', 'Saves a snapshot anyway'], answer: 1, explain: 'Motion only wakes the detector; only a confirmed animal is logged.' },
      { q: 'Why is a visit counted when seen reaches CONFIRM, not on every frame?', options: ['To count each animal once per visit, not 30 times a second', 'To save memory', 'The CSV is slow', 'Species change'], answer: 0, explain: 'A per-species state (seen / absent) turns a stream of detections into visits.' },
      { q: 'COCO SSD-MobileNet has no “fox” or “deer” class. What is the usual fix?', options: ['Call foxes “dog”', 'Retrain (transfer learning) on labelled photos of your species', 'Use a bigger camera', 'Lower the threshold'], answer: 1, explain: 'train_ssd.py in jetson-inference fine-tunes the detector on your own dataset.' },
    ],
    challenges: ['Ignore detections in the bottom 10 % of the frame where grass waves.', 'Write an hourly summary line: species and visits in the last hour.', 'Switch an IR LED floodlight on pin 12 at night and lower MOTION_MIN for the darker image.'],
    code: `import csv
from datetime import datetime
import cv2
import numpy as np
from jetson_inference import detectNet
from jetson_utils import videoSource, saveImage, cudaToNumpy, cudaDeviceSynchronize

MOTION_MIN = {{motion}} / 1000     # fraction of pixels that must change
CONFIRM = {{confirm}}              # frames an animal must be seen before it counts
GONE_FRAMES = 150                  # ~5 s unseen = the visit is over
net = detectNet(model="wildlife/ssd-mobilenet.onnx", labels="wildlife/labels.txt",
                input_blob="input_0", output_cvg="scores", output_bbox="boxes",
                threshold=0.5)
camera = videoSource("csi://0")
prev, seen, absent, visits = None, {}, {}, {}
logfile = open("sightings.csv", "a", newline="")
log = csv.writer(logfile)                     # columns: time, species, visit number
print("Camera trap armed, logging to sightings.csv")

while True:
    img = camera.Capture()
    if img is None:
        continue
    cudaDeviceSynchronize()                       # image ready for the CPU
    small = cv2.resize(cudaToNumpy(img), (320, 180))
    gray = cv2.GaussianBlur(cv2.cvtColor(small, cv2.COLOR_RGB2GRAY), (9, 9), 0)
    motion = 0.0 if prev is None else np.mean(cv2.absdiff(gray, prev) > 25)
    prev = gray
    found = set()
    if motion >= MOTION_MIN:                      # only wake the network on motion
        for d in net.Detect(img, overlay="none"):
            found.add(net.GetClassDesc(d.ClassID))
        if not found:
            print("motion {:.1%}, no animal: ignored".format(motion))
    for sp in set(seen) | found:
        if sp in found:
            seen[sp] = seen.get(sp, 0) + 1
            absent[sp] = 0
            if seen[sp] == CONFIRM:               # a new, confirmed visit
                visits[sp] = visits.get(sp, 0) + 1
                stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
                saveImage("{}-{}.jpg".format(sp, stamp), img)
                log.writerow([stamp, sp, visits[sp]])
                logfile.flush()
                print("{} {} visit #{}".format(stamp, sp, visits[sp]))
        else:
            absent[sp] = absent.get(sp, 0) + 1
            if absent[sp] > GONE_FRAMES:
                del seen[sp], absent[sp]`,
    params: { motion: { value: 8, min: 1, max: 200 }, confirm: { value: 5, min: 1, max: 60 } },
    async setup(io, b) {
      const st = b.st;
      Object.assign(st, { seen: {}, absent: {}, visits: {}, dets: [], prevBoxes: new Map(), motion: 0, lastIgnored: 0 });
      io.line('net = detectNet'); io.print('[TRT]    loading network plan engine: wildlife/ssd-mobilenet.onnx (FP16)'); await io.delay(500);
      io.print('[TRT]    detectNet -- loaded 7 class info entries');
      io.line('camera = videoSource'); io.print('[gstreamer] gstCamera -- nvarguscamerasrc sensor-id=0, 1280x720 @ 30 fps'); await io.delay(250);
      io.line('logfile = open'); io.line('print("Camera trap armed'); io.print('Camera trap armed, logging to sightings.csv'); st.running = true;
    },
    async loop(io, b, p) {
      const st = b.st;
      st.motionMin = p.motion / 1000;
      const r = b.size();
      io.line('img = camera.Capture()');
      io.line('motion = 0.0 if prev');
      // motion: fraction of the frame covered by things that moved since the last frame
      let moved = 0;
      if (r) {
        const objs = [...b.bushes.map((bs, i) => ['bush' + i, bs.sway ? { group: bs.sway } : bs]), ...Object.entries(b.animals).map(([k, an]) => [k, an.a])];
        for (const [k, o] of objs) {
          const bx = clipBox(b.feed.boxOf(o.group), r.width, r.height);
          const prev = st.prevBoxes.get(k);
          st.prevBoxes.set(k, bx);
          if (!bx || !prev) continue;
          const shift = Math.hypot(bx.x + bx.w / 2 - (prev.x + prev.w / 2), bx.y + bx.h / 2 - (prev.y + prev.h / 2));
          moved += ((bx.w * bx.h) / (r.width * r.height)) * clamp(shift / 3, 0, 1) * 0.35;
        }
      }
      st.motion = clamp(moved, 0, 1);
      const found = new Map();
      st.dets = [];
      if (st.motion >= p.motion / 1000) {
        io.line('for d in net.Detect(img');
        for (const [k, an] of Object.entries(b.animals)) {
          if (an.phase === 'off') continue;
          const d = seeObj(b, an.a, an.base, st.t, k.length);
          if (d && d.conf >= 0.5) { found.set(k, d.conf); st.dets.push({ cls: k, conf: d.conf, box: d.box }); }
        }
        if (!found.size && now() - st.lastIgnored > 2500) { st.lastIgnored = now(); io.line('print("motion {:.1%}, no animal'); io.print(`motion ${(st.motion * 100).toFixed(1)}%, no animal: ignored`); }
      }
      b.setSub(`simulated · motion ${(st.motion * 100).toFixed(1)}% · ${st.dets.length ? st.dets.map((d) => d.cls).join(', ') : 'nothing'}`);
      for (const sp of new Set([...Object.keys(st.seen), ...found.keys()])) {
        if (found.has(sp)) {
          st.seen[sp] = (st.seen[sp] ?? 0) + 1;
          st.absent[sp] = 0;
          if (st.seen[sp] === p.confirm) {
            io.line('if seen[sp] == CONFIRM:');
            st.visits[sp] = (st.visits[sp] ?? 0) + 1;
            const s = stamp();
            io.line('saveImage("{}-{}.jpg"'); st.flash = 1;
            io.line('log.writerow'); io.line('print("{} {} visit');
            io.print(`${s} ${sp} visit #${st.visits[sp]}`);
          }
        } else {
          st.absent[sp] = (st.absent[sp] ?? 0) + 1;
          if (st.absent[sp] > 150) { io.line('del seen[sp], absent[sp]'); delete st.seen[sp]; delete st.absent[sp]; }
        }
      }
      await io.delay(1000 / 30);
    },
    reset(b) { Object.assign(b.st, { running: false, dets: [] }); b.setSub('simulated inference · idle'); },
  },

  // ------------------------------------------------------------------ 3 gesture robot
  {
    id: 'ai-gesture-robot', title: 'Gesture-driven robot', icon: 'hand',
    thumb: () => makeHand(v(0, 0, 0), { gesture: 'point', scale: 0.5 }).group,
    view: { center: [4, 3, 6], size: 44, az: -8 },
    build(ctx) {
      powerOn(ctx);
      const rig = csiRig(ctx, { riser: 3.2, title: 'Hand tracking', look: 9, lookY: 5.6, fov: 34 });
      ctx.step('Desk mat for your elbow');
      const desk = deskMat(14, 10);
      desk.position.set(CAM.x, MAT_H / 2, MAT_Z0 + 5);
      ctx.addObject(desk);
      ctx.addObject(feedOnly(feedWall(CAM.x, 14, CAM.z + 30, 64, 32, roomWall)));
      ctx.addObject(feedOnly(floorPlane(CAM.x, CAM.z + 15, 64, 32)));
      ctx.step('Your hand, palm towards the camera');
      const hand = ctx.add(makeHand(v(CAM.x, MAT_H, 9.2), { scale: 0.55, gesture: 'open' }));
      ctx.step('The robot in its arena; an ESP32 on the deck listens for UDP commands');
      const AR = { x: 22, z: 6, half: 12 };
      const arena = deskMat(AR.half * 2, AR.half * 2, ['#e9e4d8', 'rgba(40,40,60,.06)', 'rgba(40,40,60,.16)']);
      arena.position.set(AR.x, MAT_H / 2, AR.z);
      arena.userData.label = 'Robot arena';
      ctx.addObject(arena);
      const robot = ctx.add(makeRobotCar(v(AR.x, MAT_H, AR.z - 2), { speed: 6 }));
      robot.group.scale.setScalar(0.5);
      const esp = makeESP32();
      esp.group.position.set(0, 0, 7);
      robot.deck.add(esp.group);
      robot.group.updateMatrixWorld(true);
      const st = { running: false, gesture: 'open', point: 'up', inView: true, command: 'STOP', cur: null, streak: 0, last: null, lm: [], lastSend: 0, t: 0, robotPos: robot.group.position, sent: 0 };
      const ROLL = { left: -0.75, up: 0, right: 0.75 }; // camera looks +z, so image right is world −x
      const pose = () => {
        hand.setGesture(st.gesture);
        hand.group.rotation.z = st.gesture === 'point' ? ROLL[st.point] : 0;
        hand.group.position.y = st.inView ? MAT_H : -14;
        hand.group.visible = st.inView;
      };
      pose();
      ctx.onTick((dt) => {
        st.t += dt;
        const W = { FORWARD: [0.7, 0.7], REVERSE: [-0.5, -0.5], LEFT: [-0.35, 0.35], RIGHT: [0.35, -0.35], STOP: [0, 0] };
        // failsafe on the robot: no packet for 0.5 s → stop
        const alive = st.running && now() - st.lastSend < 500;
        robot.setWheels(...(alive ? W[st.command] : [0, 0]));
        const p = robot.group.position;
        const lim = AR.half - 3;
        if (Math.abs(p.x - AR.x) > lim || Math.abs(p.z - AR.z) > lim) {
          p.x = clamp(p.x, AR.x - lim, AR.x + lim);
          p.z = clamp(p.z, AR.z - lim, AR.z + lim);
        }
      });
      ctx.interact(hand, {
        name: 'Your hand', hint: 'Make a gesture',
        controls: [
          { type: 'choice', label: 'Gesture', options: [['open', 'Open palm (stop)'], ['point', 'Point (go that way)'], ['fist', 'Fist (reverse)'], ['relaxed', 'Relaxed (no command)']], get: () => st.gesture, set: (g) => { st.gesture = g; pose(); } },
          { type: 'choice', label: 'Point towards', options: [['left', 'Image left'], ['up', 'Up (forward)'], ['right', 'Image right']], get: () => st.point, set: (x) => { st.point = x; pose(); } },
          { type: 'toggle', label: 'Hand in front of the camera', get: () => st.inView, set: (x) => { st.inView = x; pose(); } },
        ],
      });
      ctx.interact(robot, { name: 'Robot', hint: 'ESP32 on the deck drives the L298N; stops if packets stop', controls: [{ type: 'button', label: 'Put it back in the middle', press: () => { robot.reset(); } }] });
      const BONES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]];
      rig.feed.draw((g, w, h) => {
        if (!st.running) return idleHint(g, w);
        if (st.lm.length) {
          g.strokeStyle = '#2ee6a6'; g.lineWidth = 2;
          for (const [a, c] of BONES) { g.beginPath(); g.moveTo(st.lm[a].x * w, st.lm[a].y * h); g.lineTo(st.lm[c].x * w, st.lm[c].y * h); g.stroke(); }
          st.lm.forEach((q, i) => { g.fillStyle = [4, 8, 12, 16, 20].includes(i) ? '#ff5a4f' : '#ffffff'; g.beginPath(); g.arc(q.x * w, q.y * h, 3, 0, 7); g.fill(); });
        }
        feedText(g, `${st.cur ?? 'no hand'} → ${st.command}`, 9, 19, { color: st.command === 'STOP' ? '#ff8a80' : '#9df0c8' });
      });
      ctx.anchor('hand', hand.anchor);
      ctx.anchor('robot', follow(st.robotPos));
      ctx.anchor('esp', follow(st.robotPos));
      return { ...rig, st, hand, robot };
    },
    callouts: [
      { anchor: 'hand', x: 0.04, y: 0.17, icon: 'hand', title: 'Your hand', text: 'Open palm = stop, point = go that way, fist = reverse. Click it to change.' },
      { anchor: 'cam', x: 0.36, y: 0.12, icon: 'radar', title: '21 landmarks', text: 'MediaPipe Hands (a TFLite model on the CPU) finds the wrist and every finger joint.' },
      { anchor: 'robot', x: 0.7, y: 0.17, icon: 'car', title: 'Robot over Wi-Fi', text: 'One UDP word every 100 ms; the robot stops if they stop coming.' },
      { anchor: 'chip', x: 0.04, y: 0.68, icon: 'code', title: 'Rules, not magic', text: 'A finger is “up” if its tip is further from the wrist than its middle joint.' },
    ],
    overview: {
      heading: 'Gesture-driven robot',
      text: 'Combine the camera (<b>Capture from the camera</b>) and the obstacle robot (<b>Obstacle-avoiding robot</b>): MediaPipe Hands finds 21 landmarks, simple geometry turns them into a gesture, and the Jetson sends commands over Wi-Fi to the robot’s ESP32.',
      features: [['hand', 'MediaPipe Hands: 21 normalised (x, y, z) landmarks'], ['code', 'Gesture rules with a hold count (CONFIRM)'], ['globe', 'UDP heartbeat; no hand = STOP']],
    },
    pinout: [
      ['CSI J13', 'Camera ribbon', 'GStreamer pipeline into OpenCV'],
      ['Wi-Fi', 'M.2 card or USB dongle', 'The Nano has no Wi-Fi built in'],
      ['Robot ESP32', 'UDP port 4210', 'Drives an L298N; stops after 0.5 s of silence'],
    ],
    example: {
      text: 'Touch-free controls for operating theatres, kitchen robots and drones use the same pipeline: a hand-landmark model, a few geometric rules or a small classifier, and a safety rule that stops the machine when the hand is lost.',
      points: ['Take your hand out of view: the script sends STOP at once', 'Try the relaxed hand: it matches no rule, so the last command stays (that is why STOP has its own gesture)', 'Raise CONFIRM to stop flicker between gestures, at the cost of a slower response'],
    },
    specs: [
      ['Model', 'MediaPipe Hands (palm detector + 21-point landmark model, TFLite, CPU)'],
      ['Speed', '≈ 8–15 fps at 640 × 360 on a Nano CPU (model_complexity=0); faster on Orin'],
      ['Requirements', 'Python ≥ 3.8 and a MediaPipe build for aarch64 (JetPack 5+ / Orin, or a community wheel)'],
      ['Link', 'UDP, one ASCII word per packet, 10 per second'],
      ['Libraries', 'mediapipe, OpenCV (GStreamer), socket'],
      ['Simulation', 'Landmarks are the 3D hand’s real joints projected into the feed; MediaPipe itself is not run'],
    ],
    quiz: [
      { q: 'Why test “tip further from the wrist than the middle joint” instead of “tip above the joint”?', options: ['It is faster', 'It still works when the hand is tilted or pointing sideways', 'MediaPipe requires it', 'It uses less memory'], answer: 1, explain: 'Distances from the wrist do not depend on which way the hand is turned in the image.' },
      { q: 'What does the script send when no hand is found?', options: ['The last command', 'STOP', 'Nothing at all', 'FORWARD'], answer: 1, explain: 'Losing the hand must be safe: the robot stops.' },
      { q: 'Why send the command every 100 ms even when it has not changed?', options: ['UDP needs it', 'It is a heartbeat: if packets stop (crash, Wi-Fi loss) the robot’s own timeout stops it', 'To use the bandwidth', 'The ESP32 forgets'], answer: 1, explain: 'A safety heartbeat protects against the controller failing silently.' },
      { q: 'MediaPipe returns x = 0.62 for a landmark in a 640-pixel-wide frame. Which pixel column is that?', options: ['62', '≈ 397', '620', '0.62'], answer: 1, explain: 'Landmarks are normalised to 0–1: 0.62 × 640 ≈ 397.' },
    ],
    challenges: ['Add a “thumbs up” gesture that toggles a horn on the robot.', 'Use the distance between wrist and middle fingertip (hand size in the image) to set the speed.', 'Write the robot’s ESP32 sketch: WiFiUDP on port 4210, L298N outputs and a 500 ms failsafe.'],
    code: `import socket, time
import cv2
import mediapipe as mp

ROBOT = ("192.168.1.80", 4210)    # the robot's ESP32 listens for UDP here
CONFIRM = {{confirm}}             # frames a gesture must hold before it counts
SEND_EVERY = 0.1                  # s; the robot stops if commands stop arriving
GST = ("nvarguscamerasrc ! video/x-raw(memory:NVMM),width=1280,height=720,framerate=30/1 ! "
       "nvvidconv ! video/x-raw,width=640,height=360,format=BGRx ! videoconvert ! "
       "video/x-raw,format=BGR ! appsink drop=1")
TIPS, PIPS = [8, 12, 16, 20], [6, 10, 14, 18]   # index, middle, ring, pinky

hands = mp.solutions.hands.Hands(max_num_hands=1, model_complexity=0,
                                 min_detection_confidence=0.6, min_tracking_confidence=0.5)
cap = cv2.VideoCapture(GST, cv2.CAP_GSTREAMER)
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

def dist(a, b):
    return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5

def gesture(lm):
    w = lm[0]                                   # wrist
    up = [dist(lm[t], w) > dist(lm[p], w) * 1.15 for t, p in zip(TIPS, PIPS)]
    if all(up):
        return "STOP"                           # open palm
    if not any(up):
        return "REVERSE"                        # fist
    if up[0] and not any(up[1:]):               # only the index finger: point
        dx = lm[8].x - lm[5].x                  # fingertip vs knuckle, image x
        if dx < -0.06:
            return "LEFT"
        if dx > 0.06:
            return "RIGHT"
        return "FORWARD"
    return None                                 # anything else: no new command

last, streak, command, last_send = None, 0, "STOP", 0.0
while cap.isOpened():
    ok, frame = cap.read()
    if not ok:
        continue
    res = hands.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    g = gesture(res.multi_hand_landmarks[0].landmark) if res.multi_hand_landmarks else "STOP"
    streak = streak + 1 if g == last else 1
    last = g
    if g and streak >= CONFIRM and g != command:
        command = g
        print("gesture -> {}".format(command))
    if time.time() - last_send >= SEND_EVERY:   # heartbeat
        sock.sendto(command.encode(), ROBOT)
        last_send = time.time()`,
    params: { confirm: { value: 4, min: 1, max: 30 } },
    async setup(io, b) {
      const st = b.st;
      Object.assign(st, { command: 'STOP', streak: 0, last: null, lastSend: 0, lm: [] });
      io.line('hands = mp.solutions.hands.Hands'); io.print('INFO: Created TensorFlow Lite XNNPACK delegate for CPU.'); await io.delay(400);
      io.line('cap = cv2.VideoCapture(GST'); io.print('GStreamer: nvarguscamerasrc 1280x720 @ 30 fps → 640x360 BGR'); await io.delay(250);
      io.line('sock = socket.socket'); st.running = true;
    },
    async loop(io, b, p) {
      const st = b.st;
      io.line('ok, frame = cap.read()');
      io.line('res = hands.process');
      const r = b.size();
      let g = 'STOP';
      st.lm = [];
      if (r && b.hand.group.visible) {
        const pts = b.hand.landmarks().map((q) => b.feed.project(q));
        const inFrame = pts.filter((q) => q.visible && q.x >= 0 && q.x <= r.width && q.y >= 0 && q.y <= r.height).length;
        if (inFrame >= 17) {
          st.lm = pts.map((q) => ({ x: q.x / r.width, y: q.y / r.height }));
          const lm = st.lm, d = (a, c) => Math.hypot(a.x - c.x, a.y - c.y);
          const up = [[8, 6], [12, 10], [16, 14], [20, 18]].map(([t, q]) => d(lm[t], lm[0]) > d(lm[q], lm[0]) * 1.15);
          io.line('up = [dist(lm[t], w)');
          if (up.every(Boolean)) g = 'STOP';
          else if (!up.some(Boolean)) g = 'REVERSE';
          else if (up[0] && !up.slice(1).some(Boolean)) { const dx = lm[8].x - lm[5].x; g = dx < -0.06 ? 'LEFT' : dx > 0.06 ? 'RIGHT' : 'FORWARD'; }
          else g = null;
        }
      }
      st.cur = st.lm.length ? (g ?? 'no rule') : 'no hand';
      io.line('streak = streak + 1 if g == last');
      st.streak = g === st.last ? st.streak + 1 : 1;
      st.last = g;
      if (g && st.streak >= p.confirm && g !== st.command) {
        st.command = g;
        io.line('print("gesture -> {}"'); io.print(`gesture -> ${g}`);
      }
      if (now() - st.lastSend >= 100) {
        io.line('sock.sendto(command.encode()');
        st.lastSend = now();
      }
      b.setSub(`simulated landmarks · ${st.cur} · ${(11 + Math.sin(st.t) * 1.5).toFixed(0)} fps`);
      await io.delay(1000 / 12);
    },
    reset(b) { Object.assign(b.st, { running: false, lm: [], command: 'STOP' }); b.robot.stop(); b.setSub('simulated inference · idle'); },
  },

  // ------------------------------------------------------------------ 4 traffic
  {
    id: 'ai-smart-traffic-ai', title: 'AI traffic lights', icon: 'traffic',
    thumb: () => makeTrafficLight([v(-0.38, 0, 0), v(-0.13, 0, 0), v(0.13, 0, 0), v(0.38, 0, 0)]).group,
    view: { center: [-4, 4, 2], size: 40, az: -6 },
    build(ctx) {
      powerOn(ctx);
      const RX = -17, RZ = 4, L = 28, RW = 5.6;
      ctx.step('A road junction on the bench');
      const road = ctx.add(makeRoadCross(v(RX, 0, RZ), { size: L, roadW: RW }));
      ctx.step('Camera on a pole at the corner, looking down over both approaches');
      const pole = new THREE.Group();
      pole.add(at(cyl(0.22, 0.28, 15, mat(0x9aa0a8, { metal: 0.4 }), { seg: 12 }), 0, 7.5, 0));
      pole.add(at(box(0.25, 0.25, 3.4, mat(0x9aa0a8, { metal: 0.4 })), 0, 15, -1.6));
      pole.position.set(RX + 7.5, 0.12, RZ + 8.5);
      pole.userData.label = 'Camera pole';
      ctx.addObject(pole);
      const camPos = v(RX + 7.5, 14.6, RZ + 5.4);
      const look = v(RX - 5.5, 0, RZ - 5.5).sub(camPos).normalize();
      const yaw = Math.atan2(look.x, look.z), pitch = Math.asin(-look.y);
      const cam = ctx.add(makeUSBCam(camPos, { yaw, pitch, cableTo: v(0.83, 0.6, 4.6) }));
      cam.extras.forEach((o) => ctx.addObject(o));
      ctx.addObject(feedOnly(floorPlane(RX, RZ, 90, 90, '#9cc27a')));
      const rig = feedPanel(ctx, { position: cam.lensWorld, target: cam.lensWorld.clone().addScaledVector(cam.lookDir, 10), fov: 44, title: 'Junction camera', sub: 'simulated inference · idle' });
      const bb = jetsonBench(ctx);
      ctx.step('North–south signal: red pin 11, amber pin 13, green pin 15');
      const ns = ctx.add(K(makeTrafficLight([bb.hole(5, 'e'), bb.hole(6, 'e'), bb.hole(7, 'e'), bb.hole(8, 'e')]), 'module', 'Traffic-light module (N–S)'));
      const wNs = ctx.wire(ctx.board.pin('PIN11'), bb.hole(5, 'a'), 'red', { signal: 'pin 11', lift: 2.0 });
      ctx.wire(ctx.board.pin('PIN13'), bb.hole(6, 'a'), 'yellow', { signal: 'pin 13', lift: 2.2 });
      ctx.wire(ctx.board.pin('PIN15'), bb.hole(7, 'a'), 'green', { signal: 'pin 15', lift: 2.4 });
      ctx.wire(bb.hole(8, 'a'), bb.hole(8, 'top-'), 'black', { lift: 0.4, dir: -1 });
      ctx.step('East–west signal: red pin 29, amber pin 31, green pin 33');
      const ew = ctx.add(K(makeTrafficLight([bb.hole(17, 'e'), bb.hole(18, 'e'), bb.hole(19, 'e'), bb.hole(20, 'e')]), 'module', 'Traffic-light module (E–W)'));
      ctx.wire(ctx.board.pin('PIN29'), bb.hole(17, 'a'), 'red', { signal: 'pin 29', lift: 2.6 });
      ctx.wire(ctx.board.pin('PIN31'), bb.hole(18, 'a'), 'yellow', { signal: 'pin 31', lift: 2.8 });
      ctx.wire(ctx.board.pin('PIN33'), bb.hole(19, 'a'), 'green', { signal: 'pin 33', lift: 3.0 });
      ctx.wire(bb.hole(20, 'a'), bb.hole(20, 'top-'), 'black', { lift: 0.4, dir: -1 });
      ctx.step('Signal heads at the stop lines show the same states');
      const headNS = signalHead(v(RX - RW / 2 - 0.9, 0.12, RZ - RW / 2 - 1.2), 0);
      const headEW = signalHead(v(RX - RW / 2 - 1.2, 0.12, RZ + RW / 2 + 0.9), -Math.PI / 2);
      headNS.group.userData.label = 'Signal head (N–S)';
      headEW.group.userData.label = 'Signal head (E–W)';
      ctx.addObject(headNS.group);
      ctx.addObject(headEW.group);
      ctx.step('Cars');
      const COLORS = [0xe5412e, 0x3b78e7, 0xf5c02a, 0x3fbf5f, 0xf3f1e8, 0x8a5cc6, 0xef8a2b, 0x24262c];
      const cars = [];
      for (let i = 0; i < 12; i++) {
        const c = ctx.add(makeCar(v(RX - 30, 0.12, RZ), COLORS[i % COLORS.length]));
        c.group.visible = false;
        cars.push({ car: c, lane: null, s: 0, active: false });
      }
      // lanes: NS cars drive +z on x = RX − 1.4, EW cars drive +x on z = RZ + 1.4; s = distance along the lane
      const LANE = {
        NS: { place: (s) => [RX - 1.4, RZ - L / 2 + s], rot: Math.PI, stop: L / 2 - RW / 2 - 1.9 },
        EW: { place: (s) => [RX - L / 2 + s, RZ + 1.4], rot: -Math.PI / 2, stop: L / 2 - RW / 2 - 1.9 },
      };
      const st = { running: false, rate: { NS: 9, EW: 4 }, spawn: { NS: 1, EW: 3 }, light: { NS: 'red', EW: 'red' }, dets: [], q: { NS: 0, EW: 0 }, roi: null, t: 0 };
      const setHead = (lane, colour) => {
        st.light[lane] = colour;
        const m = lane === 'NS' ? ns : ew, h = lane === 'NS' ? headNS : headEW;
        for (const n of ['red', 'yellow', 'green']) m.set(n, (n === 'yellow' ? 'amber' : n) === colour);
        h.set(colour);
      };
      setHead('NS', 'red'); setHead('EW', 'red');
      ctx.onTick((dt) => {
        st.t += dt;
        for (const lane of ['NS', 'EW']) {
          st.spawn[lane] -= dt;
          if (st.spawn[lane] <= 0 && st.rate[lane] > 0) {
            st.spawn[lane] = (60 / st.rate[lane]) * (0.6 + Math.random() * 0.8);
            const busy = cars.some((c) => c.active && c.lane === lane && c.s < 4);
            const free = cars.find((c) => !c.active);
            if (free && !busy) Object.assign(free, { active: true, lane, s: 0 });
          }
        }
        for (const c of cars) {
          if (!c.active) { c.car.group.visible = false; continue; }
          const ln = LANE[c.lane];
          const ahead = cars.filter((o) => o.active && o.lane === c.lane && o.s > c.s).reduce((m, o) => Math.min(m, o.s), Infinity);
          let lim = ahead - 3.9;
          if (st.light[c.lane] !== 'green' && c.s <= ln.stop + 0.05) lim = Math.min(lim, ln.stop);
          c.s = Math.min(c.s + 3.2 * dt, Math.max(c.s, lim));
          if (c.s > L) { c.active = false; continue; }
          const [x, z] = ln.place(c.s);
          c.car.group.position.set(x, 0.12, z);
          c.car.group.rotation.y = ln.rot;
          c.car.group.visible = true;
        }
      });
      ctx.interact(road, {
        name: 'Traffic', hint: 'How many cars arrive per minute on each road',
        controls: [
          { type: 'range', label: 'North–south (cars/min)', min: 0, max: 20, step: 1, get: () => st.rate.NS, set: (x) => (st.rate.NS = x) },
          { type: 'range', label: 'East–west (cars/min)', min: 0, max: 20, step: 1, get: () => st.rate.EW, set: (x) => (st.rate.EW = x) },
        ],
      });
      // approach ROIs: the lane from the stop line back 11 cm, projected into the 1280×720 image
      const roiWorld = {
        NS: [v(RX - 2.8, 0.2, RZ - L / 2 + 1.5), v(RX, 0.2, RZ - L / 2 + 1.5), v(RX, 0.2, RZ - RW / 2 - 0.4), v(RX - 2.8, 0.2, RZ - RW / 2 - 0.4)],
        EW: [v(RX - L / 2 + 1.5, 0.2, RZ), v(RX - RW / 2 - 0.4, 0.2, RZ), v(RX - RW / 2 - 0.4, 0.2, RZ + 2.8), v(RX - L / 2 + 1.5, 0.2, RZ + 2.8)],
      };
      const roiPx = (r) => Object.fromEntries(Object.entries(roiWorld).map(([k, pts]) => {
        const q = pts.map((p) => rig.feed.project(p));
        const xs = q.map((p) => clamp(p.x, 0, r.width)), ys = q.map((p) => clamp(p.y, 0, r.height));
        return [k, { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), poly: q }];
      }));
      rig.feed.draw((g, w, h) => {
        if (!st.running) return idleHint(g, w);
        const roi = roiPx({ width: w, height: h });
        for (const [k, R] of Object.entries(roi)) {
          g.strokeStyle = k === 'NS' ? 'rgba(110,195,255,.9)' : 'rgba(255,181,71,.9)';
          g.setLineDash([5, 4]); g.lineWidth = 1.5;
          g.strokeRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
          g.setLineDash([]);
          feedText(g, `${k} ${st.q[k]}`, R.x0 + 4, R.y0 + 14, { size: 11 });
        }
        for (const d of st.dets) rig.feed.label(g, d.box, `car ${(d.conf * 100).toFixed(0)}%`, d.lane ? (d.lane === 'NS' ? '#6ec3ff' : '#ffb547') : '#cfd3dd');
        feedText(g, `NS ${st.light.NS}  EW ${st.light.EW}`, 9, 19);
      });
      ctx.anchor('road', road.anchor);
      ctx.anchor('camU', cam.anchor);
      ctx.anchor('ns', ns.anchor);
      ctx.anchor('wns', wNs.mid);
      ctx.anchor('head', headNS.group.position.clone().add(v(0, 3.6, 0)));
      return { ...rig, st, cars, setHead, roiPx };
    },
    callouts: [
      { anchor: 'camU', x: 0.36, y: 0.12, icon: 'radar', title: 'Camera on a pole', text: 'detectNet finds every vehicle; its centre decides which approach it is queuing on.' },
      { anchor: 'road', x: 0.04, y: 0.17, icon: 'car', title: 'Two approaches', text: 'Click the road to change how busy each one is.' },
      { anchor: 'ns', x: 0.7, y: 0.17, icon: 'traffic', title: 'Signals on GPIO', text: 'N–S on pins 11 / 13 / 15, E–W on 29 / 31 / 33.' },
      { anchor: 'head', x: 0.04, y: 0.68, icon: 'timer', title: 'Green time', text: 'MIN_GREEN + PER_CAR × queue, up to 30 s; ends early when the green road is empty.' },
    ],
    overview: {
      heading: 'AI traffic lights',
      text: 'The people counter (<b>People counter</b>) and the traffic-light lessons meet: detectNet counts the vehicles waiting in each approach’s region of interest, and the Jetson sets each green to the queue it sees, ending it early when the road is empty.',
      features: [['radar', 'SSD-MobileNet-v2 (COCO): car, truck, bus, motorcycle'], ['code', 'Regions of interest per lane from the box centre'], ['traffic', 'Actuated control: queue-based green time and gap-out']],
    },
    pinout: [
      ['Pins 11 / 13 / 15', 'N–S module R / Y / G', 'Modules have their own resistors'],
      ['Pins 29 / 31 / 33', 'E–W module R / Y / G', ''],
      ['Pin 6 (GND)', '– rail → both modules’ GND', ''],
      ['USB', 'UVC webcam on the pole', '/dev/video0'],
    ],
    example: {
      text: 'Adaptive signal systems in many cities use cameras or radar at each junction to measure queues and adjust green times every cycle, cutting waiting time and stop-start emissions.',
      points: ['Make one road busy and the other quiet: greens stretch for the busy one', 'Set a road to 0 cars/min: its green ends after MIN_GREEN (gap-out)', 'Real controllers keep pedestrian phases and fixed minimums for safety, whatever the camera says'],
    },
    specs: [
      ['Detector', 'SSD-MobileNet-v2, COCO, threshold 0.5'],
      ['Timing', 'Green = MIN_GREEN + PER_CAR × queue (max 30 s), amber 3 s, all-red 1 s'],
      ['Regions', 'One rectangle per approach in 1280 × 720 image pixels'],
      ['Outputs', '2 × traffic-light modules on Jetson.GPIO'],
      ['Libraries', 'jetson_inference, jetson_utils, Jetson.GPIO'],
      ['Simulation', 'Cars obey the lights; boxes and queues come from the cars actually in view'],
    ],
    quiz: [
      { q: 'How is a detected car assigned to a lane?', options: ['By its colour', 'Its box centre falls inside that lane’s region of interest', 'By its speed', 'The network outputs the lane'], answer: 1, explain: 'Detection gives boxes; the ROI test turns them into per-lane counts.' },
      { q: 'With MIN_GREEN = 5, PER_CAR = 2.0 and 6 cars queuing, how long is the green?', options: ['5 s', '11 s', '17 s', '30 s'], answer: 2, explain: '5 + 2.0 × 6 = 17 s, below the 30 s maximum.' },
      { q: 'What is “gap-out”?', options: ['A broken lamp', 'Ending a green early because no vehicles are left on it while the other road waits', 'A gap between cars', 'Amber time'], answer: 1, explain: 'Actuated signals stop wasting green on an empty road.' },
      { q: 'Why keep the all-red interval even with AI?', options: ['It looks nice', 'It clears the junction before the other road gets green', 'The camera needs it', 'GPIO is slow'], answer: 1, explain: 'Safety timings do not depend on the detector.' },
    ],
    challenges: ['Count trucks and buses as 2 cars each.', 'Log the average waiting queue per approach every minute.', 'Add a pedestrian button on pin 16 that forces an all-red walk phase.'],
    code: `import time
import Jetson.GPIO as GPIO
from jetson_inference import detectNet
from jetson_utils import videoSource, videoOutput

HEADS = {"NS": {"red": 11, "amber": 13, "green": 15},
         "EW": {"red": 29, "amber": 31, "green": 33}}
# approach lanes in the 1280x720 image, drawn once for this camera
ROI = {"NS": (480, 30, 650, 330), "EW": (30, 380, 520, 560)}
VEHICLES = {"car", "truck", "bus", "motorcycle"}
MIN_GREEN, PER_CAR, MAX_GREEN = {{min}}, {{per}} / 10, 30   # seconds
AMBER, ALL_RED = 3, 1

GPIO.setmode(GPIO.BOARD)
GPIO.setup([p for h in HEADS.values() for p in h.values()], GPIO.OUT, initial=GPIO.LOW)
net = detectNet("ssd-mobilenet-v2", threshold=0.5)
camera = videoSource("/dev/video0")
display = videoOutput("display://0")

def show(road, colour):
    for name, pin in HEADS[road].items():
        GPIO.output(pin, name == colour)

def queues():
    img = camera.Capture()
    count = {"NS": 0, "EW": 0}
    if img is None:
        return count
    for d in net.Detect(img):
        if net.GetClassDesc(d.ClassID) in VEHICLES:
            x, y = d.Center
            for road, (x0, y0, x1, y1) in ROI.items():
                if x0 <= x <= x1 and y0 <= y <= y1:
                    count[road] += 1
    display.Render(img)
    return count

green, other = "NS", "EW"
show("NS", "red"); show("EW", "red")
try:
    while display.IsStreaming():
        q = queues()
        t_green = min(MAX_GREEN, MIN_GREEN + PER_CAR * q[green])
        print("{} green {:.0f} s  queues NS {} EW {}".format(green, t_green, q["NS"], q["EW"]))
        show(green, "green")
        start = time.monotonic()
        while time.monotonic() - start < t_green:
            q = queues()                            # keep counting while green
            if time.monotonic() - start > MIN_GREEN and q[green] == 0 and q[other] > 0:
                print("  gap-out after {:.0f} s".format(time.monotonic() - start))
                break
        show(green, "amber"); time.sleep(AMBER)
        show(green, "red"); time.sleep(ALL_RED)
        green, other = other, green
finally:
    GPIO.cleanup()`,
    params: { min: { value: 5, min: 2, max: 20 }, per: { value: 15, min: 0, max: 60 } },
    async setup(io, b) {
      io.line('GPIO.setup(['); await io.delay(80);
      io.line('net = detectNet'); io.print('[TRT]    loading network plan engine: ssd-mobilenet-v2 (FP16)'); await io.delay(500);
      io.line('videoSource("/dev/video0")'); io.print('[gstreamer] gstCamera -- v4l2src device=/dev/video0, 1280x720 @ 30 fps'); await io.delay(250);
      io.line('show("NS", "red")'); b.setHead('NS', 'red'); b.setHead('EW', 'red'); io.pin('pin 11', 'HIGH', true); io.pin('pin 29', 'HIGH', true);
      Object.assign(b, { green: 'NS', other: 'EW' });
      b.st.running = true;
    },
    async loop(io, b, p) {
      const st = b.st;
      const PIN = { NS: { red: 11, amber: 13, green: 15 }, EW: { red: 29, amber: 31, green: 33 } };
      const show = (road, colour) => {
        b.setHead(road, colour);
        for (const [n, pin] of Object.entries(PIN[road])) io.pin(`pin ${pin}`, n === colour ? 'HIGH' : 'LOW', n === colour);
      };
      const queues = async () => {
        const r = b.size();
        const q = { NS: 0, EW: 0 };
        st.dets = [];
        if (r) {
          const roi = b.roiPx(r);
          for (const c of b.cars) {
            if (!c.active) continue;
            const d = seeObj(b, c.car, 0.9, st.t, b.cars.indexOf(c) + 1);
            if (!d || d.conf < 0.5) continue;
            const cx = d.box.x + d.box.w / 2, cy = d.box.y + d.box.h / 2;
            let lane = null;
            for (const [k, R] of Object.entries(roi)) if (cx >= R.x0 && cx <= R.x1 && cy >= R.y0 && cy <= R.y1) { lane = k; q[k]++; }
            st.dets.push({ box: d.box, conf: d.conf, lane });
          }
        }
        st.q = q;
        b.setSub(`simulated inference · queues NS ${q.NS} EW ${q.EW}`);
        await io.delay(1000 / 20);
        return q;
      };
      const { green, other } = b;
      io.line('q = queues()', 1); let q = await queues();
      const tGreen = Math.min(30, p.min + (p.per / 10) * q[green]);
      io.line('print("{} green'); io.print(`${green} green ${tGreen.toFixed(0)} s  queues NS ${q.NS} EW ${q.EW}`);
      io.line('show(green, "green")'); show(green, 'green');
      const start = now();
      while ((now() - start) / 1000 < tGreen) {
        io.line('q = queues()', 2); q = await queues();
        if ((now() - start) / 1000 > p.min && q[green] === 0 && q[other] > 0) {
          io.line('print("  gap-out'); io.print(`  gap-out after ${((now() - start) / 1000).toFixed(0)} s`);
          break;
        }
      }
      io.line('show(green, "amber")'); show(green, 'amber');
      io.line('time.sleep(AMBER)');
      const ta = now();
      while (now() - ta < 3000) await queues(); // AMBER = 3 s (the sim keeps drawing boxes meanwhile)
      io.line('show(green, "red")'); show(green, 'red');
      await io.delay(1000);
      io.line('green, other = other, green');
      b.green = other; b.other = green;
    },
    reset(b) { b.st.running = false; b.st.dets = []; b.setHead('NS', 'red'); b.setHead('EW', 'red'); b.setSub('simulated inference · idle'); },
  },

  // ------------------------------------------------------------------ 5 plant doctor
  {
    id: 'ai-plant-doctor', title: 'Plant doctor', icon: 'plant',
    thumb: () => makeLeafSample(v(0, 0, 0), { condition: 'early_blight' }).group,
    view: { center: [0.5, 2, 4.5], size: 27, az: -10 },
    build(ctx) {
      powerOn(ctx);
      const rig = csiRig(ctx, { title: 'Plant doctor', look: 9, lookY: 5.2, fov: 40 });
      ctx.step('Desk mat');
      const desk = deskMat(16, 11);
      desk.position.set(CAM.x, MAT_H / 2, MAT_Z0 + 5.5);
      ctx.addObject(desk);
      ctx.addObject(feedOnly(feedWall(CAM.x, 14, CAM.z + 30, 64, 32, roomWall)));
      ctx.addObject(feedOnly(floorPlane(CAM.x, CAM.z + 15, 64, 32)));
      ctx.step('A leaf from the greenhouse, held up in a clip stand');
      const leaf = ctx.add(makeLeafSample(v(CAM.x, MAT_H, 9.5), { rotY: Math.PI, condition: 'early_blight' }));
      const bb = jetsonBench(ctx);
      const gLed = jLed(ctx, bb, { pin: 'PIN11', col: 4, color: 'green' });
      const rLed = jLed(ctx, bb, { pin: 'PIN13', col: 12, color: 'red' });
      const aLed = jLed(ctx, bb, { pin: 'PIN15', col: 20, color: 'yellow' });
      const st = { running: false, cond: 'early_blight', offset: 0, light: 1, t: 0, votes: [], result: null, flash: 0 };
      const place = () => { leaf.group.position.x = CAM.x + st.offset; };
      ctx.onTick((dt) => { st.t += dt; st.flash = Math.max(0, st.flash - dt * 2.5); });
      ctx.interact(leaf, {
        name: 'Leaf sample', hint: 'Choose a leaf, move it, change the light',
        controls: [
          { type: 'choice', label: 'Leaf', options: Object.entries(LEAF_CONDITIONS).map(([k, c]) => [k, c.label]), get: () => st.cond, set: (k) => { st.cond = k; leaf.setCondition(k); } },
          { type: 'range', label: 'Slide sideways', min: -6, max: 6, step: 0.5, get: () => st.offset, set: (x) => { st.offset = x; place(); }, format: (x) => `${Number(x).toFixed(1)} cm` },
          { type: 'choice', label: 'Lighting', options: [[1, 'Daylight'], [0.7, 'Dim'], [0.45, 'Very dim']], get: () => st.light, set: (x) => (st.light = +x) },
        ],
        note: () => '“insect damage” is not one of the model’s classes',
      });
      rig.feed.draw((g, w, h) => {
        if (st.light < 1) { g.fillStyle = `rgba(10,12,20,${(1 - st.light) * 0.8})`; g.fillRect(0, 0, w, h); }
        if (!st.running) return idleHint(g, w);
        const cur = st.votes[st.votes.length - 1];
        if (cur) feedText(g, `${cur[0]} ${(cur[1] * 100).toFixed(0)}%`, 9, 19);
        if (st.result) feedText(g, st.result, 9, h - 10, { size: 11, color: /human/.test(st.result) ? '#ffd27a' : /healthy/.test(st.result) ? '#9df0c8' : '#ff8a80' });
        if (st.flash > 0) { g.fillStyle = `rgba(255,255,255,${(st.flash * 0.7).toFixed(3)})`; g.fillRect(0, 0, w, h); }
      });
      ctx.anchor('leaf', leaf.anchor);
      ctx.anchor('ask', aLed.led.anchor);
      ctx.anchor('leds', rLed.led.anchor);
      return { ...rig, st, leaf, leds: { healthy: gLed, disease: rLed, ask: aLed } };
    },
    callouts: [
      { anchor: 'leaf', x: 0.04, y: 0.17, icon: 'plant', title: 'Leaf sample', text: 'Healthy, early blight, late blight, leaf mould or insect damage. Click it.' },
      { anchor: 'cam', x: 0.36, y: 0.12, icon: 'radar', title: 'ResNet-18 classifier', text: 'Fine-tuned on tomato leaf photos: 4 classes, one answer per frame.' },
      { anchor: 'ask', x: 0.7, y: 0.17, icon: 'led', title: 'Ask a human · pin 15', text: 'Below the threshold the photo goes to review/ and the amber LED lights.' },
      { anchor: 'leds', x: 0.04, y: 0.68, icon: 'check', title: 'Healthy / disease', text: 'Green on pin 11, red on pin 13 with treatment advice in the terminal.' },
    ],
    overview: {
      heading: 'Plant doctor',
      text: 'Image classification (<b>Image classification</b>) with humility: the script votes over several frames and only gives a diagnosis when the model is confident and consistent. Otherwise it saves the photo for a person to check, the way responsible AI tools work.',
      features: [['palette', '<code>imageNet</code> with a custom PlantVillage-style model'], ['check', 'Majority vote × confidence over N frames'], ['led', 'Three LEDs: healthy, disease, ask a human']],
    },
    pinout: [
      ['Pin 11', '330 Ω → green LED', 'Healthy'],
      ['Pin 13', '330 Ω → red LED', 'Disease found'],
      ['Pin 15', '330 Ω → yellow LED', 'Ask a human'],
      ['Pin 6 (GND)', '– rail → LED cathodes', ''],
      ['CSI J13', 'Camera ribbon', 'csi://0'],
    ],
    example: {
      text: 'Farmers use phone apps and greenhouse cameras that spot leaf diseases early. The good ones say when they are unsure, because a wrong “healthy” lets a disease like late blight spread through a whole crop in days.',
      points: ['Show the insect-damaged leaf: it is not a class the model knows, so votes split and it asks a human', 'Slide the leaf half out of view or dim the light: confidence falls', 'Raise THRESHOLD for fewer wrong answers and more “ask a human”'],
    },
    specs: [
      ['Model', 'ResNet-18, transfer learning on ≈ 10 000 tomato-leaf photos (4 classes)'],
      ['Decision', 'Majority label over FRAMES frames; confidence = summed confidence of the winner / FRAMES'],
      ['Fallback', 'Below THRESHOLD: review/leaf-YYYYMMDD-HHMMSS.jpg'],
      ['Outputs', '3 LEDs on Jetson.GPIO through 330 Ω'],
      ['Libraries', 'jetson_inference, jetson_utils, Jetson.GPIO'],
      ['Simulation', 'Votes come from the leaf really in view: its condition, visible fraction and the light'],
    ],
    quiz: [
      { q: 'A classifier trained on 4 diseases is shown a leaf with insect damage. What usually happens?', options: ['It says “insect damage”', 'It still picks one of its 4 classes, often with low or inconsistent confidence', 'It refuses to run', 'It always says healthy'], answer: 1, explain: 'A classifier can only answer with classes it knows, which is why an “ask a human” path matters.' },
      { q: 'Over 10 frames the model says early_blight 6 times at 0.9 and leaf_mold 4 times. What confidence does the script compute?', options: ['0.90', '0.54', '0.60', '0.36'], answer: 1, explain: 'Sum of the winner’s confidences / frames = 6 × 0.9 / 10 = 0.54: disagreement lowers it.' },
      { q: 'Why save uncertain images instead of throwing them away?', options: ['To fill the disk', 'A human labels them; they become new training data for the next model', 'For speed', 'GPIO needs them'], answer: 1, explain: 'This “human in the loop” improves the model where it is weakest.' },
      { q: 'Which mistake is usually worse here?', options: ['Calling a healthy leaf diseased', 'Calling a diseased leaf healthy', 'Both are the same', 'Neither matters'], answer: 1, explain: 'A missed disease can spread; a false alarm costs a second look. Thresholds are set with this in mind.' },
    ],
    challenges: ['Print the top-3 classes with <code>net.Classify(img, topK=3)</code>.', 'Count diagnoses per class and print a daily summary.', 'Let the grower type the right label for each review image and append it to labels.csv.'],
    code: `import os, time
from datetime import datetime
import Jetson.GPIO as GPIO
from jetson_inference import imageNet
from jetson_utils import videoSource, saveImage

THRESHOLD = {{threshold}} / 100   # below this the model asks a human
FRAMES = {{frames}}               # frames to vote over
LED = {"healthy": 11, "disease": 13, "ask": 15}
ADVICE = {
    "early_blight": "remove lower leaves, keep foliage dry, rotate crops",
    "late_blight": "remove and bag the plant now: it spreads fast",
    "leaf_mold": "improve ventilation and lower the humidity",
}

GPIO.setmode(GPIO.BOARD)
GPIO.setup(list(LED.values()), GPIO.OUT, initial=GPIO.LOW)
net = imageNet(model="plants/resnet18.onnx", labels="plants/labels.txt",
               input_blob="input_0", output_blob="output_0")
camera = videoSource("csi://0")
os.makedirs("review", exist_ok=True)
votes = []

def light(which):
    for name, pin in LED.items():
        GPIO.output(pin, name == which)

try:
    while True:
        img = camera.Capture()
        if img is None:
            continue
        class_id, conf = net.Classify(img)
        votes.append((net.GetClassDesc(class_id), conf))
        if len(votes) < FRAMES:
            continue
        labels = [v[0] for v in votes]
        label = max(set(labels), key=labels.count)            # majority vote
        score = sum(c for l, c in votes if l == label) / FRAMES
        if score < THRESHOLD:
            stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
            saveImage("review/leaf-{}.jpg".format(stamp), img)
            light("ask")
            print("not sure ({} {:.0%}): saved review/leaf-{}.jpg for a human".format(label, score, stamp))
        elif label == "healthy":
            light("healthy")
            print("healthy ({:.0%})".format(score))
        else:
            light("disease")
            print("{} ({:.0%}): {}".format(label, score, ADVICE.get(label, "ask an expert")))
        votes = []
        time.sleep(2)
finally:
    GPIO.cleanup()`,
    params: { threshold: { value: 75, min: 30, max: 99 }, frames: { value: 10, min: 1, max: 60 } },
    async setup(io, b) {
      const st = b.st;
      Object.assign(st, { votes: [], result: null });
      Object.values(b.leds).forEach((l) => l.on(0));
      io.line('GPIO.setup(list(LED'); await io.delay(80);
      io.line('net = imageNet'); io.print('[TRT]    loading network plan engine: plants/resnet18.onnx (FP16)'); await io.delay(500);
      io.print('[TRT]    imageNet -- loaded 4 class info entries');
      io.line('camera = videoSource'); io.print('[gstreamer] gstCamera -- nvarguscamerasrc sensor-id=0, 1280x720 @ 30 fps'); await io.delay(250);
      st.running = true;
    },
    async loop(io, b, p) {
      const st = b.st;
      io.line('img = camera.Capture()');
      io.line('class_id, conf = net.Classify(img)');
      const CLASSES = ['healthy', 'early_blight', 'late_blight', 'leaf_mold'];
      const BASE = { healthy: 0.95, early_blight: 0.92, late_blight: 0.9, leaf_mold: 0.86 };
      const CONFUSE = { healthy: 'leaf_mold', early_blight: 'late_blight', late_blight: 'early_blight', leaf_mold: 'healthy' };
      const d = seeObj(b, { group: b.leaf.leaf }, 1, st.t, 3);
      const k = st.votes.length + 1, h = Math.abs(Math.sin(st.t * 12.9898 + k * 78.233) * 43758.5453) % 1; // per-frame pseudo-random
      let vote;
      if (!d) vote = [CLASSES[k % 4], 0.3 + 0.1 * h];                       // nothing in view: the classifier still answers something
      else if (st.cond === 'insect') vote = [['early_blight', 'healthy', 'leaf_mold'][Math.floor(h * 3)], 0.35 + 0.25 * h];
      else {
        const pc = BASE[st.cond] * (0.45 + 0.55 * d.conf) * (0.55 + 0.45 * st.light);
        vote = h < pc ? [st.cond, clamp(pc + 0.06 * (h - 0.5), 0.3, 0.99)] : [CONFUSE[st.cond], 0.4 + 0.2 * h];
      }
      st.votes.push(vote);
      io.line('votes.append');
      b.setSub(`simulated inference · ${vote[0]} ${(vote[1] * 100).toFixed(0)}%`);
      await io.delay(1000 / 30);
      if (st.votes.length < p.frames) return;
      const labels = st.votes.map((x) => x[0]);
      const label = [...new Set(labels)].reduce((a, c) => (labels.filter((x) => x === c).length > labels.filter((x) => x === a).length ? c : a));
      const score = st.votes.filter((x) => x[0] === label).reduce((a, x) => a + x[1], 0) / p.frames;
      io.line('label = max(set(labels)');
      const light = (which) => { for (const [n, l] of Object.entries(b.leds)) l.on(n === which); io.pin('pin 11', which === 'healthy' ? 'HIGH' : 'LOW', which === 'healthy'); io.pin('pin 13', which === 'disease' ? 'HIGH' : 'LOW', which === 'disease'); io.pin('pin 15', which === 'ask' ? 'HIGH' : 'LOW', which === 'ask'); };
      const ADVICE = { early_blight: 'remove lower leaves, keep foliage dry, rotate crops', late_blight: 'remove and bag the plant now: it spreads fast', leaf_mold: 'improve ventilation and lower the humidity' };
      if (score < p.threshold / 100) {
        const s = stamp();
        io.line('saveImage("review/leaf'); st.flash = 1;
        io.line('light("ask")'); light('ask');
        st.result = `not sure (${label} ${(score * 100).toFixed(0)}%): ask a human`;
        io.line('print("not sure'); io.print(`not sure (${label} ${(score * 100).toFixed(0)}%): saved review/leaf-${s}.jpg for a human`);
      } else if (label === 'healthy') {
        io.line('light("healthy")'); light('healthy');
        st.result = `healthy (${(score * 100).toFixed(0)}%)`;
        io.line('print("healthy'); io.print(st.result);
      } else {
        io.line('light("disease")'); light('disease');
        st.result = `${label} (${(score * 100).toFixed(0)}%)`;
        io.line('print("{} ({:.0%}): {}"'); io.print(`${label} (${(score * 100).toFixed(0)}%): ${ADVICE[label]}`);
      }
      st.votes = [];
      io.line('time.sleep(2)'); await io.delay(2000);
    },
    reset(b) { Object.assign(b.st, { running: false, votes: [], result: null }); Object.values(b.leds).forEach((l) => l.on(0)); b.setSub('simulated inference · idle'); },
  },
];

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['servo', 'Waste sorter', 'Tray with a servo trapdoor and a servo chute aiming at three bins.', 'ai-waste-sorter'],
  ['servo', 'PCA9685', '16-channel 12-bit PWM driver on I²C: steady servo pulses from any computer.', 'ai-waste-sorter'],
  ['radar', 'USB webcam', 'UVC camera; jetson_utils opens it as /dev/video0.', 'ai-waste-sorter'],
  ['hand', 'Waste items', 'Bottle, can, paper, banana peel and crisp packet props for the sorter.', 'ai-waste-sorter'],
  ['hand', 'Animals (fox, deer, bird)', 'Props for the camera trap, built from simple shapes.', 'ai-wildlife-cam'],
  ['wave', 'Bush', 'Leaves that sway in the wind: motion without an animal.', 'ai-wildlife-cam'],
  ['hand', 'Hand on a forearm', 'Poseable hand with 21 landmark joints for gesture lessons.', 'ai-gesture-robot'],
  ['traffic', 'Road junction', 'Four-way junction mat with lanes, stop lines and crossings.', 'ai-smart-traffic-ai'],
  ['plant', 'Leaf sample', 'Leaf in a clip stand: healthy or with a disease pattern.', 'ai-plant-doctor'],
];
