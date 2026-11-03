// The breadboard: hidden metal strips, X-ray view, tap a hole to see what it connects to.
import { scene } from '../../engine.js';

const P = 23.5, X0 = 60, COLS = 30;
const ROWS = { a: 150, b: 173.5, c: 197, d: 220.5, e: 244, f: 306, g: 329.5, h: 353, i: 376.5, j: 400 };
const RAIL = { 'top+': 70, 'top-': 96, 'bot-': 450, 'bot+': 476 };
const cx = (c) => X0 + (c - 1) * P;
const railCols = () => { const out = []; for (let k = 0; k < 25; k++) out.push(X0 + P * 0.5 + (k + Math.floor(k / 5)) * P * (29 / 29.5) - 0); return out; };

export default (el, api) => scene(el, api, {
  w: 800, h: 500, label: 'A half-size breadboard you can X-ray and probe',
  steps: [
    'A breadboard holds parts without solder: just push the legs in.',
    'X-ray: hidden metal clips join the holes in strips.',
    'Each short column of five holes is one connection.',
    'The middle gap splits the columns, so chips can sit across it.',
    'The long rails carry power along the edges: red +, blue −.',
    'Your turn: tap any hole to see what it connects to.',
  ],
  build(S) {
    const { d, C } = S;
    const st = { xray: 0, parts: 0, chip: 0, sel: null };
    // board
    d.rect(36, 44, 728, 448, { fill: '#f4f3ef', stroke: C.ink, strokeWidth: 2.2, roughness: 0.7 });
    d.rect(36, 268, 728, 16, { fill: '#e4e2dc', stroke: 'none', roughness: 0.4 });
    for (const [k, y] of Object.entries(RAIL)) d.line(48, y + (k.endsWith('+') ? (k.startsWith('top') ? -15 : 13) : (k.startsWith('top') ? 13 : -15)), 752, y + (k.endsWith('+') ? (k.startsWith('top') ? -15 : 13) : (k.startsWith('top') ? 13 : -15)), { stroke: k.endsWith('+') ? C.accent : C.blue, strokeWidth: 2.5, roughness: 0.5 });
    d.text(30, 70, '+', { size: 20, fill: C.accentInk, weight: 500 }); d.text(30, 96, '−', { size: 20, fill: C.blue, weight: 500 });
    d.text(30, 450, '−', { size: 20, fill: C.blue, weight: 500 }); d.text(30, 476, '+', { size: 20, fill: C.accentInk, weight: 500 });
    for (const [r, y] of Object.entries(ROWS)) d.text(46, y, r, { size: 13, fill: C.muted, mono: true });
    for (let c = 1; c <= COLS; c += c === 1 ? 4 : 5) d.text(cx(c), 128, String(c), { size: 13, fill: C.muted, mono: true });

    // metal strips (X-ray)
    const metal = d.g(undefined, { opacity: 0 });
    d.into(metal, () => {
      for (let c = 1; c <= COLS; c++) {
        d.rect(cx(c) - 7, ROWS.a - 11, 14, ROWS.e - ROWS.a + 22, { fill: '#c7c9cf', stroke: '#8e9097', strokeWidth: 1.2, roughness: 0.5 });
        d.rect(cx(c) - 7, ROWS.f - 11, 14, ROWS.j - ROWS.f + 22, { fill: '#c7c9cf', stroke: '#8e9097', strokeWidth: 1.2, roughness: 0.5 });
      }
      for (const y of Object.values(RAIL)) d.rect(66, y - 7, 670, 14, { fill: '#c7c9cf', stroke: '#8e9097', strokeWidth: 1.2, roughness: 0.5 });
    });
    const hiG = d.g();
    // holes
    const holes = [];
    const holeG = d.g();
    const rx = railCols();
    for (let c = 1; c <= COLS; c++) for (const [r, y] of Object.entries(ROWS)) holes.push({ x: cx(c), y, g: `c${c}${'abcde'.includes(r) ? 'T' : 'B'}`, name: `${c}${r}` });
    for (const [k, y] of Object.entries(RAIL)) rx.forEach((x) => holes.push({ x, y, g: k, name: `${k} rail` }));
    for (const h of holes) h.el = d.el('rect', { x: h.x - 4.5, y: h.y - 4.5, width: 9, height: 9, rx: 1.5, fill: '#4a4b52' }, holeG);

    // parts: an LED (top-down) and a resistor across the gap, plus a chip
    const partsG = d.g(undefined, { opacity: 0 });
    d.into(partsG, () => {
      d.line(cx(6), ROWS.b, cx(7), ROWS.b, { stroke: '#8e9097', strokeWidth: 3 });
      d.circle(cx(6.5), ROWS.b - 2, 34, { fill: '#f6a3ab', stroke: C.ink, strokeWidth: 1.8 });
      d.circle(cx(6.5), ROWS.b - 2, 22, { fill: C.accent, stroke: 'none' });
      d.line(cx(7), ROWS.d, cx(7), ROWS.h, { stroke: '#8e9097', strokeWidth: 3 });
      d.rect(cx(7) - 9, 248, 18, 76, { fill: '#ead7b0', stroke: C.ink, strokeWidth: 1.6, roughness: 0.4 });
      for (const [y, c] of [[258, '#d8262a'], [270, '#d8262a'], [282, '#7a4a24'], [308, '#c9a227']]) d.rect(cx(7) - 8, y, 16, 5, { fill: c, stroke: 'none', roughness: 0.2 });
    });
    const dropT = { v: -60 };
    const chipG = d.g(undefined, { opacity: 0 });
    d.into(chipG, () => {
      d.rect(cx(18) - 12, ROWS.e - 4, cx(21) - cx(18) + 24, ROWS.f - ROWS.e + 8, { fill: '#2a2b31', stroke: C.ink, roughness: 0.4 });
      d.circle(cx(18) - 2, 276, 10, { fill: '#4a4b52', stroke: 'none' });
      for (let c = 18; c <= 21; c++) { d.rect(cx(c) - 4, ROWS.e - 8, 8, 8, { fill: '#c7c9cf', stroke: 'none' }); d.rect(cx(c) - 4, ROWS.f, 8, 8, { fill: '#c7c9cf', stroke: 'none' }); }
      d.text(cx(19.5), 276, 'chip', { size: 15, fill: '#fff', mono: true });
    });
    const info = d.text(400, 24, '', { size: 18, fill: C.ink2, mono: true });

    const select = (g, name) => {
      st.sel = g;
      d.seed = 300;
      d.redraw(hiG, () => {
        if (!g) return;
        const hs = holes.filter((h) => h.g === g);
        const xs = hs.map((h) => h.x), ys = hs.map((h) => h.y);
        const x0 = Math.min(...xs) - 12, x1 = Math.max(...xs) + 12, y0 = Math.min(...ys) - 12, y1 = Math.max(...ys) + 12;
        const col = g.endsWith('+') ? C.accent : g.endsWith('-') ? C.blue : C.iris;
        d.rect(x0, y0, x1 - x0, y1 - y0, { fill: col, fillStyle: 'solid', stroke: col, strokeWidth: 2, roughness: 0.8, opacity: 0.22 });
      });
      holes.forEach((h) => h.el.setAttribute('fill', h.g === g ? (g.endsWith('+') ? C.accent : g.endsWith('-') ? C.blue : C.iris) : '#4a4b52'));
      const n = holes.filter((h) => h.g === g).length;
      info.textContent = g ? `${name}: joined to ${n - 1} other holes` : '';
    };
    const hit = d.el('rect', { x: 36, y: 44, width: 728, height: 448, fill: 'transparent' }, S.layers.top);
    S.drag(hit, { cursor: 'pointer', start: (x, y) => {
      let best = null, bd = 1e9;
      for (const h of holes) { const dd = (h.x - x) ** 2 + (h.y - y) ** 2; if (dd < bd) { bd = dd; best = h; } }
      if (best && bd < 20 * 20) select(best.g, best.name); else select(null);
    } });

    const xr = S.ui.toggle({ label: 'X-ray', value: false, onChange: (on) => S.to(st, { xray: on ? 1 : 0 }, 0.6) });
    S.onTick(() => {
      metal.setAttribute('opacity', st.xray.toFixed(3));
      holeG.setAttribute('opacity', (1 - st.xray * 0.3).toFixed(3));
      partsG.setAttribute('opacity', st.parts.toFixed(3));
      partsG.setAttribute('transform', `translate(0 ${dropT.v.toFixed(1)})`);
      chipG.setAttribute('opacity', st.chip.toFixed(3));
    });

    return {
      step(i) {
        if (i === 0) { xr.set(false); select(null); S.to(st, { parts: 1, chip: 0 }, 0.4); dropT.v = -60; S.to(dropT, { v: 0 }, 0.9, { ease: 'back', delay: 0.3 }); }
        if (i === 1) { select(null); S.to(st, { parts: 0.35, chip: 0 }, 0.4); dropT.v = 0; S.play(async (w) => { await w(0.6); await S.hand.press(xr.el); xr.set(true); await w(0.4); S.hand.hide(); }); }
        if (i === 2) { xr.set(true); S.to(st, { parts: 0.6, chip: 0 }, 0.4); dropT.v = 0; select(null); S.play(async (w) => { await w(0.6); await S.hand.tap(cx(7), ROWS.c); select('c7T', '7c'); await w(0.6); S.hand.hide(); }); }
        if (i === 3) { xr.set(true); S.to(st, { parts: 0, chip: 1 }, 0.4); select('c19T', '19e'); }
        if (i === 4) { xr.set(true); S.to(st, { parts: 0, chip: 0 }, 0.4); select('top+', '+ rail'); S.play(async (w) => { await w(1.6); select('top-', '− rail'); }); }
        if (i === 5) { S.to(st, { parts: 0, chip: 0 }, 0.4); select(null); }
      },
    };
  },
});
