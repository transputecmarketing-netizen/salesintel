// Misc breakouts: DS3231 RTC, micro-SD card module, HC-05 Bluetooth.
import {
  THREE, V, mat, mesh, box, cyl, at, metal, slab, roundedRectShape,
  makeBreakout, freeApi, decal, textDecal, soic, qfn, smd, smdField, smdLed, tactile, electrolytic, PITCH, SANS, MONO,
  live,
} from './common.js';

// ================================================================= DS3231 RTC
/** DS3231 real-time clock with CR2032 coin cell. Pins GND, VCC, SDA, SCL. */
export function makeRTC(pos, opts = {}) {
  const b = makeBreakout({
    w: 4.2, d: 2.2, color: 0x2a5cb8, pins: ['GND', 'VCC', 'SDA', 'SCL'], pinsEdge: 'left', inset: 0.2,
    holes: [[-1.8, -0.85], [-1.8, 0.85]], holeR: 0.12,
    silk: (P) => {
      P.text('AT24C32', -0.95, 0.92, 0.09);
    },
  });
  const g = b.group;
  b.on(soic(8, { label: ['DS3231'], len: 1.0, wid: 0.7, h: 0.24, sizes: [0.36] }), -0.78, -0.22);
  b.on(soic(4, { label: '24C32', len: 0.55, wid: 0.4, sizes: [0.36] }), -0.95, 0.55);
  smdField(b, [[-0.42, 0.45, Math.PI / 2], [-1.3, 0.45, Math.PI / 2, 'cap']]);
  const led = smdLed(0xff3b2f, { glow: 0.6 });
  b.on(led.group, -0.3, 0.88);
  led.set(1);
  // coin cell holder + CR2032
  const holder = new THREE.Group();
  holder.add(at(cyl(1.08, 1.08, 0.2, mat(0x23252b), { seg: 36 }), 0, 0.1, 0));
  const cell = new THREE.Group();
  cell.add(at(cyl(1.0, 1.0, 0.32, mat(0xd8d6d0, { metal: 0.6, rough: 0.28 }), { seg: 40 }), 0, 0.16, 0));
  const lab = textDecal(['+', 'CR2032', '3V'], 1.3, 1.1, { color: '#55575c', sizes: [0.3, 0.2, 0.16], font: SANS });
  lab.position.y = 0.325;
  cell.add(lab);
  cell.position.y = 0.2;
  holder.add(cell);
  // spring clip
  holder.add(at(box(0.5, 0.06, 1.0, mat(0xd2d0c8, { metal: 0.6, rough: 0.3 })), 0.85, 0.56, 0));
  b.on(holder, 0.95, 0.0);
  return Object.assign(freeApi(g, b.pinsLocal, pos, opts, { pick: g, anchor: V(0, 1.6, 0) }), { kind: 'module', label: 'RTC module (DS3231)' });
}

