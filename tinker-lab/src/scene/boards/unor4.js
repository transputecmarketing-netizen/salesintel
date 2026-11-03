// A procedurally built Uno R4 WiFi-style board (6.86 × 5.34 cm, the same
// footprint and header positions as the Uno-style board): RA4M1 Arm
// Cortex-M4 main MCU, an ESP32-S3 module for Wi-Fi / Bluetooth, USB-C, a
// Qwiic (3.3 V I²C) connector and the 12 × 8 red LED matrix.
//
// board.matrix: set(rows) lights the 3D LEDs. rows = 8 rows (top row first,
// the digital-header side) of 12 columns each, as strings ('0'/'1', '.'/'#',
// or brightness digits '0'–'9'), arrays (0/1, booleans or 0..1), or 12-bit
// numbers (bit 11 = left column). Also clear(), pixel(col, row, v),
// loadFrame([u32, u32, u32]) (the Arduino_LED_Matrix 96-bit frame format)
// and get() → 8 × 12 array of levels.
import * as THREE from 'three';
import { mat, box, cyl, at, canvasTexture } from '../kit.js';
import { femaleHeader } from '../board.js';
import {
  PITCH, FEMALE_H, FONT, MONO, SILK, makePCB, makeSilk, text, drawTraces, pad, chipIC, sot223, passives, crystal, canCap, smdLed, tactSwitch, smallMaleHeader,
  barrelJack, pinLookup, texMat, shellMetal,
} from './parts.js';

const W = 6.86, D = 5.34;
const TOP = 0.17;
const HEADERS = [
  { x0: -0.75, z: -2.47, pins: ['SCL', 'SDA', 'AREF', 'GND', 'D13', 'D12', 'D11', 'D10', 'D9', 'D8'] },
  { x0: 1.95, z: -2.47, pins: ['D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0'] },
  { x0: -0.3, z: 2.47, pins: ['NC', 'IOREF', 'RESET', '3V3', '5V', 'GND_2', 'GND_3', 'VIN'] },
  { x0: 1.95, z: 2.47, pins: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'] },
];
const HOLES = [[-2.9, 2.2, 0.16], [-2.75, -2.2, 0.16], [2.9, -2.2, 0.16], [2.9, 1.25, 0.16]];
const MX = { x: 1.55, z: 0.0, cols: 12, rows: 8, pitch: 0.22 };
const ESP = { x: -1.72, z: -0.45, w: 1.5, d: 2.0 }; // ESP32-S3 module (antenna end at -z)
const RA = [-0.45, 1.25];
const QWIIC = [3.12, -1.42];
const LEDS = [['L', 0xf4a83b, -1.15], ['TX', 0xf4c03b, -0.92], ['RX', 0xf4c03b, -0.69], ['ON', 0x52d27a, -0.46]];
const LED_X = -0.42;
const PWM = new Set(['D3', 'D5', 'D6', 'D9', 'D10', 'D11']);

const mxX = (c) => MX.x + (c - (MX.cols - 1) / 2) * MX.pitch;
const mxZ = (r) => MX.z + (r - (MX.rows - 1) / 2) * MX.pitch;

function silkscreen(ctx, t) {
  const { px, pz, s } = t;
  const f = (cm) => cm * s;
  drawTraces(ctx, t, { rects: [[-3.1, -1.3, -0.1, 2.0], [-0.2, 1.0, 3.2, 1.6], [2.9, -1.0, 3.3, 1.0]], n: 40, seed: 4, color: 'rgba(170,230,235,.25)', via: 'rgba(220,240,240,.5)', width: 0.04 });
  for (const h of HEADERS) {
    const back = h.z < 0;
    h.pins.forEach((name, i) => {
      if (name === 'NC') return;
      const x = h.x0 + i * PITCH;
      let lab = name.replace(/^D/, '').replace(/_\d$/, '').replace('3V3', '3.3V');
      if (PWM.has(name)) lab = `~${lab}`;
      if (name === 'D0') lab = 'RX←0';
      if (name === 'D1') lab = 'TX→1';
      if (name === 'A0') lab = 'A0 DAC';
      text(ctx, lab, px(x), pz(h.z + (back ? 0.42 : -0.42)), { size: f(0.12), rot: -Math.PI / 2, align: back ? 'right' : 'left', maxW: f(0.5) });
    });
  }
  text(ctx, 'DIGITAL (PWM ~)', px(1.6), pz(-1.55), { size: f(0.15) });
  ctx.strokeStyle = SILK;
  ctx.lineWidth = f(0.025);
  ctx.beginPath();
  ctx.moveTo(px(-0.5), pz(-1.38));
  ctx.lineTo(px(3.7), pz(-1.38));
  ctx.stroke();
  text(ctx, 'POWER', px(0.6), pz(1.85), { size: f(0.15) });
  text(ctx, 'ANALOG IN', px(2.6), pz(1.85), { size: f(0.15) });
  // matrix frame + legend
  ctx.strokeStyle = 'rgba(238,240,246,.55)';
  ctx.lineWidth = f(0.018);
  const mw = MX.cols * MX.pitch + 0.14, md = MX.rows * MX.pitch + 0.14;
  ctx.strokeRect(px(MX.x - mw / 2), pz(MX.z - md / 2), f(mw), f(md));
  text(ctx, 'LED MATRIX 12×8', px(MX.x - mw / 2), pz(-1.1), { size: f(0.09), align: 'left' });
  text(ctx, 'UNO R4 WIFI-STYLE', px(0.25), pz(1.18), { size: f(0.2), weight: 700, align: 'left' });
  text(ctx, 'TINKER LAB · RA4M1 + ESP32-S3', px(0.27), pz(1.43), { size: f(0.1), align: 'left' });
  for (const [name, , z] of LEDS) text(ctx, name, px(LED_X - 0.16), pz(z), { size: f(0.1), align: 'right' });
  text(ctx, 'RESET', px(-2.6), pz(-1.83), { size: f(0.1) });
  text(ctx, 'USB-C', px(-2.55), pz(-0.62), { size: f(0.09) });
  text(ctx, 'QWIIC', px(QWIIC[0] - 0.34), pz(QWIIC[1]), { size: f(0.08), rot: -Math.PI / 2 });
  text(ctx, 'ICSP', px(3.15), pz(-0.72), { size: f(0.08) });
  text(ctx, 'ESP', px(-2.52), pz(0.85), { size: f(0.075), align: 'right' });
  // ESP32 header pads
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) pad(ctx, t, -2.42 + i * PITCH, 0.74 + j * PITCH, 0.13, 0.13, { round: true, hole: true });
  pad(ctx, t, -2.42, 0.74, 0.13, 0.13, { hole: true });
}

