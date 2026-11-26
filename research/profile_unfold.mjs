import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const [baseline = 'http://127.0.0.1:4327', release = 'http://127.0.0.1:4329', dir = '.tools/unfold-qa'] = process.argv.slice(2);
await mkdir(dir, { recursive: true });
const browser = await chromium.launch();
const round = (start) => Math.round(performance.now() - start);

async function run(context, viewport, changed) {
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  if (viewport.width < 700) {
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750,
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }
  let transferred = 0;
  cdp.on('Network.loadingFinished', ({ encodedDataLength }) => { transferred += encodedDataLength; });
  await page.addInitScript(() => {
    window.flowCLS = 0;
    let first = 0;
    let previous = 0;
    let session = 0;
    new PerformanceObserver(({ getEntries }) => {
      for (const entry of getEntries()) {
        if (entry.hadRecentInput) continue;
        if (entry.startTime - previous > 1000 || entry.startTime - first > 5000) {
          session = 0;
          first = entry.startTime;
        }
        previous = entry.startTime;
        session += entry.value;
        window.flowCLS = Math.max(window.flowCLS, session);
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  const samples = {};
  try {
    for (const cache of ['cold', 'warm']) {
      transferred = 0;
      let from = performance.now();
      await page.goto('/', { waitUntil: 'commit' });
      const branch = page.getByRole('navigation', { name: 'Whole-project Mind Map' }).getByRole('link', { name: /^Mahābhārata/ });
      await branch.waitFor({ state: 'visible' });
      const firstBranch = round(from);
      if (changed) await page.locator('a[data-home-branch="mahabharata"][aria-expanded="false"]').waitFor();
      const branchEnhanced = round(from);
      const startBytes = transferred;
      const cls = [await page.evaluate(() => window.flowCLS)];
      from = performance.now();
      await branch.click();
      const dice = page.getByRole('link', { name: 'The dice match', exact: true });
      await dice.waitFor({ state: 'visible' });
      const branchEntries = round(from);
      cls.push(await page.evaluate(() => window.flowCLS));
      from = performance.now();
      await dice.click();
      await page.locator(':is(.home-quick-reading,.explorer-reading) h2:visible').filter({ hasText: /^The dice match$/ }).first().waitFor();
      const story = round(from);
      await page.locator('.map-diagram button:enabled').first().waitFor();
      const graph = round(from);
      await page.waitForLoadState('networkidle');
      cls.push(await page.evaluate(() => window.flowCLS));
      samples[cache] = { firstBranch, branchEnhanced, branchEntries, story, graph, startBytes, transferred,
        layoutShift: Number(Math.max(...cls).toFixed(3)) };
    }
  } finally { await page.close(); }
  return samples;
}

try {
  const report = {};
  for (const viewport of [{ width: 360, height: 640 }, { width: 1280, height: 900 }]) {
    report[viewport.width] = { baseline: [], release: [] };
    for (let i = 0; i < 3; ++i) {
      for (const [label, baseURL] of [['baseline', baseline], ['release', release]]) {
        const context = await browser.newContext({ baseURL, viewport, reducedMotion: 'reduce' });
        try { report[viewport.width][label].push(await run(context, viewport, label === 'release')); }
        finally { await context.close(); }
        console.log(`${viewport.width}px ${label} run ${i + 1}`);
      }
    }
    await writeFile(`${dir}/unfold-timings.json`, JSON.stringify(report, null, 2) + '\n');
  }
} finally { await browser.close(); }
