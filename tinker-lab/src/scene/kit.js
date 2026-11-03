// Shared building blocks for the illustrated 3D look: flat-ish materials,
// dark ink outlines, canvas textures and a few geometry helpers.
import * as THREE from 'three';

export const INK = 0x1d2440;
const edgeMat = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.6 });
const matCache = new Map();

/** Cached standard material. */
export function mat(color, opts = {}) {
  const key = `${color}|${JSON.stringify(opts)}`;
  if (!opts.unique && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.rough ?? 0.62,
    metalness: opts.metal ?? 0,
    transparent: !!opts.opacity && opts.opacity < 1,
    opacity: opts.opacity ?? 1,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    map: opts.map ?? null,
    side: opts.side ?? THREE.FrontSide,
  });
  if (!opts.unique) matCache.set(key, m);
  return m;
}

export const metal = () => mat(0xc9c6bd, { rough: 0.35, metal: 0.55 });
export const darkMetal = () => mat(0x8f8d86, { rough: 0.4, metal: 0.5 });
export const plastic = (c) => mat(c, { rough: 0.7 });

/** Mesh with optional ink outline and shadows. */
export function mesh(geom, material, opts = {}) {
  const m = new THREE.Mesh(geom, material);
  m.castShadow = opts.shadow !== false;
  m.receiveShadow = opts.receive !== false;
  if (opts.outline !== false) {
    const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geom, opts.edgeAngle ?? 32), edgeMat);
    lines.raycast = () => {};
    lines.userData.outline = true;
    m.add(lines);
  }
  return m;
}

export function box(w, h, d, material, opts) {
  return mesh(new THREE.BoxGeometry(w, h, d), material, opts);
}

export function cyl(rTop, rBot, h, material, opts = {}) {
  return mesh(
    new THREE.CylinderGeometry(rTop, rBot, h, opts.seg ?? 24, 1, false, opts.thetaStart ?? 0, opts.thetaLength ?? Math.PI * 2),
    material,
    opts,
  );
}

/** Place an object and return it (chainable helper). */
export function at(obj, x = 0, y = 0, z = 0) {
  obj.position.set(x, y, z);
  return obj;
}

/** Thin straight leg / pin between two points. */
export function rod(a, b, r = 0.025, material = metal()) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), material);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = true;
  return m;
}

/** Bent leg following a polyline (smooth tube). */
export function bentLeg(points, r = 0.025, material = metal()) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.05);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, r, 6, false), material);
  m.castShadow = true;
  return m;
}

/** Canvas texture helper. draw(ctx, w, h) */
export function canvasTexture(w, h, draw, opts = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (opts.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...opts.repeat);
  }
  return t;
}

let glowTex;
/** Soft additive glow sprite, used for lit LEDs. */
export function glowSprite(color = 0xff3b2f, size = 1.6) {
  glowTex ??= canvasTexture(128, 128, (ctx, w) => {
    const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, w);
  });
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }),
  );
  s.scale.setScalar(size);
  s.raycast = () => {};
  s.userData.baseSize = size;
  return s;
}

/** Flat glow decal lying on a surface (light pooling under a lit LED). */
export function glowPool(color = 0xff3b2f, size = 3) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: glowSprite().material.map, color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.raycast = () => {};
  return m;
}

export function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Flat slab from a 2D shape, lying in the XZ plane, bottom at y=0. */
export function slab(shape, depth, material, opts) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 8 });
  g.rotateX(-Math.PI / 2);
  return mesh(g, material, opts);
}

export const COLORS = {
  red: 0xe5412e,
  green: 0x3fbf5f,
  yellow: 0xf5c02a,
  blue: 0x3b78e7,
  white: 0xf3f1e8,
  orange: 0xf08a2c,
};
