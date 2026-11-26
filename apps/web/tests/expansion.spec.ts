import { expect, test } from '@playwright/test';

test('read a chapter and follow its shareable Sanskrit citations', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/search/');
  await page.getByRole('searchbox').fill('द्रौपदी');
  await page.getByRole('link', { name: 'Who had authority to stake Draupadī?' }).click();
  await expect(page).toHaveURL(/parva\/02\/#chapter-60$/);
  await page.locator('#chapter-60').getByText('Who had authority to stake Draupadī?', { exact: true }).click();
  const source = page.locator('#passage-02060007c');
  await expect(source.getByRole('link', { name: /Sanskrit/ })).toHaveAttribute('href', /MBh02\.txt#:~:text=02060007c$/);
  await source.getByRole('link', { name: 'Link to passage 2.60.7' }).press('Enter');
  await expect(page).toHaveURL(/#passage-02060007c$/);
  await expect(page.locator('#chapter-57')).toContainText('Index and primary source only');
  await expect(page.locator('#chapter-60')).toContainText('Chapter annotation');
  await expect(page.locator('#chapter-60')).toContainText('Selected scene reading');
});

test('mind map traces Draupadī to exile and restores the chosen branch', async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/mind-map/?node=ma-person-draupadi');
  const map = page.getByRole('region', { name: 'Selected node and nearby connections' });
  const dice = map.getByRole('button', { name: 'Follow The dice match', exact: true });
  await expect(dice).toBeEnabled();
  await dice.press('Enter');
  await expect(page.getByRole('heading', { name: 'The dice match', exact: true })).toBeFocused();
  await page.getByLabel('Relationship').selectOption('leads to');
  await page.getByRole('button', { name: 'Inspect connection with Into the forest', exact: true }).click();
  const evidence = page.getByRole('article', { name: 'Relationship evidence' });
  await expect(evidence).toContainText('BORI 2.66.18–19');
  await expect(evidence.getByRole('link', { name: /evidence source/ })).toHaveAttribute('href', /02066018a$/);
  await page.reload();
  await expect(evidence).toBeVisible();
  await page.locator('.map-neighbors').getByRole('button', { name: 'Into the forest', exact: true }).click();
  await expect(page).toHaveURL(/node=ma-episode-exile-start/);
  await page.getByRole('button', { name: 'Back a node' }).click();
  await expect(evidence).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  await page.locator('.map-neighbors').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('map-draupadi-360.png'), fullPage: true });
});

test('mind map connects the omen to interpretation and calculation', async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/mind-map/?node=ma-chapter-6-2');
  await page.getByRole('button', { name: 'Follow Oak’s meridian reading', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Oak’s meridian reading', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Inspect connection with Arundhatī–Vasiṣṭha research/ }).click();
  await expect(page.getByRole('article', { name: 'Relationship evidence' })).toContainText('awaits independent review');
  await page.screenshot({ path: info.outputPath('map-sky-evidence-1280.png'), fullPage: true });
  await page.getByRole('link', { name: 'Open evidence source ↗' }).click();
  await expect(page.getByText('Historical result · Unavailable', { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Oak’s meridian reading', exact: true })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Relationship evidence' })).toBeVisible();
});
