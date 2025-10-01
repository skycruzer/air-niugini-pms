const { test, expect } = require('@playwright/test');

test.describe('Air Niugini PMS Deployment Test', () => {
  test('Homepage loads and displays correct statistics', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:3004');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check page title
    await expect(page).toHaveTitle(/Air Niugini/);

    // Verify Air Niugini branding is present
    await expect(page.locator('h1:has-text("Air Niugini")')).toBeVisible();
    await expect(
      page.locator('p:has-text("Papua New Guinea\'s National Airline")').first()
    ).toBeVisible();

    // Check that statistics are displayed (should show live data)
    await expect(page.locator('text=27')).toBeVisible(); // Total pilots
    await expect(page.locator('text=556')).toBeVisible(); // Certifications

    // Verify current roster period is displayed
    await expect(page.locator('text=RP')).toBeVisible();

    // Check CTA buttons
    await expect(page.locator('text=Access Dashboard')).toBeVisible();

    console.log('✅ Homepage test passed');
  });

  test('Login page loads correctly', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3004/login');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Verify Air Niugini branding
    await expect(page.locator('text=Air Niugini')).toBeVisible();

    console.log('✅ Login page test passed');
  });

  test('API endpoints are responding', async ({ page }) => {
    // Test dashboard stats API
    const statsResponse = await page.request.get('http://localhost:3004/api/dashboard/stats');
    expect(statsResponse.status()).toBe(200);

    const statsData = await statsResponse.json();
    expect(statsData.totalPilots).toBe(27);
    expect(statsData.certifications).toBe(556);

    // Test pilots API
    const pilotsResponse = await page.request.get('http://localhost:3004/api/pilots');
    expect(pilotsResponse.status()).toBe(200);

    const pilotsData = await pilotsResponse.json();
    expect(pilotsData.success).toBe(true);
    expect(pilotsData.data.length).toBe(27);

    // Test check types API
    const checkTypesResponse = await page.request.get('http://localhost:3004/api/check-types');
    expect(checkTypesResponse.status()).toBe(200);

    const checkTypesData = await checkTypesResponse.json();
    expect(checkTypesData.success).toBe(true);
    expect(checkTypesData.data.length).toBe(34);

    console.log('✅ API endpoints test passed');
  });

  test('Authentication flow works', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3004/login');

    // Fill in login credentials
    await page.fill('input[type="email"]', 'skycruzer@icloud.com');
    await page.fill('input[type="password"]', 'mron2393');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation or response
    await page.waitForLoadState('networkidle');

    // Check if we're redirected to dashboard or if login was successful
    // (This might redirect to dashboard or show an error, depending on auth setup)
    const currentUrl = page.url();
    console.log('Current URL after login attempt:', currentUrl);

    console.log('✅ Authentication test completed');
  });

  test('Mobile responsiveness check', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3004');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that content is still visible on mobile
    await expect(page.locator('h1:has-text("Air Niugini")')).toBeVisible();
    await expect(page.locator('text=27')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1:has-text("Air Niugini")')).toBeVisible();

    console.log('✅ Mobile responsiveness test passed');
  });
});
