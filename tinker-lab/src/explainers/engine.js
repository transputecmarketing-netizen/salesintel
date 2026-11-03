// Tinker Lab explainer engine: animated, interactive, hand-drawn scenes on white.
//
//   import { scene } from '../engine.js';
//   export default (el, api) => scene(el, api, {
//     w: 800, h: 500,                        // the drawing's viewBox (scales to the stage)
//     steps: ['Caption one.', { cap: 'Two', dur: 8 }],   // captions ≤ 15 words
//     build(S) {                              // draw once, return the scene's hooks
//       const st = { glow: 0 };
//       S.onTick(() => bulb.set(st.glow));    // apply state every frame
//       return { step(i) { S.to(st, { glow: i > 0 ? 1 : 0 }) } };
//     },
//   });
//
// S (the scene kit) offers: S.d (rough.js drawing helpers), S.to / S.tween / S.spring
// (animation), S.play (cancellable async sequences), S.hand (a demonstrating cursor),
// S.flow (electrons along a path), S.ui (sliders, toggles, choices, buttons, readouts),
// S.drag / S.tap (direct manipulation in drawing units), S.goto(i), S.reduced, S.C (colours).
import rough from 'roughjs';
import { lucide } from '../brand/lucide.js';
import './explainers.css';

export const NS = 'http://www.w3.org/2000/svg';
export { tokens, mix } from './colors.js';
import { tokens } from './colors.js';

