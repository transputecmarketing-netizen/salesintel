// Planet & Physical-AI parts: renewable energy (wind turbine, anemometer, solar
// tracker, power box, INA219, voltage divider), environment sensors (PMS5003,
// SGP30, water lab with pH / TDS / DS18B20, water tank, rain plate, field bed,
// forest patch + wildfire post), LoRa SX1276, a PCA9685 servo driver, a waste
// sorter and props for AI scenes (waste items, animals, a bush, a hand, leaves,
// a road junction). Units are cm, y up. Free-standing parts take `pos` (the
// ground point under the part) and `opts.rotY`, expose pins pointing UP via
// pin(name), and carry `kind` / `label` for the parts list.
import {
  THREE, V, mat, mesh, box, cyl, at, glowSprite, metal, canvasTexture, makeBreakout, freeApi, decal, textDecal,
  soic, qfn, smdField, smdLed, trimpot3296, screwTerminal, electrolytic, emissiveMat, noRay, pulseRings, cable, jst, PITCH, PCB, PIN_TIP, SANS, MONO, live,
} from './common.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const tag = (api, kind, label) => Object.assign(api, { kind, label });

/** A male pin standing on `parent` at local (x, y, z), returns the local tip. */
function postPin(parent, x, y, z, h = 0.7) {
  parent.add(at(box(0.064, h, 0.064, metal(), { outline: false }), x, y + h / 2, z));
  return V(x, y + h, z);
}

/** A small 2-row pin label decal lying flat. */
function flatLabel(text, w, h, color = '#f1efe6', size = 0.7) {
  return textDecal(text, w, h, { color, size, font: SANS });
}

/** Seeded random. */
function rng(seed = 1) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ================================================================= wind turbine
/**
 * Small horizontal-axis wind turbine (model of a ~1.2 m rotor, 12 V DC
 * generator). Rotor faces local +z. Pins OUT+ / OUT- on the junction box at the
 * base. setWind(m/s) spins the rotor with inertia; setBrake(true) stops it
 * (electrical brake). `rpm` is the modelled real rotor speed.
 */
export function makeWindTurbine(pos, opts = {}) {
  const g = new THREE.Group();
  const H = opts.height ?? 13;
  const R = opts.rotor ?? 4.4; // blade length (model)
  const white = mat(0xf3f1ea, { rough: 0.45 });
  const grey = mat(0xb9bcc2, { rough: 0.5 });
  // concrete pad + flange
  g.add(at(box(4, 0.4, 4, mat(0xc9c4b8, { rough: 0.9 })), 0, 0.2, 0));
  g.add(at(cyl(0.7, 0.8, 0.3, grey, { seg: 20 }), 0, 0.55, 0));
  g.add(at(cyl(0.2, 0.34, H, white, { seg: 20 }), 0, 0.7 + H / 2, 0));
  // cable down the tower into the junction box
  g.add(cable([V(0.18, H, 0.18), V(0.3, H * 0.6, 0.24), V(0.36, 1.6, 0.3), V(1.0, 1.1, 1.1)], 0x24262c, 0.05));
  // junction box with two terminal posts
  const jb = new THREE.Group();
  jb.add(at(box(1.5, 0.9, 1.1, mat(0x8f949c, { rough: 0.5 })), 0, 0.45, 0));
  jb.add(at(box(1.56, 0.08, 1.16, mat(0x74787f)), 0, 0.92, 0));
  jb.add(at(textDecal('DC OUT', 1.1, 0.26, { color: '#1d2440', size: 0.7, font: SANS }), 0, 0.965, 0.32));
  const pinsLocal = new Map();
  [['OUT+', -0.35, 0xd8443a], ['OUT-', 0.35, 0x2a2c33]].forEach(([n, x, c]) => {
    jb.add(at(cyl(0.16, 0.16, 0.25, mat(c), { seg: 14 }), x, 1.08, -0.15));
    jb.add(at(cyl(0.06, 0.06, 0.35, mat(0xd6b46a, { metal: 0.6, rough: 0.35 }), { seg: 8, outline: false }), x, 1.35, -0.15));
    pinsLocal.set(n, V(1.0 + x, 0.4 + 1.52, 1.1 - 0.15));
  });
  jb.position.set(1.0, 0.4, 1.1);
  g.add(jb);
  // nacelle
  const top = new THREE.Group();
  top.position.y = 0.7 + H;
  const nac = cyl(0.55, 0.45, 2.4, white, { seg: 20 });
  nac.rotation.x = Math.PI / 2;
  top.add(at(nac, 0, 0.45, -0.2));
  top.add(at(cyl(0.3, 0.3, 0.4, grey, { seg: 16 }), 0, 0.1, 0));
  // tail vane (small turbines yaw passively)
  top.add(at(box(0.14, 0.14, 3.2, grey), 0, 0.45, -2.9));
  const vane = new THREE.Shape();
  vane.moveTo(0, 0); vane.lineTo(1.9, 0.0); vane.lineTo(2.2, 1.6); vane.lineTo(0.3, 0.7); vane.closePath();
  const vm = mesh(new THREE.ExtrudeGeometry(vane, { depth: 0.06, bevelEnabled: false }), white);
  vm.rotation.y = Math.PI / 2;
  vm.position.set(-0.03, 0.15, -2.6);
  top.add(vm);
  // rotor
  const rotor = new THREE.Group();
  rotor.position.set(0, 0.45, 1.15);
  const spinner = mesh(new THREE.ConeGeometry(0.42, 0.9, 20), white);
  spinner.rotation.x = Math.PI / 2;
  rotor.add(at(spinner, 0, 0, 0.45));
  rotor.add(at(cyl(0.45, 0.45, 0.3, grey, { seg: 20 }).rotateX(Math.PI / 2), 0, 0, 0));
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(-0.16, 0);
  bladeShape.lineTo(0.2, 0);
  bladeShape.quadraticCurveTo(0.5, R * 0.25, 0.22, R);
  bladeShape.lineTo(0.05, R);
  bladeShape.quadraticCurveTo(-0.3, R * 0.3, -0.16, 0);
  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.05, bevelEnabled: false });
  bladeGeo.translate(0, 0.3, -0.025);
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Group();
    const b = mesh(bladeGeo, white, { edgeAngle: 40 });
    b.rotation.y = 0.32; // pitch
    arm.add(b);
    arm.rotation.z = (i * Math.PI * 2) / 3;
    rotor.add(arm);
  }
  top.add(rotor);
  g.add(top);
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, H + 2.2, 0) });
  api.hub = g.localToWorld(V(0, 0.7 + H + 0.45, 1.6));
  let wind = 0, rpm = 0, brake = false, ang = 0;
  const RADIUS_M = 0.6, TSR = 6, RPM_MAX = 1100;
  live(api, {
    get wind() { return wind; },
    get rpm() { return rpm; },
    get braked() { return brake; },
    /** Wind speed in m/s. */
    setWind(v) { wind = Math.max(0, +v); return api; },
    setBrake(on) { brake = !!on; return api; },
    /** Rotor speed the wind would give at steady state (rpm). */
    targetRpm() {
      if (brake) return 0;
      if (wind < 1.2) return 0; // starting torque: too little wind to turn
      return Math.min(RPM_MAX, (60 * TSR * wind) / (2 * Math.PI * RADIUS_M));
    },
    tick(dt) {
      const target = api.targetRpm();
      const k = brake ? 2.5 : 0.7; // brakes act faster than the wind spins it up
      rpm += (target - rpm) * Math.min(1, dt * k);
      if (rpm < 0.5) rpm = 0;
      ang += dt * (rpm / 60) * Math.PI * 2 * 0.12; // animation slowed ~8× so blades stay readable
      rotor.rotation.z = -ang;
    },
  });
  return tag(api, 'module', 'Small wind turbine (12 V DC generator)');
}

// ================================================================= cup anemometer
/**
 * Three-cup anemometer on a mast with a reed switch: one contact closure per
 * revolution, 2.4 km/h (0.667 m/s) per Hz. Pins SIG / GND on the RJ11 breakout
 * at the foot. `pulses` counts the real closures (fractional), `hz` the rate.
 */
export function makeAnemometer(pos, opts = {}) {
  const g = new THREE.Group();
  const H = opts.height ?? 8;
  g.add(at(box(2.2, 0.3, 2.2, mat(0xc9c4b8, { rough: 0.9 })), 0, 0.15, 0));
  g.add(at(cyl(0.12, 0.12, H, metal(), { seg: 12 }), 0, 0.3 + H / 2, 0));
  g.add(at(cyl(0.32, 0.32, 0.8, mat(0xf3f1ea, { rough: 0.5 }), { seg: 18 }), 0, H + 0.6, 0));
  const head = new THREE.Group();
  head.position.y = H + 1.15;
  head.add(at(cyl(0.22, 0.22, 0.25, mat(0xf3f1ea), { seg: 16 }), 0, 0, 0));
  const cupGeo = new THREE.SphereGeometry(0.42, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const arm = new THREE.Group();
    arm.rotation.y = a;
    arm.add(at(box(1.4, 0.07, 0.07, mat(0x2a2c33)), 0.7, 0, 0));
    const cup = mesh(cupGeo, mat(0x2a2c33, { rough: 0.5, side: THREE.DoubleSide }));
    cup.rotation.x = Math.PI / 2; // open side faces the direction of travel's back
    arm.add(at(cup, 1.45, 0, 0));
    head.add(arm);
  }
  g.add(head);
  // RJ11 breakout at the foot
  const b = makeBreakout({ w: 1.5, d: 1.2, color: PCB.black, pins: ['SIG', 'GND'], pinsEdge: 'back', inset: 0.25, label: 'RJ11', labelPos: [0, 0.25], labelSize: 0.2 });
  b.group.position.set(1.7, 0, 0.6);
  g.add(b.group);
  b.on(at(box(0.7, 0.55, 0.6, mat(0xf0ece0)), 0, 0, 0.2), 0, 0.25, 0.28);
  g.add(cable([V(0.12, 2, 0), V(0.5, 0.6, 0.3), V(1.4, 0.55, 0.9)], 0x24262c, 0.04));
  const pinsLocal = new Map([...b.pinsLocal].map(([n, p]) => [n, p.clone().add(b.group.position)]));
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, H + 2.0, 0) });
  let wind = 0, pulses = 0, ang = 0;
  live(api, {
    get wind() { return wind; },
    get hz() { return wind / 0.6667; },
    get pulses() { return pulses; },
    setWind(v) { wind = Math.max(0, +v); return api; },
    tick(dt) {
      const hz = wind / 0.6667;
      pulses += hz * dt;
      ang += dt * Math.min(hz, 6) * Math.PI * 2 * 0.35; // slowed for the eye
      head.rotation.y = ang;
    },
  });
  return tag(api, 'sensor', 'Cup anemometer (reed switch)');
}

// ================================================================= sun
/** A sun you can place on a sky arc around `center`. setSky(azimuthDeg, elevationDeg). */
export function makeSun(center, opts = {}) {
  const g = new THREE.Group();
  const R = opts.radius ?? 16;
  const core = mesh(new THREE.SphereGeometry(1.0, 24, 16), mat(0xffc93b, { emissive: 0xffb020, emissiveIntensity: 0.9 }), { outline: false });
  g.add(core);
  const glow = glowSprite(0xffc040, 6);
  glow.material.opacity = 0.85;
  g.add(glow);
  for (let i = 0; i < 12; i++) {
    const ray = box(0.12, 0.7, 0.12, mat(0xffc93b, { emissive: 0xffb020, emissiveIntensity: 0.6 }), { outline: false });
    const a = (i / 12) * Math.PI * 2;
    ray.position.set(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0);
    ray.rotation.z = a - Math.PI / 2;
    g.add(ray);
  }
  const c = center.clone();
  let az = 0, el = 45;
  const api = {
    group: g, pick: core,
    get az() { return az; }, get el() { return el; },
    get anchor() { return g.position.clone().add(V(0, 1.8, 0)); },
    /** Azimuth 0 = towards +z (south in these scenes), +90 = towards +x (west). */
    setSky(a, e) {
      az = a; el = e;
      const ar = THREE.MathUtils.degToRad(a), er = THREE.MathUtils.degToRad(e);
      g.position.set(c.x + Math.sin(ar) * Math.cos(er) * R, c.y + Math.sin(er) * R, c.z + Math.cos(ar) * Math.cos(er) * R);
      g.visible = e > -3;
      g.updateMatrixWorld(true);
      return api;
    },
    /** Unit vector from `p` towards the sun. */
    dirFrom(p) { return g.position.clone().sub(p).normalize(); },
    tick() { g.quaternion.identity(); },
  };
  api.setSky(opts.az ?? 0, opts.el ?? 45);
  return tag(api, 'object', 'Sun (movable light source)');
}

function cellTexture() {
  return canvasTexture(512, 400, (c, w, h) => {
    c.fillStyle = '#1d3a7a';
    c.fillRect(0, 0, w, h);
    const cols = 6, rows = 5;
    const cw = w / cols, ch = h / rows;
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) {
        const g = c.createLinearGradient(i * cw, j * ch, (i + 1) * cw, (j + 1) * ch);
        g.addColorStop(0, '#2c5bb8');
        g.addColorStop(1, '#1b3d86');
        c.fillStyle = g;
        c.fillRect(i * cw + 3, j * ch + 3, cw - 6, ch - 6);
        c.strokeStyle = 'rgba(220,230,255,.35)';
        c.lineWidth = 1.2;
        for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(i * cw + (cw * k) / 4, j * ch + 3); c.lineTo(i * cw + (cw * k) / 4, (j + 1) * ch - 3); c.stroke(); }
      }
  });
}

/** Solar module (w × d) in its own group, cells facing local +y. */
function panelSlab(w, d) {
  const p = new THREE.Group();
  const frame = mat(0xc9ccd2, { metal: 0.5, rough: 0.35 });
  const side = mat(0x1b2440);
  p.add(mesh(new THREE.BoxGeometry(w, 0.14, d), [side, side, mat(0xffffff, { map: cellTexture(), rough: 0.25, metal: 0.2, unique: true }), side, side, side]));
  for (const s of [-1, 1]) {
    p.add(at(box(w + 0.12, 0.2, 0.08, frame), 0, 0.02, s * (d / 2 + 0.02)));
    p.add(at(box(0.08, 0.2, d + 0.12, frame), s * (w / 2 + 0.02), 0.02, 0));
  }
  return p;
}

/** Light reaching a surface with unit normal n from sun direction s (0..1, Lambert). */
export function cosIncidence(n, s) { return Math.max(0, n.dot(s)); }

