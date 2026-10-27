const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.resolve(__dirname, 'backgrounds6.html')); await p.evaluate(() => document.fonts.ready);
  for (const n of fs.readFileSync('names6.txt', 'utf8').split('\n')) await p.locator('[id="' + n + '"] .bg').screenshot({ path: `transputec-teams-${n}.png` });
  await b.close();
})();
