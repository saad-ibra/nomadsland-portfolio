import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
  
  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 15000 });
  } catch(e) {
    console.log("Goto timeout/error:", e.message);
  }
  
  const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || "NO ROOT");
  console.log("ROOT HTML LENGTH:", rootHtml.length);
  
  await browser.close();
  process.exit(0);
})();
