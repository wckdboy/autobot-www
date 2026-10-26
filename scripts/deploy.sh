#!/bin/sh
# Build all three sites and deploy them to Cloudflare Workers Static Assets.
# Requires: npx wrangler login   (once), or CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID.
set -eu

cd "$(dirname "$0")/.."
pnpm build:all
node scripts/check-links.mjs

for site in autobot invincible sovware nightfall tinyrex; do
  printf '\n==> %s\n' "$site"
  npx --yes wrangler@4 deploy --config "deploy/$site.wrangler.jsonc"
done

printf '\n==> www redirects\n'
npx --yes wrangler@4 deploy --config deploy/www.wrangler.jsonc

printf '\n==> wckd.ai redirect\n'
npx --yes wrangler@4 deploy --config deploy/wckd.wrangler.jsonc

printf '\nLive: https://autobot.sh · https://invincible.sh · https://sovware.io · https://nightfall.sh · https://tinyrex.sh · https://wckd.ai\n'
