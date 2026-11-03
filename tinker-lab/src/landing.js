import '@fontsource/barlow-semi-condensed/600.css'; // used by the 3D board silkscreens
import './landing.css';
import * as THREE from 'three';
import { mountShell } from './site/shell.js';
import { lucide, hydrateIcons } from './brand/lucide.js';
import { markSVG } from './brand/logo.js';
import { Stage, Thumbnailer } from './scene/stage.js';
import { makeBoard } from './scene/board.js';
import { makeBoardOfType, BOARD_INFO } from './scene/boards/index.js';
import { makeBreadboard } from './scene/breadboard.js';
import { makeWire } from './scene/wire.js';
import { makeLED, makeResistor } from './scene/components.js';
import { TRACKS, lessons } from './lessons/index.js';
import { store } from './ui/store.js';

// Optional modules written by other parts of the project: used when present.
const introModules = import.meta.glob('./guide/intro.js');
const figureModules = import.meta.glob('./figures/index.js');

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const shell = mountShell({ current: '/' });
for (const el of document.querySelectorAll('[data-logo]')) el.innerHTML = markSVG({ size: 64 });

const C = {
  red: ['var(--tl-accent)', 'var(--tl-accent-soft)'],
  iris: ['var(--tl-iris)', 'var(--tl-iris-soft)'],
  ink: ['var(--tl-ink)', 'var(--tl-subtle-2)'],
  amber: ['#d98a00', '#fff4dc'],
  blue: ['var(--tl-blue)', '#e8eeff'],
  green: ['var(--tl-green)', '#e3f5ec'],
};
const style = ([c, soft]) => `--c:${c};--c-soft:${soft}`;

// ---------------------------------------------------------------- where to start
const first = TRACKS[0]?.lessons[0];
const last = lessons.find((l) => l.id === store.get('last', ''));
const start = $('#hero-start');
if (last) {
  start.href = `/learn/#${last.id}`;
  start.textContent = `Continue with ${last.title}`;
} else if (first) {
  start.href = `/learn/#${first.id}`;
}

// ---------------------------------------------------------------- cards
const count = (id) => TRACKS.find((t) => t.id === id)?.lessons.length ?? 0;
const CARDS = [
  ['zap', 'red', 'Electricity, explained in pictures.', `Electrons drifting through a wire, a fuse that pops, a capacitor filling up like a bucket. ${count('basics') ? `${count('basics')} short visual lessons` : 'Short visual lessons'} before you need a board.`, '/learn/#' + (TRACKS.find((t) => t.id === 'basics')?.lessons[0]?.id ?? '')],
  ['box', 'iris', 'Circuits you can pick up and turn around.', 'Every project is a 3D model. Rotate it, zoom in on a pin, press the button, turn the knob, move the obstacle and see what changes.', '/learn/'],
  ['code-xml', 'ink', 'Code that actually runs.', 'Write Arduino code, set a breakpoint, step through it a line at a time and watch the LED do exactly what that line says.', '/studio/'],
  ['book-open', 'amber', 'A manual for every build.', 'Guides drawn like a furniture manual: the parts on one page, then one change per step. Print them and take them to the bench.', '/guide/'],
  ['scan-eye', 'blue', 'Watch the AI see.', 'In the Jetson lessons a camera feed shows what the model detects, box by box, with how sure it is.', '/learn/#' + (TRACKS.find((t) => t.id === 'jetson')?.lessons[0]?.id ?? '')],
  ['leaf', 'green', 'Projects that matter outside the classroom.', 'Wind turbines, air-quality stations, smart farms, traffic lights that adapt and robot arms that sort.', '/curriculum/'],
];
const rail = $('#rail');
rail.innerHTML = CARDS.map(([ic, col, title, detail, href], i) => `
  <article class="rcard" style="${style(C[col])}">
    <div class="rcard-art"><span class="rcard-icon">${lucide(ic, { size: 56, stroke: 1.6 })}</span></div>
    <div class="rcard-text"><h3>${title}</h3><button class="rcard-more" aria-expanded="false" aria-controls="rd-${i}" aria-label="More about this">${lucide('plus', { size: 20, stroke: 2 })}</button></div>
    <div class="rcard-detail" id="rd-${i}"><p>${detail}</p><a class="link-arrow" href="${href}">Take a look ${lucide('arrow-right', { size: 16 })}</a></div>
  </article>`).join('');
