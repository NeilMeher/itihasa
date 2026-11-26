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

test('Sītā’s route keeps literary locations and source links distinct', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ramayana/?scene=sita-exile&person=sita');
  await expect(page.getByRole('heading', { name: 'Sītā chooses to go' })).toBeVisible();
  await expect(page.getByLabel('Follow a person')).toHaveValue('sita');
  await page.locator('.route-person').getByRole('button', { name: 'Sītā recognizes the ring' }).click();
  await expect(page).toHaveURL(/scene=ring&person=sita/);
  await expect(page.locator('.route-place-detail')).toContainText('Literary location');
  await page.locator('.route-scene').getByRole('link', { name: 'Open in the mind map →' }).click();
  await expect(page.getByRole('heading', { name: 'Sītā recognizes the ring', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Inspect connection with Laṅkā and the Aśoka grove', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Relationship evidence' })).toContainText('Baroda Critical Edition 5.34');
  await page.goBack();
  await expect(page.locator('.route-scene').getByRole('heading', { name: 'Sītā recognizes the ring' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('sita-route-390.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.locator('.route-scene').getByRole('link', { name: /annotated sarga/ }).click();
  await expect(page.locator('.ram-sargas > li')).toHaveCount(66);
  await expect(page.locator('#sarga-34')).toContainText('Sītā recognizes the ring');
});

test('Rāmāyaṇa pole test distinguishes an attributed claim from a geometry calculation', async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/ramayana/?scene=march-sky');
  await page.getByRole('link', { name: /Open related investigation/ }).click();
  await expect(page.getByText(/Historical date · Unavailable/)).toBeVisible();
  await expect(page.getByRole('status')).toContainText('3.61°');
  await page.getByLabel('Distance threshold').selectOption('2');
  await expect(page.getByRole('status')).toContainText('outside');
  await page.getByRole('slider').press('End');
  await expect(page.getByRole('status')).toContainText('51.19°');
  await page.getByLabel('Tested identity').selectOption('unknown');
  await expect(page.getByRole('status')).toContainText('supplies no Vega constraint');
  await page.getByText('Catalogue, frame and model check').click();
  await page.screenshot({ path: info.outputPath('vega-research-1280.png'), fullPage: true });
  await page.getByRole('link', { name: /calendar lesson/ }).click();
  await expect(page).toHaveURL(/festivals\/rama-navami\//);
});

test('Raigad connects a capital, a terrain case, a later ruler and documentary evidence', async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/swarajya/history/?event=capital&place=raigad');
  await expect(page.getByRole('heading', { name: 'Coronation at Raigad', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'How much could the fort supply itself?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explore the case →' })).toHaveAttribute('href', '/swarajya/#terrain');
  await page.getByText('Dated records at this location', { exact: true }).click();
  await page.getByRole('button', { name: /Sambhaji and Mughal pressure/ }).click();
  await expect(page.getByRole('heading', { name: 'Sambhaji and Mughal pressure', exact: true })).toBeVisible();
  await page.getByText('Read the evidence for this change', { exact: true }).click();
  await expect(page.getByText(/Public chapter summaries checked/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  await page.screenshot({ path: info.outputPath('raigad-history-360.png'), fullPage: true });
  await page.getByRole('link', { name: 'Follow connected people, places and records →' }).click();
  await expect(page.getByRole('heading', { name: 'Sambhaji and Mughal pressure', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Inspect connection with Sambhaji', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Relationship evidence' })).toContainText('1680–1689');
});

test('Panipat supply and aftermath are separate stages on the documented timeline', async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/swarajya/history/?event=kunjpura');
  await expect(page.getByRole('heading', { name: 'The move from Delhi to Kunjpura' })).toBeVisible();
  await page.getByRole('slider').press('ArrowRight');
  await expect(page.getByRole('heading', { name: 'The camp loses supply access' })).toBeVisible();
  await expect(page.getByText(/Exact population and loss estimates are disputed/)).toBeVisible();
  await page.getByRole('button', { name: 'The Third Battle of Panipat', exact: true }).click();
  await expect(page).toHaveURL(/event=panipat-battle/);
  await page.getByRole('button', { name: 'A renewed northern campaign', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A renewed northern campaign', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('panipat-history-1280.png') });
});
