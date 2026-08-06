import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('REACT ERROR:', err.message));
  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
  } catch(e) {
    console.log("Goto error:", e);
  }
  const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML);
  if (!rootHtml) console.log("NO ROOT RENDERED");
  await browser.close();
  process.exit(0);
})();