rail.addEventListener('click', (e) => {
  const b = e.target.closest('.rcard-more');
  if (!b) return;
  const card = b.closest('.rcard');
  const open = card.classList.toggle('is-open');
  b.setAttribute('aria-expanded', open);
});
const step = () => rail.querySelector('.rcard').getBoundingClientRect().width + 20;
$('#rail-prev').onclick = () => rail.scrollBy({ left: -step(), behavior: 'smooth' });
$('#rail-next').onclick = () => rail.scrollBy({ left: step(), behavior: 'smooth' });

// ---------------------------------------------------------------- learning path, from the real course
const GROUP_STYLE = { 'Start here': ['lightbulb', 'red'], Microcontrollers: ['cpu', 'iris'], 'Connected devices': ['wifi', 'blue'], 'Single-board computers': ['server', 'ink'], 'Capstone projects': ['rocket', 'green'] };
const groups = [];
for (const t of TRACKS) {
  let g = groups.find((x) => x.name === t.group);
  if (!g) groups.push((g = { name: t.group ?? 'More', tracks: [] }));
  g.tracks.push(t);
}
$('#path-grid').innerHTML = groups.map((g) => {
  const [ic, col] = GROUP_STYLE[g.name] ?? ['circle-dot', 'ink'];
  const n = g.tracks.reduce((a, t) => a + t.lessons.length, 0);
  return `<section class="path-col reveal" style="${style(C[col])}">
    <header><span class="pc-ic">${lucide(ic, { size: 24 })}</span><div><h3>${esc(g.name)}</h3><small>${n} lessons</small></div></header>
    <ul>${g.tracks.map((t) => `<li><a href="/learn/#${t.lessons[0].id}"><span>${esc(t.title)}</span><span>${t.lessons.length}</span></a></li>`).join('')}</ul>
  </section>`;
}).join('');
$('#path-lede').textContent = `${lessons.length} lessons in ${TRACKS.length} tracks, from what a volt is to running a neural network on a Jetson.`;

// ---------------------------------------------------------------- loop list
const LOOP = [
  ['flame', 'red', 'Too much current? The LED burns out, and tells you why.'],
  ['bug', 'iris', 'Breakpoints, stepping and live variables.'],
  ['undo-2', 'ink', 'Undo anything. Change one thing. Run it again.'],
  ['share-2', 'blue', 'Send a project to a friend with a link.'],
  ['download', 'green', 'Download the sketch and flash a real board.'],
];
$('#loop-list').innerHTML = LOOP.map(([ic, col, t]) => `<li class="reveal" style="${style(C[col])}"><span>${lucide(ic, { size: 26 })}</span><span>${t}</span></li>`).join('');

// ---------------------------------------------------------------- comparison
const YES = `<span class="yes" role="img" aria-label="Yes">${lucide('check', { size: 17, stroke: 2.4 })}</span>`;
const NO = `<span class="no" role="img" aria-label="No">${lucide('x', { size: 17, stroke: 2.4 })}</span>`;
const ROWS = [
  ['See inside every part while it works', 1, 0],
  ['Nothing to buy to get started', 1, 0],
  ['Burn out a part without losing it', 1, 0],
  ['Pause the code on any line', 1, 0],
  ['Exact parts list and wiring for each project', 1, 1],
  ['Hold real parts and solder them', 0, 1],
  ['Meet real-world noise, loose wires and flat batteries', 0, 1],
];
$('#compare-body').innerHTML = ROWS.map(([t, a, b]) => `<tr><td>${t}</td><td>${a ? YES : NO}</td><td>${b ? YES : NO}</td></tr>`).join('');

