// Tinker Lab figures: isometric line drawings that answer the pointer, on the
// hairline kernel (MIT, github.com/lucasmarkes/hairline; see ./README.md).
//
//   import { mountFigure, FIGURES } from './figures/index.js';
//   const fig = mountFigure(el, 'servo', { intensity: 0.5, play: true, onRead: (t) => … });
//   fig.update({ intensity: 0.8 });  fig.destroy();
//
// Each figure is its own module, loaded the first time its element comes near
// the viewport. All of them share the kernel's one frame loop, which sleeps
// offscreen and lands every motion at once under prefers-reduced-motion.
import HL from './vendor/hairline-kernel.js';

/** The registry: name, title (for a caption) and description (the default accessible name). */
export const FIGURES = [
  { name: 'chip', title: 'Inside a chip', description: 'An IC taken apart into its layers: lead frame, die, bond wires and lid. Move across to open the gap, up and down to pick a layer.' },
  { name: 'breadboard', title: 'Breadboard', description: 'A breadboard whose hidden clips lift out: the hole under the pointer raises its five-hole strip, and a power rail rises as one.' },
  { name: 'servo', title: 'Servo', description: 'A hobby servo whose horn follows the pointer round its shaft on a spring, from 0 to 180 degrees.' },
  { name: 'stepper', title: 'Stepper motor', description: 'A stepper motor with a dial needle that steps toward the pointer one detent at a time.' },
  { name: 'led-matrix', title: 'LED matrix', description: 'An 8 by 8 LED matrix module that plays a loop, and glows where the pointer paints it, fading like phosphor.' },
  { name: 'robot-arm', title: 'Robot arm', description: 'A three-joint robot arm that reaches the pointer on its table with simple inverse kinematics, and closes its gripper there.' },
  { name: 'processor', title: 'Processor', description: 'A processor die with eight cores standing at their load: the core under the pointer rises, and its cache slice follows it up.' },
  { name: 'pcb', title: 'Circuit board', description: 'A circuit board whose copper nets lift off: the trace under the pointer rises, and the pads on its net follow it up.' },
];

const LOAD = {
  chip: () => import('./chip.js'),
  breadboard: () => import('./breadboard.js'),
  servo: () => import('./servo.js'),
  stepper: () => import('./stepper.js'),
  'led-matrix': () => import('./led-matrix.js'),
  'robot-arm': () => import('./robot-arm.js'),
  processor: () => import('./processor.js'),
  pcb: () => import('./pcb.js'),
};

/**
 * The brand's palette for the kernel's five tokens, read from the brand's custom
 * properties (src/brand/tokens.css), never copied: the plate is the white page
 * (--tl-bg), the one bright stroke is Tinker red (--tl-accent), or Electric Iris
 * (--tl-iris) with `accent: 'iris'`, or ink (--tl-ink) with `accent: 'ink'`. The
 * three greys are the figure's own hairline weights, tuned to sit with the
 * brand's lines on white. Without tokens.css on the page each var falls back to
 * the kernel's own light palette.
 */
const THEME = `
[data-tl-figure]{--hairline-plate:var(--tl-bg);--hairline-hi:var(--tl-accent);--hairline-edge:#8e8d93;--hairline-mid:#bdbbb6;--hairline-lo:#e1dfda;background:var(--hl-plate)}
[data-tl-figure][data-tl-accent="iris"]{--hairline-hi:var(--tl-iris)}
[data-tl-figure][data-tl-accent="ink"]{--hairline-hi:var(--tl-ink)}
`;
let styled = false;
function style(doc) {
  HL.inject(doc);
  if (styled) return;
  styled = true;
  const s = doc.createElement('style');
  s.setAttribute('data-tl-figures', '');
  s.textContent = THEME;
  doc.head.appendChild(s);
}

/** Intensity 0..1 to the figure's own number: two lines that meet at 0.5, as in the package. */
function param(range, value) {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  const i = typeof n === 'number' && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5;
  const [lo, mid, hi] = range;
  const v = i <= 0.5 ? lo + (i / 0.5) * (mid - lo) : mid + ((i - 0.5) / 0.5) * (hi - mid);
  return Math.round(v * 1000) / 1000;
}

const mounted = new WeakMap();

