#!/bin/sh
# Build all three sites and push them to Cloudflare Pages.
# Requires: npx wrangler login   (once), or CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID.
set -eu

cd "$(dirname "$0")/.."
pnpm build:all
node scripts/check-links.mjs

for pair in "autobot:autobot-www" "invincible:invincible-www" "sovware:sovware-www"; do
  site=${pair%%:*}
  project=${pair##*:}
  printf '\n==> %s → %s\n' "$site" "$project"
  npx --yes wrangler@4 pages project create "$project" --production-branch=main >/dev/null 2>&1 || true
  npx --yes wrangler@4 pages deploy "dist/$site" --project-name="$project" --branch=main
done

printf '\nDone. Attach domains once with: node scripts/attach-domains.mjs\n'
