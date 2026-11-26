import { expect, test } from '@playwright/test';

for (const { width, height } of [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
]) {
  test(`investigation at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('requestfailed', (request) => errors.push(request.url()));
    page.on('response', (response) => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });

    const response = await page.goto('/arundhati/');
    expect(response?.ok()).toBe(true);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('What did Vyāsa mean');
    await expect(page.locator('[lang="sa-Deva"]')).toContainText('वसिष्ठः');
    const explore = page.getByRole('link', { name: 'Explore the two stars' });
    await expect(explore).toBeInViewport({ ratio: 1 });
    await expect(explore.getByText('→', { exact: true })).toBeVisible({ visible: width === 1280 });
    await expect(explore.getByText('↓', { exact: true })).toBeVisible({ visible: width !== 1280 });
    const citation = page.getByRole('link', { name: 'BORI Bhīṣmaparvan 6.2.31', exact: true });
    expect(await citation.evaluate((link) => {
      const text = document.createRange();
      text.selectNodeContents(link);
      return text.getClientRects().length;
    })).toBe(1);
    const slider = page.getByRole('slider', { name: 'Demo step' });
    await expect(slider).toBeEnabled();
    await page.screenshot({ path: testInfo.outputPath('first-screen.png') });

    await page.getByRole('link', { name: 'Read the Sanskrit', exact: true }).press('Enter');
    await expect(page).toHaveURL(/#verse$/);
    await expect(page.locator('#verse')).toBeFocused();
    const dandasShareTheirWordLine = await page.locator('.sanskrit > span').evaluateAll((lines) =>
      lines.map((line) => {
        const text = line.firstChild;
        if (!(text instanceof Text)) return false;
        const ending = /(\S+)\u00a0[।॥]$/u.exec(text.data);
        if (!ending) return false;

        const range = document.createRange();
        range.setStart(text, ending.index);
        range.setEnd(text, ending.index + ending[1].length);
        const wordTop = range.getBoundingClientRect().top;
        range.setStart(text, text.length - 1);
        range.setEnd(text, text.length);
        return range.getBoundingClientRect().top === wordTop;
      }),
    );
    expect(dandasShareTheirWordLine).toEqual([true, true]);

    await explore.press('Enter');
    await expect(page).toHaveURL(/#sky$/);
    await expect(page.locator('#sky')).toBeFocused();
    await expect(page.getByText('illustrative sky', { exact: true })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await page.getByRole('button', { name: 'Next' }).click();
    await slider.press('ArrowRight');
    await expect(slider).toHaveAttribute('aria-valuetext', 'Step 3 of 6');
    await expect(page.getByText('Alcor reaches the meridian first in this illustration.')).toBeVisible();
    const positions = page.getByText('All demo positions', { exact: true });
    const table = page.getByRole('table');
    await positions.click();
    await expect(table).toBeVisible();
    await expect(page.getByRole('row', { name: '3 On the meridian 24 east' })).toBeVisible();

    await page.getByRole('link', { name: 'Sources', exact: true }).click();
    await expect(page).toHaveURL(/#sources$/);
    await expect(page.getByText('06002031a and 06002031c')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Read the Sanskrit e-text' })).toHaveAttribute('href', /MBh06\.txt.*06002031a$/);
    const interpretation = page.locator('summary').filter({ hasText: 'Oak’s interpretation' });
    await interpretation.press('Enter');
    const oak = page.getByRole('link', { name: /read Oak’s original explanation/i });
    await expect(oak).toBeVisible();
    await expect(oak).toHaveAttribute('href', 'https://nileshoak.wordpress.com/2016/02/08/arundhati-vasistha/');
    await expect(table).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    if (width === 360) {
      await page.screenshot({ path: testInfo.outputPath('both-disclosures-open.png'), fullPage: true, animations: 'disabled' });
    }
    await interpretation.press('Enter');
    await expect(oak).toBeHidden();
    await expect(interpretation).toBeFocused();
    await positions.click();
    await expect(page.getByText(/historical dates are unavailable/i)).toBeVisible();

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('investigation.png'), fullPage: true, animations: 'disabled' });
  });
}

test('reduced motion and explicit playback', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('/arundhati/');
  const slider = page.getByRole('slider', { name: 'Demo step' });
  await expect(slider).toBeEnabled();
  await expect(page.locator('.star.alcor')).toHaveCSS('transition-duration', '0s');
  await page.clock.runFor(2000);
  await expect(slider).toHaveValue('0');

  await page.getByRole('button', { name: 'Play' }).click();
  await page.clock.runFor(1100);
  await expect(slider).toHaveValue('1');
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.clock.runFor(1500);
  await expect(slider).toHaveValue('1');
  await slider.press('End');
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
  await page.getByRole('button', { name: 'Replay' }).click();
  await expect(slider).toHaveValue('0');
});

test.describe('static fallback', () => {
  test.use({ javaScriptEnabled: false });

  test('the verse, source note, and data table are readable without hydration', async ({ page }) => {
    await page.goto('/arundhati/');
    await page.getByRole('link', { name: 'Read the Sanskrit', exact: true }).click();
    await expect(page).toHaveURL(/#verse$/);
    await expect(page.locator('[lang="sa-Deva"]')).toBeInViewport();
    await page.getByRole('link', { name: /BORI Bhīṣmaparvan/ }).click();
    await expect(page).toHaveURL(/#passage-source$/);
    await expect(page.getByRole('link', { name: 'Read the Sanskrit e-text' })).toBeVisible();
    await expect(page.getByText(/historical dates are unavailable/i)).toBeVisible();
    await expect(page.getByRole('slider')).toBeDisabled();
    await page.getByText('All demo positions', { exact: true }).click();
    await expect(page.getByRole('table')).toBeVisible();
  });
});
