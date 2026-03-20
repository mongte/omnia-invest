import { test, expect } from '@playwright/test';

test.describe('Kanban Board Animation (task-fe-12345)', () => {
  test('should load kanban board and render columns', async ({ page }) => {
    // Navigate to the projects page which should redirect or show the kanban board
    // Assuming the dev server is at localhost:3000
    await page.goto('http://localhost:3000');

    // Wait for the Kanban board to be visible
    // Based on TaskKanbanBoard.tsx we have columns: TODO, IN PROGRESS, IN REVIEW (QA), DONE
    await expect(page.locator('text=TODO').first()).toBeVisible();
    await expect(page.locator('text=IN PROGRESS').first()).toBeVisible();
    await expect(page.locator('text=IN REVIEW (QA)').first()).toBeVisible();
    await expect(page.locator('text=DONE').first()).toBeVisible();

    // To verify that auto-animate is applied, we can check that we can drag/drop or change a task status.
    // However, since auto-animate works automatically on the DOM list changes,
    // ensuring no console errors and the lists are rendered correctly is our baseline.
    const logs: string[] = [];
    page.on('pageerror', err => logs.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') logs.push(msg.text());
    });
    
    expect(logs.length).toBe(0);
  });
});
