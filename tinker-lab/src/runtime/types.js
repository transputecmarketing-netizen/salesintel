// C++ types for the boards Tinker Lab simulates, with the real widths:
// AVR (Uno, Nano, Mega): int 16-bit, long 32-bit, double == float (32-bit), pointers 16-bit.
// ESP32 / ESP8266 / Uno R4: int 32-bit, long 32-bit, double 64-bit, pointers 32-bit.

export const BOARDS = {
  uno: { arch: 'avr', name: 'Arduino Uno', ram: 2048, eeprom: 1024, pwm: [3, 5, 6, 9, 10, 11], analogBase: 14, analogCount: 6, digitalCount: 20, interrupts: { 2: 0, 3: 1 }, adcBits: 10 },
  nano: { arch: 'avr', name: 'Arduino Nano', ram: 2048, eeprom: 1024, pwm: [3, 5, 6, 9, 10, 11], analogBase: 14, analogCount: 8, digitalCount: 22, interrupts: { 2: 0, 3: 1 }, adcBits: 10 },
  mega: { arch: 'avr', name: 'Arduino Mega 2560', ram: 8192, eeprom: 4096, pwm: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 44, 45, 46], analogBase: 54, analogCount: 16, digitalCount: 70, interrupts: { 2: 0, 3: 1, 21: 2, 20: 3, 19: 4, 18: 5 }, adcBits: 10, serials: 3 },
  esp32: { arch: 'esp32', name: 'ESP32 DevKit', ram: 8192, eeprom: 4096, pwm: 'all', analogBase: null, analogCount: 0, digitalCount: 40, interrupts: 'all', adcBits: 12, serials: 2, builtinLed: 2 },
  nodemcu: { arch: 'esp8266', name: 'NodeMCU ESP8266', ram: 4096, eeprom: 4096, pwm: 'all', analogBase: 17, analogCount: 1, digitalCount: 17, interrupts: 'all', adcBits: 10, builtinLed: 2 },
  unor4: { arch: 'renesas', name: 'Arduino Uno R4 WiFi', ram: 8192, eeprom: 8192, pwm: [3, 5, 6, 9, 10, 11], analogBase: 14, analogCount: 6, digitalCount: 20, interrupts: { 2: 0, 3: 1 }, adcBits: 10, serials: 1 },
};

export function boardInfo(board) {
  return BOARDS[board] ?? BOARDS.uno;
}

/** Build the type table for a board. */
export function makeTypes(board) {
  const info = boardInfo(board);
  const avr = info.arch === 'avr';
  const I = (name, bits, unsigned, rank, extra = {}) => ({ k: 'int', name, bits, unsigned, rank, size: bits / 8, ...extra });
  const T = {
    void: { k: 'void', name: 'void', size: 1 },
    bool: { k: 'int', name: 'bool', bits: 8, unsigned: true, rank: 0, size: 1, isBool: true },
    char: I('char', 8, false, 1, { isChar: true }),
    schar: I('signed char', 8, false, 1),
    uchar: I('unsigned char', 8, true, 1),
    short: I('short int', 16, false, 2),
    ushort: I('short unsigned int', 16, true, 2),
    int: I('int', avr ? 16 : 32, false, 3),
    uint: I('unsigned int', avr ? 16 : 32, true, 3),
    long: I('long int', 32, false, 4),
    ulong: I('long unsigned int', 32, true, 4),
    llong: I('long long int', 64, false, 5),
    ullong: I('long long unsigned int', 64, true, 5),
    float: { k: 'float', name: 'float', bits: 32, size: 4, rank: 1 },
    double: { k: 'float', name: 'double', bits: avr ? 32 : 64, size: avr ? 4 : 8, rank: 2 },
    ldouble: { k: 'float', name: 'long double', bits: avr ? 32 : 64, size: avr ? 4 : 8, rank: 3 },
    nullptr: { k: 'nullptr', name: 'std::nullptr_t', size: avr ? 2 : 4 },
    any: { k: 'any', name: 'auto', size: 0 },
    ptrSize: avr ? 2 : 4,
    avr,
    board,
    info,
  };
  const alias = (name, base) => ({ ...base, alias: name, base });
  T.typedefs = {
    byte: alias('byte', T.uchar),
    boolean: alias('boolean', T.bool),
    uint8_t: alias('uint8_t', T.uchar),
    int8_t: alias('int8_t', T.schar),
    uint16_t: alias('uint16_t', avr ? T.uint : T.ushort),
    int16_t: alias('int16_t', avr ? T.int : T.short),
    uint32_t: alias('uint32_t', T.ulong),
    int32_t: alias('int32_t', T.long),
    uint64_t: alias('uint64_t', T.ullong),
    int64_t: alias('int64_t', T.llong),
    word: alias('word', avr ? T.uint : T.ushort),
    size_t: alias('size_t', T.uint),
    ssize_t: alias('ssize_t', T.int),
    uintptr_t: alias('uintptr_t', T.uint),
    gpio_num_t: alias('gpio_num_t', T.int),
    esp_sleep_wakeup_cause_t: alias('esp_sleep_wakeup_cause_t', T.int),
    PinStatus: alias('PinStatus', T.int),
    pin_size_t: alias('pin_size_t', T.uchar),
  };
  return T;
}