// ================================================================= micro-SD module
/** Micro-SD card adapter module with a card inserted. Pins GND, VCC, MISO, MOSI, SCK, CS. */
export function makeSDCard(pos, opts = {}) {
  const b = makeBreakout({
    w: 4.2, d: 2.4, color: 0x2a5cb8, pins: ['GND', 'VCC', 'MISO', 'MOSI', 'SCK', 'CS'], pinsEdge: 'left', inset: 0.2,
    holes: [[-1.85, -1.0], [-1.85, 1.0]], holeR: 0.12,
    silk: (P) => P.text('Micro SD Card Adapter', -0.6, -0.95, 0.11, { weight: 700 }),
  });
  const g = b.group;
  // metal socket at the right with card protruding
  const sock = new THREE.Group();
  const steel = mat(0xc9c6bd, { metal: 0.6, rough: 0.3 });
  sock.add(at(box(1.45, 0.18, 1.5, steel), 0, 0.09, 0));
  for (let i = 0; i < 3; i++) sock.add(at(box(0.04, 0.02, 1.2, mat(0xa9a69e, { metal: 0.6 }), { outline: false }), -0.45 + i * 0.45, 0.185, 0));
  b.on(sock, 1.15, 0.05);
  const card = new THREE.Group();
  card.add(at(box(1.5, 0.08, 1.1, mat(0x1d1e23, { rough: 0.5 })), 0, 0.04, 0));
  const cl = decal(0.6, 1.0, (ctx, w, h) => {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#e8e8ea';
    ctx.font = `700 ${w * 0.32}px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('micro', 0, -w * 0.12);
    ctx.fillStyle = '#e5412e';
    ctx.font = `800 ${w * 0.4}px ${SANS}`;
    ctx.fillText('SD', 0, w * 0.22);
    ctx.restore();
  });
  cl.position.set(0.48, 0.082, 0);
  card.add(cl);
  b.on(card, 1.6, 0.05, 0.19);
  // regulator SOT-223 and level shifter
  const reg = new THREE.Group();
  reg.add(at(box(0.65, 0.16, 0.35, mat(0x23252b)), 0, 0.08, 0));
  reg.add(at(box(0.3, 0.03, 0.2, metal()), 0, 0.02, -0.26));
  b.on(reg, -0.95, 0.55);
  b.on(soic(7, { label: '74LVC125A', len: 0.95, wid: 0.4, sizes: [0.36] }), -0.3, -0.25);
  smdField(b, [[-1.3, -0.1, Math.PI / 2, 'cap'], [-0.35, 0.55], [0.0, 0.55], [0.35, 0.55, 0, 'cap'], [0.3, -0.7]]);
  return Object.assign(freeApi(g, b.pinsLocal, pos, opts, { pick: g, anchor: V(0.4, 1.5, 0) }), { kind: 'module', label: 'microSD card module' });
}

// ================================================================= HC-05
/**
 * HC-05 Bluetooth module (ZS-040 backplane). Pins STATE, RXD, TXD, GND, VCC, EN.
 * setLinked(on): LED blinks fast while waiting, glows steady once paired. Needs tick(dt).
 */
export function makeHC05(pos, opts = {}) {
  const b = makeBreakout({
    w: 4.4, d: 1.65, color: 0x2a5cb8, pins: ['STATE', 'RXD', 'TXD', 'GND', 'VCC', 'EN'], pinsEdge: 'left', inset: 0.18,
    silk: (P) => {
      P.text('ZS-040', -1.35, -0.68, 0.08);
      P.text('Level:3.3V', -1.25, 0.7, 0.07);
    },
  });
  const g = b.group;
  // daughterboard with castellated edges + antenna
  const dW = 2.7, dD = 1.3;
  const daughter = makeBreakout({
    w: dW, d: dD, color: 0x2e5fa8, pins: [], thickness: 0.09, radius: 0.04,
    silk: (P) => {
      // castellated pads
      for (let i = 0; i < 13; i++) {
        P.rect(-dW / 2 + 0.25 + i * 0.13, -dD / 2 + 0.04, 0.07, 0.08, { fill: '#d8b866' });
        P.rect(-dW / 2 + 0.25 + i * 0.13, dD / 2 - 0.04, 0.07, 0.08, { fill: '#d8b866' });
      }
      // antenna meander
      const x0 = dW / 2 - 0.75;
      const pts = [[x0, -0.3]];
      for (let i = 0; i < 6; i++) {
        const x = x0 + 0.1 + i * 0.1;
        pts.push([x, i % 2 ? -0.45 : 0.45], [x + 0.1, i % 2 ? -0.45 : 0.45]);
      }
      P.line(pts, { color: '#d8b866', lw: 0.035 });
    },
  });
  b.on(daughter.group, 0.65, 0);
  daughter.on(qfn(0.55, { label: 'BC417' }), -0.65, 0.05);
  daughter.on(soic(4, { len: 0.42, wid: 0.3, h: 0.1 }), 0.05, 0.05);
  daughter.on(box(0.25, 0.14, 0.2, mat(0xc9c6bd, { metal: 0.5 })), 0.35, 0.35);
  // LED + button + regulator on the backplane
  const led = smdLed(0xff3b2f);
  b.on(led.group, -0.95, 0.45);
  const btn = tactile(0x1d1e23, 0.36);
  b.on(btn, -0.95, -0.4);
  smdField(b, [[-1.25, 0.05, Math.PI / 2], [-0.9, 0.05, Math.PI / 2, 'cap']]);
  const api = freeApi(g, b.pinsLocal, pos, opts, { pick: g, anchor: V(0.3, 1.4, 0) });
  api.kind = 'module';
  api.label = 'Bluetooth module (HC-05)';
  let linked = false, t = 0;
  live(api, {
    get linked() { return linked; },
    setLinked(on = true) {
      linked = !!on;
      return api;
    },
    tick(dt) {
      t += dt;
      led.set(linked ? 1 : (t * 4) % 1 < 0.5 ? 1 : 0);
    },
  });
  led.set(1);
  return api;
}
