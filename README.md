# Sovware lab — public sites

The public sites for **Autobot**, **Invincible** and **Sovware**.

**Current state:** Autobot is the first site on the new lab system and is awaiting review.
Invincible and Sovware are still on the previous design until Autobot is confirmed. Do not mix
the two systems on one page.

| Domain | Project | State |
| --- | --- | --- |
| [autobot.sh](https://autobot.sh) | Autobot | New lab system — review |
| [invincible.sh](https://invincible.sh) | Invincible | Previous design |
| [sovware.io](https://sovware.io) | Sovware | Previous design |
| wckd.ai | Redirect | 301 → sovware.io |

Brand guide: **[autobot.sh/brand](https://autobot.sh/brand/)** · short notes in [BRAND.md](BRAND.md).

## The system

Plain is the point. Static HTML, one stylesheet, no client JavaScript, no third-party requests.

- **Type:** Inter for body and interfaces; EB Garamond for page titles and section headings;
  system monospace for code.
- **Surface:** paper `#FBFAF7`, ink `#151513`, muted `#5D5A53`, rules `#DCD8CF`.
- **One accent per project:** Autobot oxide `#B23A2A`, Invincible deep blue `#22506E`,
  Sovware forest `#2F4A3A`. The accent appears in the wordmark square, selection, focus and
  link hover. Nothing else.
- **Layout:** one column, 1040 px page, 68-character measure, 1 px rules, no cards, shadows,
  gradients, decorative numbers or illustrations.
- **Voice:** write like a maintainer. State the limit as plainly as the feature.

The full rules and component specimens are in the [brand guide](https://autobot.sh/brand/).

## Develop

```sh
pnpm install
pnpm build:autobot       # → dist/autobot
pnpm exec serve dist/autobot
```

The Autobot output is deliberately small: plain HTML, `/lab.css`, three WOFF2 files, a favicon and
an OG image. The build still uses Astro for templating and the release data, then `postbuild.mjs`
strips the previous design system from the Autobot HTML and removes unused assets. The other two
sites still use Astro and the old stylesheet.

Other commands:

```sh
pnpm build:all           # Autobot + the two previous sites
pnpm verify:links        # every internal href/src resolves
pnpm data                # refresh releases.json (GITHUB_TOKEN recommended)
pnpm sync:install        # mirror the installer and record its SHA-256
pnpm og                  # regenerate social cards
```

## Content rules

- Release history is baked at build time by `scripts/fetch-releases.mjs` into
  `src/data/releases.json`. The browser never calls GitHub. A failed fetch keeps the committed
  data (`--soft`), so a GitHub outage cannot block a deploy.
- `scripts/sync-install.mjs` mirrors Invincible’s `install.sh` to `public/install.sh` and records
  its SHA-256. The Autobot site links to the live copy at `invincible.sh/install.sh`.
- Claims come from the product repositories. Where a path is not yet verified — Snapdragon
  hardware, the independent Invincible security review — the page says so.
- Refresh with `GITHUB_TOKEN=$(gh auth token) pnpm data && pnpm sync:install`. The scheduled
  workflow does this every six hours.

## Hosting

Cloudflare Workers Static Assets, three site Workers plus two redirect Workers:

| Worker | Assets | Domains |
| --- | --- | --- |
| `autobot-site` | `dist/autobot` | `autobot.sh` |
| `invincible-site` | `dist/invincible` | `invincible.sh` |
| `sovware-site` | `dist/sovware` | `sovware.io` |
| `www-redirect` | tiny Worker | all `www` hosts → apex |
| `wckd-redirect` | tiny Worker | `wckd.ai` → sovware.io |

Custom domains live in `deploy/*.wrangler.jsonc`. Deploy only Autobot while it is under review:

```sh
npx wrangler login        # once
pnpm deploy:autobot
```

Deploy everything after the other sites are migrated:

```sh
pnpm deploy
```

`.github/workflows/deploy.yml` builds all three and deploys on push to `main` when
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set. Without them it builds and runs the
link check, then warns. `.github/workflows/refresh.yml` refreshes release data every six hours.

## Delivery

`public/_headers` is copied to every build and enforces:

- a strict CSP (self only; inline styles because Astro emits a small style block),
- HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy` and COOP,
- one-year immutable caching for fonts and `/lab.css` for one hour,
- revalidation for HTML.

The Autobot build contains no `<script>` elements. Fonts are self-hosted and preloaded. There is no
analytics, cookie, localStorage or third-party request. A real `404.html`, `sitemap.xml`,
`robots.txt`, favicon and OG image are included.

## Checks

Lighthouse on the built Autobot pages (local static server):

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/` | 100 | 100 | 100 | 100 |
| `/releases/` | 100 | 100 | 100 | 100 |
| `/install/` | 100 | 100 | 100 | 100 |
| `/privacy/` | 100 | 100 | 100 | 100 |
| `/verify/` | 100 | 100 | 100 | 100 |
| `/brand/` | 100 | 100 | 100 | 100 |

`pnpm verify:links` checks every internal link in all three builds. `node scripts/shots.mjs`
captures full-page screenshots at 390 / 768 / 1440.

## Layout

```
public/
  lab.css                  the one stylesheet
  brand/index.html         brand and style guide
  fonts/lab/               Inter + EB Garamond, self-hosted
  _headers
src/
  layouts/Lab.astro        the lab shell (Autobot now; reusable for the next site)
  views/Autobot*Lab.astro  Autobot pages
  data/                    site config, baked releases.json, install.json
  lib/format.ts            dates, bytes, release-note renderer
  views/                   previous Invincible/Sovware pages (until migrated)
  styles/riso.css          previous stylesheet (Invincible/Sovware only)
scripts/
  deploy-autobot.sh
  fetch-releases.mjs
  sync-install.mjs
  postbuild.mjs            strips old CSS, builds icons, removes unused assets
  check-links.mjs
  og-lab.html / build-og.mjs
deploy/                    Worker configs and redirect scripts
```

## Migration sequence

1. Autobot — built, awaiting review.
2. Invincible — after Autobot is confirmed.
3. Sovware — after Invincible is confirmed.

“Confirmed” means the page has been read on a phone and a desktop, the copy is accurate, and the
owner is happy with the direction. No next site starts before then.
