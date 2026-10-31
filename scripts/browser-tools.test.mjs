// Browser-tool regressions run after all sites are built. Fixtures stay outside the repository.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const scratch = process.env.RUNNER_TEMP || resolve(tmpdir(), 'opencode');
await mkdir(scratch, { recursive: true });
const run = (script, args = [], env = {}) => spawnSync(process.execPath, [resolve(root, script), ...args], {
  cwd: root, env: { ...process.env, ...env }, encoding: 'utf8', timeout: 20000,
});

test('browser startup failures exit promptly instead of retaining a server', () => {
  for (const script of ['scripts/tinyrex-browser.mjs', 'scripts/family-browser.mjs', 'scripts/omnie-browser.mjs']) {
    const result = run(script, [], { CHROME_BIN: '/nonexistent-wckd-qa-browser' });
    assert.notEqual(result.status, 0);
    assert.equal(result.error, undefined, result.error?.message);
  }
});

test('documented name-only entries reject the wrong manifest identity', async () => {
  const temp = await mkdtemp(resolve(scratch, 'wckd-browser-fixture-'));
  try {
    const directory = resolve(temp, 'site');
    await cp(resolve(root, 'dist/wckd'), directory, { recursive: true });
    const manifest = JSON.parse(await readFile(resolve(directory, 'site.webmanifest'), 'utf8'));
    manifest.short_name = 'Autobot';
    await writeFile(resolve(directory, 'site.webmanifest'), JSON.stringify(manifest));
    const entries = resolve(temp, 'sites.json');
    for (const brandKey of [undefined, '', null, false, 0, ' ', 'unknown', {}, []]) {
      await writeFile(entries, JSON.stringify([{ name: 'wckd', directory, brandKey }]));
      const result = run('scripts/family-browser.mjs', [entries]);
      assert.equal(result.error, undefined, result.error?.message);
      assert.notEqual(result.status, 0, `brandKey=${JSON.stringify(brandKey)} must not skip identity checks`);
      assert.match(result.stderr, /manifest identity|Unknown brandKey/);
    }
  } finally { await rm(temp, { recursive: true }); }
});

test('family QA loads and exercises Tinyrex ES modules', async () => {
  const temp = await mkdtemp(resolve(scratch, 'wckd-module-fixture-'));
  try {
    const entries = resolve(temp, 'sites.json');
    await writeFile(entries, JSON.stringify([{ name: 'rex-preview', brandKey: 'tinyrex', directory: resolve(root, 'dist/tinyrex') }]));
    const result = run('scripts/family-browser.mjs', [entries]);
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  } finally { await rm(temp, { recursive: true }); }
});