export const ptrTo = (to, T) => ({ k: 'ptr', to, size: T.ptrSize });
export const arrayOf = (of, len) => ({ k: 'array', of, len, size: len == null ? 0 : len * (of.size ?? 0) });
export const refTo = (to) => ({ k: 'ref', to });

export const isInt = (t) => t?.k === 'int' || t?.k === 'enum';
export const isFloat = (t) => t?.k === 'float';
export const isArith = (t) => isInt(t) || isFloat(t);
export const isPtr = (t) => t?.k === 'ptr' || t?.k === 'nullptr';
export const isScalar = (t) => isArith(t) || isPtr(t) || t?.k === 'fn';
export const isClass = (t, name) => t?.k === 'class' && (!name || t.cls.name === name);
export const isString = (t) => t?.k === 'class' && t.cls.name === 'String';
export const strip = (t) => (t?.k === 'ref' ? t.to : t);
export const isCharPtr = (t) => (t?.k === 'ptr' || t?.k === 'array') && (t.to ?? t.of)?.isChar;

/** Name as g++ prints it, e.g. "byte {aka unsigned char}". */
export function typeName(t, { aka = true } = {}) {
  if (!t) return '?';
  switch (t.k) {
    case 'int': case 'float': case 'void': case 'nullptr': case 'any':
      if (t.alias) return aka ? `${t.alias} {aka ${t.base.alias ? typeName(t.base) : t.base.name}}` : t.alias;
      return t.name;
    case 'enum': return t.name;
    case 'struct': return t.name;
    case 'class': return t.cls.name;
    case 'ptr': {
      if (t.to.k === 'fn') return `${typeName(t.to.ret, { aka: false })} (*)(${t.to.params.map((p) => typeName(p, { aka: false })).join(', ')})`;
      return `${t.constTo ? 'const ' : ''}${typeName(t.to, { aka: false })}*`;
    }
    case 'array': {
      let dims = '', x = t;
      while (x.k === 'array') { dims += `[${x.len ?? ''}]`; x = x.of; }
      return `${typeName(x, { aka: false })} ${dims}`;
    }
    case 'ref': return `${typeName(t.to, { aka: false })}&`;
    case 'fn': return `${typeName(t.ret, { aka: false })}(${t.params.map((p) => typeName(p, { aka: false })).join(', ')})`;
    default: return t.name ?? t.k;
  }
}

/** Canonical (non-alias) type for comparisons. */
export function canon(t) {
  while (t && t.alias) t = t.base;
  return t;
}

export function sameType(a, b) {
  a = canon(strip(a)); b = canon(strip(b));
  if (a === b) return true;
  if (!a || !b || a.k !== b.k) return false;
  if (a.k === 'int') return a.bits === b.bits && a.unsigned === b.unsigned && !!a.isChar === !!b.isChar && !!a.isBool === !!b.isBool && a.rank === b.rank;
  if (a.k === 'float') return a.name === b.name;
  if (a.k === 'ptr') return sameType(a.to, b.to);
  if (a.k === 'array') return a.len === b.len && sameType(a.of, b.of);
  if (a.k === 'class') return a.cls === b.cls;
  return a === b;
}

/** Integer promotion (bool/char/short → int, or unsigned int if int can't hold it). */
export function promote(t, T) {
  t = canon(t);
  if (t.k === 'enum') return T.int;
  if (t.k !== 'int') return t;
  if (t.rank < 3) {
    if (t.bits < T.int.bits || !t.unsigned) return T.int;
    return T.uint;
  }
  return t;
}

