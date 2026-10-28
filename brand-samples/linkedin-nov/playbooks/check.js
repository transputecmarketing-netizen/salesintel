// usage: node check.js AI-02-....html [more.html]  -> reports page count, text overflowing the footer, overlapping absolute blocks
const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  for (const f of process.argv.slice(2)) {
    await p.goto('file://' + path.resolve(f)); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const S = [...document.querySelectorAll('section.pg')]; const bad = [];
      S.forEach((s, i) => { const R = s.getBoundingClientRect(); const fo = s.querySelector('.folio'); const lim = fo ? fo.getBoundingClientRect().top - 2 : R.bottom;
        for (const e of s.querySelectorAll('*')) { if (e.closest('.folio') || e.closest('.run') || e.children.length || !e.textContent.trim()) continue; const q = e.getBoundingClientRect();
          if (q.bottom > lim || q.right > R.right + 1) { bad.push(`p${i + 1} overflow: "${e.textContent.trim().slice(0, 50)}"`); break; } }
        for (const e of s.querySelectorAll('[style*="column"]')) if (e.scrollWidth > e.clientWidth + 2) bad.push(`p${i + 1} column overflow (text spills into a hidden third column)`);
      }); return { n: S.length, bad }; });
    console.log(f, r.n, 'pages', r.bad.length ? '\n  ' + r.bad.join('\n  ') : 'OK');
  } await b.close(); })();
