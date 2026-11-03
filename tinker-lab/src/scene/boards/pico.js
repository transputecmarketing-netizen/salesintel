// A procedurally built Pico-style RP2040 board (5.1 × 2.1 cm): green PCB
// with castellated edges, micro-USB at -x, BOOTSEL button and 2×20 male
// pins pointing UP. GP25 is the on-board LED (not a header pin).
import * as THREE from 'three';
import { mat, box, at } from '../kit.js';
import {
  PITCH, MALE_TIP, makePCB, makeSilk, text, drawTraces, pad, chipIC, passives, crystal, smdLed, tactSwitch, microUSB, headerBase, pinField, pinLookup,
} from './parts.js';

const W = 5.1, D = 2.1;
const BASE_T = 0.03, PCB_T = 0.1;
const TOP = BASE_T + PCB_T;
const ROW_Z = 0.889; // rows 0.7" apart
const X0 = -2.413; // pin 1 / pin 40 (USB end)
const NOTCH_R = 0.055;
// physical pins 1..20 run along +z from the USB end; 40..21 along -z
const ROW_GP = ['GP0', 'GP1', 'GND', 'GP2', 'GP3', 'GP4', 'GP5', 'GND_2', 'GP6', 'GP7', 'GP8', 'GP9', 'GND_3', 'GP10', 'GP11', 'GP12', 'GP13', 'GND_4', 'GP14', 'GP15'];
const ROW_PWR = ['VBUS', 'VSYS', 'GND_8', '3V3_EN', '3V3', 'ADC_VREF', 'GP28', 'GND_7', 'GP27', 'GP26', 'RUN', 'GP22', 'GND_6', 'GP21', 'GP20', 'GP19', 'GP18', 'GND_5', 'GP17', 'GP16'];
const LABEL = { ADC_VREF: 'VREF' };
const HOLES = [[-2.36, -0.53, 0.065], [-2.36, 0.53, 0.065], [2.36, -0.53, 0.065], [2.36, 0.53, 0.065]];
const LED_POS = [-1.82, -0.36];
const BOOT_POS = [-1.45, 0.2];

const px = (i) => X0 + i * PITCH;

function picoShape() {
  const s = new THREE.Shape();
  const hw = W / 2, hd = D / 2, r = 0.1;
  const xs = Array.from({ length: 20 }, (_, i) => px(i));
  s.moveTo(-hw + r, -hd);
  for (const x of xs) {
    s.lineTo(x - NOTCH_R, -hd);
    s.absarc(x, -hd, NOTCH_R, Math.PI, 0, true);
  }
  s.lineTo(hw - r, -hd);
  s.quadraticCurveTo(hw, -hd, hw, -hd + r);
  s.lineTo(hw, hd - r);
  s.quadraticCurveTo(hw, hd, hw - r, hd);
  for (const x of [...xs].reverse()) {
    s.lineTo(x + NOTCH_R, hd);
    s.absarc(x, hd, NOTCH_R, 0, Math.PI, true);
  }
  s.lineTo(-hw + r, hd);
  s.quadraticCurveTo(-hw, hd, -hw, hd - r);
  s.lineTo(-hw, -hd + r);
  s.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  return s;
}

