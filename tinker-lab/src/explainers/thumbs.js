// Hand-drawn lesson-card thumbnails as SVG strings (rough.js generator, no DOM needed).
// thumb('basics-ohm') → '<svg …>'. Drawn in a 208 × 148 box; no text (data-URI images can't load fonts).
import rough from 'roughjs';
import { tokens } from './colors.js';

const gen = rough.generator();
let C;

function sketch(draw, seed = 1) {
  C ??= tokens();
  const out = [];
  let s = seed * 97;
  const base = (o) => ({ stroke: C.ink, strokeWidth: 2.4, roughness: 1, bowing: 0.8, fillStyle: 'solid', seed: s++, ...o });
  const add = (dr) => {
    for (const p of gen.toPaths(dr)) out.push(`<path d="${p.d}" fill="${p.fill ?? 'none'}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`);
  };
  const t = {
    C,
    line: (x1, y1, x2, y2, o) => add(gen.line(x1, y1, x2, y2, base(o))),
    rect: (x, y, w, h, o) => add(gen.rectangle(x, y, w, h, base(o))),
    circle: (x, y, dia, o) => add(gen.circle(x, y, dia, base(o))),
    ellipse: (x, y, w, h, o) => add(gen.ellipse(x, y, w, h, base(o))),
    path: (d, o) => add(gen.path(d, base(o))),
    poly: (pts, o) => add(gen.polygon(pts, base(o))),
    lines: (pts, o) => add(gen.linearPath(pts, base(o))),
    curve: (pts, o) => add(gen.curve(pts, base(o))),
    raw: (svg) => out.push(svg),
    dot: (x, y, r, fill) => out.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`),
  };
  draw(t);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="208" height="148" viewBox="0 0 208 148">${out.join('')}</svg>`;
}

const battery = (t, x, y, L = 70, h = 30) => {
  t.rect(x, y, L, h, { fill: C.ink, roughness: 0.5 });
  t.rect(x + L * 0.7, y, L * 0.3, h, { fill: C.accent, roughness: 0.5 });
  t.rect(x + L, y + h * 0.3, 6, h * 0.4, { fill: '#c7c9cf', strokeWidth: 1.5, roughness: 0.3 });
};
const bulbT = (t, x, y, r = 26, lit = true) => {
  if (lit) t.raw(`<circle cx="${x}" cy="${y}" r="${r * 1.9}" fill="${C.yellow}" opacity="0.18"/>`);
  t.circle(x, y, r * 2, { fill: lit ? C.yellowSoft : '#fff' });
  t.path(`M${x - r * 0.3} ${y} q4 -7 8 0 q4 -7 8 0`, { strokeWidth: 2, stroke: lit ? C.accent : C.ink, roughness: 0.3 });
  t.rect(x - r * 0.42, y + r * 0.9, r * 0.84, r * 0.7, { fill: '#c7c9cf', fillStyle: 'hachure', hachureGap: 4, strokeWidth: 1.8 });
};
const resT = (t, x, y, L, bands) => {
  t.line(x - 26, y, x + L + 26, y, { stroke: '#8e9097', strokeWidth: 3 });
  t.rect(x, y - 14, L, 28, { fill: '#ead7b0', roughness: 0.6 });
  const xs = [0.18, 0.34, 0.5, 0.8];
  bands.forEach((b, i) => t.rect(x + L * xs[i] - 4, y - 13, 8, 26, { fill: b, stroke: 'none', roughness: 0.2 }));
};
const ledT = (t, x, y, col, lit = true) => {
  if (lit) t.raw(`<circle cx="${x}" cy="${y}" r="40" fill="${col}" opacity="0.16"/>`);
  t.line(x - 7, y + 20, x - 7, y + 64, { stroke: '#8e9097', strokeWidth: 3 });
  t.line(x + 7, y + 20, x + 7, y + 54, { stroke: '#8e9097', strokeWidth: 3 });
  t.path(`M${x - 15} ${y + 18} L${x - 15} ${y - 4} A15 15 0 0 1 ${x + 15} ${y - 4} L${x + 15} ${y + 18} Z`, { fill: col, roughness: 0.6 });
  t.rect(x - 18, y + 16, 34, 7, { fill: col, strokeWidth: 1.8, roughness: 0.4 });
};
const chipT = (t, x, y, w, h, fill = '#2a2b31') => {
  for (let i = 0; i < 5; i++) {
    const k = x + (w * (i + 0.5)) / 5;
    t.line(k, y - 10, k, y, { stroke: '#9a9ca3', strokeWidth: 3, roughness: 0.3 });
    t.line(k, y + h, k, y + h + 10, { stroke: '#9a9ca3', strokeWidth: 3, roughness: 0.3 });
  }
  t.rect(x, y, w, h, { fill, roughness: 0.5 });
};
const wavesT = (t, x, y, n, col, dir = 1, spread = 0.55) => {
  for (let i = 1; i <= n; i++) {
    const r = i * 16;
    const a0 = dir > 0 ? -spread : Math.PI - spread, a1 = dir > 0 ? spread : Math.PI + spread;
    t.path(`M${x + Math.cos(a0) * r} ${y + Math.sin(a0) * r} A${r} ${r} 0 0 1 ${x + Math.cos(a1) * r} ${y + Math.sin(a1) * r}`, { stroke: col, strokeWidth: 3, roughness: 0.5 });
  }
};

const T = {
  'basics-electricity': (t) => {
    t.circle(104, 74, 120, { stroke: C.line2, strokeWidth: 2, fill: 'none' });
    t.circle(104, 74, 64, { stroke: C.line2, strokeWidth: 2, fill: 'none' });
    t.circle(104, 74, 30, { fill: C.accentSoft, stroke: C.accent });
    t.dot(164, 74, 8, C.blue); t.dot(72, 47, 8, C.blue); t.dot(60, 110, 8, C.blue); t.dot(136, 74, 7, C.blue);
  },
  'basics-vir': (t) => { battery(t, 26, 104, 64, 26); t.lines([[96, 117], [182, 117], [182, 40], [26, 40], [26, 104]], { strokeWidth: 3, roughness: 0.6 }); resT(t, 82, 40, 50, ['#d8262a', '#d8262a', '#7a4a24', '#c9a227']); for (const x of [40, 182]) t.dot(x === 40 ? 26 : 182, 76, 6, C.blue); },
  'basics-ohm': (t) => {
    t.poly([[104, 18], [176, 130], [32, 130]], { fill: C.accentSoft, stroke: C.accent, strokeWidth: 3 });
    t.line(58, 90, 150, 90, { stroke: C.accent, strokeWidth: 2.4 });
    t.line(104, 92, 104, 128, { stroke: C.accent, strokeWidth: 2.4 });
    t.circle(104, 64, 14, { fill: C.ink, stroke: 'none' }); t.circle(78, 110, 14, { fill: C.blue, stroke: 'none' }); t.circle(130, 110, 14, { fill: C.ink2, stroke: 'none' });
  },
  'basics-switch': (t) => {
    t.lines([[30, 110], [30, 40], [178, 40], [178, 110], [126, 110]], { strokeWidth: 3, roughness: 0.6 });
    t.line(30, 110, 74, 110, { strokeWidth: 3 }); t.circle(78, 110, 10, { fill: '#fff' }); t.circle(122, 110, 10, { fill: '#fff' });
    t.line(78, 110, 122, 84, { strokeWidth: 5, roughness: 0.4 }); t.circle(108, 90, 14, { fill: C.accent, strokeWidth: 1.6 });
  },
  'basics-series-parallel': (t) => { bulbT(t, 60, 58, 22, true); bulbT(t, 146, 58, 22, true); t.lines([[30, 120], [178, 120]], { strokeWidth: 3 }); t.line(54, 96, 54, 120, { strokeWidth: 2.5 }); t.line(140, 96, 140, 120, { strokeWidth: 2.5 }); },
  'basics-battery': (t) => { battery(t, 34, 30, 120, 44); battery(t, 50, 88, 90, 34); },
  'basics-resistor': (t) => resT(t, 48, 74, 112, ['#d8262a', '#d8262a', '#7a4a24', '#c9a227']),
  'basics-led': (t) => { ledT(t, 70, 42, C.accent); ledT(t, 140, 42, C.blue, false); },
  'basics-capacitor': (t) => {
    t.line(30, 120, 186, 120, { strokeWidth: 2, stroke: C.muted }); t.line(30, 120, 30, 20, { strokeWidth: 2, stroke: C.muted });
    t.raw(`<path d="M30 120 C 60 50, 100 32, 186 28" fill="none" stroke="${C.accent}" stroke-width="4" stroke-linecap="round"/>`);
    t.rect(132, 66, 16, 44, { fill: C.blueSoft }); t.rect(152, 66, 16, 44, { fill: C.blueSoft });
  },
  'basics-transistor': (t) => {
    t.path('M74 40 L134 40 L134 92 A30 30 0 0 1 74 92 Z', { fill: '#2a2b31', roughness: 0.6 });
    for (const x of [84, 104, 124]) t.line(x, 108, x, 140, { stroke: '#9a9ca3', strokeWidth: 3.5 });
    t.raw(`<path d="M150 30 l12 -14 M162 16 l-2 10 M162 16 l-10 3" stroke="${C.yellow}" stroke-width="3" fill="none"/>`);
  },
  'basics-pot': (t) => {
    t.path('M50 112 A58 58 0 1 1 158 112', { stroke: C.ink, strokeWidth: 10, roughness: 0.6 });
    t.path('M50 112 A58 58 0 0 1 104 32', { stroke: C.accent, strokeWidth: 10, roughness: 0.6 });
    t.circle(104, 86, 46, { fill: '#fff' }); t.line(104, 86, 104, 44, { strokeWidth: 4, stroke: C.accent });
  },
  'basics-magnet': (t) => {
    t.path('M40 40 L40 110 A40 40 0 0 0 120 110 L120 40 L96 40 L96 110 A16 16 0 0 1 64 110 L64 40 Z', { fill: C.accentSoft, stroke: C.ink });
    t.rect(40, 30, 24, 22, { fill: C.accent }); t.rect(96, 30, 24, 22, { fill: C.blue });
    for (let i = 0; i < 4; i++) t.ellipse(160, 50 + i * 14, 34, 12, { stroke: C.copper, strokeWidth: 3, fill: 'none' });
  },
  'basics-breadboard': (t) => {
    t.rect(18, 22, 172, 104, { fill: '#f4f3ef', roughness: 0.6 });
    t.line(18, 74, 190, 74, { stroke: C.line2, strokeWidth: 6 });
    for (let c = 0; c < 12; c++) for (let r = 0; r < 4; r++) t.dot(34 + c * 13.5, (r < 2 ? 44 : 88) + (r % 2) * 14, 3, c === 4 ? C.accent : '#55565c');
    t.raw(`<rect x="84" y="36" width="8" height="64" rx="4" fill="${C.accent}" opacity="0.25"/>`);
  },
  'basics-multimeter': (t) => {
    t.rect(58, 14, 92, 124, { fill: C.yellow, roughness: 0.6 });
    t.rect(70, 26, 68, 30, { fill: '#dfe7d6', strokeWidth: 2 }); t.circle(104, 98, 40, { fill: '#2a2b31' }); t.line(104, 98, 118, 84, { stroke: '#fff', strokeWidth: 3 });
    t.line(150, 120, 196, 136, { stroke: C.accent, strokeWidth: 4 }); t.line(58, 120, 12, 136, { stroke: C.ink, strokeWidth: 4 });
  },
  'basics-solder': (t) => {
    t.rect(20, 104, 168, 18, { fill: '#2e8b57', roughness: 0.5 });
    t.path('M96 104 L104 84 L112 104 Z', { fill: '#c7c9cf' });
    t.line(104, 70, 104, 122, { stroke: '#8e9097', strokeWidth: 3 });
    t.line(150, 20, 112, 84, { stroke: '#8e9097', strokeWidth: 6 }); t.line(176, 0, 150, 34, { stroke: C.ink, strokeWidth: 14 });
    t.curve([[40, 30], [60, 60], [92, 92]], { stroke: '#b9bcc2', strokeWidth: 4 });
  },
  // sensing
  'sense-ultrasonic': (t) => { t.circle(40, 52, 34, { fill: '#c7c9cf' }); t.circle(40, 96, 34, { fill: '#c7c9cf' }); t.rect(14, 30, 20, 88, { fill: C.blue, roughness: 0.4 }); wavesT(t, 60, 74, 4, C.iris); t.rect(176, 20, 16, 108, { fill: C.subtle2, fillStyle: 'hachure', hachureGap: 5 }); },
  'sense-infrared': (t) => { ledT(t, 46, 30, C.ink2, false); wavesT(t, 70, 50, 3, C.accent); t.rect(150, 14, 34, 120, { fill: '#2a2b31' }); t.circle(167, 36, 12, { fill: C.accent }); },
  'sense-pir': (t) => { t.path('M54 100 A50 50 0 0 1 154 100 Z', { fill: '#f4f3ef' }); for (let i = 0; i < 4; i++) t.line(64 + i * 26, 100, 84 + i * 16, 60, { stroke: C.line2, strokeWidth: 2 }); t.rect(44, 100, 120, 24, { fill: '#2e8b57' }); t.raw(`<circle cx="104" cy="70" r="44" fill="${C.accent}" opacity="0.12"/>`); },
  'sense-radar': (t) => { t.circle(104, 80, 120, { fill: '#f4f3ef', stroke: C.green }); t.circle(104, 80, 64, { stroke: C.green, fill: 'none', strokeWidth: 1.5 }); t.raw(`<path d="M104 80 L164 80 A60 60 0 0 0 146 37 Z" fill="${C.green}" opacity="0.25"/>`); t.line(104, 80, 164, 80, { stroke: C.green, strokeWidth: 3 }); t.dot(140, 52, 5, C.accent); },
  'sense-lidar': (t) => { for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2, r = 44 + 14 * Math.sin(a * 3); t.dot(104 + Math.cos(a) * r * 1.4, 74 + Math.sin(a) * r, 3, C.accent); } t.circle(104, 74, 30, { fill: '#2a2b31' }); t.line(104, 74, 168, 50, { stroke: C.accent, strokeWidth: 2 }); },
  'sense-camera': (t) => { const cs = [C.accent, C.green, C.green, C.blue]; for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) t.rect(42 + c * 21, 32 + r * 21, 20, 20, { fill: cs[(r % 2) * 2 + (c % 2)], strokeWidth: 1.2, roughness: 0.4 }); },
  'sense-imu': (t) => { t.rect(24, 24, 160, 100, { fill: '#f4f3ef' }); t.rect(74, 54, 60, 40, { fill: C.accentSoft, stroke: C.accent }); t.path('M24 74 l10 -8 10 16 10 -16 10 16 10 -8', { stroke: C.ink2, strokeWidth: 2 }); t.path('M134 74 l10 -8 10 16 10 -16 10 16 10 -8', { stroke: C.ink2, strokeWidth: 2 }); },
  'sense-temp-light': (t) => { t.raw(`<path d="M30 30 C 60 100, 100 118, 180 124" fill="none" stroke="${C.accent}" stroke-width="4"/>`); t.line(30, 126, 186, 126, { stroke: C.muted, strokeWidth: 2 }); t.line(30, 126, 30, 18, { stroke: C.muted, strokeWidth: 2 }); t.circle(150, 50, 40, { fill: '#e6b85c' }); t.path('M136 50 q7 -12 14 0 q7 12 14 0', { stroke: '#7a4a24', strokeWidth: 3 }); },
  'sense-gps': (t) => { t.circle(104, 150, 220, { fill: C.blueSoft, stroke: C.blue }); t.rect(20, 14, 28, 16, { fill: '#c7c9cf' }); t.rect(160, 22, 28, 16, { fill: '#c7c9cf' }); t.rect(92, 4, 28, 16, { fill: '#c7c9cf' }); t.raw(`<g fill="none" stroke="${C.iris}" stroke-width="2" stroke-dasharray="4 5"><path d="M34 30 L104 100"/><path d="M174 38 L104 100"/><path d="M106 20 L104 100"/></g>`); t.dot(104, 100, 7, C.accent); },
  // computing
  'cpu-binary': (t) => { [1, 0, 1, 1, 0].forEach((b, i) => { t.rect(20 + i * 36, 44, 26, 60, { fill: '#fff' }); t.rect(24 + i * 36, b ? 48 : 74, 18, 26, { fill: b ? C.accent : C.line2, roughness: 0.4 }); }); },
  'cpu-gates': (t) => { t.path('M60 34 L104 34 A40 40 0 0 1 104 114 L60 114 Z', { fill: C.irisSoft, stroke: C.iris, strokeWidth: 3 }); t.line(20, 56, 60, 56, { strokeWidth: 3 }); t.line(20, 92, 60, 92, { strokeWidth: 3 }); t.line(144, 74, 190, 74, { strokeWidth: 3, stroke: C.accent }); },
  'cpu-adder': (t) => { for (let i = 0; i < 4; i++) t.rect(20 + i * 44, 46, 36, 56, { fill: i === 1 ? C.accentSoft : '#fff', stroke: i === 1 ? C.accent : C.ink }); t.path('M160 36 C 150 14, 130 14, 124 36', { stroke: C.iris, strokeWidth: 3 }); t.path('M116 36 C 106 14, 86 14, 80 36', { stroke: C.iris, strokeWidth: 3 }); },
  'cpu-memory': (t) => { for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) t.rect(28 + c * 19, 18 + r * 23, 16, 18, { fill: (r * 3 + c * 5) % 7 < 3 ? C.iris : '#fff', strokeWidth: 1.4, roughness: 0.4 }); },
  'cpu-clock': (t) => { t.lines([[14, 100], [44, 100], [44, 48], [84, 48], [84, 100], [124, 100], [124, 48], [164, 48], [164, 100], [194, 100]], { stroke: C.accent, strokeWidth: 4, roughness: 0.5 }); },
  'cpu-fetch': (t) => { chipT(t, 30, 30, 70, 88, '#2a2b31'); t.rect(126, 22, 60, 104, { fill: '#fff' }); for (let i = 0; i < 5; i++) t.line(134, 38 + i * 19, 178, 38 + i * 19, { stroke: i === 2 ? C.accent : C.line2, strokeWidth: 6 }); t.line(100, 74, 126, 74, { stroke: C.iris, strokeWidth: 3 }); },
  'cpu-mcu-mpu': (t) => { chipT(t, 22, 50, 54, 54, '#2a2b31'); chipT(t, 104, 26, 84, 84, '#3a3c44'); t.rect(124, 46, 44, 44, { fill: '#c7c9cf', strokeWidth: 1.5 }); },
  'cpu-x86-arm': (t) => { chipT(t, 18, 36, 78, 78, '#3a3c44'); chipT(t, 116, 36, 78, 78, '#2a2b31'); t.rect(130, 50, 22, 22, { fill: C.accent, strokeWidth: 1.4 }); t.rect(158, 50, 22, 22, { fill: C.accent, strokeWidth: 1.4 }); t.rect(130, 78, 14, 14, { fill: C.iris, strokeWidth: 1.2 }); t.rect(148, 78, 14, 14, { fill: C.iris, strokeWidth: 1.2 }); t.rect(166, 78, 14, 14, { fill: C.iris, strokeWidth: 1.2 }); },
  'cpu-gpu': (t) => { for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) t.rect(22 + c * 17, 22 + r * 18, 13, 13, { fill: (r + c) % 3 ? C.green : C.greenSoft, stroke: 'none', roughness: 0.3 }); },
  'cpu-ai-chip': (t) => { const L = [[40, [40, 74, 108]], [104, [28, 58, 90, 120]], [168, [56, 92]]]; for (let a = 0; a < 2; a++) for (const y1 of L[a][1]) for (const y2 of L[a + 1][1]) t.line(L[a][0], y1, L[a + 1][0], y2, { stroke: (y1 + y2) % 3 ? C.accent : C.iris, strokeWidth: 1.5, roughness: 0.4 }); for (const [x, ys] of L) for (const y of ys) t.circle(x, y, 20, { fill: '#fff' }); },
};

export function thumb(id) {
  const f = T[id];
  if (!f) return sketch((t) => t.circle(104, 74, 80, { fill: C.accentSoft }));
  return sketch(f, id.length);
}
