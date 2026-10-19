#!/usr/bin/env node
/**
 * Regenerate the three 1200×630 social cards from scripts/og.html with the
 * installed Chrome. Run after changing copy or a release version:
 *
 *   pnpm og
 *
 * The script serves the repo locally (for fonts and releases.json), screenshots
 * each variant, and writes public/og/<site>.png.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME =
  process.env.CHROME_PATH ||
  (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : '/usr/bin/google-chrome');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
};

const server = createServer(async (req, res) => {
  try {
    const path = normalize(decodeURIComponent((req.url || '/').split('?')[0]));
    const file = join(ROOT, path);
    if (!file.startsWith(ROOT)) throw new Error('outside root');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const { port } = server.address();

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const site of ['autobot', 'invincible', 'sovware']) {
  await page.goto(`http://127.0.0.1:${port}/scripts/og.html?site=${site}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(ROOT, 'public/og', `${site}.png`) });
  console.log(`→ public/og/${site}.png`);
}
const data = JSON.parse(await readFile(join(ROOT, 'src/data/releases.json'), 'utf8'));
await page.goto(`http://127.0.0.1:${port}/scripts/og-lab.html?v=${(data.autobot.latest?.tag || 'v1.10.0').replace(/^v/, '')}`, { waitUntil: 'networkidle' });
await page.screenshot({ path: join(ROOT, 'public/og/autobot-lab.png') });
console.log('→ public/og/autobot-lab.png');

await browser.close();
server.close();
