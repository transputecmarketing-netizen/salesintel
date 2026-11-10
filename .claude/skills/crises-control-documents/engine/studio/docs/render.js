// usage: node render.js <file.html> [...]  -> pdf/<name>.pdf (A4 from the page CSS, backgrounds on)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => { fs.mkdirSync('pdf', { recursive: true }); const b = await chromium.launch();
  for (const f of process.argv.slice(2)) { const p = await b.newPage(); await p.goto('file://' + path.resolve(f));
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    const out = 'pdf/' + path.basename(f, '.html') + '.pdf';
    await p.pdf({ path: out, preferCSSPageSize: true, printBackground: true }); await p.close(); console.log(out); }
  await b.close(); })();
