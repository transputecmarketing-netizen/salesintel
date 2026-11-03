// Boards: one card per entry in BOARD_INFO, with specs and live lesson counts.
import { initPage, courseData, esc, lucide, $, colourAt } from './common.js';

const shell = initPage({ current: '/boards/' });

const SPECS = [
  ['Processor', 'cpu'],
  ['Clock', 'clock'],
  ['Memory', 'ram'],
  ['Storage', 'flash'],
  ['Logic', 'voltage'],
  ['Pins', 'pins'],
  ['Wireless', 'wireless'],
  ['USB', 'usb'],
  ['Built-in LED', 'builtinLed'],
];
const iconOf = (b) => (/wi-?fi|bluetooth/i.test(b.wireless || '') ? 'wifi' : /python/i.test(b.language || '') && /gpu|cortex-a/i.test(`${b.mcu} ${b.cpu}`) ? 'brain-circuit' : 'cpu');

courseData().then(({ BOARD_INFO, lessons, TRACKS, stats }) => {
  const el = $('#boards');
  el.innerHTML = Object.entries(BOARD_INFO).map(([id, b], i) => {
    const n = lessons.filter((l) => l.board === id).length;
    const tracks = TRACKS.filter((t) => t.lessons.some((l) => l.board === id)).map((t) => t.title);
    const rows = SPECS.filter(([, k]) => b[k]).map(([label, k]) => `<dt>${label}</dt><dd>${esc(b[k])}</dd>`).join('');
    return `<article class="pg-board ${colourAt(i)}" id="${esc(id)}">
      <div class="pg-board-art">
        <h2>${esc(b.name)}<small>${esc(b.chip)} · ${esc(b.language)}</small></h2>
        <span class="pg-rcard-icon" aria-hidden="true">${lucide(iconOf(b), { size: 44 })}</span>
      </div>
      <dl class="pg-specs">${rows}${tracks.length ? `<dt>Tracks</dt><dd>${tracks.map(esc).join(', ')}</dd>` : ''}</dl>
      <footer>
        <b>${n}<span>lesson${n === 1 ? '' : 's'}</span></b>
        ${n ? `<a class="btn btn-ghost btn-sm" href="/curriculum/?board=${encodeURIComponent(id)}">See the lessons ${lucide('arrow-right', { size: 16 })}</a>` : '<span class="muted">No lessons yet</span>'}
      </footer>
    </article>`;
  }).join('');
  el.querySelectorAll('.pg-board').forEach((c) => shell.reveal(c));
  if (stats.noBoard) {
    const nb = $('#no-board');
    nb.innerHTML = `${stats.noBoard} more lesson${stats.noBoard === 1 ? ' needs' : 's need'} no board at all: they explain electricity, sensors and computers with drawings. <a href="/curriculum/">See them in the curriculum</a>.`;
  }
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
});
