// Read-only code view with syntax colouring, line numbers, a highlighted
// "current line", and editable number parameters ({{name}} in the source).
const KEYWORDS = /\b(void|int|long|float|double|const|if|else|for|while|do|return|bool|byte|unsigned|char|uint8_t|uint16_t|uint32_t|int16_t|volatile|static|switch|case|break|default|String|struct|enum|auto|class|public|private)\b/;
const PY_KEYWORDS = /\b(def|import|from|as|while|for|in|if|elif|else|return|True|False|None|and|or|not|try|except|finally|with|class|lambda|global|pass|break|continue|async|await|yield|is)\b/;
const CONSTANTS = /\b(HIGH|LOW|OUTPUT|INPUT|INPUT_PULLUP|LED_BUILTIN|A[0-5]|true|false)\b/;
const FUNCS = /\b(pinMode|digitalWrite|digitalRead|analogWrite|analogRead|delay|delayMicroseconds|pulseIn|tone|noTone|millis|micros|map|constrain|Serial\d?|Wire|SPI|WiFi|EEPROM|begin|println|print|available|read|attach|write|setColor|readCm|light|setup|loop|attachInterrupt|digitalPinToInterrupt|random|randomSeed|abs|min|max|sqrt|pow|sin|cos|shiftOut|show|setPixelColor|clear|display|setCursor|setTextSize|drawLine|fillRect|on|send|handleClient|connect|publish|subscribe|status|localIP|readTemperature|readHumidity|step|setSpeed|lcd|init|backlight)\b/;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function highlight(line, lang = 'cpp') {
  if (lang === 'python') return highlightPy(line);
  // split out comments and strings first
  let out = '';
  const re = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)')|(#(?:include|define)\b.*$)|(\{\{\w+\}\})|(\b(?:0x[0-9A-Fa-f]+|\d+(?:\.\d+)?)\b)|([A-Za-z_]\w*)|(\s+)|(.)/g;
  let m;
  while ((m = re.exec(line))) {
    const [tok, comment, str, inc, param, num, word] = m;
    if (comment) out += `<span class="t-com">${esc(comment)}</span>`;
    else if (str) out += `<span class="t-str">${esc(str)}</span>`;
    else if (inc) out += `<span class="t-kw">${esc(inc)}</span>`;
    else if (param) out += param; // replaced later
    else if (num) out += `<span class="t-num">${num}</span>`;
    else if (word) {
      if (KEYWORDS.test(word) && word.match(KEYWORDS)[0] === word) out += `<span class="t-kw">${word}</span>`;
      else if (CONSTANTS.test(word) && word.match(CONSTANTS)[0] === word) out += `<span class="t-const">${word}</span>`;
      else if (FUNCS.test(word) && word.match(FUNCS)[0] === word) out += `<span class="t-fn">${word}</span>`;
      else out += esc(word);
    } else out += esc(tok);
  }
  return out;
}

const PY_FUNCS = /^(print|range|len|int|float|str|sleep|time|Pin|PWM|ADC|I2C|SPI|UART|setup|output|input|cleanup|setmode|setwarnings|value|duty_u16|read_u16|freq|imread|imshow|VideoCapture|read|cvtColor|putText|rectangle|waitKey|Detect|Classify|Capture|Render|videoSource|videoOutput|detectNet|imageNet|poseNet|Open|IsStreaming|Capture|SetStatus|GetClassDesc|round|abs|min|max|map|open|write|append|format|enumerate|sum)$/;
function highlightPy(line) {
  let out = '';
  const re = /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\{\{\w+\}\})|(\b(?:0x[0-9A-Fa-f]+|\d+(?:\.\d+)?)\b)|([A-Za-z_]\w*)|(\s+)|(.)/g;
  let m;
  while ((m = re.exec(line))) {
    const [tok, comment, str, param, num, word] = m;
    if (comment) out += `<span class="t-com">${esc(comment)}</span>`;
    else if (str) out += `<span class="t-str">${esc(str)}</span>`;
    else if (param) out += param;
    else if (num) out += `<span class="t-num">${num}</span>`;
    else if (word) {
      if (word.match(PY_KEYWORDS)?.[0] === word) out += `<span class="t-kw">${word}</span>`;
      else if (/^[A-Z][A-Z0-9_]+$/.test(word)) out += `<span class="t-const">${word}</span>`;
      else if (PY_FUNCS.test(word)) out += `<span class="t-fn">${word}</span>`;
      else out += esc(word);
    } else out += esc(tok);
  }
  return out;
}

