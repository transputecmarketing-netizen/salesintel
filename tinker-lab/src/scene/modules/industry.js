// Robotics, factory and smart-city parts for the capstone tracks (units: cm, y up).
//
// Same conventions as the other module files: free-standing parts take
// (pos, opts) with opts.rotY, expose { group, pick, anchor, pins, pin(name) }
// with pins pointing UP, `kind` / `label` for the parts list, and tick(dt) for
// anything that moves. Scenery (roads, rooms, tracks) has kind 'prop'.
//
//  Robotics      makeRobotArm (4-DOF + gripper, ik(), setJoints, glide)
//                makePanScanner (SG90 + VL53L0X / HC-SR04), drawRadar(oled, …)
//                makeLineSensorArray (5 × TCRT5000), makeLineTrack
//  Factory       makeConveyor, makeColorBlock, makeParcel, makeChute, makeBin,
//                makeColorSensor (TCS34725), makeBreakBeam, makeIRObstacle,
//                makeStackLight
//  Displays      makeLedMatrix (MAX7219 8×8), makeTM1637 (4-digit)
//  City (H0, 1:87) makeIntersection (+ cars that queue), makeToyCar, makeBarrier,
//                makeRailway (+ train), makeCarPark, makeStreet, makeStreetLamp,
//                makeSpeedCamera, makeHarness (under-base wiring loom → header)
//  Power         makeSupply (DC adapter + screw-terminal jack), makeBatteryPack
import {
  THREE, V, mat, mesh, box, cyl, at, canvasTexture, glowSprite, metal, slab, roundedRectShape,
  makeBreakout, freeApi, decal, textDecal, soic, qfn, smd, smdField, smdLed, thtLed, trimRound, screwTerminal,
  electrolytic, emissiveMat, noRay, cable, PITCH, PCB, PCB_T, PIN_TIP, MONO, SANS, live,
} from './common.js';
import { glowPool } from '../kit.js';
import { glyph } from './font5x7.js';

const D2R = Math.PI / 180;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;

/** Small printed label lying flat (or vertical with o.vertical). */
function label(text, w, h, o = {}) {
  return textDecal(text, w, h, { color: o.color ?? '#1d2440', font: o.font ?? SANS, weight: o.weight ?? 700, size: o.size ?? 0.62, bg: o.bg, vertical: o.vertical, basic: o.basic });
}

// ================================================================= SG90 servo body
/**
 * SG90 / MG90S micro servo body. Local frame: output shaft axis +Y, horn seat at
 * y = 0 (the shaft top), body below and offset to +X. o.color, o.metal (MG90S).
 */
function servoBody(o = {}) {
  const g = new THREE.Group();
  const c = mat(o.color ?? (o.metal ? 0x24252b : 0x2f5fbf), { rough: 0.5 });
  g.add(at(box(2.28, 2.25, 1.22, c), 0.54, -1.55, 0));
  g.add(at(box(3.2, 0.1, 1.22, c), 0.54, -1.02, 0));
  g.add(at(cyl(0.6, 0.6, 0.42, c, { seg: 20 }), 0, -0.24, 0));
  g.add(at(cyl(0.3, 0.3, 0.2, c, { seg: 14 }), 0.75, -0.33, 0));
  g.add(at(cyl(0.24, 0.24, 0.16, mat(o.metal ? 0xd6b46a : 0xf3f1e8, { metal: o.metal ? 0.6 : 0 }), { seg: 12 }), 0, 0.02, 0));
  if (o.label !== false) {
    const t = label(o.metal ? 'MG90S' : 'SG90', 1.6, 0.5, { color: '#e9efff', vertical: true, size: 0.7 });
    t.position.set(0.54, -1.6, 0.615);
    g.add(t);
  }
  return g;
}

/** Plain servo horn (single arm) in the XZ plane, centred on the shaft. */
function servoHorn(len = 1.4, color = 0xf3f1e8) {
  const g = new THREE.Group();
  g.add(at(cyl(0.3, 0.3, 0.12, mat(color), { seg: 16 }), 0, 0.06, 0));
  g.add(at(box(len, 0.1, 0.3, mat(color)), len / 2, 0.06, 0));
  return g;
}

/** 3-pin servo cable bundle (brown, red, orange) along points. */
function servoCable(points) {
  const g = new THREE.Group();
  [[0x6b4226, -0.06], [0xd8443a, 0], [0xef8a2b, 0.06]].forEach(([c, d]) => {
    g.add(cable(points.map((p) => p.clone().add(V(0, 0, d))), c, 0.035, { seg: 32 }));
  });
  return g;
}

// ================================================================= power
/**
 * Wall adapter brick with a lead ending in a DC barrel-jack → screw-terminal
 * adapter. pin('+') / pin('-') are the screw tops. opts: label ('5 V 3 A'), rotY.
 */
export function makeSupply(pos, opts = {}) {
  const g = new THREE.Group();
  // jack adapter (terminal at the origin)
  const jack = new THREE.Group();
  jack.add(at(box(1.6, 1.1, 1.3, mat(0x24252a, { rough: 0.6 })), 0, 0.55, 0));
  const tb = screwTerminal(2, 0x2a9a4a, { pitch: 0.5 });
  tb.position.set(0, 1.1, 0.0);
  jack.add(tb);
  const pl = label('+    −', 1.2, 0.3, { color: '#f3f1e8', size: 0.8 });
  pl.position.set(0, 1.11, 0.52);
  jack.add(pl);
  g.add(jack);
  // lead to the brick
  g.add(cable([V(0, 0.5, -0.7), V(0, 0.3, -2.0), V(-0.8, 0.25, -3.6), V(-1.5, 0.6, -4.4)], 0x1d1e23, 0.12));
  const brick = new THREE.Group();
  brick.add(at(box(4.2, 2.6, 3.0, mat(0x2a2c33, { rough: 0.55 })), 0, 1.3, 0));
  const t = label([opts.label ?? '5 V 3 A', 'DC adapter'], 3.2, 1.4, { color: '#e6e3da', size: 0.42 });
  t.position.set(0, 2.61, 0);
  brick.add(t);
  brick.position.set(-1.8, 0, -6.2);
  g.add(brick);
  const pinsLocal = new Map([['+', V(-0.25, 1.1 + 0.95 + 0.06, -0.14)], ['-', V(0.25, 1.1 + 0.95 + 0.06, -0.14)]]);
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(-1.8, 3.4, -6.2) });
  api.kind = 'part';
  api.label = `${opts.label ?? '5 V 3 A'} DC supply`;
  return api;
}

/** 4×AA (or 2×18650) battery holder lying flat; pin('+') / pin('-') on terminal posts. */
export function makeBatteryPack(pos, opts = {}) {
  const g = new THREE.Group();
  g.add(at(box(6.0, 1.5, 4.4, mat(0x24252a, { rough: 0.6 })), 0, 0.75, 0));
  for (let i = 0; i < 4; i++) {
    const cell = cyl(0.68, 0.68, 4.9, mat(0x3a6fd0, { rough: 0.4 }), { seg: 20 });
    cell.rotation.z = Math.PI / 2;
    g.add(at(cell, 0.1, 1.2, -1.53 + i * 1.02));
    const band = cyl(0.69, 0.69, 1.1, mat(0x2a2c33), { seg: 20, outline: false });
    band.rotation.z = Math.PI / 2;
    g.add(at(band, i % 2 ? 1.95 : -1.75, 1.2, -1.53 + i * 1.02));
  }
  const posts = [];
  for (const [z, c] of [[-0.7, 0xd8443a], [0.7, 0x2a2c33]]) {
    g.add(at(box(0.7, 0.5, 0.7, mat(c)), -2.75, 1.75, z));
    g.add(at(cyl(0.12, 0.12, 0.3, mat(0xd6b46a, { metal: 0.6, rough: 0.35 })), -2.75, 2.15, z));
    posts.push(V(-2.75, 2.3, z));
  }
  const t = label(opts.text ?? '4×AA · 6 V', 2.6, 0.5, { color: '#f3f1e8', size: 0.7 });
  t.position.set(0.5, 1.92, 0);
  g.add(t);
  const api = freeApi(g, new Map([['+', posts[0]], ['-', posts[1]]]), pos, opts, { pick: g, anchor: V(0, 2.6, 0) });
  api.kind = 'part';
  api.label = opts.text ? `Battery pack (${opts.text})` : 'Battery pack (4×AA)';
  return api;
}

// ================================================================= 4-DOF robot arm
/**
 * Desk robot arm: base (yaw) + shoulder + elbow + wrist (pitch) on servos and a
 * servo gripper. Arm frame for code: x right, y forward, z up, origin = base
 * centre on the table (cm). Forward = local +Z of the group.
 *
 * Servo angle conventions (what Servo.write() receives):
 *  base     90 = forward; 90 − atan2(x, y) (servo turns counter-clockwise from above)
 *  shoulder upper-arm elevation above horizontal (0 forward … 180 back)
 *  elbow    interior angle between upper arm and forearm (180 = straight)
 *  wrist    120 = gripper in line with the forearm (horn fitted 30° round, so
 *           a straight-down gripper stays inside 0…180°)
 *  grip     GRIP_OPEN 90 (jaws 4.4 cm apart) … 0 (closed)
 *
 * API: setJoints({base, shoulder, elbow, wrist, grip}) (servos slew at their
 * real ≈ 0.1 s / 60°), glide(target, ms) (linear, all joints arrive together),
 * joints, ik(x, y, z, pitchDeg = -90) → joints | null, tcp() world point,
 * toArm(world) / fromArm(x, y, z), hold(obj) / release(parent), pins
 * S1–S5 (signal), GND, and screw terminal V+ / VGND on the servo hub.
 */
export const ARM = { H: 6.0, L1: 8.0, L2: 8.0, L3: 6.5 };
export function armIK(x, y, z, pitchDeg = -90) {
  const { H, L1, L2, L3 } = ARM;
  const p = pitchDeg * D2R;
  const r = Math.hypot(x, y);
  const wr = r - L3 * Math.cos(p);
  const wz = z - L3 * Math.sin(p) - H;
  const d = Math.hypot(wr, wz);
  if (d > L1 + L2 - 0.1 || d < 2) return null;
  const a1 = Math.atan2(wz, wr) + Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  const a2 = Math.acos((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2));
  const fore = a1 - (Math.PI - a2);
  const j = {
    base: Math.round(90 - Math.atan2(x, y) / D2R),
    shoulder: Math.round(a1 / D2R),
    elbow: Math.round(a2 / D2R),
    wrist: Math.round(120 + (p - fore) / D2R),
  };
  for (const k in j) if (j[k] < 0 || j[k] > 180) return null;
  return j;
}

export function makeRobotArm(pos, opts = {}) {
  const { H, L1, L2, L3 } = ARM;
  const g = new THREE.Group();
  const alu = mat(0xc9ccd2, { metal: 0.55, rough: 0.35 });
  const acrylic = mat(opts.color ?? 0x2a2c33, { rough: 0.45 });
  const accent = mat(0xf08a2c, { rough: 0.5 });
  // ---- base
  g.add(slab(roundedRectShape(11, 11, 0.8), 0.4, acrylic));
  for (const [x, z] of [[-4.6, -4.6], [4.6, -4.6], [-4.6, 4.6], [4.6, 4.6]]) g.add(at(cyl(0.22, 0.22, 0.08, metal(), { seg: 10, outline: false }), x, 0.44, z));
  g.add(at(cyl(3.9, 4.1, 2.8, acrylic, { seg: 40 }), 0, 0.4 + 1.4, 0));
  g.add(at(cyl(3.95, 3.95, 0.18, accent, { seg: 40, outline: false }), 0, 2.6, 0));
  const plateTop = label('TL-ARM 4', 2.4, 0.5, { color: '#f3f1e8', size: 0.7 });
  plateTop.position.set(0, 0.41, 4.6);
  g.add(plateTop);
  // ---- yaw turntable
  const yaw = new THREE.Group();
  yaw.position.y = 3.2;
  g.add(yaw);
  yaw.add(at(cyl(3.4, 3.4, 0.4, alu, { seg: 40 }), 0, 0.2, 0));
  // shoulder bracket: two uprights carrying the pivot at y = H
  const sy = H - 3.2;
  for (const s of [-1, 1]) yaw.add(at(box(0.25, sy + 0.9, 2.6, alu), s * 1.9, 0.4 + (sy + 0.9) / 2 - 0.2, 0));
  const shoulderServo = servoBody({ metal: true });
  shoulderServo.rotation.z = -Math.PI / 2;
  shoulderServo.position.set(-1.75, sy, 0);
  yaw.add(shoulderServo);
  // ---- shoulder → upper arm
  const shoulder = new THREE.Group();
  shoulder.position.set(0, sy, 0);
  yaw.add(shoulder);
  const plateArm = (len, half, group, thick = 0.22) => {
    for (const s of [-1, 1]) {
      group.add(at(box(thick, 1.3, len + 1.4, alu), s * half, 0, len / 2));
      for (const z of [0, len]) {
        const boss = cyl(0.65, 0.65, thick + 0.02, alu, { seg: 20 });
        boss.rotation.z = Math.PI / 2;
        group.add(at(boss, s * half, 0, z));
      }
    }
    group.add(at(box(half * 2, 0.2, len * 0.55, alu), 0, -0.55, len / 2));
  };
  plateArm(L1, 1.55, shoulder);
  // elbow servo at the far end of the upper arm (shaft along -x)
  const elbowServo = servoBody({ color: 0x2f5fbf });
  elbowServo.rotation.z = Math.PI / 2;
  elbowServo.position.set(1.3, 0, L1);
  shoulder.add(elbowServo);
  // ---- elbow → forearm
  const elbow = new THREE.Group();
  elbow.position.set(0, 0, L1);
  shoulder.add(elbow);
  plateArm(L2, 1.05, elbow, 0.2);
  const wristServo = servoBody({ color: 0x2f5fbf });
  wristServo.rotation.z = -Math.PI / 2;
  wristServo.position.set(-0.85, 0, L2);
  elbow.add(wristServo);
  // ---- wrist → gripper (points along +z, TCP at z = L3)
  const wrist = new THREE.Group();
  wrist.position.set(0, 0, L2);
  elbow.add(wrist);
  wrist.add(at(box(2.4, 1.5, 0.25, alu), 0, 0, 0.9));
  wrist.add(at(box(1.22, 2.0, 2.28, mat(0x2f5fbf, { rough: 0.5 })), 0, 0, 2.2));
  wrist.add(at(box(4.6, 0.3, 1.1, acrylic), 0, 0.85, 3.2));
  wrist.add(at(box(4.6, 0.3, 1.1, acrylic), 0, -0.85, 3.2));
  const fingers = [-1, 1].map((s) => {
    const f = new THREE.Group();
    f.add(at(box(0.3, 1.5, 4.2, acrylic), 0, 0, -0.4));
    f.add(at(box(0.12, 1.3, 1.6, mat(0xe5412e, { rough: 0.8 })), -s * 0.21, 0, 0.7));
    f.position.set(s * 2.2, 0, L3 - 0.7);
    wrist.add(f);
    return f;
  });
  const tcpLocal = V(0, 0, L3);
  // ---- servo hub at the back of the base: 5 × signal + GND, screw terminal V+ / VGND
  const hub = makeBreakout({
    w: 3.4, d: 1.9, color: 0x1d3a86, pins: ['S1', 'S2', 'S3', 'S4', 'S5', 'GND'], pinsEdge: 'front', inset: 0.25, labelSide: 'out',
    silk: (P) => { P.text('SERVO HUB', 0.55, -0.55, 0.15, { weight: 700 }); P.text('1 base 2 shldr 3 elbow 4 wrist 5 grip', 0, -0.25, 0.085); },
  });
  const tb = screwTerminal(2, 0x2a9a4a);
  hub.on(tb, -1.05, -0.45);
  hub.group.position.set(0, 0, -7.3);
  g.add(hub.group);
  hub.group.updateMatrix();
  tb.updateMatrix();
  const pinsLocal = new Map();
  for (const [n, p] of hub.pinsLocal) pinsLocal.set(n, p.clone().applyMatrix4(hub.group.matrix));
  const screwLocal = (i) => tb.userData.screws[i].clone().applyMatrix4(tb.matrix).applyMatrix4(hub.group.matrix);
  pinsLocal.set('V+', screwLocal(0));
  pinsLocal.set('VGND', screwLocal(1));
  // servo cables from the hub into the base
  g.add(servoCable([V(0.4, 0.3, -6.3), V(0.4, 0.7, -5.6), V(0.3, 1.6, -4.05)]));
  g.add(servoCable([V(-0.6, 0.3, -6.3), V(-0.9, 0.9, -5.6), V(-1.2, 2.2, -4.0)]));

  // ---- state
  const J = ['base', 'shoulder', 'elbow', 'wrist', 'grip'];
  const cur = { base: 90, shoulder: 110, elbow: 70, wrist: 70, grip: 90 };
  const tgt = { ...cur };
  let glideJob = null;
  let held = null, heldWidth = 0;
  const RATE = 600; // deg/s, SG90 no-load ≈ 0.1 s / 60°
  function pose() {
    yaw.rotation.y = (cur.base - 90) * D2R;
    shoulder.rotation.x = -cur.shoulder * D2R;
    elbow.rotation.x = -(cur.elbow - 180) * D2R;
    wrist.rotation.x = -(cur.wrist - 120) * D2R;
    let gap = 4.4 * clamp(cur.grip, 0, 90) / 90;
    if (held) gap = Math.max(gap, heldWidth);
    fingers[0].position.x = -(gap / 2 + 0.15);
    fingers[1].position.x = gap / 2 + 0.15;
  }
  pose();
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, 15, 4) });
  const anchorLocal = V(0, 2.5, 0);
  live(api, {
    kind: 'part',
    label: '4-DOF robot arm (SG90/MG90S)',
    joints: cur,
    target: tgt,
    get holding() { return held; },
    get moving() { return !!glideJob || J.some((k) => Math.abs(cur[k] - tgt[k]) > 0.5); },
    /** Jump the servo targets (they slew at servo speed). */
    setJoints(j) {
      glideJob = null;
      for (const k of J) if (j[k] != null) tgt[k] = clamp(+j[k], 0, 180);
      return api;
    },
    /** Linear joint-space move over `ms` (all joints arrive together), like the sketch's moveTo(). */
    glide(j, ms) {
      const from = { ...cur }, to = { ...cur };
      for (const k of J) if (j[k] != null) to[k] = clamp(+j[k], 0, 180);
      glideJob = { from, to, t: 0, T: Math.max(0.001, ms / 1000) };
      Object.assign(tgt, to);
      return ms;
    },
    /** Joint-space distance (largest single-joint change, degrees). */
    steps(j) { return Math.max(...J.map((k) => (j[k] == null ? 0 : Math.abs(Math.round(j[k]) - Math.round(cur[k]))))); },
    ik: armIK,
    /** Gripper tool point (between the finger pads), world. */
    tcp() { return wrist.localToWorld(tcpLocal.clone()); },
    toArm(w) { const l = g.worldToLocal(w.clone()); return { x: -l.x, y: l.z, z: l.y }; },
    fromArm(x, y, z) { return g.localToWorld(V(-x, z, y)); },
    /** Carry obj in the gripper (keeps its world pose); width = its size between the jaws. */
    hold(obj, width = 2.5) {
      held = obj;
      heldWidth = width;
      g.updateMatrixWorld(true);
      wrist.attach(obj);
      pose();
      return api;
    },
    release(parent) {
      if (!held) return null;
      const o = held;
      held = null;
      parent.attach(o);
      return o;
    },
    tick(dt) {
      if (glideJob) {
        glideJob.t += dt;
        const k = Math.min(1, glideJob.t / glideJob.T);
        for (const n of J) cur[n] = lerp(glideJob.from[n], glideJob.to[n], k);
        if (k >= 1) glideJob = null;
      } else {
        for (const n of J) {
          const d = tgt[n] - cur[n];
          cur[n] += clamp(d, -RATE * dt, RATE * dt);
        }
      }
      pose();
      g.updateMatrixWorld(true);
      api.anchor.copy(g.localToWorld(V(0, H + 6, 4)));
    },
    /** Rest pose, gripper open. */
    reset(parent) {
      glideJob = null;
      if (held && parent) api.release(parent);
      Object.assign(cur, { base: 90, shoulder: 110, elbow: 70, wrist: 70, grip: 90 });
      Object.assign(tgt, cur);
      pose();
      return api;
    },
    parts: { yaw, shoulder, elbow, wrist, hub: hub.group },
    baseAnchor: g.localToWorld(anchorLocal.clone()),
    hubAnchor: g.localToWorld(V(0, 1.6, -7.3)),
  });
  api.anchor = g.localToWorld(V(0, H + 6, 4));
  return api;
}

