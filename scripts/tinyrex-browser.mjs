#!/usr/bin/env node
// Run after SITE_KEY=tinyrex build + postbuild. Browser evidence stays outside git.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';

const dist = resolve('dist/tinyrex');
const shots = process.env.TINYREX_SHOTS || resolve(process.env.RUNNER_TEMP || tmpdir(), 'opencode/tinyrex-learning-shots');
await mkdir(shots, { recursive: true });
const types = { '.html': 'text/html', '.css': 'text/css', '.mjs': 'text/javascript', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    let path = resolve(dist, `.${decodeURIComponent(new URL(req.url, 'http://localhost').pathname)}`);
    if (!path.startsWith(dist + sep) && path !== dist) { res.writeHead(403).end(); return; }
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    res.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream');
    res.end(await readFile(path));
  } catch { res.writeHead(404).end(); }
});
const executablePath = process.env.CHROME_BIN || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(existsSync);
assert(executablePath, 'Set CHROME_BIN to an installed browser');
const browser = await chromium.launch({ executablePath, headless: true });
let checks = 0;
try {
  await new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', done);
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const width of [1440, 768, 390, 320]) for (const colorScheme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, colorScheme, reducedMotion: 'reduce' });
    const errors = [], external = [], missing = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (!request.url().startsWith(base)) external.push(request.url()); });
    page.on('response', response => { if (response.status() >= 400) missing.push(response.url()); });
    await page.goto(base, { waitUntil: 'networkidle' });
    if (colorScheme === 'dark') {
      const unreadableLabels = await page.locator('.rex-svg-label').evaluateAll(labels => labels.filter(label => getComputedStyle(label).fill === 'rgb(0, 0, 0)').length);
      assert.equal(unreadableLabels, 0, 'SVG captions must not default to black in dark mode');
    }
    await page.screenshot({ path: `${shots}/${width}-${colorScheme}-hero.png` });
    assert.equal(await page.locator('[data-gait-play]').getAttribute('aria-pressed'), 'false');
    assert.equal(await page.locator('[data-joint]').count(), 18);
    const joints = await page.locator('[data-joint]').evaluateAll(buttons => buttons.map(button => button.dataset.joint));
    for (const id of joints) {
      await page.locator(`[data-joint="${id}"]`).click();
      assert.equal(await page.locator(`[data-joint="${id}"]`).getAttribute('aria-pressed'), 'true');
      await page.locator('#joint-angle').focus();
      await page.keyboard.press('Home');
      assert.equal(await page.locator('#joint-angle').inputValue(), await page.locator('#joint-angle').getAttribute('min'));
      await page.keyboard.press('End');
      assert.equal(await page.locator('#joint-angle').inputValue(), await page.locator('#joint-angle').getAttribute('max'));
    }
    await page.locator('[data-joint="left_hip_pitch"]').focus();
    await page.keyboard.press('Enter');
    await page.locator('[data-joint-reset]').click();
    assert.equal(await page.locator('#joint-angle').inputValue(), '0');
    await page.locator('[data-balance-challenge]').click();
    assert.equal(await page.locator('[data-balance-status]').innerText(), 'Outside');
    await page.locator('#balance-lateral').fill('-35');
    assert.equal(await page.locator('[data-balance-status]').innerText(), 'Inside');
    await page.locator('[data-balance-reset]').click();
    assert.equal(await page.locator('#balance-stance').inputValue(), 'double');
    await page.locator('#gait-height').fill('175');
    assert.match(await page.locator('[data-gait-reach]').innerText(), /Out of reach/);
    await page.locator('[data-gait-reset]').click();
    assert.equal(await page.locator('#gait-height').inputValue(), '125');
    assert.equal(await page.locator('[data-gait-play]').getAttribute('aria-pressed'), 'false');
    await page.locator('[data-gait-play]').click();
    await page.waitForFunction(() => Number(document.querySelector('#gait-phase').value) > 2);
    await page.locator('#rex-title').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('[data-gait-play]').getAttribute('aria-pressed') === 'false');
    await page.locator('[data-gait-play]').click();
    await page.waitForFunction(() => document.querySelector('[data-gait-play]').getAttribute('aria-pressed') === 'true');
    await page.locator('[data-gait-play]').click();
    const phase = await page.locator('#gait-phase').inputValue();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.locator('#gait-phase').inputValue(), phase);
    await page.locator('#gait-phase').fill('81');
    assert.equal(await page.locator('[data-gait-mode]').innerText(), 'Swing');
    await page.locator('[data-gait-reset]').click();
    for (const form of await page.locator('[data-quiz]').all()) {
      const answer = await form.getAttribute('data-answer');
      await form.locator(`input[value="${answer === '0' ? '1' : '0'}"]`).check();
      await form.locator('button[type="submit"]').click();
      assert.match(await form.locator('.rex-quiz-feedback').innerText(), /Not quite/);
      await form.locator(`input[value="${answer}"]`).check();
      await form.locator('button[type="submit"]').click();
      assert.match(await form.locator('.rex-quiz-feedback').innerText(), /^Correct/);
      await form.locator('button[type="reset"]').click();
      assert.equal(await form.locator('input:checked').count(), 0);
    }
    const overflow = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth,
      elements: [...document.querySelectorAll('.tinyrex-learning *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 5).map(el => el.tagName + '.' + el.className) }));
    assert.ok(overflow.page <= width, JSON.stringify(overflow));
    assert.deepEqual(overflow.elements, []);
    const badSvg = await page.locator('.tinyrex-learning svg').evaluateAll(elements => elements.some(el => /NaN|Infinity/.test(el.outerHTML)));
    assert.equal(badSvg, false);
    assert.deepEqual(errors, []); assert.deepEqual(external, []); assert.deepEqual(missing, []);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${shots}/${width}-${colorScheme}.png`, fullPage: true });
    if (width === 1440 || width === 320) {
      for (const id of ['joints', 'balance', 'gait']) await page.locator(`#${id}`).screenshot({ path: `${shots}/${width}-${colorScheme}-${id}.png` });
    }
    console.log(`✓ ${width}px ${colorScheme}: controls, keyboard, playback, quizzes, bounds, no egress/errors`);
    checks++;
    await page.close();
  }
  const nojs = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
  await nojs.goto(base);
  assert.match(await nojs.locator('noscript').innerText(), /explanations and source links work/);
  assert.ok(await nojs.locator('h1').isVisible());
  await nojs.close();
  const normal = await browser.newPage({ reducedMotion: 'no-preference' });
  await normal.goto(base);
  assert.equal(await normal.locator('[data-gait-play]').getAttribute('aria-pressed'), 'false');
  await normal.locator('[data-gait-play]').focus();
  await normal.keyboard.press('Space');
  await normal.waitForFunction(() => Number(document.querySelector('#gait-phase').value) > 2);
  await normal.emulateMedia({ reducedMotion: 'reduce' });
  await normal.waitForFunction(() => document.querySelector('[data-gait-play]').getAttribute('aria-pressed') === 'false');
  await normal.goto(`${base}/brand/`);
  assert.match(await normal.locator('meta[name="description"]').getAttribute('content'), /Tinyrex brand kit/);
  const manifest = await (await normal.request.get(`${base}/site.webmanifest`)).json();
  assert.match(manifest.description, /18-joint/);
  assert.equal(manifest.short_name.toLowerCase(), 'tinyrex');
  for (const anchor of ['learn', 'joints', 'balance', 'gait', 'build']) {
    assert.ok(await normal.locator(`.nav a[href="/#${anchor}"]`).count(), `supporting-page navigation: ${anchor}`);
  }
  assert.doesNotMatch(await normal.locator('footer').innerText(), /was designed by an AI agent/);
  await normal.close();
  console.log(`✓ ${checks} viewport/theme combinations + no-JS fallback; screenshots: ${shots}`);
} finally {
  try { await browser.close(); }
  finally { if (server.listening) await new Promise(done => server.close(done)); }
}
