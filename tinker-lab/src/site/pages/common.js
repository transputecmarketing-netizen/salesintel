// Shared helpers for the content pages (about, mission, story, educators, curriculum,
// boards, contact, transparency, legal, 404).
//
// Pages are written as plain HTML and enhanced here:
//   <span data-brand="contactEmail"></span>       text from BRAND (src/brand/brand.js)
//   <a data-mailto="contactEmail"></a>            mailto: link to a BRAND address
//   <p class="pg-draft" data-draft hidden>         shown while BRAND still has placeholders
//   <span data-stat="lessons"></span>              live course numbers from TRACKS
//   <article class="pg-rcard c-red" data-icon="eye"><h3>…</h3><div class="pg-rcard-detail">…</div></article>
//   <li data-icon="lock" class="c-iris">…</li>     (inside ul.pg-icons / ol.pg-steps)
//   <td class="mark" data-mark="yes|no">           check / cross
//   <div class="pg-storage" data-storage>          live list of tinkerlab: keys + clear button
import { mountShell } from '../shell.js';
import '../pages.css';
import { BRAND, BRAND_PLACEHOLDERS } from '../../brand/brand.js';
import { lucide, hydrateIcons } from '../../brand/lucide.js';
import { markSVG } from '../../brand/logo.js';

export { BRAND, BRAND_PLACEHOLDERS, lucide, hydrateIcons, markSVG };

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ---------------------------------------------------------------- brand values
export function fillBrand(root = document) {
  for (const el of $$('[data-brand]', root)) el.textContent = BRAND[el.dataset.brand] ?? '';
  for (const el of $$('[data-mailto]', root)) {
    const addr = BRAND[el.dataset.mailto] ?? '';
    el.href = `mailto:${addr}${el.dataset.subject ? `?subject=${encodeURIComponent(el.dataset.subject)}` : ''}`;
    if (!el.textContent.trim()) el.textContent = addr;
  }
  if (BRAND_PLACEHOLDERS) for (const el of $$('[data-draft]', root)) el.hidden = false;
}

// ---------------------------------------------------------------- colour cards
let cardSeq = 0;
export function enhanceCards(root = document) {
  for (const card of $$('.pg-rcard:not(.is-ready)', root)) {
    const h3 = $('h3', card);
    const detail = $('.pg-rcard-detail', card);
    const art = document.createElement('div');
    art.className = 'pg-rcard-art';
    art.setAttribute('aria-hidden', 'true');
    art.innerHTML = `<span class="pg-rcard-icon">${lucide(card.dataset.icon || 'circle', { size: 56, stroke: 1.5 })}</span>`;
    const text = document.createElement('div');
    text.className = 'pg-rcard-text';
    card.prepend(art);
    art.after(text);
    text.append(h3);
    if (detail) {
      const id = `pg-card-${++cardSeq}`;
      detail.id = id;
      detail.setAttribute('aria-hidden', 'true');
      const label = h3.textContent.trim().replace(/\s+/g, ' ');
      const btn = document.createElement('button');
      btn.className = 'pg-rcard-more';
      btn.type = 'button';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', id);
      btn.setAttribute('aria-label', `More: ${label}`);
      btn.innerHTML = lucide('plus', { size: 20, stroke: 2 });
      text.append(btn);
      btn.addEventListener('click', () => {
        const open = card.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open);
        btn.setAttribute('aria-label', `${open ? 'Close' : 'More'}: ${label}`);
        detail.setAttribute('aria-hidden', !open);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && card.classList.contains('is-open')) { btn.click(); btn.focus(); }
      });
    }
    card.classList.add('is-ready');
  }
  // prev / next buttons for rails that overflow
  for (const rail of $$('.pg-rail:not([data-nav])', root)) {
    rail.dataset.nav = '1';
    const nav = document.createElement('div');
    nav.className = 'wrap pg-rail-nav';
    nav.innerHTML = `<button class="icon-btn" type="button" aria-label="Previous cards">${lucide('chevron-left', { size: 20 })}</button><button class="icon-btn" type="button" aria-label="Next cards">${lucide('chevron-right', { size: 20 })}</button>`;
    rail.after(nav);
    const [prev, next] = $$('button', nav);
    const step = () => (rail.querySelector('.pg-rcard')?.offsetWidth ?? 300) + 20;
    prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
    const sync = () => {
      const over = rail.scrollWidth > rail.clientWidth + 4;
      nav.hidden = !over;
      prev.disabled = rail.scrollLeft < 4;
      next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 4;
      prev.style.opacity = prev.disabled ? 0.4 : 1;
      next.style.opacity = next.disabled ? 0.4 : 1;
    };
    rail.addEventListener('scroll', sync, { passive: true });
    addEventListener('resize', sync);
    requestAnimationFrame(sync);
  }
}

