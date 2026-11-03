// Semantic analysis + code generation. Walks the AST, resolves names and static
// types, reports g++-style diagnostics, and builds JS closures:
//   expressions → sync functions (f) => value, or generator functions when they
//   call user code / blocking library functions;
//   statements  → { line, sync } or { line, gen } returning a completion code.
// `f` is a frame: { s: slots[], g: globals[], vm, up: enclosing frame for lambdas, rv }.
import {
  makeTypes, ptrTo, arrayOf, isInt, isFloat, isArith, isPtr, isClass, isString, canon, typeName, sameType,
  promote, arithResult, numConverter, wrapper, fitsIn, sizeOf, zeroValue, cloneValue, intRange,
} from './types.js';
import { Ptr, FnRef, AStr, cstr, charArray, textOf } from './values.js';

const NORMAL = 0, BREAK = 1, CONTINUE = 2, RETURN = 3;
/** Lvalue registers: an lvalue locator stores its container and key here. */
export const R = { C: null, K: 0 };

const GenFn = Object.getPrototypeOf(function* () {}).constructor;
const isGen = (fn) => fn instanceof GenFn;

function levenshtein(a, b) {
  if (Math.abs(a.length - b.length) > 3) return 9;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

class Scope {
  constructor(parent, fn) { this.parent = parent; this.fn = fn; this.vars = new Map(); }
  find(name) {
    for (let s = this; s; s = s.parent) { const v = s.vars.get(name); if (v) return v; }
    return null;
  }
}

class Bail extends Error {}

export function compileProgram(ast, { board, registry, includes, diagnostics }) {
  const T = makeTypes(board);
  const ERR = { k: 'error', name: '<error>', size: 1 };
  const included = new Set(includes.map((i) => i.name));
  const diag = (severity, node, message, hint) => {
    if (diagnostics.some((d) => d.line === node?.line && d.message === message)) return;
    diagnostics.push({ severity, line: node?.line ?? 1, col: node?.col ?? 1, message, ...(hint ? { hint } : {}) });
  };
  const error = (node, msg, hint) => { diag('error', node, msg, hint); };
  const warn = (node, msg, hint) => diag('warning', node, msg, hint);

  const globalScope = new Scope(null, null);
  const globals = []; // { name, type, slot, line, rtc, init: E | null, isLib, libObj }
  const functions = new Map(); // name -> [FnInfo]
  const structs = new Map();
  let lambdaCount = 0;
  const allNames = () => {
    const out = new Set([...registry.names(board)]);
    for (const k of globalScope.vars.keys()) out.add(k);
    for (const k of functions.keys()) out.add(k);
    return out;
  };

  // ------------------------------------------------------------------ registry access
  function libAllowed(sym, node, name, kind = 'name') {
    if (sym.boards && !sym.boards.includes(board)) {
      error(node, kind === 'type' ? `'${name}' does not name a type` : `'${name}' was not declared in this scope`, `${name} is only available on ${sym.boardsText ?? sym.boards.join(' / ')} boards in the simulator.`);
      return false;
    }
    if (sym.header && !sym.header.some((h) => included.has(h))) {
      error(node, kind === 'type' ? `'${name}' does not name a type` : `'${name}' was not declared in this scope`, `Add #include <${sym.header[0]}> at the top of the sketch.`);
      return false;
    }
    return true;
  }

  const sigCache = new Map();
  /** Parse a registry signature like 'uint8_t (int, int = 0)'. */
  function sig(str) {
    if (sigCache.has(str)) return sigCache.get(str);
    const m = /^\s*(.*?)\s*\((.*)\)\s*$/.exec(str);
    if (!m) throw new Error(`bad signature ${str}`);
    const ret = m[1] ? typeFromString(m[1]) : T.void;
    const params = [];
    let variadic = false;
    for (let part of m[2].split(',').map((x) => x.trim()).filter(Boolean)) {
      if (part === '...') { variadic = true; continue; }
      let def;
      const eq = part.indexOf('=');
      if (eq >= 0) { def = part.slice(eq + 1).trim(); part = part.slice(0, eq).trim(); }
      const p = { def: def === undefined ? undefined : def === 'true' ? 1 : def === 'false' ? 0 : /^-?[\d.]+$/.test(def) || /^0x/.test(def) ? Number(def) : def.startsWith('"') ? JSON.parse(def) : registry.constValue(def, board) };
      if (part === 'any') p.any = true;
      else if (part === 'any&') { p.any = true; p.ref = true; }
      else if (part === 'cstr') p.cstr = true;
      else if (part === 'fn') p.fn = true;
      else if (part.endsWith('&') && !part.startsWith('const')) { p.ref = true; p.type = typeFromString(part.slice(0, -1)); }
      else p.type = typeFromString(part.replace(/^const\s+(?=\w+\s*&)/, '').replace(/&$/, ''));
      params.push(p);
    }
    const s = { ret, params, variadic, text: str };
    sigCache.set(str, s);
    return s;
  }

  function typeFromString(str) {
    str = str.trim();
    let ptr = 0;
    while (str.endsWith('*')) { ptr++; str = str.slice(0, -1).trim(); }
    str = str.replace(/^const\s+/, '').replace(/\s+const$/, '');
    const rtd = registry.lookup(str, board);
    let t = builtinType(str.split(/\s+/)) ?? T.typedefs[str] ?? (registry.classes[str] ? classType(registry.classes[str]) : null) ?? libStruct(str) ?? (rtd?.kind === 'typedef' ? { ...typeFromString(rtd.type), alias: str, base: typeFromString(rtd.type) } : null);
    if (!t) { if (str === 'any') t = T.any; else throw new Error(`unknown type in signature: ${str}`); }
    for (let i = 0; i < ptr; i++) t = ptrTo(t, T);
    return t;
  }

  const classTypes = new Map();
  function classType(cls) {
    if (!classTypes.has(cls)) classTypes.set(cls, { k: 'class', cls, name: cls.name, size: cls.sizeof ?? 1 });
    return classTypes.get(cls);
  }
  const libStructs = new Map();
  function libStruct(name) {
    const def = registry.structs?.[name];
    if (!def) return null;
    if (!libStructs.has(name)) {
      const st = { k: 'struct', name, fields: [], size: 0 };
      libStructs.set(name, st);
      for (const [fname, ftype] of Object.entries(def.fields)) st.fields.push({ name: fname, type: typeFromString(ftype) });
    }
    return libStructs.get(name);
  }

  function builtinType(words) {
    const w = words.filter((x) => x !== 'int' || words.length === 1 || !words.some((y) => ['short', 'long', 'unsigned', 'signed'].includes(y)));
    const has = (x) => words.includes(x);
    const longs = words.filter((x) => x === 'long').length;
    if (words.length === 0) return null;
    if (has('void')) return T.void;
    if (has('bool')) return T.bool;
    if (has('float')) return T.float;
    if (has('double')) return longs ? T.ldouble : T.double;
    if (has('char')) return has('unsigned') ? T.uchar : has('signed') ? T.schar : T.char;
    if (has('wchar_t')) return T.int;
    if (has('short')) return has('unsigned') ? T.ushort : T.short;
    if (longs >= 2) return has('unsigned') ? T.ullong : T.llong;
    if (longs === 1) return has('unsigned') ? T.ulong : T.long;
    if (has('int') || has('unsigned') || has('signed')) return has('unsigned') ? T.uint : T.int;
    if (has('auto')) return T.any;
    void w;
    return null;
  }

  // ------------------------------------------------------------------ type resolution
  function resolveSpec(spec, scope) {
    if (spec.structDef) return defineStruct(spec.structDef, scope);
    if (spec.enumDef) return defineEnum(spec.enumDef, scope);
    if (spec.words.length) {
      if (spec.name) { error(spec, `two or more data types in declaration of '${spec.name}'`); return ERR; }
      return builtinType(spec.words);
    }
    const name = spec.name;
    const sym = scope.find(name);
    if (sym?.kind === 'type') return sym.type;
    if (T.typedefs[name]) return T.typedefs[name];
    const rc = registry.lookup(name, board);
    if (rc && (rc.kind === 'class' || rc.kind === 'typedef' || rc.kind === 'struct')) {
      if (!libAllowed(rc, spec, name, 'type')) return ERR;
      if (rc.kind === 'class') return classType(rc.def);
      if (rc.kind === 'struct') return libStruct(name);
      return typeFromString(rc.type);
    }
    error(spec, `'${name}' does not name a type`, guessInclude(name));
    return ERR;
  }

  function guessInclude(name) {
    const h = registry.headerFor(name);
    if (h) return `Add #include <${h}> at the top of the sketch.`;
    const near = [...allNames()].filter((n) => levenshtein(n.toLowerCase(), name.toLowerCase()) <= 2).slice(0, 1);
    return near.length ? `Did you mean '${near[0]}'?` : undefined;
  }

  function applyDeclarator(base, d, scope) {
    let t = base;
    for (const q of d.ptr) { t = ptrTo(t, T); if (q.const) t = { ...t }; }
    if (d.fnPtrParams) {
      const params = d.fnPtrParams.filter((x) => !x.variadic).map((x) => paramType(x, scope));
      t = ptrTo({ k: 'fn', ret: t, params, size: T.ptrSize }, T);
    }
    // dims: int a[2][3] → array(2, array(3, int))
    for (let i = d.dims.length - 1; i >= 0; i--) {
      const dim = d.dims[i];
      let len = null;
      if (dim) {
        const e = ex(dim, scope);
        if (e.cv === undefined || !isInt(e.t)) { error(dim, `array bound is not an integer constant before ']' token`, 'The size of an array must be a constant, e.g. const int N = 8; int a[N];'); len = 1; }
        else if (e.cv <= 0) { error(dim, e.cv < 0 ? `size of array '${d.name}' is negative` : `zero-size array '${d.name}'`); len = 1; }
        else len = e.cv;
      } else if (i > 0) { error(d, `declaration of '${d.name}' as multidimensional array must have bounds for all dimensions except the first`); len = 1; }
      t = arrayOf(t, len);
    }
    return t;
  }

  function paramType(p, scope) {
    const base = resolveSpec(p.spec, scope);
    let t = applyDeclarator(base, { ...p.decl, dims: p.decl.dims.slice(1) }, scope);
    if (p.decl.dims.length) t = ptrTo(t, T); // int a[] → int*
    return t;
  }

  function defineStruct(def, scope) {
    if (structs.has(def.name) && def.fields.length === 0) return structs.get(def.name);
    const st = { k: 'struct', name: def.name, fields: [], size: 0 };
    if (def.name && !def.name.startsWith('<')) {
      if (scope.vars.has(def.name) && scope.vars.get(def.name).kind === 'type') error(def, `redefinition of 'struct ${def.name}'`);
      scope.vars.set(def.name, { kind: 'type', type: st });
      structs.set(def.name, st);
    }
    for (const { spec, decl } of def.fields) {
      const ft = applyDeclarator(resolveSpec(spec, scope), decl, scope);
      if (st.fields.some((f) => f.name === decl.name)) error(decl, `redeclaration of '${typeName(ft)} ${def.name}::${decl.name}'`);
      st.fields.push({ name: decl.name, type: ft, init: decl.init });
    }
    st.size = sizeOf(st, T);
    return st;
  }

  function defineEnum(def, scope) {
    const base = def.baseSpec ? resolveSpec(def.baseSpec, scope) : T.int;
    const et = { k: 'enum', name: def.name, base: canon(base).k === 'int' ? canon(base) : T.int, size: T.int.size, values: new Map(), scoped: def.scoped };
    if (def.name && !def.name.startsWith('<')) scope.vars.set(def.name, { kind: 'type', type: et });
    let v = 0;
    for (const it of def.items) {
      if (it.value) {
        const e = ex(it.value, scope);
        if (e.cv === undefined) error(it.value, `enumerator value for '${it.name}' is not an integer constant`);
        else v = e.cv;
      }
      et.values.set(it.name, v);
      const sym = { kind: 'econst', name: it.name, type: et, value: v, line: it.line };
      if (def.scoped) et.scope ??= new Map(), et.scope.set(it.name, sym);
      else {
        if (scope.vars.has(it.name)) error(it, `redeclaration of '${it.name}'`);
        scope.vars.set(it.name, sym);
      }
      v++;
    }
    return et;
  }

  // ------------------------------------------------------------------ conversions
  const fnSig = (info) => `${typeName(info.ret, { aka: false })} ${info.name}(${info.params.map((p) => typeName(p.type, { aka: false })).join(', ')})`;

  /** How well `from` converts to `to`: 0 exact … 4 user-defined, Infinity if not viable. */
  function convRank(from, to, e) {
    const a = canon(from), b = canon(to);
    if (a === ERR || b === ERR) return 0;
    if (b.k === 'any') return 1;
    if (sameType(a, b)) return 0;
    if (isArith(a) && isArith(b)) {
      if (b.k === 'enum') return Infinity;
      if (sameType(promote(a, T), b) || (a.k === 'float' && b.k === 'float' && b.rank > a.rank)) return 1;
      return 2;
    }
    if (b.k === 'ptr') {
      if (e?.isNull || a.k === 'nullptr') return 2;
      if (a.k === 'array' || a.k === 'ptr') {
        const at = canon(a.of ?? a.to), bt = canon(b.to);
        if (sameType(at, bt) || bt.k === 'void') return 0.5;
        if (at.k === 'int' && bt.k === 'int' && at.bits === bt.bits) return 2.5; // char* vs uint8_t*: -fpermissive warning
        if (bt.k === 'fn' || at.k === 'any') return 1;
        return Infinity;
      }
      if (a.k === 'fn' && b.to.k === 'fn') return 0;
      return Infinity;
    }
    if (b.k === 'fn' && (a.k === 'fn' || (a.k === 'ptr' && a.to.k === 'fn'))) return 0;
    if (a.k === 'class' && a.cls.convertTo && b.k !== 'class' && (isArith(b) || b.k === 'ptr')) return 4;
    if (a.k === 'class' && a.cls.convertTo && b.k === 'class' && b.cls.name === 'String') return 4;
    if (b.isBool && (a.k === 'ptr' || a.k === 'array')) return 3;
    if (b.isBool && a.k === 'class' && a.cls.toBool) return 4;
    if (b.k === 'class') {
      if (a.k === 'class' && a.cls === b.cls) return 0;
      if (b.cls.name === 'String' && ((a.k === 'array' || a.k === 'ptr') && canon(a.of ?? a.to).k === 'int' && canon(a.of ?? a.to).bits === 8)) return 4;
      if (b.cls.implicitFrom?.(a)) return 4;
      return Infinity;
    }
    if (b.k === 'struct' && a.k === 'struct') return a === b ? 0 : Infinity;
    return Infinity;
  }

  /** Converter function for a value of type from → to, or null for identity. */
  function converter(from, to) {
    const a = canon(from), b = canon(to);
    if (a === ERR || b === ERR || b.k === 'any') return null;
    if (a.k === 'class' && a.cls.convertTo && !(b.k === 'class' && b.cls === a.cls)) { const cv = a.cls.convertTo; const T_ = T; return (v) => cv(v, b, T_); }
    if (isArith(a) && isArith(b)) {
      if (sameType(a, b)) return null;
      if (a.k === 'int' && b.k === 'int' && a.bits === b.bits && a.unsigned === b.unsigned && !b.isBool) return null;
      if (a.k === 'enum' && b.k === 'int' && b.bits >= a.base.bits && !b.isBool) return b.unsigned ? numConverter(a.base, b) : null;
      return numConverter(a, b);
    }
    if (b.isBool) {
      if (a.k === 'ptr' || a.k === 'nullptr') return (v) => (v == null ? 0 : 1);
      if (a.k === 'array' || a.k === 'fn') return () => 1;
      if (a.k === 'class') return a.cls.toBool ? (v) => (a.cls.toBool(v) ? 1 : 0) : (v) => (a.cls.convertTo(v, b, T) ? 1 : 0);
    }
    if (b.k === 'ptr') {
      if (a.k === 'array') return (v) => new Ptr(v, 0);
      if (a.k === 'nullptr') return () => null;
      if (isInt(a)) return () => null;
      return null;
    }
    if (b.k === 'class') {
      if (b.cls.name === 'String') {
        if (a.k === 'class' && a.cls.name === 'String') return (v) => new AStr(v.s);
        return (v) => new AStr(cstr(v));
      }
      if (a.k === 'class' && a.cls === b.cls) return b.cls.copy ?? null;
      if (b.cls.implicitFrom) return (v) => b.cls.construct(null, [v], [a]);
      return null;
    }
    if (b.k === 'struct' || b.k === 'array') return (v) => cloneValue(v, b);
    return null;
  }

  /** Convert expression e to type `to`, reporting invalid conversions. */
  function conv(e, to, node, ctx = 'initialization') {
    if (e.t === ERR || to === ERR) return e;
    const a = canon(e.t), b = canon(to);
    if (b.k === 'void') return e;
    const rank = convRank(a, b, e);
    if (rank === Infinity) {
      if (b.k === 'class' && !(a.k === 'class')) {
        error(node, ctx === 'initialization' ? `conversion from '${typeName(e.t)}' to non-scalar type '${typeName(to)}' requested` : `no match for 'operator=' (operand types are '${typeName(to)}' and '${typeName(e.t)}')`,
          b.cls.name === 'String' && isArith(a) ? 'To turn a number into text, write String(x).' : undefined);
      } else if (a.k === 'class' && isArith(b)) {
        error(node, `cannot convert '${typeName(e.t)}' to '${typeName(to)}' in ${ctx}`, a.cls.name === 'String' ? 'Use .toInt() or .toFloat() to turn a String into a number.' : undefined);
      } else if (b.k === 'enum' && isArith(a)) {
        error(node, `invalid conversion from '${typeName(e.t)}' to '${typeName(to)}'`, `Cast it: (${to.name})value`);
      } else if ((a.k === 'ptr' || a.k === 'array') && isArith(b)) {
        error(node, `invalid conversion from '${typeName(decay(e.t))}' to '${typeName(to)}'`, isCharLike(a.of ?? a.to) ? 'Text in double quotes is a string, not a number. Use single quotes for one character: \'a\'.' : undefined);
      } else if (isArith(a) && b.k === 'ptr') {
        error(node, `invalid conversion from '${typeName(e.t)}' to '${typeName(to)}'`);
      } else {
        error(node, `cannot convert '${typeName(e.t)}' to '${typeName(to)}' in ${ctx}`);
      }
      return { ...e, t: ERR };
    }
    // -Woverflow on constants
    if (e.cv !== undefined && isInt(b) && !b.isBool && b.k === 'int') {
      if (isInt(a) && !fitsIn(e.cv, b)) {
        const nv = numConverter(a, b)(e.cv);
        warn(node, `overflow in conversion from '${typeName(e.t)}' to '${typeName(to)}' changes value from '${e.cv}' to '${nv}'`, `${typeName(to, { aka: false })} holds ${intRange(b).join(' to ')}.`);
      } else if (isFloat(a) && Number.isFinite(e.cv) && Math.trunc(e.cv) !== e.cv && b.k === 'int') {
        warn(node, `conversion from '${typeName(e.t)}' to '${typeName(to)}' changes value from '${e.cv}' to '${Math.trunc(e.cv)}'`, 'Whole-number types drop everything after the decimal point.');
      }
    }
    if ((a.k === 'array' || a.k === 'ptr') && b.k === 'ptr' && rank === 2.5) {
      warn(node, `invalid conversion from '${typeName(decay(e.t))}' to '${typeName(to)}' [-fpermissive]`);
    }
    const fn = converter(a, b);
    if (!fn) return { ...e, t: to, at: undefined, atg: undefined };
    const out = { t: to, cv: e.cv !== undefined && isArith(b) ? fn(e.cv) : undefined };
    if (e.g) { const g = e.g; out.g = function* (f) { return fn(yield* g(f)); }; }
    else { const s = e.s; out.s = (f) => fn(s(f)); }
    return out;
  }
  const isCharLike = (t) => canon(t)?.k === 'int' && canon(t).bits === 8;
  const decay = (t) => (canon(t).k === 'array' ? ptrTo(canon(t).of, T) : t);

  /** Truth value of an expression (for if / while / && / ! …). */
  function truth(e, node) {
    const a = canon(e.t);
    if (a === ERR) return { s: () => 0, t: T.bool };
    if (a.k === 'class') {
      if (!a.cls.toBool && !a.cls.convertTo) { error(node, `could not convert '${node?.kind === 'ident' ? node.name : 'expression'}' from '${typeName(e.t)}' to 'bool'`); return { s: () => 0, t: T.bool }; }
    } else if (a.k === 'struct' || a.k === 'void') {
      error(node, `could not convert ${a.k === 'void' ? "'void' expression" : `'${typeName(a)}'`} to 'bool'`);
      return { s: () => 0, t: T.bool };
    }
    return conv(e, T.bool, node);
  }

  // ------------------------------------------------------------------ expression helpers
  function mk(t, es, fn, extra = {}) {
    const out = { t, ...extra };
    if (es.every((e) => !e.g)) {
      if (es.length === 0) out.s = () => fn();
      else if (es.length === 1) { const a = es[0].s; out.s = (f) => fn(a(f)); }
      else if (es.length === 2) { const a = es[0].s, b = es[1].s; out.s = (f) => fn(a(f), b(f)); }
      else if (es.length === 3) { const a = es[0].s, b = es[1].s, c = es[2].s; out.s = (f) => fn(a(f), b(f), c(f)); }
      else { const ss = es.map((e) => e.s); out.s = (f) => fn(...ss.map((s) => s(f))); }
    } else {
      const parts = es.map((e) => e.g ?? ((f) => e.s(f)));
      const gens = es.map((e) => !!e.g);
      out.g = function* (f) {
        const v = new Array(parts.length);
        for (let i = 0; i < parts.length; i++) v[i] = gens[i] ? yield* parts[i](f) : parts[i](f);
        return fn(...v);
      };
    }
    return out;
  }
  const constE = (t, v) => ({ t, s: () => v, cv: typeof v === 'number' ? v : undefined });
  const errE = () => ({ t: ERR, s: () => 0 });
  const gen = (e) => e.g ?? (function* (f) { return e.s(f); });
  /** Evaluate e then return its location in R (lvalue). */
  function locator(e) { return e.at ? { sync: true, fn: e.at } : e.atg ? { sync: false, fn: e.atg } : null; }

  function rvalueOf(t, at) {
    return (f) => { at(f); return R.C[R.K]; };
  }

  // ------------------------------------------------------------------ expressions
  let curScope = globalScope;
  let curFn = null;

  function ex(node, scope = curScope) {
    const saved = curScope;
    curScope = scope;
    try {
      return exInner(node, scope);
    } finally { curScope = saved; }
  }

  function exInner(node, scope) {
    switch (node.kind) {
      case 'num': return numLit(node);
      case 'char': return constE(node.multi ? T.int : T.char, node.value);
      case 'bool': return constE(T.bool, node.value);
      case 'nullptr': return { ...constE(T.nullptr, null), isNull: true };
      case 'str': {
        const arr = charArray(node.value);
        return { t: arrayOf({ ...T.char, constEl: true }, arr.length), s: () => arr, isStrLit: true, strVal: node.value };
      }
      case 'paren': { const e = ex(node.expr, scope); return { ...e, paren: true }; }
      case 'ident': return identE(node, scope);
      case 'binary': return binaryE(node, scope);
      case 'unary': return unaryE(node, scope);
      case 'preinc': case 'postinc': return incE(node, scope);
      case 'assign': return assignE(node, scope);
      case 'cond': return condE(node, scope);
      case 'comma': {
        const a = ex(node.left, scope), b = ex(node.right, scope);
        return mk(b.t, [a, b], (x, y) => y);
      }
      case 'call': return callE(node, scope);
      case 'index': return indexE(node, scope);
      case 'member': return memberE(node, scope);
      case 'cast': {
        const t = applyDeclarator(resolveSpec(node.type.spec, scope), { ...node.type.decl, name: '' }, scope);
        return castE(ex(node.arg, scope), t, node);
      }
      case 'construct': return constructE(node, scope);
      case 'sizeof': {
        let t;
        if (node.type) t = applyDeclarator(resolveSpec(node.type.spec, scope), { ...node.type.decl, name: '' }, scope);
        else t = ex(node.arg, scope).t;
        if (t === ERR) return errE();
        return constE(T.typedefs.size_t, sizeOf(t, T));
      }
      case 'initlist':
        error(node, 'expected primary-expression before \'{\' token', 'A { } list can only be used to initialise an array or struct.');
        return errE();
      case 'lambda': return lambdaE(node, scope);
      default:
        error(node, `unsupported expression (${node.kind})`);
        return errE();
    }
  }

  function numLit(node) {
    const t = node.tok;
    if (t.float) {
      const ty = t.suffix === 'f' ? T.float : t.suffix === 'l' ? T.ldouble : T.double;
      return constE(ty, ty.bits === 32 ? Math.fround(t.v) : t.v);
    }
    const v = t.big;
    const u = t.unsigned, L = t.longs;
    let cands;
    if (t.decimal) cands = u ? [T.uint, T.ulong, T.ullong] : L === 2 ? [T.llong] : L === 1 ? [T.long, T.llong] : [T.int, T.long, T.llong];
    else cands = u ? (L === 2 ? [T.ullong] : L === 1 ? [T.ulong, T.ullong] : [T.uint, T.ulong, T.ullong]) : L === 2 ? [T.llong, T.ullong] : L === 1 ? [T.long, T.ulong, T.llong, T.ullong] : [T.int, T.uint, T.long, T.ulong, T.llong, T.ullong];
    if (u && L === 2) cands = [T.ullong];
    if (u && L === 1) cands = [T.ulong, T.ullong];
    const ty = cands.find((c) => fitsIn(v, c));
    if (!ty) { warn(node, 'integer constant is too large for its type'); return constE(T.ullong, Number(BigInt.asUintN(64, v))); }
    return constE(ty, Number(v));
  }

  function identE(node, scope) {
    const name = node.name;
    if (name.includes('::')) {
      const [a, b] = name.split('::');
      const sym = scope.find(a);
      if (sym?.kind === 'type' && sym.type.k === 'enum') {
        const v = sym.type.values.get(b);
        if (v === undefined) { error(node, `'${b}' is not a member of '${a}'`); return errE(); }
        return constE(sym.type, v);
      }
      const rq = registry.lookup(name, board) ?? registry.lookup(b, board);
      if (rq) return registryE(rq, node, b);
      error(node, `'${name}' has not been declared`);
      return errE();
    }
    const sym = scope.find(name);
    if (sym) {
      if (sym.kind === 'var') return varE(sym, node);
      if (sym.kind === 'econst') return constE(sym.type, sym.value);
      if (sym.kind === 'fn') return { t: { k: 'fn', ret: sym.overloads[0].ret, params: sym.overloads[0].params.map((p) => p.type), size: T.ptrSize }, fnSet: sym.overloads, name, s: () => new FnRef(sym.overloads[0]) };
      if (sym.kind === 'type') { error(node, `expected primary-expression before '${name}'`); return errE(); }
    }
    const rq = registry.lookup(name, board);
    if (rq) return registryE(rq, node, name);
    // binary constants B0101 from binary.h
    if (/^B[01]{1,8}$/.test(name)) return constE(T.int, parseInt(name.slice(1), 2));
    const near = [...allNames()].filter((n) => n !== name && (n.toLowerCase() === name.toLowerCase() || levenshtein(n, name) <= (name.length > 5 ? 2 : 1)));
    const h = registry.headerFor(name);
    let hint;
    if (h) hint = `Add #include <${h}> at the top of the sketch.`;
    else if (near.length) hint = `Did you mean '${near.sort((x, y) => levenshtein(x, name) - levenshtein(y, name))[0]}'? Names are case-sensitive.`;
    else hint = 'Declare a variable before you use it, e.g. int ' + name + ' = 0; at the top of the sketch (global) or inside the function.';
    const later = globalsLater.get(name);
    if (later && !h) hint = `'${name}' is declared further down, on line ${later}. Move the declaration above the code that uses it.`;
    error(node, `'${name}' was not declared in this scope`, hint);
    return errE();
  }
  const globalsLater = new Map();

  function registryE(rq, node, name) {
    if (!libAllowed(rq, node, name)) return errE();
    if (rq.kind === 'const') {
      const t = typeFromString(rq.type);
      return constE(t, rq.value);
    }
    if (rq.kind === 'obj') {
      const g = libGlobal(name, rq);
      return varE(g.sym, node);
    }
    if (rq.kind === 'fn' || rq.kind === 'special') return { t: { k: 'fn', ret: T.void, params: [], size: T.ptrSize }, builtin: rq, name, s: () => null };
    if (rq.kind === 'class' || rq.kind === 'typedef' || rq.kind === 'struct') { error(node, `expected primary-expression before '${name}'`); return errE(); }
    error(node, `'${name}' was not declared in this scope`);
    return errE();
  }

  function libGlobal(name, rq) {
    let sym = globalScope.vars.get(`#lib:${name}`);
    if (!sym) {
      const cls = registry.classes[rq.cls];
      const t = classType(cls);
      const slot = globals.length;
      sym = { kind: 'var', name, type: t, where: 'g', slot, isLib: true, line: 0 };
      globals.push({ name, type: t, slot, lib: rq, sym, isLib: true });
      globalScope.vars.set(`#lib:${name}`, sym);
    }
    return { sym };
  }

  function varE(sym, node) {
    const t = sym.type;
    const slot = sym.slot;
    let at, s;
    if (sym.where === 'g') {
      at = (f) => { R.C = f.g; R.K = slot; };
      s = (f) => f.g[slot];
    } else {
      const up = curFn && sym.fn !== curFn ? fnDistance(curFn, sym.fn) : 0;
      if (up < 0) { error(node, `'${sym.name}' is not captured`, "Use [&] in the lambda to capture local variables."); return errE(); }
      const frame = up === 0 ? (f) => f : up === 1 ? (f) => f.up : (f) => { let x = f; for (let i = 0; i < up; i++) x = x.up; return x; };
      if (up === 0) { at = (f) => { R.C = f.s; R.K = slot; }; s = (f) => f.s[slot]; }
      else { at = (f) => { R.C = frame(f).s; R.K = slot; }; s = (f) => frame(f).s[slot]; }
    }
    if (sym.ref) {
      const inner = s;
      at = (f) => { const p = inner(f); R.C = p.b; R.K = p.o; };
      s = (f) => { const p = inner(f); return p.b[p.o]; };
    }
    sym.used = true;
    if (sym.cv !== undefined && !sym.ref) { const cv = sym.cv; s = () => cv; }
    return { t, s, at, readonly: sym.isConst, cv: sym.cv, sym, name: sym.name };
  }
  function fnDistance(from, to) {
    let n = 0;
    for (let x = from; x; x = x.parentFn) { if (x === to) return n; if (!x.captures) return -1; n++; }
    return -1;
  }

  // ---- binary operators
  function arith(op, t, node) {
    const w = wrapper(t);
    const T32 = canon(t).k === 'float';
    const bits = canon(t).bits;
    const unsigned = canon(t).unsigned;
    const divz = (vm) => vm.fail('division by zero', 'Dividing a whole number by 0 has no answer. Check the divisor before dividing, e.g. if (n != 0).');
    if (T32) {
      switch (op) {
        case '+': return (a, b) => w(a + b);
        case '-': return (a, b) => w(a - b);
        case '*': return (a, b) => w(a * b);
        case '/': return (a, b) => w(a / b);
        default: return null;
      }
    }
    if (bits === 64) {
      const B = (fn) => (a, b) => {
        const r = fn(BigInt(a), BigInt(b));
        return Number(unsigned ? BigInt.asUintN(64, r) : BigInt.asIntN(64, r));
      };
      switch (op) {
        case '+': return B((a, b) => a + b);
        case '-': return B((a, b) => a - b);
        case '*': return B((a, b) => a * b);
        case '&': return B((a, b) => a & b);
        case '|': return B((a, b) => a | b);
        case '^': return B((a, b) => a ^ b);
        case '<<': return B((a, b) => a << b);
        case '>>': return B((a, b) => a >> b);
        default: return null;
      }
    }
    switch (op) {
      case '+': return (a, b) => w(a + b);
      case '-': return (a, b) => w(a - b);
      case '*': return bits <= 16 ? (a, b) => w(a * b) : (a, b) => w(Math.imul(a, b));
      case '&': return (a, b) => w(a & b);
      case '|': return (a, b) => w(a | b);
      case '^': return (a, b) => w(a ^ b);
      default: return null;
    }
    void divz;
  }

  function binaryE(node, scope) {
    const op = node.op;
    if (op === '&&' || op === '||') {
      const a = truth(ex(node.left, scope), node.left), b = truth(ex(node.right, scope), node.right);
      const cv = a.cv !== undefined && b.cv !== undefined ? (op === '&&' ? +(a.cv && b.cv) : +(a.cv || b.cv)) : undefined;
      if (!a.g && !b.g) {
        const x = a.s, y = b.s;
        return { t: T.bool, cv, s: op === '&&' ? (f) => (x(f) && y(f) ? 1 : 0) : (f) => (x(f) || y(f) ? 1 : 0) };
      }
      const x = gen(a), y = gen(b);
      return { t: T.bool, g: op === '&&' ? function* (f) { return (yield* x(f)) && (yield* y(f)) ? 1 : 0; } : function* (f) { return (yield* x(f)) || (yield* y(f)) ? 1 : 0; } };
    }
    let a = ex(node.left, scope), b = ex(node.right, scope);
    if (a.t === ERR || b.t === ERR) return errE();
    const ca = canon(a.t), cb = canon(b.t);
    // class operators (String)
    if (ca.k === 'class' || cb.k === 'class') return classBinary(op, a, b, node);
    if (ca.k === 'struct' || cb.k === 'struct') {
      error(node, `no match for 'operator${op}' (operand types are '${typeName(a.t)}' and '${typeName(b.t)}')`, 'Compare struct fields one by one instead.');
      return errE();
    }
    if (ca.k === 'void' || cb.k === 'void') { error(node, `invalid operands of types '${typeName(a.t)}' and '${typeName(b.t)}' to binary 'operator${op}'`, "A function that returns void doesn't give a value."); return errE(); }
    // pointers / arrays
    const pa = ca.k === 'ptr' || ca.k === 'array' || ca.k === 'nullptr', pb = cb.k === 'ptr' || cb.k === 'array' || cb.k === 'nullptr';
    if (pa || pb) return pointerBinary(op, a, b, node, pa, pb);
    if (ca.k === 'fn' || cb.k === 'fn') { error(node, `invalid operands to binary 'operator${op}'`, "Did you forget the () when calling a function?"); return errE(); }
    const cmp = ['==', '!=', '<', '<=', '>', '>='].includes(op);
    if (op === '<<' || op === '>>') {
      if (!isInt(ca) || !isInt(cb)) { error(node, `invalid operands of types '${typeName(a.t)}' and '${typeName(b.t)}' to binary 'operator${op}'`); return errE(); }
      const t = promote(ca, T);
      a = conv(a, t, node);
      b = conv(b, promote(cb, T), node);
      const bitsN = canon(t).bits, uns = canon(t).unsigned;
      const w = wrapper(t);
      let fn;
      if (bitsN === 64) fn = arith(op, t);
      else if (op === '<<') fn = (x, y) => (y >= bitsN || y < 0 ? 0 : w(bitsN === 32 ? x << y : x * 2 ** y));
      else fn = uns ? (x, y) => (y >= bitsN || y < 0 ? 0 : bitsN === 32 ? x >>> y : x >> y) : (x, y) => (y >= bitsN || y < 0 ? (x < 0 ? -1 : 0) : x >> y);
      if (b.cv !== undefined && (b.cv >= bitsN || b.cv < 0)) warn(node, `${op === '<<' ? 'left' : 'right'} shift count ${b.cv < 0 ? 'is negative' : '>= width of type'}`, `'${typeName(t)}' has ${bitsN} bits on this board. Use 1UL << n for bigger values.`);
      return foldConst(mk(t, [a, b], fn), a, b, op, t, node);
    }
    if (op === '%' || op === '&' || op === '|' || op === '^') {
      if (!isInt(ca) || !isInt(cb)) {
        error(node, `invalid operands of types '${typeName(a.t)}' and '${typeName(b.t)}' to binary 'operator${op}'`, op === '%' ? 'The % (remainder) operator only works on whole numbers. Use fmod() for floats.' : undefined);
        return errE();
      }
    }
    if (!isArith(ca) || !isArith(cb)) { error(node, `invalid operands of types '${typeName(a.t)}' and '${typeName(b.t)}' to binary 'operator${op}'`); return errE(); }
    const t = arithResult(ca, cb, T);
    if (cmp && isInt(ca) && isInt(cb) && canon(promote(ca, T)).unsigned !== canon(promote(cb, T)).unsigned) {
      const neg = (e) => e.cv !== undefined && e.cv < 0;
      if (neg(a) || neg(b)) warn(node, 'comparison of integer expressions of different signedness', 'A negative number compared with an unsigned value is converted to a huge positive number.');
    }
    a = conv(a, t, node);
    b = conv(b, t, node);
    let fn;
    if (cmp) {
      fn = { '==': (x, y) => +(x === y), '!=': (x, y) => +(x !== y), '<': (x, y) => +(x < y), '<=': (x, y) => +(x <= y), '>': (x, y) => +(x > y), '>=': (x, y) => +(x >= y) }[op];
      return foldConst(mk(T.bool, [a, b], fn), a, b, op, T.bool, node);
    }
    if (op === '/' || op === '%') {
      if (b.cv === 0 && isInt(t)) warn(node, 'division by zero [-Wdiv-by-zero]');
      if (isFloat(t)) {
        const w = wrapper(t);
        fn = (x, y) => w(x / y);
      } else {
        const w = wrapper(t);
        const big = canon(t).bits === 64;
        const uns = canon(t).unsigned;
        if (op === '/') fn = function div(x, y) { if (y === 0) this.fail?.(); return w(Math.trunc(x / y)); };
        else fn = function mod(x, y) { return w(x % y); };
        if (big) fn = op === '/' ? (x, y) => Number((uns ? BigInt.asUintN : BigInt.asIntN)(64, BigInt(x) / BigInt(y))) : (x, y) => Number((uns ? BigInt.asUintN : BigInt.asIntN)(64, BigInt(x) % BigInt(y)));
        // division by zero is checked with access to the VM
        const core = fn;
        const as = a, bs = b;
        const out = { t };
        const zero = (f) => f.vm.fail('division by zero', 'Dividing a whole number by 0 has no answer. Check the divisor first, e.g. if (n != 0).');
        if (!as.g && !bs.g) {
          const x = as.s, y = bs.s;
          out.s = (f) => { const p = x(f), q = y(f); if (q === 0) zero(f); return core(p, q); };
        } else {
          const x = gen(as), y = gen(bs);
          out.g = function* (f) { const p = yield* x(f), q = yield* y(f); if (q === 0) zero(f); return core(p, q); };
        }
        return foldConst(out, a, b, op, t, node);
      }
    } else fn = arith(op, t, node);
    return foldConst(mk(t, [a, b], fn), a, b, op, t, node);
  }

  /** Constant-fold and warn about integer overflow like g++ -Woverflow. */
  function foldConst(e, a, b, op, t, node) {
    if (a.cv === undefined || b.cv === undefined || typeof a.cv !== 'number' || typeof b.cv !== 'number') return e;
    if (isInt(t) && (op === '/' || op === '%') && b.cv === 0) return e;
    let v;
    try { v = e.s ? e.s({ vm: { fail() {} }, g: [], s: [] }) : undefined; } catch { v = undefined; }
    if (v === undefined || typeof v !== 'number') return e;
    if (isInt(t) && !canon(t).isBool && ['+', '-', '*', '<<'].includes(op)) {
      const ma = BigInt(Math.trunc(a.cv)), mb = BigInt(Math.trunc(b.cv));
      const exact = op === '+' ? ma + mb : op === '-' ? ma - mb : op === '*' ? ma * mb : ma << mb;
      if (!canon(t).unsigned && !fitsIn(exact, t)) {
        warn(node, `integer overflow in expression of type '${typeName(t)}' results in '${v}'`, `On this board '${canon(t).name}' is ${canon(t).bits}-bit (max ${intRange(t)[1]}). Make one number long, e.g. ${a.cv}L ${op} ${b.cv}, or use 1000UL.`);
      }
    }
    return { ...e, cv: v };
  }

  function pointerBinary(op, a, b, node, pa, pb) {
    const ca = canon(a.t), cb = canon(b.t);
    const cmp = ['==', '!=', '<', '<=', '>', '>='].includes(op);
    if (cmp) {
      if ((a.isStrLit || b.isStrLit) && (op === '==' || op === '!=')) {
        warn(node, 'comparison with string literal results in unspecified behavior [-Waddress]', 'To compare text, use a String (String(a) == "on") or strcmp(a, "on") == 0.');
      }
      if (pa && pb) {
        const eq = (x, y) => (x == null || y == null ? x == y : (x instanceof Ptr ? x.b : x) === (y instanceof Ptr ? y.b : y) && (x instanceof Ptr ? x.o : 0) === (y instanceof Ptr ? y.o : 0));
        const off = (x) => (x instanceof Ptr ? x.o : 0);
        const fn = { '==': (x, y) => +eq(x, y), '!=': (x, y) => +!eq(x, y), '<': (x, y) => +(off(x) < off(y)), '<=': (x, y) => +(off(x) <= off(y)), '>': (x, y) => +(off(x) > off(y)), '>=': (x, y) => +(off(x) >= off(y)) }[op];
        return mk(T.bool, [a, b], fn);
      }
      const ptrSide = pa ? a : b, other = pa ? b : a;
      if (other.cv === 0 || other.isNull) return mk(T.bool, [ptrSide], op === '==' ? (x) => +(x == null) : (x) => +(x != null));
      if (isCharLike((pa ? ca : cb).of ?? (pa ? ca : cb).to) && isInt(pa ? cb : ca)) {
        error(node, `ISO C++ forbids comparison between pointer and integer [-fpermissive]`, 'Single quotes make a char (\'a\'), double quotes make a string ("a"). Compare a char with \'a\', and text with a String.');
        return errE();
      }
      error(node, `ISO C++ forbids comparison between pointer and integer [-fpermissive]`);
      return errE();
    }
    if (op === '+' || op === '-') {
      if (pa && pb) {
        if (op === '-') return mk(T.int, [a, b], (x, y) => (x instanceof Ptr ? x.o : 0) - (y instanceof Ptr ? y.o : 0));
        error(node, `invalid operands of types '${typeName(decay(a.t))}' and '${typeName(decay(b.t))}' to binary 'operator+'`, a.isStrLit || b.isStrLit ? 'You can\'t join two pieces of quoted text with +. Make one of them a String: String("a") + "b".' : undefined);
        return errE();
      }
      const p = pa ? a : b, n = pa ? b : a;
      if (!isInt(canon(n.t))) { error(node, `invalid operands of types '${typeName(decay(a.t))}' and '${typeName(n.t)}' to binary 'operator${op}'`); return errE(); }
      if (op === '-' && pb) { error(node, `invalid operands to binary 'operator-'`); return errE(); }
      const pt = decay(p.t);
      if (p.isStrLit && op === '+') warn(node, 'adding an integer to a string literal moves the pointer, it does not join text', 'To join text and a number, use a String: String("Count: ") + n.');
      const sign = op === '+' ? 1 : -1;
      const pe = conv(p, pt, node);
      const fn = (x, k) => (x == null ? null : x instanceof Ptr ? new Ptr(x.b, x.o + sign * k) : new Ptr(x, sign * k));
      return pa ? mk(pt, [pe, n], fn) : mk(pt, [n, pe], (k, x) => fn(x, k));
    }
    error(node, `invalid operands of types '${typeName(decay(a.t))}' and '${typeName(decay(b.t))}' to binary 'operator${op}'`);
    return errE();
  }

  function classBinary(op, a, b, node) {
    const ca = canon(a.t), cb = canon(b.t);
    const strA = isString(ca), strB = isString(cb);
    if (strA || strB) {
      const txt = (e) => {
        const c = canon(e.t);
        if (isString(c)) return (v) => v.s;
        if (c.k === 'array' || c.k === 'ptr') return (v) => cstr(v);
        if (isArith(c)) return (v) => textOf(v, e.t, T, { forString: true });
        return null;
      };
      const ta = txt(a), tb = txt(b);
      if (!ta || !tb) { error(node, `no match for 'operator${op}' (operand types are '${typeName(a.t)}' and '${typeName(b.t)}')`); return errE(); }
      if (op === '+') {
        // StringSumHelper: at least one side is a String
        return mk(classType(registry.classes.String), [a, b], (x, y) => new AStr(ta(x) + tb(y)));
      }
      const cmp = { '==': (x, y) => +(x === y), '!=': (x, y) => +(x !== y), '<': (x, y) => +(x < y), '>': (x, y) => +(x > y), '<=': (x, y) => +(x <= y), '>=': (x, y) => +(x >= y) }[op];
      if (cmp) {
        if (!(strA && strB) && (isArith(ca) || isArith(cb))) { error(node, `no match for 'operator${op}' (operand types are '${typeName(a.t)}' and '${typeName(b.t)}')`, "Compare a String with text in double quotes, or turn it into a number first with .toInt()."); return errE(); }
        return mk(T.bool, [a, b], (x, y) => cmp(ta(x), tb(y)));
      }
      error(node, `no match for 'operator${op}' (operand types are '${typeName(a.t)}' and '${typeName(b.t)}')`);
      return errE();
    }
    const cls = ca.k === 'class' ? ca.cls : cb.cls;
    if (cls.ops?.[op]) {
      const o = cls.ops[op];
      const rt = o.ret === 'right' ? decay(b.t) : o.ret === 'left' ? a.t : typeFromString(o.ret);
      const bt = b.t, at_ = a.t;
      return mk(rt, [a, b], (x, y) => o.fn(x, y, bt, T, at_));
    }
    error(node, `no match for 'operator${op}' (operand types are '${typeName(a.t)}' and '${typeName(b.t)}')`);
    return errE();
  }

  function unaryE(node, scope) {
    const op = node.op;
    const a = ex(node.arg, scope);
    if (a.t === ERR) return errE();
    const ca = canon(a.t);
    if (op === '!') {
      const tr = truth(a, node.arg);
      return mk(T.bool, [tr], (x) => (x ? 0 : 1), { cv: tr.cv !== undefined ? +!tr.cv : undefined });
    }
    if (op === '&') {
      if (a.fnSet) return { t: ptrTo({ k: 'fn', ret: a.fnSet[0].ret, params: a.fnSet[0].params.map((p) => p.type) }, T), s: a.s, fnSet: a.fnSet };
      const loc = locator(a);
      if (!loc) { error(node, 'lvalue required as unary \'&\' operand'); return errE(); }
      const t = ptrTo(a.t, T);
      if (loc.sync) { const at = loc.fn; return { t, s: (f) => { at(f); return new Ptr(R.C, R.K); } }; }
      const atg = loc.fn;
      return { t, g: function* (f) { yield* atg(f); return new Ptr(R.C, R.K); } };
    }
    if (op === '*') {
      if (ca.k !== 'ptr' && ca.k !== 'array') { error(node, `invalid type argument of unary '*' (have '${typeName(a.t)}')`); return errE(); }
      const t = ca.k === 'ptr' ? ca.to : ca.of;
      const p = conv(a, decay(a.t), node);
      const null_ = (f) => f.vm.fail('null pointer dereference', 'This pointer does not point to anything (it is 0 / nullptr).');
      if (!p.g) {
        const ps = p.s;
        const at = (f) => { const x = ps(f); if (x == null) null_(f); R.C = x.b; R.K = x.o; };
        return { t, at, s: rvalueOf(t, at) };
      }
      const pg = p.g;
      const atg = function* (f) { const x = yield* pg(f); if (x == null) null_(f); R.C = x.b; R.K = x.o; };
      return { t, atg, g: function* (f) { yield* atg(f); return R.C[R.K]; } };
    }
    if (ca.k === 'class' || !isArith(ca)) { error(node, `no match for 'operator${op}' (operand type is '${typeName(a.t)}')`); return errE(); }
    if (op === '~' && !isInt(ca)) { error(node, `wrong type argument to bit-complement`); return errE(); }
    const t = promote(ca, T);
    const x = conv(a, t, node);
    const w = wrapper(t);
    const fn = op === '-' ? (v) => w(-v) : op === '+' ? (v) => v : (v) => w(canon(t).bits === 64 ? Number(~BigInt(v)) : ~v);
    const e = mk(t, [x], fn);
    if (x.cv !== undefined) e.cv = fn(x.cv);
    return e;
  }

  function requireLvalue(e, node, what) {
    if (e.t === ERR) return false;
    if (!e.at && !e.atg) {
      error(node, what === 'inc' ? `lvalue required as ${node.op === '++' ? 'increment' : 'decrement'} operand` : 'lvalue required as left operand of assignment',
        what === 'assign' ? "The left side of = must be a variable. To compare two values, use == instead." : undefined);
      return false;
    }
    if (e.readonly) {
      error(node, e.sym ? `assignment of read-only variable '${e.name}'` : 'assignment of read-only location',
        e.sym ? `'${e.name}' is declared const, so it can't change. Remove const if it needs to change.` : undefined);
      return false;
    }
    if (canon(e.t).k === 'array') { error(node, `invalid array assignment`, 'Arrays can\'t be assigned all at once. Copy the elements in a loop.'); return false; }
    return true;
  }

  function incE(node, scope) {
    const a = ex(node.arg, scope);
    if (!requireLvalue(a, node, 'inc')) return errE();
    const ca = canon(a.t);
    const d = node.op === '++' ? 1 : -1;
    const post = node.kind === 'postinc';
    let step;
    if (ca.k === 'ptr') step = (v) => (v == null ? null : new Ptr(v.b, v.o + d));
    else if (isArith(ca)) {
      if (ca.isBool) { if (d < 0) error(node, "use of an operand of type 'bool' in 'operator--' is forbidden"); step = () => 1; }
      else { const w = wrapper(ca.k === 'enum' ? T.int : ca); step = (v) => w(v + d); if (ca.k === 'enum') error(node, `no 'operator${node.op}(int)' declared for postfix '${node.op}'`); }
    } else { error(node, `no match for 'operator${node.op}' (operand type is '${typeName(a.t)}')`); return errE(); }
    const loc = locator(a);
    if (loc.sync) {
      const at = loc.fn;
      if (a.sym && !a.sym.ref && a.sym.where === 'l' && (!curFn || a.sym.fn === curFn)) {
        const slot = a.sym.slot;
        return { t: a.t, s: post ? (f) => { const v = f.s[slot]; f.s[slot] = step(v); return v; } : (f) => (f.s[slot] = step(f.s[slot])) };
      }
      return { t: a.t, s: post ? (f) => { at(f); const v = R.C[R.K]; R.C[R.K] = step(v); return v; } : (f) => { at(f); return (R.C[R.K] = step(R.C[R.K])); } };
    }
    const atg = loc.fn;
    return { t: a.t, g: function* (f) { yield* atg(f); const v = R.C[R.K]; const nv = step(v); R.C[R.K] = nv; return post ? v : nv; } };
  }

  function assignE(node, scope) {
    const l = ex(node.left, scope);
    if (l.t === ERR) { if (node.right.kind !== 'initlist') ex(node.right, scope); return errE(); }
    // String[i] = c
    if (node.left.kind === 'index' && l.strIndex) {
      const r = conv(ex(node.right, scope), T.char, node.right);
      const { obj, idx } = l.strIndex;
      return mk(T.char, [obj, idx, r], (o, i, c) => { if (i >= 0 && i < o.s.length) o.s = o.s.slice(0, i) + String.fromCharCode(c & 255) + o.s.slice(i + 1); return c; });
    }
    if (canon(l.t).k === 'class' && canon(l.t).cls.assign && node.op === '=' && !l.at && !l.atg) {
      const r = node.right.kind === 'initlist' ? errE() : ex(node.right, scope);
      if (r.t === ERR) return errE();
      const rt = r.t, asg = canon(l.t).cls.assign;
      return mk(l.t, [l, r], (lv, rv) => { asg(lv, rv, rt); return lv; });
    }
    if (!requireLvalue(l, node, 'assign')) { if (node.right.kind !== 'initlist') ex(node.right, scope); return errE(); }
    const lt = canon(l.t);
    let r;
    if (node.right.kind === 'initlist') {
      if (node.op !== '=') { error(node, 'expected primary-expression before \'{\' token'); return errE(); }
      r = initE(node.right, l.t, scope);
    } else r = ex(node.right, scope);
    if (r.t === ERR) return errE();
    if (node.op === '=' && node.left.kind !== 'paren' && curCondition) {
      // assignment used as a truth value
      warn(node, 'suggest parentheses around assignment used as truth value [-Wparentheses]', 'Did you mean == ? A single = changes the variable; == compares.');
    }
    let val;
    if (node.op === '=') val = conv(r, l.t, node.right, 'assignment');
    else {
      const bop = node.op.slice(0, -1);
      if (isString(lt)) {
        if (bop !== '+') { error(node, `no match for 'operator${node.op}' (operand types are 'String' and '${typeName(r.t)}')`); return errE(); }
        const rc = canon(r.t);
        let txt;
        if (isString(rc)) txt = (v) => v.s;
        else if (rc.k === 'array' || rc.k === 'ptr') txt = (v) => cstr(v);
        else if (isArith(rc)) txt = (v) => textOf(v, r.t, T, { forString: true });
        else { error(node, `no match for 'operator+=' (operand types are 'String' and '${typeName(r.t)}')`); return errE(); }
        const loc = locator(l);
        if (loc.sync && !r.g) {
          const at = loc.fn, rs = r.s;
          return { t: l.t, s: (f) => { const v = rs(f); at(f); const o = R.C[R.K]; o.s += txt(v); return o; } };
        }
        const atg = gen({ s: loc.sync ? (f) => { loc.fn(f); return [R.C, R.K]; } : undefined, g: loc.sync ? undefined : function* (f) { yield* loc.fn(f); return [R.C, R.K]; } });
        const rg = gen(r);
        return { t: l.t, g: function* (f) { const v = yield* rg(f); const [c, k] = yield* atg(f); c[k].s += txt(v); return c[k]; } };
      }
      // a op= b  ==  a = (T)(a op b)
      const fake = { kind: 'binary', op: bop, left: { kind: '#val', e: { t: l.t, s: () => 0 } }, right: node.right, line: node.line, col: node.col };
      void fake;
      const ca = canon(l.t);
      if (ca.k === 'ptr' && (bop === '+' || bop === '-') && isInt(canon(r.t))) {
        const sign = bop === '+' ? 1 : -1;
        val = { t: l.t, combine: (old, rv) => (old == null ? null : new Ptr(old.b, old.o + sign * rv)) };
      } else {
        if (!isArith(ca) || !isArith(canon(r.t))) { error(node, `invalid operands of types '${typeName(l.t)}' and '${typeName(r.t)}' to binary 'operator${bop}'`); return errE(); }
        if (['%', '&', '|', '^', '<<', '>>'].includes(bop) && (!isInt(ca) || !isInt(canon(r.t)))) { error(node, `invalid operands of types '${typeName(l.t)}' and '${typeName(r.t)}' to binary 'operator${bop}'`); return errE(); }
        const t = ['<<', '>>'].includes(bop) ? promote(ca, T) : arithResult(ca, canon(r.t), T);
        const toT = converter(l.t, t) ?? ((x) => x);
        const rT = converter(r.t, ['<<', '>>'].includes(bop) ? promote(canon(r.t), T) : t) ?? ((x) => x);
        const back = converter(t, l.t) ?? ((x) => x);
        let op;
        if (bop === '/' || bop === '%') {
          const w = wrapper(t);
          op = isFloat(t) ? (x, y) => w(x / y) : bop === '/' ? (x, y, f) => { if (y === 0) f.vm.fail('division by zero', 'Check the divisor before dividing.'); return w(Math.trunc(x / y)); } : (x, y, f) => { if (y === 0) f.vm.fail('division by zero', 'Check the divisor before dividing.'); return w(x % y); };
        } else if (bop === '<<' || bop === '>>') {
          const bitsN = canon(t).bits, uns = canon(t).unsigned, w = wrapper(t);
          op = bop === '<<' ? (x, y) => (y >= bitsN ? 0 : w(bitsN === 32 ? x << y : x * 2 ** y)) : (x, y) => (y >= bitsN ? (uns || x >= 0 ? 0 : -1) : uns && bitsN === 32 ? x >>> y : x >> y);
          if (bitsN === 64) op = arith(bop, t);
        } else op = arith(bop, t);
        val = { t: l.t, combine: (old, rv, f) => back(op(toT(old), rT(rv), f)) };
      }
      const loc = locator(l);
      if (loc.sync && !r.g) {
        const at = loc.fn, rs = r.s, cb = val.combine;
        if (l.sym && !l.sym.ref && l.sym.where === 'l' && (!curFn || l.sym.fn === curFn)) {
          const slot = l.sym.slot;
          return { t: l.t, s: (f) => (f.s[slot] = cb(f.s[slot], rs(f), f)) };
        }
        return { t: l.t, s: (f) => { const rv = rs(f); at(f); return (R.C[R.K] = cb(R.C[R.K], rv, f)); } };
      }
      const rg = gen(r), cb = val.combine;
      const atg = loc.sync ? function* (f) { loc.fn(f); } : loc.fn;
      return { t: l.t, g: function* (f) { yield* atg(f); const c = R.C, k = R.K; const rv = yield* rg(f); return (c[k] = cb(c[k], rv, f)); } };
    }
    if (val.t === ERR) return errE();
    const loc = locator(l);
    if (loc.sync && !val.g) {
      const at = loc.fn, vs = val.s;
      if (l.sym && !l.sym.ref && (!curFn || l.sym.fn === curFn || l.sym.where === 'g')) {
        const slot = l.sym.slot;
        return l.sym.where === 'g' ? { t: l.t, s: (f) => (f.g[slot] = vs(f)) } : { t: l.t, s: (f) => (f.s[slot] = vs(f)) };
      }
      return { t: l.t, s: (f) => { const v = vs(f); at(f); return (R.C[R.K] = v); } };
    }
    const vg = gen(val);
    const atg = loc.sync ? function* (f) { loc.fn(f); } : loc.fn;
    return { t: l.t, g: function* (f) { const v = yield* vg(f); yield* atg(f); return (R.C[R.K] = v); } };
  }

  function condE(node, scope) {
    const c = truth(ex(node.cond, scope), node.cond);
    let a = ex(node.a, scope), b = ex(node.b, scope);
    if (a.t === ERR || b.t === ERR) return errE();
    const ca = canon(a.t), cb = canon(b.t);
    let t;
    if (isArith(ca) && isArith(cb)) t = sameType(ca, cb) ? a.t : arithResult(ca, cb, T);
    else if (isString(ca) || isString(cb)) t = classType(registry.classes.String);
    else if ((ca.k === 'ptr' || ca.k === 'array' || a.isNull) && (cb.k === 'ptr' || cb.k === 'array' || b.isNull)) t = ca.k === 'ptr' || ca.k === 'array' ? decay(a.t) : decay(b.t);
    else if (sameType(ca, cb)) t = a.t;
    else if (ca.k === 'void' && cb.k === 'void') t = T.void;
    else { error(node, `operands to ?: have different types '${typeName(a.t)}' and '${typeName(b.t)}'`); return errE(); }
    a = t.k === 'void' ? a : conv(a, t, node.a);
    b = t.k === 'void' ? b : conv(b, t, node.b);
    if (c.cv !== undefined && a.cv !== undefined && b.cv !== undefined) return constE(t, c.cv ? a.cv : b.cv);
    if (!c.g && !a.g && !b.g) {
      const x = c.s, y = a.s, z = b.s;
      return { t, s: (f) => (x(f) ? y(f) : z(f)) };
    }
    const x = gen(c), y = gen(a), z = gen(b);
    return { t, g: function* (f) { return (yield* x(f)) ? yield* y(f) : yield* z(f); } };
  }

  function castE(e, t, node) {
    if (e.t === ERR || t === ERR) return errE();
    const a = canon(e.t), b = canon(t);
    if (b.k === 'void') return mk(T.void, [e], () => undefined);
    if (isArith(a) && isArith(b)) {
      const fn = numConverter(a, b);
      const out = mk(t, [e], fn);
      if (e.cv !== undefined) out.cv = fn(e.cv);
      return out;
    }
    if (b.k === 'ptr' && (a.k === 'ptr' || a.k === 'array' || a.k === 'nullptr')) return mk(t, [e], a.k === 'array' ? (v) => new Ptr(v, 0) : (v) => v);
    if (b.k === 'ptr' && isInt(a)) { if (e.cv === 0) return constE(t, null); error(node, `cast from '${typeName(e.t)}' to '${typeName(t)}' is not supported in the simulator`); return errE(); }
    if (isInt(b) && (a.k === 'ptr' || a.k === 'array')) { warn(node, `cast from '${typeName(decay(e.t))}' to '${typeName(t)}' loses the pointer; the simulator gives a pretend address`); return mk(t, [e], (v) => (v == null ? 0 : 0x100 + ((v.o ?? 0) | 0))); }
    if (b.k === 'class' || b.k === 'struct') return conv(e, t, node, 'cast');
    if (b.isBool) return conv(e, t, node);
    error(node, `invalid cast from type '${typeName(e.t)}' to type '${typeName(t)}'`);
    return errE();
  }

  function constructE(node, scope) {
    const name = node.typeName;
    let t;
    const bt = builtinType([name]);
    if (bt) t = bt;
    else t = resolveSpec({ words: [], name, line: node.line, col: node.col }, scope);
    if (t === ERR) return errE();
    const c = canon(t);
    if (c.k === 'class') return classConstruct(c.cls, node.args, scope, node);
    if (c.k === 'struct') {
      if (node.brace) return initE({ kind: 'initlist', items: node.args, line: node.line, col: node.col }, t, scope);
      if (node.args.length === 0) return { t, s: () => zeroValue(t) };
      error(node, `no matching function for call to '${name}(...)'`);
      return errE();
    }
    if (node.args.length === 0) return constE(t, 0);
    if (node.args.length !== 1) { error(node, `expression list treated as compound expression in functional cast`); return errE(); }
    return castE(ex(node.args[0], scope), t, node);
  }

  /** Resolve a call against registry signatures. Returns { sig, idx, args: [E] } or null. */
  function pickSig(sigs, argEs, node, label) {
    let best = null;
    sigs.forEach((str, idx) => {
      const s = sig(str);
      const need = s.params.filter((p) => p.def === undefined).length;
      if (argEs.length < need || (argEs.length > s.params.length && !s.variadic)) return;
      let score = 0;
      for (let i = 0; i < Math.min(argEs.length, s.params.length); i++) {
        const p = s.params[i], a = argEs[i];
        if (a.t === ERR) continue;
        const ca = canon(a.t);
        if (p.any) { if (p.ref && !a.at && !a.atg) { score = Infinity; break; } continue; }
        if (p.fn) { if (!(ca.k === 'fn' || (ca.k === 'ptr' && ca.to.k === 'fn') || a.fnSet || a.isNull)) { score = Infinity; break; } continue; }
        if (p.cstr) { if (!(isString(ca) || ((ca.k === 'array' || ca.k === 'ptr') && isCharLike(ca.of ?? ca.to)) || a.isNull)) { score = Infinity; break; } continue; }
        const r = convRank(a.t, p.type, a);
        if (p.ref && !(a.at || a.atg)) { score = Infinity; break; }
        score += r;
        if (score === Infinity) break;
      }
      if (score < Infinity && (!best || score < best.score)) best = { score, sig: s, idx };
    });
    if (!best) {
      const shown = argEs.map((a) => typeName(a.t, { aka: false })).join(', ');
      const cands = sigs.map((x) => `  ${label}${x.replace(/^[^(]*/, '')}`).join('\n');
      const s0 = sig(sigs[0]);
      if (sigs.length === 1) {
        const need = s0.params.filter((p) => p.def === undefined).length;
        if (argEs.length < need) error(node, `too few arguments to function '${s0.ret.name} ${label}${sigs[0].replace(/^[^(]*/, '')}'`, `${label}() needs ${need === s0.params.length ? need : `${need} to ${s0.params.length}`} argument${need === 1 ? '' : 's'}.`);
        else if (argEs.length > s0.params.length && !s0.variadic) error(node, `too many arguments to function '${s0.ret.name} ${label}${sigs[0].replace(/^[^(]*/, '')}'`, `${label}() takes ${s0.params.length} argument${s0.params.length === 1 ? '' : 's'}.`);
        else error(node, `no matching function for call to '${label}(${shown})'`, `candidate: ${label}${sigs[0].replace(/^[^(]*/, '')}`);
      } else error(node, `no matching function for call to '${label}(${shown})'`, `Candidates are:\n${cands}`);
      return null;
    }
    return best;
  }

  /** Build argument evaluators for a registry signature. */
  function libArgs(s, argEs, node) {
    const out = [];
    for (let i = 0; i < s.params.length; i++) {
      const p = s.params[i];
      const a = argEs[i];
      if (!a) {
        const d = p.def;
        out.push(p.type && canon(p.type).k === 'class' && isString(canon(p.type)) ? { s: () => new AStr(d ?? '') } : { s: () => d });
        continue;
      }
      if (p.any) {
        if (p.ref) {
          const loc = locator(a);
          const t = a.t;
          out.push(loc.sync ? { s: (f) => { loc.fn(f); return { ref: new Ptr(R.C, R.K), t }; } } : { g: function* (f) { yield* loc.fn(f); return { ref: new Ptr(R.C, R.K), t }; } });
        } else {
          const t = a.t;
          out.push(mk(t, [a], (v) => ({ v, t })));
        }
        continue;
      }
      if (p.fn) { out.push(a.isNull ? { s: () => null } : a); continue; }
      if (p.cstr) { out.push(mk(T.any, [a], (v) => cstr(v))); continue; }
      if (p.ref) {
        const loc = locator(a);
        out.push(loc.sync ? { s: (f) => { loc.fn(f); return new Ptr(R.C, R.K); } } : { g: function* (f) { yield* loc.fn(f); return new Ptr(R.C, R.K); } });
        continue;
      }
      out.push(conv(a, p.type, node, 'argument passing'));
    }
    if (s.variadic) {
      const rest = argEs.slice(s.params.length).map((a) => mk(a.t, [canon(a.t).k === 'float' && canon(a.t).bits === 32 ? conv(a, T.double, node) : a], (v) => ({ v, t: canon(a.t).k === 'float' ? T.double : a.t })));
      out.push(mk(T.any, rest, (...vs) => vs));
    }
    return out;
  }

  function callImpl(impl, ret, argList, self, node) {
    // argList: [E]; self: E | null
    const parts = self ? [self, ...argList] : argList;
    const generatorImpl = isGen(impl);
    const anyGen = parts.some((e) => e.g);
    if (!generatorImpl && !anyGen) {
      const ss = parts.map((e) => e.s);
      const line = node.line;
      switch (ss.length) {
        case 0: return { t: ret, s: (f) => impl(f.vm) };
        case 1: { const [a] = ss; return { t: ret, s: (f) => impl(f.vm, a(f)) }; }
        case 2: { const [a, b] = ss; return { t: ret, s: (f) => impl(f.vm, a(f), b(f)) }; }
        case 3: { const [a, b, c] = ss; return { t: ret, s: (f) => impl(f.vm, a(f), b(f), c(f)) }; }
        default: return { t: ret, s: (f) => impl(f.vm, ...ss.map((s) => s(f))) };
      }
      void line;
    }
    const gs = parts.map((e) => e.g ?? ((f) => e.s(f)));
    const isg = parts.map((e) => !!e.g);
    return {
      t: ret,
      g: function* (f) {
        const v = new Array(gs.length);
        for (let i = 0; i < gs.length; i++) v[i] = isg[i] ? yield* gs[i](f) : gs[i](f);
        return generatorImpl ? yield* impl(f.vm, ...v) : impl(f.vm, ...v);
      },
    };
  }

  function callE(node, scope) {
    const cal = node.callee;
    // method call obj.m(...)
    if (cal.kind === 'member') {
      const obj = ex(cal.obj, scope);
      if (obj.t === ERR) { node.args.forEach((a) => a.kind !== 'initlist' && ex(a, scope)); return errE(); }
      let ot = canon(obj.t);
      let objE = obj;
      if (cal.arrow) {
        if (ot.k !== 'ptr') { error(cal, `base operand of '->' has non-pointer type '${typeName(obj.t)}'`, 'Use . instead of -> for objects that are not pointers.'); return errE(); }
        ot = canon(ot.to);
        objE = mk(ot, [obj], (p) => (p == null ? null : p.b[p.o]));
      } else if (ot.k === 'ptr' && canon(ot.to).k === 'class') {
        error(cal, `request for member '${cal.name}' in '${exprText(cal.obj)}', which is of pointer type '${typeName(obj.t)}' (maybe you meant to use '->' ?)`);
        return errE();
      }
      if (ot.k !== 'class') {
        error(cal, `request for member '${cal.name}' in '${exprText(cal.obj)}', which is of non-class type '${typeName(obj.t)}'`, ot.k === 'array' && isCharLike(ot.of) ? 'A char array has no methods. Use a String if you need .length(), .indexOf() and so on.' : undefined);
        return errE();
      }
      const cls = ot.cls;
      const m = cls.methods?.[cal.name];
      if (!m || (m.boards && !m.boards.includes(board))) {
        const names = Object.keys(cls.methods ?? {});
        const near = names.filter((n) => n.toLowerCase() === cal.name.toLowerCase() || levenshtein(n, cal.name) <= 2);
        error(cal, `'class ${cls.cppName ?? cls.name}' has no member named '${cal.name}'`, m?.boards ? `${cls.name}.${cal.name}() only exists on ${m.boardsText ?? m.boards.join(' / ')} boards.` : near.length ? `Did you mean '${near[0]}'?` : undefined);
        return errE();
      }
      const argEs = node.args.map((a) => (a.kind === 'initlist' ? errE() : ex(a, scope)));
      if (argEs.some((a) => a.t === ERR)) return errE();
      const pick = pickSig(m.sigs, argEs, node, `${cls.name}::${cal.name}`);
      if (!pick) return errE();
      if (m.check) m.check({ args: argEs, node, warn: (msg, hint) => warn(node, msg, hint), error: (msg, hint) => error(node, msg, hint), T, board });
      let impl = m.impls ? m.impls[pick.idx] : m.impl;
      let ret = pick.sig.ret;
      if (m.retSame) ret = argEs[0].t;
      if (m.targ) {
        if (!cal.targ) { error(cal, `no matching function for call to '${cls.name}::${cal.name}()'`, `Write it with a type, e.g. ${exprText(cal.obj)}.${cal.name}<int>()`); return errE(); }
        const tt = applyDeclarator(resolveSpec(cal.targ.spec, scope), { ...cal.targ.decl, name: '' }, scope);
        if (tt === ERR) return errE();
        if (m.targ === 'ret') ret = tt;
        const inner = impl, TT = tt;
        impl = isGen(inner) ? function* (vm, self, ...a) { return yield* inner(vm, self, TT, ...a); } : (vm, self, ...a) => inner(vm, self, TT, ...a);
      }
      return callImpl(impl, ret, libArgs(pick.sig, argEs, node), objE, node);
    }
    const callee = cal.kind === 'ident' ? ex(cal, scope) : ex(cal, scope);
    if (callee.t === ERR) { node.args.forEach((a) => a.kind !== 'initlist' && ex(a, scope)); return errE(); }
    if (callee.builtin) return builtinCall(callee.builtin, node, scope, callee.name);
    if (callee.fnSet) return userCall(callee.fnSet, node, scope, callee.name);
    // call through a function pointer / lambda variable
    const ct = canon(callee.t);
    const ft = ct.k === 'fn' ? ct : ct.k === 'ptr' && canon(ct.to).k === 'fn' ? canon(ct.to) : null;
    if (!ft) {
      error(node, `'${exprText(cal)}' cannot be used as a function`, callee.sym ? `'${exprText(cal)}' is a variable, not a function.` : undefined);
      return errE();
    }
    const argEs = node.args.map((a) => ex(a, scope));
    if (ft.params && argEs.length !== ft.params.length) { error(node, `too ${argEs.length < ft.params.length ? 'few' : 'many'} arguments to function`); return errE(); }
    const conv_ = argEs.map((a, i) => (ft.params ? conv(a, ft.params[i], node, 'argument passing') : a));
    const fe = callee;
    const parts = [fe, ...conv_].map(gen);
    return { t: ft.ret ?? T.void, g: function* (f) { const v = []; for (const p of parts) v.push(yield* p(f)); return yield* f.vm.callRef(v[0], v.slice(1)); } };
  }

  function exprText(n) {
    if (!n) return '';
    if (n.kind === 'ident') return n.name;
    if (n.kind === 'member') return `${exprText(n.obj)}${n.arrow ? '->' : '.'}${n.name}`;
    if (n.kind === 'index') return `${exprText(n.obj)}[...]`;
    if (n.kind === 'call') return `${exprText(n.callee)}(...)`;
    if (n.kind === 'paren') return `(${exprText(n.expr)})`;
    return 'expression';
  }

  function builtinCall(b, node, scope, name) {
    if (b.kind === 'special') return specialCall(b, node, scope, name);
    const argEs = node.args.map((a) => ex(a, scope));
    if (argEs.some((a) => a.t === ERR)) return errE();
    const pick = pickSig(b.sigs, argEs, node, name);
    if (!pick) return errE();
    if (b.check) b.check({ args: argEs, node, warn: (msg, hint) => warn(node, msg, hint), error: (msg, hint) => error(node, msg, hint), T, board });
    const impl = b.impls ? b.impls[pick.idx] : b.impl;
    const e = callImpl(impl, pick.sig.ret, libArgs(pick.sig, argEs, node), null, node);
    if (b.pure && argEs.every((a) => a.cv !== undefined) && e.s) { try { e.cv = e.s({ vm: null }); } catch { /* not constant */ } }
    return e;
  }

  function specialCall(b, node, scope, name) {
    const argEs = node.args.map((a) => ex(a, scope));
    if (argEs.some((a) => a.t === ERR)) return errE();
    const need = (n) => {
      if (argEs.length !== n) { error(node, `macro "${name}" ${argEs.length > n ? 'passed' : 'requires'} ${Math.max(n, argEs.length)} arguments, but ${argEs.length > n ? 'takes just' : 'only'} ${argEs.length > n ? n : argEs.length}${argEs.length > n ? '' : ' given'}`); return false; }
      return true;
    };
    const numeric = () => argEs.every((a) => isArith(canon(a.t))) || (error(node, `invalid operands to ${name}()`, `${name}() works with numbers.`), false);
    switch (name) {
      case 'F': case 'PSTR': case 'makeKeymap': case 'FPSTR':
        if (!need(1)) return errE();
        return argEs[0];
      case 'min': case 'max': {
        if (!need(2) || !numeric()) return errE();
        const t = arithResult(canon(argEs[0].t), canon(argEs[1].t), T);
        const [a, b2] = argEs.map((e) => conv(e, t, node));
        const fn = name === 'min' ? (x, y) => (x < y ? x : y) : (x, y) => (x > y ? x : y);
        const e = mk(t, [a, b2], fn);
        if (a.cv !== undefined && b2.cv !== undefined) e.cv = fn(a.cv, b2.cv);
        return e;
      }
      case 'abs': {
        if (!need(1) || !numeric()) return errE();
        const t = promote(canon(argEs[0].t), T);
        const w = wrapper(t);
        return mk(t, [conv(argEs[0], t, node)], (x) => (x > 0 ? x : w(-x)));
      }
      case 'sq': {
        if (!need(1) || !numeric()) return errE();
        const t = promote(canon(argEs[0].t), T);
        const fn = arith('*', t);
        return mk(t, [conv(argEs[0], t, node)], (x) => fn(x, x));
      }
      case 'constrain': {
        if (!need(3) || !numeric()) return errE();
        const t = arithResult(arithResult(canon(argEs[0].t), canon(argEs[1].t), T), canon(argEs[2].t), T);
        const [x, lo, hi] = argEs.map((e) => conv(e, t, node));
        return mk(argEs[0].t === t ? t : t, [x, lo, hi], (v, l, h) => (v < l ? l : v > h ? h : v));
      }
      case 'round': {
        // AVR Arduino.h: #define round(x) ((x)>=0?(long)((x)+0.5):(long)((x)-0.5))
        if (!need(1) || !numeric()) return errE();
        if (T.avr) {
          const x = conv(argEs[0], T.double, node);
          return mk(T.long, [x], (v) => numConverter(T.double, T.long)(v >= 0 ? Math.fround(v + 0.5) : Math.fround(v - 0.5)));
        }
        const x = conv(argEs[0], T.double, node);
        return mk(T.double, [x], (v) => (v < 0 ? -Math.round(-v) : Math.round(v)));
      }
      case 'bitRead': case 'bitSet': case 'bitClear': case 'bitWrite': case 'bitToggle': {
        const n = name === 'bitWrite' ? 3 : 2;
        if (!need(n)) return errE();
        const vt = canon(argEs[0].t);
        if (name === 'bitRead') return mk(promote(vt, T), [argEs[0], conv(argEs[1], T.int, node)], (v, b2) => (canon(vt).bits === 64 ? Number((BigInt(v) >> BigInt(b2)) & 1n) : (b2 >= 32 ? 0 : (v >>> b2) & 1)));
        const l = argEs[0];
        if (!requireLvalue(l, node, 'assign')) return errE();
        const w = wrapper(vt);
        const loc = locator(l);
        const ops = { bitSet: (v, k) => w(v | 2 ** k), bitClear: (v, k) => w(k >= 32 ? v : v & ~(1 << k)), bitToggle: (v, k) => w(v ^ (1 << k)), bitWrite: (v, k, x) => (x ? w(v | 2 ** k) : w(k >= 32 ? v : v & ~(1 << k))) };
        const opf = ops[name];
        const rest = argEs.slice(1).map((e) => conv(e, T.int, node));
        const restG = rest.map(gen);
        if (loc.sync && rest.every((e) => !e.g)) {
          const at = loc.fn, rs = rest.map((e) => e.s);
          return { t: l.t, s: (f) => { const a1 = rs[0](f), a2 = rs[1]?.(f); at(f); return (R.C[R.K] = opf(R.C[R.K], a1, a2)); } };
        }
        return { t: l.t, g: function* (f) { const a1 = yield* restG[0](f); const a2 = restG[1] ? yield* restG[1](f) : 0; if (loc.sync) loc.fn(f); else yield* loc.fn(f); return (R.C[R.K] = opf(R.C[R.K], a1, a2)); } };
      }
      case 'lowByte': if (!need(1)) return errE(); return mk(T.uchar, [argEs[0]], (v) => v & 0xff);
      case 'highByte': if (!need(1)) return errE(); return mk(T.uchar, [argEs[0]], (v) => (v >> 8) & 0xff);
      case 'pgm_read_byte': case 'pgm_read_word': case 'pgm_read_dword': case 'pgm_read_float': case 'pgm_read_ptr': {
        if (!need(1)) return errE();
        const pt = canon(argEs[0].t);
        if (pt.k !== 'ptr' && pt.k !== 'array') { error(node, `${name}() needs an address, e.g. ${name}(&table[i])`); return errE(); }
        const el = pt.to ?? pt.of;
        return mk(el, [conv(argEs[0], decay(argEs[0].t), node)], (p) => (p == null ? 0 : p.b[p.o]));
      }
      case 'memcpy_P': case 'strcpy_P':
        error(node, `${name}() is not supported in the simulator yet`);
        return errE();
      case 'digitalPinToInterrupt': {
        if (!need(1)) return errE();
        const info = T.info;
        const pin = conv(argEs[0], T.int, node);
        const fn = (p) => (info.interrupts === 'all' ? p : info.interrupts[p] ?? -1);
        if (pin.cv !== undefined && fn(pin.cv) < 0) warn(node, `pin ${pin.cv} can't trigger an external interrupt on the ${info.name}`, `Interrupt pins: ${Object.keys(info.interrupts).join(', ')}.`);
        const e = mk(T.int, [pin], fn);
        if (pin.cv !== undefined) e.cv = fn(pin.cv);
        return e;
      }
      default:
        error(node, `'${name}' is not supported in the simulator yet`);
        return errE();
    }
  }

  function userCall(overloads, node, scope, name) {
    const argEs = node.args.map((a) => (a.kind === 'initlist' ? { t: T.any, init: a } : ex(a, scope)));
    if (argEs.some((a) => a.t === ERR)) return errE();
    // overload resolution by arity, then by conversion rank
    let best = null;
    for (const info of overloads) {
      const need = info.params.filter((p) => !p.def).length;
      if (argEs.length < need || argEs.length > info.params.length) continue;
      let score = 0;
      for (let i = 0; i < argEs.length; i++) {
        const p = info.params[i];
        if (argEs[i].init) continue;
        let r = convRank(argEs[i].t, p.type, argEs[i]);
        if (p.ref && !(argEs[i].at || argEs[i].atg) && !p.constRef) r = Infinity;
        score += r;
      }
      if (score < Infinity && best && score === best.score) best.tie = true;
      if (score < Infinity && (!best || score < best.score)) best = { info, score };
    }
    if (best?.tie && overloads.filter((o) => o.params.length >= argEs.length).length > 1) {
      error(node, `call of overloaded '${name}(${argEs.map((a) => typeName(a.t, { aka: false })).join(', ')})' is ambiguous`, `Candidates are:\n${overloads.map((o) => '  ' + fnSig(o)).join('\n')}\nCast the argument to pick one, e.g. ${name}((float)x).`);
      return errE();
    }
    if (!best) {
      if (overloads.length === 1) {
        const info = overloads[0];
        const need = info.params.filter((p) => !p.def).length;
        if (argEs.length < need) error(node, `too few arguments to function '${fnSig(info)}'`, `${name}() needs ${need} argument${need === 1 ? '' : 's'}; you passed ${argEs.length}. It is declared on line ${info.line}.`);
        else if (argEs.length > info.params.length) error(node, `too many arguments to function '${fnSig(info)}'`, `${name}() takes ${info.params.length} argument${info.params.length === 1 ? '' : 's'}; you passed ${argEs.length}.`);
        else {
          const i = argEs.findIndex((a, k) => !a.init && convRank(a.t, info.params[k].type, a) === Infinity);
          const p = info.params[i];
          if (p && p.ref && !(argEs[i].at || argEs[i].atg)) error(node, `cannot bind non-const lvalue reference of type '${typeName(p.type)}&' to an rvalue of type '${typeName(argEs[i].t)}'`, 'A reference parameter (&) needs a variable, not a value.');
          else if (i >= 0) conv(argEs[i], info.params[i].type, node.args[i], 'argument passing');
          else error(node, `no matching function for call to '${name}(${argEs.map((a) => typeName(a.t, { aka: false })).join(', ')})'`);
        }
      } else error(node, `no matching function for call to '${name}(${argEs.map((a) => typeName(a.t, { aka: false })).join(', ')})'`, `Candidates are:\n${overloads.map((o) => '  ' + fnSig(o)).join('\n')}`);
      return errE();
    }
    const info = best.info;
    const args = [];
    for (let i = 0; i < info.params.length; i++) {
      const p = info.params[i];
      let a = argEs[i];
      if (!a) { a = p.defE ?? (p.defE = ex(p.def, globalScope)); a = conv(a, p.type, node); args.push(a); continue; }
      if (a.init) { args.push(initE(a.init, p.type, scope)); continue; }
      if (p.ref) {
        const loc = locator(a);
        if (!loc) {
          // const T& bound to a temporary
          const tmp = conv(a, p.type, node, 'argument passing');
          args.push(mk(T.any, [tmp], (v) => new Ptr([v], 0)));
        } else {
          if (a.readonly && !p.constRef) { error(node, `binding reference of type '${typeName(p.type)}&' to 'const ${typeName(a.t)}' discards qualifiers`); }
          args.push(loc.sync ? { s: (f) => { loc.fn(f); return new Ptr(R.C, R.K); } } : { g: function* (f) { yield* loc.fn(f); return new Ptr(R.C, R.K); } });
        }
        continue;
      }
      args.push(conv(a, p.type, node.args[i], 'argument passing'));
    }
    const gs = args.map((e) => e.g ?? ((f) => e.s(f)));
    const isg = args.map((e) => !!e.g);
    const n = args.length;
    if (!isg.some(Boolean)) {
      const ss = args.map((e) => e.s);
      if (n === 0) return { t: info.ret, g: function* (f) { return yield* info.run(f.vm, [], null); } };
      if (n === 1) { const a0 = ss[0]; return { t: info.ret, g: function* (f) { return yield* info.run(f.vm, [a0(f)], null); } }; }
      return { t: info.ret, g: function* (f) { const v = new Array(n); for (let i = 0; i < n; i++) v[i] = ss[i](f); return yield* info.run(f.vm, v, null); } };
    }
    return {
      t: info.ret,
      g: function* (f) {
        const v = new Array(n);
        for (let i = 0; i < n; i++) v[i] = isg[i] ? yield* gs[i](f) : gs[i](f);
        return yield* info.run(f.vm, v, null);
      },
    };
  }

  function indexE(node, scope) {
    const o = ex(node.obj, scope);
    const i = ex(node.index, scope);
    if (o.t === ERR || i.t === ERR) return errE();
    const ot = canon(o.t);
    if (isString(ot)) {
      const ie = conv(i, T.uint, node.index);
      const e = mk(T.char, [o, ie], (s, k) => (k < s.s.length ? s.s.charCodeAt(k) : 0));
      e.strIndex = { obj: o, idx: ie };
      return e;
    }
    if (ot.k === 'class' && ot.cls.indexOp) {
      const io = ot.cls.indexOp;
      const it = i.t;
      return mk(typeFromString(io.type), [o, i], (ov, iv) => io.fn(ov, iv, it, T));
    }
    if (ot.k === 'class' && ot.cls.index) {
      const ix = ot.cls.index;
      const ie = conv(i, T.int, node.index);
      const t = typeFromString(ix.type);
      const oe = o;
      if (!oe.g && !ie.g) {
        const os = oe.s, is = ie.s;
        const at = (f) => { const c = ix.container(f.vm, os(f)); R.C = c; R.K = is(f); };
        return { t, at, s: rvalueOf(t, at) };
      }
    }
    if (ot.k !== 'array' && ot.k !== 'ptr') {
      if (isInt(ot) && (canon(i.t).k === 'array' || canon(i.t).k === 'ptr')) return indexE({ ...node, obj: node.index, index: node.obj }, scope);
      error(node, `invalid types '${typeName(o.t, { aka: false })}[${typeName(i.t, { aka: false })}]' for array subscript`, ot.k === 'int' ? `'${exprText(node.obj)}' is a single number, not an array.` : undefined);
      return errE();
    }
    if (!isInt(canon(i.t))) { error(node, `invalid types '${typeName(o.t, { aka: false })}[${typeName(i.t, { aka: false })}]' for array subscript`, 'An array index must be a whole number.'); return errE(); }
    const el = ot.k === 'array' ? ot.of : ot.to;
    const ie = conv(i, canon(i.t).unsigned && canon(i.t).bits >= 32 ? T.ulong : T.long, node.index);
    const len = ot.k === 'array' ? ot.len : null;
    if (len != null && ie.cv !== undefined && (ie.cv < 0 || ie.cv >= len)) warn(node, `array subscript ${ie.cv} is ${ie.cv < 0 ? 'below' : 'above'} array bounds of '${typeName(o.t, { aka: false })}' [-Warray-bounds]`, `Valid indexes are 0 to ${len - 1}.`);
    const dummy = [zeroValue(el)];
    const tname = typeName(o.t, { aka: false });
    const line = node.line;
    const oob = (f, k, n) => {
      f.vm.oob(line, `runtime error: index ${k} out of bounds for type '${ot.k === 'array' ? tname : typeName(el, { aka: false }) + ' [' + n + ']'}'`, `Valid indexes are 0 to ${n - 1}. Reading past the end gives garbage and writing there corrupts other variables on a real board.`);
      R.C = dummy; R.K = 0; dummy[0] = zeroValue(el);
    };
    const locate = ot.k === 'array'
      ? (f, a, k) => { if (k >= 0 && k < a.length) { R.C = a; R.K = k; } else oob(f, k, a.length); }
      : (f, p, k) => {
        if (p == null) f.vm.fail('null pointer dereference', 'This pointer does not point to anything.');
        const b = p.b, kk = p.o + k;
        if (Array.isArray(b)) { if (kk >= 0 && kk < b.length) { R.C = b; R.K = kk; } else oob(f, kk, b.length); }
        else if (k === 0) { R.C = b; R.K = p.o; }
        else f.vm.fail('pointer arithmetic outside an array', 'The simulator only supports pointer arithmetic inside arrays.');
      };
    if (!o.g && !ie.g) {
      const os = o.s, is = ie.s;
      const at = (f) => { const a = os(f); const k = is(f); locate(f, a, k); };
      return { t: el, at, s: rvalueOf(el, at), readonly: (ot.of ?? ot.to)?.constEl };
    }
    const og = gen(o), ig = gen(ie);
    const atg = function* (f) { const a = yield* og(f); const k = yield* ig(f); locate(f, a, k); };
    return { t: el, atg, g: function* (f) { yield* atg(f); return R.C[R.K]; } };
  }

  function memberE(node, scope) {
    const o = ex(node.obj, scope);
    if (o.t === ERR) return errE();
    let ot = canon(o.t);
    let base = o;
    if (node.arrow) {
      if (ot.k !== 'ptr') { error(node, `base operand of '->' has non-pointer type '${typeName(o.t)}'`, 'Use . instead of ->.'); return errE(); }
      ot = canon(ot.to);
      const loc = { s: o.s, g: o.g };
      base = { t: ot, ...(loc.g ? { atg: function* (f) { const p = yield* loc.g(f); R.C = p.b; R.K = p.o; } } : { at: (f) => { const p = loc.s(f); if (p == null) f.vm.fail('null pointer dereference'); R.C = p.b; R.K = p.o; } }) };
      if (base.at) base.s = rvalueOf(ot, base.at);
    } else if (ot.k === 'ptr' && canon(ot.to).k === 'struct') {
      error(node, `request for member '${node.name}' in '${exprText(node.obj)}', which is of pointer type '${typeName(o.t)}' (maybe you meant to use '->' ?)`);
      return errE();
    }
    if (ot.k === 'struct') {
      const fld = ot.fields.find((x) => x.name === node.name);
      if (!fld) { error(node, `'struct ${ot.name}' has no member named '${node.name}'`, ot.fields.length ? `Its members are: ${ot.fields.map((x) => x.name).join(', ')}.` : undefined); return errE(); }
      const key = node.name;
      const loc = locator(base);
      if (loc?.sync) {
        const bat = loc.fn;
        const at = (f) => { bat(f); const c = R.C[R.K]; R.C = c; R.K = key; };
        return { t: fld.type, at, s: (f) => { bat(f); return R.C[R.K][key]; }, readonly: o.readonly };
      }
      if (loc) {
        const batg = loc.fn;
        const atg = function* (f) { yield* batg(f); const c = R.C[R.K]; R.C = c; R.K = key; };
        return { t: fld.type, atg, g: function* (f) { yield* atg(f); return R.C[R.K]; } };
      }
      // rvalue struct (e.g. returned from a function)
      return mk(fld.type, [base], (v) => v[key]);
    }
    if (ot.k === 'class') {
      const fd = ot.cls.fields?.[node.name];
      if (fd) {
        const t = typeFromString(fd);
        const key = node.name;
        const bs = base.s ?? null;
        if (bs && !base.g) {
          const at = (f) => { const c = bs(f); R.C = c; R.K = key; };
          return { t, at, s: (f) => bs(f)[key] };
        }
        return mk(t, [base], (v) => v[key]);
      }
      if (ot.cls.methods?.[node.name]) { error(node, `invalid use of non-static member function '${ot.cls.name}::${node.name}'`, `Call it with parentheses: ${exprText(node.obj)}.${node.name}()`); return errE(); }
      error(node, `'class ${ot.cls.cppName ?? ot.cls.name}' has no member named '${node.name}'`);
      return errE();
    }
    error(node, `request for member '${node.name}' in '${exprText(node.obj)}', which is of non-class type '${typeName(o.t)}'`);
    return errE();
  }

  function classConstruct(cls, args, scope, node) {
    const t = classType(cls);
    const argEs = args.map((a) => ex(a, scope));
    if (argEs.some((a) => a.t === ERR)) return errE();
    if (cls.name === 'String') {
      // String(), String(x), String(x, base|decimals)
      if (argEs.length === 0) return { t, s: () => new AStr('') };
      const a = argEs[0];
      const ca = canon(a.t);
      if (argEs.length > 2) { error(node, `no matching function for call to 'String(...)'`); return errE(); }
      const second = argEs[1] ? conv(argEs[1], T.uchar, node) : null;
      if (isString(ca)) return mk(t, [a], (v) => new AStr(v.s));
      if (ca.k === 'array' || ca.k === 'ptr') return mk(t, [a], (v) => new AStr(cstr(v)));
      if (isArith(ca)) {
        const at = a.t;
        if (second) return mk(t, [a, second], (v, b) => new AStr(isFloat(ca) ? textOf(v, at, T, { forString: true, digits: b }) : textOf(v, at, T, { base: b, forString: true })));
        return mk(t, [a], (v) => new AStr(textOf(v, at, T, { forString: true })));
      }
      if (ca.k === 'class' && ca.cls.printTo) return mk(t, [a], (v) => new AStr(ca.cls.printTo(v)));
      error(node, `no matching function for call to 'String(${typeName(a.t)})'`);
      return errE();
    }
    const ctors = cls.ctors ?? ['()'];
    const pick = pickSig(ctors, argEs, node, cls.name);
    if (!pick) return errE();
    const list = libArgs(pick.sig, argEs, node);
    const idx = pick.idx;
    const types = argEs.map((a) => a.t);
    const impl = cls.construct;
    return callImpl(isGen(impl) ? impl : (vm, ...v) => impl(vm, v, types, idx), t, list, null, node);
  }

  /** Initializer for a value of type t (brace lists, string → char array, conversions). */
  function initE(node, t, scope) {
    const c = canon(t);
    if (node.kind === 'initlist') {
      if (c.k === 'array') {
        const n = c.len ?? node.items.length;
        if (node.items.length > n) { error(node, `too many initializers for '${typeName(t, { aka: false })}'`, `The array holds ${n} elements but the list has ${node.items.length}.`); return errE(); }
        const items = node.items.map((it) => initE(it, c.of, scope));
        const el = c.of;
        const fill = n - items.length;
        return mk(t, items, (...vs) => { const a = vs; for (let i = 0; i < fill; i++) a.push(zeroValue(el)); return a; });
      }
      if (c.k === 'struct') {
        if (node.items.length > c.fields.length) { error(node, `too many initializers for '${c.name}'`); return errE(); }
        const items = node.items.map((it, i) => initE(it, c.fields[i].type, scope));
        const fields = c.fields;
        return mk(t, items, (...vs) => {
          const o = {};
          fields.forEach((fd, i) => { o[fd.name] = i < vs.length ? vs[i] : zeroValue(fd.type); });
          return o;
        });
      }
      if (c.k === 'class') return classConstruct(c.cls, node.items, scope, node);
      if (node.items.length === 0) return constE(t, zeroValue(t));
      if (node.items.length > 1) { error(node, `scalar object initialized with a list of ${node.items.length} values`); return errE(); }
      const e = ex(node.items[0], scope);
      // narrowing check for braces
      if (e.cv !== undefined && isInt(c) && isInt(canon(e.t)) && !fitsIn(e.cv, c)) error(node, `narrowing conversion of '${e.cv}' from '${typeName(e.t)}' to '${typeName(t)}'`);
      return conv(e, t, node);
    }
    if (c.k === 'array') {
      const e = ex(node, scope);
      if (e.t === ERR) return errE();
      if (e.isStrLit && isCharLike(c.of)) {
        const bytes = e.strVal;
        const n = c.len ?? bytes.length + 1;
        if (bytes.length > n) error(node, `initializer-string for array of chars is too long`, `"${bytes}" needs ${bytes.length + 1} chars including the hidden '\\0' at the end.`);
        return { t, s: () => { const a = new Array(n).fill(0); for (let i = 0; i < Math.min(n, bytes.length); i++) a[i] = (bytes.charCodeAt(i) << 24) >> 24; return a; } };
      }
      error(node, `array must be initialized with a brace-enclosed initializer`);
      return errE();
    }
    const e = ex(node, scope);
    return conv(e, t, node);
  }

  function lambdaE(node, scope) {
    const id = ++lambdaCount;
    const info = newFn(`lambda#${id}`, node.retType ? applyDeclarator(resolveSpec(node.retType.spec, scope), node.retType.decl, scope) : null, node.params, scope, node);
    info.isLambda = true;
    info.captures = node.captures.length > 0;
    info.parentFn = curFn;
    compileBody(info, node.body, scope);
    const capt = info.captures;
    return { t: { k: 'fn', ret: info.ret, params: info.params.map((p) => p.type), size: T.ptrSize }, s: (f) => new FnRef(info, capt ? f : null), lambda: info };
  }

  // ------------------------------------------------------------------ functions
  function newFn(name, ret, params, scope, node) {
    const fnCtx = { name, ret, params: [], node, nslots: 0, locals: [], line: node.line, endLine: node.body?.endLine ?? node.endLine, parentFn: null };
    const pscope = new Scope(scope, fnCtx);
    for (const p of params) {
      if (p.variadic) { error(p, 'variadic functions are not supported in the simulator'); continue; }
      let t = paramType(p, pscope);
      const ref = p.decl.ref;
      const constRef = ref && p.spec.const;
      if (canon(t).k === 'void' && !p.decl.ptr.length) { error(p, `invalid use of type 'void' in parameter declaration`); continue; }
      const slot = fnCtx.nslots++;
      const def = p.decl.def;
      const sym = { kind: 'var', name: p.decl.name ?? `#p${slot}`, type: t, where: 'l', slot, ref, constRef, isConst: !!p.spec.const && !ref ? true : !!constRef, fn: fnCtx, line: p.line };
      fnCtx.params.push({ name: sym.name, type: t, ref, constRef, def, line: p.line });
      if (p.decl.name) {
        if (pscope.vars.has(p.decl.name)) error(p, `redefinition of '${typeName(t)} ${p.decl.name}'`);
        pscope.vars.set(p.decl.name, sym);
        fnCtx.locals.push({ name: p.decl.name, type: t, slot, ref, line: p.line, from: fnCtx.line, to: fnCtx.endLine ?? 1e9, param: true });
      }
    }
    fnCtx.scope = pscope;
    return fnCtx;
  }

  let curCondition = false;
  let loopDepth = 0, switchDepth = 0;

  function compileBody(info, body, scope) {
    const savedFn = curFn, savedLoop = loopDepth, savedSwitch = switchDepth;
    curFn = info;
    loopDepth = 0; switchDepth = 0;
    const blockS = block(body, info.scope, true);
    curFn = savedFn; loopDepth = savedLoop; switchDepth = savedSwitch;
    if (info.ret === null) info.ret = info.inferredRet ?? T.void;
    const isVoid = canon(info.ret).k === 'void';
    if (!isVoid && !info.isLambda && !alwaysReturns(body) && info.name !== 'main') {
      warn({ line: body.endLine ?? info.line, col: 1 }, `no return statement in function returning non-void [-Wreturn-type]`, `${info.name}() promises to return a ${typeName(info.ret, { aka: false })}. Add a return statement at the end.`);
    }
    const run = blockS.gen;
    const nslots = () => info.nslots;
    const np = info.params.length;
    const ret = info.ret;
    const zero = zeroValue(ret);
    info.run = function* (vm, args, up) {
      const f = { s: new Array(nslots()), g: vm.G, vm, up, rv: zero };
      for (let i = 0; i < np; i++) f.s[i] = args[i];
      vm.enter(info, f);
      yield* run(f);
      vm.leave();
      return f.rv;
    };
  }

  function alwaysReturns(st) {
    if (!st) return false;
    switch (st.kind) {
      case 'return': return true;
      case 'block': return st.body.some(alwaysReturns);
      case 'if': return !!st.els && alwaysReturns(st.then) && alwaysReturns(st.els);
      case 'while': case 'for': return (st.cond == null || (st.cond.kind === 'bool' && st.cond.value) || (st.cond.kind === 'num' && st.cond.tok.v)) && !containsBreak(st.body);
      case 'do': return alwaysReturns(st.body);
      case 'expr': return st.expr.kind === 'call' && st.expr.callee.kind === 'ident' && ['abort', 'exit', 'esp_deep_sleep_start'].includes(st.expr.callee.name);
      case 'switch': return false;
      default: return false;
    }
  }
  function containsBreak(st) {
    if (!st) return false;
    if (st.kind === 'break') return true;
    if (st.kind === 'block') return st.body.some(containsBreak);
    if (st.kind === 'if') return containsBreak(st.then) || containsBreak(st.els);
    return false;
  }

  // ------------------------------------------------------------------ statements
  // Compiled statement: { line, sync?: (f) => code, gen?: function*(f) => code, tick: bool }
  function block(node, scope, isFnBody = false) {
    const sc = isFnBody ? new Scope(scope, curFn) : new Scope(scope, curFn);
    sc.from = node.line; sc.to = node.endLine;
    const stmts = [];
    for (const s of node.body) {
      const c = stmt(s, sc);
      if (c) stmts.push(c);
    }
    return { line: node.line, gen: seq(stmts) };
  }

  /** Run statements in order, ticking (debugger / budget) before each. */
  function seq(stmts) {
    const n = stmts.length;
    const lines = stmts.map((s) => s.line);
    const syncs = stmts.map((s) => s.sync ?? null);
    const gens = stmts.map((s) => s.gen ?? null);
    const ticks = stmts.map((s) => s.tick !== false);
    return function* (f) {
      const vm = f.vm;
      for (let i = 0; i < n; i++) {
        if (ticks[i] && vm.tick(lines[i])) yield 0;
        const sy = syncs[i];
        const r = sy ? sy(f) : yield* gens[i](f);
        if (r) return r;
      }
      return 0;
    };
  }

  function exprStmt(e, line) {
    if (e.g) { const g = e.g; return { line, gen: function* (f) { yield* g(f); return 0; } }; }
    const s = e.s;
    return { line, sync: (f) => { s(f); return 0; } };
  }

  function declareLocal(spec, d, scope, node) {
    let base = resolveSpec(spec, scope);
    if (base === ERR) { if (d.init && d.init.kind !== 'initlist') ex(d.init, scope); return null; }
    if (d.params) {
      // local function prototype: register in global function table
      declareFunction({ spec, decl: d, line: d.line, col: d.col, name: d.name, kind: 'proto' }, globalScope);
      return null;
    }
    let t = applyDeclarator(base, d, scope);
    const isAuto = canon(base).k === 'any';
    if (d.ref && !d.init) { error(d, `'${d.name}' declared as reference but not initialized`); return null; }
    if (canon(t).k === 'void') { error(d, `variable or field '${d.name}' declared void`); return null; }
    if (canon(t).k === 'array' && canon(t).len == null) {
      if (d.init?.kind === 'initlist') t = arrayOf(canon(t).of, d.init.items.length);
      else if (d.init?.kind === 'str') t = arrayOf(canon(t).of, charArray(d.init.value).length);
      else { error(d, `storage size of '${d.name}' isn't known`, 'Give the array a size: int values[10];'); return null; }
    }
    if (spec.const && !d.init && !d.ctorArgs && canon(t).k !== 'class' && !d.ptr.length) error(d, `uninitialized const '${d.name}'`, 'A const variable needs a value: const int X = 5;');
    if (scope.vars.has(d.name) && scope.vars.get(d.name).kind === 'var') {
      const prevSym = scope.vars.get(d.name);
      error(d, `redeclaration of '${typeName(t, { aka: false })} ${d.name}'`, `'${d.name}' was already declared on line ${prevSym.line}. Remove the type name to assign to the existing variable: ${d.name} = …`);
    }
    // initializer expression
    let initX = null;
    if (d.ref) {
      const target = ex(d.init, scope);
      if (target.t === ERR) return null;
      if (isAuto) t = target.t;
      const loc = locator(target);
      if (!loc) { error(d, `cannot bind non-const lvalue reference to an rvalue`); return null; }
      initX = loc.sync ? { s: (f) => { loc.fn(f); return new Ptr(R.C, R.K); } } : { g: function* (f) { yield* loc.fn(f); return new Ptr(R.C, R.K); } };
    } else if (d.ctorArgs) {
      const c = canon(t);
      if (c.k === 'class') initX = classConstruct(c.cls, d.ctorArgs, scope, d);
      else if (d.ctorArgs.length === 1) initX = conv(ex(d.ctorArgs[0], scope), t, d);
      else { error(d, `expression list treated as compound expression in initializer`); initX = errE(); }
    } else if (d.init) {
      if (isAuto) {
        const e = ex(d.init, scope);
        t = canon(e.t).k === 'array' ? decay(e.t) : e.t;
        initX = conv(e, t, d.init);
      } else {
        curCondition = false;
        initX = initE(d.init, t, scope);
      }
    } else if (isAuto) { error(d, `declaration of 'auto ${d.name}' has no initializer`); return null; }
    if (initX?.t === ERR) initX = null;
    return { t, initX };
  }

  function stmt(node, scope) {
    curCondition = false;
    const line = node.line;
    switch (node.kind) {
      case 'empty': return null;
      case 'block': {
        const b = block(node, scope);
        return { line, gen: b.gen, tick: false };
      }
      case 'typedef': {
        const t = applyDeclarator(resolveSpec(node.spec, scope), node.decl, scope);
        scope.vars.set(node.name, { kind: 'type', type: t === ERR ? ERR : { ...t, alias: node.name, base: t } });
        return null;
      }
      case 'expr': {
        const e = ex(node.expr, scope);
        if (e.t === ERR) return null;
        if (!e.g && e.fnSet && node.expr.kind === 'ident') warn(node, `statement is a reference, not call, to function '${node.expr.name}' [-Waddress]`, `Add () to call it: ${node.expr.name}();`);
        else if (node.expr.kind === 'binary' && ['==', '!=', '<', '>', '<=', '>='].includes(node.expr.op)) warn(node, 'value computed is not used [-Wunused-value]', node.expr.op === '==' ? 'Did you mean = (assignment) instead of == (comparison)?' : undefined);
        return exprStmt(e, line);
      }
      case 'decl': {
        if (node.spec.structDef || node.spec.enumDef) resolveSpec(node.spec, scope);
        const parts = [];
        for (const d of node.decls) {
          if (node.spec.static) {
            // static local: lives in global storage, initialised once
            const r = declareLocal(node.spec, d, scope, node);
            if (!r) continue;
            const slot = globals.length;
            const sym = { kind: 'var', name: d.name, type: r.t, where: 'g', slot, isConst: !!node.spec.const && !d.ptr.length, line: d.line };
            globals.push({ name: `${curFn?.name ?? ''}::${d.name}`, type: r.t, slot, line: d.line, staticLocal: true, sym });
            scope.vars.set(d.name, sym);
            const flag = globals.length;
            globals.push({ name: `#init:${d.name}`, type: T.bool, slot: flag, hidden: true });
            if (r.initX) {
              const ie = r.initX;
              if (ie.cv !== undefined) { globals[slot].initConst = ie.cv; continue; }
              const ig = gen(ie);
              parts.push({ line: d.line, gen: function* (f) { if (!f.g[flag]) { f.g[flag] = 1; f.g[slot] = yield* ig(f); } return 0; } });
            }
            continue;
          }
          const r = declareLocal(node.spec, d, scope, node);
          if (!r) continue;
          const fnCtx = curFn;
          const slot = fnCtx ? fnCtx.nslots++ : 0;
          const sym = { kind: 'var', name: d.name, type: r.t, where: 'l', slot, ref: !!d.ref, isConst: !!node.spec.const && !d.ptr.length && !d.ref, fn: fnCtx, line: d.line };
          if (sym.isConst && r.initX?.cv !== undefined && isArith(canon(r.t))) sym.cv = r.initX.cv;
          scope.vars.set(d.name, sym);
          fnCtx?.locals.push({ name: d.name, type: r.t, slot, ref: !!d.ref, line: d.line, from: d.line, to: scope.to ?? fnCtx.endLine ?? 1e9 });
          const t = r.t;
          if (r.initX) {
            const ie = r.initX;
            if (ie.g) { const g = ie.g; parts.push({ line: d.line, gen: function* (f) { f.s[slot] = yield* g(f); return 0; } }); }
            else { const s = ie.s; parts.push({ line: d.line, sync: (f) => { f.s[slot] = s(f); return 0; } }); }
          } else {
            const c = canon(t);
            if (c.k === 'class') {
              const ce = classConstruct(c.cls, [], scope, d);
              if (ce.t !== ERR) {
                if (ce.g) { const g = ce.g; parts.push({ line: d.line, gen: function* (f) { f.s[slot] = yield* g(f); return 0; }, tick: false }); }
                else { const s = ce.s; parts.push({ line: d.line, sync: (f) => { f.s[slot] = s(f); return 0; }, tick: false }); }
              }
            } else if (c.k === 'array' || c.k === 'struct') {
              parts.push({ line: d.line, sync: (f) => { f.s[slot] = zeroValue(t); return 0; }, tick: false });
            } else {
              parts.push({ line: d.line, sync: (f) => { f.s[slot] = 0; return 0; }, tick: false });
            }
          }
        }
        if (!parts.length) return null;
        if (parts.length === 1) return parts[0];
        const g = seq(parts.map((p, i) => ({ ...p, tick: i > 0 && p.tick !== false })));
        return { line, gen: g, tick: parts[0].tick !== false };
      }
      case 'if': {
        const sc = new Scope(scope, curFn);
        const cond = condition(node.cond, sc);
        if (node.then.kind === 'empty') warn(node.then, "suggest braces around empty body in an 'if' statement [-Wempty-body]", 'The ; right after if (...) ends the if. Remove it.');
        const th = sub(node.then, sc);
        const el = node.els ? sub(node.els, sc) : null;
        const c = cond;
        if (c.cv !== undefined && !c.g) {
          // still compile both branches for diagnostics; run only the live one
        }
        const cg = c.g, cs = c.s;
        const thG = th, elG = el;
        return {
          line,
          gen: function* (f) {
            const v = cg ? yield* cg(f) : cs(f);
            if (v) return yield* thG(f);
            if (elG) return yield* elG(f);
            return 0;
          },
        };
      }
      case 'while': {
        const sc = new Scope(scope, curFn);
        const cond = condition(node.cond, sc);
        if (node.body.kind === 'empty' && !(cond.cv)) warn(node.body, "suggest braces around empty body in a 'while' statement [-Wempty-body]", 'The ; right after while (...) makes an empty loop. Remove it if the loop has a body.');
        loopDepth++;
        const body = sub(node.body, sc);
        loopDepth--;
        const cg = cond.g, cs = cond.s;
        const bodyTicks = node.body.kind === 'empty';
        return {
          line,
          gen: function* (f) {
            const vm = f.vm;
            for (let first = true; ; first = false) {
              if (!first && vm.tick(line)) yield 0;
              const v = cg ? yield* cg(f) : cs(f);
              if (!v) return 0;
              const r = yield* body(f);
              if (r === BREAK) return 0;
              if (r === RETURN) return r;
              if (bodyTicks && vm.tick(line)) yield 0;
            }
          },
        };
      }
      case 'do': {
        loopDepth++;
        const body = sub(node.body, scope);
        loopDepth--;
        const cond = condition(node.cond, scope);
        const cg = cond.g, cs = cond.s;
        const cl = node.condLine ?? line;
        return {
          line,
          gen: function* (f) {
            const vm = f.vm;
            for (;;) {
              const r = yield* body(f);
              if (r === BREAK) return 0;
              if (r === RETURN) return r;
              if (vm.tick(cl)) yield 0;
              const v = cg ? yield* cg(f) : cs(f);
              if (!v) return 0;
            }
          },
        };
      }
      case 'for': {
        const sc = new Scope(scope, curFn);
        sc.from = node.line; sc.to = blockEnd(node.body);
        const init = node.init ? stmt(node.init, sc) : null;
        const cond = node.cond ? condition(node.cond, sc) : null;
        curCondition = false;
        const step = node.step ? ex(node.step, sc) : null;
        if (node.body.kind === 'empty' && node.cond) warn(node.body, "suggest braces around empty body in a 'for' statement [-Wempty-body]", 'The ; right after for (...) makes the loop do nothing. Remove it.');
        loopDepth++;
        const body = sub(node.body, sc);
        loopDepth--;
        const initS = init?.sync, initG = init?.gen;
        const cg = cond?.g, cs = cond?.s;
        const stS = step && !step.g ? step.s : null, stG = step?.g;
        return {
          line,
          gen: function* (f) {
            const vm = f.vm;
            if (initS) initS(f); else if (initG) yield* initG(f);
            for (let first = true; ; first = false) {
              if (!first && vm.tick(line)) yield 0;
              if (cond) { const v = cg ? yield* cg(f) : cs(f); if (!v) return 0; }
              const r = yield* body(f);
              if (r === BREAK) return 0;
              if (r === RETURN) return r;
              if (stS) stS(f); else if (stG) yield* stG(f);
            }
          },
        };
      }
      case 'rangefor': {
        const sc = new Scope(scope, curFn);
        sc.from = node.line; sc.to = blockEnd(node.body);
        let range;
        if (node.range.kind === 'initlist') {
          let it0 = resolveSpec(node.spec, sc);
          if (canon(it0).k === 'any') it0 = node.range.items.length ? ex(node.range.items[0], sc).t : T.int;
          range = initE(node.range, arrayOf(it0, node.range.items.length), sc);
        } else range = ex(node.range, sc);
        if (range.t === ERR) return null;
        let rt = canon(range.t);
        if (rt.k === 'class' && rt.cls.iterate) {
          const elT0 = typeFromString(rt.cls.elemType);
          const itf = rt.cls.iterate;
          range = mk(arrayOf(elT0, null), [range], (v) => itf(v));
          rt = canon(range.t);
        }
        if (rt.k !== 'array' && !isString(rt)) { error(node.range, `'begin' was not declared in this scope`, 'A range-based for loop needs an array.'); return null; }
        const elT = isString(rt) ? T.char : rt.of;
        let t = resolveSpec(node.spec, sc);
        if (canon(t).k === 'any') t = elT;
        t = applyDeclarator(t, { ...node.decl, dims: [] }, sc);
        const slot = curFn.nslots++;
        const ref = !!node.decl.ref;
        const sym = { kind: 'var', name: node.decl.name, type: t, where: 'l', slot, ref, isConst: !!node.spec.const, fn: curFn, line: node.line };
        sc.vars.set(node.decl.name, sym);
        curFn.locals.push({ name: node.decl.name, type: t, slot, ref, line: node.line, from: node.line, to: sc.to ?? 1e9 });
        const cv = ref ? null : converter(elT, t);
        loopDepth++;
        const body = sub(node.body, sc);
        loopDepth--;
        const rg = gen(range);
        const str = isString(rt);
        return {
          line,
          gen: function* (f) {
            const vm = f.vm;
            const arr = yield* rg(f);
            const n = str ? arr.s.length : arr.length;
            for (let i = 0; i < n; i++) {
              if (i > 0 && vm.tick(line)) yield 0;
              if (str) f.s[slot] = arr.s.charCodeAt(i);
              else f.s[slot] = ref ? new Ptr(arr, i) : cv ? cv(arr[i]) : cloneValue(arr[i], elT);
              const r = yield* body(f);
              if (r === BREAK) return 0;
              if (r === RETURN) return r;
            }
            return 0;
          },
        };
      }
      case 'switch': {
        const sc = new Scope(scope, curFn);
        const ce = ex(node.cond, sc);
        if (ce.t === ERR) return null;
        if (!isInt(canon(ce.t))) { error(node.cond, `switch quantity not an integer`, canon(ce.t).k === 'class' ? 'switch only works with whole numbers, chars and enums. Use if / else if to compare Strings.' : undefined); return null; }
        const cond = conv(ce, promote(canon(ce.t), T), node.cond);
        const bodyNode = node.body.kind === 'block' ? node.body : { kind: 'block', body: [node.body], line: node.body.line, endLine: node.body.line };
        const inner = new Scope(sc, curFn);
        inner.from = bodyNode.line; inner.to = bodyNode.endLine;
        const stmts = [];
        const cases = new Map();
        let ranges = [];
        let def = -1;
        switchDepth++;
        for (const s of bodyNode.body) {
          if (s.kind === 'case') {
            const v = ex(s.value, inner);
            if (v.cv === undefined) { if (v.t !== ERR) error(s, 'case label does not reduce to an integer constant', 'A case label must be a constant: a number, a char like \'a\', an enum or a const int.'); continue; }
            const key = numConverter(v.t, cond.t)(v.cv);
            if (s.hi) { const h = ex(s.hi, inner); ranges.push([key, h.cv, stmts.length]); continue; }
            if (cases.has(key)) error(s, `duplicate case value`, `case ${v.cv}: appears twice in this switch.`);
            cases.set(key, stmts.length);
            continue;
          }
          if (s.kind === 'default') { if (def >= 0) error(s, `multiple default labels in one switch`); def = stmts.length; continue; }
          if (s.kind === 'decl' && s.decls.some((d) => d.init || d.ctorArgs) && (cases.size || def >= 0)) {
            // jumping past an initialisation is an error in C++ if a later label exists; we check at the next label
            s.needsScopeCheck = true;
          }
          const c = stmt(s, inner);
          if (c) stmts.push(c);
          else stmts.push({ line: s.line, sync: () => 0, tick: false });
        }
        switchDepth--;
        const n = stmts.length;
        const syncs = stmts.map((s) => s.sync ?? null), gens = stmts.map((s) => s.gen ?? null), lines = stmts.map((s) => s.line), ticks = stmts.map((s) => s.tick !== false);
        const cg = cond.g, cs = cond.s;
        return {
          line,
          gen: function* (f) {
            const vm = f.vm;
            const v = cg ? yield* cg(f) : cs(f);
            let start = cases.get(v);
            if (start === undefined) for (const [lo, hi, at] of ranges) if (v >= lo && v <= hi) { start = at; break; }
            if (start === undefined) start = def;
            if (start < 0) return 0;
            for (let i = start; i < n; i++) {
              if (ticks[i] && vm.tick(lines[i])) yield 0;
              const r = syncs[i] ? syncs[i](f) : yield* gens[i](f);
              if (r === BREAK) return 0;
              if (r) return r;
            }
            return 0;
          },
        };
      }
      case 'case': case 'default':
        error(node, `case label not within a switch statement`);
        return null;
      case 'break':
        if (!loopDepth && !switchDepth) { error(node, 'break statement not within loop or switch'); return null; }
        return { line, sync: () => BREAK };
      case 'continue':
        if (!loopDepth) { error(node, 'continue statement not within a loop'); return null; }
        return { line, sync: () => CONTINUE };
      case 'return': {
        const fn = curFn;
        if (!fn) return null;
        if (!node.value) {
          if (fn.ret && canon(fn.ret).k !== 'void') warn(node, `return-statement with no value, in function returning '${typeName(fn.ret)}' [-fpermissive]`);
          return { line, sync: () => RETURN };
        }
        if (fn.ret === null) {
          // lambda: infer
          const e = ex(node.value, scope);
          fn.inferredRet = e.t;
          fn.ret = e.t;
        }
        if (canon(fn.ret).k === 'void') {
          const e = ex(node.value, scope);
          if (e.t !== ERR && canon(e.t).k !== 'void') error(node, `return-statement with a value, in function returning 'void' [-fpermissive]`, `${fn.name}() is declared void, so it can't return a value. Change void to the type you want to return.`);
          return exprStmt(e, line);
        }
        const e = initE(node.value, fn.ret, scope);
        if (e.t === ERR) return null;
        if (e.g) { const g = e.g; return { line, gen: function* (f) { f.rv = yield* g(f); return RETURN; } }; }
        const s = e.s;
        return { line, sync: (f) => { f.rv = s(f); return RETURN; } };
      }
      default:
        error(node, `unsupported statement (${node.kind})`);
        return null;
    }
  }

  function blockEnd(n) { return n?.endLine ?? n?.line; }

  /** A sub-statement (if/loop body) as a generator; blocks get their own scope. */
  function sub(node, scope) {
    if (node.kind === 'block') return block(node, scope).gen;
    const sc = new Scope(scope, curFn);
    const c = stmt(node, sc);
    if (!c) return function* () { return 0; };
    return seq([c]);
  }

  function condition(node, scope) {
    if (node.kind === 'condDecl') {
      const r = declareLocal(node.spec, node.decl, scope, node);
      if (!r) return { t: T.bool, s: () => 0 };
      const slot = curFn.nslots++;
      const sym = { kind: 'var', name: node.decl.name, type: r.t, where: 'l', slot, fn: curFn, line: node.line };
      scope.vars.set(node.decl.name, sym);
      const tv = truth({ t: r.t, s: (f) => f.s[slot] }, node);
      const ie = r.initX ?? { s: () => 0 };
      return { t: T.bool, g: function* (f) { f.s[slot] = ie.g ? yield* ie.g(f) : ie.s(f); return tv.s(f); } };
    }
    curCondition = node.kind === 'assign';
    const e = ex(node, scope);
    curCondition = false;
    return truth(e, node);
  }

  // ------------------------------------------------------------------ top level
  function declareFunction(d, scope) {
    const name = d.name;
    let ret = resolveSpec(d.spec, scope);
    if (ret === ERR) ret = T.int;
    ret = applyDeclarator(ret, { ...d.decl, params: undefined, dims: [] }, scope);
    if (canon(ret).k === 'any') { error(d, `'${name}' function uses 'auto' type specifier without trailing return type`); ret = T.int; }
    const info = newFn(name, ret, d.decl.params, globalScope, d.kind === 'func' ? d : { ...d, body: null });
    info.line = d.line;
    info.endLine = d.endLine;
    if (registry.lookup(name, board)?.kind === 'fn' && name !== 'setup' && name !== 'loop') {
      const rq = registry.lookup(name, board);
      if (!rq.header || rq.header.some((h) => included.has(h))) {
        error(d, `'${name}' is already a built-in Arduino function`, `Pick another name for your function, e.g. my${name[0].toUpperCase()}${name.slice(1)}.`);
      }
    }
    const list = functions.get(name) ?? [];
    const same = list.find((o) => o.params.length === info.params.length && o.params.every((p, i) => sameType(p.type, info.params[i].type)));
    if (same) {
      if (d.kind === 'func' && same.defined) { error(d, `redefinition of '${fnSig(info)}'`, `${name}() is already defined on line ${same.line}. A sketch can only have one ${name}().`); return null; }
      if (!sameType(same.ret, info.ret)) error(d, `ambiguating new declaration of '${fnSig(info)}'`);
      if (d.kind === 'func') { same.defined = true; same.node = d; same.line = d.line; same.endLine = d.endLine; same.scope = info.scope; same.params = info.params; same.locals = info.locals; same.nslots = info.nslots; }
      return same;
    }
    if (d.kind === 'func') info.defined = true;
    list.push(info);
    functions.set(name, list);
    const sym = globalScope.vars.get(name);
    if (sym && sym.kind !== 'fn') { error(d, `'${fnSig(info)}' redeclared as different kind of symbol`); return info; }
    globalScope.vars.set(name, { kind: 'fn', name, overloads: list });
    return info;
  }

  const globalInits = []; // { line, gen }
  function declareGlobal(node) {
    if (node.spec.structDef || node.spec.enumDef) resolveSpec(node.spec, globalScope);
    if (!node.decls.length) {
      if (!node.spec.structDef && !node.spec.enumDef && !node.spec.structRef) warn(node, 'declaration does not declare anything');
      return;
    }
    for (const d of node.decls) {
      const r = declareLocal(node.spec, d, globalScope, node);
      if (!r) continue;
      if (globalScope.vars.has(d.name)) {
        const prevSym = globalScope.vars.get(d.name);
        if (prevSym.kind === 'var') { error(d, `redefinition of '${typeName(r.t, { aka: false })} ${d.name}'`, `'${d.name}' was already declared on line ${prevSym.line}.`); continue; }
        if (prevSym.kind === 'fn') { error(d, `'${typeName(r.t, { aka: false })} ${d.name}' redeclared as different kind of symbol`, `There is already a function called ${d.name}().`); continue; }
      }
      const rq = registry.lookup(d.name, board);
      if (rq && (rq.kind === 'const' || rq.kind === 'fn' || rq.kind === 'obj') && (!rq.header || rq.header.some((h) => included.has(h)))) {
        if (rq.kind === 'const') { error(d, `expected unqualified-id before numeric constant`, `${d.name} is already defined by Arduino (it is a built-in constant). Pick another name.`); continue; }
        if (rq.kind === 'obj') { error(d, `conflicting declaration '${typeName(r.t, { aka: false })} ${d.name}'`, `${d.name} is already a built-in object. Pick another name.`); continue; }
      }
      const slot = globals.length;
      const sym = { kind: 'var', name: d.name, type: r.t, where: 'g', slot, ref: !!d.ref, isConst: !!node.spec.const && !d.ptr.length && !d.ref, line: d.line, col: d.col };
      if (sym.isConst && r.initX?.cv !== undefined && isArith(canon(r.t))) sym.cv = r.initX.cv;
      const g = { name: d.name, type: r.t, slot, line: d.line, rtc: !!node.spec.rtc, sym, isConst: sym.isConst, volatile: !!node.spec.volatile };
      globals.push(g);
      globalScope.vars.set(d.name, sym);
      if (r.initX) {
        const ie = r.initX;
        if (ie.cv !== undefined && !ie.g) g.initConst = ie.cv;
        else g.init = gen(ie);
      } else {
        const c = canon(r.t);
        if (c.k === 'class') {
          const ce = classConstruct(c.cls, [], globalScope, d);
          if (ce.t !== ERR) g.init = gen(ce);
        }
      }
    }
  }

  // ---- pass 1: hoist function signatures and record where globals are declared
  for (const d of ast.decls) {
    if (d.kind === 'decl') for (const x of d.decls) if (!x.params && x.name) globalsLater.set(x.name, x.line);
  }
  // types and functions must be visible in order, but Arduino hoists function prototypes
  const order = [];
  for (const d of ast.decls) {
    try {
      if (d.kind === 'func' || d.kind === 'proto') {
        // resolve types declared before this point only
        const info = declareFunction(d, globalScope);
        if (info && d.kind === 'func') order.push({ d, info });
      } else if (d.kind === 'decl') {
        if (d.decls.some((x) => x.params)) {
          for (const x of d.decls) if (x.params) declareFunction({ spec: d.spec, decl: x, line: x.line, col: x.col, name: x.name, kind: 'proto' }, globalScope);
          continue;
        }
        globalsLater.forEach((line, name) => { if (d.decls.some((x) => x.name === name)) globalsLater.delete(name); });
        declareGlobal(d);
        // a function defined after this global can see it; record order
        order.push({ global: d });
      } else if (d.kind === 'typedef') {
        const t = applyDeclarator(resolveSpec(d.spec, globalScope), d.decl, globalScope);
        globalScope.vars.set(d.name, { kind: 'type', type: t === ERR ? ERR : { ...t, alias: d.name, base: t } });
      }
    } catch (e) {
      if (!(e instanceof Bail)) throw e;
    }
  }
  // ---- pass 2: compile function bodies (globals declared later in the file are not visible)
  for (const { d, info } of order) {
    if (!d) continue;
    // hide globals declared after the function
    const hidden = [];
    for (const g of globals) {
      if (g.line > d.line && g.sym && !g.isLib && !g.staticLocal && globalScope.vars.get(g.name) === g.sym) { hidden.push(g); globalScope.vars.delete(g.name); globalsLater.set(g.name, g.line); }
    }
    try { compileBody(info, d.body, globalScope); } catch (e) { if (!(e instanceof Bail)) throw e; }
    for (const g of hidden) { globalScope.vars.set(g.name, g.sym); globalsLater.delete(g.name); }
  }

  // ---- checks
  for (const [name, list] of functions) {
    for (const info of list) if (!info.defined && info.run === undefined) {
      info.run = function* (vm) { vm.fail(`undefined reference to \`${name}'`); };
      if (info.usedUndefined) error({ line: info.line, col: 1 }, `undefined reference to \`${name}'`);
    }
  }
  const setupFn = functions.get('setup')?.find((f) => f.params.length === 0 && f.defined);
  const loopFn = functions.get('loop')?.find((f) => f.params.length === 0 && f.defined);
  const hasErrors = diagnostics.some((d) => d.severity === 'error');
  if (!hasErrors) {
    if (!setupFn) error({ line: 1, col: 1 }, "undefined reference to `setup'", 'Every Arduino sketch needs a void setup() { } function, even if it is empty.');
    if (!loopFn) error({ line: 1, col: 1 }, "undefined reference to `loop'", 'Every Arduino sketch needs a void loop() { } function, even if it is empty.');
    for (const f of [setupFn, loopFn]) if (f && canon(f.ret).k !== 'void') warn({ line: f.line, col: 1 }, `${f.name}() should return void`);
  }

  return { T, globals, functions, setupFn, loopFn, structs };
}
