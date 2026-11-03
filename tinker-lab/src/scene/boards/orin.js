// A procedurally built Jetson Orin Nano-style developer kit (10 × 7.9 cm
// carrier on short feet): the Orin Nano-style module in its SO-DIMM slot
// under a large finned heatsink with a fan, I/O along the front edge (+z:
// DC jack, DisplayPort, 4 × USB-A, USB-C, Gigabit Ethernet), the 40-pin
// header along the back edge (-z, same numbering and aliases as the
// Jetson Nano-style board), two 22-pin MIPI CSI-2 camera connectors on the
// left edge, and M.2 slots on the underside (Key M NVMe SSD, Key E Wi-Fi).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, mesh, box, cyl, at, canvasTexture, roundedRectShape, slab } from '../kit.js';
import {
  PITCH, MALE_TIP, FONT, MONO, SILK, makePCB, makeSilk, text, drawTraces, chipIC, passives, canCap, smdLed, headerBase, pinField, smallMaleHeader,
  barrelJack, hdmi, usbAStack, rj45, pinLookup, texMat, shellMetal,
} from './parts.js';

const W = 10, D = 7.9;
const FEET = 0.6; // carrier stands on feet so the M.2 cards underneath have room
const TOP = 0.17; // PCB top, local to the carrier group
const GX = 1.3; // 40-pin header centre (x)
const ODD_Z = -3.18, EVEN_Z = -3.434;
const MOD = { x: -0.6, z: -0.2, w: 6.96, d: 4.5, lift: 0.5, t: 0.1 };
const HS = { w: 6.6, d: 4.1, base: 0.32, fins: 29, finT: 0.07, finH: 1.55 };
const FAN = { size: 4.2, h: 0.9 };
const CSI = [{ x: -4.55, z: -1.5, name: 'CAM0' }, { x: -4.55, z: 0.55, name: 'CAM1' }];
const CSI_LEN = 1.4;
const HOLES = [[-4.6, -3.55, 0.17], [4.6, -3.55, 0.17], [-4.6, 1.6, 0.17], [4.6, 1.6, 0.17]];
const LED_POS = [-3.72, 2.32];
const FRONT = 3.95;
// front-edge ports: [kind, x]; openings face +z
const PORTS = [['jack', -4.35], ['dp', -2.85], ['usb', -1.15], ['usb', 0.45], ['usbc', 1.75], ['eth', 3.75]];
const J14 = [4.4, -1.6];
const FAN_CONN = [3.55, -0.75];
const SSD = { x: 0.4, z: 0.4, len: 8.0, w: 2.2 };
const WIFI = { x: -2.5, z: -2.4, len: 3.0, w: 2.2 };