// ---------------------------------------------------------------- boards
function renderBoards() {
  let th = null;
  try { th = new Thumbnailer(320, 240); } catch { /* no WebGL */ }
  const used = new Set(lessons.map((l) => l.board).filter(Boolean));
  $('#board-row').innerHTML = Object.entries(BOARD_INFO).filter(([id]) => used.has(id)).map(([id, b]) => {
    let img = '';
    try { if (th) img = th.render(makeBoardOfType(id).group); } catch { img = ''; }
    const first = lessons.find((l) => l.board === id);
    return `<a class="board-tile reveal" href="/learn/#${first.id}"><div class="bimg">${img ? `<img src="${img}" alt="" loading="lazy" width="320" height="240">` : lucide('cpu', { size: 48, stroke: 1.2 })}</div><b>${esc(b.name)}</b><small>${esc(b.language ?? '')}</small></a>`;
  }).join('');
  th?.dispose();
  document.querySelectorAll('#board-row .reveal').forEach((el) => shell.reveal(el));
}

// ---------------------------------------------------------------- hero: the assembly intro, or a live circuit
async function hero() {
  const host = $('#hero-stage');
  const intro = introModules['./guide/intro.js'];
  if (intro) {
    try {
      const { mountIntro } = await intro();
      $('#hero-canvas').remove();
      const el = document.createElement('div');
      el.className = 'intro-host';
      host.append(el);
      mountIntro(el, { loop: true });
      return;
    } catch (e) {
      console.warn('intro unavailable, falling back', e);
    }
  }
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
  const w1 = makeWire(board.pin('D13'), bb.hole(10, 'b'), 'red');
  const w2 = makeWire(board.pin('GND'), bb.hole(15, 'a'), 'black', { dir: -1 });
  root.add(w1.group, w2.group);
  stage.setContent(root);
  stage.frame({ center: [5.4, 0.6, -0.6], size: 12.5 }, true);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t = 0, on = null;
  stage.onTick((dt) => {
    t += dt;
    if (!reduce) stage.goal.az += dt * 0.06;
    const want = t % 1.2 < 0.6;
    if (want !== on) {
      on = want;
      led.set(on ? 1 : 0);
      board.setBuiltinLed(on ? 1 : 0);
      w1.live = w2.live = on;
    }
    w1.tick(dt, true);
    w2.tick(dt, true);
  });
  new IntersectionObserver(([e]) => stage.setPaused(!e.isIntersecting)).observe(host);
}

// ---------------------------------------------------------------- figures (hairline-style), when the library exists
async function figures() {
  const load = figureModules['./figures/index.js'];
  if (!load) return;
  try {
    const { mountFigure, FIGURES } = await load();
    const pick = ['chip', 'servo', 'windmill', 'breadboard', 'radar', 'robot-arm'].filter((n) => FIGURES.some((f) => f.name === n)).slice(0, 3);
    if (!pick.length) return;
    const row = $('#figure-row');
    row.innerHTML = pick.map((n) => {
      const f = FIGURES.find((x) => x.name === n);
      return `<div class="figure-card reveal"><div class="fig" data-fig="${n}"></div><p><b>${esc(f.title)}</b><output>rest</output></p></div>`;
    }).join('');
    row.querySelectorAll('[data-fig]').forEach((el) => {
      const out = el.parentElement.querySelector('output');
      mountFigure(el, el.dataset.fig, { play: true, onRead: (t) => (out.textContent = t) });
    });
    $('#figures-section').hidden = false;
    row.querySelectorAll('.reveal').forEach((el) => shell.reveal(el));
  } catch (e) {
    console.warn('figures unavailable', e);
  }
}

document.querySelectorAll('#path-grid .reveal, #loop-list .reveal').forEach((el) => shell.reveal(el));
hydrateIcons();
document.fonts.ready.then(() => {
  hero().catch((e) => { console.warn(e); $('#hero-stage').hidden = true; });
  figures();
  (window.requestIdleCallback ?? ((f) => setTimeout(f, 300)))(renderBoards);
});