// ================================================================= blocks and parcels
export const BLOCK_RGB = {
  red: { hex: 0xe0402e, r: 0.58, g: 0.22, b: 0.2 },
  green: { hex: 0x3aa65a, r: 0.27, g: 0.45, b: 0.28 },
  blue: { hex: 0x3a6fd0, r: 0.2, g: 0.31, b: 0.49 },
  yellow: { hex: 0xf2c230, r: 0.44, g: 0.4, b: 0.16 },
};
/** 2.5 cm wooden-style cube in one of red / green / blue / yellow. */
export function makeColorBlock(color = 'red', size = 2.5) {
  const g = new THREE.Group();
  const m = box(size, size, size, mat(BLOCK_RGB[color]?.hex ?? color, { rough: 0.6 }));
  m.position.y = size / 2;
  g.add(m);
  g.userData.color = color;
  g.userData.size = size;
  g.userData.label = 'Coloured block';
  return g;
}

/** Cardboard parcel with tape and a label. */
export function makeParcel(w = 3.2, h = 2.4, d = 2.6) {
  const g = new THREE.Group();
  g.add(at(box(w, h, d, mat(0xc89b62, { rough: 0.8 })), 0, h / 2, 0));
  g.add(at(box(0.6, 0.02, d + 0.02, mat(0xb2844e, { rough: 0.6 }), { outline: false }), 0, h + 0.005, 0));
  const l = decal(1.2, 0.8, (c, cw, ch) => {
    c.fillStyle = '#f6f3ea'; c.fillRect(0, 0, cw, ch);
    c.fillStyle = '#1d2440';
    for (let i = 0; i < 14; i++) c.fillRect(cw * 0.08 + i * cw * 0.06, ch * 0.5, cw * (i % 3 ? 0.02 : 0.035), ch * 0.38);
    c.fillRect(cw * 0.08, ch * 0.14, cw * 0.6, ch * 0.08);
  });
  l.position.set(w * 0.2, h + 0.01, 0);
  g.add(l);
  g.userData.size = Math.max(w, d);
  g.userData.label = 'Parcel';
  return g;
}

// ================================================================= conveyor
/**
 * Belt conveyor: aluminium frame on legs, two end rollers, a rubber belt with a
 * scrolling texture, low side guides and a yellow TT gear motor on the drive
 * (start, −x) roller. Belt runs along local +X from −L/2 to +L/2.
 * opts: length (30), width (6), height (belt top, 6), maxSpeed (cm/s at full
 * power, 10), rotY. API: set(power −1..1), speed (cm/s, with spin-up), beltY,
 * place(obj, s, z) — obj rides the belt at s (−L/2…L/2), items, remove(obj),
 * at(s, z) world point on the belt, onEnd(fn(item)) when an item reaches the
 * end. pin('M+') / pin('M-') motor terminals.
 */
export function makeConveyor(pos, opts = {}) {
  const L = opts.length ?? 30, W = opts.width ?? 6, BY = opts.height ?? 6;
  const R = 0.9;
  const g = new THREE.Group();
  const alu = mat(0xc9ccd2, { metal: 0.5, rough: 0.38 });
  const dark = mat(0x3a3d46, { rough: 0.6 });
  // legs + feet + cross bars
  const LX = L / 2 - 3;
  for (const x of [-LX, LX]) for (const s of [-1, 1]) {
    g.add(at(box(0.8, BY - 1.2, 0.8, alu), x, (BY - 1.2) / 2, s * (W / 2 + 0.5)));
    g.add(at(box(1.6, 0.25, 1.6, dark), x, 0.12, s * (W / 2 + 0.5)));
  }
  for (const x of [-LX, LX]) g.add(at(box(0.6, 0.6, W + 1.8, alu), x, 1.4, 0));
  // side frame rails (below belt top) and low guides
  for (const s of [-1, 1]) {
    g.add(at(box(L + 0.6, 1.8, 0.35, alu), 0, BY - 1.15, s * (W / 2 + 0.3)));
    g.add(at(box(L - 2, 0.35, 0.2, mat(0xf08a2c, { rough: 0.5 })), 0, BY + 0.18, s * (W / 2 + 0.25)));
  }
  // rollers
  const rollers = [-L / 2 + R, L / 2 - R].map((x) => {
    const r = cyl(R, R, W + 0.2, mat(0xa9acb3, { metal: 0.5, rough: 0.3 }), { seg: 24 });
    r.rotation.x = Math.PI / 2;
    const rg = new THREE.Group();
    rg.add(r);
    for (let i = 0; i < 6; i++) {
      const line = box(0.06, 0.06, W + 0.24, mat(0x6d7079), { outline: false });
      line.position.set(Math.cos((i / 6) * Math.PI * 2) * R, Math.sin((i / 6) * Math.PI * 2) * R, 0);
      rg.add(line);
    }
    rg.position.set(x, BY - R, 0);
    g.add(rg);
    return rg;
  });
  // belt: top + bottom runs with a scrolling texture, wrap around rollers
  const tex = canvasTexture(256, 64, (c, w, h) => {
    c.fillStyle = '#2b2d33'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#3c3f47';
    for (let i = 0; i < 4; i++) c.fillRect(i * 64 + 6, 0, 10, h);
    c.fillStyle = 'rgba(255,255,255,.05)';
    for (let i = 0; i < 60; i++) c.fillRect((i * 37) % w, (i * 13) % h, 2, 2);
  }, { repeat: [(L - 2 * R) / 4, 1] });
  const beltMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
  const top = mesh(new THREE.BoxGeometry(L - 2 * R, 0.12, W), [dark, dark, beltMat, dark, dark, dark]);
  top.position.set(0, BY - 0.06, 0);
  g.add(top);
  const bottom = mesh(new THREE.BoxGeometry(L - 2 * R, 0.12, W), dark, { outline: false });
  bottom.position.set(0, BY - 2 * R + 0.06, 0);
  g.add(bottom);
  for (const x of [-L / 2 + R, L / 2 - R]) {
    const wrap = cyl(R + 0.06, R + 0.06, W, dark, { seg: 24 });
    wrap.rotation.x = Math.PI / 2;
    g.add(at(wrap, x, BY - R, 0));
  }
  // TT gear motor on the drive roller (front side, +z): shaft on the roller axis,
  // gearbox hanging down, motor can at the bottom; leads to a 2-pin header on the floor
  const mot = new THREE.Group();
  const yellow = mat(0xf2c230, { rough: 0.5 });
  mot.add(at(box(2.2, 3.7, 1.9, yellow), 0, -1.25, 0));
  mot.add(at(cyl(0.3, 0.3, 0.5, mat(0xf3f1e8), { seg: 12 }).rotateX(Math.PI / 2), 0, 0, -1.1));
  const can = cyl(0.95, 0.95, 1.9, metal(), { seg: 24 });
  mot.add(at(can, 0, -4.0, 0));
  mot.position.set(-L / 2 + R, BY - R, W / 2 + 1.55);
  g.add(mot);
  const canEnd = V(-L / 2 + R, BY - R - 4.95, W / 2 + 1.55);
  const hdr = makeBreakout({ w: 1.2, d: 1.0, color: 0x25262b, pins: ['M+', 'M-'], pinsEdge: 'back', inset: 0.25 });
  hdr.group.position.set(-L / 2 + R + 2.4, 0, W / 2 + 2.4);
  g.add(hdr.group);
  hdr.group.updateMatrix();
  const termLocal = [...hdr.pinsLocal.values()].map((p) => p.clone().applyMatrix4(hdr.group.matrix));
  for (const [dz, c] of [[-0.25, 0xd8443a], [0.25, 0x2a2c33]]) g.add(cable([canEnd.clone().add(V(0.5, 0.4, dz)), canEnd.clone().add(V(1.4, 0.1, dz)), V(-L / 2 + R + 2.4 + (dz < 0 ? -0.13 : 0.13), 0.2, W / 2 + 2.8)], c, 0.05));
  const items = [];
  let power = 0, speed = 0, endFn = null, spin = 0;
  const maxV = opts.maxSpeed ?? 10;
  const api = freeApi(g, new Map([['M+', termLocal[0]], ['M-', termLocal[1]]]), pos, opts, { pick: top, anchor: V(0, BY + 4, 0) });
  live(api, {
    kind: 'part',
    label: opts.label ?? 'Belt conveyor (TT gear motor)',
    length: L, width: W, beltY: BY,
    get speed() { return speed; },
    get power() { return power; },
    items,
    set(p) { power = clamp(+p || 0, -1, 1); return api; },
    at(s, z = 0, y = 0) { return g.localToWorld(V(s, BY + y, z)); },
    place(obj, s, z = 0) {
      const it = { obj, s, z };
      items.push(it);
      g.updateMatrixWorld(true);
      obj.position.copy(api.at(s, z));
      obj.rotation.y = g.rotation.y;
      return it;
    },
    remove(obj) { const i = items.findIndex((t) => t.obj === obj); if (i >= 0) items.splice(i, 1); },
    clear() { items.length = 0; },
    onEnd(fn) { endFn = fn; },
    tick(dt) {
      // DC motor spins up over ≈ 0.25 s
      speed += (power * maxV - speed) * Math.min(1, dt * 8);
      if (Math.abs(speed) < 0.01 && power === 0) speed = 0;
      tex.offset.x -= (speed * dt) / 4;
      spin += (speed * dt) / R;
      rollers.forEach((r) => (r.rotation.z = -spin));
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.s += speed * dt;
        it.obj.position.copy(api.at(it.s, it.z));
        if (it.s > L / 2 - 0.6) {
          items.splice(i, 1);
          endFn?.(it);
        }
      }
    },
  });
  return api;
}

// ================================================================= sorting chute + bins
/**
 * Servo-turned chute below the end of a conveyor: an SG90 (shaft up) turns a
 * sloped trough towards one of several bins arranged on an arc. Local: pivot at
 * origin, trough points along +X at angle 90. pin('SIG'|'V+'|'GND') on the base
 * header. setAngle(deg) (servo slews), angle, mouth(deg) world point where items
 * leave the trough, top world point where they enter.
 */
export function makeChute(pos, opts = {}) {
  const g = new THREE.Group();
  const H = opts.height ?? 4.6;
  const dark = mat(0x3a3d46, { rough: 0.6 });
  g.add(at(box(4.2, 0.4, 3.4, dark), 0, 0.2, 0));
  g.add(at(cyl(1.0, 1.2, H - 2.2, mat(0xc9ccd2, { metal: 0.5, rough: 0.38 }), { seg: 20 }), 0, 0.4 + (H - 2.2) / 2, 0));
  const sv = servoBody();
  sv.position.set(-0.54, H - 0.3, 0);
  g.add(sv);
  const rot = new THREE.Group();
  rot.position.y = H;
  g.add(rot);
  rot.add(servoHorn(1.2));
  // trough: floor + two walls, sloping down outward along +x
  const LEN = opts.length ?? 7;
  const trough = new THREE.Group();
  const plastic = mat(opts.color ?? 0x3a78d0, { rough: 0.5 });
  trough.add(at(box(LEN, 0.15, 3.2, plastic), LEN / 2, 0.2, 0));
  for (const s of [-1, 1]) trough.add(at(box(LEN, 1.1, 0.15, plastic), LEN / 2, 0.7, s * 1.6));
  trough.add(at(box(0.15, 1.1, 3.2, plastic), -0.05, 0.7, 0));
  trough.rotation.z = -0.32;
  rot.add(trough);
  const hdr = makeBreakout({ w: 1.6, d: 1.0, color: 0x25262b, pins: ['GND', 'V+', 'SIG'], pinsEdge: 'back', inset: 0.25, labelSide: 'in' });
  hdr.group.position.set(-1.2, 0.4, 1.0);
  g.add(hdr.group);
  hdr.group.updateMatrix();
  const pinsLocal = new Map([...hdr.pinsLocal].map(([n, p]) => [n, p.clone().applyMatrix4(hdr.group.matrix)]));
  g.add(servoCable([V(-1.2, 0.85, 0.85), V(-1.4, 1.6, 0.4), V(-1.0, H - 1.6, 0.2), V(0.6, H - 1.3, 0.2)]));
  let ang = 90, tgt = 90;
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, H + 2.4, 0) });
  const sweep = opts.sweep ?? 1; // +1: servo angle increases counter-clockwise from above
  const pose = () => { rot.rotation.y = sweep * (ang - 90) * D2R; };
  pose();
  live(api, {
    kind: 'part',
    label: 'Sorting chute (SG90 servo)',
    get angle() { return ang; },
    setAngle(d) { tgt = clamp(d, 0, 180); return api; },
    /** World point at the trough's lower end for servo angle deg. */
    mouth(deg = ang) {
      const a = sweep * (deg - 90) * D2R;
      const r = LEN * Math.cos(0.32) + 0.2;
      return g.localToWorld(V(Math.cos(a) * r, H - LEN * Math.sin(0.32) + 0.5, -Math.sin(a) * r));
    },
    top: g.localToWorld(V(0.6, H + 0.6, 0)),
    tick(dt) {
      ang += clamp(tgt - ang, -600 * dt, 600 * dt);
      pose();
    },
    trough,
  });
  return api;
}

