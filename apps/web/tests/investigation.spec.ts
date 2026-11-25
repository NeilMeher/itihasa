import { expect, test } from '@playwright/test';

for (const width of [360, 390, 1280]) {
  test(`investigation at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('requestfailed', (request) => errors.push(request.url()));
    page.on('response', (response) => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });

    const response = await page.goto('/');
    expect(response?.ok()).toBe(true);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('What did Vyāsa mean');
    await expect(page.locator('[lang="sa-Deva"]')).toContainText('वसिष्ठः');
    await page.getByRole('link', { name: 'Explore the two stars' }).click();
    await expect(page).toHaveURL(/#sky$/);
    await expect(page.getByText('illustrative sky', { exact: true })).toBeVisible();

    const slider = page.getByRole('slider', { name: 'Demo step' });
    await expect(slider).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await page.getByRole('button', { name: 'Next' }).click();
    await slider.press('ArrowRight');
    await expect(slider).toHaveAttribute('aria-valuetext', 'Step 3 of 6');
    await expect(page.getByText('Alcor reaches the meridian first in this illustration.')).toBeVisible();
    await page.getByText('All demo positions', { exact: true }).click();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('row', { name: '3 On the meridian 24 east' })).toBeVisible();
    await page.getByText('All demo positions', { exact: true }).click();

    await page.getByRole('link', { name: 'Sources', exact: true }).click();
    await expect(page).toHaveURL(/#sources$/);
    await expect(page.getByRole('link', { name: 'Read the Sanskrit e-text' })).toHaveAttribute('href', /MBh06\.txt.*06002031a$/);
    const interpretation = page.locator('summary').filter({ hasText: 'Oak’s interpretation' });
    await interpretation.press('Enter');
    const oak = page.getByRole('link', { name: /read Oak’s original explanation/i });
    await expect(oak).toBeVisible();
    await expect(oak).toHaveAttribute('href', 'https://nileshoak.wordpress.com/2016/02/08/arundhati-vasistha/');
    await interpretation.press('Enter');
    await expect(oak).toBeHidden();
    await expect(interpretation).toBeFocused();
    await expect(page.getByText(/historical dates are unavailable/i)).toBeVisible();

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('investigation.png'), fullPage: true });
  });
}

test('reduced motion and explicit playback', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('/');
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
    await page.goto('/');
    await expect(page.locator('[lang="sa-Deva"]')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Read the Sanskrit e-text' })).toBeVisible();
    await expect(page.getByText(/historical dates are unavailable/i)).toBeVisible();
    await expect(page.getByRole('slider')).toBeDisabled();
    await page.getByText('All demo positions', { exact: true }).click();
    await expect(page.getByRole('table')).toBeVisible();
  });
});
