const SITES: Record<string, { name: string; short: string; theme: string; bg: string }> = {
  autobot: { name: 'Autobot — private intelligence', short: 'Autobot', theme: '#e8401c', bg: '#efeae2' },
  invincible: { name: 'Invincible — the node you own', short: 'Invincible', theme: '#0e0e0e', bg: '#0e0e0e' },
  sovware: { name: 'Sovware — sovereign software', short: 'Sovware', theme: '#e8401c', bg: '#efeae2' },
};

export const GET = () => {
  const key = process.env.SITE_KEY || 'autobot';
  const s = SITES[key] || SITES.autobot;
  const manifest = {
    name: s.name,
    short_name: s.short,
    description: 'Private intelligence on hardware you own.',
    start_url: '/',
    display: 'minimal-ui',
    background_color: s.bg,
    theme_color: s.theme,
    icons: [
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
