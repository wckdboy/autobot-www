# WCKD brand kit

One lab, one system. WCKD is the lab; each brand is **one lowercase letter in pixels and one
color**. Everything else is shared: neutrals, type, layout, voice, the terminal grammar.

The source of truth is [`brand/kit.json`](brand/kit.json). `python brand/gen.py` (fonttools and
brotli) draws every file into `public/brand/<brand>/`: the symbol on paper and on ink, the
wordmark on paper and on ink, a 1024 px app icon and a favicon. Every site serves its own
version of the kit at `/brand/`; wckd.ai's home is the master kit.

## The family

| Brand | Domain | Role | Symbol | On ink | Mark on paper | Text on paper |
| --- | --- | --- | --- | --- | --- | --- |
| WCKD | wckd.ai | The lab | `w` | `#EFEAE2` | `#141413` | `#141413` |
| Sovware | sovware.io | Sovereign hardware and software | `s` | `#EFEAE2` | `#141413` | `#141413` |
| Autobot | autobot.sh | Private AI on your phone and your machine | `a` | `#A99BF5` lilac | `#5444BA` | `#5444BA` |
| Invincible | invincible.sh | The node you own | `i` | `#FF9A3D` orange | `#FF9A3D` | `#A85300` |
| Omnie | omnie.sh | Every model, agent and tool in one thread | `o` | `#3BC6A0` phthalo | `#0E6B55` | `#0E6B55` |
| Nightfall | nightfall.sh | AI-native parametric CAD | `n` | `#EE7AA8` rose | `#D0507F` | `#A8325F` |

The lab and the studio are neutral; the four products spread around the wheel at one weight
(lilac, rose, orange, phthalo), so any two sit well side by side. Autobot and Invincible, the
pair that ships together, are complements.

## Symbols

Lowercase letters on a pixel grid, six cells tall, two-cell strokes, square corners. They are
the app icons (the symbol on ink), the wordmarks' marks (the symbol before the lowercase name in
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
