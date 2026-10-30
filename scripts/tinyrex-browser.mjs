#!/usr/bin/env node
// Current contract: a minimal, zero-JavaScript holding page. The learning site was withdrawn.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';

const dist = resolve('dist/tinyrex');
assert(!existsSync(resolve(dist, 'rex')) && !existsSync(resolve(dist, 'tinyrex')), 'Withdrawn lesson/media assets must not ship');
const shots = process.env.TINYREX_SHOTS || resolve(process.env.RUNNER_TEMP || tmpdir(), 'opencode/tinyrex-minimal-shots');
await mkdir(shots, { recursive: true });
const server = createServer(async (req, res) => {
  try {
    let path = resolve(dist, `.${decodeURIComponent(new URL(req.url, 'http://localhost').pathname)}`);
    assert(path === dist || path.startsWith(dist + sep));
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    const types = { '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
    res.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream');
    res.end(await readFile(path));
  } catch { res.writeHead(404).end(); }
});
const executablePath = process.env.CHROME_BIN || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(existsSync);
assert(executablePath, 'Set CHROME_BIN to an installed browser');
const browser = await chromium.launch({ executablePath, headless: true });
try {
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  const base = process.env.TINYREX_URL || `http://127.0.0.1:${server.address().port}`;
  for (const width of [1440, 768, 390, 320]) for (const colorScheme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme, javaScriptEnabled: false });
    const errors = [], external = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
    page.on('request', request => { if (!request.url().startsWith(base)) external.push(request.url()); });
    const response = await page.goto(base, { waitUntil: 'networkidle' });
    assert(response.ok());
    assert.equal(await page.locator('h1').innerText(), 'tinyrex');
    assert.equal(await page.locator('script, canvas, img, video, button, input, select, form, details, section').count(), 0);
    assert.deepEqual(await page.locator('nav a').allTextContents(), ['source', 'wckd']);
    assert.equal(await page.locator('a[href="https://github.com/WCKDai/tinyrex"]').count(), 1);
    assert.equal(await page.locator('a[href="https://wckd.ai"]').count(), 1);
    assert((await page.locator('body').innerText()).trim().split(/\s+/).length <= 20, 'Keep the page minimal');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    assert.equal(await page.evaluate(() => document.documentElement.scrollHeight), 900);
    assert.match(await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily), /JetBrains Mono/);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').innerText(), 'source');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').innerText(), 'wckd');
    assert.deepEqual(errors, []); assert.deepEqual(external, []);
    await page.screenshot({ path: `${shots}/${width}-${colorScheme}.png`, fullPage: true });
    console.log(`PASS ${width}px ${colorScheme}: minimal, no scripts/media/controls, keyboard links, no overflow/errors`);
    await page.close();
  }
} finally {
  try { await browser.close(); }
  finally { if (server.listening) await new Promise(done => server.close(done)); }
}
