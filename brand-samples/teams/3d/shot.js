const { chromium } = require('playwright'); const path = require('path'); const http = require('http'); const fs = require('fs');
const root = path.resolve(__dirname, '../..');
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { const ext = path.extname(f); r.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' }[ext] || 'application/octet-stream' }); r.end(d); } }); }).listen(8765);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const s of process.argv.slice(2)) {
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('CON', m.text()); });
    await p.goto(`http://localhost:8765/teams/3d/scenes.html?s=${s}`);
    await p.waitForFunction('window.__done === true', null, { timeout: 120000 });
    await p.screenshot({ path: path.resolve(__dirname, `../3d-${s}.png`) });
    console.log('done', s); await p.close();
  }
  await b.close(); srv.close();
})();
