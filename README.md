# WCKD — public sites

The public face of **Autobot**, **Invincible Gateway** and **Sovware**.

| Domain | Product | Build |
| --- | --- | --- |
| [autobot.sh](https://autobot.sh) | Autobot — private AI on Android and iOS | `pnpm build:autobot` → `dist/autobot` |
| [invincible.sh](https://invincible.sh) | Invincible — the node you own | `pnpm build:invincible` → `dist/invincible` |
| [sovware.io](https://sovware.io) | Sovware — the studio | `pnpm build:sovware` → `dist/sovware` |
| wckd.ai | redirects to sovware.io | Cloudflare Redirect Rule |

One Astro codebase, three static builds. No client framework, no analytics, no cookies, no
third-party runtime requests. The design system is taken from Autobot's real
`shared/design/tokens.json`: ink and paper, one signal red `#E8401C`, Antonio, JetBrains Mono,
halftones, registration marks.

## Develop

```sh
pnpm install
pnpm dev                 # autobot.sh
pnpm dev:invincible
pnpm dev:sovware
```

Build and inspect:

```sh
pnpm build:all
pnpm exec serve dist/autobot   # or any static server
```

`pnpm dev` and the builds read `SITE_KEY=autobot|invincible|sovware`. The key selects the cover,
metadata, canonical origin, navigation and OG image; the interior routes (`/install`, `/releases`,
`/privacy`, `/verify`, `/404`) adapt their copy to the same key.

## Content rules

- Release history is **baked at build time** by `scripts/fetch-releases.mjs` into
  `src/data/releases.json`. The browser never calls GitHub. A failed fetch keeps the committed
  data (`--soft`), so a GitHub outage cannot block a deploy.
- `scripts/sync-install.mjs` mirrors Invincible's `install.sh` verbatim to `public/install.sh` and
  records its SHA-256 in `src/data/install.json`. The featured command is therefore
  `curl -fsSL https://invincible.sh/install.sh | sh`, with the upstream copy as a fallback.
- Claims come from the product repositories. Where a path is not yet verified — Snapdragon
  hardware, the independent Invincible security review — the page says so.
- Refresh both data files with `GITHUB_TOKEN=$(gh auth token) pnpm data && pnpm sync:install`.
  The scheduled workflow does this every six hours.

## Hosting: Cloudflare Workers (static assets)

One repo, three Workers, four domains. Cloudflare Workers Static Assets is the host: a global CDN
with no origin server, atomic versions, instant rollback, managed TLS and custom domains declared
in code. All four domains are already on Cloudflare DNS, so attaching them is one deploy.

### Deploy

```sh
npx wrangler login          # once
pnpm deploy                 # build, check links, deploy all four
```

`pnpm deploy` runs:

| Worker | Assets | Custom domains |
| --- | --- | --- |
| `autobot-site` | `dist/autobot` | `autobot.sh` (www → 301) |
| `invincible-site` | `dist/invincible` | `invincible.sh` (www → 301) |
| `sovware-site` | `dist/sovware` | `sovware.io` (www → 301) |
| `www-redirect` | `deploy/www-redirect.js` | all three `www` hosts → apex |
| `wckd-redirect` | `deploy/wckd-redirect.js` | `wckd.ai`, `www.wckd.ai` → 301 sovware.io |

The routes live in `deploy/*.wrangler.jsonc`. Workers creates the proxied DNS records for a
custom domain automatically; no manual CNAME is needed on a zone in the same account. Each Worker
uses `not_found_handling: "404-page"`, so the Astro 404 is served for unknown paths, and honours
`public/_headers` (CSP, HSTS, immutable asset caching).

### CI

`.github/workflows/deploy.yml` builds all three sites and deploys on every push to `main`. Add
two repository secrets:

- `CLOUDFLARE_API_TOKEN` — **Account → Workers Scripts: Edit**, **Workers Routes: Edit**, and
  **Zone: Read**. (Creating a custom domain also needs the zone in the same account.)
- `CLOUDFLARE_ACCOUNT_ID` — from the Cloudflare dashboard.

Without the secrets the workflow still builds and runs the link check, then warns that it did not
deploy. `.github/workflows/refresh.yml` refreshes release data and the install mirror every six
hours and commits only when something changed. `.github/workflows/check.yml` builds pull requests.

### Preview locally

```sh
npx wrangler dev --config deploy/autobot.wrangler.jsonc
```

`wrangler dev` serves the built assets with the real `_headers`. Build first after changing a page.

## Delivery

`public/_headers` is copied to every build and enforces:

- a strict CSP (self only; inline styles/scripts because Astro emits them; no third-party origins),
- HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy` and COOP,
- one-year immutable caching for `/_astro/*` and `/fonts/*`,
- revalidation for HTML, and a short TTL for the install script.

Other guarantees:

- no analytics, cookies, localStorage or third-party scripts;
- fonts self-hosted (WOFF2, preloaded);
- a real `404.html`, `sitemap.xml`, `robots.txt` and per-site `site.webmanifest`;
- OG images and touch icons generated per site (`public/og/*.png`, `apple-touch-icon.png`);
- `prefers-reduced-motion` respected by every animation;
- print styles for the pages.

## Checks

```sh
pnpm verify:links      # every internal href/src resolves in all three builds
node scripts/shots.mjs # full-page screenshots at 390 / 768 / 1440 (needs a local server)
```

Lighthouse on the built homepages (local static server):

| Site | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| autobot.sh | 98 | 100 | 100 | 100 |
| invincible.sh | 99 | 100 | 100 | 100 |
| sovware.io | 99 | 100 | 100 | 100 |

## Layout

```
src/
  components/     Nav, Footer, Mark, Icon, Signal (halftone canvas), Terminal, Releases, Ticker
  data/           site config, baked releases.json, install.json
  layouts/Base.astro
  lib/format.ts   dates, bytes, safe release-note renderer
  pages/          index, releases, install, privacy, verify, 404, sitemap, robots, favicon
  styles/riso.css the press: tokens, type, plates, components, responsive, motion, print
  views/          AutobotHome, InvincibleHome, SovwareHome
scripts/          fetch-releases, sync-install, postbuild, check-links, shots, og
public/           fonts, _headers, install.sh, og images
```

## Notes

- `pnpm` is configured with a minimum release age. Astro is pinned to `7.4.0` (not `^`) so a fresh
  publish cannot slip into a deploy; update deliberately.
- The install script mirror is a convenience, not a second source of truth. The signature is
  checked against the key pinned in the upstream script.
- Product content is © their authors. Autobot is Apache-2.0; Invincible is MIT.