/** ESP32-S3-MINI-style module: metal can + PCB antenna end. */
function espModule() {
  const g = new THREE.Group();
  const side = mat(0x1b1e25, { rough: 0.6 });
  const antTex = canvasTexture(256, 340, (c, w, h) => {
    c.fillStyle = '#1b1e25';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#d4b25e';
    c.lineWidth = 9;
    c.beginPath();
    let x = 30, up = true;
    c.moveTo(x, 70);
    for (let i = 0; i < 7; i++) {
      c.lineTo(x, up ? 18 : 70);
      x += 30;
      c.lineTo(x, up ? 18 : 70);
      up = !up;
    }
    c.stroke();
    c.fillStyle = '#d4b25e';
    for (let i = 0; i < 9; i++) for (const xx of [4, w - 18]) c.fillRect(xx, 110 + i * 24, 14, 12);
  });
  g.add(at(box(ESP.w, 0.08, ESP.d, [side, side, texMat(antTex, { rough: 0.55 }), side, side, side]), 0, 0.04, 0));
  const canTex = canvasTexture(300, 300, (c, w, h) => {
    const grd = c.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#dadcdd');
    grd.addColorStop(1, '#c6c9cb');
    c.fillStyle = grd;
    c.fillRect(0, 0, w, h);
    const engrave = (str, y, size, font = FONT) => {
      c.font = `700 ${size}px ${font}`;
      c.textAlign = 'center';
      c.fillStyle = 'rgba(255,255,255,.7)';
      c.fillText(str, w / 2 + 1.5, y + 1.5);
      c.fillStyle = 'rgba(70,74,80,.85)';
      c.fillText(str, w / 2, y);
    };
    engrave('ESP32-S3', 95, 50);
    engrave('MINI-1 STYLE', 150, 30);
    engrave('Wi-Fi · BLE 5', 200, 28);
    engrave('TINKER LAB', 250, 24, MONO);
  });
  const sh = shellMetal();
  g.add(at(box(ESP.w - 0.1, 0.22, 1.42, [sh, sh, texMat(canTex, { rough: 0.35, metal: 0.45 }), sh, sh, sh]), 0, 0.08 + 0.11, 0.24));
  return g;
}

