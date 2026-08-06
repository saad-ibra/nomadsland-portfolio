import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('REACT ERROR:', err.message));
  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.screenshot({ path: 'static_screenshot.png' });
    console.log("Screenshot taken successfully!");
  } catch(e) {
    console.log("Goto error:", e);
  }
  await browser.close();
  process.exit(0);
})();