// ================================================================= fixed panel
/** Fixed solar panel on an A-frame stand: tilt (deg from flat), facing local +z. Pins + / -. */
export function makeSolarPanel(pos, opts = {}) {
  const g = new THREE.Group();
  const W = opts.w ?? 5.4, D = opts.d ?? 4.2, tilt = THREE.MathUtils.degToRad(opts.tilt ?? 35);
  const leg = mat(0x9aa0a8, { metal: 0.4, rough: 0.4 });
  const pivotY = 1.2;
  for (const s of [-1, 1]) {
    g.add(at(box(0.18, 0.12, 4.0, leg), s * (W / 2 - 0.4), 0.06, 0));
    g.add(at(box(0.16, pivotY + Math.sin(tilt) * D * 0.5, 0.16, leg), s * (W / 2 - 0.4), (pivotY + Math.sin(tilt) * D * 0.5) / 2, -Math.cos(tilt) * D * 0.4));
    g.add(at(box(0.16, pivotY * 0.7, 0.16, leg), s * (W / 2 - 0.4), (pivotY * 0.7) / 2, Math.cos(tilt) * D * 0.4));
  }
  const panel = panelSlab(W, D);
  panel.rotation.x = tilt;
  panel.position.y = pivotY + 0.35;
  g.add(panel);
  // junction box + leads
  const pinsLocal = new Map();
  g.add(at(box(1.0, 0.5, 0.8, mat(0x24262c)), W / 2 + 0.9, 0.25, 0.8));
  pinsLocal.set('+', postPin(g, W / 2 + 0.7, 0.5, 0.8));
  pinsLocal.set('-', postPin(g, W / 2 + 1.1, 0.5, 0.8));
  g.add(cable([V(W / 2 - 0.4, pivotY, 0), V(W / 2 + 0.3, 0.7, 0.5), V(W / 2 + 0.9, 0.5, 0.8)], 0x24262c, 0.04));
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, pivotY + 2.6, 0) });
  const nLocal = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), tilt);
  live(api, {
    /** World unit normal of the cells. */
    normal() { return nLocal.clone().transformDirection(g.matrixWorld); },
    get center() { return g.localToWorld(V(0, pivotY + 0.4, 0)); },
  });
  return tag(api, 'module', 'Fixed solar panel (6 V, 1 W)');
}

// ================================================================= 2-axis tracker
/**
 * Dual-axis sun tracker: pan servo in the base, tilt servo on the yoke, a 6 V
 * panel and a cross-shaped shade with 4 LDRs (TL, TR, BL, BR) at its top edge.
 * The base board carries the four 10 kΩ divider resistors; its header has
 * TL TR BL BR 3V3 GND 5V PAN TILT. setPan / setTilt take servo degrees
 * (pan 90 = facing +z, tilt 90 = panel upright facing +z, 0 = flat facing up).
 * ldrLight(sunDir) → [TL, TR, BL, BR] light fractions with cross-wall shading.
 */
export function makeSolarTracker(pos, opts = {}) {
  const g = new THREE.Group();
  const blue = mat(0x2f5fbf, { rough: 0.5 });
  const pinNames = ['TL', 'TR', 'BL', 'BR', '3V3', 'GND', '5V', 'PAN', 'TILT'];
  const b = makeBreakout({ w: 4.6, d: 3.2, color: PCB.green, pins: pinNames, pinsEdge: 'front', inset: 0.28, label: 'TRACKER', labelPos: [0, -0.4], labelSize: 0.28,
    silk: (P) => { P.text('4 × 10k', 0, 0.05, 0.14); for (let i = 0; i < 4; i++) P.rect(-1.2 + i * 0.8, 0.45, 0.5, 0.18, { fill: '#2a2c33' }); } });
  // base box under the PCB
  g.add(at(box(4.8, 1.2, 3.4, mat(0x3a3d46, { rough: 0.6 })), 0, 0.6, 0));
  b.group.position.y = 1.2;
  g.add(b.group);
  // pan servo body standing in the middle (shaft up)
  g.add(at(box(1.2, 1.1, 2.3, blue), 0, 1.36 + 0.55, -0.4));
  const pan = new THREE.Group();
  pan.position.set(0, 1.36 + 1.25, -0.4);
  g.add(pan);
  pan.add(at(cyl(0.3, 0.3, 0.2, mat(0xf3f1e8), { seg: 16 }), 0, 0, 0));
  // U-yoke
  const yoke = mat(0xd9d5c8, { metal: 0.3, rough: 0.4 });
  pan.add(at(box(5.3, 0.15, 0.6, yoke), 0, 0.15, 0));
  for (const s of [-1, 1]) pan.add(at(box(0.15, 2.5, 0.6, yoke), s * 2.58, 1.35, 0));
  // tilt servo on the +x arm
  pan.add(at(box(0.8, 1.0, 1.6, blue), 3.08, 2.4, 0));
  const tiltG = new THREE.Group();
  tiltG.position.set(0, 2.4, 0);
  pan.add(tiltG);
  tiltG.add(at(cyl(0.08, 0.08, 5.2, metal(), { seg: 8 }).rotateZ(Math.PI / 2), 0, 0, 0));
  const W = 4.6, D = 3.6;
  const panel = panelSlab(W, D);
  panel.position.set(0, 0.12, 0);
  tiltG.add(panel);
  // LDR cross at the panel's top edge (local -z)
  const cross = new THREE.Group();
  cross.position.set(0, 0.07, -D / 2 - 0.85);
  tiltG.add(cross);
  const CS = 1.5, WALL = 0.8;
  cross.add(at(box(CS, 0.1, CS, mat(0xf3f1ea)), 0, 0.05, 0));
  cross.add(at(box(CS, WALL, 0.06, mat(0x2a2c33)), 0, 0.1 + WALL / 2, 0));
  cross.add(at(box(0.06, WALL, CS, mat(0x2a2c33)), 0, 0.1 + WALL / 2, 0));
  tiltG.add(at(box(0.5, 0.08, 0.7, mat(0xf3f1ea)), 0, 0.07, -D / 2 - 0.15));
  const q = CS / 4;
  const ldrTex = canvasTexture(64, 64, (c) => {
    c.fillStyle = '#e8c66a'; c.beginPath(); c.arc(32, 32, 30, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#b5402e'; c.lineWidth = 5; c.beginPath();
    for (let i = 0; i < 6; i++) { c.moveTo(14, 12 + i * 8); c.lineTo(50, 12 + i * 8); }
    c.stroke();
  });
  const ldrPos = { TL: [-q, -q], TR: [q, -q], BL: [-q, q], BR: [q, q] };
  for (const [x, z] of Object.values(ldrPos)) {
    cross.add(at(cyl(0.22, 0.22, 0.12, mat(0xffffff, { map: ldrTex, unique: true }), { seg: 16 }), x, 0.16, z));
  }
  const pinsLocal = new Map([...b.pinsLocal].map(([n, p]) => [n, p.clone().add(b.group.position)]));
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, 6.6, 0) });
  let panDeg = 90, tiltDeg = 45, panGoal = 90, tiltGoal = 45;
  const apply = () => {
    pan.rotation.y = THREE.MathUtils.degToRad(panDeg - 90);
    tiltG.rotation.x = THREE.MathUtils.degToRad(tiltDeg); // positive tips the top edge back → faces +z
    g.updateMatrixWorld(true);
  };
  apply();
  const n = new THREE.Vector3(), u = new THREE.Vector3(), w = new THREE.Vector3();
  live(api, {
    get pan() { return panDeg; }, get tilt() { return tiltDeg; },
    /** Servo targets in degrees (0–180); the horns follow at ≈ 300 °/s. */
    setPan(d) { panGoal = clamp(d, 0, 180); return api; },
    setTilt(d) { tiltGoal = clamp(d, 0, 180); return api; },
    snap(p, t) { panDeg = panGoal = clamp(p, 0, 180); tiltDeg = tiltGoal = clamp(t, 0, 180); apply(); return api; },
    normal() { return new THREE.Vector3(0, 1, 0).transformDirection(tiltG.matrixWorld); },
    get center() { return tiltG.localToWorld(V(0, 0.2, 0)); },
    get crossWorld() { return cross.localToWorld(V(0, 0.5, 0)); },
    /** Light on each LDR (0..1) for a sun direction s: Lambert × shadow of the cross walls. */
    ldrLight(s) {
      n.set(0, 1, 0).transformDirection(cross.matrixWorld);
      u.set(1, 0, 0).transformDirection(cross.matrixWorld); // right
      w.set(0, 0, -1).transformDirection(cross.matrixWorld); // towards the "top" quadrants
      const sn = s.dot(n);
      if (sn <= 0.02) return [0.03, 0.03, 0.03, 0.03];
      const su = s.dot(u), sw = s.dot(w);
      const reach = (k) => clamp(((WALL / sn) * Math.abs(k)) / (CS / 2), 0, 1); // shadow length / quadrant width
      const shU = reach(su), shW = reach(sw);
      return Object.keys(ldrPos).map((name) => {
        const right = name[1] === 'R', topQ = name[0] === 'T';
        const shadedU = su > 0 ? !right : right; // wall shadows the side away from the sun
        const shadedW = sw > 0 ? !topQ : topQ;
        let f = 1;
        if (shadedU) f *= 1 - 0.85 * shU;
        if (shadedW) f *= 1 - 0.85 * shW;
        return 0.03 + sn * f;
      });
    },
    tick(dt) {
      const step = 300 * dt;
      panDeg += clamp(panGoal - panDeg, -step, step);
      tiltDeg += clamp(tiltGoal - tiltDeg, -step, step);
      apply();
    },
  });
  return tag(api, 'module', 'Dual-axis solar tracker (2 servos, 4 LDRs)');
}

// ================================================================= power box
/**
 * 12 V battery + PWM charge controller on a board. Controller terminals (pins
 * up): IN+ IN- (source), LOAD+ LOAD-. setSoc(0..1) and setCharging(on) drive
 * the display and LEDs.
 */
export function makePowerBox(pos, opts = {}) {
  const g = new THREE.Group();
  g.add(at(box(11, 0.3, 5.6, mat(0xd8cdb4, { rough: 0.8 })), 0, 0.15, 0));
  // battery (SLA)
  const bat = new THREE.Group();
  bat.add(at(box(5.0, 3.6, 3.6, mat(0x2a2c33, { rough: 0.6 })), 0, 1.8, 0));
  bat.add(at(box(5.05, 0.4, 3.65, mat(0x3a3d46)), 0, 3.4, 0));
  bat.add(at(textDecal(['12 V  7 Ah', 'SEALED LEAD-ACID'], 3.2, 1.0, { vertical: true, color: '#e9ecf5', sizes: [0.34, 0.2], font: SANS }), 0, 1.9, 1.81));
  for (const [x, c] of [[-1.7, 0xd8443a], [1.7, 0x2a2c33]]) {
    bat.add(at(box(0.6, 0.35, 0.6, mat(c)), x, 3.78, -1.1));
  }
  bat.position.set(-2.6, 0.3, 0);
  g.add(bat);
  // controller
  const ctl = new THREE.Group();
  ctl.add(at(box(4.4, 1.3, 3.4, mat(0xf3f1ea, { rough: 0.5 })), 0, 0.65, 0));
  ctl.add(at(box(4.4, 0.12, 3.4, mat(0x2f6fd8)), 0, 1.36, 0));
  let soc = 0.7, charging = false;
  const lcdCanvas = document.createElement('canvas');
  lcdCanvas.width = 256; lcdCanvas.height = 96;
  const lcdTex = new THREE.CanvasTexture(lcdCanvas);
  lcdTex.colorSpace = THREE.SRGBColorSpace;
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.75), new THREE.MeshBasicMaterial({ map: lcdTex }));
  lcd.rotation.x = -Math.PI / 2;
  lcd.position.set(-0.6, 1.43, 0.6);
  noRay(lcd);
  ctl.add(lcd);
  const drawLcd = () => {
    const c = lcdCanvas.getContext('2d');
    c.fillStyle = '#9fc6a0'; c.fillRect(0, 0, 256, 96);
    c.fillStyle = '#18301c';
    c.font = '600 34px "IBM Plex Mono", monospace';
    const v = 11.8 + soc * 1.0 + (charging ? 0.9 : 0);
    c.fillText(`${v.toFixed(1)}V`, 12, 44);
    c.font = '600 22px "IBM Plex Mono", monospace';
    c.fillText(charging ? 'CHARGING' : 'IDLE', 12, 80);
    c.strokeStyle = '#18301c'; c.lineWidth = 3; c.strokeRect(170, 16, 70, 34);
    c.fillRect(174, 20, 62 * soc, 26);
    lcdTex.needsUpdate = true;
  };
  const ledC = smdLed(0x3fdc6a, { glow: 1.0 });
  ledC.group.position.set(1.1, 1.42, 0.7);
  ctl.add(ledC.group);
  ctl.add(at(textDecal('PWM 10A', 1.4, 0.3, { color: '#1d2440', size: 0.6, font: SANS }), 1.2, 1.43, 0.15));
  const pinsLocal = new Map();
  const names = ['IN+', 'IN-', 'BAT+', 'BAT-', 'LOAD+', 'LOAD-'];
  names.forEach((nm, i) => {
    const x = -1.75 + i * 0.7;
    ctl.add(at(box(0.5, 0.35, 0.5, mat(i % 2 ? 0x2a2c33 : 0xd8443a)), x, 1.6, -1.15));
    ctl.add(at(cyl(0.12, 0.12, 0.08, metal(), { seg: 12 }), x, 1.8, -1.15));
  });
  ctl.add(at(textDecal(['PV', 'BAT', 'LOAD'].join('     '), 4.0, 0.28, { color: '#1d2440', size: 0.6, font: SANS }), 0, 1.43, -0.55));
  ctl.position.set(3.0, 0.3, 0);
  g.add(ctl);
  names.forEach((nm, i) => pinsLocal.set(nm, V(3.0 - 1.75 + i * 0.7, 0.3 + 1.84, -1.15)));
  // short battery cables to the BAT terminals
  g.add(cable([V(-4.3, 4.3, -1.1), V(-2.0, 5.0, -1.4), V(3.0 + 0.35, 2.4, -1.4), V(3.0 + 0.35, 2.12, -1.15)], 0xd8443a, 0.06));
  g.add(cable([V(-0.9, 4.3, -1.1), V(0.5, 4.4, -1.6), V(3.0 + 1.05, 2.5, -1.5), V(3.0 + 1.05, 2.12, -1.15)], 0x2a2c33, 0.06));
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(3.0, 2.8, 0) });
  api.batteryAnchor = g.localToWorld(V(-2.6, 4.6, 0));
  live(api, {
    get soc() { return soc; },
    setSoc(x) { soc = clamp(x, 0, 1); drawLcd(); return api; },
    setCharging(on) { charging = !!on; ledC.set(on ? 1 : 0); drawLcd(); return api; },
  });
  drawLcd();
  return tag(api, 'module', '12 V battery + charge controller');
}

// ================================================================= INA219
/** INA219 high-side current/voltage monitor (0.1 Ω shunt). Pins VCC GND SCL SDA VIN- VIN+; addr shown on the silk. */
export function makeINA219(pos, opts = {}) {
  const addr = opts.addr ?? '0x40';
  const b = makeBreakout({
    w: 2.6, d: 2.2, color: PCB.purple, pins: ['VCC', 'GND', 'SCL', 'SDA', 'VIN-', 'VIN+'], pinsEdge: 'back', inset: 0.22,
    label: 'INA219', labelPos: [-0.5, 0.25], labelSize: 0.2, holes: [[-1.1, 0.3], [1.1, 0.3]], holeR: 0.1,
    silk: (P) => { P.text(addr, -0.5, 0.52, 0.13); P.text('A0', 0.65, -0.35, 0.09); P.text('A1', 0.95, -0.35, 0.09); },
  });
  b.on(soic(4, { len: 0.5, wid: 0.35 }), -0.5, -0.2);
  // R100 shunt resistor
  b.on(at(box(0.62, 0.12, 0.32, mat(0x23262e)), 0, 0.06, 0), 0.55, -0.2);
  b.on(at(textDecal('R100', 0.5, 0.2, { color: '#d9dce4', size: 0.75 }), 0, 0.13, 0), 0.55, -0.2);
  smdField(b, [[0.05, -0.5], [-1.0, -0.2, Math.PI / 2]]);
  const term = screwTerminal(2, 0x2f6fd8);
  term.rotation.y = Math.PI;
  b.on(term, 0.4, 0.62);
  const api = freeApi(b.group, b.pinsLocal, pos, opts, { pick: b.group, anchor: V(0, 1.4, 0) });
  api.addr = addr;
  return tag(api, 'module', `INA219 current sensor (${addr})`);
}

