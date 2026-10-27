const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  for (const n of process.argv.slice(2)) {
    const p = await b.newPage();
    await p.goto('file://' + path.resolve(__dirname, n + '.html'));
    await p.evaluate(() => document.fonts.ready);
    await p.pdf({ path: path.resolve(__dirname, '../pdf', n + '.pdf'), preferCSSPageSize: true, printBackground: true });
    await p.close();
  }
  await b.close();
})();