// short silkscreen names for the 40-pin header (index = pin number)
const JNAME = [null,
  '3V3', '5V', 'SDA', '5V', 'SCL', 'GND', 'GPIO', 'TXD', 'GND', 'RXD',
  'GPIO', 'I2S', 'SCK1', 'GND', 'GPIO', 'CS1', '3V3', 'CS0', 'MOSI', 'GND',
  'MISO', 'MISO1', 'SCLK', 'CE0', 'GND', 'CE1', 'ID_SD', 'ID_SC', 'GPIO', 'GND',
  'GPIO', 'PWM0', 'PWM2', 'GND', 'I2S', 'CTS', 'MOSI1', 'I2S', 'GND', 'I2S'];

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
  drawTraces(ctx, t, { rects: [[-4.9, -2.6, 4.9, 2.2], [2.9, -2.6, 4.9, 2.0], [-4.9, -2.5, -4.2, 1.4]], n: 80, seed: 3767, color: 'rgba(150,170,190,.2)', via: 'rgba(200,210,225,.45)', width: 0.05 });
  for (let n = 1; n <= 40; n++) {
    const [x, z] = pinXY(n);
    if (n % 2) text(ctx, `${JNAME[n]} ${n}`, px(x), pz(z + 0.2), { size: f(0.088), rot: -Math.PI / 2, align: 'right', maxW: f(0.44) });
    else text(ctx, `${n} ${JNAME[n]}`, px(x), pz(z - 0.2), { size: f(0.08), rot: -Math.PI / 2, align: 'left', maxW: f(0.3) });
  }
  const [x1] = pinXY(1);
  ctx.fillStyle = SILK;
  ctx.beginPath();
  ctx.moveTo(px(x1 - 0.2), pz(ODD_Z));
  ctx.lineTo(px(x1 - 0.36), pz(ODD_Z - 0.1));
  ctx.lineTo(px(x1 - 0.36), pz(ODD_Z + 0.1));
  ctx.closePath();
  ctx.fill();
  text(ctx, '1', px(x1 - 0.46), pz(ODD_Z), { size: f(0.12), weight: 700 });
  text(ctx, 'J12', px(x1 - 0.5), pz(EVEN_Z - 0.2), { size: f(0.11), weight: 700 });
  text(ctx, '40', px(pinXY(40)[0] + 0.32), pz(EVEN_Z), { size: f(0.1), weight: 700 });
  text(ctx, 'JETSON ORIN NANO-STYLE', px(-3.15), pz(-3.5), { size: f(0.24), weight: 700, maxW: f(2.6) });
  text(ctx, 'DEV KIT  ·  TINKER LAB', px(-3.15), pz(-3.14), { size: f(0.13), maxW: f(2.6) });
  for (const c of CSI) {
    text(ctx, c.name, px(c.x + 0.42), pz(c.z), { size: f(0.11), weight: 700, rot: -Math.PI / 2 });
  }
  text(ctx, 'MIPI CSI-2 · 22-PIN', px(-4.3), pz(-2.45), { size: f(0.08) });
  const lab = { jack: 'DC 19V', dp: 'DP', eth: 'LAN', usbc: 'USB-C' };
  const depth = { jack: 1.4, dp: 1.2, usb: 1.75, eth: 2.1, usbc: 0.74 };
  for (const [k, x] of PORTS) if (lab[k]) text(ctx, lab[k], px(x), pz(FRONT - depth[k] - 0.16), { size: f(0.12), weight: 700 });
  text(ctx, 'USB 3.2', px(-0.35), pz(FRONT - 1.75 - 0.15), { size: f(0.12), weight: 700 });
  text(ctx, 'PWR', px(LED_POS[0] + 0.25), pz(LED_POS[1]), { size: f(0.09), align: 'left' });
  text(ctx, 'J14 BUTTONS', px(J14[0]), pz(J14[1] + 0.95), { size: f(0.085) });
  text(ctx, 'FAN', px(FAN_CONN[0]), pz(FAN_CONN[1] + 0.35), { size: f(0.085) });
  text(ctx, 'M.2 KEY M / KEY E ON THE UNDERSIDE', px(3.85), pz(-0.05), { size: f(0.07), rot: -Math.PI / 2, maxW: f(2.4) });
  ctx.strokeStyle = 'rgba(238,240,246,.55)';
  ctx.lineWidth = f(0.02);
  ctx.strokeRect(px(MOD.x - MOD.w / 2 - 0.08), pz(MOD.z - MOD.d / 2 - 0.08), f(MOD.w + 0.16), f(MOD.d + 0.4));
}

