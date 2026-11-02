// Actuator modules: 28BYJ-48 stepper + ULN2003 driver, 1-channel relay,
// a desk lamp to switch, and the L298N dual H-bridge.
import {
  THREE, V, mat, mesh, box, cyl, at, glowSprite, metal, slab, roundedRectShape,
  makeBreakout, freeApi, decal, textDecal, soic, smd, smdField, smdLed, thtLed, dipOnPcb, jst, cable,
  screwTerminal, electrolytic, emissiveMat, noRay, PITCH, PCB, PCB_T, MONO, SANS,
  live,
} from './common.js';
import { glowPool } from '../kit.js';

// ================================================================= stepper
/** Half-step coil pattern [A, B, C, D]. */
const HALF_STEPS = [
  [1, 0, 0, 0], [1, 1, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0],
  [0, 0, 1, 0], [0, 0, 1, 1], [0, 0, 0, 1], [1, 0, 0, 1],
];
const STEPS_PER_REV = 4096; // half-steps per output revolution (2048 full steps, 64:1 gearbox)

/**
 * 28BYJ-48 stepper (shaft up, white pointer disc) wired to a ULN2003 driver
 * board placed to its right (+x). Driver pins IN1–IN4, VCC, GND.
 * step(dir) = one HALF-step (4096 per revolution = 2048 full steps × 2).
 */
