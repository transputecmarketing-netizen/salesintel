// Reusable hand-drawn parts for explainer scenes. Every function takes the scene kit S.
import { clamp, lerp } from './engine.js';

const RES_BODY = '#ead7b0'; // a resistor's beige body (the real thing's colour)
export const BAND = {
  black: '#1b1b1d', brown: '#7a4a24', red: '#d8262a', orange: '#f07c1a', yellow: '#f5cf1d', green: '#2c9a4a',
  blue: '#2a63d6', violet: '#7b3fbf', grey: '#8c8c8c', white: '#f4f4f2', gold: '#c9a227', silver: '#b9bcc2',
};

/** A polyline as an SVG path string (for wires and flows). Rounded corners with r. */
export function pathOf(pts, r = 14) {
  if (pts.length < 3 || !r) return 'M' + pts.map((p) => p.join(' ')).join(' L');
  let s = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], [cx, cy] = pts[i + 1];
    const l1 = Math.hypot(bx - ax, by - ay), l2 = Math.hypot(cx - bx, cy - by);
    const k1 = Math.min(r, l1 / 2) / l1, k2 = Math.min(r, l2 / 2) / l2;
    s += ` L${bx - (bx - ax) * k1} ${by - (by - ay) * k1} Q${bx} ${by} ${bx + (cx - bx) * k2} ${by + (cy - by) * k2}`;
  }
  const e = pts[pts.length - 1];
  return s + ` L${e[0]} ${e[1]}`;
}

/** A wire along points. Returns { g, d } where d is the path string (feed it to S.flow). */
export function wire(S, pts, o = {}) {
  const d = pathOf(pts, o.r ?? 14);
  const g = S.d.path(d, { stroke: o.color ?? S.C.ink, strokeWidth: o.width ?? 3, roughness: o.roughness ?? 0.7, bowing: 0.4, fill: 'none', parent: o.parent, disableMultiStroke: true });
  return { g, d };
}

/** A cylindrical cell, horizontal, centred on (x, y). + end on the right unless flip. */
export function battery(S, x, y, o = {}) {
  const { d, C } = S;
  const L = o.len ?? 130, h = o.h ?? 52, flip = !!o.flip;
  const g = d.g(o.parent);
  d.into(g, () => {
    const x0 = x - L / 2;
    d.rect(x0, y - h / 2, L, h, { fill: o.color ?? C.ink, fillStyle: 'solid', stroke: C.ink, roughness: 0.6 });
    // the coloured band at the + end
    const bx = flip ? x0 : x0 + L * 0.72;
    d.rect(bx, y - h / 2, L * 0.28, h, { fill: o.band ?? C.accent, fillStyle: 'solid', stroke: C.ink, roughness: 0.6 });
    const nx = flip ? x0 - 9 : x0 + L;
    d.rect(nx, y - h * 0.18, 9, h * 0.36, { fill: '#c7c9cf', fillStyle: 'solid', stroke: C.ink, strokeWidth: 1.6, roughness: 0.4 });
    d.line(x0 + 10, y - h / 2 + 8, x0 + L - 10, y - h / 2 + 8, { stroke: 'rgba(255,255,255,0.35)', strokeWidth: 3, roughness: 0.3 });
    d.text(flip ? x0 + L * 0.14 : x0 + L * 0.86, y + 1, '+', { size: 28, weight: 500, fill: '#fff' });
    d.text(flip ? x0 + L * 0.86 : x0 + L * 0.14, y + 1, '−', { size: 28, weight: 500, fill: '#fff' });
    if (o.label) d.text(x - (flip ? -L * 0.12 : L * 0.12), y + 1, o.label, { size: 20, weight: 500, fill: '#fff', mono: true });
  });
  const plus = flip ? [x - L / 2 - 9, y] : [x + L / 2 + 9, y];
  const minus = flip ? [x + L / 2, y] : [x - L / 2, y];
  return { g, plus, minus };
}

