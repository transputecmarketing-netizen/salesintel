// Sensor modules: PIR (+ person), DHT11, IR receiver (+ remote), MPU-6050,
// soil moisture probe in a plant pot, sound / gas / flame sensors, FSR.
import {
  THREE, V, mat, mesh, box, cyl, at, glowSprite, metal, slab, roundedRectShape, canvasTexture,
  makeBreakout, freeApi, decal, textDecal, silkPlane, soic, qfn, smd, smdField, smdLed, thtLed, trimRound, trimpot3296,
  electrolytic, emissiveMat, noRay, pulseRings, cable, femaleBlock, PITCH, PCB, PCB_T, PIN_TIP, MONO, SANS,
  live,
} from './common.js';

/** Common small "comparator" sensor board bits: LM393, power + signal LEDs. */
function comparatorBits(b, o) {
  b.on(soic(4, { label: 'LM393', len: 0.6, wid: 0.4, sizes: [0.4] }), o.chip[0], o.chip[1]);
  const pwr = smdLed(0xff3b2f);
  b.on(pwr.group, o.pwr[0], o.pwr[1]);
  pwr.set(1);
  const sig = smdLed(0x3fdc6a);
  b.on(sig.group, o.sig[0], o.sig[1]);
  return { pwr, sig };
}

// ================================================================= PIR HC-SR501
/** HC-SR501 PIR: fresnel dome, two orange trim pots. Pins VCC, OUT, GND. trigger(on) pulses. */
export function makePIR(pos, opts = {}) {
  const b = makeBreakout({
    w: 3.8, d: 2.6, color: 0x2c7a46, pins: ['VCC', 'OUT', 'GND'], pinsEdge: 'left', inset: 0.2,
    holes: [[-1.62, -1.05], [-1.62, 1.05], [1.62, -1.12], [1.62, 1.12]], holeR: 0.1,
    silk: (P) => {
      P.text('TIME', 1.62, -0.28, 0.1);
      P.text('SENS', 1.62, 0.28, 0.1);
    },
  });
  const g = b.group;
  // dome: faceted white hemisphere on a square base
  const DX = 0.22;
  b.on(box(2.35, 0.25, 2.35, mat(0xf3f1ea, { rough: 0.6 })), DX, 0, 0.125);
  const domeGeo = new THREE.SphereGeometry(1.12, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = mesh(domeGeo, new THREE.MeshStandardMaterial({ color: 0xfbf9f2, roughness: 0.45, flatShading: true, transparent: true, opacity: 0.96 }), { edgeAngle: 20 });
  b.on(dome, DX, 0, 0.25);
  // dome ring
  b.on(cyl(1.16, 1.16, 0.08, mat(0xe8e4d8), { seg: 40 }), DX, 0, 0.25 + 0.04);
  // the two trim pots (TIME / SENS) on the right
  for (const z of [-0.68, 0.68]) b.on(trimRound(0xf08a2c, 0.24), 1.62, z);
  const rings = pulseRings(0xf08a2c, 1.25, 3);
  rings.group.position.set(DX, b.top + 0.4, 0);
  g.add(rings.group);
  const api = freeApi(g, b.pinsLocal, pos, opts, { pick: g, anchor: V(DX, 2.2, 0) });
  api.kind = 'sensor';
  api.label = 'PIR motion sensor (HC-SR501)';
  let on = false;
  live(api, {
    get triggered() { return on; },
    /** Show (true) / hide (false) the detection pulse. */
    trigger(v = true) {
      on = !!v;
      rings.set(on);
      return api;
    },
    tick(dt) { rings.tick(dt); },
  });
  return api;
}

// ================================================================= person
/** Friendly stylised figure (≈5 cm tall) to walk past sensors. */
export function makePerson(pos, opts = {}) {
  const g = new THREE.Group();
  const shirt = mat(opts.shirt ?? 0x3b78e7, { rough: 0.55 });
  const trousers = mat(opts.trousers ?? 0x2b2f45, { rough: 0.6 });
  const skin = mat(opts.skin ?? 0xf0c09a, { rough: 0.6 });
  const hair = mat(opts.hair ?? 0x4a2f22, { rough: 0.7 });
  for (const s of [-1, 1]) {
    g.add(at(mesh(new THREE.CapsuleGeometry(0.32, 1.3, 4, 10), trousers), s * 0.38, 0.97, 0));
    g.add(at(box(0.55, 0.3, 0.85, mat(0x24262c)), s * 0.38, 0.15, 0.12));
  }
  g.add(at(mesh(new THREE.CapsuleGeometry(0.8, 1.25, 6, 14), shirt), 0, 2.7, 0));
  for (const s of [-1, 1]) {
    const arm = mesh(new THREE.CapsuleGeometry(0.24, 1.3, 4, 10), shirt);
    arm.rotation.z = s * 0.18;
    g.add(at(arm, s * 1.0, 2.55, 0));
    g.add(at(mesh(new THREE.SphereGeometry(0.25, 12, 10), skin), s * 1.15, 1.75, 0));
  }
  const head = new THREE.Group();
  head.add(mesh(new THREE.SphereGeometry(0.72, 24, 16), skin));
  const cap = mesh(new THREE.SphereGeometry(0.75, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), hair);
  cap.rotation.x = -0.35;
  head.add(cap);
  for (const s of [-1, 1]) head.add(at(mesh(new THREE.SphereGeometry(0.08, 8, 6), mat(0x1d2440), { outline: false }), s * 0.25, 0.05, 0.66));
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 6, 16, Math.PI), mat(0x1d2440));
  smile.rotation.z = Math.PI;
  head.add(at(smile, 0, -0.18, 0.64));
  head.position.y = 4.3;
  g.add(head);
  g.position.copy(pos ?? V());
  g.rotation.y = opts.rotY ?? 0;
  g.updateMatrixWorld(true);
  return { group: g, pick: g, anchor: g.localToWorld(V(0, 5.4, 0)), head, kind: 'prop', label: 'Person figure' };
}

