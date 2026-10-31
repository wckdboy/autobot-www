#!/usr/bin/env node
// Browser smoke for built family sites. An explicit manifest keeps sibling ownership visible.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const sharedKeys = ['autobot', 'invincible', 'sovware', 'wckd', 'omnie', 'nightfall', 'tinyrex'];
const sites = process.argv[2] ? JSON.parse(await readFile(process.argv[2], 'utf8'))
  : sharedKeys.map(name => ({
    name, brandKey: name, directory: fileURLToPath(new URL(`../dist/${name}/`, import.meta.url)),
  }));
const kit = JSON.parse(await readFile(new URL('../brand/kit.json', import.meta.url), 'utf8'));
const executablePath = process.env.CHROME_BIN || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(existsSync);
assert(executablePath, 'Set CHROME_BIN to an installed browser');
const browser = await chromium.launch({ executablePath, headless: true });
const shots = process.env.WCKD_QA_SHOTS;
if (shots) await mkdir(shots, { recursive: true });
try {
  for (const entry of sites) {
    assert(entry.brandKey === undefined || (typeof entry.brandKey === 'string' && Object.hasOwn(kit.brands, entry.brandKey)), `Unknown brandKey: ${entry.brandKey}`);
    const site = { ...entry, brandKey: entry.brandKey ?? (sharedKeys.includes(entry.name) ? entry.name : undefined) };
    if (!site.brandKey) console.log(`LAYOUT ONLY ${site.name}: independent site; shared brand-page/manifest checks do not apply`);
    const root = resolve(site.directory);
    const missing = new Set();
    const server = createServer(async (request, response) => {
      try {
        let file = resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
        assert(file === root || file.startsWith(root + sep));
        if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
        const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
        response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
        response.end(await readFile(file));
      } catch { missing.add(request.url); response.writeHead(404); response.end('Not found'); }
    });
    await new Promise((done) => server.listen(0, '127.0.0.1', done));
    try {
      for (const [name, width, height, colorScheme] of [
        ['desktop', 1440, 1000, 'light'], ['mobile', 390, 844, 'light'],
        ['narrow', 320, 720, 'light'], ['dark', 1440, 1000, 'dark'],
      ]) {
        const context = await browser.newContext({ viewport: { width, height }, colorScheme, reducedMotion: 'reduce' });
        try {
          const page = await context.newPage();
          const errors = [];
          page.on('pageerror', (error) => errors.push(error.message));
          page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
          page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
          const response = await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'networkidle' });
          assert(response.ok(), `${site.name}/${name}: failed homepage`);
          await page.evaluate(() => document.fonts.ready);
          assert.equal(await page.locator('h1').count(), 1, `${site.name}: one main heading`);
          if (site.brandKey !== 'tinyrex') assert(await page.locator('a[href="https://creed.sh"],a[href="./creed.md"]').count(), `${site.name}: missing Creed`);
          const metrics = await page.evaluate(() => ({
            width: innerWidth, scroll: document.documentElement.scrollWidth,
            background: getComputedStyle(document.body).backgroundColor,
            font: getComputedStyle(document.body).fontFamily,
            overflow: [...document.querySelectorAll('body *')].filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.width > 0 && rect.right > innerWidth + 1 && getComputedStyle(element).position !== 'fixed' && !element.closest('.path-menu');
            }).slice(0, 8).map((element) => `${element.tagName}.${element.className}`),
          }));
          if (shots) await page.screenshot({ path: resolve(shots, `${site.name}-${name}.png`) });
          if (metrics.scroll !== width) console.error(await page.evaluate(() => [...document.querySelectorAll('.path-layout,.path-menu,.verify-layout,.verify-layout > *,.handoff,.terminal,.section,.machine-grid,.section-head,.hero,.skill-toolbar,.phase-grid')].map((element) => ({ node: element.className, width: element.getBoundingClientRect().width, right: element.getBoundingClientRect().right, overflow: getComputedStyle(element).overflowX })).filter((value) => value.right > innerWidth)));
          assert.equal(metrics.scroll, width, `${site.name}/${name}: horizontal overflow ${JSON.stringify(metrics.overflow)}`);
          assert(metrics.font.includes('JetBrains Mono'), `${site.name}: wrong family typography`);
          if (site.brandKey === 'tinyrex') {
            assert.equal(await page.locator('h1').innerText(), 'tinyrex');
            assert.equal(await page.locator('script, canvas, img, video, button, input, form, section').count(), 0, 'Tinyrex stays minimal');
            assert.deepEqual(await page.locator('nav a').allTextContents(), ['source', 'wckd']);
          }
          if (site.name === 'creed') {
            await page.locator('.skill-card').first().click();
            assert(await page.locator('#skill-drawer').isVisible());
            await page.keyboard.press('Escape');
            assert(!(await page.locator('#skill-drawer').isVisible()));
          }
          assert.deepEqual(errors, [], `${site.name}/${name}: client errors`);
          await page.evaluate(() => scrollTo(0, 0));
          if (shots) await page.screenshot({ path: resolve(shots, `${site.name}-${name}.png`) });
          console.log(`PASS ${site.name}/${name}: ${width}px, ${metrics.background}, no overflow or client errors`);
          if (site.brandKey) {
            const manifest = await (await page.request.get(`http://127.0.0.1:${server.address().port}/site.webmanifest`)).json();
            assert.equal(manifest.short_name.toLowerCase(), kit.brands[site.brandKey].name.toLowerCase(), `${site.name}: manifest identity`);
            // Descriptive branding changes must preserve install identity, fields and icon paths.
            assert.deepEqual(Object.keys(manifest).sort(), ['name', 'short_name', 'description', 'start_url', 'display', 'background_color', 'theme_color', 'icons'].sort());
            assert.equal(manifest.start_url, '/');
            assert.equal(manifest.display, 'minimal-ui');
            assert.deepEqual(manifest.icons, [
              { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
              { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
            ]);
            await page.goto(`http://127.0.0.1:${server.address().port}/brand/`, { waitUntil: 'networkidle' });
            const own = kit.brands[site.brandKey];
            assert.equal(await page.getByRole('row').filter({ hasText: 'Signal on paper' }).locator('code').textContent(), own.onPaper);
            assert.equal(await page.getByRole('row').filter({ hasText: 'Signal on ink' }).locator('code').textContent(), own.onInk);
            const family = page.locator('table').filter({ has: page.getByRole('columnheader', { name: 'Brand', exact: true }) });
            for (const brand of Object.values(kit.brands)) {
              const row = family.getByRole('row').filter({ has: page.getByText(brand.name, { exact: true }) });
              assert.deepEqual(await row.locator('code').allTextContents(), [brand.onPaper, brand.onInk]);
            }
            const expected = colorScheme === 'dark' ? kit.brands.wckd.onInk : kit.brands.wckd.onPaper;
            const actual = await page.locator('.kit-inline').first().evaluate(el => getComputedStyle(el).color);
            const rgb = expected.slice(1).match(/../g).map(v => parseInt(v, 16));
            assert.equal(actual, `rgb(${rgb.join(', ')})`, `${site.name}/${name}: surface-specific family symbol`);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, `${site.name}/${name}: brand overflow`);
            if (shots) await page.screenshot({ path: resolve(shots, `${site.name}-brand-${name}.png`) });
            console.log(`PASS ${site.name}/brand/${name}: both canonical shades and dark-surface symbol`);
          }
          assert.deepEqual(errors, [], `${site.name}/${name}: page, module or resource errors`);
        } finally { await context.close(); }
      }
      assert.deepEqual([...missing], [], `${site.name}: missing assets`);
    } finally { await new Promise((done) => server.close(done)); }
  }
} finally { await browser.close(); }
