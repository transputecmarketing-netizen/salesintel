// Line-art renderer: turns any Tinker Lab scene into the look of a printed
// assembly manual. White toon faces with three or four flat shading steps,
// screen-space ink outlines of constant thickness (an inverted hull for the
// silhouette and LineSegments2 for creases), no shadows, a white page.
//
// The scene is converted in place, in "units" (one per assembly step). Each
// unit gets its own small set of materials so it can be drawn as:
//   'new'    pale yellow, bolder outline (the part you add in this step)
//   'normal' full ink (cover, thumbnails, finished build)
//   'old'    lighter grey (parts placed in earlier steps)
//   'hidden' not drawn (future steps)
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

export const ELEVATION = THREE.MathUtils.degToRad(38);
export const BASE_AZ = THREE.MathUtils.degToRad(28);

const INK = new THREE.Color('#16161a');
const INK_OLD = new THREE.Color('#a3a29c');
const TINT_NEW = new THREE.Color('#ffe9a3');

const STYLE = {
  new: { hull: 2.7, line: 1.55, ink: INK, fade: 0, tint: 0.9 },
  normal: { hull: 2.0, line: 1.15, ink: INK, fade: 0, tint: 0 },
  old: { hull: 1.5, line: 0.9, ink: INK_OLD, fade: 0.32, tint: 0 },
};

// ---------------------------------------------------------------- palette
const hsl = { h: 0, s: 0, l: 0 };
const srgb = (c) => new THREE.Color().setHex(c.getHex(THREE.SRGBColorSpace), THREE.SRGBColorSpace);

/** The pale face colour for an original material colour. family: face | wire | lens | metal */
export function paleColor(color, family = 'face') {
  const c = srgb(color);
  c.getHSL(hsl, THREE.SRGBColorSpace);
  const out = new THREE.Color();
  if (family === 'metal') return out.setHex(0xe8eaed, THREE.SRGBColorSpace);
  if (family === 'wire') {
    if (hsl.s < 0.18) {
      // black, white and grey wires: keep their value, softened
      const l = hsl.l < 0.35 ? 0.42 : hsl.l > 0.8 ? 0.97 : 0.75;
      return out.setHSL(0.6, 0.04, l, THREE.SRGBColorSpace);
    }
    return out.setHSL(hsl.h, Math.min(0.85, hsl.s * 0.9), 0.7, THREE.SRGBColorSpace);
  }
  if (family === 'lens') return out.setHSL(hsl.h, Math.min(0.8, hsl.s * 0.85), hsl.s < 0.15 ? 0.96 : 0.82, THREE.SRGBColorSpace);
  if (hsl.s < 0.16) {
    // neutrals: black plastic reads as a pale grey, light plastic as white
    const l = hsl.l < 0.3 ? 0.925 : hsl.l < 0.6 ? 0.95 : 0.995;
    return out.setHSL(0.6, 0.03, l, THREE.SRGBColorSpace);
  }
  return out.setHSL(hsl.h, Math.min(0.55, hsl.s) * 0.55, 0.935, THREE.SRGBColorSpace);
}

// ---------------------------------------------------------------- textures
const inkCanvases = new WeakMap();
const inkTextures = new Map();

