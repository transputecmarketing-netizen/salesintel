// A procedurally built Jetson Nano-style developer kit (10 × 8 cm carrier):
// compute module under a finned aluminium heatsink with an optional fan,
// I/O along the front edge (+z), a 40-pin Pi-compatible header along the
// back edge (-z) and a CSI camera connector on the left edge.
// Also exports a Pi Camera v2-style module and a flat ribbon cable.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, mesh, box, cyl, at, canvasTexture, roundedRectShape, slab } from '../kit.js';
import {
  PITCH, MALE_TIP, FONT, MONO, SILK, makePCB, makeSilk, text, drawTraces, pad, chipIC, passives, canCap, smdLed, headerBase, pinField, smallMaleHeader,
  microUSB, barrelJack, hdmi, usbAStack, rj45, pinLookup, texMat, UP,
} from './parts.js';

const W = 10, D = 8;
const TOP = 0.17;
const GX = 1.4; // 40-pin header centre (x)
const ODD_Z = -3.18, EVEN_Z = -3.434; // odd pins on the inner row, like a Raspberry Pi
const MOD = { x: -0.75, z: -0.25, w: 6.8, d: 4.3, lift: 0.5, t: 0.1 };
const HS = { w: 6.0, d: 3.8, base: 0.3, fins: 23, finT: 0.075, finH: 1.75 };
const FAN = { size: 4.0, h: 1.0 };
const CSI = { x: -4.45, z: -1.2, len: 2.1 };
const HOLES = [[-4.6, -3.6, 0.17], [4.6, -3.6, 0.17], [-4.6, 1.6, 0.17], [4.6, 1.6, 0.17]];
const LED_POS = [-3.57, 2.95];
// front-edge ports: [kind, x]; openings face +z, front faces flush at z = 4.1
const PORTS = [['jack', -4.5], ['microusb', -3.57], ['hdmi', -2.325], ['dp', -0.75], ['usb', 0.825], ['usb', 2.375], ['eth', 4.05]];
const FRONT = 4.1;

// short silkscreen names for the 40-pin header (index = pin number)
const JNAME = [null,
  '3V3', '5V', 'SDA', '5V', 'SCL', 'GND', 'GPIO', 'TXD', 'GND', 'RXD',
  'GPIO', 'I2S', 'SCK2', 'GND', 'GPIO', 'CS1', '3V3', 'CS0', 'MOSI', 'GND',
  'MISO', 'MISO2', 'SCLK', 'CE0', 'GND', 'CE1', 'ID_SD', 'ID_SC', 'GPIO', 'GND',
  'GPIO', 'PWM0', 'PWM2', 'GND', 'I2S', 'CTS', 'MOSI2', 'I2S', 'GND', 'I2S'];

const ALIASES = {
  '3V3': 'PIN1', '5V': 'PIN2', SDA: 'PIN3', '5V_2': 'PIN4', SCL: 'PIN5', GND: 'PIN6', GND_2: 'PIN9', GND_3: 'PIN14', GND_4: 'PIN20',
  GND_5: 'PIN25', GND_6: 'PIN30', GND_7: 'PIN34', GND_8: 'PIN39', TXD: 'PIN8', RXD: 'PIN10', PWM0: 'PIN32', PWM2: 'PIN33', '3V3_2': 'PIN17',
  TX: 'PIN8', RX: 'PIN10', MOSI: 'PIN19', MISO: 'PIN21', SCLK: 'PIN23', SCK: 'PIN23', CE0: 'PIN24', CE1: 'PIN26', ID_SD: 'PIN27', ID_SC: 'PIN28',
  '3.3V': 'PIN1',
};

const pinXY = (n) => {
  const col = Math.floor((n - 1) / 2);
  return [GX - 2.413 + col * PITCH, n % 2 ? ODD_Z : EVEN_Z];
};

