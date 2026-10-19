# Sovware lab — brand notes

This is the short version. The full style guide is a live page:
[autobot.sh/brand](https://autobot.sh/brand/) · source: `public/brand/index.html`.

## What the lab is

Sovware is an independent software lab. It builds free, open-source software for private
computing. The work is public, releases are signed, and claims are checkable.

Projects:

| Project | Role | Accent |
| --- | --- | --- |
| Autobot | Private AI on Android and iOS | `#B23A2A` oxide |
| Invincible | A self-hosted AI node | `#22506E` deep blue |
| Sovware | The lab and studio site | `#2F4A3A` forest |

## Voice

Write like a maintainer. Short declarative sentences. Concrete nouns. Numbers where they exist.
State the limit as plainly as the feature.

- Use: “Autobot runs chat, agents, images and voice on the device.”
- Avoid: “Experience the future of private AI.”
- Use: “The Snapdragon paths are built for the 8 Elite Gen 5 and have not yet been run on it.”
- Avoid: “Blazing-fast NPU acceleration.”
- No exclamation marks, superlatives, or claims without a link.

## Type

- **Inter** for body, UI, tables and labels. 16 px / 1.65 body.
- **EB Garamond** for page titles and section headings. 40–58 px page titles, 28–34 px sections.
- **System monospace** for code, 13 px / 1.6.
- Page titles and headings are sentence case. Uppercase is reserved for 11 px labels.

## Colour and surface

Paper `#FBFAF7`, ink `#151513`, muted `#5D5A53`, rule `#DCD8CF`. One project accent is used for
the 9 px wordmark square, selection, focus and link hover — nothing else. No gradients, shadows,
cards, decorative numbers, dark mode or illustrations.

## Layout

One column, 1040 px page, 24 px gutters, 68-character measure, 34 px section rhythm, 1 px rules.
Tables and code may run wider. At 760 px the masthead stacks and margins tighten; at 480 px fact
grids become one column.

## Components

- Text links are ink and underlined. One primary action per page.
- Tables have a 1 px ink header rule and 1 px row rules. No zebra striping.
- Code sits on a wash block with a 1 px border. No syntax theatre.
- Notes use a 2 px accent rule. They are for caveats, not decoration.
- The footer states the license, the absence of accounts and telemetry, and links to source.

## Delivery

Static HTML and one CSS file (`public/lab.css`). No client JavaScript. Fonts are self-hosted
WOFF2 (Inter and EB Garamond, Latin subset). No third-party requests, analytics or cookies.
Served from Cloudflare Workers Static Assets with immutable caching for fonts.

## Migration rule

Autobot is the first site on this system. Do not start Invincible or Sovware until Autobot is
confirmed. The old sites remain online meanwhile; do not mix the two systems on one page.