// ---------------------------------------------------------------- icon lists, marks, FAQ
export function enhanceIcons(root = document) {
  for (const li of $$('[data-icon]:not(.pg-rcard):not([data-icon-done])', root)) {
    li.dataset.iconDone = '1';
    const ic = document.createElement('span');
    ic.className = 'pg-ic';
    ic.setAttribute('aria-hidden', 'true');
    ic.innerHTML = lucide(li.dataset.icon, { size: 34, stroke: 1.5 });
    li.prepend(ic);
  }
  for (const td of $$('[data-mark]:not([data-mark-done])', root)) {
    td.dataset.markDone = '1';
    const yes = td.dataset.mark === 'yes';
    const label = td.dataset.label || (yes ? 'Yes' : 'No');
    td.insertAdjacentHTML('afterbegin', `<span class="${yes ? 'yes' : 'no'}" aria-hidden="true">${lucide(yes ? 'check' : 'x', { size: 17, stroke: 2.4 })}</span><span class="mark-label">${esc(label)}</span>`);
  }
  for (const s of $$('.pg-faq summary:not([data-pm])', root)) {
    s.dataset.pm = '1';
    s.insertAdjacentHTML('beforeend', `<span class="pm" aria-hidden="true">${lucide('plus', { size: 18, stroke: 2 })}</span>`);
  }
}

