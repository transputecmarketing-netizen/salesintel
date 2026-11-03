// Lucide icons (ISC licence, lucide.dev) as inline SVG strings.
// lucide('cpu'), lucide('circuit-board', { size: 32, stroke: 1.5 })
import { icons } from 'lucide';

const pascal = (name) => name.replace(/(^|[-_ ])(\w)/g, (_, __, c) => c.toUpperCase());
const attrs = (o) => Object.entries(o).map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' ');

export function lucide(name, { size = 24, stroke = 1.5, cls = '', label = '' } = {}) {
  const node = icons[pascal(name)];
  if (!node) {
    console.warn(`Unknown icon: ${name}`);
    return '';
  }
  const body = node.map(([tag, a]) => `<${tag} ${attrs(a)}/>`).join('');
  const aria = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="lucide ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" ${aria}>${body}</svg>`;
}

/** Replace every <i data-lucide="name"> (or any element with data-lucide) under root. */
export function hydrateIcons(root = document) {
  for (const el of root.querySelectorAll('[data-lucide]')) {
    if (el.dataset.lucideDone) continue;
    el.innerHTML = lucide(el.dataset.lucide, { size: Number(el.dataset.size) || 24, stroke: Number(el.dataset.stroke) || 1.5 });
    el.dataset.lucideDone = '1';
  }
}