/** Open-topped bin with a coloured front label. API: drop(obj) stacks obj inside, count, clear(). */
export function makeBin(pos, opts = {}) {
  const g = new THREE.Group();
  const c = mat(opts.color ?? 0x8a8d94, { rough: 0.55 });
  const W = opts.width ?? 5, D = opts.depth ?? 5, H = opts.height ?? 3;
  g.add(at(box(W, 0.2, D, c), 0, 0.1, 0));
  for (const s of [-1, 1]) {
    g.add(at(box(W, H, 0.2, c), 0, H / 2, s * (D / 2 - 0.1)));
    g.add(at(box(0.2, H, D, c), s * (W / 2 - 0.1), H / 2, 0));
  }
  if (opts.tag) {
    const t = label(opts.tag, W * 0.8, 0.9, { color: '#ffffff', size: 0.62, vertical: true });
    t.position.set(0, H * 0.55, D / 2 + 0.01);
    g.add(t);
  }
  g.position.copy(pos);
  g.rotation.y = opts.rotY ?? 0;
  g.updateMatrixWorld(true);
  const stack = [];
  const api = {
    group: g, pick: g, kind: 'part', label: opts.label ?? 'Bin',
    anchor: g.localToWorld(V(0, H + 1.5, 0)),
    get count() { return stack.length; },
    /** Where the next item lands (world). */
    slot(i = stack.length) {
      const cols = 2;
      const x = ((i % cols) - 0.5) * 2.2, z = ((Math.floor(i / cols) % 2) - 0.5) * 2.2;
      return g.localToWorld(V(x, 0.2 + Math.floor(i / 4) * 2.5, z));
    },
    drop(obj) {
      const p = api.slot();
      stack.push(obj);
      obj.position.copy(p);
      obj.rotation.set(0, g.rotation.y + (Math.random() - 0.5) * 0.4, 0);
      return api;
    },
    clear() { const s = stack.splice(0); return s; },
  };
  return api;
}

// ================================================================= TCS34725 colour sensor
/**
 * TCS34725 RGB colour sensor breakout, mounted face DOWN on a bridge over a
 * conveyor (sensor and white LED under the board, header pins pointing up out of
 * the back). Pins VIN GND 3V3 SCL SDA INT LED. opts.bridge: span (cm) of the
 * two-post bridge (0 = no bridge), opts.height: board height above pos.
 * API: setLed(on), sample(rgb) tints the light spot, front (world point under the sensor).
 */
export function makeColorSensor(pos, opts = {}) {
  const g = new THREE.Group();
  const HY = opts.height ?? 4;
  const span = opts.bridge ?? 0;
  const alu = mat(0xc9ccd2, { metal: 0.5, rough: 0.38 });
  if (span) {
    for (const s of [-1, 1]) {
      g.add(at(box(0.7, HY, 0.7, alu), 0, HY / 2, s * span / 2));
      g.add(at(box(1.4, 0.2, 1.4, mat(0x3a3d46)), 0, 0.1, s * span / 2));
    }
    g.add(at(box(2.2, 0.3, span + 0.7, alu), 0, HY - 0.15, 0));
  }
  const b = makeBreakout({
    w: 2.0, d: 2.0, color: 0x1d3a86, pins: ['VIN', 'GND', '3V3', 'SCL', 'SDA', 'INT', 'LED'], pinsEdge: 'back', inset: 0.18,
    holes: [[-0.75, 0.75], [0.75, 0.75]], holeR: 0.1,
    silk: (P) => { P.text('TCS34725', 0, 0.35, 0.17, { weight: 700 }); P.text('RGB', 0, 0.62, 0.12); },
  });
  b.group.position.set(0, HY, 0);
  g.add(b.group);
  // underside: sensor chip + white LED
  const under = new THREE.Group();
  under.add(at(box(0.25, 0.1, 0.2, mat(0x1d1e23)), 0, -0.05, 0.05));
  under.add(at(box(0.08, 0.02, 0.08, mat(0xb4c8e8, { metal: 0.3 }), { outline: false }), 0, -0.105, 0.05));
  const led = emissiveMat(0xffffff, { opacity: 0.95 });
  under.add(at(box(0.3, 0.12, 0.3, led), 0.5, -0.06, 0.05));
  under.position.y = HY;
  g.add(under);
  const glow = glowSprite(0xffffff, 1.2);
  glow.position.set(0.5, HY - 0.3, 0.05);
  g.add(glow);
  const spot = glowPool(0xffffff, 2.6);
  spot.position.set(0, (opts.spotY ?? 0) + 0.02, 0.05);
  g.add(spot);
  const pl = new Map([...b.pinsLocal].map(([n, p]) => [n, p.clone().add(V(0, HY, 0))]));
  const api = freeApi(g, pl, pos, opts, { pick: b.group, anchor: V(0, HY + 1.6, 0) });
  let on = true;
  live(api, {
    kind: 'part',
    label: 'TCS34725 colour sensor',
    front: g.localToWorld(V(0, HY - 0.2, 0.05)),
    setLed(v) {
      on = !!v;
      led.emissiveIntensity = on ? 1.2 : 0;
      glow.material.opacity = on ? 0.8 : 0;
      spot.material.opacity = on ? 0.35 : 0;
      return api;
    },
    /** Tint the light spot to the colour under the sensor (hex) or white. */
    sample(hex) { spot.material.color.setHex(hex ?? 0xffffff); return api; },
  });
  api.setLed(true);
  return api;
}

// ================================================================= IR break-beam pair
/**
 * 5 mm IR break-beam pair (emitter + receiver) on two small posts. `a` and `b`
 * are the WORLD points of the emitter and receiver lenses; posts stand on
 * opts.groundY (0). Each post has a header block at its foot, offset sideways by
 * opts.out (world Vector3, default +z): emitter TX+ TX−, receiver RX+ RX− OUT
 * (open collector: LOW while the beam is broken, so use INPUT_PULLUP).
 * API: setBlocked(on), blocked, cuts(box3) → true if the box breaks the beam,
 * segment [a, b]. The invisible IR beam is drawn faint red for teaching.
 */
export function makeBreakBeam(a, b, opts = {}) {
  const g = new THREE.Group();
  const gy = opts.groundY ?? 0;
  const out = opts.out ?? V(0, 0, 1.6);
  const black = mat(0x1d1e23, { rough: 0.5 });
  const dir = V().subVectors(b, a).normalize();
  const pinsLocal = new Map();
  const ends = [[a, dir, ['TX+', 'TX-'], 'IR LED'], [b, dir.clone().negate(), ['RX+', 'RX-', 'OUT'], 'RX']];
  for (const [p, d, names, tag] of ends) {
    const post = box(0.5, p.y - gy - 0.2, 0.5, mat(0x3a3d46, { rough: 0.6 }));
    post.position.set(p.x - d.x * 0.5, gy + (p.y - gy - 0.2) / 2, p.z - d.z * 0.5);
    g.add(post);
    g.add(at(box(1.0, 0.2, 1.0, mat(0x3a3d46)), p.x - d.x * 0.5, gy + 0.1, p.z - d.z * 0.5));
    const hous = new THREE.Group();
    const barrel = cyl(0.32, 0.32, 1.1, black, { seg: 16 });
    barrel.rotation.z = Math.PI / 2;
    hous.add(at(barrel, -0.2, 0, 0));
    const lens = cyl(0.25, 0.25, 0.06, mat(tag === 'RX' ? 0x22232a : 0xd9e6f2, { rough: 0.2, opacity: tag === 'RX' ? 1 : 0.85 }), { seg: 16, outline: false });
    lens.rotation.z = Math.PI / 2;
    hous.add(at(lens, 0.36, 0, 0));
    hous.position.copy(p);
    hous.rotation.y = Math.atan2(-d.z, d.x);
    g.add(hous);
    const hb = makeBreakout({ w: 0.4 + names.length * PITCH, d: 0.9, color: 0x25262b, pins: names, pinsEdge: 'back', inset: 0.25, pinLabels: true });
    const hp = V(p.x - d.x * 0.5, gy, p.z - d.z * 0.5).add((tag === 'RX' ? opts.outB : opts.outA) ?? out);
    hb.group.position.copy(hp);
    g.add(hb.group);
    hb.group.updateMatrix();
    for (const [n, q] of hb.pinsLocal) pinsLocal.set(n, q.clone().applyMatrix4(hb.group.matrix));
    // lead from the housing down the post to the header
    const cols = names.length === 2 ? [0xd8443a, 0x2a2c33] : [0xd8443a, 0x2a2c33, 0xece8dc];
    cols.forEach((c, i) => {
      const dz = (i - (cols.length - 1) / 2) * 0.08;
      g.add(cable([p.clone().addScaledVector(d, -0.75).add(V(0, -0.1, dz)), V(p.x - d.x * 0.8, gy + (p.y - gy) * 0.4, p.z - d.z * 0.8 + dz), hp.clone().add(V(0, 0.25, -0.25 + dz))], c, 0.03, { seg: 20 }));
    });
  }
  const len = a.distanceTo(b) - 0.8;
  const beam = noRay(cyl(0.05, 0.05, len, new THREE.MeshBasicMaterial({ color: 0xff3b2f, transparent: true, opacity: 0.35, depthWrite: false }), { outline: false, seg: 8 }));
  beam.position.copy(a.clone().lerp(b, 0.5));
  beam.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
  g.add(beam);
  const glow = glowSprite(0xff3b2f, 0.9);
  glow.position.copy(a).addScaledVector(dir, 0.4);
  g.add(glow);
  glow.material.opacity = 0.6;
  let blocked = false;
  const ray = new THREE.Ray(a.clone(), dir.clone());
  const hit = V();
  const L = a.distanceTo(b);
  const api = freeApi(g, pinsLocal, V(), {}, { pick: g, anchor: a.clone().lerp(b, 0.5).add(V(0, 1.6, 0)) });
  live(api, {
    kind: 'part',
    label: opts.label ?? 'IR break-beam sensor pair',
    segment: [a.clone(), b.clone()],
    get blocked() { return blocked; },
    setBlocked(v) { blocked = !!v; beam.material.opacity = blocked ? 0.05 : 0.35; return api; },
    cuts(box3) { return !!ray.intersectBox(box3, hit) && hit.distanceTo(a) <= L; },
  });
  return api;
}

// ================================================================= FC-51 IR obstacle sensor
/**
 * FC-51-style IR obstacle sensor: IR LED + photodiode at the front (+z) end,
 * LM393 comparator, sensitivity trimmer, power + obstacle LEDs. Pins VCC GND OUT
 * on the back edge (OUT goes LOW when something reflects within ≈ 2–30 cm).
 * API: setDetect(on), front (world point at the lenses), dir (world unit vector).
 */
export function makeIRObstacle(pos, opts = {}) {
  const b = makeBreakout({
    w: 1.45, d: 3.1, color: opts.color ?? PCB.blue, pins: ['VCC', 'GND', 'OUT'], pinsEdge: 'back', inset: 0.2,
    holes: [[0, 0.35]], holeR: 0.14,
    silk: (P) => { P.text('FC-51', 0, -0.62, 0.14, { weight: 700 }); P.text('OBS', -0.45, 0.85, 0.09); P.text('PWR', 0.45, 0.85, 0.09); },
  });
  const g = b.group;
  b.on(soic(4, { label: 'LM393', len: 0.6, wid: 0.4 }), 0, -0.2);
  const tp = new THREE.Group();
  tp.add(at(box(0.6, 0.45, 0.6, mat(0x2f62c9, { rough: 0.5 })), 0, 0.225, 0));
  tp.add(at(cyl(0.16, 0.16, 0.06, mat(0xe8e4da), { seg: 14 }), 0, 0.48, 0));
  b.on(tp, 0, 0.35 - 0.62);
  const sig = smdLed(0x3fdc6a);
  b.on(sig.group, -0.45, 0.62);
  const pwr = smdLed(0xff3b2f);
  b.on(pwr.group, 0.45, 0.62);
  pwr.set(1);
  for (const [x, c] of [[-0.32, 0xd9e6f2], [0.32, 0x1d1e23]]) {
    const l = new THREE.Group();
    const body = cyl(0.25, 0.25, 0.6, mat(c, { rough: 0.25, opacity: c === 0x1d1e23 ? 1 : 0.85 }), { seg: 16 });
    body.rotation.x = Math.PI / 2;
    l.add(body);
    const dome = mesh(new THREE.SphereGeometry(0.25, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(c, { rough: 0.25, opacity: c === 0x1d1e23 ? 1 : 0.85 }), { outline: false });
    dome.rotation.x = Math.PI / 2;
    l.add(at(dome, 0, 0, 0.3));
    for (const dx of [-0.08, 0.08]) l.add(at(box(0.04, 0.04, 0.4, metal(), { outline: false }), dx, -0.12, -0.45));
    b.on(l, x, 1.45, 0.3);
  }
  const api = freeApi(g, b.pinsLocal, pos, opts, { pick: g, anchor: V(0, 1.2, 0.5) });
  live(api, {
    kind: 'part',
    label: opts.label ?? 'IR obstacle sensor (FC-51)',
    front: g.localToWorld(V(0, b.top + 0.3, 1.9)),
    dir: V(0, 0, 1).applyQuaternion(g.quaternion),
    setDetect(on) { sig.set(on ? 1 : 0); return api; },
  });
  return api;
}

// ================================================================= 5-channel line sensor
/**
 * 5-channel TCRT5000 line-tracking board: five reflective sensors on the
 * underside (spacing 1.4 cm along X), an indicator LED above each, pins GND 5V
 * OUT1…OUT5 on the back edge. OUTn reads HIGH over the black line (no
 * reflection) and LOW over white (LED on). API: set(i, overWhite), sensorLocal(i).
 */
export const LINE_SPACING = 1.4;
export function makeLineSensorArray(pos, opts = {}) {
  const b = makeBreakout({
    w: 7.4, d: 1.9, color: PCB.black, pins: ['GND', '5V', 'OUT1', 'OUT2', 'OUT3', 'OUT4', 'OUT5'], pinsEdge: 'back', inset: 0.22,
    holes: [[-3.4, 0.4], [3.4, 0.4]], holeR: 0.13,
    silk: (P) => { P.text('5CH TRACKING · TCRT5000', 0, 0.75, 0.12, { weight: 700 }); for (let i = 0; i < 5; i++) P.text(`S${i + 1}`, (i - 2) * LINE_SPACING - 0.35, 0.35, 0.1); },
  });
  const g = b.group;
  const leds = [];
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * LINE_SPACING;
    const l = smdLed(0xff3b2f);
    b.on(l.group, x, 0.35);
    leds.push(l);
    // TCRT5000 underneath: blue emitter + black detector in a black housing
    const t = new THREE.Group();
    t.add(at(box(1.0, 0.6, 0.6, mat(0x1d1e23)), 0, -0.3, 0));
    t.add(at(cyl(0.14, 0.14, 0.1, mat(0x3a78d0), { outline: false, seg: 12 }), -0.22, -0.62, 0));
    t.add(at(cyl(0.14, 0.14, 0.1, mat(0x0c0d10), { outline: false, seg: 12 }), 0.22, -0.62, 0));
    t.position.set(x, 0, 0.3);
    g.add(t);
  }
  b.on(soic(7, { label: 'LM339', len: 1.0, wid: 0.42 }), 0, -0.25);
  const api = freeApi(g, b.pinsLocal, pos, opts, { pick: g, anchor: V(0, 1.4, 0) });
  live(api, {
    kind: 'part',
    label: '5-channel IR line sensor (TCRT5000)',
    set(i, white) { leds[i]?.set(white ? 1 : 0); return api; },
    sensorLocal: (i) => V((i - 2) * LINE_SPACING, -0.7, 0.3),
  });
  return api;
}

