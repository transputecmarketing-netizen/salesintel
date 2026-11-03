// A procedurally built Uno-style microcontroller board.
// Units are centimetres; the board is centred on the origin, long side on X.
import * as THREE from 'three';
import { mat, mesh, box, cyl, at, canvasTexture, roundedRectShape, slab, metal, glowSprite } from './kit.js';

export const PITCH = 0.254;
const W = 6.86, D = 5.34;
const BASE_T = 0.05, PCB_T = 0.12;
export const PCB_TOP = BASE_T + PCB_T;
const HEADER_H = 0.85;

const HEADERS = [
  { x0: -0.75, z: -2.47, pins: ['SCL', 'SDA', 'AREF', 'GND', 'D13', 'D12', 'D11', 'D10', 'D9', 'D8'] },
  { x0: 1.95, z: -2.47, pins: ['D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0'] },
  { x0: -0.3, z: 2.47, pins: ['NC', 'IOREF', 'RESET', '3V3', '5V', 'GND_2', 'GND_3', 'VIN'] },
  { x0: 1.95, z: 2.47, pins: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'] },
];

let holeTex;
function headerHoleTexture() {
  holeTex ??= canvasTexture(64, 64, (ctx) => {
    ctx.fillStyle = '#2a2d36';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#0d0e12';
    ctx.fillRect(18, 18, 28, 28);
    ctx.strokeStyle = '#3c404b';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, 61, 61);
  });
  return holeTex;
}

/** Female pin header (black block with holes on top). */
export function femaleHeader(n, rows = 1) {
  const tex = headerHoleTexture().clone();
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(n, rows);
  tex.needsUpdate = true;
  const side = mat(0x23262e, { rough: 0.8 });
  const top = mat(0xffffff, { map: tex, rough: 0.8, unique: true });
  const m = mesh(new THREE.BoxGeometry(n * PITCH, HEADER_H, rows * PITCH), [side, side, top, side, side, side]);
  m.position.y = HEADER_H / 2;
  return m;
}

/** Male pin header block (pins sticking up). */
function maleHeader(cols, rows) {
  const g = new THREE.Group();
  g.add(at(box(cols * PITCH, 0.25, rows * PITCH, mat(0x23262e)), 0, 0.125, 0));
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < rows; r++) {
      const p = box(0.06, 0.6, 0.06, metal(), { outline: false });
      p.position.set((c - (cols - 1) / 2) * PITCH, 0.3, (r - (rows - 1) / 2) * PITCH);
      g.add(p);
    }
  return g;
}

