const { chromium } = require(process.argv[2]);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
  const p = await ctx.newPage();
  for (let s = 1; s <= 5; s++) {
    await p.goto(`file://${process.argv[3]}/ios.html?step=${s}`);
    await p.waitForFunction(() => document.title === 'ready');
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${process.argv[3]}/screen${s}.png` });
  }
  await b.close(); console.log('ok');
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
