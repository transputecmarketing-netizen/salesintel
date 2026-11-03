// Tinker Studio: the free-build maker space. Wires the 3D workspace, the live
// circuit solver, the Arduino runtime, the editor and the project storage
// together.
import '../brand/tokens.css';
import '@fontsource/ibm-plex-mono/600.css';
import './studio.css';
import { Stage, Thumbnailer } from '../scene/stage.js';
import { markSVG } from '../brand/logo.js';
import { lucide, hydrateIcons } from '../brand/lucide.js';
import { PARTS, PART, CATEGORIES, thumbObject, fmtOhms, snapOhms, OHM_PRESETS, bandNames, LED_MAX_MA, LED_TYPES, legPositions, P } from './catalog.js';
import { STUDIO_BOARDS, STUDIO_BOARD_ORDER } from './boards.js';
import { Workspace } from './workspace.js';
import { Sim } from './circuit/sim.js';
import { boardKey } from './circuit/netlist.js';
import { createHal, analyzeModules } from './hal.js';
import { CodeEditor } from './editor.js';
import { SerialMonitor, Plotter, DebugPanel } from './panels.js';
import { storage, shareUrl, fromShare, download, fileSafe } from './projects.js';
import { EXAMPLES } from './examples.js';
import { newProject, normalizeProject, clone, uid, WIRE_COLORS, BB_SPOT, epKey } from './model.js';
import { loadRuntime } from './runtime.js';
import { play, setSoundEnabled, soundEnabled } from './sound.js';
import { WIRE } from '../scene/wire.js';
import * as THREE from 'three';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mA = (i) => `${(Math.abs(i) * 1000).toFixed(Math.abs(i) < 0.01 ? 2 : 1)} mA`;
const volts = (v) => `${v.toFixed(2)} V`;

// ================================================================ state
let project = newProject();
const states = new Map();          // partId → runtime state (pressed, burnt, angle…)
const undo = [], redo = [];
let modules = new Map();
let rt = null, vm = null, hal = null, compiled = null;
let runState = 'idle';             // idle | running | paused | error
let frameResult = null;
const sticky = new Map();          // warning id → { w, until }
const dismissed = new Set();
const hints = new Map();           // runtime hints (floating pins…) id → { w, until }
let diagnostics = [];
let runtimeErrors = [];

// ================================================================ stage + workspace
const app = $('#app');
$('[data-logo]').innerHTML = markSVG({ size: 26 });
hydrateIcons(document);
const stageEl = $('#stage');
const stage = new Stage($('#stage-canvas'), stageEl);
stage.reducedMotion = reducedMotion;
const sim = new Sim();

const ws = new Workspace(stage, {
  commit,
  select: renderInspector,
  hover: showTip,
  toast,
  mode: showMode,
  press: (id, on) => { const d = PART[project.parts.find((x) => x.id === id)?.type]; setHeld(id, typeof d?.hold === 'string' ? d.hold : 'pressed', on); },
  click: clickPart,
});
ws.flowOn = !reducedMotion;

// ================================================================ editor + dock
const editor = new CodeEditor($('#editor'), {
  doc: project.code,
  onChange(text) {
    project.code = text;
    scheduleSave();
    scheduleLint();
  },
  onBreakpoints(lines) { vm?.setBreakpoints?.(lines); },
});
const plotter = new Plotter($('#panel-plot'));
const monitor = new SerialMonitor($('#panel-serial'), { onSend: (t) => vm?.serialInput?.(t) });
monitor.onLine = (l) => plotter.line(l);
const debug = new DebugPanel($('#panel-debug'), {
  onContinue: () => resume(),
  onStep: () => vm?.step?.(),
  onStepOver: () => (vm?.stepOver ?? vm?.step)?.call(vm),
  onStepOut: () => (vm?.stepOut ?? vm?.step)?.call(vm),
});
$('#btn-clear').onclick = () => { monitor.clear(); plotter.reset(); };
function dockTab(name) {
  for (const b of $$('.dock-tabs [role=tab]')) b.setAttribute('aria-selected', String(b.dataset.tab === name));
  for (const p of $$('.dock-panel')) p.hidden = p.dataset.panel !== name;
  if (name === 'plot') { plotter.dirty = true; plotter.draw(); }
}
for (const b of $$('.dock-tabs [role=tab]')) b.onclick = () => dockTab(b.dataset.tab);

// ================================================================ boards
const boardSel = $('#board-select');
boardSel.innerHTML = STUDIO_BOARD_ORDER.map((id) => `<option value="${id}">${STUDIO_BOARDS[id].name}</option>`).join('');
boardSel.onchange = () => changeBoard(boardSel.value);

const PIN_MAP_TO_ESP = { A0: 'VP', A1: 'VN', A2: 'GPIO34', A3: 'GPIO35', A4: 'GPIO32', A5: 'GPIO33', '5V': 'VIN', IOREF: 'VIN' };
function mapPin(pin, from, to) {
  const def = STUDIO_BOARDS[to];
  const has = (p) => def.pins[p] || def.power[p] != null || def.gnd.includes(p);
  if (has(pin)) return pin;
  if (/^GND/.test(pin)) return def.gnd[0];
  if (to === 'esp32') {
    const m = /^D(\d+)$/.exec(pin);
    if (m && def.pins[`GPIO${m[1]}`]) return `GPIO${m[1]}`;
    if (PIN_MAP_TO_ESP[pin] && has(PIN_MAP_TO_ESP[pin])) return PIN_MAP_TO_ESP[pin];
    return null;
  }
  if (from === 'esp32') {
    const m = /^GPIO(\d+)$/.exec(pin);
    if (m && def.pins[`D${m[1]}`]) return `D${m[1]}`;
    const back = Object.entries(PIN_MAP_TO_ESP).find(([, v]) => v === pin);
    if (back && has(back[0])) return back[0];
    if (pin === 'VIN') return '5V';
  }
  return null;
}

function changeBoard(id) {
  if (id === project.board) return;
  const from = project.board;
  let dropped = 0;
  stopRun();
  commit((p) => {
    p.board = id;
    const dx = (BB_SPOT[id]?.[0] ?? 9.4) - (BB_SPOT[from]?.[0] ?? 9.4);
    for (const b of p.breadboards) b.x += dx;
    for (const part of p.parts) if (part.pos) part.pos[0] += dx;
    p.wires = p.wires.filter((w) => {
      for (const k of ['a', 'b']) {
        if (w[k].t !== 'board') continue;
        const m = mapPin(w[k].pin, from, id);
        if (!m) { dropped++; return false; }
        w[k] = { t: 'board', pin: m };
      }
      return true;
    });
  }, 'Change board');
  frameAll();
  toast(`Switched to the ${STUDIO_BOARDS[id].name}${dropped ? ` · ${dropped} wire${dropped > 1 ? 's' : ''} had no matching pin and were removed` : ''}. Check the pin numbers in your sketch.`);
}

// ================================================================ project lifecycle
function circuitOf(p) { const { code, updated, ...rest } = p; return clone(rest); }

function commit(mutator, label = '') {
  const before = circuitOf(project);
  mutator(project);
  undo.push({ snap: before, label });
  if (undo.length > 120) undo.shift();
  redo.length = 0;
  afterChange();
}

function restore(snap) {
  const code = project.code;
  project = { ...clone(snap), code };
  afterChange();
}
function doUndo() {
  const u = undo.pop();
  if (!u) return toast('Nothing to undo');
  redo.push({ snap: circuitOf(project), label: u.label });
  restore(u.snap);
  toast(`Undid ${u.label || 'change'}`);
}
function doRedo() {
  const r = redo.pop();
  if (!r) return toast('Nothing to redo');
  undo.push({ snap: circuitOf(project), label: r.label });
  restore(r.snap);
  toast(`Redid ${r.label || 'change'}`);
}

function afterChange() {
  if (boardSel.value !== project.board) boardSel.value = project.board;
  ws.sync(project);
  // part states for removed parts
  for (const id of [...states.keys()]) if (!project.parts.some((p) => p.id === id)) states.delete(id);
  sim.configure({ project, board: ws.board.def, legKeys: (part) => ws.legHoles(part)?.keys ?? null, defs: PART, states });
  modules = analyzeModules({ project, sim, studioBoard: ws.board, defs: PART, result: sim.solve() });
  renderInspector(ws.selection);
  $('#empty').hidden = project.parts.length > 0 || project.wires.length > 0;
  $('#file-name').textContent = `${fileSafe(project.name)}.ino`;
  scheduleSave();
}

