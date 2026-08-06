import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
      console.log('BROWSER CONSOLE:', msg.text());
    });
    
    page.on('pageerror', err => {
      console.log('PAGE ERROR:', err.message);
    });
    
    await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 5000 });
    const html = await page.content();
    console.log('HTML CONTENT:', html.substring(0, 100));
    await browser.close();
  } catch (err) {
    console.log('PUPPETEER ERROR:', err.message);
    process.exit(1);
  }
})();
