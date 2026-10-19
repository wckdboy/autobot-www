#!/usr/bin/env node
/**
 * Visual QA: screenshots of every route at real viewports, using the installed
 * Chrome. Not part of the build. `node scripts/shots.mjs [baseUrl]`.
 */
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const BASE = process.argv[2] || 'http://127.0.0.1:4321';
const ROUTES = ['/', '/releases/', '/install/', '/privacy/', '/verify/'];
const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 1000 },
];

await mkdir('.shots', { recursive: true });
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--force-prefers-reduced-motion'],
});
for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await context.newPage();
  for (const route of ROUTES) {
    const name = route === '/' ? 'home' : route.replaceAll('/', '');
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `.shots/${vp.name}-${name}.png`, fullPage: true });
    console.log(`${vp.name} ${route}`);
  }
  await context.close();
}
await browser.close();
