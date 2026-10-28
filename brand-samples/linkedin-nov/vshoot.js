const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const dir = process.argv[2]; fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve('w3_video.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  const only = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
  const N = 36 * 30;
  for (let f = 0; f < N; f++) { const t = f / 30; if (only && !only.includes(t)) continue;
    await p.evaluate(t => render(t), t);
    await p.screenshot({ path: `${dir}/f${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 }); }
  await b.close();
})();
