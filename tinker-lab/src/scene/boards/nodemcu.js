// A procedurally built NodeMCU v3-style ESP8266 board (LoLin layout,
// 5.8 × 3.1 cm). Long side on X: micro-USB at -x, the ESP-12E module with
// its metal shield and PCB antenna at +x. Two rows of 15 male pins point UP,
// 1.1" apart. The blue LED on the ESP-12E sits on GPIO2 (D4) and is
// active-low: digitalWrite(LED_BUILTIN, LOW) lights it.
import * as THREE from 'three';
import { mat, mesh, at, canvasTexture } from '../kit.js';
import {
  PITCH, MALE_TIP, FONT, MONO, makePCB, makeSilk, text, drawTraces, pad, chipIC, sot223, sot23, passives, crystal, smdLed, tactSwitch, microUSB,
  headerBase, pinField, pinLookup, texMat, rng, shellMetal,
} from './parts.js';

const W = 5.8, D = 3.1;
const TOP = 0.16;
const ROW_Z = 1.397; // rows 1.1" apart (LoLin v3)
const X_ANT = 2.1; // pin index 0 (antenna end)
// index 0 = antenna end. Row at -z is the left column of the usual pinout
// diagram (antenna up, components facing you): A0 … VIN.
const ROW_L = ['A0', 'GND_3', 'VU', 'SD3', 'SD2', 'SD1', 'CMD', 'SD0', 'CLK', 'GND_4', '3V3_3', 'EN', 'RST', 'GND_5', 'VIN'];
// row at +z: D0 … 3V3
const ROW_R = ['D0', 'D1', 'D2', 'D3', 'D4', '3V3', 'GND', 'D5', 'D6', 'D7', 'D8', 'RX', 'TX', 'GND_2', '3V3_2'];
const SILK_L = ['A0', 'G', 'VU', 'S3', 'S2', 'S1', 'SC', 'S0', 'SK', 'G', '3V', 'EN', 'RST', 'G', 'VIN'];
const SILK_R = ['D0', 'D1', 'D2', 'D3', 'D4', '3V', 'G', 'D5', 'D6', 'D7', 'D8', 'RX', 'TX', 'G', '3V'];
const GPIO_L = ['ADC0', '', '5V', '10', '9', '8', '11', '7', '6', '', '', '', '', '', ''];
const GPIO_R = ['16', '5', '4', '0', '2', '', '', '14', '12', '13', '15', '3', '1', '', ''];
const GPIO = { D0: 16, D1: 5, D2: 4, D3: 0, D4: 2, D5: 14, D6: 12, D7: 13, D8: 15, RX: 3, TX: 1, SD3: 10, SD2: 9, SD1: 8, CMD: 11, SD0: 7, CLK: 6 };
const MOD = { x: 1.66, w: 2.4, d: 1.6 }; // ESP-12E module PCB
const CAN = { x: 1.24, w: 1.5, d: 1.2, h: 0.24 }; // its RF shield
const LED_POS = [2.28, 0.62]; // blue LED on the module (antenna end)
const BTN_X = -2.38, BTN_Z = 0.95;
const HOLES = [[-2.6, -1.24, 0.15], [-2.6, 1.24, 0.15], [2.6, -1.24, 0.15], [2.6, 1.24, 0.15]];

const px = (i) => X_ANT - i * PITCH;

