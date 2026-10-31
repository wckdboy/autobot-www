# Working on the WCKD sites

These sites (wckd.ai, sovware.io, autobot.sh, invincible.sh, omnie.sh, omnie.dk, nightfall.sh, tinyrex.sh) describe
the products; they must never lag them.

## When a project updates, update the sites, the README and Plane

- A release or a change in Autobot, Invincible, Omnie or Nightfall updates its site in the same
  pass: `GITHUB_TOKEN=$(gh auth token) pnpm data && pnpm sync:install`, edit `src/views/` or
  `src/data/` for new status, features or limits, then `pnpm build:all`,
  `node scripts/check-links.mjs` and `npx wrangler deploy --config deploy/<site>.wrangler.jsonc`
  for each site that changed, after explicit publication approval. Pull requests only build;
  `main` can also deploy Autobot, Invincible, Sovware and WCKD when Cloudflare is configured.
  Check those side effects before merging. Omnie deployments remain separate and explicit.
- The product repository's GitHub README says the same thing as its site.
- Plane has the matching work items and states.
- Brand changes start in `brand/kit.json` → `python brand/gen.py`, then go to every site and to
  the product repos (`assets/brand/`, `shared/design/brand/`, `BRAND.md`).
