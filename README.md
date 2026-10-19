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

## Hosting: Cloudflare Pages

Cloudflare Pages is the host: one repo, three projects, atomic static deploys, a global CDN,
managed TLS, previews and instant rollbacks. All four domains are already delegated to Cloudflare
(`elaine.ns.cloudflare.com`, `zac.ns.cloudflare.com`), so the domains attach without moving DNS.

### First-time setup

1. Push this repository to GitHub (the workflow assumes `main`).
2. Create the three Pages projects once:

   ```sh
   npx wrangler login
   npx wrangler pages project create autobot-www --production-branch=main
   npx wrangler pages project create invincible-www --production-branch=main
   npx wrangler pages project create sovware-www --production-branch=main
   ```

3. Add two repository secrets to GitHub:
   - `CLOUDFLARE_API_TOKEN` — a token with **Cloudflare Pages: Edit** (and **Zone: Read** if the
     domain step below is run by CI).
   - `CLOUDFLARE_ACCOUNT_ID` — from the Cloudflare dashboard, Workers & Pages.

4. Deploy once locally (or let the workflow do it):

   ```sh
   pnpm build:all
   npx wrangler pages deploy dist/autobot     --project-name=autobot-www     --branch=main
   npx wrangler pages deploy dist/invincible --project-name=invincible-www --branch=main
   npx wrangler pages deploy dist/sovware    --project-name=sovware-www    --branch=main
   ```

5. Attach the domains. In **Workers & Pages → each project → Custom domains** add:

   | Project | Custom domains |
   | --- | --- |
   | `autobot-www` | `autobot.sh`, `www.autobot.sh` |
   | `invincible-www` | `invincible.sh`, `www.invincible.sh` |
   | `sovware-www` | `sovware.io`, `www.sovware.io` |

   Because the zones are on the same Cloudflare account, Pages creates the DNS records. If you
   prefer to do it by hand, the records are:

   | Name | Type | Target | Proxy |
   | --- | --- | --- | --- |
   | `@` | CNAME | `autobot-www.pages.dev` | Proxied |
   | `www` | CNAME | `autobot-www.pages.dev` | Proxied |
   | `@` | CNAME | `invincible-www.pages.dev` | Proxied |
   | `www` | CNAME | `invincible-www.pages.dev` | Proxied |
   | `@` | CNAME | `sovware-www.pages.dev` | Proxied |
   | `www` | CNAME | `sovware-www.pages.dev` | Proxied |

   Cloudflare flattens the apex CNAME. Do not add an A record as well.

6. Redirect `wckd.ai`: **Rules → Redirect Rules → Create rule** with
   `When incoming requests match: Hostname equals wckd.ai` (and `www.wckd.ai`), then
   `Static redirect` to `https://sovware.io`, status **301**, preserve query string.

7. Optionally enable **Always Use HTTPS**, **HSTS** (6 months, include subdomains) and
   **Opportunistic Encryption** on each zone. The site also sends HSTS from `_headers`.

### CI

- `.github/workflows/deploy.yml` builds all three sites and deploys them on every push to `main`.
- `.github/workflows/refresh.yml` refreshes release data and the install mirror every six hours,
  commits if anything changed, and lets the deploy workflow run.
- `.github/workflows/check.yml` builds on pull requests and runs the link check.

If the Cloudflare secrets are not configured yet, `deploy.yml` fails at the deploy step and says
so; the build/check jobs still pass.

### Preview locally

```sh
pnpm build:all
npx wrangler pages dev dist/autobot      # serves _headers with the real rules
```

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