export function makeStepper(pos, opts = {}) {
  const g = new THREE.Group();
  // ---- motor
  const R = 1.4, H = 1.9;
  const silver = mat(0xcfccc4, { metal: 0.55, rough: 0.32 });
  g.add(at(cyl(R, R, H, silver, { seg: 40 }), 0, H / 2, 0));
  g.add(at(cyl(R + 0.01, R + 0.01, 0.08, mat(0xa9a69e, { metal: 0.5, rough: 0.4 }), { seg: 40, outline: false }), 0, 0.3, 0));
  // flange with ears (shape y → −z)
  const ear = new THREE.Shape();
  const EW = 2.1, ER = 0.35;
  ear.absarc(EW - ER, 0, ER, -Math.PI / 2, Math.PI / 2, false);
  ear.absarc(-EW + ER, 0, ER, Math.PI / 2, Math.PI * 1.5, false);
  ear.closePath();
  for (const s of [-1, 1]) {
    const hp = new THREE.Path();
    hp.absarc(s * 1.75, 0, 0.2, 0, Math.PI * 2, true);
    ear.holes.push(hp);
  }
  const earSlab = slab(ear, 0.08, silver);
  earSlab.position.y = H;
  g.add(earSlab);
  const cap = new THREE.Shape();
  cap.absarc(0, 0, R + 0.02, 0, Math.PI * 2, false);
  const capSlab = slab(cap, 0.1, silver);
  capSlab.position.y = H;
  g.add(capSlab);
  // blue wire cover on the +z side
  const blue = mat(0x2f63cf, { rough: 0.5 });
  g.add(at(box(1.72, 1.6, 0.6, blue), 0, 0.82, R - 0.12));
  g.add(at(box(1.5, 0.22, 0.35, blue), 0, 0.2, R + 0.25));
  // shaft + pointer (rotor)
  const SZ = -0.8;
  g.add(at(cyl(0.46, 0.46, 0.16, silver, { seg: 28 }), 0, H + 0.18, SZ));
  const rotor = new THREE.Group();
  rotor.position.set(0, H + 0.26, SZ);
  const shaft = cyl(0.25, 0.25, 0.85, mat(0xe0b64a, { metal: 0.6, rough: 0.35 }), { seg: 20 });
  rotor.add(at(shaft, 0, 0.42, 0));
  const disc = new THREE.Group();
  disc.add(at(cyl(0.95, 0.95, 0.09, mat(0xf4f1e8, { rough: 0.5 }), { seg: 40 }), 0, 0, 0));
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(-0.09, 0);
  arrowShape.lineTo(-0.09, 0.55);
  arrowShape.lineTo(-0.2, 0.55);
  arrowShape.lineTo(0, 0.86);
  arrowShape.lineTo(0.2, 0.55);
  arrowShape.lineTo(0.09, 0.55);
  arrowShape.lineTo(0.09, 0);
  arrowShape.closePath();
  const arrowGeo = new THREE.ShapeGeometry(arrowShape);
  arrowGeo.rotateX(-Math.PI / 2);
  const arrow = new THREE.Mesh(arrowGeo, mat(0xe5412e, { rough: 0.5 }));
  arrow.position.y = 0.047;
  disc.add(arrow);
  disc.add(at(cyl(0.14, 0.14, 0.04, mat(0x2a2c33), { seg: 16, outline: false }), 0, 0.06, 0));
  // tick marks every 30°
  const ticks = decal(1.9, 1.9, (ctx, w) => {
    ctx.strokeStyle = '#6e6a60';
    ctx.lineWidth = w * 0.012;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(w / 2 + Math.sin(a) * w * 0.4, w / 2 - Math.cos(a) * w * 0.4);
      ctx.lineTo(w / 2 + Math.sin(a) * w * 0.47, w / 2 - Math.cos(a) * w * 0.47);
      ctx.stroke();
    }
  });
  ticks.position.y = 0.046;
  disc.add(ticks);
  disc.position.y = 0.88;
  rotor.add(disc);
  g.add(rotor);

  // ---- ULN2003 driver board (to the right)
  const DX = 4.5;
  const drv = makeBreakout({
    w: 3.5, d: 3.2, color: 0x2c7a46, pins: ['IN1', 'IN2', 'IN3', 'IN4'], pinsEdge: 'front', pinOffset: -0.75, inset: 0.22,
    headers: [{ pins: ['GND', 'VCC'], edge: 'front', offset: 1.05, inset: 0.22 }],
    pinText: { VCC: '+', GND: '−' },
    holes: [[-1.5, -1.35], [1.5, -1.35], [1.5, 1.35]], holeR: 0.13,
    silk: (P) => {
      ['A', 'B', 'C', 'D'].forEach((l, i) => P.text(l, 1.58, -1.1 + i * 0.42, 0.14, { weight: 700 }));
      P.text('5-12V', 1.05, 0.55, 0.11);
      P.text('ULN2003', -0.3, 0.55, 0.15, { weight: 700 });
      P.rect(0.05, -0.35, 2.3, 0.95, { stroke: 'rgba(255,255,255,.35)', lw: 0.018 });
    },
  });
  drv.group.position.set(DX, 0, 0);
  g.add(drv.group);
  drv.on(dipOnPcb(16, 'ULN2003APG'), 0.05, -0.35);
  const conn = jst(5);
  conn.rotation.y = Math.PI / 2;
  drv.on(conn, -1.35, -0.35);
  const leds = [0, 1, 2, 3].map((i) => {
    const l = thtLed(0xff3b2f, 0.14);
    drv.on(l.group, 1.32, -1.1 + i * 0.42);
    return l;
  });
  smdField(drv, [[-0.6, 0.85], [-0.2, 0.85], [0.2, 0.85], [0.6, 0.85]]);
  const pinsLocal = new Map();
  for (const [k, p] of drv.pinsLocal) pinsLocal.set(k, p.clone().add(drv.group.position));

  // ---- 5-wire cable: blue, pink, yellow, orange, red
  const wireCols = [0x3a6fd0, 0xf08cb4, 0xf2c230, 0xef8a2b, 0xd8443a];
  wireCols.forEach((c, i) => {
    const dx = (i - 2) * 0.1;
    const zc = -0.35 + (i - 2) * 0.25;
    g.add(cable([
      V(dx * 2.5, 0.28, R + 0.4),
      V(dx * 2.5 + 0.3, 0.12, R + 1.0),
      V(1.9, 0.1 + i * 0.02, 1.9 - i * 0.08),
      V(2.6, 0.18, zc + 0.3),
      V(DX - 1.75, 0.38, zc),
      V(DX - 1.45, 0.42, zc),
    ], c, 0.05));
  });

  let pos_ = 0;
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(1.8, 3.4, 0) });
  const show = () => {
    const ph = ((pos_ % 8) + 8) % 8;
    HALF_STEPS[ph].forEach((on, i) => leds[i].set(on));
    rotor.rotation.y = -(pos_ / STEPS_PER_REV) * Math.PI * 2;
  };
  live(api, {
    stepsPerRev: STEPS_PER_REV,
    /** Advance one half-step (dir = +1 clockwise seen from above, −1 back). */
    step(dir = 1) {
      pos_ += dir >= 0 ? 1 : -1;
      show();
      return api;
    },
    /** Jump to an absolute shaft angle in degrees (coil LEDs follow). */
    setAngle(deg) {
      pos_ = Math.round((deg / 360) * STEPS_PER_REV);
      show();
      return api;
    },
    get angle() { return (pos_ / STEPS_PER_REV) * 360; },
    get steps() { return pos_; },
    /** Coils (A–D) currently energised, e.g. [1,1,0,0]. */
    get coils() { return HALF_STEPS[((pos_ % 8) + 8) % 8].slice(); },
    /** De-energise all coils (LEDs off). */
    release() {
      leds.forEach((l) => l.set(0));
      return api;
    },
  });
  show();
  return api;
}

