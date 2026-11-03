// Recursive-descent parser for the Arduino C++ subset. Produces a plain AST.
import { CompileError } from './lexer.js';

const BUILTIN_TYPE_WORDS = new Set(['void', 'bool', 'char', 'short', 'int', 'long', 'float', 'double', 'signed', 'unsigned', 'auto', 'wchar_t']);
const QUALIFIERS = new Set(['const', 'static', 'volatile', 'inline', 'extern', 'register', 'constexpr', '__rtc_data', 'mutable', 'virtual']);
const KEYWORDS = new Set(['if', 'else', 'while', 'for', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'goto', 'struct', 'enum', 'union', 'class', 'typedef', 'sizeof', 'true', 'false', 'nullptr', 'new', 'delete', 'this', 'template', 'typename', 'namespace', 'using', 'operator', 'public', 'private', 'protected', ...BUILTIN_TYPE_WORDS, ...QUALIFIERS]);

const BINARY = [
  ['||'], ['&&'], ['|'], ['^'], ['&'], ['==', '!='], ['<', '<=', '>', '>='], ['<<', '>>'], ['+', '-'], ['*', '/', '%'],
];
const ASSIGN = new Set(['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=']);

function describe(t) {
  if (!t || t.k === 'eof') return null;
  if (t.k === 'id') return `'${t.v}'`;
  if (t.k === 'num') return 'numeric constant';
  if (t.k === 'str') return 'string constant';
  if (t.k === 'char') return 'character constant';
  return `'${t.v}' token`;
}

