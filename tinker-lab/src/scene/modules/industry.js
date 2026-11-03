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
 *  base     90 = forward; 90 + atan2(x, y)
 *  shoulder upper-arm elevation above horizontal (0 forward … 180 back)
 *  elbow    interior angle between upper arm and forearm (180 = straight)
 *  wrist    90 = gripper in line with the forearm
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
    base: Math.round(90 + Math.atan2(x, y) / D2R),
    shoulder: Math.round(a1 / D2R),
    elbow: Math.round(a2 / D2R),
    wrist: Math.round(90 + (p - fore) / D2R),
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
  const cur = { base: 90, shoulder: 110, elbow: 70, wrist: 40, grip: 90 };
  const tgt = { ...cur };
  let glideJob = null;
  let held = null, heldWidth = 0;
  const RATE = 600; // deg/s, SG90 no-load ≈ 0.1 s / 60°
  function pose() {
    yaw.rotation.y = (cur.base - 90) * D2R;
    shoulder.rotation.x = -cur.shoulder * D2R;
    elbow.rotation.x = -(cur.elbow - 180) * D2R;
    wrist.rotation.x = -(cur.wrist - 90) * D2R;
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
    toArm(w) { const l = g.worldToLocal(w.clone()); return { x: l.x, y: l.z, z: l.y }; },
    fromArm(x, y, z) { return g.localToWorld(V(x, z, y)); },
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
      Object.assign(cur, { base: 90, shoulder: 110, elbow: 70, wrist: 40, grip: 90 });
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
    const hp = V(p.x - d.x * 0.5, gy, p.z - d.z * 0.5).add(out);
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