function silkscreen(ctx, t) {
  const { px: cx, pz: cz, s } = t;
  const f = (cm) => cm * s;
  drawTraces(ctx, t, { rects: [[-2.2, -0.5, 2.2, 0.5]], n: 30, seed: 2040, color: 'rgba(150,230,170,.28)', via: 'rgba(225,235,210,.55)', width: 0.035 });
  // castellation pads
  for (let i = 0; i < 20; i++) for (const z of [-1, 1]) pad(ctx, t, px(i), z * (D / 2 - 0.05), 0.15, 0.13);
  // pin labels
  [[ROW_GP, 1], [ROW_PWR, -1]].forEach(([row, side]) =>
    row.forEach((name, i) => text(ctx, LABEL[name] ?? name.replace(/_\d+$/, ''), cx(px(i)), cz(side * 0.66), { size: f(0.08), maxW: f(0.235) })));
  // pin numbers at the corners
  const num = (n, i, side) => text(ctx, String(n), cx(px(i)), cz(side * 0.52), { size: f(0.065), color: 'rgba(238,240,246,.8)' });
  num(1, 0, 1); num(20, 19, 1); num(40, 0, -1); num(21, 19, -1);
  // debug pads
  [['SWCLK', -0.254], ['GND', 0], ['SWDIO', 0.254]].forEach(([n, z]) => {
    pad(ctx, t, 2.42, z, 0.12, 0.12, { round: true });
    text(ctx, n, cx(2.33), cz(z), { size: f(0.05), align: 'right' });
  });
  text(ctx, 'BOOTSEL', cx(BOOT_POS[0]), cz(BOOT_POS[1] + 0.29), { size: f(0.075) });
  text(ctx, 'LED', cx(LED_POS[0]), cz(LED_POS[1] - 0.16), { size: f(0.07) });
  text(ctx, 'PICO-STYLE', cx(1.72), cz(-0.06), { size: f(0.15), weight: 700 });
  text(ctx, 'RP2040 · TINKER LAB', cx(1.72), cz(0.13), { size: f(0.075), maxW: f(0.7) });
  text(ctx, '12MHz', cx(1.02), cz(0.52), { size: f(0.05) });
}