function silkscreen(ctx, t) {
  const { px: cx, pz: cz, s } = t;
  const f = (cm) => cm * s;
  drawTraces(ctx, t, { rects: [[-2.5, -1.0, 0.3, 1.0], [-1.9, -1.1, 0.35, 1.1]], n: 34, seed: 8266, color: 'rgba(120,135,160,.35)', via: 'rgba(170,180,200,.5)', width: 0.04 });
  // pin names (inside) and GPIO numbers (further in, smaller)
  [[SILK_L, GPIO_L, -1], [SILK_R, GPIO_R, 1]].forEach(([names, gpios, side]) => names.forEach((n, i) => {
    text(ctx, n, cx(px(i)), cz(side * 1.14), { size: f(0.1), maxW: f(0.24), weight: 700 });
    if (gpios[i]) text(ctx, gpios[i], cx(px(i)), cz(side * 0.99), { size: f(0.072), maxW: f(0.24), color: 'rgba(238,240,246,.72)', mono: true });
  }));
  text(ctx, 'GPIO', cx(px(14) - 0.02), cz(0.84), { size: f(0.06), color: 'rgba(238,240,246,.6)', mono: true });
  // board name between the rows
  text(ctx, 'NODEMCU V3', cx(-0.6), cz(-0.32), { size: f(0.2), weight: 700, maxW: f(1.6) });
  text(ctx, 'ESP8266 · ESP-12E', cx(-0.6), cz(-0.08), { size: f(0.1), maxW: f(1.6) });
  text(ctx, 'TINKER LAB · V3-STYLE', cx(-0.6), cz(0.12), { size: f(0.085), maxW: f(1.6) });
  text(ctx, 'RST', cx(BTN_X + 0.32), cz(-BTN_Z), { size: f(0.1), align: 'left', weight: 700 });
  text(ctx, 'FLASH', cx(BTN_X + 0.32), cz(BTN_Z), { size: f(0.1), align: 'left', weight: 700 });
  text(ctx, 'CH340', cx(-1.12), cz(0.73), { size: f(0.07) });
  text(ctx, '3V3 REG', cx(-1.12), cz(-0.75), { size: f(0.07) });
  // flash-pin warning bracket under SD3…CLK
  ctx.strokeStyle = 'rgba(238,240,246,.55)';
  ctx.lineWidth = f(0.014);
  ctx.beginPath();
  ctx.moveTo(cx(px(3) + 0.1), cz(-0.86));
  ctx.lineTo(cx(px(3) + 0.1), cz(-0.8));
  ctx.lineTo(cx(px(8) - 0.1), cz(-0.8));
  ctx.lineTo(cx(px(8) - 0.1), cz(-0.86));
  ctx.stroke();
  text(ctx, 'SPI FLASH · DO NOT USE', cx((px(3) + px(8)) / 2), cz(-0.7), { size: f(0.055), color: 'rgba(238,240,246,.7)' });
  // module courtyard
  ctx.strokeStyle = 'rgba(238,240,246,.5)';
  ctx.setLineDash([f(0.05), f(0.04)]);
  ctx.strokeRect(cx(MOD.x - MOD.w / 2 - 0.05), cz(-MOD.d / 2 - 0.05), f(MOD.w + 0.1), f(MOD.d + 0.1));
  ctx.setLineDash([]);
}

