// /guide/ entry: the index of guides, one guide (#id), or its print view (#id?print).
import '../brand/tokens.css';
import './guide.css';
import { lessons } from '../lessons/index.js';
import { hasGuide } from './plan.js';
import { mountViewer } from './viewer.js';
import { mountPrint } from './print.js';
import { mountIndex } from './catalog.js';

const root = document.getElementById('guide-root');
let view = null;

function route() {
  const raw = decodeURIComponent(location.hash.slice(1));
  const [path, query = ''] = raw.split('?');
  const [id, sub] = path.split('/');
  const print = /(^|&)print\b/.test(query);
  const key = `${id}|${print}`;
  if (view?.key === key) {
    view.goTo?.(sub ?? 'cover');
    return;
  }
  view?.destroy();
  view = null;
  window.scrollTo(0, 0);
  const lesson = id ? lessons.find((l) => l.id === id) : null;
  document.body.classList.toggle('is-print', !!(lesson && print));
  if (!id) {
    document.title = 'Build guides — Tinker Lab';
    view = mountIndex(root, lessons.filter(hasGuide));
  } else if (!lesson || !hasGuide(lesson)) {
    document.title = 'Build guide — Tinker Lab';
    root.innerHTML = `<div class="g-missing"><h1>No build guide here</h1><p>${lesson ? 'This lesson is an explainer: there is nothing to build.' : 'We could not find that lesson.'}</p><p><a class="g-pill is-primary" href="/guide/">All build guides</a>${lesson ? ` <a class="g-pill" href="/learn/#${lesson.id}">Open the lesson</a>` : ''}</p></div>`;
    view = { destroy() { root.innerHTML = ''; } };
  } else {
    document.title = `${lesson.title}: build guide — Tinker Lab`;
    view = print ? mountPrint(root, lesson) : mountViewer(root, lesson, { startPage: sub ?? null });
  }
  view.key = key;
}

window.addEventListener('hashchange', route);
route();
