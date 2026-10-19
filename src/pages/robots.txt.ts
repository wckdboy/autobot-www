const ORIGIN: Record<string, string> = {
  autobot: 'https://autobot.sh',
  invincible: 'https://invincible.sh',
  sovware: 'https://sovware.io',
};

export const GET = () => {
  const key = process.env.SITE_KEY || 'autobot';
  const origin = ORIGIN[key] || ORIGIN.autobot;
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
