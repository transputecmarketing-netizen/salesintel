// CodeMirror 6 editor for "Run my code": Arduino C++ with brand styling, line numbers,
// active-line highlight, a clickable breakpoint gutter, the debugger's execution line
// and compiler diagnostics as underlines.
import { EditorState, StateField, StateEffect, RangeSet, RangeSetBuilder } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, gutter, GutterMarker, Decoration, drawSelection, highlightSpecialChars } from '@codemirror/view';
import { syntaxHighlighting, HighlightStyle, bracketMatching, indentOnInput, indentUnit } from '@codemirror/language';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { setDiagnostics, lintKeymap } from '@codemirror/lint';
import { cpp } from '@codemirror/lang-cpp';
import { tags as t } from '@lezer/highlight';

// ------------------------------------------------------------------ breakpoints
const toggleBp = StateEffect.define({ map: (v, m) => ({ pos: m.mapPos(v.pos), on: v.on }) });
const setBps = StateEffect.define();
class BpMarker extends GutterMarker {
  toDOM() { const d = document.createElement('span'); d.className = 'cm-bp-dot'; d.setAttribute('aria-label', 'Breakpoint'); return d; }
}
const bpMarker = new BpMarker();
const bpField = StateField.define({
  create: () => RangeSet.empty,
  update(set, tr) {
    set = set.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(toggleBp)) set = e.value.on ? set.update({ add: [bpMarker.range(e.value.pos)] }) : set.update({ filter: (from) => from !== e.value.pos });
      if (e.is(setBps)) {
        const b = new RangeSetBuilder();
        for (const pos of [...e.value].sort((x, y) => x - y)) b.add(pos, pos, bpMarker);
        set = b.finish();
      }
    }
    return set;
  },
});

// ------------------------------------------------------------------ execution line
const setExec = StateEffect.define();
const execField = StateField.define({
  create: () => ({ line: 0, paused: false }),
  update(v, tr) { for (const e of tr.effects) if (e.is(setExec)) v = e.value; return v; },
});
const execDeco = EditorView.decorations.compute([execField], (state) => {
  const { line, paused, error } = state.field(execField);
  if (!line || line > state.doc.lines) return Decoration.none;
  const l = state.doc.line(line);
  return Decoration.set([Decoration.line({ class: error ? 'cm-exec-error' : paused ? 'cm-exec-paused' : 'cm-exec-running' }).range(l.from)]);
});
class ExecMarker extends GutterMarker {
  constructor(paused) { super(); this.paused = paused; }
  eq(o) { return o.paused === this.paused; }
  toDOM() { const d = document.createElement('span'); d.className = this.paused ? 'cm-exec-arrow is-paused' : 'cm-exec-arrow'; return d; }
}

// ------------------------------------------------------------------ theme (brand tokens only)
const theme = EditorView.theme({
  '&': { height: '100%', fontSize: '14px', backgroundColor: 'var(--tl-surface)', color: 'var(--tl-ink)' },
  '.cm-scroller': { fontFamily: 'var(--tl-mono)', lineHeight: '1.6' },
  '.cm-content': { padding: '8px 0', caretColor: 'var(--tl-iris)' },
  '.cm-cursor': { borderLeftColor: 'var(--tl-iris)', borderLeftWidth: '2px' },
  '&.cm-focused': { outline: 'none' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': { backgroundColor: 'var(--tl-iris-soft) !important' },
  '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--tl-subtle) 70%, transparent)' },
  '.cm-gutters': { backgroundColor: 'var(--tl-surface)', color: 'var(--tl-muted)', border: 'none', borderRight: '1px solid var(--tl-line)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--tl-ink)' },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 10px 0 4px', minWidth: '26px', cursor: 'pointer' },
  '.cm-bp-gutter': { width: '16px', cursor: 'pointer' },
  '.cm-bp-gutter .cm-gutterElement': { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  '.cm-bp-dot': { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--tl-iris)', display: 'block', boxShadow: '0 0 0 2px var(--tl-iris-soft)' },
  '.cm-bp-gutter .cm-gutterElement:hover:not(:has(.cm-bp-dot))::after': { content: '""', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--tl-iris-soft)', display: 'block' },
  '.cm-exec-gutter': { width: '12px' },
  '.cm-exec-arrow': { display: 'block', width: '0', height: '0', borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '7px solid var(--tl-iris)', marginTop: '6px', opacity: '0.55' },
  '.cm-exec-arrow.is-paused': { opacity: '1' },
  '.cm-exec-running': { backgroundColor: 'color-mix(in srgb, var(--tl-iris-soft) 55%, transparent)' },
  '.cm-exec-paused': { backgroundColor: 'var(--tl-iris-soft)', boxShadow: 'inset 3px 0 0 var(--tl-iris)' },
  '.cm-exec-error': { backgroundColor: 'var(--tl-accent-soft)', boxShadow: 'inset 3px 0 0 var(--tl-accent)' },
  '.cm-lintRange-error': { backgroundImage: 'none', textDecoration: 'underline wavy var(--tl-accent)', textUnderlineOffset: '3px', textDecorationSkipInk: 'none' },
  '.cm-lintRange-warning': { backgroundImage: 'none', textDecoration: 'underline wavy var(--tl-yellow)', textUnderlineOffset: '3px', textDecorationSkipInk: 'none' },
  '.cm-tooltip': { border: '1px solid var(--tl-line)', backgroundColor: 'var(--tl-surface)', borderRadius: '8px', boxShadow: 'var(--tl-shadow)', fontFamily: 'var(--tl-serif)' },
  '.cm-diagnostic': { padding: '6px 10px', borderLeft: '3px solid var(--tl-muted)', fontFamily: 'var(--tl-mono)', fontSize: '12.5px', maxWidth: '420px', whiteSpace: 'pre-wrap' },
  '.cm-diagnostic-error': { borderLeftColor: 'var(--tl-accent)' },
  '.cm-diagnostic-warning': { borderLeftColor: 'var(--tl-yellow)' },
  '.cm-matchingBracket': { backgroundColor: 'var(--tl-iris-soft)', color: 'inherit', outline: 'none' },
});

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.modifier, t.definitionKeyword, t.operatorKeyword], color: 'var(--code-kw)' },
  { tag: [t.typeName, t.standard(t.typeName)], color: 'var(--code-kw)' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--code-fn)' },
  { tag: [t.number, t.bool, t.null], color: 'var(--code-num)' },
  { tag: [t.string, t.character, t.special(t.string)], color: 'var(--tl-green)' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--tl-muted)' },
  { tag: [t.processingInstruction, t.meta], color: 'var(--code-kw)' },
  { tag: t.macroName, color: 'var(--code-num)' },
  { tag: t.invalid, color: 'var(--tl-accent)' },
]);

