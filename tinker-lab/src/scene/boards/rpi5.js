// A procedurally built Raspberry Pi 5-style single-board computer
// (8.5 × 5.6 cm). Top view with the 40-pin header along the back edge (-z):
// USB and Ethernet on the right edge (+x), USB-C power and two micro-HDMI
// on the front edge (+z), the BCM2712 under an active cooler with a blower
// fan, the RP1 I/O controller, two 4-lane MIPI CAM/DISP connectors, the
// PCIe FFC connector and the power button. Header pins use the standard
// Raspberry Pi layout (physical numbering, odd pins on the inner row).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, mesh, box, cyl, at, canvasTexture, roundedRectShape, slab } from '../kit.js';
import {
  PITCH, MALE_TIP, FONT, MONO, SILK, makePCB, makeSilk, text, drawTraces, pad, chipIC, passives, crystal, smdLed, tactSwitch, headerBase, pinField,
  smallMaleHeader, hdmi, usbAStack, rj45, pinLookup, texMat, shellMetal,
} from './parts.js';

const W = 8.5, D = 5.6;
const BASE_T = 0.04, PCB_T = 0.12;
const TOP = BASE_T + PCB_T;
const GX = -1.0; // header centre (32.5 mm from the left edge)
const ODD_Z = -2.323, EVEN_Z = -2.577; // header centre 3.5 mm from the top edge
const HOLES = [[-3.9, -2.45, 0.14], [1.9, -2.45, 0.14], [-3.9, 2.45, 0.14], [1.9, 2.45, 0.14]];
const COOL = { x: -1.3, z: 0.3, w: 4.3, d: 3.0, lift: 0.32, base: 0.22, finH: 0.78 };
const FAN = { x: -0.15, z: 0.3, r: 1.0 }; // blower, right half of the cooler
const FAN_CONN = [2.08, -1.85];
const MIPI = [{ x: 1.12, z: 1.6, label: 'CAM/DISP 0' }, { x: 1.78, z: 1.6, label: 'CAM/DISP 1' }];
const MIPI_LEN = 1.3;
const RP1 = [1.75, -0.35];
const LEDS = { pwr: [-4.0, 1.42], act: [-4.0, 1.68] };
const BTN = [-3.95, 2.25];
const RIGHT = 4.25 + 0.2; // ports overhang the right edge by 2 mm
const FRONT = 2.8 + 0.1;
// right-edge ports: [kind, z]
const RPORTS = [['usb2', -1.9], ['usb3', -0.1], ['eth', 1.775]];
const HDMI_X = [-1.67, -0.33];
const USBC_X = -3.13;

// BCM GPIO number for every physical pin (null = power / ground)
const BCM = [null,
  null, null, 2, null, 3, null, 4, 14, null, 15,
  17, 18, 27, null, 22, 23, null, 24, 10, null,
  9, 25, 11, 8, null, 7, 0, 1, 5, null,
  6, 12, 13, null, 19, 16, 26, 20, null, 21];
const POWER = { 1: '3V3', 2: '5V', 4: '5V', 6: 'GND', 9: 'GND', 14: 'GND', 17: '3V3', 20: 'GND', 25: 'GND', 30: 'GND', 34: 'GND', 39: 'GND' };
// short function names printed after the GPIO number
const FUNC = { 3: 'SDA', 5: 'SCL', 8: 'TXD', 10: 'RXD', 12: 'PWM0', 19: 'MOSI', 21: 'MISO', 23: 'SCLK', 24: 'CE0', 26: 'CE1', 27: 'ID_SD', 28: 'ID_SC', 32: 'PWM0', 33: 'PWM1', 35: 'PWM1' };