/**
 * Mounts figure `name` into `el` (any block element; it takes a 5:4 box).
 * opts: { intensity 0..1 (default .5), play (walk the tour until a hand arrives),
 *         label (accessible name), onRead(text), accent: 'red' (default) | 'iris' | 'ink',
 *         lazy (default true: mount when the element nears the viewport) }
 * Returns { update(opts), destroy(), ready: Promise }.
 */
export function mountFigure(el, name, opts = {}) {
  const meta = FIGURES.find((f) => f.name === name);
  if (!meta) throw new Error(`figures: no figure named "${name}". Known: ${FIGURES.map((f) => f.name).join(', ')}`);
  if (!el || el.nodeType !== 1) throw new TypeError('figures: mountFigure(el, name) takes an element first.');
  mounted.get(el)?.();
  const doc = el.ownerDocument;
  style(doc);
  const o = { ...opts };
  const owned = [];
  const attr = (k, v) => { if (!el.hasAttribute(k) || owned.includes(k)) { el.setAttribute(k, v); if (!owned.includes(k)) owned.push(k); } };
  const dress = () => {
    attr('aria-label', typeof o.label === 'string' ? o.label : meta.description);
    attr('data-tl-accent', o.accent === 'iris' || o.accent === 'ink' ? o.accent : 'red');
  };
  attr('data-hairline', name);
  attr('data-tl-figure', name);
  attr('role', 'img');
  dress();

  let spec = null, handle = null, svg = null, playing = null, value = null, text = null, dead = false, io = null;
  const read = {
    get textContent() { return text; },
    set textContent(v) {
      const next = v == null ? '' : String(v);
      if (next === text) return;
      text = next;
      if (typeof o.onRead === 'function') try { o.onRead(next); } catch (err) { setTimeout(() => { throw err; }); }
    },
  };
  const start = (s) => {
    if (dead) return;
    spec = s;
    svg = HL.mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, el);
    value = param(spec.range, o.intensity);
    // the tour registers before the engine, so in each frame the ghost moves first, then the figure answers it
    playing = o.play === true ? HL.tour(el, spec.tour) : null;
    handle = spec.mount({ stage: el, svg, read }, value);
    if (text === null) read.textContent = 'rest';
  };
  let resolveReady, rejectReady;
  const ready = new Promise((res, rej) => { resolveReady = res; rejectReady = rej; });
  ready.catch(() => {});
  const load = () => LOAD[name]().then((m) => { start(m.default); resolveReady(); }, (err) => { rejectReady(err); setTimeout(() => { throw err; }); });

  if (o.lazy === false || typeof IntersectionObserver === 'undefined') load();
  else {
    io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); io = null; load(); }
    }, { rootMargin: '240px' });
    io.observe(el);
  }

  const destroy = () => {
    if (dead) return;
    dead = true;
    io?.disconnect();
    if (mounted.get(el) === destroy) mounted.delete(el);
    playing?.stop();
    handle?.destroy();
    svg?.remove();
    for (const k of owned) el.removeAttribute(k);
  };
  mounted.set(el, destroy);

  return {
    ready,
    update(next = {}) {
      if (dead) return;
      for (const k in next) { if (next[k] === undefined) delete o[k]; else o[k] = next[k]; }
      dress();
      if (!spec) return;
      const v = param(spec.range, o.intensity);
      if (v !== value) { value = v; handle.set(v); }
      if ((o.play === true) !== !!playing) {
        playing?.stop();
        playing = o.play === true ? HL.tour(el, spec.tour) : null;
      }
    },
    destroy,
  };
}

/**
 * Mounts every `[data-figure="name"]` under root, reading data-intensity,
 * data-play, data-accent and data-label. Returns the handles.
 */
export function mountAll(root = document, opts = {}) {
  return [...root.querySelectorAll('[data-figure]')].map((el) => mountFigure(el, el.dataset.figure, {
    ...opts,
    intensity: el.dataset.intensity ?? opts.intensity,
    play: el.dataset.play != null ? el.dataset.play !== 'false' : opts.play,
    accent: el.dataset.accent ?? opts.accent,
    label: el.dataset.label ?? opts.label,
  }));
}

/** The figure's own number for an intensity, for captions ("radius 3 cells"). */
export async function figureRange(name) {
  return (await LOAD[name]()).default.range;
}
