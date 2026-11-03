// For educators: static content in /educators/index.html; the curriculum map is built from TRACKS.
import { initPage, courseData, levelsOf, LEVELS, esc, lucide, $ } from './common.js';

const shell = initPage({ current: '/educators/' });

const LEVEL_STYLE = { Beginner: ['c-green', 'sprout'], Intermediate: ['c-blue', 'gauge'], Advanced: ['c-iris', 'rocket'] };

courseData().then(({ TRACKS, lessons, groups }) => {
  const grid = $('#map-grid');
  grid.innerHTML = LEVELS.map((level) => {
    const tracks = TRACKS.filter((t) => levelsOf(t.level).includes(level));
    const n = lessons.filter((l) => levelsOf(l.level).includes(level)).length;
    const [c, icon] = LEVEL_STYLE[level];
    return `<section class="pg-map-col ${c}" aria-label="${level}">
      <header><span class="pg-ic" aria-hidden="true">${lucide(icon, { size: 24 })}</span><div><h3>${level}</h3><small>${n} lesson${n === 1 ? '' : 's'} · ${tracks.length} track${tracks.length === 1 ? '' : 's'}</small></div></header>
      <ul>${tracks.map((t) => `<li><a href="/curriculum/?level=${level.toLowerCase()}#${esc(t.id)}"><span>${esc(t.title)}</span><span>${t.lessons.length}</span></a></li>`).join('')}</ul>
    </section>`;
  }).join('');
  grid.querySelectorAll('.pg-map-col').forEach((el) => shell.reveal(el));
  // suggest the first no-board track as the place to begin
  const first = groups[0]?.tracks[0];
  if (first) {
    const start = $('#map-start');
    start.innerHTML = `If your class has never touched electronics, begin with <a href="/learn/#${esc(first.lessons[0].id)}">${esc(first.title)}</a>${first.board ? '' : ': no board and no code needed'}.`;
    shell.reveal(start);
  }
});