/** A texture redrawn as ink on white (opaque) or ink on transparent (decals). */
function inkTexture(tex) {
  if (inkTextures.has(tex.uuid)) return inkTextures.get(tex.uuid);
  const img = tex.image;
  if (!img || !img.width || !img.height) return null;
  let entry = inkCanvases.get(img);
  if (!entry) {
    const scale = Math.min(1, 2048 / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    try {
      g.drawImage(img, 0, 0, w, h);
    } catch {
      return null;
    }
    const data = g.getImageData(0, 0, w, h);
    const d = data.data;
    let opaque = 0;
    const hist = new Map();
    for (let i = 0; i < d.length; i += 4 * 7) {
      if (d[i + 3] > 240) {
        opaque++;
        const k = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4);
        hist.set(k, (hist.get(k) ?? 0) + 1);
      }
    }
    const samples = Math.ceil(d.length / (4 * 7));
    const isOpaque = opaque > samples * 0.9;
    if (isOpaque) {
      let best = 0, bk = 0;
      for (const [k, n] of hist) if (n > best) { best = n; bk = k; }
      const br = ((bk >> 8) & 15) * 16 + 8, bg = ((bk >> 4) & 15) * 16 + 8, bb = (bk & 15) * 16 + 8;
      for (let i = 0; i < d.length; i += 4) {
        const dist = Math.hypot(d[i] - br, d[i + 1] - bg, d[i + 2] - bb) / 441;
        const a = THREE.MathUtils.smoothstep(dist, 0.07, 0.34) * 0.78;
        const v = Math.round(255 - a * (255 - 70));
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
    } else {
      for (let i = 0; i < d.length; i += 4) {
        d[i] = d[i + 1] = d[i + 2] = 64;
        d[i + 3] = Math.round(d[i + 3] * 0.62);
      }
    }
    g.putImageData(data, 0, 0);
    entry = { canvas: c, opaque: isOpaque };
    inkCanvases.set(img, entry);
  }
  const t = new THREE.CanvasTexture(entry.canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  for (const k of ['wrapS', 'wrapT', 'flipY', 'rotation']) t[k] = tex[k];
  t.repeat.copy(tex.repeat);
  t.offset.copy(tex.offset);
  t.center.copy(tex.center);
  t.updateMatrix();
  const out = { texture: t, opaque: entry.opaque };
  inkTextures.set(tex.uuid, out);
  return out;
}

// ---------------------------------------------------------------- shaders
const faceVert = /* glsl */ `
uniform mat3 uUvT;
varying vec3 vN;
varying vec2 vUv;
void main() {
  vec4 p = vec4(position, 1.0);
  vec3 n = normal;
  #ifdef USE_INSTANCING
    p = instanceMatrix * p;
    n = mat3(instanceMatrix) * n;
  #endif
  vN = normalize(mat3(modelMatrix) * n);
  vUv = (uUvT * vec3(uv, 1.0)).xy;
  gl_Position = projectionMatrix * modelViewMatrix * p;
}`;

const faceFrag = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uTint;
uniform float uTintAmt;
uniform float uFade;
uniform float uOpacity;
uniform float uDecal;
uniform float uHasMap;
uniform float uGlow;
uniform vec3 uGlowColor;
uniform sampler2D uMap;
varying vec3 vN;
varying vec2 vUv;
void main() {
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  float d = dot(n, normalize(vec3(0.3, 1.0, 0.7)));
  float shade = d > 0.74 ? 1.0 : (d > 0.42 ? 0.955 : (d > 0.08 ? 0.905 : 0.865));
  vec4 tx = uHasMap > 0.5 ? texture2D(uMap, vUv) : vec4(1.0);
  vec3 c;
  float a = uOpacity;
  if (uDecal > 0.5) { c = tx.rgb; a *= tx.a; }
  else c = uColor * tx.rgb * shade;
  c *= mix(vec3(1.0), uTint, uTintAmt);
  c = mix(c, vec3(1.0), uFade);
  c = mix(c, uGlowColor, uGlow);
  gl_FragColor = vec4(c, a);
  #include <colorspace_fragment>
}`;

const hullVert = /* glsl */ `
attribute vec3 hullDir;
uniform float uWidth;
uniform vec2 uRes;
void main() {
  vec4 p = vec4(position, 1.0);
  vec3 h = hullDir;
  #ifdef USE_INSTANCING
    p = instanceMatrix * p;
    h = mat3(instanceMatrix) * h;
  #endif
  vec4 clip = projectionMatrix * modelViewMatrix * p;
  vec3 n = normalize(normalMatrix * h);
  vec2 dir = n.xy;
  float l = length(dir);
  dir = l > 1e-4 ? dir / l : vec2(0.0);
  clip.xy += dir * uWidth * 2.0 / uRes * clip.w;
  gl_Position = clip;
}`;

const hullFrag = /* glsl */ `
uniform vec3 uColor;
void main() {
  gl_FragColor = vec4(uColor, 1.0);
  #include <colorspace_fragment>
}`;

const IDENT3 = new THREE.Matrix3();

function faceMaterial({ color, map = null, decal = false, side = THREE.FrontSide, tintScale = 1 }) {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color.clone() },
      uTint: { value: TINT_NEW.clone() },
      uTintAmt: { value: 0 },
      uFade: { value: 0 },
      uOpacity: { value: 1 },
      uDecal: { value: decal ? 1 : 0 },
      uHasMap: { value: map ? 1 : 0 },
      uMap: { value: map },
      uUvT: { value: map ? map.matrix : IDENT3 },
      uGlow: { value: 0 },
      uGlowColor: { value: new THREE.Color(1, 0.4, 0.3) },
    },
    vertexShader: faceVert,
    fragmentShader: faceFrag,
    side,
    transparent: decal,
    depthWrite: !decal,
    polygonOffset: !decal,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  m.userData.tintScale = tintScale;
  return m;
}

function hullMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: INK.clone() }, uWidth: { value: 2 }, uRes: { value: new THREE.Vector2(800, 600) } },
    vertexShader: hullVert,
    fragmentShader: hullFrag,
    side: THREE.BackSide,
  });
}

// ---------------------------------------------------------------- geometry helpers
const hullDone = new WeakSet();
/** Smooth "push-out" directions: normals averaged over every vertex sharing a position. */
function ensureHullDir(geo) {
  if (hullDone.has(geo) || geo.attributes.hullDir) return;
  hullDone.add(geo);
  const pos = geo.attributes.position;
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const nor = geo.attributes.normal;
  const sums = new Map();
  const keys = new Array(pos.count);
  const q = (v) => Math.round(v * 2000);
  for (let i = 0; i < pos.count; i++) {
    const k = `${q(pos.getX(i))},${q(pos.getY(i))},${q(pos.getZ(i))}`;
    keys[i] = k;
    let s = sums.get(k);
    if (!s) sums.set(k, (s = [0, 0, 0]));
    s[0] += nor.getX(i);
    s[1] += nor.getY(i);
    s[2] += nor.getZ(i);
  }
  const arr = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const s = sums.get(keys[i]);
    let l = Math.hypot(s[0], s[1], s[2]);
    if (l < 1e-6) { s[0] = nor.getX(i); s[1] = nor.getY(i); s[2] = nor.getZ(i); l = Math.hypot(...s) || 1; }
    arr[i * 3] = s[0] / l;
    arr[i * 3 + 1] = s[1] / l;
    arr[i * 3 + 2] = s[2] / l;
  }
  geo.setAttribute('hullDir', new THREE.BufferAttribute(arr, 3));
}

const edgeCache = new WeakMap();
function edgesOf(geo) {
  if (edgeCache.has(geo)) return edgeCache.get(geo);
  let arr = null;
  const t = geo.type;
  const smooth = t === 'TubeGeometry' || t === 'SphereGeometry' || t === 'CapsuleGeometry' || t === 'TorusGeometry' || t === 'LatheGeometry'
    || (t === 'CylinderGeometry' && (geo.parameters?.radialSegments ?? 32) <= 10);
  if (!smooth) {
    try {
      arr = new THREE.EdgesGeometry(geo, 33).attributes.position.array;
    } catch {
      arr = null;
    }
  }
  edgeCache.set(geo, arr);
  return arr;
}

function geoSize(geo, scale) {
  if (!geo.boundingBox) geo.computeBoundingBox();
  const s = geo.boundingBox.getSize(new THREE.Vector3()).multiply(scale);
  return [Math.abs(s.x), Math.abs(s.y), Math.abs(s.z)].sort((a, b) => a - b);
}

function isHiddenMaterial(m) {
  if (!m || m.visible === false) return true;
  if (m.isShadowMaterial || m.isPointsMaterial || m.isLineBasicMaterial || m.isSpriteMaterial) return true;
  if (m.blending === THREE.AdditiveBlending) return true;
  if (m.transparent && m.opacity < 0.25 && !m.map) return true;
  return false;
}

// ---------------------------------------------------------------- conversion
const tmpM = new THREE.Matrix4();
const tmpI = new THREE.Matrix4();
const tmpV = new THREE.Vector3();
const tmpS = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpP = new THREE.Vector3();

class Unit {
  constructor(index, opts) {
    this.index = index;
    this.objects = [];
    this.family = opts.family ?? null;
    this.faces = new Map();
    this.hulls = [hullMaterial(), hullMaterial(), hullMaterial()]; // weights: thin, mid, full
    this.weights = [0.38, 0.7, 1];
    this.lines = new LineMaterial({ color: INK.getHex(), linewidth: 1.2, worldUnits: false });
    this.edges = [];
    this.wires = [];
    this.state = 'normal';
  }

  face(key, make) {
    let m = this.faces.get(key);
    if (!m) this.faces.set(key, (m = make()));
    return m;
  }

  setState(state, res) {
    this.state = state;
    const vis = state !== 'hidden';
    for (const o of this.objects) o.visible = vis;
    if (!vis) return;
    const s = STYLE[state] ?? STYLE.normal;
    for (const m of this.faces.values()) {
      m.uniforms.uTintAmt.value = s.tint * (m.userData.tintScale ?? 1);
      m.uniforms.uFade.value = m.uniforms.uDecal.value > 0.5 ? s.fade * 1.4 : s.fade;
    }
    this.hulls.forEach((h, i) => {
      h.uniforms.uColor.value.copy(s.ink);
      h.uniforms.uWidth.value = s.hull * this.weights[i];
      if (res) h.uniforms.uRes.value.copy(res);
    });
    this.lines.color.copy(s.ink);
    this.lines.linewidth = s.line;
    if (res) this.lines.resolution.copy(res);
  }
}

/**
 * Convert `root` (already in its final pose) into line art.
 * @param {THREE.Object3D} root
 * @param {{ units?: Array<{ objects: THREE.Object3D[], family?: string, perMesh?: boolean }> }} opts
 * @returns {{ units: Unit[], setState(i, state), setAll(state), setResolution(w, h), dispose() }}
 */
export function toLineArt(root, { units: specs = [] } = {}) {
  root.updateMatrixWorld(true);
  const owner = new Map();
  const units = specs.map((s, i) => {
    const u = new Unit(i, s);
    u.objects = s.objects.slice();
    u.perMesh = !!s.perMesh;
    for (const o of s.objects) owner.set(o, u);
    return u;
  });
  // anything not claimed by a unit becomes one more unit, always drawn normally
  const rest = new Unit(units.length, {});
  for (const c of root.children) if (!owner.has(c)) { rest.objects.push(c); owner.set(c, rest); }
  const all = [...units, rest];

  for (const u of all) {
    for (const top of u.objects) {
      const segs = [];
      tmpI.copy(top.matrixWorld).invert();
      const visit = (o, hidden) => {
        if (o.userData.la) return;
        if (!o.visible) hidden = true;
        if (o.isSprite || o.isPoints || o.isLight) { o.visible = false; return; }
        if ((o.isLine || o.isLineSegments) && !o.isLineSegments2) { o.visible = false; return; }
        // objects only a lesson's virtual camera sees (layer 1) are left alone
        if (o.isMesh && !hidden && o.layers.isEnabled(0)) convertMesh(o, u, segs);
        for (const c of [...o.children]) visit(c, hidden);
      };
      visit(top, false);
      if (!u.perMesh && segs.length) {
        const g = new LineSegmentsGeometry();
        g.setPositions(new Float32Array(segs));
        const ls = new LineSegments2(g, u.lines);
        ls.userData.la = true;
        ls.raycast = () => {};
        top.add(ls);
        u.edges.push(ls);
      }
    }
  }

  function convertMesh(mesh, u, segs) {
    const src = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const out = [];
    let anySolid = false, anyShown = false;
    const wireTube = u.family === 'wire' && mesh.geometry.type === 'TubeGeometry';
    for (const m of src) {
      if (isHiddenMaterial(m)) { out.push(HIDDEN); continue; }
      anyShown = true;
      const map = m.map ? inkTexture(m.map) : null;
      const decal = !!(map && !map.opaque) || (m.transparent && m.map && !map);
      if (!decal) anySolid = true;
      const metal = (m.metalness ?? 0) >= 0.3;
      const lens = !!(m.emissive && m.emissive.getHex() !== 0 && m.emissive.equals?.(m.color));
      const family = wireTube ? 'wire' : metal ? 'metal' : lens ? 'lens' : 'face';
      const base = m.color ? paleColor(m.color, family) : new THREE.Color(1, 1, 1);
      if (map?.opaque && family === 'face') base.lerp(new THREE.Color(1, 1, 1), 0.5);
      const side = m.side ?? THREE.FrontSide;
      const key = `${base.getHexString()}|${map?.texture.uuid ?? ''}|${decal}|${side}`;
      out.push(u.face(key, () => faceMaterial({ color: base, map: map?.texture ?? null, decal, side, tintScale: family === 'wire' ? 0.12 : family === 'lens' ? 0.4 : 1 })));
    }
    if (!anyShown) { mesh.visible = false; return; }
    mesh.material = Array.isArray(mesh.material) ? out : out[0];
    mesh.castShadow = mesh.receiveShadow = false;
    mesh.userData.la = true;
    if (!anySolid) return;

    // silhouette: inverted hull, thinner for tiny parts
    mesh.getWorldScale(tmpS);
    const size = geoSize(mesh.geometry, tmpS);
    if (size[2] < 1e-4) return;
    const flat = size[0] < 0.004;
    if (!flat) {
      ensureHullDir(mesh.geometry);
      const med = size[1];
      const wi = wireTube ? 1 : med < 0.09 ? 0 : med < 0.3 ? 1 : 2;
      const hull = mesh.isInstancedMesh
        ? new THREE.InstancedMesh(mesh.geometry, u.hulls[wi], mesh.count)
        : new THREE.Mesh(mesh.geometry, u.hulls[wi]);
      if (mesh.isInstancedMesh) hull.instanceMatrix = mesh.instanceMatrix;
      hull.userData.la = true;
      hull.raycast = () => {};
      hull.frustumCulled = mesh.frustumCulled;
      mesh.add(hull);
    }
    // creases: hard edges as screen-space lines
    if (size[1] < 0.075 && size[2] < 0.5) return;
    const e = edgesOf(mesh.geometry);
    if (!e || !e.length) return;
    if (u.perMesh) {
      const g = new LineSegmentsGeometry();
      if (mesh.isInstancedMesh) {
        const s = [];
        pushEdges(s, e, mesh, new THREE.Matrix4());
        g.setPositions(new Float32Array(s));
      } else g.setPositions(e);
      const ls = new LineSegments2(g, u.lines);
      ls.userData.la = true;
      ls.raycast = () => {};
      mesh.add(ls);
      u.edges.push(ls);
    } else {
      tmpM.multiplyMatrices(tmpI, mesh.matrixWorld);
      pushEdges(segs, e, mesh, tmpM);
    }
  }

  function pushEdges(segs, e, mesh, m) {
    const mats = [];
    if (mesh.isInstancedMesh) {
      const im = new THREE.Matrix4();
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, im);
        mats.push(new THREE.Matrix4().multiplyMatrices(m, im));
      }
    } else mats.push(m);
    for (const mm of mats)
      for (let i = 0; i < e.length; i += 3) {
        tmpP.set(e[i], e[i + 1], e[i + 2]).applyMatrix4(mm);
        segs.push(tmpP.x, tmpP.y, tmpP.z);
      }
  }

  const res = new THREE.Vector2(800, 600);
  for (const u of all) u.setState('normal', res);
  return {
    units,
    rest,
    setState(i, state) { units[i]?.setState(state, res); },
    setAll(state) { for (const u of units) u.setState(state, res); },
    setResolution(w, h) {
      res.set(w, h);
      for (const u of all) u.setState(u.state, res);
    },
    dispose() {
      for (const u of all) {
        for (const m of u.faces.values()) m.dispose();
        for (const h of u.hulls) h.dispose();
        u.lines.dispose();
        for (const e of u.edges) e.geometry.dispose();
      }
    },
  };
}

const HIDDEN = new THREE.MeshBasicMaterial({ visible: false });

// ---------------------------------------------------------------- bounds & camera
/** Bounds of what is actually drawn (ignores glows, hidden and helper objects). */
export function visibleBox(objects, box = new THREE.Box3()) {
  const b = new THREE.Box3();
  for (const obj of [].concat(objects)) {
    obj.updateWorldMatrix(true, true);
    obj.traverseVisible((o) => {
      if (!o.isMesh || o.isSprite || o.userData.la && o.material?.side === THREE.BackSide) return;
      if (!o.layers.isEnabled(0)) return;
      if (o.isLineSegments2 || o.userData.noBounds) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (mats.every((m) => isHiddenMaterial(m))) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      if (o.isInstancedMesh) {
        const im = new THREE.Matrix4();
        for (let i = 0; i < o.count; i++) {
          o.getMatrixAt(i, im);
          b.copy(o.geometry.boundingBox).applyMatrix4(im).applyMatrix4(o.matrixWorld);
          box.union(b);
        }
      } else {
        b.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
        box.union(b);
      }
    });
  }
  return box;
}

/** Camera placement that fits `box` into a w×h viewport. Returns { target, half }. */
export function fitBox(box, aspect, az = BASE_AZ, pad = 1.12, elevation = ELEVATION) {
  const c = box.getCenter(new THREE.Vector3());
  const right = new THREE.Vector3(Math.cos(az), 0, -Math.sin(az));
  const up = new THREE.Vector3(-Math.sin(elevation) * Math.sin(az), Math.cos(elevation), -Math.sin(elevation) * Math.cos(az));
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    tmpV.set(x - c.x, y - c.y, z - c.z);
    const px = tmpV.dot(right), py = tmpV.dot(up);
    minX = Math.min(minX, px); maxX = Math.max(maxX, px);
    minY = Math.min(minY, py); maxY = Math.max(maxY, py);
  }
  // re-centre on the projected box
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const target = c.clone().addScaledVector(right, cx).addScaledVector(up, cy);
  const hx = (maxX - minX) / 2, hy = (maxY - minY) / 2;
  const half = Math.max(hy, hx / aspect, 0.3) * pad;
  return { target, half };
}

/** Apply a { target, half } view to an orthographic camera. */
export function applyView(camera, view, aspect, az = BASE_AZ, elevation = ELEVATION) {
  const d = 80;
  const t = view.target;
  camera.position.set(
    t.x + Math.sin(az) * Math.cos(elevation) * d,
    t.y + Math.sin(elevation) * d,
    t.z + Math.cos(az) * Math.cos(elevation) * d,
  );
  camera.up.set(0, 1, 0);
  camera.lookAt(t);
  camera.left = -view.half * aspect;
  camera.right = view.half * aspect;
  camera.top = view.half;
  camera.bottom = -view.half;
  camera.near = 1;
  camera.far = 200;
  camera.zoom = 1;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}

/** A WebGL renderer set up for line art on white. */
export function makeRenderer(canvas, { preserve = false } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: preserve });
  r.setClearColor(0xffffff, 1);
  r.toneMapping = THREE.NoToneMapping;
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.shadowMap.enabled = false;
  return r;
}

/** Project a world point to CSS pixels of a w×h viewport. */
export function toScreen(v, camera, w, h) {
  const p = v.clone().project(camera);
  return { x: ((p.x + 1) / 2) * w, y: ((1 - p.y) / 2) * h };
}