function setProject(p, { message } = {}) {
  stopRun();
  states.clear();
  sticky.clear();
  dismissed.clear();
  undo.length = redo.length = 0;
  project = p;
  $('#project-name').value = p.name;
  editor.setDoc(p.code);
  ws.select(null);
  afterChange();
  frameAll(true);
  storage.save(project);
  monitor.clear();
  plotter.reset();
  diagnostics = [];
  renderProblems();
  scheduleLint();
  if (message) toast(message);
}

let saveTimer = 0;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { if (!storage.save(project)) toast('Could not save: browser storage is full or blocked.'); }, 500);
}

$('#project-name').addEventListener('input', (e) => { project.name = e.target.value || 'Untitled project'; $('#file-name').textContent = `${fileSafe(project.name)}.ino`; scheduleSave(); });

function frameAll(instant = false) {
  const box = ws.bounds();
  if (box.isEmpty()) return;
  const c = box.getCenter(new THREE.Vector3());
  const s = box.getSize(new THREE.Vector3());
  // the stage fits `size` into a fraction of the canvas; size it so the projected bench fills ~85 %
  const az = (28 * Math.PI) / 180, el = (36 * Math.PI) / 180;
  const wide = s.x * Math.cos(az) + s.z * Math.sin(az);
  const tall = (s.x * Math.sin(az) + s.z * Math.cos(az)) * Math.sin(el) + s.y * Math.cos(el);
  const fill = stage.compact ? 0.92 : 0.6, hfill = stage.compact ? 0.62 : 0.72;
  const aspect = stage.w / stage.h;
  const size = Math.max(6, (wide * fill) / 0.86, (tall * hfill) / 0.8, ((tall * fill) / 0.8) * aspect * 0);
  stage.frame({ center: [c.x, Math.min(1.2, s.y / 3), c.z], size }, instant);
}

// ================================================================ editing commands
function selectedPart() {
  const s = ws.selection;
  return s?.kind === 'part' ? project.parts.find((p) => p.id === s.id) : null;
}

function rotateSelection() {
  if (ws.rotatePlacing()) return;
  const part = selectedPart();
  if (!part) return toast('Select a part to rotate it');
  const def = PART[part.type];
  if (def.mount === 'free') return commit((p) => { const q = p.parts.find((x) => x.id === part.id); q.rot = (q.rot + 1) % 4; }, 'Rotate');
  const leg0 = ws.epPos({ t: 'hole', ...part.at });
  const legs = legPositions(def, new THREE.Vector3(), part.rot);
  const centre = legs.reduce((a, l) => a.add(l), new THREE.Vector3()).multiplyScalar(1 / legs.length).add(leg0);
  const snap = ws.snapBB(def, centre, (part.rot + 1) % 4, `part:${part.id}`);
  if (!snap?.ok) return toast('No room to rotate it here: move it to a clearer spot first.');
  commit((p) => { const q = p.parts.find((x) => x.id === part.id); q.rot = (q.rot + 1) % 4; q.at = snap.at; delete q.at2; }, 'Rotate');
}

function deleteSelection() {
  const s = ws.selection;
  if (!s) return;
  if (s.kind === 'part') {
    commit((p) => {
      p.parts = p.parts.filter((x) => x.id !== s.id);
      p.wires = p.wires.filter((w) => w.a.id !== s.id && w.b.id !== s.id);
    }, 'Delete part');
  } else if (s.kind === 'wire') commit((p) => { p.wires = p.wires.filter((w) => w.id !== s.id); }, 'Delete wire');
  else if (s.kind === 'bb') {
    commit((p) => {
      p.breadboards = p.breadboards.filter((b) => b.id !== s.id);
      p.parts = p.parts.filter((x) => x.at?.bb !== s.id);
      const ids = new Set(p.parts.map((x) => x.id));
      p.wires = p.wires.filter((w) => ![w.a, w.b].some((e) => (e.t === 'hole' && e.bb === s.id) || (e.t === 'part' && !ids.has(e.id))));
    }, 'Delete breadboard');
  } else return;
  ws.select(null);
}

function duplicateSelection() {
  const part = selectedPart();
  if (!part) return toast('Select a part to duplicate it');
  const def = PART[part.type];
  const id = uid(part.type.slice(0, 3));
  if (def.mount === 'free') {
    commit((p) => p.parts.push({ ...clone(part), id, pos: [part.pos[0] + 2 * P * 4, part.pos[1] + 2 * P * 4] }), 'Duplicate');
  } else {
    const at = ws.epPos({ t: 'hole', ...part.at });
    let snap = null;
    for (const dx of [5, -5, 8, -8, 11, -11, 14]) {
      snap = ws.snapBB(def, at.clone().add(new THREE.Vector3(dx * P, 0, 0)), part.rot);
      if (snap?.ok) break;
    }
    if (!snap?.ok) return toast('No free holes nearby for a copy.');
    commit((p) => p.parts.push({ id, type: part.type, rot: part.rot, props: clone(part.props), at: snap.at }), 'Duplicate');
  }
  ws.select({ kind: 'part', id });
}

function addBreadboard() {
  const last = project.breadboards[project.breadboards.length - 1];
  const [bx, bz] = BB_SPOT[project.board] ?? BB_SPOT.uno;
  const spot = last ? [last.x, last.z + 6.4] : [bx, bz];
  const id = `bb${Date.now().toString(36).slice(-4)}`;
  commit((p) => p.breadboards.push({ id, x: spot[0], z: spot[1] }), 'Add breadboard');
  frameAll();
}

/** Keyboard / tap fallback: put a part on the first free spot. */
function autoPlace(type) {
  const def = PART[type];
  const id = uid(type.slice(0, 3));
  if (def.mount === 'bb') {
    if (!project.breadboards.length) addBreadboard();
    for (const b of project.breadboards) {
      for (const col of [8, 14, 20, 4, 24, 11, 17]) for (const row of ['e', 'h', 'c']) {
        const pos = ws.epPos({ t: 'hole', bb: b.id, col, row });
        if (!pos) continue;
        const snap = ws.snapBB(def, pos, 0);
        if (snap?.ok) {
          commit((p) => p.parts.push({ id, type, rot: 0, props: { ...def.defaults }, at: snap.at }), `Add ${def.name}`);
          ws.select({ kind: 'part', id });
          return;
        }
      }
    }
    return toast('The breadboards are full: add another one.');
  }
  const box = ws.bounds();
  const x = Math.round((box.isEmpty() ? 8 : box.getCenter(new THREE.Vector3()).x) / P) * P;
  const z = Math.round(((box.isEmpty() ? 0 : box.max.z) + 3) / P) * P;
  commit((p) => p.parts.push({ id, type, rot: 0, props: { ...def.defaults }, pos: [x, z] }), `Add ${def.name}`);
  ws.select({ kind: 'part', id });
  frameAll();
}

function setProp(id, key, value, live = false) {
  const part = project.parts.find((p) => p.id === id);
  if (!part) return;
  if (live) {
    part.props[key] = value;
    sim.invalidate();
    afterLive();
    scheduleSave();
    return;
  }
  commit((p) => { p.parts.find((x) => x.id === id).props[key] = value; }, 'Change part');
}
let liveTimer = 0;
function afterLive() {
  // live controls (knobs, sliders) change props without a rebuild; keep the inspector numbers fresh
  cancelAnimationFrame(liveTimer);
  liveTimer = requestAnimationFrame(() => refreshInspectorReadings());
}
function setHeld(id, key, on) {
  const st = sim.state(id);
  if (!!st[key] === on) return;
  st[key] = on;
  sim.invalidate();
}
function clickPart(id) {
  const part = project.parts.find((p) => p.id === id);
  if (part?.type === 'slide') setProp(id, 'pos', part.props.pos === 'R' ? 'L' : 'R');
}

function replacePart(id) {
  const st = sim.state(id);
  st.burnt = false;
  st.over = 0;
  sticky.delete(`burnt:${id}`);
  ws.parts.get(id) && (ws.parts.get(id).hash = '');
  sim.invalidate();
  afterChange();
  toast('Fitted a new one. Add a resistor first, or it will burn again.');
}

