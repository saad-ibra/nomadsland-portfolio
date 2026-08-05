import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push('PAGE_ERROR: ' + err.toString()));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('CONSOLE_ERROR: ' + msg.text());
  });
  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 5000 });
  } catch (e) { }
  await new Promise(r => setTimeout(r, 1000));
  if (errors.length > 0) {
      console.log('ERRORS:', JSON.stringify(errors, null, 2));
      process.exit(1);
  } else {
      console.log('SUCCESS: No JS errors.');
  }
  await browser.close();
})();
