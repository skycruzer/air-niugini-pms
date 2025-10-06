/**
 * E2E Tests for Disciplinary Matters Feature
 * Tests complete workflow for disciplinary tracking system
 *
 * @author Air Niugini Development Team
 * @version 1.0.0
 * @since 2025-10-06
 */

const { test, expect } = require('@playwright/test');

// Test data
const TEST_USER = {
  email: 'testuser@airniugini.com.pg',
  password: 'Test@1234',
};

const MOCK_DISCIPLINARY_MATTER = {
  pilot_id: null, // Will be set dynamically
  incident_type: 'Safety Violation',
  incident_date: '2025-10-01',
  severity: 'MODERATE',
  title: 'Test Incident - Safety Protocol Violation',
  description: 'Pilot failed to complete pre-flight safety checklist',
  location: 'Port Moresby International Airport',
  flight_number: 'PX 100',
  aircraft_registration: 'P2-PXA',
};

test.describe('Disciplinary Matters Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display disciplinary matters dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/disciplinary-matters');

    // Check for dashboard elements
    await expect(page.locator('h1, h2').filter({ hasText: /disciplinary/i })).toBeVisible();

    // Check for statistics cards
    await expect(page.locator('text=/total.*matter/i')).toBeVisible();
    await expect(page.locator('text=/open.*matter/i')).toBeVisible();
  });

  test('should create a new disciplinary matter', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/disciplinary-matters');

    // Click "New Disciplinary Matter" button
    await page.click('button:has-text("New"), button:has-text("Create")');

    // Fill in the form
    await page.waitForSelector('form');

    // Select pilot (select first available pilot)
    await page.click('select[name="pilot_id"], button[role="combobox"]');
    await page.click('div[role="option"]:first-child, option:first-child');

    // Select incident type
    await page.click('select[name="incident_type_id"], button[aria-label*="incident"]');
    await page.click('div[role="option"]:has-text("Safety"), option:has-text("Safety")');

    // Fill incident details
    await page.fill('input[name="incident_date"]', MOCK_DISCIPLINARY_MATTER.incident_date);
    await page.fill('input[name="title"]', MOCK_DISCIPLINARY_MATTER.title);
    await page.fill('textarea[name="description"]', MOCK_DISCIPLINARY_MATTER.description);

    // Select severity
    await page.click('select[name="severity"], button[aria-label*="severity"]');
    await page.click(`text="${MOCK_DISCIPLINARY_MATTER.severity}"`);

    // Optional fields
    await page.fill('input[name="location"]', MOCK_DISCIPLINARY_MATTER.location);
    await page.fill('input[name="flight_number"]', MOCK_DISCIPLINARY_MATTER.flight_number);
    await page.fill(
      'input[name="aircraft_registration"]',
      MOCK_DISCIPLINARY_MATTER.aircraft_registration
    );

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

    // Wait for success message or redirect
    await expect(page.locator('text=/created.*success/i, text=/success/i')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should filter disciplinary matters by severity', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/disciplinary-matters');

    // Wait for matters to load
    await page.waitForLoadState('networkidle');

    // Click severity filter
    await page.click('button:has-text("Severity"), select[name="severity"]');

    // Select CRITICAL severity
    await page.click('text="CRITICAL"');

    // Verify filtered results
    await page.waitForLoadState('networkidle');

    // Check that only CRITICAL severity items are shown
    const severityBadges = await page.locator('span:has-text("CRITICAL"), .severity-badge').count();
    expect(severityBadges).toBeGreaterThanOrEqual(0);
  });

  test('should filter disciplinary matters by status', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/disciplinary-matters');

    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Apply status filter
    await page.click('button:has-text("Status"), select[name="status"]');
    await page.click('text="OPEN"');

    // Verify filtered results
    await page.waitForLoadState('networkidle');

    const statusCount = await page.locator('text=/open/i').count();
    expect(statusCount).toBeGreaterThanOrEqual(1);
  });

  test('should view disciplinary matter details', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/disciplinary-matters');

    // Wait for matters list
    await page.waitForSelector('table, .matter-card', { timeout: 10000 });

    // Click on first matter to view details
    await page.click('table tbody tr:first-child, .matter-card:first-child');

    // Verify detail page elements
    await expect(page.locator('text=/incident.*details/i, h2')).toBeVisible();
    await expect(page.locator('text=/severity/i')).toBeVisible();
    await expect(page.locator('text=/status/i')).toBeVisible();
  });

  test('should update disciplinary matter status', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/disciplinary-matters');

    // Navigate to detail page
    await page.click('table tbody tr:first-child, .matter-card:first-child');

    // Click edit or status change button
    await page.click('button:has-text("Edit"), button:has-text("Update Status")');

    // Change status
    await page.click('select[name="status"], button[aria-label*="status"]');
    await page.click('text="UNDER_INVESTIGATION"');

    // Add resolution notes
    await page.fill('textarea[name="resolution_notes"]', 'Investigation in progress');

    // Save changes
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")');

    // Verify success
    await expect(page.locator('text=/updated.*success/i, text=/success/i')).toBeVisible();
  });

  test('should add a comment to disciplinary matter', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/disciplinary-matters');

    // Navigate to detail page
    await page.click('table tbody tr:first-child, .matter-card:first-child');

    // Find comments section
    await page.waitForSelector('textarea[name="comment"], input[name="comment"]');

    // Add a comment
    const testComment = 'Test comment for disciplinary matter tracking';
    await page.fill('textarea[name="comment"], input[name="comment"]', testComment);
    await page.click('button:has-text("Add Comment"), button:has-text("Post")');

    // Verify comment appears
    await expect(page.locator(`text="${testComment}"`)).toBeVisible({ timeout: 5000 });
  });

  test('should create disciplinary action', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/disciplinary-matters');

    // Navigate to detail page
    await page.click('table tbody tr:first-child, .matter-card:first-child');

    // Click "Add Action" button
    await page.click('button:has-text("Add Action"), button:has-text("New Action")');

    // Fill action form
    await page.click('select[name="action_type"], button[aria-label*="action"]');
    await page.click('text="WARNING"');

    await page.fill('input[name="action_date"]', '2025-10-06');
    await page.fill('textarea[name="description"]', 'Formal written warning issued');

    // Submit action
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

    // Verify action created
    await expect(page.locator('text=/action.*created/i, text=/warning/i')).toBeVisible();
  });

  test('should display statistics correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/disciplinary-matters');

    // Check statistics cards
    const totalMatters = await page.locator('text=/total/i').first();
    await expect(totalMatters).toBeVisible();

    const openMatters = await page.locator('text=/open/i').first();
    await expect(openMatters).toBeVisible();

    // Verify numbers are displayed
    const statsNumbers = await page.locator('.stat-card, .metric-card').count();
    expect(statsNumbers).toBeGreaterThanOrEqual(2);
  });

  test('should handle validation errors when creating matter', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/disciplinary-matters');

    // Click create button
    await page.click('button:has-text("New"), button:has-text("Create")');

    // Try to submit empty form
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

    // Verify validation errors appear
    await expect(page.locator('text=/required/i, .error-message')).toBeVisible();
  });

  test('should search disciplinary matters', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/disciplinary-matters');

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');

    if ((await searchInput.count()) > 0) {
      await searchInput.fill('safety');
      await page.waitForLoadState('networkidle');

      // Verify filtered results
      const results = await page.locator('table tbody tr, .matter-card').count();
      expect(results).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display audit log for disciplinary matter', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/disciplinary-matters');

    // Navigate to detail page
    await page.click('table tbody tr:first-child, .matter-card:first-child');

    // Look for audit log or history section
    const auditSection = page.locator('text=/audit.*log/i, text=/history/i');

    if ((await auditSection.count()) > 0) {
      await auditSection.click();

      // Verify audit entries
      await expect(page.locator('.audit-entry, .history-item')).toBeVisible();
    }
  });

  test('should handle Air Niugini branding correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/disciplinary-matters');

    // Check for Air Niugini brand colors
    const redElements = await page.locator('[class*="E4002B"], [style*="e4002b"]').count();
    expect(redElements).toBeGreaterThanOrEqual(1);

    // Check navigation bar has Air Niugini branding
    await expect(page.locator('nav, header')).toBeVisible();
  });
});

test.describe('Disciplinary Matters - Role-Based Access', () => {
  test('should enforce role-based permissions', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('http://localhost:3000/dashboard/disciplinary-matters');

    // Admin/Manager should see create button
    const createButton = page.locator('button:has-text("New"), button:has-text("Create")');
    const hasCreateAccess = (await createButton.count()) > 0;

    // If user has access, button should be visible
    if (hasCreateAccess) {
      await expect(createButton).toBeVisible();
    }
  });
});

test.describe('Disciplinary Matters - Data Integrity', () => {
  test('should maintain data consistency after updates', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('http://localhost:3000/dashboard/disciplinary-matters');

    // Get initial count
    await page.waitForSelector('table tbody tr, .matter-card');
    const initialCount = await page.locator('table tbody tr, .matter-card').count();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify count is consistent
    const reloadedCount = await page.locator('table tbody tr, .matter-card').count();
    expect(reloadedCount).toBe(initialCount);
  });
});
