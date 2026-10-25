import { meta } from '../data/site';

export const GET = () => {
  const key = meta.key;
  const origin = meta.origin;
  const paths = key === 'autobot' ? ['/', '/releases/', '/install/', '/privacy/', '/verify/', '/brand/']
    : key === 'invincible' ? ['/', '/releases/', '/install/', '/guides/', '/verify/', '/brand/']
    : ['/', '/brand/'];
  const today = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    (p) => `  <url>
    <loc>${origin}${p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${p === '/' ? '1.0' : '0.7'}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