function silkscreen(ctx, t) {
  const { px, pz, s } = t;
  const f = (cm) => cm * s;
  drawTraces(ctx, t, { rects: [[-4.9, -2.4, 4.9, 2.0], [2.7, -2.4, 4.9, 1.9], [-4.9, -2.3, -4.2, 1.3]], n: 70, seed: 3448, color: 'rgba(120,200,150,.22)', via: 'rgba(200,225,205,.45)', width: 0.05 });
  // 40-pin header labels: odd pins inside, even pins in the edge strip
  for (let n = 1; n <= 40; n++) {
    const [x, z] = pinXY(n);
    if (n % 2) text(ctx, `${JNAME[n]} ${n}`, px(x), pz(z + 0.2), { size: f(0.088), rot: -Math.PI / 2, align: 'right', maxW: f(0.5) });
    else text(ctx, `${n} ${JNAME[n]}`, px(x), pz(z - 0.2), { size: f(0.08), rot: -Math.PI / 2, align: 'left', maxW: f(0.34) });
  }
  // pin-1 marker
  const [x1] = pinXY(1);
  ctx.fillStyle = SILK;
  ctx.beginPath();
  ctx.moveTo(px(x1 - 0.2), pz(ODD_Z));
  ctx.lineTo(px(x1 - 0.36), pz(ODD_Z - 0.1));
  ctx.lineTo(px(x1 - 0.36), pz(ODD_Z + 0.1));
  ctx.closePath();
  ctx.fill();
  text(ctx, '1', px(x1 - 0.46), pz(ODD_Z), { size: f(0.12), weight: 700 });
  text(ctx, 'J41', px(x1 - 0.5), pz(EVEN_Z - 0.2), { size: f(0.11), weight: 700 });
  text(ctx, '40', px(pinXY(40)[0] + 0.32), pz(EVEN_Z), { size: f(0.1), weight: 700 });
  // title
  text(ctx, 'JETSON NANO-STYLE', px(-2.72), pz(-3.48), { size: f(0.27), weight: 700, maxW: f(2.5) });
  text(ctx, 'DEV KIT  ·  CIRCUIT LAB', px(-2.72), pz(-3.1), { size: f(0.14), maxW: f(2.5) });
  // CSI
  text(ctx, 'CAMERA (CSI)', px(CSI.x + 0.08), pz(CSI.z - CSI.len / 2 - 0.2), { size: f(0.11) });
  text(ctx, 'J13', px(CSI.x + 0.08), pz(CSI.z + CSI.len / 2 + 0.18), { size: f(0.11), weight: 700 });
  // port labels
  const lab = { jack: 'DC 5V', microusb: 'µUSB 5V', hdmi: 'HDMI', dp: 'DP', eth: 'LAN' };
  const depth = { jack: 1.4, microusb: 0.56, hdmi: 1.15, dp: 1.2, usb: 1.75, eth: 2.1 };
  for (const [k, x] of PORTS) if (lab[k] && k !== 'microusb') text(ctx, lab[k], px(x), pz(k === 'hdmi' || k === 'dp' ? 2.22 : FRONT - depth[k] - 0.16), { size: f(0.13), weight: 700 });
  text(ctx, 'µUSB 5V', px(-3.57), pz(3.38), { size: f(0.085), maxW: f(0.7) });
  text(ctx, 'USB 3.0', px(1.6), pz(FRONT - 1.75 - 0.15), { size: f(0.13), weight: 700 });
  text(ctx, 'PWR', px(LED_POS[0] + 0.28), pz(LED_POS[1]), { size: f(0.09), align: 'left' });
  text(ctx, 'J48', px(-4.35), pz(2.05), { size: f(0.09) });
  text(ctx, 'J40  BUTTONS', px(3.6), pz(-2.3), { size: f(0.09) });
  text(ctx, 'J15 FAN', px(3.4), pz(0.17), { size: f(0.09) });
  // module outline (visible around the module edges)
  ctx.strokeStyle = 'rgba(238,240,246,.6)';
  ctx.lineWidth = f(0.02);
  ctx.strokeRect(px(MOD.x - MOD.w / 2 - 0.08), pz(MOD.z - MOD.d / 2 - 0.08), f(MOD.w + 0.16), f(MOD.d + 0.4));
}

