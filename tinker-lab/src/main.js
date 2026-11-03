import '@fontsource/barlow-semi-condensed/500.css';
import '@fontsource/barlow-semi-condensed/600.css';
import '@fontsource/barlow-semi-condensed/700.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import './brand/tokens.css';
import '@fontsource/newsreader/600.css';
import './style.css';
import { markSVG } from './brand/logo.js';

import * as THREE from 'three';
import { Stage, Thumbnailer } from './scene/stage.js';
import { makeBoardOfType, BOARD_INFO } from './scene/boards/index.js';
import { buildLessonScene } from './scene/context.js';
import { TRACKS, lessons, glossary, extraParts } from './lessons/index.js';
import { icon } from './ui/icons.js';
import { CodeView } from './ui/code.js';
import { Runner } from './ui/runner.js';
import { PanelDock } from './ui/panels.js';
import { store } from './ui/store.js';
import { CodeLab } from './runtime/ui/codelab.js';
import './runtime/ui/codelab.css';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const strip = (html) => String(html).replace(/<[^>]+>/g, '');

// ---------------------------------------------------------------- state
const settings = Object.assign({ flow: false, labels: true, sound: false }, store.get('settings', {}));
const ran = new Set(store.get('done', []));
const quizzed = new Set(store.get('quiz', []));
const saveSettings = () => store.set('settings', settings);
const isComplete = (l) => ran.has(l.id) && (!l.quiz?.length || quizzed.has(l.id));

for (const el of $$('[data-icon]')) el.innerHTML = icon(el.dataset.icon);
for (const el of $$('[data-logo]')) el.innerHTML = markSVG({ size: Number(el.dataset.logo) || 40 });

// ---------------------------------------------------------------- loader
const loaderFill = $('#loader-fill'), loaderStep = $('#loader-step');
const progress = (f, text) => { loaderFill.style.width = `${Math.round(f * 100)}%`; if (text) loaderStep.textContent = text; };
const frame = () => new Promise((r) => requestAnimationFrame(() => r()));

// ---------------------------------------------------------------- refs
const stageEl = $('#stage');
const calloutsEl = $('#callouts');
const leadersEl = $('#leaders');
const signalsEl = $('#signals');
const tipEl = $('#tip');
const inspectorEl = $('#inspector');
const codeCard = $('#code-card');
const consoleLines = $('#console-lines');
const consoleStatus = $('#console-status');
const infoContent = $('#info-content');
const listEl = $('#lesson-list');
const trackTabs = $('#track-tabs');
const flyout = $('#flyout');
const dimEl = $('#dim');

let stage, board, dock, thumbnailer;
let explainerView = null;
const explainerEl = document.getElementById('explainer');
let current = -1, lesson, built, ctxState;
let activeTab = 'overview';
const paramValues = new Map();
const boards = new Map();
const thumbs = new Map();
const quizAnswers = new Map();

function getBoard(type) {
  if (!boards.has(type)) boards.set(type, makeBoardOfType(type));
  return boards.get(type);
}

// ---------------------------------------------------------------- audio
const audio = {
  ctx: null, osc: null, gain: null,
  tone(f) {
    if (!settings.sound) return;
    try {
      this.ctx ??= new AudioContext();
      if (!this.osc) {
        this.gain = this.ctx.createGain();
        this.gain.gain.value = 0;
        this.gain.connect(this.ctx.destination);
        this.osc = this.ctx.createOscillator();
        this.osc.type = 'square';
        this.osc.connect(this.gain);
        this.osc.start();
      }
      this.osc.frequency.setValueAtTime(f, this.ctx.currentTime);
      this.gain.gain.setTargetAtTime(0.04, this.ctx.currentTime, 0.005);
    } catch { /* no audio */ }
  },
  noTone() {
    if (this.gain && this.ctx) this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.01);
  },
};

// ---------------------------------------------------------------- serial console
function print(text, cls = '') {
  const d = document.createElement('div');
  d.textContent = text;
  if (cls) d.className = cls;
  consoleLines.append(d);
  while (consoleLines.childElementCount > 300) consoleLines.firstElementChild.remove();
  consoleLines.scrollTop = consoleLines.scrollHeight;
  codeCard.classList.add('has-console');
}
$('#console-clear').addEventListener('click', () => (consoleLines.textContent = ''));
const serialQueue = [];
$('#console-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const inp = $('#console-input');
  const text = inp.value;
  if (!text) return;
  if (lab.active) {
    if (!lab.running) { toast('Run your code first'); return; }
    lab.sendSerial(text);
  } else {
    if (!runner.running) { toast('Run the sketch first'); return; }
    serialQueue.push(text);
  }
  print(`> ${text}`, 'echo');
  inp.value = '';
});

// ---------------------------------------------------------------- runner
let runStarted = 0;
const runner = new Runner({
  get board() { return board; },
  get lang() { return lesson?.lang; },
  line: (t, n) => codeView.highlightLine(t, n),
  print: (t) => print(t, /^(Compiling|Uploading|Connecting|Running|Starting|Loading|\$ )/.test(t) ? 'sys' : /^(Error|Traceback)/.test(t) ? 'err' : ''),
  pin: (key, text, live) => setSignal(key, text, live),
  tone: (f) => audio.tone(f),
  noTone: () => audio.noTone(),
  readLine: () => serialQueue.shift() ?? null,
  available: () => serialQueue.length,
  state: (running) => showRunState(running),
});

/** Shared "running" look of the card, chips and wires (guided runs and the runtime). */
function showRunState(running) {
  codeCard.dataset.state = running ? 'running' : 'idle';
  consoleStatus.textContent = running ? (lesson?.lang === 'python' ? 'Running' : 'Running · 9600 baud') : 'Stopped';
  $('#code-run').setAttribute('aria-label', running ? 'Stop sketch' : 'Run sketch');
  $('[data-nav="run"]').parentElement.classList.toggle('is-active', running);
  signalsEl.style.opacity = running ? 1 : 0;
  if (running) {
    runStarted = performance.now();
    for (const w of ctxState?.wires ?? []) {
      const power = /^(GND|5V|3V3|3\.3V|VCC|VIN|12V)/.test(w.signal ?? '');
      if (power) w.live = true;
      if (w.chip) w.chip.textContent = power ? w.signal.replace(/_\d+$/, '') : `${w.signal} · LOW`;
    }
  } else {
    codeView.clearHighlight();
    for (const w of ctxState?.wires ?? []) w.live = false;
  }
}
const codeView = new CodeView($('#code'), {
  onParam: (k, v) => { if (lesson) paramValues.get(lesson.id)[k] = v; },
});

