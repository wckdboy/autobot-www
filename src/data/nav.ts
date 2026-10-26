/** Navigation and footer for each site on the Lab layout. */
export const NAV = {
  autobot: {
    nav: [
      { label: 'Overview', href: '/' },
      { label: 'Install', href: '/install/' },
      { label: 'Status', href: '/#status' },
      { label: 'Privacy', href: '/privacy/' },
      { label: 'Verify', href: '/verify/' },
      { label: 'Releases', href: '/releases/' },
      { label: 'Source', href: 'https://github.com/wckdboy/autobot' },
    ],
    footer: 'Autobot’s own code is free software: the apps Apache-2.0, the agent MIT. No accounts. No telemetry. Made by WCKD.',
    repo: 'https://github.com/wckdboy/autobot',
  },
  invincible: {
    nav: [
      { label: 'Overview', href: '/' },
      { label: 'Install', href: '/install/' },
      { label: 'Guides', href: '/guides/' },
      { label: 'Cluster', href: '/#cluster' },
      { label: 'Training', href: '/#training' },
      { label: 'Status', href: '/#status' },
      { label: 'Verify', href: '/verify/' },
      { label: 'Releases', href: '/releases/' },
      { label: 'Source', href: 'https://github.com/wckdboy/invincible' },
    ],
    footer: 'Invincible is free software under MIT. It runs on hardware you own and phones home to nobody. Made by WCKD.',
    repo: 'https://github.com/wckdboy/invincible',
  },
  wckd: {
    nav: [
      { label: 'Projects', href: '/#projects' },
      { label: 'Brand', href: '/brand/' },
      { label: 'GitHub', href: 'https://github.com/wckdboy' },
    ],
    footer: 'WCKD is an independent lab. Software, experiments and open research.',
    repo: 'https://github.com/wckdboy',
  },
  sovware: {
    nav: [
      { label: 'Sovereign', href: '/#sovereign' },
      { label: 'The org', href: '/#work' },
      { label: 'Stack', href: '/#stack' },
      { label: 'Kernel', href: '/#kernel' },
      { label: 'Brand', href: '/brand/' },
      { label: 'Source', href: 'https://github.com/wckdboy' },
    ],
    footer: 'Sovware is the non-profit community that keeps WCKD\'s software sovereign: mirrored, archived, secured, checked.',
    repo: 'https://github.com/wckdboy',
  },
  omnie: {
    nav: [
      { label: 'Brand', href: '/' },
      { label: 'Source', href: 'https://github.com/wckdboy/omnie-dev' },
      { label: 'WCKD', href: 'https://wckd.ai' },
    ],
    footer: 'Omnie is an IDE for development on iPad and iPhone. Made by WCKD.',
    repo: 'https://github.com/wckdboy/omnie-dev',
  },
  nightfall: {
    nav: [
      { label: 'Overview', href: '/' },
      { label: 'Polykrom', href: 'https://polykrom.app' },
      { label: 'PolyCore', href: 'https://github.com/wckdboy/polycore' },
      { label: 'Brand', href: '/brand/' },
      { label: 'Source', href: 'https://github.com/wckdboy/nightfall' },
      { label: 'WCKD', href: 'https://wckd.ai' },
    ],
    footer: 'Nightfall is archived; it continues as Polykrom and PolyCore. Made by WCKD.',
    repo: 'https://github.com/wckdboy/nightfall',
  },
  tinyrex: {
    nav: [
      { label: 'Overview', href: '/' },
      { label: '3D', href: '/#model' },
      { label: 'Results', href: '/#results' },
      { label: 'How', href: '/#build' },
      { label: 'Source', href: 'https://github.com/wckdboy/tinyrex' },
      { label: 'WCKD', href: 'https://wckd.ai' },
    ],
    footer: 'TinyRex was designed by an AI agent in Polykrom. Code Apache-2.0; design and media CC-BY-4.0. Made by WCKD.',
    repo: 'https://github.com/wckdboy/tinyrex',
  },
} as const;
