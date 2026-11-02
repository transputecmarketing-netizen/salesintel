// A procedurally built Mega 2560-style board (10.16 × 5.33 cm). The left
// two thirds mirror the Uno; the right adds a second analog header, the
// communication header D14–D21 and the 2×18 double header D22–D53.
import * as THREE from 'three';
import { mat, box, cyl, at } from '../kit.js';
import { femaleHeader } from '../board.js';
import {
  PITCH, FEMALE_H, makePCB, makeSilk, text, drawTraces, chipIC, passives, crystal, canCap, smdLed, smallMaleHeader, usbB, barrelJack, sot223, pinLookup,
} from './parts.js';

const W = 10.16, D = 5.33;
const TOP = 0.17; // PCB top (0.05 core + 0.12 mask, like the Uno)
const DX = -1.65; // Uno parts shifted left by this much
const EVEN_X = 4.58, ODD_X = 4.834; // double header columns
const DBL_Z0 = -2.159; // first row of the double header

const COMM = ['TX3', 'RX3', 'TX2', 'RX2', 'TX1', 'RX1', 'SDA', 'SCL'];
const HEADERS = [
  { x0: -2.4, z: -2.47, pins: ['SCL', 'SDA', 'AREF', 'GND', 'D13', 'D12', 'D11', 'D10', 'D9', 'D8'] },
  { x0: 0.3, z: -2.47, pins: ['D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0'] },
  { x0: 2.459, z: -2.47, pins: ['D14', 'D15', 'D16', 'D17', 'D18', 'D19', 'D20', 'D21'] },
  { x0: -1.95, z: 2.47, pins: ['NC', 'IOREF', 'RESET', '3V3', '5V', 'GND_2', 'GND_3', 'VIN'] },
  { x0: 0.3, z: 2.47, pins: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'] },
  { x0: 2.459, z: 2.47, pins: ['A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15'] },
];
// 2×18 double header rows: [even/inner, odd/outer]
const DOUBLE = [['5V_2', '5V_3']];
for (let n = 22; n <= 52; n += 2) DOUBLE.push([`D${n}`, `D${n + 1}`]);
DOUBLE.push(['GND_4', 'GND_5']);

const HOLES = [[-4.4, 2.35, 0.15], [-3.75, -2.3, 0.15], [1.55, 1.62, 0.15], [3.95, -1.0, 0.15]];

function topLabel(name) {
  const m = /^D(\d+)$/.exec(name);
  if (m) {
    const n = +m[1];
    if (n >= 14 && n <= 21) return `${COMM[n - 14]} ${n}`;
    if (n === 0) return 'RX0 0';
    if (n === 1) return 'TX0 1';
    return String(n);
  }
  return name.replace(/_\d+$/, '').replace('3V3', '3.3V');
}

function silkscreen(ctx, t) {
  const { px, pz, s } = t;
  drawTraces(ctx, t, { rects: [[-4.6, -1.9, -0.6, 2.0], [-0.6, -1.8, 3.9, 1.9], [1.8, -1.9, 4.3, 1.9]], n: 46, seed: 2560 });
  const f = (cm) => cm * s;
  // header pin labels (vertical, like the Uno)
  for (const h of HEADERS) {
    const back = h.z < 0;
    h.pins.forEach((name, i) => {
      if (name === 'NC') return;
      const x = h.x0 + i * PITCH;
      text(ctx, topLabel(name), px(x), pz(h.z + (back ? 0.42 : -0.42)), { size: f(0.125), rot: -Math.PI / 2, align: back ? 'right' : 'left' });
    });
  }
  // double header: even labels on the inner side, odd ones in the edge strip
  DOUBLE.forEach(([ev, od], r) => {
    const z = DBL_Z0 + r * PITCH;
    const lab = (n) => n.replace(/^D/, '').replace(/_\d+$/, '');
    text(ctx, lab(ev), px(EVEN_X - 0.16), pz(z), { size: f(0.11), align: 'right', maxW: f(0.22) });
    text(ctx, lab(od), px(5.01), pz(z), { size: f(0.085), maxW: f(0.12) });
  });
  text(ctx, 'DIGITAL', px(4.08), pz(0), { size: f(0.15), rot: -Math.PI / 2, weight: 700 });
  // section titles
  const rule = (x0, x1, z) => {
    ctx.strokeStyle = '#eef0f6';
    ctx.lineWidth = f(0.025);
    ctx.beginPath();
    ctx.moveTo(px(x0), pz(z));
    ctx.lineTo(px(x1), pz(z));
    ctx.stroke();
  };
  text(ctx, 'PWM ~', px(0.1), pz(-1.5), { size: f(0.16) });
  text(ctx, 'COMMUNICATION', px(3.35), pz(-1.5), { size: f(0.16) });
  rule(-2.5, 2.2, -1.36);
  rule(2.35, 4.35, -1.36);
  text(ctx, 'POWER', px(-1.06), pz(1.5), { size: f(0.16) });
  text(ctx, 'ANALOG IN', px(2.27), pz(1.5), { size: f(0.16) });
  rule(-2.05, -0.1, 1.36);
  rule(0.2, 4.35, 1.36);
  // logo block
  ctx.strokeStyle = '#eef0f6';
  ctx.fillStyle = '#eef0f6';
  ctx.save();
  ctx.translate(px(2.95), pz(-0.42));
  ctx.lineWidth = f(0.04);
  ctx.beginPath();
  ctx.roundRect(-f(0.3), -f(0.22), f(0.6), f(0.44), f(0.08));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-f(0.09), -f(0.11));
  ctx.lineTo(f(0.12), 0);
  ctx.lineTo(-f(0.09), f(0.11));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  text(ctx, 'CIRCUIT LAB', px(2.95), pz(0.14), { size: f(0.3), weight: 700 });
  text(ctx, 'MEGA 2560-STYLE', px(2.95), pz(0.5), { size: f(0.15) });
  // small labels
  const sm = { size: f(0.11), align: 'left' };
  text(ctx, 'L', px(-1.72), pz(-1.15), sm);
  text(ctx, 'TX', px(-1.72), pz(-0.92), sm);
  text(ctx, 'RX', px(-1.72), pz(-0.69), sm);
  text(ctx, 'ON', px(2.12), pz(-1.05), sm);
  text(ctx, 'RESET', px(-4.55), pz(-1.78), { size: f(0.11) });
  text(ctx, 'ICSP', px(1.75), pz(0.66), { size: f(0.1) });
  text(ctx, 'ICSP', px(-3.08 + 0.45), pz(-1.88), { size: f(0.1), align: 'left' });
  text(ctx, '16 MHz', px(-1.15), pz(1.3), { size: f(0.09) });
  text(ctx, '7–12V', px(-4.55), pz(0.95), { size: f(0.1) });
  // pin-1 dot by the chip
  ctx.beginPath();
  ctx.arc(px(0.55), pz(0.2 - 1.3), f(0.05), 0, Math.PI * 2);
  ctx.fill();
}

