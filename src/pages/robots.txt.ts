import { meta } from '../data/site';

export const GET = () => {
  const origin = meta.origin;
  const body = `# ${origin.replace('https://', '')}
# Public pages only. No tracking, no crawling of anything private.
User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
