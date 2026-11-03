// Formats runtime values for the debugger's Variables panel.
import { canon, typeName } from './types.js';
import { Ptr, FnRef, AStr, cstr, decodeBytes, fmtFloat } from './values.js';

const MAX_CHILDREN = 64;

function charText(c) {
  c &= 255;
  if (c === 0) return "'\\0'";
  if (c === 10) return "'\\n'";
  if (c === 13) return "'\\r'";
  if (c === 9) return "'\\t'";
  if (c < 32 || c > 126) return `'\\x${c.toString(16).padStart(2, '0')}'`;
  return `'${String.fromCharCode(c)}'`;
}

function quote(s) {
  return JSON.stringify(decodeBytes(s));
}

/** { value: string, children?: [{ name, type, value, children? }] } */
export function formatValue(v, t, T, depth = 0) {
  const c = canon(t?.k === 'ref' ? t.to : t);
  if (!c) return { value: String(v) };
  if (v === undefined) return { value: '?' };
  switch (c.k) {
    case 'int': {
      if (c.isBool) return { value: v ? 'true' : 'false' };
      if (c.isChar || (c.bits === 8 && !c.unsigned && t.name === 'char')) return { value: `${v} ${charText(v)}` };
      return { value: String(v) };
    }
    case 'enum': {
      const name = [...(c.values ?? [])].find(([, x]) => x === v)?.[0];
      return { value: name ? `${name} (${v})` : String(v) };
    }
    case 'float': return { value: Number.isFinite(v) ? (c.bits === 32 ? String(Number(Math.fround(v).toPrecision(7))) : String(v)) : Number.isNaN(v) ? 'nan' : v > 0 ? 'inf' : '-inf' };
    case 'ptr': {
      if (v == null) return { value: 'nullptr' };
      if (v instanceof FnRef) return { value: `→ ${v.fn.isLambda ? 'lambda' : v.fn.name}()` };
      const el = canon(c.to);
      if (el?.k === 'int' && el.bits === 8 && v instanceof Ptr && Array.isArray(v.b)) return { value: quote(cstr(v)) };
      if (v instanceof Ptr) return { value: typeof v.o === 'number' && Array.isArray(v.b) ? `→ element [${v.o}]` : '→ variable' };
      return { value: '→ object' };
    }
    case 'fn': return { value: v instanceof FnRef ? `→ ${v.fn.name}()` : 'function' };
    case 'array': {
      if (!Array.isArray(v)) return { value: '[]' };
      const el = canon(c.of);
      if (el?.k === 'int' && el.bits === 8 && el.isChar) {
        const s = cstr(v);
        return { value: quote(s), children: depth < 3 ? v.slice(0, MAX_CHILDREN).map((x, i) => ({ name: `[${i}]`, type: typeName(c.of, { aka: false }), ...formatValue(x, c.of, T, depth + 1) })) : undefined };
      }
      const children = depth < 3 ? v.slice(0, MAX_CHILDREN).map((x, i) => ({ name: `[${i}]`, type: typeName(c.of, { aka: false }), ...formatValue(x, c.of, T, depth + 1) })) : undefined;
      const preview = v.slice(0, 8).map((x) => formatValue(x, c.of, T, 9).value).join(', ');
      return { value: `{${preview}${v.length > 8 ? ', …' : ''}}`, children };
    }
    case 'struct': {
      if (!v) return { value: '{}' };
      const children = c.fields.map((f) => ({ name: f.name, type: typeName(f.type, { aka: false }), ...formatValue(v[f.name], f.type, T, depth + 1) }));
      return { value: `{${children.slice(0, 4).map((x) => `${x.name}: ${x.value}`).join(', ')}${children.length > 4 ? ', …' : ''}}`, children };
    }
    case 'class': {
      if (v instanceof AStr) return { value: quote(v.s) };
      if (c.cls.inspect && v) return c.cls.inspect(v);
      if (c.cls.printTo && v) return { value: decodeBytes(c.cls.printTo(v)) };
      return { value: c.cls.name };
    }
    default: return { value: typeof v === 'number' ? fmtFloat(v, 2) : String(v) };
  }
}