/** Usual arithmetic conversions. */
export function arithResult(a, b, T) {
  a = canon(a); b = canon(b);
  if (a.k === 'float' || b.k === 'float') {
    if (a.k === 'float' && b.k === 'float') return a.rank >= b.rank ? a : b;
    return a.k === 'float' ? a : b;
  }
  a = promote(a, T); b = promote(b, T);
  if (a === b) return a;
  if (a.unsigned === b.unsigned) return a.rank >= b.rank ? a : b;
  const [u, s] = a.unsigned ? [a, b] : [b, a];
  if (u.rank >= s.rank) return u;
  if (s.bits > u.bits) return s;
  // unsigned version of the signed type
  return [T.uint, T.ulong, T.ullong].find((x) => x.rank === s.rank) ?? u;
}

// ------------------------------------------------------------------ value conversion
const twoTo64 = 2n ** 64n;
function wrap64(v, unsigned) {
  if (!Number.isFinite(v)) return 0;
  let b = BigInt(Math.trunc(v));
  b = unsigned ? BigInt.asUintN(64, b) : BigInt.asIntN(64, b);
  return Number(b);
}

/** Returns a function that wraps a JS number into the given integer type. */
export function wrapper(t) {
  t = canon(t);
  if (t.k === 'enum') t = t.base;
  if (t.k === 'float') return t.bits === 32 ? Math.fround : (v) => v;
  if (t.isBool) return (v) => (v ? 1 : 0);
  const { bits, unsigned } = t;
  if (bits === 8) return unsigned ? (v) => v & 0xff : (v) => (v << 24) >> 24;
  if (bits === 16) return unsigned ? (v) => v & 0xffff : (v) => (v << 16) >> 16;
  if (bits === 32) return unsigned ? (v) => v >>> 0 : (v) => v | 0;
  return (v) => wrap64(v, unsigned);
}

/** Convert a number of type `from` to integer/float type `to` (C semantics). */
export function numConverter(from, to) {
  from = canon(from); to = canon(to);
  if (to.k === 'enum') to = to.base;
  if (from?.k === 'enum') from = from.base;
  const w = wrapper(to);
  if (to.k === 'float') return w;
  if (to.isBool) return (v) => (v ? 1 : 0); // NaN is truthy in C, falsy here; rare
  if (from && from.k === 'float') {
    return (v) => {
      if (!Number.isFinite(v)) return 0;
      const tr = Math.trunc(v);
      if (to.bits === 64) return wrap64(tr, to.unsigned);
      // out-of-range float→int is undefined behaviour; wrap like the hardware usually does
      if (Math.abs(tr) >= 2 ** 32) return w(Number(BigInt.asIntN(32, BigInt(tr))));
      return w(tr);
    };
  }
  return w;
}

/** Range of an integer type. */
export function intRange(t) {
  t = canon(t);
  if (t.k === 'enum') t = t.base;
  if (t.isBool) return [0, 1];
  const b = BigInt(t.bits);
  return t.unsigned ? [0n, (1n << b) - 1n] : [-(1n << (b - 1n)), (1n << (b - 1n)) - 1n];
}

export function fitsIn(v, t) {
  const [lo, hi] = intRange(t);
  const b = typeof v === 'bigint' ? v : BigInt(Math.trunc(v));
  return b >= lo && b <= hi;
}

/** sizeof, with AVR packing (no alignment) or natural alignment on 32-bit boards. */
export function sizeOf(t, T) {
  t = canon(strip(t));
  switch (t.k) {
    case 'int': case 'float': return t.size;
    case 'enum': return T.int.size;
    case 'ptr': case 'nullptr': case 'fn': return T.ptrSize;
    case 'array': return (t.len ?? 0) * sizeOf(t.of, T);
    case 'struct': return layout(t, T).size;
    case 'class': return t.cls.sizeof ?? (t.cls.name === 'String' ? (T.avr ? 6 : 12) : 1);
    default: return 1;
  }
}

export function alignOf(t, T) {
  t = canon(strip(t));
  if (T.avr) return 1;
  switch (t.k) {
    case 'int': case 'float': return Math.min(t.size, 8);
    case 'enum': return 4;
    case 'array': return alignOf(t.of, T);
    case 'struct': return Math.max(1, ...t.fields.map((f) => alignOf(f.type, T)));
    default: return 4;
  }
}

