// Regenerates public/favicon.ico, favicon-32.png, apple-touch-icon.png, icon-192/512.png and og-image.png
// from the logo and the colours in src/brand/tokens.css. Run after a brand change: node scripts/gen-icons.cjs
// Generates favicons, app icons and the social image for Tinker Lab from the brand SVGs.
// Colours are read from src/brand/tokens.css so nothing is hard-coded here.
// Run: NODE_PATH=/opt/node22/lib/node_modules node gen-icons.cjs
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public');
const TMP = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'tl-icons-'));
const css = fs.readFileSync(path.join(ROOT, 'src/brand/tokens.css'), 'utf8');
const tok = (name) => {
  const m = css.match(new RegExp(`--tl-${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`token ${name} missing`);
  return m[1].trim();
};
const C = { bg: tok('bg'), ink: tok('ink'), ink2: tok('ink-2'), muted: tok('muted'), accent: tok('accent'), accentInk: tok('accent-ink'), iris: tok('iris'), irisInk: tok('iris-ink'), trace: tok('trace'), line: tok('line') };

const CREST = 'M32 3.5c10.6 0 19.6 1.9 25.5 5.4v24.6c0 16.8-10.6 28.6-25.5 34.4C17.1 62.1 6.5 50.3 6.5 33.5V8.9C12.4 5.4 21.4 3.5 32 3.5z';
// the emblem as in src/brand/logo.js / public/favicon.svg; `bold` thickens strokes for tiny sizes
const mark = ({ w, h, bold = 0, glow = true }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 72" width="${w}" height="${h}">
  <path d="${CREST}" fill="${C.bg}" stroke="${C.ink}" stroke-width="${3.4 + bold}" stroke-linejoin="round"/>
  <path d="M20 22.5h24" fill="none" stroke="${C.ink}" stroke-width="${4.6 + bold}" stroke-linecap="round"/>
  <circle cx="17.2" cy="22.5" r="3.4" fill="${C.bg}" stroke="${C.ink}" stroke-width="${2.8 + bold * 0.6}"/>
  <circle cx="46.8" cy="22.5" r="3.4" fill="${C.bg}" stroke="${C.ink}" stroke-width="${2.8 + bold * 0.6}"/>
  <path d="M32 22.5v20.5a6.5 6.5 0 0 0 6.5 6.5h3.2" fill="none" stroke="${C.ink}" stroke-width="${4.6 + bold}" stroke-linecap="round" stroke-linejoin="round"/>
  ${glow ? `<circle cx="46.2" cy="49.5" r="7.6" fill="${C.accent}" opacity="0.16"/>` : ''}
  <circle cx="46.2" cy="49.5" r="${4.6 + bold * 0.4}" fill="${C.accent}"/>
</svg>`;

const fontFace = (w) => `@font-face{font-family:Newsreader;font-weight:${w};src:url(file://${ROOT}/node_modules/@fontsource/newsreader/files/newsreader-latin-${w}-normal.woff2) format('woff2')}`;
const monoFace = `@font-face{font-family:Plex;font-weight:400;src:url(file://${ROOT}/node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2) format('woff2')}`;

/** A faint circuit-trace field: orthogonal runs with 45° jogs, ending in pads. Deterministic. */
function traces(W, H) {
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const G = 30;
  const out = [];
  for (let i = 0; i < 34; i++) {
    let x = Math.round((W * 0.34 + rnd() * W * 0.7) / G) * G;
    let y = Math.round((rnd() * H) / G) * G;
    const pts = [[x, y]];
    let dir = rnd() < 0.5 ? 0 : 1; // 0 horizontal, 1 vertical
    const segs = 2 + Math.floor(rnd() * 3);
    for (let k = 0; k < segs; k++) {
      const len = G * (2 + Math.floor(rnd() * 6));
      const sg = rnd() < 0.5 ? -1 : 1;
      if (dir === 0) x += sg * len; else y += sg * len;
      pts.push([x, y]);
      // 45° jog
      const j = G * (1 + Math.floor(rnd() * 2));
      const s2 = rnd() < 0.5 ? -1 : 1;
      x += sg * j * (dir === 0 ? 1 : s2);
      y += sg * j * (dir === 0 ? s2 : 1);
      pts.push([x, y]);
      dir = 1 - dir;
    }
    const d = 'M' + pts.map((p) => p.join(' ')).join('L');
    const [ex, ey] = pts[pts.length - 1];
    const [sx, sy] = pts[0];
    out.push(`<path d="${d}" />`, `<circle class="pad" cx="${sx}" cy="${sy}" r="6"/>`, `<circle class="pad" cx="${ex}" cy="${ey}" r="6"/>`);
  }
  return out.join('');
}

function ogHTML() {
  const W = 1200, H = 630;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFace(300)}${fontFace(400)}${monoFace}
html,body{margin:0;width:${W}px;height:${H}px;background:${C.bg};overflow:hidden}
.field{position:absolute;inset:0;-webkit-mask-image:linear-gradient(90deg,transparent 30%,#000 62%);mask-image:linear-gradient(90deg,transparent 30%,#000 62%)}
.field path{fill:none;stroke:${C.trace};stroke-width:3;stroke-linejoin:round;stroke-linecap:round}
.field .pad{fill:${C.bg};stroke:${C.trace};stroke-width:3}
.copy{position:absolute;left:96px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center}
.row{display:flex;align-items:center;gap:34px}
.name{font:300 124px/1 Newsreader;letter-spacing:-0.02em;color:${C.ink};position:relative;padding-bottom:30px}
.name svg{position:absolute;left:4px;bottom:0}
.promise{margin:44px 0 0;font:300 46px/1.2 Newsreader;color:${C.ink2};letter-spacing:-0.01em}
.tag{margin:0 0 36px;font:400 22px/1 Plex;letter-spacing:.04em;color:${C.accentInk}}
</style></head><body>
<svg class="field" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${traces(W, H)}</svg>
<div class="copy">
  <p class="tag">THE VIRTUAL MAKER SPACE</p>
  <div class="row">${mark({ w: 150, h: 169 })}
    <div class="name">Tinker Lab<svg width="560" height="26" viewBox="0 0 560 26"><path d="M10 9c95 13 285 16 486-4" fill="none" stroke="${C.iris}" stroke-width="5" stroke-linecap="round"/><circle cx="10" cy="9" r="6" fill="${C.bg}" stroke="${C.iris}" stroke-width="4"/><circle cx="500" cy="5" r="0" /><circle cx="503" cy="5" r="7.5" fill="${C.accent}"/></svg></div>
  </div>
  <p class="promise">Learn how things work. Then build them.</p>
</div>
</body></html>`;
}

const iconHTML = (size, scale, bg, bold = 0, glow = true) => {
  const h = Math.round(size * scale);
  const w = Math.round((h * 64) / 72);
  return `<!doctype html><html><head><style>html,body{margin:0;width:${size}px;height:${size}px;background:${bg};overflow:hidden;display:grid;place-items:center}</style></head><body>${mark({ w, h, bold, glow })}</body></html>`;
};

/** PNG-in-ICO container (Vista+ and every current browser read it). */
function ico(pngs) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let off = 6 + dir.length;
  pngs.forEach(({ size, buf }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o); dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2); dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(buf.length, o + 8); dir.writeUInt32LE(off, o + 12);
    off += buf.length;
  });
  return Buffer.concat([head, dir, ...pngs.map((p) => p.buf)]);
}

(async () => {
  const b = await chromium.launch();
  const shot = async (html, w, h, file, transparent = false) => {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const f = path.join(TMP, `_gen_${w}x${h}.html`);
    fs.writeFileSync(f, html);
    await p.goto('file://' + f);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(150);
    const buf = await p.screenshot({ type: 'png', omitBackground: transparent });
    await p.close();
    if (file) fs.writeFileSync(path.join(OUT, file), buf);
    return buf;
  };
  // favicon sizes: transparent background, crest fills the square; slightly bolder strokes when tiny
  const fav = [];
  for (const [s, bold] of [[16, 1.6], [32, 0.8], [48, 0.4]]) {
    fav.push({ size: s, buf: await shot(iconHTML(s, 0.98, 'transparent', bold, false), s, s, null, true) });
  }
  fs.writeFileSync(path.join(OUT, 'favicon.ico'), ico(fav));
  fs.writeFileSync(path.join(OUT, 'favicon-32.png'), fav[1].buf);
  await shot(iconHTML(180, 0.7, C.bg), 180, 180, 'apple-touch-icon.png');
  await shot(iconHTML(192, 0.6, C.bg), 192, 192, 'icon-192.png');
  await shot(iconHTML(512, 0.6, C.bg), 512, 512, 'icon-512.png');
  await shot(ogHTML(), 1200, 630, 'og-image.png');
  await b.close();
  for (const f of fs.readdirSync(TMP)) if (f.startsWith('_gen_')) fs.unlinkSync(path.join(TMP, f));
  console.log('done', C);
})();
