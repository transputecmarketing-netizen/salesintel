const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => { const b = await chromium.launch(); fs.mkdirSync('pdf', { recursive: true });
  for (const n of JSON.parse(fs.readFileSync('pb.json'))) { const p = await b.newPage();
    await p.goto('file://' + path.resolve(n + '.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    const over = await p.evaluate(() => [...document.querySelectorAll('section.pg')].map((s, i) => { const r = s.getBoundingClientRect(); const f = s.querySelector('.folio'); const lim = f ? f.getBoundingClientRect().top : r.bottom;
      const bad = [...s.querySelectorAll('div,span,h1,h2,h3')].filter(e => !e.closest('.folio') && !e.closest('.run') && !e.classList.contains('glow') && e.children.length == 0 && e.textContent.trim() && e.getBoundingClientRect().bottom > lim + 1);
      return bad.length ? (i + 1) + ':' + bad[0].textContent.slice(0, 40) : null }).filter(Boolean));
    if (over.length) console.log(n, 'OVERFLOW', over);
    await p.pdf({ path: `pdf/${n}.pdf`, preferCSSPageSize: true, printBackground: true }); await p.close(); }
  await b.close(); })();