// "Run my code": an editor and the Tinker Lab Arduino runtime in the code card
const lab = new CodeLab({
  card: codeCard,
  app: $('#app'),
  getBoard: () => board,
  getBuilt: () => built,
  getWires: () => ctxState?.wires ?? [],
  print: (t, cls) => print(t, cls),
  lastLine: () => consoleLines.lastElementChild,
  clearConsole: () => { consoleLines.textContent = ''; },
  setSignal: (key, text, live) => setSignal(key, text, live),
  showRunState: (running) => showRunState(running),
  setStatus: (t) => { consoleStatus.textContent = t; },
  stopGuided: () => runner.stop(),
  audio,
  toast: (m) => toast(m),
  onRan: () => { if (lesson) markRan(lesson); },
});

function setSignal(key, text, live) {
  for (const w of ctxState?.wires ?? []) {
    if (w.signal !== key) continue;
    w.live = !!live;
    if (w.chip) {
      w.chip.textContent = `${key} · ${text}`;
      w.chip.classList.toggle('is-live', !!live);
    }
  }
}

function toggleRun(force) {
  if (lab.active) {
    const want = force ?? !lab.running;
    if (want) lab.run(); else lab.stop();
    return;
  }
  const run = force ?? !runner.running;
  if (!run) return runner.stop();
  consoleLines.textContent = '';
  runner.start(lesson, built, paramValues.get(lesson.id));
}
$('#code-run').addEventListener('click', () => toggleRun());

// a lesson's sketch counts as "run" after a few seconds of running
setInterval(() => {
  if (!runner.running || !lesson || ran.has(lesson.id)) return;
  if (performance.now() - runStarted > 3000) markRan(lesson);
}, 500);

function markRan(L) {
  if (ran.has(L.id)) return;
  ran.add(L.id);
  store.set('done', [...ran]);
  afterProgress(L.quiz?.length && !quizzed.has(L.id) ? (L.explainer ? 'Nice exploring! Now try the quiz.' : 'Sketch complete! Now try the quiz.') : null);
}

function afterProgress(msg) {
  const wasComplete = lesson && isComplete(lesson);
  renderProgress();
  if (activeTab === 'overview') renderInfo();
  if (wasComplete) toast(`“${lesson.title}” complete!`);
  else if (msg) toast(msg);
}

// ---------------------------------------------------------------- lesson building
let untick = null;
function loadLesson(i, { instant = false } = {}) {
  i = (i + lessons.length) % lessons.length;
  if (i === current) return;
  runner.stop();
  lab.stop();
  closeInspector();
  dock.clear();
  current = i;
  lesson = lessons[i];
  dimEl.style.opacity = '0';
  explainerView?.destroy?.();
  explainerView = null;
  explainerEl.innerHTML = '';
  $('#app').classList.toggle('is-explainer', !!lesson.explainer);
  if (lesson.explainer) {
    // Visual explainer: an animated, hand-drawn scene instead of a 3D circuit and code.
    untick?.();
    untick = null;
    stage.setContent(new THREE.Group());
    ctxState = { wires: [], interactive: [], anchors: {}, tickers: [], steps: [] };
    built = {};
    try {
      explainerView = lesson.explainer(explainerEl, {
        complete: () => markRan(lesson),
        toast,
        settings,
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      });
    } catch (e) {
      console.error(`Explainer ${lesson.id} failed`, e);
    }
    finishLoad(i);
    return;
  }
  board = getBoard(lesson.board);
  board.setBuiltinLed(lesson.board === 'jetson' ? 1 : 0);
  board.setFan?.(lesson.board === 'jetson' ? 0.6 : 0);
  const scene = buildLessonScene(lesson, { board, dock, onDarkness: (d) => (dimEl.style.opacity = String(d * 0.85)) });
  const { root, st } = scene;
  built = scene.built;
  ctxState = st;
  stage.setContent(root);
  untick?.();
  untick = stage.onTick((dt) => {
    board.tick?.(dt);
    for (const t of st.tickers) t(dt);
    for (const w of st.wires) w.tick(dt, settings.flow);
    dock.tick();
    updateOverlay();
  });
  stage.frame(lesson.view ?? { center: [0, 0.5, 0], size: 10 }, instant);

  finishLoad(i);
}

/** The parts of loading a lesson shared by 3D lessons and explainers. */
function finishLoad(i) {
  if (!paramValues.has(lesson.id)) paramValues.set(lesson.id, Object.fromEntries(Object.entries(lesson.params ?? {}).map(([k, p]) => [k, p.value])));
  if (lesson.code) codeView.render(lesson, paramValues.get(lesson.id));
  lab.load(lesson, paramValues.get(lesson.id));
  const info = BOARD_INFO[lesson.board] ?? {};
  if (!lesson.explainer) $('#code-lang').textContent = `${lesson.lang === 'python' ? (lesson.board === 'pico' ? 'MicroPython' : 'Python 3') : 'C++'} · ${info.name ?? lesson.board}`;
  $('.console-title').textContent = lesson.lang === 'python' ? 'Terminal' : 'Serial monitor';
  if (!lab.active) {
    codeCard.classList.remove('has-console');
    codeCard.classList.toggle('has-input', !!lesson.serialInput);
  }
  $('#console-input').placeholder = lesson.serialInput?.placeholder ?? 'Type a message and press Enter';
  serialQueue.length = 0;
  consoleLines.textContent = '';
  renderInfo();
  renderCallouts();
  renderChips();
  renderStrip();
  if (location.hash !== `#${lesson.id}`) history.replaceState(null, '', `#${lesson.id}`);
  const guide = document.getElementById('guide-link');
  if (guide) { guide.href = `/guide/#${lesson.id}`; guide.hidden = !!lesson.explainer; }
  document.title = `${lesson.title} · Tinker Lab`;
  store.set('last', lesson.id);
  setNav(i === 0 ? 'home' : null);
  if (flyout.dataset.view === 'lessons') openFlyout('lessons');
}

