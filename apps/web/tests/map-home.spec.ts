import { expect, test } from '@playwright/test';

const reader = 'Selected reading';

test('touch from the first-screen map to dice, Draupadī, exile and the same timeline position', async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto('/');
    const overview = page.getByRole('navigation', { name: 'Whole-project Mind Map' });
    const branch = overview.getByRole('link', { name: /^Mahābhārata/ });
    await expect(branch).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: info.outputPath('after-home-360.png') });
    await branch.tap();
    await expect(page.getByRole('heading', { name: 'Mahābhārata', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'The dice match', exact: true }).tap();
    const story = page.getByRole('article', { name: reader });
    await expect(story.getByRole('heading', { name: 'The dice match' })).toBeInViewport();
    const graph = page.getByRole('region', { name: 'Selected node and nearby connections' });
    await graph.getByRole('button', { name: 'Follow Into the forest' }).tap();
    await expect(story.getByRole('heading', { name: 'Into the forest' })).toBeFocused();
    await story.getByRole('button', { name: 'Close reading' }).tap();
    await expect(graph.locator('.map-hub')).toBeFocused();
    await expect(story).toBeHidden();
    await page.goBack();
    await expect(story.getByRole('heading', { name: 'The dice match' })).toBeVisible();
    await story.getByRole('button', { name: 'Draupadī', exact: true }).tap();
    await expect(story.getByRole('heading', { name: 'Draupadī' })).toBeFocused();
    await story.getByRole('button', { name: 'Into the forest', exact: true }).tap();
    await expect(story.getByRole('heading', { name: 'Into the forest' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Your trail' })).toContainText('The dice match');
    await page.getByRole('button', { name: 'Timeline', exact: true }).tap();
    const marker = page.getByRole('button', { name: 'Go to selected reading' });
    await expect(marker).toContainText('Into the forest');
    await expect(page.getByRole('region', { name: 'Timeline', exact: true }).getByRole('button', { name: /Into the forest/ })).toHaveAttribute('aria-current', 'step');
    await story.getByRole('button', { name: 'Sources', exact: true }).tap();
    await story.getByRole('link', { name: 'Chapter and primary text' }).tap();
    await expect(page).toHaveURL(/\/mahabharata\/parva\/03\/#chapter-/);
    await page.goBack();
    await expect(story.getByRole('button', { name: 'Sources', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('link', { name: 'All Itihāsa' }).tap();
    await expect(overview).toBeVisible();
    await expect(page.getByRole('link', { name: /Continue exploring/ })).toHaveAttribute('href', /node=ma-episode-exile-start/);
  } finally { await context.close(); }
});

test('the default timeline shows its selected event before the first mobile scroll', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/explorer/');
  const marker = page.getByRole('button', { name: 'Go to selected reading' });
  await expect(marker).toBeInViewport({ ratio: 1 });
  await expect(marker).toContainText('Who tells the Mahābhārata?');
  await marker.press('Enter');
  await expect(page.getByRole('article', { name: reader }).getByRole('heading', { name: 'Who tells the Mahābhārata?' })).toBeFocused();
});

test('keyboard search opens a branch, narrows exact references, and recovers from empty results at 390px', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.screenshot({ path: info.outputPath('after-home-390.png') });
  const query = page.getByRole('searchbox', { name: 'Search the map' });
  await query.fill('ZZZ Unknown Place');
  await expect(page.getByRole('status')).toContainText('No matching item');
  await query.fill('BORI 2.57');
  const exact = page.getByRole('link', { name: /BORI chapter 2.57/ });
  await expect(exact).toHaveAttribute('href', '/mahabharata/parva/02/#chapter-57');
  await query.press('Escape');
  await expect(exact).toBeHidden();
  await query.fill('रायगड');
  const raigad = page.locator('[data-map-results]').getByRole('link', { name: /^Raigad Maratha history · Place/ });
  await raigad.press('Enter');
  const story = page.getByRole('article', { name: reader });
  await expect(story.getByRole('heading', { name: 'Raigad', exact: true })).toBeVisible();
  await expect(story).toContainText('Modern reference geography');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: info.outputPath('after-raigad-390.png'), fullPage: true });
});

test('rapid events, shared history and reduced motion keep the latest graph and story together', async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.screenshot({ path: info.outputPath('after-home-1280.png') });
  await page.getByRole('navigation', { name: 'Whole-project Mind Map' }).getByRole('link', { name: /^Mahābhārata/ }).click();
  await page.getByRole('link', { name: 'The dice match', exact: true }).click();
  const story = page.getByRole('article', { name: reader });
  const graph = page.getByRole('region', { name: 'Selected node and nearby connections' });
  await graph.getByRole('button', { name: 'Follow Into the forest' }).click();
  await graph.getByRole('button', { name: 'Follow The dice match' }).click();
  await expect(story.getByRole('heading', { name: 'The dice match' })).toBeFocused();
  await expect(graph.locator('.map-hub')).toContainText('The dice match');
  await expect(graph.locator('.map-hub')).toHaveCSS('animation-name', 'none');
  await expect(graph.locator('.map-connector-traversed')).toHaveCount(1);
  await page.goBack();
  await expect(story.getByRole('heading', { name: 'Into the forest' })).toBeVisible();
  await page.goForward();
  await page.reload();
  await expect(story.getByRole('heading', { name: 'The dice match' })).toBeVisible();
  await expect(graph.getByRole('button', { name: 'Follow Into the forest' })).toBeVisible();
  const [left, right] = await Promise.all([graph.boundingBox(), story.boundingBox()]);
  expect(left!.x + left!.width).toBeLessThan(right!.x);
  await page.screenshot({ path: info.outputPath('after-reading-1280.png') });
});