// ================================================================= line-following track mat
/** Closed track centreline in local XZ: a rounded rectangle with one S-bend chicane. */
function trackCentre(w, d, r) {
  const pts = [];
  const arc = (cx, cz, a0, a1, n = 18) => { for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } };
  const hw = w / 2 - r, hd = d / 2 - r;
  // bottom straight (+z) left → right with a chicane
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const x = -hw + (2 * hw * i) / n;
    const k = Math.abs(x) < hw * 0.5 ? Math.sin(((x + hw * 0.5) / (hw)) * Math.PI * 2) * 0 : 0;
    const bump = Math.exp(-((x / (hw * 0.28)) ** 2)) * -6.5;
    pts.push([x, d / 2 + bump + k]);
  }
  arc(hw, hd, Math.PI / 2, 0);
  arc(hw, -hd, 0, -Math.PI / 2);
  for (let i = 1; i < n; i++) pts.push([hw - (2 * hw * i) / n, -d / 2]);
  arc(-hw, -hd, -Math.PI / 2, -Math.PI);
  arc(-hw, hd, Math.PI, Math.PI / 2);
  return pts;
}

/**
 * White track mat with a black tape line (width 1.9 cm). opts: w (120), d (70),
 * radius (22). API: distance(world) → cm from the line centre, onLine(world),
 * start (world start pose { pos, rotY } on the bottom straight, heading +x).
 */
export function makeLineTrack(pos, opts = {}) {
  const w = opts.w ?? 120, d = opts.d ?? 70, r = opts.radius ?? 22, tape = opts.tape ?? 1.9;
  const W = w + 16, D = d + 16;
  const pts = trackCentre(w, d, r);
  const g = new THREE.Group();
  const s = 14;
  const tex = canvasTexture(Math.round(W * s), Math.round(D * s), (c, cw, ch) => {
    c.fillStyle = '#f6f4ee'; c.fillRect(0, 0, cw, ch);
    c.strokeStyle = 'rgba(29,36,64,.06)'; c.lineWidth = 2;
    for (let x = 0; x < W; x += 10) { c.beginPath(); c.moveTo(x * s, 0); c.lineTo(x * s, ch); c.stroke(); }
    for (let z = 0; z < D; z += 10) { c.beginPath(); c.moveTo(0, z * s); c.lineTo(cw, z * s); c.stroke(); }
    c.strokeStyle = '#141519'; c.lineWidth = tape * s; c.lineJoin = c.lineCap = 'round';
    c.beginPath();
    pts.forEach(([x, z], i) => (i ? c.lineTo((x + W / 2) * s, (z + D / 2) * s) : c.moveTo((x + W / 2) * s, (z + D / 2) * s)));
    c.closePath();
    c.stroke();
    c.fillStyle = '#c33b2c';
    const [sx, sz] = pts[6];
    c.fillRect((sx + W / 2) * s - 3, (sz + D / 2 - 3) * s, 6, 6 * s);
  });
  const matM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  const m = mesh(new THREE.BoxGeometry(W, 0.2, D), [mat(0xe6e2d6), mat(0xe6e2d6), matM, mat(0xe6e2d6), mat(0xe6e2d6), mat(0xe6e2d6)], { outline: false });
  m.position.y = 0.1;
  g.add(m);
  g.position.copy(pos ?? V());
  g.rotation.y = opts.rotY ?? 0;
  g.updateMatrixWorld(true);
  const segDist = (px, pz) => {
    let best = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length];
      const dx = bx - ax, dz = bz - az;
      const t = clamp(((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
      best = Math.min(best, Math.hypot(px - ax - t * dx, pz - az - t * dz));
    }
    return best;
  };
  const [sx, sz] = pts[6];
  return {
    group: g, pick: m, kind: 'prop', label: 'Line-following track mat',
    anchor: g.localToWorld(V(0, 1, d / 2)),
    top: 0.2,
    tape,
    distance(wp) { const l = g.worldToLocal(wp.clone()); return segDist(l.x, l.z); },
    onLine(wp) { return this.distance(wp) < tape / 2; },
    start: { pos: g.localToWorld(V(sx - 4, 0.2, sz)), rotY: (opts.rotY ?? 0) + Math.PI / 2 },
  };
}

// ================================================================= sign post mount
/**
 * Stand a flat display module up on a post facing +z (of the post). The module
 * (built lying flat at the origin) is turned face-forward on top; its cable runs
 * inside the post to a header at the foot, which provides pin(name).
 */
function onPost(mod, names, height, pos, opts, w, d) {
  const g = new THREE.Group();
  const grey = mat(0x8f939b, { metal: 0.4, rough: 0.45 });
  g.add(at(cyl(0.3, 0.35, height, grey, { seg: 14 }), 0, height / 2, -0.4));
  g.add(at(box(1.8, 0.3, 1.8, mat(0x3a3d46)), 0, 0.15, -0.4));
  const holder = new THREE.Group();
  holder.add(at(box(w + 0.5, d + 0.5, 0.25, mat(0x26282f)), 0, 0, -0.15));
  const turn = new THREE.Group();
  turn.rotation.x = Math.PI / 2;
  turn.add(mod.group);
  mod.group.position.set(0, 0, 0);
  mod.group.rotation.set(0, opts.flip ? Math.PI : 0, 0);
  holder.add(turn);
  holder.position.set(0, height + d / 2 + 0.1, 0);
  g.add(holder);
  const hb = makeBreakout({ w: 0.4 + names.length * PITCH, d: 1.0, color: 0x25262b, pins: names, pinsEdge: 'front', inset: 0.25, labelSide: 'out' });
  hb.group.position.set(0, 0.3, 0.75);
  g.add(hb.group);
  hb.group.updateMatrix();
  g.add(cable([V(0, 0.9, 0.55), V(0, 0.7, 0.1), V(0, 0.5, -0.1)], 0x6d7079, 0.07));
  const pinsLocal = new Map([...hb.pinsLocal].map(([n, p]) => [n, p.clone().applyMatrix4(hb.group.matrix)]));
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, height + d + 1.2, 0) });
  return api;
}

// ================================================================= MAX7219 8×8 LED matrix
/**
 * MAX7219 8×8 red dot-matrix module (FC-16 style): PCB with the matrix on top,
 * input header VCC GND DIN CS CLK on the front (+z) edge. opts.post (cm): stand it
 * on a sign post (pins then on the post's foot). API: setRow(r, byte) (bit 7 =
 * left column, like LedControl), setPixel(r, c, on), show(rows[8]), clear(),
 * setIntensity(0–15), rows.
 */
export function makeLedMatrix(pos, opts = {}) {
  const PW = 3.3, PD = 4.6;
  const b = makeBreakout({
    w: PW, d: PD, color: 0x1d3a86, pins: ['VCC', 'GND', 'DIN', 'CS', 'CLK'], pinsEdge: 'front', inset: 0.22, labelSide: 'out',
    headers: [{ pins: ['VCC ', 'GND ', 'DOUT', 'CS ', 'CLK '], edge: 'back', inset: 0.22 }],
    pinText: { 'VCC ': 'VCC', 'GND ': 'GND', 'CS ': 'CS', 'CLK ': 'CLK' },
  });
  const g = b.group;
  const S = 3.2;
  g.add(at(box(S, 0.7, S, mat(0x1b1c20, { rough: 0.6 })), 0, b.top + 0.6, 0));
  const tex = canvasTexture(256, 256, (c) => { c.fillStyle = '#111'; c.fillRect(0, 0, 256, 256); });
  const cv = tex.image, cx = cv.getContext('2d');
  const face = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1, roughness: 0.35 });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(S - 0.06, S - 0.06), face);
  scr.rotation.x = -Math.PI / 2;
  scr.position.y = b.top + 0.952;
  g.add(scr);
  const glow = noRay(new THREE.Mesh(new THREE.PlaneGeometry(S * 1.5, S * 1.5), new THREE.MeshBasicMaterial({ map: glowSprite().material.map, color: 0xff3b2f, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })));
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = b.top + 0.97;
  g.add(glow);
  const rows = new Array(8).fill(0);
  let intensity = 8;
  const flush = () => {
    cx.fillStyle = '#121214';
    cx.fillRect(0, 0, 256, 256);
    let lit = 0;
    const k = 0.45 + (intensity / 15) * 0.55;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const on = (rows[r] >> (7 - c)) & 1;
      lit += on;
      cx.beginPath();
      cx.arc(16 + c * 32, 16 + r * 32, 12, 0, Math.PI * 2);
      cx.fillStyle = on ? `rgba(255,${Math.round(70 + 60 * k)},${Math.round(50 * k)},1)` : '#3a1c1a';
      cx.fill();
    }
    tex.needsUpdate = true;
    glow.material.opacity = Math.min(0.5, lit / 64 + 0.08) * (lit ? k : 0);
  };
  flush();
  let mod = freeApi(g, b.pinsLocal, opts.post ? V() : pos, opts.post ? {} : opts, { pick: g, anchor: V(0, 2.2, 0) });
  if (opts.post) mod = onPost(mod, ['VCC', 'GND', 'DIN', 'CS', 'CLK'], opts.post, pos, opts, PW, PD);
  live(mod, {
    kind: 'part',
    label: 'MAX7219 8×8 LED matrix',
    rows,
    setRow(r, v) { rows[r] = v & 255; flush(); return mod; },
    setPixel(r, c, on) { if (on) rows[r] |= 128 >> c; else rows[r] &= ~(128 >> c); flush(); return mod; },
    show(list) { for (let r = 0; r < 8; r++) rows[r] = (list[r] ?? 0) & 255; flush(); return mod; },
    clear() { rows.fill(0); flush(); return mod; },
    setIntensity(i) { intensity = clamp(i, 0, 15); flush(); return mod; },
  });
  return mod;
}

// ================================================================= TM1637 4-digit display
/** TM1637Display segment bits (bit0 = a … bit6 = g), as the library's encodeDigit(). */
export const SEG = { 0: 0x3f, 1: 0x06, 2: 0x5b, 3: 0x4f, 4: 0x66, 5: 0x6d, 6: 0x7d, 7: 0x07, 8: 0x7f, 9: 0x6f, A: 0x77, b: 0x7c, C: 0x39, c: 0x58, d: 0x5e, E: 0x79, F: 0x71, G: 0x3d, H: 0x76, h: 0x74, L: 0x38, n: 0x54, o: 0x5c, P: 0x73, r: 0x50, S: 0x6d, t: 0x78, U: 0x3e, u: 0x1c, y: 0x6e, '-': 0x40, _: 0x08, ' ': 0 };

/**
 * TM1637 4-digit 7-segment module (0.36", colon between digits 2 and 3). Pins
 * CLK DIO VCC GND on the right edge. opts.post (cm) mounts it on a sign post;
 * opts.color ('red' | 'green' | 'blue'). API: setSegments([4 bytes], colon),
 * showNumber(n, leadingZero), showText(str), clear(), setBrightness(0–7), digits.
 */
export function makeTM1637(pos, opts = {}) {
  const PW = 4.2, PD = 2.4;
  const b = makeBreakout({
    w: PW, d: PD, color: 0x1d3a86, pins: ['CLK', 'DIO', 'VCC', 'GND'], pinsEdge: 'right', inset: 0.22, labelSide: 'in',
    holes: [[-1.85, -0.95], [-1.85, 0.95]], holeR: 0.1,
  });
  const g = b.group;
  g.add(at(box(3.1, 0.65, 1.45, mat(0xf3f1e8, { rough: 0.6 })), -0.3, b.top + 0.325, 0));
  const tex = canvasTexture(512, 240, (c) => { c.fillStyle = '#16171a'; c.fillRect(0, 0, 512, 240); });
  const cx = tex.image.getContext('2d');
  const face = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1, roughness: 0.3 });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.38), face);
  scr.rotation.x = -Math.PI / 2;
  scr.position.set(-0.3, b.top + 0.652, 0);
  g.add(scr);
  const ON = { red: '#ff4632', green: '#59ff7a', blue: '#7fc4ff' }[opts.color ?? 'red'];
  const OFF = '#2a2224';
  const digits = [0, 0, 0, 0];
  let colon = false, bright = 7;
  const seg = (ox, oy, i, on) => {
    const W = 64, H = 150, T = 14, sl = 10;
    const P = {
      0: [[T, 0], [W - T, 0], [W - T * 1.5, T], [T * 1.5, T]],
      1: [[W, T * 0.6], [W, H / 2 - T * 0.4], [W - T, H / 2 - T], [W - T, T * 1.2]],
      2: [[W, H / 2 + T * 0.4], [W, H - T * 0.6], [W - T, H - T * 1.2], [W - T, H / 2 + T]],
      3: [[T, H], [W - T, H], [W - T * 1.5, H - T], [T * 1.5, H - T]],
      4: [[0, H / 2 + T * 0.4], [0, H - T * 0.6], [T, H - T * 1.2], [T, H / 2 + T]],
      5: [[0, T * 0.6], [0, H / 2 - T * 0.4], [T, H / 2 - T], [T, T * 1.2]],
      6: [[T, H / 2], [T * 1.6, H / 2 - T / 2], [W - T * 1.6, H / 2 - T / 2], [W - T, H / 2], [W - T * 1.6, H / 2 + T / 2], [T * 1.6, H / 2 + T / 2]],
    }[i];
    cx.beginPath();
    P.forEach(([x, y], k) => { const X = ox + x + (1 - y / H) * sl; (k ? cx.lineTo(X, oy + y) : cx.moveTo(X, oy + y)); });
    cx.closePath();
    cx.fillStyle = on ? ON : OFF;
    cx.fill();
  };
  const flush = () => {
    cx.fillStyle = '#16171a';
    cx.fillRect(0, 0, 512, 240);
    cx.globalAlpha = 1;
    const xs = [40, 150, 286, 396];
    digits.forEach((m, d) => { for (let i = 0; i < 7; i++) seg(xs[d], 45, i, (m >> i) & 1); cx.beginPath(); cx.arc(xs[d] + 86, 192, 7, 0, Math.PI * 2); cx.fillStyle = (m & 0x80) ? ON : OFF; cx.fill(); });
    for (const y of [92, 150]) { cx.beginPath(); cx.arc(262, y, 8, 0, Math.PI * 2); cx.fillStyle = colon ? ON : OFF; cx.fill(); }
    tex.needsUpdate = true;
    face.emissiveIntensity = 0.5 + bright / 14;
  };
  flush();
  let mod = freeApi(g, b.pinsLocal, opts.post ? V() : pos, opts.post ? {} : opts, { pick: g, anchor: V(0, 1.6, 0) });
  if (opts.post) mod = onPost(mod, ['CLK', 'DIO', 'VCC', 'GND'], opts.post, pos, opts, PW, PD);
  live(mod, {
    kind: 'part',
    label: 'TM1637 4-digit display',
    digits,
    setSegments(list, c = false) { for (let i = 0; i < 4; i++) digits[i] = list[i] ?? 0; colon = !!c; flush(); return mod; },
    showNumber(n, lead = false, c = false) {
      n = Math.round(n);
      const neg = n < 0;
      const s = String(Math.abs(n)).slice(-4).padStart(4, lead ? '0' : ' ');
      const out = [...s].map((ch) => SEG[ch] ?? 0);
      if (neg && s[0] === ' ') out[s.lastIndexOf(' ')] = SEG['-'];
      return mod.setSegments(out, c);
    },
    showText(str, c = false) { return mod.setSegments([...String(str).padEnd(4).slice(0, 4)].map((ch) => SEG[ch] ?? SEG[ch.toUpperCase()] ?? 0), c); },
    clear() { return mod.setSegments([0, 0, 0, 0]); },
    setBrightness(v) { bright = clamp(v, 0, 7); flush(); return mod; },
  });
  return mod;
}

// ================================================================= stack light
/**
 * Industrial stack light (green / amber / red) on a short mast, with a header
 * G Y R GND at its foot (each lamp is an LED with its own 220 Ω on the base board).
 * API: set(name 'green'|'amber'|'red', on).
 */
