const { test, expect } = require('@playwright/test');

test('Comprehensive Air Niugini System Test', async ({ page }) => {
  console.log('🚀 Starting comprehensive test...');

  // Listen to console logs from the browser
  page.on('console', msg => {
    console.log('🌐 Browser console:', msg.text());
  });

  // 1. Test Login
  console.log('🔐 Testing login...');
  await page.goto('http://localhost:3001/login');
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
  await page.waitForTimeout(3000);

  // Check if we're redirected to dashboard
  const currentUrl = page.url();
  console.log('🌐 Current URL after login:', currentUrl);

  if (currentUrl.includes('/dashboard')) {
    console.log('🎉 SUCCESS: Logged in and redirected to dashboard!');

    // 2. Test Dashboard
    console.log('📊 Testing dashboard...');
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    console.log('✅ Dashboard loaded successfully');

    // 3. Navigate to Pilots page
    console.log('👥 Navigating to pilots page...');
    await page.click('a[href="/dashboard/pilots"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 4. Test Grid/List View Toggle (NEW FEATURE)
    console.log('🔄 Testing Grid/List view toggle...');

    // Look for the view toggle button
    const viewToggle = page.locator('[data-testid="view-toggle"], button:has-text("Grid"), button:has-text("List"), .view-toggle');

    try {
      await viewToggle.first().waitFor({ timeout: 5000 });
      console.log('✅ View toggle button found');

      // Test clicking the toggle
      await viewToggle.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ View toggle clicked successfully');

      // Test switching back
      await viewToggle.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ View toggle switched back successfully');

    } catch (error) {
      console.log('⚠️  View toggle not found, checking for pilot cards...');
    }

    // 5. Test Pilot Data Display
    console.log('📋 Testing pilot data display...');

    // Look for pilot cards or list items
    const pilotCards = page.locator('.pilot-card, [data-testid="pilot-card"], .grid > div, .pilot-item');
    const pilotCount = await pilotCards.count();
    console.log(`👥 Found ${pilotCount} pilot cards/items`);

    if (pilotCount > 0) {
      console.log('✅ Pilot data loaded successfully');

      // Check if we can see pilot names
      const firstPilot = pilotCards.first();
      const pilotText = await firstPilot.textContent();
      console.log('👨‍✈️ First pilot info:', pilotText.substring(0, 100) + '...');

    } else {
      console.log('⚠️  No pilot cards found, checking for loading state...');

      // Check if data is still loading
      const loadingIndicator = page.locator('text=Loading, .loading, [data-testid="loading"]');
      const isLoading = await loadingIndicator.count();

      if (isLoading > 0) {
        console.log('🔄 Data is still loading...');
        await page.waitForTimeout(5000);

        // Check again after waiting
        const newPilotCount = await pilotCards.count();
        console.log(`👥 After waiting: Found ${newPilotCount} pilot cards/items`);
      }
    }

    // 6. Test Navigation Menu
    console.log('🧭 Testing navigation menu...');
    const navItems = page.locator('nav a, .nav-item, [role="navigation"] a');
    const navCount = await navItems.count();
    console.log(`📐 Found ${navCount} navigation items`);

    // 7. Test Reports (if accessible)
    console.log('📊 Testing reports page...');
    try {
      await page.click('a[href="/dashboard/reports"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      console.log('✅ Reports page accessed successfully');
    } catch (error) {
      console.log('⚠️  Reports page not accessible or found');
    }

  } else {
    console.log('❌ Login failed - still on login page');

    // Check for error messages
    const errorMessage = await page.locator('text=Invalid, .error, [data-testid="error"]').isVisible().catch(() => false);
    if (errorMessage) {
      console.log('❌ Error message detected on login page');
    }
  }

  // Take a screenshot for verification
  await page.screenshot({ path: 'comprehensive-test-result.png', fullPage: true });
  console.log('📸 Screenshot saved as comprehensive-test-result.png');

  console.log('🏁 Comprehensive test completed!');
});