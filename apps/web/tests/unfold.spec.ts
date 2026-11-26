import { expect, test } from '@playwright/test';

for (const width of [360, 1280]) {
  test(`homepage map unfolds and keeps the dice selection around a chapter visit at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width === 360 ? 640 : 900 });
    await page.goto('/');
    const home = page.locator('[data-home-map]');
    await home.evaluate((element) => { (element as HTMLElement).dataset.qaDocument = 'same'; });
    const branch = page.getByRole('navigation', { name: 'Whole-project Mind Map' }).getByRole('link', { name: /^Mahābhārata/ });
    await expect(branch).toHaveAttribute('aria-expanded', 'false');
    await page.screenshot({ path: info.outputPath(`unfold-overview-${width}.png`) });
    await branch.press('Enter');
    const category = page.locator('#home-branch');
    const dice = category.getByRole('link', { name: 'The dice match', exact: true });
    await expect(dice).toBeInViewport({ ratio: 1 });
    await expect(home).toHaveAttribute('data-qa-document', 'same');
    await page.screenshot({ path: info.outputPath(`unfold-branch-${width}.png`) });
    await dice.click();
    const reader = page.getByRole('article', { name: 'Selected reading' });
    await expect(reader.getByRole('heading', { name: 'The dice match', exact: true })).toBeInViewport();
    await expect(home).toHaveAttribute('data-qa-document', 'same');
    await expect(dice).toHaveAttribute('aria-current', 'location');
    await expect(page.getByRole('heading', { name: 'The dice match', exact: true })).toHaveCount(1);
    await page.screenshot({ path: info.outputPath(`unfold-reading-${width}.png`) });
    await page.getByRole('button', { name: 'Timeline', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Timeline', exact: true }).getByRole('button', { name: /The dice match/ })).toHaveAttribute('aria-current', 'step');
    await reader.getByRole('button', { name: 'Sources', exact: true }).click();
    await reader.getByRole('link', { name: 'Chapter and primary text' }).click();
    await expect(page).toHaveURL(/\/mahabharata\/parva\/02\/#chapter-60$/);
    await page.goBack();
    await expect(reader.getByRole('button', { name: 'Sources', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(reader.getByRole('heading', { name: 'The dice match' })).toBeVisible();
    await reader.getByRole('button', { name: 'Close reading' }).click();
    await expect(dice).toBeFocused();
    await expect(reader).toBeHidden();
    await category.getByRole('link', { name: /All Itihāsa/ }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(branch).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });
}

test('slow and failed relationship data leave the story, source and branch available at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let release!: () => void;
  const slow = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/map/edges/mahabharata.json', async (route) => {
    await slow;
    await route.fulfill({ status: 503, body: 'Unavailable' });
  });
  await page.goto('/?branch=mahabharata&node=ma-episode-dice&view=map');
  const article = page.getByRole('article', { name: 'Selected reading' });
  await expect(article.getByRole('heading', { name: 'The dice match' })).toBeVisible();
  await expect(page.getByText('Loading relationships…')).toBeVisible();
  await article.getByRole('button', { name: 'Sources', exact: true }).click();
  await expect(article.getByRole('link', { name: 'Chapter and primary text' })).toHaveAttribute('href', /#chapter-60$/);
  release();
  await expect(page.getByText(/Relationships are unavailable/)).toBeVisible();
  await article.getByRole('button', { name: 'Close reading' }).click();
  await expect(page.locator('#home-branch').getByRole('link', { name: 'The dice match', exact: true })).toBeVisible();
});

test('search opens an exact index locator and war day 12 stays on the matching passage', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const search = page.getByRole('searchbox', { name: 'Search the map' });
  await search.fill('BORI 2.57');
  await page.getByRole('link', { name: /^BORI chapter 2.57/ }).click();
  await expect(page).toHaveURL(/\?branch=mahabharata&ref=/);
  await expect(page.getByRole('link', { name: /Open the exact Library entry/ })).toHaveAttribute('href', '/mahabharata/parva/02/#chapter-57');
  await page.reload();
  await expect(page.getByRole('article', { name: 'Reading preview' })).toContainText('2.57');
  const days = page.locator('[data-days]');
  await days.locator('summary').click();
  await expect(days.getByRole('link')).toHaveCount(18);
  await days.getByRole('link', { name: 'Day 12', exact: true }).click();
  const article = page.getByRole('article', { name: 'Selected reading' });
  await expect(article.getByRole('heading', { name: 'War day 12' })).toBeVisible();
  await article.getByRole('button', { name: 'Sources', exact: true }).click();
  await expect(article.getByRole('link', { name: /Boundary passage 7.17.1/ })).toHaveAttribute('href', /07017001a$/);
});

test('the calendar branch reaches a real calculation and moves the tithi diagram through a boundary', async ({ page }) => {
  await page.goto('/?branch=sky');
  await page.locator('#home-branch').getByRole('link', { name: 'Pañchāṅga', exact: true }).click();
  await page.getByRole('article', { name: 'Selected reading' }).getByRole('link', { name: /Open the tool/ }).click();
  await page.getByRole('button', { name: 'Calculate day' }).click();
  const result = page.getByRole('region', { name: 'Pañchāṅga result' });
  await expect(result.getByRole('cell', { name: 'Dvitīyā', exact: true })).toBeVisible();
  await result.getByText('Try the five calculation rules', { exact: true }).click();
  const exercise = page.locator('#limb-exercise');
  await exercise.getByRole('combobox', { name: 'Limb' }).selectOption({ label: 'Tithi' });
  const output = exercise.getByLabel('Practice result');
  await expect(output).toContainText('sector 2 of 30');
  const dial = exercise.getByRole('figure', { name: /^Practice Moon–Sun angle/ });
  await expect(dial).toBeVisible();
  const before = await dial.getAttribute('aria-label');
  await exercise.getByRole('slider').press('End');
  await expect(output).toContainText('sector 4 of 30');
  await expect(dial).not.toHaveAttribute('aria-label', before!);
  await expect(result.getByRole('cell', { name: 'Dvitīyā', exact: true })).toBeVisible();
});
