const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🚀 Starting Air Niugini PMS Test Suite');

  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Launch browser in headed mode so we can see it
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000 // Slow down actions for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('📄 Step 1: Testing homepage at http://localhost:3000');

    // Navigate to homepage
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Wait a moment for any dynamic content
    await page.waitForTimeout(2000);

    // Take screenshot of homepage
    await page.screenshot({
      path: path.join(screenshotsDir, '01-homepage.png'),
      fullPage: true
    });

    console.log('✅ Homepage screenshot saved to screenshots/01-homepage.png');

    // Check if page loaded properly
    const title = await page.title();
    console.log(`📋 Page title: ${title}`);

    console.log('🔐 Step 2: Testing login page at http://localhost:3000/login');

    // Navigate to login page
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

    // Wait a moment for page to load
    await page.waitForTimeout(2000);

    // Take screenshot of login page
    await page.screenshot({
      path: path.join(screenshotsDir, '02-login-page.png'),
      fullPage: true
    });

    console.log('✅ Login page screenshot saved to screenshots/02-login-page.png');

    console.log('🔑 Step 3: Testing login with credentials');

    // Check if login form exists
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = await page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first();

    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      // Fill in credentials
      await emailInput.fill('skycruzer@icloud.com');
      await passwordInput.fill('mron2393');

      // Take screenshot before submitting
      await page.screenshot({
        path: path.join(screenshotsDir, '03-login-filled.png'),
        fullPage: true
      });

      console.log('✅ Credentials filled in, screenshot saved to screenshots/03-login-filled.png');

      // Look for login button
      const loginButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();

      if (await loginButton.count() > 0) {
        await loginButton.click();
        console.log('🔄 Login button clicked, waiting for response...');

        // Wait for navigation or response
        await page.waitForTimeout(3000);

        // Take screenshot after login attempt
        await page.screenshot({
          path: path.join(screenshotsDir, '04-after-login.png'),
          fullPage: true
        });

        console.log('✅ Post-login screenshot saved to screenshots/04-after-login.png');

        // Check current URL to see if login was successful
        const currentUrl = page.url();
        console.log(`📍 Current URL after login: ${currentUrl}`);

        if (currentUrl.includes('/dashboard') || currentUrl === 'http://localhost:3000/' || !currentUrl.includes('/login')) {
          console.log('✅ Login appears successful - redirected away from login page');

          console.log('🏠 Step 4: Testing dashboard and navigation');

          // Wait for dashboard to load
          await page.waitForTimeout(2000);

          // Take screenshot of dashboard
          await page.screenshot({
            path: path.join(screenshotsDir, '05-dashboard.png'),
            fullPage: true
          });

          console.log('✅ Dashboard screenshot saved to screenshots/05-dashboard.png');

          // Test basic navigation
          console.log('🧭 Step 5: Testing navigation elements');

          // Look for navigation links
          const navLinks = await page.locator('nav a, header a, [role="navigation"] a').all();
          console.log(`📋 Found ${navLinks.length} navigation links`);

          // Try to find and click common navigation items
          const commonNavItems = ['Pilots', 'Certifications', 'Leave', 'Reports', 'Dashboard'];

          for (const navItem of commonNavItems) {
            const link = page.locator(`a:has-text("${navItem}"), button:has-text("${navItem}")`).first();
            if (await link.count() > 0) {
              console.log(`🔗 Found ${navItem} link, testing...`);
              await link.click();
              await page.waitForTimeout(1500);

              // Take screenshot of the page
              await page.screenshot({
                path: path.join(screenshotsDir, `06-${navItem.toLowerCase()}-page.png`),
                fullPage: true
              });

              console.log(`✅ ${navItem} page screenshot saved`);
            }
          }

        } else {
          console.log('❌ Login may have failed - still on login page or error occurred');

          // Check for error messages
          const errorMessages = await page.locator('.error, [role="alert"], .text-red-500, .text-red-600, .bg-red-100').all();
          if (errorMessages.length > 0) {
            for (let i = 0; i < errorMessages.length; i++) {
              const errorText = await errorMessages[i].textContent();
              console.log(`⚠️ Error message found: ${errorText}`);
            }
          }
        }

      } else {
        console.log('❌ Could not find login button');
      }

    } else {
      console.log('❌ Could not find email or password input fields');
      console.log(`Email input count: ${await emailInput.count()}`);
      console.log(`Password input count: ${await passwordInput.count()}`);
    }

    console.log('🔍 Step 6: Additional page analysis');

    // Get all links on the current page
    const allLinks = await page.locator('a').all();
    console.log(`📋 Total links found on page: ${allLinks.length}`);

    // Get all buttons on the current page
    const allButtons = await page.locator('button').all();
    console.log(`📋 Total buttons found on page: ${allButtons.length}`);

    // Check for any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🚨 Browser console error: ${msg.text()}`);
      }
    });

    console.log('📸 Final screenshot of current state');
    await page.screenshot({
      path: path.join(screenshotsDir, '07-final-state.png'),
      fullPage: true
    });

    console.log('✅ Test completed! Check the screenshots directory for visual results.');
    console.log('🖥️ Browser will stay open for manual testing. Close it when done.');

    // Keep browser open for manual inspection
    console.log('⏳ Browser staying open for manual testing. Press Ctrl+C to exit when done.');

    // Keep the process alive
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Error during testing:', error.message);

    // Take error screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'error-state.png'),
      fullPage: true
    });

    console.log('📸 Error screenshot saved to screenshots/error-state.png');

  } finally {
    // Don't close browser automatically - let user examine it
    console.log('🔍 Browser ready for manual inspection...');
  }
})();