// ================================================================= DHT11
/** DHT11 temperature/humidity sensor on a small PCB. Pins VCC, DATA, GND. */
export function makeDHT11(pos, opts = {}) {
  const b = makeBreakout({
    w: 3.1, d: 1.45, color: 0x2a5cb8, pins: ['VCC', 'DATA', 'GND'], pinsEdge: 'left', inset: 0.2,
    holes: [[1.27, 0]], holeR: 0.14,
  });
  const g = b.group;
  const housing = new THREE.Group();
  const blue = mat(0x3b8de0, { rough: 0.55 });
  const BW = 1.55, BD = 1.2, BH = 0.55;
  housing.add(at(box(BW, BH, BD, blue), 0, BH / 2, 0));
  const grid = decal(BW * 0.9, BD * 0.86, (ctx, w, h) => {
    ctx.fillStyle = '#3b8de0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#123a6b';
    const cols = 5, rows = 4;
    const cw = w / cols, ch = h / rows;
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) {
        ctx.beginPath();
        ctx.roundRect(i * cw + cw * 0.14, j * ch + ch * 0.12, cw * 0.72, ch * 0.76, cw * 0.12);
        ctx.fill();
      }
  });
  grid.position.y = BH + 0.003;
  housing.add(grid);
  housing.add(at(textDecal('DHT11', 0.6, 0.18, { vertical: true, color: '#e9f2ff', size: 0.7, font: SANS }), 0, BH * 0.5, BD / 2 + 0.003));
  b.on(housing, 0.32, 0);
  const api = freeApi(g, b.pinsLocal, pos, opts, { pick: g, anchor: V(0, 1.5, 0) });
  api.kind = 'sensor';
  api.label = 'DHT11 temperature and humidity sensor';
  return api;
}

// ================================================================= IR receiver + remote
/** VS1838B IR receiver on a PCB, facing +z. Pins OUT, GND, VCC. flash() blinks the signal LED. */
export function makeIRReceiver(pos, opts = {}) {
  const b = makeBreakout({
    w: 1.5, d: 2.0, color: 0x25262b, pins: ['OUT', 'GND', 'VCC'], pinsEdge: 'back', inset: 0.2,
    silk: (P) => P.text('IR', 0.45, 0.2, 0.13, { weight: 700 }),
  });
  const g = b.group;
  const rx = new THREE.Group();
  const black = mat(0x1a1b1f, { rough: 0.35 });
  rx.add(at(box(0.6, 0.7, 0.42, black), 0, 0.35 + 0.2, 0));
  rx.add(at(mesh(new THREE.SphereGeometry(0.22, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), black), 0, 0.6, 0.2).rotateX(Math.PI / 2));
  rx.add(at(box(0.58, 0.04, 0.4, mat(0x9a9890, { metal: 0.5 }), { outline: false }), 0, 0.92, 0));
  for (const dx of [-0.254, 0, 0.254]) rx.add(at(box(0.05, 0.2, 0.04, metal(), { outline: false }), dx, 0.1, 0));
  b.on(rx, 0, 0.55);
  const led = smdLed(0xff3b2f);
  b.on(led.group, -0.45, 0.0);
  smdField(b, [[0.45, -0.3]]);
  let t = 0;
  const api = freeApi(g, b.pinsLocal, pos, opts, { pick: g, anchor: V(0, 1.8, 0.4) });
  api.kind = 'sensor';
  api.label = 'IR receiver module';
  live(api, {
    /** Facing point (front of the receiver dome), world. */
    front: g.localToWorld(V(0, b.top + 0.6, 0.85)),
    flash() { t = 0.25; return api; },
    tick(dt) {
      t = Math.max(0, t - dt);
      led.set(t > 0 ? (Math.sin(t * 90) > 0 ? 1 : 0.2) : 0);
    },
  });
  return api;
}

