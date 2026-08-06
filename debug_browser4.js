import puppeteer from 'puppeteer';
import fs from 'fs';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  let logs = '';
  page.on('console', msg => { logs += `CONSOLE: ${msg.text()}\n`; });
  page.on('pageerror', err => { logs += `PAGE ERROR: ${err.message}\n`; });
  
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));
  
  fs.writeFileSync('puppeteer_logs.txt', logs);
  await browser.close();
})();
