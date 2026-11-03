// Brand colours for explainers, resolved from src/brand/tokens.css at runtime
// (rough.js and data-URI thumbnails need real colour values, not var()).
const FALLBACK = {
  ink: '#0c0c0e', ink2: '#44454c', muted: '#85868d', line: '#e8e6e1', line2: '#d4d1c9', subtle: '#f7f7f5', subtle2: '#f0efeb',
  accent: '#e5132d', accentInk: '#b80d22', accentSoft: '#fdecee', iris: '#5b3df5', irisInk: '#4527d9', irisSoft: '#efecff',
  blue: '#2456f5', green: '#12915a', red: '#e5132d', yellow: '#f2b10a', bg: '#ffffff',
};
const VARS = {
  ink: '--tl-ink', ink2: '--tl-ink-2', muted: '--tl-muted', line: '--tl-line', line2: '--tl-line-2', subtle: '--tl-subtle', subtle2: '--tl-subtle-2',
  accent: '--tl-accent', accentInk: '--tl-accent-ink', accentSoft: '--tl-accent-soft', iris: '--tl-iris', irisInk: '--tl-iris-ink', irisSoft: '--tl-iris-soft',
  blue: '--tl-blue', green: '--tl-green', red: '--tl-red', yellow: '--tl-yellow', bg: '--tl-bg',
};

/** Brand colours resolved from src/brand/tokens.css (rough.js and data-URI thumbnails need real values). */
export function tokens() {
  const out = { ...FALLBACK };
  try {
    const cs = getComputedStyle(document.documentElement);
    for (const [k, v] of Object.entries(VARS)) {
      const val = cs.getPropertyValue(v).trim();
      if (val) out[k] = val;
    }
  } catch { /* no DOM: keep fallbacks */ }
  // soft tints used for fills (mixed with white so they stay light on white)
  out.blueSoft = mix(out.blue, '#ffffff', 0.86);
  out.greenSoft = mix(out.green, '#ffffff', 0.85);
  out.yellowSoft = mix(out.yellow, '#ffffff', 0.78);
  out.redSoft = out.accentSoft;
  out.copper = '#c87533'; // the colour of copper itself (wires, coils): a material, not a brand colour
  out.copperSoft = mix(out.copper, '#ffffff', 0.78);
  return out;
}

export function mix(a, b, t) {
  const p = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  try {
    const A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  } catch { return a; }
}