const ALIASES = {
  '3V3': 'PIN1', '3V3_2': 'PIN17', '3.3V': 'PIN1', '5V': 'PIN2', '5V_2': 'PIN4',
  GND: 'PIN6', GND_2: 'PIN9', GND_3: 'PIN14', GND_4: 'PIN20', GND_5: 'PIN25', GND_6: 'PIN30', GND_7: 'PIN34', GND_8: 'PIN39',
  SDA: 'PIN3', SCL: 'PIN5', SDA1: 'PIN3', SCL1: 'PIN5', TXD: 'PIN8', RXD: 'PIN10', TX: 'PIN8', RX: 'PIN10', TXD0: 'PIN8', RXD0: 'PIN10',
  MOSI: 'PIN19', MISO: 'PIN21', SCLK: 'PIN23', SCK: 'PIN23', CE0: 'PIN24', CE1: 'PIN26', ID_SD: 'PIN27', ID_SC: 'PIN28',
  PWM0: 'PIN32', PWM1: 'PIN33', PCM_CLK: 'PIN12', PCM_FS: 'PIN35', PCM_DIN: 'PIN38', PCM_DOUT: 'PIN40', GPCLK0: 'PIN7',
};
BCM.forEach((b, n) => { if (b != null) ALIASES[`GPIO${b}`] = `PIN${n}`; });

const pinXY = (n) => {
  const col = Math.floor((n - 1) / 2);
  return [GX - 2.413 + col * PITCH, n % 2 ? ODD_Z : EVEN_Z];
};
const label = (n) => (POWER[n] ? POWER[n] : `GPIO${BCM[n]}${FUNC[n] ? ` ${FUNC[n]}` : ''}`);

function silkscreen(ctx, t) {
  const { px, pz, s } = t;
  const f = (cm) => cm * s;
  drawTraces(ctx, t, { rects: [[-4.1, -1.3, 2.6, 2.1], [1.0, -1.6, 2.6, 2.5], [-4.1, -1.4, -3.2, 2.5]], n: 60, seed: 2712, color: 'rgba(150,230,170,.22)', via: 'rgba(225,235,210,.5)', width: 0.04 });
  // header labels: two lines per column, odd pin left, even pin right
  for (let n = 1; n <= 40; n++) {
    const [x] = pinXY(n);
    const dx = n % 2 ? -0.058 : 0.058;
    const col = POWER[n] === '5V' ? '#ffb3a8' : POWER[n] === '3V3' ? '#ffd9a0' : POWER[n] === 'GND' ? 'rgba(238,240,246,.72)' : SILK;
    text(ctx, `${n} ${label(n)}`, px(x + dx), pz(ODD_Z + 0.17), { size: f(0.072), rot: -Math.PI / 2, align: 'right', maxW: f(0.52), color: col });
  }
  // pin-1 marker and header name
  const [x1] = pinXY(1);
  ctx.fillStyle = SILK;
  ctx.beginPath();
  ctx.moveTo(px(x1 - 0.18), pz(ODD_Z));
  ctx.lineTo(px(x1 - 0.32), pz(ODD_Z - 0.09));
  ctx.lineTo(px(x1 - 0.32), pz(ODD_Z + 0.09));
  ctx.closePath();
  ctx.fill();
  text(ctx, 'J8', px(x1 - 0.5), pz(-2.45), { size: f(0.11), weight: 700 });
  text(ctx, 'GPIO', px(x1 - 0.5), pz(-2.25), { size: f(0.075) });
  // board title under the header labels
  text(ctx, 'PI 5-STYLE', px(-3.0), pz(-1.42), { size: f(0.2), weight: 700, align: 'left' });
  text(ctx, 'TINKER LAB · BCM2712 · 4GB LPDDR4X', px(-1.75), pz(-1.42), { size: f(0.095), align: 'left', maxW: f(2.6) });
  // connector labels
  text(ctx, 'USB-C 5V 5A', px(USBC_X), pz(2.22), { size: f(0.08) });
  text(ctx, 'HDMI0', px(HDMI_X[0]), pz(1.95), { size: f(0.085), weight: 700 });
  text(ctx, 'HDMI1', px(HDMI_X[1]), pz(1.95), { size: f(0.085), weight: 700 });
  text(ctx, 'UART', px(-1.0), pz(2.17), { size: f(0.065) });
  for (const m of MIPI) text(ctx, m.label, px(m.x - 0.25), pz(m.z), { size: f(0.075), rot: -Math.PI / 2, maxW: f(1.2) });
  text(ctx, 'RTC', px(-2.4), pz(2.17), { size: f(0.065) });
  text(ctx, 'PCIe', px(-3.68), pz(-0.95), { size: f(0.075) });
  text(ctx, 'FAN', px(FAN_CONN[0] + 0.32), pz(FAN_CONN[1]), { size: f(0.075), rot: -Math.PI / 2 });
  text(ctx, 'PoE+', px(1.62), pz(-1.2), { size: f(0.07), align: 'right' });
  text(ctx, 'PWR', px(LEDS.pwr[0] + 0.15), pz(LEDS.pwr[1]), { size: f(0.065), align: 'left' });
  text(ctx, 'ACT', px(LEDS.act[0] + 0.15), pz(LEDS.act[1]), { size: f(0.065), align: 'left' });
  text(ctx, 'µSD ▾', px(-4.0), pz(0.95), { size: f(0.065), rot: -Math.PI / 2 });
  text(ctx, 'USB 2', px(2.55), pz(-1.9), { size: f(0.07), rot: -Math.PI / 2 });
  text(ctx, 'USB 3', px(2.55), pz(-0.1), { size: f(0.07), rot: -Math.PI / 2 });
  text(ctx, 'GbE', px(2.2), pz(1.0), { size: f(0.07) });
  // cooler footprint
  ctx.strokeStyle = 'rgba(238,240,246,.4)';
  ctx.lineWidth = f(0.015);
  ctx.setLineDash([f(0.05), f(0.04)]);
  ctx.strokeRect(px(COOL.x - COOL.w / 2 - 0.05), pz(COOL.z - COOL.d / 2 - 0.05), f(COOL.w + 0.1), f(COOL.d + 0.1));
  ctx.setLineDash([]);
  pad(ctx, t, BTN[0], BTN[1] + 0.32, 0.12, 0.12, { round: true });
}

