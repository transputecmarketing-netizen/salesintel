// The Studio project document. Plain JSON so it can be saved, shared and undone.
//
// project = {
//   v: 1, id, name, board: 'uno' | 'nano' | 'mega' | 'esp32', code,
//   breadboards: [{ id, x, z }],
//   parts: [{ id, type, rot: 0–3, props, at: { bb, col, row } (breadboard parts: hole of leg 0) | pos: [x, z] (free parts) }],
//   wires: [{ id, a: Endpoint, b: Endpoint, color }],
// }
// Endpoint = { t: 'hole', bb, col, row } | { t: 'board', pin } | { t: 'part', id, pin }
import { PART } from './catalog.js';

export const WIRE_COLORS = ['red', 'black', 'orange', 'yellow', 'green', 'blue', 'white', 'purple', 'brown'];
export const BB_SPOT = { uno: [9.4, -0.6], nano: [7.4, -0.6], mega: [10.6, -0.6], esp32: [7.9, -0.6] };

export const uid = (p = 'x') => `${p}${Math.random().toString(36).slice(2, 8)}`;

export const BLANK_CODE = `void setup() {
  // runs once
}

void loop() {
  // runs forever
}
`;

export function newProject(board = 'uno', name = 'Untitled project') {
  const [x, z] = BB_SPOT[board] ?? BB_SPOT.uno;
  return { v: 1, id: uid('p'), name, board, code: BLANK_CODE, breadboards: [{ id: 'bb1', x, z }], parts: [], wires: [], updated: Date.now() };
}

export function epKey(ep) {
  if (!ep) return '';
  if (ep.t === 'hole') return `h:${ep.bb}:${ep.col}:${ep.row}`;
  if (ep.t === 'board') return `board:${ep.pin}`;
  return `p:${ep.id}:${ep.pin}`;
}
export const sameEp = (a, b) => epKey(a) === epKey(b);

/** Validate / repair an imported project. Throws on garbage. */
export function normalizeProject(p) {
  if (!p || typeof p !== 'object') throw new Error('Not a Tinker Studio project');
  const out = {
    v: 1,
    id: typeof p.id === 'string' ? p.id : uid('p'),
    name: String(p.name ?? 'Imported project').slice(0, 80),
    board: ['uno', 'nano', 'mega', 'esp32'].includes(p.board) ? p.board : 'uno',
    code: typeof p.code === 'string' ? p.code : BLANK_CODE,
    breadboards: Array.isArray(p.breadboards) ? p.breadboards.filter((b) => b && typeof b.id === 'string').map((b) => ({ id: b.id, x: +b.x || 0, z: +b.z || 0 })) : [],
    parts: [],
    wires: [],
    updated: Date.now(),
  };
  const bbs = new Set(out.breadboards.map((b) => b.id));
  for (const part of Array.isArray(p.parts) ? p.parts : []) {
    const def = PART[part?.type];
    if (!def || typeof part.id !== 'string') continue;
    const q = { id: part.id, type: part.type, rot: ((part.rot | 0) % 4 + 4) % 4, props: { ...def.defaults, ...(part.props ?? {}) } };
    if (def.mount === 'bb') {
      if (!part.at || !bbs.has(part.at.bb)) continue;
      q.at = { bb: part.at.bb, col: part.at.col | 0, row: String(part.at.row) };
    } else q.pos = [Number(part.pos?.[0]) || 0, Number(part.pos?.[1]) || 0];
    out.parts.push(q);
  }
  const ids = new Set(out.parts.map((x) => x.id));
  const okEp = (e) => e && ((e.t === 'hole' && bbs.has(e.bb)) || (e.t === 'board' && typeof e.pin === 'string') || (e.t === 'part' && ids.has(e.id)));
  for (const w of Array.isArray(p.wires) ? p.wires : []) {
    if (!okEp(w?.a) || !okEp(w?.b)) continue;
    out.wires.push({ id: typeof w.id === 'string' ? w.id : uid('w'), a: { ...w.a }, b: { ...w.b }, color: WIRE_COLORS.includes(w.color) ? w.color : 'orange' });
  }
  return out;
}

export const clone = (p) => JSON.parse(JSON.stringify(p));