export function makeMega() {
  const g = new THREE.Group();
  g.name = 'board-mega';
  makePCB(g, { w: W, d: D, color: 0x2f4c97, radius: 0.22, holes: HOLES });
  makeSilk(g, W, D, TOP, silkscreen, 3072);

  const on = (obj, x, z, y = 0, rotY = 0) => {
    obj.position.set(x, obj.position.y + TOP + y, z);
    obj.rotation.y = rotY;
    g.add(obj);
    return obj;
  };

  // USB-B, DC jack, regulator, caps (Uno side)
  on(usbB(), -3.0 + DX, -1.3);
  on(barrelJack(), -2.9 + DX, 1.55);
  on(sot223('AMS1117'), -3.35, 2.05);
  for (const [cx, cz] of [[-3.65, 0.75], [-2.95, 1.25]]) {
    const cap = new THREE.Group();
    cap.add(at(cyl(0.3, 0.3, 0.75, mat(0xbdbfba, { metal: 0.35, rough: 0.4 })), 0, 0.375, 0));
    cap.add(at(cyl(0.3, 0.3, 0.02, mat(0x8a8d8a, { metal: 0.5 }), { outline: false }), 0, 0.76, 0));
    cap.add(at(cyl(0.302, 0.302, 0.6, mat(0x55585a), { thetaLength: 0.7, outline: false }), 0, 0.375, 0));
    on(cap, cx, cz);
  }
  // reset button
  const rst = new THREE.Group();
  rst.add(at(box(0.6, 0.25, 0.6, mat(0xc9c6bd, { rough: 0.35, metal: 0.55 })), 0, 0.125, 0));
  rst.add(at(cyl(0.18, 0.18, 0.2, mat(0xd8443a)), 0, 0.35, 0));
  on(rst, -4.55, -2.25);
  // USB-to-serial chip (16U2-style QFN), its crystal and ICSP
  on(chipIC({ w: 0.5, h: 0.08, legsX: 8, legsZ: 8, legLen: 0.04, pads: true, lines: [{ t: '16U2', size: 0.2, y: 0.5 }] }), -3.2, -0.95);
  const x16 = on(crystal({ hc49: true, w: 0.85, d: 0.36 }), -2.6, -0.4);
  x16.rotation.y = 0;
  on(smallMaleHeader(2, 3), -2.85, -1.95);
  // main MCU: TQFP-100, rotated 45° like the real board
  const mcu = chipIC({
    w: 1.4, h: 0.12, legsX: 25, legsZ: 25, legLen: 0.11, legW: 0.024, res: 512,
    lines: [{ t: 'ATMEGA2560', size: 0.13, y: 0.42 }, { t: '16AU  2215', size: 0.085, y: 0.58 }, { t: 'CIRCUIT LAB', size: 0.07, y: 0.72, font: 'sans' }],
  });
  on(mcu, 0.55, 0.2, 0, Math.PI / 4);
  on(crystal({ hc49: true, w: 0.85, d: 0.36 }), -1.15, 0.95);
  on(smallMaleHeader(3, 2), 1.75, 1.0);
  on(canCap(0.22, 0.4), -2.1, 0.55);
  g.add(passives([
    [-1.9, 0.05, 0, 'c'], [-1.9, 0.35, 0, 'r'], [-0.9, -0.4, Math.PI / 2, 'c'], [-0.65, 1.3, 0, 'c'], [-1.65, 1.3, 0, 'c'],
    [1.65, -0.35, Math.PI / 4, 'r'], [2.35, 1.05, Math.PI / 2, 'c'], [-0.35, -1.0, Math.PI / 4, 'r'], [1.1, 1.35, -Math.PI / 4, 'c'],
    [-2.6, -1.4, 0, 'r'], [-2.6, -1.2, 0, 'r'], [-3.75, -0.35, Math.PI / 2, 'c'], [-3.65, -1.6, 0, 'c'], [-2.95, 2.2, 0, 'C'],
    [-2.4, 1.9, Math.PI / 2, 'd'], [2.55, -1.05, 0, 'r'], [-1.3, -1.6, 0, 'r'], [-0.95, -1.6, 0, 'r'], [3.75, 1.05, 0, 'r'], [3.75, 0.85, 0, 'c'],
    [0.6, -1.1, Math.PI / 4, 'c'], [0.1, 1.5, 0, 'r'],
  ], TOP));

  // LEDs: L (D13), TX, RX, ON
  const lLed = smdLed(0xf4a83b, { glowSize: 1.1, glowColor: 0xffa640 });
  on(lLed.group, -1.97, -1.15);
  for (const z of [-0.92, -0.69]) on(smdLed(0xf4c03b).group, -1.97, z);
  const onLed = smdLed(0x52d27a, { glowSize: 0.8 });
  on(onLed.group, 1.95, -1.05);
  onLed.set(0.7);

  // female headers
  for (const h of HEADERS) on(femaleHeader(h.pins.length), h.x0 + ((h.pins.length - 1) * PITCH) / 2, h.z);
  on(femaleHeader(2, 18), (EVEN_X + ODD_X) / 2, DBL_Z0 + (17 * PITCH) / 2);

  const pinMap = {};
  const tipY = TOP + FEMALE_H;
  for (const h of HEADERS) h.pins.forEach((p, i) => p !== 'NC' && (pinMap[p] = new THREE.Vector3(h.x0 + i * PITCH, tipY, h.z)));
  DOUBLE.forEach(([ev, od], r) => {
    pinMap[ev] = new THREE.Vector3(EVEN_X, tipY, DBL_Z0 + r * PITCH);
    pinMap[od] = new THREE.Vector3(ODD_X, tipY, DBL_Z0 + r * PITCH);
  });
  const aliases = { '3.3V': '3V3', TX0: 'D1', RX0: 'D0', TX: 'D1', RX: 'D0', LED: 'D13', LED_BUILTIN: 'D13', RST: 'RESET' };
  COMM.forEach((c, i) => c.length === 3 && (aliases[c] = `D${14 + i}`));
  const lookup = pinLookup('Mega 2560-style', g, pinMap, aliases, (n) => (/^\d+$/.test(n) ? `D${n}` : null));
  const center = (h) => new THREE.Vector3(h.x0 + ((h.pins.length - 1) * PITCH) / 2, tipY, h.z);

  return {
    id: 'mega',
    name: 'Mega 2560-style',
    group: g,
    pins: Object.keys(pinMap),
    pin: lookup.pin,
    resolve: lookup.resolve,
    setBuiltinLed(level) { lLed.set(level); },
    anchors: {
      usb: new THREE.Vector3(-3.0 + DX, TOP + 1.1, -1.3),
      jack: new THREE.Vector3(-3.3 + DX, TOP + 0.6, 1.55),
      chip: new THREE.Vector3(0.55, TOP + 0.2, 0.2),
      digital: new THREE.Vector3(0, tipY, -2.47),
      pwm: center(HEADERS[0]),
      communication: center(HEADERS[2]),
      digitalDouble: new THREE.Vector3((EVEN_X + ODD_X) / 2, tipY, 0),
      power: center(HEADERS[3]),
      analog: center(HEADERS[4]),
      analogExtra: center(HEADERS[5]),
      reset: new THREE.Vector3(-4.55, TOP + 0.45, -2.25),
      lLed: new THREE.Vector3(-1.97, TOP + 0.1, -1.15),
      icsp: new THREE.Vector3(1.75, TOP + 0.85, 1.0),
      usbChip: new THREE.Vector3(-3.2, TOP + 0.1, -0.95),
      d13: pinMap.D13.clone(),
      gnd: pinMap.GND.clone(),
    },
  };
}