// ================================================================ parts bin
const binList = $('#bin-list'), binCats = $('#bin-cats');
let binCat = 'All';
const thumbs = new Map();
function renderBin() {
  const q = $('#bin-search').value.trim().toLowerCase();
  binCats.innerHTML = ['All', ...CATEGORIES].map((c) => `<button role="tab" class="chip" aria-selected="${c === binCat}" data-cat="${c}">${c}</button>`).join('');
  const items = PARTS.filter((d) => (binCat === 'All' || d.cat === binCat) && (!q || `${d.name} ${d.keywords} ${d.cat}`.toLowerCase().includes(q)));
  const groups = binCat === 'All' && !q ? CATEGORIES : [null];
  binList.innerHTML = groups.map((cat) => {
    const list = items.filter((d) => !cat || d.cat === cat);
    if (!list.length) return '';
    return `${cat ? `<h3>${cat}</h3>` : ''}<div class="bin-grid">${list.map((d) => `
      <button class="bin-item" data-type="${d.type}" title="${esc(d.describe ? d.describe(d.defaults) : d.name)}">
        <span class="bin-thumb">${thumbs.has(d.type) ? `<img src="${thumbs.get(d.type)}" alt="" draggable="false" />` : ''}</span>
        <span class="bin-name">${esc(d.name)}</span>
      </button>`).join('')}</div>`;
  }).join('') || '<p class="bin-empty">No parts match that search.</p>';
}
binCats.addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (b) { binCat = b.dataset.cat; renderBin(); } });
$('#bin-search').addEventListener('input', renderBin);
renderBin();

// thumbnails, rendered once in the background and cached for the session
(async () => {
  const VER = 'v3';
  let thumbr = null;
  for (const d of PARTS) {
    let url = null;
    try { url = sessionStorage.getItem(`tl-thumb:${VER}:${d.type}`); } catch { /* */ }
    if (!url) {
      await new Promise((r) => (window.requestIdleCallback ?? setTimeout)(r, { timeout: 200 }));
      try {
        thumbr ??= new Thumbnailer(132, 100);
        url = thumbr.render(thumbObject(d));
        try { sessionStorage.setItem(`tl-thumb:${VER}:${d.type}`, url); } catch { /* */ }
      } catch (e) { console.warn('thumbnail', d.type, e); continue; }
    }
    thumbs.set(d.type, url);
    const slot = binList.querySelector(`[data-type="${d.type}"] .bin-thumb`);
    if (slot) slot.innerHTML = `<img src="${url}" alt="" draggable="false" />`;
  }
  thumbr?.dispose();
})();

// drag from the bin, or click / tap then click on the bench
let binDrag = null;
binList.addEventListener('pointerdown', (e) => {
  const item = e.target.closest('.bin-item');
  if (!item) return;
  e.preventDefault();
  binDrag = { type: item.dataset.type, x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
});
window.addEventListener('pointermove', (e) => {
  if (!binDrag) return;
  if (!binDrag.moved && Math.hypot(e.clientX - binDrag.x, e.clientY - binDrag.y) > 6) {
    binDrag.moved = true;
    ws.beginPlacing(binDrag.type);
  }
  if (binDrag.moved && overCanvas(e)) ws.placingMove(e);
});
window.addEventListener('pointerup', (e) => {
  const d = binDrag;
  binDrag = null;
  if (!d) return;
  if (d.moved) {
    if (overCanvas(e)) ws.placeAt(e) || ws.cancel();
    else ws.cancel();
  } else {
    ws.beginPlacing(d.type);
    if (isMobile()) { closeBin(); toast(`Tap the bench to place the ${PART[d.type].name}`); }
  }
});
binList.addEventListener('keydown', (e) => {
  const item = e.target.closest('.bin-item');
  if (item && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); autoPlace(item.dataset.type); }
});
function overCanvas(e) {
  const r = stage.canvas.getBoundingClientRect();
  return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
}
const isMobile = () => matchMedia('(max-width: 899px)').matches;
const openBin = () => app.classList.add('bin-open');
const closeBin = () => app.classList.remove('bin-open');
$('#btn-add').onclick = openBin;
$('#bin-close').onclick = closeBin;

// ================================================================ toolbar
$('#wire-pick').innerHTML = WIRE_COLORS.map((c) => `<button role="radio" aria-checked="${c === ws.wireColor}" aria-label="${c} wire" title="${c[0].toUpperCase() + c.slice(1)} wire" data-color="${c}" style="--sw:#${WIRE[c].toString(16).padStart(6, '0')}"></button>`).join('');
$('#wire-pick').addEventListener('click', (e) => {
  const b = e.target.closest('[data-color]');
  if (!b) return;
  ws.wireColor = b.dataset.color;
  ws.colorLocked = true;
  for (const x of $$('#wire-pick [data-color]')) x.setAttribute('aria-checked', String(x === b));
  const s = ws.selection;
  if (s?.kind === 'wire') commit((p) => { p.wires.find((w) => w.id === s.id).color = b.dataset.color; }, 'Recolour wire');
});
const TOOLS = { undo: doUndo, redo: doRedo, rotate: rotateSelection, duplicate: duplicateSelection, delete: deleteSelection, breadboard: addBreadboard, fit: () => frameAll() };
for (const b of $$('[data-tool]')) b.onclick = () => TOOLS[b.dataset.tool]();

