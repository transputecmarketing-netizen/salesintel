// Bottom-dock panels for the Studio: Serial monitor (with input), Serial
// plotter (Arduino IDE format: numbers separated by spaces/commas/tabs, optional
// "label:value"), and the debugger's variables + call stack.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export class SerialMonitor {
  constructor(el, { onSend }) {
    this.el = el;
    el.innerHTML = `
      <div class="mon-out" role="log" aria-live="polite" aria-label="Serial output" tabindex="0"></div>
      <form class="mon-in">
        <input type="text" placeholder="Send to the board (Enter)" aria-label="Serial input" autocomplete="off" spellcheck="false" />
        <select aria-label="Line ending"><option value="\n">Newline</option><option value="">No line ending</option><option value="\r\n">CR + LF</option></select>
        <button type="submit" class="pill pill-sm">Send</button>
      </form>`;
    this.out = el.querySelector('.mon-out');
    this.input = el.querySelector('input');
    this.ending = el.querySelector('select');
    el.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.input.value;
      onSend?.(text + this.ending.value);
      this.echo(text);
      this.input.value = '';
    });
    this.buf = '';
    this.lines = 0;
    this.pending = '';
    this.onLine = null;
  }
  write(text) {
    this.pending += text;
    if (!this.raf) this.raf = requestAnimationFrame(() => this.#flush());
  }
  #flush() {
    this.raf = 0;
    const text = this.pending;
    this.pending = '';
    if (!text) return;
    const stick = this.out.scrollTop + this.out.clientHeight >= this.out.scrollHeight - 8;
    this.buf += text;
    const parts = this.buf.split('\n');
    this.buf = parts.pop();
    for (const line of parts) this.onLine?.(line.replace(/\r$/, ''));
    // append as text nodes; keep the last ~1500 lines
    this.out.append(document.createTextNode(text));
    this.lines += parts.length;
    if (this.lines > 1500) {
      const all = this.out.textContent;
      const keep = all.split('\n').slice(-1000).join('\n');
      this.out.textContent = keep;
      this.lines = 1000;
    }
    if (stick) this.out.scrollTop = this.out.scrollHeight;
  }
  echo(text) {
    const s = document.createElement('span');
    s.className = 'mon-echo';
    s.textContent = `→ ${text}\n`;
    this.out.append(s);
    this.out.scrollTop = this.out.scrollHeight;
  }
  note(text) {
    const s = document.createElement('span');
    s.className = 'mon-note';
    s.textContent = `${text}\n`;
    this.out.append(s);
    this.out.scrollTop = this.out.scrollHeight;
  }
  clear() {
    this.out.textContent = '';
    this.buf = '';
    this.lines = 0;
  }
  get text() { return this.out.textContent; }
}

const SERIES = ['--tl-iris', '--tl-accent', '--tl-green', '--tl-yellow', '--tl-blue', '--tl-ink-2', '#b7179c', '#0f7a8a'];

export class Plotter {
  constructor(el) {
    this.el = el;
    el.innerHTML = '<div class="plot-legend"></div><canvas class="plot-canvas" aria-label="Serial plotter"></canvas><p class="plot-empty">Print numbers with <code>Serial.println(value)</code> (several values separated by spaces or commas, or <code>label:value</code>) and they appear here.</p>';
    this.canvas = el.querySelector('canvas');
    this.legend = el.querySelector('.plot-legend');
    this.empty = el.querySelector('.plot-empty');
    this.data = [];
    this.names = [];
    this.max = 400;
    this.dirty = false;
    this.colors = SERIES.map((c) => (c.startsWith('--') ? getComputedStyle(document.documentElement).getPropertyValue(c).trim() || '#5b3df5' : c));
    new ResizeObserver(() => { this.dirty = true; this.draw(); }).observe(el);
  }
  line(text) {
    const tokens = text.trim().split(/[\s,;\t]+/).filter(Boolean);
    if (!tokens.length) return;
    const vals = [], names = [];
    for (const tok of tokens) {
      const m = /^([^:]+):(-?[\d.eE+-]+)$/.exec(tok);
      const v = Number(m ? m[2] : tok);
      if (!Number.isFinite(v)) return; // not a data line
      vals.push(v);
      names.push(m ? m[1] : null);
    }
    names.forEach((n, i) => { if (n) this.names[i] = n; });
    this.data.push(vals);
    if (this.data.length > this.max) this.data.shift();
    this.dirty = true;
    if (!this.raf) this.raf = requestAnimationFrame(() => { this.raf = 0; this.draw(); });
  }
  reset() { this.data = []; this.names = []; this.dirty = true; this.draw(); }
  draw() {
    if (!this.dirty || !this.el.offsetParent) return;
    this.dirty = false;
    const c = this.canvas, dpr = Math.min(2, devicePixelRatio);
    const w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    c.width = w * dpr;
    c.height = h * dpr;
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    this.empty.hidden = this.data.length > 0;
    if (!this.data.length) { this.legend.innerHTML = ''; return; }
    let lo = Infinity, hi = -Infinity, n = 0;
    for (const row of this.data) for (const v of row) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    for (const row of this.data) n = Math.max(n, row.length);
    if (hi === lo) { hi += 1; lo -= 1; }
    const pad = (hi - lo) * 0.08;
    lo -= pad; hi += pad;
    const L = 44, R = 8, T = 8, B = 16;
    const X = (i) => L + (i / Math.max(1, this.max - 1)) * (w - L - R);
    const Y = (v) => T + (1 - (v - lo) / (hi - lo)) * (h - T - B);
    g.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--tl-line').trim() || '#e8e6e1';
    g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--tl-muted').trim() || '#85868d';
    g.font = '11px "IBM Plex Mono", monospace';
    g.lineWidth = 1;
    for (let k = 0; k <= 4; k++) {
      const v = lo + ((hi - lo) * k) / 4;
      const y = Y(v);
      g.beginPath(); g.moveTo(L, y); g.lineTo(w - R, y); g.stroke();
      g.fillText(fmt(v), 2, y + 4);
    }
    const off = this.max - this.data.length;
    for (let s = 0; s < n; s++) {
      g.strokeStyle = this.colors[s % this.colors.length];
      g.lineWidth = 1.6;
      g.beginPath();
      let started = false;
      this.data.forEach((row, i) => {
        if (row[s] == null) return;
        const x = X(i + off), y = Y(row[s]);
        if (!started) { g.moveTo(x, y); started = true; } else g.lineTo(x, y);
      });
      g.stroke();
    }
    const last = this.data[this.data.length - 1];
    this.legend.innerHTML = Array.from({ length: n }, (_, s) => `<span><i style="background:${this.colors[s % this.colors.length]}"></i>${esc(this.names[s] ?? `value ${s + 1}`)} <b>${last[s] != null ? fmt(last[s]) : ''}</b></span>`).join('');
  }
}
const fmt = (v) => (Math.abs(v) >= 1000 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2));