/** A light bulb, base at the bottom, glass centred on (x, y). set(0..1) lights it. */
export function bulb(S, x, y, o = {}) {
  const { d, C } = S;
  const r = o.r ?? 36;
  const g = d.g(o.parent);
  const glow = d.glow(x, y, r * 3.2, C.yellow, o.glowParent);
  let warm, fil, crack;
  d.into(g, () => {
    d.circle(x, y, r * 2, { fill: '#fff', fillStyle: 'solid', stroke: C.ink, roughness: 0.9 });
    warm = d.el('circle', { cx: x, cy: y, r: r - 2, fill: C.yellow, opacity: 0 });
    // neck and screw base
    d.path(`M${x - r * 0.42} ${y + r * 0.86} L${x - r * 0.42} ${y + r * 1.25} L${x + r * 0.42} ${y + r * 1.25} L${x + r * 0.42} ${y + r * 0.86}`, { fill: '#fff', stroke: C.ink, roughness: 0.6 });
    d.rect(x - r * 0.44, y + r * 1.25, r * 0.88, r * 0.55, { fill: '#c7c9cf', fillStyle: 'hachure', hachureGap: 4, stroke: C.ink, roughness: 0.6, strokeWidth: 1.8 });
    d.line(x - r * 0.44, y + r * 1.43, x + r * 0.44, y + r * 1.48, { strokeWidth: 1.4, roughness: 0.4 });
    d.line(x - r * 0.44, y + r * 1.6, x + r * 0.44, y + r * 1.65, { strokeWidth: 1.4, roughness: 0.4 });
    d.ellipse(x, y + r * 1.85, r * 0.36, r * 0.18, { fill: C.ink, fillStyle: 'solid', roughness: 0.3 });
    // filament supports and coil
    d.line(x - r * 0.25, y + r * 0.9, x - r * 0.3, y, { strokeWidth: 1.5, roughness: 0.5 });
    d.line(x + r * 0.25, y + r * 0.9, x + r * 0.3, y, { strokeWidth: 1.5, roughness: 0.5 });
    fil = d.path(`M${x - r * 0.3} ${y} q${r * 0.075} ${-r * 0.22} ${r * 0.15} 0 q${r * 0.075} ${-r * 0.22} ${r * 0.15} 0 q${r * 0.075} ${-r * 0.22} ${r * 0.15} 0 q${r * 0.075} ${-r * 0.22} ${r * 0.15} 0`, { stroke: C.ink, strokeWidth: 1.8, roughness: 0.3, fill: 'none' });
    crack = d.g(g, { opacity: 0 });
    d.into(crack, () => {
      d.line(x - r * 0.3, y, x - r * 0.05, y - r * 0.12, { stroke: C.ink, strokeWidth: 1.8 });
      d.line(x + r * 0.05, y - r * 0.18, x + r * 0.3, y, { stroke: C.ink, strokeWidth: 1.8 });
    });
  });
  const api = {
    g, glow, level: 0,
    left: [x - r * 0.42, y + r * 1.5], right: [x + r * 0.42, y + r * 1.5], bottom: [x, y + r * 1.94],
    set(v) {
      v = clamp(v);
      api.level = v;
      glow.setAttribute('opacity', (v * 0.95).toFixed(3));
      warm.setAttribute('opacity', (v * 0.55).toFixed(3));
      fil.querySelectorAll('path').forEach((p) => p.setAttribute('stroke', v > 0.05 ? mixC(C.ink, C.accent, clamp(v * 1.4)) : C.ink));
    },
    broken(on) { crack.setAttribute('opacity', on ? 1 : 0); fil.setAttribute('opacity', on ? 0 : 1); },
  };
  return api;
}
const mixC = (a, b, t) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  try { const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join(''); } catch { return b; }
};