function silkscreen() {
  const cw = 2048, ch = Math.round((2048 * D) / W);
  const px = (x) => ((x + W / 2) / W) * cw;
  const pz = (z) => ((z + D / 2) / D) * ch;
  const s = cw / W; // px per cm
  return canvasTexture(cw, ch, (ctx) => {
    ctx.clearRect(0, 0, cw, ch);
    // copper traces, a little lighter than the board
    ctx.strokeStyle = 'rgba(120,150,220,.35)';
    ctx.lineWidth = 7;
    ctx.lineCap = ctx.lineJoin = 'round';
    const traces = [
      [[-2.2, -0.2], [-1.2, -0.2], [-0.6, 0.4], [0.2, 0.4]],
      [[-2.6, 0.5], [-1.9, 0.5], [-1.5, 0.1], [-0.4, 0.1], [0, -0.4], [1.2, -0.4], [1.6, -1.6]],
      [[0.3, -1.5], [0.9, -1.0], [2.6, -1.0], [3.0, -0.6]],
      [[1.0, 1.7], [1.3, 1.95], [3.1, 1.95]],
      [[-0.6, 1.9], [-1.0, 1.5], [-1.0, 0.8]],
      [[2.0, -2.1], [2.0, -1.4], [2.4, -1.2]],
      [[-1.8, -1.0], [-1.0, -1.0], [-0.6, -1.6], [0.6, -1.6], [0.9, -2.1]],
    ];
    for (const t of traces) {
      ctx.beginPath();
      t.forEach(([x, z], i) => (i ? ctx.lineTo(px(x), pz(z)) : ctx.moveTo(px(x), pz(z))));
      ctx.stroke();
    }
    // vias
    ctx.fillStyle = 'rgba(200,210,235,.55)';
    for (const [x, z] of [[0.2, 0.4], [-0.4, 0.1], [3.0, -0.6], [3.1, 1.95], [-1.0, 0.8], [2.4, -1.2], [-1.8, -1.0]]) {
      ctx.beginPath();
      ctx.arc(px(x), pz(z), 9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#eef0f6';
    ctx.strokeStyle = '#eef0f6';
    // header outlines + pin labels
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    for (const h of HEADERS) {
      const back = h.z < 0;
      h.pins.forEach((name, i) => {
        const x = h.x0 + i * PITCH;
        const label = name.replace(/^D/, '').replace(/_\d$/, '').replace('3V3', '3.3V');
        ctx.save();
        ctx.translate(px(x), pz(h.z + (back ? 0.42 : -0.42)));
        ctx.rotate(-Math.PI / 2);
        ctx.font = `600 ${0.13 * s}px "Barlow Semi Condensed", sans-serif`;
        ctx.textAlign = back ? 'right' : 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label === 'NC' ? '' : label, 0, 0);
        ctx.restore();
      });
    }
    ctx.font = `600 ${0.17 * s}px "Barlow Semi Condensed", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('DIGITAL (PWM ~)', px(1.6), pz(-1.55));
    ctx.fillText('POWER', px(0.6), pz(1.85));
    ctx.fillText('ANALOG IN', px(2.6), pz(1.85));
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(px(-0.5), pz(-1.38));
    ctx.lineTo(px(3.7), pz(-1.38));
    ctx.stroke();
    // logo block
    ctx.save();
    ctx.translate(px(-0.35), pz(0.3));
    ctx.rotate(-0.0);
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.roundRect(-0.48 * s, -0.36 * s, 0.96 * s, 0.72 * s, 0.12 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-0.14 * s, -0.18 * s);
    ctx.lineTo(0.2 * s, 0);
    ctx.lineTo(-0.14 * s, 0.18 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.font = `700 ${0.3 * s}px "Barlow Semi Condensed", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('TINKER LAB', px(0.3), pz(0.3) + 0.1 * s);
    ctx.font = `600 ${0.15 * s}px "Barlow Semi Condensed", sans-serif`;
    ctx.fillText('UNO-STYLE  ·  R3 COMPATIBLE', px(0.32), pz(0.62));
    ctx.font = `600 ${0.11 * s}px "Barlow Semi Condensed", sans-serif`;
    ctx.fillText('L', px(-0.05), pz(-1.15));
    ctx.fillText('TX', px(-0.05), pz(-0.92));
    ctx.fillText('RX', px(-0.05), pz(-0.69));
    ctx.fillText('ON', px(2.85), pz(-0.8));
    ctx.fillText('RESET', px(-2.95), pz(-1.9));
  });
}

export function makeBoard() {
  const g = new THREE.Group();
  g.name = 'board';
  const shape = roundedRectShape(W, D, 0.22);
  for (const [hx, hz] of [[-2.9, 2.2], [-2.75, -2.2], [2.9, -2.2], [2.9, 1.25]]) {
    const hole = new THREE.Path();
    hole.absarc(hx, -hz, 0.16, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  g.add(slab(shape, BASE_T, mat(0xe2cfa5, { rough: 0.9 })));
  const pcb = slab(shape, PCB_T, mat(0x2f4c97, { rough: 0.55 }));
  pcb.position.y = BASE_T;
  g.add(pcb);
  // mounting hole rings
  for (const [hx, hz] of [[-2.9, 2.2], [-2.75, -2.2], [2.9, -2.2], [2.9, 1.25]]) {
    const ring = mesh(new THREE.RingGeometry(0.16, 0.28, 24), mat(0xd9d5c8, { metal: 0.4, rough: 0.4 }), { outline: false });
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(hx, PCB_TOP + 0.002, hz);
    g.add(ring);
  }
  const silk = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: silkscreen(), transparent: true, roughness: 0.6 }));
  silk.rotation.x = -Math.PI / 2;
  silk.position.y = PCB_TOP + 0.003;
  silk.receiveShadow = true;
  g.add(silk);

  const on = (obj, x, z, y = 0) => {
    obj.position.x = x;
    obj.position.z = z;
    obj.position.y += PCB_TOP + y;
    g.add(obj);
    return obj;
  };

  // USB-B port
  const usb = new THREE.Group();
  usb.add(at(box(1.6, 1.08, 1.22, mat(0xd8d1bf, { rough: 0.35, metal: 0.45 })), 0, 0.54, 0));
  usb.add(at(box(0.05, 0.62, 0.7, mat(0x3a3a3a)), -0.81, 0.56, 0));
  usb.add(at(box(0.06, 0.3, 0.4, mat(0xf2efe6)), -0.8, 0.56, 0));
  on(usb, -3.0, -1.3);
  // DC barrel jack
  const jack = new THREE.Group();
  jack.add(at(box(1.4, 1.1, 0.9, mat(0x25272d)), 0, 0.55, 0));
  const bore = cyl(0.32, 0.32, 0.1, mat(0x0c0c0e), { seg: 20 });
  bore.rotation.z = Math.PI / 2;
  jack.add(at(bore, -0.71, 0.6, 0));
  on(jack, -2.9, 1.55);
  // voltage regulator
  const reg = new THREE.Group();
  reg.add(at(box(0.6, 0.18, 0.5, mat(0x25272d)), 0, 0.09, 0));
  reg.add(at(box(0.6, 0.04, 0.35, metal()), 0, 0.02, -0.38));
  on(reg, -1.9, 2.1);
  // capacitors
  for (const [cx, cz] of [[-2.0, 0.75], [-1.3, 1.25]]) {
    const cap = new THREE.Group();
    cap.add(at(cyl(0.3, 0.3, 0.75, mat(0xbdbfba, { metal: 0.35, rough: 0.4 })), 0, 0.375, 0));
    cap.add(at(cyl(0.3, 0.3, 0.02, mat(0x8a8d8a, { metal: 0.5 }), { outline: false }), 0, 0.76, 0));
    const stripe = cyl(0.302, 0.302, 0.6, mat(0x55585a), { thetaLength: 0.7, outline: false });
    cap.add(at(stripe, 0, 0.375, 0));
    on(cap, cx, cz);
  }
  // reset button
  const rst = new THREE.Group();
  rst.add(at(box(0.6, 0.25, 0.6, metal()), 0, 0.125, 0));
  rst.add(at(cyl(0.18, 0.18, 0.2, mat(0xd8443a)), 0, 0.35, 0));
  on(rst, -2.6, -2.25);
  // crystal
  const xtal = mesh(new THREE.CapsuleGeometry(0.2, 0.55, 6, 16), mat(0xe2ded2, { metal: 0.5, rough: 0.3 }));
  xtal.rotation.z = Math.PI / 2;
  xtal.scale.set(1, 1, 0.7);
  on(xtal, -1.0, -0.45, 0.16);
  // USB interface chip and SMD bits
  on(box(0.5, 0.1, 0.5, mat(0x1e2026)), -1.5, -1.35, 0.05);
  const smd = [[-0.4, -0.15], [-0.6, 0.85], [-2.2, -0.5], [-2.4, 0.15], [0.3, -0.9], [2.3, -0.5], [-0.9, -2.0], [2.6, 0.9]];
  smd.forEach(([sx, sz], i) => on(box(0.22, 0.08, 0.12, mat(i % 2 ? 0x1e2026 : 0xcaa978)), sx, sz, 0.04));
  // ICSP headers
  const icsp = maleHeader(2, 3);
  icsp.rotation.y = Math.PI / 2;
  on(icsp, 3.15, -0.2);
  on(maleHeader(2, 3), -1.75, -2.1);

  // DIP-28 microcontroller
  const chip = new THREE.Group();
  chip.add(at(box(3.55, 0.36, 0.76, mat(0x24262c, { rough: 0.5 })), 0, 0.3, 0));
  const notch = cyl(0.09, 0.09, 0.02, mat(0x15161a), { outline: false });
  chip.add(at(notch, -1.62, 0.49, 0));
  for (let i = 0; i < 14; i++)
    for (const sz of [-1, 1]) {
      const leg = box(0.09, 0.3, 0.05, metal(), { outline: false });
      chip.add(at(leg, -1.65 + i * PITCH, 0.15, sz * 0.4));
    }
  const chipLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 0.5),
    new THREE.MeshBasicMaterial({
      transparent: true,
      map: canvasTexture(512, 106, (ctx) => {
        ctx.fillStyle = 'rgba(210,214,224,.55)';
        ctx.font = '600 42px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ATMEGA328P-PU', 256, 66);
      }),
    }),
  );
  chipLabel.rotation.x = -Math.PI / 2;
  chip.add(at(chipLabel, 0.1, 0.482, 0));
  on(chip, 1.25, 0.95, 0.12);
  // DIP socket
  on(box(3.7, 0.12, 0.95, mat(0x3a3d46)), 1.25, 0.95);

  // status LEDs: L (pin 13), TX, RX, ON
  const ledBody = (c) => box(0.16, 0.08, 0.1, mat(c, { emissive: c, emissiveIntensity: 0, unique: true }), { outline: false });
  const lLed = on(ledBody(0xf4a83b), -0.32, -1.15, 0.04);
  on(ledBody(0xf4c03b), -0.32, -0.92, 0.04);
  on(ledBody(0xf4c03b), -0.32, -0.69, 0.04);
  const onLed = on(ledBody(0x52d27a), 2.6, -0.8, 0.04);
  onLed.material.emissiveIntensity = 1.4;
  const lGlow = glowSprite(0xffa640, 1.1);
  lGlow.position.set(-0.32, PCB_TOP + 0.2, -1.15);
  g.add(lGlow);
  const onGlow = glowSprite(0x52d27a, 0.8);
  onGlow.position.set(2.6, PCB_TOP + 0.15, -0.8);
  onGlow.material.opacity = 0.7;
  g.add(onGlow);

  // female headers
  for (const h of HEADERS) {
    const hd = femaleHeader(h.pins.length);
    on(hd, h.x0 + ((h.pins.length - 1) * PITCH) / 2, h.z);
  }

  const pinMap = {};
  for (const h of HEADERS) h.pins.forEach((p, i) => (pinMap[p] = new THREE.Vector3(h.x0 + i * PITCH, PCB_TOP + HEADER_H, h.z)));

  const api = {
    group: g,
    /** World position of the top of a header socket. */
    pin(name) {
      return pinMap[name].clone().applyMatrix4(g.matrixWorld);
    },
    setBuiltinLed(level) {
      lLed.material.emissiveIntensity = level * 2.2;
      lGlow.material.opacity = level * 0.9;
    },
    anchors: {
      usb: new THREE.Vector3(-3.0, PCB_TOP + 1.1, -1.3),
      jack: new THREE.Vector3(-3.3, PCB_TOP + 0.6, 1.55),
      chip: new THREE.Vector3(1.25, PCB_TOP + 0.6, 0.95),
      digital: new THREE.Vector3(2.4, PCB_TOP + HEADER_H, -2.47),
      power: new THREE.Vector3(0.4, PCB_TOP + HEADER_H, 2.47),
      analog: new THREE.Vector3(2.6, PCB_TOP + HEADER_H, 2.47),
      reset: new THREE.Vector3(-2.6, PCB_TOP + 0.45, -2.25),
      lLed: new THREE.Vector3(-0.32, PCB_TOP + 0.1, -1.15),
      d13: pinMap.D13.clone(),
      gnd: pinMap.GND.clone(),
    },
  };
  return api;
}
