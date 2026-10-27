const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const n of process.argv.slice(2)) {
    const p = await b.newPage(); await p.goto('file://' + path.resolve(__dirname, n + '.html')); await p.evaluate(() => document.fonts.ready);
    const res = await p.evaluate(() => {
      const out = []; const mm = 3.7795;
      document.querySelectorAll('section.pg').forEach((sec, i) => {
        const sr = sec.getBoundingClientRect();
        const lim = [...sec.querySelectorAll('.src,.folio')].filter(e => getComputedStyle(e).position === 'absolute').map(e => e.getBoundingClientRect().top - sr.top);
        const stop = lim.length ? Math.min(...lim) - 1 * mm : sr.height - 14 * mm;
        sec.querySelectorAll('*').forEach(e => {
          if (e.closest('.src,.folio,.spine,.run,.glow,defs')) return;
          if (e.closest('svg') && e.tagName !== 'svg') return;
          const hasText = [...e.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
          if (!hasText && e.tagName !== 'svg' && e.tagName !== 'IMG') return;
          const r = e.getBoundingClientRect();
          if (r.height === 0) return;
          const bottom = r.bottom - sr.top, right = r.right - sr.left;
          if (bottom > stop + .5 && !e.closest('[style*="position:absolute"][style*="bottom"]')) out.push(`p${i+1} bottom ${((bottom-stop)/mm).toFixed(1)}mm over: ${(e.textContent||e.tagName).trim().slice(0,50)}`);
          if (right > sr.width + 1 || r.left - sr.left < -1) { if (!e.closest('.glow')) out.push(`p${i+1} horizontal overflow: ${(e.textContent||e.tagName).trim().slice(0,40)} (${(r.left-sr.left).toFixed(0)}..${(right).toFixed(0)}/${sr.width.toFixed(0)})`); }
        });
      }); return out; });
    console.log(n, res.length ? '\n  ' + res.slice(0, 25).join('\n  ') : 'clean'); bad += res.length; await p.close();
  }
  await b.close();
})();
