#!/usr/bin/env node
// Render SVG files to transparent PNG with headless Chromium.
//   node render_svg.js [--width 2400] [--bg none|#hex] file1.svg [file2.svg ...]
// Each PNG is written next to its SVG. Width is the output pixel width; height follows the SVG's aspect ratio.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

(async () => {
  const argv = process.argv.slice(2); let width = 2400, bg = 'none'; const files = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--width') width = +argv[++i]; else if (argv[i] === '--bg') bg = argv[++i]; else files.push(argv[i]);
  }
  if (!files.length) { console.error('usage: node render_svg.js [--width 2400] [--bg none] a.svg ...'); process.exit(2); }
  const b = await chromium.launch();
  for (const f of files) {
    const svg = fs.readFileSync(f, 'utf8');
    const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1];
    let w = 800, h = 640;
    if (vb) { const v = vb.trim().split(/[\s,]+/).map(Number); w = v[2]; h = v[3]; }
    const cssW = 800, cssH = Math.round(cssW * h / w);
    const sized = svg.replace(/<svg([^>]*?)\swidth="[^"]*"/, '<svg$1').replace(/<svg([^>]*?)\sheight="[^"]*"/, '<svg$1')
      .replace('<svg', `<svg width="${cssW}" height="${cssH}"`);
    const ctx = await b.newContext({ viewport: { width: cssW, height: cssH }, deviceScaleFactor: width / cssW });
    const q = await ctx.newPage();
    await q.setContent(`<html><body style="margin:0;background:${bg === 'none' ? 'transparent' : bg}">${sized}</body></html>`);
    const out = f.replace(/\.svg$/i, '.png');
    await q.locator('svg').first().screenshot({ path: out, omitBackground: bg === 'none' });
    await ctx.close();
    console.log('wrote', out);
  }
  await b.close();
})();
