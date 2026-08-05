const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  try {
    console.log('Navigating to local dev server...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log('Page loaded');
  } catch(e) {
    console.error('Navigation error:', e);
  }
  await browser.close();
  process.exit(0);
})();
