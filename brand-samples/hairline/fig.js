const { chromium } = require('playwright'); const path = require('path'); const http = require('http'); const fs = require('fs');
const srv = http.createServer((q, r) => { const f = path.join(__dirname, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(d); }); }).listen(8777);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 800, height: 640 }, deviceScaleFactor: 3 });
  p.on('pageerror', e => console.log('ERR', e.message));
  for (const n of process.argv.slice(2)) for (const th of ['dark', 'light']) { await p.goto(`http://localhost:8777/fig.html?n=${n}&th=${th}`); await p.waitForFunction('window.__done === true'); await p.locator('#f').screenshot({ path: `out/${th}/${n}.png`, omitBackground: th === 'dark' }); } console.log('done');
  await b.close(); srv.close(); })();