function usbC() {
  const g = new THREE.Group();
  const shell = shellMetal();
  g.add(at(box(0.74, 0.32, 0.9, shell), 0, 0.16, 0));
  g.add(at(box(0.02, 0.18, 0.72, mat(0x15161a), { outline: false }), -0.375, 0.16, 0));
  g.add(at(box(0.025, 0.05, 0.5, mat(0x34363d), { outline: false }), -0.38, 0.16, 0));
  return g;
}

/** Qwiic / STEMMA QT JST-SH 4-pin socket; opening faces +x. */
function qwiic() {
  const g = new THREE.Group();
  g.add(at(box(0.45, 0.3, 0.62, mat(0x1d1e23, { rough: 0.6 })), 0, 0.15, 0));
  g.add(at(box(0.02, 0.16, 0.46, mat(0x0a0a0c), { outline: false }), 0.23, 0.15, 0));
  for (let i = 0; i < 4; i++) g.add(at(box(0.03, 0.03, 0.04, mat(0xd9d4c2, { metal: 0.6 }), { outline: false }), 0.235, 0.13, -0.15 + i * 0.1));
  for (const s of [-1, 1]) g.add(at(box(0.18, 0.12, 0.06, shellMetal(), { outline: false }), -0.05, 0.06, s * 0.34));
  return g;
}

/** 12 × 8 charlieplexed red LED matrix: instanced lenses + one additive glow layer. */
function makeMatrix(g) {
  const n = MX.cols * MX.rows;
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(0.15, 0.035, 0.1), mat(0xe9e5d8, { rough: 0.6 }), n);
  const lensMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lenses = new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 0.04, 0.075), lensMat, n);
  const m = new THREE.Matrix4();
  const OFF = new THREE.Color(0x6b2a22), ON = new THREE.Color(0xff5a42), c = new THREE.Color();
  for (let r = 0; r < MX.rows; r++) for (let col = 0; col < MX.cols; col++) {
    const i = r * MX.cols + col;
    bodies.setMatrixAt(i, m.makeTranslation(mxX(col), TOP + 0.0175, mxZ(r)));
    lenses.setMatrixAt(i, m.makeTranslation(mxX(col), TOP + 0.055, mxZ(r)));
    lenses.setColorAt(i, OFF);
  }
  bodies.castShadow = true;
  lenses.raycast = () => {};
  g.add(bodies, lenses);
  // glow layer
  const GW = MX.cols * MX.pitch + 0.5, GD = MX.rows * MX.pitch + 0.5;
  const cw = 480, ch = Math.round((cw * GD) / GW);
  const glowTex = canvasTexture(cw, ch, (ctx) => ctx.clearRect(0, 0, cw, ch));
  const gctx = glowTex.image.getContext('2d');
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(GW, GD), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(MX.x, TOP + 0.09, MX.z);
  glow.raycast = () => {};
  glow.renderOrder = 2;
  g.add(glow);
  const level = new Float32Array(n);
  const flush = () => {
    gctx.clearRect(0, 0, cw, ch);
    const k = cw / GW;
    for (let r = 0; r < MX.rows; r++) for (let col = 0; col < MX.cols; col++) {
      const v = level[r * MX.cols + col];
      lenses.setColorAt(r * MX.cols + col, c.copy(OFF).lerp(ON, v));
      if (v <= 0) continue;
      const x = (mxX(col) - MX.x + GW / 2) * k, y = (mxZ(r) - MX.z + GD / 2) * k, rad = 0.2 * k;
      const gr = gctx.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, `rgba(255,110,80,${0.95 * v})`);
      gr.addColorStop(0.35, `rgba(255,60,40,${0.45 * v})`);
      gr.addColorStop(1, 'rgba(255,40,30,0)');
      gctx.fillStyle = gr;
      gctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    lenses.instanceColor.needsUpdate = true;
    glowTex.needsUpdate = true;
  };
  const toLevel = (x) => {
    if (typeof x === 'boolean') return x ? 1 : 0;
    if (typeof x === 'string') {
      if ('#*xXoO@'.includes(x)) return 1;
      if (/[0-9]/.test(x)) return x === '1' ? 1 : +x / 9;
      return 0;
    }
    const v = Number(x) || 0;
    return v > 1 ? Math.min(1, v / 255) : Math.max(0, v);
  };
  const api = {
    cols: MX.cols,
    rows: MX.rows,
    /** rows: 8 strings / arrays / 12-bit numbers, or a flat array of 96 values. */
    set(rows) {
      level.fill(0);
      if (Array.isArray(rows) && rows.length === n && !Array.isArray(rows[0])) {
        rows.forEach((v, i) => (level[i] = toLevel(v)));
      } else {
        (rows ?? []).slice(0, MX.rows).forEach((row, r) => {
          for (let col = 0; col < MX.cols; col++) {
            let v;
            if (typeof row === 'number') v = (row >> (MX.cols - 1 - col)) & 1;
            else if (typeof row === 'string') v = row[col] ?? '0';
            else v = row?.[col] ?? 0;
            level[r * MX.cols + col] = toLevel(v);
          }
        });
      }
      flush();
      return api;
    },
    /** Arduino_LED_Matrix loadFrame(): three 32-bit words, MSB first, row by row. */
    loadFrame(words) {
      for (let i = 0; i < n; i++) level[i] = (words[Math.floor(i / 32)] >>> (31 - (i % 32))) & 1;
      flush();
      return api;
    },
    pixel(col, row, v = 1) {
      if (col < 0 || col >= MX.cols || row < 0 || row >= MX.rows) return api;
      level[row * MX.cols + col] = toLevel(v);
      flush();
      return api;
    },
    clear() {
      level.fill(0);
      flush();
      return api;
    },
    get() {
      return Array.from({ length: MX.rows }, (_, r) => Array.from(level.slice(r * MX.cols, (r + 1) * MX.cols)));
    },
  };
  flush();
  return api;
}