/** Byte offsets of struct fields. */
export function layout(st, T) {
  if (st._layout?.T === T) return st._layout;
  let off = 0;
  const offsets = [];
  for (const f of st.fields) {
    const a = alignOf(f.type, T);
    off = Math.ceil(off / a) * a;
    offsets.push(off);
    off += sizeOf(f.type, T);
  }
  const a = alignOf(st, T);
  const size = Math.max(1, Math.ceil(off / a) * a);
  st._layout = { T, offsets, size };
  return st._layout;
}

/** Default (zero) value for a type. */
export function zeroValue(t, vm) {
  t = canon(strip(t));
  switch (t.k) {
    case 'int': case 'float': case 'enum': return 0;
    case 'ptr': case 'nullptr': case 'fn': return null;
    case 'array': {
      const n = t.len ?? 0;
      const a = new Array(n);
      for (let i = 0; i < n; i++) a[i] = zeroValue(t.of, vm);
      return a;
    }
    case 'struct': {
      const o = {};
      for (const f of t.fields) o[f.name] = zeroValue(f.type, vm);
      return o;
    }
    case 'class': return t.cls.construct ? t.cls.construct(vm, [], []) : null;
    default: return 0;
  }
}

/** Deep copy of a value of type t (structs and arrays are copied by value). */
export function cloneValue(v, t) {
  t = canon(strip(t));
  if (v == null || typeof v !== 'object') return v;
  if (t.k === 'array') return v.map((x) => cloneValue(x, t.of));
  if (t.k === 'struct') {
    const o = {};
    for (const f of t.fields) o[f.name] = cloneValue(v[f.name], f.type);
    return o;
  }
  if (t.k === 'class' && t.cls.copy) return t.cls.copy(v);
  return v;
}

/** Serialize a value to little-endian bytes (EEPROM.put, memcpy). */
export function toBytesLE(v, t, T, out = []) {
  t = canon(strip(t));
  if (t.k === 'enum') t = T.int;
  if (t.k === 'int') {
    let b = BigInt.asUintN(t.bits, BigInt(Math.trunc(v || 0)));
    for (let i = 0; i < t.size; i++) { out.push(Number(b & 255n)); b >>= 8n; }
  } else if (t.k === 'float') {
    const dv = new DataView(new ArrayBuffer(t.size));
    if (t.size === 4) dv.setFloat32(0, v, true); else dv.setFloat64(0, v, true);
    for (let i = 0; i < t.size; i++) out.push(dv.getUint8(i));
  } else if (t.k === 'array') {
    for (let i = 0; i < (t.len ?? 0); i++) toBytesLE(v[i], t.of, T, out);
  } else if (t.k === 'struct') {
    const L = layout(t, T);
    const start = out.length;
    t.fields.forEach((f, i) => {
      while (out.length - start < L.offsets[i]) out.push(0);
      toBytesLE(v[f.name], f.type, T, out);
    });
    while (out.length - start < L.size) out.push(0);
  } else {
    for (let i = 0; i < sizeOf(t, T); i++) out.push(0);
  }
  return out;
}

/** Read a value of type t from bytes at offset. */
export function fromBytesLE(bytes, off, t, T) {
  t = canon(strip(t));
  if (t.k === 'enum') t = T.int;
  if (t.k === 'int') {
    let b = 0n;
    for (let i = t.size - 1; i >= 0; i--) b = (b << 8n) | BigInt(bytes[off + i] ?? 0);
    b = t.unsigned ? BigInt.asUintN(t.bits, b) : BigInt.asIntN(t.bits, b);
    return t.isBool ? (b ? 1 : 0) : Number(b);
  }
  if (t.k === 'float') {
    const dv = new DataView(new ArrayBuffer(t.size));
    for (let i = 0; i < t.size; i++) dv.setUint8(i, bytes[off + i] ?? 0);
    return t.size === 4 ? dv.getFloat32(0, true) : dv.getFloat64(0, true);
  }
  if (t.k === 'array') {
    const es = sizeOf(t.of, T);
    const a = [];
    for (let i = 0; i < (t.len ?? 0); i++) a.push(fromBytesLE(bytes, off + i * es, t.of, T));
    return a;
  }
  if (t.k === 'struct') {
    const L = layout(t, T);
    const o = {};
    t.fields.forEach((f, i) => { o[f.name] = fromBytesLE(bytes, off + L.offsets[i], f.type, T); });
    return o;
  }
  return 0;
}
