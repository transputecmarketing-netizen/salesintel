import '@fontsource/barlow-semi-condensed/500.css';
import '@fontsource/barlow-semi-condensed/600.css';
import '@fontsource/barlow-semi-condensed/700.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './landing.css';

import * as THREE from 'three';
import { Stage, Thumbnailer } from './scene/stage.js';
import { makeBoard } from './scene/board.js';
import { makeBoardOfType, BOARD_INFO } from './scene/boards/index.js';
import { makeBreadboard } from './scene/breadboard.js';
import { makeWire } from './scene/wire.js';
import { makeLED, makeResistor } from './scene/components.js';
import { TRACKS, lessons } from './lessons/index.js';
import { icon } from './ui/icons.js';
import { store } from './ui/store.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const strip = (html) => String(html).replace(/<[^>]+>/g, '');

for (const el of $$('[data-icon]')) el.innerHTML = icon(el.dataset.icon);

// ---------------------------------------------------------------- progress-aware CTA
const ran = new Set(store.get('done', []));
const quizzed = new Set(store.get('quiz', []));
const isComplete = (l) => ran.has(l.id) && (!l.quiz?.length || quizzed.has(l.id));
const last = store.get('last', null);
if (last && lessons.some((l) => l.id === last)) {
  const L = lessons.find((l) => l.id === last);
  $('#hero-start').href = `/learn/#${L.id}`;
  $('#hero-start-text').textContent = `Continue: ${L.title}`;
  $('#nav-cta').textContent = 'Continue learning';
  $('#nav-cta').href = `/learn/#${L.id}`;
}

// ---------------------------------------------------------------- stats
const boardsUsed = new Set(lessons.map((l) => l.board));
const quizCount = lessons.reduce((n, l) => n + (l.quiz?.length ?? 0), 0);
const challengeCount = lessons.reduce((n, l) => n + (l.challenges?.length ?? 0), 0);
$('#hero-stats').innerHTML = [
  [lessons.length, 'interactive lessons'],
  [TRACKS.length, 'learning tracks'],
  [boardsUsed.size, 'boards'],
  [quizCount, 'quiz questions'],
].map(([n, t]) => `<li><b>${n}</b><span>${t}</span></li>`).join('');
if (quizCount) $('#quiz-count').textContent = String(quizCount);
$('#curriculum-title').textContent = `${lessons.length} lessons, beginner to advanced`;

// ---------------------------------------------------------------- board strip
$('#board-strip').innerHTML = Object.entries(BOARD_INFO)
  .filter(([id]) => boardsUsed.has(id))
  .map(([, b]) => `<li>${icon('chip')}<span>${esc(b.name)}</span></li>`).join('');

// ---------------------------------------------------------------- curriculum
function renderTracks(level = 'all') {
  $('#tracks').innerHTML = TRACKS.filter((t) => level === 'all' || t.level.includes(level)).map((t, ti) => {
    const done = t.lessons.filter(isComplete).length;
    const pct = Math.round((done / t.lessons.length) * 100);
    const board = BOARD_INFO[t.board]?.name ?? t.board;
    const first = t.lessons.find((l) => !isComplete(l)) ?? t.lessons[0];
    return `<article class="track" style="--i:${ti}">
      <header>
        <span class="track-ic">${icon(t.icon)}</span>
        <div><p class="track-meta">Track ${TRACKS.indexOf(t) + 1} · ${esc(t.level)}</p><h3>${esc(t.title)}</h3></div>
      </header>
      <p class="track-blurb">${esc(t.blurb)}</p>
      <ul class="track-tags"><li>${esc(board)}</li><li>${t.lessons.length} lessons</li><li>${t.lessons.reduce((n, l) => n + (l.quiz?.length ?? 0), 0)} quiz questions</li></ul>
      <details class="track-list"><summary>See all lessons</summary><ol>${t.lessons.map((l) => `<li class="${isComplete(l) ? 'done' : ''}"><a href="/learn/#${l.id}">${esc(l.title)}</a><small>${esc(strip(l.overview.text).split('. ')[0])}.</small></li>`).join('')}</ol></details>
      <footer>
        <div class="track-progress"><span style="width:${pct}%"></span></div>
        <a class="btn btn-small" href="/learn/#${first.id}">${done ? (done === t.lessons.length ? 'Review' : 'Continue') : 'Start'} <span aria-hidden="true">→</span></a>
      </footer>
    </article>`;
  }).join('');
}
renderTracks();
$('#levels').addEventListener('click', (e) => {
  const b = e.target.closest('[data-level]');
  if (!b) return;
  $$('#levels button').forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-selected', x === b); });
  renderTracks(b.dataset.level);
});
$('#foot-tracks').outerHTML = TRACKS.map((t) => `<a href="/learn/#${t.lessons[0].id}">${esc(t.title)}</a>`).join('');

