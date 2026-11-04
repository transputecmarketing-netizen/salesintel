const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch();
  for (const [f, out] of [['presentation.html', 'pdf/CBSE-Class9-Physics-Motion-and-Force-Presentation.pdf'], ['teacher.html', 'pdf/CBSE-Class9-Physics-Motion-and-Force-Teacher-Edition.pdf']]) {
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 } }); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto('file://' + path.resolve(f)); await p.waitForFunction('window.__done === true', null, { timeout: 60000 }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    // QA: anything inside a slide that spills past its bottom edge or footer
    const bad = await p.evaluate(() => [...document.querySelectorAll('.page > .slide, .te-slide .slide')].map((s, i) => { const R = s.getBoundingClientRect(); const ft = s.querySelector('.foot'); const lim = (ft ? ft.getBoundingClientRect().top : R.bottom) - 4 * (R.height / 1080);
      for (const e of s.querySelectorAll('*')) { if (e.closest('.foot') || e.closest('.top') || e.children.length) continue; const q = e.getBoundingClientRect(); if (q.height && (q.bottom > lim || q.right > R.right + 2)) return `${i + 1}: ${(e.textContent || e.tagName).trim().slice(0, 40)}`; } return null; }).filter(Boolean));
    const kerr = await p.evaluate(() => document.querySelectorAll('.katex-error').length);
    console.log(f, 'overflow:', bad.length ? bad : 'none', 'katex errors:', kerr, errs.length ? errs : '');
    await p.pdf({ path: out, preferCSSPageSize: true, printBackground: true }); await p.close(); }
  await b.close(); })();
