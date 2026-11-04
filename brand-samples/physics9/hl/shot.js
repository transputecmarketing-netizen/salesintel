const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 700, height: 640 } });
  p.on('console', m => { if (m.type() === 'error') console.log('CON', m.text()); }); p.on('pageerror', e => console.log('ERR', e.message));
  const shots = process.argv.slice(2);
  for (const s of shots) { const [file, q, out] = s.split('|'); await p.goto('file://' + path.resolve(file) + q); await p.waitForTimeout(1600); await p.screenshot({ path: out }); }
  await b.close(); })();
