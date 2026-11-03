// CodeMirror 6 editor for Arduino C++: syntax highlighting, Arduino API
// completions, lint markers from the runtime's diagnostics, a breakpoint
// gutter and the debugger's current-line highlight.
import { EditorView, keymap, gutter, GutterMarker, Decoration, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, dropCursor, rectangularSelection } from '@codemirror/view';
import { EditorState, StateField, StateEffect, RangeSet, Compartment } from '@codemirror/state';
import { cpp } from '@codemirror/lang-cpp';
import { syntaxHighlighting, HighlightStyle, indentOnInput, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap, snippetCompletion } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { linter, lintGutter, setDiagnostics } from '@codemirror/lint';
import { tags as t } from '@lezer/highlight';

// ---------------------------------------------------------------- Arduino completions
const S = (label, snippet, detail, info) => snippetCompletion(snippet, { label, detail, info, type: 'function' });
const C = (label, detail, type = 'constant') => ({ label, detail, type });
const ARDUINO = [
  S('pinMode', 'pinMode(${pin}, ${OUTPUT});', '(pin, mode)', 'Set a pin to INPUT, OUTPUT or INPUT_PULLUP.'),
  S('digitalWrite', 'digitalWrite(${pin}, ${HIGH});', '(pin, value)', 'Drive an output pin HIGH (logic voltage) or LOW (0 V).'),
  S('digitalRead', 'digitalRead(${pin})', '(pin) → HIGH | LOW', 'Read an input pin.'),
  S('analogWrite', 'analogWrite(${pin}, ${128});', '(pin, 0–255)', 'PWM output on ~ pins.'),
  S('analogRead', 'analogRead(${A0})', '(pin) → 0–1023', 'Read the voltage on an analog pin (10-bit on AVR, 12-bit on ESP32).'),
  S('delay', 'delay(${1000});', '(ms)', 'Pause the sketch.'),
  S('delayMicroseconds', 'delayMicroseconds(${10});', '(µs)', 'Short pause.'),
  S('millis', 'millis()', '→ unsigned long', 'Milliseconds since start.'),
  S('micros', 'micros()', '→ unsigned long', 'Microseconds since start.'),
  S('tone', 'tone(${pin}, ${440});', '(pin, Hz[, ms])', 'Square wave for a passive buzzer.'),
  S('noTone', 'noTone(${pin});', '(pin)', 'Stop tone().'),
  S('pulseIn', 'pulseIn(${pin}, ${HIGH})', '(pin, level[, timeout]) → µs', 'Measure a pulse (ultrasonic echo).'),
  S('map', 'map(${value}, ${0}, ${1023}, ${0}, ${255})', '(x, inLo, inHi, outLo, outHi)', 'Re-scale a number.'),
  S('constrain', 'constrain(${x}, ${0}, ${255})', '(x, lo, hi)', 'Clamp a number.'),
  S('random', 'random(${10})', '([min,] max)', 'Pseudo-random number.'),
  S('Serial.begin', 'Serial.begin(${9600});', '(baud)', 'Start the serial port.'),
  S('Serial.println', 'Serial.println(${value});', '(value)', 'Print and start a new line.'),
  S('Serial.print', 'Serial.print(${value});', '(value)', 'Print without a newline.'),
  S('Serial.available', 'Serial.available()', '→ int', 'Bytes waiting to be read.'),
  S('Serial.read', 'Serial.read()', '→ int', 'Read one byte (-1 if none).'),
  S('Serial.parseInt', 'Serial.parseInt()', '→ long', 'Read a number.'),
  S('Serial.readStringUntil', "Serial.readStringUntil('${\\n}')", '(char) → String', 'Read text up to a character.'),
  S('setup', 'void setup() {\n  ${}\n}', 'runs once', ''),
  S('loop', 'void loop() {\n  ${}\n}', 'runs forever', ''),
  S('for', 'for (int ${i} = 0; ${i} < ${10}; ${i}++) {\n  ${}\n}', 'loop', ''),
  S('if', 'if (${condition}) {\n  ${}\n}', 'branch', ''),
  S('while', 'while (${condition}) {\n  ${}\n}', 'loop', ''),
  S('#include <Servo.h>', '#include <Servo.h>', 'library', 'Servo motors'),
  S('#include <Wire.h>', '#include <Wire.h>', 'library', 'I²C'),
  S('#include <LiquidCrystal_I2C.h>', '#include <LiquidCrystal_I2C.h>', 'library', '16×2 LCD over I²C'),
  S('#include <Adafruit_NeoPixel.h>', '#include <Adafruit_NeoPixel.h>', 'library', 'WS2812 LEDs'),
  S('#include <Adafruit_SSD1306.h>', '#include <Adafruit_GFX.h>\n#include <Adafruit_SSD1306.h>', 'library', 'OLED display'),
  S('#include <DHT.h>', '#include <DHT.h>', 'library', 'DHT11 / DHT22'),
  S('#include <Keypad.h>', '#include <Keypad.h>', 'library', 'Matrix keypads'),
  ...['HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP', 'LED_BUILTIN', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'true', 'false'].map((k) => C(k, 'constant')),
  ...['int', 'long', 'unsigned long', 'float', 'bool', 'byte', 'char', 'String', 'const int', 'uint8_t'].map((k) => C(k, 'type', 'type')),
];
const LIB_METHODS = {
  servo: ['attach', 'write', 'writeMicroseconds', 'read', 'detach'],
  lcd: ['init', 'begin', 'backlight', 'noBacklight', 'clear', 'setCursor', 'print', 'createChar', 'home'],
  strip: ['begin', 'show', 'setPixelColor', 'Color', 'clear', 'setBrightness', 'numPixels', 'fill', 'ColorHSV', 'gamma32'],
  pixels: ['begin', 'show', 'setPixelColor', 'Color', 'clear', 'setBrightness', 'numPixels', 'fill', 'ColorHSV', 'gamma32'],
  display: ['begin', 'clearDisplay', 'display', 'setTextSize', 'setTextColor', 'setCursor', 'print', 'println', 'drawPixel', 'drawLine', 'drawRect', 'fillRect', 'drawCircle', 'fillCircle'],
  dht: ['begin', 'readTemperature', 'readHumidity'],
  keypad: ['getKey'],
};

