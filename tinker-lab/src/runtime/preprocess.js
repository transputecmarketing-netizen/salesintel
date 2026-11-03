// C preprocessor subset: #include (supported libraries only), #define (object- and
// function-like macros, # and ##), #undef, #if/#ifdef/#ifndef/#elif/#else/#endif
// with defined(), #error, #warning, #pragma. Works on tokens so line numbers stay exact.
import { tokenize, CompileError } from './lexer.js';

/** Blank out comments, keeping newlines and string contents. */
function stripComments(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') { out += ' '; i++; }
    } else if (c === '/' && src[i + 1] === '*') {
      out += '  ';
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { out += src[i] === '\n' ? '\n' : ' '; i++; }
      if (i < n) { out += '  '; i += 2; }
    } else if (c === 'R' && src[i + 1] === '"' && !/[A-Za-z0-9_]/.test(src[i - 1] ?? '')) {
      const open = src.indexOf('(', i + 2);
      const delim = open > 0 ? src.slice(i + 2, open) : '';
      const close = open > 0 ? src.indexOf(`)${delim}"`, open) : -1;
      if (open < 0 || close < 0 || /[\s()\\]/.test(delim)) { out += c; i++; continue; }
      const end = close + delim.length + 2;
      // mark raw-string lines so '#' at line start is not a directive
      out += src.slice(i, end).replace(/\n/g, '\n\u0001');
      i = end;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      out += src.slice(i, Math.min(j + 1, n));
      i = j + 1;
    } else { out += c; i++; }
  }
  return out;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function predefinedMacros(board, now = new Date()) {
  const pad = (x) => String(x).padStart(2, '0');
  const date = `${MONTHS[now.getMonth()]} ${String(now.getDate()).padStart(2, ' ')} ${now.getFullYear()}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const m = {
    ARDUINO: '10819', __cplusplus: '201103L', __GNUC__: '7', __DATE__: JSON.stringify(date), __TIME__: JSON.stringify(time), __FILE__: '"sketch.ino"',
    PROGMEM: '', IRAM_ATTR: '', ICACHE_RAM_ATTR: '', ARDUINO_ISR_ATTR: '', RTC_DATA_ATTR: '__rtc_data', RTC_RODATA_ATTR: '', DRAM_ATTR: '',
    NULL: 'nullptr', TINKERLAB_SIMULATOR: '1',
  };
  const avr = { __AVR__: '1', ARDUINO_ARCH_AVR: '1', F_CPU: '16000000L' };
  const esp32 = { ESP32: '1', ARDUINO_ARCH_ESP32: '1', ARDUINO_ESP32_DEV: '1', CONFIG_BT_ENABLED: '1', CONFIG_BLUEDROID_ENABLED: '1', CONFIG_IDF_TARGET_ESP32: '1', ESP_ARDUINO_VERSION_MAJOR: '3', F_CPU: '240000000L' };
  const extra = {
    uno: { ...avr, ARDUINO_AVR_UNO: '1', __AVR_ATmega328P__: '1' },
    nano: { ...avr, ARDUINO_AVR_NANO: '1', __AVR_ATmega328P__: '1' },
    mega: { ...avr, ARDUINO_AVR_MEGA2560: '1', __AVR_ATmega2560__: '1' },
    esp32,
    nodemcu: { ESP8266: '1', ARDUINO_ARCH_ESP8266: '1', ARDUINO_ESP8266_NODEMCU_ESP12E: '1', F_CPU: '80000000L' },
    unor4: { ARDUINO_UNOR4_WIFI: '1', ARDUINO_ARCH_RENESAS: '1', ARDUINO_ARCH_RENESAS_UNO: '1', F_CPU: '48000000L' },
  }[board] ?? avr;
  return { ...m, ...extra };
}

function parseDefine(rest, line, col) {
  // rest: tokens after "define"
  if (!rest.length || rest[0].k !== 'id') throw new CompileError('macro names must be identifiers', line, col, 'Write it like: #define LED_PIN 13');
  const name = rest[0].v;
  let params = null, body, variadic = false;
  // function-like only if '(' immediately follows the name (no space)
  if (rest[1] && rest[1].v === '(' && rest[1].k === 'op' && rest[1].col === rest[0].col + name.length && rest[1].line === rest[0].line) {
    params = [];
    let i = 2;
    while (i < rest.length && rest[i].v !== ')') {
      if (rest[i].k === 'id') params.push(rest[i].v);
      else if (rest[i].v === '...') { variadic = true; params.push('__VA_ARGS__'); }
      else if (rest[i].v !== ',') throw new CompileError(`expected parameter name, found "${rest[i].v}"`, rest[i].line, rest[i].col);
      i++;
    }
    body = rest.slice(i + 1);
  } else body = rest.slice(1);
  return { name, params, body, variadic, line };
}

/**
 * Preprocess a sketch.
 * @returns {{ tokens, includes: [{name, line}], diagnostics: [] }}
 */
export function preprocess(source, { board = 'uno', isSupported = () => true, now } = {}) {
  const diagnostics = [];
  const includes = [];
  const text = stripComments(source.replace(/\r\n?/g, '\n'));
  const lines = text.split('\n');
  const macros = new Map();
  for (const [k, v] of Object.entries(predefinedMacros(board, now))) {
    const body = v === '' ? [] : tokenize(v).slice(0, -1);
    macros.set(k, { name: k, params: null, body, builtin: true });
  }
  const events = []; // { line, def | undef }
  const code = [];
  const cond = []; // { active, taken, sawElse }
  const active = () => cond.every((c) => c.active);

  let i = 0;
  while (i < lines.length) {
    let raw = lines[i];
    const lineNo = i + 1;
    if (raw.startsWith('\u0001')) { code.push(raw.slice(1)); i++; continue; }
    const m = /^\s*#\s*(\w*)(.*)$/.exec(raw);
    if (!m) { code.push(active() ? raw : ''); i++; continue; }
    // join continuation lines
    let body = m[2];
    let span = 1;
    while (/\\\s*$/.test(body) && i + span < lines.length) {
      body = body.replace(/\\\s*$/, ' ') + lines[i + span].replace(/^\u0001/, '');
      span++;
    }
    for (let s = 0; s < span; s++) code.push('');
    i += span;
    const dir = m[1];
    const col = raw.indexOf('#') + 1;
    const restToks = () => {
      try { return tokenize(body, lineNo).slice(0, -1).map((t) => ({ ...t, col: t.col + raw.indexOf(dir) + dir.length })); } catch (e) { throw new CompileError(e.message, lineNo, col); }
    };
    const evalCond = () => {
      const toks = restToks();
      const expanded = [];
      for (let k = 0; k < toks.length; k++) {
        const t = toks[k];
        if (t.k === 'id' && t.v === 'defined') {
          let nameTok = toks[k + 1];
          if (nameTok?.v === '(') { nameTok = toks[k + 2]; k += 3; } else k += 1;
          expanded.push({ k: 'num', v: macros.has(nameTok?.v) ? 1 : 0, line: t.line, col: t.col });
        } else expanded.push(t);
      }
      const ex = expand(expanded, macros, diagnostics).map((t) => (t.k === 'id' ? { k: 'num', v: t.v === 'true' ? 1 : 0, line: t.line, col: t.col } : t));
      return evalExpr(ex, lineNo, col) !== 0;
    };
    if (dir === 'if' || dir === 'ifdef' || dir === 'ifndef') {
      const parentActive = active();
      let v = false;
      if (parentActive) {
        if (dir === 'if') v = evalCond();
        else {
          const t = restToks()[0];
          if (!t) throw new CompileError(`no macro name given in #${dir} directive`, lineNo, col);
          v = macros.has(t.v) === (dir === 'ifdef');
        }
      }
      cond.push({ active: parentActive && v, taken: v, parent: parentActive, line: lineNo });
      continue;
    }
    if (dir === 'elif' || dir === 'else') {
      const c = cond[cond.length - 1];
      if (!c) throw new CompileError(`#${dir} without #if`, lineNo, col);
      if (c.sawElse) throw new CompileError(`#${dir} after #else`, lineNo, col);
      if (dir === 'else') { c.sawElse = true; c.active = c.parent && !c.taken; c.taken = true; }
      else {
        const v = c.parent && !c.taken ? evalCond() : false;
        c.active = v; if (v) c.taken = true;
      }
      continue;
    }
    if (dir === 'endif') {
      if (!cond.length) throw new CompileError('#endif without #if', lineNo, col);
      cond.pop();
      continue;
    }
    if (!active()) continue;
    if (dir === '') continue; // null directive
    if (dir === 'include') {
      const mm = /^\s*[<"]([^>"]+)[>"]/.exec(body);
      if (!mm) throw new CompileError('#include expects "FILENAME" or <FILENAME>', lineNo, col);
      const name = mm[1].trim();
      if (!isSupported(name)) {
        diagnostics.push({ severity: 'error', line: lineNo, col: col, message: `${name}: No such file or directory`, hint: `The ${name.replace(/\.(h|hpp)$/, '')} library is not available in the Tinker Lab simulator yet. You can still copy this sketch to the Arduino IDE and run it on a real board.` });
      }
      includes.push({ name, line: lineNo });
      continue;
    }
    if (dir === 'define') {
      const d = parseDefine(restToks(), lineNo, col);
      const old = macros.get(d.name);
      if (old && !old.builtin && JSON.stringify(old.body.map((t) => t.v)) !== JSON.stringify(d.body.map((t) => t.v)))
        diagnostics.push({ severity: 'warning', line: lineNo, col, message: `"${d.name}" redefined` });
      macros.set(d.name, d);
      events.push({ line: lineNo, def: d });
      continue;
    }
    if (dir === 'undef') {
      const t = restToks()[0];
      if (t) { macros.delete(t.v); events.push({ line: lineNo, undef: t.v }); }
      continue;
    }
    if (dir === 'error') { diagnostics.push({ severity: 'error', line: lineNo, col, message: `#error ${body.trim()}` }); continue; }
    if (dir === 'warning') { diagnostics.push({ severity: 'warning', line: lineNo, col, message: `#warning ${body.trim()}` }); continue; }
    if (dir === 'pragma' || dir === 'line' || dir === 'ident') continue;
    throw new CompileError(`invalid preprocessing directive #${dir}`, lineNo, col);
  }
  if (cond.length) throw new CompileError('unterminated #if', cond[cond.length - 1].line, 1, 'Every #if / #ifdef needs a matching #endif.');

  // tokenize the code and expand macros, applying #define / #undef in order
  const toks = tokenize(code.join('\n'));
  const live = new Map();
  for (const [k, v] of macros) if (v.builtin) live.set(k, v);
  let ev = 0;
  const out = [];
  let k = 0;
  while (k < toks.length) {
    const t = toks[k];
    while (ev < events.length && events[ev].line < t.line) {
      const e = events[ev++];
      if (e.def) live.set(e.def.name, e.def); else live.delete(e.undef);
    }
    if (t.k === 'id' && live.has(t.v)) {
      // collect enough tokens for a possible function-like invocation
      const mac = live.get(t.v);
      let end = k + 1;
      if (mac.params && toks[end]?.v === '(') {
        let depth = 0;
        for (; end < toks.length; end++) {
          if (toks[end].v === '(') depth++;
          else if (toks[end].v === ')' && --depth === 0) { end++; break; }
        }
      }
      if (t.v === '__LINE__') { out.push({ ...t, k: 'num', v: t.line, big: BigInt(t.line), decimal: true, longs: 0 }); k++; continue; }
      out.push(...expand(toks.slice(k, end), live, diagnostics));
      k = end;
    } else { out.push(t); k++; }
  }
  // adjacent string literals concatenate
  const merged = [];
  for (const t of out) {
    const prev = merged[merged.length - 1];
    if (t.k === 'str' && prev?.k === 'str') merged[merged.length - 1] = { ...prev, v: prev.v + t.v };
    else merged.push(t);
  }
  return { tokens: merged, includes, diagnostics, macros: live };
}

