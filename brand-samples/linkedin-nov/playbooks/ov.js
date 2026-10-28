const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.resolve('November-2026-Playbooks-Complete.html')); await p.evaluate(() => document.fonts.ready);
  const r = await p.evaluate(() => [...document.querySelectorAll('section.pg')].map((s, i) => {
    const kids = [...s.children].filter(e => getComputedStyle(e).position === 'absolute' && !e.classList.contains('glow') && !e.classList.contains('run') && !e.classList.contains('folio'));
    const out = [];
    for (let a = 0; a < kids.length; a++) for (let c = a + 1; c < kids.length; c++) { const A = kids[a].getBoundingClientRect(), C = kids[c].getBoundingClientRect();
      if (A.left < C.right && C.left < A.right && A.top < C.bottom && C.top < A.bottom && A.height < 1000 && C.height < 1000 && A.height > 5 && C.height > 5) out.push(i + 1); }
    return out }).flat());
  console.log('overlaps on pages:', [...new Set(r)]); await b.close(); })();
