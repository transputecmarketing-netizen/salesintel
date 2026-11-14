const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1120, height: 880 }, deviceScaleFactor: 2 });
  await p.goto('file://' + process.cwd() + '/squat.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await p.evaluate(() => renderT(0)); await p.screenshot({ path: 'Squat-Form-Check@2x.png' });
  const q = await b.newPage({ viewport: { width: 1120, height: 880 }, deviceScaleFactor: 1 });
  await q.goto('file://' + process.cwd() + '/squat.html'); await q.evaluate(() => document.fonts.ready); await q.waitForTimeout(500);
  fs.mkdirSync('fr', { recursive: true }); const fps = 15, n = Math.round(5 * fps);
  for (let i = 0; i < n; i++) { await q.evaluate(t => renderT(t), i / fps); await q.screenshot({ path: `fr/f${String(i).padStart(4, '0')}.png` }); }
  await b.close(); console.log(n, 'frames'); })();
