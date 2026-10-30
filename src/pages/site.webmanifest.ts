import { meta } from '../data/site';

export const GET = () => {
  const manifest = {
    name: meta.title,
    short_name: meta.name,
    description: meta.description,
    start_url: '/',
    display: 'minimal-ui',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
