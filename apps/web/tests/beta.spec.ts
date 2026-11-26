import { expect, test } from '@playwright/test';

test('home opens each major product area', async ({ page }, testInfo) => {
  const routes = [
    ['Mahābhārata', '/explorer/?lane=mahabharata&node=ma-episode-dice'],
    ['Rāmāyaṇa', '/explorer/?lane=ramayana&node=ra-episode-sita-exile'],
    ['Swarajya and Maratha history', '/explorer/?lane=maratha&node=maratha-event-capital'],
    ['Sky and Calendar', '/sky-calendar/'], ['Research notebook', '/research/'], ['Library', '/library/'],
  ];
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/');
  const hero = page.getByRole('link', { name: /Open the Explorer/ });
  await expect(hero).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  await page.screenshot({ path: testInfo.outputPath('home-360.png'), fullPage: true });
  await hero.press('Enter');
  await expect(page).toHaveURL(/\/explorer\/$/);
  await expect(page.getByRole('heading', { name: 'Who tells the Mahābhārata?' })).toBeVisible();
  for (const [name, path] of routes) {
    await page.goto('/');
    await page.locator('.link-grid').getByRole('link', { name, exact: true }).click();
    expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await page.screenshot({ path: testInfo.outputPath('home-1280.png'), fullPage: true });
  await page.getByRole('link', { name: 'Coverage & evidence status' }).click();
  await expect(page.getByText(/9 annotated epic and Purāṇic episodes/)).toBeVisible();
});

test('search finds passage locators, language variants, people, and places', async ({ page }) => {
  await page.goto('/search/');
  const search = page.getByRole('searchbox');
  for (const [query, path] of [
    ['6.2.31', '/arundhati/#verse'],
    ['rashi', '/birth-sky/'], ['rāshi', '/birth-sky/'], ['राशि', '/birth-sky/'],
    ['Yaśodā', '/stories/krishna-birth/'], ['Dvārakā', '/stories/krishna-dvaraka/'],
  ]) {
    await search.fill(query);
    await expect(page.locator(`.search-list a[href="${path}"]`)).toBeVisible();
  }
  await search.fill('zzzz no such term');
  await expect(page.getByRole('status')).toHaveText('0 results');
  await expect(page.getByRole('link', { name: 'Browse Epics & Purāṇas' })).toBeVisible();
});

test('edition comparison and linked narrative sources', async ({ page }) => {
  await page.goto('/epics/');
  await page.getByRole('link', { name: 'Vālmīki Rāmāyaṇa', exact: true }).click();
  await page.getByRole('link', { name: 'The birth of Rāma', exact: true }).click();
  await expect(page.locator('#baroda')).toContainText('1.17.6');
  await expect(page.locator('#southern')).toContainText('1.18.8–10');
  await page.locator('#baroda').press('Enter');
  await expect(page.getByText('kausalyājanayad', { exact: false })).toBeHidden();
  await page.getByRole('link', { name: /how Rāma Navamī/i }).click();
  await expect(page.getByText(/19:26 IST on 5 April/)).toBeVisible();
  await page.goto('/epics/');
  await expect(page.locator('ol.reading-list > li')).toHaveCount(5);
  await page.getByRole('link', { name: 'A city in the sea' }).click();
  await expect(page.getByText(/Bhāgavata Purāṇa 10.50.44–57/)).toBeVisible();

  await page.goto('/stories/jayadratha/');
  await page.getByText('What would an eclipse claim need?', { exact: true }).click();
  for (const choice of ['The Moon is new', 'It is near a node of its orbit', 'The eclipse is visible at the proposed place']) {
    await page.getByRole('checkbox', { name: choice, exact: true }).check();
  }
  await expect(page.getByRole('status')).toContainText('pass the geometry screen');
  await page.goto('/research/');
  await expect(page.getByText('Historical result · Unavailable', { exact: true })).toBeVisible();
  await expect(page.getByText(/77\.498 seconds/)).toBeVisible();
});

test('daily calendar returns real boundary times and handles an invalid date', async ({ page }) => {
  await page.goto('/panchang/');
  await page.getByRole('button', { name: 'Try an example' }).click();
  const result = page.getByRole('region', { name: 'Pañchāṅga result' });
  await expect(result.getByText('Dvitīyā', { exact: true })).toBeVisible();
  await expect(result.getByText('02:25 · 2025-01-02', { exact: true })).toBeVisible();
  await expect(result.getByText('Rāhu Kāla', { exact: true })).toBeVisible();

  await page.getByLabel('Date', { exact: true }).fill('2025-08-16');
  await page.getByRole('button', { name: 'Calculate day' }).click();
  await expect(result.getByText(/Kṛṣṇa paksha.*Śrāvaṇa/)).toBeVisible();
  await page.getByLabel('Lunar month convention').selectOption('purnimanta');
  await expect(result.getByText(/Kṛṣṇa paksha.*Bhādrapada/)).toBeVisible();

  await page.getByLabel('Date', { exact: true }).fill('2023-01-01');
  await page.getByRole('button', { name: 'Calculate day' }).click();
  await expect(page.getByRole('alert')).toContainText('2024 through 2027');
});

test('birth sky resolves an example, civil-day possibilities, and missing location', async ({ page }) => {
  await page.goto('/birth-sky/');
  await page.getByRole('button', { name: 'Calculate birth sky' }).click();
  await expect(page.getByRole('alert')).toHaveText('Choose a supported city.');
  const result = page.getByRole('region', { name: 'Birth sky result' });
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(result.getByText('Makara', { exact: true })).toBeVisible();
  await expect(result.locator('dt').filter({ hasText: 'Lagna' })).toBeVisible();
  await page.getByLabel('Local birth time (optional)').fill('');
  const response = page.waitForResponse((entry) => entry.url().endsWith('/api/v1/birth-sky') && entry.ok());
  await page.getByRole('button', { name: 'Calculate birth sky' }).click();
  expect((await response).headers()['cache-control']).toBe('no-store');
  await expect(result.getByText(/Lagna needs a birth time/)).toBeVisible();
  await expect(result.getByRole('table')).toBeVisible();
  await expect(page).toHaveURL(/\/birth-sky\/$/);
});

test('workshop responds to keyboard and map keeps the Agra route uncertain', async ({ page }, testInfo) => {
  await page.goto('/workshop/');
  await expect(page.getByText('0.985603°', { exact: false })).toBeVisible();
  await expect(page.getByRole('slider')).toBeEnabled();
  await page.getByRole('slider').press('ArrowRight');
  await expect(page.getByRole('slider')).toHaveValue('2');
  await expect(page.getByText('1.971205°', { exact: false })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/swarajya/');
  const agra = page.getByRole('button', { name: /1666.*escape from Agra/i });
  await agra.scrollIntoViewIfNeeded();
  await agra.click();
  await expect(agra).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(/route uncertain/i)).toBeVisible();
  await page.getByText('Elevation values', { exact: true }).click();
  await expect(page.getByRole('cell', { name: '856' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: testInfo.outputPath('swarajya-390.png'), fullPage: true });
});