// ================================================================= voltage sensor
/** "0–25 V" divider module: 30 kΩ / 7.5 kΩ (÷5). Pins S, + (not connected), - ; input terminals IN+ IN-. */
export function makeVoltageSensor(pos, opts = {}) {
  const b = makeBreakout({
    w: 2.6, d: 1.4, color: PCB.red, pins: ['S', '+', '-'], pinsEdge: 'right', inset: 0.22,
    silk: (P) => { P.text('30k', -0.15, -0.4, 0.11); P.text('7.5k', 0.35, -0.4, 0.11); P.text('0-25V', 0.1, 0.45, 0.12, { weight: 700 }); },
  });
  const term = screwTerminal(2, 0x2f6fd8);
  term.rotation.y = -Math.PI / 2;
  b.on(term, -0.85, 0);
  smdField(b, [[-0.15, -0.15, 0], [0.35, -0.15, 0]]);
  const pinsLocal = new Map(b.pinsLocal);
  const scr = term.userData.screws;
  pinsLocal.set('IN+', V(-0.85 - scr[0].z, b.top + scr[0].y, scr[0].x));
  pinsLocal.set('IN-', V(-0.85 - scr[1].z, b.top + scr[1].y, scr[1].x));
  const api = freeApi(b.group, pinsLocal, pos, opts, { pick: b.group, anchor: V(0, 1.3, 0) });
  return tag(api, 'module', 'Voltage sensor module (30k/7.5k divider)');
}

// ================================================================= dump load
/** Aluminium-clad braking resistor (e.g. 2 Ω 100 W). Pins A / B. setHeat(0..1) glows. */
export function makeDumpLoad(pos, opts = {}) {
  const g = new THREE.Group();
  const body = mat(0xc8ccd2, { metal: 0.6, rough: 0.35, unique: true });
  g.add(at(box(3.4, 0.15, 1.6, body), 0, 0.075, 0));
  const fins = new THREE.Group();
  for (let i = 0; i < 7; i++) fins.add(at(box(2.4, 0.7, 0.07, body), 0, 0.5, -0.6 + i * 0.2));
  g.add(fins);
  g.add(at(textDecal('2Ω 100W', 1.6, 0.3, { color: '#1d2440', size: 0.65, font: SANS }), 0, 0.86, 0.2).rotateZ(0));
  const pinsLocal = new Map();
  for (const [n, x] of [['A', -1.45], ['B', 1.45]]) {
    g.add(at(box(0.3, 0.1, 0.3, metal()), x, 0.2, 0));
    pinsLocal.set(n, postPin(g, x, 0.25, 0, 0.5));
  }
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, 1.4, 0) });
  const cold = new THREE.Color(0xc8ccd2), hot = new THREE.Color(0xe06a3a);
  live(api, { setHeat(h) { body.color.copy(cold).lerp(hot, clamp(h, 0, 1) * 0.7); body.emissive.setHex(0x5a1a08); body.emissiveIntensity = clamp(h, 0, 1) * 0.6; return api; } });
  return tag(api, 'part', 'Braking resistor (dump load)');
}

// ================================================================= PMS5003
/**
 * Plantower PMS5003-style laser particle sensor (50 × 38 × 21 mm metal box)
 * with its 8-way cable on an adapter: pins VCC GND SET RX TX RST (5 V supply,
 * 3.3 V UART). Air enters at the +z face; setAir(pm25) fills the air with
 * drifting particles.
 */
export function makePMS5003(pos, opts = {}) {
  const g = new THREE.Group();
  const can = mat(0xcfd2d6, { metal: 0.55, rough: 0.35 });
  const BW = 5.0, BH = 2.1, BD = 3.8;
  g.add(at(box(BW, BH, BD, can), 0, BH / 2 + 0.05, 0));
  const lab = decal(3.6, 2.6, (c, w, h) => {
    c.fillStyle = '#f3f1ea'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#1d2440';
    c.font = `700 ${h * 0.16}px ${SANS}`; c.textAlign = 'center';
    c.fillText('PMS5003', w / 2, h * 0.3);
    c.font = `600 ${h * 0.09}px ${SANS}`;
    c.fillText('LASER PM2.5 SENSOR', w / 2, h * 0.48);
    c.fillText('5V · UART 9600', w / 2, h * 0.64);
    c.fillText('AIR IN  ▶', w / 2, h * 0.84);
  });
  lab.position.set(-0.3, BH + 0.056, -0.1);
  g.add(lab);
  // inlet slots + fan outlet on the +z face
  for (let i = 0; i < 5; i++) g.add(at(box(0.9, 0.1, 0.02, mat(0x1a1b1f), { outline: false }), -1.3, 0.55 + i * 0.25, BD / 2 + 0.006));
  const fanRing = new THREE.Mesh(new THREE.CircleGeometry(0.78, 28), mat(0x1a1b1f));
  fanRing.position.set(1.15, BH / 2 + 0.05, BD / 2 + 0.008);
  g.add(fanRing);
  const fan = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const bl = box(0.16, 0.62, 0.02, mat(0x3a3d46), { outline: false });
    bl.position.y = 0.36; bl.rotation.y = 0.5;
    const arm = new THREE.Group(); arm.add(bl); arm.rotation.z = (i / 7) * Math.PI * 2; fan.add(arm);
  }
  fan.position.set(1.15, BH / 2 + 0.05, BD / 2 + 0.02);
  g.add(fan);
  // cable to the adapter behind
  const ad = makeBreakout({ w: 2.2, d: 1.1, color: PCB.black, pins: ['VCC', 'GND', 'SET', 'RX', 'TX', 'RST'], pinsEdge: 'back', inset: 0.22, label: 'PMS ADAPTER', labelPos: [0, 0.25], labelSize: 0.15 });
  ad.group.position.set(0, 0, -BD / 2 - 1.6);
  g.add(ad.group);
  ad.on(jst(8, 0.125), 0, 0.3);
  g.add(cable([V(-1.8, 0.5, -BD / 2 - 0.01), V(-1.5, 0.4, -BD / 2 - 0.8), V(0, 0.55, -BD / 2 - 1.1), V(0, 0.6, -BD / 2 - 1.3)], 0xe9e5d8, 0.08));
  const pinsLocal = new Map([...ad.pinsLocal].map(([n, p]) => [n, p.clone().add(ad.group.position)]));
  // particles drifting towards the inlet
  const N = 90;
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial({ color: 0x6b6156, transparent: true, opacity: 0.75 }), N);
  noRay(dots);
  g.add(dots);
  const r = rng(5);
  const P = [...Array(N)].map(() => ({ x: (r() - 0.5) * 6, y: 0.3 + r() * 3, z: BD / 2 + r() * 4, s: 0.5 + r() }));
  const o = new THREE.Object3D();
  let pm = 10, ang = 0, running = true;
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, BH + 1.0, 0) });
  live(api, {
    get pm25() { return pm; },
    /** Particle concentration around the sensor (µg/m³ PM2.5). */
    setAir(v) { pm = Math.max(0, v); return api; },
    setFan(on) { running = !!on; return api; },
    tick(dt) {
      if (running) ang += dt * 12;
      fan.rotation.z = ang;
      const shown = Math.round(clamp(Math.sqrt(pm / 300), 0, 1) * N);
      P.forEach((p, i) => {
        p.z -= dt * (running ? 0.9 : 0.15) * p.s;
        p.x += (-1.3 - p.x) * dt * 0.25;
        p.y += (1.0 - p.y) * dt * 0.15;
        if (p.z < BD / 2 + 0.05) { p.z = BD / 2 + 3.5 + r() * 1.5; p.x = (r() - 0.5) * 6; p.y = 0.3 + r() * 3; }
        o.position.set(p.x, p.y, p.z);
        o.scale.setScalar(i < shown ? p.s : 0.0001);
        o.updateMatrix();
        dots.setMatrixAt(i, o.matrix);
      });
      dots.instanceMatrix.needsUpdate = true;
    },
  });
  return tag(api, 'sensor', 'PMS5003 laser particle sensor');
}

// ================================================================= SGP30
/** SGP30 TVOC / eCO₂ gas sensor breakout (I²C 0x58, 3.3 V). Pins VIN GND SCL SDA. */
export function makeSGP30(pos, opts = {}) {
  const b = makeBreakout({
    w: 1.8, d: 1.5, color: PCB.purple, pins: ['VIN', 'GND', 'SCL', 'SDA'], pinsEdge: 'back', inset: 0.2,
    label: 'SGP30', labelPos: [0, 0.5], labelSize: 0.18, holes: [[-0.65, 0.4], [0.65, 0.4]], holeR: 0.1,
  });
  const chip = qfn(0.3, { color: 0x2a2c33 });
  b.on(chip, 0, 0.05);
  b.on(at(cyl(0.08, 0.08, 0.01, mat(0xe9e5d8), { seg: 12, outline: false }), 0, 0.1, 0), 0, 0.05);
  smdField(b, [[-0.4, 0.05], [0.4, 0.05], [0.35, 0.4, Math.PI / 2]]);
  const api = freeApi(b.group, b.pinsLocal, pos, opts, { pick: b.group, anchor: V(0, 1.2, 0) });
  return tag(api, 'sensor', 'SGP30 gas sensor (TVOC / eCO₂)');
}

// ================================================================= water lab
/**
 * Beaker of water in a retort stand with a pH probe (Gravity-style analog pH
 * board, BNC), a TDS probe (analog TDS board) and a DS18B20 waterproof
 * temperature probe (adapter with 4.7 kΩ pull-up). Pins on the three boards:
 * PH_+ PH_- PH_A, TDS_+ TDS_- TDS_A, T_VCC T_GND T_DQ.
 * setWater({ color, turbidity 0..1 }) changes the look of the sample.
 */
export function makeWaterLab(pos, opts = {}) {
  const g = new THREE.Group();
  const BR = 2.6, BH = 6.2;
  // stand
  g.add(at(box(9.8, 0.35, 8.2, mat(0x3a3d46, { rough: 0.6 })), 0.2, 0.175, 0.7));
  g.add(at(cyl(0.14, 0.14, 13, metal(), { seg: 12 }), -3.6, 0.35 + 6.5, -2.4));
  // beaker
  const glass = mat(0xe6f4fb, { rough: 0.05, opacity: 0.28, side: THREE.DoubleSide });
  g.add(at(cyl(BR, BR, BH, glass, { seg: 40 }), 0, 0.35 + BH / 2, 0));
  g.add(at(cyl(BR + 0.08, BR + 0.08, 0.15, mat(0xe6f4fb, { rough: 0.1, opacity: 0.5 }), { seg: 40 }), 0, 0.35 + BH, 0));
  const marks = decal(2.2, 4.2, (c, w, h) => {
    c.strokeStyle = 'rgba(40,60,90,.7)'; c.fillStyle = 'rgba(40,60,90,.8)'; c.lineWidth = 3;
    c.font = `600 ${h * 0.045}px ${MONO}`;
    for (let i = 0; i <= 8; i++) { const y = h - (i / 8) * h * 0.95 - 4; c.beginPath(); c.moveTo(0, y); c.lineTo(i % 2 ? w * 0.25 : w * 0.45, y); c.stroke(); if (!(i % 2)) c.fillText(`${i * 50}`, w * 0.5, y + 6); }
  }, { vertical: true });
  marks.position.set(0.6, 0.35 + 0.4 + 2.1, BR + 0.02);
  g.add(marks);
  const water = mat(0x7fc3e8, { rough: 0.15, opacity: 0.55, unique: true });
  const WH = 4.6;
  g.add(at(cyl(BR - 0.08, BR - 0.08, WH, water, { seg: 40, outline: false }), 0, 0.42 + WH / 2, 0));
  const surface = new THREE.Mesh(new THREE.CircleGeometry(BR - 0.08, 40), water);
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = 0.42 + WH + 0.002;
  noRay(surface);
  g.add(surface);
  // suspended particles (turbidity)
  const N = 70;
  const silt = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 6, 4), mat(0x8a6a45, { rough: 0.9 }), N);
  noRay(silt);
  g.add(silt);
  const r = rng(11);
  const S = [...Array(N)].map(() => ({ a: r() * 6.28, rr: r() * (BR - 0.4), y: 0.6 + r() * (WH - 0.4), s: r() }));
  // clamp arm + probes
  const probeY = 0.42 + 0.6; // probe tips just above the floor
  const clampY = 9.8;
  g.add(at(box(4.6, 0.3, 0.4, metal()), -1.4, clampY, -2.4));
  g.add(at(box(0.4, 0.3, 2.6, metal()), 0.4, clampY, -1.2));
  const probe = (x, z, r0, len, color, capColor) => {
    const p = new THREE.Group();
    p.add(at(cyl(r0, r0, len, mat(color, { rough: 0.3, opacity: color === 0xd9eef7 ? 0.7 : 1 }), { seg: 20 }), 0, len / 2, 0));
    p.add(at(cyl(r0 * 1.2, r0 * 1.2, 1.4, mat(capColor, { rough: 0.5 }), { seg: 20 }), 0, len + 0.7, 0));
    p.position.set(x, probeY, z);
    g.add(p);
    return p;
  };
  const phP = probe(-0.9, -0.6, 0.42, clampY - probeY - 0.6, 0xd9eef7, 0x2a2c33);
  phP.add(at(mesh(new THREE.SphereGeometry(0.42, 16, 10), mat(0xeaf6fb, { rough: 0.05, opacity: 0.75 })), 0, 0, 0));
  const tdsP = probe(0.6, -0.9, 0.36, clampY - probeY - 0.6, 0x24262c, 0x24262c);
  for (const dx of [-0.12, 0.12]) tdsP.add(at(cyl(0.04, 0.04, 0.5, metal(), { seg: 8 }), dx, -0.2, 0));
  const tP = probe(1.2, 0.5, 0.2, 7.5, 0xc9ccd2, 0x24262c);
  tP.children[0].material = metal();
  // clamp jaws around the pH and TDS probes
  for (const [x, z] of [[-0.9, -0.6], [0.6, -0.9]]) g.add(at(cyl(0.6, 0.6, 0.35, mat(0x2a2c33), { seg: 16 }), x, clampY, z));
  g.add(at(box(2.0, 0.2, 0.3, metal()), -0.15, clampY, -0.75));
  // interface boards on the stand base (front)
  const boards = [
    ['PH', 'pH METER', 0x2a5cb8, -2.9],
    ['TDS', 'TDS METER', 0x2a5cb8, 0.3],
    ['T', 'DS18B20', 0x25262b, 3.3],
  ];
  const pinsLocal = new Map();
  const bz = 3.7;
  for (const [key, label, color, x] of boards) {
    const names = key === 'T' ? ['T_VCC', 'T_GND', 'T_DQ'] : [`${key}_+`, `${key}_-`, `${key}_A`];
    const b = makeBreakout({ w: 2.3, d: 1.6, color, pins: names, pinsEdge: 'front', inset: 0.22, pinText: Object.fromEntries(names.map((n) => [n, n.split('_')[1].replace('VCC', '+').replace('GND', '-').replace('DQ', 'D')])), label, labelPos: [0, -0.15], labelSize: 0.17 });
    b.group.position.set(x, 0.35, bz);
    g.add(b.group);
    if (key === 'PH') {
      const bnc = cyl(0.3, 0.3, 0.6, metal(), { seg: 16 });
      bnc.rotation.x = Math.PI / 2;
      b.on(bnc, 0, -0.55, 0.3);
    } else b.on(jst(2, 0.25), 0, -0.5);
    if (key === 'T') smdField(b, [[0.6, -0.5]]);
    else b.on(soic(4, { len: 0.5, wid: 0.35 }), 0.6, -0.5);
    for (const [n, p] of b.pinsLocal) pinsLocal.set(n, p.clone().add(b.group.position));
  }
  // probe cables to the boards
  g.add(cable([V(-0.9, clampY + 0.75, -0.6), V(-1.2, clampY + 1.6, -0.6), V(-3.6, 8.5, 1.2), V(-3.4, 2.0, 3.0), V(-2.9, 1.0, 3.15), V(-2.9, 0.85, 3.05)], 0x24262c, 0.07));
  g.add(cable([V(0.6, clampY + 0.75, -0.9), V(1.0, clampY + 1.7, -0.9), V(3.4, 8.5, 0.6), V(1.2, 2.2, 3.0), V(0.3, 1.0, 3.25), V(0.3, 0.85, 3.2)], 0x24262c, 0.06));
  g.add(cable([V(1.2, probeY + 8.85, 0.5), V(1.6, probeY + 9.5, 0.8), V(4.4, 7.0, 1.8), V(3.6, 2.0, 3.1), V(3.3, 1.0, 3.25), V(3.3, 0.85, 3.2)], 0x24262c, 0.05));
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, BH + 1.0, 0) });
  api.phAnchor = g.localToWorld(V(-0.9, clampY + 0.9, -0.6));
  api.tdsAnchor = g.localToWorld(V(0.6, clampY + 0.9, -0.9));
  api.boardAnchor = g.localToWorld(V(0.3, 1.4, 3.7));
  api.beakerAnchor = g.localToWorld(V(0, 0.35 + BH * 0.6, BR));
  const o = new THREE.Object3D();
  let turb = 0, t = 0;
  const base = new THREE.Color();
  live(api, {
    get turbidity() { return turb; },
    /** color: hex of the water; turbidity 0 (clear) .. 1 (muddy). */
    setWater({ color = 0x7fc3e8, turbidity = 0 } = {}) {
      turb = clamp(turbidity, 0, 1);
      base.setHex(color);
      water.color.copy(base).lerp(new THREE.Color(0x8a6a45), turb * 0.6);
      water.opacity = 0.42 + turb * 0.5;
      return api;
    },
    tick(dt) {
      t += dt;
      const shown = Math.round(turb * N);
      S.forEach((s, i) => {
        const a = s.a + t * 0.2 * (0.5 + s.s);
        o.position.set(Math.cos(a) * s.rr, s.y + Math.sin(t + i) * 0.1, Math.sin(a) * s.rr);
        o.scale.setScalar(i < shown ? 1 : 0.0001);
        o.updateMatrix();
        silt.setMatrixAt(i, o.matrix);
      });
      silt.instanceMatrix.needsUpdate = true;
    },
  });
  api.setWater({});
  return tag(api, 'module', 'Water lab: beaker, pH, TDS and DS18B20 probes');
}

