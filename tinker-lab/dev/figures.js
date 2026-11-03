// Figure gallery (dev server only): /dev/figures.html
//   ?f=servo            one figure alone          ?w=480       its width in px
//   ?intensity=0..1     the slider                ?play=1      start the tour
//   ?accent=iris|ink    the bright stroke         ?at=x,y      hold the pointer at a viewBox point (for screenshots)
import '../src/brand/tokens.css';
import { FIGURES, mountFigure } from '../src/figures/index.js';

const q = new URLSearchParams(location.search);
const only = q.get('f');
const $ = (id) => document.getElementById(id);
const slider = $('intensity'), play = $('play'), accentBtn = $('accent');
const ACCENTS = ['red', 'iris', 'ink'];
let accent = ACCENTS.includes(q.get('accent')) ? q.get('accent') : 'red';
if (q.get('intensity') != null) slider.value = String(Math.min(1, Math.max(0, Number(q.get('intensity')) || 0)));
$('ival').textContent = Number(slider.value).toFixed(2);
accentBtn.textContent = accent;

const list = only ? FIGURES.filter((f) => f.name === only) : FIGURES;
if (only) {
  document.body.classList.add('one');
  const w = Number(q.get('w')) || 480;
  document.querySelector('main').style.width = w + 'px';
}

const figs = list.map((f) => {
  const fig = document.createElement('figure');
  fig.innerHTML = `<div class="plate"><span class="name"></span><span class="read"></span><div class="stage"></div></div><figcaption><b></b><span></span></figcaption>`;
  fig.querySelector('.name').textContent = f.name;
  fig.querySelector('b').textContent = f.title;
  fig.querySelector('figcaption span').textContent = f.description;
  $('grid').appendChild(fig);
  const read = fig.querySelector('.read'), stage = fig.querySelector('.stage');
  const handle = mountFigure(stage, f.name, {
    intensity: Number(slider.value), play: q.get('play') === '1', accent, lazy: !only,
    onRead: (t) => { read.textContent = t; },
  });
  return { stage, handle };
});
if (q.get('play') === '1') play.setAttribute('aria-pressed', 'true');

slider.addEventListener('input', () => {
  $('ival').textContent = Number(slider.value).toFixed(2);
  figs.forEach((f) => f.handle.update({ intensity: Number(slider.value) }));
});
play.addEventListener('click', () => {
  const on = play.getAttribute('aria-pressed') !== 'true';
  play.setAttribute('aria-pressed', String(on));
  figs.forEach((f) => f.handle.update({ play: on }));
});
accentBtn.addEventListener('click', () => {
  accent = ACCENTS[(ACCENTS.indexOf(accent) + 1) % ACCENTS.length];
  accentBtn.textContent = accent;
  figs.forEach((f) => f.handle.update({ accent }));
});

// ?at=x,y: one synthetic pointer move, once the figure has mounted
const at = (q.get('at') || '').split(',').map(Number);
if (only && at.length === 2 && at.every(Number.isFinite)) {
  figs[0].handle.ready.then(() => {
    const st = figs[0].stage, r = st.getBoundingClientRect();
    st.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', pointerId: 1, bubbles: true, clientX: r.left + (at[0] / 400) * r.width, clientY: r.top + (at[1] / 320) * r.height }));
  });
}
window.__figs = figs;
