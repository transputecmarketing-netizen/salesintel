// Turns a lesson into a build guide: builds its scene, then groups the
// recorded assembly steps (st.steps) into manual steps with captions, and
// derives the parts inventory.
import * as THREE from 'three';
import { buildLessonScene, NULL_DOCK } from '../scene/context.js';
import { makeBoardOfType, BOARD_INFO } from '../scene/boards/index.js';
import { visibleBox } from './lineart.js';

const ROWS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
const RAILS = ['top-', 'top+', 'bot-', 'bot+'];
const SMALL = 2.3; // cm: parts smaller than this can share a step

const COLOR_WORD = { red: 'red', black: 'black', orange: 'orange', yellow: 'yellow', green: 'green', blue: 'blue', white: 'white', brown: 'brown', purple: 'purple' };
const an = (w) => (/^[aeiou]/i.test(w) ? 'an' : 'a');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Lessons that can have a build guide (3D lessons with a build function). */
export const hasGuide = (l) => typeof l.build === 'function' && !l.explainer;

/** "GND_2" → "GND", "PIN12" → "pin 12". */
export function prettyPin(name) {
  if (!name) return name;
  const m = /^PIN(\d+)$/.exec(name);
  if (m) return `pin ${m[1]}`;
  return name.replace(/_\d+$/, '');
}

function holeName({ col, row }) {
  if (RAILS.includes(row)) return `the ${row.startsWith('top') ? 'top' : 'bottom'} ${row.endsWith('+') ? '+' : '−'} rail`;
  return `row ${row}, column ${col}`;
}

/**
 * Build the lesson and plan its guide.
 * @returns {{ lesson, board, root, units, steps, inventory, bbs, error, meta }}
 */
export function planGuide(lesson) {
  const board = makeBoardOfType(lesson.board ?? 'uno');
  board.setBuiltinLed?.(0);
  const bbs = [];
  const proxy = {
    ...lesson,
    build(ctx) {
      const orig = ctx.breadboard;
      ctx.breadboard = (...a) => {
        const bb = orig(...a);
        bbs.push(bb);
        return bb;
      };
      return lesson.build(ctx);
    },
  };
  const scene = buildLessonScene(proxy, { board, dock: NULL_DOCK });
  const { root, st } = scene;
  const names = new Map();
  for (const it of st.interactive) if (it.part && it.name) names.set(it.part, it.name);

  // ---- units: the board, then one per recorded step
  const units = [{ kind: 'board', label: board.info?.name ?? board.name ?? 'Board', objects: [board.group], part: board }];
  let bbi = 0;
  for (const s of st.steps) {
    const u = { kind: s.kind, label: s.label, objects: s.objects, part: s.part, wire: s.wire, from: s.from, to: s.to, color: s.color, signal: s.signal, caption: s.caption };
    if (s.kind === 'breadboard') u.bb = bbs[bbi++];
    if (!u.label && s.part) u.label = s.part.label ?? names.get(s.part) ?? guessLabel(s.part);
    units.push(u);
  }
  for (const u of units) {
    u.box = visibleBox(u.objects);
    u.empty = u.box.isEmpty();
    u.size = u.empty ? 0 : u.box.getSize(new THREE.Vector3()).length();
    if (u.kind === 'part' && u.label) u.kind = 'part';
    if (u.empty || u.kind === 'effect') u.silent = true;
  }

  const namer = makeNamer(board, bbs, units);
  for (const u of units) if (!u.silent && u.kind !== 'wire' && u.kind !== 'board' && u.kind !== 'breadboard') u.holes = partHoles(u, bbs);

  // ---- group into manual steps
  const steps = [];
  let cur = null;
  const cls = (u) => (u.kind === 'wire' ? 'wire' : u.kind === 'board' || u.kind === 'breadboard' ? 'solo' : u.size < SMALL && u.holes?.length ? 'small' : 'big');
  units.forEach((u, i) => {
    if (u.silent) {
      // invisible helpers ride along with the step before them
      if (cur) cur.units.push(i);
      else steps.push((cur = { units: [i], cls: 'solo' }));
      return;
    }
    const c = cls(u);
    const shown = cur ? cur.units.filter((j) => !units[j].silent).length : 0;
    const join = cur && !u.caption && cur.cls === c && shown < 2 && (c === 'wire' || c === 'small');
    if (join) cur.units.push(i);
    else steps.push((cur = { units: [i], cls: c, caption: u.caption ?? null }));
  });
  steps.forEach((s, n) => {
    s.n = n + 1;
    const vis = s.units.filter((j) => !units[j].silent).map((j) => units[j]);
    s.kind = vis[0]?.kind ?? 'part';
    s.caption ??= captionFor(vis, namer, board, units);
    s.parts = countParts(vis);
    s.wires = vis.filter((u) => u.kind === 'wire').map((u) => ({ u, a: namer.end(u.from), b: namer.end(u.to) }));
  });

  // ---- inventory
  const inv = new Map();
  units.forEach((u, i) => {
    if (u.silent) return;
    const k = invKey(u);
    if (!k) return;
    const e = inv.get(k.key);
    if (e) e.count++;
    else inv.set(k.key, { ...k, count: 1, unit: i });
  });
  const order = { board: 0, breadboard: 1, part: 2, prop: 3, wire: 4 };
  const inventory = [...inv.values()].sort((a, b) => (order[a.group] ?? 2) - (order[b.group] ?? 2));

  const nSteps = steps.filter((s) => s.units.some((j) => !units[j].silent)).length;
  const minutes = Math.max(10, Math.round((6 + nSteps * 2.2) / 5) * 5);
  return {
    lesson,
    board,
    root,
    units,
    steps,
    inventory,
    bbs,
    error: scene.error,
    meta: {
      level: lesson.level ?? lesson.track?.level ?? '',
      board: BOARD_INFO[lesson.board]?.name ?? board.name ?? lesson.board,
      minutes,
      track: lesson.track?.title ?? '',
      parts: inventory.reduce((n, e) => n + e.count, 0),
    },
  };
}

