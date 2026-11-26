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

test('nakshatra leads from the graph to five exercises with real sunrise inputs', async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/mind-map/?node=concept-nakshatra');
  await page.getByRole('button', { name: 'Follow Calculate the daily calendar', exact: true }).click();
  await page.getByRole('link', { name: 'Open reading →', exact: true }).click();
  await page.getByRole('button', { name: 'Try an example' }).click();
  await page.getByText('Try the five calculation rules', { exact: true }).click();
  const practice = page.locator('#limb-exercise');
  const output = practice.getByLabel('Practice result');
  await expect(output).toContainText('Wednesday');
  await practice.getByRole('slider').press('ArrowRight');
  await expect(output).toContainText('Thursday');
  for (const [limb, sectorCount] of [['Tithi', 30], ['Nakshatra', 27], ['Yoga', 27], ['Karaṇa', 60]] as const) {
    await practice.getByRole('combobox', { name: 'Limb', exact: true }).selectOption({ label: limb });
    await practice.getByRole('slider').press('End');
    await expect(output).toContainText(new RegExp(`\\+30°.*of ${sectorCount}\\.`));
    await expect(practice).toContainText('New Delhi at sunrise on 2025-01-01');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  await practice.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('panchang-five-limbs-360.png'), fullPage: true });
});

test('birth sky compares frames and the workshop carries the longitude past 360 degrees', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/birth-sky/');
  await page.getByRole('button', { name: 'Try an example' }).click();
  const comparison = page.getByText('Compare Moon rāshi, Sun sign and rising sign', { exact: true });
  await comparison.click();
  const readings = page.getByRole('region', { name: 'Birth sky result' });
  await expect(readings.getByText(/Capricorn ·/)).toBeVisible();
  await expect(readings.getByText(/Sidereal ascendant/)).toBeVisible();
  await page.getByLabel('Local birth time (optional)').fill('08:20');
  await page.getByRole('button', { name: 'Calculate birth sky' }).click();
  await expect(comparison).toBeVisible();
  await comparison.click();
  await expect(readings.getByText('Sidereal ascendant', { exact: true }).locator('..')).toContainText('Makara');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: info.outputPath('birth-frames-390.png'), fullPage: true });
  await page.goto('/workshop/');
  await page.getByRole('slider').press('ArrowRight');
  await page.getByText('Carry the longitude through a full turn').click();
  await expect(page.getByText('0.971205°', { exact: true })).toBeVisible();
  await page.getByLabel('Starting longitude (degrees)').fill('10');
  await expect(page.getByText('Traditional longitude', { exact: true }).locator('..')).toContainText('11.971205°');
});

test('Kṛṣṇa companion traces the arena comparison and the festival calculation', async ({ page }, info) => {
  await page.goto('/search/');
  await page.getByRole('searchbox').fill('कृष्ण');
  await page.getByRole('link', { name: 'Kṛṣṇa across three texts', exact: true }).click();
  await page.getByRole('link', { name: 'Mathurā arena' }).click();
  await expect(page.getByRole('link', { name: /Vaidya Critical Edition/ })).toHaveAttribute('href', /HV_76.40$/);
  await expect(page.locator('#city')).toContainText('BORI Critical Edition');
  await page.screenshot({ path: info.outputPath('krishna-sources-1280.png'), fullPage: true });
  await page.getByRole('link', { name: 'Calculate the example day' }).click();
  await expect(page.getByLabel('Date', { exact: true })).toHaveValue('2025-08-16');
  await page.getByRole('button', { name: 'Calculate day' }).click();
  await expect(page.getByRole('region', { name: 'Pañchāṅga result' })).toContainText('Kṛṣṇa paksha');
});
