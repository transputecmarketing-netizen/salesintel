// Print view: /guide/#<id>?print. A4 sheets: a cover, the parts list, then
// every step as a static drawing, two steps per sheet.
import * as THREE from 'three';
import { createGuide } from './core.js';
import { makeRenderer } from './lineart.js';
import { inventoryThumbs, partsListHTML, coverMetaHTML, lede } from './viewer.js';
import { lucide } from '../brand/lucide.js';
import { markSVG } from '../brand/logo.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const yieldFrame = () => new Promise((r) => setTimeout(r, 0));

export function mountPrint(el, lesson) {
  el.innerHTML = `
    <div class="g-print-bar">
      <a class="g-pill" href="#${esc(lesson.id)}">${lucide('arrow-left', { size: 17 })}<span>Back to the guide</span></a>
      <p>A4, two steps per page</p>
      <div><button class="g-pill is-primary" data-print disabled>${lucide('printer', { size: 17 })}<span>Print</span></button></div>
    </div>
    <p class="g-progress" role="status">Drawing the pages</p>
    <div class="g-sheets"></div>`;
  const sheets = el.querySelector('.g-sheets');
  const status = el.querySelector('.g-progress');
  const btn = el.querySelector('[data-print]');
  btn.addEventListener('click', () => window.print());
  let alive = true, renderer = null, guide = null;

  (async () => {
    await yieldFrame();
    try {
      guide = createGuide(lesson);
    } catch (e) {
      console.error(e);
      status.textContent = `This guide could not be drawn yet (${e.message}).`;
      return;
    }
    const canvas = document.createElement('canvas');
    renderer = makeRenderer(canvas, { preserve: true });
    renderer.setPixelRatio(1.6);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 200);
    const thumbs = inventoryThumbs(guide, renderer, camera, 200);

    const snap = (k, w, h) => {
      guide.setStep(k);
      renderer.setSize(w, h, false);
      guide.art.setResolution(w, h);
      const v = guide.viewFor(k, w / h);
      guide.applyView(camera, v, w / h);
      renderer.render(guide.scene, camera);
      return { img: renderer.domElement.toDataURL('image/png'), svg: guide.overlay(k, camera, w, h, 1), w, h };
    };
    const fig = ({ img, svg, w, h }) => `<div class="g-fig"><img src="${img}" alt="" /><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${svg}</svg></div>`;

    const total = guide.steps.length;
    const nSheets = 2 + Math.ceil(total / 2);
    let sheetNo = 0;
    const sheet = (cls, body) => {
      sheetNo++;
      return `<section class="g-sheet ${cls}">
        <header class="g-sheet-head"><span>${markSVG({ size: 16 })} Tinker Lab build guide</span><span>${esc(lesson.title)}</span></header>
        <div class="g-sheet-body">${body}</div>
        <footer class="g-sheet-foot"><span>${esc(location.host)}/guide/#${esc(lesson.id)}</span><span>${sheetNo} / ${nSheets}</span></footer>
      </section>`;
    };

    let html = '';
    const cover = snap(-1, 1400, 1080);
    html += sheet('is-cover', `
      <p class="g-eyebrow">${esc(lesson.track?.title ?? 'Build guide')}</p>
      <div><h1>${esc(lesson.title)}</h1>${lede(lesson)}</div>
      ${fig(cover)}
      ${coverMetaHTML(guide)}`);
    html += sheet('is-parts', `<p class="g-eyebrow">Before you start</p><h2>What you need</h2>${partsListHTML(guide, thumbs, { compact: true })}`);
    sheets.innerHTML = html;

    for (let i = 0; i < total; i += 2) {
      if (!alive) return;
      status.textContent = `Drawing step ${i + 1} of ${total}`;
      await yieldFrame();
      let body = '';
      for (const k of [i, i + 1]) {
        const s = guide.steps[k];
        if (!s) continue;
        const f = snap(k, 1240, 760);
        body += `<article class="g-pstep"><div class="n">${s.n}</div><div class="body">
          <p class="cap">${esc(s.caption)}</p>
          <ul class="need">${s.parts.map((e) => `<li><img src="${thumbs.get(e.key) ?? ''}" alt="" /><b>×${e.count}</b> ${esc(e.label)}</li>`).join('')}</ul>
          ${fig(f)}</div></article>`;
      }
      sheets.insertAdjacentHTML('beforeend', sheet('is-steps', body));
    }
    status.remove();
    btn.disabled = false;
    document.documentElement.dataset.printReady = '1';
    guide.art.dispose();
    renderer.dispose();
    renderer.forceContextLoss?.();
    renderer = null;
  })();

  return {
    destroy() {
      alive = false;
      renderer?.dispose();
      el.innerHTML = '';
      delete document.documentElement.dataset.printReady;
    },
  };
}
