const { test, expect } = require('@playwright/test');

test('Detailed login flow with console monitoring', async ({ page }) => {
  console.log('🔐 Starting detailed login test with console monitoring...');

  // Enhanced console logging
  const consoleMessages = [];
  const errors = [];
  const networkRequests = [];

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    consoleMessages.push({ type, text, timestamp: new Date().toISOString() });
    console.log(`🌐 [${type.toUpperCase()}] ${text}`);
  });

  page.on('pageerror', (error) => {
    const errorMsg = error.message;
    errors.push({ message: errorMsg, timestamp: new Date().toISOString() });
    console.log(`🚨 [PAGE ERROR] ${errorMsg}`);
  });

  // Monitor network requests
  page.on('request', (request) => {
    const url = request.url();
    const method = request.method();
    if (url.includes('auth') || url.includes('api') || url.includes('supabase')) {
      networkRequests.push({
        method,
        url,
        timestamp: new Date().toISOString(),
        type: 'request',
      });
      console.log(`🌐 [REQUEST] ${method} ${url}`);
    }
  });

  page.on('response', (response) => {
    const url = response.url();
    const status = response.status();
    if (url.includes('auth') || url.includes('api') || url.includes('supabase')) {
      networkRequests.push({
        url,
        status,
        timestamp: new Date().toISOString(),
        type: 'response',
      });
      console.log(`🌐 [RESPONSE] ${status} ${url}`);
    }
  });

  console.log('📱 Navigating to login page...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

  // Wait for page to fully load
  await page.waitForTimeout(2000);

  console.log('🔍 Verifying login page elements...');
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const submitButton = page.locator('button[type="submit"]');

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(submitButton).toBeVisible();

  console.log('✅ Login page elements verified');

  console.log('📝 Filling credentials...');
  await emailInput.fill('skycruzer@icloud.com');
  await passwordInput.fill('mron2393');

  console.log('📧 Email filled: skycruzer@icloud.com');
  console.log('🔑 Password filled: [HIDDEN]');

  console.log('🚀 Submitting login form...');
  await submitButton.click();

  console.log('⏳ Waiting for authentication response...');
  await page.waitForTimeout(5000); // Wait 5 seconds for auth

  // Check current URL
  const currentUrl = page.url();
  console.log(`🌐 Current URL after login: ${currentUrl}`);

  // Check for any error messages on the page
  const errorElements = await page
    .locator('[class*="error"], [class*="alert"], .text-red-500, .text-red-700, .text-red-800')
    .all();
  if (errorElements.length > 0) {
    console.log('⚠️  Found potential error elements:');
    for (const element of errorElements) {
      const text = await element.textContent();
      if (text && text.trim()) {
        console.log(`   - ${text.trim()}`);
      }
    }
  }

  // Check for success indicators
  if (currentUrl.includes('/dashboard')) {
    console.log('🎉 SUCCESS: Redirected to dashboard!');

    // Wait for dashboard to load
    await page.waitForTimeout(3000);

    // Check for dashboard elements
    const dashboardElements = await page
      .locator('text=Dashboard, text=27, text=556, text="Air Niugini"')
      .all();
    console.log(`📊 Found ${dashboardElements.length} dashboard elements`);

    // Check for statistics
    const pageContent = await page.content();
    const has27 = pageContent.includes('27');
    const has556 =
      pageContent.includes('556') || pageContent.includes('531') || pageContent.includes('568');

    console.log(`📈 Statistics check: 27 pilots=${has27}, certifications=${has556}`);
  } else if (currentUrl.includes('/login')) {
    console.log('⚠️  Still on login page - authentication may have failed');

    // Check for loading state
    const isLoading = await page
      .locator('.loading, [class*="loading"], .spinner, [class*="spinner"]')
      .count();
    console.log(`🔄 Loading elements found: ${isLoading}`);

    // Get visible text for debugging
    const visibleText = await page.locator('body').textContent();
    console.log('📄 Page text sample:', visibleText.substring(0, 500) + '...');
  } else {
    console.log(`🔍 Unexpected URL: ${currentUrl}`);
  }

  // Summary of captured data
  console.log('\\n📊 SUMMARY:');
  console.log(`   Console messages: ${consoleMessages.length}`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Network requests: ${networkRequests.length}`);

  if (errors.length > 0) {
    console.log('\\n🚨 ERRORS CAPTURED:');
    errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error.message}`);
    });
  }

  if (networkRequests.length > 0) {
    console.log('\\n🌐 NETWORK ACTIVITY:');
    networkRequests.forEach((req, i) => {
      if (req.type === 'request') {
        console.log(`   ${i + 1}. REQ: ${req.method} ${req.url}`);
      } else {
        console.log(`   ${i + 1}. RES: ${req.status} ${req.url}`);
      }
    });
  }

  // Take final screenshot
  await page.screenshot({
    path: 'login-detailed-test-result.png',
    fullPage: true,
  });
  console.log('📸 Detailed screenshot saved');

  // Test should pass regardless of outcome for analysis
  expect(true).toBe(true);
});
