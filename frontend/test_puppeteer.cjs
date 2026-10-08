const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Log all console messages
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQ FAILED:', request.url(), request.failure().errorText));

    console.log("Navigating to login...");
    await page.goto('http://localhost:5173');
    
    await page.waitForSelector('input[type="text"]');
    await page.type('input[type="text"]', 'student');
    await page.type('input[type="password"]', 'Student@123');
    await page.click('button[type="submit"]');

    console.log("Waiting for StudentMenu...");
    await page.waitForSelector('button', { timeout: 5000 });
    // Wait for the login response to set localStorage
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Clicking My Orders button...");
    // Find the button with text 'My Orders' and click it
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const ordersBtn = buttons.find(b => b.textContent.includes('My Orders'));
      if (ordersBtn) ordersBtn.click();
    });
    
    // wait a bit for react to render
    await new Promise(r => setTimeout(r, 2000));
    
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    console.log("BODY HTML length:", bodyHTML.length);
    if (bodyHTML.length < 500) {
       console.log("BODY:", bodyHTML);
    }
    
    await browser.close();
  } catch (e) {
    console.error("TEST FAILED:", e);
    process.exit(1);
  }
})();
