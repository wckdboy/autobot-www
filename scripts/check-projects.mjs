import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = JSON.parse(await readFile(resolve(root, 'src/data/public-repos.json'), 'utf8'));
const projects = JSON.parse(await readFile(resolve(root, 'src/data/projects.json'), 'utf8'));
const html = await readFile(resolve(root, 'dist/wckd/index.html'), 'utf8');
const robots = await readFile(resolve(root, 'dist/wckd/robots.txt'), 'utf8');
const sitemap = await readFile(resolve(root, 'dist/wckd/sitemap.xml'), 'utf8');
assert.equal(snapshot.owner, 'wckdboy');
assert.match(snapshot.updated, /^\d{4}-\d{2}-\d{2}$/);
assert(snapshot.repositories.length > 0);
const names = new Set();
for (const repo of snapshot.repositories) {
  assert.equal(repo.visibility, 'public');
  assert.equal(repo.url, `https://github.com/wckdboy/${repo.name}`);
  assert(!names.has(repo.name.toLowerCase()));
  names.add(repo.name.toLowerCase());
  assert(html.includes(`href="${repo.url}"`), `Repository absent from directory: ${repo.name}`);
}
assert.deepEqual(new Set(projects.map((p) => p.id)), new Set(['autobot','invincible','niobium','omnie','polykrom','nightfall','axit','openendo','sovware']));
for (const project of projects) {
  assert(names.has(project.repo.toLowerCase()), `Missing public source for ${project.name}`);
  assert.equal(new URL(project.site).protocol, 'https:');
  assert(html.includes(`id="project-${project.id}"`) && html.includes(`href="${project.site}"`));
}
for (const repo of ['omnie-dev','omnie-edit','omnie-ios','omnie-edu','eidolon','enjin','Mosaic','drivesearch','fsearch','RoundTable','wckd-gpu']) {
  assert(names.has(repo.toLowerCase()), `Missing lab app: ${repo}`);
}
assert(!/<script\b/i.test(html), 'Project directory must have zero client JavaScript');
assert(html.includes('href="https://wckd.ai/"'), 'Incorrect canonical URL');
assert(html.includes('href="/brand/"') && html.includes('id="source"'));
assert(robots.includes('Sitemap: https://wckd.ai/sitemap.xml') && !robots.includes('https://autobot.sh/'));
assert(sitemap.includes('https://wckd.ai/') && !sitemap.includes('https://autobot.sh/'));
console.log(`Project directory verified: ${projects.length} profiles, ${snapshot.repositories.length} public repositories, lab apps, source privacy, canonical, sitemap and zero runtime JS.`);
