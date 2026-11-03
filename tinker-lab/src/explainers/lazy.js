// Load an explainer scene on demand, so lesson files stay light.
//   explainer: lazy(() => import('../explainers/scenes/basics/ohm.js'))
// The scene module's default export is (el, api) => { destroy() }.
export function lazy(load) {
  return (el, api) => {
    let view = null, dead = false;
    const wait = document.createElement('div');
    wait.className = 'xp-wait';
    wait.setAttribute('aria-hidden', 'true');
    el.appendChild(wait);
    load()
      .then((m) => { wait.remove(); if (!dead) view = m.default(el, api); })
      .catch((e) => { wait.remove(); console.error('Explainer failed to load', e); if (!dead) el.innerHTML = '<p class="xp-error">This animation could not load. Check your connection and reload the page.</p>'; });
    return { destroy() { dead = true; wait.remove(); view?.destroy?.(); } };
  };
}
