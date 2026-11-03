// Curriculum: every track and lesson from TRACKS, grouped by `group`, with search and filters.
// URL state: ?q=servo&level=beginner&board=esp32 (shareable); #<track id> jumps to a track.
import { initPage, courseData, levelsOf, LEVELS, iconFor, esc, lucide, $, $$, colourAt } from './common.js';

const shell = initPage({ current: '/curriculum/' });

/** One line under each group heading. Unknown groups simply have none. */
const GROUP_NOTES = {
  'Start here': 'No board and no code. How electricity, sensors and computers work, in pictures.',
  Microcontrollers: 'Arduino-style boards: your first circuits, then sensors, displays, motors and firmware.',
  'Connected devices': 'Boards with Wi-Fi, Bluetooth and Python.',
  'Single-board computers': 'Full Linux computers on your desk: Raspberry Pi and NVIDIA Jetson.',
  'Capstone projects': 'Complete builds that bring the earlier tracks together.',
};
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : '');
const langName = (l) => (l.lang === 'python' ? (l.board === 'pico' ? 'MicroPython' : 'Python') : l.board ? 'Arduino C++' : 'No code');
const pad = (n) => String(n).padStart(2, '0');

const params = new URLSearchParams(location.search);
const state = { q: params.get('q') || '', level: LEVELS.includes(cap(params.get('level'))) ? cap(params.get('level')) : '', board: params.get('board') || '' };

const q = $('#q');
q.value = state.q;

courseData().then((d) => {
  const { groups, lessons, boardName } = d;
  // jump links
  $('#jump').innerHTML = groups.map((g) => `<a class="btn btn-soft btn-sm" href="#g-${slug(g.name)}">${esc(g.name)}</a>`).join('');

  // groups → tracks → lessons
  let gi = 0;
  $('#groups').innerHTML = groups.map((g) => {
    const c = colourAt(gi++);
    const n = g.tracks.reduce((s, t) => s + t.lessons.length, 0);
    return `<section class="pg-group" id="g-${slug(g.name)}" data-group aria-labelledby="g-${slug(g.name)}-h">
      <div class="wrap">
        <header><div><h2 class="h2" id="g-${slug(g.name)}-h">${esc(g.name)}</h2>${GROUP_NOTES[g.name] ? `<p>${esc(GROUP_NOTES[g.name])}</p>` : ''}</div><small data-gcount>${n} lessons</small></header>
        ${g.tracks.map((t) => trackHTML(t, c, boardName)).join('')}
      </div>
    </section>`;
  }).join('');

  // filters
  const levelsEl = $('#levels');
  levelsEl.innerHTML = ['', ...LEVELS].map((l) => `<button class="pg-chip" type="button" data-level="${l}" aria-pressed="${state.level === l}">${l || 'All levels'}</button>`).join('');
  levelsEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-level]');
    if (!b) return;
    state.level = b.dataset.level;
    apply();
  });
  const boardEl = $('#board-filter');
  const renderBoard = () => {
    boardEl.hidden = !state.board;
    boardEl.innerHTML = state.board ? `<button class="pg-chip" type="button" aria-pressed="true" aria-label="Remove board filter: ${esc(boardName(state.board))}">${esc(boardName(state.board))} ${lucide('x', { size: 15, stroke: 2 })}</button>` : '';
  };
  boardEl.addEventListener('click', () => { state.board = ''; apply(); });
  q.addEventListener('input', () => { state.q = q.value; apply(); });
  $('#reset').addEventListener('click', () => { state.q = ''; state.level = ''; state.board = ''; q.value = ''; apply(); q.focus(); });

  const items = $$('.pg-lesson').map((el) => ({ el, text: el.dataset.search, levels: el.dataset.levels.split(','), board: el.dataset.board }));
  function apply() {
    const words = state.q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const it of items) {
      const ok = (!state.level || it.levels.includes(state.level)) && (!state.board || it.board === state.board) && words.every((w) => it.text.includes(w));
      it.el.hidden = !ok;
      if (ok) shown++;
    }
    for (const t of $$('[data-track]')) t.hidden = !t.querySelector('.pg-lesson:not([hidden])');
    for (const g of $$('[data-group]')) {
      const vis = $$('.pg-lesson:not([hidden])', g).length;
      g.hidden = !vis;
      $('[data-gcount]', g).textContent = `${vis} lesson${vis === 1 ? '' : 's'}`;
    }
    $$('#levels [data-level]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.level === state.level));
    renderBoard();
    $('#count').textContent = shown === lessons.length ? `${lessons.length} lessons` : `${shown} of ${lessons.length} lessons`;
    $('#empty').hidden = shown > 0;
    const p = new URLSearchParams();
    if (state.q.trim()) p.set('q', state.q.trim());
    if (state.level) p.set('level', state.level.toLowerCase());
    if (state.board) p.set('board', state.board);
    if (new URLSearchParams(location.search).has('static')) p.set('static', '');
    history.replaceState(null, '', `${location.pathname}${p.size ? `?${p}` : ''}${location.hash}`);
  }
  apply();
  shell.reveal($('#groups'));

  // content arrived after load: honour a #track or #g-group hash now
  if (location.hash) {
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) requestAnimationFrame(() => el.scrollIntoView());
  }
}).catch((e) => {
  console.error(e);
  $('#groups').innerHTML = '<p class="pg-empty">The curriculum could not be loaded. Please reload the page.</p>';
});

function trackHTML(t, c, boardName) {
  const lang = langName({ lang: t.lang, board: t.board });
  const meta = [t.level, t.board ? boardName(t.board) : 'No board needed', lang, `${t.lessons.length} lesson${t.lessons.length === 1 ? '' : 's'}`];
  return `<article class="pg-track ${c}" id="${esc(t.id)}" data-track>
    <div class="pg-track-head">
      <span class="pg-ic" aria-hidden="true">${lucide(iconFor(t.icon), { size: 28 })}</span>
      <h3>${esc(t.title)}</h3>
      <p>${esc(t.blurb || '')}</p>
      <div class="pg-meta">${meta.map((m) => `<span>${esc(m)}</span>`).join('')}</div>
    </div>
    <ol class="pg-lessons">${t.lessons.map((l, i) => lessonHTML(t, l, i, boardName)).join('')}</ol>
  </article>`;
}

function lessonHTML(t, l, i, boardName) {
  const board = l.board ? boardName(l.board) : '';
  const sub = [l.level !== t.level ? l.level : '', l.board !== t.board ? board : '', l.lang !== (t.lang ?? 'cpp') ? langName(l) : ''].filter(Boolean).join(' · ');
  const search = [l.title, l.id, t.title, t.group, board, langName(l), l.overview?.heading || ''].join(' ').toLowerCase();
  return `<li class="pg-lesson" data-search="${esc(search)}" data-levels="${levelsOf(l.level).join(',')}" data-board="${esc(l.board || '')}">
    <span class="n" aria-hidden="true">${pad(i + 1)}</span>
    <span class="t"><a href="/learn/#${esc(l.id)}">${esc(l.title)}</a>${sub ? `<small>${esc(sub)}</small>` : ''}</span>
    <span class="go">
      <a class="btn btn-ghost" href="/learn/#${esc(l.id)}" aria-label="Open the lesson: ${esc(l.title)}">${lucide('play', { size: 15 })}Lesson</a>
      <a class="btn btn-soft" href="/guide/#${esc(l.id)}" aria-label="Build guide: ${esc(l.title)}">${lucide('book-open', { size: 15 })}Guide</a>
    </span>
  </li>`;
}