/** ESP-12E PCB top: black mask, gold castellations, meander antenna, blue-LED pad. */
function moduleTexture() {
  const s = 300;
  const w = Math.round(MOD.w * s), h = Math.round(MOD.d * s);
  return canvasTexture(w, h, (ctx) => {
    const X = (x) => (x + MOD.w / 2) * s, Z = (z) => (z + MOD.d / 2) * s;
    ctx.fillStyle = '#16181e';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d4b25e';
    // 8 castellations along each long side, 6 on the USB-end short side
    for (let i = 0; i < 8; i++) {
      const x = -1.15 + i * 0.2;
      for (const z of [-MOD.d / 2, MOD.d / 2 - 0.09]) ctx.fillRect(X(x - 0.045), Z(z), 0.09 * s, 0.09 * s);
    }
    for (let i = 0; i < 6; i++) ctx.fillRect(X(-MOD.w / 2), Z(-0.5 + i * 0.2 - 0.045), 0.09 * s, 0.09 * s);
    // meander antenna
    ctx.strokeStyle = '#d4b25e';
    ctx.lineWidth = 0.035 * s;
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    const x0 = 0.52, x1 = 1.08, z0 = -0.6, z1 = 0.48;
    ctx.moveTo(X(x0 - 0.08), Z(z1));
    let zz = z1;
    for (let x = x0; x <= x1 + 1e-6; x += 0.093) {
      ctx.lineTo(X(x), Z(zz));
      zz = zz === z1 ? z0 : z1;
      ctx.lineTo(X(x), Z(zz));
    }
    ctx.stroke();
    ctx.fillRect(X(x0 - 0.14), Z(z1 - 0.05), 0.1 * s, 0.13 * s);
    ctx.fillStyle = 'rgba(238,240,246,.75)';
    ctx.font = `600 ${0.075 * s}px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText('ESP-12E', X(0.8), Z(0.68));
  });
}

/** Brushed shield with engraved marking. */
function shieldTexture() {
  const s = 380;
  const w = Math.round(CAN.w * s), h = Math.round(CAN.d * s);
  const r = rng(8266);
  return canvasTexture(w, h, (ctx) => {
    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#dadcdd');
    grd.addColorStop(0.5, '#c4c7c9');
    grd.addColorStop(1, '#d2d4d5');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 200; i++) {
      ctx.strokeStyle = `rgba(${r() > 0.5 ? '255,255,255' : '90,95,100'},${0.05 + r() * 0.07})`;
      const y = r() * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + (r() - 0.5) * 6);
      ctx.stroke();
    }
    const engrave = (str, x, y, size, weight = 700, font = FONT) => {
      ctx.font = `${weight} ${size}px ${font}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.fillText(str, x + 1.5, y + 1.5);
      ctx.fillStyle = 'rgba(70,74,80,.85)';
      ctx.fillText(str, x, y);
    };
    const m = 0.1 * s;
    engrave('ESP8266MOD', m, 0.24 * s, 0.17 * s, 700);
    engrave('Wi-Fi 802.11 b/g/n', m, 0.46 * s, 0.09 * s, 600);
    engrave('4MB FLASH · 80 MHz', m, 0.62 * s, 0.08 * s, 600);
    engrave('TINKER LAB', m, 0.8 * s, 0.08 * s, 600, MONO);
    engrave('MODEL: ESP-12E-STYLE', m, 0.96 * s, 0.065 * s, 500, MONO);
    ctx.fillStyle = 'rgba(60,64,70,.8)';
    ctx.beginPath();
    ctx.arc(w - m, h - m, 0.045 * s, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function makeNodeMCU() {
  const g = new THREE.Group();
  g.name = 'board-nodemcu';
  makePCB(g, { w: W, d: D, color: 0x1b1d24, radius: 0.12, holes: HOLES, baseT: 0.04, thick: 0.12 });
  makeSilk(g, W, D, TOP, silkscreen, 2048);

  const on = (obj, x, z, rotY = 0, y = 0) => {
    obj.position.set(x, obj.position.y + TOP + y, z);
    obj.rotation.y = rotY;
    g.add(obj);
    return obj;
  };

  // ESP-12E: module PCB with antenna, metal can, blue LED
  const modSide = mat(0x16181e, { rough: 0.6 });
  const modPcb = mesh(new THREE.BoxGeometry(MOD.w, 0.08, MOD.d), [modSide, modSide, texMat(moduleTexture(), { rough: 0.55 }), modSide, modSide, modSide]);
  on(at(modPcb, 0, 0.04, 0), MOD.x, 0);
  const canSide = shellMetal();
  const can = mesh(new THREE.BoxGeometry(CAN.w, CAN.h, CAN.d), [canSide, canSide, texMat(shieldTexture(), { rough: 0.35, metal: 0.45 }), canSide, canSide, canSide]);
  on(at(can, 0, 0.08 + CAN.h / 2, 0), CAN.x, 0);
  const blue = smdLed(0x3b78e7, { w: 0.12, d: 0.08, h: 0.06, glowSize: 1.3, glowColor: 0x3d8bff });
  on(blue.group, LED_POS[0], LED_POS[1], 0, 0.08);

  // USB side: micro-USB, RST + FLASH, CH340 + 12 MHz crystal, regulator
  on(microUSB(), -2.64, 0);
  on(tactSwitch({ w: 0.44, d: 0.38 }), BTN_X, -BTN_Z);
  on(tactSwitch({ w: 0.44, d: 0.38 }), BTN_X, BTN_Z);
  on(chipIC({ w: 0.98, d: 0.4, h: 0.12, legsX: 8, legLen: 0.1, legW: 0.035, pitch: 0.127, lines: [{ t: 'CH340G', size: 0.36, y: 0.5 }] }), -1.12, 0.45);
  on(crystal({ w: 0.42, d: 0.17, hc49: true }), -0.3, 0.55);
  on(sot223('AMS1117'), -1.12, -0.48);
  on(sot23(), -1.85, -0.35);
  on(sot23(), -1.85, 0.35);
  g.add(passives([
    [-1.85, 0, Math.PI / 2, 'd'], [-0.4, -0.5, 0, 'C'], [-0.4, -0.22, 0, 'c'], [-1.6, -0.8, 0, 'r'], [-0.7, -0.85, 0, 'c'],
    [-1.6, 0.85, 0, 'r'], [-0.62, 0.84, 0, 'c'], [-2.12, -0.3, Math.PI / 2, 'r'], [-2.12, 0.3, Math.PI / 2, 'r'], [0.2, 0.2, Math.PI / 2, 'c'],
    [0.2, -0.25, Math.PI / 2, 'r'], [0.05, 0.85, 0, 'r'], [0.05, -0.85, 0, 'c'],
  ], TOP));

  // headers
  const cx = (px(0) + px(14)) / 2;
  on(headerBase(15, 1), cx, -ROW_Z);
  on(headerBase(15, 1), cx, ROW_Z);
  const pts = [];
  for (let i = 0; i < 15; i++) pts.push([px(i), -ROW_Z], [px(i), ROW_Z]);
  g.add(pinField(pts, TOP));

  const tipY = TOP + MALE_TIP;
  const pinMap = {};
  ROW_L.forEach((n, i) => (pinMap[n] = new THREE.Vector3(px(i), tipY, -ROW_Z)));
  ROW_R.forEach((n, i) => (pinMap[n] = new THREE.Vector3(px(i), tipY, ROW_Z)));
  const aliases = {
    ADC0: 'A0', TOUT: 'A0', '5V': 'VU', VUSB: 'VU', VBUS: 'VU', RESET: 'RST', '3.3V': '3V3', '3V': '3V3', G: 'GND',
    LED: 'D4', LED_BUILTIN: 'D4', SDA: 'D2', SCL: 'D1', SCK: 'D5', MISO: 'D6', MOSI: 'D7', CS: 'D8', SS: 'D8', RXD0: 'RX', TXD0: 'TX', RX0: 'RX', TX0: 'TX', RXD: 'RX', TXD: 'TX',
    FLASH: 'D3', SK: 'CLK', SC: 'CMD', S0: 'SD0', S1: 'SD1', S2: 'SD2', S3: 'SD3',
  };
  for (const [n, gp] of Object.entries(GPIO)) aliases[`GPIO${gp}`] = n;
  const resolver = (n) => {
    const m = /^(?:GPIO|IO|GP)(\d+)$/.exec(n);
    return m ? aliases[`GPIO${+m[1]}`] ?? null : null;
  };
  const lookup = pinLookup('NodeMCU v3', g, pinMap, aliases, resolver);
  const rowMid = (z) => new THREE.Vector3(cx, tipY, z);

  return {
    id: 'nodemcu',
    name: 'NodeMCU v3 (ESP8266)',
    group: g,
    pins: [...ROW_L, ...ROW_R],
    /** GPIO number behind each D/RX/TX/flash pin name (for code examples). */
    gpio: { ...GPIO },
    ledPin: 'D4',
    pin: lookup.pin,
    resolve: lookup.resolve,
    /** Blue ESP-12E LED brightness 0..1 (wired active-low to GPIO2: LOW = lit). */
    setBuiltinLed(level) { blue.set(level); },
    anchors: {
      usb: new THREE.Vector3(-2.64, TOP + 0.35, 0),
      chip: new THREE.Vector3(CAN.x, TOP + 0.34, 0),
      module: new THREE.Vector3(CAN.x, TOP + 0.34, 0),
      shield: new THREE.Vector3(CAN.x, TOP + 0.34, 0),
      antenna: new THREE.Vector3(2.45, TOP + 0.1, -0.1),
      usbChip: new THREE.Vector3(-1.12, TOP + 0.14, 0.45),
      power: new THREE.Vector3(-1.12, TOP + 0.2, -0.48),
      led: new THREE.Vector3(LED_POS[0], TOP + 0.16, LED_POS[1]),
      rst: new THREE.Vector3(BTN_X, TOP + 0.2, -BTN_Z),
      reset: new THREE.Vector3(BTN_X, TOP + 0.2, -BTN_Z),
      flash: new THREE.Vector3(BTN_X, TOP + 0.2, BTN_Z),
      headerLeft: rowMid(-ROW_Z),
      headerRight: rowMid(ROW_Z),
      gpio: rowMid(ROW_Z),
      a0: pinMap.A0.clone(),
      d4: pinMap.D4.clone(),
      gnd: pinMap.GND.clone(),
    },
  };
}