/** Small IR remote (arrows, OK, 0–9, *, #), lying flat, IR LED at the back end. flash() glows the LED. */
export function makeRemote(pos, opts = {}) {
  const g = new THREE.Group();
  const W = 4.0, L = 8.6, T = 0.6;
  g.add(slab(roundedRectShape(W, L, 0.7), T, mat(0x24252b, { rough: 0.55 })));
  // IR LED dome at the back edge
  const ledMat = mat(0x6b6f8a, { emissive: 0xff5577, emissiveIntensity: 0, unique: true, opacity: 0.85, rough: 0.2 });
  const led = mesh(new THREE.SphereGeometry(0.26, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), ledMat, { outline: false });
  led.rotation.x = -Math.PI / 2;
  g.add(at(led, 0, T / 2, -L / 2 + 0.02));
  const glow = glowSprite(0xff6a8a, 2.2);
  glow.position.set(0, T / 2, -L / 2 - 0.3);
  g.add(glow);
  // buttons
  const keys = [];
  const rows = [
    [null, '▲', null],
    ['◄', 'OK', '►'],
    [null, '▼', null],
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ];
  const z0 = -L / 2 + 1.45, dz = 0.95, dx = 1.05;
  rows.forEach((r, j) => r.forEach((k, i) => k && keys.push({ k, x: (i - 1) * dx, z: z0 + j * dz })));
  const btnGeo = new THREE.CylinderGeometry(0.36, 0.38, 0.16, 20);
  const btns = new THREE.InstancedMesh(btnGeo, mat(0x3c3e46, { rough: 0.8 }), keys.length);
  const t = new THREE.Object3D();
  keys.forEach(({ x, z }, i) => {
    t.position.set(x, T + 0.08, z);
    t.updateMatrix();
    btns.setMatrixAt(i, t.matrix);
  });
  btns.castShadow = true;
  g.add(btns);
  const labels = decal(W, L, (ctx, w, h) => {
    const s = w / W;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const { k, x, z } of keys) {
      const big = k.length === 1 && /[0-9*#]/.test(k);
      ctx.fillStyle = k === 'OK' ? '#ffd166' : '#f1efe6';
      ctx.font = `700 ${(big ? 0.36 : k === 'OK' ? 0.24 : 0.28) * s}px ${SANS}`;
      ctx.fillText(k, (x + W / 2) * s, (z + L / 2) * s + (big ? 0.02 * s : 0));
    }
  }, { res: 160 });
  labels.position.y = T + 0.165;
  g.add(labels);
  // power key
  g.add(at(cyl(0.22, 0.24, 0.12, mat(0xd8443a), { seg: 16 }), 1.2, T + 0.06, -L / 2 + 0.55));
  g.position.copy(pos ?? V());
  g.rotation.y = opts.rotY ?? 0;
  g.updateMatrixWorld(true);
  let ft = 0;
  const api = {
    group: g,
    pick: g,
    anchor: g.localToWorld(V(0, 1.6, -1)),
    kind: 'input',
    label: 'IR remote control',
    /** World position of the IR LED tip. */
    tip: g.localToWorld(V(0, T / 2, -L / 2 - 0.2)),
    keys: keys.map((k) => k.k),
    flash(dur = 0.3) { ft = dur; return api; },
    tick(dt) {
      ft = Math.max(0, ft - dt);
      const k = ft > 0 ? 0.6 + 0.4 * Math.sin(ft * 60) : 0;
      ledMat.emissiveIntensity = k * 2.2;
      glow.material.opacity = k * 0.95;
    },
  };
  return api;
}

