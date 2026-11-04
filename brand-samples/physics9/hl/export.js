// Exports the stage drawing only, in the deck palette, at 3x: custom figures from their bench pages, package figures via ../../hairline/fig.html.
const { chromium } = require('playwright'); const path = require('path'); const http = require('http'); const fs = require('fs');
const VARS = '--hl-plate:#FFFFFF;--hl-hi:#0071E3;--hl-edge:#3A3A3C;--hl-mid:#8E8E93;--hl-lo:#D2D2D7;--hl-sw:1.3;--hairline-plate:#FFFFFF;--hairline-hi:#0071E3;--hairline-edge:#3A3A3C;--hairline-mid:#8E8E93;--hairline-lo:#D2D2D7;--hairline-stroke:1.3';
const root = path.resolve(__dirname, '../..');
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(d); }); }).listen(8788);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 800 }, deviceScaleFactor: 3 });
  const jobs = [['physics9/hl/hairline-push.html?theme=light', '#stage svg', 'push'], ['physics9/hl/hairline-push.html?theme=light&at=280,232', '#stage svg', 'push-moved'],
    ['physics9/hl/hairline-rocket.html?theme=light', '#stage svg', 'rocket'], ['physics9/hl/hairline-rocket.html?theme=light&at=200,60', '#stage svg', 'rocket-up']];
  for (const n of ['loupe', 'slow', 'elevator', 'plot', 'turntable', 'terrain']) jobs.push([`hairline/fig.html?n=${n}&th=light`, '#f', n]);
  for (const [u, sel, out] of jobs) { await p.goto('http://localhost:8788/' + u); await p.addStyleTag({ content: `:root,body,#stage,.f{${VARS}} body{background:#fff!important} #f{width:800px} .tag,#name,#read{display:none!important} .plate{border:0!important}` }); await p.waitForTimeout(1800);
    await p.locator(sel).first().screenshot({ path: `out/${out}.png`, omitBackground: true }); }
  await b.close(); srv.close(); })();