// ================================================================= water tank
/**
 * 1:10 model of an 80 cm water tank: level 0..1, HC-SR04-style sensor on the
 * lid looking down (VCC TRIG ECHO GND), a low-level float switch (FLOAT, FLOAT_G)
 * and a submersible 12 V pump (PUMP+, PUMP-) whose tube ends at opts.tubeEnd.
 * distanceCm() is the real-scale distance from the sensor to the water.
 */
export function makeWaterTank(pos, opts = {}) {
  const g = new THREE.Group();
  const R = 3.0, H = 8.0, SCALE = 10;
  g.add(at(cyl(R + 0.3, R + 0.3, 0.3, mat(0x9aa0a8), { seg: 32 }), 0, 0.15, 0));
  const shell = mat(0xd9eef7, { rough: 0.1, opacity: 0.32, side: THREE.DoubleSide });
  g.add(at(cyl(R, R, H, shell, { seg: 36 }), 0, 0.3 + H / 2, 0));
  for (const y of [0.3 + H * 0.33, 0.3 + H * 0.66]) g.add(at(new THREE.Mesh(new THREE.TorusGeometry(R + 0.02, 0.06, 6, 36), mat(0xb9c4cc)).rotateX(Math.PI / 2), 0, y, 0));
  g.add(at(cyl(R + 0.1, R + 0.1, 0.25, mat(0x5d8fb3, { rough: 0.5 }), { seg: 36 }), 0, 0.3 + H + 0.12, 0));
  const water = mat(0x4aa6e8, { rough: 0.2, opacity: 0.55, unique: true });
  const wCol = cyl(R - 0.1, R - 0.1, 1, water, { seg: 36, outline: false });
  g.add(wCol);
  // level scale
  g.add(at(decal(0.8, H * 0.9, (c, w, h) => {
    c.strokeStyle = 'rgba(30,50,80,.75)'; c.fillStyle = 'rgba(30,50,80,.85)'; c.lineWidth = 3;
    c.font = `600 ${w * 0.3}px ${MONO}`;
    for (let i = 0; i <= 10; i++) { const y = h - (i / 10) * h * 0.98 - 3; c.beginPath(); c.moveTo(0, y); c.lineTo(i % 5 ? w * 0.3 : w * 0.55, y); c.stroke(); if (!(i % 5)) c.fillText(`${i * 10}%`, w * 0.35, y - 4); }
  }, { vertical: true }), 0, 0.3 + H * 0.45 + 0.1, R + 0.02));
  // ultrasonic sensor on a bracket over the lid, transducers facing down
  const us = makeBreakout({ w: 4.5, d: 2.0, color: PCB.blue, pins: ['VCC', 'TRIG', 'ECHO', 'GND'], pinsEdge: 'front', inset: 0.25, label: 'HC-SR04', labelPos: [0, -0.35], labelSize: 0.2 });
  const usY = 0.3 + H + 0.25 + 1.2;
  us.group.position.set(-0.6, usY, 0);
  g.add(us.group);
  for (const x of [-1.25, 1.25]) {
    const tr = cyl(0.8, 0.8, 1.1, metal(), { seg: 24 });
    g.add(at(tr, -0.6 + x, usY - 0.55, -0.1));
    g.add(at(cyl(0.7, 0.7, 0.02, mat(0x2a2c33), { seg: 24, outline: false }), -0.6 + x, usY - 1.11, -0.1));
  }
  for (const x of [-2.6, 1.4]) g.add(at(box(0.25, 1.25, 0.25, mat(0x9aa0a8)), x, 0.3 + H + 0.85, 0.3));
  const pinsLocal = new Map([...us.pinsLocal].map(([n, p]) => [n, p.clone().add(us.group.position)]));
  // float switch (low-level cut-off) on the side wall
  const FLOAT_Y = 0.3 + H * 0.2;
  g.add(at(cyl(0.06, 0.06, 1.6, metal(), { seg: 8 }), R - 0.6, FLOAT_Y, 0.8));
  const flt = at(cyl(0.3, 0.3, 0.45, mat(0xf3f1ea), { seg: 16 }), R - 0.6, FLOAT_Y - 0.4, 0.8);
  g.add(flt);
  g.add(cable([V(R - 0.6, FLOAT_Y + 0.8, 0.8), V(R - 0.4, H * 0.6, 1.0), V(R - 0.2, H + 0.6, 1.1), V(R + 0.9, H + 0.4, 1.2), V(R + 1.3, 0.8, 1.2)], 0x2a2c33, 0.04));
  g.add(at(box(1.2, 0.4, 0.8, mat(0x24262c)), R + 1.6, 0.5, 1.2));
  pinsLocal.set('FLOAT', postPin(g, R + 1.35, 0.7, 1.2, 0.5));
  pinsLocal.set('FLOAT_G', postPin(g, R + 1.85, 0.7, 1.2, 0.5));
  // pump on the floor
  const pump = new THREE.Group();
  pump.add(at(box(1.4, 1.1, 1.0, mat(0x2a2c33, { rough: 0.55 })), 0, 0.55, 0));
  pump.add(at(cyl(0.15, 0.15, 0.6, mat(0x2a2c33), { seg: 12 }), 0.3, 1.4, 0));
  pump.position.set(-1.0, 0.32, 0.8);
  g.add(pump);
  g.add(cable([V(-1.4, 1.0, 1.2), V(-1.8, H * 0.6, 1.6), V(-R + 0.3, H + 0.5, 1.6), V(-R - 0.8, H + 0.2, 1.4), V(-R - 1.3, 0.8, 1.4)], 0xd8443a, 0.04));
  g.add(at(box(1.2, 0.4, 0.8, mat(0x24262c)), -R - 1.6, 0.5, 1.4));
  pinsLocal.set('PUMP+', postPin(g, -R - 1.85, 0.7, 1.4, 0.5));
  pinsLocal.set('PUMP-', postPin(g, -R - 1.35, 0.7, 1.4, 0.5));
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, H + 3.6, 0) });
  const W = (x, y, z) => g.localToWorld(V(x, y, z));
  const extras = [];
  // outlet tube
  if (opts.tubeEnd) {
    const top = W(-0.7, 2.0, 0.8);
    const rise = W(-0.5, H + 1.0, 0.8);
    const end = opts.tubeEnd.clone();
    const mid = rise.clone().lerp(end, 0.5);
    mid.y = Math.max(rise.y, end.y) + 0.6;
    const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([top, W(-0.6, H - 1, 0.8), rise, mid, end.clone().add(V(0, 0.8, 0)), end]), 64, 0.14, 8, false), mat(0x2a2c33, { rough: 0.6 }));
    noRay(t);
    extras.push(t);
  }
  let level = 0.6, pumping = false, buzz = 0;
  const place = () => {
    const h = Math.max(0.02, level * (H - 0.4));
    wCol.scale.y = h;
    wCol.position.y = 0.32 + h / 2;
    const fy = clamp(0.32 + h, FLOAT_Y - 0.4, FLOAT_Y + 0.4);
    flt.position.y = fy;
  };
  place();
  live(api, {
    extras,
    get level() { return level; },
    get pumping() { return pumping; },
    setLevel(x) { level = clamp(x, 0, 1); place(); return api; },
    setPump(on) { pumping = !!on; return api; },
    /** Float switch contact: closed while water lifts the float. */
    get floatClosed() { return level * (H - 0.4) + 0.32 > FLOAT_Y; },
    /** Real-scale distance (cm) from the sensor face to the water surface. */
    distanceCm() { return ((usY - 1.1) - (0.32 + level * (H - 0.4))) * SCALE; },
    get depthCm() { return (H - 0.4) * SCALE; },
    get sensorGapCm() { return ((usY - 1.1) - (0.32 + H - 0.4)) * SCALE; },
    tick(dt) { buzz += dt * 60; pump.position.x = -1.0 + (pumping ? Math.sin(buzz) * 0.03 : 0); },
  });
  return tag(api, 'module', 'Water tank with level sensor, float switch and pump');
}

// ================================================================= rain sensor
/**
 * YL-83-style rain plate on stand-offs plus its LM393 board (VCC GND DO AO).
 * setWet(0..1) shows droplets; setRain(on) lets drops fall from a small cloud.
 */
export function makeRainSensor(pos, opts = {}) {
  const g = new THREE.Group();
  const plate = new THREE.Group();
  const PW = 5.4, PD = 4.0;
  plate.add(at(box(PW, 0.16, PD, mat(0x2c5bb8, { rough: 0.4 })), 0, 0.08, 0));
  const trace = decal(PW - 0.3, PD - 0.3, (c, w, h) => {
    c.strokeStyle = '#d8dee8'; c.lineWidth = w * 0.012;
    const n = 9;
    for (let i = 0; i < n; i++) {
      const y = (h * (i + 0.5)) / n;
      c.beginPath();
      if (i % 2) { c.moveTo(w * 0.06, y); c.lineTo(w * 0.97, y); } else { c.moveTo(w * 0.03, y); c.lineTo(w * 0.94, y); }
      c.stroke();
    }
    c.beginPath(); c.moveTo(w * 0.03, 0); c.lineTo(w * 0.03, h); c.moveTo(w * 0.97, 0); c.lineTo(w * 0.97, h); c.stroke();
  });
  trace.position.y = 0.165;
  plate.add(trace);
  for (const [x, z] of [[-2.3, -1.6], [2.3, -1.6], [-2.3, 1.6], [2.3, 1.6]]) g.add(at(cyl(0.12, 0.12, 0.6, mat(0xd6b46a, { metal: 0.5 }), { seg: 8 }), x, 0.3, z));
  plate.position.y = 0.6;
  g.add(plate);
  const N = 24;
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 10, 6), mat(0xbfe6ff, { rough: 0.05, opacity: 0.8 }), N);
  noRay(drops);
  plate.add(drops);
  const r = rng(3);
  const spots = [...Array(N)].map(() => [(r() - 0.5) * (PW - 0.8), (r() - 0.5) * (PD - 0.8), 0.6 + r() * 0.6]);
  // comparator board
  const b = makeBreakout({ w: 3.0, d: 1.4, color: PCB.blue, pins: ['VCC', 'GND', 'DO', 'AO'], pinsEdge: 'right', inset: 0.2, label: 'LM393', labelPos: [-0.4, 0.45], labelSize: 0.14 });
  b.group.position.set(PW / 2 + 2.4, 0, 0.6);
  g.add(b.group);
  b.on(soic(4, { len: 0.55, wid: 0.38 }), -0.4, 0);
  const pot = trimpot3296({ w: 0.6, d: 0.5, h: 0.5 });
  b.on(pot, 0.3, -0.35);
  const pwr = smdLed(0xff3b2f); b.on(pwr.group, -1.1, -0.45); pwr.set(1);
  const dLed = smdLed(0x3fdc6a); b.on(dLed.group, -1.1, 0.45);
  b.on(jst(2, 0.25), -1.2, 0);
  g.add(cable([V(PW / 2 - 0.1, 0.75, 0.6), V(PW / 2 + 0.5, 0.5, 0.6), V(PW / 2 + 1.2, 0.45, 0.6)], 0x2a2c33, 0.04));
  const pinsLocal = new Map([...b.pinsLocal].map(([n, p]) => [n, p.clone().add(b.group.position)]));
  // cloud + falling drops
  const cloud = new THREE.Group();
  const cm = mat(0xdfe4ec, { rough: 0.9, unique: true });
  for (const [x, y, z, s] of [[0, 0, 0, 1.3], [1.2, -0.2, 0.2, 1.0], [-1.2, -0.25, 0, 1.0], [0.4, 0.5, -0.2, 0.9]]) cloud.add(at(mesh(new THREE.SphereGeometry(s, 16, 10), cm, { outline: false }), x, y, z));
  cloud.position.set(0, 7.5, 0);
  cloud.visible = !!opts.cloud;
  g.add(cloud);
  const NF = 16;
  const fall = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 5), mat(0x7fc3e8, { opacity: 0.8 }), NF);
  noRay(fall);
  g.add(fall);
  const F = [...Array(NF)].map(() => ({ x: (r() - 0.5) * 3.6, z: (r() - 0.5) * 2, y: r() * 6 }));
  const o = new THREE.Object3D();
  let wet = 0, raining = false;
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, 2.2, 0) });
  live(api, {
    get wet() { return wet; },
    get raining() { return raining; },
    setWet(x) {
      wet = clamp(x, 0, 1);
      const n = Math.round(wet * N);
      spots.forEach(([x0, z0, s], i) => { o.position.set(x0, 0.2, z0); o.scale.set(s, i < n ? 0.35 * s : 0.0001, s); o.updateMatrix(); drops.setMatrixAt(i, o.matrix); });
      drops.instanceMatrix.needsUpdate = true;
      return api;
    },
    setDetect(on) { dLed.set(on ? 1 : 0); return api; },
    setRain(on) { raining = !!on; cm.color.setHex(on ? 0x9aa3b2 : 0xdfe4ec); return api; },
    tick(dt) {
      F.forEach((f, i) => {
        f.y -= dt * 9;
        if (f.y < 0.8) f.y += 6;
        o.position.set(f.x, f.y, f.z);
        o.scale.setScalar(raining && cloud.visible ? 1 : 0.0001);
        o.updateMatrix();
        fall.setMatrixAt(i, o.matrix);
      });
      fall.instanceMatrix.needsUpdate = true;
    },
  });
  api.cloudAnchor = g.localToWorld(V(0, 9, 0));
  api.setWet(0);
  return tag(api, 'sensor', 'Rain sensor plate + LM393 board');
}

