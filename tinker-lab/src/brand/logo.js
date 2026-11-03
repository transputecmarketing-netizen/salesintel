// The Tinker Lab marks, as inline SVG strings.
//
// The emblem is a crest. Inside it, one continuous circuit trace draws the letters
// T and L: the T's bar ends in two solder pads, its stem runs down and turns into
// the L's foot, and the foot ends in a lit LED, the spark. The wordmark sets the
// name in Newsreader Light over a trace that runs from the T to the b and ends in
// a pad: from the first tinker to the lab.

const CREST = 'M32 3.5c10.6 0 19.6 1.9 25.5 5.4v24.6c0 16.8-10.6 28.6-25.5 34.4C17.1 62.1 6.5 50.3 6.5 33.5V8.9C12.4 5.4 21.4 3.5 32 3.5z';

/** The emblem. opts: { size, ink, accent, plate, title } */
export function markSVG({ size = 40, ink = 'currentColor', accent = 'var(--tl-accent, #ff5a1f)', plate = 'none', title = 'Tinker Lab' } = {}) {
  return `<svg class="tl-mark" width="${size}" height="${Math.round(size * 72 / 64)}" viewBox="0 0 64 72" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg">
  <title>${title}</title>
  <path d="${CREST}" fill="${plate}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M20 22.5h24" fill="none" stroke="${ink}" stroke-width="4.4" stroke-linecap="round"/>
  <circle cx="17.2" cy="22.5" r="3.4" fill="${plate === 'none' ? 'var(--tl-bg, #fff)' : plate}" stroke="${ink}" stroke-width="2.6"/>
  <circle cx="46.8" cy="22.5" r="3.4" fill="${plate === 'none' ? 'var(--tl-bg, #fff)' : plate}" stroke="${ink}" stroke-width="2.6"/>
  <path d="M32 22.5v20.5a6.5 6.5 0 0 0 6.5 6.5h3.2" fill="none" stroke="${ink}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="46.2" cy="49.5" r="7.6" fill="${accent}" opacity="0.16"/>
  <circle cx="46.2" cy="49.5" r="4.3" fill="${accent}"/>
</svg>`;
}

/** The wordmark with its spark trace. opts: { height, ink, accent } */
export function wordmarkSVG({ height = 34, ink = 'currentColor', accent = 'var(--tl-accent, #ff5a1f)' } = {}) {
  const w = Math.round(height * 236 / 52);
  return `<svg class="tl-wordmark" width="${w}" height="${height}" viewBox="0 0 236 52" role="img" aria-label="Tinker Lab" xmlns="http://www.w3.org/2000/svg">
  <title>Tinker Lab</title>
  <text x="2" y="33" fill="${ink}" font-family="Newsreader, Georgia, serif" font-weight="300" font-size="38" letter-spacing="-0.4">Tinker Lab</text>
  <path d="M9 42.5c40 7 120 8.5 205-2.2" fill="none" stroke="${accent}" stroke-width="2.6" stroke-linecap="round"/>
  <circle cx="9" cy="42.5" r="2.6" fill="var(--tl-bg, #fff)" stroke="${accent}" stroke-width="2"/>
  <circle cx="216" cy="40.1" r="3.3" fill="${accent}"/>
</svg>`;
}

/** Emblem + wordmark side by side. */
export function lockupSVG({ height = 40, ink = 'currentColor' } = {}) {
  return `<span class="tl-lockup" style="display:inline-flex;align-items:center;gap:${Math.round(height * 0.28)}px;color:${ink}">${markSVG({ size: Math.round(height * 0.9), ink })}${wordmarkSVG({ height: Math.round(height * 0.86), ink })}</span>`;
}
