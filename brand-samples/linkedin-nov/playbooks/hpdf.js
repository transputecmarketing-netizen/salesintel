const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); for (const f of process.argv.slice(2)) { const p = await b.newPage(); await p.goto('file://' + path.resolve(f)); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  await p.pdf({ path: 'pdf/' + path.basename(f, '.html') + '.pdf', preferCSSPageSize: true, printBackground: true }); await p.close(); } await b.close(); })();
