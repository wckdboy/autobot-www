#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist/wckd');
const data = JSON.parse(await readFile(resolve(root, 'src/data/public-repos.json'), 'utf8'));
const projects = JSON.parse(await readFile(resolve(root, 'src/data/projects.json'), 'utf8'));
const executablePath = process.env.CHROME_BIN || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(existsSync);
assert(executablePath, 'Set CHROME_BIN to an installed Chrome or Chromium binary');
let server, browser;
try {
  let url = process.env.WCKD_QA_URL;
  if (!url) {
    const types = { '.html':'text/html', '.css':'text/css', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.png':'image/png' };
    server = createServer(async (request, response) => {
      try {
        let file = resolve(dist, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
        assert(file === dist || file.startsWith(dist + sep));
        if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
        response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
        response.end(await readFile(file));
      } catch { response.writeHead(404); response.end('Not found'); }
    });
    await new Promise((done) => server.listen(0, '127.0.0.1', done));
    url = `http://127.0.0.1:${server.address().port}/`;
  }
  browser = await chromium.launch({ executablePath, headless: true });
  const results = [];
  for (const [name, width, height, colorScheme] of [
    ['desktop',1440,1000,'light'],['tablet',768,1024,'light'],
    ['mobile',390,844,'light'],['narrow',320,720,'light'],['dark',1440,1000,'dark'],
  ]) {
    const context = await browser.newContext({ viewport: { width,height }, colorScheme });
    const page = await context.newPage();
    const origins = new Set();
    page.on('request', (request) => { if (request.url().startsWith('http')) origins.add(new URL(request.url()).origin); });
    const response = await page.goto(url, { waitUntil:'networkidle' });
    assert(response.ok(), `${name}: homepage returned ${response.status()}`);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('li.project').count(), projects.length);
    for (const project of projects) {
      assert.equal(await page.locator(`#project-${project.id} a`).first().getAttribute('href'), project.site);
    }
    for (const image of await page.locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((element) => element.decode());
    }
    await page.evaluate(() => scrollTo(0,0));
    const metrics = await page.evaluate(() => ({
      width:innerWidth, scroll:document.documentElement.scrollWidth,
      font:document.fonts.check('16px "JetBrains Mono"'), scripts:document.scripts.length,
      overflow:[...document.querySelectorAll('body *')].filter((e) => {
        const r=e.getBoundingClientRect();return r.width>0 && r.right>innerWidth+1;
      }).slice(0,8).map((e) => e.tagName+'.'+e.className),
    }));
    assert.equal(metrics.scroll, width, `${name}: horizontal overflow`);
    assert.deepEqual(metrics.overflow, [], `${name}: overflowing elements`);
    assert(metrics.font && metrics.scripts===0);
    assert.deepEqual([...origins], [new URL(url).origin], 'Page requested a third-party resource');
    const details = page.locator('.repository-index');
    assert.equal(await details.getAttribute('open'), null);
    await details.locator('summary').focus();
    await page.keyboard.press('Enter');
    assert.equal(await details.getAttribute('open'), '');
    assert.equal(await details.locator('li').count(), data.repositories.length);
    for (const repo of data.repositories) {
      assert.equal(await details.locator(`a[href="${repo.url}"]`).count(), 1);
    }
    await page.keyboard.press('Tab');
    assert(await page.evaluate(() => document.activeElement.matches('.repository-index a')));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await details.locator('summary').focus();
    await page.keyboard.press('Enter');
    if (process.env.WCKD_QA_SHOTS) {
      await mkdir(process.env.WCKD_QA_SHOTS, { recursive:true });
      await page.evaluate(() => scrollTo(0,0));
      await page.screenshot({ path:resolve(process.env.WCKD_QA_SHOTS, name+'.png') });
    }
    results.push({ name, ...metrics, profiles:projects.length, publicRepositories:data.repositories.length, keyboardCatalog:true, firstPartyOnly:true });
    await context.close();
  }
  console.log(JSON.stringify(results,null,2));
} finally {
  if (browser) await browser.close();
  if (server) await new Promise((done) => server.close(done));
}
