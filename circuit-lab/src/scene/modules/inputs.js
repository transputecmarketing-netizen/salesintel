// Input modules: thumb joystick, 4×4 membrane keypad, KY-040 rotary encoder.
import {
  THREE, V, mat, mesh, box, cyl, at, metal, slab, roundedRectShape, canvasTexture,
  makeBreakout, freeApi, decal, textDecal, smd, smdField, tactile, femaleBlock, PITCH, SANS,
  live,
} from './common.js';

// ================================================================= joystick
/** KY-023 thumb joystick. Pins GND, +5V, VRX, VRY, SW. set(x, y) in −1..1, press(on). */
export function makeJoystick(pos, opts = {}) {
  const b = makeBreakout({
    w: 3.4, d: 2.6, color: 0x25262b, pins: ['GND', '+5V', 'VRX', 'VRY', 'SW'], pinsEdge: 'left', inset: 0.2,
    holes: [[-1.25, -1.0], [-1.25, 1.0], [1.4, -1.0], [1.4, 1.0]], holeR: 0.14,
  });
  const g = b.group;
  const CX = 0.45;
  // gimbal: black base, metal frame, two pots
  const gim = new THREE.Group();
  gim.add(at(box(1.65, 0.55, 1.65, mat(0x2b2c31)), 0, 0.275, 0));
  const steel = mat(0xc9c6bd, { metal: 0.55, rough: 0.35 });
  gim.add(at(box(1.7, 0.08, 1.7, steel), 0, 0.59, 0));
  gim.add(at(box(0.06, 0.3, 1.2, steel), 0.82, 0.75, 0));
  gim.add(at(box(0.06, 0.3, 1.2, steel), -0.82, 0.75, 0));
  // pots on +z and −x sides
  const potA = box(1.1, 0.7, 0.3, mat(0x2f62c9, { rough: 0.5 }));
  gim.add(at(potA, 0, 0.45, 0.98));
  const potB = box(0.3, 0.7, 1.1, mat(0x2f62c9, { rough: 0.5 }));
  gim.add(at(potB, -0.98, 0.45, 0));
  // switch
  gim.add(at(box(0.5, 0.3, 0.4, mat(0xf3f1e8)), 0.65, 0.15, -0.95));
  b.on(gim, CX, 0);
  // stick
  const stick = new THREE.Group();
  stick.position.set(CX, b.top + 0.95, 0);
  stick.add(mesh(new THREE.SphereGeometry(0.42, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x2b2c31)));
  stick.add(at(cyl(0.12, 0.14, 0.9, mat(0x2b2c31), { seg: 12 }), 0, 0.5, 0));
  const capMat = mat(0x1f2024, { rough: 0.7 });
  const capG = new THREE.Group();
  capG.add(at(cyl(1.0, 0.85, 0.5, capMat, { seg: 36 }), 0, 0.25, 0));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.13, 10, 36), capMat);
  rim.rotation.x = Math.PI / 2;
  capG.add(at(rim, 0, 0.5, 0));
  capG.add(at(cyl(0.8, 0.8, 0.04, mat(0x2a2b30, { rough: 0.9 }), { seg: 36, outline: false }), 0, 0.45, 0));
  // grip bumps
  const bumps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 8, 6), mat(0x3a3b40), 19);
  const t = new THREE.Object3D();
  let k = 0;
  for (const [r, n] of [[0, 1], [0.3, 6], [0.58, 12]])
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      t.position.set(Math.cos(a) * r, 0.47, Math.sin(a) * r);
      t.updateMatrix();
      bumps.setMatrixAt(k++, t.matrix);
    }
  capG.add(bumps);
  capG.position.y = 0.9;
  stick.add(capG);
  g.add(stick);
  smdField(b, [[-0.9, 0.0, Math.PI / 2]]);
  const api = freeApi(g, b.pinsLocal, pos, opts, { pick: g, anchor: V(CX, 3.2, 0) });
  let x = 0, y = 0, pressed = false;
  live(api, {
    get x() { return x; },
    get y() { return y; },
    get pressed() { return pressed; },
    /** x: −1 left .. 1 right; y: −1 back (toward camera) .. 1 forward (away). */
    set(nx = 0, ny = 0) {
      x = Math.max(-1, Math.min(1, nx));
      y = Math.max(-1, Math.min(1, ny));
      stick.rotation.set(-y * 0.42, 0, -x * 0.42, 'XZY');
      return api;
    },
    press(on = true) {
      pressed = !!on;
      stick.position.y = b.top + 0.95 - (pressed ? 0.14 : 0);
      return api;
    },
  });
  return api;
}

