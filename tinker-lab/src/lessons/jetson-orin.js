// Track — Edge AI on a Jetson Orin Nano-style dev kit: Python 3 on JetPack 6
// (Ubuntu 22.04). Modern models with Ultralytics YOLO11 exported to TensorRT,
// pose estimation and a small local language model through Ollama.
// The AI is simulated truthfully: boxes and keypoints come from the real 3D
// props in front of the virtual camera, timings are typical published
// figures, and the chat replies are clearly marked as pre-written.
import * as THREE from 'three';
import { makeOrin } from '../scene/boards/orin.js';
import { makeCSICamera, makeRibbon } from '../scene/boards/jetson.js';
import { makeCar } from '../scene/components.js';
import { makePerson } from '../scene/modules.js';
import { mat, mesh, cyl, at, canvasTexture } from '../scene/kit.js';
import { v, clamp } from './helpers.js';

// ================================================================ shared helpers
const MAT_H = 0.12;
const CAM = v(-8.8, 0, -0.6); // CSI camera stand, facing +z, left of the board
const MAT_Z0 = 4.6;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// power modes of an Orin Nano 8 GB-style kit (JetPack 6.2): [label, watts, relative speed]
const MODES = [['7W', 7, 0.45], ['15W', 15, 0.75], ['25W', 25, 0.92], ['MAXN_SUPER', 25, 1]];
const modeOf = (id) => MODES.find((m) => m[0] === id) ?? MODES[3];

/** Board running Linux: power LED on, fan follows a simple thermal model. */
function orinPower(ctx, st) {
  ctx.board.setBuiltinLed(1);
  st.mode ??= 'MAXN_SUPER';
  st.load ??= 15;
  st.cpu ??= 40;
  ctx.onTick((dt) => {
    const [, watts] = modeOf(st.mode);
    const target = 36 + (st.load / 100) * (watts * 1.15);
    st.cpu += (target - st.cpu) * (1 - Math.exp(-dt / 6));
    ctx.board.setFan?.(clamp((st.cpu - 36) / 28, 0.2, 1));
  });
}

function powerControl(st) {
  return { type: 'choice', label: 'Power mode (nvpmodel)', options: MODES.map(([id, w]) => [id, id === 'MAXN_SUPER' ? 'MAXN SUPER (≈ 25 W+)' : `${w} W`]), get: () => st.mode, set: (m) => (st.mode = m) };
}

// ---------------------------------------------------------------- desk props (miniature, cm)
function prop(g, pos, anchorY, label) {
  g.position.copy(pos);
  g.updateMatrixWorld(true);
  return { group: g, pick: g, kind: 'prop', label, get anchor() { return g.position.clone().add(v(0, anchorY, 0)); } };
}

function makeMug(pos, color = 0xf3f1e8) {
  const g = new THREE.Group();
  const c = mat(color, { rough: 0.4 });
  g.add(at(cyl(0.62, 0.56, 1.35, c, { seg: 32 }), 0, 0.675, 0));
  g.add(at(cyl(0.55, 0.55, 0.02, mat(0x4a2c1a, { rough: 0.3 }), { seg: 32, outline: false }), 0, 1.25, 0));
  const handle = mesh(new THREE.TorusGeometry(0.33, 0.09, 10, 24, Math.PI), c);
  handle.rotation.z = -Math.PI / 2;
  g.add(at(handle, 0.6, 0.7, 0));
  g.add(at(cyl(0.63, 0.63, 0.22, mat(0xe5412e, { rough: 0.5 }), { seg: 32, outline: false }), 0, 0.85, 0));
  return prop(g, pos, 1.9, 'Mug');
}

function makeBottle(pos, color = 0x7fc3e8) {
  const g = new THREE.Group();
  const glass = mat(color, { rough: 0.15, opacity: 0.78 });
  g.add(at(cyl(0.45, 0.45, 1.9, glass, { seg: 28 }), 0, 0.95, 0));
  g.add(at(cyl(0.2, 0.45, 0.5, glass, { seg: 28 }), 0, 2.15, 0));
  g.add(at(cyl(0.2, 0.2, 0.3, glass, { seg: 20 }), 0, 2.55, 0));
  g.add(at(cyl(0.23, 0.23, 0.25, mat(0x2f6fd8, { rough: 0.4 }), { seg: 20 }), 0, 2.82, 0));
  g.add(at(cyl(0.46, 0.46, 0.7, mat(0xf3f1e8, { rough: 0.6 }), { seg: 28, outline: false }), 0, 1.0, 0));
  return prop(g, pos, 3.4, 'Bottle');
}

function deskMat(w, d) {
  const tex = canvasTexture(1024, Math.round((1024 * d) / w), (c, W, H) => {
    c.fillStyle = '#34506b';
    c.fillRect(0, 0, W, H);
    const s = W / w;
    for (let x = 0; x <= w; x += 1) { c.strokeStyle = x % 5 ? 'rgba(220,230,240,.12)' : 'rgba(220,230,240,.3)'; c.lineWidth = x % 5 ? 1 : 2; c.beginPath(); c.moveTo(x * s, 0); c.lineTo(x * s, H); c.stroke(); }
    for (let z = 0; z <= d; z += 1) { c.strokeStyle = z % 5 ? 'rgba(220,230,240,.12)' : 'rgba(220,230,240,.3)'; c.lineWidth = z % 5 ? 1 : 2; c.beginPath(); c.moveTo(0, z * s); c.lineTo(W, z * s); c.stroke(); }
  });
  const side = mat(0x2b4359, { rough: 0.8 });
  return mesh(new THREE.BoxGeometry(w, MAT_H, d), [side, side, mat(0xffffff, { map: tex, rough: 0.85, unique: true }), side, side, side]);
}

/** Room seen only by the virtual camera (layer 1). */
function feedRoom(cx, farZ) {
  const g = new THREE.Group();
  const wallTex = canvasTexture(1024, 512, (c, W, H) => {
    const gr = c.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#d3d9e4');
    gr.addColorStop(1, '#ebe5d9');
    c.fillStyle = gr;
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#f7f4ec';
    c.fillRect(W * 0.58, H * 0.28, W * 0.24, H * 0.44);
    const sky = c.createLinearGradient(0, H * 0.28, 0, H * 0.72);
    sky.addColorStop(0, '#8fc3ea');
    sky.addColorStop(1, '#dcedf7');
    c.fillStyle = sky;
    c.fillRect(W * 0.59, H * 0.3, W * 0.22, H * 0.4);
    c.fillStyle = '#3b78e7';
    c.fillRect(W * 0.18, H * 0.34, W * 0.12, H * 0.24);
    c.fillStyle = '#f5c02a';
    c.beginPath(); c.arc(W * 0.24, H * 0.46, W * 0.035, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#b9a07c';
    c.fillRect(0, H * 0.94, W, H * 0.06);
  });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(64, 32), new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 }));
  wall.position.set(cx, 15.6, farZ);
  wall.rotation.y = Math.PI;
  g.add(wall);
  const tableTex = canvasTexture(512, 512, (c, W, H) => {
    c.fillStyle = '#c9a77c';
    c.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) { c.strokeStyle = `rgba(120,80,40,${0.05 + (i % 5) * 0.02})`; c.lineWidth = 1 + (i % 3); const y = (i / 60) * H; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(W * 0.3, y + 6, W * 0.7, y - 6, W, y + 3); c.stroke(); }
  }, { repeat: [4, 2] });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(64, 34), new THREE.MeshStandardMaterial({ map: tableTex, roughness: 0.8 }));
  top.rotation.x = -Math.PI / 2;
  top.position.set(cx, -0.02, farZ - 17);
  g.add(top);
  g.traverse((o) => { o.layers.set(1); o.raycast = () => {}; });
  return g;
}

