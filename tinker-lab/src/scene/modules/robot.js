// 2-wheel-drive robot chassis that lessons can drive around.
import { THREE, V, mat, mesh, box, cyl, at, metal, slab, canvasTexture, decal, noRay } from './common.js';

/**
 * Small 2WD robot: clear acrylic plate, two yellow TT gear motors with wheels
 * (rear), ball caster (front), 4×AA battery pack. Forward is local +Z; `pos` is
 * the ground point under the middle of the drive axle. opts: rotY, speed
 * (cm/s at full power, default 14), color (acrylic tint).
 * API: setWheels(left, right) in −1..1, tick(dt), reset(), deck (Group on the
 * plate top that moves with the car — add an Uno etc. there), deckY.
 */
export function makeRobotCar(pos, opts = {}) {
  const g = new THREE.Group();
  const WR = 3.3; // wheel radius
  const TRACK = 9.6; // wheel centre to wheel centre
  const PLATE_Y = WR + 1.05;
  const PT = 0.3;
  // ---- acrylic plate (shape y → −z)
  const pts = [[-3.25, -3.9], [3.25, -3.9], [3.25, 3.7], [5.4, 4.6], [5.4, 10.4], [3.6, 12.3], [-3.6, 12.3], [-5.4, 10.4], [-5.4, 4.6], [-3.25, 3.7]];
  const shape = new THREE.Shape();
  pts.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)));
  shape.closePath();
  const slot = (x, z, w, d) => {
    const p = new THREE.Path();
    p.moveTo(x - w / 2, -(z - d / 2));
    p.lineTo(x + w / 2, -(z - d / 2));
    p.lineTo(x + w / 2, -(z + d / 2));
    p.lineTo(x - w / 2, -(z + d / 2));
    p.closePath();
    shape.holes.push(p);
  };
  slot(-1.6, -2.6, 0.9, 0.35);
  slot(1.6, -2.6, 0.9, 0.35);
  slot(0, 11.2, 1.6, 0.35);
  slot(-4.3, 7.5, 0.35, 1.6);
  slot(4.3, 7.5, 0.35, 1.6);
  const acrylic = mat(opts.color ?? 0xbfe6ff, { rough: 0.15, opacity: 0.55 });
  const plate = slab(shape, PT, acrylic);
  plate.position.y = PLATE_Y;
  g.add(plate);
  const deckY = PLATE_Y + PT;
  // ---- TT motors + wheels
  const yellow = mat(0xf2c230, { rough: 0.5 });
  const wheels = [];
  for (const s of [1, -1]) {
    // gearbox (axle at z = 0), motor can pointing forward
    const mx = s * 2.15;
    g.add(at(box(1.9, 2.2, 4.4, yellow), mx, WR, 1.1));
    g.add(at(box(1.92, 0.12, 0.5, mat(0xe0b020), { outline: false }), mx, WR + 1.1, -0.7));
    const can = cyl(0.95, 0.95, 2.2, metal(), { seg: 24 });
    can.rotation.x = Math.PI / 2;
    g.add(at(can, mx, WR, 4.4));
    const capEnd = cyl(0.7, 0.7, 0.2, mat(0xf3f1e8), { seg: 24 });
    capEnd.rotation.x = Math.PI / 2;
    g.add(at(capEnd, mx, WR, 5.6));
    // motor leads (red / black) up to the plate
    for (const [dx, c] of [[-0.3, 0xd8443a], [0.3, 0x2a2c33]]) {
      const curve = new THREE.CatmullRomCurve3([V(mx + dx, WR + 0.3, 5.7), V(mx + dx, WR + 0.9, 6.2), V(mx * 0.6 + dx, PLATE_Y - 0.1, 6.6)]);
      const w = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.05, 6, false), mat(c));
      g.add(w);
    }
    // wheel
    const wheel = new THREE.Group();
    const tyre = cyl(WR, WR, 2.6, mat(0x26272c, { rough: 0.8 }), { seg: 40 });
    tyre.rotation.z = Math.PI / 2;
    wheel.add(tyre);
    // tread blocks
    const treadGeo = new THREE.BoxGeometry(2.62, 0.18, 0.5);
    const tread = new THREE.InstancedMesh(treadGeo, mat(0x1c1d21, { rough: 0.85 }), 20);
    const t = new THREE.Object3D();
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      t.position.set(0, Math.cos(a) * (WR + 0.04), Math.sin(a) * (WR + 0.04));
      t.rotation.set(a, 0, 0);
      t.updateMatrix();
      tread.setMatrixAt(i, t.matrix);
    }
    wheel.add(tread);
    const rim = cyl(2.25, 2.25, 2.66, yellow, { seg: 32 });
    rim.rotation.z = Math.PI / 2;
    wheel.add(rim);
    for (let i = 0; i < 6; i++) {
      const spoke = box(0.1, 4.2, 0.45, mat(0xd9a91f), { outline: false });
      spoke.rotation.x = (i / 6) * Math.PI;
      spoke.position.x = s * 1.34;
      wheel.add(spoke);
    }
    const hub = cyl(0.55, 0.55, 2.8, mat(0xf3f1e8), { seg: 16 });
    hub.rotation.z = Math.PI / 2;
    wheel.add(hub);
    wheel.position.set((s * TRACK) / 2, WR, 0);
    g.add(wheel);
    wheels.push(wheel);
  }
  // ---- caster at the front
  const CZ = 9.8;
  for (const dx of [-0.9, 0.9]) g.add(at(cyl(0.22, 0.22, PLATE_Y - 1.6, mat(0xd8b45a, { metal: 0.5, rough: 0.35 }), { seg: 6 }), dx, 1.6 + (PLATE_Y - 1.6) / 2, CZ));
  g.add(at(box(2.4, 0.25, 1.0, metal()), 0, 1.6, CZ));
  g.add(at(cyl(0.95, 0.85, 0.5, metal(), { seg: 24 }), 0, 1.25, CZ));
  g.add(at(mesh(new THREE.SphereGeometry(0.8, 20, 14), mat(0xdedbd2, { metal: 0.6, rough: 0.2 })), 0, 0.8, CZ));
  // ---- 4×AA battery holder on the rear of the deck
  const bat = new THREE.Group();
  bat.add(at(box(5.8, 1.55, 6.0, mat(0x24252a, { rough: 0.6 })), 0, 0.78, 0));
  const cellCols = [0x3a6fd0, 0x3a6fd0, 0x3a6fd0, 0x3a6fd0];
  cellCols.forEach((c, i) => {
    const cell = cyl(0.68, 0.68, 4.9, mat(c, { rough: 0.4 }), { seg: 20 });
    cell.rotation.x = Math.PI / 2;
    bat.add(at(cell, -2.1 + i * 1.4, 1.2, 0));
    const tipM = cyl(0.25, 0.25, 0.15, metal(), { seg: 12, outline: false });
    tipM.rotation.x = Math.PI / 2;
    bat.add(at(tipM, -2.1 + i * 1.4, 1.2, i % 2 ? -2.5 : 2.5));
    const band = cyl(0.69, 0.69, 1.2, mat(0x2a2c33), { seg: 20, outline: false });
    band.rotation.x = Math.PI / 2;
    bat.add(at(band, -2.1 + i * 1.4, 1.2, i % 2 ? 1.9 : -1.9));
  });
  for (const [dx, c] of [[-0.3, 0xd8443a], [0.3, 0x2a2c33]]) {
    const curve = new THREE.CatmullRomCurve3([V(2.9, 0.6, 2.6 + dx), V(3.4, 0.5, 3.4 + dx), V(2.5, 0.15, 4.4 + dx)]);
    bat.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.06, 6, false), mat(c)));
  }
  bat.position.set(0, deckY, -0.3);
  g.add(bat);
  // a power switch
  g.add(at(box(1.0, 0.45, 0.6, mat(0x24252a)), 3.6, deckY + 0.22, 5.0));
  g.add(at(box(0.25, 0.3, 0.2, mat(0xf3f1e8), { outline: false }), 3.6, deckY + 0.55, 5.0));
  // deck mount (lessons place the board here)
  const deck = new THREE.Group();
  deck.position.set(0, deckY, 8.2);
  g.add(deck);

  // ---- motion
  const start = { pos: (pos ?? V()).clone(), rot: opts.rotY ?? 0 };
  g.position.copy(start.pos);
  g.rotation.y = start.rot;
  g.updateMatrixWorld(true);
  const maxV = opts.speed ?? 14;
  const anchorLocal = V(0, deckY + 3.2, 4);
  const anchor = g.localToWorld(anchorLocal.clone());
  let left = 0, right = 0, odoL = 0, odoR = 0;
  const api = {
    group: g,
    pick: g,
    anchor,
    kind: 'module',
    label: '2WD robot car chassis',
    deck,
    deckY,
    track: TRACK,
    wheelRadius: WR,
    get left() { return left; },
    get right() { return right; },
    get heading() { return g.rotation.y; },
    get position() { return g.position.clone(); },
    /** Wheel power, −1 (full reverse) .. 1 (full forward). */
    setWheels(l, r) {
      left = Math.max(-1, Math.min(1, +l || 0));
      right = Math.max(-1, Math.min(1, +r || 0));
      return api;
    },
    stop() { return api.setWheels(0, 0); },
    /** Differential-drive integration + wheel spin. */
    tick(dt) {
      const vl = left * maxV, vr = right * maxV;
      const v = (vl + vr) / 2;
      const w = (vr - vl) / TRACK; // +ve → turn left (counter-clockwise from above)
      const h = g.rotation.y + (w * dt) / 2;
      g.position.x += Math.sin(h) * v * dt;
      g.position.z += Math.cos(h) * v * dt;
      g.rotation.y += w * dt;
      odoL += (vl * dt) / WR;
      odoR += (vr * dt) / WR;
      wheels[0].rotation.x = odoL; // left wheel is at +x (car faces +z)
      wheels[1].rotation.x = odoR;
      g.updateMatrixWorld(true);
      anchor.copy(g.localToWorld(anchorLocal.clone()));
    },
    /** Back to the starting pose, wheels stopped. */
    reset() {
      left = right = 0;
      g.position.copy(start.pos);
      g.rotation.y = start.rot;
      g.updateMatrixWorld(true);
      anchor.copy(g.localToWorld(anchorLocal.clone()));
      return api;
    },
  };
  return api;
}
