// "Open this lesson in Studio": rebuild a lesson's circuit as an editable
// Studio project. The lesson is built with the shared scene context; the
// board's pins and the breadboard holes are known positions, so every wire
// end resolves to an endpoint, and every recognised part is matched to a
// catalogue type by rebuilding candidates on the same holes and comparing
// their geometry (so polarity and pin order come out right).
import * as THREE from 'three';
import { buildLessonScene } from '../scene/context.js';
import { makeBreadboard } from '../scene/breadboard.js';
import { makeStudioBoard, STUDIO_BOARDS } from './boards.js';
import { PART } from './catalog.js';
import { newProject, uid } from './model.js';
import { ROWS_TOP, ROWS_BOT, RAILS } from './circuit/netlist.js';

const ROWS = [...ROWS_TOP, ...ROWS_BOT];
const key3 = (p) => `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`;

/** Geometry fingerprint of a part model: depends on leg routing, so mirrored legs differ. */
function fingerprint(group) {
  group.updateMatrixWorld(true);
  let s = 0, n = 0;
  const v = new THREE.Vector3();
  const walk = (o, fn) => { if (o.userData.noPrint) return; fn(o); for (const c of o.children) walk(c, fn); };
  walk(group, (o) => {
    if (!o.isMesh || o.isSprite || o.isInstancedMesh || o.material?.blending === THREE.AdditiveBlending) return;
    const pos = o.geometry.attributes.position;
    if (!pos) return;
    const step = Math.max(1, Math.floor(pos.count / 400));
    for (let i = 0; i < pos.count; i += step) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      s += v.x * 1.37 + v.y * v.x * 2.11 + v.z * 0.73 + v.y * v.z * 1.9;
      n++;
    }
  });
  return { s, n };
}

/** Holes (from `holes`) that a part's legs go into: leg tubes start 0.05 below a hole. */
function legHolesOf(group, holes) {
  group.updateMatrixWorld(true);
  const found = new Map();
  const v = new THREE.Vector3();
  group.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh) return;
    const pos = o.geometry.attributes.position;
    if (!pos || pos.count > 4000) return;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      if (Math.abs(v.y - 0.8) > 0.03) continue;
      for (const h of holes) {
        if (Math.abs(h.pos.x - v.x) < 0.045 && Math.abs(h.pos.z - v.z) < 0.045) found.set(h.key, h);
      }
    }
  });
  return [...found.values()];
}

function orderings(list) {
  const byX = [...list].sort((a, b) => a.pos.x - b.pos.x || a.pos.z - b.pos.z);
  const byZ = [...list].sort((a, b) => a.pos.z - b.pos.z || a.pos.x - b.pos.x);
  const rowMajor = [...list].sort((a, b) => (Math.abs(a.pos.z - b.pos.z) > 0.1 ? a.pos.z - b.pos.z : a.pos.x - b.pos.x));
  const out = [byX, [...byX].reverse(), byZ, [...byZ].reverse(), rowMajor, [...rowMajor].reverse()];
  if (list.length === 2) out.push([list[1], list[0]]);
  return out;
}

const BB_TYPES = ['led', 'resistor', 'diode', 'ldr', 'buzzer', 'pot', 'npn', 'button', 'rgb', 'ultrasonic', 'sevenseg'];

