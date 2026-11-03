// Netlist: turns a Studio project (breadboards, parts, wires) into electrical
// nodes. Breadboard strips (5-hole columns, rails), part legs sitting in holes
// and pins joined on the board PCB merge into one node. Jumper wires are kept
// as tiny resistors (30 mΩ) so the solver also reports the current in each
// wire. `net` is plain connectivity (wires included), used for wiring checks.

export const WIRE_OHMS = 0.03;
export const ROWS_TOP = ['a', 'b', 'c', 'd', 'e'];
export const ROWS_BOT = ['f', 'g', 'h', 'i', 'j'];
export const RAILS = ['top+', 'top-', 'bot-', 'bot+'];

export const holeKey = (bb, col, row) => `h:${bb}:${col}:${row}`;
export function stripOf(key) {
  const [, bb, col, row] = key.split(':');
  if (RAILS.includes(row)) return `s:${bb}:${row}`;
  return `s:${bb}:${ROWS_TOP.includes(row) ? 'T' : 'B'}${col}`;
}

class DSU {
  constructor() { this.p = new Map(); }
  find(x) {
    if (!this.p.has(x)) this.p.set(x, x);
    let r = x;
    while (this.p.get(r) !== r) r = this.p.get(r);
    while (this.p.get(x) !== r) { const n = this.p.get(x); this.p.set(x, r); x = n; }
    return r;
  }
  union(a, b) { const ra = this.find(a), rb = this.find(b); if (ra !== rb) this.p.set(ra, rb); }
}

/** Canonical point key for a wire endpoint. */
export function endpointKey(ep, board) {
  if (ep.t === 'hole') return holeKey(ep.bb, ep.col, ep.row);
  if (ep.t === 'board') return boardKey(ep.pin, board);
  return `p:${ep.id}:${ep.pin}`;
}
export function boardKey(pin, board) {
  if (board.gnd.includes(pin)) return 'b:GND';
  for (const group of board.joined) if (group.includes(pin)) return `b:${group[0]}`;
  return `b:${pin}`;
}

/**
 * @param project  { parts, wires }
 * @param board    STUDIO_BOARDS entry
 * @param legKeys  (part) → [holeKey per leg] for breadboard parts (null when not on a board)
 * @param defs     part type → catalog entry
 */
export function buildNetlist(project, board, legKeys, defs) {
  const elec = new DSU();
  const conn = new DSU();
  const both = (a, b) => { elec.union(a, b); conn.union(a, b); };
  const points = new Set();
  const touch = (k) => {
    points.add(k);
    if (k.startsWith('h:')) both(k, stripOf(k));
    elec.find(k);
    conn.find(k);
  };
  touch('b:GND');
  // part pins
  const partPins = new Map();
  for (const part of project.parts) {
    const def = defs[part.type];
    if (!def) continue;
    const map = {};
    if (def.mount === 'bb') {
      const keys = legKeys(part);
      if (!keys) continue;
      def.pins.forEach((pin, i) => { map[pin] = keys[i]; touch(keys[i]); });
    } else {
      for (const pin of def.pins) { const k = `p:${part.id}:${pin}`; map[pin] = k; touch(k); }
    }
    partPins.set(part.id, map);
  }
  const wires = [];
  for (const w of project.wires) {
    const a = endpointKey(w.a, board), b = endpointKey(w.b, board);
    touch(a);
    touch(b);
    conn.union(a, b);
    wires.push({ id: w.id, a, b });
  }
  // number the electrical nodes; GND is node 0
  const nodeOfRoot = new Map([[elec.find('b:GND'), 0]]);
  let n = 1;
  const nodeOf = (k) => {
    if (!points.has(k) && !k.startsWith('s:')) return null;
    const r = elec.find(k);
    if (!nodeOfRoot.has(r)) nodeOfRoot.set(r, n++);
    return nodeOfRoot.get(r);
  };
  for (const k of points) nodeOf(k);
  const wireEls = wires.map((w) => ({ ...w, na: nodeOf(w.a), nb: nodeOf(w.b) }));
  return {
    nodeCount: n,
    points,
    partPins,
    wires: wireEls,
    nodeOf,
    /** Connectivity id (wires included). */
    netOf: (k) => (points.has(k) ? conn.find(k) : null),
    /** Is a point key part of the circuit at all? */
    has: (k) => points.has(k),
  };
}
