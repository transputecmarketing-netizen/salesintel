// Professional office / interior family (three.js, rendered with SwiftShader in headless Chromium).
// Reads window.BRAND and window.SPEC. Scenes: exec, brandwall, library, meeting, studio.
// The brand sign sits on the wall, high and to one side; the middle of the frame stays plain wall.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
RectAreaLightUniformsLib.init();

const P = BRAND.colors, S = SPEC.design, W = 1920, H = 1080;
const hex = h => new THREE.Color(h).getHex();
const rgbArr = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a, b, t) => '#' + rgbArr(a).map((x, i) => Math.max(0, Math.min(255, Math.round(x + (rgbArr(b)[i] - x) * t))).toString(16).padStart(2, '0')).join('');
const shade = (t) => hex(mixHex('#000000', P.base, t));      // brand-tinted darks for walls and furniture
const tint = (t) => rgbArr(mixHex('#000000', P.base, t));

await document.fonts.ready;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('art').prepend(renderer.domElement);
const scene = new THREE.Scene();
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const cam = new THREE.PerspectiveCamera(44, W / H, 0.05, 80);

// Brand lockup (logo + optional wordmark) drawn white onto a canvas, plus a coloured halo
async function logoTextures(px = 2400) {
  const img = new Image(); img.src = BRAND._logo_url; await img.decode();
  const ar = (img.naturalWidth || 200) / (img.naturalHeight || 13);
  const pad = 120; let lh, tw = 0, gap = 0, fs = 0;
  if (BRAND.wordmark) { lh = Math.round(px * .2); fs = Math.round(lh * .42); gap = Math.round(lh * .35); }
  else lh = Math.round(px / ar);
  const meas = document.createElement('canvas').getContext('2d');
  if (BRAND.wordmark) { meas.font = `500 ${fs}px ${BRAND._mono}`; meas.letterSpacing = `${fs * .2}px`; tw = meas.measureText(BRAND.wordmark).width; }
  const lw = BRAND.wordmark ? lh * ar : px;
  const c = document.createElement('canvas'); c.width = Math.round(lw + gap + tw + pad * 2); c.height = lh + pad * 2; const g = c.getContext('2d');
  g.drawImage(img, pad, pad, lw, lh);
  if (BRAND.wordmark) { g.font = `500 ${fs}px ${BRAND._mono}`; g.letterSpacing = `${fs * .2}px`; g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(BRAND.wordmark, pad + lw + gap, pad + lh / 2); }
  const sharp = new THREE.CanvasTexture(c); sharp.colorSpace = THREE.SRGBColorSpace; sharp.anisotropy = 8;
  const c2 = document.createElement('canvas'); c2.width = c.width; c2.height = c.height; const g2 = c2.getContext('2d');
  g2.filter = 'blur(26px)'; g2.drawImage(c, 0, 0); g2.drawImage(c, 0, 0); g2.globalCompositeOperation = 'source-in';
  const lg = g2.createLinearGradient(0, 0, c2.width, 0); lg.addColorStop(0, P.cyan); lg.addColorStop(1, P.vivid); g2.fillStyle = lg; g2.fillRect(0, 0, c2.width, c2.height);
  const halo = new THREE.CanvasTexture(c2); halo.colorSpace = THREE.SRGBColorSpace;
  return { sharp, halo, aspect: c.width / c.height };
}
function floor(y = 0, col = 0x22262f, rough = .42, refl = .14) {
  const r = new Reflector(new THREE.PlaneGeometry(40, 40), { textureWidth: 1024, textureHeight: 576, color: 0x8a92a6 });
  r.rotation.x = -Math.PI / 2; r.position.y = y; scene.add(r);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: col, roughness: rough, metalness: .05, transparent: true, opacity: 1 - refl }));
  f.rotation.x = -Math.PI / 2; f.position.y = y + .003; f.receiveShadow = true; scene.add(f);
}
const signs = [];
function sign(tex, x, y, z, width, haloK = 1.4) {
  width = Math.min(width, 2.6 * Math.min(1, tex.aspect / 6)); // square-ish lockups get a smaller sign
  const h = width / tex.aspect;
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(width * 1.04, h * 1.04), new THREE.MeshBasicMaterial({ map: tex.halo, transparent: true, blending: THREE.AdditiveBlending, opacity: haloK, depthWrite: false }));
  halo.position.set(x, y, z + .005); scene.add(halo);
  const letters = new THREE.Mesh(new THREE.PlaneGeometry(width, h), new THREE.MeshStandardMaterial({ map: tex.sharp, transparent: true, color: 0xf2f5fa, roughness: .35, metalness: .6, emissive: 0x9fb4d6, emissiveMap: tex.sharp, emissiveIntensity: .25 }));
  letters.position.set(x, y, z + .06); letters.castShadow = true; scene.add(letters); signs.push(halo, letters);
}
function downlight(x, y, z, tx, ty, tz, intensity = 30, col = 0xeef3ff) {
  const s = new THREE.SpotLight(col, intensity, 9, .42, .85, 2); s.position.set(x, y, z); s.target.position.set(tx, ty, tz);
  s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -.0004; scene.add(s, s.target);
  const can = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .02, 24), new THREE.MeshBasicMaterial({ color: 0xffffff })); can.position.set(x, y + .01, z); scene.add(can);
}
function canvasTex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; }
let seed = SPEC.seed || 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const woodTex = (base = [92, 58, 36]) => canvasTex(256, 1024, (g, w, h) => { g.fillStyle = `rgb(${base})`; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { const x = rnd() * w, a = rnd() * .14; g.strokeStyle = `rgba(${rnd() > .5 ? '30,16,8' : '160,110,70'},${a})`; g.lineWidth = .6 + rnd() * 2.4; g.beginPath(); g.moveTo(x, 0);
    for (let y = 0; y <= h; y += 32) g.lineTo(x + Math.sin(y / 90 + i) * 3 + (rnd() - .5) * 2, y); g.stroke(); } });