// ================================================================ inspector
const insp = $('#inspector');
function renderInspector(sel) {
  if (!sel) { insp.hidden = true; insp.innerHTML = ''; return; }
  insp.hidden = false;
  if (sel.kind === 'wire') {
    const w = project.wires.find((x) => x.id === sel.id);
    if (!w) { insp.hidden = true; return; }
    const a = ws.epInfo(w.a)?.label ?? '?', b = ws.epInfo(w.b)?.label ?? '?';
    insp.innerHTML = `<header><b>Jumper wire</b><button class="pill pill-icon pill-sm" data-x aria-label="Close">${lucide('x', { size: 14 })}</button></header>
      <p class="muted">${esc(a)} → ${esc(b)}</p>
      <div class="sw-row" role="radiogroup" aria-label="Wire colour">${WIRE_COLORS.map((c) => `<button role="radio" aria-checked="${c === w.color}" aria-label="${c}" data-wc="${c}" style="--sw:#${WIRE[c].toString(16).padStart(6, '0')}"></button>`).join('')}</div>
      <p class="reading" data-read="wire"></p>
      <div class="row"><button class="pill pill-sm" data-del>${lucide('trash-2', { size: 14 })}Delete wire</button></div>`;
    insp.querySelectorAll('[data-wc]').forEach((b) => (b.onclick = () => commit((p) => { p.wires.find((x) => x.id === w.id).color = b.dataset.wc; }, 'Recolour wire')));
  } else if (sel.kind === 'bb') {
    insp.innerHTML = `<header><b>Breadboard</b><button class="pill pill-icon pill-sm" data-x aria-label="Close">${lucide('x', { size: 14 })}</button></header>
      <p class="muted">Half size: 30 columns. Each column of five holes (a–e, f–j) is one connected strip; the four long rails run the full length. Drag its edge to move it.</p>
      <div class="row"><button class="pill pill-sm" data-del>${lucide('trash-2', { size: 14 })}Remove breadboard</button></div>`;
  } else if (sel.kind === 'board') {
    const info = ws.board.info, d = ws.board.def;
    insp.innerHTML = `<header><b>${esc(d.name)}</b><button class="pill pill-icon pill-sm" data-x aria-label="Close">${lucide('x', { size: 14 })}</button></header>
      <dl class="specs"><dt>Chip</dt><dd>${esc(info.mcu)}</dd><dt>Logic</dt><dd>${d.logic} V · pins ${d.recPinMA} mA (max ${d.maxPinMA})</dd><dt>Pins</dt><dd>${esc(info.pins)}</dd><dt>ADC</dt><dd>${d.adcBits}-bit, 0–${d.vref} V</dd><dt>I²C</dt><dd>SDA ${ws.board.label(d.i2c.SDA)}, SCL ${ws.board.label(d.i2c.SCL)}</dd></dl>
      <p class="muted">Click a pin, then a breadboard hole or a module pin, to add a wire.</p>`;
  } else {
    const part = project.parts.find((p) => p.id === sel.id);
    if (!part) { insp.hidden = true; return; }
    const def = PART[part.type];
    const st = sim.state(part.id);
    const mod = modules.get(part.id);
    insp.innerHTML = `<header><b>${esc(def.name)}</b><button class="pill pill-icon pill-sm" data-x aria-label="Close">${lucide('x', { size: 14 })}</button></header>
      <p class="muted" data-desc>${esc(def.describe ? def.describe(part.props) : '')}</p>
      ${st.burnt ? `<p class="bad">Burnt out. <button class="pill pill-sm pill-primary" data-replace>Replace it</button></p>` : ''}
      ${mod && !mod.ok ? `<ul class="hints">${mod.hints.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : mod?.ok ? '<p class="good">Wired and powered.</p>' : ''}
      <div class="ctl-list">${(def.controls ?? []).map((c, i) => controlHTML(c, i, part, st)).join('')}${def.hold === true ? `<button class="pill pill-sm" data-hold="pressed">${lucide('hand', { size: 14 })}Press and hold</button>` : ''}</div>
      ${pinTable(def)}
      <p class="reading" data-read="part"></p>
      <div class="row">
        <button class="pill pill-sm" data-rot>${lucide('rotate-cw', { size: 14 })}Rotate</button>
        <button class="pill pill-sm" data-dup>${lucide('copy', { size: 14 })}Duplicate</button>
        <button class="pill pill-sm" data-del>${lucide('trash-2', { size: 14 })}Delete</button>
      </div>`;
    bindControls(part, def);
    insp.querySelector('[data-rot]').onclick = rotateSelection;
    insp.querySelector('[data-dup]').onclick = duplicateSelection;
    insp.querySelector('[data-replace]')?.addEventListener('click', () => replacePart(part.id));
  }
  insp.querySelector('[data-x]').onclick = () => ws.select(null);
  insp.querySelector('[data-del]')?.addEventListener('click', deleteSelection);
  refreshInspectorReadings();
}

function pinTable(def) {
  if (!def.pinLabels) return '';
  return `<details class="pins"><summary>Pins</summary><dl>${def.pins.filter((p) => def.pinLabels[p]).map((p) => `<dt>${esc(p)}</dt><dd>${esc(def.pinLabels[p])}</dd>`).join('')}</dl></details>`;
}

function controlHTML(c, i, part, st) {
  const val = c.state ? st[c.key] ?? 0 : part.props[c.key];
  const fmt = c.format ?? ((v) => v);
  switch (c.type) {
    case 'range':
      return `<label class="ctl"><span>${esc(c.label)} <b data-out="${i}">${esc(fmt(val))}</b></span><input type="range" data-ctl="${i}" min="${c.min}" max="${c.max}" step="${c.step}" value="${val}" /></label>`;
    case 'choice':
      return `<label class="ctl"><span>${esc(c.label)}</span><select class="pill pill-select pill-sm" data-ctl="${i}">${c.options.map(([v, l]) => `<option value="${v}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
    case 'ohms':
      return `<label class="ctl"><span>${esc(c.label)} <b>${fmtOhms(val)}</b></span><span class="ohms"><input type="number" data-ctl="${i}" min="10" max="10000000" value="${val}" aria-label="Resistance in ohms" /><select class="pill pill-select pill-sm" data-preset="${i}" aria-label="Common values"><option value="">E12…</option>${OHM_PRESETS.map((o) => `<option value="${o}">${fmtOhms(o)}</option>`).join('')}</select></span><small class="bands">${bandNames(val).map((b) => `<i class="band band-${b}" title="${b}"></i>`).join('')} ${bandNames(val).join(' · ')}</small></label>`;
    case 'hold':
      return `<button class="pill pill-sm" data-hold="${c.key}">${lucide('hand', { size: 14 })}${esc(c.label)}</button>`;
    case 'keys':
      return `<div class="ctl"><span>${esc(c.label)}</span><div class="keys-grid">${c.keys.map((k) => `<button class="key" data-key="${k}">${k}</button>`).join('')}</div></div>`;
  }
  return '';
}

function bindControls(part, def) {
  const st = sim.state(part.id);
  (def.controls ?? []).forEach((c, i) => {
    const el = insp.querySelector(`[data-ctl="${i}"]`);
    if (c.type === 'range') {
      el.addEventListener('input', () => {
        const v = Number(el.value);
        insp.querySelector(`[data-out="${i}"]`).textContent = (c.format ?? ((x) => x))(v);
        if (c.state) { st[c.key] = v; sim.invalidate(); } else setProp(part.id, c.key, v, true);
        const d = insp.querySelector('[data-desc]');
        if (d && def.describe) d.textContent = def.describe(part.props);
      });
      let pre = null;
      el.addEventListener('pointerdown', () => { pre = c.state ? null : circuitOf(project); });
      el.addEventListener('keydown', () => { pre ??= c.state ? null : circuitOf(project); });
      el.addEventListener('change', () => { if (pre) { undo.push({ snap: pre, label: c.label }); redo.length = 0; pre = null; } });
    } else if (c.type === 'choice') {
      el.addEventListener('change', () => setProp(part.id, c.key, typeof c.options[0][0] === 'number' ? Number(el.value) : el.value));
    } else if (c.type === 'ohms') {
      el.addEventListener('change', () => setProp(part.id, 'ohms', snapOhms(el.value)));
      insp.querySelector(`[data-preset="${i}"]`).addEventListener('change', (e) => e.target.value && setProp(part.id, 'ohms', Number(e.target.value)));
    } else if (c.type === 'keys') {
      insp.querySelectorAll('[data-key]').forEach((b) => {
        const down = (e) => { e.preventDefault(); st.key = b.dataset.key; st.reported = null; ws.parts.get(part.id)?.api.press?.(st.key); sim.invalidate(); };
        const up = () => { st.key = null; st.reported = null; sim.invalidate(); };
        b.addEventListener('pointerdown', down);
        b.addEventListener('pointerup', up);
        b.addEventListener('pointerleave', up);
      });
    }
  });
  insp.querySelectorAll('[data-hold]').forEach((b) => {
    const key = b.dataset.hold;
    const on = (v) => (e) => { e.preventDefault?.(); setHeld(part.id, key, v); b.classList.toggle('is-down', v); };
    b.addEventListener('pointerdown', on(true));
    b.addEventListener('pointerup', on(false));
    b.addEventListener('pointerleave', on(false));
    b.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') on(true)(e); });
    b.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') on(false)(e); });
  });
}

function refreshInspectorReadings() {
  const sel = ws.selection;
  const el = insp.querySelector('[data-read]');
  if (!el || !sel || !frameResult) return;
  if (sel.kind === 'wire') {
    const i = frameResult.wireI?.get(sel.id) ?? 0;
    el.textContent = Math.abs(i) > 1e-5 ? `Carrying ${mA(i)}` : 'No current right now';
    return;
  }
  const part = project.parts.find((p) => p.id === sel.id);
  if (!part) return;
  const r = frameResult.parts.get(part.id) ?? {};
  const bits = [];
  if (r.i != null && ['led', 'rgb', 'resistor', 'diode', 'ldr', 'sevenseg', 'motor', 'buzzer'].includes(part.type)) bits.push(`current ${mA(r.i)}`);
  if (part.type === 'led' && r.v != null) bits.push(`across it ${volts(r.v)}`);
  if (part.type === 'resistor' && r.p != null) bits.push(`${(r.p * 1000).toFixed(1)} mW`);
  if (part.type === 'npn') bits.push(`Ic ${mA(r.i ?? 0)}, Ib ${mA(r.ib ?? 0)}, Vce ${volts(r.vce ?? 0)}`);
  if (r.vcc != null) bits.push(`supply ${volts(r.vcc)}`);
  if (part.type === 'servo') bits.push(`angle ${Math.round(sim.state(part.id).angle ?? 90)}°`);
  if (part.type === 'motor') bits.push(`speed ${Math.round(Math.abs(sim.state(part.id).w ?? 0) * 100)} %`);
  el.textContent = bits.filter(Boolean).join(' · ');
}

// ================================================================ hover tip + mode banner
const tip = $('#tip');
function showTip(ep, e) {
  if (!ep || !e) { tip.hidden = true; return; }
  const key = ep.ep.t === 'board' ? boardKey(ep.ep.pin, ws.board.def) : ep.ep.t === 'part' ? `p:${ep.ep.id}:${ep.ep.pin}` : epKey(ep.ep);
  const v = sim.net?.has(key) ? sim.voltageAt(key) : null;
  const used = ws.occupied.has(ep.key);
  tip.innerHTML = `<b>${esc(ep.label)}</b>${v != null ? ` <span>${volts(v)}</span>` : ''}<small>${ws.wiring ? 'click to finish the wire' : used ? 'in use' : 'click to start a wire'}</small>`;
  const r = stageEl.getBoundingClientRect();
  tip.style.left = `${Math.min(r.width - 180, e.clientX - r.left + 14)}px`;
  tip.style.top = `${Math.max(4, e.clientY - r.top - 40)}px`;
  tip.hidden = false;
}
function showMode(mode, info) {
  const m = $('#mode');
  if (!mode) { m.hidden = true; return; }
  m.hidden = false;
  m.innerHTML = mode === 'wiring'
    ? `${lucide('cable', { size: 15 })}<span>Wire from <b>${esc(info.label)}</b>: click a second pin or hole · Esc cancels</span>`
    : `${lucide('mouse-pointer-2', { size: 15 })}<span>Place the <b>${esc(info.name)}</b>: ${isMobile() ? 'tap' : 'click'} the bench · R rotates · Esc cancels</span>`;
}

// ================================================================ toast
let toastTimer = 0;
function toast(text) {
  const t = $('#toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 3600);
}

// ================================================================ the live circuit: timeline + frame
const clock = () => (vm ? vm.us ?? vm.micros?.() ?? vm.millis() * 1000 : performance.now() * 1000);
const timeline = { lastT: 0, sig: '', snap: null, segs: new Map() };
function resetTimeline() {
  timeline.lastT = clock();
  timeline.sig = sim.signature();
  timeline.snap = sim.snapshot();
  timeline.segs.clear();
}
function addSeg(sig, snap, dur) {
  if (dur <= 0) return;
  const s = timeline.segs.get(sig);
  if (s) s.dur += dur; else timeline.segs.set(sig, { snap, dur });
}
function onPins() {
  const t = clock();
  addSeg(timeline.sig, timeline.snap, t - timeline.lastT);
  timeline.lastT = t;
  timeline.sig = sim.signature();
  timeline.snap = timeline.segs.has(timeline.sig) ? timeline.segs.get(timeline.sig).snap : sim.snapshot();
}

/** Time-weighted average of the circuit over the last frame (blinks, software PWM, multiplexing). */
function solveFrame() {
  const t = clock();
  addSeg(timeline.sig, timeline.snap, t - timeline.lastT);
  timeline.lastT = t;
  const segs = [...timeline.segs.entries()];
  timeline.segs.clear();
  const total = segs.reduce((s, [, x]) => s + x.dur, 0);
  const now = sim.solve();
  const builtin = ws.board.def.builtinLed;
  const low = ws.board.def.builtinActiveLow;
  const level = (snap) => { const p = snap?.get(builtin); return p?.mode === 'OUTPUT' ? (low ? 1 - Sim.level(p) : Sim.level(p)) : 0; };
  if (!vm || total <= 0 || segs.length <= 1) {
    now.builtin = level(sim.pins);
    return now;
  }
  const list = segs.map(([sig, s]) => ({ r: sim.solveFor(s.snap, sig), w: s.dur / total, snap: s.snap }));
  const parts = new Map();
  for (const part of sim.parts) {
    const acc = {};
    for (const { r, w } of list) {
      const x = r.parts.get(part.id) ?? {};
      for (const [k, v] of Object.entries(x)) {
        if (typeof v === 'number') acc[k] = (acc[k] ?? 0) + v * w;
        else if (Array.isArray(v)) { acc[k] ??= v.map(() => 0); v.forEach((y, i) => { acc[k][i] += (y ?? 0) * w; }); }
        else acc[k] = v;
      }
    }
    parts.set(part.id, acc);
  }
  const wireI = new Map();
  for (const { r, w } of list) for (const [id, i] of r.wireI) wireI.set(id, (wireI.get(id) ?? 0) + i * w);
  const warnings = new Map();
  for (const { r, w } of list) if (w > 0.02) for (const x of r.warnings) warnings.set(x.id, x);
  return { ...now, parts, wireI, warnings: [...warnings.values()], builtin: list.reduce((s, x) => s + level(x.snap) * x.w, 0) };
}

let lastWarnRender = 0, lastModules = 0, lastInspector = 0;
stage.onTick((dt) => {
  if (!sim.net) return; // nothing loaded yet
  hal?.tick?.();
  const res = solveFrame();
  frameResult = res;
  const now = performance.now();
  // modules: re-check power every ~300 ms
  if (now - lastModules > 300) {
    lastModules = now;
    const before = JSON.stringify([...modules].map(([k, v]) => [k, v.ok]));
    modules = analyzeModules({ project, sim, studioBoard: ws.board, defs: PART, result: res });
    if (before !== JSON.stringify([...modules].map(([k, v]) => [k, v.ok])) && ws.selection?.kind === 'part') renderInspector(ws.selection);
  }
  let sound = 0;
  let invalid = false;
  for (const part of project.parts) {
    const ent = ws.parts.get(part.id);
    if (!ent) continue;
    const def = ent.def, st = sim.state(part.id);
    const r = res.parts.get(part.id) ?? {};
    // LED burn-out: over the absolute maximum for a quarter of a second
    if ((def.type === 'led' || def.type === 'rgb' || def.type === 'sevenseg') && !st.burnt) {
      if ((r.i ?? 0) > LED_MAX_MA / 1000) {
        st.over = (st.over ?? 0) + dt;
        st.peak = Math.max(st.peak ?? 0, r.i);
        if (st.over > 0.25) burnOut(part, st);
      } else st.over = Math.max(0, (st.over ?? 0) - dt);
    }
    if (def.type === 'buzzer') r.sound = buzzerSound(part, r);
    if (r.sound) sound ||= r.sound;
    if (def.step && def.step(st, r, dt)) invalid = true;
    if (def.type === 'servo') invalid = servoStep(part, ent, st, dt) || invalid;
    darkenIfUnpowered(part, ent, st);
    def.view?.(ent.api, r, st, part.props);
  }
  if (invalid) sim.invalidate();
  ws.board.api.setBuiltinLed(Math.max(0, Math.min(1, res.builtin ?? 0)));
  for (const [id, ent] of ws.wires) {
    const i = res.wireI?.get(id) ?? 0;
    ent.api.live = Math.abs(i) > 1e-3;
    ent.api.dir = i >= 0 ? 1 : -1;
    ent.api.speed = Math.min(2.2, 0.4 + Math.abs(i) / 0.02);
  }
  play(runState === 'running' ? sound : 0);
  if (now - lastWarnRender > 200) { lastWarnRender = now; renderWarnings(res); }
  if (now - lastInspector > 250) { lastInspector = now; refreshInspectorReadings(); }
  positionBadges();
});

function burnOut(part, st) {
  st.burnt = true;
  sim.invalidate();
  const def = PART[part.type];
  const board = ws.board.def;
  const vf = LED_TYPES[part.props.color]?.vf ?? 2;
  const r = Math.ceil(((board.logic - vf) / 0.015) / 10) * 10;
  sticky.set(`burnt:${part.id}`, {
    w: { id: `burnt:${part.id}`, level: 'danger', part: part.id, title: `The ${def.name} burnt out`,
      text: `${mA(st.peak)} flowed through it; ${LED_MAX_MA} mA is the most a small LED survives. Once an LED turns on it has almost no resistance of its own, so nothing limited the current.`,
      fix: `Put a resistor in series: R = (${board.logic} V − ${vf} V) ÷ 15 mA ≈ ${r} Ω (220 Ω is the usual choice). Then replace the LED.`, replace: true },
    until: Infinity,
  });
  if (ws.selection?.id === part.id) renderInspector(ws.selection);
}

function buzzerSound(part, r) {
  if (part.props.kind === 'active') return Math.abs(r.v ?? 0) > 2.5 ? 2300 : 0;
  if (Math.abs(r.v ?? 0) < 0.4) return 0;
  const pins = sim.net.partPins.get(part.id);
  if (!pins) return 0;
  const nets = [sim.net.netOf(pins['+']), sim.net.netOf(pins['−'])];
  for (const [num, p] of sim.pins) {
    if (!p.tone) continue;
    const name = ws.board.nameOfNum(num);
    if (name && nets.includes(sim.net.netOf(boardKey(name, ws.board.def)))) return p.tone;
  }
  return 0;
}

function servoStep(part, ent, st, dt) {
  st.angle ??= 90;
  const mod = modules.get(part.id);
  const target = st.target ?? st.angle;
  let moving = false;
  if (mod?.ok && runState !== 'idle') {
    const diff = target - st.angle;
    const stepDeg = 600 * dt; // SG90: about 0.1 s per 60°
    if (Math.abs(diff) > 0.2) { st.angle += Math.sign(diff) * Math.min(Math.abs(diff), stepDeg); moving = true; }
  }
  ent.api.set?.(st.angle);
  if (moving !== !!st.moving) { st.moving = moving; return true; }
  return false;
}

function darkenIfUnpowered(part, ent, st) {
  if (!['lcd', 'oled', 'ring', 'strip'].includes(part.type)) return;
  const ok = modules.get(part.id)?.ok && runState !== 'idle';
  if (ok) { st.dark = false; return; }
  if (st.dark) return;
  st.dark = true;
  const a = ent.api;
  if (part.type === 'lcd') { a.screen.clear(); a.screen.backlight(!!modules.get(part.id)?.ok); }
  else if (part.type === 'oled') a.screen.clear();
  else { a.pixels.clear(); a.pixels.show(); }
}

// ================================================================ warnings + module badges
function renderWarnings(res) {
  const now = performance.now();
  for (const w of res.warnings ?? []) sticky.set(w.id, { w, until: now + 2500 });
  for (const [id, x] of hints) sticky.set(id, x);
  hints.clear();
  for (const [id, x] of sticky) if (x.until < now) sticky.delete(id);
  const list = [...sticky.values()].map((x) => x.w).filter((w) => !dismissed.has(w.id));
  const order = { danger: 0, warn: 1, info: 2 };
  list.sort((a, b) => order[a.level] - order[b.level]);
  const shown = list.slice(0, 3);
  const html = shown.map((w) => `<article class="warn warn-${w.level}" data-w="${esc(w.id)}">
      <header>${lucide(w.level === 'info' ? 'info' : 'triangle-alert', { size: 16 })}<b>${esc(w.title)}</b><button class="pill pill-icon pill-sm" data-dismiss aria-label="Dismiss">${lucide('x', { size: 13 })}</button></header>
      <p>${esc(w.text)}</p>${w.fix ? `<p class="fix"><b>Fix:</b> ${esc(w.fix)}</p>` : ''}
      <div class="row">${w.part ? `<button class="pill pill-sm" data-show="${esc(w.part)}">Show me</button>` : ''}${w.replace ? `<button class="pill pill-sm pill-primary" data-replace="${esc(w.part)}">Replace LED</button>` : ''}</div>
    </article>`).join('') + (list.length > 3 ? `<p class="warn-more">+ ${list.length - 3} more</p>` : '');
  const box = $('#warnings');
  if (box.dataset.html !== html) {
    box.dataset.html = html;
    box.innerHTML = html;
  }
}
$('#warnings').addEventListener('click', (e) => {
  const card = e.target.closest('[data-w]');
  if (!card) return;
  if (e.target.closest('[data-dismiss]')) { dismissed.add(card.dataset.w); sticky.delete(card.dataset.w); renderWarnings({ warnings: [] }); }
  const show = e.target.closest('[data-show]');
  if (show) ws.select({ kind: 'part', id: show.dataset.show });
  const rep = e.target.closest('[data-replace]');
  if (rep) replacePart(rep.dataset.replace);
});

const badges = $('#badges');
function positionBadges() {
  const want = [];
  for (const [id, m] of modules) if (!m.ok) want.push(id);
  for (const part of project.parts) if (sim.state(part.id).burnt) want.push(part.id);
  const key = want.join(',');
  if (badges.dataset.key !== key) {
    badges.dataset.key = key;
    badges.innerHTML = want.map((id) => {
      const burnt = sim.state(id).burnt;
      const m = modules.get(id);
      return `<button class="badge ${burnt ? 'badge-bad' : ''}" data-b="${id}" title="${esc(burnt ? 'Burnt out' : m.hints.join(' '))}">${burnt ? 'Burnt out' : 'Needs wiring'}</button>`;
    }).join('');
  }
  for (const el of badges.children) {
    const a = ws.anchorOf(el.dataset.b);
    if (!a) continue;
    const s = stage.project(a);
    el.style.transform = `translate(${Math.round(s.x)}px, ${Math.round(s.y)}px) translate(-50%, -120%)`;
  }
}
badges.addEventListener('click', (e) => { const b = e.target.closest('[data-b]'); if (b) ws.select({ kind: 'part', id: b.dataset.b }); });

// ================================================================ problems
function renderProblems() {
  const all = [...diagnostics, ...runtimeErrors];
  const errs = all.filter((d) => d.severity !== 'warning').length;
  $('#problem-count').textContent = all.length ? String(all.length) : '';
  $('#code-diag').innerHTML = errs ? `<span class="bad">${errs} error${errs > 1 ? 's' : ''}</span>` : all.length ? `<span>${all.length} warning${all.length > 1 ? 's' : ''}</span>` : '';
  $('#panel-problems').innerHTML = all.length
    ? `<ul class="problems">${all.map((d) => `<li class="${d.severity === 'warning' ? 'w' : 'e'}"><button data-line="${d.line}">line ${d.line}</button><span>${esc(d.message)}${d.hint ? `<small>${esc(d.hint)}</small>` : ''}</span></li>`).join('')}</ul>`
    : '<p class="muted pad">No problems. The sketch compiles.</p>';
}
$('#panel-problems').addEventListener('click', (e) => {
  const b = e.target.closest('[data-line]');
  if (!b) return;
  const line = editor.view.state.doc.line(Math.max(1, Math.min(Number(b.dataset.line), editor.view.state.doc.lines)));
  editor.view.dispatch({ selection: { anchor: line.from }, scrollIntoView: true });
  editor.focus();
});

let lintTimer = 0;
function scheduleLint() {
  clearTimeout(lintTimer);
  lintTimer = setTimeout(async () => {
    const r = await loadRuntime();
    if (!r) return;
    try {
      const res = r.compile(editor.doc, { board: ws.board.def.runtime });
      diagnostics = res.diagnostics ?? [];
    } catch (e) {
      diagnostics = [{ severity: 'error', line: 1, col: 1, message: `Internal compiler error: ${e.message}` }];
    }
    editor.setDiagnostics(diagnostics);
    renderProblems();
  }, 450);
}

// ================================================================ running sketches
const status = $('#rt-status');
function setRunState(s, text) {
  runState = s;
  app.dataset.run = s;
  $('#btn-run').innerHTML = `${lucide(s === 'paused' ? 'play' : 'play', { size: 16 })}<span class="lbl">${s === 'paused' ? 'Resume' : s === 'running' ? 'Running' : 'Run'}</span>`;
  $('#btn-run').disabled = s === 'running';
  $('#btn-pause').disabled = s !== 'running';
  $('#btn-step').disabled = !(s === 'paused' || s === 'running');
  $('#btn-stop').disabled = s === 'idle';
  status.textContent = text ?? ({ idle: 'Ready', running: 'Running', paused: 'Paused', error: 'Stopped with an error' })[s];
  debug.setState(s === 'paused' ? 'Paused.' : s === 'running' ? 'Running. Pause or hit a breakpoint to inspect variables.' : 'Not running. Click the gutter left of a line number to set a breakpoint.', s === 'paused');
}

function resetHardware() {
  sim.resetPins();
  hal?.reset?.();
  for (const part of project.parts) {
    const st = sim.state(part.id);
    st.target = undefined;
    st.moving = false;
    st.dark = false;
    st.draw = undefined;
    st.reported = null;
  }
  sim.invalidate();
  for (const [id, ent] of ws.parts) {
    if (ent.def.type === 'lcd') { ent.api.screen.clear(); ent.api.screen.backlight(false); }
    if (ent.def.type === 'oled') ent.api.screen.clear();
    if (ent.def.type === 'ring' || ent.def.type === 'strip') { ent.api.pixels.clear(); ent.api.pixels.show(); }
  }
  play(0);
  resetTimeline();
}

async function run() {
  if (runState === 'paused') return resume();
  if (runState === 'running') return;
  play(0); // unlock audio inside the click
  status.textContent = 'Compiling…';
  rt = await loadRuntime();
  if (!rt) {
    status.textContent = 'Runtime loading';
    toast('The Arduino runtime is not available in this build yet. Your circuit still runs live: press buttons, turn knobs, watch the meters.');
    return;
  }
  let res;
  try { res = rt.compile(editor.doc, { board: ws.board.def.runtime }); } catch (e) {
    res = { ok: false, diagnostics: [{ severity: 'error', line: 1, col: 1, message: `Internal compiler error: ${e.message}` }] };
  }
  diagnostics = res.diagnostics ?? [];
  runtimeErrors = [];
  editor.setDiagnostics(diagnostics);
  renderProblems();
  if (!res.ok || !res.program) {
    const n = diagnostics.filter((d) => d.severity !== 'warning').length;
    setRunState('idle', `${n || 'Some'} error${n === 1 ? '' : 's'}: fix and run again`);
    dockTab('problems');
    if (isMobile()) setView('code');
    return;
  }
  compiled = res;
  monitor.note(`— ${project.name} on the ${ws.board.def.name} —`);
  resetHardware();
  const host = {
    sim, board: ws.board, project: null,
    modules: () => modules,
    partApi: (id) => ws.parts.get(id)?.api,
    partState: (id) => sim.state(id),
    clock,
    onPins,
    serial: (t) => monitor.write(t),
    invalidate: () => sim.invalidate(),
    hint: (id, w) => hints.set(id, { w: { id, ...w }, until: performance.now() + 2500 }),
  };
  Object.defineProperty(host, 'project', { get: () => project });
  hal = createHal(host);
  try {
    vm = res.program.instantiate(hal, { speed: 1 });
  } catch (e) {
    setRunState('error', `Could not start: ${e.message}`);
    return;
  }
  resetTimeline();
  vm.on('pause', ({ line }) => {
    setRunState('paused');
    editor.setExecLine(line, true);
    debug.show(vm);
    dockTab('debug');
  });
  vm.on('state', (s) => {
    if (s === 'running') { setRunState('running'); editor.setExecLine(null); }
    else if (s === 'stopped' && runState !== 'idle') stopRun(true);
  });
  vm.on('error', ({ line, message, hint, fatal }) => {
    runtimeErrors.push({ severity: fatal === false ? 'warning' : 'error', line, message, hint });
    renderProblems();
    monitor.note(`${fatal === false ? 'Warning' : 'Runtime error'} (line ${line}): ${message}`);
    if (fatal !== false) { setRunState('error', `Error on line ${line}`); editor.setExecLine(line, true); dockTab('problems'); }
  });
  vm.on('warning', ({ line, message, hint }) => {
    if (runtimeErrors.some((x) => x.message === message)) return;
    runtimeErrors.push({ severity: 'warning', line, message, hint });
    renderProblems();
  });
  vm.on('reset', ({ reason }) => monitor.note(`Board reset${reason ? `: ${reason}` : ''}`));
  vm.setBreakpoints?.(editor.breakpoints());
  setRunState('running');
  vm.start();
}

function resume() {
  if (!vm) return;
  editor.setExecLine(null);
  vm.resume();
  setRunState('running');
}
function pause() { vm?.pause?.(); }
function step() {
  if (!vm) return;
  if (runState === 'running') return pause();
  vm.stepOver ? vm.stepOver() : vm.step();
}
function stopRun(fromVm = false) {
  if (vm && !fromVm) { try { vm.stop(); } catch { /* */ } }
  vm = null;
  if (runState !== 'idle' || hal) {
    resetHardware();
    hal = null;
  }
  editor.setExecLine(null);
  debug.clear();
  setRunState('idle');
}
$('#btn-run').onclick = run;
$('#btn-pause').onclick = pause;
$('#btn-step').onclick = step;
$('#btn-stop').onclick = () => stopRun();
setRunState('idle');
loadRuntime().then((r) => { if (!r) status.textContent = 'Runtime loading'; else scheduleLint(); });

// ================================================================ menus and dialogs
const menu = $('#menu');
$('#btn-menu').onclick = (e) => {
  e.stopPropagation();
  const open = menu.hidden;
  menu.hidden = !open;
  $('#btn-menu').setAttribute('aria-expanded', String(open));
  if (open) menu.querySelector('button')?.focus();
};
document.addEventListener('click', (e) => { if (!menu.hidden && !e.target.closest('.menu-wrap')) { menu.hidden = true; $('#btn-menu').setAttribute('aria-expanded', 'false'); } });
menu.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  menu.hidden = true;
  ({
    new: () => setProject(newProject(project.board), { message: 'New project' }),
    open: openProjects,
    duplicate: () => { const p = { ...clone(project), id: uid('p'), name: `${project.name} (copy)` }; setProject(p, { message: 'Saved a copy' }); },
    import: () => $('#file-import').click(),
    export: () => download(`${fileSafe(project.name)}.tinker.json`, JSON.stringify(project, null, 2), 'application/json'),
    ino: downloadIno,
    lesson: openLessons,
    sound: () => { setSoundEnabled(!soundEnabled()); $('.sound-lbl').textContent = soundEnabled() ? 'Sound on' : 'Sound off'; toast(soundEnabled() ? 'Sound on' : 'Sound off'); },
    keys: () => $('#dlg-keys').showModal(),
    tour: startTour,
  })[b.dataset.act]?.();
});
$('#file-import').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const p = normalizeProject(JSON.parse(await f.text()));
    p.id = uid('p');
    setProject(p, { message: `Imported “${p.name}”` });
  } catch (err) { toast(`Could not import: ${err.message}`); }
});
function downloadIno() { download(`${fileSafe(project.name)}.ino`, editor.doc); }
$('#btn-ino').onclick = downloadIno;

for (const d of $$('dialog')) {
  d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
}
// examples
$('#ex-grid').innerHTML = EXAMPLES.map((x) => `<button class="ex-card" data-ex="${x.id}">${lucide(x.icon, { size: 22 })}<b>${esc(x.title)}</b><span>${esc(x.blurb)}</span></button>`).join('');
$('#ex-grid').addEventListener('click', (e) => {
  const b = e.target.closest('[data-ex]');
  if (!b) return;
  openExample(b.dataset.ex);
  $('#dlg-examples').close();
});
function openExample(id) {
  const ex = EXAMPLES.find((x) => x.id === id);
  if (!ex) return false;
  setProject(ex.make(), { message: `Loaded the ${ex.title} example. Press Run.` });
  return true;
}
$('#btn-examples').onclick = () => $('#dlg-examples').showModal();
$('[data-empty="examples"]').onclick = () => $('#dlg-examples').showModal();
$('[data-empty="tour"]').onclick = () => startTour();
// projects
function openProjects() {
  const list = storage.list();
  $('#pr-list').innerHTML = list.length ? list.map((p) => `<li><button class="pr-open" data-open="${p.id}"><b>${esc(p.name)}</b><span>${esc(STUDIO_BOARDS[p.board]?.name ?? p.board)} · ${p.parts} part${p.parts === 1 ? '' : 's'} · ${new Date(p.updated).toLocaleString()}</span></button>${p.id === project.id ? '<span class="chip">open</span>' : `<button class="pill pill-icon pill-sm" data-delp="${p.id}" aria-label="Delete ${esc(p.name)}">${lucide('trash-2', { size: 14 })}</button>`}</li>`).join('') : '<li class="muted">No saved projects yet.</li>';
  $('#dlg-projects').showModal();
}
$('#pr-list').addEventListener('click', (e) => {
  const o = e.target.closest('[data-open]');
  if (o) {
    const p = storage.load(o.dataset.open);
    if (p) setProject(p, { message: `Opened “${p.name}”` });
    $('#dlg-projects').close();
  }
  const d = e.target.closest('[data-delp]');
  if (d && confirm('Delete this project? This cannot be undone.')) { storage.remove(d.dataset.delp); openProjects(); }
});
// share
$('#btn-share').onclick = () => {
  storage.save(project);
  const url = shareUrl(project);
  $('#share-url').value = url;
  $('#dlg-share').showModal();
  $('#share-url').select();
};
$('#share-copy').onclick = async () => {
  try { await navigator.clipboard.writeText($('#share-url').value); toast('Link copied'); } catch { $('#share-url').select(); document.execCommand?.('copy'); toast('Link copied'); }
};
// lessons
let lessonCache = null;
async function openLessons() {
  $('#dlg-lesson').showModal();
  $('#lesson-list').innerHTML = '<li class="muted">Loading lessons…</li>';
  lessonCache ??= (await import('../lessons/index.js')).lessons.filter((l) => l.lang === 'cpp' && l.build && STUDIO_BOARDS[l.board]);
  renderLessons();
}
function renderLessons() {
  const q = $('#lesson-search').value.trim().toLowerCase();
  const list = lessonCache.filter((l) => !q || `${l.title} ${l.id} ${l.track?.title}`.toLowerCase().includes(q)).slice(0, 60);
  $('#lesson-list').innerHTML = list.map((l) => `<li><button class="pr-open" data-lesson="${l.id}"><b>${esc(l.title)}</b><span>${esc(l.track?.title ?? '')} · ${esc(STUDIO_BOARDS[l.board].name)}</span></button></li>`).join('') || '<li class="muted">No lessons match.</li>';
}
$('#lesson-search').addEventListener('input', () => lessonCache && renderLessons());
$('#lesson-list').addEventListener('click', (e) => {
  const b = e.target.closest('[data-lesson]');
  if (!b) return;
  $('#dlg-lesson').close();
  openLesson(b.dataset.lesson);
});
async function openLesson(id) {
  status.textContent = 'Copying the lesson…';
  try {
    const { project: p, report } = await (await import('./lessonImport.js')).projectFromLesson(id);
    const msg = report.reason ?? `Copied “${report.lesson.title}”: ${report.parts} part${report.parts === 1 ? '' : 's'}, ${report.wires} wire${report.wires === 1 ? '' : 's'}${report.skipped.length ? ` (left out: ${[...new Set(report.skipped)].join(', ')})` : ''}.`;
    setProject(p, { message: msg });
  } catch (e) {
    console.error(e);
    toast(`Could not open that lesson: ${e.message}`);
  }
  setRunState(runState);
}

// ================================================================ keyboard
const KEYS = [
  ['Ctrl / ⌘ + Enter', 'Run the sketch'], ['F10', 'Step (pauses first if running)'], ['Esc', 'Cancel placing or wiring · deselect'],
  ['R', 'Rotate the part being placed or the selection'], ['Delete / Backspace', 'Delete the selection'], ['Ctrl / ⌘ + D', 'Duplicate the selected part'],
  ['Ctrl / ⌘ + Z', 'Undo (circuit)'], ['Ctrl / ⌘ + Shift + Z', 'Redo'], ['F', 'Fit the view'], ['Q / E', 'Rotate the view'], ['W A S D / arrows', 'Pan'],
  ['+ / −', 'Zoom'], ['B', 'Add a breadboard'], ['?', 'This sheet'],
];
$('#keys-list').innerHTML = KEYS.map(([k, v]) => `<dt><kbd>${esc(k)}</kbd></dt><dd>${esc(v)}</dd>`).join('');
window.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key === 'Enter') { e.preventDefault(); run(); return; }
  if (e.key === 'F10') { e.preventDefault(); step(); return; }
  const typing = e.target.closest?.('input, textarea, select, .cm-editor, [contenteditable]');
  if (typing) { if (e.key === 'Escape' && e.target.closest('.cm-editor')) e.target.blur?.(); return; }
  if (document.querySelector('dialog[open]')) return;
  const k = e.key.toLowerCase();
  if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
  if (mod && k === 'y') { e.preventDefault(); doRedo(); return; }
  if (mod && k === 'd') { e.preventDefault(); duplicateSelection(); return; }
  if (mod) return;
  if (k === 'escape') { if (ws.placing || ws.wiring) ws.cancel(); else ws.select(null); closeBin(); }
  else if (k === 'r') rotateSelection();
  else if (k === 'delete' || k === 'backspace') { e.preventDefault(); deleteSelection(); }
  else if (k === 'f') frameAll();
  else if (k === 'b') addBreadboard();
  else if (k === 'q') stage.rotate(-1);
  else if (k === 'e') stage.rotate(1);
  else if (k === '+' || k === '=') stage.zoomBy(1.2);
  else if (k === '-') stage.zoomBy(1 / 1.2);
  else if (k === '?') $('#dlg-keys').showModal();
  else if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
    e.preventDefault();
    const d = 40;
    const [dx, dy] = { w: [0, d], arrowup: [0, d], s: [0, -d], arrowdown: [0, -d], a: [d, 0], arrowleft: [d, 0], d: [-d, 0], arrowright: [-d, 0] }[k];
    stage.panPixels(dx, dy);
  }
});

// ================================================================ mobile views
function setView(v) {
  app.dataset.view = v;
  for (const b of $$('.st-tabs [data-view]')) b.setAttribute('aria-pressed', String(b.dataset.view === v));
  if (v === 'monitor') dockTab('serial');
  requestAnimationFrame(() => { stage.resize(); plotter.dirty = true; plotter.draw(); });
}
for (const b of $$('.st-tabs [data-view]')) b.onclick = () => setView(b.dataset.view);

// ================================================================ guided tour
const TOUR = [
  { el: '#bin', title: 'The parts bin', text: 'Drag a part onto the bench. Breadboard parts snap into the holes; the ghost shows where every leg will go.', mobile: '#btn-add' },
  { el: '#stage', title: 'Wire it up', text: 'Click a board pin or a hole, then a second one, to add a jumper. Hover any hole to see its voltage. Click a part to change it.' },
  { el: '#editor', title: 'Write the sketch', text: 'Real Arduino C++ with completions. Click left of a line number to set a breakpoint.', view: 'code' },
  { el: '#btn-run', title: 'Run it', text: 'The sketch runs on the live circuit. Too much current and parts complain, just like real ones (but nothing catches fire).' },
  { el: '#dock', title: 'See what it says', text: 'Serial output, a plotter for numbers and a debugger for variables. Share or save your project from the top bar.', view: 'monitor' },
];
let tourStep = -1;
function startTour() {
  tourStep = 0;
  $('#tour').hidden = false;
  showTourStep();
}
function showTourStep() {
  const s = TOUR[tourStep];
  if (!s) return endTour();
  if (isMobile()) setView(s.view ?? 'build');
  requestAnimationFrame(() => {
    const target = $(isMobile() && s.mobile ? s.mobile : s.el);
    const r = target.getBoundingClientRect();
    const ring = $('#tour-ring');
    Object.assign(ring.style, { left: `${r.left - 6}px`, top: `${r.top - 6}px`, width: `${r.width + 12}px`, height: `${r.height + 12}px` });
    const card = $('#tour-card');
    card.innerHTML = `<small>${tourStep + 1} of ${TOUR.length}</small><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><div class="row"><button class="pill pill-sm" data-tour="skip">Skip</button><button class="pill pill-sm pill-primary" data-tour="next">${tourStep === TOUR.length - 1 ? 'Done' : 'Next'}</button></div>`;
    const cw = Math.min(320, innerWidth - 32);
    let x = r.right + 16, y = r.top;
    if (x + cw > innerWidth - 16) x = Math.max(16, r.left + r.width / 2 - cw / 2);
    if (x === r.right + 16) y = Math.min(Math.max(16, r.top), innerHeight - 220);
    else y = r.bottom + 16 + 200 < innerHeight ? r.bottom + 16 : Math.max(16, r.top - 216);
    if (r.height > innerHeight * 0.6 && x !== r.right + 16) y = Math.max(16, r.top + 24);
    Object.assign(card.style, { left: `${x}px`, top: `${y}px`, width: `${cw}px` });
    card.querySelector('[data-tour="next"]').focus();
  });
}
function endTour() {
  $('#tour').hidden = true;
  tourStep = -1;
  storage.flag('toured', true);
  if (isMobile()) setView('build');
}
$('#tour').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tour]');
  if (!b) return;
  if (b.dataset.tour === 'skip') endTour();
  else { tourStep++; showTourStep(); }
});
window.addEventListener('keydown', (e) => { if (tourStep >= 0 && e.key === 'Escape') endTour(); });

// ================================================================ boot
const noTour = /[?&]notour/.test(location.search);
async function boot() {
  const hash = location.hash;
  let loaded = false;
  try {
    const shared = fromShare(hash);
    if (shared) { shared.id = uid('p'); setProject(shared, { message: `Opened a shared project: “${shared.name}”` }); loaded = true; }
  } catch (e) { toast(e.message); }
  const lesson = /[#&]lesson=([\w-]+)/.exec(hash)?.[1];
  if (!loaded && lesson) { await openLesson(lesson); loaded = true; }
  const ex = /[#&]example=([\w-]+)/.exec(hash)?.[1];
  if (!loaded && ex) loaded = openExample(ex);
  if (loaded) history.replaceState(null, '', location.pathname + location.search);
  if (!loaded) {
    const cur = storage.current();
    const p = cur && storage.load(cur);
    if (p) setProject(p);
    else setProject(newProject('uno'));
  }
  if (!storage.flag('toured') && !noTour) setTimeout(startTour, 600);
}
window.addEventListener('hashchange', () => { if (/[#&](p|lesson|example)=/.test(location.hash)) boot(); });
boot();

// test / automation hooks (read-only views + the same entry points the UI uses)
window.__studio = {
  get project() { return project; }, ws, sim, stage, editor,
  get vm() { return vm; }, get frame() { return frameResult; }, get modules() { return modules; },
  run, stopRun, openExample, openLesson, setProject, commit, autoPlace,
  state: (id) => sim.state(id),
};
