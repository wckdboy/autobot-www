#!/usr/bin/env node
/**
 * Static link check for the built sites: every internal href/src must resolve to
 * a file in the same build. External URLs are listed but not fetched.
 *   node scripts/check-links.mjs
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(process.argv[2] || resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const SITES = ['autobot', 'invincible', 'sovware', 'wckd', 'omnie', 'nightfall'];
const ATTR = /(?:href|src)="([^"]+)"/g;
const SKIP = /^(https?:|mailto:|tel:|data:)/;

let failures = 0;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

for (const site of SITES) {
  const dist = join(ROOT, 'dist', site);
  if (!existsSync(dist)) {
    console.log(`- ${site}: not built`);
    continue;
  }
  const files = await walk(dist);
  const missing = new Set();
  let internal = 0;
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    for (const match of html.matchAll(ATTR)) {
      const href = match[1];
      if (SKIP.test(href)) continue;
      const hash = href.indexOf('#');
      const path = hash < 0 ? href : href.slice(0, hash);
      const fragment = hash < 0 ? '' : href.slice(hash + 1);
      const clean = path.split('?')[0];
      internal += 1;
      const target = !clean ? file : clean.startsWith('/') ? join(dist, clean) : resolve(dirname(file), clean);
      const candidates = [target, join(target, 'index.html'), target + '.html'];
      const found = candidates.find((c) => existsSync(c) && statSync(c).isFile());
      if (!found) {
        missing.add(`${site}${file.slice(dist.length)} → ${href}`);
      } else if (fragment && found.endsWith('.html')) {
        const ids = new Set([...(await readFile(found, 'utf8')).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
        let decoded = fragment;
        try { decoded = decodeURIComponent(fragment); } catch { /* A literal % may be an HTML id. */ }
        if (!ids.has(fragment) && !ids.has(decoded)) missing.add(`${site}${file.slice(dist.length)} → ${href} (missing anchor)`);
      }
    }
  }
  console.log(`${missing.size ? '✗' : '✓'} ${site}: ${files.length} pages, ${internal} internal links`);
  for (const m of [...missing].slice(0, 40)) {
    failures += 1;
    console.log(`  ${m}`);
  }
}

// Every built site must have its touch icon, 404 and headers.
for (const site of SITES) {
  const dist = join(ROOT, 'dist', site);
  if (!existsSync(dist)) continue;
  const required = ['404.html', 'apple-touch-icon.png', '_headers', 'robots.txt', 'sitemap.xml'];
  if (site !== 'autobot') required.push('install.sh');
  for (const file of required) {
    if (!existsSync(join(dist, file))) {
      failures += 1;
      console.log(`✗ ${site}: missing ${file}`);
    }
  }
}

console.log(failures ? `\n${failures} problem(s)` : '\nall links resolve');
process.exit(failures ? 1 : 0);