function guessLabel(part) {
  if (part.lensWorld) return 'CSI camera module';
  if (part.curve && !part.pins) return 'Ribbon cable';
  return null;
}

function invKey(u) {
  if (u.kind === 'board') return { key: 'board', label: u.label, group: 'board' };
  if (u.kind === 'breadboard') return { key: 'bb', label: 'Half-size breadboard', group: 'breadboard' };
  if (u.kind === 'wire') {
    const c = COLOR_WORD[u.color] ?? 'coloured';
    return { key: `wire:${c}`, label: `${cap(c)} jumper wire`, group: 'wire', color: u.color };
  }
  if (!u.label) return null;
  return { key: `p:${u.label}`, label: u.label, group: u.kind === 'prop' ? 'prop' : 'part' };
}

function countParts(vis) {
  const m = new Map();
  for (const u of vis) {
    const k = invKey(u);
    if (!k) continue;
    const e = m.get(k.key);
    if (e) e.count++;
    else m.set(k.key, { ...k, count: 1, u });
  }
  return [...m.values()];
}

// ---------------------------------------------------------------- naming points
function makeNamer(board, bbs, units) {
  const pins = [];
  for (const name of board.pins ?? []) {
    try {
      const p = board.pin(name);
      if (p) pins.push([name, p]);
    } catch { /* skip */ }
  }
  const holes = [];
  for (const bb of bbs) {
    for (let col = 1; col <= 30; col++) {
      for (const row of ROWS) holes.push({ bb, col, row, p: bb.hole(col, row) });
      for (const row of RAILS) holes.push({ bb, col, row, p: bb.hole(col, row) });
    }
  }
  const modulePins = [];
  for (const u of units) {
    const part = u.part;
    if (!part || part === board || !Array.isArray(part.pins) || typeof part.pin !== 'function') continue;
    for (const name of part.pins) {
      try { modulePins.push({ u, name, p: part.pin(name) }); } catch { /* skip */ }
    }
  }
  const short = (label) => (label ?? 'module').replace(/\s*\(.*\)\s*/g, ' ').trim();
  return {
    /** { type: 'board'|'module'|'hole'|'other', text, pin? } for a world point. */
    end(p) {
      if (!p) return { type: 'other', text: 'the free end' };
      let best = null, bd = 0.16;
      for (const [name, q] of pins) {
        const d = q.distanceTo(p);
        if (d < bd) { bd = d; best = name; }
      }
      if (best) return { type: 'board', text: prettyPin(best), pin: best };
      let mb = null; bd = 0.2;
      for (const m of modulePins) {
        const d = m.p.distanceTo(p);
        if (d < bd) { bd = d; mb = m; }
      }
      if (mb) return { type: 'module', text: `${short(mb.u.label)} ${prettyPin(mb.name)}`, pin: mb.name, short: prettyPin(mb.name) };
      let hb = null; bd = 0.1;
      for (const h of holes) {
        const d = h.p.distanceTo(p);
        if (d < bd) { bd = d; hb = h; }
      }
      if (hb) return { type: 'hole', text: holeName(hb), hole: hb, short: RAILS.includes(hb.row) ? hb.row.replace('top', 'top ').replace('bot', 'bottom ').replace('-', '−') : `${hb.row}${hb.col}` };
      // otherwise: the nearest part
      let pu = null; bd = 1.2;
      for (const u of units) {
        if (u.silent || u.kind === 'wire' || u.kind === 'breadboard' || !u.label) continue;
        const d = u.box.distanceToPoint(p);
        if (d < bd) { bd = d; pu = u; }
      }
      if (pu) return { type: 'part', text: `the ${pu.kind === 'board' ? 'board' : short(pu.label)}`, short: short(pu.label) };
      return { type: 'other', text: 'its terminal' };
    },
  };
}

