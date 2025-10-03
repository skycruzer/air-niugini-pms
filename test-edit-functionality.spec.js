const { test, expect } = require('@playwright/test');

test.describe('Edit Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

    // Wait for login form to be ready
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Login as admin
    await page.fill('input[type="email"]', 'admin@airniugini.com.pg');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('Pilot Edit - Should save pilot data successfully', async ({ page }) => {
    console.log('🧪 Test: Starting pilot edit test...');

    // Navigate to pilots page
    await page.goto('http://localhost:3000/dashboard/pilots');
    await page.waitForLoadState('networkidle');

    // Wait for pilots to load
    await page.waitForSelector('[data-testid="pilot-row"], .pilot-card, text=/Captain|First Officer/', {
      timeout: 10000,
    });

    // Find and click the first edit button
    const editButton = page.locator('button:has-text("Edit"), button[aria-label*="Edit"]').first();
    await editButton.waitFor({ state: 'visible', timeout: 5000 });
    await editButton.click();

    console.log('🧪 Test: Clicked edit button, waiting for modal...');

    // Wait for modal to open
    await page.waitForSelector('[role="dialog"], .modal, text=/Edit Pilot/i', { timeout: 5000 });

    console.log('🧪 Test: Modal opened, looking for form fields...');

    // Get the current first name value
    const firstNameInput = page.locator('input[name="first_name"], input[placeholder*="First"]').first();
    await firstNameInput.waitFor({ state: 'visible', timeout: 5000 });
    const originalFirstName = await firstNameInput.inputValue();

    console.log('🧪 Test: Original first name:', originalFirstName);

    // Modify the first name (add test suffix)
    const newFirstName = originalFirstName + '_TEST';
    await firstNameInput.fill(newFirstName);

    console.log('🧪 Test: Changed first name to:', newFirstName);

    // Find and click the save/update button
    const saveButton = page.locator(
      'button:has-text("Update Pilot"), button:has-text("Save"), button[type="submit"]'
    ).last();

    await saveButton.waitFor({ state: 'visible', timeout: 5000 });

    console.log('🧪 Test: Clicking save button...');

    // Listen for console logs from the page
    page.on('console', (msg) => {
      if (msg.text().includes('PilotEditModal') || msg.text().includes('updatePilot')) {
        console.log('🔧 Browser Console:', msg.text());
      }
    });

    // Click save button
    await saveButton.click();

    console.log('🧪 Test: Save button clicked, waiting for response...');

    // Wait for either success or error
    try {
      // Wait for modal to close (success) or error message
      await Promise.race([
        page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 }),
        page.waitForSelector('text=/error|failed/i', { timeout: 5000 }),
      ]);

      // Check if modal is still open (indicates error)
      const modalVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);

      if (modalVisible) {
        console.log('❌ Test: Modal still open - checking for errors...');

        // Look for error messages
        const errorText = await page
          .locator('text=/error|failed|invalid/i')
          .first()
          .textContent()
          .catch(() => 'No error message found');

        console.log('❌ Test: Error message:', errorText);

        // Take screenshot for debugging
        await page.screenshot({ path: 'test-results/pilot-edit-error.png' });

        throw new Error(`Pilot edit failed: ${errorText}`);
      } else {
        console.log('✅ Test: Modal closed - update appears successful');

        // Revert the change
        await page.reload();
        await page.waitForLoadState('networkidle');

        const editButtonAfter = page.locator('button:has-text("Edit")').first();
        await editButtonAfter.click();
        await page.waitForSelector('[role="dialog"]');

        const firstNameAfter = page.locator('input[name="first_name"]').first();
        await firstNameAfter.fill(originalFirstName);

        const saveButtonAfter = page.locator('button:has-text("Update Pilot")').last();
        await saveButtonAfter.click();

        console.log('✅ Test: Reverted changes');
      }
    } catch (error) {
      console.log('❌ Test: Error during save:', error.message);
      await page.screenshot({ path: 'test-results/pilot-edit-timeout.png' });
      throw error;
    }
  });

  test('Certification Edit - Should save certification data successfully', async ({ page }) => {
    console.log('🧪 Test: Starting certification edit test...');

    // Navigate to pilots page
    await page.goto('http://localhost:3000/dashboard/pilots');
    await page.waitForLoadState('networkidle');

    // Click on first pilot to view details
    const pilotLink = page.locator('a[href*="/dashboard/pilots/"], text=/Captain|First Officer/').first();
    await pilotLink.click();

    console.log('🧪 Test: Navigated to pilot detail page');

    // Wait for pilot detail page to load
    await page.waitForURL('**/dashboard/pilots/**');
    await page.waitForLoadState('networkidle');

    // Find and click "Manage Certifications" button
    const manageCertsButton = page.locator(
      'button:has-text("Manage Certifications"), a:has-text("Manage Certifications"), text=/Manage Certifications/i'
    ).first();

    await manageCertsButton.waitFor({ state: 'visible', timeout: 5000 });
    await manageCertsButton.click();

    console.log('🧪 Test: Clicked Manage Certifications');

    // Wait for certifications page
    await page.waitForURL('**/certifications');
    await page.waitForLoadState('networkidle');

    // Find first date input and set a future date
    const dateInput = page.locator('input[type="date"]').first();
    await dateInput.waitFor({ state: 'visible', timeout: 5000 });

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateString = futureDate.toISOString().split('T')[0];

    console.log('🧪 Test: Setting date to:', futureDateString);

    await dateInput.fill(futureDateString);

    // Listen for console logs
    page.on('console', (msg) => {
      if (msg.text().includes('Certification') || msg.text().includes('API')) {
        console.log('🔧 Browser Console:', msg.text());
      }
    });

    // Click save button
    const saveButton = page.locator('button:has-text("Save Certifications")').first();
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });

    console.log('🧪 Test: Clicking Save Certifications button...');
    await saveButton.click();

    // Wait for navigation or success
    try {
      await page.waitForURL('**/dashboard/pilots/**', { timeout: 5000 });
      console.log('✅ Test: Successfully navigated back to pilot detail page');
    } catch (error) {
      console.log('❌ Test: Did not navigate back - checking for errors...');

      const errorText = await page
        .locator('text=/error|failed/i')
        .first()
        .textContent()
        .catch(() => 'No error message found');

      console.log('❌ Test: Error message:', errorText);
      await page.screenshot({ path: 'test-results/certification-edit-error.png' });

      throw new Error(`Certification edit failed: ${errorText}`);
    }
  });
});