export function parse(tokens, { typeNames = new Set() } = {}) {
  let p = 0;
  const types = new Set(typeNames);
  const peek = (o = 0) => tokens[Math.min(p + o, tokens.length - 1)];
  const next = () => tokens[p++ < tokens.length ? p - 1 : tokens.length - 1];
  const is = (v, o = 0) => { const t = peek(o); return (t.k === 'op' || t.k === 'id') && t.v === v; };
  const accept = (v) => { if (is(v)) { p++; return true; } return false; };
  const prev = () => tokens[Math.max(0, p - 1)];
  const err = (msg, t = peek(), hint) => new CompileError(msg, t.line, t.col, hint);

  function expect(v, hint) {
    if (is(v)) return next();
    const t = peek();
    const d = describe(t);
    const pv = prev();
    if (v === ';') {
      // point at the end of the previous token, where the ';' belongs
      throw new CompileError(d ? `expected ';' before ${d}` : "expected ';' at end of input", pv.line, pv.col + String(pv.text ?? pv.v).length,
        hint ?? `Each statement ends with a semicolon. Add ';' at the end of line ${pv.line}.`);
    }
    if (v === '}' && t.k === 'eof') throw new CompileError("expected '}' at end of input", pv.line, pv.col, 'A { was opened but never closed. Count your braces: every { needs a matching }.');
    throw err(d ? `expected '${v}' before ${d}` : `expected '${v}' at end of input`, t, hint);
  }
  const ident = (what = 'identifier') => {
    const t = peek();
    if (t.k !== 'id' || KEYWORDS.has(t.v)) {
      const d = describe(t);
      throw err(d ? `expected ${what} before ${d}` : `expected ${what} at end of input`, t);
    }
    return next();
  };

  // ------------------------------------------------------------------ types
  function isTypeStart(o = 0) {
    const t = peek(o);
    if (t.k !== 'id') return false;
    if (BUILTIN_TYPE_WORDS.has(t.v) || QUALIFIERS.has(t.v) || t.v === 'struct' || t.v === 'enum' || t.v === 'union' || t.v === 'class') return true;
    if (types.has(t.v)) {
      if (peek(o + 1).v === '::') return types.has(`${t.v}::${peek(o + 2).v}`);
      return true;
    }
    return false;
  }

  /** Skip a balanced <...> template argument list; returns its tokens. */
  function templateArgs() {
    const start = p;
    if (!is('<')) return null;
    let depth = 0;
    for (let i = 0; ; i++) {
      const x = peek(i);
      if (x.k === 'eof' || x.v === ';' || x.v === '{') return null;
      if (x.v === '<') depth++;
      else if (x.v === '>') { if (--depth === 0) { const toks = tokens.slice(start + 1, start + i); p = start + i + 1; return toks; } }
      else if (x.v === '>>') { depth -= 2; if (depth <= 0) { const toks = tokens.slice(start + 1, start + i); p = start + i + 1; return toks; } }
    }
  }

  /** decl-specifiers: qualifiers + base type. */
  function parseSpec() {
    const spec = { words: [], line: peek().line, col: peek().col };
    let sawBase = false;
    for (;;) {
      const t = peek();
      if (t.k !== 'id') break;
      if (QUALIFIERS.has(t.v)) {
        next();
        if (t.v === '__rtc_data') spec.rtc = true; else spec[t.v] = true;
        continue;
      }
      if (BUILTIN_TYPE_WORDS.has(t.v)) {
        if (sawBase && spec.name) break;
        next();
        spec.words.push(t.v);
        sawBase = true;
        continue;
      }
      if (t.v === 'struct' || t.v === 'union' || t.v === 'class') {
        if (sawBase) break;
        next();
        if (t.v === 'union') throw err('unions are not supported in the simulator yet', t);
        const nameTok = peek().k === 'id' && !is('{') ? next() : null;
        if (is('{') || is(':')) {
          if (t.v === 'class') throw err('defining your own classes is not supported in the simulator yet', t, 'Use a struct with plain data fields and separate functions instead.');
          spec.structDef = parseStructBody(nameTok?.v, t);
          spec.name = spec.structDef.name;
        } else {
          if (!nameTok) throw err(`expected identifier before ${describe(peek())}`);
          spec.name = nameTok.v;
          spec.structRef = true;
        }
        sawBase = true;
        continue;
      }
      if (t.v === 'enum') {
        if (sawBase) break;
        next();
        const scoped = accept('class') || accept('struct');
        const nameTok = peek().k === 'id' && !is('{') ? next() : null;
        let baseSpec = null;
        if (accept(':')) baseSpec = parseSpec();
        if (is('{')) {
          spec.enumDef = parseEnumBody(nameTok?.v, t, scoped, baseSpec);
          spec.name = spec.enumDef.name;
        } else {
          if (!nameTok) throw err(`expected identifier before ${describe(peek())}`);
          spec.name = nameTok.v;
          spec.enumRef = true;
        }
        sawBase = true;
        continue;
      }
      if (!sawBase && types.has(t.v)) {
        next();
        spec.name = t.v;
        if (is('::') && types.has(`${t.v}::${peek(1).v}`)) { next(); spec.name = `${t.v}::${next().v}`; }
        if (is('<')) spec.targs = templateArgs();
        sawBase = true;
        continue;
      }
      break;
    }
    if (!sawBase) {
      const t = peek();
      if (t.k === 'id' && !KEYWORDS.has(t.v)) throw err(`'${t.v}' does not name a type`, t);
      throw err(`expected type before ${describe(t) ?? 'end of input'}`, t);
    }
    return spec;
  }

  function parseStructBody(name, at) {
    expect('{');
    const def = { kind: 'struct', name: name ?? `<anonymous struct>`, fields: [], line: at.line, col: at.col };
    if (name) types.add(name);
    while (!is('}')) {
      if (peek().k === 'eof') expect('}');
      if (accept('public') || accept('private') || accept('protected')) { expect(':'); continue; }
      const spec = parseSpec();
      do {
        const d = parseDeclarator(spec, { allowInit: true });
        if (d.params) throw err('member functions are not supported in the simulator yet', d, 'Write a normal function that takes the struct as a parameter.');
        def.fields.push({ spec, decl: d });
      } while (accept(','));
      expect(';');
    }
    expect('}');
    return def;
  }

  function parseEnumBody(name, at, scoped, baseSpec) {
    expect('{');
    const def = { kind: 'enum', name: name ?? '<anonymous enum>', items: [], scoped, baseSpec, line: at.line, col: at.col };
    if (name) types.add(name);
    while (!is('}')) {
      const n = ident('identifier');
      let value = null;
      if (accept('=')) value = parseAssign();
      def.items.push({ name: n.v, value, line: n.line, col: n.col });
      if (!accept(',')) break;
    }
    expect('}');
    return def;
  }

  /** Declarator: pointers, &, name, [dims], (params) | (ctor args) | = init. */
  function parseDeclarator(spec, { allowInit = true, abstract = false, param = false } = {}) {
    const d = { ptr: [], ref: false, dims: [], line: peek().line, col: peek().col };
    while (is('*') || is('&') || is('&&')) {
      const t = next();
      if (t.v === '*') { const q = { const: false }; while (accept('const') || accept('volatile')) q.const = true; d.ptr.push(q); }
      else d.ref = true;
    }
    // function pointer declarator: (*name)(params)
    if (is('(') && is('*', 1)) {
      next(); next();
      const n = abstract && !peek().k === 'id' ? null : ident();
      d.name = n.v; d.line = n.line; d.col = n.col;
      expect(')');
      expect('(');
      d.fnPtrParams = parseParamList();
      return d;
    }
    if (peek().k === 'id' && !KEYWORDS.has(peek().v)) {
      const n = next();
      d.name = n.v; d.line = n.line; d.col = n.col;
      // qualified name (e.g. a function defined as Foo::bar) is not supported
    } else if (!abstract) {
      const t = peek();
      if (t.k === 'id' && KEYWORDS.has(t.v)) throw err(`expected unqualified-id before '${t.v}'`, t, `'${t.v}' is a C++ keyword and can't be used as a name.`);
      const dsc = describe(t);
      throw err(dsc ? `expected unqualified-id before ${dsc}` : 'expected unqualified-id at end of input', t);
    }
    while (is('[')) {
      next();
      if (accept(']')) d.dims.push(null);
      else { d.dims.push(parseExpr()); expect(']'); }
    }
    if (is('(') && !abstract) {
      // function declarator or constructor arguments?
      const save = p;
      next();
      const looksLikeParams = is(')') ? !param : isTypeStart() && !(types.has(peek().v) && is('(', 1) && !BUILTIN_TYPE_WORDS.has(peek().v));
      if (looksLikeParams && !d.dims.length) {
        p = save;
        next();
        d.params = parseParamList();
        while (accept('const') || accept('override') || accept('noexcept')) { /* ignore */ }
        return d;
      }
      // ctor args
      d.ctorArgs = [];
      if (!is(')')) {
        do d.ctorArgs.push(parseAssign()); while (accept(','));
      }
      expect(')');
      return d;
    }
    if (allowInit && is('=')) {
      next();
      d.init = is('{') ? parseInitList() : parseAssign();
    } else if (allowInit && is('{') && !param) {
      d.init = parseInitList();
      d.braceInit = true;
    }
    return d;
  }

  function parseParamList() {
    // after '('
    const params = [];
    if (accept(')')) return params;
    if (is('void') && is(')', 1)) { next(); next(); return params; }
    do {
      if (is('...')) { next(); params.push({ variadic: true }); break; }
      const spec = parseSpec();
      const d = parseDeclarator(spec, { allowInit: false, abstract: true, param: true });
      if (accept('=')) d.def = parseAssign();
      params.push({ spec, decl: d, line: d.line, col: d.col });
    } while (accept(','));
    expect(')');
    return params;
  }

  /** type-id for casts / sizeof / template args: spec + abstract declarator */
  function parseTypeId() {
    const spec = parseSpec();
    const d = { ptr: [], ref: false, dims: [] };
    while (is('*') || is('&')) {
      const t = next();
      if (t.v === '*') { const q = { const: false }; while (accept('const')) q.const = true; d.ptr.push(q); }
      else d.ref = true;
    }
    while (is('[')) { next(); if (accept(']')) d.dims.push(null); else { d.dims.push(parseExpr()); expect(']'); } }
    return { spec, decl: d };
  }

  // ------------------------------------------------------------------ top level
  function parseProgram() {
    const decls = [];
    while (peek().k !== 'eof') {
      if (accept(';')) continue;
      decls.push(...parseExternal());
    }
    return { kind: 'program', decls };
  }

  function parseExternal() {
    const t = peek();
    if (is('using')) {
      next();
      while (!is(';') && peek().k !== 'eof') next();
      expect(';');
      return [];
    }
    if (is('template')) throw err('templates are not supported in the simulator yet', t);
    if (is('namespace')) throw err('namespaces are not supported in the simulator yet', t);
    if (is('extern') && peek(1).k === 'str') { next(); next(); if (is('{')) { next(); const out = []; while (!is('}')) out.push(...parseExternal()); next(); return out; } }
    if (is('typedef')) return [parseTypedef()];
    if (t.k === 'id' && !isTypeStart()) {
      if (KEYWORDS.has(t.v)) throw err(`expected unqualified-id before '${t.v}'`, t, t.v === 'if' || t.v === 'for' || t.v === 'while' ? 'Statements like this must be inside a function, e.g. inside loop() { ... }.' : undefined);
      // call or assignment at top level, or an unknown type
      if (is('(', 1) || is('=', 1) || is('.', 1)) throw err(`'${t.v}' does not name a type`, t, 'Code that does something (calls, assignments) must go inside a function such as setup() or loop().');
      throw err(`'${t.v}' does not name a type`, t);
    }
    if (t.k !== 'id') {
      if (is('}')) throw err("expected declaration before '}' token", t, 'There is an extra } here. Each } must close a { that came before it.');
      throw err(`expected unqualified-id before ${describe(t)}`, t);
    }
    const spec = parseSpec();
    if (accept(';')) {
      return [{ kind: 'decl', spec, decls: [], line: spec.line, col: spec.col, global: true }];
    }
    const first = parseDeclarator(spec);
    if (first.params) {
      if (is('{')) {
        const body = parseBlock();
        return [{ kind: 'func', spec, decl: first, body, line: first.line, col: first.col, name: first.name, endLine: prev().line }];
      }
      if (is(';')) { next(); return [{ kind: 'proto', spec, decl: first, line: first.line, col: first.col, name: first.name }]; }
      if (peek().k === 'id' && isTypeStart()) {
        throw err(`expected ';' or '{' before ${describe(peek())}`, peek(), 'A function needs a body in { } after its parameter list.');
      }
      throw err(`expected initializer before ${describe(peek()) ?? 'end of input'}`, peek());
    }
    const decls = [first];
    while (accept(',')) decls.push(parseDeclarator(spec));
    if (!is(';')) {
      const nt = peek();
      if (nt.k === 'id' && (BUILTIN_TYPE_WORDS.has(nt.v) || types.has(nt.v))) {
        const pv = prev();
        throw new CompileError(`expected ',' or ';' before ${describe(nt)}`, pv.line, pv.col + String(pv.text ?? pv.v).length, `Each declaration ends with a semicolon. Add ';' at the end of line ${pv.line}.`);
      }
      if (nt.k === 'id' || nt.k === 'num' || nt.k === 'str') {
        const pv = prev();
        throw new CompileError(`expected ',' or ';' before ${describe(nt)}`, pv.line, pv.col + String(pv.text ?? pv.v).length, `Each declaration ends with a semicolon. Add ';' at the end of line ${pv.line}.`);
      }
      if (is('{')) throw err(`expected ',' or ';' before '{' token`, nt, 'A function name needs parentheses: void myFunction() { ... }');
    }
    expect(';');
    return [{ kind: 'decl', spec, decls, line: spec.line, col: spec.col, global: true }];
  }

  function parseTypedef() {
    const t = next();
    const spec = parseSpec();
    const d = parseDeclarator(spec, { allowInit: false });
    expect(';');
    types.add(d.name);
    return { kind: 'typedef', spec, decl: d, line: t.line, col: t.col, name: d.name };
  }

  // ------------------------------------------------------------------ statements
  function parseBlock() {
    const open = expect('{');
    const body = [];
    while (!is('}')) {
      if (peek().k === 'eof') expect('}');
      body.push(parseStatement());
    }
    const close = next();
    return { kind: 'block', body, line: open.line, col: open.col, endLine: close.line };
  }

  function isDeclStart() {
    const t = peek();
    if (t.k !== 'id') return false;
    if (BUILTIN_TYPE_WORDS.has(t.v) || QUALIFIERS.has(t.v) || t.v === 'struct' || t.v === 'enum' || t.v === 'typedef') {
      // functional casts like int(x) at statement start are rare; treat builtin types as declarations
      return true;
    }
    if (types.has(t.v)) {
      const n = peek(1);
      if (n.v === '::') return types.has(`${t.v}::${peek(2).v}`);
      if (n.v === '(' || n.v === '.') return false;
      return true;
    }
    return false;
  }

  function parseStatement() {
    const t = peek();
    const at = { line: t.line, col: t.col };
    if (t.k === 'op' && t.v === '{') return parseBlock();
    if (t.k === 'op' && t.v === ';') { next(); return { kind: 'empty', ...at }; }
    if (t.k === 'id') {
      switch (t.v) {
        case 'if': {
          next();
          expect('(', "An if needs a condition in parentheses: if (x > 5) { ... }");
          const cond = parseCondition();
          expect(')');
          const then = parseStatement();
          let els = null;
          if (accept('else')) els = parseStatement();
          return { kind: 'if', cond, then, els, ...at };
        }
        case 'else':
          throw err("'else' without a previous 'if'", t, 'Check the braces before this else: an else must follow the } of an if block directly.');
        case 'while': {
          next();
          expect('(');
          const cond = parseCondition();
          expect(')');
          const body = parseStatement();
          return { kind: 'while', cond, body, ...at };
        }
        case 'do': {
          next();
          const body = parseStatement();
          const w = peek();
          if (!accept('while')) throw err(`expected 'while' before ${describe(peek())}`);
          expect('(');
          const cond = parseExpr();
          expect(')');
          expect(';');
          return { kind: 'do', body, cond, ...at, condLine: w.line };
        }
        case 'for': {
          next();
          expect('(');
          let init = null;
          if (!is(';')) {
            if (isDeclStart()) {
              const spec = parseSpec();
              const d = parseDeclarator(spec, { allowInit: true });
              if (accept(':')) {
                const range = parseExpr();
                expect(')');
                const body = parseStatement();
                return { kind: 'rangefor', spec, decl: d, range, body, ...at };
              }
              const decls = [d];
              while (accept(',')) decls.push(parseDeclarator(spec));
              init = { kind: 'decl', spec, decls, ...at };
            } else init = { kind: 'expr', expr: parseExpr(), ...at };
          }
          expect(';', "A for loop has three parts separated by semicolons: for (int i = 0; i < 10; i++)");
          const cond = is(';') ? null : parseExpr();
          expect(';', "A for loop has three parts separated by semicolons: for (int i = 0; i < 10; i++)");
          const step = is(')') ? null : parseExpr();
          expect(')');
          const body = parseStatement();
          return { kind: 'for', init, cond, step, body, ...at };
        }
        case 'switch': {
          next();
          expect('(');
          const cond = parseExpr();
          expect(')');
          const body = parseStatement();
          return { kind: 'switch', cond, body, ...at };
        }
        case 'case': {
          next();
          const value = parseCond();
          let hi = null;
          if (accept('...')) hi = parseCond();
          expect(':', "A case label ends with a colon: case 1:");
          return { kind: 'case', value, hi, ...at };
        }
        case 'default':
          next();
          expect(':');
          return { kind: 'default', ...at };
        case 'break': next(); expect(';'); return { kind: 'break', ...at };
        case 'continue': next(); expect(';'); return { kind: 'continue', ...at };
        case 'return': {
          next();
          const value = is(';') ? null : is('{') ? parseInitList() : parseExpr();
          expect(';');
          return { kind: 'return', value, ...at };
        }
        case 'goto': throw err('goto is not supported in the simulator', t, 'Use a loop with break, or a function, instead of goto.');
        case 'typedef': return parseTypedef();
        default: break;
      }
      if (isDeclStart()) {
        const spec = parseSpec();
        if (accept(';')) return { kind: 'decl', spec, decls: [], ...at };
        const decls = [parseDeclarator(spec)];
        if (decls[0].params) {
          if (is('{')) throw err('a function-definition is not allowed here before \'{\' token', peek(), 'Functions cannot be defined inside other functions. Move it outside, above setup().');
        }
        while (accept(',')) decls.push(parseDeclarator(spec));
        expect(';');
        return { kind: 'decl', spec, decls, ...at };
      }
      // label?
      if (peek(1).v === ':' && peek(1).k === 'op' && !KEYWORDS.has(t.v)) throw err('labels and goto are not supported in the simulator', t);
    }
    const expr = parseExpr();
    expect(';');
    return { kind: 'expr', expr, ...at };
  }

  function parseCondition() {
    // a declaration in a condition: if (int x = f())
    if (isDeclStart() && !is('(', 1)) {
      const spec = parseSpec();
      const d = parseDeclarator(spec);
      return { kind: 'condDecl', spec, decl: d, line: d.line, col: d.col };
    }
    return parseExpr();
  }

  // ------------------------------------------------------------------ expressions
  function parseExpr() {
    let e = parseAssign();
    while (is(',')) {
      const t = next();
      e = { kind: 'comma', left: e, right: parseAssign(), line: t.line, col: t.col };
    }
    return e;
  }

  function parseAssign() {
    const left = parseCond();
    const t = peek();
    if (t.k === 'op' && ASSIGN.has(t.v)) {
      next();
      const right = is('{') ? parseInitList() : parseAssign();
      return { kind: 'assign', op: t.v, left, right, line: t.line, col: t.col };
    }
    return left;
  }

  function parseCond() {
    const c = parseBinary(0);
    if (is('?')) {
      const t = next();
      const a = parseExpr();
      expect(':');
      const b = parseAssign();
      return { kind: 'cond', cond: c, a, b, line: t.line, col: t.col };
    }
    return c;
  }

  function parseBinary(level) {
    if (level >= BINARY.length) return parseUnary();
    let left = parseBinary(level + 1);
    for (;;) {
      const t = peek();
      if (t.k !== 'op' || !BINARY[level].includes(t.v)) break;
      next();
      const right = parseBinary(level + 1);
      left = { kind: 'binary', op: t.v, left, right, line: t.line, col: t.col };
    }
    return left;
  }

  function isCastAhead() {
    // ( type-id ) expr
    if (!is('(')) return false;
    const t = peek(1);
    if (t.k !== 'id') return false;
    if (!(BUILTIN_TYPE_WORDS.has(t.v) || t.v === 'const' || t.v === 'volatile' || t.v === 'struct' || t.v === 'unsigned' || types.has(t.v))) return false;
    // find matching ')' and make sure the content is only type tokens
    let i = 1, depth = 0;
    for (;; i++) {
      const x = peek(i);
      if (x.k === 'eof') return false;
      if (x.v === '(') depth++;
      if (x.v === ')') { if (depth === 0) break; depth--; }
      if (x.k === 'op' && !['*', '&', '[', ']', '(', ')'].includes(x.v)) return false;
      if (x.k === 'num' && peek(i - 1).v !== '[') return false;
      if (x.k === 'id' && !(BUILTIN_TYPE_WORDS.has(x.v) || QUALIFIERS.has(x.v) || types.has(x.v) || x.v === 'struct')) return false;
    }
    // the thing after ')' must start an operand; a '(' after a class type name means functional cast like String(x)
    if (types.has(t.v) && peek(2).v === '(' ) return false;
    return true;
  }

  function parseUnary() {
    const t = peek();
    if (t.k === 'op') {
      if (t.v === '++' || t.v === '--') { next(); return { kind: 'preinc', op: t.v, arg: parseUnary(), line: t.line, col: t.col }; }
      if (['+', '-', '!', '~', '*', '&'].includes(t.v)) { next(); return { kind: 'unary', op: t.v, arg: parseUnary(), line: t.line, col: t.col }; }
      if (t.v === '(' && isCastAhead()) {
        next();
        const type = parseTypeId();
        expect(')');
        const arg = parseUnary();
        return { kind: 'cast', type, arg, line: t.line, col: t.col };
      }
    }
    if (t.k === 'id' && t.v === 'sizeof') {
      next();
      if (is('(') && isCastAhead()) {
        next();
        const type = parseTypeId();
        expect(')');
        return { kind: 'sizeof', type, line: t.line, col: t.col };
      }
      return { kind: 'sizeof', arg: parseUnary(), line: t.line, col: t.col };
    }
    if (t.k === 'id' && (t.v === 'new' || t.v === 'delete')) throw err(`'${t.v}' (dynamic memory) is not supported in the simulator`, t, 'Use a global variable or an array instead; on a small board dynamic memory is best avoided anyway.');
    return parsePostfix(parsePrimary());
  }

  function parsePostfix(e) {
    for (;;) {
      const t = peek();
      if (t.k !== 'op') break;
      if (t.v === '(') {
        next();
        const args = [];
        if (!is(')')) {
          do args.push(is('{') ? parseInitList() : parseAssign()); while (accept(','));
        }
        if (!is(')')) {
          const nt = peek();
          throw err(`expected ')' before ${describe(nt) ?? 'end of input'}`, nt, nt.v === ';' || nt.v === '{' ? 'A ( was opened but not closed. Add the missing ).' : 'Separate the arguments with commas.');
        }
        next();
        e = { kind: 'call', callee: e, args, line: e.line, col: e.col, endLine: prev().line };
      } else if (t.v === '[') {
        next();
        const index = parseExpr();
        expect(']');
        e = { kind: 'index', obj: e, index, line: t.line, col: t.col };
      } else if (t.v === '.' || t.v === '->') {
        next();
        const n = ident('unqualified-id');
        e = { kind: 'member', obj: e, name: n.v, arrow: t.v === '->', line: n.line, col: n.col };
        if (is('<')) {
          const save = p;
          next();
          if (isTypeStart()) {
            const targ = parseTypeId();
            if (accept('>') && is('(')) e.targ = targ; else p = save;
          } else p = save;
        }
      } else if (t.v === '++' || t.v === '--') {
        next();
        e = { kind: 'postinc', op: t.v, arg: e, line: t.line, col: t.col };
      } else break;
    }
    return e;
  }

  function parseInitList() {
    const t = expect('{');
    const items = [];
    while (!is('}')) {
      items.push(is('{') ? parseInitList() : parseAssign());
      if (!accept(',')) break;
    }
    expect('}');
    return { kind: 'initlist', items, line: t.line, col: t.col };
  }

  function parseLambda() {
    const t = next(); // [
    const captures = [];
    while (!is(']')) { captures.push(next().v); }
    expect(']');
    let params = [];
    if (accept('(')) params = parseParamList();
    accept('mutable');
    let retType = null;
    if (accept('->')) retType = parseTypeId();
    const body = parseBlock();
    return { kind: 'lambda', captures, params, retType, body, line: t.line, col: t.col };
  }

  function parsePrimary() {
    const t = peek();
    const at = { line: t.line, col: t.col };
    if (t.k === 'num') { next(); return { kind: 'num', tok: t, ...at }; }
    if (t.k === 'char') { next(); return { kind: 'char', value: t.v, multi: t.multi, ...at }; }
    if (t.k === 'str') { next(); return { kind: 'str', value: t.v, ...at }; }
    if (t.k === 'op') {
      if (t.v === '(') {
        next();
        const e = parseExpr();
        if (!is(')')) {
          const nt = peek();
          throw err(`expected ')' before ${describe(nt) ?? 'end of input'}`, nt);
        }
        next();
        return { kind: 'paren', expr: e, ...at };
      }
      if (t.v === '[') return parseLambda();
      if (t.v === '{') return parseInitList();
      if (t.v === '::') { next(); return parsePrimary(); }
      const d = describe(t);
      throw err(`expected primary-expression before ${d}`, t, t.v === ')' ? 'Something is missing before this ). Check for an extra comma or an empty argument.' : undefined);
    }
    if (t.k === 'id') {
      if (t.v === 'true' || t.v === 'false') { next(); return { kind: 'bool', value: t.v === 'true' ? 1 : 0, ...at }; }
      if (t.v === 'nullptr') { next(); return { kind: 'nullptr', ...at }; }
      if (t.v === 'this') throw err("invalid use of 'this' in non-member function", t);
      if (['static_cast', 'reinterpret_cast', 'const_cast', 'dynamic_cast'].includes(t.v)) {
        next();
        expect('<');
        const type = parseTypeId();
        expect('>');
        expect('(');
        const arg = parseExpr();
        expect(')');
        return { kind: 'cast', type, arg, ...at };
      }
      // functional cast / constructor call: int(x), byte(0), String(x), DateTime(...)
      if ((BUILTIN_TYPE_WORDS.has(t.v) || types.has(t.v)) && is('(', 1)) {
        next();
        next();
        const args = [];
        if (!is(')')) { do args.push(parseAssign()); while (accept(',')); }
        expect(')');
        return { kind: 'construct', typeName: t.v, args, ...at };
      }
      if (types.has(t.v) && is('{', 1)) {
        next();
        const list = parseInitList();
        return { kind: 'construct', typeName: t.v, args: list.items, brace: true, ...at };
      }
      if (KEYWORDS.has(t.v) && !types.has(t.v)) {
        throw err(`expected primary-expression before '${t.v}'`, t, BUILTIN_TYPE_WORDS.has(t.v) ? 'A type name cannot be used here. Declarations go on their own line: int x = 5;' : undefined);
      }
      next();
      let name = t.v;
      while (is('::') && peek(1).k === 'id') { next(); name += '::' + next().v; }
      return { kind: 'ident', name, ...at };
    }
    if (t.k === 'eof') throw err('expected primary-expression at end of input', t);
    throw err(`expected primary-expression before ${describe(t)}`, t);
  }

  const program = parseProgram();
  program.typeNames = types;
  return program;
}
