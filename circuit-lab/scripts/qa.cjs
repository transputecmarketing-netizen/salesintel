// Visual QA: screenshot lessons (optionally while running) and report errors.
// Usage: node scripts/qa.cjs --url http://localhost:5173 --ids blink,button [--run] [--out dir] [--w 1600 --h 950] [--tab quiz]
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i < 0 ? d : process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true;
};
(async () => {
  const base = arg('url', 'http://localhost:5173');
  const ids = String(arg('ids', '')).split(',').filter(Boolean);
  const out = arg('out', 'qa-shots');
  const run = !!arg('run', false);
  const tab = arg('tab', null);
  const W = Number(arg('w', 1600)), H = Number(arg('h', 950));
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs = [];
  p.on('console', (m) => {
    const t = m.text();
    if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver|GPU stall|swiftshader/i.test(t)) errs.push(`[${m.type()}] ${t}`);
  });
  p.on('pageerror', (e) => errs.push(`[pageerror] ${e.message}`));
  await p.goto(`${base}/learn/#${ids[0] ?? ''}`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => !document.documentElement.classList.contains('is-loading'), null, { timeout: 90000 });
  for (const id of ids) {
    const before = errs.length;
    await p.evaluate((id) => { location.hash = id; }, id);
    await p.waitForTimeout(2200);
    if (tab) await p.click(`[data-tab="${tab}"]`);
    if (run) {
      await p.click('#code-run');
      await p.waitForTimeout(Number(arg('wait', 4000)));
    }
    const file = path.join(out, `${id}${run ? '-run' : ''}.png`);
    await p.screenshot({ path: file });
    const consoleText = await p.$eval('#console-lines', (el) => el.innerText.split('\n').slice(-6).join(' | ')).catch(() => '');
    if (run) await p.click('#code-run');
    console.log(`${id}: ${file}${errs.length > before ? `  ERRORS: ${errs.slice(before).join(' ;; ')}` : ''}${run ? `\n   serial: ${consoleText}` : ''}`);
  }
  await b.close();
})();