export function makeStackLight(pos, opts = {}) {
  const g = new THREE.Group();
  const grey = mat(0x8f939b, { metal: 0.4, rough: 0.45 });
  g.add(at(box(2.2, 0.4, 2.2, mat(0x3a3d46)), 0, 0.2, 0));
  g.add(at(cyl(0.3, 0.3, 4.0, grey, { seg: 14 }), 0, 2.4, 0));
  const lamps = {};
  [['green', 0x3fbf5f, 4.6], ['amber', 0xf5a623, 5.75], ['red', 0xe5412e, 6.9]].forEach(([n, c, y]) => {
    const lens = emissiveMat(c, { opacity: 0.9, rough: 0.3 });
    lens.color.lerp(new THREE.Color(0xffffff), 0.25);
    g.add(at(cyl(0.95, 0.95, 1.05, lens, { seg: 24 }), 0, y, 0));
    g.add(at(cyl(1.0, 1.0, 0.1, grey, { seg: 24, outline: false }), 0, y - 0.57, 0));
    const glow = glowSprite(c, 3.4);
    glow.position.set(0, y, 0);
    g.add(glow);
    lamps[n] = { lens, glow };
  });
  g.add(at(cyl(0.9, 1.0, 0.35, grey, { seg: 24 }), 0, 7.6, 0));
  const hb = makeBreakout({ w: 1.5, d: 0.9, color: 0x25262b, pins: ['G', 'Y', 'R', 'GND'], pinsEdge: 'front', inset: 0.25, labelSide: 'out' });
  hb.group.position.set(0, 0.4, 0.4);
  g.add(hb.group);
  hb.group.updateMatrix();
  const pinsLocal = new Map([...hb.pinsLocal].map(([n, p]) => [n, p.clone().applyMatrix4(hb.group.matrix)]));
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, 8.4, 0) });
  live(api, {
    kind: 'part',
    label: 'Stack light (3 × LED)',
    set(n, on) {
      const l = lamps[n];
      if (!l) return api;
      l.lens.emissiveIntensity = on ? 1.4 : 0;
      l.glow.material.opacity = on ? 0.85 : 0;
      return api;
    },
  });
  return api;
}

// ================================================================= H0 (1:87) toy car
const CAR_COLORS = [0xe5412e, 0x3a6fd0, 0xf2c230, 0x3aa65a, 0xf3f1e8, 0x8a5cc6, 0x2a2c33, 0xf08a2c, 0x5fb7c9];
const carGeo = {
  body: new THREE.BoxGeometry(2.1, 0.72, 5.2),
  cabin: new THREE.BoxGeometry(1.86, 0.62, 2.7),
  glassF: new THREE.BoxGeometry(1.7, 0.46, 0.06),
  glassS: new THREE.BoxGeometry(0.06, 0.42, 2.3),
  wheel: new THREE.CylinderGeometry(0.4, 0.4, 0.32, 14),
  lamp: new THREE.BoxGeometry(0.5, 0.18, 0.05),
};
/**
 * H0-scale car (≈ 5.2 cm long), forward = local +Z. API: setBrake(on),
 * setColor(hex), length, width. Cheap enough to have a dozen on screen.
 */
export function makeToyCar(pos, opts = {}) {
  const g = new THREE.Group();
  const paint = mat(opts.color ?? CAR_COLORS[(Math.random() * CAR_COLORS.length) | 0], { rough: 0.45 });
  const glass = mat(0x9fc4d6, { rough: 0.2 });
  const body = mesh(carGeo.body, paint);
  body.position.y = 0.66;
  g.add(body);
  const cabin = mesh(carGeo.cabin, paint);
  cabin.position.set(0, 1.32, -0.25);
  g.add(cabin);
  for (const z of [1.11, -1.61]) g.add(at(mesh(carGeo.glassF, glass, { outline: false }), 0, 1.34, z));
  for (const x of [-0.94, 0.94]) g.add(at(mesh(carGeo.glassS, glass, { outline: false }), x, 1.34, -0.25));
  const tyre = mat(0x24262c);
  for (const [x, z] of [[-1, 1.6], [1, 1.6], [-1, -1.6], [1, -1.6]]) {
    const w = mesh(carGeo.wheel, tyre, { outline: false });
    w.rotation.z = Math.PI / 2;
    g.add(at(w, x * 0.98, 0.4, z));
  }
  const head = mat(0xfff3c4, { emissive: 0xfff0b0, emissiveIntensity: 0.4 });
  const brake = mat(0x8a1d14, { emissive: 0xff2a1a, emissiveIntensity: 0, unique: true });
  for (const s of [-1, 1]) {
    g.add(at(mesh(carGeo.lamp, head, { outline: false }), s * 0.65, 0.75, 2.61));
    g.add(at(mesh(carGeo.lamp, brake, { outline: false }), s * 0.65, 0.78, -2.61));
  }
  g.position.copy(pos ?? V());
  g.rotation.y = opts.rotY ?? 0;
  return {
    group: g, pick: g, kind: 'prop', label: 'Model car (H0)',
    length: 5.2, width: 2.1,
    anchor: g.position.clone().add(V(0, 2.4, 0)),
    setBrake(on) { brake.emissiveIntensity = on ? 1.6 : 0; },
    setColor(hex) { paint.color?.setHex?.(hex); },
  };
}

/** Lightweight lane traffic: cars follow lanes, keep their distance and stop at red lines. */
function laneTraffic(parent) {
  const CL = 5.2, GAP = 1.3, ACC = 9, BRAKE = 11;
  const pool = [];
  const cars = [];
  const get = () => {
    const c = pool.pop() ?? makeToyCar(V());
    c.group.visible = true;
    parent.add(c.group);
    c.group.children[0].material = mat(CAR_COLORS[(Math.random() * CAR_COLORS.length) | 0], { rough: 0.45 });
    c.group.children[1].material = c.group.children[0].material;
    return c;
  };
  const place = (car) => {
    const L = car.lane;
    const p = L.from.clone().lerp(L.to, car.s / L.len);
    car.obj.group.position.copy(p);
    car.obj.group.rotation.y = L.yaw;
  };
  return {
    cars, CL,
    /** lane: { id, from, to (local Vector3), stop: s of the stop line | null, light: () => 'green'|'amber'|'red', v0 } */
    lane(L) { L.len = L.from.distanceTo(L.to); L.yaw = Math.atan2(L.to.x - L.from.x, L.to.z - L.from.z); L.passed = 0; return L; },
    spawn(L, v0 = L.v0 ?? 12) {
      const last = cars.filter((c) => c.lane === L).reduce((m, c) => Math.min(m, c.s), Infinity);
      if (last < CL + GAP + 1) return null;
      const car = { lane: L, s: 0, v: v0 * 0.8, v0, obj: get(), passed: false, wait: 0 };
      cars.push(car);
      place(car);
      return car;
    },
    clear() { for (const c of cars.splice(0)) { c.obj.group.visible = false; pool.push(c.obj); } },
    occupied(L, s0, s1) { return cars.some((c) => c.lane === L && c.s + CL / 2 > s0 && c.s - CL / 2 < s1); },
    waiting(L) { return cars.filter((c) => c.lane === L && !c.passed && c.v < 0.6).length; },
    tick(dt) {
      dt = Math.min(dt, 0.05);
      const byLane = new Map();
      for (const c of cars) (byLane.get(c.lane) ?? byLane.set(c.lane, []).get(c.lane)).push(c);
      for (const [L, list] of byLane) {
        list.sort((a, b) => b.s - a.s);
        list.forEach((c, i) => {
          let room = Infinity;
          const lead = list[i - 1];
          if (lead) room = lead.s - c.s - CL - GAP;
          if (L.stop != null && !c.passed) {
            const light = L.light?.() ?? 'green';
            const toLine = L.stop - (c.s + CL / 2);
            const canStop = toLine > (c.v * c.v) / (2 * BRAKE * 1.6) - 0.2;
            if (light === 'red' || (light === 'amber' && canStop) || (light === 'hold')) room = Math.min(room, toLine - 0.15);
          }
          const vMax = Math.sqrt(Math.max(0, 2 * BRAKE * room));
          const target = Math.min(c.v0, vMax);
          c.v += clamp(target - c.v, -BRAKE * 3 * dt, ACC * dt);
          if (room <= 0.02) c.v = 0;
          c.v = Math.max(0, c.v);
          c.s += c.v * dt;
          if (lead) c.s = Math.min(c.s, lead.s - CL - 0.4);
          if (c.v < 0.6 && !c.passed) c.wait += dt;
          if (!c.passed && L.stop != null && c.s + CL / 2 > L.stop + 0.1) { c.passed = true; L.passed++; L.onPass?.(c); }
          c.obj.setBrake(target < c.v - 0.3 || c.v < 0.3);
          place(c);
        });
      }
      for (let i = cars.length - 1; i >= 0; i--) {
        const c = cars[i];
        if (c.s > c.lane.len) { cars.splice(i, 1); c.obj.group.visible = false; pool.push(c.obj); c.lane.onExit?.(c); }
      }
    },
  };
}

// ================================================================= street furniture
/** H0 traffic light pole: lamps face local +Z. set(name, on) with name red|amber|green; foot = header end. */
function trafficPole(height = 5.6) {
  const g = new THREE.Group();
  const grey = mat(0x5d6168, { metal: 0.4, rough: 0.45 });
  g.add(at(cyl(0.22, 0.26, height, grey, { seg: 12 }), 0, height / 2, 0));
  g.add(at(box(0.9, 0.2, 0.9, mat(0x3a3d46)), 0, 0.1, 0));
  const head = new THREE.Group();
  head.add(at(box(1.1, 2.7, 0.7, mat(0x24262c, { rough: 0.6 })), 0, 0, 0));
  const lamps = {};
  [['red', 0xe5412e, 0.85], ['amber', 0xf5a623, 0], ['green', 0x3fbf5f, -0.85]].forEach(([n, c, y]) => {
    const lens = emissiveMat(c, { rough: 0.35 });
    lens.color.multiplyScalar(0.45);
    const l = cyl(0.32, 0.32, 0.08, lens, { seg: 18, outline: false });
    l.rotation.x = Math.PI / 2;
    head.add(at(l, 0, y, 0.37));
    const visor = cyl(0.38, 0.38, 0.35, mat(0x1b1d22), { thetaStart: -Math.PI / 2, thetaLength: Math.PI, outline: false, seg: 12 });
    visor.rotation.x = Math.PI / 2;
    head.add(at(visor, 0, y, 0.55));
    const glow = glowSprite(c, 2.2);
    glow.position.set(0, y, 0.7);
    head.add(glow);
    lamps[n] = { lens, glow };
  });
  head.position.set(0, height + 1.0, 0.1);
  g.add(head);
  return {
    group: g,
    set(n, on) { const l = lamps[n]; l.lens.emissiveIntensity = on ? 1.8 : 0; l.glow.material.opacity = on ? 0.9 : 0; },
    show(n) { for (const k in lamps) this.set(k, k === n); },
    top: V(0, height + 2.6, 0),
  };
}

/** Road / pavement mat painter helper: returns a flat textured slab of size w × d (cm). */
function roadMat(w, d, draw, res = 12) {
  const tex = canvasTexture(Math.round(w * res), Math.round(d * res), (c, cw, ch) => draw(c, res, cw, ch));
  const m = mesh(new THREE.BoxGeometry(w, 0.08, d), [mat(0x7d8088), mat(0x7d8088), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), mat(0x7d8088), mat(0x7d8088), mat(0x7d8088)], { outline: false });
  m.position.y = 0.04;
  m.receiveShadow = true;
  return m;
}
const ASPHALT = '#4a4d55', PAVE = '#c9c4b6', GRASS = '#9cc58a', MARK = '#f4f2ea';
export const ROAD_Y = 0.08;

/**
 * H0 4-way intersection on a printed mat: two 2-lane roads (right-hand traffic),
 * stop lines, zebra crossings, a traffic-light pole for each approach and an
 * FC-51 car-presence sensor on the kerb 3 cm before each stop line.
 * Approaches are named by where cars come FROM: N (driving +z), S (−z), E (−x), W (+x).
 * opts: arm (32 cm), rate {N,E,S,W} cars/min. API: show(app, 'red'|'amber'|'green'),
 * light(app), presence(app), waiting(app), passed(app), setRate(app, perMin),
 * poles, sensors, feet {pole: {app: world}, sensor: {app: world}}, tick, reset().
 */
export function makeIntersection(pos, opts = {}) {
  const RW = 7.4, E = opts.arm ?? 32, SL = RW / 2 + 3.2;
  const g = new THREE.Group();
  const size = E * 2;
  g.add(roadMat(size, size, (c, s, cw, ch) => {
    const X = (x) => (x + E) * s, Z = (z) => (z + E) * s;
    c.fillStyle = GRASS; c.fillRect(0, 0, cw, ch);
    c.fillStyle = PAVE;
    c.fillRect(X(-E), Z(-RW / 2 - 2.2), size * s, (RW + 4.4) * s);
    c.fillRect(X(-RW / 2 - 2.2), Z(-E), (RW + 4.4) * s, size * s);
    c.fillStyle = ASPHALT;
    c.fillRect(X(-E), Z(-RW / 2), size * s, RW * s);
    c.fillRect(X(-RW / 2), Z(-E), RW * s, size * s);
    c.fillStyle = MARK;
    // centre dashes
    for (let t = -E; t < E; t += 3) {
      if (Math.abs(t) < SL || Math.abs(t + 1.6) < SL) continue;
      c.fillRect(X(t), Z(-0.08), 1.6 * s, 0.16 * s);
      c.fillRect(X(-0.08), Z(t), 0.16 * s, 1.6 * s);
    }
    // stop lines (right half of each approach) and solid centre line up to them
    c.fillRect(X(-RW / 2), Z(-SL - 0.3), (RW / 2) * s, 0.3 * s); // N (lane x<0)
    c.fillRect(X(0), Z(SL), (RW / 2) * s, 0.3 * s); // S
    c.fillRect(X(SL), Z(-RW / 2), 0.3 * s, (RW / 2) * s); // E (lane z<0)
    c.fillRect(X(-SL - 0.3), Z(0), 0.3 * s, (RW / 2) * s); // W
    for (const sg of [-1, 1]) {
      c.fillRect(X(-0.08), Z(sg > 0 ? RW / 2 + 3 : -SL), 0.16 * s, (SL - RW / 2 - 0.3) * s);
      c.fillRect(X(sg > 0 ? RW / 2 + 3 : -SL), Z(-0.08), (SL - RW / 2 - 0.3) * s, 0.16 * s);
    }
    // zebra crossings
    for (let k = -RW / 2 + 0.3; k < RW / 2 - 0.3; k += 0.9) {
      for (const sg of [-1, 1]) {
        c.fillRect(X(k), Z(sg * (RW / 2 + 0.6) - (sg < 0 ? 2.0 : 0)), 0.5 * s, 2.0 * s);
        c.fillRect(X(sg * (RW / 2 + 0.6) - (sg < 0 ? 2.0 : 0)), Z(k), 2.0 * s, 0.5 * s);
      }
    }
  }));
  // kerbs along each arm (stop short of the junction)
  const kerb = mat(0xd9d4c6, { rough: 0.8 });
  const kl = E - RW / 2 - 2.2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(at(box(kl, 0.25, 0.3, kerb, { outline: false }), sx * (RW / 2 + 2.2 + kl / 2), 0.12, sz * (RW / 2 + 0.15)));
    g.add(at(box(0.3, 0.25, kl, kerb, { outline: false }), sx * (RW / 2 + 0.15), 0.12, sz * (RW / 2 + 2.2 + kl / 2)));
  }
  g.position.copy(pos ?? V());
  g.updateMatrixWorld(true);
  const traffic = laneTraffic(g);
  const APPS = { N: V(0, 0, 1), S: V(0, 0, -1), E: V(-1, 0, 0), W: V(1, 0, 0) };
  const lights = { N: 'red', S: 'red', E: 'red', W: 'red' };
  const lanes = {}, poles = {}, sensors = {}, feet = { pole: {}, sensor: {} }, rate = { N: 6, S: 6, E: 6, W: 6, ...opts.rate };
  const acc = { N: 0.95, S: 0.6, E: 0.85, W: 0.4 };
  for (const [k, h] of Object.entries(APPS)) {
    const rgt = V(-h.z, 0, h.x);
    const off = rgt.clone().multiplyScalar(RW / 4);
    const L = traffic.lane({ id: k, from: h.clone().multiplyScalar(-E).add(off).setY(ROAD_Y), to: h.clone().multiplyScalar(E).add(off).setY(ROAD_Y), stop: E - SL, light: () => lights[k] });
    lanes[k] = L;
    const yaw = Math.atan2(-h.x, -h.z); // lamps (local +z) face the oncoming car
    const pole = trafficPole();
    pole.group.position.copy(h.clone().multiplyScalar(-(SL + 0.6)).addScaledVector(rgt, RW / 2 + 1.1)).setY(ROAD_Y);
    pole.group.rotation.y = yaw;
    g.add(pole.group);
    pole.show('red');
    poles[k] = pole;
    const sp = h.clone().multiplyScalar(-(SL + 3)).addScaledVector(rgt, RW / 2 + 2.4);
    const sens = makeIRObstacle(g.localToWorld(sp.clone().setY(ROAD_Y)), { rotY: Math.atan2(-rgt.x, -rgt.z), label: 'IR car sensor' });
    g.attach(sens.group);
    sensors[k] = sens;
    feet.pole[k] = g.localToWorld(pole.group.position.clone().addScaledVector(rgt, 0.6).setY(0.35));
    feet.sensor[k] = g.localToWorld(sp.clone().addScaledVector(rgt, 1.9).setY(0.35));
  }
  const presence = (k) => traffic.occupied(lanes[k], lanes[k].stop - 3.1, lanes[k].stop - 2.9);
  const api = {
    group: g, pick: g, kind: 'prop', label: 'H0 intersection model',
    anchor: g.localToWorld(V(0, 6, 0)),
    lanes, poles, sensors, feet, rate, traffic,
    show(k, color) { lights[k] = color; poles[k].show(color); },
    light: (k) => lights[k],
    presence,
    waiting: (k) => traffic.waiting(lanes[k]),
    passed: (k) => lanes[k].passed,
    setRate(k, r) { rate[k] = r; },
    poleTop: (k) => g.localToWorld(poles[k].group.position.clone().add(V(0, 7.4, 0))),
    tick(dt) {
      for (const k in lanes) {
        acc[k] += (rate[k] / 60) * dt;
        if (acc[k] >= 1 && traffic.spawn(lanes[k])) acc[k] -= 1 + Math.random() * 0.6 - 0.3;
        acc[k] = Math.min(acc[k], 1.5);
        sensors[k].setDetect(presence(k));
      }
      traffic.tick(dt);
    },
    reset() { traffic.clear(); for (const k in lanes) { lanes[k].passed = 0; acc[k] = 0.5 + Math.random() * 0.5; } },
  };
  return api;
}

