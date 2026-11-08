const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 794, height: 1123 } });
  const [f, tag, out] = process.argv.slice(2);
  await p.goto('file://' + path.resolve(f)); await p.waitForTimeout(500);
  const els = await p.$$('section.pg');
  for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: `${out}/${tag}${String(i + 1).padStart(2, '0')}.png` });
  await b.close(); })();