export function makePico() {
  const g = new THREE.Group();
  g.name = 'board-pico';
  makePCB(g, { w: W, d: D, color: 0x1f7a44, shape: picoShape(), holes: HOLES, baseT: BASE_T, thick: PCB_T });
  makeSilk(g, W, D, TOP, silkscreen, 2048);

  // gold plating inside the castellated notches
  const wall = new THREE.CylinderGeometry(NOTCH_R, NOTCH_R, TOP, 10, 1, true, 0, Math.PI);
  const walls = new THREE.InstancedMesh(wall, mat(0xd6b46a, { metal: 0.6, rough: 0.35, side: THREE.DoubleSide }), 40);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < 20; i++) {
    walls.setMatrixAt(i * 2, m.compose(new THREE.Vector3(px(i), TOP / 2, D / 2), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2), one));
    walls.setMatrixAt(i * 2 + 1, m.compose(new THREE.Vector3(px(i), TOP / 2, -D / 2), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2), one));
  }
  g.add(walls);

  const on = (obj, x, z, rotY = 0) => {
    obj.position.set(x, obj.position.y + TOP, z);
    obj.rotation.y = rotY;
    g.add(obj);
    return obj;
  };

  on(microUSB(), -2.37, 0);
  on(tactSwitch({ w: 0.46, d: 0.34, bodyColor: 0xeeece4, capColor: 0xf8f7f2, capR: 0.1 }), ...BOOT_POS);
  on(chipIC({ w: 0.5, d: 0.4, h: 0.1, legsX: 4, legLen: 0.08, legW: 0.04, pitch: 0.127, lines: [{ t: 'W25Q16', size: 0.2, y: 0.45 }, { t: '2MB FLASH', size: 0.15, y: 0.7 }] }), -0.78, -0.02);
  on(chipIC({
    w: 0.7, h: 0.09, legsX: 14, legsZ: 14, legLen: 0.035, legW: 0.022, pads: true, res: 320,
    lines: [{ t: 'RP2040', size: 0.17, y: 0.42 }, { t: 'RP2-B2', size: 0.11, y: 0.6 }, { t: '21/24', size: 0.1, y: 0.75 }],
  }), 0.22, 0);
  on(crystal({ w: 0.32, d: 0.25, h: 0.08 }), 1.02, 0.34);
  const ind = new THREE.Group();
  ind.add(at(box(0.36, 0.17, 0.36, mat(0x55585e, { rough: 0.7 })), 0, 0.085, 0));
  ind.add(at(box(0.2, 0.01, 0.2, mat(0x3a3c41), { outline: false }), 0, 0.175, 0));
  on(ind, 1.12, -0.3);
  g.add(passives([
    [-1.85, 0.05, 0, 'c'], [-1.85, 0.3, 0, 'r'], [-1.2, -0.38, 0, 'c'], [-1.25, 0.45, 0, 'r'], [-0.35, 0.38, Math.PI / 2, 'c'],
    [-0.35, -0.38, Math.PI / 2, 'c'], [0.75, 0.0, Math.PI / 2, 'c'], [0.72, -0.35, 0, 'r'], [0.6, 0.42, 0, 'c'], [-0.2, 0.0, Math.PI / 2, 'c'],
    [1.45, 0.3, Math.PI / 2, 'C'], [1.5, -0.32, Math.PI / 2, 'c'], [0.22, 0.47, 0, 'c'], [0.22, -0.47, 0, 'c'], [-0.78, 0.38, 0, 'r'],
  ], TOP));
  const led = smdLed(0x3fbf5f, { w: 0.14, d: 0.09, h: 0.07, glowSize: 1.0, glowColor: 0x4cff7a });
  on(led.group, ...LED_POS);

  // headers
  const cx = (px(0) + px(19)) / 2;
  on(headerBase(20, 1), cx, -ROW_Z);
  on(headerBase(20, 1), cx, ROW_Z);
  const pts = [];
  for (let i = 0; i < 20; i++) pts.push([px(i), -ROW_Z], [px(i), ROW_Z]);
  g.add(pinField(pts, TOP));

  const tipY = TOP + MALE_TIP;
  const pinMap = {};
  ROW_GP.forEach((n, i) => (pinMap[n] = new THREE.Vector3(px(i), tipY, ROW_Z)));
  ROW_PWR.forEach((n, i) => (pinMap[n] = new THREE.Vector3(px(i), tipY, -ROW_Z)));
  pinMap.GP25 = new THREE.Vector3(LED_POS[0], TOP + 0.08, LED_POS[1]); // on-board LED, not on the header
  const aliases = { LED: 'GP25', LED_BUILTIN: 'GP25', ADC0: 'GP26', ADC1: 'GP27', ADC2: 'GP28', VREF: 'ADC_VREF', '3.3V': '3V3', '3V3EN': '3V3_EN', EN: '3V3_EN', RESET: 'RUN' };
  const resolver = (n) => {
    const mm = /^(?:GP|GPIO|D|P)?(\d+)$/.exec(n);
    return mm ? `GP${+mm[1]}` : null;
  };
  // physical pin numbers 1..40
  ROW_GP.forEach((n, i) => (aliases[`PIN${i + 1}`] = n));
  ROW_PWR.forEach((n, i) => (aliases[`PIN${40 - i}`] = n));
  const lookup = pinLookup('Pico-style', g, pinMap, aliases, resolver);
  const mid = (z, a, b) => new THREE.Vector3((px(a) + px(b)) / 2, tipY, z);

  return {
    id: 'pico',
    name: 'Pico-style',
    group: g,
    pins: [...ROW_GP, ...ROW_PWR],
    ledPin: 'GP25',
    pin: lookup.pin,
    resolve: lookup.resolve,
    setBuiltinLed(level) { led.set(level); },
    anchors: {
      usb: new THREE.Vector3(-2.37, TOP + 0.35, 0),
      chip: new THREE.Vector3(0.22, TOP + 0.12, 0),
      flash: new THREE.Vector3(-0.78, TOP + 0.13, -0.02),
      crystal: new THREE.Vector3(1.02, TOP + 0.1, 0.34),
      bootsel: new THREE.Vector3(BOOT_POS[0], TOP + 0.2, BOOT_POS[1]),
      led: new THREE.Vector3(LED_POS[0], TOP + 0.1, LED_POS[1]),
      power: mid(-ROW_Z, 0, 5),
      headerLeft: mid(ROW_Z, 0, 19),
      headerRight: mid(-ROW_Z, 0, 19),
      gpio: mid(ROW_Z, 0, 19),
      adc: mid(-ROW_Z, 6, 9),
      debug: new THREE.Vector3(2.42, TOP + 0.01, 0),
      castellations: new THREE.Vector3(0, TOP, D / 2),
      gnd: pinMap.GND.clone(),
    },
  };
}