/** USB-C receptacle, opening faces -x. */
function usbC() {
  const g = new THREE.Group();
  const shell = shellMetal();
  g.add(at(box(0.74, 0.32, 0.9, shell), 0, 0.16, 0));
  g.add(at(box(0.02, 0.18, 0.72, mat(0x15161a), { outline: false }), -0.375, 0.16, 0));
  g.add(at(box(0.025, 0.05, 0.5, mat(0x34363d), { outline: false }), -0.38, 0.16, 0));
  for (const s of [-1, 1]) g.add(at(box(0.2, 0.2, 0.06, shell, { outline: false }), 0.15, 0.1, s * 0.48));
  return g;
}

/** 22-way 0.5 mm FPC connector (long axis along z) with a dark actuator. */
function fpcConnector(len = MIPI_LEN) {
  const g = new THREE.Group();
  g.add(at(box(0.36, 0.26, len, mat(0xe8dfc6, { rough: 0.6 })), 0, 0.13, 0));
  g.add(at(box(0.14, 0.08, len * 0.94, mat(0x2a2c33, { rough: 0.5 })), -0.1, 0.3, 0));
  g.add(at(box(0.06, 0.01, len * 0.82, mat(0x15161a), { outline: false }), 0.06, 0.262, 0));
  for (const s of [-1, 1]) g.add(at(box(0.24, 0.04, 0.1, mat(0xcfccc2, { metal: 0.5, rough: 0.35 }), { outline: false }), 0, 0.02, s * (len / 2 + 0.05)));
  return g;
}

