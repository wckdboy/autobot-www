#!/usr/bin/env node
/** Build-time public catalog. Private metadata is never written to the site. */
import assert from 'node:assert/strict';
import { writeFile, rename, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const OWNER = 'wckdboy';
const output = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/public-repos.json');

export function publicRepositories(input) {
  assert(Array.isArray(input), 'Expected a GitHub repository list');
  const names = new Set();
  return input.filter((r) => r?.private === false && r.visibility === 'public').map((r) => {
    assert(typeof r.name === 'string' && /^[A-Za-z0-9_.-]+$/.test(r.name), 'Invalid repository name');
    assert(r.html_url === `https://github.com/${OWNER}/${r.name}`, 'Unexpected repository URL');
    assert(!names.has(r.name.toLowerCase()), 'Duplicate repository');
    assert(typeof r.fork === 'boolean' && typeof r.archived === 'boolean', 'Missing repository type');
    assert(r.description === null || typeof r.description === 'string', 'Invalid description');
    names.add(r.name.toLowerCase());
    return { name: r.name, url: r.html_url, description: r.description ?? '', visibility: 'public', isFork: r.fork, isArchived: r.archived };
  }).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase(), 'en'));
}

export async function refresh({ request = fetch, destination = output, now = () => new Date() } = {}) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'wckd-public-projects', 'X-GitHub-Api-Version': '2022-11-28' };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  const input = [];
  let complete = false;
  for (let page = 1; page <= 10; page++) {
    const url = `https://api.github.com/users/${OWNER}/repos?type=owner&per_page=100&page=${page}`;
    const response = await request(url, { headers, signal: AbortSignal.timeout(20_000), redirect: 'error' });
    assert(response.ok, `GitHub project index returned HTTP ${response.status}`);
    const rows = await response.json();
    assert(Array.isArray(rows) && rows.length <= 100, 'Invalid repository page');
    input.push(...rows);
    if (rows.length < 100) { complete = true; break; }
  }
  assert(complete, 'Catalog exceeded its page budget; previous snapshot preserved');
  const repositories = publicRepositories(input);
  assert(repositories.length > 0, 'Empty public catalog; previous snapshot preserved');
  const value = { updated: now().toISOString().slice(0, 10), owner: OWNER, repositories };
  const temporary = `${destination}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
    await rename(temporary, destination);
  } finally {
    await unlink(temporary).catch((error) => { if (error.code !== 'ENOENT') throw error; });
  }
  return value;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(`Public project index: ${(await refresh()).repositories.length} repositories`); }
  catch (error) {
    console.error(`Project refresh failed; committed snapshot retained: ${error.message}`);
    process.exitCode = process.argv.includes('--soft') ? 0 : 1;
  }
}
