import { test, expect } from '@playwright/test';

test('create tenant via UI', async ({ page }) => {
  const networkLogs: string[] = [];
  page.on('response', resp => {
    if (resp.url().includes(':8000')) {
      networkLogs.push(`${resp.request().method()} ${resp.url()} -> ${resp.status()}`);
    }
  });

  await page.goto('http://localhost:3000/pp1/tenants');
  await page.waitForLoadState('networkidle');

  const baseUrlVal = await page.locator('input:not([type=password])').first().inputValue();
  console.log('baseUrl:', baseUrlVal);

  await page.locator('input[type=password]').fill('sk-admin-demo');
  await page.getByRole('button', { name: 'Save & Check' }).click();
  await page.waitForTimeout(2500);

  const statuses = await page.locator('p').allTextContents();
  console.log('After save:', statuses.filter(s => s.trim().length > 5 && s.trim().length < 200).join(' | '));
  console.log('Network:', networkLogs.join(', '));

  const uniqueName = 'ui-test-' + Date.now();
  await page.locator('input[placeholder="acme-labs"]').fill(uniqueName);
  await page.getByRole('button', { name: 'Create Tenant' }).click();
  await page.waitForTimeout(2000);

  const afterStatuses = await page.locator('p').allTextContents();
  const statusJoined = afterStatuses.join(' ');
  console.log('After create:', afterStatuses.filter(s => s.trim().length > 5 && s.trim().length < 200).join(' | '));
  console.log('All network:', networkLogs.join(', '));

  expect(statusJoined).toContain('created');
});