export class DebugPanel {
  constructor(el, { onStep, onStepOver, onStepOut, onContinue }) {
    this.el = el;
    el.innerHTML = `
      <div class="dbg-bar">
        <button class="pill pill-sm" data-act="continue" disabled>Continue</button>
        <button class="pill pill-sm" data-act="step" disabled>Step into</button>
        <button class="pill pill-sm" data-act="over" disabled>Step over</button>
        <button class="pill pill-sm" data-act="out" disabled>Step out</button>
        <span class="dbg-state">Not running. Click the gutter left of a line number to set a breakpoint.</span>
      </div>
      <div class="dbg-cols">
        <section><h4>Variables</h4><div class="dbg-vars"></div></section>
        <section><h4>Call stack</h4><ol class="dbg-stack"></ol></section>
      </div>`;
    this.btns = Object.fromEntries([...el.querySelectorAll('[data-act]')].map((b) => [b.dataset.act, b]));
    this.btns.continue.onclick = () => onContinue?.();
    this.btns.step.onclick = () => onStep?.();
    this.btns.over.onclick = () => onStepOver?.();
    this.btns.out.onclick = () => onStepOut?.();
    this.vars = el.querySelector('.dbg-vars');
    this.stack = el.querySelector('.dbg-stack');
    this.stateEl = el.querySelector('.dbg-state');
  }
  setState(text, paused) {
    this.stateEl.textContent = text;
    for (const b of Object.values(this.btns)) b.disabled = !paused;
  }
  show(vm) {
    let scopes = [], stack = [];
    try { scopes = vm?.scopes?.() ?? []; } catch { /* runtime without scopes */ }
    try { stack = vm?.callStack?.() ?? []; } catch { /* */ }
    this.vars.innerHTML = scopes.map((s) => `<details open><summary>${esc(s.name)}</summary>${varList(s.vars)}</details>`).join('') || '<p class="muted">Pause the sketch to see its variables.</p>';
    this.stack.innerHTML = [...stack].reverse().map((f) => `<li><code>${esc(f.fn)}()</code> <span class="muted">line ${f.line}</span></li>`).join('') || '<li class="muted">—</li>';
  }
  clear() {
    this.vars.innerHTML = '<p class="muted">Pause the sketch to see its variables.</p>';
    this.stack.innerHTML = '';
  }
}

function varList(vars = []) {
  return `<ul class="dbg-list">${vars.map((v) => {
    const val = v.value;
    if (val && typeof val === 'object') {
      const kids = Array.isArray(val) ? val.map((x, i) => ({ name: `[${i}]`, type: '', value: x })) : Object.entries(val).map(([k, x]) => ({ name: k, type: '', value: x }));
      return `<li><details><summary><b>${esc(v.name)}</b> <span class="muted">${esc(v.type ?? '')}</span></summary>${varList(kids.slice(0, 64))}</details></li>`;
    }
    const text = typeof val === 'string' && /String|char\s*\*|char\s*\[/.test(v.type ?? '') && !/^".*"$/.test(val) ? JSON.stringify(val) : String(val);
    return `<li><b>${esc(v.name)}</b> <span class="muted">${esc(v.type ?? '')}</span> <code>${esc(text)}</code></li>`;
  }).join('')}</ul>`;
}