function moduleTexture() {
  const s = 150;
  return canvasTexture(Math.round(MOD.w * s), Math.round(MOD.d * s), (ctx, w, h) => {
    ctx.fillStyle = '#1c2a24';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d6b46a';
    for (let i = 0; i < 70; i++) ctx.fillRect(w * 0.04 + i * (w * 0.92 / 70), h - 0.12 * s, w * 0.006, 0.1 * s);
    ctx.fillStyle = SILK;
    ctx.font = `600 ${0.13 * s}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(w - 0.18 * s, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('ORIN NANO-STYLE MODULE · 8GB', 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(0.18 * s, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('260-PIN SO-DIMM · 7-25 W', 0, 0);
    ctx.restore();
  });
}

function makeHeatsink() {
  const g = new THREE.Group();
  const alu = mat(0xb8bcc2, { metal: 0.55, rough: 0.36 });
  g.add(at(box(HS.w, HS.base, HS.d, alu), 0, HS.base / 2, 0));
  const fins = [];
  const step = (HS.w - HS.finT) / (HS.fins - 1);
  for (let i = 0; i < HS.fins; i++) {
    const fg = new THREE.BoxGeometry(HS.finT, HS.finH, HS.d);
    fg.translate(-HS.w / 2 + HS.finT / 2 + i * step, HS.base + HS.finH / 2, 0);
    fins.push(fg);
  }
  g.add(mesh(mergeGeometries(fins), alu));
  // heat pipes across the base (copper)
  for (const z of [-0.9, 0.9]) {
    const hp = cyl(0.12, 0.12, HS.w - 0.3, mat(0xc47a45, { metal: 0.6, rough: 0.3 }), { seg: 12 });
    hp.rotation.z = Math.PI / 2;
    g.add(at(hp, 0, HS.base + 0.1, z));
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(at(cyl(0.13, 0.13, 0.08, mat(0x2a2c33), { seg: 12 }), sx * (HS.w / 2 - 0.14), HS.base + 0.04, sz * (HS.d / 2 - 0.2)));
  return g;
}

function makeFan() {
  const g = new THREE.Group();
  const black = mat(0x1f2126, { rough: 0.55 });
  const sh = roundedRectShape(FAN.size, FAN.size, 0.35);
  const hole = new THREE.Path();
  hole.absarc(0, 0, FAN.size * 0.47, 0, Math.PI * 2, true);
  sh.holes.push(hole);
  const c = FAN.size / 2 - 0.36;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const h = new THREE.Path();
    h.absarc(sx * c, sz * c, 0.11, 0, Math.PI * 2, true);
    sh.holes.push(h);
  }
  g.add(slab(sh, FAN.h, black));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(at(cyl(0.16, 0.16, 0.06, mat(0xb9bcc1, { metal: 0.6, rough: 0.3 }), { seg: 14 }), sx * c, FAN.h + 0.03, sz * c));
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + Math.PI / 6;
    const st = box(1.3, 0.1, 0.12, black, { outline: false });
    st.position.set(Math.cos(a) * 1.3, 0.05, Math.sin(a) * 1.3);
    st.rotation.y = -a;
    g.add(st);
  }
  const rotor = new THREE.Group();
  rotor.add(at(cyl(0.78, 0.78, 0.7, mat(0x26282e, { rough: 0.5 }), { seg: 32 }), 0, 0.45, 0));
  const sticker = new THREE.Mesh(
    new THREE.CircleGeometry(0.66, 40),
    texMat(canvasTexture(256, 256, (ctx) => {
      ctx.fillStyle = '#e9e5da';
      ctx.beginPath();
      ctx.arc(128, 128, 126, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1d2440';
      ctx.textAlign = 'center';
      ctx.font = `700 34px ${FONT}`;
      ctx.fillText('TINKER LAB', 128, 116);
      ctx.font = `500 24px ${MONO}`;
      ctx.fillText('ORIN-STYLE', 128, 150);
      ctx.fillText('5V PWM', 128, 180);
    }), { rough: 0.6 }),
  );
  sticker.rotation.x = -Math.PI / 2;
  sticker.position.y = 0.805;
  rotor.add(sticker);
  const bladeMat = mat(0x2c2f36, { rough: 0.5 });
  for (let i = 0; i < 9; i++) {
    const arm = new THREE.Group();
    const blade = box(1.12, 0.05, 0.55, bladeMat);
    blade.position.set(1.38, 0.45, 0);
    blade.rotation.x = 0.55;
    blade.rotation.y = 0.2;
    arm.add(blade);
    arm.rotation.y = (i * Math.PI * 2) / 9;
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

/** 22-pin 0.5 mm MIPI FPC connector, long axis along z. */
function csiConnector() {
  const g = new THREE.Group();
  g.add(at(box(0.42, 0.3, CSI_LEN, mat(0xe8dfc6, { rough: 0.6 })), 0, 0.15, 0));
  g.add(at(box(0.15, 0.09, CSI_LEN * 0.95, mat(0x2a2c33, { rough: 0.5 })), -0.12, 0.34, 0));
  g.add(at(box(0.06, 0.012, CSI_LEN * 0.82, mat(0x15161a), { outline: false }), 0.06, 0.306, 0));
  for (const s of [-1, 1]) g.add(at(box(0.28, 0.05, 0.12, mat(0xcfccc2, { metal: 0.5, rough: 0.35 }), { outline: false }), 0, 0.025, s * (CSI_LEN / 2 + 0.06)));
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

/** M.2 card hanging under the carrier (top face down). len along x from the slot. */
function m2Card({ len, w, label, sub, color = 0x1f5c3a, chips = [] }) {
  const g = new THREE.Group();
  const tex = canvasTexture(Math.round(len * 120), Math.round(w * 120), (c, cw, ch) => {
    c.fillStyle = `#${new THREE.Color(color).getHexString()}`;
    c.fillRect(0, 0, cw, ch);
    c.fillStyle = '#d6b46a';
    for (let i = 0; i < 30; i++) c.fillRect(2, ch * 0.08 + i * (ch * 0.84 / 30), 16, ch * 0.016);
    c.fillStyle = SILK;
    c.font = `600 ${ch * 0.13}px ${FONT}`;
    c.textAlign = 'center';
    c.fillText(label, cw * 0.55, ch * 0.5);
    c.font = `500 ${ch * 0.09}px ${MONO}`;
    c.fillText(sub, cw * 0.55, ch * 0.68);
  });
  const side = mat(color, { rough: 0.55 });
  const pcb = mesh(new THREE.BoxGeometry(len, 0.08, w), [side, side, side, texMat(tex, { rough: 0.55 }), side, side]);
  pcb.position.set(len / 2, -0.04, 0);
  g.add(pcb);
  for (const [x, cw, cl] of chips) {
    const chip = chipIC({ w: cl, d: cw, h: 0.1, dot: false, res: 64 });
    chip.rotation.x = Math.PI;
    chip.position.set(x, -0.08, 0);
    g.add(chip);
  }
  return g;
}

