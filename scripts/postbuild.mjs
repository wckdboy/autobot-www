#!/usr/bin/env node
/**
 * Post-build: Cloudflare Pages wants /404.html at the root, and touch icons are
 * easier to rasterise here than in a route. Everything else is already static.
 */
import { copyFile, readFile, writeFile, access, readdir, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
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
const iconSvg = KEY === 'autobot'
  ? '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect width="180" height="180" fill="#fbfaf7"/><rect x="50" y="50" width="80" height="80" fill="#b23a2a"/></svg>'
  : `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect width="180" height="180" rx="36" fill="${bg}"/><g fill="${fg}">${dots(KEY)}</g>${
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

// The Autobot site is on the new lab stylesheet. Strip the old Astro/riso
// bundle and Astro scope attributes from its HTML so the output is genuinely
// plain, zero-JS HTML with one stylesheet.
if (KEY === 'autobot') {
  const walk = async (dir) => {
    const out = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) out.push(...(await walk(p)));
      else if (entry.name.endsWith('.html')) out.push(p);
    }
    return out;
  };
  for (const file of await walk(DIST)) {
    let html = await readFile(file, 'utf8');
    html = html
      .replace(/<link rel="stylesheet" href="\/_astro\/[^"]+\.css">/g, '')
      .replace(/<script[^>]+src="\/_astro\/[^"]+"[^>]*><\/script>/g, '')
      .replace(/ data-astro-cid-[a-z0-9]+(?:="[^"]*")?/gi, '');
    await writeFile(file, html);
  }
  console.log('→ stripped the old stylesheet from Autobot HTML');
  await rm(resolve(DIST, '_astro'), { recursive: true, force: true });
  await rm(resolve(DIST, 'fonts/antonio-latin.woff2'), { force: true });
  await rm(resolve(DIST, 'fonts/antonio-latin-ext.woff2'), { force: true });
  await rm(resolve(DIST, 'fonts/jetbrains-mono-latin.woff2'), { force: true });
  await rm(resolve(DIST, 'fonts/jetbrains-mono-latin-ext.woff2'), { force: true });
  await rm(resolve(DIST, 'og/autobot.png'), { force: true });
  await rm(resolve(DIST, 'og/invincible.png'), { force: true });
  await rm(resolve(DIST, 'og/sovware.png'), { force: true });
  await rm(resolve(DIST, 'install.sh'), { force: true });
  console.log('→ removed unused assets from the Autobot build');
}

await copyFile(resolve(ROOT, 'public/_headers'), resolve(DIST, '_headers')).catch(() => {});

// The Autobot build has no scripts at all; tighten its CSP accordingly.
if (KEY === 'autobot') {
  const headersPath = resolve(DIST, '_headers');
  const headers = await readFile(headersPath, 'utf8');
  await writeFile(headersPath, headers.replace("script-src 'self' 'unsafe-inline'", "script-src 'none'"));
  console.log("→ tightened the Autobot CSP to script-src 'none'");
}
console.log(`✓ dist/${KEY} ready`);
