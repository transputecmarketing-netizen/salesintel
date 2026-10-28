const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  for (const d of process.argv.slice(2)) { await p.goto('file://' + path.resolve(d + '.html')); await p.waitForTimeout(500); await p.screenshot({ path: `a-${d}.png` }); }
  await b.close(); })();
