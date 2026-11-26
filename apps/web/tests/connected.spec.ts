import { expect, test } from '@playwright/test';

test('home to war days preserves the story, source and map position at 360px', async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/');
  await page.getByRole('link', { name: 'Open the Explorer' }).click();
  const timeline = page.getByRole('region', { name: 'Timeline', exact: true });
  const scope = timeline.getByRole('combobox', { name: 'Scope', exact: true });
  await scope.selectOption('war');
  const scopeBox = await scope.boundingBox();
  const searchBox = await timeline.getByRole('searchbox').boundingBox();
  expect(scopeBox!.y + scopeBox!.height).toBeLessThan(searchBox!.y);
  const story = page.getByRole('article', { name: 'Selected reading' });
  const day12 = timeline.getByRole('button', { name: /War day 12/ });
  await day12.press('Enter');
  await expect(story.getByRole('heading', { name: 'War day 12', exact: true })).toBeFocused();
  await expect(story).toContainText('Bhagadatta');
  await story.getByRole('button', { name: 'Sources', exact: true }).click();
  await expect(story.getByRole('link', { name: /Boundary passage 7.17.1/ })).toHaveAttribute('href', /07017001a$/);
  await page.getByRole('button', { name: 'Mind Map', exact: true }).click();
  await expect(page.locator('.map-hub')).toContainText('War day 12');
  await page.goBack();
  await expect(day12).toHaveAttribute('aria-current', 'step');
  await expect(story.getByRole('link', { name: /Boundary passage/ })).toBeVisible();
  await story.getByRole('button', { name: 'Close reading' }).click();
  await expect(page.getByRole('button', { name: 'Open selected reading' })).toBeFocused();
  await day12.click();
  await story.getByRole('button', { name: 'Close reading' }).click();
  await expect(day12).toBeFocused();
  await timeline.getByRole('button', { name: /War day 14/ }).click();
  await expect(story.getByRole('heading', { name: 'The vow and the darkening sky' })).toBeVisible();
  await expect(story.getByRole('link', { name: 'Inspect the dating clue →' })).toHaveAttribute('href', /node=research-eclipse/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  await page.screenshot({ path: info.outputPath('explorer-war-360.png'), fullPage: true });
});

test('legacy war URL and deliberate day transitions do not carry yesterday’s clue', async ({ page }) => {
  await page.goto('/mahabharata/?scene=jayadratha&day=14&clue=eclipse');
  await page.getByRole('button', { name: 'Battle day 12', exact: true }).click();
  await expect(page.locator('.ma-episode h3')).toHaveText('War day 12 · Droṇa commands');
  expect(new URL(page.url()).searchParams.has('clue')).toBe(false);
  expect(new URL(page.url()).searchParams.has('scene')).toBe(false);
  await page.goBack();
  await expect(page.locator('.ma-episode h3')).toHaveText('The vow and the darkening sky');
  await page.goto('/mahabharata/?scene=jayadratha&day=12&clue=eclipse');
  await expect(page.locator('.ma-episode h3')).toHaveText('War day 12 · Droṇa commands');
  expect(new URL(page.url()).searchParams.has('clue')).toBe(false);
});

