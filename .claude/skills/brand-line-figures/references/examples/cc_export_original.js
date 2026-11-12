// Hairline figures in the Crises Control palette: dark (transparent, sky-blue lines, white highlight) and light (ink lines, crimson highlight).
const { chromium } = require('playwright'); const path = require('path'); const http = require('http'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../crises-control/assets/hl');
const V = { dark: '--hairline-plate:#0B223C;--hairline-hi:#FFFFFF;--hairline-edge:#16A1ED;--hairline-mid:#1179BB;--hairline-lo:#0A3165;--hairline-stroke:1.4',
            light: '--hairline-plate:#FFFFFF;--hairline-hi:#FF0000;--hairline-edge:#0B223C;--hairline-mid:#3A3A3A;--hairline-lo:#D8D7DB;--hairline-stroke:1.4' };
const srv = http.createServer((q, r) => { const f = path.join(__dirname, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html' }); r.end(d); }); }).listen(8790);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 800, height: 640 }, deviceScaleFactor: 3 });
  for (const n of process.argv.slice(2)) for (const th of ['dark', 'light']) {
    await p.goto(`http://localhost:8790/fig.html?n=${n}&th=${th}`); await p.waitForFunction('window.__done === true');
    await p.addStyleTag({ content: `body,.f,#f{${V[th]}} body.dark{background:transparent!important} body.light{background:#fff!important}` }); await p.waitForTimeout(700);
    await p.locator('#f').screenshot({ path: `${OUT}/${th}/${n}.png`, omitBackground: th === 'dark' }); }
  await b.close(); srv.close(); console.log('done'); })();
