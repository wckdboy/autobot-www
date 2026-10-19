#!/usr/bin/env node
/**
 * Bakes the public release history into src/data/releases.json so the site has
 * zero runtime calls to GitHub. Run with a token to stay clear of rate limits:
 *
 *   GITHUB_TOKEN=$(gh auth token) node scripts/fetch-releases.mjs
 *
 * --soft keeps the committed data if the API cannot be reached, which is what
 * the CI build does: a GitHub outage must never block a deploy.
 */
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'src/data/releases.json');
const SOFT = process.argv.includes('--soft');
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const REPOS = ['autobot', 'invincible'];

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'wckd-www-build',
  'X-GitHub-Api-Version': '2022-11-28',
};
if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

const api = async (path) => {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${res.statusText}`);
  return res.json();
};

const cleanBody = (body = '') =>
  body
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim()
    .slice(0, 2400);

async function repo(name) {
  const [meta, releases] = await Promise.all([
    api(`/repos/wckdboy/${name}`),
    api(`/repos/wckdboy/${name}/releases?per_page=14`),
  ]);

  const list = releases
    .filter((r) => !r.draft)
    .map((r) => ({
      tag: r.tag_name,
      name: r.name || r.tag_name,
      published: r.published_at,
      url: r.html_url,
      prerelease: r.prerelease,
      body: cleanBody(r.body),
      assets: (r.assets || []).map((a) => ({
        name: a.name,
        size: a.size,
        downloads: a.download_count,
        url: a.browser_download_url,
      })),
    }));

  const latest = list.find((r) => !r.prerelease) || list[0] || null;

  let checksums = null;
  const sumsName = name === 'autobot' ? 'SHA256SUMS.txt' : 'SHA256SUMS';
  const sumsAsset = latest?.assets.find((a) => a.name === sumsName);
  if (sumsAsset) {
    try {
      const res = await fetch(sumsAsset.url, { headers: { 'User-Agent': 'wckd-www-build' } });
      if (res.ok) checksums = (await res.text()).trim().slice(0, 2000);
    } catch {
      /* the link is still on the page */
    }
  }

  return {
    name,
    description: meta.description || '',
    stars: meta.stargazers_count,
    forks: meta.forks_count,
    license: meta.license?.spdx_id || '',
    pushed: meta.pushed_at,
    latest,
    releases: list,
    checksums,
    totalDownloads: list.reduce(
      (sum, r) => sum + r.assets.reduce((n, a) => n + (a.downloads || 0), 0),
      0,
    ),
  };
}

let out;
try {
  const [autobot, invincible] = await Promise.all(REPOS.map(repo));
  out = {
    generatedAt: new Date().toISOString(),
    autobot,
    invincible,
  };
} catch (error) {
  console.warn(`! GitHub: ${error.message}`);
  if (!SOFT) process.exit(1);
  try {
    out = JSON.parse(await readFile(OUT, 'utf8'));
    out.stale = true;
    console.warn('! keeping the committed release data');
  } catch {
    console.error('x no committed release data; run without --soft once the API is reachable');
    process.exit(1);
  }
}

await mkdir(dirname(OUT), { recursive: true });

// Keep the timestamp stable when nothing but the clock changed, so the
// six-hourly refresh does not commit noise.
try {
  const prev = JSON.parse(await readFile(OUT, 'utf8'));
  const strip = (o) => JSON.stringify({ ...o, generatedAt: '', stale: undefined });
  if (strip(prev) === strip(out)) out.generatedAt = prev.generatedAt;
} catch {
  /* first run */
}

await writeFile(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(
  `→ src/data/releases.json  autobot ${out.autobot?.latest?.tag ?? '—'}  invincible ${out.invincible?.latest?.tag ?? '—'}`,
);