/** An LED standing up: dome at (x, y), legs down. set(0..1). Returns leg ends. */
export function led(S, x, y, o = {}) {
  const { d, C } = S;
  const col = o.color ?? C.accent, s = o.size ?? 1;
  const g = d.g(o.parent);
  const glow = d.glow(x, y, 70 * s, col, o.glowParent);
  let lit, dome, rim;
  d.into(g, () => {
    const w = 34 * s, h = 46 * s;
    d.line(x - 9 * s, y + h * 0.5, x - 9 * s, y + h * 0.5 + (o.leg ?? 46) * s + 12 * s, { strokeWidth: 2.4, stroke: '#8e9097' }); // anode: long
    d.line(x + 9 * s, y + h * 0.5, x + 9 * s, y + h * 0.5 + (o.leg ?? 46) * s, { strokeWidth: 2.4, stroke: '#8e9097' }); // cathode: short
    dome = d.path(`M${x - w / 2} ${y + h * 0.42} L${x - w / 2} ${y - h * 0.1} A${w / 2} ${w / 2} 0 0 1 ${x + w / 2} ${y - h * 0.1} L${x + w / 2} ${y + h * 0.42} Z`,
      { fill: mixC(col.length === 7 ? col : '#e5132d', '#ffffff', 0.55), fillStyle: 'solid', stroke: C.ink, roughness: 0.6 });
    lit = d.el('path', { d: `M${x - w / 2 + 3} ${y + h * 0.4} L${x - w / 2 + 3} ${y - h * 0.1} A${w / 2 - 3} ${w / 2 - 3} 0 0 1 ${x + w / 2 - 3} ${y - h * 0.1} L${x + w / 2 - 3} ${y + h * 0.4} Z`, fill: col, opacity: 0 });
    // rim with the flat on the cathode (right) side
    rim = d.rect(x - w / 2 - 4 * s, y + h * 0.42, w + 4 * s, 8 * s, { fill: mixC(col.length === 7 ? col : '#e5132d', '#ffffff', 0.4), fillStyle: 'solid', stroke: C.ink, strokeWidth: 1.8, roughness: 0.5 });
  });
  const legY = y + 46 * s * 0.5 + (o.leg ?? 46) * s;
  return {
    g, glow,
    anode: [x - 9 * s, legY + 12 * s], cathode: [x + 9 * s, legY],
    set(v) { v = clamp(v); lit.setAttribute('opacity', (0.15 + v * 0.85) * (v > 0.01 ? 1 : 0)); glow.setAttribute('opacity', (v * 0.9).toFixed(3)); },
    setColor(c) {
      lit.setAttribute('fill', c);
      glow.setAttribute('fill', d.glowFill(c));
      for (const [n, t] of [[dome, 0.55], [rim, 0.4]]) n.querySelectorAll('path').forEach((p) => { const f = p.getAttribute('fill'); if (f && f !== 'none') p.setAttribute('fill', mixC(c, '#ffffff', t)); });
    },
  };
}

/** A through-hole resistor, centred on (x, y), horizontal (or vertical). bands = colour names. */
export function resistor(S, x, y, o = {}) {
  const { d, C } = S;
  const L = o.len ?? 96, h = o.h ?? 30, lead = o.lead ?? 28;
  const g = d.g(o.parent);
  const bandsG = d.g(g);
  const vert = !!o.vertical;
  if (vert) g.setAttribute('transform', `rotate(90 ${x} ${y})`);
  d.into(g, () => {
    d.line(x - L / 2 - lead, y, x - L / 2 + 4, y, { strokeWidth: 2.4, stroke: '#8e9097' });
    d.line(x + L / 2 - 4, y, x + L / 2 + lead, y, { strokeWidth: 2.4, stroke: '#8e9097' });
    d.path(`M${x - L / 2 + h / 2} ${y - h / 2} L${x + L / 2 - h / 2} ${y - h / 2} A${h / 2} ${h / 2} 0 0 1 ${x + L / 2 - h / 2} ${y + h / 2} L${x - L / 2 + h / 2} ${y + h / 2} A${h / 2} ${h / 2} 0 0 1 ${x - L / 2 + h / 2} ${y - h / 2} Z`,
      { fill: RES_BODY, fillStyle: 'solid', stroke: C.ink, roughness: 0.6 });
  });
  g.appendChild(bandsG);
  const setBands = (bands = ['red', 'red', 'brown', 'gold']) => {
    d.redraw(bandsG, () => {
      const xs = [0.24, 0.37, 0.5, 0.76];
      bands.forEach((b, i) => {
        if (!b) return;
        const bx = x - L / 2 + L * (xs[i] ?? 0.5);
        const bw = o.bandW ?? 9;
        d.rect(bx - bw / 2, y - h / 2 + 1.5, bw, h - 3, { fill: BAND[b] ?? b, fillStyle: 'solid', stroke: b === 'white' ? C.line2 : 'none', strokeWidth: 1, roughness: 0.3 });
      });
    });
  };
  setBands(o.bands);
  const ends = vert ? [[x, y - L / 2 - lead], [x, y + L / 2 + lead]] : [[x - L / 2 - lead, y], [x + L / 2 + lead, y]];
  return { g, a: ends[0], b: ends[1], setBands, bandX: (i) => x - L / 2 + L * [0.24, 0.37, 0.5, 0.76][i] };
}

