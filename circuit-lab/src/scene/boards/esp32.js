// A procedurally built ESP32 DevKit V1-style board (30 pins, 5.2 × 2.8 cm).
// Long side on X: micro-USB at -x, the WROOM module and its PCB antenna
// at +x. Two rows of 15 male pins point UP.
import * as THREE from 'three';
import { mat, mesh, at, canvasTexture } from '../kit.js';
import {
  PITCH, MALE_TIP, FONT, MONO, makePCB, makeSilk, text, drawTraces, chipIC, sot223, sot23, passives, smdLed, tactSwitch, microUSB, headerBase, pinField, pinLookup, texMat, rng, shellMetal,
} from './parts.js';

const W = 5.2, D = 2.8;
const TOP = 0.16;
const ROW_Z = 1.27; // rows 1" apart
const X_ANT = 1.705; // pin index 0 (antenna end)
// index 0 = antenna end. Row at -z is the "left" column of the usual pinout diagram.
const ROW_L = ['EN', 'VP', 'VN', 'GPIO34', 'GPIO35', 'GPIO32', 'GPIO33', 'GPIO25', 'GPIO26', 'GPIO27', 'GPIO14', 'GPIO12', 'GND', 'GPIO13', 'VIN'];
const ROW_R = ['GPIO23', 'GPIO22', 'TX0', 'RX0', 'GPIO21', 'GPIO19', 'GPIO18', 'GPIO5', 'GPIO17', 'GPIO16', 'GPIO4', 'GPIO2', 'GPIO15', 'GND_2', '3V3'];
const MOD = { x: 1.275, w: 2.55, d: 1.8 }; // module PCB centre / size
const CAN = { x: 0.95, w: 1.8, d: 1.6, h: 0.26 }; // RF shield
const BTN_X = -2.12, BTN_Z = 0.68;

const px = (i) => X_ANT - i * PITCH;
const label = (n) => n.replace(/^GPIO/, 'D').replace(/_\d+$/, '');

function silkscreen(ctx, t) {
  const { px: cx, pz: cz, s } = t;
  const f = (cm) => cm * s;
  drawTraces(ctx, t, { rects: [[-2.5, -0.85, -0.05, 0.85], [-1.9, -0.95, 0.1, 0.95]], n: 30, seed: 32, color: 'rgba(120,135,160,.35)', via: 'rgba(170,180,200,.5)', width: 0.04 });
  [[ROW_L, -1], [ROW_R, 1]].forEach(([row, side]) =>
    row.forEach((name, i) => text(ctx, label(name), cx(px(i)), cz(side * 1.02), { size: f(0.1), maxW: f(0.24) })));
  text(ctx, 'EN', cx(BTN_X + 0.3), cz(-BTN_Z), { size: f(0.1), align: 'left' });
  text(ctx, 'BOOT', cx(BTN_X + 0.3), cz(BTN_Z), { size: f(0.1), align: 'left' });
  text(ctx, 'PWR', cx(-0.42), cz(-0.62), { size: f(0.075), align: 'left' });
  text(ctx, 'IO2', cx(-0.42), cz(0.62), { size: f(0.075), align: 'left' });
  text(ctx, 'ESP32 DEVKIT', cx(-0.48), cz(-0.1), { size: f(0.135), weight: 700, maxW: f(0.72) });
  text(ctx, 'CIRCUIT LAB · V1-STYLE', cx(-0.48), cz(0.1), { size: f(0.075), maxW: f(0.7) });
  // antenna keep-out marker under the module tip
  ctx.strokeStyle = 'rgba(238,240,246,.55)';
  ctx.lineWidth = f(0.015);
  ctx.setLineDash([f(0.05), f(0.04)]);
  ctx.strokeRect(cx(1.9), cz(-1.05), f(0.68), f(2.1));
  ctx.setLineDash([]);
}

