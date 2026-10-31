import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

for (const [key, domain, language] of [['omnie', 'omnie.sh', 'en'], ['omnie-dk', 'omnie.dk', 'da']]) {
  test(`${domain}: localized, honest e-conomic reporting homepage`, async () => {
    const html = await read(`dist/${key}/index.html`);
    assert.match(html, new RegExp(`<html lang="${language}"`));
    assert.match(html, new RegExp(`rel="canonical" href="https://${domain}/"`));
    assert.match(html, /Omnie Connect/);
    assert.match(html, /e-conomic/);
    assert.match(html, /id="reports"/);
    assert.match(html, /data-report-example/);
    assert.match(html, language === 'da' ? /fiktive data/ : /fictional data/);
    assert.match(html, language === 'da' ? /under udvikling/ : /in development/);
    for (const [lang, host] of [['da', 'omnie.dk'], ['en', 'omnie.sh'], ['x-default', 'omnie.sh']]) {
      assert.match(html, new RegExp(`hreflang="${lang}" href="https://${host}/"`));
    }
    assert.doesNotMatch(html, /omnie-dev|github\.com\/wckdboy\/omnieconnect|App Store|<script|<form/);
    const manifest = JSON.parse(await read(`dist/${key}/site.webmanifest`));
    assert.equal(manifest.short_name, 'Omnie');
    assert.match(await read(`dist/${key}/robots.txt`), new RegExp(`https://${domain}/sitemap.xml`));
    assert.match(await read(`dist/${key}/sitemap.xml`), new RegExp(`<loc>https://${domain}/</loc>`));
    const config = await read(`deploy/${key}.wrangler.jsonc`);
    assert.match(config, new RegExp(`"directory": "../dist/${key}"`));
    assert.match(config, new RegExp(`"pattern": "${domain}"`));
  });
}

test('illustrative project totals reconcile with the account example', async () => {
  const data = JSON.parse(await read('src/data/omnie-report.json'));
  const revenue = data.projects.reduce((sum, project) => sum + project.revenue, 0);
  const costs = data.projects.reduce((sum, project) => sum + project.costs, 0);
  assert.equal(revenue, data.accounts.revenue);
  assert.equal(costs, data.accounts.materials + data.accounts.labour);
  assert.equal(revenue - costs, 58200);
  assert.equal(data.fictional, true);
});

test('the directory does not advertise an unpublished connector as the earlier IDE', async () => {
  const profile = JSON.parse(await read('src/data/projects.json')).find(project => project.id === 'omnie');
  assert.equal(profile.sourceStatus, 'not-published');
  assert.equal(profile.repo, undefined);
  assert.equal(profile.source, undefined);
  const card = (await read('dist/wckd/index.html')).split('id="project-omnie"')[1]?.split('</li>')[0];
  assert(card?.includes('e-conomic') && card.includes('Omnie Connect'));
  assert.doesNotMatch(card, /github\.com|>Source<|IDE/);
});