/** Breadboard holes a part's legs go into. */
function partHoles(u, bbs) {
  if (!bbs.length) return [];
  const found = new Map();
  const v = new THREE.Vector3();
  for (const obj of u.objects)
    obj.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || !o.visible) return;
      const pos = o.geometry.attributes.position;
      if (!pos) return;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
        for (const bb of bbs) {
          const top = bb.top + bb.group.position.y;
          if (v.y > top - 0.025 || v.y < top - 0.25) continue;
          const local = bb.group.worldToLocal(v.clone());
          const col = Math.round((local.x + (29 * 0.254) / 2) / 0.254) + 1;
          if (col < 1 || col > 30) continue;
          const h = bb.hole(col, 'a');
          if (Math.abs(bb.group.worldToLocal(h.clone()).x - local.x) > 0.07) continue;
          for (const row of [...ROWS, ...RAILS]) {
            const q = bb.group.worldToLocal(bb.hole(col, row));
            if (Math.abs(q.z - local.z) < 0.07) {
              found.set(`${row}${col}`, { bb, col, row });
              break;
            }
          }
        }
      }
    });
  return [...found.values()];
}

function holesText(holes) {
  if (!holes.length) return '';
  const rows = [...new Set(holes.map((h) => h.row))];
  const cols = [...new Set(holes.map((h) => h.col))].sort((a, b) => a - b);
  const list = (xs) => (xs.length <= 2 ? xs.join(' and ') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
  if (rows.length === 1 && !RAILS.includes(rows[0])) return `row ${rows[0]}, column${cols.length > 1 ? 's' : ''} ${list(cols)}`;
  if (cols.length === 1 && rows.every((r) => !RAILS.includes(r))) return `column ${cols[0]}, rows ${list(rows)}`;
  const names = holes
    .slice()
    .sort((a, b) => a.col - b.col || a.row.localeCompare(b.row))
    .map((h) => (RAILS.includes(h.row) ? `the ${h.row.replace('top', 'top ').replace('bot', 'bottom ').replace('-', ' −').replace('+', ' +')} rail` : `${h.row}${h.col}`));
  return `holes ${list(names.slice(0, 6))}`;
}

// ---------------------------------------------------------------- captions
function article() {
  return 'the';
}

function lower(label) {
  // keep acronyms and model names, lower-case ordinary first words ("Red LED" → "red LED")
  return /^[A-Z][a-z]/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label;
}

function partPhrase(u) {
  const name = `${article(u.label ?? '')} ${lower(u.label ?? 'part')}`;
  if (u.holes?.length) {
    let s = `${name} into ${holesText(u.holes)}`;
    if (u.part?.kind === 'led' && u.holes.length === 2) {
      const an = ledAnode(u);
      if (an) s += `, long leg (+) in ${an.row}${an.col}`;
    }
    return { verb: 'Push', text: s };
  }
  return { verb: 'Place', text: name };
}

function ledAnode(u) {
  // makeLED bends the anode leg up to a foot on the +x side of the lens and the
  // cathode leg to the -x side: follow each leg from its top back to its hole
  const body = u.part.pick;
  if (!body) return null;
  const bx = body.getWorldPosition(new THREE.Vector3()).x;
  const v = new THREE.Vector3();
  let anode = null;
  for (const o of u.part.group.children) {
    if (!o.isMesh || !/Tube|Cylinder/.test(o.geometry.type)) continue;
    const pos = o.geometry.attributes.position;
    let lo = null, hi = null;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      if (!lo || v.y < lo.y) lo = v.clone();
      if (!hi || v.y > hi.y) hi = v.clone();
    }
    if (hi && hi.x > bx + 0.02) anode = lo;
  }
  if (!anode) return null;
  let best = null, bd = Infinity;
  for (const h of u.holes) {
    const p = h.bb.hole(h.col, h.row);
    const d = Math.hypot(p.x - anode.x, p.z - anode.z);
    if (d < bd) { bd = d; best = h; }
  }
  return bd < 0.12 ? best : null;
}