export function makeUnoR4() {
  const g = new THREE.Group();
  g.name = 'board-unor4';
  makePCB(g, { w: W, d: D, color: 0x157a86, radius: 0.22, holes: HOLES, baseT: 0.05, thick: 0.12 });
  makeSilk(g, W, D, TOP, silkscreen, 2048);

  const on = (obj, x, z, rotY = 0, y = 0) => {
    obj.position.set(x, obj.position.y + TOP + y, z);
    obj.rotation.y = rotY;
    g.add(obj);
    return obj;
  };

  on(usbC(), -3.1, -1.3);
  on(barrelJack({ w: 0.9, h: 1.1, d: 1.4 }), -2.73, 1.55);
  on(tactSwitch({ w: 0.6, d: 0.6, capColor: 0xd8443a, capR: 0.17, h: 0.22 }), -2.6, -2.2);
  on(espModule(), ESP.x, ESP.z);
  on(chipIC({
    w: 1.0, h: 0.12, legsX: 16, legsZ: 16, legLen: 0.06, legW: 0.022, res: 320,
    lines: [{ t: 'R7FA4M1', size: 0.13, y: 0.38 }, { t: 'AB3CFM', size: 0.11, y: 0.55 }, { t: 'TINKER', size: 0.09, y: 0.72 }],
  }), ...RA);
  on(sot223('5V REG'), -1.55, 1.95);
  on(chipIC({ w: 0.45, d: 0.3, h: 0.08, legsX: 3, legLen: 0.06, lines: [{ t: '3V3', size: 0.3, y: 0.5 }] }), -0.62, 0.33);
  on(crystal({ w: 0.28, d: 0.2, h: 0.07 }), 0.02, -0.72);
  for (const [x, z] of [[-1.65, 1.33], [-1.22, 0.86]]) on(canCap(0.22, 0.4), x, z);
  g.add(passives([
    [-0.95, 1.95, 0, 'r'], [-0.7, 1.95, 0, 'c'], [0.1, 0.95, Math.PI / 2, 'c'], [0.1, 1.6, Math.PI / 2, 'c'], [-0.95, 0.7, 0, 'c'],
    [-2.4, -0.25, Math.PI / 2, 'c'], [-2.4, 0.15, Math.PI / 2, 'r'], [3.0, 0.75, Math.PI / 2, 'r'], [3.25, 0.75, Math.PI / 2, 'c'], [2.95, -1.0, 0, 'r'],
    [-2.0, -1.95, 0, 'd'], [-1.1, -1.95, 0, 'c'],
  ], TOP));
  // status LEDs: L (D13), TX, RX, ON
  const leds = {};
  for (const [name, c, z] of LEDS) {
    const l = smdLed(c, { w: 0.15, d: 0.09, h: 0.07, glowSize: 0.9, glowColor: c });
    on(l.group, LED_X, z);
    leds[name] = l;
  }
  leds.ON.set(0.9);
  // ICSP (RA4M1) and Qwiic
  const icsp = smallMaleHeader(2, 3);
  on(icsp, 3.15, -0.2, Math.PI / 2);
  on(qwiic(), ...QWIIC);
  const matrix = makeMatrix(g);

  for (const h of HEADERS) on(femaleHeader(h.pins.length), h.x0 + ((h.pins.length - 1) * PITCH) / 2, h.z);
  const tipY = TOP + FEMALE_H;
  const pinMap = {};
  for (const h of HEADERS) h.pins.forEach((p, i) => p !== 'NC' && (pinMap[p] = new THREE.Vector3(h.x0 + i * PITCH, tipY, h.z)));
  const aliases = { LED: 'D13', LED_BUILTIN: 'D13', DAC: 'A0', TX: 'D1', RX: 'D0', '3.3V': '3V3', RST: 'RESET', SCK: 'D13', MISO: 'D12', MOSI: 'D11', SS: 'D10' };
  const lookup = pinLookup('Uno R4 WiFi-style', g, pinMap, aliases, (n) => {
    const m = /^(?:D|PIN)?(\d+)$/.exec(n);
    if (m && +m[1] <= 13) return `D${+m[1]}`;
    const a = /^A(\d)$/.exec(n);
    return a ? `A${a[1]}` : null;
  });
  const qwiicLocal = new THREE.Vector3(QWIIC[0] + 0.25, TOP + 0.15, QWIIC[1]);

  return {
    id: 'unor4',
    name: 'Uno R4 WiFi-style',
    group: g,
    pins: Object.keys(pinMap),
    pin: lookup.pin,
    resolve: lookup.resolve,
    matrix,
    setBuiltinLed(level) { leds.L.set(level); },
    /** TX / RX activity LEDs (0..1). */
    setTxRx(tx, rx) { leds.TX.set(tx); leds.RX.set(rx); },
    /** World position of the Qwiic socket mouth (cable goes out along +x). */
    get qwiic() { return qwiicLocal.clone().applyMatrix4(g.matrixWorld); },
    anchors: {
      usb: new THREE.Vector3(-3.1, TOP + 0.4, -1.3),
      jack: new THREE.Vector3(-3.2, TOP + 0.6, 1.55),
      chip: new THREE.Vector3(RA[0], TOP + 0.18, RA[1]),
      mcu: new THREE.Vector3(RA[0], TOP + 0.18, RA[1]),
      esp: new THREE.Vector3(ESP.x, TOP + 0.32, ESP.z + 0.24),
      module: new THREE.Vector3(ESP.x, TOP + 0.32, ESP.z + 0.24),
      antenna: new THREE.Vector3(ESP.x, TOP + 0.1, ESP.z - ESP.d / 2 + 0.15),
      matrix: new THREE.Vector3(MX.x, TOP + 0.08, MX.z),
      qwiic: new THREE.Vector3(QWIIC[0], TOP + 0.3, QWIIC[1]),
      icsp: new THREE.Vector3(3.15, TOP + 0.85, -0.2),
      digital: new THREE.Vector3(2.4, tipY, -2.47),
      power: new THREE.Vector3(0.4, tipY, 2.47),
      analog: new THREE.Vector3(2.6, tipY, 2.47),
      reset: new THREE.Vector3(-2.6, TOP + 0.45, -2.2),
      lLed: new THREE.Vector3(LED_X, TOP + 0.1, -1.15),
      led: new THREE.Vector3(LED_X, TOP + 0.1, -1.15),
      d13: pinMap.D13.clone(),
      gnd: pinMap.GND.clone(),
    },
  };
}