// ================================================================= keypad
const KEYS = [['1', '2', '3', 'A'], ['4', '5', '6', 'B'], ['7', '8', '9', 'C'], ['*', '0', '#', 'D']];

/**
 * 4×4 membrane keypad lying flat; ribbon tail toward +z ending in an 8-pin
 * female connector (holes up). Pins R1–R4, C1–C4 (left→right).
 * press(key) / release(); keyAt(worldPoint) → key label or null.
 */
export function makeKeypad(pos, opts = {}) {
  const g = new THREE.Group();
  const W = 6.9, D = 7.6, T = 0.08;
  g.add(slab(roundedRectShape(W, D, 0.3), T, mat(0xf3f1e8, { rough: 0.6 })));
  g.add(at(slab(roundedRectShape(W - 0.4, D - 0.4, 0.2), 0.02, mat(0x23252c, { rough: 0.6 }), { outline: false }), 0, T, 0));
  const P = 1.55;
  const keyMeshes = new Map();
  const colorOf = (k) => (/[ABCD]/.test(k) ? 0xd8443a : /[*#]/.test(k) ? 0x4a4d57 : 0x3b6fd0);
  KEYS.forEach((row, j) =>
    row.forEach((k, i) => {
      const tex = canvasTexture(128, 128, (ctx) => {
        const c = new THREE.Color(colorOf(k));
        ctx.fillStyle = `#${c.getHexString()}`;
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 ${k === '*' ? 104 : 74}px ${SANS}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(k, 64, k === '*' ? 92 : 70);
      });
      const side = mat(colorOf(k), { rough: 0.5 });
      const topM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
      const key = mesh(new THREE.BoxGeometry(1.2, 0.1, 1.2), [side, side, topM, side, side, side]);
      key.position.set((i - 1.5) * P, T + 0.07, (j - 1.5) * P - 0.15);
      key.userData = { key: k, side, topM, y: key.position.y };
      g.add(key);
      keyMeshes.set(k, key);
    }),
  );
  // ribbon tail
  const TL = 5.6, TW = 1.9;
  const tail = box(TW, 0.03, TL, mat(0xd6cfbd, { rough: 0.5 }), { outline: false });
  g.add(at(tail, 0, 0.015, D / 2 + TL / 2 - 0.2));
  const traces = decal(TW, TL, (ctx, w, h) => {
    ctx.fillStyle = '#9d8f6c';
    for (let i = 0; i < 8; i++) ctx.fillRect(w * (0.12 + i * 0.105), 0, w * 0.04, h);
    ctx.fillStyle = '#1d2440';
    ctx.font = `700 ${w * 0.075}px ${SANS}`;
    ctx.textAlign = 'center';
    ['R1', 'R2', 'R3', 'R4', 'C1', 'C2', 'C3', 'C4'].forEach((n, i) => ctx.fillText(n, w * (0.14 + i * 0.105), h * 0.93));
  });
  traces.position.set(0, 0.032, D / 2 + TL / 2 - 0.2);
  g.add(traces);
  const conn = femaleBlock(8, { h: 0.6 });
  const CZ = D / 2 + TL - 0.1;
  conn.position.set(0, 0, CZ);
  g.add(conn);
  const pinsLocal = new Map();
  ['R1', 'R2', 'R3', 'R4', 'C1', 'C2', 'C3', 'C4'].forEach((n, i) => pinsLocal.set(n, conn.userData.holes[i].clone().add(conn.position)));
  const api = freeApi(g, pinsLocal, pos, opts, { pick: g, anchor: V(0, 1.6, -1) });
  let down = null;
  live(api, {
    keys: KEYS.flat(),
    get pressed() { return down; },
    press(k) {
      api.release();
      const m = keyMeshes.get(String(k).toUpperCase());
      if (!m) return api;
      down = m.userData.key;
      m.position.y = m.userData.y - 0.06;
      m.userData.topM.color.setScalar(0.7);
      m.userData.side.color.multiplyScalar(0.7);
      return api;
    },
    release() {
      if (down) {
        const m = keyMeshes.get(down);
        m.position.y = m.userData.y;
        m.userData.topM.color.setScalar(1);
        m.userData.side.color.setHex(colorOf(down));
      }
      down = null;
      return api;
    },
    /** Key label under a world point (e.g. a raycast hit), or null. */
    keyAt(point) {
      g.updateWorldMatrix(true, false);
      const p = g.worldToLocal(point.clone());
      const i = Math.round(p.x / P + 1.5), j = Math.round((p.z + 0.15) / P + 1.5);
      if (i < 0 || i > 3 || j < 0 || j > 3) return null;
      if (Math.abs(p.x - (i - 1.5) * P) > 0.7 || Math.abs(p.z + 0.15 - (j - 1.5) * P) > 0.7) return null;
      return KEYS[j][i];
    },
    /** World centre of a key top. */
    keyPos(k) {
      const m = keyMeshes.get(String(k).toUpperCase());
      return m ? g.localToWorld(m.position.clone().setY(m.userData.y + 0.05)) : null;
    },
  });
  return api;
}

// ================================================================= rotary encoder
/** KY-040 rotary encoder with knurled shaft. Pins CLK, DT, SW, +, GND. setAngle(deg), press(on). */
export function makeRotaryEncoder(pos, opts = {}) {
  const b = makeBreakout({
    w: 2.6, d: 1.9, color: 0x25262b, pins: ['CLK', 'DT', 'SW', '+', 'GND'], pinsEdge: 'left', inset: 0.2,
    holes: [[1.05, -0.72], [1.05, 0.72]], holeR: 0.12,
  });
  const g = b.group;
  const CX = 0.35;
  const steel = mat(0xc9c6bd, { metal: 0.55, rough: 0.35 });
  const enc = new THREE.Group();
  enc.add(at(box(1.25, 0.32, 1.25, mat(0x2b2c31)), 0, 0.16, 0));
  enc.add(at(box(1.25, 0.32, 1.25, steel), 0, 0.48, 0));
  enc.add(at(cyl(0.36, 0.36, 0.65, mat(0xd8d4c8, { metal: 0.55, rough: 0.3 }), { seg: 24 }), 0, 0.64 + 0.32, 0));
  // thread rings
  for (let i = 0; i < 5; i++) enc.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 4, 24), steel), 0, 0.72 + i * 0.1, 0).rotateX(Math.PI / 2));
  b.on(enc, CX, 0);
  // knurled shaft (gear profile with a D-flat top marker)
  const shaft = new THREE.Group();
  const knurl = new THREE.Shape();
  const N = 24;
  for (let i = 0; i <= N * 2; i++) {
    const a = (i / (N * 2)) * Math.PI * 2;
    const r = i % 2 ? 0.26 : 0.3;
    i ? knurl.lineTo(Math.cos(a) * r, Math.sin(a) * r) : knurl.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const kg = new THREE.ExtrudeGeometry(knurl, { depth: 1.05, bevelEnabled: false });
  kg.rotateX(-Math.PI / 2);
  shaft.add(mesh(kg, mat(0xd6d2c6, { metal: 0.6, rough: 0.3 }), { edgeAngle: 60 }));
  const top = mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.02, 24), mat(0xe8e4d8, { metal: 0.5, rough: 0.3 }), { outline: false });
  shaft.add(at(top, 0, 1.06, 0));
  shaft.add(at(box(0.08, 0.03, 0.26, mat(0xe5412e), { outline: false }), 0, 1.075, -0.12));
  shaft.position.set(CX, b.top + 1.29, 0);
  g.add(shaft);
  smdField(b, [[-0.55, -0.6], [-0.55, 0.6], [1.0, 0, Math.PI / 2]]);
  const baseY = shaft.position.y;
  const api = freeApi(g, b.pinsLocal, pos, opts, { pick: g, anchor: V(CX, 3.0, 0) });
  let angle = 0, pressed = false;
  live(api, {
    get angle() { return angle; },
    get pressed() { return pressed; },
    /** Shaft angle in degrees (clockwise from above). 20 detents per turn = 18° each. */
    setAngle(deg) {
      angle = deg;
      shaft.rotation.y = -THREE.MathUtils.degToRad(deg);
      return api;
    },
    press(on = true) {
      pressed = !!on;
      shaft.position.y = baseY - (pressed ? 0.1 : 0);
      return api;
    },
  });
  return api;
}