// ---------------------------------------------------------------- info card
function lessonStatus(L) {
  if (!L.quiz?.length) return '';
  const r = ran.has(L.id), q = quizzed.has(L.id);
  return `<ul class="checklist"><li class="${r ? 'ok' : ''}">${icon(r ? 'check' : 'play')}<span>${L.explainer ? 'Explore the animation to the end' : 'Run the sketch for a few seconds'}</span></li><li class="${q ? 'ok' : ''}">${icon(q ? 'check' : 'info')}<span>Pass the quiz <button class="link" data-goto="quiz">Take quiz →</button></span></li></ul>`;
}

function renderInfo() {
  const L = lesson;
  let html = '';
  if (activeTab === 'overview') {
    html = `<span class="eyebrow">${esc(L.track.title)} · Lesson ${L.indexInTrack + 1} of ${L.track.lessons.length} · ${esc(L.level ?? L.track.level)}</span><h3>${esc(L.overview.heading)}</h3><p>${L.overview.text}</p><ul class="features">${L.overview.features
      .map(([ic, t]) => `<li><span class="fi">${icon(ic)}</span><span>${t}</span></li>`).join('')}</ul>${lessonStatus(L)}`;
  } else if (activeTab === 'pinout') {
    html = `<h3>${L.explainer ? 'Key terms' : 'Wiring'}</h3><table class="pin-table"><thead><tr><th>${L.explainer ? 'Term' : 'Pin'}</th><th>${L.explainer ? 'Means' : 'Connects to'}</th><th>Note</th></tr></thead><tbody>${(L.pinout ?? [])
      .map(([a, b, c]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td><td><small>${esc(c ?? '')}</small></td></tr>`).join('')}</tbody></table>`;
  } else if (activeTab === 'example') {
    html = `<span class="eyebrow">In the real world</span><h3>${esc(L.title)}</h3><p>${L.example.text}</p><span class="eyebrow">Try this</span><ul class="points">${L.example.points
      .map((p) => `<li>${p}</li>`).join('')}</ul>${L.challenges?.length ? `<span class="eyebrow">Challenges</span><ol class="challenges">${L.challenges.map((c, i) => `<li><b>${['Warm-up', 'Level up', 'Stretch'][i] ?? `Bonus ${i - 2}`}</b>${c}</li>`).join('')}</ol>` : ''}`;
  } else if (activeTab === 'quiz') {
    html = renderQuiz(L);
  } else {
    html = `<h3>Specifications</h3><div class="spec-grid">${L.specs.map(([k, v]) => `<div class="spec"><small>${esc(k)}</small><b>${v}</b></div>`).join('')}</div>`;
  }
  infoContent.innerHTML = html;
  infoContent.scrollTop = 0;
  const wiringTab = $('[data-tab="pinout"]');
  if (wiringTab) wiringTab.textContent = L.explainer ? 'Key terms' : 'Wiring';
}

function renderQuiz(L) {
  if (!L.quiz?.length) return '<h3>Quiz</h3><p>No quiz for this lesson.</p>';
  const ans = quizAnswers.get(L.id) ?? {};
  const correct = L.quiz.filter((q, i) => ans[i] === q.answer).length;
  return `<span class="eyebrow">Check your understanding</span><h3>Quiz</h3>
    <ol class="quiz">${L.quiz.map((q, i) => {
      const a = ans[i];
      return `<li><p class="q">${q.q}</p><div class="opts">${q.options.map((o, k) => {
        const state = a == null ? '' : k === q.answer ? (a === k ? 'is-right' : 'is-answer') : a === k ? 'is-wrong' : '';
        return `<button data-q="${i}" data-k="${k}" class="${state}" ${a != null ? 'disabled' : ''}>${o}</button>`;
      }).join('')}</div>${a != null ? `<p class="why ${a === q.answer ? 'ok' : 'no'}">${a === q.answer ? 'Correct — ' : 'Not quite — '}${q.explain}</p>` : ''}</li>`;
    }).join('')}</ol>
    <div class="quiz-foot"><span>${correct} / ${L.quiz.length} correct${quizzed.has(L.id) ? ' · <b>Passed</b>' : ''}</span><button class="btn-line" data-quiz-reset>Try again</button></div>`;
}

infoContent.addEventListener('click', (e) => {
  const opt = e.target.closest('[data-q]');
  if (opt) {
    const ans = quizAnswers.get(lesson.id) ?? {};
    ans[opt.dataset.q] = Number(opt.dataset.k);
    quizAnswers.set(lesson.id, ans);
    const all = lesson.quiz.every((q, i) => ans[i] != null);
    const right = lesson.quiz.every((q, i) => ans[i] === q.answer);
    if (all && right && !quizzed.has(lesson.id)) {
      quizzed.add(lesson.id);
      store.set('quiz', [...quizzed]);
      afterProgress(ran.has(lesson.id) ? null : 'Quiz passed — now run the sketch!');
    }
    const st = infoContent.scrollTop;
    renderInfo();
    infoContent.scrollTop = st;
    return;
  }
  if (e.target.closest('[data-quiz-reset]')) { quizAnswers.delete(lesson.id); renderInfo(); return; }
  const g = e.target.closest('[data-goto]');
  if (g) selectTab(g.dataset.goto);
});

function selectTab(name) {
  activeTab = name;
  $$('#tabs button').forEach((x) => { const on = x.dataset.tab === name; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', on); });
  renderInfo();
}
$('#tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (b) selectTab(b.dataset.tab);
});
$('#tabs').addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  e.stopPropagation();
  const tabs = $$('#tabs button');
  const k = tabs.findIndex((t) => t.classList.contains('is-active'));
  const n = tabs[(k + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
  selectTab(n.dataset.tab);
  n.focus();
});

// ---------------------------------------------------------------- modal
const modal = $('#modal'), modalBody = $('#modal-body');
function openModal(html) {
  modalBody.innerHTML = html;
  modal.hidden = false;
  $('#modal-close').focus();
}
function closeModal() { modal.hidden = true; }
$('#modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
$('#info-expand').addEventListener('click', () => {
  const L = lesson;
  openModal(`<span class="eyebrow">${esc(L.track.title)} · Lesson ${L.indexInTrack + 1}</span><h3>${esc(L.title)}</h3>
    <section><p>${L.overview.text}</p><ul class="features">${L.overview.features.map(([ic, t]) => `<li><span class="fi">${icon(ic)}</span><span>${t}</span></li>`).join('')}</ul></section>
    <section><span class="eyebrow">Wiring</span><table class="pin-table"><tbody>${L.pinout.map(([a, b, c]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td><td><small>${esc(c ?? '')}</small></td></tr>`).join('')}</tbody></table></section>
    <section><span class="eyebrow">In the real world</span><p>${L.example.text}</p><ul class="points">${L.example.points.map((p) => `<li>${p}</li>`).join('')}</ul></section>
    ${L.challenges?.length ? `<section><span class="eyebrow">Challenges</span><ol class="challenges">${L.challenges.map((c) => `<li>${c}</li>`).join('')}</ol></section>` : ''}
    <section><span class="eyebrow">Specifications</span><div class="spec-grid">${L.specs.map(([k, v]) => `<div class="spec"><small>${esc(k)}</small><b>${v}</b></div>`).join('')}</div></section>`);
});
$('#code-expand').addEventListener('click', () => {
  if (lab.active) { lab.toggleTall(); return; }
  openModal(`<h3>${esc(lesson.title)} · ${lesson.lang === 'python' ? 'program' : 'sketch'}</h3><pre class="code">${$('#code').innerHTML}</pre>`);
  $$('.param', modalBody).forEach((p) => p.removeAttribute('contenteditable'));
});
$('#code-copy').addEventListener('click', async () => {
  const where = lesson.lang === 'python' ? (lesson.board === 'pico' ? 'Thonny' : 'a .py file on the Jetson') : 'the Arduino IDE';
  try {
    await navigator.clipboard.writeText(lab.active ? lab.text() : codeView.text());
    toast(`Code copied — paste it into ${where}`);
  } catch {
    toast('Copy failed — select the code manually');
  }
});
$('#code-download').addEventListener('click', () => {
  const ext = lesson.lang === 'python' ? 'py' : 'ino';
  const blob = new Blob([lab.active ? lab.text() : codeView.text()], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${lesson.id}.${ext}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 2600);
}

// ---------------------------------------------------------------- callouts & leaders
let calloutEls = [];
function renderCallouts() {
  calloutsEl.innerHTML = '';
  calloutsEl.classList.add('is-entering');
  calloutEls = (lesson.callouts ?? []).map((c) => {
    const el = document.createElement('div');
    el.className = 'callout';
    el.innerHTML = `${icon(c.icon)}<div><b>${c.title}</b><span>${c.text}</span></div>`;
    calloutsEl.append(el);
    return { el, c };
  });
  requestAnimationFrame(() => requestAnimationFrame(() => calloutsEl.classList.remove('is-entering')));
  layoutCallouts();
}
function layoutCallouts() {
  if (!stage) return;
  const W = stage.w, H = stage.h;
  for (const { el, c } of calloutEls) {
    const w = el.offsetWidth;
    el.style.left = `${Math.max(8, Math.min(c.x * W, W - w - 12))}px`;
    el.style.top = `${c.y * H}px`;
  }
}

function renderChips() {
  signalsEl.innerHTML = '';
  signalsEl.style.opacity = 0;
  for (const w of ctxState.wires) {
    if (!w.signal) { w.chip = null; continue; }
    const chip = document.createElement('div');
    const gnd = /^GND/.test(w.signal), pwr = /^(5V|3V3|3\.3V|VCC|VIN|12V)/.test(w.signal);
    chip.className = `chip${gnd ? ' is-gnd' : ''}${pwr ? ' is-live' : ''}`;
    chip.textContent = w.signal.replace(/_\d+$/, '');
    signalsEl.append(chip);
    w.chip = chip;
  }
}

function updateOverlay() {
  if (!lesson) return;
  if (runner.running || lab.running) {
    for (const w of ctxState.wires) {
      if (!w.chip) continue;
      const p = stage.project(w.chipAt ?? w.mid);
      w.chip.style.left = `${p.x}px`;
      w.chip.style.top = `${p.y}px`;
    }
  }
  $('.compass-needle').style.transform = `rotate(${-stage.azimuthDeg}deg)`;
  if (!settings.labels || stage.compact) { leadersEl.innerHTML = ''; return; }
  const sr = stageEl.getBoundingClientRect();
  let svg = '';
  for (const { el, c } of calloutEls) {
    const a = ctxState.anchors[c.anchor];
    if (!a) continue;
    const p = stage.project(a);
    const r = el.getBoundingClientRect();
    const rx = r.left - sr.left, ry = r.top - sr.top, rw = r.width, rh = r.height;
    if (p.x > rx && p.x < rx + rw && p.y > ry && p.y < ry + rh) continue;
    const cx = Math.max(rx, Math.min(p.x, rx + rw));
    const cy = Math.max(ry, Math.min(p.y, ry + rh));
    const dl = Math.abs(cx - rx), dr = Math.abs(cx - (rx + rw)), dt = Math.abs(cy - ry), db = Math.abs(cy - (ry + rh));
    const m = Math.min(dl, dr, dt, db);
    let sx, sy, ex, ey;
    if (m === db) { sx = Math.min(Math.max(cx, rx + 24), rx + rw - 24); sy = ry + rh; ex = sx; ey = sy + 18; }
    else if (m === dt) { sx = Math.min(Math.max(cx, rx + 24), rx + rw - 24); sy = ry; ex = sx; ey = sy - 18; }
    else if (m === dr) { sx = rx + rw; sy = Math.min(Math.max(cy, ry + 18), ry + rh - 18); ex = sx + 18; ey = sy; }
    else { sx = rx; sy = Math.min(Math.max(cy, ry + 18), ry + rh - 18); ex = sx - 18; ey = sy; }
    svg += `<path d="M${sx} ${sy}L${ex} ${ey}L${p.x} ${p.y}"/><circle class="dot" cx="${sx}" cy="${sy}" r="3"/><circle class="ring" cx="${p.x}" cy="${p.y}" r="5.5"/>`;
  }
  leadersEl.innerHTML = svg;
}

// ---------------------------------------------------------------- picking: tooltip, hold, inspector
let holding = null, inspected = null;
function targetAt(e) { return e && ctxState ? stage.pick(e.clientX, e.clientY, ctxState.interactive) : null; }
function showTip(t, e) {
  if (!t) { tipEl.classList.remove('is-on'); return; }
  const r = stageEl.getBoundingClientRect();
  $('b', tipEl).textContent = t.name;
  $('span', tipEl).textContent = t.hint ?? '';
  tipEl.style.left = `${e.clientX - r.left}px`;
  tipEl.style.top = `${e.clientY - r.top}px`;
  tipEl.classList.add('is-on');
}
function bindPicking() {
  const canvas = $('#board-canvas');
  stage.onHover = (e) => {
    const t = targetAt(e);
    canvas.classList.toggle('is-pointing', !!t);
    showTip(t && t !== inspected ? t : null, e);
  };
  stage.onPointerDown = (e) => {
    const t = targetAt(e);
    if (!t) return false;
    showTip(null);
    if (t.hold) {
      holding = t;
      t.hold.down();
      canvas.setPointerCapture(e.pointerId);
    } else if (t.onClick) {
      t.onClick();
    } else if (t.controls || t.hint) {
      openInspector(t, e);
    }
    return true;
  };
  stage.onPointerUp = () => {
    if (holding) { holding.hold.up(); holding = null; }
  };
  stage.onBackgroundClick = () => closeInspector();
}

const SWATCH = { red: '#e5412e', yellow: '#f5c02a', green: '#3fbf5f', blue: '#3b78e7', white: '#e8e4d8', orange: '#f08a2c', purple: '#8a5cc6' };
function openInspector(t, e) {
  inspected = t;
  const ctlHtml = (t.controls ?? []).map((c, i) => {
    if (c.type === 'range') {
      const val = c.get();
      return `<div class="ctl"><label>${c.label}<output>${c.format ? c.format(val) : val}</output></label><input type="range" data-i="${i}" min="${c.min}" max="${c.max}" step="${c.step ?? 1}" value="${val}" aria-label="${c.label}"></div>`;
    }
    if (c.type === 'choice') {
      return `<div class="ctl"><label>${c.label}</label><div class="choices" data-i="${i}">${c.options
        .map(([v, l]) => `<button data-v="${v}" aria-pressed="${String(c.get()) === String(v)}">${SWATCH[v] ? `<i class="sw" style="background:${SWATCH[v]}"></i>` : ''}${l}</button>`).join('')}</div></div>`;
    }
    if (c.type === 'toggle') {
      return `<div class="ctl ctl-toggle"><label>${c.label}</label><button class="switch" role="switch" data-i="${i}" aria-checked="${c.get()}" aria-label="${c.label}"></button></div>`;
    }
    if (c.type === 'button') {
      return `<div class="ctl"><button class="btn-line btn-act" data-i="${i}">${c.label}</button></div>`;
    }
    if (c.type === 'keys') {
      return `<div class="ctl"><label>${c.label}</label><div class="choices keys" data-i="${i}">${c.keys.map((k) => `<button data-v="${esc(k)}">${esc(k)}</button>`).join('')}</div></div>`;
    }
    return '';
  }).join('');
  inspectorEl.innerHTML = `<button class="x" aria-label="Close">${icon('close')}</button><h4>${esc(t.name)}</h4><p>${esc(t.hint ?? '')}</p>${ctlHtml}<div class="ctl-note"></div>`;
  const note = () => { $('.ctl-note', inspectorEl).textContent = t.note?.() ?? ''; };
  const sync = () => {
    $$('.switch', inspectorEl).forEach((s) => s.setAttribute('aria-checked', t.controls[s.dataset.i].get()));
    $$('input[type=range]', inspectorEl).forEach((inp) => {
      const c = t.controls[inp.dataset.i];
      if (document.activeElement !== inp) inp.value = c.get();
      inp.previousElementSibling.querySelector('output').textContent = c.format ? c.format(Number(inp.value)) : inp.value;
    });
    note();
  };
  note();
  $('.x', inspectorEl).onclick = closeInspector;
  $$('input[type=range]', inspectorEl).forEach((inp) => {
    inp.oninput = () => { t.controls[inp.dataset.i].set(Number(inp.value)); sync(); };
  });
  $$('.choices:not(.keys)', inspectorEl).forEach((box) => {
    box.onclick = (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      const raw = b.dataset.v;
      t.controls[box.dataset.i].set(/^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw);
      $$('button', box).forEach((x) => x.setAttribute('aria-pressed', x === b));
      sync();
    };
  });
  $$('.keys', inspectorEl).forEach((box) => {
    const c = t.controls[box.dataset.i];
    box.onpointerdown = (ev) => { const b = ev.target.closest('button'); if (b) { c.down(b.dataset.v); b.setAttribute('aria-pressed', 'true'); } };
    const up = () => { c.up?.(); $$('button', box).forEach((x) => x.setAttribute('aria-pressed', 'false')); };
    box.onpointerup = up;
    box.onpointerleave = up;
  });
  $$('.switch', inspectorEl).forEach((s) => {
    s.onclick = () => { const c = t.controls[s.dataset.i]; c.set(!c.get()); sync(); };
  });
  $$('.btn-act', inspectorEl).forEach((b) => {
    const c = t.controls[b.dataset.i];
    if (c.hold) {
      b.onpointerdown = () => c.down();
      b.onpointerup = b.onpointerleave = () => c.up?.();
    } else b.onclick = () => { c.press(); sync(); };
  });
  const r = stageEl.getBoundingClientRect();
  inspectorEl.classList.add('is-open');
  const w = inspectorEl.offsetWidth, h = inspectorEl.offsetHeight;
  let x = e.clientX - r.left + 18, y = e.clientY - r.top - h / 2;
  if (x + w > r.width - 10) x = e.clientX - r.left - w - 18;
  x = Math.max(10, Math.min(x, r.width - w - 10));
  y = Math.max(10, Math.min(y, r.height - h - 70));
  inspectorEl.style.left = `${x}px`;
  inspectorEl.style.top = `${y}px`;
  $('input, .choices button, .switch, .btn-act', inspectorEl)?.focus({ preventScroll: true });
}
function closeInspector() {
  inspected = null;
  inspectorEl.classList.remove('is-open');
}

// ---------------------------------------------------------------- lesson strip (one track at a time)
let stripTrack = null;
function thumbFor(L) {
  if (!thumbs.has(L.id)) {
    try {
      thumbnailer ??= new Thumbnailer();
      const t = L.thumb();
      if (typeof t === 'string') thumbs.set(L.id, t.startsWith('<svg') ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(t)}` : t);
      else thumbs.set(L.id, thumbnailer.render(t));
    } catch (e) {
      console.warn('thumbnail failed', L.id, e);
      thumbs.set(L.id, '');
    }
  }
  return thumbs.get(L.id);
}
function renderTrackTabs() {
  trackTabs.innerHTML = TRACKS.map((t) => {
    const n = t.lessons.filter(isComplete).length;
    return `<button data-track="${t.id}" class="${t === stripTrack ? 'is-active' : ''}" title="${esc(t.title)} · ${esc(t.level)}">${icon(t.icon)}<span>${esc(t.title)}</span><small>${n}/${t.lessons.length}</small></button>`;
  }).join('');
}
function renderStrip(force = false) {
  const t = lesson.track;
  if (t !== stripTrack || force) {
    stripTrack = t;
    listEl.innerHTML = t.lessons.map((L, i) => `<li class="${isComplete(L) ? 'is-done' : ''}" data-id="${L.id}">
      <button class="lesson-card" data-id="${L.id}" aria-label="Lesson ${i + 1}: ${esc(L.title)}">
        <img src="${thumbFor(L)}" alt="" width="104" height="74" />
        <span>${i + 1}. ${esc(L.title)}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5.5 6.5 6.5L9 18.5" /></svg>
      </button><span class="badge">${icon('check')}</span></li>`).join('');
    renderTrackTabs();
  }
  $$('li', listEl).forEach((li) => li.classList.toggle('is-active', li.dataset.id === lesson.id));
  $(`li[data-id="${lesson.id}"]`, listEl)?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  $$('button', trackTabs).forEach((b) => b.classList.toggle('is-active', b.dataset.track === t.id));
  $(`[data-track="${t.id}"]`, trackTabs)?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
}
listEl.addEventListener('click', (e) => {
  const b = e.target.closest('.lesson-card');
  if (b) gotoLesson(b.dataset.id);
});
trackTabs.addEventListener('click', (e) => {
  const b = e.target.closest('[data-track]');
  if (!b) return;
  const t = TRACKS.find((x) => x.id === b.dataset.track);
  const next = t.lessons.find((l) => !isComplete(l)) ?? t.lessons[0];
  gotoLesson(next.id);
});
$('#lessons-prev').addEventListener('click', () => listEl.scrollBy({ left: -listEl.clientWidth * 0.8, behavior: 'smooth' }));
$('#lessons-next').addEventListener('click', () => listEl.scrollBy({ left: listEl.clientWidth * 0.8, behavior: 'smooth' }));
const gotoLesson = (id) => loadLesson(lessons.findIndex((l) => l.id === id));

function renderProgress() {
  const t = lesson?.track ?? TRACKS[0];
  const n = t.lessons.filter(isComplete).length;
  $('.progress-label').textContent = t.title;
  $('#progress-fill').style.width = `${(n / t.lessons.length) * 100}%`;
  $('#progress-count').textContent = `${n}/${t.lessons.length}`;
  $('#progress-track').setAttribute('aria-valuenow', n);
  $('#progress-track').setAttribute('aria-valuemax', t.lessons.length);
  const all = lessons.filter(isComplete).length;
  $('#progress-total').textContent = `${all} of ${lessons.length} lessons`;
  $$('li', listEl).forEach((li) => li.classList.toggle('is-done', isComplete(lessons.find((l) => l.id === li.dataset.id))));
  renderTrackTabs();
  $$('button', trackTabs).forEach((b) => b.classList.toggle('is-active', b.dataset.track === t.id));
  if (flyout.dataset.view === 'lessons') openFlyout('lessons');
}

// ---------------------------------------------------------------- sidebar & flyout
function setNav(name) {
  $$('.side-nav li').forEach((li) => {
    const n = li.firstElementChild.dataset.nav;
    if (n === 'run') return;
    li.classList.toggle('is-active', n === (name ?? (flyout.classList.contains('is-open') ? flyout.dataset.view : null)));
  });
}
let searchTerm = '';
function lessonListHtml() {
  const q = searchTerm.trim().toLowerCase();
  return TRACKS.map((t) => {
    const items = t.lessons.filter((L) => !q || `${L.title} ${strip(L.overview.text)} ${t.title} ${L.board}`.toLowerCase().includes(q));
    if (!items.length) return '';
    return `<div class="fly-group"><h4>${icon(t.icon)}<span>${esc(t.title)}</span><small>${esc(t.level)} · ${t.lessons.filter(isComplete).length}/${t.lessons.length}</small></h4><ul class="fly-list">${items
      .map((L) => `<li class="${L === lesson ? 'is-current' : ''}"><button data-id="${L.id}"><span class="fi">${icon(L.icon)}</span><span><b>${L.indexInTrack + 1}. ${esc(L.title)}</b><small>${esc(strip(L.overview.text).split('. ')[0])}.</small></span><span class="done">${isComplete(L) ? icon('check') : ''}</span></button></li>`).join('')}</ul></div>`;
  }).join('') || '<p class="sub">No lessons match.</p>';
}
function openFlyout(view) {
  flyout.dataset.view = view;
  if (view === 'lessons') {
    const all = lessons.filter(isComplete).length;
    flyout.innerHTML = `<h3>Course</h3><p class="sub">${all} of ${lessons.length} lessons complete across ${TRACKS.length} tracks. Run each sketch and pass its quiz to complete a lesson.</p>
      <label class="search">${icon('radar')}<input type="search" placeholder="Search lessons, parts, boards…" value="${esc(searchTerm)}" aria-label="Search lessons"></label><div class="fly-results">${lessonListHtml()}</div>`;
    const inp = $('input', flyout);
    inp.oninput = () => { searchTerm = inp.value; $('.fly-results', flyout).innerHTML = lessonListHtml(); };
    flyout.onclick = (e) => { const b = e.target.closest('[data-id]'); if (b) { gotoLesson(b.dataset.id); closeFlyout(); } };
  } else if (view === 'parts') {
    const parts = [...glossary, ...extraParts];
    flyout.innerHTML = `<h3>Components</h3><p class="sub">${parts.length} parts and boards used in the course. Click one to open the lesson that introduces it.</p>
      <label class="search">${icon('radar')}<input type="search" placeholder="Filter parts…" aria-label="Filter parts"></label>
      <ul class="fly-list">${parts.map(([ic, name, text, id]) => `<li data-text="${esc(`${name} ${text}`.toLowerCase())}"><button data-id="${id}"><span class="fi">${icon(ic)}</span><span><b>${esc(name)}</b><small>${esc(text)}</small></span><span></span></button></li>`).join('')}</ul>`;
    const inp = $('input', flyout);
    inp.oninput = () => $$('li', flyout).forEach((li) => (li.hidden = !li.dataset.text.includes(inp.value.toLowerCase())));
    flyout.onclick = (e) => { const b = e.target.closest('[data-id]'); if (b && lessons.some((l) => l.id === b.dataset.id)) { gotoLesson(b.dataset.id); closeFlyout(); } };
  } else if (view === 'boards') {
    flyout.innerHTML = `<h3>Boards</h3><p class="sub">From an 8-bit Uno to a GPU-powered Jetson. Pick a board to jump to its first lesson.</p><ul class="fly-list">${Object.entries(BOARD_INFO).map(([id, b]) => {
      const first = lessons.find((l) => l.board === id);
      return first ? `<li><button data-id="${first.id}"><span class="fi">${icon(id === 'jetson' ? 'gear' : 'chip')}</span><span><b>${esc(b.name)}</b><small>${esc([b.chip, b.clock, b.language].filter(Boolean).join(' · '))}</small></span><span></span></button></li>` : '';
    }).join('')}</ul>`;
    flyout.onclick = (e) => { const b = e.target.closest('[data-id]'); if (b) { gotoLesson(b.dataset.id); closeFlyout(); } };
  } else if (view === 'settings') {
    const row = (k, t, s) => `<div class="setting"><span><b>${t}</b><small>${s}</small></span><button class="switch" role="switch" data-k="${k}" aria-checked="${settings[k]}" aria-label="${t}"></button></div>`;
    flyout.innerHTML = `<h3>Settings</h3><p class="sub">Saved in this browser.</p>
      ${row('labels', 'Labels', 'Callout cards around the 3D view')}
      ${row('flow', 'Current flow', 'Animated dots along live wires')}
      ${row('sound', 'Sound', 'Hear buzzers and tones')}
      <div class="setting-actions"><button class="btn-line" id="export-progress">Export progress</button><button class="btn-line danger" id="reset-progress">Reset progress</button></div>
      <p class="sub small">Keyboard: WASD pan · Q/E rotate · +/− zoom · R reset · F flow · L labels · Space run · ←/→ lessons</p>`;
    flyout.onclick = (e) => {
      const s = e.target.closest('.switch');
      if (s) { setSetting(s.dataset.k, !settings[s.dataset.k]); s.setAttribute('aria-checked', settings[s.dataset.k]); }
      if (e.target.id === 'reset-progress' && confirm('Reset all progress?')) { ran.clear(); quizzed.clear(); store.set('done', []); store.set('quiz', []); renderProgress(); renderStrip(true); renderInfo(); toast('Progress reset'); }
      if (e.target.id === 'export-progress') {
        const data = { done: [...ran], quiz: [...quizzed], at: new Date().toISOString() };
        navigator.clipboard?.writeText(JSON.stringify(data)).then(() => toast('Progress copied to clipboard'), () => toast('Could not copy'));
      }
    };
  }
  flyout.classList.add('is-open');
  setNav(view);
  if (view === 'lessons' || view === 'parts') setTimeout(() => $('input', flyout)?.focus({ preventScroll: true }), 50);
}
function closeFlyout() {
  flyout.classList.remove('is-open');
  flyout.dataset.view = '';
  setNav(current === 0 ? 'home' : null);
}
$('.side-nav').addEventListener('click', (e) => {
  const a = e.target.closest('[data-nav]');
  if (!a || a.getAttribute('href') !== '#') return;
  e.preventDefault();
  const n = a.dataset.nav;
  if (n === 'home') { closeFlyout(); loadLesson(0); stage.reset(); }
  else if (n === 'run') { closeFlyout(); toggleRun(); }
  else if (flyout.dataset.view === n && flyout.classList.contains('is-open')) closeFlyout();
  else openFlyout(n);
});
$('#side-toggle').addEventListener('click', () => {
  const open = $('.sidebar').classList.toggle('is-open');
  $('#side-toggle').setAttribute('aria-expanded', open);
});
document.addEventListener('pointerdown', (e) => {
  if (flyout.classList.contains('is-open') && !flyout.contains(e.target) && !e.target.closest('.sidebar')) closeFlyout();
});

function setSetting(k, v) {
  settings[k] = v;
  saveSettings();
  if (k === 'labels') stageEl.classList.toggle('no-labels', !v);
  if (k === 'sound' && !v) audio.noTone();
  $(`[data-view="${k}"]`)?.setAttribute('aria-pressed', v);
  if (k === 'flow' && v && !runner.running && !lab.running) toast('Run the sketch to see current flow');
}

// ---------------------------------------------------------------- view toolbar & keyboard
$('#viewbar').addEventListener('click', (e) => {
  const b = e.target.closest('[data-view]');
  if (!b) return;
  const v = b.dataset.view;
  if (v === 'left') stage.rotate(-1);
  if (v === 'right') stage.rotate(1);
  if (v === 'in') stage.zoomBy(1.25);
  if (v === 'out') stage.zoomBy(0.8);
  if (v === 'reset') stage.reset();
  if (v === 'flow' || v === 'labels') setSetting(v, !settings[v]);
});

const keys = new Set();
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Escape') { closeModal(); closeInspector(); closeFlyout(); return; }
  if (!modal.hidden) return;
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd'].includes(k)) { keys.add(k); e.preventDefault(); }
  else if (k === 'q') stage.rotate(-1);
  else if (k === 'e') stage.rotate(1);
  else if (k === '+' || k === '=') stage.zoomBy(1.25);
  else if (k === '-' || k === '_') stage.zoomBy(0.8);
  else if (k === 'r') stage.reset();
  else if (k === 'f') setSetting('flow', !settings.flow);
  else if (k === 'l') setSetting('labels', !settings.labels);
  else if (k === ' ' && !e.target.closest('button')) { e.preventDefault(); toggleRun(); }
  else if (k === 'arrowright' && !e.target.closest('[role=tab]')) loadLesson(current + 1);
  else if (k === 'arrowleft' && !e.target.closest('[role=tab]')) loadLesson(current - 1);
});
document.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

// ---------------------------------------------------------------- clock
function tick() {
  const d = new Date();
  $('#clock-date').textContent = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  $('#clock-time').textContent = d.toLocaleTimeString('en-GB', { hour12: false });
}
tick();
setInterval(tick, 1000);

// ---------------------------------------------------------------- decorative circuit traces
function drawTraces() {
  const svg = $('#traces');
  const W = innerWidth, H = innerHeight;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let out = '';
  const trace = (x, y, dirs) => {
    let d = `M${x} ${y}`;
    for (const [dx, dy] of dirs) { x += dx; y += dy; d += `L${x} ${y}`; }
    out += `<path d="${d}"/><circle cx="${x}" cy="${y}" r="4"/>`;
  };
  for (let i = 0; i < 7; i++) {
    const x = 120 + rnd() * (W - 240), y = 92 + rnd() * 30;
    const L = 40 + rnd() * 120;
    trace(x, y, [[rnd() > 0.5 ? L : -L, 0], [rnd() > 0.5 ? 26 : -26, -26], [0, -20 - rnd() * 30]]);
  }
  for (let i = 0; i < 5; i++) {
    const y = 160 + rnd() * (H - 360);
    trace(80, y, [[20 + rnd() * 30, 0], [24, 24], [0, 40 + rnd() * 80]]);
    trace(W - 8, y + 40, [[-14 - rnd() * 20, 0], [-22, -22], [0, -30 - rnd() * 60]]);
  }
  for (let i = 0; i < 6; i++) {
    const x = 120 + rnd() * (W - 240), y = H - 170 - rnd() * 20;
    trace(x, y, [[rnd() > 0.5 ? 60 + rnd() * 90 : -60 - rnd() * 90, 0], [22, 22], [0, 30]]);
  }
  for (let i = 0; i < 10; i++) {
    const x = 100 + rnd() * (W - 140), y = rnd() > 0.5 ? 20 + rnd() * 60 : H - 30 - rnd() * 40;
    const s = 6 + rnd() * 6;
    out += `<rect x="${x}" y="${y}" width="${s}" height="${s}" opacity="${0.4 + rnd() * 0.5}"/>`;
  }
  svg.innerHTML = out;
}

// ---------------------------------------------------------------- boot
async function boot() {
  progress(0.05, 'Loading fonts');
  await document.fonts.ready;
  progress(0.2, 'Building the 3D stage');
  await frame();
  stage = new Stage($('#board-canvas'), stageEl);
  dock = new PanelDock($('#dock'), stage);
  bindPicking();
  addEventListener('resize', () => { layoutCallouts(); drawTraces(); });
  new ResizeObserver(() => layoutCallouts()).observe(stageEl);
  drawTraces();

  const fromHash = lessons.findIndex((l) => `#${l.id}` === location.hash);
  const last = lessons.findIndex((l) => l.id === store.get('last', ''));
  const start = fromHash >= 0 ? fromHash : last >= 0 ? last : 0;
  progress(0.45, `Preparing ${lessons[start].track.title}`);
  await frame();
  stageEl.classList.toggle('no-labels', !settings.labels);
  $('[data-view="flow"]').setAttribute('aria-pressed', settings.flow);
  $('[data-view="labels"]').setAttribute('aria-pressed', settings.labels);
  progress(0.7, 'Wiring up the circuit');
  await frame();
  loadLesson(start, { instant: true });
  renderProgress();
  progress(1, 'Ready');
  await frame();
  document.documentElement.classList.remove('is-loading');
  $('#app').inert = false;
  const vb = $('#viewbar');
  vb.classList.add('show-hint');
  setTimeout(() => vb.classList.remove('show-hint'), 4000);

  stage.onTick((dt) => {
    if (!keys.size) return;
    const s = 520 * dt;
    stage.panPixels((keys.has('a') ? s : 0) - (keys.has('d') ? s : 0), (keys.has('w') ? s : 0) - (keys.has('s') ? s : 0));
  });
}

addEventListener('hashchange', () => {
  const i = lessons.findIndex((l) => `#${l.id}` === location.hash);
  if (i >= 0) loadLesson(i);
});

boot().catch((e) => {
  console.error(e);
  progress(1, 'Sorry — this needs a browser with WebGL.');
});
