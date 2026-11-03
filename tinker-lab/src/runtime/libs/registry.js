// The symbol registry: everything a sketch can use without defining it —
// Arduino core functions, constants, global objects (Serial, Wire, …) and
// library classes. Each symbol may be limited to some boards and may need a header.

const GenFn = Object.getPrototypeOf(function* () {}).constructor;
export const isGen = (fn) => fn instanceof GenFn;

export const AVR = ['uno', 'nano', 'mega'];
export const ESP32 = ['esp32'];
export const ESP = ['esp32', 'nodemcu'];
export const ALL = ['uno', 'nano', 'mega', 'esp32', 'nodemcu', 'unor4'];

export class Registry {
  constructor() {
    this.syms = new Map(); // name -> [sym]
    this.classes = {};
    this.structs = {};
    this.headers = new Map(); // header -> { boards, lib, alt }
  }

  add(name, sym) {
    if (!this.syms.has(name)) this.syms.set(name, []);
    this.syms.get(name).push(sym);
    return sym;
  }

  header(name, { boards, lib, alt } = {}) { this.headers.set(name, { boards, lib: lib ?? name.replace(/\.(h|hpp)$/, ''), alt }); }

  fn(name, sigs, impl, opts = {}) {
    const s = { kind: 'fn', name, sigs: Array.isArray(sigs) ? sigs : [sigs], ...opts };
    if (Array.isArray(impl)) s.impls = impl; else s.impl = impl;
    return this.add(name, s);
  }
  special(name, opts = {}) { return this.add(name, { kind: 'special', name, ...opts }); }
  konst(name, type, value, opts = {}) { return this.add(name, { kind: 'const', name, type, value, ...opts }); }
  consts(type, map, opts = {}) { for (const [k, v] of Object.entries(map)) this.konst(k, type, v, opts); }
  obj(name, cls, create, opts = {}) { return this.add(name, { kind: 'obj', name, cls, create, ...opts }); }
  cls(def, opts = {}) {
    this.classes[def.name] = def;
    return this.add(def.name, { kind: 'class', def, ...opts });
  }
  struct(name, fields, opts = {}) {
    this.structs[name] = { fields };
    return this.add(name, { kind: 'struct', name, ...opts });
  }
  typedef(name, type, opts = {}) { return this.add(name, { kind: 'typedef', name, type, ...opts }); }

  /** The symbol for this board (or the first one, so the compiler can explain the board limit). */
  lookup(name, board) {
    const list = this.syms.get(name);
    if (!list) return null;
    const sym = list.find((s) => !s.boards || s.boards.includes(board)) ?? list[0];
    if (sym.kind === 'const' && typeof sym.value === 'function') {
      const v = sym.value(board);
      if (v === undefined) return { ...sym, boards: [] };
      return { ...sym, value: v };
    }
    return sym;
  }

  constValue(name, board) {
    const s = this.lookup(name, board);
    return s?.kind === 'const' ? s.value : undefined;
  }

  /** Header that provides `name`, if it comes from a library. */
  headerFor(name) {
    const list = this.syms.get(name);
    const h = list?.find((s) => s.header)?.header;
    return h ? h[0] : null;
  }

  names(board) {
    const out = [];
    for (const [k, list] of this.syms) if (list.some((s) => !s.boards || s.boards.includes(board))) out.push(k);
    return out;
  }

  typeNames() {
    const out = new Set();
    for (const [k, list] of this.syms) if (list.some((s) => s.kind === 'class' || s.kind === 'typedef' || s.kind === 'struct')) out.add(k);
    return out;
  }

  isSupported(header, board) {
    const h = this.headers.get(header);
    return !!h && (!h.boards || h.boards.includes(board));
  }
}

/** Method helper: M(['void (int)'], impl, opts) */
export const M = (sigs, impl, opts = {}) => ({ sigs: Array.isArray(sigs) ? sigs : [sigs], ...(Array.isArray(impl) ? { impls: impl } : { impl }), ...opts });
