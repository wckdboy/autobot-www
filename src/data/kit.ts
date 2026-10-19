import kitData from '../../brand/kit.json';

/** The brand kit (brand/kit.json): neutrals, states and every brand's symbol and colors. */
export interface Brand {
  name: string;
  domain: string;
  role: string;
  glyph: string[];
  onInk: string;
  onPaper: string;
  text: string;
}

export const kit = kitData as typeof kitData & { brands: Record<string, Brand> };
export const brandKeys = Object.keys(kit.brands);

/** [brand]'s pixel symbol as SVG rects in currentColor, [height] px tall. */
export function symbolSvg(brand: Brand, height = 14, label?: string): string {
  const w = brand.glyph[0].length;
  const rects: string[] = [];
  brand.glyph.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== '#') { x++; continue; }
      let x2 = x;
      while (x2 < row.length && row[x2] === '#') x2++;
      rects.push(`<rect x="${x}" y="${y}" width="${x2 - x}" height="1"/>`);
      x = x2;
    }
  });
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 6" height="${height}" width="${(height / 6) * w}" fill="currentColor" shape-rendering="crispEdges" ${a11y}>${rects.join('')}</svg>`;
}
