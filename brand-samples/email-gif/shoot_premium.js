const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => { const [fps, scale, out] = [+process.argv[2] || 12, +process.argv[3] || 2, process.argv[4] || 'pframes']; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 560, height: 150 }, deviceScaleFactor: scale });
  await p.goto('file://' + path.resolve('premium.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  await p.evaluate(() => { location.reload; }); const n = Math.round(8.8 * fps);
  for (let i = 0; i < n; i++) { await p.evaluate(t => render(t), i / fps); await p.screenshot({ path: `${out}/f${String(i).padStart(4, '0')}.png` }); }
  await b.close(); console.log(n, 'frames'); })();
