// Builds a lesson's circuit into a scene graph. Shared by the lesson app, the
// build-guide viewer and Tinker Studio, so every one of them sees exactly the
// same parts, wires and assembly order.
import * as THREE from 'three';
import { makeBreadboard } from './breadboard.js';
import { makeWire } from './wire.js';

/** Panels that do nothing: used where a lesson is built without the lesson app (guides, thumbnails, tests). */
export const NULL_DOCK = {
  camera: () => ({
    el: null, camera: null,
    project: () => ({ x: 0, y: 0, visible: false }),
    boxOf: () => ({ x: 0, y: 0, w: 0, h: 0, visible: false }),
    draw() {}, clear() {}, label() {}, tick() {},
  }),
  browser: () => ({ el: null, update() {}, setUrl() {} }),
  plotter: () => ({ el: null, push() {}, reset() {}, tick() {} }),
};

/**
 * Build a lesson.
 * @returns {{ root: THREE.Group, built: object, st: object, ctx: object, error: Error|null }}
 *   st.steps is the assembly order: one entry per breadboard, part, object and wire, in the
 *   order the lesson added them: { kind, label, objects, part?, wire?, from?, to?, caption? }.
 */
export function buildLessonScene(lesson, { board, dock = NULL_DOCK, onDarkness = () => {} } = {}) {
  const root = new THREE.Group();
  root.add(board.group);
  board.group.updateMatrixWorld(true);
  const st = { wires: [], interactive: [], anchors: {}, tickers: [], steps: [] };
  for (const [k, p] of Object.entries(board.anchors ?? {})) st.anchors[k] = p.clone();
  let caption = null;
  const step = (s) => {
    s.caption = caption;
    caption = null;
    st.steps.push(s);
  };
  const ctx = {
    board,
    THREE,
    breadboard(x, z, opts = {}) {
      const bb = makeBreadboard();
      bb.group.position.set(x, 0, z);
      if (opts.rotY) bb.group.rotation.y = opts.rotY;
      root.add(bb.group);
      bb.group.updateMatrixWorld(true);
      step({ kind: 'breadboard', label: 'Breadboard', objects: [bb.group] });
      return bb;
    },
    add(part) {
      root.add(part.group);
      part.group.updateMatrixWorld?.(true);
      if (part.tick) st.tickers.push((dt) => part.tick(dt));
      step({ kind: part.kind ?? 'part', label: part.label ?? null, objects: [part.group], part });
      return part;
    },
    addObject(obj) {
      root.add(obj);
      obj.updateMatrixWorld(true);
      step({ kind: 'object', label: obj.userData?.label ?? null, objects: [obj] });
      return obj;
    },
    wire(a, b, color, opts = {}) {
      const w = makeWire(a, b, color, opts);
      root.add(w.group);
      st.wires.push(w);
      step({ kind: 'wire', label: opts.label ?? null, objects: [w.group], wire: w, from: a.clone(), to: b.clone(), color, signal: opts.signal ?? null });
      return w;
    },
    /** Optional: the caption for the next assembly step ("Push the LED into row c"). */
    step(text) { caption = text; },
    interact(part, spec) { st.interactive.push({ object: part.pick ?? part.group, part, ...spec }); },
    anchor(name, p) { st.anchors[name] = typeof p.clone === 'function' ? p.clone() : p; },
    onTick(fn) { st.tickers.push(fn); },
    setDarkness: onDarkness,
    camera: (opts) => dock.camera(opts),
    browser: (opts) => dock.browser(opts),
    plotter: (opts) => dock.plotter(opts),
  };
  let built = {}, error = null;
  try {
    built = lesson.build(ctx) ?? {};
  } catch (e) {
    error = e;
    console.error(`Lesson ${lesson.id} failed to build`, e);
  }
  root.updateMatrixWorld(true);
  return { root, built, st, ctx, error };
}