/** Expand macros in a token list (hide-set algorithm, simplified). */
export function expand(tokens, macros, diagnostics, hide = new Set(), depth = 0) {
  const out = [];
  if (depth > 64) return tokens;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.k !== 'id' || !macros.has(t.v) || hide.has(t.v) || t.noexpand) { out.push(t); continue; }
    const m = macros.get(t.v);
    const at = (x) => ({ ...x, line: t.line, col: t.col, fromMacro: m.name });
    if (!m.params) {
      const h = new Set(hide).add(m.name);
      out.push(...expand(m.body.map(at), macros, diagnostics, h, depth + 1));
      continue;
    }
    if (tokens[i + 1]?.v !== '(') { out.push(t); continue; }
    // collect args
    const args = [];
    let cur = [], d = 0, j = i + 1;
    for (; j < tokens.length; j++) {
      const x = tokens[j];
      if (x.v === '(' && x.k === 'op') { if (d++ > 0) cur.push(x); continue; }
      if (x.v === ')' && x.k === 'op') { if (--d === 0) { args.push(cur); break; } cur.push(x); continue; }
      if (x.v === ',' && x.k === 'op' && d === 1 && !(m.variadic && args.length >= m.params.length - 1)) { args.push(cur); cur = []; continue; }
      cur.push(x);
    }
    if (j >= tokens.length) throw new CompileError(`unterminated argument list invoking macro "${m.name}"`, t.line, t.col);
    if (args.length === 1 && args[0].length === 0 && m.params.length === 0) args.length = 0;
    if (args.length !== m.params.length && !(m.variadic && args.length >= m.params.length - 1)) {
      throw new CompileError(`macro "${m.name}" ${args.length > m.params.length ? 'passed' : 'requires'} ${Math.max(args.length, m.params.length)} arguments, but ${args.length > m.params.length ? 'takes just' : 'only'} ${args.length > m.params.length ? m.params.length : args.length}${args.length > m.params.length ? '' : ' given'}`, t.line, t.col);
    }
    const body = [];
    for (let b = 0; b < m.body.length; b++) {
      const bt = m.body[b];
      const pi = bt.k === 'id' ? m.params.indexOf(bt.v) : -1;
      if (bt.v === '#' && bt.k === 'op' && m.body[b + 1]?.k === 'id' && m.params.includes(m.body[b + 1].v)) {
        const a = args[m.params.indexOf(m.body[b + 1].v)] ?? [];
        body.push({ k: 'str', v: a.map((x) => (x.k === 'str' ? JSON.stringify(x.v) : x.k === 'char' ? `'${String.fromCharCode(x.v)}'` : x.text ?? String(x.v))).join(' '), line: t.line, col: t.col });
        b++;
        continue;
      }
      if (bt.v === '##' || (bt.v === '#' && m.body[b + 1]?.v === '#')) continue;
      if (pi >= 0) {
        const raw = args[pi] ?? [];
        const pasting = m.body[b + 1]?.v === '#' || m.body[b - 1]?.v === '#';
        body.push(...(pasting ? raw : expand(raw, macros, diagnostics, hide, depth + 1)).map(at));
      } else body.push(at(bt));
    }
    // token pasting (a ## b): join identifiers / numbers that ended up adjacent around ##
    const pasted = [];
    for (let b = 0; b < body.length; b++) pasted.push(body[b]);
    const h = new Set(hide).add(m.name);
    out.push(...expand(pasted, macros, diagnostics, h, depth + 1));
    i = j;
  }
  return out;
}

