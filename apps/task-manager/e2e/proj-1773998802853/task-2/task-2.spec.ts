import { test, expect } from '@playwright/test';

test('task-2: Render fallback UI on invalid project data instead of crashing', async ({ page }) => {
  // Mock the GET /api/projects response to return invalid data
  await page.route('**/api/projects', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: "proj-1773998802853", title: "Valid Project", color: "blue", icon: "Folder" },
        // Invalid project, missing required fields for UI rendering
        { id: "proj-invalid", invalidData: true }
      ])
    });
  });

  await page.goto('http://localhost:3000/projects/proj-1773998802853');
  
  // Wait for network idle to ensure the mock is loaded
  // networkidle removed due to potential timeout

  // If the error boundary works, "Valid Project" should still be visible, and the app shouldn't completely crash (which would result in a blank page or default Next.js error page).
  const validProject = page.getByText('Valid Project', { exact: false }).first();
  await expect(validProject).toBeVisible();
});
