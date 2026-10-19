"""Generates every brand asset from brand/kit.json into public/brand/<key>/:
symbol (on paper, on ink), wordmark (on paper, on ink), app icon (1024), favicon.

    python brand/gen.py          (needs fonttools and brotli: pip install fonttools brotli)
"""
import json, os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
kit = json.load(open(os.path.join(ROOT, "brand/kit.json")))
N = kit["neutrals"]
font = instancer.instantiateVariableFont(TTFont(os.path.join(ROOT, "public/fonts/jetbrains-mono-latin.woff2")), {"wght": 560})
gs, cmap, upm = font.getGlyphSet(), font.getBestCmap(), font["head"].unitsPerEm

def text_path(text, x0, base, size=30.0):
    sc, pen, x = size / upm, SVGPathPen(gs), x0
    for ch in text:
        g = cmap[ord(ch)]
        gs[g].draw(TransformPen(pen, (sc, 0, 0, -sc, x, base)))
        x += gs[g].width * sc
    return pen.getCommands(), x

def runs(rows, px, ox, oy, fill):
    out = []
    for y, row in enumerate(rows):
        x = 0
        while x < len(row):
            if row[x] != "#":
                x += 1; continue
            x2 = x
            while x2 < len(row) and row[x2] == "#": x2 += 1
            out.append(f'<rect x="{ox + x * px:g}" y="{oy + y * px:g}" width="{(x2 - x) * px:g}" height="{px:g}" fill="{fill}"/>')
            x = x2
    return "".join(out)

def svg(w, h, body, label, view=None):
    v = view or f"0 0 {w} {h}"
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="{v}" role="img" aria-label="{label}" shape-rendering="crispEdges"><title>{label}</title>{body}</svg>\n'

for key, b in kit["brands"].items():
    out = os.path.join(ROOT, "public/brand", key)
    os.makedirs(out, exist_ok=True)
    g, w = b["glyph"], len(b["glyph"][0])
    name = b["name"].lower()
    for mode, col, ink in (("paper", b["onPaper"], N["ink"]), ("ink", b["onInk"], N["bone"])):
        open(f"{out}/symbol-{mode}.svg", "w").write(svg(w * 16, 96, runs(g, 1, 0, 0, col), b["name"], f"0 0 {w} 6"))
        px, base = 4, 33
        d, end = text_path(name, w * px + 10, base)
        W = int(end + 2)
        body = runs(g, px, 0, base - 6 * px, col) + f'<path d="{d}" fill="{ink}" shape-rendering="geometricPrecision"/>'
        open(f"{out}/wordmark-{mode}.svg", "w").write(svg(W, 44, body, b["name"]))
    cell = 1024 / 12
    icon = f'<rect width="1024" height="1024" fill="{N["ink"]}"/>' + runs(g, cell, (1024 - w * cell) / 2, (1024 - 6 * cell) / 2 + cell / 2, b["onInk"])
    open(f"{out}/icon.svg", "w").write(svg(1024, 1024, icon, b["name"]))
    # favicon: the symbol on ink, a 16-unit square
    fx = (16 - w * 2) / 2
    fav = f'<rect width="16" height="16" rx="3" fill="{N["ink"]}"/>' + runs(g, 2, fx, 2.5, b["onInk"])
    open(f"{out}/favicon.svg", "w").write(svg(16, 16, fav, b["name"]))
    # social preview, 1200 × 630: the symbol large on ink, the name and the role
    px = 30
    og = f'<rect width="1200" height="630" fill="{N["ink"]}"/>' + runs(g, px, 96, 150, b["onInk"])
    nd, _ = text_path(name, 96, 430, 76)
    og += f'<path d="{nd}" fill="{N["bone"]}" shape-rendering="geometricPrecision"/>'
    rd, _ = text_path(b["role"], 96, 500, 30)
    og += f'<path d="{rd}" fill="{N["ash"]}" shape-rendering="geometricPrecision"/>'
    dd, _ = text_path(b["domain"], 96, 560, 24)
    og += f'<path d="{dd}" fill="{b["onInk"]}" shape-rendering="geometricPrecision"/>'
    open(f"{out}/og.svg", "w").write(svg(1200, 630, og, b["name"]))
print("brand assets:", ", ".join(kit["brands"]))
