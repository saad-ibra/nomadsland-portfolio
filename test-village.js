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

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  
  console.log('Opened home.');
  
  // Try to click the "VILLAGE" button to go to the village
  try {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const villageBtn = btns.find(b => b.innerText.includes('VILLAGE'));
      if (villageBtn) villageBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    console.log('Navigated to village.');
  } catch (e) {
    console.log('Failed to navigate to village:', e);
  }

  await browser.close();
})();
