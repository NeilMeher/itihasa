import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

const origin = new URL(process.argv[2] ?? 'http://127.0.0.1:4329').origin;
const fixture = JSON.parse(await readFile(new URL('./fixtures/calendar-benchmarks.json', import.meta.url), 'utf8'));
const reference = fixture.cases.find((entry) => entry.date === '2025-01-01');
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const access = bypass && new URL(origin).hostname.endsWith('.vercel.app') ? { 'x-vercel-protection-bypass': bypass } : {};
const previewAccess = process.env.ITIHASA_PREVIEW_ACCESS_URL;
const browser = await chromium.launch();
const context = await browser.newContext({ baseURL: origin, viewport: { width: 360, height: 640 }, hasTouch: true });
if (Object.keys(access).length) await context.route(`${origin}/**`, (route) => route.continue({ headers: { ...route.request().headers(), ...access } }));
const page = await context.newPage();
const failures = [];
page.on('pageerror', (error) => failures.push(error.message));
page.on('response', (reply) => {
  if (reply.url().startsWith(`${origin}/`) && reply.status() >= 400) failures.push(`${reply.status()} ${new URL(reply.url()).pathname}`);
});

try {
  if (previewAccess) {
    const share = new URL(previewAccess);
    assert.equal(share.origin, origin);
    assert.ok(share.searchParams.has('_vercel_share'));
    assert.ok((await context.request.get(share.href)).ok(), 'Vercel preview access failed');
  }
  await page.goto('/');
  const branch = page.getByRole('navigation', { name: 'Whole-project Mind Map' }).getByRole('link', { name: /^Mahābhārata/ });
  await expect(branch).toHaveAttribute('aria-expanded', 'false');
  await branch.tap();
  await page.locator('#home-branch').getByRole('link', { name: 'The dice match', exact: true }).tap();
  const story = page.getByRole('article', { name: 'Selected reading' });
  await expect(story.getByRole('heading', { name: 'The dice match' })).toBeInViewport();
  await page.getByRole('button', { name: 'Timeline', exact: true }).tap();
  await expect(page.getByRole('region', { name: 'Timeline', exact: true }).getByRole('button', { name: /The dice match/ })).toHaveAttribute('aria-current', 'step');
  await story.getByRole('button', { name: 'Sources', exact: true }).tap();
  await story.getByRole('link', { name: 'Chapter and primary text' }).tap();
  await expect(page).toHaveURL(/\/mahabharata\/parva\/02\/#chapter-60$/);
  await page.goBack();
  await expect(story.getByRole('button', { name: 'Sources', exact: true })).toHaveAttribute('aria-pressed', 'true');

  for (const [path, title] of [
    ['/?branch=ramayana&node=ra-episode-ring&person=ra-person-sita&view=map', 'Sītā recognizes the ring'],
    ['/?branch=maratha&node=maratha-place-raigad&view=map', 'Raigad'],
    ['/?branch=research&node=claim-oak-ahead&view=map&journey=read-the-omen&step=3&panel=investigation&bounds=stars%2Cseason', 'Arundhatī and Vasiṣṭha'],
  ]) {
    await page.goto(path);
    await expect(story.getByRole('heading', { name: title, exact: true })).toBeVisible();
  }
  await expect(story).toContainText('Historical result · Unavailable');

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Search the map' }).fill('BORI 2.57');
  await page.getByRole('link', { name: /^BORI chapter 2.57/ }).click();
  await expect(page.getByRole('link', { name: /Open the exact Library entry/ })).toHaveAttribute('href', '/mahabharata/parva/02/#chapter-57');

  await page.goto('/panchang/?date=2025-01-01');
  const dailyReply = page.waitForResponse((reply) => reply.url() === `${origin}/api/v1/panchang`);
  await page.getByRole('button', { name: 'Calculate day' }).tap();
  const daily = await dailyReply;
  assert.equal(daily.status(), 200);
  assert.equal(daily.headers()['cache-control'], 'no-store');
  const result = await daily.json();
  assert.deepEqual(result.month, reference.month);
  const delta = (one, two) => Math.abs(Date.parse(one) - Date.parse(two)) / 1000;
  for (const field of ['sunrise', 'sunset']) assert.ok(delta(result[field], reference[field]) <= fixture.sunrise_tolerance_seconds, field);
  for (const [name, [value, until]] of Object.entries(reference.limbs)) {
    const limb = result.limbs.find((entry) => entry.label === name);
    assert.equal(limb.value, value);
    assert.ok(delta(limb.until, until) <= fixture.boundary_tolerance_seconds, name);
  }
  await expect(page.getByRole('region', { name: 'Pañchāṅga result' })).toContainText('Dvitīyā');

  await page.goto('/birth-sky/');
  const birthReply = page.waitForResponse((reply) => reply.url() === `${origin}/api/v1/birth-sky`);
  await page.getByRole('button', { name: 'Try an example' }).tap();
  const birth = await birthReply;
  assert.equal(birth.status(), 200);
  assert.equal(birth.headers()['cache-control'], 'no-store');
  const example = await birth.json();
  assert.deepEqual([example.rashi, example.nakshatra, example.lagna], ['Makara', 'Uttara Āṣāḍhā', 'Dhanu']);
  await expect(page).toHaveURL(`${origin}/birth-sky/`);
  await expect(page.getByRole('region', { name: 'Birth sky result' })).toContainText('Makara');

  for (const data of ['{', JSON.stringify({ city: 'delhi', date: '2028-01-01' })]) {
    const reply = await context.request.post(`${origin}/api/v1/panchang`, { data, headers: { ...access, 'content-type': 'application/json', origin } });
    assert.equal(reply.status(), 400);
    assert.equal(reply.headers()['cache-control'], 'no-store');
    assert.ok((await reply.json()).error);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const branches = page.getByRole('navigation', { name: 'Whole-project Mind Map' });
  const branchLinks = branches.getByRole('link');
  await expect(branchLinks).toHaveCount(6);
  const routes = await branchLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  for (const path of ['/explorer/', ...routes]) {
    const reply = await context.request.get(`${origin}${path}`, { headers: access });
    assert.ok(reply.ok(), `${path} returned ${reply.status()}`);
  }
  const edges = await context.request.get(`${origin}/map/edges/mahabharata.json`, { headers: access });
  assert.ok(edges.ok() && (await edges.json()));
  await branches.getByRole('link', { name: /^Mahābhārata/ }).click();
  await page.locator('#home-branch').getByRole('link', { name: 'The dice match', exact: true }).click();
  await expect(story.getByRole('heading', { name: 'The dice match' })).toBeVisible();
  assert.deepEqual(failures, []);
  console.log(`Verified mobile and desktop map, six branch routes, Explorer, relationship JSON, search, chapter return, three direct readings, both calculator fixtures and error handling at ${origin}.`);
} finally {
  await browser.close();
}
