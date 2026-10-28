const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch();
  for (const d of process.argv.slice(2)) { const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
    p.on('pageerror', e => console.log('ERR', d, e.message));
    await p.goto('file://' + path.resolve('g.html') + '?d=' + d); await p.waitForFunction('window.__done === true'); await p.waitForTimeout(300);
    await p.screenshot({ path: `g-${d}.png` }); await p.close(); }
  await b.close(); })();
