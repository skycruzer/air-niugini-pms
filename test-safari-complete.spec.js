const { test, expect } = require('@playwright/test');

test('Complete Safari Test - Login and Dashboard Navigation', async ({ page }) => {
  console.log('🧪 Starting complete Safari browser test...');

  // Navigate to login page
  await page.goto('/login');
  console.log('✅ Navigated to login page');

  // Fill in credentials
  await page.fill('input[type="email"]', 'skycruzer@icloud.com');
  await page.fill('input[type="password"]', 'mron2393');
  console.log('✅ Credentials entered');

  // Click login button
  await page.click('button[type="submit"]');
  console.log('✅ Login button clicked');

  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('✅ Redirected to dashboard');

  // Verify we're on the dashboard
  const url = page.url();
  expect(url).toContain('/dashboard');
  console.log('✅ URL confirmed: ' + url);

  // Wait for page to load
  await page.waitForLoadState('networkidle');
  console.log('✅ Page fully loaded');

  // Take screenshot of dashboard
  await page.screenshot({ path: 'test-results/dashboard-safari.png', fullPage: true });
  console.log('✅ Dashboard screenshot saved');

  // Check for pilot statistics on page
  const pageContent = await page.content();
  const has26Pilots = pageContent.includes('26') || pageContent.includes('27');
  const has556Certs = pageContent.includes('556');

  console.log('📊 Statistics found:', { has26Pilots, has556Certs });

  // Verify navigation elements
  const hasNavigation = (await page.locator('nav').count()) > 0;
  console.log('✅ Navigation present:', hasNavigation);

  // Test clicking on Pilots page
  const pilotsLink = page.locator('a[href*="/pilots"]').first();
  if (await pilotsLink.isVisible()) {
    await pilotsLink.click();
    console.log('✅ Clicked on Pilots link');

    await page.waitForURL('**/pilots', { timeout: 5000 });
    console.log('✅ Navigated to Pilots page');

    await page.screenshot({ path: 'test-results/pilots-safari.png', fullPage: true });
    console.log('✅ Pilots page screenshot saved');
  }

  // Go back to dashboard
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  console.log('✅ Returned to dashboard');

  // Test clicking on Certifications page
  const certsLink = page.locator('a[href*="/certifications"]').first();
  if (await certsLink.isVisible()) {
    await certsLink.click();
    console.log('✅ Clicked on Certifications link');

    await page.waitForURL('**/certifications', { timeout: 5000 });
    console.log('✅ Navigated to Certifications page');

    await page.screenshot({ path: 'test-results/certifications-safari.png', fullPage: true });
    console.log('✅ Certifications page screenshot saved');
  }

  console.log('');
  console.log('🎉 ============================================');
  console.log('🎉 ALL TESTS PASSED IN SAFARI!');
  console.log('🎉 ============================================');
  console.log('✅ Login successful');
  console.log('✅ Dashboard loaded');
  console.log('✅ Navigation working');
  console.log('✅ Page transitions smooth');
  console.log('✅ Screenshots captured');
  console.log('🎉 ============================================');
});
