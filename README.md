# WCKD — public sites

<picture><source media="(prefers-color-scheme: dark)" srcset="public/brand/wckd/wordmark-ink.svg"><img src="public/brand/wckd/wordmark-paper.svg" height="44" alt="wckd"></picture>

WCKD web v5 keeps the monochrome frame, mono type and lowercase pixel marks, with a distinct
signal for every product. The authority is `brand/kit.json` and `brand/web.css`; regenerate with
`uv run --with fonttools --with brotli python brand/gen.py`. Run `python3 -m unittest discover -s brand`.

[Creed](https://creed.sh) is the engineering guide; [creed.md](https://creed.sh/creed.md) is the
agent handoff. [PolyCore](https://polycore.dev) is the current 3D-kernel project. Nightfall is archived.

Sync public styles and README wordmarks to explicitly selected sibling repos with
`python3 scripts/sync-brand.py <projects> --logos --write`; omit `--write` for a drift check.
This does not regenerate native app-icon formats or change application themes.

Browser QA: `WCKD_QA_SHOTS=<directory> node scripts/family-browser.mjs <manifest.json>` takes an
explicit array of `{ "name": "wckd", "directory": "/absolute/path/to/dist/wckd" }` sites, checks
desktop/mobile/narrow/dark layouts, and exercises the Creed skill dialog. Existing project-directory
privacy, keyboard and first-party-resource checks remain in `scripts/projects-browser.mjs`.

The public sites for the WCKD lab and its brands, built with Astro and a shared
pixel brand kit. The repository builds `autobot`, `invincible`, `sovware`, `wckd`,
`omnie`, `nightfall` and `tinyrex` into separate `dist/<site>` directories. Niobium, Axit and
Polykrom maintain their product sites in their own repositories.

## WCKD project directory

[wckd.ai](https://wckd.ai) is the project homepage; the shared design guide remains
at [/brand/](https://wckd.ai/brand/). The directory covers Autobot, Invincible,
Niobium, Omnie, Polykrom, Nightfall, Axit, OpenEndo and Sovware, plus the four Omnie
apps and other lab tools. Descriptions come from public repositories and product
sites. Beta, preview and development status are stated separately from releases.

`src/data/projects.json` holds reviewed profiles. `src/data/public-repos.json` is
a complete build-time snapshot of the public repositories, including components,
integrations and forks. Fork attribution is preserved. The refresh script accepts
only explicitly public records from the expected GitHub owner and atomically
replaces the snapshot after every page succeeds. A fetch failure preserves the
prior file. Tokens and private metadata never enter the catalog.

The six-hour refresh workflow includes the public catalog. Deployment follows the
Wrangler workflow below; the date on the directory identifies its baked snapshot.
The browser makes no GitHub requests and the WCKD directory ships no client scripts.

## Develop and check

```sh
pnpm install
pnpm dev                    # Autobot development server
pnpm projects:data          # public catalog refresh; token optional
pnpm data                   # release metadata refresh
pnpm sync:install           # mirror Invincible's installer and its SHA-256
pnpm build:all              # build all six sites
pnpm verify:links           # links and fragments in all six built outputs, and that
                            # invincible.sh/verify runs install.sh's signature check
pnpm projects:check         # catalog/privacy/failure tests and rendered directory
pnpm projects:browser       # desktop, tablet, mobile, dark mode and keyboard checks
```

Individual builds use `pnpm build:<site>` (for example, `pnpm build:wckd`).
Browser checks use an installed Chrome/Chromium and `playwright-core`; no browser
download is required. `WCKD_QA_URL=https://wckd.ai/ pnpm projects:browser` checks the
live directory; `WCKD_QA_SHOTS=/path/to/output` optionally saves screenshots.

The catalog tests cover private and unspecified visibility, malformed/duplicate
records, incorrect owner URLs, fork attribution, multi-page failures, fetch limits,
atomic replacement and percent/hash fragment handling. Browser checks cover
1440, 768, 390 and 320 px layouts plus dark mode, loaded fonts/images, overflow,
keyboard operation of the source catalog and first-party assets.

Both PR workflows run all seven builds, link checks, catalog tests and browser
checks. PRs do not deploy. CI on `main` can deploy Autobot, Invincible, Sovware and
WCKD when the repository's Cloudflare secrets are configured; without them it
reports a warning. Omnie, Nightfall and TinyRex have separate Wrangler configs for explicit
local deployments. TinyRex's media and 3D viewer live in `public/rex/` and ship only in its
build (three.js 0.160.0 vendored there, MIT; the viewer is Polykrom's, MIT OR Apache-2.0).
TinyRex's concept art (`public/rex/concept/`) is WCKD's own, credited on the page; it is not
part of the tinyrex repository's CC-BY-4.0 media. Refresh commits update source data; verify the deployed
snapshot date after publishing.

## Hosting

Sites use Cloudflare Workers Static Assets. The configuration files in `deploy/`
define each Worker's domains and output directory. The `wckd-redirect` Worker
retains its historical name and now serves static WCKD assets on both `wckd.ai`
and `www.wckd.ai`. The separate `www-redirect` Worker handles other configured
`www` redirects.

```sh
npx wrangler login           # once, for local deployments
pnpm build:wckd
npx wrangler deploy --config deploy/wckd.wrangler.jsonc
```

Use the matching `deploy/<site>.wrangler.jsonc` for each site that changed. Refresh
release data and the installer before product-site releases. The root `AGENTS.md`
requires matching product README and Plane updates alongside site changes.

## Brand and content

The brand source is [`brand/kit.json`](brand/kit.json); `pnpm brand` generates the
assets. See [BRAND.md](BRAND.md) and each site's `/brand/` guide. Keep product claims
aligned with verified behavior, and state current limits explicitly.

The lab design uses lowercase pixel marks, monochrome type, brand accents, ruled
sections, local fonts and system dark mode. There is no analytics or third-party
font request. `public/_headers` supplies the security and caching headers. Builds
include a real 404 page, sitemap, robots file, favicon and social image.

## Latest WCKD deployment

The complete directory shipped in [PR #2](https://github.com/wckdboy/autobot-www/pull/2),
with the shared crawler-origin fix in [PR #3](https://github.com/wckdboy/autobot-www/pull/3).
Production source: `c49252e74a3fc40a12618c684daa07e3d4b90c2b`.
Wrangler deployment: `d09b279c-e94a-4a0a-bed7-71ed8ff4064d` (2026-10-25).

[Project CI](https://github.com/wckdboy/autobot-www/actions/runs/40204308600) and
[crawler-fix CI](https://github.com/wckdboy/autobot-www/actions/runs/40204709443)
passed. All six sites built, internal links and anchors resolved, six catalog/link
tests passed, and the five browser variants passed locally and on production.
Both production hosts matched the merged build byte-for-byte for the homepage,
robots file, sitemap, brand guide and added project marks. CodeRabbit findings
were fixed; the completed focused fragment review reported no remaining findings.

## Layout

```text
brand/kit.json             shared brand source
public/                    styles, local fonts, brand marks, headers and assets
src/data/                  reviewed profiles, public catalog, releases and installer metadata
src/views/                 product pages, WCKD directory and shared brand guide
src/layouts/               page shells
src/pages/                 routes, sitemap and robots generation
scripts/                   metadata refresh, build checks, browser QA and deployment helpers
deploy/                    Worker configurations and redirect code
```
