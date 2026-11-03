// C printf formatting (sprintf / snprintf / Serial.printf). Arguments arrive as
// { v, t } pairs with their static C++ types. On AVR, avr-libc's default printf
// has no floating point: %f, %e and %g print "?" exactly as on a real Uno.
import { cstr, AStr } from './values.js';

const canon = (t) => { while (t && t.alias) t = t.base; return t; };

export function formatPrintf(fmt, args, T, warn) {
  let out = '';
  let ai = 0;
  const nextArg = () => args[ai++] ?? { v: 0, t: T.int, missing: true };
  for (let i = 0; i < fmt.length; i++) {
    const c = fmt[i];
    if (c !== '%') { out += c; continue; }
    const m = /^%([-+ #0]*)(\*|\d+)?(?:\.(\*|\d*))?(hh|h|ll|l|z|j|t|L)?([diouxXcsfFeEgGpaA%n])/.exec(fmt.slice(i));
    if (!m) { out += c; continue; }
    i += m[0].length - 1;
    const [, flags, widthS, precS, len, conv] = m;
    if (conv === '%') { out += '%'; continue; }
    let width = widthS === '*' ? Number(nextArg().v) : widthS ? Number(widthS) : 0;
    let prec = precS === '*' ? Number(nextArg().v) : precS !== undefined ? Number(precS || 0) : undefined;
    let left = flags.includes('-');
    if (width < 0) { left = true; width = -width; }
    const zero = flags.includes('0') && !left;
    const plus = flags.includes('+'), space = flags.includes(' '), alt = flags.includes('#');
    const a = nextArg();
    let s = '';
    let sign = '';
    const num = (x) => (typeof x === 'number' ? x : x instanceof AStr ? 0 : Number(x) || 0);
    const t = canon(a.t);
    switch (conv) {
      case 'd': case 'i': {
        let v = Math.trunc(num(a.v));
        // the format decides the width the callee reads
        v = applyLength(v, len, false, T);
        if (v < 0) { sign = '-'; v = -v; } else if (plus) sign = '+'; else if (space) sign = ' ';
        s = String(v);
        if (prec !== undefined) s = prec === 0 && v === 0 ? '' : s.padStart(prec, '0');
        break;
      }
      case 'u': case 'x': case 'X': case 'o': {
        let v = Math.trunc(num(a.v));
        v = applyLength(v, len, true, T);
        s = v.toString(conv === 'o' ? 8 : conv === 'u' ? 10 : 16);
        if (conv === 'X') s = s.toUpperCase();
        if (prec !== undefined) s = prec === 0 && v === 0 ? '' : s.padStart(prec, '0');
        if (alt && v !== 0 && (conv === 'x' || conv === 'X')) sign = conv === 'x' ? '0x' : '0X';
        if (alt && conv === 'o' && !s.startsWith('0')) s = '0' + s;
        break;
      }
      case 'c': s = String.fromCharCode(num(a.v) & 255); break;
      case 's': {
        if (t?.k === 'class' && t.cls.name === 'String') {
          warn?.("format '%s' expects argument of type 'char*', but the argument has type 'String' — use .c_str()");
          s = '';
        } else s = cstr(a.v);
        if (prec !== undefined) s = s.slice(0, prec);
        break;
      }
      case 'p': s = '0x' + (Math.abs(num(a.v)) || 0x8f0).toString(16); break;
      case 'n': continue;
      default: {
        // floating point
        if (T.avr) { s = '?'; break; }
        let v = num(a.v);
        if (t && t.k === 'int' && !a.missing) {
          warn?.(`format '%${conv}' expects argument of type 'double', but the argument has type '${t.name}'`);
        }
        if (Number.isNaN(v)) { s = conv === conv.toUpperCase() ? 'NAN' : 'nan'; break; }
        if (!Number.isFinite(v)) { sign = v < 0 ? '-' : plus ? '+' : ''; s = conv === conv.toUpperCase() ? 'INF' : 'inf'; break; }
        if (v < 0 || Object.is(v, -0)) { sign = '-'; v = -v; } else if (plus) sign = '+'; else if (space) sign = ' ';
        const p = prec ?? 6;
        if (conv === 'f' || conv === 'F') s = v.toFixed(p);
        else if (conv === 'e' || conv === 'E') s = expo(v, p);
        else if (conv === 'g' || conv === 'G') {
          const P = p === 0 ? 1 : p;
          const X = v === 0 ? 0 : Math.floor(Math.log10(v));
          if (P > X && X >= -4) s = v.toFixed(Math.max(0, P - 1 - X)); else s = expo(v, P - 1);
          if (!alt) s = s.replace(/\.?0+(e|$)/, '$1');
        } else s = v.toString(16);
        if (conv === 'E' || conv === 'G') s = s.toUpperCase();
      }
    }
    let body = sign + s;
    if (body.length < width) {
      if (left) body = body.padEnd(width);
      else if (zero && conv !== 's' && conv !== 'c' && !(prec !== undefined && 'diouxX'.includes(conv))) body = sign + s.padStart(width - sign.length, '0');
      else body = body.padStart(width);
    }
    out += body;
  }
  return out;
}

function expo(v, p) {
  let s = v.toExponential(p);
  return s.replace(/e([+-])(\d)$/, 'e$10$2');
}

function applyLength(v, len, unsigned, T) {
  // %d reads an int (16-bit on AVR); %ld a long; %lld a long long
  const bits = len === 'll' || len === 'j' ? 64 : len === 'l' ? 32 : len === 'h' ? 16 : len === 'hh' ? 8 : len === 'z' ? T.uint.bits : T.int.bits;
  if (bits === 64) {
    const b = BigInt(Math.trunc(v));
    return Number(unsigned ? BigInt.asUintN(64, b) : BigInt.asIntN(64, b));
  }
  if (bits === 32) return unsigned ? v >>> 0 : v | 0;
  if (bits === 16) return unsigned ? v & 0xffff : (v << 16) >> 16;
  return unsigned ? v & 0xff : (v << 24) >> 24;
}
