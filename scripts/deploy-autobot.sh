#!/bin/sh
# Build and deploy only the Autobot site. Used while the lab system is being
# reviewed one project at a time.
set -eu

cd "$(dirname "$0")/.."
pnpm build:autobot
node scripts/check-links.mjs
npx --yes wrangler@4 deploy --config deploy/autobot.wrangler.jsonc

printf '\nLive: https://autobot.sh · brand guide: https://autobot.sh/brand/\n'