// ================================================================= wiring loom → header
/**
 * Cosmetic cables taped along the model from device feet to a labelled header
 * block near the controller (each device's own wires run inside the loom).
 * runs: [[worldFoot, color], ...]; names: header pins (left→right).
 * Returns a free module with pin(name).
 */
export function makeHarness(headerPos, names, runs, opts = {}) {
  const g = new THREE.Group();
  const hb = makeBreakout({
    w: 0.5 + names.length * PITCH, d: 1.7, color: PCB.green, pins: names, pinsEdge: 'front', inset: 0.25, labelSide: 'out',
    pinText: opts.pinText ?? {}, label: opts.title ?? '', labelPos: [0, -0.45], labelSize: 0.16,
  });
  hb.group.position.copy(headerPos);
  hb.group.rotation.y = opts.rotY ?? 0;
  g.add(hb.group);
  hb.group.updateMatrixWorld(true);
  const entry = hb.group.localToWorld(V(0, 0.1, -0.85));
  runs.forEach(([p, color, via], i) => {
    const off = (i - (runs.length - 1) / 2) * 0.09;
    const e = entry.clone().add(V(off, 0, 0));
    const pts = [p.clone().setY(0.12), ...(via ?? [V(p.x, 0.12, e.z - 0.6 - i * 0.08)]), e.clone().add(V(0, 0, -0.4)), e];
    g.add(cable(pts, color ?? 0x6d7079, 0.05, { seg: 64 }));
  });
  const pinsLocal = new Map([...hb.pinsLocal].map(([n, q]) => [n, hb.group.localToWorld(q.clone())]));
  const api = freeApi(g, pinsLocal, V(), {}, { pick: hb.group, anchor: headerPos.clone().add(V(0, 1.6, 0)) });
  api.kind = 'part';
  api.label = opts.label ?? 'Model wiring loom + header';
  return api;
}

// ================================================================= barrier
/**
 * Servo barrier (boom gate): housing with an SG90 inside, a red/white boom on a
 * horizontal pivot. Closed = horizontal along local +X (or −X with opts.mirror),
 * open = 90° up. opts.length (boom, cm), opts.lamps (level-crossing pair facing
 * local +Z with a St Andrew's cross), rotY. Header at the foot: SIG 5V GND (+ LA
 * LB, each lamp an LED with its own 220 Ω). API: setAngle(deg 0 down … 90 up)
 * (servo slews), angle, setLamps(a, b), isUp (≥ 80°), isDown (≤ 3°).
 */
export function makeBarrier(pos, opts = {}) {
  const g = new THREE.Group();
  const L = opts.length ?? 6, PH = 2.4, side = opts.mirror ? -1 : 1;
  const white = mat(0xf3f1e8, { rough: 0.5 });
  const red = mat(0xd8352a, { rough: 0.5 });
  g.add(at(box(1.6, 0.25, 1.6, mat(0x3a3d46)), 0, 0.12, 0));
  g.add(at(box(1.2, PH + 0.5, 1.2, white), 0, 0.25 + (PH + 0.5) / 2, 0));
  g.add(at(box(1.25, 0.35, 1.25, red, { outline: false }), 0, PH + 0.4, 0));
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.2, PH, 0.75);
  g.add(pivot);
  const hub = cyl(0.42, 0.42, 0.3, mat(0x24262c), { seg: 16 });
  hub.rotation.x = Math.PI / 2;
  pivot.add(hub);
  const tex = canvasTexture(256, 16, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#d8352a' : '#f3f1e8'; c.fillRect(i * 32, 0, 32, 16); } });
  const boomMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
  const boom = mesh(new THREE.BoxGeometry(L, 0.32, 0.22), [white, white, boomMat, boomMat, boomMat, boomMat]);
  boom.position.set(side * (L / 2 + 0.1), 0, 0.05);
  pivot.add(boom);
  pivot.add(at(box(1.0, 0.5, 0.26, mat(0x24262c)), -side * 0.7, 0, 0.05));
  // support fork at the boom tip
  const fork = new THREE.Group();
  fork.add(at(box(0.25, PH - 0.15, 0.25, white), 0, (PH - 0.15) / 2, 0));
  fork.add(at(box(0.6, 0.12, 0.4, mat(0x24262c)), 0, PH - 0.15, 0));
  fork.position.set(side * (L + 0.1), 0, 0.8);
  if (opts.fork !== false) g.add(fork);
  const lamps = [];
  if (opts.lamps) {
    const mast = new THREE.Group();
    mast.add(at(cyl(0.16, 0.16, 3.6, mat(0x5d6168, { metal: 0.4 }), { seg: 10 }), 0, PH + 2.3, 0));
    const bar = box(2.6, 0.5, 0.3, mat(0x1b1d22));
    mast.add(at(bar, 0, PH + 2.0, 0.1));
    for (const s of [-1, 1]) {
      const lens = emissiveMat(0xe5412e, { rough: 0.35 });
      lens.color.multiplyScalar(0.45);
      const l = cyl(0.42, 0.42, 0.1, lens, { seg: 18, outline: false });
      l.rotation.x = Math.PI / 2;
      mast.add(at(l, s * 0.95, PH + 2.0, 0.3));
      const visor = cyl(0.48, 0.48, 0.35, mat(0x1b1d22), { thetaStart: -Math.PI / 2, thetaLength: Math.PI, outline: false, seg: 12 });
      visor.rotation.x = Math.PI / 2;
      mast.add(at(visor, s * 0.95, PH + 2.0, 0.5));
      const glow = glowSprite(0xff3b2f, 2.8);
      glow.position.set(s * 0.95, PH + 2.0, 0.75);
      mast.add(glow);
      lamps.push({ lens, glow });
    }
    for (const r of [0.6, -0.6]) {
      const arm = box(2.6, 0.38, 0.06, white);
      arm.rotation.z = r;
      mast.add(at(arm, 0, PH + 3.5, 0.15));
      const edge = box(2.66, 0.12, 0.05, red, { outline: false });
      edge.rotation.z = r;
      mast.add(at(edge, 0, PH + 3.5, 0.19));
    }
    mast.add(at(mesh(new THREE.SphereGeometry(0.35, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xd8b45a, { metal: 0.5, rough: 0.35 })), 0, PH + 4.15, 0));
    g.add(mast);
  }
  const names = opts.lamps ? ['SIG', '5V', 'GND', 'LA', 'LB'] : ['SIG', '5V', 'GND'];
  const hb = makeBreakout({ w: 0.4 + names.length * PITCH, d: 0.9, color: 0x25262b, pins: names, pinsEdge: 'front', inset: 0.22, labelSide: 'out' });
  hb.group.position.set(-side * 1.5, 0, -0.2);
  g.add(hb.group);
  hb.group.updateMatrix();
  const pinsLocal = new Map([...hb.pinsLocal].map(([n, p]) => [n, p.clone().applyMatrix4(hb.group.matrix)]));
  let ang = 0, tgt = 0;
  const pose = () => { pivot.rotation.z = side * ang * D2R; };
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(side * L * 0.5, PH + 2.4, 0.8) });
  live(api, {
    kind: 'part',
    label: opts.lamps ? 'Level-crossing barrier (SG90 + 2 red lamps)' : 'Barrier gate (SG90 servo)',
    get angle() { return ang; },
    get isUp() { return ang >= 80; },
    get isDown() { return ang <= 3; },
    setAngle(d) { tgt = clamp(d, 0, 95); return api; },
    jump(d) { ang = tgt = clamp(d, 0, 95); pose(); return api; },
    setLamps(a, b) {
      [a, b].forEach((on, i) => { const l = lamps[i]; if (!l) return; l.lens.emissiveIntensity = on ? 2 : 0; l.glow.material.opacity = on ? 0.95 : 0; });
      return api;
    },
    lampTop: g.localToWorld(V(0, PH + 4.6, 0)),
    tick(dt) { ang += clamp(tgt - ang, -400 * dt, 400 * dt); pose(); },
  });
  pose();
  return api;
}

// ================================================================= railway + train
/**
 * H0 railway line along local X with a level crossing at x = 0 (road along Z),
 * tunnel portals at both ends hiding the train when it is away.
 * opts.length (track between portals, 110). Train: loco + 2 wagons.
 * API: send(dir ±1, speed cm/s), train {x (front), dir, speed, running},
 * occupies(x0, x1) (local X range), tick, reset().
 */
export function makeRailway(pos, opts = {}) {
  const LEN = opts.length ?? 110, G = 0.83;
  const g = new THREE.Group();
  const total = LEN + 60;
  g.add(at(box(total, 0.3, 4.4, mat(0x9a948a, { rough: 0.95 }), { outline: false }), 0, 0.15, 0));
  const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.45, 0.2, 2.8), mat(0x6b4a2e, { rough: 0.85 }), Math.floor(total / 1.0));
  const t = new THREE.Object3D();
  for (let i = 0; i < sleepers.count; i++) {
    t.position.set(-total / 2 + 0.5 + i, 0.38, 0);
    t.updateMatrix();
    sleepers.setMatrixAt(i, t.matrix);
  }
  g.add(sleepers);
  for (const s of [-1, 1]) g.add(at(box(total, 0.28, 0.16, mat(0xb9bcc2, { metal: 0.6, rough: 0.3 })), 0, 0.62, s * G));
  // crossing deck between the rails
  g.add(at(box(8.4, 0.3, 4.4, mat(0x55585f, { rough: 0.9 }), { outline: false }), 0, 0.46, 0));
  // tunnel portals / hills
  for (const s of [-1, 1]) {
    const hill = new THREE.Group();
    hill.add(at(box(30, 9, 14, mat(0x8fbf7a, { rough: 0.95 })), s * 15, 4.5, 0));
    hill.add(at(box(0.6, 7.2, 7.4, mat(0xb4a58c, { rough: 0.9 })), 0, 3.6, 0));
    hill.add(at(box(0.62, 5.2, 4.6, mat(0x15161a)), 0, 2.6, 0));
    hill.position.x = s * (LEN / 2);
    g.add(hill);
  }
  // train
  const train = new THREE.Group();
  const cars = [];
  const mk = (len, color, loco) => {
    const c = new THREE.Group();
    const body = mat(color, { rough: 0.5 });
    c.add(at(box(len, 2.6, 2.9, body), 0, 2.45, 0));
    c.add(at(box(len + 0.1, 0.5, 3.0, mat(0x2a2c33)), 0, 1.0, 0));
    if (loco) {
      c.add(at(box(len * 0.4, 1.2, 2.9, body), len * 0.12, 4.3, 0));
      c.add(at(box(0.08, 0.7, 2.2, mat(0x9fc4d6, { rough: 0.2 }), { outline: false }), len * 0.32 + 0.02, 4.35, 0));
      c.add(at(box(len * 0.5, 0.25, 3.0, mat(0xf2c230)), 0, 1.4, 0));
    } else {
      for (let i = 0; i < 3; i++) for (const s of [-1, 1]) c.add(at(box(len * 0.18, 0.8, 0.06, mat(0x9fc4d6, { rough: 0.2 }), { outline: false }), -len * 0.3 + i * len * 0.3, 3.0, s * 1.46));
      c.add(at(box(len, 0.25, 3.0, mat(0x3a3d46)), 0, 3.85, 0));
    }
    for (const dx of [-len * 0.32, len * 0.32]) for (const s of [-1, 1]) {
      const w = cyl(0.55, 0.55, 0.2, mat(0x24262c), { seg: 14, outline: false });
      w.rotation.x = Math.PI / 2;
      c.add(at(w, dx, 0.95, s * G));
    }
    c.userData.len = len;
    train.add(c);
    cars.push(c);
    return c;
  };
  mk(12, 0xd8352a, true);
  mk(11, 0x2f5fbf, false);
  mk(11, 0x2f5fbf, false);
  g.add(train);
  const TL = cars.reduce((a, c) => a + c.userData.len + 0.8, -0.8);
  g.position.copy(pos ?? V());
  g.rotation.y = opts.rotY ?? 0;
  g.updateMatrixWorld(true);
  const st = { x: -(LEN / 2 + TL + 2), dir: 1, speed: 0, running: false };
  const layout = () => {
    let x = st.x;
    cars.forEach((c) => {
      const l = c.userData.len;
      c.position.set(x - st.dir * l / 2, 0.45, 0);
      c.rotation.y = st.dir > 0 ? 0 : Math.PI;
      x -= st.dir * (l + 0.8);
    });
    train.visible = Math.abs(st.x) < LEN / 2 + TL + 1 || st.running;
  };
  layout();
  const api = {
    group: g, pick: g, kind: 'prop', label: 'H0 railway with level crossing',
    anchor: g.localToWorld(V(0, 6, 0)),
    length: LEN, trainLength: TL,
    train: st,
    /** Start a train from the portal on the −dir side, driving in direction dir. */
    send(dir = 1, speed = 16) {
      st.dir = dir > 0 ? 1 : -1;
      st.x = -st.dir * (LEN / 2 + 1);
      st.speed = speed;
      st.running = true;
      layout();
    },
    /** Is any part of the train within local x range [x0, x1]? */
    occupies(x0, x1) {
      if (!st.running) return false;
      const head = st.x, tail = st.x - st.dir * TL;
      const lo = Math.min(head, tail), hi = Math.max(head, tail);
      return hi > x0 && lo < x1;
    },
    tick(dt) {
      if (!st.running) return;
      st.x += st.dir * st.speed * Math.min(dt, 0.05);
      if (st.dir * st.x - TL > LEN / 2 + 2) st.running = false;
      layout();
    },
    reset() { st.running = false; st.x = -(LEN / 2 + TL + 2); layout(); },
    at: (x, y = 0, z = 0) => g.localToWorld(V(x, y, z)),
  };
  return api;
}

// ================================================================= street + lamps + sensors on posts
/**
 * H0 street lamp: tapered pole with an arm and an LED head facing down; a pool of
 * light on the road below (visible as the scene gets dark). Header at the foot:
 * LED GND (white LED + 100 Ω on the head board). API: set(level 0–1). opts.reach
 * (arm length, towards local +Z), height.
 */
