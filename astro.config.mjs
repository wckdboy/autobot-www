import { defineConfig } from 'astro/config';

const KEY = process.env.SITE_KEY || 'autobot';

const ORIGIN = {
  autobot: 'https://autobot.sh',
  invincible: 'https://invincible.sh',
  sovware: 'https://sovware.io',
  wckd: 'https://wckd.ai',
  omnie: 'https://omnie.sh',
  nightfall: 'https://nightfall.sh',
  tinyrex: 'https://tinyrex.sh',
};

if (!ORIGIN[KEY]) {
  throw new Error(`SITE_KEY must be one of ${Object.keys(ORIGIN).join(', ')} (got "${KEY}")`);
}

export default defineConfig({
  site: ORIGIN[KEY],
  outDir: `./dist/${KEY}`,
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
  devToolbar: { enabled: false },
  vite: {
    build: {
      assetsInlineLimit: 2048,
    },
  },
});
