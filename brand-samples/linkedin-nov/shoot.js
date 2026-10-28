const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const m = JSON.parse(fs.readFileSync('manifest.json'));
  fs.mkdirSync('out', { recursive: true });
  for (const k of Object.keys(m)) {
    const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
    await p.goto('file://' + path.resolve(k + '.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    const s = await p.locator('.s').all();
    for (let i = 0; i < s.length; i++) await s[i].screenshot({ path: `out/${k}-${String(i + 1).padStart(2, '0')}.png` });
    if (s.length > 2) await p.pdf({ path: `out/${k}-carousel.pdf`, preferCSSPageSize: true, printBackground: true });
    await p.close();
  }
  await b.close();
})();