/** JST-SH style small connector (n pins along x). */
function jstSH(n, color = 0xf0ead8) {
  const g = new THREE.Group();
  const w = n * 0.1 + 0.2;
  g.add(at(box(w, 0.3, 0.32, mat(color, { rough: 0.6 })), 0, 0.15, 0));
  for (let i = 0; i < n; i++) g.add(at(box(0.05, 0.01, 0.12, mat(0x15161a), { outline: false }), (i - (n - 1) / 2) * 0.1, 0.305, 0.04));
  return g;
}

function coolerTopTexture() {
  const s = 160;
  return canvasTexture(Math.round(COOL.w * s), Math.round(COOL.d * s), (ctx, w, h) => {
    ctx.fillStyle = '#b9bec4';
    ctx.fillRect(0, 0, w, h);
    const X = (x) => (x - (COOL.x - COOL.w / 2)) * s, Z = (z) => (z - (COOL.z - COOL.d / 2)) * s;
    // round opening over the blower
    ctx.fillStyle = '#20232a';
    ctx.beginPath();
    ctx.arc(X(FAN.x), Z(FAN.z), FAN.r * s, 0, Math.PI * 2);
    ctx.fill();
  });
}

function makeActiveCooler() {
  const g = new THREE.Group();
  const alu = mat(0xc3c8ce, { metal: 0.5, rough: 0.36 });
  const lx = (x) => x - COOL.x, lz = (z) => z - COOL.z;
  g.add(at(box(COOL.w, COOL.base, COOL.d, alu), 0, COOL.base / 2, 0));
  // fins (along z) over the left part, leaving room for the blower
  const fins = [];
  const x0 = -COOL.w / 2 + 0.06, x1 = lx(FAN.x - FAN.r - 0.12);
  const n = 15;
  for (let i = 0; i < n; i++) {
    const fg = new THREE.BoxGeometry(0.06, COOL.finH, COOL.d - 0.1);
    fg.translate(x0 + ((x1 - x0) * i) / (n - 1), COOL.base + COOL.finH / 2, 0);
    fins.push(fg);
  }
  g.add(mesh(mergeGeometries(fins), alu));
  // blower housing: dark shroud with a round opening and an impeller inside
  const dark = mat(0x23262d, { rough: 0.55 });
  const shroud = roundedRectShape(FAN.r * 2 + 0.5, COOL.d - 0.1, 0.18);
  const hole = new THREE.Path();
  hole.absarc(0, 0, FAN.r * 0.92, 0, Math.PI * 2, true);
  shroud.holes.push(hole);
  const sl = slab(shroud, 0.05, dark);
  sl.position.set(lx(FAN.x), COOL.base + COOL.finH - 0.05, 0);
  g.add(sl);
  const ring = mesh(new THREE.CylinderGeometry(FAN.r * 0.95, FAN.r * 0.95, COOL.finH - 0.05, 40, 1, true), mat(0x2b2e36, { rough: 0.6, side: THREE.DoubleSide }), { outline: false });
  ring.position.set(lx(FAN.x), COOL.base + (COOL.finH - 0.05) / 2, lz(FAN.z));
  g.add(ring);
  const rotor = new THREE.Group();
  rotor.position.set(lx(FAN.x), COOL.base, lz(FAN.z));
  rotor.add(at(cyl(0.42, 0.42, COOL.finH - 0.12, mat(0x2b2d34, { rough: 0.5 }), { seg: 28 }), 0, (COOL.finH - 0.12) / 2, 0));
  const sticker = new THREE.Mesh(
    new THREE.CircleGeometry(0.36, 36),
    texMat(canvasTexture(256, 256, (c) => {
      c.fillStyle = '#e9e5da';
      c.beginPath();
      c.arc(128, 128, 126, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#1d2440';
      c.textAlign = 'center';
      c.font = `700 40px ${FONT}`;
      c.fillText('TINKER', 128, 112);
      c.fillText('LAB', 128, 152);
      c.font = `500 24px ${MONO}`;
      c.fillText('5V PWM', 128, 192);
    }), { rough: 0.6 }),
  );
  sticker.rotation.x = -Math.PI / 2;
  sticker.position.y = COOL.finH - 0.115;
  rotor.add(sticker);
  const bladeMat = mat(0x3a3d45, { rough: 0.5 });
  for (let i = 0; i < 22; i++) {
    const arm = new THREE.Group();
    const blade = box(0.42, COOL.finH - 0.16, 0.035, bladeMat, { outline: false });
    blade.position.set(0.62, (COOL.finH - 0.16) / 2, 0);
    blade.rotation.y = 0.5;
    arm.add(blade);
    arm.rotation.y = (i * Math.PI * 2) / 22;
    rotor.add(arm);
  }
  g.add(rotor);
  // spring-loaded push pins at two corners
  for (const [sx, sz] of [[-1, -1], [1, 1]]) {
    g.add(at(cyl(0.12, 0.12, 0.12, mat(0x2a2c33), { seg: 12 }), sx * (COOL.w / 2 - 0.15), COOL.base + 0.06, sz * (COOL.d / 2 - 0.15)));
  }
  return { group: g, rotor };
}

function cable(points, color, r = 0.032) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, r, 8, false), mat(color, { rough: 0.5 }));
  m.castShadow = true;
  return m;
}

