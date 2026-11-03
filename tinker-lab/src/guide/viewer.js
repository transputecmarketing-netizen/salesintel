// The build-guide viewer: /guide/#<lessonId>
// Cover → parts inventory → numbered steps → done, with an animated line-art
// drawing for each step, captions, a step scrubber, keyboard and swipe.
import * as THREE from 'three';
import { createGuide, easeInOut } from './core.js';
import { makeRenderer, fitBox } from './lineart.js';
import { lucide } from '../brand/lucide.js';
import { markSVG } from '../brand/logo.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Render a unit (or set of units) alone into a square data URL. */
export function snapUnits(guide, renderer, camera, js, size = 220, pad = 1.16) {
  const { art, units } = guide;
  const set = new Set(js);
  units.forEach((u, i) => art.setState(i, set.has(i) ? 'normal' : 'hidden'));
  art.rest.setState('hidden');
  guide.pose(-1, 1);
  const box = new THREE.Box3();
  for (const j of set) if (!units[j].empty) box.union(units[j].box);
  const v = fitBox(box, 1, guide.az, pad);
  renderer.setSize(size, size, false);
  art.setResolution(size, size);
  guide.applyView(camera, v, 1);
  renderer.render(guide.scene, camera);
  const url = renderer.domElement.toDataURL('image/png');
  art.rest.setState('normal');
  return url;
}

/** Thumbnails for every inventory entry, keyed by entry key. */
export function inventoryThumbs(guide, renderer, camera, size = 220) {
  const out = new Map();
  for (const e of guide.plan.inventory) out.set(e.key, snapUnits(guide, renderer, camera, [e.unit], size));
  return out;
}

export function pagesOf(guide) {
  return [
    { type: 'cover', key: 'cover', label: 'Cover' },
    { type: 'parts', key: 'parts', label: 'Parts' },
    ...guide.steps.map((s, i) => ({ type: 'step', key: String(i + 1), k: i, label: `Step ${i + 1}` })),
    { type: 'done', key: 'done', label: 'Done' },
  ];
}

export function partsListHTML(guide, thumbs, { compact = false } = {}) {
  const inv = guide.plan.inventory;
  const groups = [
    ['Board and breadboard', inv.filter((e) => e.group === 'board' || e.group === 'breadboard')],
    ['Components', inv.filter((e) => e.group === 'part')],
    ['Jumper wires', inv.filter((e) => e.group === 'wire')],
    ['Also on the desk', inv.filter((e) => e.group === 'prop')],
  ].filter(([, xs]) => xs.length);
  return groups.map(([title, xs]) => `
    <section class="g-inv-group">
      <h3>${esc(title)}<span>${xs.reduce((n, e) => n + e.count, 0)}</span></h3>
      <ul class="g-inv-grid${compact ? ' is-compact' : ''}">
        ${xs.map((e) => `<li class="g-inv-card">
          <img src="${thumbs.get(e.key) ?? ''}" alt="" width="220" height="220" loading="lazy" />
          <b class="g-count">×${e.count}</b>
          <span class="g-inv-label">${esc(e.label)}</span>
        </li>`).join('')}
      </ul>
    </section>`).join('');
}

/** A one-line summary for the cover (the overview heading, unless it just repeats the title). */
export function lede(lesson) {
  const h = String(lesson.overview?.heading ?? '').replace(/<[^>]+>/g, '').trim();
  if (h && h.toLowerCase() !== String(lesson.title).toLowerCase()) return `<p class="g-lede">${esc(h)}</p>`;
  const t = String(lesson.overview?.text ?? '').replace(/<[^>]+>/g, '').trim();
  const first = t.split(/(?<=[.!?])\s+/)[0];
  return first ? `<p class="g-lede">${esc(first)}</p>` : '';
}

