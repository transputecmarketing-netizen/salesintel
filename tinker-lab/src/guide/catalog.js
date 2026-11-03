// /guide/ index: every buildable lesson as a guide card, grouped by track,
// with line-art thumbnails drawn lazily as cards scroll into view.
import * as THREE from 'three';
import { createGuide } from './core.js';
import { makeRenderer } from './lineart.js';
import { BOARD_INFO } from '../scene/boards/index.js';
import { lucide } from '../brand/lucide.js';
import { lockupSVG } from '../brand/logo.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const strip = (s) => String(s ?? '').replace(/<[^>]+>/g, '');

const cache = new Map(); // lesson id → { img, steps }

export function mountIndex(el, list) {
  const tracks = [];
  for (const l of list) {
    let t = tracks.find((x) => x.track === l.track);
    if (!t) tracks.push((t = { track: l.track, lessons: [] }));
    t.lessons.push(l);
  }
  el.innerHTML = `
  <div class="g-index">
    <header class="g-index-top">
      <a href="/" aria-label="Tinker Lab home" style="text-decoration:none">${lockupSVG({ height: 34 })}</a>
      <nav><a class="g-pill" href="/learn/">${lucide('flask-conical', { size: 17 })}<span>Open the lab</span></a></nav>
    </header>
    <section class="g-hero">
      <div>
        <p class="g-eyebrow">Build guides</p>
        <h1>Every circuit,<br />step by step.</h1>
        <p class="g-lede">Each lesson as a paper-style assembly manual: the parts you need, then every part and wire in order, drawn so you can build it on a real desk.</p>
      </div>
      <label class="g-search">${lucide('search', { size: 18 })}<input type="search" placeholder="Search ${list.length} guides" aria-label="Search guides" /></label>
    </section>
    <div class="g-tracks">
      ${tracks.map(({ track, lessons }) => `
        <section class="g-track" data-track="${esc(track?.id)}">
          <header><h2>${esc(track?.title ?? 'Lessons')}</h2><span>${lessons.length} guide${lessons.length === 1 ? '' : 's'}</span><small>${esc(track?.level ?? '')}</small></header>
          <ul class="g-cards">
            ${lessons.map((l) => `<li data-q="${esc([l.title, l.id, track?.title, l.level, BOARD_INFO[l.board]?.name, strip(l.overview?.heading)].join(' ').toLowerCase())}">
              <a class="g-card" href="#${esc(l.id)}" data-id="${esc(l.id)}">
                <div class="g-thumb">${cache.get(l.id)?.img ? `<img src="${cache.get(l.id).img}" alt="" />` : '<i></i>'}</div>
                <b>${esc(l.title)}</b>
                <span>${esc(l.level ?? '')} · ${esc(BOARD_INFO[l.board]?.name ?? l.board ?? '')}<span class="g-cnum">${cache.get(l.id) ? ` · ${cache.get(l.id).steps} steps` : ''}</span></span>
              </a></li>`).join('')}
          </ul>
        </section>`).join('')}
      <p class="g-empty" hidden>No guide matches that search.</p>
    </div>
  </div>`;

  // search
  const input = el.querySelector('input[type=search]');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let any = false;
    for (const sec of el.querySelectorAll('.g-track')) {
      let n = 0;
      for (const li of sec.querySelectorAll('li[data-q]')) {
        const show = !q || q.split(/\s+/).every((w) => li.dataset.q.includes(w));
        li.hidden = !show;
        if (show) n++;
      }
      sec.hidden = n === 0;
      any ||= n > 0;
    }
    el.querySelector('.g-empty').hidden = any;
    pump();
  });

  // lazy thumbnails, one at a time
  const byId = new Map(list.map((l) => [l.id, l]));
  const queue = [];
  let renderer = null, camera = null, busy = false, alive = true;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const id = e.target.dataset.id;
      io.unobserve(e.target);
      if (!cache.has(id)) queue.push(id);
    }
    pump();
  }, { rootMargin: '300px 0px' });
  for (const a of el.querySelectorAll('.g-card')) if (!cache.has(a.dataset.id)) io.observe(a);

  function pump() {
    if (busy || !alive || !queue.length) return;
    busy = true;
    const go = () => {
      const id = queue.shift();
      try { draw(id); } catch (err) { console.warn(`Guide thumbnail for ${id} failed`, err); fail(id); }
      busy = false;
      if (queue.length) setTimeout(pump, 16);
    };
    (window.requestIdleCallback ?? ((f) => setTimeout(f, 30)))(go, { timeout: 400 });
  }

  function fail(id) {
    const a = el.querySelector(`.g-card[data-id="${CSS.escape(id)}"] .g-thumb`);
    if (a) { a.classList.add('is-off'); a.textContent = 'Preview soon'; }
  }

  function draw(id) {
    if (!alive) return;
    const lesson = byId.get(id);
    if (!renderer) {
      renderer = makeRenderer(document.createElement('canvas'), { preserve: true });
      renderer.setPixelRatio(1.5);
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 200);
    }
    const g = createGuide(lesson);
    const w = 460, h = 316;
    g.setStep(-1);
    renderer.setSize(w, h, false);
    g.art.setResolution(w, h);
    g.applyView(camera, g.viewFor(-1, w / h), w / h);
    renderer.render(g.scene, camera);
    const img = renderer.domElement.toDataURL('image/png');
    cache.set(id, { img, steps: g.steps.length });
    // free the GPU side of this lesson
    g.art.dispose();
    g.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    renderer.renderLists.dispose();
    const card = el.querySelector(`.g-card[data-id="${CSS.escape(id)}"]`);
    if (card) {
      card.querySelector('.g-thumb').innerHTML = `<img src="${img}" alt="" />`;
      card.querySelector('.g-cnum').textContent = ` · ${g.steps.length} steps`;
    }
  }

  return {
    destroy() {
      alive = false;
      io.disconnect();
      renderer?.dispose();
      renderer?.forceContextLoss?.();
      el.innerHTML = '';
    },
  };
}
