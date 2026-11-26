import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const prefix = process.argv[2] ?? 'preview';
const base = process.argv[3] ?? 'http://127.0.0.1:4323';
const pathname = process.argv[4] ?? '/mahabharata/';
const dir = process.argv[5] ?? '.tools/expansion-qa';
await mkdir(dir, { recursive: true });
const browser = await chromium.launch();
const results = {};
try {
  for (const name of ['mobile', 'desktop']) {
    const context = await browser.newContext({
      viewport: name === 'mobile' ? { width: 360, height: 640 } : { width: 1280, height: 900 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    if (name === 'mobile') {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750,
      });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    }
    const records = [];
    for (const cache of ['cold', 'warm']) {
      const started = performance.now();
      const response = await page.goto(base + pathname, { waitUntil: 'domcontentloaded' });
      if (!response?.ok()) throw new Error(`${pathname} returned ${response?.status()}`);
      if (pathname === '/mahabharata/') await page.locator('button[aria-label="Next scene"]:enabled').waitFor();
      else if (pathname === '/') await page.getByRole('link', { name: 'Open the Explorer' }).waitFor();
      else if (pathname.startsWith('/explorer/') && !pathname.includes('view=map')) await page.getByRole('region', { name: 'Timeline', exact: true }).getByRole('searchbox').and(page.locator(':enabled')).waitFor();
      else await page.locator('input[type="search"]:enabled').last().waitFor();
      const ready = Math.round(performance.now() - started);
      await page.waitForLoadState('networkidle');
      const metrics = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        const resources = performance.getEntriesByType('resource');
        return {
          domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
          transferredBytes: nav.transferSize + resources.reduce((sum, item) => sum + item.transferSize, 0),
          scripts: resources.filter((item) => new URL(item.name).pathname.endsWith('.js')).length,
        };
      });
      records.push({ cache, usableMs: ready, ...metrics });
    }
    await page.screenshot({ path: `${dir}/${prefix}-${name}.png` });
    results[name] = records;
    await context.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
await writeFile(`${dir}/${prefix}.json`, JSON.stringify(results, null, 2) + '\n');