export function coverMetaHTML(guide) {
  const m = guide.plan.meta;
  const rows = [
    ['gauge', 'Difficulty', m.level],
    ['clock', 'Time', `About ${m.minutes} min`],
    ['cpu', 'Board', m.board],
    ['list-ordered', 'Steps', String(guide.steps.length)],
    ['package', 'Parts', String(m.parts)],
  ];
  return `<dl class="g-meta">${rows.map(([ic, k, v]) => `<div><dt>${lucide(ic, { size: 16 })}${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
}

export function mountViewer(el, lesson, { startPage = null } = {}) {
  el.innerHTML = `
  <div class="g-app" data-page="cover">
    <header class="g-top">
      <a class="g-brand" href="/guide/" aria-label="All build guides">${markSVG({ size: 30 })}<span>Build guides</span></a>
      <div class="g-title"><small>${esc(lesson.track?.title ?? '')}</small><b>${esc(lesson.title)}</b></div>
      <nav class="g-actions">
        <a class="g-pill is-primary" href="/learn/#${esc(lesson.id)}">${lucide('flask-conical', { size: 17 })}<span>Open in the lab</span></a>
        <a class="g-pill" href="#${esc(lesson.id)}?print">${lucide('printer', { size: 17 })}<span>Print</span></a>
      </nav>
    </header>
    <main class="g-main">
      <section class="g-panel" aria-live="polite"></section>
      <div class="g-stage">
        <canvas aria-label="Line drawing of this build step"></canvas>
        <svg class="g-ink" aria-hidden="true"></svg>
        <div class="g-loading" role="status"><span></span>Drawing the guide</div>
      </div>
      <section class="g-inventory" hidden></section>
    </main>
    <footer class="g-bar">
      <button class="g-nav" data-go="-1" aria-label="Previous step">${lucide('chevron-left', { size: 22 })}</button>
      <div class="g-scrub" role="tablist" aria-label="Steps"></div>
      <button class="g-nav is-next" data-go="1" aria-label="Next step">${lucide('chevron-right', { size: 22 })}</button>
    </footer>
  </div>`;
  const app = el.querySelector('.g-app');
  const panel = el.querySelector('.g-panel');
  const stage = el.querySelector('.g-stage');
  const canvas = stage.querySelector('canvas');
  const ink = stage.querySelector('.g-ink');
  const invEl = el.querySelector('.g-inventory');
  const scrub = el.querySelector('.g-scrub');
  const loading = stage.querySelector('.g-loading');

  let guide, renderer, thumbs, pages, page = 0, alive = true;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 200);
  const anim = { t0: 0, from: null, to: null, view: null, k: -1, p: 1, running: false, drop: false };
  const cleanup = [];

  // build after the loader has painted
  requestAnimationFrame(() => setTimeout(() => {
    if (!alive) return;
    try {
      guide = createGuide(lesson);
    } catch (e) {
      console.error(e);
      loading.innerHTML = `This guide could not be drawn yet (${esc(e.message)}).`;
      return;
    }
    renderer = makeRenderer(canvas, { preserve: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    thumbs = inventoryThumbs(guide, renderer, camera);
    pages = pagesOf(guide);
    buildScrub();
    loading.remove();
    let start = 0;
    if (startPage) {
      const i = pages.findIndex((p) => p.key === startPage);
      if (i >= 0) start = i;
    }
    go(start, { instant: true });
    const ro = new ResizeObserver(() => { if (anim.view) render(); });
    ro.observe(stage);
    cleanup.push(() => ro.disconnect());
  }, 30));

  // ---------------------------------------------------------------- navigation
  function buildScrub() {
    scrub.innerHTML = pages.map((p, i) => {
      const inner = p.type === 'cover' ? lucide('book-open', { size: 15 }) : p.type === 'parts' ? lucide('package', { size: 15 }) : p.type === 'done' ? lucide('check', { size: 15 }) : `<span>${p.k + 1}</span>`;
      return `<button role="tab" class="g-tick is-${p.type}" data-i="${i}" aria-label="${esc(p.label)}" title="${esc(p.label)}">${inner}</button>`;
    }).join('');
    scrub.classList.toggle('is-dense', pages.length > 18);
    let drag = false;
    const pick = (e) => {
      const r = scrub.getBoundingClientRect();
      const i = Math.floor(((e.clientX - r.left) / r.width) * pages.length);
      const j = THREE.MathUtils.clamp(i, 0, pages.length - 1);
      if (j !== page) go(j);
    };
    scrub.addEventListener('pointerdown', (e) => { drag = true; scrub.setPointerCapture(e.pointerId); pick(e); });
    scrub.addEventListener('pointermove', (e) => drag && pick(e));
    scrub.addEventListener('pointerup', () => (drag = false));
    scrub.addEventListener('pointercancel', () => (drag = false));
  }

  el.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(page + Number(b.dataset.go))));
  const onKey = (e) => {
    if (!pages || e.target.closest?.('input, textarea')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(page + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(page - 1); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(pages.length - 1);
  };
  window.addEventListener('keydown', onKey);
  cleanup.push(() => window.removeEventListener('keydown', onKey));
  // swipe
  let sw = null;
  const swipeStart = (e) => { sw = { x: e.clientX, y: e.clientY, t: performance.now() }; };
  const swipeEnd = (e) => {
    if (!sw) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4 && performance.now() - sw.t < 900) go(page + (dx < 0 ? 1 : -1));
    sw = null;
  };
  for (const t of [stage, panel, invEl]) {
    t.addEventListener('pointerdown', swipeStart);
    t.addEventListener('pointerup', swipeEnd);
  }

  function go(i, { instant = false } = {}) {
    if (!pages) return;
    i = THREE.MathUtils.clamp(i, 0, pages.length - 1);
    const forward = i === page + 1;
    page = i;
    const p = pages[i];
    app.dataset.page = p.type;
    scrub.querySelectorAll('.g-tick').forEach((t, j) => {
      t.classList.toggle('is-current', j === i);
      t.classList.toggle('is-past', j < i);
      t.setAttribute('aria-selected', j === i ? 'true' : 'false');
    });
    scrub.querySelector('.is-current')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    el.querySelector('[data-go="-1"]').disabled = i === 0;
    el.querySelector('[data-go="1"]').disabled = i === pages.length - 1;
    history.replaceState(null, '', `#${lesson.id}${i ? `/${p.key}` : ''}`);
    panel.innerHTML = panelHTML(p);
    panel.querySelectorAll('[data-to]').forEach((b) => b.addEventListener('click', () => go(pages.findIndex((x) => x.key === b.dataset.to))));
    const isParts = p.type === 'parts';
    invEl.hidden = !isParts;
    stage.hidden = isParts;
    if (isParts) {
      invEl.innerHTML = `<header class="g-inv-head"><p class="g-eyebrow">Before you start</p><h2>What you need</h2><p>${guide.plan.meta.parts} parts. Lay them out on the desk and tick them off as you go.</p></header>${partsListHTML(guide, thumbs)}`;
      return;
    }
    const k = p.type === 'step' ? p.k : -1;
    guide.setStep(k);
    const w = stage.clientWidth || 800, h = stage.clientHeight || 600;
    const goal = guide.viewFor(k, w / h);
    const animate = !instant && !reduced();
    anim.k = k;
    anim.from = anim.view ? { target: anim.view.target.clone(), half: anim.view.half } : goal;
    anim.to = goal;
    anim.drop = animate && forward && p.type === 'step';
    anim.t0 = performance.now();
    anim.p = anim.drop ? 0 : 1;
    if (!animate) anim.from = goal;
    if (!anim.running) {
      anim.running = true;
      requestAnimationFrame(tick);
    }
  }

  function tick(now) {
    if (!alive) return;
    const t = (now - anim.t0) / 1000;
    const camT = anim.from === anim.to ? 1 : easeInOut(t / 0.75);
    anim.view = {
      target: anim.from.target.clone().lerp(anim.to.target, camT),
      half: THREE.MathUtils.lerp(anim.from.half, anim.to.half, camT),
    };
    anim.p = anim.drop ? THREE.MathUtils.clamp((t - 0.35) / 1.15, 0, 1) : 1;
    render();
    if (camT < 1 || anim.p < 1) requestAnimationFrame(tick);
    else anim.running = false;
  }

  function render() {
    if (!renderer || stage.hidden) return;
    const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
    renderer.setSize(w, h, false);
    guide.art.setResolution(w, h);
    if (anim.p < 1) guide.pose(anim.k, anim.p);
    else guide.pose(anim.k, 1);
    // keep the framing right when the stage changes shape
    if (!anim.running) anim.view = guide.viewFor(anim.k, w / h);
    guide.applyView(camera, anim.view, w / h);
    renderer.render(guide.scene, camera);
    ink.setAttribute('viewBox', `0 0 ${w} ${h}`);
    ink.innerHTML = guide.overlay(anim.k, camera, w, h, anim.p);
  }

  function needHTML(s) {
    return `<ul class="g-need">${s.parts.map((e) => `<li><img src="${thumbs.get(e.key) ?? ''}" alt="" width="64" height="64" /><b>×${e.count}</b><span>${esc(e.label)}</span></li>`).join('')}</ul>`;
  }

  function panelHTML(p) {
    const total = guide.steps.length;
    if (p.type === 'cover')
      return `<p class="g-eyebrow">Build guide${lesson.track?.title ? ` · ${esc(lesson.track.title)}` : ''}</p>
        <h1 class="g-h1">${esc(lesson.title)}</h1>
        ${lede(lesson)}
        ${coverMetaHTML(guide)}
        <div class="g-ctas"><button class="g-pill is-primary" data-to="parts">${lucide('package', { size: 17 })}<span>See the parts</span></button><button class="g-pill" data-to="1">${lucide('play', { size: 17 })}<span>Start at step 1</span></button></div>`;
    if (p.type === 'parts')
      return `<p class="g-eyebrow">Parts</p><div class="g-num"><span class="big">${guide.plan.meta.parts}</span></div><p class="g-cap">parts in ${guide.plan.inventory.length} kinds.</p><div class="g-ctas"><button class="g-pill is-primary" data-to="1">${lucide('play', { size: 17 })}<span>Start building</span></button></div>`;
    if (p.type === 'done')
      return `<p class="g-eyebrow">Finished</p><div class="g-num"><span class="big">${lucide('check', { size: 96, stroke: 1 })}</span></div>
        <p class="g-cap">That is the whole circuit. Check every wire against the steps, then open it in the lab to run the code.</p>
        <div class="g-ctas"><a class="g-pill is-primary" href="/learn/#${esc(lesson.id)}">${lucide('flask-conical', { size: 17 })}<span>Open in the lab</span></a><a class="g-pill" href="#${esc(lesson.id)}?print">${lucide('printer', { size: 17 })}<span>Print this guide</span></a></div>`;
    const s = guide.steps[p.k];
    return `<div class="g-num"><span class="big">${s.n}</span><span class="of">/ ${total}</span></div>
      <p class="g-cap">${esc(s.caption)}</p>
      ${needHTML(s)}`;
  }

  return {
    /** Show a page by key: 'cover', 'parts', a step number, 'done'. */
    goTo(key) {
      if (!pages) { startPage = key; return; }
      const i = pages.findIndex((p) => p.key === String(key));
      if (i >= 0 && i !== page) go(i);
    },
    destroy() {
      alive = false;
      cleanup.forEach((f) => f());
      guide?.art.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss?.();
      el.innerHTML = '';
    },
  };
}
