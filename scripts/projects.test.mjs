import test from 'node:test';
import assert from 'node:assert/strict';
import { publicRepositories, refresh } from './fetch-public-projects.mjs';
import { mkdtemp, writeFile, readFile, readdir, open, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';

const repo = (name, extra = {}) => ({ name, html_url: `https://github.com/wckdboy/${name}`, description: 'Public project', private: false, visibility: 'public', fork: false, archived: false, ...extra });

test('authenticated responses cannot expose private or unspecified visibility', () => {
  const rows = publicRepositories([
    repo('public'), repo('secret', { private: true, description: 'must never appear' }),
    repo('contradictory', { visibility: 'private' }), repo('unknown', { private: undefined }),
    repo('missing-visibility', { visibility: undefined }),
  ]);
  assert.deepEqual(rows.map((r) => r.name), ['public']);
  assert(!JSON.stringify(rows).includes('must never appear'));
});
test('unexpected hosts, owners, malformed records and duplicates stop publication', () => {
  for (const rows of [null, [repo('safe', { html_url: 'https://example.org/safe' })],
    [repo('safe', { html_url: 'https://github.com/another/safe' })], [repo('../escape')],
    [repo('same'), repo('SAME')], [repo('bad', { description: {} })], [repo('bad', { fork: undefined })]]) {
    assert.throws(() => publicRepositories(rows));
  }
});
test('fork and archived attribution survives normalization; raw API fields do not', () => {
  const rows = publicRepositories([repo('z', { fork: true, archived: true, description: null, permissions: { admin: true } }), repo('A')]);
  assert.deepEqual(rows.map((r) => r.name), ['A', 'z']);
  assert.equal(rows[1].isFork, true);
  assert.equal(rows[1].isArchived, true);
  assert.equal(rows[1].description, '');
  assert.equal(rows[1].visibility, 'public');
  assert(!('permissions' in rows[1]));
});

test('a later failed API page and an exhausted page budget preserve the previous file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'wckd-project-test-'));
  try {
    const destination = join(directory, 'catalog.json');
    const prior = '{"preserve":"previous complete snapshot"}\n';
    await writeFile(destination, prior);
    for (const mode of ['failure', 'budget']) {
      let calls = 0;
      await assert.rejects(refresh({ destination, request: async () => {
        calls++;
        if (mode === 'failure' && calls === 2) return new Response('', { status: 503 });
        return Response.json(Array.from({ length: 100 }, (_, n) => repo(`repo-${calls}-${n}`)));
      } }));
      assert.equal(calls, mode === 'failure' ? 2 : 10);
      assert.equal(await readFile(destination, 'utf8'), prior);
      assert.deepEqual(await readdir(directory), ['catalog.json']);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test('multi-page publication includes every public row and old readers retain the old snapshot', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'wckd-project-test-'));
  const destination = join(directory, 'catalog.json');
  await writeFile(destination, 'old snapshot');
  const old = await open(destination);
  try {
    let calls = 0;
    const value = await refresh({ destination, now: () => new Date('2026-10-25T00:00:00Z'), request: async (url) => {
      calls++;
      assert.equal(new URL(url).hostname, 'api.github.com');
      return Response.json(calls === 1 ? Array.from({ length: 100 }, (_, n) => repo(`repo-${n}`)) : [repo('last'), repo('secret', { private: true })]);
    } });
    assert.equal(calls, 2);
    assert.equal(value.repositories.length, 101);
    assert.equal(value.updated, '2026-10-25');
    assert.equal(await old.readFile('utf8'), 'old snapshot');
    assert.deepEqual(JSON.parse(await readFile(destination, 'utf8')), value);
    assert.deepEqual(await readdir(directory), ['catalog.json']);
  } finally { await old.close(); await rm(directory, { recursive: true, force: true }); }
});

test('the built-link checker handles literal percent IDs and reports every missing anchor', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'wckd-links-test-'));
  try {
    const dist = join(directory, 'dist/wckd');
    await mkdir(dist, { recursive:true });
    for (const name of ['404.html','apple-touch-icon.png','_headers','robots.txt','sitemap.xml','install.sh']) await writeFile(join(dist,name), 'fixture');
    const html = '<main id="main"><p id="50%">half</p><a href="#50%">literal</a><a href="#50%25">encoded</a></main>';
    await writeFile(join(dist,'index.html'),html);
    const script = fileURLToPath(new URL('./check-links.mjs',import.meta.url));
    assert.match(execFileSync(process.execPath,[script,directory],{encoding:'utf8'}), /all links resolve/);
    await writeFile(join(dist,'index.html'),html+'<a href="#bad%">bad</a><a href="#missing">missing</a>');
    const result = spawnSync(process.execPath,[script,directory],{encoding:'utf8'});
    assert.equal(result.status,1);
    assert.match(result.stdout,/#bad% \(missing anchor\)/);
    assert.match(result.stdout,/#missing \(missing anchor\)/);
    assert(!result.stderr.includes('URIError'));
  } finally { await rm(directory,{recursive:true,force:true}); }
});