export function makeRPi5() {
  const g = new THREE.Group();
  g.name = 'board-rpi5';
  makePCB(g, { w: W, d: D, color: 0x23784a, radius: 0.3, holes: HOLES, baseT: BASE_T, thick: PCB_T });
  makeSilk(g, W, D, TOP, silkscreen, 3072);

  const on = (obj, x, z, rotY = 0, y = 0) => {
    obj.position.set(x, obj.position.y + TOP + y, z);
    obj.rotation.y = rotY;
    g.add(obj);
    return obj;
  };

  // ---- SoC, RAM and PMIC (under the cooler), RP1 and friends
  on(chipIC({ w: 1.6, h: 0.12, dot: false, lines: [{ t: 'BCM2712', size: 0.16, y: 0.45 }, { t: '2.4GHz', size: 0.1, y: 0.62 }], res: 256 }), -1.6, 0.25);
  on(chipIC({ w: 1.4, d: 1.0, h: 0.1, dot: false, lines: [{ t: 'LPDDR4X', size: 0.18, y: 0.5 }] }), 0.0, -0.4);
  on(chipIC({ w: 0.95, h: 0.09, legsX: 12, legsZ: 12, legLen: 0.035, legW: 0.022, pads: true, lines: [{ t: 'RP1', size: 0.28, y: 0.46 }, { t: 'I/O · PCIe', size: 0.12, y: 0.7 }] }), ...RP1);
  on(chipIC({ w: 0.55, h: 0.08, legsX: 8, legsZ: 8, legLen: 0.03, pads: true, lines: [{ t: 'GbE', size: 0.24, y: 0.5 }] }), 1.95, 0.55);
  on(chipIC({ w: 0.6, d: 0.45, h: 0.08, dot: false, lines: [{ t: 'PMIC', size: 0.24, y: 0.55 }] }), -2.6, 1.72);
  on(crystal({ w: 0.25, d: 0.2, h: 0.07 }), 1.15, 0.6);
  g.add(passives([
    [1.05, -0.6, 0, 'c'], [1.05, -0.4, 0, 'c'], [2.55, 0.6, Math.PI / 2, 'c'], [2.55, -1.0, Math.PI / 2, 'r'], [1.4, -1.1, 0, 'r'], [1.6, -1.1, 0, 'c'],
    [-3.55, -1.15, 0, 'C'], [-3.55, 1.2, 0, 'c'], [-3.5, 2.05, Math.PI / 2, 'R'], [-1.0, 1.95, 0, 'r'], [0.45, 2.1, Math.PI / 2, 'c'], [0.65, 2.3, Math.PI / 2, 'r'],
    [2.2, 2.45, 0, 'c'], [1.4, 2.55, 0, 'r'], [-2.0, 2.55, 0, 'c'], [-3.0, -1.15, 0, 'r'], [2.6, -2.1, Math.PI / 2, 'c'],
  ], TOP));

  // ---- active cooler with blower fan + its cable to the 4-pin fan header
  const cooler = makeActiveCooler();
  cooler.group.position.set(COOL.x, TOP + COOL.lift, COOL.z);
  g.add(cooler.group);
  for (const [sx, sz] of [[-1, -1], [1, 1]]) on(cyl(0.07, 0.07, COOL.lift, mat(0xb9bcc1, { metal: 0.6, rough: 0.3 }), { seg: 10 }), COOL.x + sx * (COOL.w / 2 - 0.15), COOL.z + sz * (COOL.d / 2 - 0.15), 0, COOL.lift / 2);
  const coolTop = TOP + COOL.lift + COOL.base + COOL.finH;
  on(jstSH(4), FAN_CONN[0], FAN_CONN[1], Math.PI / 2);
  const fy = TOP + COOL.lift + COOL.base + 0.35;
  const route = (dz) => [
    new THREE.Vector3(COOL.x + COOL.w / 2, fy, -0.6 + dz),
    new THREE.Vector3(COOL.x + COOL.w / 2 + 0.35, fy - 0.05, -0.9 + dz),
    new THREE.Vector3(1.6, TOP + 0.4, -1.5 + dz),
    new THREE.Vector3(FAN_CONN[0] - 0.05 + dz * 2, TOP + 0.3, FAN_CONN[1] + 0.12),
  ];
  g.add(cable(route(-0.035), 0xd8443a), cable(route(0.035), 0x2a2c33));
  on(smallMaleHeader(2, 2), 2.08, -1.2);

  // ---- right edge: USB 2.0 pair, USB 3.0 pair, Gigabit Ethernet (openings face +x)
  const ports = {};
  for (const [kind, z] of RPORTS) {
    let obj, d;
    if (kind === 'eth') [obj, d] = [rj45(), 2.1];
    else {
      obj = usbAStack();
      d = 1.75;
      if (kind === 'usb2') obj.traverse((o) => { if (o.material?.color?.getHex?.() === 0x2f6fd8) o.material = mat(0x24262c, { rough: 0.5 }); });
    }
    on(obj, RIGHT - d / 2, z, Math.PI);
    ports[kind] = obj;
  }
  // ---- front edge: USB-C power, 2 × micro-HDMI, UART, RTC battery connector
  on(usbC(), USBC_X, FRONT - 0.37, Math.PI / 2);
  for (const x of HDMI_X) on(hdmi({ w: 0.68, h: 0.33, d: 0.76 }), x, FRONT - 0.38, Math.PI / 2);
  on(jstSH(3), -1.0, 2.45);
  on(jstSH(2), -2.4, 2.45);
  // two MIPI CAM/DISP connectors and the PCIe FFC
  for (const m of MIPI) on(fpcConnector(), m.x, m.z);
  on(fpcConnector(1.15), -3.95, -0.4);
  // power button, PWR (red) and ACT (green) LEDs
  on(tactSwitch({ w: 0.42, d: 0.42, capColor: 0x1d1e23, capR: 0.13, h: 0.18 }), ...BTN);
  const pwr = smdLed(0xe5412e, { w: 0.14, d: 0.09, h: 0.07, glowSize: 0.8, glowColor: 0xff4433 });
  on(pwr.group, ...LEDS.pwr);
  pwr.set(0.85);
  const act = smdLed(0x3fbf5f, { w: 0.14, d: 0.09, h: 0.07, glowSize: 1.1, glowColor: 0x4cff7a });
  on(act.group, ...LEDS.act);

  // ---- 40-pin header
  on(headerBase(20, 2), GX, (ODD_Z + EVEN_Z) / 2);
  const pts = [];
  for (let n = 1; n <= 40; n++) pts.push(pinXY(n));
  g.add(pinField(pts, TOP));
  const tipY = TOP + MALE_TIP;
  const pinMap = {};
  for (let n = 1; n <= 40; n++) {
    const [x, z] = pinXY(n);
    pinMap[`PIN${n}`] = new THREE.Vector3(x, tipY, z);
  }
  const lookup = pinLookup('Pi 5-style', g, pinMap, ALIASES, (n) => {
    let m = /^(?:PIN|P|J8_?)(\d+)$/.exec(n);
    if (m) return `PIN${+m[1]}`;
    m = /^(?:BCM|GPIO|GP|IO|D)(\d+)$/.exec(n);
    return m ? ALIASES[`GPIO${+m[1]}`] ?? null : null;
  });

  const mipiTop = (m) => new THREE.Vector3(m.x + 0.06, TOP + 0.27, m.z);
  let fanSpeed = 0;
  return {
    id: 'rpi5',
    name: 'Raspberry Pi 5-style',
    group: g,
    pins: Object.keys(pinMap),
    /** BCM GPIO number of each physical pin (null for power / ground). */
    bcm: BCM.slice(),
    pin: lookup.pin,
    resolve: lookup.resolve,
    /** Green ACT LED brightness (the PWR LED stays red). */
    setBuiltinLed(level) { act.set(level); },
    setPowerLed(level) { pwr.set(level); },
    setFan(speed) { fanSpeed = Math.max(0, Math.min(1, speed)); },
    get fanSpeed() { return fanSpeed; },
    tick(dt) { cooler.rotor.rotation.y -= dt * fanSpeed * 42; },
    /** World position of the top of CAM/DISP 0 (where a ribbon goes in). */
    get csi() { return mipiTop(MIPI[0]).applyMatrix4(g.matrixWorld); },
    /** World position of the top of CAM/DISP 1. */
    get csi1() { return mipiTop(MIPI[1]).applyMatrix4(g.matrixWorld); },
    /** World direction of the connectors' long axis (ribbon width). */
    get csiAxis() { return new THREE.Vector3(0, 0, 1).transformDirection(g.matrixWorld); },
    anchors: {
      usb: new THREE.Vector3(RIGHT - 0.9, TOP + 1.6, -1.0),
      usb2: new THREE.Vector3(RIGHT - 0.9, TOP + 1.6, -1.9),
      usb3: new THREE.Vector3(RIGHT - 0.9, TOP + 1.6, -0.1),
      ethernet: new THREE.Vector3(RIGHT - 1.0, TOP + 1.4, 1.775),
      hdmi: new THREE.Vector3((HDMI_X[0] + HDMI_X[1]) / 2, TOP + 0.35, FRONT - 0.3),
      power: new THREE.Vector3(USBC_X, TOP + 0.35, FRONT - 0.3),
      usbc: new THREE.Vector3(USBC_X, TOP + 0.35, FRONT - 0.3),
      chip: new THREE.Vector3(COOL.x - 0.8, coolTop, COOL.z),
      soc: new THREE.Vector3(COOL.x - 0.8, coolTop, COOL.z),
      cooler: new THREE.Vector3(COOL.x - 0.8, coolTop, COOL.z),
      fan: new THREE.Vector3(FAN.x, coolTop, FAN.z),
      rp1: new THREE.Vector3(RP1[0], TOP + 0.12, RP1[1]),
      gpio: new THREE.Vector3(GX, tipY, (ODD_Z + EVEN_Z) / 2),
      pin1: pinMap.PIN1.clone(),
      csi: mipiTop(MIPI[0]),
      csi1: mipiTop(MIPI[1]),
      pcie: new THREE.Vector3(-3.95, TOP + 0.27, -0.4),
      led: new THREE.Vector3(LEDS.act[0], TOP + 0.1, LEDS.act[1]),
      button: new THREE.Vector3(BTN[0], TOP + 0.2, BTN[1]),
      sd: new THREE.Vector3(-4.2, TOP, 0.95),
      gnd: pinMap.PIN6.clone(),
    },
  };
}
