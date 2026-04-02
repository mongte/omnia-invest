import { test, expect } from '@playwright/test';

test('task-1: Fix project selection and routing issue', async ({ page }) => {
  // Go to initial project
  await page.goto('http://localhost:3000/projects/proj-1773998802853');

  // Wait for the UI to settle
  // networkidle removed due to potential timeout

  // The sidebar should contain the other project "pharos-lab-start" (id: proj-1774348898926)
  const otherProject = page.getByText('pharos-lab-start', { exact: false }).first();
  await expect(otherProject).toBeVisible();

  // Click it
  await otherProject.click();

  // URL should dynamically update
  await expect(page).toHaveURL(/.*\/projects\/proj-1774348898926$/);
});
