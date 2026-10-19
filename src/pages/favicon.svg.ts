import { kit } from '../data/kit';

/** The site's favicon: its pixel symbol on ink (brand/kit.json). */
export const GET = () => {
  const key = process.env.SITE_KEY || 'autobot';
  const b = kit.brands[key] ?? kit.brands.autobot;
  const w = b.glyph[0].length;
  const ox = (16 - w * 2) / 2;
  const rects = b.glyph
    .flatMap((row, y) => [...row].map((c, x) => (c === '#' ? `<rect x="${ox + x * 2}" y="${2.5 + y * 2}" width="2" height="2"/>` : '')))
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect width="16" height="16" rx="3" fill="${kit.neutrals.ink}"/><g fill="${b.onInk}">${rects}</g></svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' } });
};
