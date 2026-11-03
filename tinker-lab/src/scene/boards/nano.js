// A procedurally built Nano-style board (4.3 × 1.8 cm). Two rows of 15
// male pins point UP so female jumper wires plug onto them from above.
// Long side on X, mini-USB at -x.
import * as THREE from 'three';
import {
  PITCH, MALE_TIP, makePCB, makeSilk, text, drawTraces, pad, chipIC, passives, crystal, smdLed, tactSwitch, miniUSB, headerBase, pinField, pinLookup,
} from './parts.js';

const W = 4.3, D = 1.8;
const TOP = 0.16;
const ROW_Z = 0.762; // rows are 0.6" apart
const X0 = -1.778; // first pin (USB end)
// USB end → far end, row at -z then row at +z (top view, USB on the left)
const ROW_A = ['D13', '3V3', 'AREF', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', '5V', 'RESET_2', 'GND_2', 'VIN'];
const ROW_B = ['D12', 'D11', 'D10', 'D9', 'D8', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'GND', 'RESET', 'D0', 'D1'];
const LABEL = { AREF: 'REF', RESET: 'RST', RESET_2: 'RST', GND_2: 'GND', D0: 'RX0', D1: 'TX1' };
const HOLES = [[-2.03, -0.76, 0.065], [-2.03, 0.76, 0.065], [2.03, -0.76, 0.065], [2.03, 0.76, 0.065]];
const LEDS = [['TX', 0xf4c03b, -0.3], ['RX', 0xf4c03b, -0.1], ['PWR', 0x52d27a, 0.1], ['L', 0xf4a83b, 0.3]];
const LED_X = -0.98;

const px = (i) => X0 + i * PITCH;

function silkscreen(ctx, t) {
  const { px: cx, pz: cz, s } = t;
  const f = (cm) => cm * s;
  drawTraces(ctx, t, { rects: [[-1.9, -0.45, 1.9, 0.45]], n: 22, seed: 328, width: 0.035 });
  // pin labels between the rows
  [[ROW_A, -1], [ROW_B, 1]].forEach(([row, side]) =>
    row.forEach((name, i) => text(ctx, LABEL[name] ?? name, cx(px(i)), cz(side * 0.535), { size: f(0.095), maxW: f(0.235) })));
  // pin-1 marker (TX1) and pin-30 count
  ctx.strokeStyle = '#eef0f6';
  ctx.lineWidth = f(0.02);
  ctx.strokeRect(cx(px(14) - 0.14), cz(0.762 - 0.14), f(0.28), f(0.28));
  // ICSP pads
  for (const x of [1.55, 1.805]) for (const z of [-0.254, 0, 0.254]) pad(ctx, t, x, z, 0.13, 0.13, { round: true, hole: true });
  pad(ctx, t, 1.55, -0.254, 0.13, 0.13, { hole: true });
  text(ctx, 'ICSP', cx(1.68), cz(-0.42), { size: f(0.07) });
  // LED labels
  for (const [name, , z] of LEDS) text(ctx, name, cx(LED_X + 0.13), cz(z), { size: f(0.075), align: 'left' });
  text(ctx, 'RESET', cx(-0.35), cz(-0.3), { size: f(0.07) });
  text(ctx, '16MHz', cx(1.3), cz(0.02), { size: f(0.06) });
  // board name along the far edge
  text(ctx, 'TINKER LAB · NANO-STYLE', cx(2.03), cz(0), { size: f(0.1), rot: -Math.PI / 2, weight: 700, maxW: f(1.2) });
}

export function makeNano() {
  const g = new THREE.Group();
  g.name = 'board-nano';
  makePCB(g, { w: W, d: D, color: 0x2f4c97, radius: 0.08, holes: HOLES, baseT: 0.04, thick: 0.12 });
  makeSilk(g, W, D, TOP, silkscreen, 2048);

  const on = (obj, x, z, rotY = 0) => {
    obj.position.set(x, obj.position.y + TOP, z);
    obj.rotation.y = rotY;
    g.add(obj);
    return obj;
  };

  on(miniUSB(), -1.85, 0);
  on(tactSwitch({ w: 0.42, d: 0.32, capColor: 0xf1efe6, capR: 0.09 }), -0.35, 0);
  on(chipIC({
    w: 0.62, h: 0.09, legsX: 8, legsZ: 8, legLen: 0.08, legW: 0.022, pitch: 0.065, res: 256,
    lines: [{ t: 'ATMEGA328P', size: 0.13, y: 0.45 }, { t: 'AU 2214', size: 0.1, y: 0.62 }],
  }), 0.55, 0);
  on(crystal({ w: 0.32, d: 0.13, h: 0.1 }), 1.3, -0.17);
  g.add(passives([
    [-1.25, 0.24, Math.PI / 2, 'd'], [-1.25, -0.24, Math.PI / 2, 'c'], [0.05, 0.36, 0, 'r'], [0.05, -0.36, 0, 'c'],
    [1.05, 0.3, Math.PI / 2, 'c'], [1.05, -0.05, Math.PI / 2, 'r'], [1.32, 0.2, 0, 'c'], [-0.35, 0.33, 0, 'r'],
    [1.05, -0.33, Math.PI / 2, 'c'], [-0.72, 0, Math.PI / 2, 'r'],
  ], TOP));

  const leds = {};
  for (const [name, color, z] of LEDS) {
    const led = smdLed(color, { w: 0.12, d: 0.08, h: 0.06, glowSize: 0.7 });
    on(led.group, LED_X, z);
    leds[name] = led;
  }
  leds.PWR.set(0.7);

  // headers: plastic strips + one instanced field of pins
  on(headerBase(15, 1), 0, -ROW_Z);
  on(headerBase(15, 1), 0, ROW_Z);
  const pts = [];
  for (let i = 0; i < 15; i++) pts.push([px(i), -ROW_Z], [px(i), ROW_Z]);
  g.add(pinField(pts, TOP));

  const pinMap = {};
  const tipY = TOP + MALE_TIP;
  ROW_A.forEach((n, i) => (pinMap[n] = new THREE.Vector3(px(i), tipY, -ROW_Z)));
  ROW_B.forEach((n, i) => (pinMap[n] = new THREE.Vector3(px(i), tipY, ROW_Z)));
  const aliases = { RX0: 'D0', TX1: 'D1', RX: 'D0', TX: 'D1', REF: 'AREF', RST: 'RESET', '3.3V': '3V3', LED: 'D13', LED_BUILTIN: 'D13' };
  const lookup = pinLookup('Nano-style', g, pinMap, aliases, (n) => (/^\d+$/.test(n) ? `D${n}` : null));
  const mid = (row, z, a, b) => new THREE.Vector3((px(a) + px(b)) / 2, tipY, z);

  return {
    id: 'nano',
    name: 'Nano-style',
    group: g,
    pins: [...ROW_A, ...ROW_B],
    pin: lookup.pin,
    resolve: lookup.resolve,
    setBuiltinLed(level) { leds.L.set(level); },
    anchors: {
      usb: new THREE.Vector3(-1.85, TOP + 0.45, 0),
      chip: new THREE.Vector3(0.55, TOP + 0.15, 0),
      reset: new THREE.Vector3(-0.35, TOP + 0.2, 0),
      leds: new THREE.Vector3(LED_X, TOP + 0.1, 0),
      lLed: new THREE.Vector3(LED_X, TOP + 0.1, 0.3),
      crystal: new THREE.Vector3(1.3, TOP + 0.1, -0.17),
      icsp: new THREE.Vector3(1.68, TOP + 0.02, 0),
      headerLeft: mid(ROW_A, -ROW_Z, 0, 14),
      headerRight: mid(ROW_B, ROW_Z, 0, 14),
      digital: mid(ROW_B, ROW_Z, 0, 10),
      analog: mid(ROW_A, -ROW_Z, 3, 10),
      power: mid(ROW_A, -ROW_Z, 11, 14),
      d13: pinMap.D13.clone(),
      gnd: pinMap.GND.clone(),
    },
  };
}
