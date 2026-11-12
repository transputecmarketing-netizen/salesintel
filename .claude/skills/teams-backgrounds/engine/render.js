// Render every page listed in build/manifest.json to out/<name>.png (1920x1080), then run sheet.py
// for the contact sheet and QA. usage: node render.js [id-or-name-substring ...]
const { chromium } = require('playwright'); const path = require('path'); const http = require('http'); const fs = require('fs');
const { execFileSync } = require('child_process');
const root = __dirname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(root)) { r.writeHead(403); return r.end(); }
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(d); } });
});
(async () => {
  await new Promise(ok => srv.listen(0, ok)); const port = srv.address().port;
  const man = JSON.parse(fs.readFileSync(path.join(root, 'build', 'manifest.json'), 'utf8'));
  const only = process.argv.slice(2);
  const items = man.items.filter(it => !only.length || only.some(o => it.name.includes(o)));
  fs.mkdirSync(path.join(root, 'out'), { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  let failed = 0;
  for (const it of items) {
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    p.on('pageerror', e => console.log('ERR', it.name, e.message));
    p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', it.name, m.text()); });
    const t0 = Date.now();
    try {
      await p.goto(`http://127.0.0.1:${port}/build/${it.name}.html`);
      await p.waitForFunction('window.__done === true', null, { timeout: it.family === 'office' ? 240000 : 60000 });
      await p.waitForTimeout(250);
      await p.screenshot({ path: path.join(root, 'out', it.name + '.png') });
      console.log('rendered', it.name, ((Date.now() - t0) / 1000).toFixed(1) + 's');
    } catch (e) { failed++; console.log('FAILED', it.name, e.message.split('\n')[0]); }
    await p.close();
  }
  await b.close(); srv.close();
  execFileSync('python3', [path.join(root, 'sheet.py')], { stdio: 'inherit' });
  if (failed) process.exit(1);
})();
