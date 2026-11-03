// The Studio 3D workspace: keeps the three.js scene in step with the project
// (board, breadboards, parts, wires), and turns pointer input into edits:
// placing parts with a snapping ghost, moving them, wiring pin to pin, and
// selecting things. Edits go through hooks.commit(mutator) so main.js can
// record undo history.
import * as THREE from 'three';
import { makeBreadboard } from '../scene/breadboard.js';
import { makeWire } from '../scene/wire.js';
import { PART, legPositions, P } from './catalog.js';
import { makeStudioBoard } from './boards.js';
import { epKey, uid } from './model.js';
import { ROWS_TOP, ROWS_BOT, RAILS } from './circuit/netlist.js';

const ROWS = [...ROWS_TOP, ...ROWS_BOT];
const CELL = P / 2;
const cellOf = (x, z) => `${Math.round(x / CELL)}:${Math.round(z / CELL)}`;

function cssColor(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(v || fallback);
}

function disposeTree(obj) {
  obj.traverse((o) => { if (o.geometry && !o.geometry.userData?.shared) o.geometry.dispose?.(); });
}

/** Make a translucent copy of a part model for the drag ghost. */
function ghostify(group, opacity = 0.5) {
  group.traverse((o) => {
    if (o.isSprite || (o.isMesh && o.material?.blending === THREE.AdditiveBlending) || o.isPointLight) { o.visible = false; return; }
    if (o.material) {
      const m = Array.isArray(o.material) ? o.material.map((x) => x.clone()) : o.material.clone();
      for (const x of [m].flat()) { x.transparent = true; x.opacity = o.isLineSegments ? 0.25 : opacity; x.depthWrite = false; }
      o.material = m;
      o.castShadow = false;
      o.raycast = () => {};
    }
  });
  group.renderOrder = 5;
  return group;
}

const holeLabel = (e) => (RAILS.includes(e.row) ? `${e.row.startsWith('top') ? 'top' : 'bottom'} ${e.row.endsWith('+') ? '+' : '−'} rail` : `row ${e.col}${e.row}`);