// ================================================================= field bed
/**
 * Raised bed with `zones` irrigation zones (along x). Each zone has a row of
 * crops, a capacitive soil probe (pins GNDn VCCn AOUTn, pointing up), a drip
 * line and a 12 V solenoid valve at the back (Vn+ / Vn-). `inlet` is the
 * world point where the supply pipe enters the manifold.
 * setMoisture(i, 0..1), setValve(i, on).
 */
export function makeFieldBed(pos, opts = {}) {
  const g = new THREE.Group();
  const Z = opts.zones ?? 2;
  const ZW = opts.zoneW ?? 8.5, D = opts.depth ?? 7, H = 1.6;
  const W = Z * ZW;
  const wood = mat(0xb5824e, { rough: 0.8 });
  for (const s of [-1, 1]) {
    g.add(at(box(W + 0.6, H, 0.3, wood), 0, H / 2, s * (D / 2 + 0.15)));
    g.add(at(box(0.3, H, D, wood), s * (W / 2 + 0.15), H / 2, 0));
  }
  for (let i = 1; i < Z; i++) g.add(at(box(0.15, H - 0.1, D, wood), -W / 2 + i * ZW, H / 2, 0));
  const zones = [];
  const leafGeo = new THREE.SphereGeometry(0.42, 10, 8);
  leafGeo.scale(1, 0.5, 0.6);
  const pinsLocal = new Map();
  for (let i = 0; i < Z; i++) {
    const cx = -W / 2 + ZW * (i + 0.5);
    const soil = mat(0x6b4a30, { rough: 0.95, unique: true });
    g.add(at(box(ZW - 0.2, 0.1, D, soil, { outline: false }), cx, H - 0.25, 0));
    const leaf = mat(0x52b85a, { rough: 0.55, unique: true });
    const plants = [];
    for (const row of [-1.6, 1.4]) for (let k = 0; k < 3; k++) {
      const p = new THREE.Group();
      p.position.set(cx - ZW / 2 + 1.6 + k * 2.4 + (row > 0 ? 0.6 : 0), H - 0.2, row);
      for (let j = 0; j < 5; j++) {
        const lf = mesh(leafGeo, leaf, { edgeAngle: 45 });
        lf.position.set(0, 0.25 + j * 0.06, 0);
        lf.rotation.set(0.4, (j / 5) * Math.PI * 2, 0);
        lf.translateZ(0.35);
        p.add(lf);
      }
      p.add(at(mesh(new THREE.SphereGeometry(0.3, 10, 8), leaf), 0, 0.45, 0));
      g.add(p);
      plants.push(p);
    }
    // drip line along the middle with emitters
    g.add(at(cyl(0.07, 0.07, ZW - 0.6, mat(0x24262c), { seg: 8 }).rotateZ(Math.PI / 2), cx, H - 0.12, -0.1));
    const drips = [0, 1, 2].map((k) => {
      const d = mesh(new THREE.SphereGeometry(0.1, 8, 6), mat(0x4aa6e8, { opacity: 0.85 }), { outline: false });
      d.position.set(cx - ZW / 2 + 1.8 + k * 2.6, H - 0.15, -0.1);
      d.visible = false;
      noRay(d);
      g.add(d);
      return d;
    });
    // valve at the back wall
    const vx = cx - ZW / 2 + 1.4, vz = -D / 2 - 1.0;
    g.add(at(box(0.9, 0.7, 0.9, mat(0xc7a44a, { metal: 0.5, rough: 0.4 })), vx, 0.35, vz));
    g.add(at(cyl(0.38, 0.38, 0.8, mat(0x24262c), { seg: 16 }), vx, 1.1, vz));
    g.add(cable([V(vx + 0.45, 0.35, vz), V(vx + 0.9, 0.5, vz), V(vx + 1.0, H + 0.3, -D / 2 + 0.1), V(vx + 1.0, H - 0.12, -0.1), V(vx + 1.3, H - 0.12, -0.1)], 0x24262c, 0.08));
    pinsLocal.set(`V${i + 1}+`, postPin(g, vx - 0.15, 1.5, vz, 0.45));
    pinsLocal.set(`V${i + 1}-`, postPin(g, vx + 0.15, 1.5, vz, 0.45));
    // probe: black blade, pins at the top
    const px = cx + ZW / 2 - 1.3, pz = 0.2;
    const probe = new THREE.Group();
    probe.add(at(box(1.4, 4.2, 0.12, mat(0x1f2024, { rough: 0.5 })), 0, 2.1, 0));
    probe.add(at(textDecal(['SOIL', `Z${i + 1}`], 1.1, 0.7, { vertical: true, color: '#f1efe6', sizes: [0.3, 0.36], font: SANS }), 0, 3.4, 0.065));
    probe.add(at(box(0.9, 0.45, 0.45, mat(0xf0ece0)), 0, 4.4, 0));
    probe.position.set(px, 0.2, pz);
    g.add(probe);
    ['GND', 'VCC', 'AOUT'].forEach((n, k) => pinsLocal.set(`${n}${i + 1}`, postPin(g, px + (k - 1) * PITCH, 0.2 + 4.625, pz, 0.6)));
    zones.push({ soil, leaf, plants, drips, m: 0.5, on: false, t: 0, cx });
  }
  // manifold pipe behind the valves
  const mz = -D / 2 - 1.0;
  g.add(at(cyl(0.12, 0.12, W - 1.0, mat(0x2a2c33), { seg: 10 }).rotateZ(Math.PI / 2), 0, 0.2, mz - 0.7));
  zones.forEach((zn, i) => g.add(at(cyl(0.1, 0.1, 0.7, mat(0x2a2c33), { seg: 8 }).rotateX(Math.PI / 2), -W / 2 + ZW * (i + 0.5) - ZW / 2 + 1.4, 0.2, mz - 0.35)));
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, H + 2.6, 0) });
  api.inlet = g.localToWorld(V(-W / 2 + 0.3, 0.2, mz - 0.7));
  api.zoneAnchor = (i) => g.localToWorld(V(-W / 2 + ZW * (i + 0.5), H + 1.4, 0));
  api.valveAnchor = (i) => g.localToWorld(V(-W / 2 + ZW * (i + 0.5) - ZW / 2 + 1.4, 1.6, mz));
  const dry = new THREE.Color(0xb08a5e), wetC = new THREE.Color(0x3a2618);
  const leafDry = new THREE.Color(0xa7b04a), leafWet = new THREE.Color(0x46b456);
  live(api, {
    zones: Z,
    moisture: (i) => zones[i].m,
    setMoisture(i, m) {
      const z = zones[i];
      z.m = clamp(m, 0, 1);
      z.soil.color.copy(dry).lerp(wetC, z.m);
      z.leaf.color.copy(leafDry).lerp(leafWet, clamp(z.m * 1.6, 0, 1));
      z.plants.forEach((p) => p.scale.set(1, 0.7 + clamp(z.m * 1.6, 0, 1) * 0.3, 1));
      return api;
    },
    setValve(i, on) { zones[i].on = !!on; return api; },
    valve: (i) => zones[i].on,
    tick(dt) {
      for (const z of zones) {
        z.t += dt;
        z.drips.forEach((d, k) => {
          const ph = (z.t * 1.4 + k * 0.33) % 1;
          d.visible = z.on;
          d.position.y = H - 0.15 - ph * 0.35;
          d.scale.setScalar(1 - ph * 0.5);
        });
      }
    },
  });
  for (let i = 0; i < Z; i++) api.setMoisture(i, 0.5);
  return tag(api, 'module', `Raised field bed, ${Z} zones with soil probes and valves`);
}

// ================================================================= relay board
/** n-channel 5 V relay board (active-LOW inputs, like the common blue boards). Pins GND IN1..INn VCC; terminals NOk COMk NCk. */
export function makeRelayBoard(pos, opts = {}) {
  const n = opts.channels ?? 3;
  const w = 1.9 * n + 0.8;
  const ins = [...Array(n)].map((_, i) => `IN${i + 1}`);
  const b = makeBreakout({ w, d: 5.0, color: PCB.blue, pins: ['GND', ...ins, 'VCC'], pinsEdge: 'front', inset: 0.22, label: `${n}-CH RELAY`, labelPos: [0, 1.65], labelSize: 0.24 });
  const leds = [];
  const pinsLocal = new Map(b.pinsLocal);
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 1.9;
    const rel = new THREE.Group();
    rel.add(at(box(1.55, 1.5, 1.9, mat(0x2f6fd8, { rough: 0.4 })), 0, 0.75, 0));
    rel.add(at(textDecal(['SRD-05VDC', '10A 250VAC'], 1.3, 1.2, { color: '#e9f2ff', sizes: [0.2, 0.16], font: SANS }), 0, 1.505, 0));
    b.on(rel, x, -0.6);
    const t = screwTerminal(3, 0x2f6fd8);
    t.rotation.y = Math.PI;
    b.on(t, x, -2.05);
    t.userData.screws.forEach((s, k) => {
      const nm = ['NO', 'COM', 'NC'][k];
      pinsLocal.set(`${nm}${i + 1}`, V(x - s.x, b.top + s.y, -2.05 - s.z));
    });
    const led = smdLed(0xff3b2f);
    b.on(led.group, x - 0.5, 1.1);
    leds.push(led);
  }
  const api = freeApi(b.group, pinsLocal, pos, opts, { pick: b.group, anchor: V(0, 2.6, 0) });
  const st = new Array(n).fill(false);
  live(api, {
    set(i, on) { st[i] = !!on; leds[i].set(on ? 1 : 0); return api; },
    get: (i) => st[i],
  });
  return tag(api, 'module', `${n}-channel relay board`);
}

// ================================================================= forest + fire
/** Small forest patch with conifers and broadleaf trees. setFire(0..1) lights a fire at `fireAt`; smoke rises. */
export function makeForestPatch(pos, opts = {}) {
  const g = new THREE.Group();
  const W = opts.w ?? 22, D = opts.d ?? 14;
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1, 48), mat(0x8fbf5a, { rough: 0.95 }));
  ground.rotation.x = -Math.PI / 2;
  ground.scale.set(W / 2, D / 2, 1);
  ground.position.y = 0.03;
  ground.receiveShadow = true;
  g.add(ground);
  const r = rng(opts.seed ?? 7);
  const trunk = mat(0x6e4a2c, { rough: 0.8 });
  const greens = [0x2f7a3e, 0x3c8f48, 0x2a6b3a];
  const trees = [];
  const spots = opts.trees ?? [[-7, -3], [-4, -4.5], [-1, -4], [3, -4.6], [6.5, -3.2], [-8, 1], [-5, 2.6], [7.8, 0.6], [5, 3.4], [-2, 4.2], [1.6, 4.5]];
  for (const [x, z] of spots) {
    const t = new THREE.Group();
    const s = 0.8 + r() * 0.5;
    t.add(at(cyl(0.18, 0.25, 1.4, trunk, { seg: 8 }), 0, 0.7, 0));
    if (r() > 0.3) {
      const c = mat(greens[Math.floor(r() * 3)], { rough: 0.7 });
      for (let k = 0; k < 3; k++) t.add(at(mesh(new THREE.ConeGeometry(1.5 - k * 0.35, 1.8, 10), c), 0, 1.6 + k * 0.9, 0));
    } else {
      const c = mat(0x5aa848, { rough: 0.7 });
      t.add(at(mesh(new THREE.IcosahedronGeometry(1.5, 1), c, { edgeAngle: 50 }), 0, 2.6, 0));
    }
    t.scale.setScalar(s);
    t.position.set(x, 0, z);
    g.add(t);
    trees.push(t);
  }
  for (let i = 0; i < 6; i++) g.add(at(mesh(new THREE.DodecahedronGeometry(0.35 + r() * 0.3, 0), mat(0x9a968c)), (r() - 0.5) * W * 0.7, 0.15, (r() - 0.5) * D * 0.6));
  // fire
  const fireAt = opts.fireAt ?? V(-3, 0, 0.6);
  const fire = new THREE.Group();
  fire.position.copy(fireAt);
  g.add(fire);
  const flames = [0xffc23a, 0xff8a2a, 0xe8452a].map((c, i) => {
    const f = mesh(new THREE.ConeGeometry(0.6 - i * 0.12, 1.8 - i * 0.3, 10), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.2, transparent: true, opacity: 0.9 }), { outline: false });
    f.position.set((i - 1) * 0.35, 0.9, (i % 2) * 0.3);
    noRay(f);
    fire.add(f);
    return f;
  });
  const glow = glowSprite(0xff7a2a, 5);
  glow.position.y = 1.0;
  fire.add(glow);
  const puffMat = new THREE.MeshStandardMaterial({ color: 0x8c8c8c, transparent: true, opacity: 0.4, depthWrite: false, roughness: 1 });
  const puffs = [...Array(10)].map((_, i) => {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8), puffMat.clone());
    noRay(p);
    fire.add(p);
    return { m: p, t: i / 10 };
  });
  const api = { group: g, pick: g };
  g.position.copy(pos ?? V());
  g.rotation.y = opts.rotY ?? 0;
  g.updateMatrixWorld(true);
  let level = 0, t = 0;
  live(api, {
    trees,
    get fire() { return level; },
    get fireWorld() { return g.localToWorld(fireAt.clone().add(V(0, 1, 0))); },
    get anchor() { return g.localToWorld(V(0, 5.5, -3)); },
    /** Smoke drifts with the wind towards +x. */
    smokeWorld(k) { return g.localToWorld(fireAt.clone().add(V(k * 3, 1 + k * 5, 0))); },
    setFire(x) { level = clamp(x, 0, 1); return api; },
    tick(dt) {
      t += dt;
      fire.visible = level > 0.01;
      flames.forEach((f, i) => { const k = level * (0.8 + 0.25 * Math.sin(t * 9 + i * 2)); f.scale.set(0.4 + level * 0.8, Math.max(0.01, k * 1.3), 0.4 + level * 0.8); f.position.y = 0.9 * k; });
      glow.material.opacity = level * 0.9;
      puffs.forEach((p) => {
        p.t = (p.t + dt * 0.18) % 1;
        p.m.position.set(p.t * 3.5, 1.5 + p.t * 6, Math.sin(p.t * 6 + t) * 0.4);
        p.m.scale.setScalar((0.5 + p.t * 2.2) * Math.max(0.01, level));
        p.m.material.opacity = 0.45 * (1 - p.t) * Math.min(1, level * 1.5);
      });
    },
  });
  return tag(api, 'object', 'Forest patch (with a fire you can light)');
}

