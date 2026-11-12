// usage: node render.js out/<name>
// Renders slides.html to PNGs (+ carousel PDF), checks overflow, renders a4.html, review.html and video.html if present.
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');

(async () => {
  const dir = path.resolve(process.argv[2]); const job = JSON.parse(fs.readFileSync(path.join(dir, 'job.json')));
  const url = f => 'file://' + path.join(dir, f);
  const b = await chromium.launch(); let problems = 0;

  // 1. slides
  let p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.goto(url('slides.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  const issues = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('.s').forEach((s, i) => {
      const r = s.getBoundingClientRect(); const ft = s.querySelector('.ft').getBoundingClientRect();
      s.querySelectorAll('*').forEach(e => {
        if (e.closest('.ft') || e.closest('.hd') || e.classList.contains('glow') || e.closest('svg')) return;
        const hasText = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        if (!hasText && !e.classList.contains('card') && !e.classList.contains('pill')) return;
        const q = e.getBoundingClientRect(); if (!q.width || !q.height) return;
        if (q.bottom > ft.top - 20) out.push(`slide ${i + 1}: content reaches the footer (${Math.round(q.bottom - r.top)}px) "${(e.innerText || e.tagName).slice(0, 40)}"`);
        else if (q.right > r.right - 80 + 1) out.push(`slide ${i + 1}: content past the right margin "${(e.innerText || e.tagName).slice(0, 40)}"`);
        if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible') out.push(`slide ${i + 1}: clipped text`);
      });
    });
    return [...new Set(out)].slice(0, 20);
  });
  issues.forEach(x => { console.log('OVERFLOW', x); problems++; });
  const s = await p.locator('.s').all();
  for (let i = 0; i < s.length; i++) await s[i].screenshot({ path: path.join(dir, `${job.name}-${String(i + 1).padStart(2, '0')}.png`) });
  if (job.pdf) await p.pdf({ path: path.join(dir, `${job.name}-carousel.pdf`), preferCSSPageSize: true, printBackground: true });
  await p.close();

  // 2. A4 one-pager and review pack
  for (const [f, outName, check] of [['a4.html', `${job.name}-A4.pdf`, true], ['review.html', `${job.name}-review.pdf`, false]]) {
    if (!fs.existsSync(path.join(dir, f)) || (f === 'a4.html' && !job.a4)) continue;
    p = await b.newPage({ viewport: { width: 794, height: 1123 } });
    await p.goto(url(f)); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    if (check) {
      const n = await p.evaluate(() => document.querySelectorAll('.p').length);
      const over = await p.evaluate(() => { const pg = document.querySelector('.p'); const g = pg.querySelector('.grid');
        let o = Math.max(0, g.scrollHeight - g.clientHeight); pg.querySelectorAll('.grid .card').forEach(c => { o = Math.max(o, c.scrollHeight - c.clientHeight); }); return o > 1 ? o : 0; });
      if (over) { console.log(`OVERFLOW A4: points overflow by ${over}px; shorten point text or use fewer items`); problems++; }
      await p.screenshot({ path: path.join(dir, `${job.name}-A4.png`), fullPage: false });
      if (n !== 1) console.log('NOTE A4 has', n, 'pages');
    }
    await p.pdf({ path: path.join(dir, outName), preferCSSPageSize: true, printBackground: true });
    await p.close();
  }

  // 3. video (optional)
  if (job.video) {
    const fr = path.join(dir, 'frames'); fs.rmSync(fr, { recursive: true, force: true }); fs.mkdirSync(fr);
    p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    await p.goto(url('video.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    const T = await p.evaluate(() => window.TOTAL); const fps = job.fps || 30; const N = Math.round(T * fps);
    const mids = await p.evaluate(() => [...document.querySelectorAll('.sc')].map(s => (+s.dataset.a + +s.dataset.b) / 2));
    for (let f = 0; f < N; f++) {
      await p.evaluate(t => render(t), f / fps);
      await p.screenshot({ path: path.join(fr, `f${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 90 });
    }
    for (let k = 0; k < mids.length; k++) { await p.evaluate(t => render(t), mids[k]); await p.screenshot({ path: path.join(dir, `video-scene-${String(k + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 80 }); }
    await p.close();
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(fr, 'f%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', path.join(dir, `${job.name}-1080x1920.mp4`)]);
    fs.rmSync(fr, { recursive: true, force: true });
    console.log(`video ${T}s at ${fps}fps`);
  }
  await b.close();
  console.log(problems ? `${problems} layout problem(s): fix and rebuild` : 'Layout checks passed');
  console.log('Outputs in', dir); fs.readdirSync(dir).filter(f => /\.(png|pdf|mp4|txt)$/.test(f)).forEach(f => console.log('  ' + f));
  process.exit(problems ? 1 : 0);
})();