/**
 * Create an editor in `parent`.
 * opts: { doc, onChange(text), onBreakpoints(lines[]) }
 */
export function createEditor(parent, { doc = '', onChange, onBreakpoints } = {}) {
  let view;
  const bpLines = (state) => {
    const out = [];
    state.field(bpField).between(0, state.doc.length, (from) => { out.push(state.doc.lineAt(from).number); });
    return out;
  };
  const toggleAt = (v, pos) => {
    const line = v.state.doc.lineAt(pos);
    let has = false;
    v.state.field(bpField).between(line.from, line.from, () => { has = true; });
    v.dispatch({ effects: toggleBp.of({ pos: line.from, on: !has }) });
  };
  const bpGutter = gutter({
    class: 'cm-bp-gutter',
    markers: (v) => v.state.field(bpField),
    initialSpacer: () => bpMarker,
    domEventHandlers: { mousedown(v, line) { toggleAt(v, line.from); return true; } },
  });
  const execGutter = gutter({
    class: 'cm-exec-gutter',
    lineMarker(v, line) {
      const e = v.state.field(execField);
      if (!e.line || e.line > v.state.doc.lines) return null;
      return v.state.doc.line(e.line).from === line.from ? new ExecMarker(e.paused) : null;
    },
    lineMarkerChange: (u) => u.transactions.some((tr) => tr.effects.some((e) => e.is(setExec))),
  });
  const state = EditorState.create({
    doc,
    extensions: [
      bpField, execField, execDeco,
      bpGutter,
      lineNumbers({ domEventHandlers: { mousedown(v, line) { toggleAt(v, line.from); return true; } } }),
      execGutter,
      highlightActiveLineGutter(), highlightActiveLine(), highlightSpecialChars(), drawSelection(),
      history(), indentOnInput(), bracketMatching(), closeBrackets(), indentUnit.of('  '),
      EditorState.tabSize.of(2),
      cpp(), syntaxHighlighting(highlight), theme,
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...lintKeymap, indentWithTab]),
      EditorView.contentAttributes.of({ 'aria-label': 'Sketch editor', spellcheck: 'false', autocorrect: 'off', autocapitalize: 'off' }),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) onChange?.(u.state.doc.toString());
        if (u.transactions.some((tr) => tr.effects.some((e) => e.is(toggleBp) || e.is(setBps))) || (u.docChanged && u.state.field(bpField).size)) onBreakpoints?.(bpLines(u.state));
      }),
    ],
  });
  view = new EditorView({ state, parent });

  return {
    view,
    get text() { return view.state.doc.toString(); },
    replaceAll(text) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text }, effects: setExec.of({ line: 0 }) });
    },
    breakpoints: () => bpLines(view.state),
    setBreakpoints(lines) {
      const pos = lines.filter((l) => l >= 1 && l <= view.state.doc.lines).map((l) => view.state.doc.line(l).from);
      view.dispatch({ effects: setBps.of(pos) });
    },
    setExecLine(line, { paused = false, error = false, scroll = false } = {}) {
      view.dispatch({ effects: setExec.of({ line, paused, error }) });
      if (scroll && line >= 1 && line <= view.state.doc.lines) {
        const pos = view.state.doc.line(line).from;
        view.dispatch({ effects: EditorView.scrollIntoView(pos, { y: 'center' }) });
      }
    },
    setProblems(diags) {
      const doc = view.state.doc;
      const out = [];
      for (const d of diags) {
        if (!d.line || d.line > doc.lines) continue;
        const l = doc.line(d.line);
        let from = Math.min(l.to, l.from + Math.max(0, (d.col ?? 1) - 1));
        // underline the token at the column, or the whole line
        const rest = doc.sliceString(from, l.to);
        const m = /^[A-Za-z_]\w*|^\S+/.exec(rest);
        let to = m ? from + m[0].length : l.to;
        if (from >= l.to || to <= from) { from = l.from + (doc.sliceString(l.from, l.to).length - doc.sliceString(l.from, l.to).trimStart().length); to = l.to; }
        if (to <= from) to = Math.min(doc.length, from + 1);
        out.push({ from, to, severity: d.severity === 'error' ? 'error' : 'warning', message: d.hint ? `${d.message}\n${d.hint}` : d.message });
      }
      view.dispatch(setDiagnostics(view.state, out));
    },
    goto(line) {
      if (line < 1 || line > view.state.doc.lines) return;
      const pos = view.state.doc.line(line).from;
      view.dispatch({ selection: { anchor: pos }, effects: EditorView.scrollIntoView(pos, { y: 'center' }) });
      view.focus();
    },
    focus() { view.focus(); },
    destroy() { view.destroy(); },
  };
}