export class Workspace {
  constructor(stage, hooks) {
    this.stage = stage;
    this.hooks = hooks;
    this.root = new THREE.Group();
    stage.setContent(this.root);
    this.bbs = new Map();
    this.parts = new Map();
    this.wires = new Map();
    this.endpoints = [];
    this.epByKey = new Map();
    this.holeIndex = new Map();
    this.occupied = new Map();
    this.selection = null;
    this.placing = null;
    this.drag = null;
    this.wiring = null;
    this.hoverEp = null;
    this.wireColor = 'orange';
    this.iris = cssColor('--tl-iris', '#5b3df5');
    this.red = cssColor('--tl-accent', '#e5132d');
    this.#overlays();
    stage.onPointerDown = (e) => this.#down(e);
    stage.onHover = (e) => this.#move(e);
    stage.onPointerUp = (e) => this.#up(e);
    stage.onBackgroundClick = () => { if (!this.placing && !this.wiring) this.select(null); };
    stage.onTick((dt) => this.#tick(dt));
  }

  #overlays() {
    const ov = new THREE.Group();
    ov.renderOrder = 10;
    this.stage.scene.add(ov);
    this.overlay = ov;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.11, 0.17, 28), new THREE.MeshBasicMaterial({ color: this.iris, transparent: true, opacity: 0.95, depthTest: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.renderOrder = 20;
    ring.visible = false;
    ov.add(ring);
    this.hoverRing = ring;
    const start = ring.clone();
    start.material = ring.material.clone();
    start.scale.setScalar(1.25);
    ov.add(start);
    this.startRing = start;
    const marks = new THREE.InstancedMesh(new THREE.CircleGeometry(0.1, 20), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, depthTest: false }), 32);
    marks.rotation.x = -Math.PI / 2;
    marks.count = 0;
    marks.renderOrder = 19;
    marks.frustumCulled = false;
    ov.add(marks);
    this.marks = marks;
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]);
    const line = new THREE.Line(lineGeo, new THREE.LineDashedMaterial({ color: this.iris, dashSize: 0.18, gapSize: 0.12, depthTest: false, transparent: true }));
    line.renderOrder = 21;
    line.visible = false;
    line.frustumCulled = false;
    ov.add(line);
    this.rubber = line;
    this.selBox = new THREE.Group();
    ov.add(this.selBox);
  }

  // ================================================================ sync with the project
  sync(project) {
    this.project = project;
    // board
    if (this.boardType !== project.board) {
      if (this.board) { this.root.remove(this.board.api.group); disposeTree(this.board.api.group); }
      this.board = makeStudioBoard(project.board);
      this.boardType = project.board;
      this.root.add(this.board.api.group);
      this.board.api.group.updateMatrixWorld(true);
    }
    // breadboards
    const seenBB = new Set();
    for (const b of project.breadboards) {
      seenBB.add(b.id);
      const hash = `${b.x},${b.z}`;
      let ent = this.bbs.get(b.id);
      if (!ent || ent.hash !== hash) {
        if (ent) this.root.remove(ent.api.group);
        const api = makeBreadboard();
        api.group.position.set(b.x, 0, b.z);
        api.group.userData.bbId = b.id;
        this.root.add(api.group);
        api.group.updateMatrixWorld(true);
        ent = { api, hash };
        this.bbs.set(b.id, ent);
      }
    }
    for (const [id, ent] of this.bbs) if (!seenBB.has(id)) { this.root.remove(ent.api.group); this.bbs.delete(id); }
    this.#indexHoles();
    // parts
    const seenP = new Set();
    this.occupied.clear();
    for (const part of project.parts) {
      const def = PART[part.type];
      if (!def) continue;
      seenP.add(part.id);
      let holes = null, keys = null;
      if (def.mount === 'bb') {
        const r = this.legHoles(part);
        if (!r) continue;
        ({ holes, keys } = r);
        keys.forEach((k) => this.occupied.set(k, `part:${part.id}`));
      }
      const live = new Set((def.controls ?? []).filter((c) => c.live).map((c) => c.key));
      const props = Object.fromEntries(Object.entries(part.props).filter(([k]) => !live.has(k)));
      const hash = JSON.stringify([part.type, props, part.rot, part.at, part.pos, holes?.map((h) => [h.x.toFixed(3), h.z.toFixed(3)])]);
      let ent = this.parts.get(part.id);
      if (!ent || ent.hash !== hash) {
        if (ent) { this.root.remove(ent.api.group); disposeTree(ent.api.group); }
        const pos = part.pos ? new THREE.Vector3(part.pos[0], 0, part.pos[1]) : null;
        const api = def.build({ holes, pos, rot: part.rot, props: part.props });
        api.group.userData.partId = part.id;
        this.root.add(api.group);
        api.group.updateMatrixWorld(true);
        ent = { api, hash, def, keys };
        this.parts.set(part.id, ent);
        this.hooks.partBuilt?.(part.id, api);
      }
      ent.keys = keys;
    }
    for (const [id, ent] of this.parts) if (!seenP.has(id)) { this.root.remove(ent.api.group); disposeTree(ent.api.group); this.parts.delete(id); }
    this.#indexEndpoints();
    // wires
    const seenW = new Set();
    for (const w of project.wires) {
      const a = this.epPos(w.a), b = this.epPos(w.b);
      if (!a || !b) continue;
      seenW.add(w.id);
      this.occupied.set(epKey(w.a), `wire:${w.id}`);
      this.occupied.set(epKey(w.b), `wire:${w.id}`);
      const hash = `${w.color}|${a.toArray().map((x) => x.toFixed(3))}|${b.toArray().map((x) => x.toFixed(3))}`;
      let ent = this.wires.get(w.id);
      if (!ent || ent.hash !== hash) {
        if (ent) { this.root.remove(ent.api.group); disposeTree(ent.api.group); }
        const api = makeWire(a, b, w.color);
        api.group.userData.wireId = w.id;
        this.root.add(api.group);
        ent = { api, hash };
        this.wires.set(w.id, ent);
      }
    }
    for (const [id, ent] of this.wires) if (!seenW.has(id)) { this.root.remove(ent.api.group); disposeTree(ent.api.group); this.wires.delete(id); }
    this.root.updateMatrixWorld(true);
    if (this.selection && !this.#exists(this.selection)) this.select(null);
    else this.#drawSelection();
  }

  #exists(sel) {
    if (sel.kind === 'part') return this.parts.has(sel.id);
    if (sel.kind === 'wire') return this.wires.has(sel.id);
    if (sel.kind === 'bb') return this.bbs.has(sel.id);
    return true;
  }

  #indexHoles() {
    this.holeIndex.clear();
    this.holes = [];
    for (const [id, { api }] of this.bbs) {
      for (let col = 1; col <= 30; col++) {
        for (const row of ROWS) this.#addHole(id, col, row, api.hole(col, row));
        if (col % 6 !== 0) for (const row of RAILS) this.#addHole(id, col, row, api.hole(col, row));
      }
    }
  }

  #addHole(bb, col, row, pos) {
    const ep = { t: 'hole', bb, col, row };
    const e = { key: epKey(ep), ep, pos, label: holeLabel(ep), kind: 'hole' };
    this.holes.push(e);
    this.holeIndex.set(cellOf(pos.x, pos.z), e);
  }

  /** Breadboard hole nearest a world point (within tol cm). */
  holeAt(p, tol = 0.07) {
    const cx = Math.round(p.x / CELL), cz = Math.round(p.z / CELL);
    let best = null, bd = tol;
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++) {
        const e = this.holeIndex.get(`${cx + dx}:${cz + dz}`);
        if (!e) continue;
        const d = Math.hypot(e.pos.x - p.x, e.pos.z - p.z);
        if (d < bd) { bd = d; best = e; }
      }
    return best;
  }

  /** Hole positions + netlist keys of a breadboard part's legs, or null. */
  legHoles(part) {
    const def = PART[part.type];
    const bb = this.bbs.get(part.at?.bb);
    if (!bb) return null;
    const origin = bb.api.hole(part.at.col, part.at.row);
    const holes = [], keys = [];
    for (const p of legPositions(def, origin, part.rot)) {
      const h = this.holeAt(p);
      if (!h) return null;
      holes.push(h.pos.clone());
      keys.push(h.key);
    }
    return { holes, keys };
  }

  #indexEndpoints() {
    const eps = [];
    const b = this.board;
    for (const pin of b.pinNames) {
      let pos;
      try { pos = b.api.pin(pin); } catch { continue; }
      const ep = { t: 'board', pin };
      eps.push({ key: epKey(ep), ep, pos, label: `${b.def.name} · ${b.label(pin)}`, kind: 'board' });
    }
    for (const part of this.project.parts) {
      const ent = this.parts.get(part.id);
      if (!ent || ent.def.mount !== 'free') continue;
      for (const pin of ent.def.pins) {
        const pos = ent.api.pinWorld(pin);
        if (!pos) continue;
        const ep = { t: 'part', id: part.id, pin };
        eps.push({ key: epKey(ep), ep, pos, label: `${ent.def.name} · ${pin}`, kind: 'pin', partId: part.id });
      }
    }
    this.endpoints = [...eps, ...this.holes];
    this.epByKey = new Map(this.endpoints.map((e) => [e.key, e]));
  }

  epPos(ep) { return this.epByKey.get(epKey(ep))?.pos ?? null; }
  epInfo(ep) { return this.epByKey.get(epKey(ep)) ?? null; }

  // ================================================================ geometry helpers
  #ray(e) {
    const r = this.stage.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.stage.raycaster.setFromCamera(ndc, this.stage.camera);
    return this.stage.raycaster.ray;
  }
  planePoint(e, y = 0) {
    const ray = this.#ray(e);
    const out = new THREE.Vector3();
    return ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -y), out) ? out : null;
  }

  /** Endpoint under the cursor (screen distance), preferring board/module pins over holes. */
  endpointAt(e, maxPx = 11) {
    const r = this.stage.canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    // scale the pick radius with zoom so neighbouring holes stay separable
    const a = this.stage.project(new THREE.Vector3(0, 0.85, 0)), b = this.stage.project(new THREE.Vector3(P, 0.85, 0));
    const pitchPx = Math.hypot(a.x - b.x, a.y - b.y);
    const lim = Math.min(maxPx, Math.max(4, pitchPx * 0.55));
    let best = null, bd = lim;
    for (const ep of this.endpoints) {
      const s = this.stage.project(ep.pos);
      const d = Math.hypot(s.x - x, s.y - y) - (ep.kind === 'hole' ? 0 : 2);
      if (d < bd) { bd = d; best = ep; }
    }
    return best;
  }

  #pickTargets() {
    const t = [];
    for (const [id, ent] of this.parts) t.push({ object: ent.api.pick ?? ent.api.group, kind: 'part', id });
    for (const [id, ent] of this.wires) t.push({ object: ent.api.pick, kind: 'wire', id });
    for (const [id, ent] of this.bbs) t.push({ object: ent.api.group, kind: 'bb', id });
    if (this.board) t.push({ object: this.board.api.group, kind: 'board', id: 'board' });
    return t;
  }

  // ================================================================ placement
  /** Snap a breadboard part: leg 0 hole + validity for a cursor point. */
  snapBB(def, point, rot, ignore = null) {
    const legs = legPositions(def, new THREE.Vector3(), rot);
    const cx = legs.reduce((s, l) => s + l.x, 0) / legs.length, cz = legs.reduce((s, l) => s + l.z, 0) / legs.length;
    const target = new THREE.Vector3(point.x - cx, 0, point.z - cz);
    const cands = this.holes.map((h) => ({ h, d: Math.hypot(h.pos.x - target.x, h.pos.z - target.z) })).filter((c) => c.d < 1.2).sort((a, b) => a.d - b.d).slice(0, 14);
    let first = null;
    for (const { h } of cands) {
      const ps = legPositions(def, h.pos, rot);
      const found = ps.map((p) => this.holeAt(p));
      const ok = found.every((f) => f && (!this.occupied.has(f.key) || this.occupied.get(f.key) === ignore));
      const res = { ok, at: { bb: h.ep.bb, col: h.ep.col, row: h.ep.row }, holes: ps.map((p, i) => found[i]?.pos ?? p), found };
      if (ok) return res;
      first ??= res;
    }
    return first;
  }

  beginPlacing(type, props = null, opts = {}) {
    this.cancel();
    const def = PART[type];
    this.placing = { type, def, props: { ...def.defaults, ...(props ?? {}) }, rot: opts.rot ?? 0, ghost: null, ghostKey: '', snap: null, moveId: opts.moveId ?? null };
    this.stage.canvas.classList.add('is-placing');
    this.hooks.mode?.('placing', def);
  }

  /** Update the ghost for a pointer position (client coords). */
  placingMove(e) {
    const pl = this.placing;
    if (!pl) return;
    const def = pl.def;
    if (def.mount === 'bb') {
      const pt = this.planePoint(e, 0.85);
      if (!pt) return;
      const snap = this.snapBB(def, pt, pl.rot, pl.moveId ? `part:${pl.moveId}` : null);
      pl.snap = snap;
      if (!snap) { this.#setGhost(null); this.#marks([]); return; }
      const key = JSON.stringify([snap.at, pl.rot]);
      if (key !== pl.ghostKey) {
        pl.ghostKey = key;
        const api = def.build({ holes: snap.holes.map((h) => h.clone()), props: pl.props, rot: pl.rot });
        this.#setGhost(ghostify(api.group));
      }
      this.#marks(snap.holes.map((h, i) => ({ pos: h, ok: snap.found[i] && (!this.occupied.has(snap.found[i].key) || this.occupied.get(snap.found[i].key) === `part:${pl.moveId}`) })));
    } else {
      const pt = this.planePoint(e, 0);
      if (!pt) return;
      const x = Math.round(pt.x / P) * P, z = Math.round(pt.z / P) * P;
      pl.snap = { ok: true, pos: [x, z] };
      const key = `rot${pl.rot}`;
      if (key !== pl.ghostKey) {
        pl.ghostKey = key;
        const api = def.build({ pos: new THREE.Vector3(), rot: pl.rot, props: pl.props });
        this.#setGhost(ghostify(api.group));
      }
      pl.ghost.position.set(x, 0, z);
      this.#marks([]);
    }
  }

  #setGhost(g) {
    const pl = this.placing;
    if (pl.ghost) { this.overlay.remove(pl.ghost); disposeTree(pl.ghost); }
    pl.ghost = g;
    if (g) this.overlay.add(g);
  }

  #marks(list) {
    const m = this.marks;
    m.count = Math.min(32, list.length);
    const o = new THREE.Object3D();
    for (let i = 0; i < m.count; i++) {
      o.position.set(list[i].pos.x, list[i].pos.y + 0.006, list[i].pos.z);
      o.rotation.x = -Math.PI / 2;
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, list[i].ok ? this.iris : this.red);
    }
    m.rotation.set(0, 0, 0);
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }

  /** Drop the part being placed (returns true when placed). */
  placeAt(e) {
    const pl = this.placing;
    if (!pl) return false;
    this.placingMove(e);
    const snap = pl.snap;
    if (!snap || !snap.ok) {
      this.hooks.toast?.(pl.def.mount === 'bb' ? 'Every leg needs a free breadboard hole. Move it onto the breadboard.' : 'Can’t place it there.');
      return false;
    }
    const { type, props, rot, moveId } = pl;
    let newId = moveId;
    this.hooks.commit((p) => {
      if (moveId) {
        const part = p.parts.find((x) => x.id === moveId);
        if (!part) return;
        part.rot = rot;
        if (snap.at) part.at = snap.at; else part.pos = snap.pos;
      } else {
        newId = uid(type.slice(0, 3));
        const part = { id: newId, type, rot, props: { ...props } };
        if (snap.at) part.at = snap.at; else part.pos = snap.pos;
        p.parts.push(part);
      }
    }, moveId ? 'Move part' : `Add ${pl.def.name}`);
    this.cancel();
    this.select({ kind: 'part', id: newId });
    return true;
  }

  rotatePlacing() {
    if (!this.placing) return false;
    this.placing.rot = (this.placing.rot + 1) % 4;
    this.placing.ghostKey = '';
    if (this.lastPointer) this.placingMove(this.lastPointer);
    return true;
  }

  cancel() {
    if (this.placing) {
      this.#setGhost(null);
      this.placing = null;
      this.#marks([]);
      this.stage.canvas.classList.remove('is-placing');
      this.hooks.mode?.(null);
    }
    if (this.wiring) this.#endWiring();
    if (this.drag?.ghost) { this.overlay.remove(this.drag.ghost); }
    this.drag = null;
  }

  // ================================================================ wiring
  #startWiring(ep) {
    this.wiring = { from: ep };
    this.startRing.position.copy(ep.pos).add(new THREE.Vector3(0, 0.02, 0));
    this.startRing.visible = true;
    this.hooks.mode?.('wiring', ep);
  }
  #endWiring() {
    this.wiring = null;
    this.startRing.visible = false;
    this.rubber.visible = false;
    if (this.preview) { this.overlay.remove(this.preview.group); this.preview = null; }
    this.hooks.mode?.(null);
  }
  #finishWire(to) {
    const from = this.wiring.from;
    this.#endWiring();
    if (to.key === from.key) return;
    const auto = this.#autoColor(from, to);
    const id = uid('w');
    this.hooks.commit((p) => { p.wires.push({ id, a: from.ep, b: to.ep, color: auto }); }, 'Add wire');
    this.select({ kind: 'wire', id });
  }
  #autoColor(a, b) {
    const pins = [a, b].filter((e) => e.ep.t === 'board').map((e) => e.ep.pin);
    if (this.colorLocked) return this.wireColor;
    if (pins.some((p) => /^GND/.test(p))) return 'black';
    if (pins.some((p) => /^(5V|3V3|VIN|IOREF)/.test(p))) return 'red';
    const rails = [a, b].filter((e) => e.ep.t === 'hole' && RAILS.includes(e.ep.row)).map((e) => e.ep.row);
    if (rails.some((r) => r.endsWith('-'))) return 'black';
    if (rails.some((r) => r.endsWith('+'))) return 'red';
    return this.wireColor;
  }
  /** Start / finish a wire at an endpoint (keyboard and test entry point). */
  wireTap(ep) {
    if (this.wiring) this.#finishWire(ep); else this.#startWiring(ep);
  }

  // ================================================================ pointer
  #isFree(ep) { return !this.occupied.has(ep.key); }

  #down(e) {
    this.lastPointer = e;
    this.downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (this.placing) {
      if (e.pointerType === 'touch' || e.button === 0) this.placeAt(e);
      return true;
    }
    const ep = this.endpointAt(e);
    if (this.wiring) {
      if (ep && this.#isFree(ep) && ep.key !== this.wiring.from.key) this.#finishWire(ep);
      else if (ep && ep.key === this.wiring.from.key) this.#endWiring();
      else if (!ep) { this.#endWiring(); return false; }
      else this.hooks.toast?.('That hole is already in use: pick a free one.');
      return true;
    }
    const hit = this.stage.pick(e.clientX, e.clientY, this.#pickTargets());
    // a pin/hole wins over the breadboard and the board, a part body wins over a hole it covers
    if (ep && this.#isFree(ep) && (!hit || hit.kind === 'bb' || hit.kind === 'board' || (hit.kind === 'part' && ep.kind !== 'hole'))) {
      this.#startWiring(ep);
      this.drag = { kind: 'wire-drag', from: ep, x: e.clientX, y: e.clientY, moved: false };
      this.stage.canvas.setPointerCapture?.(e.pointerId);
      return true;
    }
    if (!hit) return false;
    if (hit.kind === 'board') { this.select({ kind: 'board', id: 'board' }); return false; }
    this.select({ kind: hit.kind, id: hit.id });
    if (hit.kind === 'part' || (hit.kind === 'bb' && (e.shiftKey || !ep || true))) {
      this.drag = { kind: hit.kind, id: hit.id, x: e.clientX, y: e.clientY, moved: false };
      this.stage.canvas.setPointerCapture?.(e.pointerId);
    }
    return true;
  }

  #move(e) {
    if (!e) { this.#hover(null); return; }
    this.lastPointer = e;
    if (this.placing) { this.placingMove(e); return; }
    const d = this.drag;
    if (d) {
      const far = Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5;
      if (d.kind === 'wire-drag') {
        if (far) d.moved = true;
      } else if (far && !d.moved) {
        d.moved = true;
        if (d.kind === 'part') {
          const part = this.project.parts.find((p) => p.id === d.id);
          const ent = this.parts.get(d.id);
          if (part && ent) {
            ent.api.group.visible = false;
            this.beginPlacing(part.type, part.props, { rot: part.rot, moveId: part.id });
            this.placing.fromDrag = true;
            this.placingMove(e);
          }
          return;
        }
        if (d.kind === 'bb') {
          const bb = this.bbs.get(d.id);
          const start = this.planePoint({ clientX: d.x, clientY: d.y }, 0.85);
          d.offset = start ? new THREE.Vector3().subVectors(bb.api.group.position, start) : new THREE.Vector3();
          d.ghost = ghostify(makeBreadboard().group, 0.45);
          this.overlay.add(d.ghost);
        }
      }
      if (d.moved && d.kind === 'bb') {
        const pt = this.planePoint(e, 0.85);
        if (pt) {
          const p = pt.add(d.offset);
          d.to = [Math.round(p.x / P) * P, Math.round(p.z / P) * P];
          d.ghost.position.set(d.to[0], 0, d.to[1]);
        }
        return;
      }
    }
    if (this.wiring) {
      const ep = this.endpointAt(e);
      this.#hover(ep);
      this.#previewTo(ep && this.#isFree(ep) && ep.key !== this.wiring.from.key ? ep : null, e);
      return;
    }
    this.#hover(this.endpointAt(e));
  }

  #up(e) {
    const d = this.drag;
    if (this.placing?.fromDrag) {
      const moveId = this.placing.moveId;
      const ok = this.placeAt(e);
      if (!ok) this.cancel();
      const ent = this.parts.get(moveId);
      if (ent) ent.api.group.visible = true;
      this.drag = null;
      return;
    }
    if (!d) return;
    this.drag = null;
    if (d.kind === 'wire-drag') {
      if (d.moved && this.wiring) {
        const ep = this.endpointAt(e);
        if (ep && this.#isFree(ep) && ep.key !== this.wiring.from.key) this.#finishWire(ep);
        else this.#endWiring();
      }
      return;
    }
    if (d.kind === 'bb' && d.moved) {
      this.overlay.remove(d.ghost);
      if (d.to) this.hooks.commit((p) => { const b = p.breadboards.find((x) => x.id === d.id); if (b) { b.x = d.to[0]; b.z = d.to[1]; } }, 'Move breadboard');
    }
  }

  #hover(ep) {
    this.hoverEp = ep;
    if (ep) {
      this.hoverRing.position.copy(ep.pos).add(new THREE.Vector3(0, 0.015, 0));
      this.hoverRing.material.color.copy(this.#isFree(ep) || (this.wiring && ep.key === this.wiring.from.key) ? this.iris : this.red);
      this.hoverRing.visible = true;
    } else this.hoverRing.visible = false;
    this.stage.canvas.style.cursor = this.placing ? 'copy' : ep ? 'crosshair' : '';
    this.hooks.hover?.(ep, this.lastPointer);
  }

  #previewTo(ep, e) {
    const from = this.wiring.from;
    if (this.preview && this.preview.key !== ep?.key) { this.overlay.remove(this.preview.group); this.preview = null; }
    if (ep) {
      if (!this.preview) {
        const w = makeWire(from.pos, ep.pos, this.#autoColor(from, ep));
        ghostify(w.group, 0.7);
        this.overlay.add(w.group);
        this.preview = { key: ep.key, group: w.group };
      }
      this.rubber.visible = false;
      return;
    }
    const pt = this.planePoint(e, from.pos.y);
    if (!pt) return;
    const pos = this.rubber.geometry.attributes.position;
    pos.setXYZ(0, from.pos.x, from.pos.y + 0.05, from.pos.z);
    pos.setXYZ(1, pt.x, pt.y + 0.05, pt.z);
    pos.needsUpdate = true;
    this.rubber.computeLineDistances();
    this.rubber.visible = true;
  }

  // ================================================================ selection
  select(sel) {
    this.selection = sel;
    this.#drawSelection();
    this.hooks.select?.(sel);
  }

  #drawSelection() {
    const g = this.selBox;
    while (g.children.length) { const c = g.children.pop(); c.geometry?.dispose(); }
    const sel = this.selection;
    if (!sel) return;
    const mat = new THREE.MeshBasicMaterial({ color: this.iris, transparent: true, opacity: 0.9, depthTest: false });
    if (sel.kind === 'wire') {
      const ent = this.wires.get(sel.id);
      if (!ent) return;
      const tube = new THREE.Mesh(new THREE.TubeGeometry(ent.api.curve, 96, 0.12, 8, false), new THREE.MeshBasicMaterial({ color: this.iris, transparent: true, opacity: 0.35, depthWrite: false }));
      tube.raycast = () => {};
      g.add(tube);
      return;
    }
    let obj = null;
    if (sel.kind === 'part') obj = this.parts.get(sel.id)?.api.group;
    else if (sel.kind === 'bb') obj = this.bbs.get(sel.id)?.api.group;
    else if (sel.kind === 'board') obj = this.board?.api.group;
    if (!obj) return;
    const box = new THREE.Box3();
    obj.updateMatrixWorld(true);
    obj.traverse((o) => {
      if (!o.isMesh || o.isSprite || o.material?.blending === THREE.AdditiveBlending || !o.visible) return;
      o.geometry.computeBoundingBox();
      box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
    });
    if (box.isEmpty()) return;
    const pad = 0.18, y = box.min.y + 0.01;
    const x0 = box.min.x - pad, x1 = box.max.x + pad, z0 = box.min.z - pad, z1 = box.max.z + pad;
    const t = 0.035, L = Math.min(0.6, (x1 - x0) / 3, (z1 - z0) / 3);
    // corner brackets: calm, and they never hide the part
    for (const [cx, cz, sx, sz] of [[x0, z0, 1, 1], [x1, z0, -1, 1], [x0, z1, 1, -1], [x1, z1, -1, -1]]) {
      const h = new THREE.Mesh(new THREE.BoxGeometry(L, 0.01, t), mat);
      h.position.set(cx + (sx * L) / 2, y, cz);
      const v = new THREE.Mesh(new THREE.BoxGeometry(t, 0.01, L), mat);
      v.position.set(cx, y, cz + (sz * L) / 2);
      h.renderOrder = v.renderOrder = 22;
      g.add(h, v);
    }
  }

  /** Bounding box of everything (for framing the camera). */
  bounds() {
    const box = new THREE.Box3().setFromObject(this.root);
    return box;
  }

  #tick(dt) {
    for (const ent of this.parts.values()) ent.api.tick?.(dt);
    const flow = this.flowOn;
    for (const ent of this.wires.values()) ent.api.tick(dt, flow);
  }

  /** World position (top) of a part for floating labels. */
  anchorOf(id) {
    const ent = this.parts.get(id);
    return ent ? ent.api.anchor : null;
  }
}