export function makeStreetLamp(pos, opts = {}) {
  const g = new THREE.Group();
  const H = opts.height ?? 10, R = opts.reach ?? 2.6;
  const grey = mat(0x6a6e76, { metal: 0.45, rough: 0.4 });
  g.add(at(box(1.2, 0.3, 1.2, mat(0x3a3d46)), 0, 0.15, 0));
  g.add(at(cyl(0.16, 0.26, H, grey, { seg: 12 }), 0, H / 2, 0));
  const arm = cable([V(0, H - 0.4, 0), V(0, H + 0.4, 0.4), V(0, H + 0.5, R - 0.6), V(0, H + 0.4, R)], 0x6a6e76, 0.12);
  g.add(arm);
  const head = new THREE.Group();
  head.add(at(box(1.0, 0.3, 1.9, mat(0x3a3d46, { rough: 0.5 })), 0, 0, 0));
  const lens = emissiveMat(0xfff4d6, { rough: 0.3 });
  head.add(at(box(0.8, 0.06, 1.6, lens, { outline: false }), 0, -0.17, 0));
  head.position.set(0, H + 0.35, R + 0.3);
  g.add(head);
  const glow = glowSprite(0xfff1c8, 3.2);
  glow.position.set(0, H - 0.1, R + 0.3);
  g.add(glow);
  const pool = glowPool(0xffe9b8, opts.pool ?? 12);
  pool.position.set(0, ROAD_Y + 0.03, R + 0.3);
  g.add(pool);
  const light = new THREE.PointLight(0xffe6b0, 0, 16, 1.4);
  light.position.set(0, H - 0.6, R + 0.3);
  g.add(light);
  const hb = makeBreakout({ w: 0.9, d: 0.8, color: 0x25262b, pins: ['LED', 'GND'], pinsEdge: 'front', inset: 0.2, labelSide: 'out' });
  hb.group.position.set(0, 0.3, -1.0);
  g.add(hb.group);
  hb.group.updateMatrix();
  const pinsLocal = new Map([...hb.pinsLocal].map(([n, p]) => [n, p.clone().applyMatrix4(hb.group.matrix)]));
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, H + 1.6, R * 0.5) });
  let level = 0;
  live(api, {
    kind: 'part',
    label: 'Street lamp (white LED)',
    get level() { return level; },
    foot: g.localToWorld(V(0, 0.3, -1.4)),
    set(v) {
      level = clamp(v, 0, 1);
      lens.emissiveIntensity = level * 1.8;
      glow.material.opacity = level * 0.9;
      pool.material.opacity = level * 0.6;
      light.intensity = level * 6;
      return api;
    },
  });
  return api;
}

/** HC-SR501-style PIR head on a post, looking along local +Z; header VCC OUT GND at the foot. trigger(on). */
export function makePIRPost(pos, opts = {}) {
  const g = new THREE.Group();
  const H = opts.height ?? 4;
  g.add(at(box(1.2, 0.3, 1.2, mat(0x3a3d46)), 0, 0.15, 0));
  g.add(at(cyl(0.18, 0.18, H, mat(0x6a6e76, { metal: 0.4 }), { seg: 10 }), 0, H / 2, 0));
  const head = new THREE.Group();
  head.add(at(box(1.8, 1.8, 0.4, mat(0x2c7a46)), 0, 0, 0));
  const dome = mesh(new THREE.SphereGeometry(0.75, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xf6f3ea, { rough: 0.7 }));
  dome.rotation.x = Math.PI / 2;
  head.add(at(dome, 0, 0, 0.2));
  const led = smdLed(0xff3b2f);
  led.group.rotation.x = Math.PI / 2;
  head.add(at(led.group, 0.7, -0.7, 0.2));
  head.position.set(0, H + 0.6, 0);
  g.add(head);
  const hb = makeBreakout({ w: 1.2, d: 0.8, color: 0x25262b, pins: ['VCC', 'OUT', 'GND'], pinsEdge: 'front', inset: 0.2, labelSide: 'out' });
  hb.group.position.set(0, 0.3, -1.0);
  g.add(hb.group);
  hb.group.updateMatrix();
  const pinsLocal = new Map([...hb.pinsLocal].map(([n, p]) => [n, p.clone().applyMatrix4(hb.group.matrix)]));
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, H + 2, 0) });
  let on = false;
  live(api, {
    kind: 'part', label: 'PIR motion sensor (HC-SR501)',
    get on() { return on; },
    foot: g.localToWorld(V(0, 0.3, -1.4)),
    trigger(v) { on = !!v; led.set(on ? 1 : 0); return api; },
  });
  return api;
}

/** Roadside speed camera: box on a post, lens + white flash window facing local +Z. Header FLASH GND. flash(). */
export function makeSpeedCamera(pos, opts = {}) {
  const g = new THREE.Group();
  const H = opts.height ?? 5;
  g.add(at(box(1.2, 0.3, 1.2, mat(0x3a3d46)), 0, 0.15, 0));
  g.add(at(cyl(0.22, 0.22, H, mat(0x6a6e76, { metal: 0.4 }), { seg: 10 }), 0, H / 2, 0));
  const head = new THREE.Group();
  head.add(at(box(2.0, 1.4, 2.4, mat(0xf2c230, { rough: 0.5 })), 0, 0, 0));
  head.add(at(box(2.1, 0.2, 2.7, mat(0x2a2c33)), 0, 0.8, 0.1));
  const lensC = cyl(0.42, 0.42, 0.2, mat(0x15161a, { rough: 0.2 }), { seg: 18 });
  lensC.rotation.x = Math.PI / 2;
  head.add(at(lensC, -0.45, 0, 1.25));
  const flashM = emissiveMat(0xffffff, { rough: 0.2 });
  flashM.color.setHex(0xd8dde4);
  head.add(at(box(0.7, 0.5, 0.06, flashM, { outline: false }), 0.5, 0.1, 1.22));
  head.position.set(0, H + 0.7, 0);
  g.add(head);
  const glow = glowSprite(0xffffff, 6);
  glow.position.set(0.5, H + 0.8, 1.6);
  g.add(glow);
  const light = new THREE.PointLight(0xffffff, 0, 30, 1.2);
  light.position.set(0.5, H + 0.8, 2.0);
  g.add(light);
  const hb = makeBreakout({ w: 0.9, d: 0.8, color: 0x25262b, pins: ['FLASH', 'GND'], pinsEdge: 'front', inset: 0.2, labelSide: 'out', pinText: { FLASH: 'F' } });
  hb.group.position.set(0, 0.3, -1.0);
  g.add(hb.group);
  hb.group.updateMatrix();
  const pinsLocal = new Map([...hb.pinsLocal].map(([n, p]) => [n, p.clone().applyMatrix4(hb.group.matrix)]));
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, H + 2.2, 0) });
  let t = 0;
  live(api, {
    kind: 'part', label: 'Speed camera with white LED flash',
    foot: g.localToWorld(V(0, 0.3, -1.4)),
    set(on) { t = on ? 10 : 0; return api; },
    flash(ms = 80) { t = ms / 1000; return api; },
    tick(dt) {
      t = Math.max(0, t - dt);
      const v = t > 0 ? 1 : 0;
      flashM.emissiveIntensity = v * 2.5;
      glow.material.opacity = v;
      light.intensity = v * 40;
    },
  });
  return api;
}

/**
 * Straight H0 street along local X: asphalt, pavements, kerbs and optional
 * lane layout ('two-way' | 'one-way'). opts.length (70). API: laneZ(dir),
 * traffic (laneTraffic: add lanes yourself), at(x, z) world point on the road.
 */
export function makeStreet(pos, opts = {}) {
  const LEN = opts.length ?? 70, RW = opts.oneWay ? 4.4 : 7.4, PW = 4;
  const g = new THREE.Group();
  const D = RW + PW * 2 + 6;
  g.add(roadMat(LEN, D, (c, s, cw, ch) => {
    const Z = (z) => (z + D / 2) * s;
    c.fillStyle = GRASS; c.fillRect(0, 0, cw, ch);
    c.fillStyle = PAVE; c.fillRect(0, Z(-RW / 2 - PW), cw, (RW + 2 * PW) * s);
    c.strokeStyle = 'rgba(29,36,64,.12)'; c.lineWidth = 1;
    for (let x = 0; x < LEN; x += 1.5) for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(x * s, Z(sg * (RW / 2 + 0.3))); c.lineTo(x * s, Z(sg * (RW / 2 + PW))); c.stroke(); }
    c.fillStyle = ASPHALT; c.fillRect(0, Z(-RW / 2), cw, RW * s);
    c.fillStyle = MARK;
    if (!opts.oneWay) for (let x = 0; x < LEN; x += 3) c.fillRect(x * s, Z(-0.08), 1.6 * s, 0.16 * s);
    else for (let x = 4; x < LEN; x += 12) { // arrows
      const X = x * s, cz = Z(0);
      c.fillRect(X, cz - 0.12 * s, 2.2 * s, 0.24 * s);
      c.beginPath(); c.moveTo(X + 2.2 * s, cz - 0.55 * s); c.lineTo(X + 3.1 * s, cz); c.lineTo(X + 2.2 * s, cz + 0.55 * s); c.fill();
    }
    for (const sg of [-1, 1]) c.fillRect(0, Z(sg * (RW / 2 - 0.25)) - 0.06 * s, cw, 0.12 * s);
  }));
  const kerb = mat(0xd9d4c6, { rough: 0.8 });
  for (const sg of [-1, 1]) g.add(at(box(LEN, 0.3, 0.35, kerb, { outline: false }), 0, 0.15, sg * (RW / 2 + 0.17)));
  g.position.copy(pos ?? V());
  g.rotation.y = opts.rotY ?? 0;
  g.updateMatrixWorld(true);
  const traffic = laneTraffic(g);
  return {
    group: g, pick: g, kind: 'prop', label: 'H0 street model',
    anchor: g.localToWorld(V(0, 4, 0)),
    length: LEN, roadWidth: RW, paveWidth: PW,
    traffic,
    /** z of the lane centre for travel direction +1 (+x) or −1 (−x). */
    laneZ: (dir) => (opts.oneWay ? 0 : dir > 0 ? RW / 4 : -RW / 4),
    at: (x, z, y = ROAD_Y) => g.localToWorld(V(x, y, z)),
    tick(dt) { traffic.tick(dt); },
  };
}

// ================================================================= VL53L0X + pan scanner
/** GY-VL53L0XV2 time-of-flight breakout (lying flat, sensor facing up). Pins VIN GND SCL SDA GPIO1 XSHUT. */
function vl53Board() {
  const b = makeBreakout({
    w: 2.5, d: 1.3, color: PCB.purple, pins: ['VIN', 'GND', 'SCL', 'SDA', 'GPIO1', 'XSHUT'], pinsEdge: 'back', inset: 0.16, pinLabels: false,
    holes: [[-1.0, 0.25], [1.0, 0.25]], holeR: 0.1,
    silk: (P) => P.text('VL53L0X', 0, 0.48, 0.12, { weight: 700 }),
  });
  const s = new THREE.Group();
  s.add(at(box(0.44, 0.1, 0.24, mat(0x16171b)), 0, 0.05, 0));
  for (const dx of [-0.1, 0.1]) s.add(at(cyl(0.05, 0.05, 0.02, mat(0x4a5a8a, { metal: 0.4 }), { outline: false, seg: 10 }), dx, 0.105, 0));
  b.on(s, 0, 0.15);
  return b;
}

/**
 * Pan scanner: a stand with an SG90 (shaft up) carrying a bracket with a
 * VL53L0X (opts.sensor 'vl53', default) or an HC-SR04 ('hcsr04') looking along
 * the horizontal. Servo 90 = local +Z; 0 = local −X side … 180 = +X side seen from
 * above with the scanner facing away (rotY = π): 0 right, 180 left, like a radar.
 * Header at the foot: SIG V+ V− (servo) and VIN GND SCL SDA (VL53L0X) or VIN TRIG ECHO GND.
 * API: setAngle(deg) (slews), angle, ray() → { origin, dir } world, beam(cm) shows the measured ray.
 */
export function makePanScanner(pos, opts = {}) {
  const g = new THREE.Group();
  const H = opts.height ?? 5;
  const us = opts.sensor === 'hcsr04';
  const dark = mat(0x3a3d46, { rough: 0.6 });
  g.add(at(box(4.0, 0.4, 3.2, dark), 0, 0.2, 0));
  g.add(at(box(1.6, H - 2.4, 1.6, mat(0xc9ccd2, { metal: 0.45, rough: 0.4 })), 0, 0.4 + (H - 2.4) / 2, 0.55));
  const sv = servoBody();
  sv.position.set(0, H, 0);
  sv.rotation.y = Math.PI / 2;
  g.add(sv);
  const pan = new THREE.Group();
  pan.position.y = H;
  g.add(pan);
  pan.add(servoHorn(1.0));
  // L-bracket
  const alu = mat(0xc9ccd2, { metal: 0.5, rough: 0.38 });
  pan.add(at(box(us ? 4.8 : 2.8, 0.15, 1.4, alu), 0, 0.2, 0));
  pan.add(at(box(us ? 4.8 : 2.8, us ? 2.4 : 1.8, 0.15, alu), 0, (us ? 1.2 : 0.9) + 0.2, 0.62));
  let sensorOrigin;
  if (us) {
    const board = new THREE.Group();
    board.add(at(box(4.5, 2.0, 0.14, mat(0x2b62c4, { rough: 0.5 })), 0, 0, 0));
    for (const s of [-1, 1]) {
      const can = cyl(0.78, 0.78, 0.62, mat(0xd7d4cb, { metal: 0.55, rough: 0.35 }), { seg: 28 });
      can.rotation.x = Math.PI / 2;
      board.add(at(can, s * 1.3, 0.1, 0.38));
    }
    board.position.set(0, 1.4, 0.77);
    pan.add(board);
    sensorOrigin = V(0, 1.5, 1.2);
  } else {
    const b = vl53Board();
    b.group.rotation.x = Math.PI / 2;
    b.group.position.set(0, 1.2, 0.71);
    pan.add(b.group);
    sensorOrigin = V(0, 1.2, 0.95);
  }
  // cable loop from the bracket down to the stand
  g.add(cable([V(-0.6, H + 0.6, -0.6), V(-1.4, H - 0.6, -1.0), V(-1.6, 1.6, -1.2), V(-1.4, 0.45, -1.3)], 0x6d7079, 0.07));
  const names = us ? ['SIG', 'V+', 'V-', 'VIN', 'TRIG', 'ECHO', 'GND'] : ['SIG', 'V+', 'V-', 'VIN', 'GND', 'SCL', 'SDA'];
  const hb = makeBreakout({ w: 0.4 + names.length * PITCH, d: 1.0, color: 0x25262b, pins: names, pinsEdge: 'back', inset: 0.22, labelSide: 'in' });
  hb.group.position.set(0, 0.4, -1.0);
  g.add(hb.group);
  hb.group.updateMatrix();
  const pinsLocal = new Map([...hb.pinsLocal].map(([n, p]) => [n, p.clone().applyMatrix4(hb.group.matrix)]));
  // measured ray (teaching aid)
  const beamM = new THREE.MeshBasicMaterial({ color: 0xef8a2b, transparent: true, opacity: 0, depthWrite: false });
  const beam = noRay(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8), beamM));
  g.add(beam);
  const dot = noRay(new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), new THREE.MeshBasicMaterial({ color: 0xef8a2b, transparent: true, opacity: 0 })));
  g.add(dot);
  let ang = 90, tgt = 90;
  const pose = () => { pan.rotation.y = (ang - 90) * D2R; };
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, H + 3, 0) });
  live(api, {
    kind: 'part',
    label: us ? 'Pan scanner: SG90 + HC-SR04' : 'Pan scanner: SG90 + VL53L0X',
    get angle() { return ang; },
    setAngle(d) { tgt = clamp(d, 0, 180); return api; },
    ray() {
      g.updateMatrixWorld(true);
      const origin = pan.localToWorld(sensorOrigin.clone());
      const dir = V(0, 0, 1).applyQuaternion(pan.getWorldQuaternion(new THREE.Quaternion())).setY(0).normalize();
      return { origin, dir };
    },
    /** Show the last measurement as a ray of length cm (0 hides it). */
    beam(cm) {
      if (!cm) { beamM.opacity = 0; dot.material.opacity = 0; return api; }
      const { origin, dir } = api.ray();
      const o = g.worldToLocal(origin.clone()), e = g.worldToLocal(origin.clone().addScaledVector(dir, cm));
      beam.position.copy(o).lerp(e, 0.5);
      beam.scale.set(1, cm, 1);
      beam.quaternion.setFromUnitVectors(V(0, 1, 0), e.clone().sub(o).normalize());
      dot.position.copy(e);
      beamM.opacity = 0.55;
      dot.material.opacity = 0.9;
      return api;
    },
    tick(dt) { ang += clamp(tgt - ang, -600 * dt, 600 * dt); pose(); },
  });
  pose();
  return api;
}

/** 2D ray (o, d) against an axis-aligned box {x0,x1,z0,z1} → hit distance or Infinity. */
export function rayBox(ox, oz, dx, dz, b) {
  let t0 = -Infinity, t1 = Infinity;
  for (const [o, d, lo, hi] of [[ox, dx, b.x0, b.x1], [oz, dz, b.z0, b.z1]]) {
    if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return Infinity; continue; }
    let a = (lo - o) / d, c = (hi - o) / d;
    if (a > c) [a, c] = [c, a];
    t0 = Math.max(t0, a); t1 = Math.min(t1, c);
  }
  if (t1 < Math.max(t0, 0)) return Infinity;
  return Math.max(t0, 0);
}