test('five questions lead to their cited readings, comparisons, and working calendar', async ({ page }) => {
  const cases = [
    { name: /How did the dice match/, step: /3. Open her question/, heading: /Who had authority|Draupadī/, source: /\/mahabharata\/parva\/02\/#chapter-60/ },
    { name: /Follow Sītā from her decision/, step: /4. Locate the literary grove/, heading: /Aśoka grove/, text: 'Literary location' },
    { name: /What did a Maratha fort/, step: /2. Read the capital record/, heading: /Coronation at Raigad/i, source: /\/swarajya\/#terrain/ },
    { name: /Why does Oak read/, step: /3. Change the assumption/, heading: /Arundhatī|meridian/, text: 'Historical result · Unavailable' },
    { name: /How does nakshatra enter/, step: /2. Compare two birth passages/, heading: /The birth of Rāma/, text: 'Punarvasu' },
  ];
  const story = page.getByRole('article', { name: reader });
  for (const entry of cases) {
    await page.goto('/');
    await page.getByRole('link', { name: entry.name }).click();
    const guide = page.getByRole('region', { name: 'Guided journey' });
    const step = guide.getByRole('link', { name: entry.step });
    await step.click();
    await expect(step).toHaveAttribute('aria-current', 'step');
    await expect(story.getByRole('heading', { level: 2 })).toHaveText(entry.heading);
    if (entry.text) await expect(story).toContainText(entry.text);
    if (entry.source) await expect(story.locator('a').filter({ hasText: /Open the chapter|Inspect Raigad/ })).toHaveAttribute('href', entry.source);
  }
  await expect(story.getByRole('region', { name: 'Compare Rāma’s birth passages' }).getByRole('link', { name: 'Open the edition' })).toHaveCount(2);
  const next = page.getByRole('link', { name: /3. Try the Delhi example/ });
  await next.click();
  await story.getByRole('link', { name: /Open the tool/ }).click();
  await expect(page).toHaveURL(/\/panchang\/\?date=2025-01-01/);
  await page.getByRole('button', { name: 'Calculate day' }).click();
  const calendar = page.getByRole('region', { name: 'Pañchāṅga result' });
  await expect(calendar.getByRole('heading', { name: 'New Delhi · 2025-01-01' })).toBeVisible();
  await expect(calendar.getByRole('cell', { name: 'Uttara Āṣāḍhā' })).toBeVisible();
});

test('home branches and their first reading remain accessible without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 360, height: 640 } });
  const page = await context.newPage();
  try {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Whole-project Mind Map' }).getByRole('link', { name: /^Rāmāyaṇa/ }).press('Enter');
    await page.getByRole('link', { name: 'Sītā chooses to go', exact: true }).click();
    const story = page.getByRole('article', { name: reader });
    await expect(story.getByRole('heading', { name: 'Sītā chooses to go', exact: true })).toBeInViewport();
    await expect(story.getByRole('link', { name: /Open full reading/ })).toHaveAttribute('href', /\/ramayana\/\?scene=sita-exile/);
  } finally { await context.close(); }
});