/** A knife switch from (x, y) to (x + len, y). set(closed 0..1). Tap target in .hit. */
export function knife(S, x, y, len = 90, o = {}) {
  const { d, C } = S;
  const g = d.g(o.parent);
  let lever;
  d.into(g, () => {
    d.circle(x, y, 13, { fill: '#fff', fillStyle: 'solid', strokeWidth: 2 });
    d.circle(x + len, y, 13, { fill: '#fff', fillStyle: 'solid', strokeWidth: 2 });
    lever = d.g(g);
    d.into(lever, () => {
      d.line(x, y, x + len + 4, y, { strokeWidth: 5, stroke: C.ink, roughness: 0.5 });
      d.circle(x + len * 0.72, y - 14, 18, { fill: C.accent, fillStyle: 'solid', stroke: C.ink, strokeWidth: 1.6 });
      d.line(x + len * 0.72, y - 4, x + len * 0.72, y - 10, { strokeWidth: 2.5 });
    });
  });
  const hit = d.el('rect', { x: x - 10, y: y - 60, width: len + 30, height: 80, fill: 'transparent' }, g);
  const api = { g, hit, a: [x, y], b: [x + len, y], set(c) { lever.setAttribute('transform', `rotate(${(-(1 - clamp(c)) * 32).toFixed(2)} ${x} ${y})`); } };
  api.set(o.closed ?? 1);
  return api;
}

