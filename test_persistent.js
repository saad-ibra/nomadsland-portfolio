import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('REACT ERROR:', err.message));
  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log("PAGE LOADED!");
  } catch(e) {
    console.log("Goto timeout/error:", e.message);
  }
  const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || "NO ROOT");
  console.log("ROOT HTML LENGTH:", rootHtml.length);
  await browser.close();
  process.exit(0);
})();