const feltTex = (col) => canvasTex(512, 512, (g, w, h) => { g.fillStyle = `rgb(${col})`; g.fillRect(0, 0, w, h);
  const id = g.getImageData(0, 0, w, h); for (let i = 0; i < id.data.length; i += 4) { const n = (rnd() - .5) * 14; id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n; } g.putImageData(id, 0, 0); }, [6, 3]);
const plasterTex = (col) => canvasTex(1024, 512, (g, w, h) => { g.fillStyle = `rgb(${col})`; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${rnd() > .5 ? '255,255,255' : '0,0,0'},${rnd() * .012})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 20 + rnd() * 90, 10 + rnd() * 40, rnd() * 3, 0, 7); g.fill(); } }, [2, 1]);
// Generic dusk skyline for the window (no real landmarks, so it suits any brand and city)
const cityTex = () => canvasTex(2048, 1152, (g, w, h) => { const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, P.ink); sky.addColorStop(.5, mixHex(P.base, P.deep, .6)); sky.addColorStop(.85, P.primary); sky.addColorStop(1, P.cyan); g.fillStyle = sky; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,255,255,${.2 + rnd() * .5})`; g.fillRect(rnd() * w, rnd() * h * .45, 2, 2); }
  for (const [lay, col, hmin, hmax] of [[0, mixHex(P.base, P.deep, .7), 200, 520], [1, mixHex(P.ink, P.base, .7), 260, 760]]) { let x = -20;
    while (x < w) { const bw = 60 + rnd() * 120, bh = hmin + rnd() * (hmax - hmin); g.fillStyle = col; g.fillRect(x, h - bh, bw, bh);
      if (lay) for (let yy = h - bh + 16; yy < h - 16; yy += 22) for (let xx = x + 8; xx < x + bw - 8; xx += 16) if (rnd() < .2) { g.fillStyle = rnd() < .7 ? A2(P.pale, .5 + rnd() * .4) : `rgba(245,215,138,${.5 + rnd() * .4})`; g.fillRect(xx, yy, 6, 9); }
      x += bw + rnd() * 10; } } });
const A2 = (h, a) => `rgba(${rgbArr(h).join(',')},${a})`;
function box(w, h, d, mat, x, y, z, r = 0) { const m = new THREE.Mesh(r ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; scene.add(m); return m; }
function wall(z, w, h, mat, x = 0) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, h / 2, z); m.receiveShadow = true; scene.add(m); return m; }
function strip(x, y, z, w, col, k = 1.6, dir = 'x') { const g = dir === 'x' ? new THREE.BoxGeometry(w, .02, .02) : new THREE.BoxGeometry(.02, w, .02); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k) })); m.position.set(x, y, z); scene.add(m); return m; }
function vase(x, y, z, s, col) { const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(new THREE.Vector2((.35 + .45 * Math.sin(t * Math.PI * .9 + .2) - .25 * t) * s, t * s * 1.6)); }
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), new THREE.MeshStandardMaterial({ color: col, roughness: .55 })); m.position.set(x, y, z); m.castShadow = true; scene.add(m); }

// Lit ceiling: a dark brand-toned plaster plane that glows faintly (so it never renders as a black void),
// brighter towards the wall where a cove wash lights it, plus two recessed linear light slots.
function ceiling(WH, w, d, zc, wallZ, warm = true) {
  const top = mixHex(P.base, '#5a6274', .45), near = mixHex(P.base, '#8a93a6', .55);
  const tex = canvasTex(1024, 512, (g, cw, ch) => { const lg = g.createLinearGradient(0, 0, 0, ch); // canvas top = far from camera = wall side
    const wallT = Math.max(0, Math.min(1, (zc + d / 2 - wallZ) / d)); // fraction from texture top (v=1 is -z side after rotation)
    lg.addColorStop(0, near); lg.addColorStop(Math.min(.98, wallT + .25), top); lg.addColorStop(1, mixHex(P.base, '#000000', .2)); g.fillStyle = lg; g.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${rnd() > .5 ? '255,255,255' : '0,0,0'},${rnd() * .02})`; g.beginPath(); g.ellipse(rnd() * cw, rnd() * ch, 20 + rnd() * 80, 8 + rnd() * 30, rnd() * 3, 0, 7); g.fill(); } });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: tex, roughness: .9, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .22 }));
  m.rotation.x = Math.PI / 2; m.position.set(0, WH, zc); m.material.side = THREE.DoubleSide; scene.add(m);
  const lc = new THREE.Color(warm ? '#ffe9cf' : mixHex(P.pale, '#ffffff', .5)).multiplyScalar(1.15);
  for (const dz of [1.3, 3.1]) { const sl = new THREE.Mesh(new THREE.PlaneGeometry(w * .8, .07), new THREE.MeshBasicMaterial({ color: lc }));
    sl.rotation.x = Math.PI / 2; sl.position.set(0, WH - .006, wallZ + dz); scene.add(sl);
    const a = new THREE.RectAreaLight(warm ? 0xffe2c0 : hex(P.pale), 1.6, w * .8, .1); a.position.set(0, WH - .02, wallZ + dz); a.lookAt(0, 0, wallZ + dz); scene.add(a); }
  const cove = new THREE.RectAreaLight(warm ? 0xffe2c0 : hex(P.pale), 2.2, w, .08); cove.position.set(0, WH - .05, wallZ + .25); cove.lookAt(0, WH + 1, wallZ + .9); scene.add(cove);
}
const tex = await logoTextures();
let focus = 4.5, ap = .0018, mb = .006;
const MAT = c => new THREE.MeshStandardMaterial({ color: c, roughness: .85 });
const BRIGHT = P.bright, BRIGHTX = hex(P.bright);