/** Axes for a sketchy graph. Returns mappers and a plot group. */
export function graph(S, x, y, w, h, o = {}) {
  const { d, C } = S;
  const g = d.g(o.parent);
  const xMax = o.xMax ?? 1, yMax = o.yMax ?? 1, xMin = o.xMin ?? 0, yMin = o.yMin ?? 0;
  const px = (v) => x + ((v - xMin) / (xMax - xMin)) * w;
  const py = (v) => y + h - ((v - yMin) / (yMax - yMin)) * h;
  d.into(g, () => {
    if (o.grid) for (let i = 1; i <= 4; i++) d.line(x, y + h - (h * i) / 4, x + w, y + h - (h * i) / 4, { stroke: C.line, strokeWidth: 1, roughness: 0.4 });
    d.arrow(x, y + h, x + w + 16, y + h, { strokeWidth: 2, roughness: 0.5, head: 10 });
    d.arrow(x, y + h, x, y - 16, { strokeWidth: 2, roughness: 0.5, head: 10 });
    if (o.xLabel) d.text(x + w / 2, y + h + 46, o.xLabel, { size: 17, fill: C.muted, mono: true });
    if (o.yLabel) d.text(x + 12, y - 20, o.yLabel, { size: 17, anchor: 'start', fill: C.muted, mono: true });
    for (const [v, t] of o.xTicks ?? []) { d.line(px(v), y + h - 5, px(v), y + h + 5, { strokeWidth: 1.5, roughness: 0.3 }); d.text(px(v), y + h + 22, t, { size: 16, fill: C.muted, mono: true }); }
    for (const [v, t] of o.yTicks ?? []) { d.line(x - 5, py(v), x + 5, py(v), { strokeWidth: 1.5, roughness: 0.3 }); d.text(x - 10, py(v), t, { size: 16, fill: C.muted, mono: true, anchor: 'end' }); }
  });
  const plotG = d.g(g);
  /** Plot fn(xv) over [xMin, xMax] (or an array of [x, y] points) with a crisp, slightly wobbly line. */
  const line = (fn, lo = {}) => {
    const pts = Array.isArray(fn) ? fn : Array.from({ length: (lo.n ?? 80) + 1 }, (_, i) => { const xv = xMin + ((xMax - xMin) * i) / (lo.n ?? 80); return [xv, fn(xv)]; });
    const dd = 'M' + pts.map(([a, b]) => `${px(a).toFixed(1)} ${py(clamp(b, yMin - (yMax - yMin) * 0.05, yMax * 1.05)).toFixed(1)}`).join(' L');
    return d.el('path', { d: dd, fill: 'none', stroke: lo.color ?? C.accent, 'stroke-width': lo.width ?? 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': lo.dash ?? null, opacity: lo.opacity ?? null }, lo.parent ?? plotG);
  };
  /** Path data for fn over the x range (to update an existing line). */
  const dOf = (fn, n = 80) => 'M' + Array.from({ length: n + 1 }, (_, i) => { const xv = xMin + ((xMax - xMin) * i) / n; return `${px(xv).toFixed(1)} ${py(clamp(fn(xv), yMin - (yMax - yMin) * 0.05, yMax * 1.05)).toFixed(1)}`; }).join(' L');
  const dot = (color = C.accent, r = 8) => {
    const c = d.el('circle', { r, fill: color, stroke: '#fff', 'stroke-width': 2.5 }, g);
    return { el: c, at(xv, yv) { c.setAttribute('cx', px(xv).toFixed(1)); c.setAttribute('cy', py(yv).toFixed(1)); } };
  };
  return { g, plotG, px, py, line, dot, dOf, clear: () => { while (plotG.firstChild) plotG.firstChild.remove(); } };
}

/** A soft hand-drawn panel behind a group of things. */
export function panel(S, x, y, w, h, o = {}) {
  return S.d.rect(x, y, w, h, { fill: o.fill ?? S.C.subtle, stroke: o.stroke ?? S.C.line, strokeWidth: 1.4, roughness: 1.4, bowing: 2, parent: o.parent ?? S.layers.back });
}

/** A label with a short leader line: from the point (ax, ay) to the text at (tx, ty). */
export function label(S, ax, ay, tx, ty, text, o = {}) {
  const { d, C } = S;
  const g = d.g(o.parent ?? S.layers.top);
  d.into(g, () => {
    d.line(ax, ay, tx, ty + (ty > ay ? -14 : 10), { stroke: o.color ?? C.muted, strokeWidth: 1.4, roughness: 0.8 });
    d.circle(ax, ay, 6, { fill: o.color ?? C.muted, fillStyle: 'solid', stroke: 'none', roughness: 0.3 });
    d.text(tx, ty, text, { size: o.size ?? 21, fill: o.fill ?? C.ink2, anchor: o.anchor ?? 'middle', weight: o.weight ?? 400 });
  });
  return g;
}

/** A small chip (DIP or QFP style), centred. */
export function chip(S, x, y, w, h, o = {}) {
  const { d, C } = S;
  const g = d.g(o.parent);
  d.into(g, () => {
    const n = o.pins ?? 4, sides = o.sides ?? 'tb';
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      if (sides.includes('t')) d.line(x - w / 2 + w * t, y - h / 2, x - w / 2 + w * t, y - h / 2 - 12, { strokeWidth: 3, stroke: '#9a9ca3', roughness: 0.3 });
      if (sides.includes('b')) d.line(x - w / 2 + w * t, y + h / 2, x - w / 2 + w * t, y + h / 2 + 12, { strokeWidth: 3, stroke: '#9a9ca3', roughness: 0.3 });
      if (sides.includes('l')) d.line(x - w / 2, y - h / 2 + h * t, x - w / 2 - 12, y - h / 2 + h * t, { strokeWidth: 3, stroke: '#9a9ca3', roughness: 0.3 });
      if (sides.includes('r')) d.line(x + w / 2, y - h / 2 + h * t, x + w / 2 + 12, y - h / 2 + h * t, { strokeWidth: 3, stroke: '#9a9ca3', roughness: 0.3 });
    }
    d.rect(x - w / 2, y - h / 2, w, h, { fill: o.fill ?? '#2a2b31', fillStyle: 'solid', stroke: C.ink, roughness: 0.5 });
    if (o.label) d.text(x, y + 1, o.label, { size: o.size ?? 18, fill: o.ink ?? '#fff', mono: true, weight: 500 });
  });
  return g;
}

/** Sound or radio wavefronts: arcs that expand from (x, y) towards angle a (rad). Returns { g, set(radius, opacity) }. */
export function arcs(S, x, y, o = {}) {
  const { d, C } = S;
  const g = d.g(o.parent ?? S.layers.fx);
  const spread = o.spread ?? 0.5;
  const els = [];
  for (let i = 0; i < (o.n ?? 3); i++) els.push(d.el('path', { fill: 'none', stroke: o.color ?? C.iris, 'stroke-width': o.width ?? 3, 'stroke-linecap': 'round' }, g));
  const a = o.angle ?? 0;
  return {
    g,
    /** draw arcs at radii r, r - gap, r - 2 gap … */
    set(r, op = 1, gap = o.gap ?? 16) {
      els.forEach((e, i) => {
        const rr = r - i * gap;
        if (rr <= 2) { e.setAttribute('d', ''); return; }
        const x1 = x + Math.cos(a - spread) * rr, y1 = y + Math.sin(a - spread) * rr, x2 = x + Math.cos(a + spread) * rr, y2 = y + Math.sin(a + spread) * rr;
        e.setAttribute('d', `M${x1.toFixed(1)} ${y1.toFixed(1)} A${rr.toFixed(1)} ${rr.toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`);
        e.setAttribute('opacity', (op * (1 - i * 0.28)).toFixed(3));
      });
    },
  };
}