/**
 * Wildfire sensor post: pole with a weatherproof box (MQ-2 smoke sensor behind
 * a vent), a radiation shield for the DHT22, an IR flame sensor looking down,
 * a small solar panel and a LoRa antenna. Harness header at the foot:
 * 5V 3V3 GND SMOKE FLAME DHT.
 */
export function makeWildfirePost(pos, opts = {}) {
  const g = new THREE.Group();
  const H = 11;
  g.add(at(box(2.6, 0.4, 2.6, mat(0xc9c4b8, { rough: 0.9 })), 0, 0.2, 0));
  g.add(at(cyl(0.22, 0.22, H, mat(0x9aa0a8, { metal: 0.4 }), { seg: 14 }), 0, 0.4 + H / 2, 0));
  // enclosure
  const enc = new THREE.Group();
  enc.position.set(0, 6.2, 0.55);
  enc.add(at(box(2.8, 2.6, 1.2, mat(0xe3e1da, { rough: 0.5 })), 0, 0, 0.3));
  enc.add(at(textDecal(['FIRE WATCH', 'node 07'], 1.9, 0.6, { vertical: true, color: '#1d2440', sizes: [0.36, 0.26], font: SANS }), 0, 0.75, 0.91));
  for (let i = 0; i < 4; i++) enc.add(at(box(1.6, 0.1, 0.02, mat(0x2a2c33), { outline: false }), 0, -0.1 - i * 0.22, 0.91));
  enc.add(at(textDecal('SMOKE', 0.9, 0.22, { vertical: true, color: '#5a5e68', size: 0.8, font: SANS }), 0, -1.0, 0.91));
  // flame sensor eye (looks down and forward)
  const eye = cyl(0.22, 0.22, 0.5, mat(0x16171d, { rough: 0.15 }), { seg: 16 });
  eye.rotation.x = Math.PI / 2 + 0.6;
  enc.add(at(eye, 1.0, -1.35, 0.75));
  g.add(enc);
  // radiation shield (stacked plates) on an arm
  g.add(at(box(1.6, 0.15, 0.15, mat(0x9aa0a8)), -1.0, 4.3, 0));
  const shield = new THREE.Group();
  for (let i = 0; i < 5; i++) shield.add(at(cyl(0.75 - i * 0.04, 0.75, 0.16, mat(0xf3f1ea), { seg: 20 }), 0, i * 0.32, 0));
  shield.position.set(-1.9, 3.6, 0);
  g.add(shield);
  // solar panel + antenna on top
  const pnl = panelSlab(2.0, 1.6);
  pnl.rotation.x = 0.6;
  pnl.position.set(0, H + 0.75, 0.15);
  g.add(pnl);
  g.add(at(cyl(0.12, 0.12, 0.3, metal(), { seg: 10 }), 1.15, 7.65, 0.6));
  const ant = cyl(0.07, 0.1, 2.8, mat(0x24262c, { rough: 0.5 }), { seg: 10 });
  g.add(at(ant, 1.15, 7.8 + 1.4, 0.6));
  const rings = pulseRings(0xf08a2c, 0.6, 3);
  rings.group.position.set(1.15, 10.6, 0.6);
  g.add(rings.group);
  // harness to a junction box at the foot
  g.add(cable([V(-0.4, 4.9, 0.6), V(-0.3, 2.5, 0.4), V(0.5, 0.9, 1.4), V(1.6, 0.8, 1.9)], 0x2a2c33, 0.07));
  const b = makeBreakout({ w: 2.4, d: 1.3, color: PCB.black, pins: ['5V', '3V3', 'GND', 'SMOKE', 'FLAME', 'DHT'], pinsEdge: 'front', inset: 0.22, label: 'HARNESS', labelPos: [0, -0.25], labelSize: 0.16 });
  b.group.position.set(2.0, 0.3, 2.0);
  g.add(at(box(2.5, 0.3, 1.4, mat(0x3a3d46)), 2.0, 0.15, 2.0));
  g.add(b.group);
  const pinsLocal = new Map([...b.pinsLocal].map(([n, p]) => [n, p.clone().add(b.group.position)]));
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, H + 1.4, 0) });
  api.flameEye = g.localToWorld(V(1.0, 6.2 - 1.35, 1.3));
  api.shieldAnchor = g.localToWorld(V(-1.9, 5.4, 0));
  api.antennaTop = g.localToWorld(V(1.15, 10.6, 0.6));
  api.boxAnchor = g.localToWorld(V(0, 7.8, 1.2));
  live(api, {
    transmit() { rings.set(true); clearTimeout(api._t); api._t = setTimeout(() => rings.set(false), 900); return api; },
    tick(dt) { rings.tick(dt, 1.2); },
  });
  return tag(api, 'module', 'Wildfire sensor post (smoke, flame, temp/humidity, LoRa)');
}

// ================================================================= LoRa
/** SX1276 (RFM95W-style) LoRa module on a carrier with an SMA whip. Pins GND VCC MISO MOSI SCK NSS RST DIO0. transmit()/receive() animate. */
export function makeLoRa(pos, opts = {}) {
  const b = makeBreakout({
    w: 3.0, d: 2.8, color: PCB.black, pins: ['GND', 'VCC', 'MISO', 'MOSI', 'SCK', 'NSS', 'RST', 'DIO0'], pinsEdge: 'front', inset: 0.22,
    label: 'LoRa SX1276', labelPos: [-0.35, -1.15], labelSize: 0.15, pinText: { MISO: 'MI', MOSI: 'MO', SCK: 'SCK', NSS: 'CS', DIO0: 'G0', RST: 'RST' },
  });
  const mod = new THREE.Group();
  mod.add(at(box(1.6, 0.1, 1.6, mat(0x2c7a46)), 0, 0.05, 0));
  mod.add(at(box(1.2, 0.18, 1.2, metal()), 0, 0.19, 0));
  mod.add(at(textDecal(['RFM95W', opts.band ?? '868 MHz'], 1.0, 0.6, { color: '#4a4e57', sizes: [0.3, 0.24] }), 0, 0.282, 0));
  b.on(mod, -0.35, -0.15);
  // SMA + antenna
  const sma = cyl(0.2, 0.2, 0.6, mat(0xd6b46a, { metal: 0.6, rough: 0.3 }), { seg: 12 });
  b.on(sma, 1.05, -0.3, 0.3);
  const antH = opts.antenna ?? 4.4;
  b.on(at(cyl(0.12, 0.16, antH, mat(0x24262c, { rough: 0.5 }), { seg: 12 }), 0, 0.6 + antH / 2, 0), 1.05, -0.3);
  const txLed = smdLed(0xff3b2f); b.on(txLed.group, 1.05, 0.5);
  const rings = pulseRings(0x2aa7a1, 0.5, 3);
  rings.group.position.set(1.05, b.top + 0.6 + antH, -0.3);
  b.group.add(rings.group);
  const api = freeApi(b.group, b.pinsLocal, pos, opts, { pick: b.group, anchor: V(0, 1.6, 0) });
  api.antennaTop = b.group.localToWorld(V(1.05, b.top + 0.6 + antH, -0.3));
  let k = 0;
  live(api, {
    transmit(dur = 0.9) { k = dur; txLed.set(1); rings.set(true); return api; },
    tick(dt) {
      if (k > 0) { k -= dt; if (k <= 0) { txLed.set(0); rings.set(false); } }
      rings.tick(dt, 1.3);
    },
  });
  return tag(api, 'module', 'LoRa SX1276 radio module');
}

// ================================================================= PCA9685
/** 16-channel 12-bit PWM / servo driver (I²C 0x40). Pins GND OE SCL SDA VCC V+; servo signal pins S0..S15; V+ terminal. */
export function makePCA9685(pos, opts = {}) {
  const b = makeBreakout({
    w: 6.2, d: 2.5, color: PCB.blue, pins: ['GND', 'OE', 'SCL', 'SDA', 'VCC', 'V+'], pinsEdge: 'left', inset: 0.22,
    label: 'PCA9685 16-CH PWM', labelPos: [-1.3, 0.1], labelSize: 0.15,
  });
  b.on(soic(14, { len: 1.2, wid: 0.5, label: 'PCA9685' }), -1.1, -0.6);
  const t = screwTerminal(2, 0x2f6fd8);
  t.rotation.y = Math.PI;
  b.on(t, 1.4, -0.75);
  b.on(electrolytic(0.25, 0.6), 2.5, -0.75);
  const pinsLocal = new Map(b.pinsLocal);
  // 16 × 3-pin servo headers along the front: rows GND (black), V+ (red), PWM (yellow)
  const hdr = new THREE.Group();
  const cols = 16, x0 = -0.2;
  for (let i = 0; i < cols; i++) {
    const x = x0 + (i - (cols - 1) / 2) * PITCH * 0.95 + 1.4;
    for (let k = 0; k < 3; k++) {
      const z = 1.0 - k * PITCH;
      hdr.add(at(box(0.064, PIN_TIP, 0.064, metal(), { outline: false }), x, b.top + PIN_TIP / 2, z));
    }
  }
  for (const [k, c] of [[0, 0x24262c], [1, 0xd8443a], [2, 0xf5c02a]]) hdr.add(at(box(cols * PITCH * 0.95, 0.25, PITCH * 0.9, mat(c, { rough: 0.7 })), 1.4 - 0.2, b.top + 0.125, 1.0 - k * PITCH));
  // rows: GND at the edge, then V+, then the PWM signal
  for (let i = 0; i < cols; i++) {
    const x = x0 + (i - (cols - 1) / 2) * PITCH * 0.95 + 1.4;
    pinsLocal.set(`S${i}`, V(x, b.top + PIN_TIP, 1.0 - 2 * PITCH));
    pinsLocal.set(`S${i}_V+`, V(x, b.top + PIN_TIP, 1.0 - PITCH));
    pinsLocal.set(`S${i}_GND`, V(x, b.top + PIN_TIP, 1.0));
  }
  b.group.add(hdr);
  b.group.add(at(textDecal('0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15', 3.9, 0.18, { color: '#f1efe6', size: 0.7 }), 1.2, b.top + 0.003, 0.3));
  const api = freeApi(b.group, pinsLocal, pos, opts, { pick: b.group, anchor: V(0, 1.4, 0) });
  return tag(api, 'module', 'PCA9685 16-channel servo driver');
}

// ================================================================= sorting bins
/**
 * Waste sorter: a tray with a servo trapdoor (flap) over a funnel and a
 * servo-turned chute that aims at one of three bins (0 recycling, 1 compost,
 * 2 landfill) arranged in front (+z). Servo leads end in 3-pin plugs whose
 * signal pins are FLAP_S / CHUTE_S (V+ / GND alongside).
 * setFlap(deg 0 closed .. 90 open), setChute(deg), drop(item, bin).
 */
export function makeSorter(pos, opts = {}) {
  const g = new THREE.Group();
  const TRAY_Y = 7.2;
  const frame = mat(0x9aa0a8, { metal: 0.4, rough: 0.4 });
  for (const [x, z] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]) g.add(at(box(0.3, TRAY_Y, 0.3, frame), x, TRAY_Y / 2, z - 1.5));
  g.add(at(box(4.8, 0.2, 0.3, frame), 0, TRAY_Y - 0.1, -3.7));
  g.add(at(box(4.8, 0.2, 0.3, frame), 0, TRAY_Y - 0.1, 0.7));
  // tray rim (open middle = trapdoor)
  const trayMat = mat(0xf3f1ea, { rough: 0.6 });
  g.add(at(box(4.8, 0.2, 1.0, trayMat), 0, TRAY_Y, -3.2));
  g.add(at(box(4.8, 0.2, 1.0, trayMat), 0, TRAY_Y, 0.2));
  g.add(at(box(0.9, 0.2, 2.4, trayMat), -1.95, TRAY_Y, -1.5));
  g.add(at(box(0.9, 0.2, 2.4, trayMat), 1.95, TRAY_Y, -1.5));
  const flap = new THREE.Group();
  flap.position.set(-1.5, TRAY_Y, -1.5);
  flap.add(at(box(3.0, 0.14, 2.4, mat(0xe9e5d8, { rough: 0.5 })), 1.5, 0, 0));
  g.add(flap);
  // flap servo on the side
  const blue = mat(0x2f5fbf, { rough: 0.5 });
  g.add(at(box(1.2, 1.1, 2.3, blue), -2.95, TRAY_Y - 0.4, -1.5));
  // funnel
  const funnel = mesh(new THREE.CylinderGeometry(1.4, 0.55, 1.6, 20, 1, true), mat(0xdfe4ec, { rough: 0.4, side: THREE.DoubleSide }));
  g.add(at(funnel, 0, TRAY_Y - 1.2, -1.5));
  // chute on a servo below the funnel
  const chute = new THREE.Group();
  chute.position.set(0, TRAY_Y - 2.2, -1.5);
  const tube = cyl(0.55, 0.55, 3.2, mat(0xf08a2c, { rough: 0.5 }), { seg: 16, thetaStart: Math.PI / 2, thetaLength: Math.PI });
  tube.rotation.x = Math.PI / 2 - 0.62;
  tube.position.set(0, -1.0, 1.4);
  chute.add(tube);
  g.add(chute);
  g.add(at(box(1.2, 1.1, 1.2, blue), 0, TRAY_Y - 1.9, -2.9));
  // bins on an arc in front
  const BIN = [['RECYCLE', 0x2f6fd8], ['COMPOST', 0x3f9a4a], ['LANDFILL', 0x5a5e68]];
  const binAngles = [-38, 0, 38];
  const binR = 6.0;
  const bins = BIN.map(([name, c], i) => {
    const a = THREE.MathUtils.degToRad(binAngles[i]);
    const bx = Math.sin(a) * binR, bz = -1.5 + Math.cos(a) * binR;
    const bg = new THREE.Group();
    bg.add(at(cyl(1.5, 1.2, 3.2, mat(c, { rough: 0.55, side: THREE.DoubleSide }), { seg: 20, outline: true }), 0, 1.6, 0));
    bg.add(at(new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.08, 6, 24), mat(c)).rotateX(Math.PI / 2), 0, 3.2, 0));
    bg.add(at(textDecal(name, 2.0, 0.42, { vertical: true, color: '#ffffff', size: 0.7, font: SANS }), 0, 1.8, 1.39));
    bg.position.set(bx, 0, bz);
    bg.rotation.y = a;
    g.add(bg);
    return { group: bg, name, a: binAngles[i], top: V(bx, 3.0, bz), n: 0 };
  });
  // servo plugs (3-pin) on a little header block behind
  const pinsLocal = new Map();
  [['FLAP', -1.2], ['CHUTE', 1.2]].forEach(([nm, x]) => {
    g.add(at(box(0.85, 0.3, 0.35, mat(0x24262c)), x, 0.15, -5.4));
    ['GND', 'V+', 'S'].forEach((p, k) => pinsLocal.set(`${nm}_${p === 'S' ? 'S' : p}`, postPin(g, x - PITCH + k * PITCH, 0.3, -5.4, 0.55)));
  });
  g.add(cable([V(-2.95, TRAY_Y - 0.9, -2.6), V(-2.6, 3, -3.8), V(-1.2, 0.8, -5.0), V(-1.2, 0.35, -5.3)], 0x6b4a30, 0.06));
  g.add(cable([V(0, TRAY_Y - 2.3, -3.5), V(0.6, 3, -4.2), V(1.2, 0.8, -5.0), V(1.2, 0.35, -5.3)], 0x6b4a30, 0.06));
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, TRAY_Y + 1.6, -1.5) });
  const W = (p) => g.localToWorld(p.clone());
  api.trayCenter = W(V(0, TRAY_Y + 0.08, -1.5));
  api.binAnchor = (i) => W(bins[i].top.clone().add(V(0, 0.8, 0)));
  api.bins = bins.map((b) => b.name);
  let flapDeg = 0, flapGoal = 0, chuteDeg = 90, chuteGoal = 90;
  const drops = [];
  live(api, {
    get flap() { return flapDeg; }, get chute() { return chuteDeg; },
    setFlap(d) { flapGoal = clamp(d, 0, 90); return api; },
    setChute(d) { chuteGoal = clamp(d, 0, 180); return api; },
    /** Servo angle that aims the chute at bin i. */
    chuteAngle: (i) => 90 + binAngles[i],
    /** Animate `item` (Object3D) falling through the chute into bin i. */
    drop(item, i) {
      const start = item.position.clone();
      drops.push({ item, i, t: 0, start, end: W(V(0, 0, 0)).copy(bins[i].group.localToWorld(V((bins[i].n % 3 - 1) * 0.5, 0.4 + Math.floor(bins[i].n / 3) * 0.6, 0))) });
      bins[i].n++;
      return api;
    },
    get busy() { return drops.length > 0; },
    resetBins() { bins.forEach((b) => (b.n = 0)); drops.length = 0; },
    tick(dt) {
      const st = 240 * dt;
      flapDeg += clamp(flapGoal - flapDeg, -st, st);
      chuteDeg += clamp(chuteGoal - chuteDeg, -st, st);
      flap.rotation.z = -THREE.MathUtils.degToRad(flapDeg);
      chute.rotation.y = THREE.MathUtils.degToRad(chuteDeg - 90);
      for (let k = drops.length - 1; k >= 0; k--) {
        const d = drops[k];
        d.t += dt * 1.1;
        const u = Math.min(1, d.t);
        const top = W(V(0, TRAY_Y - 1.6, -1.5));
        const p = u < 0.35 ? d.start.clone().lerp(top, u / 0.35) : top.clone().lerp(d.end, (u - 0.35) / 0.65);
        if (u >= 0.35) p.y += Math.sin(((u - 0.35) / 0.65) * Math.PI) * 1.2;
        d.item.position.copy(p);
        d.item.rotation.x += dt * 3;
        if (u >= 1) { d.item.rotation.x = 0; drops.splice(k, 1); }
      }
    },
  });
  return tag(api, 'module', 'Waste sorter: servo flap, chute and three bins');
}

