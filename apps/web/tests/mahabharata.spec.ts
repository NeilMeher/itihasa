import { expect, test } from '@playwright/test';

test('dice wagers, source locator, exile and nested story at 360px', async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/mahabharata/');
  const step = page.getByRole('button', { name: 'Next scene' });
  await expect(step).toBeInViewport({ ratio: 1 });
  await expect(step).toBeEnabled();
  await page.screenshot({ path: info.outputPath('atlas-360.png') });
  const search = page.getByRole('searchbox', { name: /find a scene/i });
  await search.fill('2.60');
  await page.getByRole('link', { name: /^Chapter 2\.60/ }).click();
  await expect(page.locator('#chapter-60')).toContainText('Selected scene reading');
  await expect(page.locator('#chapter-57')).toContainText('Index and primary source only');
  await page.locator('#chapter-60').getByRole('link', { name: /dice match/ }).click();
  await expect(page.getByRole('heading', { name: 'The dice match' })).toBeVisible();
  const wagers = page.getByRole('region', { name: 'Follow the wagers' }).getByRole('listitem');
  await expect(wagers).toHaveCount(19);
  await expect(wagers.nth(17)).toContainText('Yudhiṣṭhira himself');
  await expect(wagers.last()).toContainText('Draupadī');
  const question = page.getByRole('region', { name: 'Who answers Draupadī?' });
  await expect(question.getByRole('link', { name: 'Draupadī 2.60.7 ↗' })).toHaveAttribute('href', /MBh02\.txt#:~:text=02060007c$/);
  await question.getByRole('heading').evaluate((heading) => heading.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: info.outputPath('dice-question-360.png') });
  await page.getByRole('button', { name: /Follow the consequence/ }).click();
  await expect(page.getByRole('heading', { name: 'Into the forest' })).toBeFocused();
  await page.getByRole('button', { name: /Enter Bṛhadaśva/ }).press('Enter');
  await expect(page).toHaveURL(/scene=nala/);
  await expect(page.getByText(/Bṛhadaśva, speaking to Yudhiṣṭhira/)).toBeVisible();
  await page.getByRole('button', { name: /Return to the forest exile/ }).press('Enter');
  await expect(page).toHaveURL(/scene=exile-start/);
  await expect(page.getByRole('heading', { name: 'Into the forest' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
});

test('peace, battle day, map, people and return from a source on desktop', async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/mahabharata/?scene=peace');
  await page.getByRole('button', { name: /Go to battle day 1/ }).click();
  await page.getByRole('button', { name: 'Battle day 13', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Day 13 · Droṇa commands' })).toBeVisible();
  await expect(page).toHaveURL(/scene=abhimanyu.*place=kurukshetra.*day=13/);
  const map = page.getByRole('region', { name: 'Places in the Mahābhārata' });
  await expect(map.getByRole('button', { name: 'Explore Kurukṣetra' })).toHaveAttribute('aria-pressed', 'true');
  await map.getByRole('button', { name: 'Wide view' }).click();
  await map.getByRole('button', { name: /Zoom into six/ }).click();
  await expect(map.getByRole('button', { name: 'Kuru region' })).toHaveAttribute('aria-pressed', 'true');
  const person = page.getByRole('button', { name: 'Abhimanyu', exact: true });
  await person.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Abhimanyu' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(person).toBeFocused();
  await page.getByRole('heading', { name: /Abhimanyu enters the formation/ }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('battle-map-1280.png') });
  await page.route('https://indology.info/bombay/mahabharata/text/UR/MBh07.txt*', (route) =>
    route.fulfill({ contentType: 'text/plain', body: '07035015c' }));
  await page.getByRole('button', { name: 'Passages & editions' }).click();
  const source = dialog.getByRole('link', { name: /Open the passage at BORI 7\.35\.15/ });
  await expect(source).toHaveAttribute('href', /07035015c$/);
  await source.click();
  await expect(page).toHaveURL(/indology\.info.*MBh07\.txt/);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Day 13 · Droṇa commands' })).toBeVisible();
});

test('the observer sky returns to the same passage at 390px', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let releaseScript: () => void = () => {};
  const scriptCanLoad = new Promise<void>((resolve) => { releaseScript = resolve; });
  await page.route('**/_astro/MahabharataAtlas.*.js', async (route) => {
    await scriptCanLoad;
    await route.continue();
  });
  const observer = page.getByRole('button', { name: /Open the observer sky/ });
  try {
    await page.goto('/mahabharata/?scene=omens', { waitUntil: 'domcontentloaded' });
    await expect(observer).toBeDisabled();
  } finally {
    releaseScript();
  }
  await observer.click();
  await expect(page.getByText('illustrative sky', { exact: true })).toBeVisible();
  await page.getByLabel('Observing site').selectOption('dvaraka');
  await page.getByLabel('Sample date').selectOption('2');
  const time = page.getByRole('slider', { name: /Local time/ });
  await time.press('ArrowLeft');
  await expect(time).toHaveValue('38.75');
  await page.getByRole('button', { name: 'Play sky', exact: true }).click();
  await expect(time).toHaveValue('39.75');
  await expect(page.getByRole('button', { name: 'Play sky', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Jupiter', exact: true }).click();
  await page.getByText('Read the positions', { exact: true }).click();
  await expect(page.getByRole('table').getByRole('row', { name: /Jupiter/ })).toBeVisible();
  await page.getByRole('button', { name: 'Angular separation', exact: true }).click();
  await expect(page.getByText(/Jupiter and Sun are .* apart/)).toBeVisible();
  await page.getByRole('button', { name: 'Eclipse visibility', exact: true }).click();
  await page.getByRole('slider', { name: /Sun altitude/ }).press('Home');
  await expect(page.locator('.ma-lesson-card').getByRole('status').filter({ hasText: /at or below the local horizon/ })).toBeVisible();
  await page.getByRole('button', { name: 'Precession', exact: true }).click();
  await page.getByLabel(/Julian epoch/).selectOption('3');
  await expect(page.getByText(/0\.000° from the ICRS north pole/)).toBeVisible();
  await page.getByRole('button', { name: 'Moon, phase & tithi', exact: true }).click();
  await expect(page.getByRole('table').getByRole('row', { name: /2025-01-07/ })).toBeVisible();
  await page.getByText('Choose another catalogue star', { exact: true }).click();
  await page.getByRole('button', { name: 'Polaris', exact: true }).click();
  await expect(page.getByText('HIP 11767', { exact: true })).toBeVisible();
  await page.locator('.ma-observatory').evaluate((instrument) => instrument.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: info.outputPath('observer-sky-390.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole('button', { name: /Return to Vyāsa reads the omens/ }).click();
  await expect(page).toHaveURL(/scene=omens&view=story/);
  await expect(page.getByRole('heading', { name: 'Vyāsa reads the omens' })).toBeVisible();
});

test('reported filters show their effect and a DNA record dates context', async ({ page }, info) => {
  await page.goto('/mahabharata/?scene=omens&view=evidence&clue=stars');
  await page.getByRole('checkbox', { name: 'Arundhatī and Vasiṣṭha' }).check();
  await expect(page.getByRole('status')).toContainText('11,091–4,508 BCE');
  await page.getByRole('checkbox', { name: 'Bhīṣma’s death and the seasons' }).check();
  await expect(page.getByRole('status')).toContainText('7,000–4,508 BCE');
  await page.getByRole('checkbox', { name: 'The war month and waxing Moon' }).check();
  await expect(page.getByRole('status')).toContainText('No change');
  await expect(page.getByText(/16 October 5561 BCE.*proleptic Julian/)).toBeVisible();
  await page.getByRole('checkbox', { name: /local prereview star-transit/ }).check();
  await expect(page.getByText(/Julian epochs in Terrestrial Time/)).toBeVisible();
  await page.getByRole('button', { name: 'DNA', exact: true }).click();
  await expect(page).toHaveURL(/clue=rakhigarhi/);
  await expect(page.getByText(/Collagen preservation prevented direct radiocarbon dating/)).toBeVisible();
  await expect(page.getByText(/Rakhigarhi habitation charcoal/)).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /Rakhigarhi/ })).toHaveCount(0);
  await page.getByRole('heading', { name: 'The Rakhigarhi genome' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('dating-dna-1280.png') });
  await page.getByRole('heading', { name: 'The Rakhigarhi genome' }).evaluate((heading) => heading.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: info.outputPath('rakhigarhi-study-1280.png') });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'The Rakhigarhi genome' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Arundhatī and Vasiṣṭha' })).toBeChecked();
  await page.setViewportSize({ width: 360, height: 640 });
  await page.getByRole('checkbox', { name: /local prereview star-transit/ }).check();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
});

test('later parvas, final journey, motion preference and 200% layout zoom', async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/mahabharata/');
  await page.getByLabel('Jump to parva').selectOption('11');
  await expect(page.getByRole('heading', { name: 'Gāndhārī on the battlefield' })).toBeVisible();
  await page.getByRole('button', { name: 'Play story', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'The brother they did not know' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play story', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Bhīṣma’s teachings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lessons in kingship' })).toBeVisible();
  await page.getByRole('button', { name: /Hear the father and son/ }).click();
  await expect(page.getByRole('heading', { name: 'What can wait until tomorrow?' })).toBeFocused();
  await page.getByRole('button', { name: /Return to Bhīṣma and Yudhiṣṭhira/ }).click();
  await page.getByRole('button', { name: 'The last journeys', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'The end of Dvārakā' })).toBeVisible();
  await page.getByRole('slider').press('ArrowRight');
  await expect(page.getByRole('heading', { name: 'The last journey', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next scene' }).click();
  await expect(page.getByRole('heading', { name: 'The final test' })).toBeVisible();
  await page.getByRole('heading', { name: 'The final test' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('final-journey-1280.png') });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.getByRole('link', { name: /Parva guide & chapter index/ }).click();
  await expect(page).toHaveURL(/parva\/18\/#chapter-3/);
  await expect(page.locator('.ma-chapter-list > li')).toHaveCount(5);
});

test('timed story playback advances, pauses, and restarts', async ({ page }) => {
  await page.clock.install();
  await page.goto('/mahabharata/');
  await page.getByRole('button', { name: 'Play story', exact: true }).click();
  await page.clock.fastForward(8_100);
  await expect(page.getByRole('heading', { name: 'The vow that changes the throne' })).toBeVisible();
  await page.getByRole('button', { name: 'Pause story', exact: true }).click();
  await page.clock.fastForward(8_100);
  await expect(page.getByRole('heading', { name: 'The vow that changes the throne' })).toBeVisible();
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Who tells the Mahābhārata?' })).toBeVisible();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('parva navigation and chapter text links work', async ({ page }) => {
    await page.goto('/mahabharata/');
    const fallback = page.locator('noscript');
    await expect(fallback.getByRole('link')).toHaveCount(18);
    await fallback.getByRole('link', { name: /Sabhā/ }).click();
    await expect(page.locator('.ma-chapter-list > li')).toHaveCount(72);
    await expect(page.locator('#chapter-60').getByRole('link', { name: /Sanskrit chapter start/ })).toHaveAttribute('href', /02060001a$/);
  });
});