// ================================================================= relay
/**
 * 1-channel 5 V relay module: blue relay cube, COM/NO/NC screw terminal
 * (pin('NO'|'COM'|'NC') gives the screw tops), red power LED, green status
 * LED. Control pins IN, VCC, GND. set(on) clicks the relay.
 */
export function makeRelay(pos, opts = {}) {
  const b = makeBreakout({
    w: 5.0, d: 2.6, color: 0x1f4ea6, pins: ['IN', 'VCC', 'GND'], pinsEdge: 'left', inset: 0.2,
    holes: [[-2.15, -0.98], [-2.15, 0.98]], holeR: 0.14,
    silk: (P) => {
      P.text('PWR', -1.25, 1.05, 0.1);
      P.text('IN', -1.25, -0.72, 0.1);
      P.text('NC', 1.6, 0.5, 0.11, { weight: 700 });
      P.text('COM', 1.6, 0, 0.11, { weight: 700 });
      P.text('NO', 1.6, -0.5, 0.11, { weight: 700 });
      P.text('1 RELAY 5V', -0.9, -1.12, 0.13, { weight: 700 });
      P.rect(0.15, 0, 2.05, 1.7, { stroke: 'rgba(255,255,255,.4)', lw: 0.018 });
    },
  });
  const g = b.group;
  // relay cube
  const cube = new THREE.Group();
  const blue = mat(0x2a67d9, { rough: 0.45 });
  const CW = 1.9, CH = 1.53, CD = 1.55;
  cube.add(at(box(CW, CH, CD, blue), 0, CH / 2, 0));
  const front = textDecal(['SRD-05VDC-SL-C', '10A 250VAC  10A 30VDC', '10A 125VAC  10A 28VDC'], CW * 0.94, CH * 0.62, {
    vertical: true, color: '#e9efff', sizes: [0.2, 0.13, 0.13], font: SANS,
  });
  front.position.set(0, CH * 0.55, CD / 2 + 0.003);
  cube.add(front);
  // schematic on top + moving switch arm
  const pivot = [0.2, 0.42], ARM = 0.6;
  const angNC = -0.42, angNO = 0.42;
  const tip = (a) => [pivot[0] + Math.sin(a) * ARM, pivot[1] - Math.cos(a) * ARM];
  const topDecal = decal(CW, CD, (ctx, w, h) => {
    const s = w / CW;
    const X = (x) => (x + CW / 2) * s, Z = (z) => (z + CD / 2) * s;
    ctx.strokeStyle = '#e9efff';
    ctx.fillStyle = '#e9efff';
    ctx.lineWidth = 0.03 * s;
    ctx.lineCap = 'round';
    // coil
    ctx.strokeRect(X(-0.75), Z(-0.35), 0.5 * s, 0.7 * s);
    ctx.beginPath();
    ctx.moveTo(X(-0.75), Z(0.35));
    ctx.lineTo(X(-0.25), Z(-0.35));
    ctx.stroke();
    // dashed link coil → arm
    ctx.setLineDash([0.06 * s, 0.05 * s]);
    ctx.beginPath();
    ctx.moveTo(X(-0.25), Z(0));
    ctx.lineTo(X(0.2), Z(0));
    ctx.stroke();
    ctx.setLineDash([]);
    // contacts
    for (const [a, name] of [[angNC, 'NC'], [angNO, 'NO']]) {
      const [x, z] = tip(a);
      ctx.beginPath();
      ctx.arc(X(x), Z(z), 0.06 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `700 ${0.17 * s}px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.fillText(name, X(x + (a < 0 ? -0.1 : 0.12)), Z(z - 0.2));
    }
    ctx.beginPath();
    ctx.arc(X(pivot[0]), Z(pivot[1]), 0.07 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `700 ${0.15 * s}px ${SANS}`;
    ctx.fillText('COM', X(pivot[0]), Z(pivot[1] + 0.22));
  });
  topDecal.position.y = CH + 0.003;
  cube.add(topDecal);
  const arm = new THREE.Group();
  arm.add(at(box(0.07, 0.04, ARM, mat(0xf3d36a, { metal: 0.4, rough: 0.35 }), { outline: false }), 0, 0, -ARM / 2));
  arm.position.set(pivot[0], CH + 0.03, pivot[1]);
  cube.add(arm);
  b.on(cube, 0.15, 0);
  // terminal block on the right edge, entries facing +x
  const term = screwTerminal(3, 0x2f6fd8);
  term.rotation.y = Math.PI / 2;
  b.on(term, 2.12, 0);
  const pinsLocal = new Map(b.pinsLocal);
  term.updateMatrix();
  ['NC', 'COM', 'NO'].forEach((n, i) => pinsLocal.set(n, term.userData.screws[i].clone().applyMatrix4(term.matrix)));
  // LEDs, transistor, diode, resistors
  const pwr = smdLed(0xff3b2f);
  b.on(pwr.group, -1.25, 0.82);
  pwr.set(opts.powered === false ? 0 : 1);
  const stat = smdLed(0x3fdc6a);
  b.on(stat.group, -1.25, -0.5);
  b.on(smd(0.3, 0.26, 0.11, 0x1e2026), -0.95, 0.15);
  const diode = smd(0.4, 0.22, 0.12, 0x1e2026);
  diode.add(at(box(0.06, 0.125, 0.225, mat(0xd0d0cc), { outline: false }), 0.14, 0.0, 0));
  b.on(diode, -1.0, -0.15);
  smdField(b, [[-1.55, 0.45, Math.PI / 2], [-1.55, -0.2, Math.PI / 2], [-0.95, 0.55]]);

  let on = false, click = 0, armA = angNC;
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0.15, 2.4, 0) });
  live(api, {
    get on() { return on; },
    /** Energise (true) or release (false) the coil. */
    set(v) {
      v = !!v;
      if (v !== on) click = 1;
      on = v;
      stat.set(on ? 1 : 0);
      return api;
    },
    /** Alias for pin('NO'|'COM'|'NC'). */
    terminal(name) { return api.pin(name); },
    tick(dt) {
      const target = on ? angNO : angNC;
      armA += (target - armA) * Math.min(1, dt * 40);
      arm.rotation.y = -armA;
      if (click > 0) {
        click = Math.max(0, click - dt * 8);
        const k = Math.sin(click * Math.PI);
        cube.scale.set(1 + k * 0.02, 1 - k * 0.04, 1 + k * 0.02);
      }
    },
  });
  arm.rotation.y = -armA;
  return api;
}

// ================================================================= lamp
/** Small desk lamp with a glowing bulb. terminal(0|1) are its two screw-terminal tops. */
export function makeLamp(pos, opts = {}) {
  const g = new THREE.Group();
  const col = opts.color ?? 0x2aa7a1;
  const body = mat(col, { rough: 0.5 });
  g.add(at(cyl(1.55, 1.7, 0.45, body, { seg: 36 }), 0, 0.225, 0));
  g.add(at(cyl(1.3, 1.3, 0.04, mat(0xf3f1e8), { seg: 36, outline: false }), 0, 0.47, 0));
  // terminal block on the base
  const term = screwTerminal(2, 0x3aa65a);
  term.scale.setScalar(0.85);
  term.position.set(0.45, 0.47, 0.35);
  g.add(term);
  // arm
  const joint = (p) => g.add(at(mesh(new THREE.SphereGeometry(0.2, 16, 12), mat(0x2a2c33)), p.x, p.y, p.z));
  const a0 = V(-0.3, 0.5, -0.9), a1 = V(-0.3, 3.8, -1.5), a2 = V(-0.3, 4.9, 0.9);
  const seg = (a, b) => {
    const d = new THREE.Vector3().subVectors(b, a);
    const m = cyl(0.11, 0.11, d.length(), body, { seg: 12 });
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    g.add(m);
  };
  seg(a0, a1);
  seg(a1, a2);
  joint(a0);
  joint(a1);
  joint(a2);
  // head: open shade pointing down
  const head = new THREE.Group();
  head.position.copy(a2);
  head.rotation.x = -0.5;
  const shadeOut = mesh(new THREE.CylinderGeometry(0.45, 1.35, 1.4, 32, 1, true), mat(col, { rough: 0.45, side: THREE.DoubleSide }));
  head.add(at(shadeOut, 0, -0.9, 0));
  const inner = mat(0xfff4d6, { emissive: 0xffd98a, emissiveIntensity: 0, unique: true, side: THREE.BackSide });
  head.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.43, 1.32, 1.36, 32, 1, true), inner), 0, -0.9, 0));
  head.add(at(cyl(0.45, 0.45, 0.25, body, { seg: 24 }), 0, -0.1, 0));
  const bulbMat = mat(0xfff6dc, { emissive: 0xffe2a0, emissiveIntensity: 0, unique: true, rough: 0.3 });
  head.add(at(mesh(new THREE.SphereGeometry(0.5, 24, 16), bulbMat, { outline: false }), 0, -1.4, 0));
  const glow = glowSprite(0xffd27a, 4.2);
  glow.position.set(0, -1.95, 0);
  head.add(glow);
  const light = new THREE.PointLight(0xffd99a, 0, 14, 1.4);
  light.position.set(0, -2.0, 0);
  head.add(light);
  g.add(head);
  const pool = glowPool(0xffd27a, 7);
  pool.position.set(-0.3, 0.02, 2.6);
  g.add(pool);
  g.position.copy(pos ?? V());
  g.rotation.y = opts.rotY ?? 0;
  g.updateMatrixWorld(true);
  let on = false;
  const api = {
    group: g,
    pick: g,
    anchor: g.localToWorld(V(-0.3, 6.0, 0.6)),
    get on() { return on; },
    set(v) {
      on = !!v;
      const k = on ? 1 : 0;
      bulbMat.emissiveIntensity = k * 2.4;
      inner.emissiveIntensity = k * 0.8;
      glow.material.opacity = k * 0.95;
      light.intensity = k * 9;
      pool.material.opacity = k * 0.6;
      return api;
    },
    /** World position of terminal i (0 or 1) — where the wires from the relay land. */
    terminal(i = 0) {
      g.updateWorldMatrix(true, false);
      term.updateMatrix();
      return g.localToWorld(term.userData.screws[i ? 1 : 0].clone().applyMatrix4(term.matrix));
    },
  };
  return api;
}

// ================================================================= L298N
/**
 * L298N dual H-bridge: red PCB, finned heatsink, OUT1–OUT4 screw terminals,
 * power terminal 12V/GND/5V and control pins ENA IN1 IN2 IN3 IN4 ENB.
 * pin() also accepts 'OUT1'..'OUT4' (screw tops). opts.jumpers: show ENA/ENB caps.
 */
export function makeL298N(pos, opts = {}) {
  const S = 4.35;
  const b = makeBreakout({
    w: S, d: S, color: 0xc0342b, pins: ['ENA', 'IN1', 'IN2', 'IN3', 'IN4', 'ENB'], pinsEdge: 'front', pinOffset: 0.95, inset: 0.48, labelSide: 'out',
    holes: [[-1.9, -1.9], [1.9, -1.9], [-1.9, 1.9], [1.9, 1.9]], holeR: 0.15,
    silk: (P) => {
      P.text('OUT1', -1.15, -1.3, 0.12, { weight: 700 });
      P.text('OUT2', -1.15, 0.05, 0.12, { weight: 700 });
      P.text('OUT3', 1.15, -1.3, 0.12, { weight: 700 });
      P.text('OUT4', 1.15, 0.05, 0.12, { weight: 700 });
      P.text('12V', -1.6, 1.15, 0.11, { weight: 700 });
      P.text('GND', -1.1, 1.15, 0.11, { weight: 700 });
      P.text('5V', -0.6, 1.15, 0.11, { weight: 700 });
      P.text('5V-EN', 0.0, 1.15, 0.09);
      P.text('L298N', 0.95, 0.55, 0.2, { weight: 700 });
    },
  });
  const g = b.group;
  // ENA/ENB 5 V header pins behind the control row
  for (const x of [0.95 - 2.5 * PITCH, 0.95 + 2.5 * PITCH]) {
    const z = S / 2 - 0.48 - PITCH;
    b.on(box(PITCH, 0.25, PITCH, mat(0x23262e, { rough: 0.8 })), x, z, 0.125);
    b.on(box(0.064, 0.8, 0.064, metal(), { outline: false }), x, z, 0.4);
    if (opts.jumpers) b.on(box(0.24, 0.6, 0.5, mat(0x1d1e23)), x, z + PITCH / 2, 0.55);
  }
  // heatsink
  const hs = new THREE.Group();
  const black = mat(0x1e1f24, { rough: 0.55, metal: 0.3 });
  hs.add(at(box(2.3, 2.5, 0.28, black), 0, 1.25, 0));
  for (let i = 0; i < 8; i++) hs.add(at(box(0.12, 2.5, 0.85, black), -1.09 + i * 0.311, 1.25, -0.56));
  b.on(hs, 0, -0.95);
  // L298 multiwatt package against the heatsink
  const chip = new THREE.Group();
  chip.add(at(box(2.0, 1.05, 0.45, mat(0x26272c, { rough: 0.5 })), 0, 1.15, 0));
  chip.add(at(box(2.0, 0.55, 0.12, metal()), 0, 1.65, -0.12));
  const lab = textDecal(['L298N', 'MULTIWATT15'], 1.6, 0.6, { vertical: true, color: '#c9ccd4', sizes: [0.36, 0.2] });
  lab.position.set(0, 1.1, 0.228);
  chip.add(lab);
  const legs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 1, 0.05), metal(), 15);
  const t = new THREE.Object3D();
  for (let i = 0; i < 15; i++) {
    t.position.set(-0.89 + i * 0.127, 0.31, i % 2 ? 0.12 : 0.3);
    t.scale.set(1, 0.62, 1);
    t.updateMatrix();
    legs.setMatrixAt(i, t.matrix);
  }
  chip.add(legs);
  b.on(chip, 0, -0.58);
  // screw terminals
  const pinsLocal = new Map(b.pinsLocal);
  const addTerm = (n, x, z, rot, names) => {
    const tb = screwTerminal(n, 0x2f6fd8);
    tb.rotation.y = rot;
    b.on(tb, x, z);
    tb.updateMatrix();
    names.forEach((nm, i) => pinsLocal.set(nm, tb.userData.screws[i].clone().applyMatrix4(tb.matrix)));
  };
  addTerm(2, -1.78, -0.62, -Math.PI / 2, ['OUT1', 'OUT2']);
  addTerm(2, 1.78, -0.62, Math.PI / 2, ['OUT4', 'OUT3']);
  addTerm(3, -1.1, 1.78, 0, ['12V', 'GND', '5V']);
  // regulator, caps, LED, diodes
  const reg = new THREE.Group();
  reg.add(at(box(0.65, 0.22, 0.6, mat(0x26272c)), 0, 0.11, 0));
  reg.add(at(box(0.5, 0.03, 0.25, metal()), 0, 0.02, -0.4));
  b.on(reg, 0.2, 0.25);
  b.on(electrolytic(0.33, 0.95), -0.95, 0.35);
  b.on(electrolytic(0.33, 0.95), 1.45, 0.75);
  b.on(box(0.24, 0.5, 0.5, mat(0x1d1e23)), -0.05, 1.45, 0.25);
  const led = smdLed(0xff3b2f);
  b.on(led.group, -0.35, 0.85);
  led.set(opts.powered === false ? 0 : 1);
  for (let i = 0; i < 4; i++) {
    b.on(smd(0.34, 0.2, 0.12, 0x1e2026), -1.25 + (i % 2) * 0.42, i < 2 ? -0.05 : 0.2);
    b.on(smd(0.34, 0.2, 0.12, 0x1e2026), 0.85 + (i % 2) * 0.42, i < 2 ? -0.05 : 0.2);
  }
  smdField(b, [[0.6, 0.25, Math.PI / 2], [-0.35, 0.55], [0.55, 0.85]]);
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, 3.6, 0) });
  api.setPower = (v) => { led.set(v ? 1 : 0); return api; };
  return api;
}
