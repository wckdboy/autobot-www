import { kit } from '../data/kit';
import { brandKey } from '../data/site';

/** The site's favicon: its colored letter on a transparent ground (brand/kit.json). */
export const GET = () => {
  const b = kit.brands[brandKey] ?? kit.brands.autobot;
  const w = b.glyph[0].length;
  const ox = (16 - w * 2) / 2;
  const rects = b.glyph
    .flatMap((row, y) => [...row].map((c, x) => (c === '#' ? `<rect x="${ox + x * 2}" y="${2 + y * 2}" width="2" height="2"/>` : '')))
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" shape-rendering="crispEdges"><style>rect{fill:${b.onPaper}}@media (prefers-color-scheme: dark){rect{fill:${b.onInk}}}</style>${rects}</svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' } });
};
