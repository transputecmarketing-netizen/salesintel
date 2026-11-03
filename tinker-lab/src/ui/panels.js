// Floating panels docked in the 3D stage: a live camera feed (with an
// annotation layer for AI lessons), a mini web browser (for IoT lessons that
// serve a web page) and a serial plotter (for sensor lessons).
import * as THREE from 'three';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export class PanelDock {
  constructor(el, stage) {
    this.el = el;
    this.stage = stage;
    this.items = [];
  }

  clear() {
    for (const it of this.items) it.dispose?.();
    this.items = [];
    this.el.innerHTML = '';
    this.el.classList.remove('has-panels');
  }

  #shell(kind, title, sub = '') {
    const p = document.createElement('section');
    p.className = `panel panel-${kind}`;
    p.innerHTML = `<header><span class="panel-dot"></span><b>${esc(title)}</b><small>${esc(sub)}</small><button class="panel-min" aria-label="Minimise panel" title="Minimise"><svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg></button></header><div class="panel-body"></div>`;
    p.querySelector('.panel-min').onclick = () => p.classList.toggle('is-min');
    this.el.append(p);
    this.el.classList.add('has-panels');
    return p;
  }

  /**
   * Camera feed rendered from a virtual camera in the scene.
   * opts: { position: Vector3, target: Vector3, fov = 55, title }
   */
  camera(opts) {
    const p = this.#shell('camera', opts.title ?? 'Camera feed', opts.sub ?? '1280×720 · 30 fps');
    const body = p.querySelector('.panel-body');
    body.innerHTML = '<div class="feed"></div><canvas class="feed-ink"></canvas><span class="rec">● LIVE</span>';
    const feed = body.querySelector('.feed');
    const ink = body.querySelector('canvas');
    const cam = new THREE.PerspectiveCamera(opts.fov ?? 55, 16 / 9, 0.1, 200);
    cam.position.copy(opts.position);
    cam.lookAt(opts.target);
    const off = this.stage.addInset(cam, feed);
    let drawFn = null;
    const g = ink.getContext('2d');
    const size = () => {
      const r = feed.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio, 2);
      if (ink.width !== Math.round(r.width * dpr)) {
        ink.width = Math.round(r.width * dpr);
        ink.height = Math.round(r.height * dpr);
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      return r;
    };
    const api = {
      el: p,
      camera: cam,
      /** World point → pixel position inside the feed. */
      project(v) {
        const r = feed.getBoundingClientRect();
        const q = v.clone().project(cam);
        return { x: ((q.x + 1) / 2) * r.width, y: ((1 - q.y) / 2) * r.height, visible: q.z < 1 && Math.abs(q.x) <= 1.05 && Math.abs(q.y) <= 1.05 };
      },
      /** Screen-space bounding box of an object in the feed. */
      boxOf(obj) {
        const box = new THREE.Box3().setFromObject(obj);
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, vis = false;
        for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
          const s = api.project(new THREE.Vector3(x, y, z));
          vis ||= s.visible;
          x0 = Math.min(x0, s.x); y0 = Math.min(y0, s.y); x1 = Math.max(x1, s.x); y1 = Math.max(y1, s.y);
        }
        return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, visible: vis };
      },
      /** Set a function that draws annotations every frame: fn(ctx, w, h). */
      draw(fn) { drawFn = fn; },
      clear() { drawFn = null; },
      /** Helper: labelled bounding box. */
      label(ctx, b, text, color = '#2ee6a6') {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.font = '600 11px "IBM Plex Mono", monospace';
        const tw = ctx.measureText(text).width + 8;
        ctx.fillStyle = color;
        ctx.fillRect(b.x - 1, Math.max(0, b.y - 16), tw, 16);
        ctx.fillStyle = '#0d1020';
        ctx.fillText(text, b.x + 3, Math.max(12, b.y - 4));
      },
      tick() {
        const r = size();
        g.clearRect(0, 0, r.width, r.height);
        drawFn?.(g, r.width, r.height);
      },
      dispose: () => off(),
    };
    this.items.push(api);
    return api;
  }

  /**
   * Mini web browser showing a page "served" by the board.
   * opts: { url, title, render(): html, onAction(action, value, el) }
   */
  browser(opts) {
    const p = this.#shell('browser', opts.title ?? 'Browser', 'phone · Wi-Fi');
    const body = p.querySelector('.panel-body');
    body.innerHTML = `<div class="url"><svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><span>${esc(opts.url ?? 'http://192.168.4.1/')}</span></div><div class="page"></div>`;
    const page = body.querySelector('.page');
    const api = {
      el: p,
      update() { page.innerHTML = opts.render(); },
      setUrl(u) { body.querySelector('.url span').textContent = u; },
    };
    page.addEventListener('click', (e) => {
      const t = e.target.closest('[data-action]');
      if (t) { opts.onAction?.(t.dataset.action, t.dataset.value, t); api.update(); }
    });
    page.addEventListener('input', (e) => {
      const t = e.target.closest('[data-action]');
      if (t) opts.onAction?.(t.dataset.action, t.value, t);
    });
    api.update();
    this.items.push(api);
    return api;
  }

  /**
   * Serial plotter. opts: { series: [{ name, color, min, max }], title }
   */
  plotter(opts) {
    const p = this.#shell('plotter', opts.title ?? 'Serial plotter', opts.series.map((s) => s.name).join(' · '));
    const body = p.querySelector('.panel-body');
    body.innerHTML = `<canvas></canvas><div class="legend">${opts.series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)} <b>–</b></span>`).join('')}</div>`;
    const cv = body.querySelector('canvas');
    const g = cv.getContext('2d');
    const N = 160;
    const data = opts.series.map(() => []);
    const vals = [...body.querySelectorAll('.legend b')];
    const api = {
      el: p,
      push(...values) {
        values.forEach((v, i) => {
          data[i].push(v);
          if (data[i].length > N) data[i].shift();
          if (vals[i]) vals[i].textContent = Number.isInteger(v) ? v : v.toFixed(1);
        });
      },
      reset() { data.forEach((d) => (d.length = 0)); },
      tick() {
        const r = cv.getBoundingClientRect();
        const dpr = Math.min(devicePixelRatio, 2);
        if (cv.width !== Math.round(r.width * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.clearRect(0, 0, r.width, r.height);
        g.strokeStyle = 'rgba(29,36,64,.08)';
        g.lineWidth = 1;
        for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, (r.height * i) / 4); g.lineTo(r.width, (r.height * i) / 4); g.stroke(); }
        opts.series.forEach((s, i) => {
          const d = data[i];
          if (d.length < 2) return;
          g.strokeStyle = s.color;
          g.lineWidth = 2;
          g.beginPath();
          d.forEach((v, k) => {
            const x = (k / (N - 1)) * r.width;
            const y = r.height - 4 - ((v - s.min) / (s.max - s.min)) * (r.height - 8);
            k ? g.lineTo(x, y) : g.moveTo(x, y);
          });
          g.stroke();
        });
      },
    };
    this.items.push(api);
    return api;
  }

  tick() {
    for (const it of this.items) it.tick?.();
  }
}