// ---------------------------------------------------------------- local sub-nav scroll spy
export function spyNav(nav = $('.sub-nav')) {
  if (!nav) return;
  const links = $$('a[href^="#"]', nav);
  const targets = links.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  if (!targets.length) return;
  const set = (id) => links.forEach((a) => (a.getAttribute('href') === `#${id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  const io = new IntersectionObserver((es) => {
    const vis = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (vis[0]) set(vis[0].target.id);
  }, { rootMargin: '-30% 0px -60% 0px' });
  targets.forEach((t) => io.observe(t));
}

// ---------------------------------------------------------------- browser storage (tinkerlab: keys)
const PREFIX = 'tinkerlab:';
export function storedKeys() {
  try {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) out.push(k);
    }
    return out.sort();
  } catch {
    return null; // storage blocked
  }
}
export function clearStored() {
  const keys = storedKeys() || [];
  try { keys.forEach((k) => localStorage.removeItem(k)); } catch { /* blocked */ }
  return keys.length;
}
export function mountStorage(root = document) {
  for (const box of $$('[data-storage]', root)) {
    const render = (msg = '') => {
      const keys = storedKeys();
      if (keys === null) {
        box.innerHTML = `<div><p><b>This browser is blocking site storage,</b> so Tinker Lab cannot save anything here. Lessons still work; progress is simply not kept.</p></div>`;
        return;
      }
      const n = keys.length;
      box.innerHTML = `<div>
        <p>${n ? `<b>This browser holds ${n} Tinker Lab item${n === 1 ? '' : 's'}.</b> They stay on this device and are never sent to us.` : `<b>This browser holds no Tinker Lab data right now.</b> Open a lesson and your progress will be saved here, on this device only.`}</p>
        ${n ? `<ul aria-label="Stored keys">${keys.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>` : ''}
        <span role="status">${esc(msg)}</span>
      </div>
      <button class="btn ${n ? 'btn-primary' : 'btn-ghost'}" type="button" ${n ? '' : 'disabled'}>${lucide('trash-2', { size: 18 })}Clear Tinker Lab data</button>`;
      const btn = $('button', box);
      btn.addEventListener('click', () => {
        if (!confirm('Clear your Tinker Lab progress, quiz answers, settings and code drafts from this browser? This cannot be undone.')) return;
        const c = clearStored();
        render(`Cleared ${c} item${c === 1 ? '' : 's'}.`);
        $('button', box)?.focus();
      });
    };
    render();
  }
}

// ---------------------------------------------------------------- course data (always computed at runtime)
/** Lucide equivalents for the icon names used in src/lessons (src/ui/icons.js). */
const ICON_MAP = { bolt: 'zap', radar: 'radar', chip: 'cpu', palette: 'palette', gear: 'cog', globe: 'globe', code: 'code-xml', traffic: 'traffic-cone', plant: 'sprout', led: 'lightbulb', sun: 'sun', motor: 'fan', servo: 'rotate-cw', sound: 'volume-2', thermo: 'thermometer', button: 'circle-dot', knob: 'circle-gauge', pins: 'cable', book: 'book-open' };
export const iconFor = (name, fallback = 'circuit-board') => ICON_MAP[name] || fallback;

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
/** 'Beginner → Intermediate' → ['Beginner', 'Intermediate'] */
export function levelsOf(str = '') {
  const found = LEVELS.filter((l) => str.includes(l));
  if (found.length < 2) return found;
  const a = LEVELS.indexOf(found[0]);
  const b = LEVELS.indexOf(found[found.length - 1]);
  return LEVELS.slice(a, b + 1);
}

const COLOURS = ['c-red', 'c-iris', 'c-blue', 'c-green', 'c-amber', 'c-ink'];
export const colourAt = (i) => COLOURS[i % COLOURS.length];

let dataPromise;
/** { TRACKS, lessons, BOARD_INFO, groups: [{ name, tracks }], stats, boardName(id) } */
export function courseData() {
  dataPromise ??= Promise.all([import('../../lessons/catalog.js')]).then(([L]) => {
    const B = L;
    const { TRACKS, lessons } = L;
    const { BOARD_INFO } = B;
    const groups = [];
    for (const t of TRACKS) {
      const name = t.group || 'More';
      let g = groups.find((x) => x.name === name);
      if (!g) groups.push((g = { name, tracks: [] }));
      g.tracks.push(t);
    }
    const boardsUsed = new Set(lessons.map((l) => l.board).filter(Boolean));
    const stats = {
      lessons: lessons.length,
      tracks: TRACKS.length,
      groups: groups.length,
      quiz: lessons.reduce((n, l) => n + (l.quiz?.length || 0), 0),
      challenges: lessons.reduce((n, l) => n + (l.challenges?.length || 0), 0),
      boards: Object.keys(BOARD_INFO).length,
      boardsUsed: boardsUsed.size,
      noBoard: lessons.filter((l) => !l.board).length,
    };
    const boardName = (id) => (id ? BOARD_INFO[id]?.name ?? id.replace(/(^|-)(\w)/g, (_, s, c) => `${s ? ' ' : ''}${c.toUpperCase()}`) : 'No board');
    return { TRACKS, lessons, BOARD_INFO, groups, stats, boardName };
  });
  return dataPromise;
}

const fmt = (n) => Number(n).toLocaleString('en');
/** Fill every [data-stat] with the live number (and [data-stat-plural] words). */
export async function fillStats(root = document) {
  const els = $$('[data-stat]', root);
  if (!els.length) return null;
  const d = await courseData();
  for (const el of els) {
    const v = d.stats[el.dataset.stat];
    if (v != null) el.textContent = fmt(v);
  }
  return d;
}

// ---------------------------------------------------------------- legal table of contents
export function buildToc(article = $('.pg-legal .prose'), toc = $('.pg-toc ol')) {
  if (!article || !toc) return;
  const hs = $$('h2', article);
  hs.forEach((h, i) => {
    h.id ||= h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `s${i}`;
  });
  toc.innerHTML = hs.map((h) => `<li><a href="#${h.id}">${esc(h.textContent)}</a></li>`).join('');
  const links = $$('a', toc);
  const io = new IntersectionObserver((es) => {
    for (const e of es) {
      if (!e.isIntersecting) continue;
      links.forEach((a) => (a.getAttribute('href') === `#${e.target.id}` ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    }
  }, { rootMargin: '-20% 0px -70% 0px' });
  hs.forEach((h) => io.observe(h));
}

// ---------------------------------------------------------------- page boot
/** Fill brand values, enhance components, mount the shared header/footer. Returns the shell API. */
export function initPage({ current } = {}) {
  fillBrand();
  for (const el of $$('[data-logo]')) el.innerHTML = markSVG({ size: Number(el.dataset.logo) || 64 });
  enhanceCards();
  enhanceIcons();
  mountStorage();
  const shell = mountShell({ current });
  spyNav();
  fillStats().catch((e) => console.warn('Could not load course data', e));
  return shell;
}