function moduleTexture() {
  const s = 150;
  return canvasTexture(Math.round(MOD.w * s), Math.round(MOD.d * s), (ctx, w, h) => {
    ctx.fillStyle = '#1b3326';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(120,200,150,.25)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 40; i++) {
      const y = (i / 40) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w * 0.05, y + 8);
      ctx.moveTo(w, y);
      ctx.lineTo(w * 0.95, y - 8);
      ctx.stroke();
    }
    ctx.fillStyle = '#d6b46a';
    for (let i = 0; i < 70; i++) ctx.fillRect(w * 0.04 + i * (w * 0.92 / 70), h - 0.12 * s, w * 0.006, 0.1 * s);
    ctx.fillStyle = SILK;
    ctx.font = `600 ${0.13 * s}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(w - 0.2 * s, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('COMPUTE MODULE · 4GB', 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(0.2 * s, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('260-PIN SO-DIMM', 0, 0);
    ctx.restore();
  });
}

function makeHeatsink() {
  const g = new THREE.Group();
  const alu = mat(0xc9cdd1, { metal: 0.5, rough: 0.38 });
  g.add(at(box(HS.w, HS.base, HS.d, alu), 0, HS.base / 2, 0));
  const fins = [];
  const step = (HS.w - HS.finT) / (HS.fins - 1);
  for (let i = 0; i < HS.fins; i++) {
    const fg = new THREE.BoxGeometry(HS.finT, HS.finH, HS.d);
    fg.translate(-HS.w / 2 + HS.finT / 2 + i * step, HS.base + HS.finH / 2, 0);
    fins.push(fg);
  }
  g.add(mesh(mergeGeometries(fins), alu));
  // screws / springs at the corners of the base
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(at(cyl(0.12, 0.12, 0.08, mat(0x8a8d93, { metal: 0.6, rough: 0.3 }), { seg: 12 }), sx * (HS.w / 2 - 0.12), HS.base + 0.04, sz * (HS.d / 2 - 0.25)));
  return g;
}

function makeFan() {
  const g = new THREE.Group();
  const black = mat(0x24262c, { rough: 0.6 });
  const sh = roundedRectShape(FAN.size, FAN.size, 0.3);
  const hole = new THREE.Path();
  hole.absarc(0, 0, FAN.size * 0.465, 0, Math.PI * 2, true);
  sh.holes.push(hole);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const h = new THREE.Path();
    h.absarc(sx * 1.62, sz * 1.62, 0.11, 0, Math.PI * 2, true);
    sh.holes.push(h);
  }
  g.add(slab(sh, FAN.h, black));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(at(cyl(0.16, 0.16, 0.06, mat(0xb9bcc1, { metal: 0.6, rough: 0.3 }), { seg: 14 }), sx * 1.62, FAN.h + 0.03, sz * 1.62));
  // struts holding the motor
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const st = box(1.3, 0.1, 0.1, black, { outline: false });
    st.position.set(Math.cos(a) * 1.25, 0.05, Math.sin(a) * 1.25);
    st.rotation.y = -a;
    g.add(st);
  }
  const rotor = new THREE.Group();
  rotor.add(at(cyl(0.72, 0.72, 0.78, mat(0x2b2d34, { rough: 0.5 }), { seg: 32 }), 0, 0.47, 0));
  const sticker = new THREE.Mesh(
    new THREE.CircleGeometry(0.6, 40),
    texMat(canvasTexture(256, 256, (ctx) => {
      ctx.fillStyle = '#e9e5da';
      ctx.beginPath();
      ctx.arc(128, 128, 126, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1d2440';
      ctx.textAlign = 'center';
      ctx.font = `700 34px ${FONT}`;
      ctx.fillText('CIRCUIT LAB', 128, 118);
      ctx.font = `500 26px ${MONO}`;
      ctx.fillText('DC 5V 0.2A', 128, 158);
    }), { rough: 0.6 }),
  );
  sticker.rotation.x = -Math.PI / 2;
  sticker.position.y = 0.865;
  rotor.add(sticker);
  const bladeMat = mat(0x30333a, { rough: 0.5 });
  for (let i = 0; i < 7; i++) {
    const arm = new THREE.Group();
    const blade = box(1.12, 0.05, 0.62, bladeMat);
    blade.position.set(1.3, 0.48, 0);
    blade.rotation.x = 0.55;
    blade.rotation.y = 0.18;
    arm.add(blade);
    arm.rotation.y = (i * Math.PI * 2) / 7;
    rotor.add(arm);
  }
  g.add(rotor);
  return { group: g, rotor };
}

function cable(points, color, r = 0.035) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, r, 8, false), mat(color, { rough: 0.5 }));
  m.castShadow = true;
  return m;
}

function csiConnector() {
  const g = new THREE.Group();
  g.add(at(box(0.55, 0.42, CSI.len, mat(0xe8dfc6, { rough: 0.6 })), 0, 0.21, 0));
  g.add(at(box(0.18, 0.1, CSI.len * 0.96, mat(0x5a3b26, { rough: 0.5 })), -0.17, 0.47, 0));
  g.add(at(box(0.07, 0.012, CSI.len * 0.82, mat(0x15161a), { outline: false }), 0.06, 0.426, 0));
  for (const s of [-1, 1]) g.add(at(box(0.3, 0.05, 0.14, mat(0xcfccc2, { metal: 0.5, rough: 0.35 }), { outline: false }), 0, 0.025, s * (CSI.len / 2 + 0.07)));
  return g;
}

export function makeJetson(opts = {}) {
  const withFan = opts.fan !== false;
  const g = new THREE.Group();
  g.name = 'board-jetson';
  makePCB(g, { w: W, d: D, color: 0x1e3b2d, radius: 0.25, holes: HOLES });
  makeSilk(g, W, D, TOP, silkscreen, 3072);

  const on = (obj, x, z, rotY = 0, y = 0) => {
    obj.position.set(x, obj.position.y + TOP + y, z);
    obj.rotation.y = rotY;
    g.add(obj);
    return obj;
  };

  // ---- module + heatsink + fan
  const modY = MOD.lift;
  for (const sx of [-1, 1]) on(cyl(0.12, 0.12, modY, mat(0xc9c6bd, { metal: 0.55, rough: 0.35 }), { seg: 12 }), MOD.x + sx * (MOD.w / 2 - 0.3), MOD.z - MOD.d / 2 + 0.3, 0, modY / 2);
  const sodimm = new THREE.Group();
  sodimm.add(at(box(MOD.w + 0.1, 0.6, 0.5, mat(0x1f2126, { rough: 0.7 })), 0, 0.3, 0));
  for (const s of [-1, 1]) sodimm.add(at(box(0.18, 0.62, 0.55, mat(0xcfccc2, { metal: 0.55, rough: 0.35 })), s * (MOD.w / 2 + 0.12), 0.31, 0));
  on(sodimm, MOD.x, MOD.z + MOD.d / 2 - 0.15);
  const modSide = mat(0x1b3326, { rough: 0.6 });
  const modPcb = mesh(new THREE.BoxGeometry(MOD.w, MOD.t, MOD.d), [modSide, modSide, texMat(moduleTexture(), { rough: 0.55 }), modSide, modSide, modSide]);
  on(modPcb, MOD.x, MOD.z, 0, modY + MOD.t / 2);
  const modTop = TOP + modY + MOD.t;
  // a few parts visible around the heatsink
  for (const [x, z] of [[-4.0, -1.2], [-4.0, -0.4], [-4.0, 0.4], [2.48, -1.6], [2.48, 0.9]]) {
    const c = chipIC({ w: 0.24, d: 0.5, h: 0.06, dot: false, res: 64 });
    c.position.set(x, modTop, z);
    g.add(c);
  }
  const hs = makeHeatsink();
  hs.position.set(MOD.x, modTop, MOD.z);
  g.add(hs);
  const finTop = modTop + HS.base + HS.finH;
  let fan = null;
  if (withFan) {
    fan = makeFan();
    fan.group.position.set(MOD.x, finTop, MOD.z);
    g.add(fan.group);
    const fy = finTop + FAN.h * 0.45;
    const route = (dz) => [
      new THREE.Vector3(MOD.x + FAN.size / 2, fy, MOD.z + 1.4 + dz),
      new THREE.Vector3(MOD.x + FAN.size / 2 + 0.5, fy - 0.1, MOD.z + 1.45 + dz),
      new THREE.Vector3(MOD.x + HS.w / 2 + 0.35, finTop - 0.5, MOD.z + 1.25 + dz),
      new THREE.Vector3(3.0, TOP + 0.75, 0.75 + dz),
      new THREE.Vector3(3.25 + dz * 2, TOP + 0.32, 0.5),
    ];
    g.add(cable(route(-0.04), 0xd8443a), cable(route(0.04), 0x2a2c33));
  }

  // ---- front I/O
  const ports = {};
  for (const [kind, x] of PORTS) {
    let obj, d;
    if (kind === 'jack') [obj, d] = [barrelJack({ w: 0.9, h: 1.1, d: 1.4 }), 1.4];
    else if (kind === 'microusb') [obj, d] = [microUSB(), 0.56];
    else if (kind === 'hdmi') [obj, d] = [hdmi({ w: 1.45, h: 0.62, d: 1.15 }), 1.15];
    else if (kind === 'dp') [obj, d] = [hdmi({ w: 1.5, h: 0.56, d: 1.2, dp: true }), 1.2];
    else if (kind === 'usb') [obj, d] = [usbAStack(), 1.75];
    else [obj, d] = [rj45(), 2.1];
    on(obj, x, FRONT - d / 2, Math.PI / 2);
    (ports[kind] ??= []).push(obj);
  }
  // power LED (the "built-in" LED of this board)
  const led = smdLed(0x52d27a, { w: 0.18, d: 0.12, h: 0.08, glowSize: 1.3, glowColor: 0x5dff86 });
  on(led.group, ...LED_POS);
  led.set(1);
  // J48 power-select jumper
  const j48 = smallMaleHeader(2, 1);
  j48.add(at(box(0.56, 0.6, 0.3, mat(0x1f2126, { rough: 0.6 })), 0, 0.55, 0));
  on(j48, -4.35, 2.3);
  // J40 button header, fan connector, hub / PHY chips, caps
  on(smallMaleHeader(4, 2), 3.6, -1.9);
  const j15 = new THREE.Group();
  j15.add(at(box(0.95, 0.5, 0.42, mat(0xf0ead8, { rough: 0.6 })), 0, 0.25, 0));
  for (let i = 0; i < 4; i++) j15.add(at(box(0.12, 0.01, 0.12, mat(0x15161a), { outline: false }), -0.375 + i * 0.25, 0.505, 0.04));
  on(j15, 3.4, 0.5);
  on(chipIC({ w: 0.6, h: 0.08, legsX: 9, legsZ: 9, legLen: 0.04, pads: true, lines: [{ t: 'USB HUB', size: 0.16, y: 0.45 }, { t: '3.0', size: 0.14, y: 0.66 }] }), 3.55, -0.85);
  on(chipIC({ w: 0.6, h: 0.08, legsX: 9, legsZ: 9, legLen: 0.04, pads: true, lines: [{ t: 'GbE PHY', size: 0.16, y: 0.45 }, { t: 'RGMII', size: 0.13, y: 0.66 }] }), 4.2, 1.15);
  on(chipIC({ w: 0.7, d: 0.5, h: 0.1, legsX: 6, legLen: 0.08, lines: [{ t: 'PMIC', size: 0.2, y: 0.55 }] }), -4.1, 0.85, Math.PI / 2);
  for (const [x, z] of [[4.4, -1.9], [4.4, -1.25], [2.95, 1.35]]) on(canCap(0.24, 0.42), x, z);
  const ind = box(0.45, 0.25, 0.45, mat(0x55585e, { rough: 0.7 }));
  on(at(ind, 0, 0.125, 0), 4.3, -0.4);
  g.add(passives([
    [3.0, -0.6, 0, 'r'], [3.0, -0.4, 0, 'r'], [3.0, -1.1, 0, 'c'], [3.9, -0.4, Math.PI / 2, 'C'], [3.75, 1.65, 0, 'c'], [4.65, 1.15, Math.PI / 2, 'c'],
    [-3.5, 2.55, 0, 'r'], [-2.9, 2.6, 0, 'c'], [-1.6, 2.65, 0, 'c'], [-0.1, 2.5, 0, 'r'], [3.0, 2.0, Math.PI / 2, 'C'], [-4.75, -0.6, Math.PI / 2, 'C'],
    [-3.8, -2.7, 0, 'c'], [-3.5, -2.7, 0, 'c'], [2.9, 0.1, 0, 'r'], [4.7, 0.3, Math.PI / 2, 'r'], [-4.75, 0.2, Math.PI / 2, 'c'],
  ], TOP));

  // ---- CSI connector
  on(csiConnector(), CSI.x, CSI.z);

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
  const lookup = pinLookup('Jetson Nano-style', g, pinMap, ALIASES, (n) => {
    const m = /^(?:PIN|P|J41_?)?(\d+)$/.exec(n);
    return m ? `PIN${+m[1]}` : null;
  });

  const csiLocal = new THREE.Vector3(CSI.x + 0.06, TOP + 0.43, CSI.z);
  const portTop = (x, h) => new THREE.Vector3(x, TOP + h, FRONT - 0.5);
  let fanSpeed = 0;
  return {
    id: 'jetson',
    name: 'Jetson Nano-style Dev Kit',
    group: g,
    pins: Object.keys(pinMap),
    pin: lookup.pin,
    resolve: lookup.resolve,
    /** Power LED brightness (this board's only user-visible LED). */
    setBuiltinLed(level) { led.set(level); },
    setFan(speed) { fanSpeed = Math.max(0, Math.min(1, speed)); },
    get fanSpeed() { return fanSpeed; },
    tick(dt) { if (fan) fan.rotor.rotation.y -= dt * fanSpeed * 38; },
    /** World position of the top of the CSI slot (where the ribbon goes in). */
    get csi() { return csiLocal.clone().applyMatrix4(g.matrixWorld); },
    /** World direction of the CSI slot's long axis (ribbon width). */
    get csiAxis() { return new THREE.Vector3(0, 0, 1).transformDirection(g.matrixWorld); },
    anchors: {
      usb: portTop(1.6, 1.6),
      ethernet: portTop(4.05, 1.4),
      hdmi: portTop(-2.325, 0.66),
      dp: portTop(-0.75, 0.6),
      power: new THREE.Vector3(-4.5, TOP + 1.15, 3.4),
      microusb: portTop(-3.57, 0.3),
      chip: new THREE.Vector3(MOD.x, finTop + (withFan ? FAN.h : 0), MOD.z),
      module: new THREE.Vector3(MOD.x + MOD.w / 2 - 0.2, modTop, MOD.z),
      heatsink: new THREE.Vector3(MOD.x + HS.w / 2 - 0.4, finTop, MOD.z + HS.d / 2 - 0.4),
      fan: new THREE.Vector3(MOD.x, finTop + FAN.h, MOD.z),
      gpio: new THREE.Vector3(GX, tipY, (ODD_Z + EVEN_Z) / 2),
      pin1: pinMap.PIN1.clone(),
      csi: csiLocal.clone(),
      led: new THREE.Vector3(LED_POS[0], TOP + 0.12, LED_POS[1]),
      buttons: new THREE.Vector3(3.6, TOP + MALE_TIP, -1.9),
      jumper: new THREE.Vector3(-4.35, TOP + 0.85, 2.3),
      gnd: pinMap.PIN6.clone(),
    },
  };
}

// ---------------------------------------------------------------- camera module
/**
 * Raspberry Pi Camera v2-style module on a small stand, facing +z (turn it
 * with opts.yaw, radians). pos = world position of the stand's base centre.
 */
export function makeCSICamera(pos = new THREE.Vector3(), opts = {}) {
  const g = new THREE.Group();
  g.position.copy(pos);
  g.rotation.y = opts.yaw ?? 0;
  const B = 0.75; // PCB bottom edge height
  const PW = 2.5, PH = 2.4, PT = 0.1;
  const lensY = B + 1.45;
  const stand = mat(0x2b2e36, { rough: 0.55 });
  // A-frame stand: two feet + posts behind the PCB, open in the middle so the
  // ribbon can drop from the bottom connector and run out the back.
  const postH = B + PH - 0.19;
  for (const sx of [-1, 1]) {
    g.add(at(box(0.32, 0.14, 2.3, stand), sx * 1.15, 0.07, -0.75));
    g.add(at(box(0.3, postH, 0.14, stand), sx * 1.05, 0.14 + postH / 2, -0.22));
    const gus = new THREE.Shape();
    gus.moveTo(0, 0);
    gus.lineTo(1.35, 0);
    gus.lineTo(0, 1.45);
    gus.closePath();
    const gm = mesh(new THREE.ExtrudeGeometry(gus, { depth: 0.1, bevelEnabled: false }), stand);
    gm.rotation.y = Math.PI / 2;
    gm.position.set(sx * 1.15 - 0.05, 0.14, -0.29);
    g.add(gm);
  }
  g.add(at(box(2.4, 0.28, 0.14, stand), 0, B + PH - 0.35, -0.22));
  g.add(at(box(2.4, 0.22, 0.14, stand), 0, B + 1.0, -0.22));
  // PCB with printed front
  const pcbTex = canvasTexture(500, 480, (ctx, w, h) => {
    const s = w / PW;
    ctx.fillStyle = '#1f7a44';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(150,230,170,.3)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.moveTo(30 + i * 50, h - 70);
      ctx.lineTo(60 + i * 40, h - 150 - (i % 3) * 30);
      ctx.lineTo(60 + i * 40, 80);
      ctx.stroke();
    }
    for (const [x, y] of [[-1.05, 0.2], [1.05, 0.2], [-1.05, 1.45], [1.05, 1.45]]) {
      const cx = (x + PW / 2) * s, cy = y * s;
      ctx.fillStyle = '#d6b46a';
      ctx.beginPath();
      ctx.arc(cx, cy, 0.17 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#121316';
      ctx.beginPath();
      ctx.arc(cx, cy, 0.1 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = SILK;
    ctx.textAlign = 'left';
    ctx.font = `700 ${0.15 * s}px ${FONT}`;
    ctx.fillText('CAMERA V2-STYLE', 0.12 * s, 1.85 * s);
    ctx.font = `600 ${0.11 * s}px ${FONT}`;
    ctx.fillText('8MP · MIPI CSI-2', 0.12 * s, 2.02 * s);
    ctx.textAlign = 'right';
    ctx.fillText('CIRCUIT LAB', w - 0.12 * s, 1.85 * s);
  });
  const green = mat(0x1f7a44, { rough: 0.55 });
  const pcb = mesh(new THREE.BoxGeometry(PW, PH, PT), [green, green, green, green, texMat(pcbTex, { rough: 0.55 }), green]);
  pcb.position.set(0, B + PH / 2, 0);
  g.add(pcb);
  for (const [x, y] of [[-1.05, 0.2], [1.05, 0.2], [-1.05, 1.45], [1.05, 1.45]]) {
    const so = cyl(0.09, 0.09, 0.15, mat(0xd8d4c8, { metal: 0.5, rough: 0.35 }), { seg: 10, outline: false });
    so.rotation.x = Math.PI / 2;
    so.position.set(x, B + PH - y, -0.12);
    g.add(so);
  }
  // lens housing + lens
  const front = PT / 2;
  g.add(at(box(0.85, 0.85, 0.32, mat(0x1b1c20, { rough: 0.6 })), 0, lensY, front + 0.16));
  const barrel = cyl(0.3, 0.32, 0.16, mat(0x232429, { rough: 0.45 }), { seg: 32 });
  barrel.rotation.x = Math.PI / 2;
  g.add(at(barrel, 0, lensY, front + 0.4));
  const glass = cyl(0.2, 0.2, 0.02, mat(0x101a2e, { rough: 0.08, metal: 0.4 }), { seg: 32, outline: false });
  glass.rotation.x = Math.PI / 2;
  g.add(at(glass, 0, lensY, front + 0.485));
  const glint = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), new THREE.MeshBasicMaterial({ color: 0xbfd4ff, transparent: true, opacity: 0.7 }));
  g.add(at(glint, -0.07, lensY + 0.08, front + 0.497));
  // sensor flex + small connector, a few SMD parts
  g.add(at(box(0.32, 0.5, 0.015, mat(0xc98a3a, { rough: 0.5 }), { outline: false }), 0.5, lensY - 0.55, front + 0.01));
  g.add(at(box(0.5, 0.2, 0.12, mat(0x1b1c20)), 0.55, B + 0.62, front + 0.06));
  for (const [x, y] of [[-0.8, 0.95], [-0.62, 0.95], [-0.8, 1.15], [0.85, 1.6], [0.85, 1.8], [-0.85, 1.65]]) g.add(at(box(0.12, 0.07, 0.05, mat(0xb9915d), { outline: false }), x, B + y, front + 0.025));
  // FFC connector on the bottom edge
  g.add(at(box(2.0, 0.3, 0.28, mat(0x1b1c20, { rough: 0.6 })), 0, B + 0.15, front + 0.14));
  g.add(at(box(1.9, 0.06, 0.1, mat(0x5a3b26, { rough: 0.5 }), { outline: false }), 0, B + 0.31, front + 0.2));

  g.updateMatrixWorld(true);
  const w = (x, y, z) => g.localToWorld(new THREE.Vector3(x, y, z));
  const dirW = (x, y, z) => new THREE.Vector3(x, y, z).transformDirection(g.matrixWorld);
  return {
    group: g,
    pick: g,
    anchor: w(0, B + PH + 0.5, 0),
    lensWorld: w(0, lensY, front + 0.49),
    lookDir: dirW(0, 0, 1),
    /** Where the ribbon leaves the camera, its direction and width axis. */
    ribbonEnd: w(0, B + 0.02, front + 0.14),
    ribbonDir: dirW(0, -1, 0),
    ribbonAxis: dirW(1, 0, 0),
    ribbonBend: dirW(0, 0, -1),
  };
}

// ---------------------------------------------------------------- ribbon cable
let ribbonTex;
/**
 * Flat flexible ribbon cable between world points a and b, sagging between
 * them. opts: dirA / dirB (direction the cable leaves each end, default up),
 * axisA / axisB (width direction at each end; the cable twists smoothly in
 * between), bendA / bendB (horizontal direction it bends towards after
 * leaving each end), liftA / liftB, reachA / reachB, sag, floor.
 */
export function makeRibbon(a, b, width = 1.6, opts = {}) {
  const g = new THREE.Group();
  const dirA = (opts.dirA ?? UP).clone().normalize();
  const dirB = (opts.dirB ?? UP).clone().normalize();
  const flat = new THREE.Vector3().subVectors(b, a).setY(0);
  const dist = flat.length();
  const toB = dist > 1e-4 ? flat.clone().normalize() : new THREE.Vector3(1, 0, 0);
  const side = new THREE.Vector3(-toB.z, 0, toB.x);
  const axisA = (opts.axisA ?? side).clone().normalize();
  const axisB = (opts.axisB ?? side).clone().normalize();
  // a flat cable bends about its width axis: find that bend direction at each end
  const bendDir = (axis, dir, toward, override) => {
    if (override) return override.clone().normalize();
    const n = new THREE.Vector3().crossVectors(axis, dir).setY(0);
    if (n.lengthSq() < 1e-6) return toward.clone();
    n.normalize();
    return n.dot(toward) < 0 ? n.negate() : n;
  };
  const bA = bendDir(axisA, dirA, toB, opts.bendA);
  const bB = bendDir(axisB, dirB, toB.clone().negate(), opts.bendB);
  const floor = opts.floor ?? 0.05;
  const clampY = (v) => ((v.y = Math.max(v.y, floor)), v);
  // each end: leave along dir, bend towards bend; if that bend points away
  // from the other end, add a vertical riser so the cable can turn on edge
  const endPts = (p, dir, bend, lift, reach, rise, toOther) => {
    const p1 = clampY(p.clone().addScaledVector(dir, lift));
    const h = rise ?? (bend.dot(toOther) < 0.5 ? 1.7 : 0);
    if (h <= 0) return [p1, clampY(p1.clone().addScaledVector(dir, 0.25).addScaledVector(bend, reach))];
    // tight U-turn, then a straight vertical riser where the cable can twist
    const p2 = clampY(p1.clone().addScaledVector(dir, 0.3).addScaledVector(bend, 0.3));
    const q0 = p2.clone().addScaledVector(bend, Math.max(0.3, reach));
    q0.y = Math.max(p1.y, floor + 0.3);
    return [p1, p2, q0, q0.clone().add(new THREE.Vector3(0, h, 0))];
  };
  const endA = endPts(a, dirA, bA, opts.liftA ?? 0.55, opts.reachA ?? (opts.riseA ? 1.2 : 0.7), opts.riseA, toB);
  const endB = endPts(b, dirB, bB, opts.liftB ?? 0.45, opts.reachB ?? 1.2, opts.riseB, toB.clone().negate());
  // the cable must keep its end orientation up to these points (bends at the ends)
  const fixA = endA[Math.min(2, endA.length - 1)], fixB = endB[Math.min(2, endB.length - 1)];
  const pts = [a.clone().addScaledVector(dirA, -0.2), a.clone(), ...endA];
  const lastA = endA[endA.length - 1], lastB = endB[endB.length - 1];
  if (lastA.distanceTo(lastB) > 1.2) {
    const mid = lastA.clone().lerp(lastB, 0.5);
    mid.y = Math.max(floor, mid.y - (opts.sag ?? Math.min(0.8, dist * 0.1)));
    pts.push(mid);
  }
  pts.push(...endB.reverse(), b.clone(), b.clone().addScaledVector(dirB, -0.2));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const len = curve.getLength();
  // parallel-transport the width axis along the curve, then spread the
  // remaining twist (to reach axisB) over the middle of the cable
  const N = 240;
  const frames = [];
  const w = axisA.clone();
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const t = curve.getTangentAt(u);
    w.addScaledVector(t, -w.dot(t));
    if (w.lengthSq() < 1e-8) w.copy(Math.abs(t.y) < 0.9 ? UP : new THREE.Vector3(1, 0, 0)).cross(t);
    w.normalize();
    frames.push({ u, p: curve.getPointAt(u), t, w: w.clone() });
  }
  const last = frames[N];
  const target = axisB.clone().addScaledVector(last.t, -axisB.dot(last.t)).normalize();
  let phi = Math.atan2(new THREE.Vector3().crossVectors(last.w, target).dot(last.t), last.w.dot(target));
  if (phi > Math.PI / 2) phi -= Math.PI;
  else if (phi < -Math.PI / 2) phi += Math.PI;
  // spend the twist where the cable is straight (and preferably vertical),
  // so bends always happen about the width axis like a real flat cable
  const nearest = (v) => frames.reduce((best, f, i) => (f.p.distanceToSquared(v) < frames[best].p.distanceToSquared(v) ? i : best), 0);
  const i0 = nearest(fixA), i1 = Math.max(i0 + 1, nearest(fixB));
  let wt = frames.map((f, i) => {
    if (i <= i0 || i > i1) return 0;
    const t0 = frames[Math.max(0, i - 2)].t, t1 = frames[Math.min(N, i + 2)].t;
    const straight = Math.max(0, 1 - t0.angleTo(t1) / 0.06);
    return straight * (0.01 + Math.abs(f.t.y) ** 8);
  });
  if (wt.reduce((x, y) => x + y, 0) < 1e-6) wt = frames.map((f, i) => (i > i0 && i <= i1 ? 1 : 0));
  const total = wt.reduce((x, y) => x + y, 0) || 1;
  let acc = 0;
  frames.forEach((f, i) => {
    acc += wt[i];
    f.w.applyAxisAngle(f.t, (phi * acc) / total);
    f.n = new THREE.Vector3().crossVectors(f.t, f.w).normalize();
  });
  const strip = (u0, u1, off, wScale) => {
    const pos = [], uv = [], idx = [];
    const sel = frames.filter((f) => f.u >= u0 - 1e-6 && f.u <= u1 + 1e-6);
    sel.forEach((f, i) => {
      for (const s of [-1, 1]) {
        const v = f.p.clone().addScaledVector(f.w, (s * width * wScale) / 2).addScaledVector(f.n, off);
        pos.push(v.x, v.y, v.z);
        uv.push(f.u * len, s > 0 ? 1 : 0);
      }
      if (i) {
        const q = i * 2;
        idx.push(q - 2, q - 1, q, q - 1, q + 1, q);
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  };
  ribbonTex ??= canvasTexture(16, 256, (ctx, w, h) => {
    ctx.fillStyle = '#efe8d6';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(150,135,100,.35)';
    for (let i = 0; i < 15; i++) ctx.fillRect(0, ((i + 0.5) / 15) * h - 2, w, 4);
  }, { repeat: [1, 1] });
  const body = mesh(strip(0, 1, 0, 1), texMat(ribbonTex, { rough: 0.7, side: THREE.DoubleSide }), { edgeAngle: 50 });
  g.add(body);
  const st = Math.min(0.45, 0.6 / len + 0.25 / len);
  const blue = mat(0x2f6fd8, { rough: 0.5, side: THREE.DoubleSide });
  for (const [u0, u1] of [[0, st], [1 - st, 1]]) for (const off of [-0.012, 0.012]) g.add(mesh(strip(u0, u1, off, 1.0), blue, { outline: false }));
  return { group: g, curve };
}
