#!/usr/bin/env python3
"""Sync only public WCKD web assets to explicitly selected sibling project sites.

Run brand/gen.py first. Default is a drift check; --write copies the generated stylesheet.
No product code, application icons, configuration or credentials are copied.
"""
import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = {
    "axit": "axit/site/public/wckd-web.css",
    "niobium": "niobium/site/public/wckd-web.css",
    "polykrom": "polykrom/site/shared/wckd-web.css",
}
LOGOS = {
    "autobot": ("autobot", "autobot/shared/design/brand", "autobot"),
    "invincible": ("invincible", "invincible/assets/brand", "invincible"),
    "sovware": ("sovware", "sovware/assets/brand", "sovware"),
    "omnie": ("omnie", "omnie-dev/brand", "omnie"),
    "nightfall": ("nightfall", "nightfall/assets/brand", "nightfall"),
    "polycore": ("polycore", "polycore/assets/brand", "polycore"),
    "creed": ("creed", "engineering/site/assets", "creed"),
    "axit": ("axit", "axit/assets/brand", "axit"),
    "niobium": ("niobium", "niobium/brand", "niobium"),
    "polykrom": ("polykrom", "polykrom/site/shared/brand", "polykrom"),
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("projects", nargs="+", choices=sorted(TARGETS.keys() | LOGOS.keys()))
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--logos", action="store_true", help="sync the canonical light/dark repository wordmarks")
    args = parser.parse_args()
    source = (ROOT / "public/brand/web.css").read_bytes()
    failed = False
    for project in args.projects:
        copies = []
        if project in TARGETS:
            copies.append((source, ROOT.parent / TARGETS[project]))
        if args.logos and project in LOGOS:
            key, directory, name = LOGOS[project]
            if not (ROOT.parent / directory.split('/')[0]).is_dir():
                raise SystemExit(f"Missing project repository: {project}")
            for mode, variant in (("paper", "light"), ("ink", "dark")):
                data = (ROOT / 'public/brand' / key / f'wordmark-{mode}.svg').read_bytes()
                copies.append((data, ROOT.parent / directory / f'{name}-{variant}.svg'))
        if not copies:
            raise SystemExit(f"No selected assets for {project}; use --logos for repository wordmarks")
        for data, target in copies:
            if args.write:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data)
            matches = target.exists() and target.read_bytes() == data
            print(f"{'ok' if matches else 'drift'}: {project} / {target.name}")
            failed |= not matches
    return int(failed)


if __name__ == "__main__":
    raise SystemExit(main())