/** CSI camera into CAM0, desk mat, feed-only room and the camera-feed panel. */
function aiDesk(ctx, { title, sub = 'simulated inference · idle', fov = 52, look = 9, lookY = 2.0 } = {}) {
  const cam = makeCSICamera(CAM);
  ctx.addObject(cam.group);
  const ribbon = makeRibbon(ctx.board.csi, cam.ribbonEnd, 1.2, { dirB: cam.ribbonDir, axisA: ctx.board.csiAxis, axisB: cam.ribbonAxis, bendB: cam.ribbonBend });
  ctx.addObject(ribbon.group);
  const desk = deskMat(20, 13);
  desk.position.set(CAM.x, MAT_H / 2, MAT_Z0 + 6.5);
  ctx.addObject(desk);
  ctx.addObject(feedRoom(CAM.x, CAM.z + 30));
  const eye = cam.lensWorld.clone().addScaledVector(cam.lookDir, 0.08);
  const target = eye.clone().addScaledVector(cam.lookDir, look);
  target.y = lookY;
  const feed = ctx.camera({ position: eye, target, fov, title, sub });
  feed.camera.layers.enable(1);
  feed.el.style.background = 'transparent';
  feed.el.querySelector('.panel-body')?.style.setProperty('background', 'transparent');
  feed.el.querySelector('header')?.style.setProperty('background', 'var(--paper-solid)');
  const subEl = feed.el.querySelector('header small');
  const feedEl = feed.el.querySelector('.feed');
  ctx.interact(cam, { name: 'Camera module', hint: 'IMX219-style sensor on a 22-to-15-way CSI ribbon' });
  ctx.anchor('cam', cam.anchor);
  ctx.anchor('ribbon', ribbon.curve.getPointAt(0.5));
  return {
    cam, feed,
    setSub: (t) => { if (subEl && subEl.textContent !== t) subEl.textContent = t; },
    size: () => { const r = feedEl?.getBoundingClientRect(); return r && r.width > 10 ? r : null; },
  };
}

function clipBox(b, w, h) {
  if (!b.visible || !Number.isFinite(b.x)) return null;
  const x0 = Math.max(0, b.x), y0 = Math.max(0, b.y), x1 = Math.min(w, b.x + b.w), y1 = Math.min(h, b.y + b.h);
  if (x1 - x0 < 3 || y1 - y0 < 3) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, frac: ((x1 - x0) * (y1 - y0)) / Math.max(1, b.w * b.h) };
}

/** Detector over the real props in view; confidence falls for small / clipped objects. */
function simDetect(d, items, threshold, t) {
  const r = d.size();
  if (!r) return [];
  const out = [];
  for (const it of items) {
    const b = clipBox(d.feed.boxOf(it.obj.group), r.width, r.height);
    if (!b) continue;
    const size = clamp(0.66 + (b.h / r.height) * 1.2, 0.66, 1);
    const vis = clamp(0.3 + b.frac * 0.7, 0, 1);
    const conf = clamp(it.base * size * vis + 0.02 * Math.sin(t * 2.3 + it.seed * 7.1), 0.05, 0.98);
    if (conf < threshold) continue;
    const sx = 1280 / r.width, sy = 720 / r.height;
    out.push({ cls: it.cls, conf, box: b, px: { x1: b.x * sx, y1: b.y * sy, x2: (b.x + b.w) * sx, y2: (b.y + b.h) * sy } });
  }
  return out;
}

const CLS_COLOR = { person: '#2ee6a6', car: '#ffb547', bottle: '#6ec3ff', cup: '#ff7ab6' };

function idleHint(g, w, text = 'Press Run to start the script') {
  g.fillStyle = 'rgba(13,16,32,.6)';
  g.fillRect(0, 0, w, 24);
  g.fillStyle = '#e9ecf5';
  g.font = '600 11px "IBM Plex Mono", monospace';
  g.fillText(text, 10, 16);
}