test('Draupadī opens a profile and the dice and exile readings from the graph', async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/explorer/?node=ma-person-draupadi&view=map');
  const graph = page.locator('.map-neighbors');
  await expect(graph.getByRole('heading', { name: 'Draupadī', exact: true })).toBeVisible();
  await graph.getByRole('button', { name: 'Follow this person' }).click();
  await expect(page).toHaveURL(/person=ma-person-draupadi/);
  await expect(page.getByText('Following Draupadī', { exact: false })).toBeVisible();
  await page.getByRole('region', { name: 'Timeline', exact: true }).getByRole('button', { name: /The dice match/ }).click();
  await page.getByRole('button', { name: 'Mind Map', exact: true }).click();
  await graph.getByRole('button', { name: 'Into the forest', exact: true }).click();
  const story = page.getByRole('article', { name: 'Selected reading' });
  await expect(story.getByRole('heading', { name: 'Into the forest', exact: true })).toBeVisible();
  await story.getByRole('button', { name: 'Sources', exact: true }).click();
  await story.getByRole('link', { name: 'Chapter and primary text' }).click();
  await expect(page).toHaveURL(/\/parva\/03\/#chapter-/);
  await page.goBack();
  await expect(graph.getByRole('heading', { name: 'Into the forest', exact: true })).toBeVisible();
  await expect(story.getByRole('link', { name: 'Chapter and primary text' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('explorer-draupadi-1280.png'), fullPage: true });
});

test('Sītā’s ring selection survives the graph, reading, reload and navigation at 390px', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/explorer/?lane=ramayana&node=ra-episode-sita-exile&person=ra-person-sita');
  const story = page.getByRole('article', { name: 'Selected reading' });
  await page.getByRole('region', { name: 'Timeline', exact: true }).getByRole('button', { name: /Sītā recognizes the ring/ }).click();
  await page.getByRole('button', { name: 'Mind Map', exact: true }).click();
  await page.locator('.map-neighbors').getByRole('link', { name: 'Open reading →' }).click();
  await expect(page.getByLabel('Follow a person')).toHaveValue('sita');
  await page.goBack();
  await expect(page.locator('.map-hub')).toContainText('Sītā recognizes the ring');
  await page.goBack();
  await expect(story.getByRole('heading', { name: 'Sītā recognizes the ring', exact: true })).toBeVisible();
  await page.goBack();
  await expect(story.getByRole('heading', { name: 'Sītā chooses to go', exact: true })).toBeVisible();
  await page.goForward();
  await page.reload();
  await expect(page.getByText('Following Sītā', { exact: false })).toBeVisible();
  await story.getByRole('button', { name: 'Geography' }).click();
  await expect(story.getByText('Modern reference geography.', { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: info.outputPath('explorer-sita-390.png'), fullPage: true });
  await story.getByRole('button', { name: 'Laṅkā and the Aśoka grove', exact: true }).click();
  await expect(story).toContainText('Literary location');
  await expect(story).toContainText('No point is plotted for this location.');
});

test('Panipat is an active place until its dated event replaces the coronation', async ({ page }, info) => {
  await page.goto('/explorer/?lane=maratha&node=maratha-event-capital');
  const story = page.getByRole('article', { name: 'Selected reading' });
  await story.getByRole('button', { name: 'Geography' }).click();
  await story.getByRole('combobox', { name: 'Inspect a place' }).selectOption('maratha-place-panipat');
  await expect(story.getByRole('heading', { name: 'Panipat', exact: true })).toBeVisible();
  await expect(story).toContainText('Previous event for context');
  await story.getByRole('button', { name: /14 January 1761.*Third Battle/ }).click();
  await expect(story.getByRole('heading', { name: 'The Third Battle of Panipat' })).toBeVisible();
  await expect(story).toContainText('14 January 1761');
  await story.getByRole('button', { name: 'Sources', exact: true }).click();
  await expect(story.getByRole('link', { name: /Siege and outcome/i })).toHaveAttribute('href', /panipat.gov.in/);
  await page.goBack();
  await page.goBack();
  await expect(story.getByRole('heading', { name: 'Panipat', exact: true })).toBeVisible();
  await expect(story.getByRole('button', { name: 'Geography' })).toHaveAttribute('aria-pressed', 'true');
  await expect(story.getByRole('button', { name: 'Inspect Panipat on the map' })).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: info.outputPath('explorer-panipat-1280.png'), fullPage: true });
});

test('the Explorer retains an alternate reading and historical review status', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/explorer/?node=claim-oak-ahead&bounds=stars,season');
  const story = page.getByRole('article', { name: 'Selected reading' });
  await story.getByRole('button', { name: 'Sources', exact: true }).click();
  await expect(story.getByRole('link', { name: 'Underlying passage or study' })).toHaveAttribute('href', /06002031a$/);
  await story.getByRole('button', { name: 'Dating comparison' }).click();
  await expect(page.locator('.ma-combined')).toContainText('7,000–4,508 BCE');
  await page.getByRole('combobox', { name: 'Reading of “ahead”' }).selectOption('literal');
  await expect(page.locator('.ma-combined')).toContainText('7,000–3,700 BCE');
  await expect(page.getByText(/^Historical result · Unavailable\./)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Reading of “ahead”' })).toHaveValue('literal');
});