// ================================================================= waste items
function propApi(g, pos, anchorY, kind, label, extra = {}) {
  g.position.copy(pos ?? V());
  g.updateMatrixWorld(true);
  const api = { group: g, pick: g, get anchor() { return g.position.clone().add(V(0, anchorY, 0)); }, ...extra };
  return tag(api, kind, label);
}

/** Clear PET bottle lying on its side (≈ 3 cm). */
export function makePlasticBottle(pos) {
  const g = new THREE.Group();
  const pet = mat(0xbfe3f2, { rough: 0.1, opacity: 0.6 });
  const b = new THREE.Group();
  b.add(at(cyl(0.6, 0.6, 2.0, pet, { seg: 24 }), 0, 0, 0));
  b.add(at(cyl(0.25, 0.6, 0.6, pet, { seg: 24 }), 0, 1.3, 0));
  b.add(at(cyl(0.27, 0.27, 0.3, mat(0x2f6fd8), { seg: 16 }), 0, 1.75, 0));
  b.add(at(cyl(0.61, 0.61, 0.8, mat(0x3fbf5f, { rough: 0.5 }), { seg: 24, outline: false }), 0, -0.1, 0));
  b.rotation.z = Math.PI / 2;
  b.position.y = 0.6;
  g.add(b);
  return propApi(g, pos, 1.8, 'object', 'Plastic bottle (PET)');
}

/** Aluminium drinks can standing (≈ 2.4 cm). */
export function makeCan(pos) {
  const g = new THREE.Group();
  g.add(at(cyl(0.65, 0.65, 2.2, mat(0xd9dce0, { metal: 0.7, rough: 0.3 }), { seg: 24 }), 0, 1.15, 0));
  g.add(at(cyl(0.66, 0.66, 1.2, mat(0xe5412e, { rough: 0.4 }), { seg: 24, outline: false }), 0, 1.15, 0));
  g.add(at(cyl(0.5, 0.65, 0.15, mat(0xc9ccd2, { metal: 0.7, rough: 0.3 }), { seg: 24 }), 0, 2.32, 0));
  return propApi(g, pos, 3.0, 'object', 'Aluminium can');
}

/** Crumpled sheet of paper. */
export function makePaper(pos) {
  const g = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(0.9, 1);
  const p = geo.attributes.position, r = rng(17), tmp = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { tmp.fromBufferAttribute(p, i).multiplyScalar(0.78 + r() * 0.35); p.setXYZ(i, tmp.x, tmp.y * 0.85, tmp.z); }
  geo.computeVertexNormals();
  g.add(at(mesh(geo, new THREE.MeshStandardMaterial({ color: 0xf7f5ee, roughness: 0.9, flatShading: true }), { edgeAngle: 25 }), 0, 0.8, 0));
  return propApi(g, pos, 2.0, 'object', 'Crumpled paper');
}

/** Banana peel, splayed in four strips. */
export function makeBananaPeel(pos) {
  const g = new THREE.Group();
  const peel = mat(0xe8c43a, { rough: 0.6, side: THREE.DoubleSide });
  g.add(at(cyl(0.3, 0.38, 0.6, peel, { seg: 12 }), 0, 0.35, 0));
  g.add(at(cyl(0.08, 0.1, 0.5, mat(0x5a3b1e), { seg: 8 }), 0, 0.85, 0));
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Shape();
    s.moveTo(-0.28, 0); s.quadraticCurveTo(-0.32, 0.9, 0, 1.5); s.quadraticCurveTo(0.32, 0.9, 0.28, 0); s.closePath();
    const m = mesh(new THREE.ShapeGeometry(s, 8), peel, { edgeAngle: 30 });
    const arm = new THREE.Group();
    m.rotation.x = -Math.PI / 2 + 0.25;
    m.position.y = 0.08;
    arm.add(m);
    arm.rotation.y = (i / 4) * Math.PI * 2 + 0.4;
    g.add(arm);
    // brown tips
    const tip = mesh(new THREE.SphereGeometry(0.14, 8, 6), mat(0x6b4a24), { outline: false });
    tip.position.set(0, 0.42, 1.38);
    arm.add(tip);
  }
  return propApi(g, pos, 1.6, 'object', 'Banana peel');
}

/** Crisp packet (multilayer foil: not recyclable kerbside). */
export function makeCrispPacket(pos) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(1, 20, 12);
  geo.scale(1.25, 0.38, 0.9);
  g.add(at(mesh(geo, mat(0xd8443a, { metal: 0.5, rough: 0.3 })), 0, 0.4, 0));
  for (const s of [-1, 1]) g.add(at(box(0.25, 0.08, 1.6, mat(0xc9ccd2, { metal: 0.6, rough: 0.3 })), s * 1.25, 0.4, 0));
  g.add(at(textDecal('CRISPS', 1.2, 0.4, { color: '#ffffff', size: 0.75, font: SANS }), 0, 0.79, 0));
  return propApi(g, pos, 1.6, 'object', 'Crisp packet');
}

// ================================================================= animals
function legPair(g, x, zf, zb, h, m) {
  const legs = [];
  for (const z of [zf, zb]) for (const s of [-1, 1]) {
    const p = new THREE.Group();
    p.position.set(s * x, h, z);
    p.add(at(cyl(0.12, 0.09, h, m, { seg: 8 }), 0, -h / 2, 0));
    g.add(p);
    legs.push(p);
  }
  return legs;
}

function animalApi(g, pos, opts, legs, anchorY, label, extra = {}) {
  g.position.copy(pos ?? V());
  g.rotation.y = opts.rotY ?? 0;
  g.updateMatrixWorld(true);
  let ph = 0;
  const api = {
    group: g, pick: g,
    get anchor() { return g.position.clone().add(V(0, anchorY, 0)); },
    /** Swing the legs by a walking phase step (call with dt × speed). */
    walk(d) { ph += d; legs.forEach((l, i) => (l.rotation.x = Math.sin(ph * 8 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * 0.45)); },
    stand() { legs.forEach((l) => (l.rotation.x = 0)); },
    ...extra,
  };
  return tag(api, 'object', label);
}

/** Red fox (≈ 5 cm long), facing local +z. */
export function makeFox(pos, opts = {}) {
  const g = new THREE.Group();
  const fur = mat(0xd9692a, { rough: 0.7 });
  const white = mat(0xf3f1ea, { rough: 0.7 });
  const dark = mat(0x2a2422, { rough: 0.7 });
  const body = mesh(new THREE.CapsuleGeometry(0.55, 1.8, 6, 12), fur);
  body.rotation.x = Math.PI / 2;
  g.add(at(body, 0, 1.5, 0));
  const legs = legPair(g, 0.32, 0.8, -0.8, 1.2, dark);
  const head = new THREE.Group();
  head.position.set(0, 2.05, 1.5);
  head.add(mesh(new THREE.SphereGeometry(0.5, 16, 12), fur));
  const snout = mesh(new THREE.ConeGeometry(0.28, 0.8, 12), white);
  snout.rotation.x = Math.PI / 2;
  head.add(at(snout, 0, -0.12, 0.6));
  head.add(at(mesh(new THREE.SphereGeometry(0.08, 8, 6), dark, { outline: false }), 0, -0.12, 1.0));
  for (const s of [-1, 1]) {
    head.add(at(mesh(new THREE.ConeGeometry(0.18, 0.5, 4), fur), s * 0.27, 0.55, -0.05));
    head.add(at(mesh(new THREE.SphereGeometry(0.06, 8, 6), dark, { outline: false }), s * 0.2, 0.1, 0.42));
  }
  g.add(head);
  const tail = new THREE.Group();
  tail.position.set(0, 1.6, -1.3);
  const t1 = mesh(new THREE.CapsuleGeometry(0.3, 1.1, 6, 10), fur);
  t1.rotation.x = -2.2;
  tail.add(at(t1, 0, -0.35, -0.5));
  tail.add(at(mesh(new THREE.SphereGeometry(0.3, 10, 8), white), 0, -0.75, -1.05));
  g.add(tail);
  return animalApi(g, pos, opts, legs, 3.0, 'Fox (prop)', { tail });
}

/** Roe deer (≈ 6 cm tall), facing local +z. opts.antlers. */
export function makeDeer(pos, opts = {}) {
  const g = new THREE.Group();
  const fur = mat(0x9a6a40, { rough: 0.7 });
  const pale = mat(0xe9dcc4, { rough: 0.7 });
  const dark = mat(0x3a2a20, { rough: 0.7 });
  const body = mesh(new THREE.CapsuleGeometry(0.75, 2.0, 6, 12), fur);
  body.rotation.x = Math.PI / 2;
  g.add(at(body, 0, 2.9, 0));
  const legs = legPair(g, 0.4, 1.1, -1.0, 2.4, fur);
  const neck = cyl(0.3, 0.42, 1.6, fur, { seg: 12 });
  neck.rotation.x = 0.5;
  g.add(at(neck, 0, 3.9, 1.45));
  const head = new THREE.Group();
  head.position.set(0, 4.75, 1.95);
  const hd = mesh(new THREE.CapsuleGeometry(0.32, 0.6, 6, 10), fur);
  hd.rotation.x = Math.PI / 2 - 0.3;
  head.add(at(hd, 0, 0, 0.25));
  head.add(at(mesh(new THREE.SphereGeometry(0.12, 8, 6), dark, { outline: false }), 0, -0.2, 0.78));
  for (const s of [-1, 1]) {
    const ear = mesh(new THREE.SphereGeometry(0.22, 10, 8), fur);
    ear.scale.set(0.6, 1.2, 0.3);
    head.add(at(ear, s * 0.38, 0.35, -0.05));
    if (opts.antlers !== false) {
      head.add(at(cyl(0.04, 0.05, 0.9, pale, { seg: 6 }).rotateZ(-s * 0.3), s * 0.18, 0.7, 0));
      head.add(at(cyl(0.03, 0.04, 0.4, pale, { seg: 6 }).rotateX(0.6), s * 0.28, 0.9, 0.12));
    }
  }
  g.add(head);
  g.add(at(mesh(new THREE.SphereGeometry(0.32, 10, 8), pale), 0, 3.1, -1.4));
  return animalApi(g, pos, opts, legs, 6.0, 'Deer (prop)', { head });
}

/** Small bird (≈ 2 cm) with flapping wings, facing local +z. flap(on). */
export function makeBird(pos, opts = {}) {
  const g = new THREE.Group();
  const c = mat(opts.color ?? 0x3b78e7, { rough: 0.6 });
  const breast = mat(0xf08a2c, { rough: 0.6 });
  const body = mesh(new THREE.SphereGeometry(0.5, 14, 10), c);
  body.scale.set(0.85, 0.85, 1.2);
  g.add(at(body, 0, 0.75, 0));
  g.add(at(mesh(new THREE.SphereGeometry(0.36, 12, 8), breast), 0, 0.68, 0.25));
  g.add(at(mesh(new THREE.SphereGeometry(0.32, 12, 8), c), 0, 1.25, 0.45));
  const beak = mesh(new THREE.ConeGeometry(0.09, 0.3, 8), mat(0xf5c02a));
  beak.rotation.x = Math.PI / 2;
  g.add(at(beak, 0, 1.22, 0.85));
  const wings = [-1, 1].map((s) => {
    const w = new THREE.Group();
    w.position.set(s * 0.38, 0.9, 0);
    const m = mesh(new THREE.SphereGeometry(0.4, 10, 6), c);
    m.scale.set(0.2, 0.5, 1.0);
    m.position.set(s * 0.1, -0.1, -0.1);
    w.add(m);
    g.add(w);
    return w;
  });
  const tail = box(0.35, 0.06, 0.6, c);
  tail.rotation.x = -0.4;
  g.add(at(tail, 0, 0.75, -0.75));
  for (const s of [-1, 1]) g.add(at(cyl(0.03, 0.03, 0.35, mat(0xd08a3a), { seg: 6 }), s * 0.15, 0.18, 0));
  let flapOn = false, t = 0;
  const api = animalApi(g, pos, opts, [], 1.8, 'Bird (prop)', {
    flap(on) { flapOn = !!on; return api; },
    tick(dt) { t += dt; wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * (flapOn ? 0.3 + Math.sin(t * 22) * 0.7 : 0.05))); },
  });
  return api;
}

