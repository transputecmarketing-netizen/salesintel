const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.resolve(__dirname, 'backgrounds.html')); await p.evaluate(() => document.fonts.ready);
  for (const n of fs.readFileSync('names.txt', 'utf8').split('\n')) {
    await p.locator('[id="' + n + '"] .bg').screenshot({ path: `transputec-teams-${n}.png` });
  }
  const q = await b.newPage({ viewport: { width: 6000, height: 2300 } });
  await q.goto('file://' + path.resolve(__dirname, 'preview.html')); await q.evaluate(() => document.fonts.ready);
  await q.locator('.g').screenshot({ path: 'preview-sheet.png' });
  await b.close();
})();