function article() {
  return 'the';
}

function lower(label) {
  // keep acronyms and model names, lower-case ordinary first words ("Red LED" → "red LED")
  return /^[A-Z][a-z]/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label;
}

function partPhrase(u) {
  const name = `${article(u.label ?? '')} ${lower(u.label ?? 'part')}`;
  if (u.holes?.length) {
    let s = `${name} into ${holesText(u.holes)}`;
    if (u.part?.kind === 'led' && u.holes.length === 2) {
      const an = ledAnode(u);
      if (an) s += `, long leg (+) in ${an.row}${an.col}`;
    }
    return { verb: 'Push', text: s };
  }
  return { verb: 'Place', text: name };
}

function ledAnode(u) {
  // makeLED puts the anode's foot on the +x side of the body: the anode hole is the one further along +x
  const xs = u.holes.map((h) => ({ h, x: h.bb.hole(h.col, h.row).x }));
  xs.sort((p, q) => q.x - p.x);
  return xs[0].x - xs[1].x > 0.1 ? xs[0].h : null;
}

function wirePhrase(u, namer, first = true) {
  let a = namer.end(u.from), b = namer.end(u.to);
  const rank = { board: 0, module: 1, part: 2, hole: 3, other: 4 };
  if (rank[b.type] < rank[a.type]) [a, b] = [b, a];
  const color = COLOR_WORD[u.color] ?? 'coloured';
  let s = first ? `Connect ${a.text} to ${b.text} with ${an(color)} ${color} jumper` : `${a.text} to ${b.text} with ${an(color)} ${color} one`;
  const sig = u.signal ? prettyPin(u.signal) : null;
  if (sig && ![a, b].some((e) => e.text === sig || e.pin === u.signal || e.text.endsWith(` ${sig}`) || (e.short ?? '') === sig)) s += ` (${sig})`;
  return s;
}

function captionFor(vis, namer, board, units) {
  if (!vis.length) return '';
  const u0 = vis[0];
  if (u0.kind === 'board') return `Start with the ${u0.label}. Lay it flat on the desk.`;
  if (u0.kind === 'breadboard') {
    const bx = u0.box.getCenter(new THREE.Vector3());
    const b = units[0].box.getCenter(new THREE.Vector3());
    const dx = bx.x - b.x, dz = bx.z - b.z;
    const where = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'to the right of' : 'to the left of') : dz > 0 ? 'in front of' : 'behind';
    return `Place the breadboard ${where} the board.`;
  }
  if (u0.kind === 'wire') {
    if (vis.length === 1) return `${wirePhrase(u0, namer)}.`;
    return `${wirePhrase(u0, namer)}, and ${wirePhrase(vis[1], namer, false)}.`;
  }
  const ps = vis.filter((u) => u.kind !== 'wire').map(partPhrase);
  if (ps.length === 1) return `${ps[0].verb} ${ps[0].text}.`;
  if (ps.every((p) => p.verb === ps[0].verb)) return `${ps[0].verb} ${ps[0].text}, then ${ps[1].text}.`;
  return `${ps[0].verb} ${ps[0].text}. ${ps[1].verb} ${ps[1].text}.`;
}
