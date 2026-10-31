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
const BRAND_KEY = KEY === 'omnie-dk' ? 'omnie' : KEY;

// The touch icon is the brand's app icon from the kit (public/brand/<key>/icon.svg, brand/gen.py).
const kitIcon = await readFile(resolve(ROOT, 'public', 'brand', BRAND_KEY in { wckd: 1, sovware: 1, autobot: 1, invincible: 1, omnie: 1, nightfall: 1, tinyrex: 1 } ? BRAND_KEY : 'autobot', 'icon.svg'), 'utf8');
const iconSvg = kitIcon.replace(/width="1024" height="1024"/, 'width="180" height="180"');
const ogSvg = await readFile(resolve(ROOT, 'public', 'brand', BRAND_KEY in { wckd: 1, sovware: 1, autobot: 1, invincible: 1, omnie: 1, nightfall: 1, tinyrex: 1 } ? BRAND_KEY : 'autobot', 'og.svg'));

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

// TinyRex's media and 3D viewer (public/rex/) belong to tinyrex.sh alone.
if (KEY !== 'tinyrex') await rm(resolve(DIST, 'rex'), { recursive: true, force: true });

// A tiny 32px PNG for clients that dislike SVG favicons.
await sharp(Buffer.from(iconSvg)).resize(32, 32).png({ compressionLevel: 9 }).toFile(resolve(DIST, 'favicon-32.png'));
await sharp(ogSvg).png({ compressionLevel: 9 }).toFile(resolve(DIST, 'og.png'));
console.log('→ og.png (1200×630)');
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
