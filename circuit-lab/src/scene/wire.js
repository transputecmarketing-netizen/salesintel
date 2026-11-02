// Jumper wires: a smooth arc between two sockets, with plug heads at each end
// and optional "current flow" dots that travel along it.
import * as THREE from 'three';
import { mat, mesh, cyl } from './kit.js';

export const WIRE = {
  red: 0xd8443a,
  black: 0x2a2c33,
  orange: 0xef8a2b,
  yellow: 0xf2c230,
  green: 0x3aa65a,
  blue: 0x3a6fd0,
  white: 0xece8dc,
  brown: 0x7a4a26,
  purple: 0x8a5cc6,
};

const dotGeom = new THREE.SphereGeometry(0.07, 10, 8);

export function makeWire(a, b, color = 'orange', opts = {}) {
  const g = new THREE.Group();
  const hex = WIRE[color] ?? color;
  const up = new THREE.Vector3(0, 1, 0);
  const dist = a.distanceTo(b);
  const lift = opts.lift ?? Math.min(3.2, 0.9 + dist * 0.22);
  const a1 = a.clone().addScaledVector(up, 0.45);
  const b1 = b.clone().addScaledVector(up, 0.45);
  const peak = a1.clone().lerp(b1, 0.5);
  peak.y = Math.max(a1.y, b1.y) + lift - 0.45;
  if (opts.bend) peak.add(opts.bend);
  const curve = new THREE.CatmullRomCurve3([
    a.clone(),
    a.clone().addScaledVector(up, 0.25),
    a1.clone().addScaledVector(up, lift * 0.35),
    peak,
    b1.clone().addScaledVector(up, lift * 0.35),
    b.clone().addScaledVector(up, 0.25),
    b.clone(),
  ], false, 'centripetal');
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.075, 10, false), mat(hex, { rough: 0.45 }));
  tube.castShadow = true;
  g.add(tube);
  // plug heads
  for (const p of [a, b]) {
    const head = cyl(0.1, 0.1, 0.42, mat(0x202228, { rough: 0.6 }), { seg: 12 });
    head.position.copy(p).addScaledVector(up, 0.25);
    g.add(head);
    const collar = cyl(0.085, 0.085, 0.08, mat(hex), { seg: 12, outline: false });
    collar.position.copy(p).addScaledVector(up, 0.5);
    g.add(collar);
  }
  // flow dots
  const N = Math.max(4, Math.round(curve.getLength() / 0.8));
  const dots = new THREE.InstancedMesh(dotGeom, new THREE.MeshBasicMaterial({ color: 0xfff6d8 }), N);
  dots.visible = false;
  dots.raycast = () => {};
  g.add(dots);
  const tmp = new THREE.Object3D();
  let phase = Math.random();

  const api = {
    group: g,
    curve,
    pick: tube,
    mid: curve.getPoint(0.5),
    chipAt: curve.getPoint(opts.chipT ?? 0.74),
    color,
    signal: opts.signal ?? null,
    live: false,
    /** Direction of conventional current: 1 = a→b, -1 = b→a */
    dir: opts.dir ?? 1,
    speed: 1,
    tick(dt, flowOn) {
      const show = flowOn && api.live;
      dots.visible = show;
      if (!show) return;
      phase = (phase + dt * 0.35 * api.speed * api.dir + 1) % 1;
      for (let i = 0; i < N; i++) {
        const t = (i / N + phase) % 1;
        tmp.position.copy(curve.getPointAt(t));
        tmp.updateMatrix();
        dots.setMatrixAt(i, tmp.matrix);
      }
      dots.instanceMatrix.needsUpdate = true;
    },
  };
  return api;
}

/** Straight-ish short jumper lying flat on the breadboard (for row bridges). */
export function makeJumper(a, b, color = 'red') {
  return makeWire(a, b, color, { lift: 0.25 });
}

export { mesh };
