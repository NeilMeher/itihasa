import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

const [build = 'after', origin = 'http://127.0.0.1:4327', output = '.tools/map-home-qa'] = process.argv.slice(2);
const baseline = build === 'before';
const launchPoints = ['home', 'branch', 'timeline', 'map'];
const viewports = [{ width: 360, height: 640 }, { width: 390, height: 844 }, { width: 1280, height: 900 }];
await mkdir(output, { recursive: true });
const browser = await chromium.launch();

async function contextFor(viewport) {
  const context = await browser.newContext({ baseURL: origin, viewport, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    let total = 0;
    let maximum = 0;
    let first = 0;
    let last = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        if (entry.startTime - last > 1000 || entry.startTime - first > 5000) {
          total = 0;
          first = entry.startTime;
        }
        total += entry.value;
        last = entry.startTime;
        maximum = Math.max(maximum, total);
      }
      window.measuredCLS = maximum;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  const page = await context.newPage();
  if (viewport.width < 700) {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750,
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }
  return { page, context };
}

function heading(page, name) {
  return page.getByRole('article', { name: 'Selected reading' }).getByRole('heading', { name, exact: true });
}

async function snapshot(page) {
  await page.waitForLoadState('networkidle');
  return page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    return {
      bytes: navigation.transferSize + resources.reduce((sum, entry) => sum + entry.transferSize, 0),
      cls: Number((window.measuredCLS ?? 0).toFixed(3)),
    };
  });
}

async function inspect(page, mode, label) {
  const category = baseline ? page.locator('.explorer-home-cards').getByRole('link', { name: 'Mahābhārata', exact: true }) :
    page.getByRole('navigation', { name: 'Whole-project Mind Map' }).getByRole('link', { name: /^Mahābhārata/ });
  if (mode === 'branch') await page.goto('/');
  const started = performance.now();
  if (mode === 'branch') await category.click();
  else await page.goto(mode === 'home' ? '/' : mode === 'timeline' ? '/explorer/' : '/explorer/?node=ma-person-draupadi&view=map', { waitUntil: 'domcontentloaded' });
  const diceLink = page.getByRole('link', { name: 'The dice match', exact: true });
  const timelineAction = page.getByRole('region', { name: 'Timeline', exact: true }).getByRole('searchbox').and(page.locator(':enabled'));
  const action = mode === 'home' ? (baseline ? page.getByRole('link', { name: 'Open the Explorer' }) : category) :
    mode === 'branch' && !baseline ? diceLink :
    mode === 'map' ? page.locator('.map-diagram button:enabled').first() : timelineAction;
  const story = mode === 'map' ? heading(page, 'Draupadī') : mode === 'timeline' ? heading(page, 'Who tells the Mahābhārata?') : heading(page, 'The dice match');
  const mark = async (locator, from = started) => { await locator.waitFor({ state: 'visible' }); return Math.round(performance.now() - from); };
  const [actionMs, storyMs] = await Promise.all([mark(action), mode === 'home' || (mode === 'branch' && !baseline) ? null : mark(story)]);
  const geometry = async (locator) => Math.round((await locator.boundingBox())?.y ?? -1);
  const stats = { actionMs, storyMs, ...(await snapshot(page)) };
  if (label) {
    stats.actionTop = await geometry(action);
    stats.markerTop = mode === 'timeline' ? await geometry(page.locator('.explorer-mobile-event:visible, .explorer-events button').first()) : null;
    stats.storyTop = storyMs === null ? null : await geometry(story);
    await page.screenshot({ path: `${output}/${build}-${mode}-${label}.png` });
  }
  if (mode === 'branch' && !baseline) {
    const storyStart = performance.now();
    await diceLink.click();
    stats.storyAfterClickMs = await mark(story, storyStart);
    stats.reading = await snapshot(page);
    if (label) await page.screenshot({ path: `${output}/${build}-first-reading-${label}.png` });
  }
  return stats;
}

const report = {};
try {
  for (const viewport of viewports) {
    const rows = {};
    for (const mode of launchPoints) {
      const results = [];
      const repetitions = viewport.width === 390 ? 1 : 3;
      for (let run = 1; run <= repetitions; run++) {
        const { page, context } = await contextFor(viewport);
        try {
          const cold = await inspect(page, mode, run === 1 ? `${viewport.width}` : '');
          const warm = await inspect(page, mode, '');
          results.push({ cold, warm });
        } finally { await context.close(); }
      }
      rows[mode] = results;
      console.log(`${build} ${viewport.width}px ${mode} (${repetitions})`);
    }
    report[viewport.width] = rows;
    await writeFile(`${output}/${build}-map-release.json`, JSON.stringify(report, null, 2) + '\n');
  }
} finally { await browser.close(); }
