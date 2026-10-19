export const GET = () => {
  const key = process.env.SITE_KEY || 'autobot';
  const dots: string[] = [];

  if (key === 'invincible') {
    for (let y = 0; y < 17; y++) {
      for (let x = 0; x < 17; x++) {
        const cx = 4.6 + x * 1.35;
        const cy = 4.6 + y * 1.35;
        const edge = 16 - Math.abs(cx - 16) * 1.15;
        if (cy > edge - 1.2 && cy < 27) {
          const t = (cy - 3) / 24;
          dots.push(
            `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(0.28 + t * 0.42).toFixed(2)}" opacity="${(0.55 + t * 0.45).toFixed(2)}"/>`,
          );
        }
      }
    }
  } else if (key === 'sovware') {
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const inner = x === 2 && y === 2;
        dots.push(
          `<circle cx="${6 + x * 5}" cy="${6 + y * 5}" r="${inner ? 1.8 : 0.95 - Math.max(Math.abs(x - 2), Math.abs(y - 2)) * 0.12}" opacity="${inner ? 1 : 0.75}"/>`,
        );
      }
    }
  } else {
    for (let y = 0; y < 17; y++) {
      for (let x = 0; x < 17; x++) {
        const t = (16 - x + y) / 32;
        dots.push(
          `<circle cx="${(4.6 + x * 1.35).toFixed(1)}" cy="${(4.6 + y * 1.35).toFixed(1)}" r="${(0.18 + t * 0.56).toFixed(2)}"/>`,
        );
      }
    }
  }

  const bg = key === 'autobot' ? '#E8401C' : '#141414';
  const fg = key === 'autobot' ? '#F4EEE6' : '#E8401C';
  const apex = key === 'invincible' ? '<circle cx="16" cy="5" r="1.8" fill="#F4EEE6"/>' : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${bg}"/><g fill="${fg}">${dots.join('')}</g>${apex}</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
