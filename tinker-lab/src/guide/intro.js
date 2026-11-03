// Landing-page intro: a ≈12 s assembly drawn like a paper manual. The board
// appears, the breadboard slides in, the resistor and LED drop in along
// arrows, two jumpers draw themselves, then the LED lights while a "1 2 3"
// step counter ticks. Respects reduced motion and pauses offscreen.
//
//   import { mountIntro } from './guide/intro.js';
//   const intro = mountIntro(el, { loop: true });   // later: intro.destroy()
import * as THREE from 'three';
import { makeBoardOfType } from '../scene/boards/index.js';
import { makeBreadboard } from '../scene/breadboard.js';
import { makeResistor, makeLED } from '../scene/components.js';
import { makeWire } from '../scene/wire.js';
import { toLineArt, visibleBox, fitBox, applyView, toScreen, makeRenderer, BASE_AZ } from './lineart.js';
import { arrow } from './core.js';

const DURATION = 12;
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const easeOut = (t) => 1 - Math.pow(1 - clamp01(t), 3);
const easeInOut = (t) => {
  t = clamp01(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const seg = (t, a, b) => clamp01((t - a) / (b - a));

// timeline (seconds)
const T = {
  board: [0.2, 1.3],
  bb: [1.5, 2.7],
  res: [3.1, 4.1],
  led: [4.3, 5.3],
  w1: [5.8, 7.0],
  w2: [7.1, 8.3],
  lit: [8.8, 9.5],
  out: [11.3, 12],
};
const STEPS = [
  { at: T.board[0], word: 'Place' },
  { at: T.res[0], word: 'Push' },
  { at: T.w1[0], word: 'Connect' },
];

let styled = false;
function injectStyle() {
  if (styled) return;
  styled = true;
  const s = document.createElement('style');
  s.textContent = `
.tli { position: relative; width: 100%; background: var(--tl-bg, #fff); overflow: hidden; font-family: var(--tl-serif, Georgia, serif); font-weight: 300; color: var(--tl-ink, #0c0c0e); }
.tli.is-auto { aspect-ratio: 16 / 10; }
.tli.is-fill { height: 100%; }
.tli canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.tli svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
.tli .g-arrow .halo { fill: #fff; stroke: #fff; stroke-width: 9; stroke-linejoin: round; stroke-linecap: round; }
.tli .g-arrow .shaft { fill: none; stroke: var(--tl-ink, #0c0c0e); stroke-width: 3.2; stroke-linecap: round; }
.tli .g-arrow .head { fill: var(--tl-ink, #0c0c0e); stroke: var(--tl-ink, #0c0c0e); stroke-width: 1.5; stroke-linejoin: round; }
.tli .ray { stroke: var(--tl-yellow, #f2b10a); stroke-width: 2.4; stroke-linecap: round; }
.tli-steps { position: absolute; left: 4%; top: 6%; display: flex; gap: clamp(14px, 3vw, 30px); align-items: flex-start; }
.tli-steps div { display: grid; justify-items: start; gap: 2px; color: var(--tl-line-2, #d4d1c9); transition: color .35s; }
.tli-steps b { font-weight: 300; font-size: clamp(30px, 5.2vw, 64px); line-height: .9; font-variant-numeric: lining-nums tabular-nums; letter-spacing: -0.03em; }
.tli-steps span { font-size: clamp(11px, 1.2vw, 14px); letter-spacing: .06em; text-transform: uppercase; }
.tli-steps div.is-on { color: var(--tl-ink, #0c0c0e); }
.tli-steps div.is-now b { color: var(--tl-accent, #e5132d); }
`;
  document.head.append(s);
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,120,70,0.75)');
  r.addColorStop(0.35, 'rgba(255,150,90,0.32)');
  r.addColorStop(1, 'rgba(255,190,140,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Mount the intro into `el`. If `el` has no height of its own, the intro keeps a 16:10 shape.
 * @param {HTMLElement} el
 * @param {{ loop?: boolean }} [opts]
 * @returns {{ destroy(): void }}
 */
export function mountIntro(el, { loop = true } = {}) {
  injectStyle();
  const wrap = document.createElement('div');
  wrap.className = `tli ${el.clientHeight > 80 ? 'is-fill' : 'is-auto'}`;
  wrap.setAttribute('role', 'img');
  wrap.setAttribute('aria-label', 'An assembly drawing: a board, a breadboard, a resistor and an LED, two jumper wires, then the LED lights up. Steps 1, 2, 3.');
  wrap.innerHTML = `<canvas></canvas><svg aria-hidden="true"></svg>
    <div class="tli-steps" aria-hidden="true">${STEPS.map((s, i) => `<div><b>${i + 1}</b><span>${s.word}</span></div>`).join('')}</div>`;
  el.append(wrap);
  const canvas = wrap.querySelector('canvas');
  const svg = wrap.querySelector('svg');
  const stepEls = [...wrap.querySelectorAll('.tli-steps div')];

  let renderer;
  try {
    renderer = makeRenderer(canvas);
  } catch {
    wrap.querySelector('.tli-steps').remove();
    return { destroy() { wrap.remove(); } };
  }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

  // ---- the blink circuit, built with the real part factories
  const root = new THREE.Group();
  const board = makeBoardOfType('uno');
  board.setBuiltinLed?.(0);
  root.add(board.group);
  board.group.updateMatrixWorld(true);
  const bb = makeBreadboard();
  bb.group.position.set(9.4, 0, -0.6);
  root.add(bb.group);
  bb.group.updateMatrixWorld(true);
  const res = makeResistor(bb.hole(10, 'd'), bb.hole(14, 'd'), 220);
  const led = makeLED('red', bb.hole(14, 'c'), bb.hole(15, 'c'));
  const w1 = makeWire(board.pin('D13'), bb.hole(10, 'b'), 'orange');
  const w2 = makeWire(board.pin('GND'), bb.hole(15, 'a'), 'black');
  for (const p of [res, led, w1, w2]) root.add(p.group);
  root.updateMatrixWorld(true);

  const parts = [board, bb, res, led, w1, w2];
  const boxes = parts.map((p) => visibleBox([p.group]));
  const art = toLineArt(root, {
    units: parts.map((p) => ({ objects: [p.group], family: p === w1 || p === w2 ? 'wire' : null, perMesh: p === w1 || p === w2 })),
  });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  scene.add(root);

  // lens materials (to light the LED) and a soft warm glow
  const lens = new Set();
  led.pick.traverse((o) => { if (o.isMesh && o.material?.uniforms?.uGlow) lens.add(o.material); });
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthTest: false, depthWrite: false, opacity: 0 }));
  const ledTop = boxes[3].getCenter(new THREE.Vector3()).setY(boxes[3].max.y - 0.15);
  glow.position.copy(ledTop);
  glow.scale.setScalar(3.4);
  glow.renderOrder = 10;
  scene.add(glow);

  // wires: tube draw ranges and plug ends
  const wires = [w1, w2].map((w) => {
    const tube = w.group.children.find((c) => c.isMesh && c.geometry.type === 'TubeGeometry');
    const a = w.curve.getPoint(0), b = w.curve.getPoint(1);
    const endB = w.group.children.filter((c) => c.isMesh && c !== tube && c.position.distanceTo(b) < c.position.distanceTo(a));
    const geo = tube.geometry;
    return { w, tube, endB, count: geo.index ? geo.index.count : geo.attributes.position.count, segs: geo.parameters?.tubularSegments ?? 96 };
  });
  const base = parts.map((p) => p.group.position.clone());
  const full = boxes.reduce((b, x) => b.union(x), new THREE.Box3());
  full.max.y += 1.2; // room for the arrows
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 200);
  const az = BASE_AZ;

  function pose(t) {
    // states: hidden until it arrives, 'new' while arriving, 'old' afterwards, all 'normal' once lit
    const arrive = [T.board, T.bb, T.res, T.led, T.w1, T.w2];
    const lit = seg(t, ...T.lit);
    arrive.forEach(([a, b], i) => {
      const state = t < a ? 'hidden' : lit > 0 ? 'normal' : t < b + 0.6 ? 'new' : 'old';
      art.setState(i, state);
      const p = parts[i].group;
      p.position.copy(base[i]);
      const k = easeOut(seg(t, a, b));
      if (i === 0) p.position.y += (1 - k) * 1.6;
      if (i === 1) p.position.x += (1 - easeInOut(seg(t, a, b))) * 7;
      if (i === 2 || i === 3) p.position.y += (1 - k) * 2.4;
    });
    wires.forEach((x, i) => {
      const [a, b] = i ? T.w2 : T.w1;
      const f = easeInOut(seg(t, a, b));
      const n = Math.round(f * x.segs);
      x.tube.geometry.setDrawRange(0, f >= 1 ? Infinity : (x.count / x.segs) * n);
      for (const e of x.endB) e.visible = f >= 0.98;
    });
    for (const m of lens) {
      m.uniforms.uGlow.value = lit * 0.82;
      m.uniforms.uGlowColor.value.setRGB(1, 0.22, 0.14, THREE.SRGBColorSpace);
    }
    glow.material.opacity = lit * (0.9 + 0.1 * Math.sin(t * 6));
    root.updateMatrixWorld(true);
    // step counter
    const cur = STEPS.reduce((n, s, i) => (t >= s.at ? i : n), -1);
    stepEls.forEach((d, i) => {
      d.classList.toggle('is-on', i <= cur);
      d.classList.toggle('is-now', i === cur && lit === 0);
    });
  }

  function overlay(t, w, h) {
    let out = '';
    const drops = [[T.board, 0], [T.res, 2], [T.led, 3]];
    for (const [[a, b], i] of drops) {
      if (t < a - 0.1 || t > b + 0.7) continue;
      const box = boxes[i];
      const top = new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2);
      const s = toScreen(top, camera, w, h);
      const fade = Math.min(seg(t, a - 0.1, a + 0.15), 1 - seg(t, b + 0.3, b + 0.7));
      const off = (1 - easeOut(seg(t, a, b))) * 26;
      out += `<g style="opacity:${fade.toFixed(2)}">${arrow(s.x, s.y - 78 - off, s.x, s.y - 12 - off)}</g>`;
    }
    if (t >= T.bb[0] - 0.1 && t <= T.bb[1] + 0.7) {
      const box = boxes[1];
      const p = toScreen(new THREE.Vector3(box.max.x + 0.6, box.max.y, (box.min.z + box.max.z) / 2), camera, w, h);
      const fade = Math.min(seg(t, T.bb[0] - 0.1, T.bb[0] + 0.15), 1 - seg(t, T.bb[1] + 0.3, T.bb[1] + 0.7));
      out += `<g style="opacity:${fade.toFixed(2)}">${arrow(p.x + 70, p.y - 34, p.x + 8, p.y - 34)}</g>`;
    }
    const lit = seg(t, ...T.lit);
    if (lit > 0) {
      const c = toScreen(ledTop, camera, w, h);
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const r0 = 20 + lit * 4, r1 = r0 + 10 * lit;
        out += `<line class="ray" style="opacity:${lit.toFixed(2)}" x1="${(c.x + Math.cos(ang) * r0).toFixed(1)}" y1="${(c.y + Math.sin(ang) * r0).toFixed(1)}" x2="${(c.x + Math.cos(ang) * r1).toFixed(1)}" y2="${(c.y + Math.sin(ang) * r1).toFixed(1)}"/>`;
      }
    }
    return out;
  }

  let w = 0, h = 0;
  function resize() {
    const r = wrap.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    renderer.setSize(w, h, false);
    art.setResolution(w, h);
    applyView(camera, fitBox(full, w / h, az, 1.08), w / h, az);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }

  function draw(t) {
    pose(t);
    renderer.render(scene, camera);
    svg.innerHTML = overlay(t, w, h);
    const fade = loop ? 1 - seg(t, ...T.out) : 1;
    wrap.style.setProperty('--tli-fade', fade);
    canvas.style.opacity = svg.style.opacity = String(fade < 1 ? Math.max(0, fade) : 1);
  }

  // ---- run
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0, visible = true, last = 0, t = 0, done = false;
  const ro = new ResizeObserver(() => { resize(); if (!raf) draw(reduce.matches || done ? T.out[0] - 0.5 : t); });
  ro.observe(wrap);
  resize();

  const frame = (now) => {
    raf = 0;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    t += dt;
    if (t >= DURATION) {
      if (loop) t = 0;
      else { t = T.out[0] - 0.01; done = true; }
    }
    draw(done ? T.out[0] - 0.5 : t);
    if (!done) schedule();
  };
  const schedule = () => {
    if (!raf && visible && !document.hidden && !reduce.matches && !done) raf = requestAnimationFrame(frame);
  };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; };
  const io = new IntersectionObserver((es) => {
    visible = es.some((e) => e.isIntersecting);
    if (visible) schedule();
    else stop();
  });
  io.observe(wrap);
  const onVis = () => (document.hidden ? stop() : schedule());
  document.addEventListener('visibilitychange', onVis);
  const onReduce = () => { if (reduce.matches) { stop(); draw(T.out[0] - 0.5); } else schedule(); };
  reduce.addEventListener?.('change', onReduce);

  if (reduce.matches) draw(T.out[0] - 0.5); // the finished frame, LED lit
  else { draw(0); schedule(); }

  return {
    destroy() {
      stop();
      done = true;
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      reduce.removeEventListener?.('change', onReduce);
      art.dispose();
      glow.material.map.dispose();
      glow.material.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
      wrap.remove();
    },
  };
}