/** Module PCB top: dark solder mask, gold castellated pads, meander antenna. */
function moduleTexture() {
  const s = 300; // px per cm
  const w = Math.round(MOD.w * s), h = Math.round(MOD.d * s);
  return canvasTexture(w, h, (ctx) => {
    const X = (x) => (x + MOD.w / 2) * s, Z = (z) => (z + MOD.d / 2) * s;
    ctx.fillStyle = '#1b1e25';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d4b25e';
    // castellated pads along both long sides and the inner short side
    for (let i = 0; i < 14; i++) {
      const x = -1.2 + i * 0.127;
      for (const z of [-MOD.d / 2, MOD.d / 2 - 0.08]) ctx.fillRect(X(x - 0.035), Z(z), 0.07 * s, 0.08 * s);
    }
    for (let i = 0; i < 10; i++) ctx.fillRect(X(-MOD.w / 2), Z(-0.6 + i * 0.127 - 0.035), 0.08 * s, 0.07 * s);
    // meander antenna
    ctx.strokeStyle = '#d4b25e';
    ctx.lineWidth = 0.035 * s;
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    const x0 = 0.7, x1 = 1.17, z0 = -0.62, z1 = 0.66;
    ctx.moveTo(X(x0 - 0.06), Z(z1));
    ctx.lineTo(X(x0), Z(z1));
    let z = z1, k = 0;
    for (let x = x0; x <= x1 + 1e-6; x += 0.094) {
      const zz = k % 2 ? z1 - 0.1 : z0;
      ctx.lineTo(X(x), Z(zz));
      if (x + 0.094 <= x1 + 1e-6) ctx.lineTo(X(x + 0.094), Z(zz));
      z = zz;
      k++;
    }
    ctx.stroke();
    ctx.fillRect(X(x0 - 0.12), Z(z1 - 0.06), 0.1 * s, 0.14 * s);
    ctx.font = `600 ${0.07 * s}px ${MONO}`;
    ctx.fillStyle = 'rgba(238,240,246,.7)';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(X(1.22), Z(0));
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('ANT', 0, 0);
    ctx.restore();
  });
}