function walker(ctx, { z, a, b, speed = 1.6, phase = 0.3, shirt }) {
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const p = ctx.add(makePerson(v(lo + (hi - lo) * phase, MAT_H, z), { shirt, rotY: Math.PI / 2 }));
  const st = { x: lo + (hi - lo) * phase, dir: 1, t: 0, mode: 'walk', yaw: Math.PI / 2 };
  return {
    person: p, st,
    step(dt) {
      st.t += dt;
      if (st.mode === 'walk') {
        st.x += st.dir * speed * dt;
        if (st.x > hi) { st.x = hi; st.dir = -1; }
        if (st.x < lo) { st.x = lo; st.dir = 1; }
        st.yaw = st.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else if (st.mode === 'face') st.yaw = Math.PI; // faces -z: towards the camera
      else if (st.mode === 'away') st.yaw = 0;
      else if (st.mode === 'turn') st.yaw = Math.PI + st.t * 0.8;
      p.group.position.set(st.x, MAT_H + (st.mode === 'walk' ? Math.abs(Math.sin(st.t * 7)) * 0.12 : 0), z);
      p.group.rotation.y = st.yaw;
      p.group.updateMatrixWorld(true);
    },
  };
}

// COCO-17 keypoints in makePerson's local frame (it faces +z; its left is +x)
const KP = [
  ['nose', 0, 4.22, 0.72, 'face'], ['left_eye', 0.25, 4.36, 0.64, 'face'], ['right_eye', -0.25, 4.36, 0.64, 'face'], ['left_ear', 0.7, 4.3, 0.0, 1], ['right_ear', -0.7, 4.3, 0.0, -1],
  ['left_shoulder', 0.88, 3.3, 0, 1], ['right_shoulder', -0.88, 3.3, 0, -1], ['left_elbow', 1.05, 2.55, 0, 1], ['right_elbow', -1.05, 2.55, 0, -1], ['left_wrist', 1.15, 1.78, 0, 1], ['right_wrist', -1.15, 1.78, 0, -1],
  ['left_hip', 0.4, 1.8, 0, 1], ['right_hip', -0.4, 1.8, 0, -1], ['left_knee', 0.38, 0.98, 0.05, 1], ['right_knee', -0.38, 0.98, 0.05, -1], ['left_ankle', 0.38, 0.24, 0.12, 1], ['right_ankle', -0.38, 0.24, 0.12, -1],
];
const SKELETON = [[15, 13], [13, 11], [16, 14], [14, 12], [11, 12], [5, 11], [6, 12], [5, 6], [5, 7], [6, 8], [7, 9], [8, 10], [1, 2], [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6]];

const PIPELINE = `PIPELINE = ("nvarguscamerasrc sensor-id=0 ! "
            "video/x-raw(memory:NVMM),width=1280,height=720,framerate=30/1 ! "
            "nvvidconv ! video/x-raw,format=BGRx ! videoconvert ! "
            "video/x-raw,format=BGR ! appsink drop=1")`;

const ORIN_THUMB = () => makeOrin().group;

export const jetsonOrin = [
  // ------------------------------------------------------------------ 1
  {
    id: 'orin-meet', title: 'Meet the Orin Nano', icon: 'chip', board: 'orin',
    thumb: ORIN_THUMB,
    view: { center: [0, 1.8, 0.2], size: 13 },
    build(ctx) {
      const st = { mode: 'MAXN_SUPER', load: 15 };
      orinPower(ctx, st);
      ctx.interact(ctx.board, {
        name: 'Jetson Orin Nano-style dev kit', hint: 'Change the power mode and the workload',
        controls: [powerControl(st), { type: 'range', label: 'GPU workload', min: 0, max: 100, step: 1, get: () => st.load, set: (x) => (st.load = x), format: (x) => `${x}%` }],
        note: () => `CPU ${st.cpu.toFixed(1)} °C · fan ${Math.round((ctx.board.fanSpeed ?? 0) * 100)}% · ${st.mode === 'MAXN_SUPER' ? 'peak 67 TOPS (INT8, sparse)' : st.mode === '7W' ? 'coolest, slowest mode' : 'less than the 67 TOPS peak'}`,
      });
      return { st };
    },
    callouts: [
      { anchor: 'fan', x: 0.04, y: 0.17, icon: 'gear', title: 'Heatsink + fan', text: 'Up to 25 W to remove: the fan speeds up under load. Click the board.' },
      { anchor: 'module', x: 0.36, y: 0.12, icon: 'chip', title: 'Orin Nano-style module', text: '6 Arm A78AE cores, a 1024-core Ampere GPU with 32 Tensor Cores, 8 GB.' },
      { anchor: 'gpio', x: 0.7, y: 0.17, icon: 'pins', title: '40-pin header', text: 'Same Pi-style layout as the Jetson Nano: 3.3 V GPIO, I²C, SPI, PWM.' },
      { anchor: 'csi', x: 0.04, y: 0.68, icon: 'radar', title: 'Two CSI ports', text: '22-pin MIPI connectors for two cameras.' },
      { anchor: 'usb', x: 0.36, y: 0.74, icon: 'usb', title: 'USB · DP · LAN', text: '4 × USB 3.2, DisplayPort and Gigabit Ethernet.' },
      { anchor: 'ssd', x: 0.7, y: 0.68, icon: 'bolt', title: 'NVMe underneath', text: 'An M.2 SSD on the underside holds the OS and models.' },
    ],
    overview: {
      heading: 'Orin Nano: the Nano, grown up',
      text: 'The Orin Nano runs the same kind of Python as the Jetson Nano but is in a different league: an Ampere GPU with Tensor Cores gives up to 67 TOPS (INT8) against the Nano’s 0.5 TFLOPS, so modern detectors, pose models and even small language models run on the desk. <code>nvpmodel</code> picks the power budget.',
      features: [['chip', '6 × Cortex-A78AE + 1024-core Ampere GPU, 32 Tensor Cores'], ['bolt', 'Power modes 7 W, 15 W, 25 W, MAXN SUPER (JetPack 6.2)'], ['code', 'JetPack 6: Ubuntu 22.04, CUDA 12, TensorRT 10, Python 3.10']],
    },
    pinout: [['J12', '40-pin expansion header', 'Same pin names as the Jetson Nano'], ['CAM0 / CAM1', '22-pin MIPI CSI-2', '22-to-15-way cable for Pi-style cameras'], ['DC jack', '19 V ⎓ supply', 'From the kit’s power adapter'], ['M.2 Key M', 'NVMe SSD (underside)', 'Fast storage for models'], ['M.2 Key E', 'Wi-Fi / Bluetooth card', 'Underside'], ['J14', 'Button header', 'Power, reset, recovery'], ['USB-C', 'Device / flashing port', '']],
    example: {
      text: 'Orin-class modules run delivery robots, inspection drones, smart-city cameras and robot arms: workloads that were too heavy for the original Nano.',
      points: ['Switch to 7 W and load the GPU: lower temperature, less performance', 'On a real kit, <code>sudo jtop</code> (from jetson-stats) shows CPU, GPU, RAM and power live', 'List modes with <code>nvpmodel -p --verbose</code>, pick one with <code>sudo nvpmodel -m &lt;id&gt;</code>'],
    },
    specs: [['AI performance', 'Up to 67 TOPS INT8 (sparse), MAXN SUPER'], ['GPU', '1024-core Ampere, 32 Tensor Cores'], ['CPU', '6 × Arm Cortex-A78AE, up to 1.7 GHz'], ['Memory', '8 GB 128-bit LPDDR5 (shared CPU / GPU)'], ['Power', '7–25 W modes'], ['Software', 'JetPack 6.2 · Ubuntu 22.04 · Python 3.10'], ['Jetson Nano for comparison', '4 × A57, 128-core Maxwell, 4 GB, ≈ 0.5 TFLOPS FP16']],
    quiz: [
      { q: 'What makes the Orin Nano so much faster at neural networks than the Jetson Nano?', options: ['A faster SD card', 'An Ampere GPU with Tensor Cores built for low-precision matrix maths', 'More USB ports', 'A bigger fan only'], answer: 1, explain: 'Tensor Cores multiply small matrices in FP16 / INT8 in one step, which is what neural networks are made of.' },
      { q: 'What does TOPS measure?', options: ['Temperature', 'Trillions of (mostly INT8) operations per second', 'Tokens per second', 'Total power'], answer: 1, explain: 'TOPS = tera-operations per second. Published figures usually assume INT8 and sparsity, so real models reach less.' },
      { q: 'Why does the 8 GB matter so much on a Jetson?', options: ['It is only for the desktop', 'CPU and GPU share it, so it limits how big a model you can load', 'It is not used by AI', 'It stores the OS'], answer: 1, explain: 'There is no separate graphics memory: the OS, your program and the model weights all share the same 8 GB.' },
      { q: 'What does sudo nvpmodel -m <id> do?', options: ['Updates JetPack', 'Selects a power mode (watt budget, clocks, active cores)', 'Formats the SSD', 'Enables the camera'], answer: 1, explain: 'Each nvpmodel mode caps power by setting clocks and active cores; lower modes run cooler and slower.' },
    ],
    challenges: ['Also print the GPU load from <code>/sys/devices/platform/gpu.0/load</code> (tenths of a percent).', 'Log temperatures and RAM use to a CSV once a second while a model runs.', 'Warn when the junction temperature (<code>tj-thermal</code>) passes 80 °C.'],
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
    return temps                         # millidegrees -> degrees C

def mem_mb(key):
    with open('/proc/meminfo') as f:
        for line in f:
            if line.startswith(key):
                return int(line.split()[1]) // 1024

print('Model  :', read('/proc/device-tree/model'))
print('L4T    :', ' '.join(read('/etc/nv_tegra_release').split()[1:5]))
print('System :', platform.system(), platform.machine(), platform.release())
print('CPUs   :', os.cpu_count())
mode = subprocess.run(['nvpmodel', '-q'], capture_output=True, text=True)
print('Power  :', mode.stdout.splitlines()[0])

while True:
    t = temperatures()
    used = mem_mb('MemTotal') - mem_mb('MemAvailable')
    print('CPU {:.1f} C | GPU {:.1f} C | Tj {:.1f} C | RAM {} MB used'.format(
        t['cpu-thermal'], t['gpu-thermal'], t['tj-thermal'], used))
    time.sleep({{interval}})`,
    params: { interval: { value: 2, min: 1, max: 5 } },
    async setup(io, b) {
      io.line("print('Model"); io.print('Model  : NVIDIA Jetson Orin Nano Engineering Reference Developer Kit Super'); await io.delay(150);
      io.line("print('L4T"); io.print('L4T    : R36 (release), REVISION: 4.3,'); await io.delay(110);
      io.line("print('System"); io.print('System : Linux aarch64 5.15.148-tegra'); await io.delay(110);
      io.line("print('CPUs"); io.print('CPUs   : 6'); await io.delay(110);
      io.line('mode = subprocess'); await io.delay(250);
      io.line("print('Power"); io.print(`Power  : NV Power Mode: ${b.st.mode}`); await io.delay(150);
    },
    async loop(io, b, p) {
      const st = b.st;
      io.line('t = temperatures()');
      io.line('used = mem_mb');
      const cpu = st.cpu + (Math.random() - 0.5) * 0.5, gpu = cpu - 1 + (st.load / 100) * 2.5, tj = Math.max(cpu, gpu) + 0.8;
      const used = Math.round(1650 + st.load * 9 + Math.random() * 30);
      io.line("print('CPU");
      io.print(`CPU ${cpu.toFixed(1)} C | GPU ${gpu.toFixed(1)} C | Tj ${tj.toFixed(1)} C | RAM ${used} MB used`);
      io.line('time.sleep'); await io.delay(p.interval * 1000);
    },
    reset() {},
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'orin-yolo', title: 'YOLO with TensorRT', icon: 'radar', board: 'orin',
    thumb: () => makeCar(v(0, 0, 0)).group,
    view: { center: [-6.0, 1.8, 6.6], size: 22, az: -12 },
    build(ctx) {
      const st = { mode: 'MAXN_SUPER', load: 60, t: 0, dets: [], running: false, frame: 0, carX: -9, carAuto: true };
      orinPower(ctx, st);
      const d = aiDesk(ctx, { title: 'YOLO11n · TensorRT FP16' });
      const w1 = walker(ctx, { z: 15.0, a: -19, b: 1.5, speed: 1.6, phase: 0.4, shirt: 0x3b78e7 });
      const car = ctx.add(makeCar(v(-9, MAT_H, 11.2)));
      const mug = ctx.add(makeMug(v(-5.2, MAT_H, 7.8)));
      const bottle = ctx.add(makeBottle(v(-12.4, MAT_H, 8.8)));
      ctx.onTick((dt) => {
        st.t += dt;
        w1.step(dt);
        if (st.carAuto) {
          st.carX = -8.8 + Math.sin(st.t * 0.4) * 6.5;
          car.group.rotation.y = Math.cos(st.t * 0.4) >= 0 ? -Math.PI / 2 : Math.PI / 2;
        }
        car.group.position.x = st.carX;
      });
      ctx.interact(car, {
        name: 'Toy car', hint: 'Drive it yourself or let it roam',
        controls: [
          { type: 'range', label: 'Position', min: -18, max: 1, step: 0.1, get: () => st.carX, set: (x) => { st.carAuto = false; st.carX = x; }, format: (x) => `${Number(x).toFixed(1)} cm` },
          { type: 'toggle', label: 'Drive automatically', get: () => st.carAuto, set: (x) => (st.carAuto = x) },
        ],
      });
      ctx.interact(w1.person, { name: 'Person', hint: 'Walks across the room', controls: [{ type: 'choice', label: 'Doing', options: [['walk', 'Walking'], ['face', 'Standing still']], get: () => w1.st.mode, set: (x) => (w1.st.mode = x) }] });
      ctx.interact(ctx.board, { name: 'Jetson Orin Nano-style', hint: 'Power mode changes the inference time', controls: [powerControl(st)] });
      const items = [
        { obj: w1.person, cls: 'person', base: 0.93, seed: 1 },
        { obj: car, cls: 'car', base: 0.86, seed: 2 },
        { obj: mug, cls: 'cup', base: 0.8, seed: 3 },
        { obj: bottle, cls: 'bottle', base: 0.84, seed: 4 },
      ];
      d.feed.draw((g, w) => {
        if (!st.running) return idleHint(g, w);
        for (const det of st.dets) d.feed.label(g, det.box, `${det.cls} ${det.conf.toFixed(2)}`, CLS_COLOR[det.cls]);
      });
      ctx.anchor('person', w1.person.anchor);
      ctx.anchor('car', car.anchor);
      ctx.anchor('bottle', bottle.anchor);
      return { ...d, st, items };
    },
    callouts: [
      { anchor: 'cam', x: 0.36, y: 0.12, icon: 'radar', title: 'CSI camera', text: 'GStreamer’s <code>nvarguscamerasrc</code> hands OpenCV 1280×720 frames.' },
      { anchor: 'fan', x: 0.7, y: 0.17, icon: 'chip', title: 'TensorRT engine', text: 'YOLO11n compiled for this GPU in FP16: a few ms per frame.' },
      { anchor: 'bottle', x: 0.04, y: 0.17, icon: 'hand', title: '80 COCO classes', text: 'Person, car, cup, bottle… Click the car to drive it out of view.' },
      { anchor: 'car', x: 0.04, y: 0.68, icon: 'car', title: 'Moving targets', text: 'Boxes follow the real objects; half-hidden ones score lower.' },
    ],
    overview: {
      heading: 'Modern detection with YOLO + TensorRT',
      text: 'Ultralytics YOLO11 is a current, accurate detector. Export it once to a TensorRT engine (<code>format=engine half=True</code>) and the Orin runs it in a few milliseconds a frame. Setup is the honest hard part: install the JetPack-matched PyTorch wheels or use Ultralytics’ Jetson container.',
      features: [['radar', '<code>YOLO("yolo11n.engine")</code>: boxes, classes, confidences'], ['gear', 'One-off: <code>yolo export model=yolo11n.pt format=engine half=True</code>'], ['knob', 'Edit <code>CONF</code> to trade misses for false alarms']],
    },
    pinout: [['CAM0', 'Camera ribbon', '22-to-15-way cable'], ['GStreamer', 'nvarguscamerasrc → appsink', 'Needs OpenCV built with GStreamer'], ['Engine file', 'yolo11n.engine', 'Built on this device, for this TensorRT version']],
    example: {
      text: 'Retail footfall counters, factory safety zones, traffic analytics and litter-picking robots all start from a detector like this, running beside the camera with no cloud round trip.',
      points: ['Lower <code>CONF</code> to 10 and watch weak detections appear', 'Switch to 7 W: inference slows, but the 30 fps camera still limits the loop', 'Honest setup: pip’s OpenCV has no GStreamer, so keep JetPack’s system OpenCV, or use a USB webcam with <code>VideoCapture(0)</code>'],
    },
    specs: [['Model', 'YOLO11n (2.6 M parameters, COCO 80 classes)'], ['Runtime', 'TensorRT FP16 engine via Ultralytics'], ['Speed', '≈ 5–8 ms inference per 640 px frame (varies by mode)'], ['Camera', '1280×720 @ 30 fps over CSI'], ['Install', 'Ultralytics Jetson guide: JetPack 6 torch / torchvision wheels, or its Docker image'], ['Simulation', 'Boxes come from the real 3D props in view']],
    quiz: [
      { q: 'Why export the model to a TensorRT engine?', options: ['To make the file smaller only', 'TensorRT fuses layers and uses FP16 / INT8 kernels tuned for this exact GPU', 'Engines work on any computer', 'To train it faster'], answer: 1, explain: 'A TensorRT engine is compiled for one GPU and TensorRT version, and usually runs several times faster than plain PyTorch.' },
      { q: 'Inference takes 6 ms but the loop still runs at 30 fps. Why?', options: ['The GPU is broken', 'The camera only delivers 30 frames per second', 'Python is limited to 30 fps', 'YOLO waits on purpose'], answer: 1, explain: 'Once inference is faster than the camera, the camera sets the frame rate (33 ms per frame at 30 fps).' },
      { q: 'You copy yolo11n.engine to a different Jetson with another JetPack. What happens?', options: ['It runs faster', 'It may fail to load: engines are tied to the GPU and TensorRT version', 'It converts itself', 'Nothing changes'], answer: 1, explain: 'Keep the .pt (or ONNX) file and re-export the engine on each device.' },
    ],
    challenges: ['Print only people and count them each frame.', 'Save a JPEG with <code>cv2.imwrite()</code> whenever a car appears.', 'Export an INT8 engine (<code>int8=True data=coco8.yaml</code>) and compare <code>result.speed</code>.'],
    code: `import time
import cv2
from ultralytics import YOLO

CONF = {{conf}} / 100
${PIPELINE}

# one-off, on this Jetson:  yolo export model=yolo11n.pt format=engine half=True
model = YOLO("yolo11n.engine")
cap = cv2.VideoCapture(PIPELINE, cv2.CAP_GSTREAMER)
frames, t0 = 0, time.time()

while True:
    ok, frame = cap.read()
    if not ok:
        continue
    result = model(frame, conf=CONF, verbose=False)[0]
    cv2.imshow("YOLO11n TensorRT", result.plot())      # boxes + labels
    frames += 1
    if frames % 30 == 0:
        fps = 30 / (time.time() - t0)
        t0 = time.time()
        for box in result.boxes:
            name = result.names[int(box.cls)]
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            print("{:8s} {:.2f}  ({:.0f},{:.0f})-({:.0f},{:.0f})".format(
                name, float(box.conf), x1, y1, x2, y2))
        print("--- {} objects | {:.0f} FPS | inference {:.1f} ms".format(
            len(result.boxes), fps, result.speed["inference"]))
    if cv2.waitKey(1) == ord("q"):
        break`,
    params: { conf: { value: 40, min: 5, max: 95 } },
    async setup(io, b) {
      io.line('model = YOLO("yolo11n.engine")'); io.print('Loading yolo11n.engine for TensorRT inference...'); await io.delay(700);
      io.print('[TRT] Loaded engine size: 7 MiB');
      io.line('cap = cv2.VideoCapture'); io.print('GST_ARGUS: Running with following settings: Camera index = 0, Camera mode = 4, 1280 x 720 FR = 30.000'); await io.delay(300);
      b.st.running = true; b.st.frame = 0;
    },
    async loop(io, b, p) {
      const st = b.st;
      io.line('ok, frame = cap.read()');
      io.line('result = model(frame');
      st.dets = simDetect(b, b.items, p.conf / 100, st.t);
      const infer = 5.2 / modeOf(st.mode)[2] + Math.random() * 0.6;
      const frameMs = Math.max(33.3, infer + 9); // camera-limited at 30 fps
      b.setSub(`simulated · ${(1000 / frameMs).toFixed(0)} fps · ${infer.toFixed(1)} ms`);
      io.line('cv2.imshow');
      st.frame++;
      if (st.frame % 30 === 0) {
        io.line('for box in result.boxes');
        for (const det of st.dets) io.print(`${det.cls.padEnd(8)} ${det.conf.toFixed(2)}  (${det.px.x1.toFixed(0)},${det.px.y1.toFixed(0)})-(${det.px.x2.toFixed(0)},${det.px.y2.toFixed(0)})`);
        io.line('print("---'); io.print(`--- ${st.dets.length} objects | ${(1000 / frameMs).toFixed(0)} FPS | inference ${infer.toFixed(1)} ms`);
      }
      await io.delay(frameMs);
    },
    reset(b) { b.st.running = false; b.st.dets = []; b.setSub('simulated inference · idle'); },
  },

  // ------------------------------------------------------------------ 3
  {
    id: 'orin-pose', title: 'Pose estimation', icon: 'hand', board: 'orin',
    thumb: () => makePerson(v(0, 0, 0), { rotY: 0.5, shirt: 0x8a5cc6 }).group,
    view: { center: [-6.0, 1.8, 6.6], size: 22, az: -12 },
    build(ctx) {
      const st = { mode: 'MAXN_SUPER', load: 55, running: false, poses: [], frame: 0 };
      orinPower(ctx, st);
      const d = aiDesk(ctx, { title: 'YOLO11n-pose · TensorRT', lookY: 2.6 });
      const w1 = walker(ctx, { z: 10.5, a: -14, b: -3.5, speed: 1.2, phase: 0.5, shirt: 0x8a5cc6 });
      w1.st.mode = 'walk';
      ctx.onTick((dt) => w1.step(dt));
      ctx.interact(w1.person, {
        name: 'Person', hint: 'Make them walk, face the camera or turn',
        controls: [{ type: 'choice', label: 'Doing', options: [['walk', 'Walking across'], ['face', 'Facing the camera'], ['away', 'Facing away'], ['turn', 'Turning slowly']], get: () => w1.st.mode, set: (x) => (w1.st.mode = x) }],
        note: () => 'Hidden keypoints get low confidence and are not drawn.',
      });
      const tmp = new THREE.Vector3();
      /** Keypoints of the 3D person projected into the feed, with a visibility-based confidence. */
      const estimate = () => {
        const r = d.size();
        if (!r) return [];
        const g = w1.person.group;
        const box = clipBox(d.feed.boxOf(g), r.width, r.height);
        if (!box) return [];
        const camPos = d.feed.camera.position;
        const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(g.quaternion);
        const left = new THREE.Vector3(1, 0, 0).applyQuaternion(g.quaternion);
        const toCam = camPos.clone().sub(g.position).setY(0).normalize();
        const facing = fwd.dot(toCam), lateral = left.dot(toCam);
        const kps = KP.map(([name, x, y, z, side]) => {
          tmp.set(x, y, z).applyMatrix4(g.matrixWorld);
          const s = d.feed.project(tmp);
          let c;
          if (side === 'face') c = 0.15 + 0.8 * Math.max(0, facing);
          else c = lateral * side > -0.35 ? 0.9 : 0.3;
          if (name.endsWith('ear')) c = Math.min(c, 0.35 + 0.6 * (1 - Math.abs(facing)) + (lateral * side > 0 ? 0.2 : -0.3));
          return { name, x: s.x, y: s.y, c: clamp(c, 0.02, 0.97), vis: s.visible };
        });
        return [{ box, kps, conf: 0.9 * clamp(0.3 + box.frac * 0.7, 0, 1), sx: 1280 / r.width, sy: 720 / r.height }];
      };
      d.feed.draw((g, w) => {
        if (!st.running) return idleHint(g, w);
        for (const pose of st.poses) {
          d.feed.label(g, pose.box, `person ${pose.conf.toFixed(2)}`, '#2ee6a6');
          g.lineWidth = 2.5;
          for (const [a, bb] of SKELETON) {
            const A = pose.kps[a], B = pose.kps[bb];
            if (A.c < 0.5 || B.c < 0.5) continue;
            g.strokeStyle = a <= 4 && bb <= 6 ? '#ffd23f' : a >= 11 || bb >= 11 ? '#ff8a3c' : '#6ec3ff';
            g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.stroke();
          }
          for (const k of pose.kps) {
            if (k.c < 0.5) continue;
            g.fillStyle = '#ffffff';
            g.beginPath(); g.arc(k.x, k.y, 3, 0, Math.PI * 2); g.fill();
          }
        }
      });
      ctx.anchor('person', w1.person.anchor);
      return { ...d, st, estimate, w1 };
    },
    callouts: [
      { anchor: 'cam', x: 0.36, y: 0.12, icon: 'radar', title: 'CSI camera', text: 'Same pipeline as the last lesson, a different model.' },
      { anchor: 'person', x: 0.04, y: 0.17, icon: 'hand', title: '17 keypoints', text: 'Nose, eyes, ears, shoulders, elbows, wrists, hips, knees, ankles.' },
      { anchor: 'module', x: 0.7, y: 0.17, icon: 'chip', title: 'One pass, all people', text: 'YOLO-pose finds every person and their keypoints in a single run.' },
      { anchor: 'ribbon', x: 0.04, y: 0.68, icon: 'info', title: 'Confidence per point', text: 'Points hidden behind the body get a low score: use it.' },
    ],
    overview: {
      heading: 'Pose estimation',
      text: 'A pose model finds each person and 17 body keypoints (the COCO set), each with x, y and a confidence. From them you can tell which way someone faces, count squats or spot a fall. <code>result.plot()</code> draws the skeleton; your code reads <code>result.keypoints</code>.',
      features: [['hand', '<code>YOLO("yolo11n-pose.engine")</code>: boxes + keypoints'], ['code', '<code>keypoints.xy</code> (pixels) and <code>keypoints.conf</code> per point'], ['radar', 'Click the person: walk, face the camera, face away, turn']],
    },
    pinout: [['CAM0', 'Camera ribbon', ''], ['Keypoint 0', 'Nose', '1–4: eyes, ears'], ['Keypoints 5–10', 'Shoulders, elbows, wrists', 'Left before right'], ['Keypoints 11–16', 'Hips, knees, ankles', '']],
    example: {
      text: 'Fitness apps count reps, care homes detect falls, sports coaches measure joint angles and robots read gestures, all from keypoints like these.',
      points: ['Make the person face away: the face points vanish but the shoulders stay', 'Walking across shows one side of the body: the far arm drops out', 'Compute an elbow angle from shoulder, elbow and wrist with <code>math.atan2</code>'],
    },
    specs: [['Model', 'YOLO11n-pose (COCO keypoints, 17 per person)'], ['Output', 'xy (N × 17 × 2), conf (N × 17)'], ['Runtime', 'TensorRT FP16 engine'], ['Speed', '≈ 6–10 ms inference per frame'], ['Simulation', 'Keypoints are projected from the 3D figure; hidden ones get low confidence']],
    quiz: [
      { q: 'How many keypoints does a COCO pose model give per person?', options: ['5', '17', '33', '68'], answer: 1, explain: 'COCO defines 17: nose, 2 eyes, 2 ears, 2 shoulders, 2 elbows, 2 wrists, 2 hips, 2 knees, 2 ankles.' },
      { q: 'The person faces away. Which keypoints get low confidence?', options: ['Shoulders', 'Nose and eyes', 'Ankles', 'All of them'], answer: 1, explain: 'The face is hidden, so the model is unsure where the nose and eyes are; the body is still visible.' },
      { q: 'Why check kc[5] > 0.5 before using the left shoulder?', options: ['To save time', 'A low-confidence keypoint may be a guess for a hidden joint', 'Index 5 is always wrong', 'For colour'], answer: 1, explain: 'Every keypoint gets coordinates even when hidden; the confidence tells you whether to trust them.' },
    ],
    challenges: ['Print the angle of the left elbow (keypoints 5, 7, 9).', 'Detect “hands up”: both wrists above the nose.', 'Count people who walk from left to right across the middle of the frame.'],
    code: `import cv2
from ultralytics import YOLO

${PIPELINE}

model = YOLO("yolo11n-pose.engine")   # from yolo11n-pose.pt, format=engine half=True
cap = cv2.VideoCapture(PIPELINE, cv2.CAP_GSTREAMER)
frame_no = 0

while True:
    ok, frame = cap.read()
    if not ok:
        continue
    result = model(frame, conf={{conf}} / 100, verbose=False)[0]
    cv2.imshow("pose", result.plot())          # skeletons + boxes
    frame_no += 1
    if frame_no % 30 == 0 and result.keypoints is not None:
        for xy, kc in zip(result.keypoints.xy, result.keypoints.conf):
            nose, l_sh, r_sh = xy[0], xy[5], xy[6]
            if kc[0] > 0.5 and kc[5] > 0.5 and kc[6] > 0.5:
                facing = "camera"
            elif kc[5] > 0.5 and kc[6] > 0.5:
                facing = "away"
            else:
                facing = "sideways"
            seen = int((kc > 0.5).sum())
            width = float(abs(l_sh[0] - r_sh[0]))
            print("person: {}/17 points, shoulders {:.0f} px apart, facing {}".format(
                seen, width, facing))
    if cv2.waitKey(1) == ord("q"):
        break`,
    params: { conf: { value: 50, min: 10, max: 95 } },
    async setup(io, b) {
      io.line('model = YOLO("yolo11n-pose'); io.print('Loading yolo11n-pose.engine for TensorRT inference...'); await io.delay(700);
      io.line('cap = cv2.VideoCapture'); io.print('GST_ARGUS: Running with following settings: Camera index = 0, Camera mode = 4, 1280 x 720 FR = 30.000'); await io.delay(300);
      b.st.running = true; b.st.frame = 0;
    },
    async loop(io, b, p) {
      const st = b.st;
      io.line('ok, frame = cap.read()');
      io.line('result = model(frame');
      st.poses = b.estimate().filter((q) => q.conf >= p.conf / 100);
      const infer = 6.5 / modeOf(st.mode)[2] + Math.random() * 0.6;
      b.setSub(`simulated · 30 fps · ${infer.toFixed(1)} ms`);
      io.line('cv2.imshow');
      st.frame++;
      if (st.frame % 30 === 0) {
        io.line('for xy, kc in zip');
        for (const q of st.poses) {
          const k = q.kps;
          const ok = (i) => k[i].c > 0.5;
          const facing = ok(0) && ok(5) && ok(6) ? 'camera' : ok(5) && ok(6) ? 'away' : 'sideways';
          const seen = k.filter((x) => x.c > 0.5).length;
          io.line('print("person:');
          io.print(`person: ${seen}/17 points, shoulders ${Math.abs((k[5].x - k[6].x) * q.sx).toFixed(0)} px apart, facing ${facing}`);
        }
        if (!st.poses.length) io.print('(no people this frame)');
      }
      await io.delay(33.3);
    },
    reset(b) { b.st.running = false; b.st.poses = []; b.setSub('simulated inference · idle'); },
  },

  // ------------------------------------------------------------------ 4
  {
    id: 'orin-llm', title: 'A local language model', icon: 'code', board: 'orin',
    thumb: ORIN_THUMB,
    view: { center: [0, 1.8, 0.4], size: 13 },
    serialInput: { placeholder: 'Ask something, then Enter · q = quit' },
    build(ctx) {
      const st = { mode: 'MAXN_SUPER', load: 5, loaded: false, busy: false, tps: 0, tokens: 0, ctx: 0, gpu: 0, history: 0 };
      orinPower(ctx, st);
      ctx.interact(ctx.board, {
        name: 'Jetson Orin Nano-style', hint: 'Power mode changes tokens per second',
        controls: [powerControl(st)],
        note: () => `≈ ${(21 * modeOf(st.mode)[2]).toFixed(0)} tokens/s for a 3B 4-bit model in this mode`,
      });
      const ram = () => {
        const base = 1.9; // OS, desktop, ollama server
        const model = st.loaded ? 2.0 + 0.11 + st.ctx * 0.00011 : 0; // weights + KV cache
        return { base, model, total: 7.4 };
      };
      const mon = ctx.browser({
        url: 'jtop · localhost', title: 'Jetson monitor',
        render: () => {
          const r = ram();
          const used = r.base + r.model;
          const pct = (x) => `${Math.round((x / r.total) * 100)}%`;
          return `<h5>Orin monitor</h5>
            <div class="row"><span>Tokens / s</span><span class="big">${st.busy || st.tps ? st.tps.toFixed(1) : '–'}</span></div>
            <div class="row"><span>GPU</span><span>${Math.round(st.gpu)} % · ${st.mode.replace('_', ' ')}</span></div>
            <div class="row"><span>RAM</span><span>${used.toFixed(1)} / ${r.total} GB</span></div>
            <div style="display:flex;height:12px;border-radius:4px;overflow:hidden;background:var(--line);margin:6px 0"><span style="width:${pct(r.base)};background:#8f8d86"></span><span style="width:${pct(r.model)};background:#2aa7a1"></span></div>
            <p class="muted">grey = Linux + Ollama · teal = llama3.2:3b (Q4) + ${st.ctx} tokens of context. An 8B model needs ≈ 5 GB more: it barely fits.</p>`;
        },
      });
      ctx.onTick((dt) => { st.gpu += ((st.busy ? 97 : 2) - st.gpu) * Math.min(1, dt * 4); st.load = st.busy ? 90 : 5; });
      return { st, mon };
    },
    callouts: [
      { anchor: 'module', x: 0.36, y: 0.12, icon: 'chip', title: '8 GB, shared', text: 'The model weights live in the same RAM as Linux: size is the limit.' },
      { anchor: 'fan', x: 0.04, y: 0.17, icon: 'gear', title: 'GPU at work', text: 'Each new token is a pass through the whole network.' },
      { anchor: 'ethernet', x: 0.04, y: 0.68, icon: 'globe', title: 'Offline', text: 'After the one-off download, no internet is needed.' },
    ],
    overview: {
      heading: 'Run a language model on the device',
      text: 'Small language models now fit on an edge board. Ollama serves a 4-bit quantised Llama 3.2 3B (about 2 GB); a short Python loop sends your question and streams the answer back token by token, then reports the speed. Type in the terminal to chat.',
      features: [['code', '<code>ollama.chat(model, messages, stream=True)</code>'], ['timer', 'Speed = <code>eval_count / eval_duration</code> tokens per second'], ['chip', 'Memory budget: weights + context (KV cache) + the OS in 8 GB']],
    },
    pinout: [['Model', 'llama3.2:3b (Q4_K_M)', '≈ 2.0 GB of weights'], ['Server', 'ollama serve on localhost:11434', 'Runs on the GPU (CUDA)'], ['Client', 'pip install ollama', 'This script'], ['Storage', 'NVMe SSD', 'Models are big downloads']],
    example: {
      text: 'Local models power offline voice assistants, robots that take spoken orders, private document search and tools that must not send data to the cloud.',
      points: ['Switch to 7 W and ask again: tokens/s drops, the answer stays the same quality', 'Long chats grow the context (KV cache) and use more RAM', 'Honest numbers: a 3B 4-bit model gives roughly 15–25 tokens/s here; an 8B model fits only just and is about half as fast'],
    },
    specs: [['Runtime', 'Ollama (llama.cpp with CUDA) or jetson-containers'], ['Model', 'Llama 3.2 3B Instruct, 4-bit, ≈ 2 GB'], ['Speed', '≈ 15–25 tokens/s (MAXN SUPER); slower in lower modes'], ['Memory', '≈ 1.9 GB system + 2.1 GB model + context'], ['Simulation', 'Replies are pre-written; timing follows the power mode']],
    quiz: [
      { q: 'Why use a 4-bit quantised model?', options: ['It is more accurate', 'It needs about a quarter of the memory of 16-bit weights, so it fits and runs faster', 'Jetsons only read 4-bit files', 'It needs no GPU'], answer: 1, explain: '3 billion parameters × 2 bytes = 6 GB at FP16; at 4 bits it is about 2 GB, with a small loss in quality.' },
      { q: 'How is tokens per second worked out here?', options: ['Words divided by minutes', 'eval_count / (eval_duration in seconds)', 'Characters per second', 'Prompt length × 2'], answer: 1, explain: 'Ollama reports how many tokens it generated and how long that took (in nanoseconds) in the final chunk.' },
      { q: 'Why does a long conversation use more memory?', options: ['Ollama leaks memory', 'The context (KV cache) grows with every token kept in history', 'The model gets bigger', 'Python stores answers twice'], answer: 1, explain: 'The model keeps keys and values for every token in the context window, so longer chats need more RAM.' },
      { q: 'Why can’t you simply run a 70B model on this board?', options: ['It is not allowed', 'Even at 4 bits it needs about 40 GB, far more than the 8 GB shared memory', 'It needs a 5 GHz network', 'Jetsons only run 1B models'], answer: 1, explain: 'Memory is the hard limit at the edge; pick the biggest model that fits with room for context and the OS.' },
    ],
    challenges: ['Add a system prompt that makes the model answer in one sentence.', 'Keep only the last 6 messages in <code>history</code> to bound memory use.', 'Speak the reply aloud with a local text-to-speech engine such as Piper.'],
    code: `import ollama

MODEL = "llama3.2:3b"          # one-off:  ollama pull llama3.2:3b  (≈ 2 GB)
history = [{"role": "system",
            "content": "You are a concise assistant running on a Jetson."}]

while True:
    prompt = input("you> ")
    if prompt.strip() in ("q", "quit"):
        break
    history.append({"role": "user", "content": prompt})
    reply = ""
    stream = ollama.chat(model=MODEL, messages=history, stream=True,
                         options={"num_predict": {{maxTokens}}, "temperature": 0.7})
    for chunk in stream:
        piece = chunk["message"]["content"]
        reply += piece
        print(piece, end="", flush=True)
        if chunk.get("done"):
            tps = chunk["eval_count"] / (chunk["eval_duration"] / 1e9)
            print("\\n[{} tokens in {:.1f} s = {:.1f} tokens/s, prompt {} tokens]".format(
                chunk["eval_count"], chunk["eval_duration"] / 1e9, tps,
                chunk["prompt_eval_count"]))
    history.append({"role": "assistant", "content": reply})`,
    params: { maxTokens: { value: 120, min: 16, max: 512 } },
    async setup(io, b) {
      const st = b.st;
      st.ctx = 22; st.tps = 0; st.quit = false;
      io.print('(Tinker Lab: the replies below are pre-written to show the timing. On a real Orin the model writes them.)');
      io.line('MODEL = "llama3.2:3b"'); await io.delay(100);
      io.line('history = ['); await io.delay(60);
      st.loaded = false;
      b.mon.update();
      io.line('prompt = input("you> ")'); io.print('you> (type a question in the box below and press Enter)');
    },
    async loop(io, b, p) {
      const st = b.st;
      if (st.quit) { await io.delay(200); return; }
      io.line('prompt = input("you> ")');
      const q = io.readLine();
      if (q == null) { await io.delay(80); return; }
      if (/^\s*(q|quit)\s*$/i.test(q)) { io.line('break'); io.print('(script finished)'); st.quit = true; return; }
      io.line('history.append({"role": "user"');
      io.line('stream = ollama.chat');
      if (!st.loaded) { io.print('(first request: Ollama loads the model into GPU memory, ≈ 3 s)'); await io.delay(2600); st.loaded = true; }
      const promptTok = Math.ceil(q.length / 4) + 8;
      st.ctx += promptTok;
      await io.delay(clamp(promptTok * 3.5, 60, 900)); // prompt evaluation ≈ 300 tokens/s
      const text = reply(q);
      const words = text.split(/(?<=\s)/);
      const tps = 21 * modeOf(st.mode)[2] * (0.95 + Math.random() * 0.1);
      st.busy = true;
      let n = 0, line = '', owed = 0;
      const t0 = performance.now();
      for (const w of words) {
        const toks = Math.max(1, Math.round(w.length / 4));
        if (n + toks > p.maxTokens) break;
        n += toks;
        io.line('print(piece, end=""');
        line += w;
        if (line.length > 70 || w.endsWith('\n')) { io.print(line.trimEnd()); line = ''; }
        owed += (toks / tps) * 1000;
        if (owed >= 150) { // stream in small batches of tokens
          await io.delay(owed);
          owed = 0;
          st.tps = n / ((performance.now() - t0) / 1000 + 1e-3);
          b.mon.update();
        }
      }
      if (owed) await io.delay(owed);
      if (line) io.print(line.trimEnd());
      const secs = n / tps;
      st.tps = tps;
      st.busy = false;
      st.ctx += n;
      io.line('if chunk.get("done")');
      io.print(`[${n} tokens in ${secs.toFixed(1)} s = ${tps.toFixed(1)} tokens/s, prompt ${st.ctx - n} tokens]`);
      io.line('history.append({"role": "assistant"');
      b.mon.update();
    },
    reset(b) { Object.assign(b.st, { busy: false, tps: 0, loaded: false, ctx: 0 }); b.mon.update(); },
  },
];

/** Pre-written replies for the simulated chat (picked by keyword). */
function reply(q) {
  const s = q.toLowerCase();
  if (/tops|fast|speed|gpu/.test(s)) return 'The GPU does most of the work: each new token means one pass through all 3 billion weights. Memory bandwidth, not raw TOPS, usually sets the speed for a model this size, which is why 4-bit weights help so much. ';
  if (/memory|ram|gb/.test(s)) return 'This model needs about 2 GB for its 4-bit weights plus a little for the context. Linux and Ollama take roughly another 2 GB, so there is room left in the 8 GB, but an 8B model would barely fit. ';
  if (/hello|hi\b|hey/.test(s)) return 'Hello! I am a small language model running entirely on this board, with no internet connection needed. Ask me about electronics, code or the Jetson itself. ';
  if (/led|blink|gpio/.test(s)) return 'To blink an LED on the 40-pin header, wire pin 12 through a 330 ohm resistor to the LED and back to a GND pin, then toggle it with Jetson.GPIO in a loop with a short sleep. Remember the header uses 3.3 V logic. ';
  if (/robot|drive|motor/.test(s)) return 'A robot could pass my answer to its motor controller: for example, turn "go to the kitchen" into a short plan of moves. Keep safety checks outside the model, because language models can be confidently wrong. ';
  return 'Good question. I run as a 4-bit quantised model on the Orin’s GPU, so I am quick but small: I know less than a large cloud model and I can make mistakes. Check important answers against a reliable source. ';
}

/** Extra glossary entries: [icon, name, description, lessonId]. */
export const parts = [
  ['chip', 'Jetson Orin Nano-style dev kit', 'Ampere GPU with Tensor Cores, 8 GB shared memory, up to 67 TOPS.', 'orin-meet'],
  ['radar', 'YOLO11 + TensorRT', 'Ultralytics detector compiled into a TensorRT engine for the Jetson GPU.', 'orin-yolo'],
  ['hand', 'Pose estimation', 'Finds people and 17 body keypoints each, with a confidence per point.', 'orin-pose'],
  ['code', 'Local language model', 'A quantised LLM served by Ollama on the device; speed in tokens per second.', 'orin-llm'],
];
