import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: 'local_screenshot.png' });
    console.log("Screenshot taken successfully!");
  } catch(e) {
    console.log("Goto error:", e);
  }
  await browser.close();
  process.exit(0);
})();
