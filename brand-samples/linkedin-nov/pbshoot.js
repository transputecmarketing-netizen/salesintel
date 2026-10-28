const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + path.resolve('playbook.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await p.pdf({ path: 'out/Transputec-LinkedIn-November-2026-Playbook.pdf', preferCSSPageSize: true, printBackground: true }); await b.close(); })();