function arduinoComplete(ctx) {
  const member = ctx.matchBefore(/[A-Za-z_]\w*\.\w*/);
  if (member) {
    const [obj] = member.text.split('.');
    const list = LIB_METHODS[obj.toLowerCase()] ?? (obj === 'Serial' ? ['begin', 'print', 'println', 'available', 'read', 'parseInt', 'readStringUntil', 'write'] : null);
    if (list) return { from: member.from + obj.length + 1, options: list.map((m) => ({ label: m, type: 'method' })), validFor: /^\w*$/ };
  }
  const word = ctx.matchBefore(/#?[\w]*/);
  if (!word || (word.from === word.to && !ctx.explicit)) return null;
  return { from: word.from, options: ARDUINO, validFor: /^#?[\w ]*$/ };
}

// ---------------------------------------------------------------- breakpoints
const bpEffect = StateEffect.define({ map: (v, m) => ({ pos: m.mapPos(v.pos), on: v.on }) });
class BpMarker extends GutterMarker {
  toDOM() {
    const s = document.createElement('span');
    s.className = 'cm-bp';
    s.setAttribute('aria-label', 'Breakpoint');
    return s;
  }
}
const bpMarker = new BpMarker();
const bpField = StateField.define({
  create: () => RangeSet.empty,
  update(set, tr) {
    set = set.map(tr.changes);
    for (const e of tr.effects) {
      if (!e.is(bpEffect)) continue;
      if (e.value.on) set = set.update({ add: [bpMarker.range(e.value.pos)] });
      else set = set.update({ filter: (from) => from !== e.value.pos });
    }
    return set;
  },
});
function toggleBp(view, pos) {
  let has = false;
  view.state.field(bpField).between(pos, pos, () => { has = true; });
  view.dispatch({ effects: bpEffect.of({ pos, on: !has }) });
}
const bpGutter = [
  bpField,
  gutter({
    class: 'cm-bp-gutter',
    markers: (v) => v.state.field(bpField),
    initialSpacer: () => bpMarker,
    domEventHandlers: {
      mousedown(view, line) { toggleBp(view, line.from); return true; },
    },
  }),
];

// ---------------------------------------------------------------- execution line
const execEffect = StateEffect.define();
const execField = StateField.define({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (!e.is(execEffect)) continue;
      if (e.value == null) deco = Decoration.none;
      else {
        const line = tr.state.doc.line(Math.min(Math.max(1, e.value.line), tr.state.doc.lines));
        deco = Decoration.set([Decoration.line({ class: e.value.paused ? 'cm-exec cm-exec-paused' : 'cm-exec' }).range(line.from)]);
      }
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

// ---------------------------------------------------------------- look
const style = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.modifier, t.definitionKeyword], color: 'var(--cm-kw)' },
  { tag: [t.typeName, t.standard(t.typeName)], color: 'var(--cm-type)' },
  { tag: [t.number, t.bool, t.null], color: 'var(--cm-num)' },
  { tag: [t.string, t.character], color: 'var(--cm-str)' },
  { tag: [t.lineComment, t.blockComment], color: 'var(--cm-com)' },
  { tag: [t.processingInstruction, t.meta], color: 'var(--cm-meta)' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--cm-fn)' },
  { tag: t.macroName, color: 'var(--cm-meta)' },
  { tag: t.operator, color: 'var(--tl-ink-2)' },
]);
const theme = EditorView.theme({
  '&': { height: '100%', fontSize: '13.5px', background: 'var(--tl-bg)' },
  '.cm-scroller': { fontFamily: 'var(--tl-mono)', lineHeight: '1.6' },
  '.cm-gutters': { background: 'var(--tl-bg)', border: 'none', color: 'var(--tl-muted)' },
  '.cm-activeLine': { background: 'color-mix(in srgb, var(--tl-iris) 5%, transparent)' },
  '.cm-activeLineGutter': { background: 'transparent', color: 'var(--tl-ink)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { background: 'color-mix(in srgb, var(--tl-iris) 20%, transparent) !important' },
  '.cm-cursor': { borderLeftColor: 'var(--tl-iris)' },
  '.cm-tooltip': { border: '1px solid var(--tl-line)', borderRadius: '10px', background: 'var(--tl-bg)', boxShadow: 'var(--tl-shadow)', overflow: 'hidden' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': { background: 'var(--tl-iris-soft)', color: 'var(--tl-iris-ink)' },
  '.cm-completionDetail': { color: 'var(--tl-muted)', marginLeft: '8px' },
});

export class CodeEditor {
  constructor(parent, { doc = '', onChange, onBreakpoints } = {}) {
    this.onChange = onChange;
    this.onBreakpoints = onBreakpoints;
    this.ro = new Compartment();
    const update = EditorView.updateListener.of((u) => {
      if (u.docChanged) this.onChange?.(u.state.doc.toString());
      if (u.transactions.some((tr) => tr.effects.some((e) => e.is(bpEffect))) || u.docChanged) this.onBreakpoints?.(this.breakpoints());
    });
    this.view = new EditorView({
      parent,
      state: EditorState.create({
        doc,
        extensions: [
          bpGutter,
          lineNumbers(),
          foldGutter(),
          lintGutter(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          drawSelection(),
          dropCursor(),
          rectangularSelection(),
          history(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightSelectionMatches(),
          autocompletion({ override: [arduinoComplete], icons: false }),
          cpp(),
          syntaxHighlighting(style),
          execField,
          linter(null),
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...searchKeymap, ...historyKeymap, ...foldKeymap, ...completionKeymap, indentWithTab]),
          theme,
          this.ro.of(EditorState.readOnly.of(false)),
          EditorView.contentAttributes.of({ 'aria-label': 'Sketch editor (Arduino C++)' }),
          update,
        ],
      }),
    });
  }

  get doc() { return this.view.state.doc.toString(); }
  setDoc(text) {
    this.view.dispatch({ changes: { from: 0, to: this.view.state.doc.length, insert: text }, effects: [execEffect.of(null)] });
  }
  setReadOnly(on) { this.view.dispatch({ effects: this.ro.reconfigure(EditorState.readOnly.of(!!on)) }); }

  /** Diagnostics from compile(): [{ severity, line, col, message, hint }]. */
  setDiagnostics(list) {
    const doc = this.view.state.doc;
    const diags = (list ?? []).filter((d) => d.line >= 1).map((d) => {
      const line = doc.line(Math.min(d.line, doc.lines));
      const from = Math.min(line.to, line.from + Math.max(0, (d.col ?? 1) - 1));
      const to = from < line.to ? Math.max(from + 1, wordEnd(line.text, from - line.from) + line.from) : from;
      return { from, to, severity: d.severity === 'warning' ? 'warning' : 'error', message: d.hint ? `${d.message}\n${d.hint}` : d.message };
    });
    this.view.dispatch(setDiagnostics(this.view.state, diags));
  }

  /** Highlight the line being executed (null clears). */
  setExecLine(line, paused = false) {
    if (line === this.execLine && paused === this.execPaused) return;
    this.execLine = line;
    this.execPaused = paused;
    this.view.dispatch({ effects: execEffect.of(line ? { line, paused } : null) });
    if (line && paused) {
      const l = this.view.state.doc.line(Math.min(line, this.view.state.doc.lines));
      this.view.dispatch({ effects: EditorView.scrollIntoView(l.from, { y: 'center' }) });
    }
  }

  breakpoints() {
    const out = [];
    const doc = this.view.state.doc;
    this.view.state.field(bpField).between(0, doc.length, (from) => { out.push(doc.lineAt(from).number); });
    return out;
  }
  toggleBreakpoint(line) {
    const l = this.view.state.doc.line(line);
    toggleBp(this.view, l.from);
  }
  focus() { this.view.focus(); }
}

function wordEnd(text, i) {
  let j = i;
  while (j < text.length && /[\w]/.test(text[j])) j++;
  return j === i ? i + 1 : j;
}
