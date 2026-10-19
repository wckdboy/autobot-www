#!/usr/bin/env node
/**
 * Attach the apex and www domains to the three Cloudflare Pages projects.
 * Requires CLOUDFLARE_API_TOKEN (Pages: Edit, Zone: Read) and
 * CLOUDFLARE_ACCOUNT_ID. The zones are on the same account, so Cloudflare
 * creates the proxied DNS records for Pages custom domains.
 *
 *   CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… node scripts/attach-domains.mjs
 */
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!TOKEN || !ACCOUNT) {
  console.error('Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID first.');
  process.exit(1);
}

const PROJECTS = [
  { project: 'autobot-www', domains: ['autobot.sh', 'www.autobot.sh'] },
  { project: 'invincible-www', domains: ['invincible.sh', 'www.invincible.sh'] },
  { project: 'sovware-www', domains: ['sovware.io', 'www.sovware.io'] },
];

const api = async (path, init = {}) => {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
};

let failures = 0;
for (const { project, domains } of PROJECTS) {
  for (const name of domains) {
    const r = await api(`/accounts/${ACCOUNT}/pages/projects/${project}/domains`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    const already = r.body?.errors?.some((e) => /already|exists|duplicate/i.test(e.message || ''));
    if (r.ok || already) {
      console.log(`✓ ${name} → ${project}`);
    } else {
      failures += 1;
      console.log(`✗ ${name} → ${project}: ${r.status} ${JSON.stringify(r.body?.errors || r.body)}`);
      console.log('  Add it in the dashboard: Workers & Pages → project → Custom domains.');
    }
  }
}

console.log(
  failures
    ? `\n${failures} domain(s) need attention.`
    : '\nAll domains attached. First TLS issuance can take a minute.',
);
process.exit(failures ? 1 : 0);
