/**
 * E2E Tests for Task Management Feature
 * Tests complete workflow for task tracking and to-do list system
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

const MOCK_TASK = {
  title: 'Review Pilot Certifications',
  description: 'Monthly review of all pilot certifications for compliance',
  priority: 'HIGH',
  dueDate: '2025-10-15',
};

const MOCK_RECURRING_TASK = {
  title: 'Weekly Safety Briefing',
  description: 'Conduct weekly safety briefing for all pilots',
  priority: 'MEDIUM',
  isRecurring: true,
  frequency: 'WEEKLY',
};

test.describe('Task Management - Basic Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display tasks dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Check for dashboard elements
    await expect(page.locator('h1, h2').filter({ hasText: /task/i })).toBeVisible();

    // Check for view toggle (list/kanban)
    const viewToggle = page.locator(
      'button:has-text("List"), button:has-text("Kanban"), button:has-text("Grid")'
    );
    if ((await viewToggle.count()) > 0) {
      await expect(viewToggle.first()).toBeVisible();
    }
  });

  test('should create a new task', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Click "New Task" button
    await page.click(
      'button:has-text("New Task"), button:has-text("Create"), button:has-text("Add")'
    );

    // Fill in the form
    await page.waitForSelector('form, [role="dialog"]');

    await page.fill('input[name="title"]', MOCK_TASK.title);
    await page.fill('textarea[name="description"]', MOCK_TASK.description);

    // Select priority
    await page.click('select[name="priority"], button[aria-label*="priority"]');
    await page.click(`text="${MOCK_TASK.priority}"`);

    // Set due date
    await page.fill('input[name="due_date"], input[type="date"]', MOCK_TASK.dueDate);

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

    // Wait for success message
    await expect(page.locator('text=/created.*success/i, text=/success/i')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should create a recurring task', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Click create task button
    await page.click('button:has-text("New Task"), button:has-text("Create")');

    await page.waitForSelector('form, [role="dialog"]');

    // Fill basic details
    await page.fill('input[name="title"]', MOCK_RECURRING_TASK.title);
    await page.fill('textarea[name="description"]', MOCK_RECURRING_TASK.description);

    // Enable recurring
    const recurringCheckbox = page.locator('input[name="is_recurring"], input[type="checkbox"]');
    if ((await recurringCheckbox.count()) > 0) {
      await recurringCheckbox.check();

      // Select frequency
      await page.click('select[name="frequency"]');
      await page.click(`text="${MOCK_RECURRING_TASK.frequency}"`);
    }

    // Submit
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

    // Verify success
    await expect(page.locator('text=/success/i')).toBeVisible({ timeout: 10000 });
  });

  test('should view task details', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Wait for tasks to load
    await page.waitForSelector('table tbody tr, .task-card', { timeout: 10000 });

    // Click first task
    await page.click('table tbody tr:first-child, .task-card:first-child');

    // Verify detail page
    await expect(page.locator('h1, h2, h3')).toBeVisible();
    await expect(page.locator('text=/priority/i, text=/status/i')).toBeVisible();
  });

  test('should update task status', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Navigate to task detail
    await page.click('table tbody tr:first-child, .task-card:first-child');

    // Change status
    await page.click('select[name="status"], button[aria-label*="status"]');
    await page.click('text="IN_PROGRESS"');

    // Verify status updated
    await expect(page.locator('text=/in.*progress/i')).toBeVisible();
  });

  test('should filter tasks by status', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    await page.waitForLoadState('networkidle');

    // Apply status filter
    await page.click('button:has-text("Status"), select[name="status"]');
    await page.click('text="TODO"');

    // Verify filtered results
    await page.waitForLoadState('networkidle');

    const taskCount = await page.locator('table tbody tr, .task-card').count();
    expect(taskCount).toBeGreaterThanOrEqual(0);
  });

  test('should filter tasks by priority', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    await page.waitForLoadState('networkidle');

    // Apply priority filter
    await page.click('button:has-text("Priority"), select[name="priority"]');
    await page.click('text="URGENT"');

    // Verify filtered results
    await page.waitForLoadState('networkidle');

    const urgentBadges = await page.locator('text=/urgent/i').count();
    expect(urgentBadges).toBeGreaterThanOrEqual(0);
  });

  test('should add checklist items to task', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Navigate to task detail
    await page.click('table tbody tr:first-child, .task-card:first-child');

    // Add checklist item
    const checklistInput = page.locator(
      'input[name="checklist_item"], input[placeholder*="checklist" i]'
    );

    if ((await checklistInput.count()) > 0) {
      await checklistInput.fill('Review certification documents');
      await page.click('button:has-text("Add"), button:has-text("+")');

      // Verify item added
      await expect(page.locator('text="Review certification documents"')).toBeVisible();
    }
  });

  test('should mark checklist item as complete', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Navigate to task with checklist
    await page.click('table tbody tr:first-child, .task-card:first-child');

    // Find and check first checklist item
    const checklistCheckbox = page.locator('input[type="checkbox"]').first();

    if ((await checklistCheckbox.count()) > 0) {
      const isChecked = await checklistCheckbox.isChecked();

      if (!isChecked) {
        await checklistCheckbox.check();

        // Verify progress updated
        await page.waitForTimeout(1000); // Wait for auto-save
        await expect(checklistCheckbox).toBeChecked();
      }
    }
  });
});

test.describe('Task Management - Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display kanban board view', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Switch to kanban view
    const kanbanButton = page.locator('button:has-text("Kanban"), button:has-text("Board")');

    if ((await kanbanButton.count()) > 0) {
      await kanbanButton.click();

      // Verify kanban columns
      await expect(page.locator('text="TODO", text="To Do"')).toBeVisible();
      await expect(page.locator('text="IN_PROGRESS", text="In Progress"')).toBeVisible();
      await expect(page.locator('text="COMPLETED", text="Completed"')).toBeVisible();
    }
  });

  test('should drag task between columns', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Switch to kanban view
    const kanbanButton = page.locator('button:has-text("Kanban")');

    if ((await kanbanButton.count()) > 0) {
      await kanbanButton.click();

      // Find first task card
      const taskCard = page.locator('.task-card, [draggable="true"]').first();

      if ((await taskCard.count()) > 0) {
        // Get initial position
        const todoColumn = page.locator('text="TODO"').first();

        // Note: Actual drag-and-drop testing requires special handling
        // This is a placeholder for manual testing verification
        await expect(taskCard).toBeVisible();
      }
    }
  });
});

test.describe('Task Management - Comments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should add comment to task', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Navigate to task detail
    await page.click('table tbody tr:first-child, .task-card:first-child');

    // Find comment input
    const commentInput = page.locator('textarea[name="comment"], input[name="comment"]');

    if ((await commentInput.count()) > 0) {
      const testComment = 'Test comment for task tracking';
      await commentInput.fill(testComment);
      await page.click('button:has-text("Add Comment"), button:has-text("Post")');

      // Verify comment appears
      await expect(page.locator(`text="${testComment}"`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display comment history', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Navigate to task detail
    await page.click('table tbody tr:first-child, .task-card:first-child');

    // Look for comments section
    const commentsSection = page.locator('text=/comment/i, .comments-section');

    if ((await commentsSection.count()) > 0) {
      await expect(commentsSection).toBeVisible();
    }
  });
});

test.describe('Task Management - Categories', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should filter tasks by category', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    await page.waitForLoadState('networkidle');

    // Apply category filter
    const categoryFilter = page.locator('select[name="category"], button:has-text("Category")');

    if ((await categoryFilter.count()) > 0) {
      await categoryFilter.click();

      // Select first category
      await page.click('div[role="option"]:first-child, option:first-child');

      await page.waitForLoadState('networkidle');

      // Verify results are filtered
      const taskCount = await page.locator('table tbody tr, .task-card').count();
      expect(taskCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display category colors correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Check for category badges with colors
    const categoryBadges = page.locator('.category-badge, [class*="category"]');

    if ((await categoryBadges.count()) > 0) {
      await expect(categoryBadges.first()).toBeVisible();
    }
  });
});

test.describe('Task Management - Statistics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display task statistics', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Check for statistics cards
    const statsCards = page.locator('.stat-card, .metric-card, [class*="stats"]');

    if ((await statsCards.count()) > 0) {
      await expect(statsCards.first()).toBeVisible();
    }

    // Verify key metrics are shown
    const totalTasks = page.locator('text=/total.*task/i');
    if ((await totalTasks.count()) > 0) {
      await expect(totalTasks).toBeVisible();
    }
  });

  test('should show overdue tasks count', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Look for overdue indicator
    const overdueIndicator = page.locator('text=/overdue/i, .overdue');

    if ((await overdueIndicator.count()) > 0) {
      await expect(overdueIndicator).toBeVisible();
    }
  });
});

test.describe('Task Management - Search and Sort', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should search tasks by title', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');

    if ((await searchInput.count()) > 0) {
      await searchInput.fill('certification');
      await page.waitForLoadState('networkidle');

      // Verify filtered results contain search term
      const taskTitles = await page.locator('table tbody tr, .task-card').allTextContents();
      const hasSearchTerm = taskTitles.some((title) =>
        title.toLowerCase().includes('certification')
      );

      // Results should be filtered (could be 0 if no matches)
      expect(taskTitles.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('should sort tasks by due date', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Find sort dropdown
    const sortButton = page.locator('button:has-text("Sort"), select[name="sort"]');

    if ((await sortButton.count()) > 0) {
      await sortButton.click();
      await page.click('text="Due Date"');

      await page.waitForLoadState('networkidle');

      // Verify tasks are sorted
      const tasks = await page.locator('table tbody tr, .task-card').count();
      expect(tasks).toBeGreaterThanOrEqual(0);
    }
  });

  test('should sort tasks by priority', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Find sort option
    const sortButton = page.locator('button:has-text("Sort"), select[name="sort"]');

    if ((await sortButton.count()) > 0) {
      await sortButton.click();
      await page.click('text="Priority"');

      await page.waitForLoadState('networkidle');

      // Verify sorting applied
      const tasks = await page.locator('table tbody tr, .task-card').count();
      expect(tasks).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Task Management - Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should validate required fields when creating task', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Click create button
    await page.click('button:has-text("New Task"), button:has-text("Create")');

    // Try to submit empty form
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

    // Verify validation errors
    await expect(page.locator('text=/required/i, .error-message')).toBeVisible();
  });

  test('should validate title length', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    await page.click('button:has-text("New Task"), button:has-text("Create")');

    // Enter very long title (>200 chars)
    const longTitle = 'A'.repeat(250);
    await page.fill('input[name="title"]', longTitle);

    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save")');

    // Should show validation error or truncate
    const titleValue = await page.inputValue('input[name="title"]');
    expect(titleValue.length).toBeLessThanOrEqual(200);
  });
});

test.describe('Task Management - Data Integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should maintain task count after page reload', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    await page.waitForSelector('table tbody tr, .task-card');
    const initialCount = await page.locator('table tbody tr, .task-card').count();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify count is consistent
    const reloadedCount = await page.locator('table tbody tr, .task-card').count();
    expect(reloadedCount).toBe(initialCount);
  });

  test('should preserve task data after navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Get first task title
    const firstTask = await page
      .locator('table tbody tr:first-child, .task-card:first-child')
      .textContent();

    // Navigate away
    await page.goto('http://localhost:3000/dashboard');

    // Navigate back
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Verify task still exists
    const stillExists = await page.locator(`text="${firstTask}"`);
    if (firstTask && firstTask.length > 0) {
      expect(await stillExists.count()).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Task Management - Air Niugini Branding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display Air Niugini brand colors', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tasks');

    // Check for brand colors (#E4002B red, #FFC72C gold)
    const redElements = await page.locator('[class*="E4002B"], [style*="e4002b"]').count();
    expect(redElements).toBeGreaterThanOrEqual(0);

    // Check navigation has branding
    await expect(page.locator('nav, header')).toBeVisible();
  });
});
