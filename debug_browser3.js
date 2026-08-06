import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 5000 });
  } catch (e) {
    console.log('Timeout during goto');
  }
  
  const rootHtml = await page.evaluate(() => {
    return document.getElementById('root') ? document.getElementById('root').innerHTML : 'NO ROOT';
  });
  console.log('Root HTML length:', rootHtml.length);
  if (rootHtml.length < 100) {
    console.log('ROOT HTML:', rootHtml);
  }
  
  await browser.close();
})();
