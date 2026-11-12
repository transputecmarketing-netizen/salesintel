#!/usr/bin/env node
// Export hairline isometric line figures as transparent PNG (and optional SVG) in any palette.
//
//   node export_figures.js [names...|all] [--palette crises-control] [--theme dark,light]
//        [--width 2400] [--out out/figures] [--svg] [--trim] [--pad 24]
//        [--intensity 0.7] [--t 1.2] [--rest] [--bg none|#hex]
//
// Output: <out>/<palette>/<theme>/<name>.png (and .svg). Default width 2400 px (5:4 frame, 2400x1920).
// --trim crops to the drawing plus --pad px (at output scale). --rest captures the rest pose instead of the
// mid-animation pose (the default, which shows each figure "doing" its thing, e.g. the padlock open).
const { chromium } = require('playwright');
const path = require('path'), http = require('http'), fs = require('fs');
const HERE = __dirname;

const ALL = ['basket', 'branches', 'cabinet', 'dish', 'drawer', 'elevator', 'exploded', 'format', 'hub', 'keyboard',
  'laptop', 'lockers', 'loupe', 'padlock', 'patch', 'phone', 'phosphor', 'plot', 'plug', 'query', 'rail', 'rebuild',
  'relay', 'riffle', 'router', 'settle', 'sieve', 'slow', 'stack', 'terminal', 'terrain', 'turntable', 'vault'];

function args(argv) {
  const o = { names: [], palette: 'crises-control', theme: 'dark,light', width: 2400, out: 'out/figures', svg: false,
    trim: false, pad: 24, intensity: 0.7, t: 1.2, rest: false, bg: 'none', palettes: path.join(HERE, 'palettes.json') };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { o.names.push(a); continue; }
    const k = a.slice(2);
    if (['svg', 'trim', 'rest'].includes(k)) o[k] = true;
    else o[k] = argv[++i];
  }
  if (!o.names.length || o.names.includes('all')) o.names = ALL;
  const bad = o.names.filter(n => !ALL.includes(n));
  if (bad.length) { console.error('Unknown figure(s): ' + bad.join(', ') + '\nKnown: ' + ALL.join(' ')); process.exit(2); }
  o.width = +o.width; o.pad = +o.pad;
  return o;
}

function cssVars(p) {
  return ['plate', 'hi', 'edge', 'mid', 'lo'].map(k => `--hairline-${k}:${p[k]};`).join('') + `--hairline-stroke:${p.stroke ?? 1.4};`;
}

const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };

(async () => {
  const o = args(process.argv.slice(2));
  const pals = JSON.parse(fs.readFileSync(o.palettes, 'utf8'));
  const pal = pals[o.palette];
  if (!pal) { console.error(`No palette "${o.palette}" in ${o.palettes}. Have: ${Object.keys(pals).filter(k => k[0] !== '_').join(', ')}`); process.exit(2); }
  const themes = o.theme.split(',');

  const srv = http.createServer((q, r) => {
    const f = path.join(HERE, decodeURIComponent(q.url.split('?')[0]));
    if (!f.startsWith(HERE)) { r.writeHead(403); r.end(); return; }
    fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'text/plain' }); r.end(d); });
  });
  await new Promise(res => srv.listen(0, res));
  const port = srv.address().port;

  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 640 }, deviceScaleFactor: o.width / 800 });
  p.on('pageerror', e => console.error('page error:', e.message));
  let n = 0;
  for (const th of themes) {
    const colours = pal.figures[th];
    if (!colours) { console.error(`palette ${o.palette} has no figures.${th}`); continue; }
    const dir = path.resolve(o.out, o.palette, th); fs.mkdirSync(dir, { recursive: true });
    for (const name of o.names) {
      await p.goto(`http://localhost:${port}/fig.html?n=${name}&th=${th}&i=${o.intensity}&t=${o.t}${o.rest ? '&rest=1' : ''}`);
      await p.waitForFunction('window.__done === true');
      const err = await p.evaluate('window.__err'); if (err) { console.error(err); continue; }
      const bg = o.bg === 'none' ? 'transparent' : o.bg;
      await p.addStyleTag({ content: `#f{${cssVars(colours)}} html,body{background:${bg}!important}` });
      await p.waitForTimeout(350); // colour transitions in the package run 260 ms
      let clip;
      if (o.trim) {
        const r = await p.evaluate(() => {
          let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
          document.querySelectorAll('#f svg path, #f svg polygon, #f svg ellipse, #f svg line, #f svg circle, #f svg rect').forEach(el => {
            const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return;
            const b = el.getBoundingClientRect(); if (!b.width && !b.height) return;
            x0 = Math.min(x0, b.left); y0 = Math.min(y0, b.top); x1 = Math.max(x1, b.right); y1 = Math.max(y1, b.bottom);
          });
          return { x0, y0, x1, y1 };
        });
        const pad = o.pad * 800 / o.width;
        const x = Math.max(0, r.x0 - pad), y = Math.max(0, r.y0 - pad);
        clip = { x, y, width: Math.min(800, r.x1 + pad) - x, height: Math.min(640, r.y1 + pad) - y };
      }
      const file = path.join(dir, name + '.png');
      if (clip) await p.screenshot({ path: file, clip, omitBackground: o.bg === 'none' });
      else await p.locator('#f').screenshot({ path: file, omitBackground: o.bg === 'none' });
      if (o.svg) {
        const svg = await p.evaluate(() => {
          // Bake computed colours into attributes so the SVG stands alone (no package CSS needed).
          const src = document.querySelector('#f svg'); const out = src.cloneNode(true);
          const a = src.querySelectorAll('*'), c = out.querySelectorAll('*');
          a.forEach((el, i) => {
            const cs = getComputedStyle(el), d = c[i];
            if (cs.display === 'none') { d.remove(); return; }
            d.removeAttribute('class'); d.removeAttribute('style');
            if (!['path', 'polygon', 'polyline', 'ellipse', 'line', 'circle', 'rect'].includes(el.tagName)) return;
            for (const k of ['fill', 'stroke', 'stroke-width', 'stroke-linejoin', 'stroke-linecap', 'stroke-dasharray', 'opacity', 'fill-opacity', 'stroke-opacity', 'vector-effect'])
              { const v = cs.getPropertyValue(k); if (v && v !== 'normal' && v !== 'none' || k === 'fill' || k === 'stroke') d.setAttribute(k, v); }
          });
          out.querySelectorAll('style,title,desc').forEach(e => e.remove());
          out.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          const r = src.getBoundingClientRect(); out.setAttribute('width', r.width); out.setAttribute('height', r.height);
          out.removeAttribute('class'); out.removeAttribute('style'); out.removeAttribute('aria-hidden');
          return out.outerHTML;
        });
        fs.writeFileSync(path.join(dir, name + '.svg'), svg);
      }
      n++;
    }
  }
  await b.close(); srv.close();
  console.log(`exported ${n} figure(s) to ${path.resolve(o.out, o.palette)}`);
})();
