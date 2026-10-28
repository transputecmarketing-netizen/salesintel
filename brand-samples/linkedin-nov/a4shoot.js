const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.resolve('a4.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
  await p.pdf({ path: 'out/Transputec-LinkedIn-November-2026-Playbook-A4.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true }); await b.close(); })();