export function makeOrin(opts = {}) {
  const withFan = opts.fan !== false;
  const g = new THREE.Group();
  g.name = 'board-orin';
  const b = new THREE.Group(); // the carrier, raised on its feet
  b.position.y = FEET;
  g.add(b);
  makePCB(b, { w: W, d: D, color: 0x1f2a26, radius: 0.25, holes: HOLES });
  makeSilk(b, W, D, TOP, silkscreen, 3072);

  const on = (obj, x, z, rotY = 0, y = 0) => {
    obj.position.set(x, obj.position.y + TOP + y, z);
    obj.rotation.y = rotY;
    b.add(obj);
    return obj;
  };

  // ---- feet and underside M.2 cards
  const rubber = mat(0x2a2c33, { rough: 0.85 });
  for (const [hx, hz] of HOLES) {
    const foot = cyl(0.3, 0.34, FEET, rubber, { seg: 18 });
    foot.position.set(hx, -FEET / 2, hz);
    b.add(foot);
  }
  const slot = (x, z, w) => {
    const s = box(0.45, 0.38, w + 0.25, mat(0x1d1e23, { rough: 0.6 }));
    s.position.set(x, -0.19, z);
    b.add(s);
  };
  slot(SSD.x - SSD.len / 2 - 0.2, SSD.z, SSD.w);
  const ssd = m2Card({ len: SSD.len, w: SSD.w, label: 'NVMe SSD · M.2 2280', sub: 'KEY M · PCIe x4', color: 0x18324f, chips: [[1.4, 1.4, 1.6], [3.8, 1.3, 1.2], [5.6, 1.3, 1.2]] });
  ssd.position.set(SSD.x - SSD.len / 2, -0.3, SSD.z);
  b.add(ssd);
  slot(WIFI.x - WIFI.len / 2 - 0.2, WIFI.z, WIFI.w);
  const wifi = m2Card({ len: WIFI.len, w: WIFI.w, label: 'Wi-Fi · BT', sub: 'M.2 2230 KEY E', color: 0x1f5c3a, chips: [[1.6, 1.3, 1.3]] });
  wifi.position.set(WIFI.x - WIFI.len / 2, -0.3, WIFI.z);
  b.add(wifi);
  for (const dz of [-0.45, 0.45]) {
    const ax = WIFI.x + WIFI.len / 2 - 0.3;
    b.add(cable([new THREE.Vector3(ax, -0.42, WIFI.z + dz), new THREE.Vector3(ax + 0.4, -0.5, WIFI.z + dz * 1.4), new THREE.Vector3(ax + 1.2, -0.45, WIFI.z + dz * 2.2)], dz < 0 ? 0x2a2c33 : 0xd8d4c8, 0.03));
  }
  slot(0.8, -2.4, 2.2); // second Key M slot (2230), empty

  // ---- module + heatsink + fan
  const modY = MOD.lift;
  const sodimm = new THREE.Group();
  sodimm.add(at(box(MOD.w + 0.1, 0.6, 0.5, mat(0x1f2126, { rough: 0.7 })), 0, 0.3, 0));
  for (const s of [-1, 1]) sodimm.add(at(box(0.18, 0.62, 0.55, mat(0xcfccc2, { metal: 0.55, rough: 0.35 })), s * (MOD.w / 2 + 0.12), 0.31, 0));
  on(sodimm, MOD.x, MOD.z + MOD.d / 2 - 0.15);
  for (const sx of [-1, 1]) on(cyl(0.12, 0.12, modY, mat(0xc9c6bd, { metal: 0.55, rough: 0.35 }), { seg: 12 }), MOD.x + sx * (MOD.w / 2 - 0.3), MOD.z - MOD.d / 2 + 0.3, 0, modY / 2);
  const modSide = mat(0x1c2a24, { rough: 0.6 });
  const modPcb = mesh(new THREE.BoxGeometry(MOD.w, MOD.t, MOD.d), [modSide, modSide, texMat(moduleTexture(), { rough: 0.55 }), modSide, modSide, modSide]);
  on(modPcb, MOD.x, MOD.z, 0, modY + MOD.t / 2);
  const modTop = TOP + modY + MOD.t;
  for (const [x, z] of [[-3.75, -1.6], [-3.75, -0.6], [-3.75, 0.4], [2.6, -1.8], [2.6, 1.2], [2.6, -0.3]]) {
    const c = chipIC({ w: 0.22, d: 0.5, h: 0.06, dot: false, res: 64 });
    c.position.set(x, modTop, z);
    b.add(c);
  }
  const hs = makeHeatsink();
  hs.position.set(MOD.x, modTop, MOD.z);
  b.add(hs);
  const finTop = modTop + HS.base + HS.finH;
  let fan = null;
  if (withFan) {
    fan = makeFan();
    fan.group.position.set(MOD.x, finTop, MOD.z);
    b.add(fan.group);
    const fy = finTop + FAN.h * 0.45;
    const route = (dz) => [
      new THREE.Vector3(MOD.x + FAN.size / 2, fy, MOD.z - 1.2 + dz),
      new THREE.Vector3(MOD.x + FAN.size / 2 + 0.5, fy - 0.1, MOD.z - 1.1 + dz),
      new THREE.Vector3(MOD.x + HS.w / 2 + 0.3, finTop - 0.6, -1.0 + dz),
      new THREE.Vector3(FAN_CONN[0] - 0.2, TOP + 0.7, FAN_CONN[1] - 0.1 + dz),
      new THREE.Vector3(FAN_CONN[0] + dz * 2, TOP + 0.32, FAN_CONN[1]),
    ];
    b.add(cable(route(-0.04), 0xd8443a), cable(route(0.04), 0x2a2c33));
  }

  // ---- front I/O
  for (const [kind, x] of PORTS) {
    let obj, d;
    if (kind === 'jack') [obj, d] = [barrelJack({ w: 0.9, h: 1.1, d: 1.4 }), 1.4];
    else if (kind === 'dp') [obj, d] = [hdmi({ w: 1.5, h: 0.56, d: 1.2, dp: true }), 1.2];
    else if (kind === 'usb') [obj, d] = [usbAStack(), 1.75];
    else if (kind === 'usbc') [obj, d] = [usbC(), 0.74];
    else [obj, d] = [rj45(), 2.1];
    on(obj, x, FRONT - d / 2, Math.PI / 2);
  }
  const led = smdLed(0x52d27a, { w: 0.18, d: 0.12, h: 0.08, glowSize: 1.3, glowColor: 0x5dff86 });
  on(led.group, ...LED_POS);
  led.set(1);
  // J14 button header, fan connector, support chips and caps
  on(smallMaleHeader(6, 2), J14[0], J14[1], Math.PI / 2);
  const fc = new THREE.Group();
  fc.add(at(box(0.7, 0.4, 0.36, mat(0xf0ead8, { rough: 0.6 })), 0, 0.2, 0));
  for (let i = 0; i < 4; i++) fc.add(at(box(0.1, 0.01, 0.1, mat(0x15161a), { outline: false }), -0.225 + i * 0.15, 0.405, 0.04));
  on(fc, ...FAN_CONN);
  on(chipIC({ w: 0.6, h: 0.08, legsX: 9, legsZ: 9, legLen: 0.04, pads: true, lines: [{ t: 'USB HUB', size: 0.16, y: 0.45 }, { t: '3.2', size: 0.14, y: 0.66 }] }), 3.6, 0.55);
  on(chipIC({ w: 0.6, h: 0.08, legsX: 9, legsZ: 9, legLen: 0.04, pads: true, lines: [{ t: 'GbE PHY', size: 0.16, y: 0.45 }, { t: 'RGMII', size: 0.13, y: 0.66 }] }), 4.35, 1.3);
  on(chipIC({ w: 0.7, d: 0.5, h: 0.1, legsX: 6, legLen: 0.08, lines: [{ t: 'PMIC', size: 0.2, y: 0.55 }] }), -3.9, 2.2);
  for (const [x, z] of [[3.5, -2.3], [3.0, 1.7], [-4.5, 2.2]]) on(canCap(0.24, 0.42), x, z);
  b.add(passives([
    [3.1, -0.2, 0, 'r'], [3.1, 0.0, 0, 'r'], [3.1, -1.5, 0, 'c'], [4.0, 0.0, Math.PI / 2, 'C'], [3.8, 1.9, 0, 'c'], [4.75, 0.5, Math.PI / 2, 'c'],
    [-3.2, 2.4, 0, 'r'], [-2.0, 2.45, 0, 'c'], [-0.3, 2.3, 0, 'r'], [1.0, 2.4, Math.PI / 2, 'C'], [-4.8, -0.5, Math.PI / 2, 'C'], [2.4, 2.5, 0, 'c'],
  ], TOP));

  // ---- two CSI connectors
  for (const c of CSI) on(csiConnector(), c.x, c.z);

  // ---- 40-pin header
  on(headerBase(20, 2), GX, (ODD_Z + EVEN_Z) / 2);
  const pts = [];
  for (let n = 1; n <= 40; n++) pts.push(pinXY(n));
  b.add(pinField(pts, TOP));
  const tipY = TOP + MALE_TIP;
  const pinMap = {};
  for (let n = 1; n <= 40; n++) {
    const [x, z] = pinXY(n);
    pinMap[`PIN${n}`] = new THREE.Vector3(x, tipY, z);
  }
  const lookup = pinLookup('Jetson Orin Nano-style', b, pinMap, ALIASES, (n) => {
    const m = /^(?:PIN|P|J12_?)?(\d+)$/.exec(n);
    return m ? `PIN${+m[1]}` : null;
  });

  const L = (x, y, z) => new THREE.Vector3(x, y + FEET, z); // carrier-local → board-local
  const csiLocal = (c) => new THREE.Vector3(c.x + 0.06, TOP + 0.31, c.z);
  const portTop = (x, h) => L(x, TOP + h, FRONT - 0.5);
  let fanSpeed = 0;
  return {
    id: 'orin',
    name: 'Jetson Orin Nano-style Dev Kit',
    group: g,
    pins: Object.keys(pinMap),
    pin: lookup.pin,
    resolve: lookup.resolve,
    setBuiltinLed(level) { led.set(level); },
    setFan(speed) { fanSpeed = Math.max(0, Math.min(1, speed)); },
    get fanSpeed() { return fanSpeed; },
    tick(dt) { if (fan) fan.rotor.rotation.y -= dt * fanSpeed * 38; },
    /** World position of the top of CAM0 (where the ribbon goes in). */
    get csi() { return csiLocal(CSI[0]).applyMatrix4(b.matrixWorld); },
    /** World position of the top of CAM1. */
    get csi1() { return csiLocal(CSI[1]).applyMatrix4(b.matrixWorld); },
    get csiAxis() { return new THREE.Vector3(0, 0, 1).transformDirection(b.matrixWorld); },
    anchors: {
      usb: portTop(-0.35, 1.6),
      ethernet: portTop(3.75, 1.4),
      dp: portTop(-2.85, 0.6),
      usbc: portTop(1.75, 0.35),
      power: L(-4.35, TOP + 1.15, 3.4),
      chip: L(MOD.x, finTop + (withFan ? FAN.h : 0), MOD.z),
      module: L(MOD.x + MOD.w / 2 - 0.2, modTop, MOD.z),
      heatsink: L(MOD.x + HS.w / 2 - 0.4, finTop, MOD.z + HS.d / 2 - 0.4),
      fan: L(MOD.x, finTop + FAN.h, MOD.z),
      gpio: L(GX, tipY, (ODD_Z + EVEN_Z) / 2),
      pin1: L(pinMap.PIN1.x, pinMap.PIN1.y, pinMap.PIN1.z),
      csi: L(...csiLocal(CSI[0]).toArray()),
      csi1: L(...csiLocal(CSI[1]).toArray()),
      led: L(LED_POS[0], TOP + 0.12, LED_POS[1]),
      buttons: L(J14[0], TOP + MALE_TIP, J14[1]),
      m2: L(SSD.x + SSD.len / 2 - 0.3, -0.35, SSD.z),
      ssd: L(SSD.x + SSD.len / 2 - 0.3, -0.35, SSD.z),
      wifi: L(WIFI.x, -0.35, WIFI.z),
      gnd: L(pinMap.PIN6.x, pinMap.PIN6.y, pinMap.PIN6.z),
    },
  };
}
