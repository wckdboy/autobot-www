# Working on the WCKD sites

These sites (wckd.ai, sovware.io, autobot.sh, invincible.sh, omnie.sh, nightfall.sh) describe
the products; they must never lag them.

## When a project updates, update the sites, the README and Plane

- A release or a change in Autobot, Invincible, Omnie or Nightfall updates its site in the same
  pass: `GITHUB_TOKEN=$(gh auth token) pnpm data && pnpm sync:install`, edit `src/views/` or
  `src/data/` for new status, features or limits, then `pnpm build:all`,
  `node scripts/check-links.mjs` and `npx wrangler deploy --config deploy/<site>.wrangler.jsonc`
  for each site that changed. CI only builds; deploys run locally.
- The product repository's GitHub README says the same thing as its site.
- Plane has the matching work items and states.
- Brand changes start in `brand/kit.json` → `python brand/gen.py`, then go to every site and to
  the product repos (`assets/brand/`, `shared/design/brand/`, `BRAND.md`).
