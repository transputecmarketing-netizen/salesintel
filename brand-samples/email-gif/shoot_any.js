// node shoot_any.js page.html fps scale outdir
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => { const [f, fps, scale, out] = [process.argv[2], +process.argv[3] || 12, +process.argv[4] || 2, process.argv[5] || 'fr']; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 560, height: 150 }, deviceScaleFactor: scale });
  await p.goto('file://' + path.resolve(f)); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  const dur = await p.evaluate(() => window.DUR); const n = Math.round(dur * fps);
  for (let i = 0; i < n; i++) { await p.evaluate(t => render(t), i / fps); await p.screenshot({ path: `${out}/f${String(i).padStart(4, '0')}.png` }); }
  await b.close(); console.log(f, n, 'frames'); })();