/**
 * Cardboard model room for scanning: floor, low walls (open towards +Z where the
 * scanner stands) and furniture boxes. opts.w (80), d (50). layouts: { key:
 * [[x, z, w, d, h, color], ...] } in local coords; setLayout(key). castRay(o, dir) → cm.
 */
export function makeRoom(pos, opts = {}) {
  const w = opts.w ?? 80, d = opts.d ?? 50, T = 1, WH = opts.wallH ?? 7;
  const g = new THREE.Group();
  g.add(at(box(w + 2 * T, 0.2, d + T, mat(0xe9e2d0, { rough: 0.9 }), { outline: false }), 0, 0.1, -T / 2));
  const card = mat(0xd2b07a, { rough: 0.85 });
  const walls = [];
  const wall = (x0, x1, z0, z1) => {
    g.add(at(box(x1 - x0, WH, z1 - z0, card), (x0 + x1) / 2, WH / 2, (z0 + z1) / 2));
    walls.push({ x0, x1, z0, z1 });
  };
  wall(-w / 2 - T, w / 2 + T, -d - T, -d);
  wall(-w / 2 - T, -w / 2, -d, 0);
  wall(w / 2, w / 2 + T, -d, 0);
  const layouts = opts.layouts;
  const cols = [0x3a6fd0, 0xe5412e, 0x3aa65a, 0xf2c230, 0x8a5cc6, 0x6d7079];
  const pool = cols.map((c) => { const m = box(1, 1, 1, mat(c, { rough: 0.6 })); g.add(m); return { m, on: false }; });
  let boxes = [];
  g.position.copy(pos ?? V());
  g.rotation.y = opts.rotY ?? 0;
  g.updateMatrixWorld(true);
  const api = {
    group: g, pick: g, kind: 'prop', label: 'Cardboard model room',
    anchor: g.localToWorld(V(0, WH + 2, -d / 2)),
    layout: null,
    setLayout(key) {
      api.layout = key;
      boxes = [];
      pool.forEach((p, i) => {
        const s = layouts[key][i];
        p.on = !!s;
        p.m.visible = !!s;
        if (!s) return;
        const [x, z, bw, bd, bh] = s;
        p.m.scale.set(bw, bh, bd);
        p.m.position.set(x, bh / 2, z);
        boxes.push({ x0: x - bw / 2, x1: x + bw / 2, z0: z - bd / 2, z1: z + bd / 2 });
      });
      g.updateMatrixWorld(true);
    },
    /** Distance (cm) from world origin along world dir (horizontal) to the first wall or box. */
    castRay(o, dir) {
      const lo = g.worldToLocal(o.clone());
      const ld = dir.clone().transformDirection(g.matrixWorld.clone().invert());
      let best = Infinity;
      for (const b of [...walls, ...boxes]) best = Math.min(best, rayBox(lo.x, lo.z, ld.x, ld.z, b));
      return best;
    },
  };
  if (layouts) api.setLayout(Object.keys(layouts)[0]);
  return api;
}

/**
 * Draw a radar screen on an SSD1306 OLED (128 × 64): half-circle with range rings,
 * a sweep line at `sweep` degrees and the points [[deg, cm], ...] — the same
 * picture the sketch's drawRadar() makes. maxCm = outer ring.
 */
export function drawRadar(oled, sweep, points, maxCm = 100) {
  oled.draw((c) => {
    const cx = 64, cy = 63, R = 60;
    const px = (x, y) => c.fillRect(Math.round(x), Math.round(y), 1, 1);
    const ray = (a, len) => { for (let r = 0; r <= len; r += 0.7) px(cx + r * Math.cos(a * D2R), cy - r * Math.sin(a * D2R)); };
    for (const k of [1, 2, 3]) { const rr = Math.trunc((R * k) / 3); for (let a = 0; a <= 180; a += 0.5) px(cx + rr * Math.cos(a * D2R), cy - rr * Math.sin(a * D2R)); }
    for (let a = 0; a <= 180; a += 45) ray(a, R);
    ray(sweep, R);
    for (const [a, cm] of points) {
      if (!(cm > 0) || cm > maxCm) continue;
      const r = (cm * R) / maxCm;
      c.fillRect(Math.trunc(cx + r * Math.cos(a * D2R)) - 1, Math.trunc(cy - r * Math.sin(a * D2R)) - 1, 2, 2);
    }
  });
}

// ================================================================= car park
/**
 * H0 car park: entry lane (+x, z = +1.8) with a barrier gate, exit lane (−x, z = −1.8),
 * a row of 4 nose-in bays on the −z side with an FC-51 sensor on each bay's back wall,
 * and two FC-51s at the barrier (OUTSIDE before it, INSIDE after it).
 * Cars arrive, wait at the barrier, park in the first free bay, stay a while and leave.
 * API: barrier, bays [{ occupied, sensor }], sensors { outside, inside }, free(),
 * arrive() (send a car), setRate(perMin), setStay(s), feet, tick, reset().
 */
export function makeCarPark(pos, opts = {}) {
  const g = new THREE.Group();
  const W = 50, D = 34, BX = -14, NB = 4, BW = 3.6, BAY_Z = -9.2;
  const bayX = (i) => -3 + i * BW;
  g.add(roadMat(W, D, (c, s, cw, ch) => {
    const X = (x) => (x + W / 2) * s, Z = (z) => (z + D / 2) * s;
    c.fillStyle = GRASS; c.fillRect(0, 0, cw, ch);
    c.fillStyle = ASPHALT; c.fillRect(X(-W / 2), Z(-4), W * s, 8 * s);
    c.fillStyle = '#585b63'; c.fillRect(X(-6), Z(-13.4), (NB * BW + 6) * s, 9.4 * s);
    c.fillStyle = MARK;
    for (let i = 0; i <= NB; i++) c.fillRect(X(bayX(0) - BW / 2 + i * BW) - 0.08 * s, Z(-12.4), 0.16 * s, 8.2 * s);
    for (let i = 0; i < NB; i++) { c.font = `700 ${1.4 * s}px ${SANS}`; c.textAlign = 'center'; c.fillText(`P${i + 1}`, X(bayX(i)), Z(-6.0)); }
    for (let x = -W / 2 + 1; x < W / 2 - 4; x += 3) if (x < BX - 2.5 || x > BX + 1) c.fillRect(X(x), Z(-0.08), 1.6 * s, 0.16 * s);
    c.fillRect(X(BX + 0.8), Z(0), 0.3 * s, 3.7 * s);
    for (const [x, z, dir] of [[-20, 1.8, 1], [6, 1.8, 1], [-8, -1.8, -1], [-22, -1.8, -1]]) {
      const Xc = X(x), Zc = Z(z);
      c.fillRect(Xc - 1.1 * s, Zc - 0.12 * s, 2.2 * s, 0.24 * s);
      c.beginPath(); c.moveTo(Xc + dir * 1.1 * s, Zc - 0.5 * s); c.lineTo(Xc + dir * 1.9 * s, Zc); c.lineTo(Xc + dir * 1.1 * s, Zc + 0.5 * s); c.fill();
    }
    c.fillStyle = '#2f5fbf'; c.fillRect(X(-24.4), Z(5.4), 3.4 * s, 3.4 * s);
    c.fillStyle = '#fff'; c.font = `700 ${2.6 * s}px ${SANS}`; c.fillText('P', X(-22.7), Z(8.0));
  }));
  // back wall of the bays + kerbs
  const wallM = mat(0xd9d4c6, { rough: 0.8 });
  g.add(at(box(NB * BW + 1, 1.6, 3.6, wallM), bayX(0) - BW / 2 + (NB * BW) / 2, 0.8, -14.75));
  g.add(at(box(W, 0.3, 0.35, wallM, { outline: false }), 0, 0.15, 4.2));
  g.add(at(box(W - (NB * BW + 6), 0.3, 0.35, wallM, { outline: false }), -W / 2 + (W - (NB * BW + 6)) / 2 - 3, 0.15, -4.2));
  g.position.copy(pos ?? V());
  g.rotation.y = opts.rotY ?? 0;
  g.updateMatrixWorld(true);
  const W2 = (x, z, y = ROAD_Y) => g.localToWorld(V(x, y, z));
  const barrier = makeBarrier(W2(BX, 4.7, ROAD_Y), { length: 4.4, rotY: Math.PI / 2 + (opts.rotY ?? 0), fork: false });
  g.attach(barrier.group);
  const sOut = makeIRObstacle(W2(BX - 4, 6.0), { rotY: Math.PI + (opts.rotY ?? 0), label: 'IR sensor (outside)' });
  const sIn = makeIRObstacle(W2(BX + 4, 6.0), { rotY: Math.PI + (opts.rotY ?? 0), label: 'IR sensor (inside)' });
  g.attach(sOut.group); g.attach(sIn.group);
  const bays = [];
  for (let i = 0; i < NB; i++) {
    const sens = makeIRObstacle(W2(bayX(i), -14.95, 1.6), { rotY: opts.rotY ?? 0, label: `Bay ${i + 1} sensor` });
    g.attach(sens.group);
    bays.push({ i, x: bayX(i), sensor: sens, car: null, reserved: false, get occupied() { return !!this.car && this.car.state === 'parked'; } });
  }
  // ---- cars
  const pool = [];
  const cars = [];
  const CL = 5.2;
  let rate = opts.rate ?? 3, stay = opts.stay ?? 16, acc = 0.6, cycle = 0, wasDown = true;
  const getCar = () => { const c = pool.pop() ?? makeToyCar(V()); c.group.visible = true; g.add(c.group); return c; };
  const arc = (cx, cz, r, a0, a1, n = 10) => [...Array(n + 1)].map((_, k) => { const a = a0 + ((a1 - a0) * k) / n; return [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; });
  const pathTo = (i) => {
    const x = bayX(i), R = 3.2;
    return [[BX + 1, 1.8], [x - R, 1.8], ...arc(x - R, 1.8 - R, R, Math.PI / 2, 0).slice(1), [x, BAY_Z]];
  };
  const pathOut = (i) => {
    const x = bayX(i), R = 3.0;
    return [[x, BAY_Z], [x, -1.8 - R], ...arc(x + R, -1.8 - R, R, Math.PI, Math.PI / 2).slice(1)];
  };
  const pathExit = (i) => [[bayX(i) + 3.0, -1.8], [-W / 2 - 4, -1.8]];
  const follow = (car, dt) => {
    const P = car.path;
    let d = car.v * dt;
    while (d > 0 && car.k < P.length - 1) {
      const [ax, az] = P[car.k], [bx, bz] = P[car.k + 1];
      const seg = Math.hypot(bx - ax, bz - az);
      const rem = seg * (1 - car.t);
      if (d < rem) { car.t += d / seg; d = 0; } else { d -= rem; car.k++; car.t = 0; }
    }
    const k = Math.min(car.k, P.length - 2);
    const [ax, az] = P[k], [bx, bz] = P[k + 1];
    const t = car.k >= P.length - 1 ? 1 : car.t;
    car.x = ax + (bx - ax) * t; car.z = az + (bz - az) * t;
    let yaw = Math.atan2(bx - ax, bz - az);
    if (car.rev) yaw += Math.PI;
    car.yaw = yaw;
    return car.k >= P.length - 1;
  };
  const show = (car) => {
    car.obj.group.position.set(car.x, ROAD_Y, car.z);
    car.obj.group.rotation.y = car.yaw;
  };
  const freeBay = () => bays.find((b) => !b.car);
  const api = {
    group: g, pick: g, kind: 'prop', label: 'H0 car park model',
    anchor: g.localToWorld(V(0, 4, -6)),
    barrier, bays, sensors: { outside: sOut, inside: sIn }, cars,
    feet: {
      barrier: W2(BX - 1.5, 4.5, 0.3),
      outside: W2(BX - 4, 7.9, 0.3), inside: W2(BX + 4, 7.9, 0.3),
      bay: bays.map((b) => W2(b.x, -16.9, 0.3)),
    },
    free: () => bays.filter((b) => !b.occupied).length,
    setRate(r) { rate = r; }, setStay(s) { stay = s; },
    get rate() { return rate; }, get stay() { return stay; },
    arrive() {
      const last = cars.filter((c) => c.state === 'queue').reduce((m, c) => Math.min(m, c.x), Infinity);
      if (last < -W / 2 + CL + 2) return null;
      const car = { state: 'queue', x: -W / 2 - 3, z: 1.8, yaw: Math.PI / 2, v: 10, obj: getCar(), bay: null, timer: 0, cycle: -1 };
      cars.push(car);
      show(car);
      return car;
    },
    clear() { for (const c of cars.splice(0)) { c.obj.group.visible = false; pool.push(c.obj); } bays.forEach((b) => (b.car = null)); },
    tick(dt) {
      dt = Math.min(dt, 0.05);
      if (barrier.isDown && !wasDown) cycle++;
      wasDown = barrier.isDown;
      acc += (rate / 60) * dt;
      if (acc >= 1 && api.arrive()) acc -= 1;
      acc = Math.min(acc, 1.2);
      // queue on the entry lane: stop behind the leader and at the barrier line
      const queue = cars.filter((c) => c.state === 'queue').sort((a, b) => b.x - a.x);
      queue.forEach((c, i) => {
        let limit = i ? queue[i - 1].x - CL - 1.2 : Infinity;
        const line = BX - 1.4 - CL / 2;
        const admitted = c.cycle >= 0;
        if (!admitted) {
          if (c.x >= line - 0.3 && barrier.isUp && (i === 0) && cycle > api._lastCycle) { c.cycle = cycle; api._lastCycle = cycle; }
          else limit = Math.min(limit, line);
        }
        const target = Math.min(10, Math.sqrt(Math.max(0, 2 * 11 * (limit - c.x))));
        c.v += clamp(target - c.v, -30 * dt, 9 * dt);
        if (limit - c.x < 0.02) c.v = 0;
        c.v = Math.max(0, c.v);
        c.x = Math.min(c.x + c.v * dt, limit);
        c.obj.setBrake(c.v < 0.4);
        if (c.cycle >= 0 && c.x >= BX + 1) {
          const b = freeBay();
          if (b) { b.car = c; c.bay = b; c.state = 'enter'; c.path = pathTo(b.i); c.k = 0; c.t = 0; c.rev = false; c.v = 7; }
          else { c.state = 'exit'; c.path = [[BX + 1, 1.8], [W / 2 + 4, 1.8]]; c.k = 0; c.t = 0; c.rev = false; }
        }
        show(c);
      });
      for (const c of cars) {
        if (c.state === 'enter') { c.obj.setBrake(false); if (follow(c, dt)) { c.state = 'parked'; c.timer = stay * (0.6 + Math.random() * 0.8); c.obj.setBrake(false); } show(c); }
        else if (c.state === 'parked') { c.timer -= dt; if (c.timer <= 0) { c.state = 'out'; c.path = pathOut(c.bay.i); c.k = 0; c.t = 0; c.rev = true; c.v = 4; c.obj.setBrake(true); } }
        else if (c.state === 'out') { if (follow(c, dt)) { c.state = 'leave'; c.bay.car = null; c.path = pathExit(c.bay.i); c.k = 0; c.t = 0; c.rev = false; c.v = 9; c.obj.setBrake(false); } show(c); }
        else if (c.state === 'leave' || c.state === 'exit') { c.v = 9; if (follow(c, dt)) c.state = 'gone'; show(c); }
      }
      for (let i = cars.length - 1; i >= 0; i--) if (cars[i].state === 'gone') { cars[i].obj.group.visible = false; pool.push(cars[i].obj); cars.splice(i, 1); }
      // sensors see a car body over their spot
      const near = (x, z, r = 1.2) => cars.some((c) => {
        const dx = x - c.x, dz = z - c.z;
        const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw);
        const along = dx * fx + dz * fz, side = -dx * fz + dz * fx;
        return Math.abs(along) < CL / 2 + 0.2 && Math.abs(side) < 1.05 + r;
      });
      api.state.outside = near(BX - 4, 1.8, 0.2);
      api.state.inside = near(BX + 4, 1.8, 0.2);
      sOut.setDetect(api.state.outside);
      sIn.setDetect(api.state.inside);
      for (const b of bays) { b.seen = near(b.x, BAY_Z, 0.1); b.sensor.setDetect(b.seen); }
    },
    state: { outside: false, inside: false },
    _lastCycle: -1,
    reset() { api.clear(); acc = 0.6; cycle = 0; api._lastCycle = -1; barrier.jump(0); },
  };
  return api;
}