/** Leafy bush that sways in the wind (setWind 0..1). */
export function makeBush(pos, opts = {}) {
  const g = new THREE.Group();
  const sway = new THREE.Group();
  g.add(at(cyl(0.12, 0.18, 1.0, mat(0x6e4a2c), { seg: 8 }), 0, 0.5, 0));
  const leaf = mat(opts.color ?? 0x4f9e46, { rough: 0.7 });
  const r = rng(opts.seed ?? 4);
  for (let i = 0; i < 7; i++) {
    const s = 0.8 + r() * 0.6;
    sway.add(at(mesh(new THREE.IcosahedronGeometry(s, 1), leaf, { edgeAngle: 50 }), (r() - 0.5) * 2.2, 0.6 + r() * 1.6, (r() - 0.5) * 1.4));
  }
  sway.position.y = 0.8;
  g.add(sway);
  g.position.copy(pos ?? V());
  g.scale.setScalar(opts.scale ?? 1);
  g.updateMatrixWorld(true);
  let wind = 0.5, t = r() * 10;
  const api = {
    group: g, pick: g, sway,
    get anchor() { return g.position.clone().add(V(0, 3.6 * (opts.scale ?? 1), 0)); },
    get wind() { return wind; },
    setWind(w) { wind = clamp(w, 0, 1); return api; },
    tick(dt) { t += dt; sway.rotation.z = Math.sin(t * 2.3) * 0.18 * wind + Math.sin(t * 5.1) * 0.05 * wind; sway.position.x = Math.sin(t * 2.3) * 0.35 * wind; },
  };
  return tag(api, 'object', 'Bush (sways in the wind)');
}

// ================================================================= hand
/**
 * Right hand on a forearm, palm facing local -z (towards a camera at -z).
 * setGesture('open' | 'fist' | 'point' | 'relaxed'), with smooth finger motion.
 * landmarks() → 21 world points in MediaPipe order (wrist, thumb CMC→TIP,
 * index MCP→TIP, middle, ring, pinky).
 */
export function makeHand(pos, opts = {}) {
  const g = new THREE.Group();
  const skin = mat(opts.skin ?? 0xe8b48e, { rough: 0.6 });
  const sleeve = mat(opts.sleeve ?? 0x3b78e7, { rough: 0.6 });
  const S = opts.scale ?? 1;
  // forearm from the elbow (on the table) up to the wrist
  const WR = V(0, 9.0, 0);
  g.add(at(mesh(new THREE.CapsuleGeometry(0.75, 5.6, 6, 14), sleeve), 0, 4.0, 0.6).rotateX(0.12));
  g.add(at(mesh(new THREE.CapsuleGeometry(0.62, 1.6, 6, 12), skin), 0, 8.0, 0.08).rotateX(0.05));
  g.add(at(mesh(new THREE.SphereGeometry(0.95, 14, 10), sleeve), 0, 0.95, 1.0));
  const hand = new THREE.Group();
  hand.position.copy(WR);
  g.add(hand);
  const palm = mesh(new THREE.BoxGeometry(2.0, 2.2, 0.75), skin);
  palm.position.set(0, 1.1, 0);
  hand.add(palm);
  // fingers: [x of MCP, segment lengths]
  const F = [
    { name: 'index', x: -0.72, segs: [0.95, 0.6, 0.5] },
    { name: 'middle', x: -0.24, segs: [1.05, 0.68, 0.52] },
    { name: 'ring', x: 0.24, segs: [0.98, 0.62, 0.5] },
    { name: 'pinky', x: 0.7, segs: [0.75, 0.48, 0.42] },
  ];
  const fingers = F.map((f) => {
    const joints = [];
    let parent = hand;
    const base = new THREE.Group();
    base.position.set(f.x, 2.2, 0);
    hand.add(base);
    parent = base;
    f.segs.forEach((len, k) => {
      const j = new THREE.Group();
      if (k > 0) j.position.y = f.segs[k - 1];
      parent.add(j);
      const seg = mesh(new THREE.CapsuleGeometry(0.21 - k * 0.02, len - 0.3, 4, 8), skin, { edgeAngle: 45 });
      seg.position.y = len / 2;
      j.add(seg);
      joints.push(j);
      parent = j;
    });
    const tip = new THREE.Object3D();
    tip.position.y = f.segs[2];
    parent.add(tip);
    return { ...f, base, joints, tip, cur: 0, goal: 0 };
  });
  // thumb from the side of the palm (towards -x for a right hand seen palm-on)
  const thumbBase = new THREE.Group();
  thumbBase.position.set(-0.95, 0.5, -0.1);
  thumbBase.rotation.z = 0.75;
  hand.add(thumbBase);
  const tSegs = [0.9, 0.7, 0.55];
  const tJoints = [];
  let tp = thumbBase;
  tSegs.forEach((len, k) => {
    const j = new THREE.Group();
    if (k > 0) j.position.y = tSegs[k - 1];
    tp.add(j);
    const seg = mesh(new THREE.CapsuleGeometry(0.25 - k * 0.02, len - 0.3, 4, 8), skin, { edgeAngle: 45 });
    seg.position.y = len / 2;
    j.add(seg);
    tJoints.push(j);
    tp = j;
  });
  const tTip = new THREE.Object3D();
  tTip.position.y = tSegs[2];
  tp.add(tTip);
  const thumb = { joints: tJoints, tip: tTip, cur: 0, goal: 0 };
  g.position.copy(pos ?? V());
  g.rotation.y = opts.rotY ?? 0;
  g.scale.setScalar(S);
  g.updateMatrixWorld(true);
  const GEST = {
    open: { f: [0, 0, 0, 0], t: 0 },
    relaxed: { f: [0.35, 0.4, 0.45, 0.5], t: 0.3 },
    fist: { f: [1, 1, 1, 1], t: 1 },
    point: { f: [0, 1, 1, 1], t: 0.9 },
  };
  let gesture = 'open';
  const apply = () => {
    // curl: fingers bend towards the palm side (+z is the back of the hand; palm faces -z)
    fingers.forEach((f) => f.joints.forEach((j, k) => (j.rotation.x = -f.cur * [1.45, 1.6, 1.2][k])));
    thumb.joints.forEach((j, k) => { j.rotation.x = -thumb.cur * [0.5, 0.9, 0.8][k]; j.rotation.z = k === 0 ? -thumb.cur * 0.9 : 0; });
  };
  apply();
  const api = {
    group: g, pick: g,
    get anchor() { return g.localToWorld(V(0, 13.5, 0)); },
    get gesture() { return gesture; },
    gestures: Object.keys(GEST),
    setGesture(name) { gesture = GEST[name] ? name : 'open'; const G = GEST[gesture]; fingers.forEach((f, i) => (f.goal = G.f[i])); thumb.goal = G.t; return api; },
    snap() { fingers.forEach((f) => (f.cur = f.goal)); thumb.cur = thumb.goal; apply(); g.updateMatrixWorld(true); return api; },
    /** 21 landmark world positions (MediaPipe Hands order). */
    landmarks() {
      g.updateMatrixWorld(true);
      const w = (o, p = V()) => o.localToWorld(p.clone());
      const pts = [w(hand, V(0, 0.1, 0))];
      pts.push(w(thumbBase), w(tJoints[1]), w(tJoints[2]), w(tTip));
      for (const f of fingers) pts.push(w(f.base), w(f.joints[1]), w(f.joints[2]), w(f.tip));
      return pts;
    },
    tick(dt) {
      const k = Math.min(1, dt * 8);
      fingers.forEach((f) => (f.cur += (f.goal - f.cur) * k));
      thumb.cur += (thumb.goal - thumb.cur) * k;
      apply();
    },
  };
  api.setGesture(opts.gesture ?? 'open').snap();
  return tag(api, 'object', 'Hand on a forearm (gestures)');
}

// ================================================================= leaf sample
export const LEAF_CONDITIONS = {
  healthy: { label: 'healthy', color: '#4ea84a' },
  early_blight: { label: 'early blight', color: '#5aa04a' },
  late_blight: { label: 'late blight', color: '#5e8f44' },
  leaf_mold: { label: 'leaf mold', color: '#7fa64a' },
  insect: { label: 'insect damage (not a trained class)', color: '#4ea84a' },
};

function leafTexture(cond) {
  const C = LEAF_CONDITIONS[cond] ?? LEAF_CONDITIONS.healthy;
  return canvasTexture(512, 512, (c, w, h) => {
    const r = rng(cond.length * 13 + 5);
    c.clearRect(0, 0, w, h);
    c.save();
    c.beginPath();
    c.moveTo(w / 2, h * 0.02);
    c.bezierCurveTo(w * 0.98, h * 0.25, w * 0.9, h * 0.75, w / 2, h * 0.98);
    c.bezierCurveTo(w * 0.1, h * 0.75, w * 0.02, h * 0.25, w / 2, h * 0.02);
    c.closePath();
    c.fillStyle = C.color;
    c.fill();
    c.clip();
    if (cond === 'leaf_mold') { c.fillStyle = 'rgba(230,220,90,.45)'; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(r() * w, r() * h, 18 + r() * 30, 0, 7); c.fill(); } }
    if (cond === 'late_blight') { c.fillStyle = 'rgba(60,50,35,.85)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(r() * w * 0.6 + w * 0.2, r() * h * 0.6 + h * 0.2, 40 + r() * 50, 30 + r() * 40, r() * 3, 0, 7); c.fill(); } c.fillStyle = 'rgba(200,210,190,.35)'; c.fillRect(0, 0, w, h * 0.08); }
    if (cond === 'early_blight') for (let i = 0; i < 9; i++) {
      const x = w * (0.25 + r() * 0.5), y = h * (0.15 + r() * 0.7), rr = 12 + r() * 18;
      c.fillStyle = 'rgba(220,200,60,.7)'; c.beginPath(); c.arc(x, y, rr * 1.6, 0, 7); c.fill();
      c.strokeStyle = '#4a3a22'; c.lineWidth = 3;
      for (let k = 3; k > 0; k--) { c.fillStyle = k % 2 ? '#5a4428' : '#7a5e36'; c.beginPath(); c.arc(x, y, (rr * k) / 3, 0, 7); c.fill(); }
    }
    if (cond === 'insect') { c.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(w * (0.25 + r() * 0.5), h * (0.2 + r() * 0.6), 10 + r() * 22, 0, 7); c.fill(); } c.globalCompositeOperation = 'source-over'; }
    // veins
    c.strokeStyle = 'rgba(230,245,200,.6)'; c.lineWidth = 6;
    c.beginPath(); c.moveTo(w / 2, h * 0.05); c.lineTo(w / 2, h * 0.97); c.stroke();
    c.lineWidth = 3;
    for (let i = 1; i < 7; i++) { const y = h * (0.12 + i * 0.12); c.beginPath(); c.moveTo(w / 2, y); c.lineTo(w * 0.15, y - h * 0.1); c.moveTo(w / 2, y); c.lineTo(w * 0.85, y - h * 0.1); c.stroke(); }
    c.restore();
  });
}

/** A leaf held upright in a crocodile-clip stand, face towards local +z. setCondition(key of LEAF_CONDITIONS). */
export function makeLeafSample(pos, opts = {}) {
  const g = new THREE.Group();
  g.add(at(cyl(1.2, 1.3, 0.4, mat(0x3a3d46), { seg: 24 }), 0, 0.2, 0));
  g.add(at(cyl(0.1, 0.1, 3.0, metal(), { seg: 8 }), 0, 1.9, 0));
  g.add(at(box(0.5, 0.6, 0.5, mat(0xd8443a)), 0, 3.5, 0));
  const texCache = {};
  const leafMat = new THREE.MeshStandardMaterial({ transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6 });
  const leaf = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4.6), leafMat);
  leaf.position.set(0, 3.7 + 2.2, 0.06);
  leaf.castShadow = true;
  g.add(leaf);
  g.add(at(cyl(0.05, 0.06, 0.6, mat(0x3f7a3a), { seg: 6 }), 0, 3.7, 0.06));
  g.position.copy(pos ?? V());
  g.rotation.y = opts.rotY ?? 0;
  g.updateMatrixWorld(true);
  let cond = 'healthy';
  const api = {
    group: g, pick: g, leaf,
    get anchor() { return g.localToWorld(V(0, 8.6, 0)); },
    get condition() { return cond; },
    setCondition(k) {
      cond = LEAF_CONDITIONS[k] ? k : 'healthy';
      leafMat.map = texCache[cond] ??= leafTexture(cond);
      leafMat.needsUpdate = true;
      return api;
    },
  };
  api.setCondition(opts.condition ?? 'healthy');
  return tag(api, 'object', 'Leaf sample in a clip stand');
}

// ================================================================= road junction
/** Four-way road junction (lane width 2.6 cm) with stop lines; N–S road along z, E–W along x. */
export function makeRoadCross(pos, opts = {}) {
  const g = new THREE.Group();
  const L = opts.size ?? 30, RW = opts.roadW ?? 5.6;
  const tex = canvasTexture(1024, 1024, (c, w) => {
    const s = w / L;
    c.fillStyle = '#9cc27a'; c.fillRect(0, 0, w, w);
    c.fillStyle = '#4a4d55';
    c.fillRect((L / 2 - RW / 2) * s, 0, RW * s, w);
    c.fillRect(0, (L / 2 - RW / 2) * s, w, RW * s);
    c.strokeStyle = '#f3f1e8'; c.lineWidth = 0.12 * s; c.setLineDash([0.8 * s, 0.6 * s]);
    c.beginPath();
    c.moveTo((L / 2) * s, 0); c.lineTo((L / 2) * s, (L / 2 - RW / 2) * s);
    c.moveTo((L / 2) * s, (L / 2 + RW / 2) * s); c.lineTo((L / 2) * s, w);
    c.moveTo(0, (L / 2) * s); c.lineTo((L / 2 - RW / 2) * s, (L / 2) * s);
    c.moveTo((L / 2 + RW / 2) * s, (L / 2) * s); c.lineTo(w, (L / 2) * s);
    c.stroke();
    c.setLineDash([]);
    c.lineWidth = 0.25 * s;
    // stop lines (approach lanes: southbound arrives from -z on the x<0 lane... keep simple: all four)
    const a = L / 2 - RW / 2 - 0.3, b = L / 2 + RW / 2 + 0.3;
    c.beginPath();
    c.moveTo((L / 2 - RW / 2) * s, a * s); c.lineTo((L / 2) * s, a * s);
    c.moveTo((L / 2) * s, b * s); c.lineTo((L / 2 + RW / 2) * s, b * s);
    c.moveTo(a * s, (L / 2) * s); c.lineTo(a * s, (L / 2 + RW / 2) * s);
    c.moveTo(b * s, (L / 2 - RW / 2) * s); c.lineTo(b * s, (L / 2) * s);
    c.stroke();
    // zebra crossings
    c.fillStyle = 'rgba(243,241,232,.85)';
    for (let i = 0; i < 6; i++) {
      const o = (L / 2 - RW / 2 + 0.3 + i * 0.85) * s;
      c.fillRect(o, (a - 1.3) * s, 0.45 * s, 0.9 * s);
      c.fillRect(o, (b + 0.4) * s, 0.45 * s, 0.9 * s);
      c.fillRect((a - 1.3) * s, o, 0.9 * s, 0.45 * s);
      c.fillRect((b + 0.4) * s, o, 0.9 * s, 0.45 * s);
    }
  });
  const m = new THREE.Mesh(new THREE.BoxGeometry(L, 0.12, L), [mat(0x7aa05e), mat(0x7aa05e), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }), mat(0x7aa05e), mat(0x7aa05e), mat(0x7aa05e)]);
  m.position.y = 0.06;
  m.receiveShadow = true;
  g.add(m);
  g.position.copy(pos ?? V());
  g.updateMatrixWorld(true);
  const api = { group: g, pick: m, size: L, roadW: RW, top: 0.12, get anchor() { return g.position.clone().add(V(0, 1, 0)); } };
  return tag(api, 'object', 'Road junction');
}
