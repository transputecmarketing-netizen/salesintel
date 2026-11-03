// Tokenizer for Arduino C++. Produces tokens with 1-based line / col.
// Token kinds: 'id', 'num', 'char', 'str', 'op', 'eof'.

export class CompileError extends Error {
  constructor(message, line, col, hint) {
    super(message);
    this.line = line;
    this.col = col;
    this.hint = hint;
  }
}

const PUNCT = [
  '>>=', '<<=', '...', '->*',
  '->', '++', '--', '<<', '>>', '<=', '>=', '==', '!=', '&&', '||', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '::',
  '+', '-', '*', '/', '%', '<', '>', '=', '!', '~', '&', '|', '^', '?', ':', ';', ',', '.', '(', ')', '[', ']', '{', '}', '#',
];

const isIdStart = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' || c === '$';
const isIdChar = (c) => isIdStart(c) || (c >= '0' && c <= '9');
const isDigit = (c) => c >= '0' && c <= '9';

/** UTF-8 encode a JS string into a "byte string" (one char per byte, codes 0–255). */
export function toBytes(s) {
  let out = '';
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (c < 0x80) out += ch;
    else if (c < 0x800) out += String.fromCharCode(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out += String.fromCharCode(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out += String.fromCharCode(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}

function escape(src, i, line, col) {
  // src[i] is the char after the backslash; returns [byteString, newIndex]
  const c = src[i];
  const simple = { n: '\n', t: '\t', r: '\r', '0': '\0', '\\': '\\', "'": "'", '"': '"', a: '\x07', b: '\b', f: '\f', v: '\v', '?': '?', e: '\x1b' };
  if (c === 'x') {
    let j = i + 1, h = '';
    while (j < src.length && /[0-9a-fA-F]/.test(src[j])) h += src[j++];
    if (!h) throw new CompileError('\\x used with no following hex digits', line, col);
    return [String.fromCharCode(parseInt(h, 16) & 255), j];
  }
  if (c >= '0' && c <= '7') {
    let j = i, o = '';
    while (j < src.length && o.length < 3 && src[j] >= '0' && src[j] <= '7') o += src[j++];
    return [String.fromCharCode(parseInt(o, 8) & 255), j];
  }
  if (c in simple) return [simple[c], i + 1];
  return [c, i + 1]; // unknown escape: gcc warns and keeps the char
}

/**
 * Tokenize `src` (comments must already be blanked by the preprocessor, but
 * comments are handled here too for safety). `firstLine` offsets line numbers.
 */
export function tokenize(src, firstLine = 1) {
  const toks = [];
  let i = 0, line = firstLine, lineStart = 0;
  const n = src.length;
  let bol = true;
  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; i++; lineStart = i; bol = true; continue; }
    if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v') { i++; continue; }
    if (c === '\\' && src[i + 1] === '\n') { i += 2; line++; lineStart = i; continue; }
    const col = i - lineStart + 1;
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') { line++; lineStart = i + 1; } i++; }
      i += 2;
      continue;
    }
    const tok = { k: '', v: '', line, col, bol };
    bol = false;
    // raw string literal R"delim(...)delim"
    if ((c === 'R' && src[i + 1] === '"') || ((c === 'u' || c === 'L' || c === 'U') && src[i + 1] === 'R' && src[i + 2] === '"') || (c === 'u' && src[i + 1] === '8' && src[i + 2] === 'R' && src[i + 3] === '"')) {
      let j = src.indexOf('R"', i) + 2;
      const open = src.indexOf('(', j);
      const delim = src.slice(j, open);
      const close = src.indexOf(`)${delim}"`, open);
      if (open < 0 || close < 0) throw new CompileError('unterminated raw string', line, col);
      const body = src.slice(open + 1, close);
      for (const ch of body) if (ch === '\n') { line++; }
      const lastNl = body.lastIndexOf('\n');
      i = close + delim.length + 2;
      if (lastNl >= 0) lineStart = open + 1 + lastNl + 1;
      tok.k = 'str'; tok.v = toBytes(body);
      toks.push(tok);
      continue;
    }
    // string / char literal (with optional encoding prefix)
    let p = i;
    if ((c === 'u' && src[i + 1] === '8' && src[i + 2] === '"') ) p = i + 2;
    else if ((c === 'L' || c === 'u' || c === 'U') && (src[i + 1] === '"' || src[i + 1] === "'")) p = i + 1;
    if (src[p] === '"' || src[p] === "'") {
      const q = src[p];
      let j = p + 1, s = '';
      while (j < n && src[j] !== q) {
        if (src[j] === '\n') throw new CompileError(q === '"' ? 'missing terminating " character' : "missing terminating ' character", line, col,
          q === '"' ? 'A string must start and end with a double quote on the same line.' : 'A character literal looks like \'a\'. Use double quotes for text: "hello".');
        if (src[j] === '\\') {
          const [e, nj] = escape(src, j + 1, line, col);
          s += e; j = nj;
        } else {
          const cp = src.codePointAt(j);
          const ch = String.fromCodePoint(cp);
          s += toBytes(ch);
          j += ch.length;
        }
      }
      if (j >= n) throw new CompileError(q === '"' ? 'missing terminating " character' : "missing terminating ' character", line, col);
      i = j + 1;
      if (q === '"') { tok.k = 'str'; tok.v = s; }
      else {
        if (s.length === 0) throw new CompileError('empty character constant', line, col, "A character literal needs one character, e.g. 'A'.");
        tok.k = 'char';
        // multi-character constants: gcc packs them into an int (warning)
        let v = 0;
        for (const ch of s) v = (v << 8) | ch.charCodeAt(0);
        tok.v = s.length === 1 ? s.charCodeAt(0) : v;
        tok.multi = s.length > 1;
        if (s.length > 1) tok.text = s;
      }
      toks.push(tok);
      continue;
    }
    if (isIdStart(c)) {
      let j = i + 1;
      while (j < n && isIdChar(src[j])) j++;
      tok.k = 'id'; tok.v = src.slice(i, j);
      i = j;
      toks.push(tok);
      continue;
    }
    if (isDigit(c) || (c === '.' && isDigit(src[i + 1]))) {
      let j = i;
      let text;
      if (c === '0' && (src[i + 1] === 'x' || src[i + 1] === 'X')) {
        j += 2;
        while (j < n && /[0-9a-fA-F']/.test(src[j])) j++;
      } else if (c === '0' && (src[i + 1] === 'b' || src[i + 1] === 'B')) {
        j += 2;
        while (j < n && /[01']/.test(src[j])) j++;
      } else {
        while (j < n && /[0-9.']/.test(src[j])) j++;
        if ((src[j] === 'e' || src[j] === 'E') && (isDigit(src[j + 1]) || ((src[j + 1] === '+' || src[j + 1] === '-') && isDigit(src[j + 2])))) {
          j += 2;
          while (j < n && isDigit(src[j])) j++;
        }
      }
      let k = j;
      while (k < n && /[uUlLfF]/.test(src[k])) k++;
      text = src.slice(i, j).replace(/'/g, '');
      const suffix = src.slice(j, k).toLowerCase();
      if (k < n && isIdChar(src[k])) {
        let e = k;
        while (e < n && isIdChar(src[e])) e++;
        throw new CompileError(`invalid suffix "${src.slice(j, e)}" on ${/[.eE]/.test(text) && !/^0x/i.test(text) ? 'floating' : 'integer'} constant`, line, col);
      }
      tok.k = 'num';
      tok.text = src.slice(i, k);
      const isHex = /^0x/i.test(text);
      if (!isHex && (/[.eE]/.test(text) || suffix.includes('f') && /[.eE]/.test(text))) {
        tok.float = true;
        tok.v = parseFloat(text);
        tok.suffix = suffix.includes('f') ? 'f' : suffix.includes('l') ? 'l' : '';
      } else {
        if (suffix.includes('f')) throw new CompileError(`invalid suffix "${src.slice(j, k)}" on integer constant`, line, col);
        let v;
        if (isHex) v = BigInt(text);
        else if (/^0b/i.test(text)) v = BigInt(text);
        else if (/^0[0-7]+$/.test(text)) { v = BigInt('0o' + text.slice(1)); tok.octal = true; }
        else if (/^0[0-9]+$/.test(text)) throw new CompileError(`invalid digit "${text.match(/[89]/)[0]}" in octal constant`, line, col, 'A number that starts with 0 is octal in C++. Remove the leading zero.');
        else v = BigInt(text);
        tok.big = v;
        tok.v = Number(v);
        tok.unsigned = suffix.includes('u');
        tok.longs = (suffix.match(/l/g) || []).length;
        tok.decimal = !isHex && !/^0[bB]/.test(text) && !tok.octal;
      }
      i = k;
      toks.push(tok);
      continue;
    }
    let op = null;
    for (const P of PUNCT) if (src.startsWith(P, i)) { op = P; break; }
    if (!op) {
      const ch = String.fromCodePoint(src.codePointAt(i));
      throw new CompileError(`stray '${ch}' in program`, line, col, /[“”‘’]/.test(ch) ? 'This is a “smart quote”, probably pasted from a document. Retype it as a plain " or \'.' : 'Remove this character; it is not part of C++.');
    }
    tok.k = 'op'; tok.v = op;
    i += op.length;
    toks.push(tok);
  }
  toks.push({ k: 'eof', v: '', line, col: i - lineStart + 1 });
  return toks;
}