/** Build the Studio project for a lesson id. Returns { project, report } or throws. */
export async function projectFromLesson(id) {
  const { lessons } = await import('../lessons/index.js');
  const lesson = lessons.find((l) => l.id === id);
  if (!lesson) throw new Error(`No lesson called “${id}”.`);
  const params = Object.fromEntries(Object.entries(lesson.params ?? {}).map(([k, p]) => [k, p.value]));
  const code = (lesson.code ?? '').replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] ?? 0);
  const boardId = STUDIO_BOARDS[lesson.board] ? lesson.board : null;
  const report = { lesson, parts: 0, wires: 0, skipped: [], board: lesson.board };
  if (!boardId || lesson.lang !== 'cpp' || !lesson.build) {
    const p = newProject(boardId ?? 'uno', lesson.title);
    p.code = lesson.lang === 'cpp' ? code : `// “${lesson.title}” is a ${lesson.lang === 'python' ? 'Python' : ''} lesson for the ${lesson.board} board.\n// Studio runs Arduino C++ on Uno, Nano, Mega and ESP32 boards.\n\n${p.code}`;
    report.partial = true;
    report.reason = boardId ? 'This lesson has no circuit to copy.' : `Studio does not have the ${lesson.board} board yet, so this opens with a starter Uno circuit.`;
    return { project: p, report };
  }
  // build the lesson with a board whose pin() records which pin each position belongs to
  const sb = makeStudioBoard(boardId);
  const pinAt = new Map();
  const rawPin = sb.api.pin.bind(sb.api);
  for (const name of sb.pinNames) { try { pinAt.set(key3(rawPin(name)), name); } catch { /* */ } }
  const { st, error } = buildLessonScene(lesson, { board: sb.api });
  if (error) throw error;
  const project = newProject(boardId, lesson.title);
  project.breadboards = [];
  project.code = code;
  // breadboards and their holes
  const holes = [];
  st.steps.filter((s) => s.kind === 'breadboard').forEach((s, i) => {
    const g = s.objects[0];
    if (Math.abs(g.rotation.y) > 0.01) return;
    const bbId = `bb${i + 1}`;
    project.breadboards.push({ id: bbId, x: g.position.x, z: g.position.z });
    const api = makeBreadboard();
    api.group.position.copy(g.position);
    api.group.updateMatrixWorld(true);
    for (let col = 1; col <= 30; col++) {
      for (const row of ROWS) holes.push({ key: `${bbId}:${col}:${row}`, ep: { t: 'hole', bb: bbId, col, row }, pos: api.hole(col, row) });
      if (col % 6) for (const row of RAILS) holes.push({ key: `${bbId}:${col}:${row}`, ep: { t: 'hole', bb: bbId, col, row }, pos: api.hole(col, row) });
    }
  });
  const used = new Set();
  // a wire may land in the gap of a rail (no hole there on a real board): use the nearest free hole
  const holeAt = (p) => {
    const exact = holes.find((h) => h.pos.distanceTo(p) < 0.05);
    if (exact) return exact;
    let best = null, bd = 0.3;
    for (const h of holes) { const d = h.pos.distanceTo(p); if (d < bd && !used.has(h.key)) { bd = d; best = h; } }
    return best;
  };
  // parts
  const pinOwners = []; // [{ pos, ep }]
  const lessonText = `${lesson.code} ${JSON.stringify(lesson.specs ?? '')}`;
  for (const s of st.steps) {
    if (s.kind === 'wire' || s.kind === 'breadboard' || !s.part) continue;
    const api = s.part;
    const sid = uid('q');
    // free-standing modules first (duck-typed by their API)
    const free = freeType(api);
    if (free) {
      const g = api.group;
      const rot = ((Math.round(-g.rotation.y / (Math.PI / 2)) % 4) + 4) % 4;
      const props = { ...PART[free].defaults };
      project.parts.push({ id: sid, type: free, rot, props, pos: [g.position.x, g.position.z] });
      report.parts++;
      for (const [pin, pos] of freePins(free, api)) pinOwners.push({ pos, ep: { t: 'part', id: sid, pin } });
      continue;
    }
    const legs = legHolesOf(api.group, holes);
    if (!legs.length) { if (api.group.children.length) report.skipped.push(labelOf(api)); continue; }
    const match = matchBB(api, legs, lessonText);
    if (!match) { report.skipped.push(labelOf(api, legs.length)); continue; }
    const leg0 = match.order[0];
    const q = { id: sid, type: match.type, rot: match.rot, props: match.props, at: { bb: leg0.ep.bb, col: leg0.ep.col, row: leg0.ep.row } };
    if (match.stretch) q.at2 = { bb: match.order[1].ep.bb, col: match.order[1].ep.col, row: match.order[1].ep.row };
    project.parts.push(q);
    for (const h of match.order) used.add(h.key);
    report.parts++;
  }
  // wires
  for (const s of st.steps) {
    if (s.kind !== 'wire') continue;
    const ends = [s.from, s.to].map((p) => {
      const pin = pinAt.get(key3(p));
      if (pin) return { t: 'board', pin };
      const h = holeAt(p);
      if (h) { used.add(h.key); return h.ep; }
      const m = pinOwners.find((o) => o.pos.distanceTo(p) < 0.08);
      return m ? m.ep : null;
    });
    if (ends[0] && ends[1]) {
      project.wires.push({ id: uid('w'), a: ends[0], b: ends[1], color: typeof s.color === 'string' ? s.color : 'orange' });
      report.wires++;
    } else report.skipped.push('a wire');
  }
  report.partial = report.skipped.length > 0;
  return { project, report };
}