test('calendar, transient birth input, exact chapter search and invalid selection', async ({ page }) => {
  await page.goto('/explorer/?node=concept-nakshatra&view=map');
  await page.getByRole('button', { name: 'Follow Calculate the daily calendar' }).click();
  await page.locator('.map-neighbors').getByRole('link', { name: 'Open reading →' }).click();
  await page.getByRole('button', { name: 'Calculate day' }).click();
  await expect(page.getByRole('region', { name: 'Pañchāṅga result' })).toContainText('Dvitīyā');
  await page.getByText('Try the five calculation rules', { exact: true }).click();
  await page.locator('#limb-exercise').getByRole('combobox', { name: 'Limb' }).selectOption({ label: 'Nakshatra' });
  await expect(page.getByLabel('Practice result')).toContainText('of 27');
  const publicSelection = await page.evaluate(() => localStorage.getItem('itihasa.public-selection.v1'));
  await page.goto('/birth-sky/');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Birth sky result' })).toContainText('Makara');
  await expect(page).toHaveURL(/\/birth-sky\/$/);
  expect(await page.evaluate(() => localStorage.getItem('itihasa.public-selection.v1'))).toBe(publicSelection);
  await page.getByLabel('Birth date').fill('2023-01-01');
  await page.getByRole('button', { name: 'Calculate birth sky' }).click();
  await expect(page.getByRole('alert')).toContainText('2024 through 2027');
  await page.goto('/search/');
  await page.getByRole('searchbox').fill('BORI 2.57');
  await page.getByRole('link', { name: 'BORI chapter 2.57', exact: true }).click();
  await expect(page.locator('#chapter-57')).toContainText('Index and primary source only');
  await page.goto('/explorer/?view=map&node=does-not-exist');
  await expect(page.getByText('That Explorer item is unavailable.', { exact: false })).toBeVisible();
  await page.getByRole('searchbox').fill('द्रौपदी');
  await page.getByRole('button', { name: 'Draupadī person · Mahābhārata', exact: true }).click();
  await expect(page.locator('.map-neighbors').getByRole('heading', { name: 'Draupadī', exact: true })).toBeVisible();
});

test('scrubbing keeps focus and filters explain a selection outside the lane scope', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/explorer/?scope=war&node=ma-day-12');
  const scrub = page.getByRole('slider', { name: 'Move through this list' });
  await expect(scrub).toBeEnabled();
  await scrub.press('ArrowRight');
  await expect(scrub).toBeFocused();
  await expect(page).toHaveURL(/node=ma-episode-abhimanyu/);
  await page.getByRole('combobox', { name: 'Scope' }).selectOption('parva-1');
  await expect(page.getByText('The selected reading is outside these filters.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Reveal selected event' }).click();
  await expect(page.getByRole('region', { name: 'Timeline', exact: true }).getByRole('button', { name: /War day 13/ })).toHaveAttribute('aria-current', 'step');
});

test('Explorer has edition and war passage entrances without JavaScript', async ({ browser, baseURL }) => {
  const page = await browser.newPage({ baseURL, javaScriptEnabled: false });
  try {
    await page.goto('/explorer/');
    const fallback = page.getByRole('region', { name: 'Browse readings without JavaScript' });
    await expect(fallback.getByRole('link', { name: 'Library and primary texts' })).toHaveAttribute('href', '/library/');
    await fallback.getByText('War day passages', { exact: true }).click();
    await expect(fallback.getByRole('link', { name: 'BORI 7.26.2', exact: true })).toHaveAttribute('href', /07026002c$/);
  } finally {
    await page.close();
  }
});
