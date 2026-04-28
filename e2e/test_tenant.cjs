const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const networkLogs = [];
  let failed = false;

  page.on('response', resp => {
    if (resp.url().includes(':8000')) {
      networkLogs.push(`${resp.request().method()} ${resp.url().replace('http://localhost:8000','')} -> ${resp.status()}`);
    }
  });

  // Clear localStorage to force fresh defaultBaseUrl
  await page.addInitScript(() => localStorage.clear());
  await page.goto('http://localhost:3000/pp1/tenants');
  await page.waitForLoadState('networkidle');

  const baseUrlVal = await page.locator('input:not([type=password])').first().inputValue();
  console.log('baseUrl default:', baseUrlVal);
  if (!baseUrlVal.includes('8000')) {
    console.error('❌ FAIL: baseUrl not pointing to :8000, got:', baseUrlVal);
    failed = true;
  }

  await page.locator('input[type=password]').fill('sk-admin-demo');
  await page.getByRole('button', { name: 'Save & Check' }).click();
  await page.waitForTimeout(2500);

  let statuses = await page.locator('p').allTextContents();
  const afterSave = statuses.filter(s => s.trim().length > 5 && s.trim().length < 200);
  console.log('After Save & Check:', afterSave.join(' | '));
  console.log('Network after save:', networkLogs.join(', '));

  // Check tenants loaded
  if (!statuses.join(' ').toLowerCase().includes('tenants loaded')) {
    console.error('❌ FAIL: Tenants not loaded after Save & Check');
    failed = true;
  }

  // Create a tenant
  const uniqueName = 'ui-test-' + Date.now();
  await page.locator('input[placeholder="acme-labs"]').fill(uniqueName);
  await page.getByRole('button', { name: 'Create Tenant' }).click();
  await page.waitForTimeout(2000);

  statuses = await page.locator('p').allTextContents();
  const afterCreate = statuses.filter(s => s.trim().length > 5 && s.trim().length < 200);
  console.log('After Create:', afterCreate.join(' | '));
  console.log('All network:', networkLogs.join(', '));

  // Check for tenant name in the page (should appear in table)
  const pageText = await page.textContent('body');
  if (pageText && pageText.includes(uniqueName)) {
    console.log(`\n✅ PASS: Tenant "${uniqueName}" created and visible in table`);
  } else {
    const statusText = statuses.join(' ');
    if (statusText.toLowerCase().includes('created (')) {
      console.log(`\n✅ PASS: Tenant creation confirmed via status message`);
    } else {
      console.error(`\n❌ FAIL: Tenant "${uniqueName}" not found in page. Status: ${afterCreate.join(' | ')}`);
      failed = true;
    }
  }

  await browser.close();
  if (failed) process.exit(1);
})().catch(e => { console.error(e.message); process.exit(1); });
