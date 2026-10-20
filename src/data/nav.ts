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
    footer: 'Autobot is free software under Apache-2.0. No accounts. No telemetry. Made by WCKD.',
    repo: 'https://github.com/wckdboy/autobot',
  },
  invincible: {
    nav: [
      { label: 'Overview', href: '/' },
      { label: 'Install', href: '/install/' },
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
      { label: 'Sovware', href: 'https://sovware.io' },
      { label: 'Autobot', href: 'https://autobot.sh' },
      { label: 'Invincible', href: 'https://invincible.sh' },
      { label: 'Omnie', href: 'https://omnie.sh' },
      { label: 'Nightfall', href: 'https://nightfall.sh' },
      { label: 'GitHub', href: 'https://github.com/wckdboy' },
    ],
    footer: 'WCKD is an independent lab. Free software, signed releases, checkable claims.',
    repo: 'https://github.com/wckdboy',
  },
  sovware: {
    nav: [
      { label: 'Autobot', href: 'https://autobot.sh' },
      { label: 'Invincible', href: 'https://invincible.sh' },
      { label: 'Brand', href: '/brand/' },
      { label: 'GitHub', href: 'https://github.com/wckdboy' },
    ],
    footer: 'Sovware is sovereign hardware and software, made by WCKD.',
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
      { label: 'Brand', href: '/' },
      { label: 'Source', href: 'https://github.com/wckdboy/nightfall' },
      { label: 'WCKD', href: 'https://wckd.ai' },
    ],
    footer: 'Nightfall is open-source, AI-native parametric CAD. Made by WCKD.',
    repo: 'https://github.com/wckdboy/nightfall',
  },
} as const;