function labelOf(api, legs) {
  if (api.label) return api.label;
  return legs ? `a ${legs}-pin part` : 'a prop';
}

function freeType(api) {
  const pins = api.pins ?? [];
  const has = (...k) => k.every((x) => pins.includes(x));
  if (api.leads && api.set && !api.pins) return 'servo';
  if (api.terminals && api.set) return 'motor';
  if (api.terminal && !api.pins && api.set) return 'lamp';
  if (has('IN', 'VCC', 'GND', 'NO')) return 'relay';
  if (api.width === 128 && api.draw) return 'oled';
  if (api.cols === 16 && api.print) return 'lcd';
  if (has('DIN', '5V', 'GND')) return api.count === 12 ? 'ring' : api.count === 8 ? 'strip' : null;
  if (has('VCC', 'OUT', 'GND') && api.trigger) return 'pir';
  if (has('VCC', 'DATA', 'GND')) return 'dht11';
  if (has('VRX', 'VRY', 'SW')) return 'joystick';
  if (has('R1', 'C4')) return 'keypad';
  return null;
}

function freePins(type, api) {
  if (type === 'servo') return [['GND', api.leads[0]], ['V+', api.leads[1]], ['SIG', api.leads[2]]];
  if (type === 'motor') return [['T1', api.terminals[0]], ['T2', api.terminals[1]]];
  if (type === 'lamp') return [['T1', api.terminal(0)], ['T2', api.terminal(1)]];
  return PART[type].pins.map((p) => [p, api.pin(p)]);
}

function matchBB(api, legs, text) {
  const target = fingerprint(api.group);
  const props = (type) => {
    const p = { ...PART[type].defaults };
    if (type === 'led' && api.color) p.color = api.color;
    if (type === 'resistor' && api.ohms) p.ohms = api.ohms;
    return p;
  };
  for (const type of BB_TYPES) {
    const def = PART[type];
    if (def.legs.length !== legs.length) continue;
    if (type === 'led' && !api.setColor) continue;
    if (type === 'resistor' && !api.setValue) continue;
    if (type === 'button' && !api.press) continue;
    if (type === 'npn' && /TMP36|LM35/.test(text)) continue;
    for (const order of orderings(legs)) {
      for (let rot = 0; rot < 4; rot++) {
        // the order must match the part's leg layout at this rotation
        const o = order[0].pos;
        const c = Math.cos((rot * Math.PI) / 2), s = Math.sin((rot * Math.PI) / 2);
        const fits = def.legs.every(([x, z], i) => {
          const px = o.x + x * c - z * s, pz = o.z + x * s + z * c;
          return Math.abs(order[i].pos.x - px) < 0.03 && Math.abs(order[i].pos.z - pz) < 0.03;
        });
        if (!fits) continue;
        const p = props(type);
        if (type === 'resistor') return { type, order, rot, props: p };
        const cand = def.build({ holes: order.map((h) => h.pos.clone()), props: p, rot });
        const f = fingerprint(cand.group);
        if (f.n === target.n && Math.abs(f.s - target.s) < 1e-3 * Math.max(1, Math.abs(target.s))) return { type, order, rot, props: p };
      }
    }
  }
  // two-lead parts with their leads bent to holes off the standard spacing
  if (legs.length === 2) {
    for (const type of ['resistor', 'led', 'diode', 'ldr', 'buzzer']) {
      if (type === 'led' && !api.setColor) continue;
      if (type === 'resistor') { if (api.setValue) return { type, order: legs, rot: 0, props: props(type), stretch: true }; continue; }
      if (api.setValue || (type !== 'led' && api.setColor)) continue;
      for (const order of [legs, [legs[1], legs[0]]]) {
        const cand = PART[type].build({ holes: order.map((h) => h.pos.clone()), props: props(type), rot: 0 });
        const f = fingerprint(cand.group);
        if (f.n === target.n && Math.abs(f.s - target.s) < 1e-3 * Math.max(1, Math.abs(target.s))) return { type, order, rot: 0, props: props(type), stretch: true };
      }
    }
  }
  return null;
}
