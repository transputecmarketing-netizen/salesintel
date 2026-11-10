const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  for (const d of (process.argv.slice(2).length ? process.argv.slice(2) : ['contour', 'shards', 'radar', 'circuit', 'dots', 'burst', 'bars'])) { await p.goto('file://' + path.resolve('art2.html') + '?d=' + d); await p.waitForTimeout(300); await p.screenshot({ path: `art2/${d}.jpg`, type: 'jpeg', quality: 90 }); }
  await b.close(); })();