// ---------------------------------------------------------------- maths & easing
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = {
  linear: (t) => t,
  in: (t) => t * t * t,
  out: (t) => 1 - (1 - t) ** 3,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  back: (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
  sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};

/** 0.0125, 'A' → '12.5 mA'. */
export function si(v, unit = '', digits = 3) {
  if (!isFinite(v)) return `∞ ${unit}`.trim();
  if (v === 0) return `0 ${unit}`.trim();
  const P = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n']];
  const a = Math.abs(v);
  const [f, p] = P.find(([f]) => a >= f * 0.9995) ?? P[P.length - 1];
  const n = v / f;
  const s = Math.abs(n) >= 100 ? n.toFixed(0) : Math.abs(n) >= 10 ? n.toFixed(Math.max(0, digits - 2)) : n.toFixed(Math.max(0, digits - 1));
  return `${s.replace(/\.0+$|(\.\d*?)0+$/, '$1')} ${p}${unit}`.trim();
}

class Cancel extends Error {}

// ---------------------------------------------------------------- the scene
export function scene(el, api = {}, spec) {
  const C = tokens();
  const reduced = !!(api.reducedMotion ?? matchMedia('(prefers-reduced-motion: reduce)').matches);
  const W = spec.w ?? 800, H = spec.h ?? 500;
  const steps = (spec.steps ?? []).map((s) => (typeof s === 'string' ? { cap: s } : s));
  const uid = `xp${Math.random().toString(36).slice(2, 8)}`;

  // ---- DOM
  const root = document.createElement('div');
  root.className = 'xp';
  root.tabIndex = -1;
  root.innerHTML = `
    <div class="xp-head"><span class="xp-num" aria-hidden="true">1</span><p class="xp-cap" aria-live="polite"></p></div>
    <div class="xp-fig"><svg class="xp-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img"></svg></div>
    <div class="xp-foot">
      <div class="xp-ctrls"></div>
      <nav class="xp-nav" aria-label="Steps">
        <button class="xp-navbtn" data-nav="prev" aria-label="Previous step">${lucide('chevron-left', { size: 20, stroke: 2 })}</button>
        <ol class="xp-pills">${steps.map((s, i) => `<li><button data-i="${i}" aria-label="Step ${i + 1}">${i + 1}</button></li>`).join('')}</ol>
        <button class="xp-navbtn" data-nav="next" aria-label="Next step">${lucide('chevron-right', { size: 20, stroke: 2 })}</button>
        <button class="xp-navbtn xp-auto" data-nav="auto" aria-label="Play all steps" aria-pressed="false">${lucide('play', { size: 17, stroke: 2 })}${lucide('pause', { size: 17, stroke: 2 })}</button>
      </nav>
    </div>`;
  el.appendChild(root);
  const svg = root.querySelector('svg');
  const numEl = root.querySelector('.xp-num');
  const capEl = root.querySelector('.xp-cap');
  const ctrls = root.querySelector('.xp-ctrls');
  const pills = [...root.querySelectorAll('.xp-pills button')];
  const autoBtn = root.querySelector('.xp-auto');
  if (spec.label) svg.setAttribute('aria-label', spec.label);

  const mk = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v != null) n.setAttribute(k, v);
    if (parent) parent.appendChild(n);
    return n;
  };
  const defs = mk('defs', {}, svg);
  const glowIds = {};
  const glowDef = (color) => {
    if (glowIds[color]) return glowIds[color];
    const id = `${uid}g${Object.keys(glowIds).length}`;
    const g = mk('radialGradient', { id }, defs);
    mk('stop', { offset: '0%', 'stop-color': color, 'stop-opacity': 0.75 }, g);
    mk('stop', { offset: '45%', 'stop-color': color, 'stop-opacity': 0.28 }, g);
    mk('stop', { offset: '100%', 'stop-color': color, 'stop-opacity': 0 }, g);
    glowIds[color] = id;
    return id;
  };
  const layers = {};
  for (const name of ['back', 'main', 'fx', 'top', 'hand']) layers[name] = mk('g', { class: `xp-l-${name}` }, svg);

  // ---- rough drawing
  const rc = rough.svg(svg);
  let seed = (spec.seed ?? 7) * 1000 + 1;
  const base = { stroke: C.ink, strokeWidth: 2.2, roughness: 1.05, bowing: 0.9, fillStyle: 'solid', hachureGap: 6, fillWeight: 1.3, preserveVertices: false };
  const opts = (o = {}) => {
    const { parent, cls, ...r } = o;
    return [{ ...base, seed: seed++, ...r }, parent ?? cur, cls];
  };
  let cur = layers.main;
  const put = (node, parent, cls, o) => {
    if (cls) node.setAttribute('class', cls);
    if (o?.opacity != null) node.setAttribute('opacity', o.opacity);
    parent.appendChild(node);
    return node;
  };
  const d = {
    /** Make a group: d.g(parent?, attrs?). Draws into it while `d.into(g, fn)` runs. */
    g: (parent = cur, attrs = {}) => mk('g', attrs, parent),
    into(g, fn) { const prev = cur; cur = g; try { fn(); } finally { cur = prev; } return g; },
    line(x1, y1, x2, y2, o) { const [r, p, c] = opts(o); return put(rc.line(x1, y1, x2, y2, r), p, c, o); },
    rect(x, y, w, h, o) { const [r, p, c] = opts(o); return put(rc.rectangle(x, y, w, h, r), p, c, o); },
    circle(cx, cy, dia, o) { const [r, p, c] = opts(o); return put(rc.circle(cx, cy, dia, r), p, c, o); },
    ellipse(cx, cy, w, h, o) { const [r, p, c] = opts(o); return put(rc.ellipse(cx, cy, w, h, r), p, c, o); },
    path(dd, o) { const [r, p, c] = opts(o); return put(rc.path(dd, r), p, c, o); },
    poly(pts, o) { const [r, p, c] = opts(o); return put(rc.polygon(pts, r), p, c, o); },
    curve(pts, o) { const [r, p, c] = opts(o); return put(rc.curve(pts, r), p, c, o); },
    lines(pts, o) { const [r, p, c] = opts(o); return put(rc.linearPath(pts, r), p, c, o); },
    arc(cx, cy, w, h, a0, a1, closed, o) { const [r, p, c] = opts(o); return put(rc.arc(cx, cy, w, h, a0, a1, !!closed, r), p, c, o); },
    /** A sketchy arrow from (x1,y1) to (x2,y2); o.head = size. */
    arrow(x1, y1, x2, y2, o = {}) {
      const g = mk('g', {}, o.parent ?? cur);
      const a = Math.atan2(y2 - y1, x2 - x1), hs = o.head ?? 12;
      const col = o.stroke ?? C.ink;
      d.line(x1, y1, x2 - Math.cos(a) * hs * 0.5, y2 - Math.sin(a) * hs * 0.5, { ...o, parent: g });
      const p1 = [x2 - Math.cos(a - 0.45) * hs, y2 - Math.sin(a - 0.45) * hs], p2 = [x2 - Math.cos(a + 0.45) * hs, y2 - Math.sin(a + 0.45) * hs];
      d.poly([[x2, y2], p1, p2], { stroke: col, fill: col, strokeWidth: 1.4, roughness: 0.4, parent: g });
      if (o.cls) g.setAttribute('class', o.cls);
      return g;
    },
    /** Crisp SVG text (Newsreader). o: { size, weight, fill, anchor, mono, parent, baseline, cls, ls } */
    text(x, y, str, o = {}) {
      const t = mk('text', {
        x, y, 'font-size': o.size ?? 24, 'font-weight': o.weight ?? 400, fill: o.fill ?? C.ink2,
        'text-anchor': o.anchor ?? 'middle', 'dominant-baseline': o.baseline ?? 'middle',
        'font-family': o.mono ? 'IBM Plex Mono, ui-monospace, monospace' : 'Newsreader, Georgia, serif',
        'letter-spacing': o.ls ?? null, class: o.cls ?? null, opacity: o.opacity ?? null,
      }, o.parent ?? cur);
      t.textContent = str;
      return t;
    },
    /** A plain (non-rough) SVG element. */
    el: (tag, attrs = {}, parent = cur) => mk(tag, attrs, parent),
    /** A soft radial glow; returns the circle (set its opacity). */
    glow(cx, cy, r, color = C.yellow, parent) {
      parent ??= layers.fx;
      return mk('circle', { cx, cy, r, fill: `url(#${glowDef(color)})`, opacity: 0, 'pointer-events': 'none' }, parent);
    },
    /** A fill value for a glow of this colour (to recolour an existing glow). */
    glowFill: (color) => `url(#${glowDef(color)})`,
    /** Rebuild a group's contents (for drawings that depend on a value). */
    redraw(g, fn) { while (g.firstChild) g.firstChild.remove(); return d.into(g, fn); },
    /** Hand-drawn ground shadow under an object. */
    shadow(cx, cy, w, o = {}) {
      return d.ellipse(cx, cy, w, w * 0.16, { stroke: 'none', fill: C.subtle2, fillStyle: 'solid', roughness: 0.6, parent: o.parent ?? layers.back });
    },
    get seed() { return seed; },
    set seed(v) { seed = v; },
  };

  // ---- animation
  const tickers = []; // { fn, essential }
  const tweens = new Set();
  const keyed = new Map(); // obj → Map(prop → tween)
  const springs = new Set();
  let time = 0;

  function tween({ from = 0, to = 1, dur = 0.7, delay = 0, ease: e = 'inOut', onUpdate, onDone }) {
    const tw = { t: -delay, dur: Math.max(0.0001, dur), from, to, e: typeof e === 'function' ? e : ease[e] ?? ease.inOut, onUpdate, onDone, done: false };
    let resolve;
    tw.promise = new Promise((r) => (resolve = r));
    tw.finish = () => { if (tw.done) return; tw.done = true; tweens.delete(tw); onUpdate?.(to, 1); onDone?.(); resolve(); };
    tw.cancel = () => { if (tw.done) return; tw.done = true; tweens.delete(tw); resolve(); };
    if (reduced || dur === 0) tw.finish();
    else tweens.add(tw);
    return tw;
  }
  /** Animate numeric props of obj towards values: S.to(state, { a: 1 }, 0.6). */
  function to(obj, vals, dur = 0.7, o = {}) {
    let m = keyed.get(obj);
    if (!m) keyed.set(obj, (m = new Map()));
    const ps = [];
    for (const [k, v] of Object.entries(vals)) {
      m.get(k)?.cancel();
      const from = obj[k];
      if (from === v) continue;
      const tw = tween({ ...o, dur, from, to: v, onUpdate: (x) => (obj[k] = x) });
      if (!tw.done) m.set(k, tw);
      ps.push(tw.promise);
    }
    return Promise.all(ps);
  }
  /** A critically-damped-ish spring: s.target = v; read s.value. */
  function spring(value = 0, { k = 140, c = 18 } = {}) {
    const s = { value, target: value, v: 0, k, c, set(t) { s.target = t; if (reduced) { s.value = t; s.v = 0; } }, snap(t) { s.value = s.target = t; s.v = 0; } };
    springs.add(s);
    return s;
  }
  const onTick = (fn, { essential = false } = {}) => { const t = { fn, essential }; tickers.push(t); return () => tickers.splice(tickers.indexOf(t), 1); };

  // ---- cancellable sequences (one per step)
  let token = 0;
  const waits = new Set();
  const chk = (tok) => { if (tok !== token) throw new Cancel(); };
  function cancelPlay() {
    token++;
    for (const w of waits) if (w.tok !== token) { waits.delete(w); w.rej(new Cancel()); }
  }
  function wait(sec, tok = token) {
    return new Promise((res, rej) => {
      if (tok !== token) return rej(new Cancel());
      const w = { left: reduced ? 0 : sec, res, rej, tok };
      waits.add(w);
    });
  }
  /** S.play(async (w) => { await w(0.5); ... }) runs a sequence that stops when the step changes. */
  function play(fn) {
    const tok = token;
    const w = (sec) => wait(sec, tok);
    w.alive = () => tok === token;
    w.check = () => { if (tok !== token) throw new Cancel(); };
    /** Animate, then stop the sequence if the step changed meanwhile. */
    w.to = async (...a) => { await to(...a); w.check(); };
    return Promise.resolve().then(() => fn(w)).catch((e) => { if (!(e instanceof Cancel)) console.error(e); });
  }

  // ---- electrons (or anything) flowing along a path
  const flows = new Set();
  function flow(pathD, o = {}) {
    const g = mk('g', { class: 'xp-flow' }, o.parent ?? layers.fx);
    const p = mk('path', { d: pathD, fill: 'none', stroke: 'none' }, g);
    const len = p.getTotalLength();
    const gap = o.gap ?? 26;
    const n = Math.max(1, Math.floor(len / gap));
    const dots = [];
    for (let i = 0; i < n; i++) {
      const c = mk('circle', { r: o.r ?? 5, fill: o.color ?? C.blue, stroke: o.ring ?? '#fff', 'stroke-width': o.ring === 'none' ? 0 : 1.4 }, g);
      dots.push(c);
    }
    const f = {
      g, len, speed: o.speed ?? 60, offset: 0, on: o.on ?? true, opacity: o.on === false ? 0 : 1,
      setSpeed(v) { f.speed = v; },
      set(on) { f.on = on; },
      place() {
        const sp = len / n;
        for (let i = 0; i < n; i++) {
          let s = (i * sp + f.offset) % len;
          if (s < 0) s += len;
          const pt = p.getPointAtLength(s);
          dots[i].setAttribute('cx', pt.x.toFixed(1));
          dots[i].setAttribute('cy', pt.y.toFixed(1));
        }
      },
      tick(dt) {
        const target = f.on ? 1 : 0;
        f.opacity += (target - f.opacity) * Math.min(1, dt * 6);
        g.setAttribute('opacity', f.opacity.toFixed(3));
        if (f.on && !reduced) { f.offset += f.speed * dt; f.place(); }
      },
      remove() { flows.delete(f); g.remove(); },
    };
    f.place();
    flows.add(f);
    return f;
  }

  // ---- direct manipulation (pointer coords in drawing units)
  const cleanups = [];
  const toLocal = (e) => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
  };
  let interacted = false;
  const userActed = () => { interacted = true; stopAuto(); cancelPlay(); S.hand.hide(); };
  function drag(node, { start, move, end, cursor = 'grab' } = {}) {
    node.style.cursor = cursor;
    node.style.touchAction = 'none';
    const down = (e) => {
      e.preventDefault();
      userActed();
      node.setPointerCapture?.(e.pointerId);
      const p = toLocal(e);
      start?.(p.x, p.y, e);
      move?.(p.x, p.y, e);
      const mv = (ev) => { const q = toLocal(ev); move?.(q.x, q.y, ev); };
      const up = (ev) => { node.removeEventListener('pointermove', mv); node.removeEventListener('pointerup', up); node.removeEventListener('pointercancel', up); end?.(ev); };
      node.addEventListener('pointermove', mv);
      node.addEventListener('pointerup', up);
      node.addEventListener('pointercancel', up);
    };
    node.addEventListener('pointerdown', down);
    cleanups.push(() => node.removeEventListener('pointerdown', down));
  }
  function tap(node, fn, label) {
    node.style.cursor = 'pointer';
    node.setAttribute('tabindex', '0');
    node.setAttribute('role', 'button');
    if (label) node.setAttribute('aria-label', label);
    node.classList.add('xp-tap');
    const h = (e) => { e.stopPropagation(); userActed(); fn(e); };
    const k = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); userActed(); fn(e); } };
    node.addEventListener('click', h);
    node.addEventListener('keydown', k);
    cleanups.push(() => { node.removeEventListener('click', h); node.removeEventListener('keydown', k); });
  }

  // ---- UI controls (HTML, brand style)
  const ui = {
    root: ctrls,
    /** { label, min, max, step, value, format(v) → text, onInput(v) } */
    slider(o) {
      const w = document.createElement('label');
      w.className = 'xp-slider';
      w.innerHTML = `<span class="xp-lab">${o.label}</span><input type="range" min="${o.min}" max="${o.max}" step="${o.step ?? 'any'}" value="${o.value}"><output></output>`;
      const inp = w.querySelector('input'), out = w.querySelector('output');
      const fmt = o.format ?? ((v) => String(v));
      const fill = () => w.style.setProperty('--p', `${((inp.value - o.min) / (o.max - o.min)) * 100}%`);
      const api = {
        el: w, input: inp, min: o.min, max: o.max,
        get value() { return Number(inp.value); },
        set(v, fire = true) { inp.value = v; out.textContent = fmt(Number(inp.value)); fill(); if (fire) o.onInput?.(Number(inp.value)); },
        show(on = true) { w.hidden = !on; return api; },
      };
      inp.addEventListener('input', () => { userActed(); out.textContent = fmt(Number(inp.value)); fill(); o.onInput?.(Number(inp.value)); });
      out.textContent = fmt(Number(o.value)); fill();
      (o.parent ?? ctrls).appendChild(w);
      return api;
    },
    /** { label, value, onChange(on) } */
    toggle(o) {
      const b = document.createElement('button');
      b.className = 'xp-toggle';
      b.innerHTML = `<span class="xp-sw" aria-hidden="true"></span><span>${o.label}</span>`;
      let on = !!o.value;
      const api = {
        el: b, get value() { return on; },
        set(v, fire = true) { on = !!v; b.setAttribute('aria-pressed', String(on)); if (fire) o.onChange?.(on); },
        show(v = true) { b.hidden = !v; return api; },
      };
      b.setAttribute('aria-pressed', String(on));
      b.addEventListener('click', () => { userActed(); api.set(!on); });
      (o.parent ?? ctrls).appendChild(b);
      return api;
    },
    /** { label, options: [[value, text], ...], value, onChange(v) } */
    choice(o) {
      const w = document.createElement('div');
      w.className = 'xp-choice';
      w.setAttribute('role', 'group');
      if (o.label) w.setAttribute('aria-label', o.label);
      w.innerHTML = `${o.label ? `<span class="xp-lab">${o.label}</span>` : ''}<span class="xp-seg">${o.options.map(([v, t]) => `<button data-v="${v}">${t}</button>`).join('')}</span>`;
      let val = o.value ?? o.options[0][0];
      const btns = [...w.querySelectorAll('button')];
      const api = {
        el: w, get value() { return val; },
        set(v, fire = true) { val = v; btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === String(v)))); if (fire) o.onChange?.(v); },
        show(v = true) { w.hidden = !v; return api; },
      };
      btns.forEach((b, i) => b.addEventListener('click', () => { userActed(); api.set(o.options[i][0]); }));
      api.set(val, false);
      (o.parent ?? ctrls).appendChild(w);
      return api;
    },
    /** { label, icon?, onClick } */
    button(o) {
      const b = document.createElement('button');
      b.className = `xp-btn${o.primary ? ' is-primary' : ''}`;
      b.innerHTML = `${o.icon ? lucide(o.icon, { size: 16, stroke: 2 }) : ''}<span>${o.label}</span>`;
      b.addEventListener('click', () => { userActed(); o.onClick?.(); });
      (o.parent ?? ctrls).appendChild(b);
      const api = { el: b, show(v = true) { b.hidden = !v; return api; }, label(t) { b.querySelector('span').textContent = t; } };
      return api;
    },
    /** { label, unit, color } → .set(text) */
    readout(o) {
      const w = document.createElement('div');
      w.className = 'xp-read';
      if (o.color) w.style.setProperty('--c', o.color);
      w.innerHTML = `<small>${o.label}</small><b>–</b>`;
      const b = w.querySelector('b');
      let last = '';
      (o.parent ?? ctrls).appendChild(w);
      const api = { el: w, set(t) { t = String(t); if (t !== last) { b.textContent = t; last = t; } return api; }, show(v = true) { w.hidden = !v; return api; } };
      return api;
    },
    /** A line break in the controls row. */
    row() { const r = document.createElement('div'); r.className = 'xp-row'; ctrls.appendChild(r); return r; },
  };

  // ---- the demonstrating hand
  const handG = mk('g', { class: 'xp-hand', opacity: 0, 'pointer-events': 'none' }, layers.hand);
  {
    const inner = mk('g', { transform: 'scale(1.35)' }, handG);
    d.into(inner, () => {
      // pointing hand, fingertip at (0,0)
      d.path('M0 0c4-1 7 1 7 4v15c2-3 7-3 8 1 2-2 7-2 7 2 2-1 6 0 6 4v10c0 9-6 15-15 15h-4c-6 0-9-3-12-8l-8-12c-2-4 2-7 5-4l5 5V4c0-3 3-5 6-4z',
        { fill: '#fff', fillStyle: 'solid', stroke: C.ink, strokeWidth: 1.9, roughness: 0.6 });
      d.line(7, 19, 7, 28, { strokeWidth: 1.2, roughness: 0.4 });
      d.line(15, 21, 15, 28, { strokeWidth: 1.2, roughness: 0.4 });
    });
  }
  const ring = mk('circle', { r: 12, fill: 'none', stroke: C.accent, 'stroke-width': 3, opacity: 0 }, layers.hand);
  const hs = { x: W * 0.6, y: H * 0.9, o: 0, s: 1, ring: 0, rx: 0, ry: 0 };
  const S = {};
  S.hand = {
    show(x, y) { if (x != null) { hs.x = x; hs.y = y; } to(hs, { o: 1 }, 0.3); },
    hide() { to(hs, { o: 0 }, 0.3); },
    async move(x, y, dur = 0.9) { const tok = token; to(hs, { o: 1 }, 0.25); await to(hs, { x, y }, dur, { ease: 'inOut' }); chk(tok); },
    async tap(x, y) {
      const tok = token;
      if (x != null) await S.hand.move(x, y);
      hs.rx = hs.x; hs.ry = hs.y;
      await to(hs, { s: 0.86 }, 0.12);
      hs.ring = 1; to(hs, { ring: 0 }, 0.6, { ease: 'out' });
      await to(hs, { s: 1 }, 0.16);
      chk(tok);
    },
    /** Drag from (x1,y1) to (x2,y2), calling onMove(t) along the way. */
    async drag(x1, y1, x2, y2, dur = 1.4, onMove) {
      const tok = token;
      await S.hand.move(x1, y1);
      if (tok !== token) throw new Cancel();
      await to(hs, { s: 0.88 }, 0.12);
      let tw = null;
      tw = tween({ dur, ease: 'inOut', onUpdate: (t) => { if (tok !== token) return tw?.cancel(); hs.x = lerp(x1, x2, t); hs.y = lerp(y1, y2, t); onMove?.(t); } });
      await tw.promise;
      if (tok !== token) throw new Cancel();
      await to(hs, { s: 1 }, 0.14);
    },
    /** Demonstrate an S.ui.slider: drag its thumb to value v. */
    async slide(sl, v, dur = 1.3) {
      const r0 = sl.input.getBoundingClientRect();
      const fx = (val) => 0.04 + 0.92 * clamp((val - sl.min) / (sl.max - sl.min));
      const a = S.pt(sl.input, fx(sl.value), 0.75), b = S.pt(sl.input, fx(v), 0.75);
      const v0 = sl.value;
      if (!r0.width) { sl.set(v); return; }
      const tok = token;
      await S.hand.drag(a.x, a.y, b.x, b.y, dur, (t) => sl.set(lerp(v0, v, t)));
      chk(tok);
      sl.set(v);
    },
    /** Demonstrate pressing an HTML control (button, toggle). */
    async press(elm) {
      const p = S.pt(elm, 0.5, 0.6);
      await S.hand.tap(p.x, p.y);
    },
  };

  // ---- steps
  let curStep = -1, completed = false, handle = {};
  let autoplay = false, autoT = 0;
  const setAuto = (on) => { autoplay = on && !reduced; autoT = 0; autoBtn.setAttribute('aria-pressed', String(autoplay)); autoBtn.setAttribute('aria-label', autoplay ? 'Pause' : 'Play all steps'); };
  const stopAuto = () => { if (autoplay) setAuto(false); };
  function goto(i, { user = false } = {}) {
    i = clamp(i, 0, steps.length - 1);
    if (i === curStep) return;
    if (user) stopAuto();
    const prev = curStep;
    curStep = i;
    cancelPlay();
    autoT = 0;
    const st = steps[i];
    numEl.textContent = String(i + 1);
    capEl.textContent = st.cap.replace(/(\d) (?=[°%A-Za-zΩµτ])/g, '$1\u00a0');
    capEl.classList.remove('is-in'); void capEl.offsetWidth; capEl.classList.add('is-in');
    pills.forEach((p, k) => { p.classList.toggle('is-on', k === i); p.classList.toggle('is-done', k < i); p.setAttribute('aria-current', k === i ? 'step' : 'false'); });
    root.querySelector('[data-nav=prev]').disabled = i === 0;
    root.querySelector('[data-nav=next]').disabled = i === steps.length - 1;
    S.step = i;
    S.hand.hide();
    try { handle.step?.(i, prev); } catch (e) { console.error(e); }
    if (i === steps.length - 1 && !completed) { completed = true; api.complete?.(); }
  }
  root.querySelector('.xp-nav').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.i != null) goto(Number(b.dataset.i), { user: true });
    else if (b.dataset.nav === 'prev') goto(curStep - 1, { user: true });
    else if (b.dataset.nav === 'next') goto(curStep + 1, { user: true });
    else if (b.dataset.nav === 'auto') {
      if (reduced) { api.toast?.('Autoplay is off because your device asks for reduced motion'); return; }
      if (!autoplay && curStep === steps.length - 1) goto(0);
      setAuto(!autoplay);
    }
  });
  const onKey = (e) => {
    if (e.target.closest('input, select, textarea')) return;
    if (e.key === 'ArrowRight') { e.stopPropagation(); e.preventDefault(); goto(curStep + 1, { user: true }); }
    else if (e.key === 'ArrowLeft') { e.stopPropagation(); e.preventDefault(); goto(curStep - 1, { user: true }); }
  };
  root.addEventListener('keydown', onKey);

  // ---- the loop (pauses offscreen and in hidden tabs)
  let raf = 0, last = 0, visible = true, dead = false;
  const frame = (now) => {
    raf = 0;
    if (dead) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    time += dt;
    for (const tw of [...tweens]) {
      tw.t += dt;
      if (tw.t < 0) continue;
      const k = clamp(tw.t / tw.dur);
      tw.onUpdate?.(lerp(tw.from, tw.to, tw.e(k)), k);
      if (k >= 1) tw.finish();
    }
    for (const w of [...waits]) { w.left -= dt; if (w.left <= 0) { waits.delete(w); w.res(); } }
    for (const s of springs) {
      const a = -s.k * (s.value - s.target) - s.c * s.v;
      s.v += a * dt; s.value += s.v * dt;
    }
    for (const t of [...tickers]) if (!reduced || t.essential) t.fn(dt, time); else t.fn(0, time);
    for (const f of flows) f.tick(dt);
    handG.setAttribute('transform', `translate(${hs.x.toFixed(1)} ${hs.y.toFixed(1)}) scale(${hs.s.toFixed(3)})`);
    handG.setAttribute('opacity', hs.o.toFixed(3));
    ring.setAttribute('cx', hs.rx); ring.setAttribute('cy', hs.ry);
    ring.setAttribute('r', (8 + (1 - hs.ring) * 26).toFixed(1)); ring.setAttribute('opacity', (hs.ring * 0.9).toFixed(3));
    if (autoplay) {
      autoT += dt;
      if (autoT >= (steps[curStep]?.dur ?? 6.5)) { if (curStep < steps.length - 1) goto(curStep + 1); else setAuto(false); }
    }
    schedule();
  };
  const schedule = () => { if (!raf && visible && !document.hidden && !dead) { last = 0; raf = requestAnimationFrame(frame); } };
  const io = new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); schedule(); });
  io.observe(root);
  const onVis = () => schedule();
  document.addEventListener('visibilitychange', onVis);

  Object.assign(S, {
    svg, root, W, H, C, d, layers, reduced, ui, uid,
    tween, to, spring, onTick, play, wait, flow, drag, tap, goto, ease, lerp, clamp, si,
    get time() { return time; },
    get interacted() { return interacted; },
    step: 0, steps,
    /** Drawing-unit coordinates of a point on an HTML element (fx, fy are fractions of its box). */
    pt(elm, fx = 0.5, fy = 0.5) {
      const r = elm.getBoundingClientRect(), m = svg.getScreenCTM();
      const p = svg.createSVGPoint();
      p.x = r.left + r.width * fx; p.y = r.top + r.height * fy;
      return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 };
    },
    /** Move a node: S.at(node, x, y, rot?, scale?) */
    at(node, x, y, r = 0, s = 1) { node.setAttribute('transform', `translate(${(+x).toFixed(2)} ${(+y).toFixed(2)})${r ? ` rotate(${(+r).toFixed(2)})` : ''}${s !== 1 ? ` scale(${(+s).toFixed(3)})` : ''}`); return node; },
    show(node, v) { node.setAttribute('opacity', (+v).toFixed(3)); node.style.pointerEvents = v < 0.05 ? 'none' : ''; return node; },
    toast: (t) => api.toast?.(t),
  });

  if (spec.caps !== false && import.meta.env?.DEV) {
    for (const s of steps) if (s.cap.split(/\s+/).length > 15) console.warn(`Explainer caption over 15 words: "${s.cap}"`);
  }

  try { handle = spec.build(S) ?? {}; } catch (e) { console.error('Explainer build failed', e); }
  goto(0);
  schedule();

  return {
    S,
    goto,
    destroy() {
      if (dead) return;
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      root.removeEventListener('keydown', onKey);
      cancelPlay();
      waits.clear(); tweens.clear(); springs.clear(); flows.clear(); tickers.length = 0;
      for (const c of cleanups) c();
      try { handle.destroy?.(); } catch (e) { console.error(e); }
      root.remove();
    },
  };
}