/** Evaluate a #if expression over number tokens. */
function evalExpr(toks, line, col) {
  let p = 0;
  const peek = () => toks[p]?.v;
  const fail = () => { throw new CompileError(`token "${toks[p]?.v ?? ''}" is not valid in preprocessor expressions`, line, col); };
  function primary() {
    const t = toks[p++];
    if (!t) fail();
    if (t.k === 'num' || t.k === 'char') return Number(t.v);
    if (t.v === '(') { const v = ternary(); if (toks[p++]?.v !== ')') fail(); return v; }
    if (t.v === '!') return primary() ? 0 : 1;
    if (t.v === '-') return -primary();
    if (t.v === '+') return primary();
    if (t.v === '~') return ~primary();
    p--; fail();
  }
  const levels = [['*', '/', '%'], ['+', '-'], ['<<', '>>'], ['<', '<=', '>', '>='], ['==', '!='], ['&'], ['^'], ['|'], ['&&'], ['||']];
  function bin(l) {
    if (l < 0) return primary();
    let a = bin(l - 1);
    while (levels[l].includes(peek())) {
      const op = toks[p++].v;
      const b = bin(l - 1);
      a = { '*': a * b, '/': b ? Math.trunc(a / b) : 0, '%': b ? a % b : 0, '+': a + b, '-': a - b, '<<': a << b, '>>': a >> b, '<': +(a < b), '<=': +(a <= b), '>': +(a > b), '>=': +(a >= b), '==': +(a === b), '!=': +(a !== b), '&': a & b, '^': a ^ b, '|': a | b, '&&': +(a && b), '||': +(a || b) }[op];
    }
    return a;
  }
  function ternary() {
    const c = bin(levels.length - 1);
    if (peek() === '?') { p++; const a = ternary(); if (toks[p++]?.v !== ':') fail(); const b = ternary(); return c ? a : b; }
    return c;
  }
  if (!toks.length) throw new CompileError('#if with no expression', line, col);
  const v = ternary();
  if (p < toks.length) fail();
  return v;
}