/** Brushed-metal shield top with stamped / engraved markings. */
function shieldTexture() {
  const s = 360;
  const w = Math.round(CAN.w * s), h = Math.round(CAN.d * s);
  const r = rng(2016);
  return canvasTexture(w, h, (ctx) => {
    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#d9dbdc');
    grd.addColorStop(0.5, '#c6c9cb');
    grd.addColorStop(1, '#d3d5d6');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      ctx.strokeStyle = `rgba(${r() > 0.5 ? '255,255,255' : '90,95,100'},${0.05 + r() * 0.07})`;
      ctx.lineWidth = 1;
      const y = r() * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + (r() - 0.5) * 6);
      ctx.stroke();
    }
    const engrave = (str, x, y, size, weight = 700, font = FONT, align = 'left') => {
      ctx.font = `${weight} ${size}px ${font}`;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.fillText(str, x + 1.5, y + 1.5);
      ctx.fillStyle = 'rgba(70,74,80,.85)';
      ctx.fillText(str, x, y);
    };
    const m = 0.12 * s;
    engrave('ESP32-WROOM-32', m, 0.3 * s, 0.2 * s, 700);
    engrave('Wi-Fi · BT · BLE   4MB FLASH', m, 0.55 * s, 0.1 * s, 600);
    engrave('CIRCUIT LAB', m, 0.74 * s, 0.09 * s, 600, MONO);
    engrave('MODEL: DEVKIT-STYLE', m, 0.9 * s, 0.075 * s, 500, MONO);
    // stamped data-matrix style code
    const q = 0.42 * s, qx = w - m - q, qy = h - m - q, n = 12;
    ctx.fillStyle = 'rgba(60,64,70,.8)';
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) if (i === 0 || j === n - 1 || ((i + j) % 2 === 0 && j === 0) || (i === n - 1 && j % 2 === 0) || (i > 0 && j < n - 1 && j > 0 && r() > 0.52)) ctx.fillRect(qx + (i * q) / n, qy + (j * q) / n, q / n + 0.5, q / n + 0.5);
    // pin-1 dot
    ctx.beginPath();
    ctx.arc(m, h - m * 0.9, 0.05 * s, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function makeESP32() {
  const g = new THREE.Group();
  g.name = 'board-esp32';
  makePCB(g, { w: W, d: D, color: 0x1d2027, radius: 0.12, baseT: 0.04, thick: 0.12 });
  makeSilk(g, W, D, TOP, silkscreen, 2048);

  const on = (obj, x, z, rotY = 0, y = 0) => {
    obj.position.set(x, obj.position.y + TOP + y, z);
    obj.rotation.y = rotY;
    g.add(obj);
    return obj;
  };

  // WROOM module: PCB with antenna + metal can
  const modSide = mat(0x1b1e25, { rough: 0.6 });
  const modPcb = mesh(new THREE.BoxGeometry(MOD.w, 0.08, MOD.d), [modSide, modSide, texMat(moduleTexture(), { rough: 0.55 }), modSide, modSide, modSide]);
  on(at(modPcb, 0, 0.04, 0), MOD.x, 0);
  const canSide = shellMetal();
  const can = mesh(new THREE.BoxGeometry(CAN.w, CAN.h, CAN.d), [canSide, canSide, texMat(shieldTexture(), { rough: 0.35, metal: 0.45 }), canSide, canSide, canSide]);
  on(at(can, 0, 0.08 + CAN.h / 2, 0), CAN.x, 0);

  // USB side
  on(microUSB(), -2.42, 0);
  on(tactSwitch({ w: 0.42, d: 0.36 }), BTN_X, -BTN_Z);
  on(tactSwitch({ w: 0.42, d: 0.36 }), BTN_X, BTN_Z);
  on(chipIC({ w: 0.5, h: 0.08, legsX: 7, legsZ: 7, legLen: 0.04, pads: true, lines: [{ t: 'CP2102', size: 0.2, y: 0.45 }, { t: 'USB-UART', size: 0.12, y: 0.68 }] }), -1.1, 0.42);
  on(sot223('AMS1117'), -1.1, -0.42);
  on(sot23(), -1.68, -0.29);
  on(sot23(), -1.68, 0.29);
  g.add(passives([
    [-1.68, 0, Math.PI / 2, 'd'], [-0.08, -0.48, Math.PI / 2, 'c'], [-0.08, 0.48, Math.PI / 2, 'r'], [-1.5, -0.72, 0, 'c'], [-0.72, -0.74, 0, 'r'],
    [-1.5, 0.74, 0, 'r'], [-0.72, 0.74, 0, 'c'], [-1.97, -0.25, Math.PI / 2, 'r'], [-1.97, 0.25, Math.PI / 2, 'r'],
  ], TOP));

  const pwr = smdLed(0xe5412e, { w: 0.14, d: 0.09, h: 0.07, glowSize: 0.8, glowColor: 0xff4433 });
  on(pwr.group, -0.55, -0.62);
  pwr.set(0.8);
  const blue = smdLed(0x3b78e7, { w: 0.14, d: 0.09, h: 0.07, glowSize: 1.3, glowColor: 0x3d8bff });
  on(blue.group, -0.55, 0.62);

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
    GPIO36: 'VP', GPIO39: 'VN', GPIO1: 'TX0', GPIO3: 'RX0', TX: 'TX0', RX: 'RX0', TXD0: 'TX0', RXD0: 'RX0', TX2: 'GPIO17', RX2: 'GPIO16',
    SVP: 'VP', SVN: 'VN', RST: 'EN', RESET: 'EN', '3.3V': '3V3', '5V': 'VIN', LED: 'GPIO2', LED_BUILTIN: 'GPIO2', SDA: 'GPIO21', SCL: 'GPIO22',
  };
  const resolver = (n) => {
    const m = /^(?:D|IO|GPIO|G|P)?(\d+)$/.exec(n);
    if (!m) return null;
    const k = `GPIO${+m[1]}`;
    return pinMap[k] ? k : aliases[k] ?? null;
  };
  const lookup = pinLookup('ESP32 DevKit', g, pinMap, aliases, resolver);
  const rowMid = (z) => new THREE.Vector3(cx, tipY, z);

  return {
    id: 'esp32',
    name: 'ESP32 DevKit',
    group: g,
    pins: [...ROW_L, ...ROW_R],
    pin: lookup.pin,
    resolve: lookup.resolve,
    setBuiltinLed(level) { blue.set(level); },
    anchors: {
      usb: new THREE.Vector3(-2.42, TOP + 0.35, 0),
      chip: new THREE.Vector3(CAN.x, TOP + 0.36, 0),
      module: new THREE.Vector3(CAN.x, TOP + 0.36, 0),
      shield: new THREE.Vector3(CAN.x, TOP + 0.36, 0),
      antenna: new THREE.Vector3(2.22, TOP + 0.1, 0),
      power: new THREE.Vector3(-1.1, TOP + 0.2, -0.42),
      usbChip: new THREE.Vector3(-1.1, TOP + 0.12, 0.42),
      powerLed: new THREE.Vector3(-0.55, TOP + 0.1, -0.62),
      led: new THREE.Vector3(-0.55, TOP + 0.1, 0.62),
      en: new THREE.Vector3(BTN_X, TOP + 0.2, -BTN_Z),
      boot: new THREE.Vector3(BTN_X, TOP + 0.2, BTN_Z),
      headerLeft: rowMid(-ROW_Z),
      headerRight: rowMid(ROW_Z),
      gpio: rowMid(ROW_Z),
      gpio2: pinMap.GPIO2.clone(),
      gnd: pinMap.GND.clone(),
    },
  };
}