export class CodeView {
  constructor(pre, { onParam }) {
    this.pre = pre;
    this.onParam = onParam;
    pre.addEventListener('keydown', (e) => {
      const el = e.target.closest('.param');
      if (!el) return;
      if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
      else if (e.key.length === 1 && !/[0-9.\-]/.test(e.key)) e.preventDefault();
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        this.#nudge(el, e.key === 'ArrowUp' ? 1 : -1, e.shiftKey ? 100 : 10);
      }
    });
    pre.addEventListener('focusout', (e) => {
      const el = e.target.closest('.param');
      if (el) this.#commit(el, el.textContent);
    });
    pre.addEventListener('wheel', (e) => {
      const el = e.target.closest('.param');
      if (!el || document.activeElement !== el) return;
      e.preventDefault();
      this.#nudge(el, e.deltaY < 0 ? 1 : -1, 10);
    }, { passive: false });
  }

  #nudge(el, dir, step) {
    const spec = this.params[el.dataset.key];
    const s = spec.max - spec.min > 200 ? step : 1;
    this.#commit(el, Number(el.textContent) + dir * s);
  }

  #commit(el, raw) {
    const key = el.dataset.key;
    const spec = this.params[key];
    let val = Number(raw);
    if (!Number.isFinite(val)) val = this.values[key];
    val = Math.min(spec.max, Math.max(spec.min, Math.round(val)));
    this.values[key] = val;
    el.textContent = String(val);
    this.onParam?.(key, val);
  }

  render(lesson, values) {
    this.lesson = lesson;
    this.params = lesson.params ?? {};
    this.values = values;
    this.lines = lesson.code.split('\n');
    this.pre.innerHTML = this.lines
      .map((l, i) => {
        const html = highlight(l, lesson.lang).replace(/\{\{(\w+)\}\}/g, (_, k) =>
          `<span class="param" contenteditable="plaintext-only" spellcheck="false" inputmode="numeric" data-key="${k}" title="Click to edit · ↑/↓ to nudge">${values[k]}</span>`);
        return `<span class="ln" data-n="${i + 1}"><span class="ln-no">${i + 1}</span><span class="ln-code">${html || ' '}</span></span>`;
      })
      .join('');
    this.current = null;
  }

  /** Plain text with current parameter values filled in. */
  text() {
    return this.lesson.code.replace(/\{\{(\w+)\}\}/g, (_, k) => this.values[k]);
  }

  /** Highlight the nth line containing `needle`. */
  highlightLine(needle, nth = 1) {
    let count = 0, idx = -1;
    const lines = this.text().split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(needle) && ++count === nth) { idx = i; break; }
    }
    if (idx < 0) return;
    const el = this.pre.children[idx];
    if (el === this.current) return;
    this.current?.classList.remove('is-current');
    el.classList.add('is-current');
    this.current = el;
    const wrap = this.pre.parentElement;
    const top = el.offsetTop, bottom = top + el.offsetHeight;
    if (top < wrap.scrollTop + 8 || bottom > wrap.scrollTop + wrap.clientHeight - 8)
      wrap.scrollTo({ top: top - wrap.clientHeight / 2 + el.offsetHeight / 2, behavior: 'smooth' });
  }

  clearHighlight() {
    this.current?.classList.remove('is-current');
    this.current = null;
  }
}
