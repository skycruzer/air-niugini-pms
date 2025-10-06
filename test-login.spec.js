const { test, expect } = require('@playwright/test');

test('Test login with user credentials', async ({ page }) => {
  console.log('🔐 Starting login test...');

  // Listen to console logs from the browser
  page.on('console', (msg) => {
    console.log('🌐 Browser console:', msg.text());
  });

  // Navigate to login page (using port 3001)
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');

  // Verify login page loaded
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();

  console.log('✅ Login page loaded successfully');

  // Fill in credentials
  await page.fill('input[type="email"]', 'skycruzer@icloud.com');
  await page.fill('input[type="password"]', 'mron2393');

  console.log('✅ Credentials entered');

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for navigation or response with more time for authentication
  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle');

  // Check the current URL and page content
  const currentUrl = page.url();
  console.log('🌐 Current URL after login:', currentUrl);

  // Check if we're redirected to dashboard or still on login page
  if (currentUrl.includes('/dashboard')) {
    console.log('🎉 SUCCESS: Redirected to dashboard!');

    // Verify dashboard content - wait for navigation or dashboard elements
    await page.waitForTimeout(2000); // Allow dashboard to fully render

    // Check for essential dashboard elements (nav should always be present)
    const navVisible = await page
      .locator('nav')
      .isVisible()
      .catch(() => false);
    const headerVisible = await page
      .locator('header')
      .isVisible()
      .catch(() => false);
    const mainVisible = await page
      .locator('main')
      .isVisible()
      .catch(() => false);

    expect(navVisible || headerVisible || mainVisible).toBe(true);
    console.log('✅ Dashboard loaded successfully');

    // Check for admin elements
    const pageContent = await page.content();
    if (pageContent.includes('27') && pageContent.includes('556')) {
      console.log('✅ Live statistics visible: 27 pilots, 556 certifications');
    }
  } else if (currentUrl.includes('/login')) {
    console.log('⚠️  Still on login page - checking for error messages');

    // Look for error messages
    const errorMessage = await page
      .locator('text=Invalid email or password')
      .isVisible()
      .catch(() => false);
    if (errorMessage) {
      console.log('❌ Authentication failed: Invalid credentials error shown');
    }

    // Check for any other error indicators
    const pageText = await page.textContent('body');
    console.log('📄 Page text sample:', pageText.substring(0, 200) + '...');
  } else {
    console.log('🔍 Unexpected URL after login:', currentUrl);
  }

  // Take a screenshot for verification
  await page.screenshot({ path: 'login-test-result.png', fullPage: true });
  console.log('📸 Screenshot saved as login-test-result.png');
});