// ---------------------------------------------------------------- boards grid (with rendered thumbnails)
function renderBoards() {
  let th;
  try { th = new Thumbnailer(360, 220); } catch { th = null; }
  $('#board-grid').innerHTML = Object.entries(BOARD_INFO).filter(([id]) => boardsUsed.has(id)).map(([id, b]) => {
    let img = '';
    try { if (th) img = th.render(makeBoardOfType(id).group); } catch { img = ''; }
    const n = lessons.filter((l) => l.board === id).length;
    const first = lessons.find((l) => l.board === id);
    return `<article class="board-card">
      <div class="board-img">${img ? `<img src="${img}" alt="3D model of the ${esc(b.name)}" loading="lazy" width="360" height="220">` : ''}</div>
      <h3>${esc(b.name)}</h3>
      <dl>${[['Chip', b.chip], ['Clock', b.clock], ['Memory', [b.flash, b.ram].filter(Boolean).join(' / ')], ['Logic', b.voltage], ['Code in', b.language]].filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <a class="board-link" href="/learn/#${first.id}">${n} lesson${n === 1 ? '' : 's'} →</a>
    </article>`;
  }).join('');
  th?.dispose();
  $$('.board-card').forEach((el) => { el.classList.add('reveal'); io.observe(el); });
}

// ---------------------------------------------------------------- hero: live blinking circuit
function hero() {
  const host = $('#hero-stage');
  const stage = new Stage($('#hero-canvas'), host);
  const root = new THREE.Group();
  const board = makeBoard();
  root.add(board.group);
  const bb = makeBreadboard();
  bb.group.position.set(9.4, 0, -0.6);
  root.add(bb.group);
  bb.group.updateMatrixWorld(true);
  const res = makeResistor(bb.hole(10, 'd'), bb.hole(14, 'd'), 220);
  const led = makeLED('red', bb.hole(14, 'c'), bb.hole(15, 'c'));
  root.add(res.group, led.group);
  const w1 = makeWire(board.pin('D13'), bb.hole(10, 'b'), 'orange');
  const w2 = makeWire(board.pin('GND'), bb.hole(15, 'a'), 'black', { dir: -1 });
  root.add(w1.group, w2.group);
  stage.setContent(root);
  stage.frame({ center: [5.4, 0.6, -0.6], size: 13.5 }, true);
  const serial = $('#hero-serial');
  let t = 0, on = false;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  stage.onTick((dt) => {
    t += dt;
    if (!reduce) stage.goal.az += dt * 0.08;
    const want = t % 1 < 0.5;
    if (want !== on) {
      on = want;
      led.set(on ? 1 : 0);
      board.setBuiltinLed(on ? 1 : 0);
      w1.live = on;
      w2.live = on;
      const line = document.createElement('div');
      line.textContent = `D13 → ${on ? 'HIGH' : 'LOW'}`;
      serial.append(line);
      while (serial.childElementCount > 4) serial.firstElementChild.remove();
    }
    w1.tick(dt, true);
    w2.tick(dt, true);
  });
  // pause rendering when the hero is off-screen
  new IntersectionObserver(([e]) => stage.setPaused(!e.isIntersecting)).observe(host);
}

// ---------------------------------------------------------------- nav
const nav = $('#nav');
addEventListener('scroll', () => nav.classList.toggle('is-scrolled', scrollY > 8), { passive: true });
$('#nav-menu').addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  $('#nav-menu').setAttribute('aria-expanded', open);
});
$$('.nav-links a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('is-open')));

// reveal-on-scroll
const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-in')), { rootMargin: '0px 0px -10% 0px' });
$$('.section-head, .steps li, .feature-grid article, .audience article, .faq details').forEach((el) => { el.classList.add('reveal'); io.observe(el); });

document.fonts.ready.then(() => {
  try { hero(); } catch (e) { console.warn('3D hero unavailable', e); $('#hero-stage').classList.add('no-webgl'); }
  (window.requestIdleCallback ?? ((f) => setTimeout(f, 300)))(renderBoards);
});
