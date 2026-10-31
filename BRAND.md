# WCKD brand kit

## Web refinement — v5

Keep the essence: monochrome surfaces, JetBrains Mono, lowercase headlines and the original pixel
marks. The accent is a signature, not a background treatment. Use quiet hairlines, generous spacing,
one clear primary action, a readable measure and explicit development or archive status.

`brand/kit.json` owns the tokens. `brand/web.css` owns the shared web refinement; generate it with
`uv run --with fonttools --with brotli python brand/gen.py` (or the documented Python environment).
Every family site loads `public/brand/web.css`. Sync the public stylesheet to independent sites with
`python3 scripts/sync-brand.py axit niobium polykrom --write`; omit `--write` to check for drift.
Do not overwrite app themes or icon masters when syncing a website refresh.

- **Polykrom / polykrom.app:** keep the electric lime `#CCFF00` signature on ink; ink text on paper.
- **PolyCore / polycore.dev:** the current 3D-kernel project. Do not present archived Nightfall as it.
- **Creed / creed.sh:** WCKD's engineering values, skills and tools. Agent handoff: `https://creed.sh/creed.md`.
- **Nightfall / nightfall.sh:** an archive, not an actively supported CAD product.

Text and primary actions remain neutral and high-contrast. Focus must be visible without relying on
the accent. Navigation and primary actions have generous touch targets. No gradients, glows,
decorative cards, auto-playing brand effects, new font families or unmeasured quality claims.

One lab, one system. WCKD is the lab; each brand is **one lowercase letter in pixels and one
color**. Everything else is shared: neutrals, type, layout, voice, the terminal grammar.

The source of truth is [`brand/kit.json`](brand/kit.json). `python brand/gen.py` (fonttools and
brotli) draws every file into `public/brand/<brand>/`: the symbol on paper and on ink, the
wordmark on paper and on ink, a 1024 px app icon and a favicon. Every site serves its own
version of the kit at `/brand/`; wckd.ai's home is the master kit.

## The family

| Brand | Domain | Role | Symbol | Signal |
| --- | --- | --- | --- | --- |
| WCKD | wckd.ai | The lab and company | `w` | ink `#111111` (white on ink) |
| WCKD World | wckd.world | The first place | `w` | moss `#4F6A45` (light `#A7C99A` on ink) |
| Sovware | sovware.io | The production arm for the stack | `s` | slate `#637282` (light `#B7C5D4` on ink) |
| Autobot | autobot.sh | Private AI on your phone and your machine | `a` | purple `#7C5CFF` |
| Invincible | invincible.sh | AI gateway and decentralized compute | `i` | signal orange `#FF8A1E` |
| Omnie | omnie.sh / omnie.dk | App and data connections; e-conomic reporting first | `o` | phthalo `#00B386` |
| Nightfall | nightfall.sh | Archived CAD research; reference for PolyCore | `n` | rose `#FF3E8A` |
| Niobium | niobium.sh | A pixel-art home for your AI team | `n.` (the n and its companion pixel) | pastel purple `#A78BFA` |
| Polykrom | polykrom.app | Parametric CAD | `p` | electric lime `#CCFF00` (olive `#6E8600` on paper) |
| PolyCore | polycore.dev | The 3D geometry kernel | `p` | blue `#436A9D` (light `#91B9ED` on ink) |
| Creed | creed.sh | Engineering for agents | `c` | sage `#6D8053` (light `#C1CE9B` on ink) |
| Axit | axit.sh | File search and reviewed cleanup | `a` | copper `#B3633D` (light `#D9966B` on ink) |
| OpenEndo | openendo.org | Open research | `o` | mauve `#A64D79` (light `#E4A1C3` on ink) |
| Tinyrex | tinyrex.sh | Lab project | `t` | ochre `#A78020` (light `#E4C563` on ink) |

Each signal is one color identity with surface-specific shades: use `onPaper` on light surfaces
and `onInk` on dark surfaces, as defined in `brand/kit.json`. Use the matching paper or ink
asset rather than recoloring it. **Color is for marks, never for body text**: the symbol, the
headline's square, focus rings, selection and link underlines. Text is always ink (white on
dark). The lab is neutral; the products spread around the wheel (purple,
rose, orange, phthalo), so any two sit well side by side. Autobot and Invincible, the pair that
ships together, are complements.

## Symbols

Lowercase letters on a pixel grid, six cells tall, two-cell strokes, square corners. They are
the app icons (the symbol on white), the wordmarks' marks (the symbol before the lowercase name in
JetBrains Mono), the favicons, and three rows of half blocks beside a terminal header.

- Scale in whole pixels only; never smooth, round, outline or recolor.
- The symbol is the only ornament. No illustration, mascots, halftones, gradients or glows.

## Neutrals and states

Page `#FFFFFF` (web) · paper `#EFEAE2` (apps, light) · wash `#F6F5F2` · rule `#E4E1DB` · frame
`#D3D0C9` · muted `#6E6A64` · ink `#111111` · ash `#8E8A84`.

States are words first, then a glyph: `✓` ash, `!` yellow `#E2C044`, `✗` red `#FF6A47`
(`#B3250D` on paper). No brand color ever means "something is wrong".

## Type

On the web, JetBrains Mono for everything, in two weights: 700 for headlines, 400 for the rest.
Headlines are lowercase and end in the brand's pixel square where another site would put a
period. No uppercase labels. Apps use the platform's sans for reading and mono for machine text.

## Layout and surface

White page, one column, 1120 px, a 72-character measure. A 2 px rule under the header and over
the footer; nav links split by thin vertical rules; a hairline between sections; no cards,
boxes or shadows. One primary action per page, in solid ink. The signal is the symbol, the
headline's square, selection, focus and links on hover. White by default, ink when the system
asks for dark (the signal switches to its on-ink color).

The symbol is a logo, so it may sit on white in its bright color; text in a brand color uses
its text value (4.5:1 or more).

## Voice

Write like a maintainer, not a marketer. Short declarative sentences, concrete nouns, numbers
where they exist. State the limit as plainly as the feature. No exclamation marks, superlatives
or claims without a link.

## In a terminal

The symbol in half blocks beside the header, `▪` per step, `│ └` for what came back, `✓ ! ✗`.
Truecolor or the nearest 256 colors; nothing for `NO_COLOR` or a pipe. The palette lives in
Invincible's `crates/invincible/src/brand.rs`, shared by both CLIs.

Version 3 (after tinygrad.org's plainness: all mono, white, framed) follows version 2, which replaced the Sovware lab guide (v1): the oxide, deep-blue and forest accents, EB
Garamond and the plain square mark are retired.
