import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });
  
  console.log('Navigating...');
  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 8000 });
  } catch (e) {
    console.log('Navigation ended with:', e.message);
  }
  
  console.log('Waiting a bit...');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Taking screenshot...');
  await page.screenshot({path: '/Users/saadibrahimkhan/.gemini/antigravity/brain/ed093ee8-2a40-4a0b-b546-b23a2c4d7687/screenshot_test.png'});
  
  const content = await page.content();
  console.log('HTML Snippet:', content.substring(0, 300));
  
  await browser.close();
})();