// ================================================================= MPU-6050
/**
 * GY-521 MPU-6050 breakout on a small ball-joint stand so it can be tilted.
 * Pins VCC GND SCL SDA XDA XCL AD0 INT. setTilt(pitchDeg, rollDeg).
 */
export function makeMPU6050(pos, opts = {}) {
  const g = new THREE.Group();
  const STAND = 0.9;
  g.add(at(cyl(0.7, 0.85, 0.2, mat(0x8f8d86, { rough: 0.5, metal: 0.4 }), { seg: 24 }), 0, 0.1, 0));
  g.add(at(cyl(0.1, 0.1, STAND - 0.2, metal(), { seg: 10 }), 0, 0.2 + (STAND - 0.3) / 2, 0));
  g.add(at(mesh(new THREE.SphereGeometry(0.18, 14, 10), metal()), 0, STAND - 0.1, 0));
  const tilt = new THREE.Group();
  tilt.position.y = STAND;
  g.add(tilt);
  const b = makeBreakout({
    w: 2.1, d: 1.6, color: 0x2a5cb8, pins: ['VCC', 'GND', 'SCL', 'SDA', 'XDA', 'XCL', 'AD0', 'INT'], pinsEdge: 'back', inset: 0.17,
    holes: [[-0.8, 0.55], [0.8, 0.55]], holeR: 0.13,
    silk: (P) => {
      // axis arrows
      P.line([[-0.2, 0.55], [0.35, 0.55]], { lw: 0.03 });
      P.line([[0.27, 0.49], [0.35, 0.55], [0.27, 0.61]], { lw: 0.03 });
      P.text('X', 0.47, 0.55, 0.12, { weight: 700 });
      P.line([[-0.2, 0.55], [-0.2, 0.05]], { lw: 0.03 });
      P.line([[-0.26, 0.13], [-0.2, 0.05], [-0.14, 0.13]], { lw: 0.03 });
      P.text('Y', -0.2, -0.07, 0.12, { weight: 700 });
      P.text('GY-521', 0.5, -0.15, 0.11, { weight: 700 });
    },
  });
  b.group.position.y = -b.top / 2;
  tilt.add(b.group);
  b.on(qfn(0.42, { label: 'MPU' }), -0.55, 0.15);
  b.on(soic(3, { len: 0.32, wid: 0.18, h: 0.1 }), 0.45, 0.45);
  smdField(b, [[0.1, 0.15, Math.PI / 2], [0.1, 0.4, Math.PI / 2, 'cap'], [-0.95, 0.15, Math.PI / 2, 'cap'], [0.85, 0.15, Math.PI / 2]]);
  const led = smdLed(0x3fdc6a, { glow: 0.6 });
  b.on(led.group, 0.85, 0.02);
  led.set(1);
  const pinsLocal = new Map();
  for (const [k, p] of b.pinsLocal) pinsLocal.set(k, p.clone().add(b.group.position));
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, STAND + 1.4, 0), frame: tilt });
  api.kind = 'sensor';
  api.label = 'MPU-6050 accelerometer and gyro';
  let pitch = 0, roll = 0;
  live(api, {
    get pitch() { return pitch; },
    get roll() { return roll; },
    /** Pitch tips the front edge down (+) / up (−) about X; roll banks about Z (+ = right side down). */
    setTilt(p = 0, r = 0) {
      pitch = p;
      roll = r;
      tilt.rotation.set(THREE.MathUtils.degToRad(p), 0, -THREE.MathUtils.degToRad(r), 'XZY');
      return api;
    },
  });
  return api;
}

// ================================================================= soil moisture probe + pot
/**
 * Capacitive soil-moisture probe (black blade) in a terracotta pot with a
 * cartoon plant. Pins GND, VCC, AOUT at the top of the probe (pointing up).
 * setMoisture(0..1): darker soil and perkier leaves when wet.
 */
