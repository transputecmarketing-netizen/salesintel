// Runtime value helpers shared by the compiler, the VM and the libraries.
// C strings are JS arrays of byte values; "byte strings" are JS strings with one char per byte.

/** A pointer: element `o` of container `b` (an array, a frame's slot array or a struct object). */
export class Ptr {
  constructor(b, o) { this.b = b; this.o = o; }
}

/** A function value (function pointer or lambda). */
export class FnRef {
  constructor(fn, up = null) { this.fn = fn; this.up = up; }
}

export class RuntimeError extends Error {
  constructor(message, hint) { super(message); this.hint = hint; }
}

/** Thrown to restart the sketch (ESP deep sleep, ESP.restart(), watchdog). */
export class Reset extends Error {
  constructor(reason, cause) { super(reason); this.reason = reason; this.cause = cause; }
}

/** Bytes of a C string from a pointer, an array, a String or a JS byte string. */
export function cstr(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (v instanceof AStr) return v.s;
  let arr, i;
  if (v instanceof Ptr) { arr = v.b; i = v.o; } else if (Array.isArray(v)) { arr = v; i = 0; } else return String(v);
  if (!Array.isArray(arr) || typeof i !== 'number') return '';
  let s = '';
  for (; i < arr.length; i++) {
    const c = arr[i];
    if (!c) break;
    s += String.fromCharCode(c & 255);
  }
  return s;
}

/** A fresh NUL-terminated char array for a byte string. */
export function charArray(s) {
  const a = new Array(s.length + 1);
  for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
  a[s.length] = 0;
  return a;
}

/** Write a byte string into a char array / pointer (with terminator), bounded. */
export function writeCstr(dst, s, max = Infinity) {
  let arr, o;
  if (dst instanceof Ptr) { arr = dst.b; o = dst.o; } else { arr = dst; o = 0; }
  const n = Math.min(s.length, Math.max(0, Math.min(max, arr.length - o) - 1));
  for (let i = 0; i < n; i++) arr[o + i] = (s.charCodeAt(i) << 24) >> 24;
  if (o + n < arr.length) arr[o + n] = 0;
  return n;
}

/** Decode a byte string as UTF-8 for display (invalid bytes become U+FFFD). */
export function decodeBytes(s) {
  try {
    const u = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return new TextDecoder('utf-8').decode(u);
  } catch { return s; }
}

// ------------------------------------------------------------------ number formatting (Print.cpp)
/** Print::printNumber for an unsigned value. */
export function fmtUnsigned(n, base) {
  if (base < 2) base = 10;
  if (typeof n === 'bigint') return n.toString(base).toUpperCase();
  return Math.trunc(n).toString(base).toUpperCase();
}

/** Print::printFloat(number, digits) — the Arduino algorithm, including "ovf". */
export function fmtFloat(number, digits = 2, f32 = true) {
  const R = f32 ? Math.fround : (x) => x;
  if (Number.isNaN(number)) return 'nan';
  if (!Number.isFinite(number)) return 'inf';
  if (number > 4294967040.0) return 'ovf';
  if (number < -4294967040.0) return 'ovf';
  let out = '';
  if (number < 0) { out += '-'; number = -number; }
  let rounding = 0.5;
  for (let i = 0; i < digits; i++) rounding = R(rounding / 10.0);
  number = R(number + rounding);
  const intPart = Math.floor(number) >>> 0;
  let remainder = R(number - intPart);
  out += String(intPart);
  if (digits > 0) out += '.';
  while (digits-- > 0) {
    remainder = R(remainder * 10.0);
    const toPrint = Math.trunc(remainder);
    out += String(toPrint);
    remainder = R(remainder - toPrint);
  }
  return out;
}

/** Arduino String(double, decimals) uses dtostrf, which rounds correctly. */
export function dtostrf(v, width, prec) {
  if (Number.isNaN(v)) return 'nan'.padStart(Math.abs(width));
  if (!Number.isFinite(v)) return (v < 0 ? '-inf' : 'inf').padStart(Math.abs(width));
  let s = v.toFixed(Math.max(0, prec));
  if (/^-0(\.0*)?$/.test(s)) s = s.slice(1);
  return width < 0 ? s.padEnd(-width) : s.padStart(width);
}

// ------------------------------------------------------------------ Arduino String
export class AStr {
  constructor(s = '') { this.s = s; }
  static from(v) { return new AStr(cstr(v)); }
}

/** Text that String(x) / concat(x) / print(x) produce for a typed value. */
export function textOf(v, t, T, { base = 10, digits = 2, forString = false } = {}) {
  const c = t && (t.alias ? canonOf(t) : t);
  if (!c) return String(v);
  if (c.k === 'class') {
    if (c.cls.name === 'String') return v.s;
    if (c.cls.printTo) return c.cls.printTo(v);
    return '';
  }
  if (c.k === 'array' || c.k === 'ptr') {
    const el = c.of ?? c.to;
    if (el && (el.isChar || (el.k === 'int' && el.bits === 8))) return cstr(v);
    return v == null ? '0' : '';
  }
  if (c.k === 'float') {
    if (forString) return dtostrf(v, 0, digits);
    return fmtFloat(v, digits, c.bits === 32 || T?.avr);
  }
  if (c.k === 'int' || c.k === 'enum') {
    const it = c.k === 'enum' ? T.int : c;
    if (it.isChar && t.isChar && !t.alias && base === 10 && !forString) return String.fromCharCode(v & 255);
    if (it.isChar && t.isChar && !t.alias && forString) return String.fromCharCode(v & 255);
    if (base === 10) return String(v);
    // non-decimal: print as unsigned long (or 64-bit) like Print::print(long, base)
    if (it.bits === 64) return BigInt.asUintN(64, BigInt(v)).toString(base).toUpperCase();
    const u = v < 0 ? (v >>> 0) : v;
    return fmtUnsigned(u, base);
  }
  return String(v);
}

function canonOf(t) { while (t && t.alias) t = t.base; return t; }

// ------------------------------------------------------------------ IP address
export class IPAddress {
  constructor(a = 0, b = 0, c = 0, d = 0) { this.o = [a & 255, b & 255, c & 255, d & 255]; }
  toString() { return this.o.join('.'); }
}

// ------------------------------------------------------------------ avr-libc random()
export function makeRandom(seed = 1) {
  let next = seed >>> 0;
  return {
    seed(s) { next = s >>> 0; },
    random() {
      // Park–Miller "minimal standard" as in avr-libc do_random()
      let x = next | 0;
      if (x === 0) x = 123459876;
      const hi = Math.trunc(x / 127773), lo = x % 127773;
      x = 16807 * lo - 2836 * hi;
      if (x < 0) x += 0x7fffffff;
      next = x >>> 0;
      return x % 0x80000000;
    },
  };
}
