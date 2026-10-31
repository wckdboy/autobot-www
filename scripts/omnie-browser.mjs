import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const executablePath = process.env.CHROME_BIN || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(existsSync);
assert(executablePath, 'Set CHROME_BIN to an installed browser');
// Launch before opening a server, so a missing browser cannot retain a listening process.
const browser = await chromium.launch({ executablePath, headless: true });
const shots = process.env.WCKD_QA_SHOTS;
try {
  if (shots) await mkdir(shots, { recursive: true });
  for (const [key, domain, lang] of [['omnie', 'omnie.sh', 'en'], ['omnie-dk', 'omnie.dk', 'da']]) {
    const root = resolve(fileURLToPath(new URL(`../dist/${key}/`, import.meta.url)));
    const server = createServer(async (request, response) => {
      try {
        let path = resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
        assert(path === root || path.startsWith(root + sep));
        if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
        const types = { '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
        response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' });
        response.end(await readFile(path));
      } catch { response.writeHead(404); response.end('Not found'); }
    });
    await new Promise(done => server.listen(0, '127.0.0.1', done));
    const origin = `http://127.0.0.1:${server.address().port}`;
    try {
      for (const [width, colorScheme] of [[1440, 'light'], [768, 'light'], [390, 'light'], [320, 'light'], [1440, 'dark']]) {
        const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme, reducedMotion: 'reduce' });
        try {
          const page = await context.newPage();
          const failures = [];
          page.on('pageerror', error => failures.push(error.message));
          page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
          page.on('requestfailed', request => failures.push(request.failure()?.errorText));
          page.on('request', request => { if (!request.url().startsWith(origin + '/')) failures.push(`External request: ${request.url()}`); });
          assert((await page.goto(origin, { waitUntil: 'networkidle' })).ok());
          await page.evaluate(() => document.fonts.ready);
          assert.equal(await page.locator('html').getAttribute('lang'), lang);
          assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `https://${domain}/`);
          assert.equal(await page.locator('h1').count(), 1);
          assert.equal(await page.locator('script, form').count(), 0, 'No onboarding, trackers or financial API calls');
          assert((await page.locator('[data-report-example]').innerText()).includes(lang === 'da' ? 'fiktive data' : 'fictional data'));
          await page.keyboard.press('Tab');
          assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('href')), '#main', 'Skip link is first keyboard stop');
          await page.getByRole('link', { name: lang === 'da' ? 'Se et rapporteksempel' : 'Explore a report example', exact: true }).click();
          assert(page.url().endsWith('#reports'));
          const tableRegion = page.locator('.report-view[open] .table-wrap').first();
          assert.equal(await tableRegion.getAttribute('tabindex'), '0', 'Narrow reports remain keyboard-scrollable');
          await tableRegion.focus();
          assert.equal(await tableRegion.evaluate(element => document.activeElement === element), true);
          const accounts = page.locator('[data-account-view]');
          assert.equal(await accounts.getAttribute('open'), null);
          await accounts.locator('summary').focus();
          await page.keyboard.press('Enter');
          assert.notEqual(await accounts.getAttribute('open'), null, 'Account example opens with the keyboard');
          assert(await accounts.locator('table').isVisible());
          const faq = page.locator('#questions details').first();
          await faq.locator('summary').focus();
          await page.keyboard.press('Enter');
          assert.notEqual(await faq.getAttribute('open'), null, 'FAQ opens with the keyboard');
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, 'No horizontal document overflow');
          assert.deepEqual(failures, [], `${key}/${width}/${colorScheme}`);
          await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
          if (shots) {
            await page.screenshot({ path: resolve(shots, `${key}-${width}-${colorScheme}.png`) });
            if (width === 1440 && colorScheme === 'light') await page.screenshot({ path: resolve(shots, `${key}-full.png`), fullPage: true });
          }
          console.log(`PASS ${domain}: ${width}px/${colorScheme}, locale, keyboard, report example, first-party assets, no overflow`);
        } finally { await context.close(); }
      }
    } finally { await new Promise(done => server.close(done)); }
  }
} finally { await browser.close(); }
