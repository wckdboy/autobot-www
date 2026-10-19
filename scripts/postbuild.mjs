#!/usr/bin/env node
/**
 * Post-build: Cloudflare Pages wants /404.html at the root, and touch icons are
 * easier to rasterise here than in a route. Everything else is already static.
 */
import { copyFile, readFile, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KEY = process.env.SITE_KEY || 'autobot';
const DIST = resolve(ROOT, 'dist', KEY);

const dots = (key) => {
  const out = [];
  if (key === 'invincible') {
    for (let y = 0; y < 26; y++) {
      for (let x = 0; x < 26; x++) {
        const cx = 22 + x * 6.3;
        const cy = 22 + y * 6.3;
        const edge = 90 - Math.abs(cx - 90) * 1.15;
        if (cy > edge - 6 && cy < 158) {
          const t = (cy - 20) / 140;
          out.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(1.4 + t * 2.1).toFixed(2)}" opacity="${(0.55 + t * 0.45).toFixed(2)}"/>`);
        }
      }
    }
  } else if (key === 'sovware') {
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const inner = x === 2 && y === 2;
        out.push(`<circle cx="${33 + x * 27}" cy="${33 + y * 27}" r="${inner ? 9 : 5 - Math.max(Math.abs(x - 2), Math.abs(y - 2)) * 0.7}" opacity="${inner ? 1 : 0.78}"/>`);
      }
    }
  } else {
    for (let y = 0; y < 26; y++) {
      for (let x = 0; x < 26; x++) {
        const t = (25 - x + y) / 50;
        out.push(`<circle cx="${(23 + x * 6.3).toFixed(1)}" cy="${(23 + y * 6.3).toFixed(1)}" r="${(0.9 + t * 3).toFixed(2)}"/>`);
      }
    }
  }
  return out.join('');
};

const bg = KEY === 'autobot' ? '#E8401C' : '#141414';
const fg = KEY === 'autobot' ? '#F4EEE6' : '#E8401C';
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect width="180" height="180" rx="36" fill="${bg}"/><g fill="${fg}">${dots(KEY)}</g>${
  KEY === 'invincible' ? '<circle cx="90" cy="26" r="9" fill="#F4EEE6"/>' : ''
}</svg>`;

try {
  await access(resolve(DIST, 'index.html'), constants.R_OK);
} catch {
  console.error(`x dist/${KEY}/index.html is missing — run the Astro build first`);
  process.exit(1);
}

// 404.html for Cloudflare Pages (Astro emits it at the root already; older
// directory-format builds put it under 404/).
try {
  await access(resolve(DIST, '404.html'), constants.R_OK);
  console.log('→ 404.html (from the build)');
} catch {
  try {
    const html = await readFile(resolve(DIST, '404/index.html'));
    await writeFile(resolve(DIST, '404.html'), html);
    console.log('→ 404.html (copied)');
  } catch {
    console.warn('! no 404 page found');
  }
}

await sharp(Buffer.from(iconSvg)).resize(180, 180).png({ compressionLevel: 9 }).toFile(resolve(DIST, 'apple-touch-icon.png'));
console.log('→ apple-touch-icon.png (180×180)');

// A tiny 32px PNG for clients that dislike SVG favicons.
await sharp(Buffer.from(iconSvg)).resize(32, 32).png({ compressionLevel: 9 }).toFile(resolve(DIST, 'favicon-32.png'));
console.log('→ favicon-32.png');

await copyFile(resolve(ROOT, 'public/_headers'), resolve(DIST, '_headers')).catch(() => {});
console.log(`✓ dist/${KEY} ready`);