export function makeSoilSensor(pos, opts = {}) {
  const g = new THREE.Group();
  // pot
  const terracotta = mat(0xc8673f, { rough: 0.75 });
  const PR = 2.6, PH = 6.0;
  g.add(at(cyl(PR - 0.15, PR - 0.75, PH, terracotta, { seg: 36 }), 0, PH / 2, 0));
  g.add(at(cyl(PR + 0.1, PR + 0.1, 0.55, mat(0xd2754b, { rough: 0.75 }), { seg: 36 }), 0, PH - 0.05, 0));
  const soilMat = mat(0x6b4a30, { rough: 0.95, unique: true });
  g.add(at(cyl(PR - 0.1, PR - 0.1, 0.06, soilMat, { seg: 36, outline: false }), 0, PH + 0.12, 0));
  // little soil lumps
  const lumpGeo = new THREE.IcosahedronGeometry(0.16, 0);
  const lumps = new THREE.InstancedMesh(lumpGeo, soilMat, 16);
  const t = new THREE.Object3D();
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4, r = 0.4 + ((i * 37) % 13) / 13 * 1.6;
    t.position.set(Math.cos(a) * r, PH + 0.15, Math.sin(a) * r);
    t.rotation.set(a, a * 0.7, 0);
    t.scale.set(1, 0.5, 1);
    t.updateMatrix();
    lumps.setMatrixAt(i, t.matrix);
  }
  g.add(lumps);
  // plant
  const plant = new THREE.Group();
  plant.position.set(-1.15, PH + 0.12, -0.35);
  plant.scale.setScalar(1.45);
  const stemMat = mat(0x3f9a4a, { rough: 0.6 });
  plant.add(at(cyl(0.09, 0.12, 2.4, stemMat, { seg: 8 }), 0, 1.2, 0));
  const leafMat = mat(0x52b85a, { rough: 0.55, unique: true });
  const leafGeo = new THREE.SphereGeometry(0.5, 14, 8);
  leafGeo.scale(0.55, 0.12, 1.25);
  leafGeo.translate(0, 0, 0.62);
  const leaves = [];
  const leafSpots = [[0.7, 0.0], [1.1, 2.2], [1.5, 4.2], [1.85, 1.1], [2.2, 3.3], [2.45, 5.4]];
  for (const [y, a] of leafSpots) {
    const pivot = new THREE.Group();
    pivot.position.y = y;
    pivot.rotation.y = a;
    const leaf = mesh(leafGeo, leafMat, { edgeAngle: 40 });
    pivot.add(leaf);
    plant.add(pivot);
    leaves.push(leaf);
  }
  const bud = mesh(new THREE.SphereGeometry(0.28, 14, 10), mat(0xf5c02a, { rough: 0.5 }));
  plant.add(at(bud, 0, 2.5, 0));
  g.add(plant);
  // probe blade standing in the soil (board in the XY plane, facing +z)
  const PW = 2.3, PL = 9.8, PT = 0.16;
  const probe = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-PW / 2, 0);
  shape.lineTo(PW / 2, 0);
  shape.lineTo(PW / 2, -PL + 1.0);
  shape.lineTo(0, -PL);
  shape.lineTo(-PW / 2, -PL + 1.0);
  shape.closePath();
  const pcb = mesh(new THREE.ExtrudeGeometry(shape, { depth: PT, bevelEnabled: false }), mat(0x1f2024, { rough: 0.5 }));
  pcb.position.z = -PT / 2;
  probe.add(pcb);
  const face = decal(PW, PL, (ctx, w, h) => {
    const s = w / PW;
    ctx.strokeStyle = '#f1efe6';
    ctx.fillStyle = '#f1efe6';
    ctx.lineWidth = 0.03 * s;
    ctx.beginPath();
    ctx.moveTo(0.15 * s, 3.4 * s);
    ctx.lineTo(w - 0.15 * s, 3.4 * s);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = `700 ${0.2 * s}px ${SANS}`;
    ctx.fillText('Capacitive Soil', w / 2, 1.55 * s);
    ctx.fillText('Moisture Sensor v1.2', w / 2, 1.85 * s);
    ctx.font = `600 ${0.15 * s}px ${SANS}`;
    ctx.fillText('▼ insert to this line ▼', w / 2, 3.25 * s);
    // copper pad area (under solder mask)
    ctx.fillStyle = 'rgba(255,255,255,.07)';
    ctx.beginPath();
    ctx.roundRect(0.35 * s, 3.8 * s, w - 0.7 * s, (PL - 5.0) * s, 0.2 * s);
    ctx.fill();
  }, { vertical: true, res: 140 });
  face.position.set(0, -PL / 2, PT / 2 + 0.003);
  probe.add(face);
  // electronics near the top
  const chipV = soic(4, { len: 0.55, wid: 0.4 });
  chipV.rotation.x = Math.PI / 2;
  probe.add(at(chipV, -0.3, -0.75, PT / 2));
  const reg = soic(2, { len: 0.3, wid: 0.25 });
  reg.rotation.x = Math.PI / 2;
  probe.add(at(reg, 0.45, -0.75, PT / 2));
  // 3-pin JST-PH at the top edge with pins pointing up
  probe.add(at(box(1.0, 0.5, 0.5, mat(0xf0ece0, { rough: 0.6 })), 0, 0.25, 0.1));
  const pinNames = ['GND', 'VCC', 'AOUT'];
  const pinsLocal = new Map();
  const PROBE_Y = PL + 0.2; // tip just above the pot floor; "insert" line sits just above the soil
  const probeX = 0.75, probeZ = 0.35;
  pinNames.forEach((n, i) => {
    const x = (i - 1) * PITCH;
    probe.add(at(box(0.064, 0.8, 0.064, metal(), { outline: false }), x, 0.6, 0.1));
    pinsLocal.set(n, V(probeX + x, PROBE_Y + 1.0, probeZ + 0.1));
  });
  const lbl = decal(1.0, 0.24, (ctx, w, h) => {
    ctx.fillStyle = '#f1efe6';
    ctx.font = `700 ${h * 0.7}px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    pinNames.forEach((n, i) => ctx.fillText(n, w / 2 + (i - 1) * (w * 0.33), h / 2, w * 0.32));
  }, { vertical: true });
  lbl.position.set(0, -0.2, PT / 2 + 0.004);
  probe.add(lbl);
  probe.position.set(probeX, PROBE_Y, probeZ);
  g.add(probe);

  const dry = new THREE.Color(0xb08a5e), wet = new THREE.Color(0x3a2618);
  const leafDry = new THREE.Color(0x9bb54a), leafWet = new THREE.Color(0x46b456);
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, PH + 3.4, 0) });
  api.kind = 'sensor';
  api.label = 'Soil moisture sensor';
  let moisture = 0.5;
  live(api, {
    get moisture() { return moisture; },
    setMoisture(m) {
      moisture = Math.max(0, Math.min(1, m));
      soilMat.color.copy(dry).lerp(wet, moisture);
      leafMat.color.copy(leafDry).lerp(leafWet, moisture);
      const droop = (1 - moisture) * 1.05;
      leaves.forEach((l, i) => (l.rotation.x = -0.35 + droop + (i % 2) * 0.05));
      plant.rotation.z = (1 - moisture) * 0.18;
      bud.scale.setScalar(0.7 + moisture * 0.4);
      return api;
    },
  });
  api.setMoisture(opts.moisture ?? 0.5);
  return api;
}

// ================================================================= sound KY-038
/** KY-038 sound sensor: electret mic capsule + blue trimmer. Pins AO, GND, +, DO. level(v) pulses. */
export function makeSoundSensor(pos, opts = {}) {
  const b = makeBreakout({
    w: 3.4, d: 1.5, color: 0x25262b, pins: ['AO', 'GND', '+', 'DO'], pinsEdge: 'left', inset: 0.2,
    holes: [[-0.85, 0.5]], holeR: 0.13,
    silk: (P) => {
      P.text('L1', -0.35, 0.55, 0.09);
      P.text('L2', -0.35, -0.55, 0.09);
    },
  });
  const g = b.group;
  // mic capsule at the right edge facing +x
  const mic = new THREE.Group();
  const can = cyl(0.48, 0.48, 0.65, metal(), { seg: 28 });
  can.rotation.z = Math.PI / 2;
  mic.add(can);
  const felt = cyl(0.44, 0.44, 0.02, mat(0x16171b, { rough: 0.95 }), { seg: 28, outline: false });
  felt.rotation.z = Math.PI / 2;
  mic.add(at(felt, 0.33, 0, 0));
  b.on(mic, 1.55, 0, 0.5);
  const pot = trimpot3296();
  pot.rotation.y = Math.PI / 2;
  b.on(pot, 0.55, 0);
  const { pwr, sig } = comparatorBits(b, { chip: [-0.35, 0], pwr: [-0.75, 0.55], sig: [-0.75, -0.55] });
  smdField(b, [[0.0, 0.55], [0.0, -0.55], [1.0, 0.55, Math.PI / 2]]);
  const rings = pulseRings(0x2aa7a1, 0.5, 3);
  rings.group.rotation.z = Math.PI / 2;
  rings.group.position.set(2.1, b.top + 0.5, 0);
  g.add(rings.group);
  const api = freeApi(g, b.pinsLocal, pos, opts, { pick: g, anchor: V(0.5, 1.8, 0) });
  api.kind = 'sensor';
  api.label = 'Sound sensor module (KY-038)';
  live(api, {
    /** Show sound reaching the mic (true/false) and light the DO LED. */
    hear(on = true) {
      rings.set(on);
      sig.set(on ? 1 : 0);
      return api;
    },
    setDetect(on) { sig.set(on ? 1 : 0); return api; },
    tick(dt) { rings.tick(dt, 1.4); },
  });
  return api;
}

// ================================================================= gas MQ-2
/** MQ-2 gas sensor: mesh-topped can on a PCB. Pins VCC, GND, DO, AO. */
export function makeGasSensor(pos, opts = {}) {
  const b = makeBreakout({
    w: 3.2, d: 2.2, color: 0x2a5cb8, pins: ['VCC', 'GND', 'DO', 'AO'], pinsEdge: 'left', inset: 0.2,
    holes: [[1.25, -0.8], [1.25, 0.8]], holeR: 0.13,
    silk: (P) => P.text('MQ-2', 1.25, 0, 0.13, { weight: 700, rot: -Math.PI / 2 }),
  });
  const g = b.group;
  const sensor = new THREE.Group();
  sensor.add(at(cyl(1.0, 1.0, 0.3, mat(0x8a4b2a, { rough: 0.7 }), { seg: 32 }), 0, 0.15, 0));
  sensor.add(at(cyl(0.95, 0.95, 0.85, metal(), { seg: 32 }), 0, 0.3 + 0.42, 0));
  const meshTex = canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = '#9a9890';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#dedbd2';
    ctx.lineWidth = 3;
    for (let i = 0; i < 256; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
  });
  const meshTop = new THREE.Mesh(new THREE.CircleGeometry(0.85, 32), new THREE.MeshStandardMaterial({ map: meshTex, roughness: 0.5, metalness: 0.4 }));
  meshTop.rotation.x = -Math.PI / 2;
  sensor.add(at(meshTop, 0, 1.152, 0));
  sensor.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 8, 32), metal()), 0, 1.15, 0).rotateX(Math.PI / 2));
  b.on(sensor, 0.3, 0);
  const pwr = smdLed(0xff3b2f);
  b.on(pwr.group, -0.95, 0.82);
  pwr.set(1);
  const sig = smdLed(0x3fdc6a);
  b.on(sig.group, -0.55, 0.82);
  smdField(b, [[-0.95, -0.82], [-0.55, -0.82]]);
  const api = freeApi(g, b.pinsLocal, pos, opts, { pick: g, anchor: V(0.15, 2.0, 0) });
  api.kind = 'sensor';
  api.label = 'Gas sensor (MQ-2)';
  api.setDetect = (on) => { sig.set(on ? 1 : 0); return api; };
  return api;
}

// ================================================================= flame sensor
/** IR flame sensor: dark 5 mm receiver at the +x edge. Pins VCC, GND, DO, AO. */
export function makeFlameSensor(pos, opts = {}) {
  const b = makeBreakout({
    w: 3.0, d: 1.45, color: 0x2a5cb8, pins: ['VCC', 'GND', 'DO', 'AO'], pinsEdge: 'left', inset: 0.2,
    holes: [[0.1, 0.5]], holeR: 0.12,
    silk: (P) => P.text('FLAME', 0.15, -0.5, 0.11, { weight: 700 }),
  });
  const g = b.group;
  const rx = new THREE.Group();
  const dark = mat(0x16171d, { rough: 0.15, metal: 0.2, opacity: 0.95 });
  const body = cyl(0.25, 0.25, 0.5, dark, { seg: 20 });
  body.rotation.z = -Math.PI / 2;
  rx.add(at(body, 0.25, 0, 0));
  const tip = mesh(new THREE.SphereGeometry(0.25, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), dark, { outline: false });
  tip.rotation.z = -Math.PI / 2;
  rx.add(at(tip, 0.5, 0, 0));
  const rim = cyl(0.29, 0.29, 0.06, dark, { seg: 20 });
  rim.rotation.z = Math.PI / 2;
  rx.add(rim);
  for (const dz of [-0.127, 0.127]) rx.add(at(box(0.5, 0.04, 0.04, metal(), { outline: false }), -0.25, 0, dz));
  b.on(rx, 1.3, 0, 0.32);
  const pot = trimpot3296({ w: 0.6, d: 0.6, h: 0.5 });
  b.on(pot, 0.5, 0.15);
  const { sig } = comparatorBits(b, { chip: [-0.35, 0.15], pwr: [-0.8, -0.5], sig: [-0.45, -0.5] });
  const api = freeApi(g, b.pinsLocal, pos, opts, { pick: g, anchor: V(0.5, 1.6, 0) });
  api.kind = 'sensor';
  api.label = 'Flame sensor module';
  api.front = g.localToWorld(V(2.1, b.top + 0.32, 0));
  api.setDetect = (on) => { sig.set(on ? 1 : 0); return api; };
  return api;
}

// ================================================================= FSR
/** Force-sensing resistor: round pad + flat tail ending in two pins P1, P2. press(0..1). */
export function makeFSR(pos, opts = {}) {
  const g = new THREE.Group();
  const PR = 0.95, TL = 4.2, TW = 0.75;
  const film = mat(0xd9b46a, { rough: 0.35, opacity: 0.95 });
  // pad + tail outline as one shape (tail toward −z, pins at the back)
  const shape = new THREE.Shape();
  const a = Math.asin(TW / 2 / PR);
  shape.absarc(0, 0, PR, -Math.PI / 2 + a, Math.PI * 1.5 - a, false);
  shape.lineTo(-TW / 2, -TL);
  shape.lineTo(TW / 2, -TL);
  shape.closePath();
  g.add(slab(shape, 0.04, film));
  const padMat = mat(0x2b2c31, { rough: 0.5, unique: true });
  const pad = new THREE.Mesh(new THREE.CircleGeometry(PR - 0.12, 40), padMat);
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 0.045;
  g.add(pad);
  const ringsDecal = decal(PR * 2, PR * 2, (ctx, w) => {
    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.lineWidth = w * 0.012;
    for (let r = 0.12; r < 0.46; r += 0.06) {
      ctx.beginPath();
      ctx.arc(w / 2, w / 2, w * r, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  ringsDecal.position.y = 0.048;
  g.add(ringsDecal);
  // dimple
  const dimple = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), new THREE.MeshBasicMaterial({ map: glowSprite().material.map, color: 0x000000, transparent: true, opacity: 0, depthWrite: false }));
  dimple.rotation.x = -Math.PI / 2;
  dimple.position.y = 0.05;
  noRay(dimple);
  g.add(dimple);
  const glow = glowSprite(0xff8a3a, 1.8);
  glow.position.y = 0.3;
  g.add(glow);
  // traces on the tail
  for (const dx of [-0.15, 0.15]) g.add(at(box(0.08, 0.01, TL - PR, mat(0xc0c2c4, { metal: 0.5 }), { outline: false }), dx, 0.045, PR + (TL - PR) / 2));
  // crimp housing + pins (pointing up)
  g.add(at(box(0.75, 0.35, 0.5, mat(0x23262e)), 0, 0.175, TL + 0.1));
  const pinsLocal = new Map();
  ['P1', 'P2'].forEach((n, i) => {
    const x = (i - 0.5) * PITCH;
    g.add(at(box(0.064, 0.7, 0.064, metal(), { outline: false }), x, 0.6, TL + 0.1));
    pinsLocal.set(n, V(x, 0.95, TL + 0.1));
  });
  const lbl = textDecal('FSR', 0.5, 0.2, { color: '#5b4520', size: 0.75, font: SANS });
  lbl.position.set(0, 0.047, 2.4);
  lbl.rotation.z = -Math.PI / 2;
  g.add(lbl);
  // fingertip
  const finger = mesh(new THREE.CapsuleGeometry(0.45, 1.6, 6, 14), mat(0xf0c09a, { rough: 0.6 }));
  finger.rotation.x = -0.9; // comes in from the back, tip on the pad
  finger.visible = false;
  g.add(finger);
  // tail runs from the pad toward +z
  g.rotation.y = 0;
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, 1.4, 0) });
  api.kind = 'sensor';
  api.label = 'Force-sensitive resistor (FSR)';
  let level = 0;
  live(api, {
    get level() { return level; },
    /** Press level 0..1: dimple, darker pad, warm glow, a fingertip pressing. */
    press(v = 1) {
      level = Math.max(0, Math.min(1, +v));
      dimple.material.opacity = level * 0.65;
      dimple.scale.setScalar(0.8 + level * 0.8);
      padMat.color.setHex(0x2b2c31).lerp(new THREE.Color(0x6a3a1c), level * 0.6);
      glow.material.opacity = level * 0.5;
      finger.visible = level > 0.02;
      const tipY = 0.07 + (1 - level) * 0.4;
      finger.position.set(0, tipY + Math.cos(0.9) * 1.25, -Math.sin(0.9) * 1.25);
      return api;
    },
  });
  return api;
}