if (S === 'exec') { // walnut slat wall, backlit logo panel left, credenza right
  cam.position.set(0, 1.3, 4.6); cam.lookAt(0, 1.5, -2); cam.fov = 46; cam.updateProjectionMatrix();
  const WZ = -2.2, WH = 3.2;
  wall(WZ - .06, 16, WH, MAT(shade(.35)));
  const wood = new THREE.MeshStandardMaterial({ map: woodTex(), roughness: .62 });
  const n = 170, inst = new THREE.InstancedMesh(new THREE.BoxGeometry(.05, WH, .05), wood, n), m = new THREE.Matrix4();
  let ns = 0; for (let i = 0; i < n; i++) { const x = -8 + i * .095; if (Math.abs(x) < 1.75) continue; m.makeTranslation(x, WH / 2, WZ); inst.setMatrixAt(ns++, m); } inst.count = ns;
  box(3.5, WH, .04, new THREE.MeshStandardMaterial({ map: feltTex(tint(.75)), roughness: .95 }), 0, WH / 2, WZ - .01); // calm felt feature panel behind the head, slats either side inst.receiveShadow = inst.castShadow = true; scene.add(inst);
  box(3.0, 1.15, .06, new THREE.MeshStandardMaterial({ map: feltTex(tint(.9)), roughness: .95 }), -3.1, 2.15, WZ + .07);
  strip(-3.1, 2.15 - .6, WZ + .12, 2.9, BRIGHT, 1.8);
  sign(tex, -3.1, 2.17, WZ + .1, 2.3, .3);
  const al = new THREE.RectAreaLight(BRIGHTX, 4, 2.9, .06); al.position.set(-3.1, 1.52, WZ + .14); al.lookAt(-3.1, 3, WZ + .14); scene.add(al);
  for (const x of [-5.4, -3.1, -.8, 1.5, 3.8, 6.1]) downlight(x, WH - .02, WZ + .5, x, .6, WZ, 26, 0xffe6c8);
  ceiling(WH, 16, 10, 2, WZ);
  const cm = new THREE.MeshStandardMaterial({ color: shade(.75), roughness: .45 });
  box(3.4, .62, .5, cm, 3.3, .31, WZ + .4, .02); box(3.5, .04, .54, new THREE.MeshStandardMaterial({ map: woodTex([70, 44, 28]), roughness: .4 }), 3.3, .64, WZ + .4);
  vase(2.4, .66, WZ + .4, .22, 0xd9d3c9); vase(2.75, .66, WZ + .45, .14, hex(mixHex(P.deep, '#808080', .3)));
  const bk = [hex(P.deep), 0xcfc8bb, 0x3a3f4a, 0x8a6a48]; for (let i = 0; i < 4; i++) box(.05, .3 - i * .02, .22, MAT(bk[i]), 3.9 + i * .055, .81 - i * .01, WZ + .4);
  box(.5, .06, .3, MAT(0xd8d2c6), 4.4, .69, WZ + .4);
  box(.03, 1.5, .03, new THREE.MeshStandardMaterial({ color: 0x111111, metalness: .8, roughness: .3 }), 5.6, .75, WZ + .5);
  const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(.18, .24, .3, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xf3e6d0, emissive: 0xffd9a8, emissiveIntensity: 1.3, side: THREE.DoubleSide })); lampShade.position.set(5.6, 1.6, WZ + .5); scene.add(lampShade);
  const pl = new THREE.PointLight(0xffc98a, 5, 4, 2); pl.position.set(5.6, 1.6, WZ + .6); scene.add(pl);
  floor(0, 0x15130f, .5, .1);
  scene.add(new THREE.HemisphereLight(0xc8d4ff, 0x0a0806, .18));
  focus = 6.6; ap = .002; mb = .007;
}
if (S === 'brandwall') { // felt wall with logo on the left, window to a dusk skyline on the right
  cam.position.set(-.4, 1.3, 4.4); cam.lookAt(.3, 1.5, -2); cam.fov = 50; cam.updateProjectionMatrix();
  const WZ = -2.2, WH = 3.3;
  wall(WZ, 7.6, WH, new THREE.MeshStandardMaterial({ map: feltTex(tint(1.1)), roughness: .95 }), -2.4);
  for (let i = 0; i < 7; i++) box(.012, WH, .02, MAT(shade(.6)), -6 + i * 1.2, WH / 2, WZ + .01);
  sign(tex, -3.4, 2.45, WZ + .02, 2.6, .34);
  strip(-2.4, .06, WZ + .05, 7.6, BRIGHT, 1.5);
  const sk = new THREE.RectAreaLight(BRIGHTX, 3, 7.6, .06); sk.position.set(-2.4, .05, WZ + .12); sk.lookAt(-2.4, 3, WZ + .12); scene.add(sk);
  for (const x of [-5.6, -3.4, -1.2]) downlight(x, WH - .02, WZ + .45, x, .4, WZ, 24, 0xfff0dc);
  const cm = new THREE.MeshBasicMaterial({ map: cityTex() }); cm.color.setScalar(.8);
  const far = new THREE.Mesh(new THREE.PlaneGeometry(26, 14.6), cm); far.position.set(9, 4.6, -14); scene.add(far);
  const mm = new THREE.MeshStandardMaterial({ color: 0x0a0d14, roughness: .4, metalness: .6 });
  for (const x of [1.45, 3.4, 5.35, 7.3]) box(.08, WH, .12, mm, x, WH / 2, WZ);
  box(.14, WH, .3, MAT(shade(.7)), 1.42, WH / 2, WZ + .1);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(8, WH), new THREE.MeshPhysicalMaterial({ color: 0x9fb4d6, transparent: true, opacity: .08, roughness: .05, metalness: .2 })); gl.position.set(5.4, WH / 2, WZ + .01); scene.add(gl);
  ceiling(WH, 20, 10, 2, WZ);
  box(2.2, .74, .9, new THREE.MeshStandardMaterial({ color: shade(.5), roughness: .4 }), 3.6, .37, -.6, .03);
  box(2.3, .04, 1.0, new THREE.MeshStandardMaterial({ map: woodTex([64, 40, 26]), roughness: .4 }), 3.6, .76, -.6);
  floor(0, shade(.6), .4, .2);
  const dusk = new THREE.DirectionalLight(hex(mixHex(P.bright, '#ffffff', .2)), .8); dusk.position.set(6, 3, -10); scene.add(dusk);
  scene.add(new THREE.HemisphereLight(0x8aa0d8, 0x05070c, .22));
  focus = 6.4; ap = .0022; mb = .008;
}
if (S === 'library') { // shelving wall with books, logo plaque top right
  cam.position.set(0, 1.35, 4.2); cam.lookAt(0, 1.5, -2); cam.fov = 48; cam.updateProjectionMatrix();
  const WZ = -2.2, WH = 3.2;
  wall(WZ - .3, 14, WH, MAT(shade(.8)));
  const sh = new THREE.MeshStandardMaterial({ color: shade(.95), roughness: .5 });
  const cols = [-4.8, -3.2, -1.6, 0, 1.6, 3.2, 4.8], rows = [.35, 1.0, 1.65, 2.3, 2.95];
  for (const x of cols) box(.05, WH, .36, sh, x - .8, WH / 2, WZ - .12);
  box(.05, WH, .36, sh, 4.8 + .8, WH / 2, WZ - .12);
  for (const y of rows) box(11.3, .035, .36, sh, 0, y, WZ - .12);
  const pal = [hex(P.deep), hex(mixHex(P.deep, '#888888', .3)), 0xbfb8ab, 0x3a3f4a, 0x7a5c40, 0x4b5464, 0x99917f, hex(mixHex(P.deep, P.primary, .3)), shade(1), 0x5d4c3a, 0x6e2f2f];
  for (let r = 0; r < rows.length - 1; r++) for (let c = 0; c < cols.length; c++) {
    if (r === 3 && c >= 4) continue; // logo plaque area
    if (c === 3) continue; // hidden by the felt panel behind the head
    let x = cols[c] - .75; const end = cols[c] + .72, y0 = rows[r] + .02, mode = rnd();
    if (mode < .22) { vase(cols[c] + (rnd() - .5) * .6, y0, WZ - .12, .12 + rnd() * .08, rnd() > .5 ? 0xd9d3c9 : 0x2c3446); continue; }
    while (x < end - (mode < .5 ? .7 : 0)) { const w = .03 + rnd() * .035, h = .38 + rnd() * .18; box(w, h, .2 + rnd() * .05, MAT(pal[Math.floor(rnd() * pal.length)]), x + w / 2, y0 + h / 2, WZ - .14); x += w + .004; }
    if (mode < .5) { for (let k = 0; k < 4; k++) box(.42, .04, .26, MAT(pal[Math.floor(rnd() * 4)]), end - .3, y0 + .02 + k * .042, WZ - .12); }
  }
  box(3.3, WH - .02, .38, new THREE.MeshStandardMaterial({ map: feltTex(tint(.85)), roughness: .95 }), 0, (WH - .02) / 2, WZ - .12); // calm felt panel behind the head
  downlight(0, WH - .02, WZ + .5, 0, .8, WZ + .1, 16, 0xffe6c8);
  box(3.1, .55, .03, new THREE.MeshStandardMaterial({ color: shade(.75), roughness: .3, metalness: .3 }), 3.2, 2.62, WZ + .09); // in front of the uprights
  sign(tex, 3.2, 2.62, WZ + .11, 2.3, .3);
  for (const y of rows.slice(1)) { for (const sx of [-3.6, 3.6]) strip(sx, y - .03, WZ + .04, 4.0, '#ffe2bf', 1.1); const a = new THREE.RectAreaLight(0xffdcb4, 1.6, 11.2, .05); a.position.set(0, y - .04, WZ + .02); a.lookAt(0, y - 1, WZ - .2); scene.add(a); }
  ceiling(WH, 16, 10, 2, WZ);
  floor(0, 0x14120f, .55, .08);
  scene.add(new THREE.HemisphereLight(0xc0ccef, 0x080706, .2));
  const key = new THREE.SpotLight(0xffeedd, 12, 10, .7, .9, 2); key.position.set(-2, 3, 2); key.target.position.set(0, 1.5, WZ); scene.add(key, key.target);
  focus = 6.2; ap = .0024; mb = .009;
}
if (S === 'meeting') { // glass-walled meeting room looking onto a softly lit open office
  cam.position.set(0, 1.3, 4.5); cam.lookAt(0, 1.5, -2); cam.fov = 48; cam.updateProjectionMatrix();
  const GZ = -1.8, WH = 3.0;
  wall(-9, 30, 6, MAT(shade(.85)));
  const warm = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe0b8').multiplyScalar(.9) }), cool = new THREE.MeshBasicMaterial({ color: new THREE.Color(mixHex(P.pale, '#ffffff', .2)).multiplyScalar(.8) });
  for (let i = 0; i < 9; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .05), i % 3 ? warm : cool); p.position.set(-8 + i * 2, 2.9, -5 - (i % 2) * 2); p.rotation.x = Math.PI / 2; scene.add(p);
    const l = new THREE.RectAreaLight(i % 3 ? 0xffdcb4 : hex(P.pale), 3, 1.6, .1); l.position.set(-8 + i * 2, 2.88, -5 - (i % 2) * 2); l.lookAt(-8 + i * 2, 0, -5 - (i % 2) * 2); scene.add(l); }
  for (let i = 0; i < 7; i++) { const x = -7 + i * 2.3 + rnd() * .5, z = -5.2 - rnd() * 1.5; box(1.5, .04, .75, new THREE.MeshStandardMaterial({ color: 0xcfc8bb, roughness: .4 }), x, .74, z); box(.7, .42, .03, MAT(0x05070c), x, 1.0, z - .2); box(.05, .72, .05, MAT(0x222a38), x - .6, .37, z); box(.05, .72, .05, MAT(0x222a38), x + .6, .37, z); }
  wall(-8.9, 4, 2.4, new THREE.MeshStandardMaterial({ map: feltTex(tint(1.3)), roughness: .95 }), 5);
  const mm = new THREE.MeshStandardMaterial({ color: 0x0a0d14, roughness: .35, metalness: .7 });
  for (const x of [-6, -3, 0, 3, 6]) box(.05, WH, .08, mm, x + 1.5, WH / 2, GZ);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(16, WH), new THREE.MeshPhysicalMaterial({ color: 0xb8c8e6, transparent: true, opacity: .07, roughness: .05, metalness: .1 })); gl.position.set(0, WH / 2, GZ); scene.add(gl);
  const band = canvasTex(4096, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(230,238,250,.9)'; for (let x = 0; x < w; x += 22) g.fillRect(x, 40, 10, 48); });
  const bm = new THREE.Mesh(new THREE.PlaneGeometry(16, .16), new THREE.MeshBasicMaterial({ map: band, transparent: true, opacity: .22, depthWrite: false })); bm.position.set(0, 1.15, GZ + .01); scene.add(bm);
  const fp = new THREE.Mesh(new THREE.PlaneGeometry(3.0, .6), new THREE.MeshBasicMaterial({ color: 0xdfe8f6, transparent: true, opacity: .14, depthWrite: false })); fp.position.set(-3.6, 2.35, GZ + .012); scene.add(fp);
  sign(tex, -3.6, 2.35, GZ + .015, 2.3, .22);
  ceiling(WH, 30, 16, 0, GZ, false);
  const pal2 = new THREE.RectAreaLight(0xfff0dc, 3, 3.4, .2); pal2.position.set(0, 2.95, 1.6); pal2.lookAt(0, 0, 1.6); scene.add(pal2);
  floor(0, shade(.6), .4, .14);
  scene.add(new THREE.HemisphereLight(0x8aa0d8, 0x05070c, .25));
  focus = 6.2; ap = .004; mb = .014;
}
if (S === 'studio') { // minimal plaster wall, light wash, timber ledge
  cam.position.set(0, 1.3, 4.3); cam.lookAt(0, 1.45, -2); cam.fov = 46; cam.updateProjectionMatrix();
  const WZ = -2.2, WH = 3.2;
  wall(WZ, 16, WH, new THREE.MeshStandardMaterial({ map: plasterTex(tint(1.5)), roughness: .95 }));
  const wash = new THREE.SpotLight(hex(mixHex(P.bright, '#ffffff', .35)), 40, 10, .55, 1, 1.6); wash.position.set(3.6, 3.3, WZ + .6); wash.target.position.set(3.0, 1.0, WZ); wash.castShadow = true; scene.add(wash, wash.target);
  const wash2 = new THREE.SpotLight(0xffe7c8, 22, 10, .5, 1, 1.6); wash2.position.set(-2.9, 3.3, WZ + .5); wash2.target.position.set(-2.9, 1.2, WZ); wash2.castShadow = true; scene.add(wash2, wash2.target);
  box(3.6, .06, .26, new THREE.MeshStandardMaterial({ map: woodTex([84, 54, 34]), roughness: .45 }), 3.4, 1.05, WZ + .13);
  vase(2.3, 1.08, WZ + .13, .2, 0xd9d3c9); vase(2.75, 1.08, WZ + .15, .13, hex(P.deep));
  box(.9, 1.1, .03, MAT(hex(P.base)), 3.9, 1.65, WZ + .05);
  const art = canvasTex(400, 500, (g, w, h) => { const lg = g.createLinearGradient(0, 0, w, h); lg.addColorStop(0, P.base); lg.addColorStop(1, P.primary); g.fillStyle = lg; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(w * .3, h * .75, 60 + i * 34, -1.6, 0); g.stroke(); } });
  const am = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.0), new THREE.MeshStandardMaterial({ map: art, roughness: .6 })); am.position.set(3.9, 1.65, WZ + .07); scene.add(am);
  sign(tex, -2.9, 2.3, WZ + .02, 2.4, .3);
  strip(0, .03, WZ + .03, 16, BRIGHT, 1.2);
  ceiling(WH, 16, 10, 2, WZ);
  floor(0, 0x121418, .5, .1);
  scene.add(new THREE.HemisphereLight(0xb6c6f0, 0x08070a, .2));
  focus = 6.5; ap = .0018; mb = .006;
}
if (!['exec', 'brandwall', 'library', 'meeting', 'studio'].includes(S)) throw new Error('office: unknown design ' + S);
// side "left": mirror the room, then un-mirror the signs so the logo still reads correctly
if (SPEC.side === 'left') { scene.scale.x = -1; for (const m of signs) m.scale.x = -1; }
const comp = new EffectComposer(renderer); comp.setSize(W, H);
comp.addPass(new RenderPass(scene, cam));
comp.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), .3, .5, .92));
comp.addPass(new BokehPass(scene, cam, { focus, aperture: ap, maxblur: mb }));
comp.addPass(new OutputPass());
comp.render(); comp.render();
window.__done = true;
