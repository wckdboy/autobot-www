import releaseData from './releases.json';
import installData from './install.json';

export type SiteKey = 'autobot' | 'invincible' | 'sovware' | 'wckd' | 'omnie' | 'nightfall';

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface SiteMeta {
  key: SiteKey;
  name: string;
  wordmark: string;
  domain: string;
  origin: string;
  title: string;
  description: string;
  theme: 'paper' | 'ink';
  nav: NavItem[];
  other: SiteKey;
  repo: string;
  license: string;
  tagline: string;
  og: string;
}

const KEY = (process.env.SITE_KEY || 'autobot') as SiteKey;

const configs: Record<SiteKey, SiteMeta> = {
  autobot: {
    key: 'autobot',
    name: 'Autobot',
    wordmark: 'AUTOBOT',
    domain: 'autobot.sh',
    origin: 'https://autobot.sh',
    title: 'Autobot — private AI on your phone',
    description:
      'An open-source AI agent for Android and iOS. Chat, agents, image generation and voice run on your device. Offline by default, redacted before the cloud, and a privacy receipt for every answer.',
    theme: 'paper',
    nav: [
      { label: 'System', href: '/#system' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Install', href: '/install' },
      { label: 'Releases', href: '/releases' },
    ],
    other: 'invincible',
    repo: 'https://github.com/wckdboy/autobot',
    license: 'Apache-2.0',
    tagline: 'Private AI on the phone.',
    og: '/og/autobot.png',
  },
  invincible: {
    key: 'invincible',
    name: 'Invincible',
    wordmark: 'INVINCIBLE',
    domain: 'invincible.sh',
    origin: 'https://invincible.sh',
    title: 'Invincible — a node you own',
    description:
      'A self-hosted AI node for a desktop, GPU box or VPS. Serves open models behind OpenAI and Anthropic compatible APIs, routes by policy, signs every receipt, and keeps working when the cloud is gone.',
    theme: 'paper',
    nav: [
      { label: 'Why', href: '/#why' },
      { label: 'Tiers', href: '/#tiers' },
      { label: 'Trust', href: '/verify' },
      { label: 'Install', href: '/install' },
      { label: 'Releases', href: '/releases' },
    ],
    other: 'autobot',
    repo: 'https://github.com/wckdboy/invincible',
    license: 'MIT',
    tagline: 'A node you own.',
    og: '/og/invincible.png',
  },
  sovware: {
    key: 'sovware',
    name: 'Sovware',
    wordmark: 'SOVWARE',
    domain: 'sovware.io',
    origin: 'https://sovware.io',
    title: 'Sovware — software that answers to its owner',
    description:
      'Sovereign software for a compute-critical world. The studio behind Autobot and Invincible Gateway: private intelligence on hardware you own.',
    theme: 'paper',
    nav: [
      { label: 'Work', href: '/#work' },
      { label: 'Principles', href: '/#principles' },
      { label: 'Autobot', href: 'https://autobot.sh' },
      { label: 'Invincible', href: 'https://invincible.sh' },
    ],
    other: 'autobot',
    repo: 'https://github.com/wckdboy',
    license: 'Apache-2.0 / MIT',
    tagline: 'Software that answers to its owner.',
    og: '/og/sovware.png',
  },
  wckd: {
    key: 'wckd', name: 'WCKD', wordmark: 'wckd', domain: 'wckd.ai', origin: 'https://wckd.ai',
    title: 'WCKD — one lab, one system', description: 'The WCKD lab and its brand kit: Sovware, Autobot, Invincible, Omnie and Nightfall, each a lowercase letter in pixels and one color.',
    theme: 'paper', nav: [], other: 'autobot', repo: 'https://github.com/wckdboy', license: 'Apache-2.0 / MIT', tagline: 'One lab, one system.', og: '/og/sovware.png',
  },
  omnie: {
    key: 'omnie', name: 'Omnie', wordmark: 'omnie', domain: 'omnie.sh', origin: 'https://omnie.sh',
    title: 'Omnie — every model, agent and tool in one thread', description: 'Omnie puts every model, agent and tool behind one composer on iPhone, Mac and Vision Pro.',
    theme: 'paper', nav: [], other: 'autobot', repo: 'https://github.com/wckdboy/Omnie', license: 'see the repository', tagline: 'Every model in one thread.', og: '/og/sovware.png',
  },
  nightfall: {
    key: 'nightfall', name: 'Nightfall', wordmark: 'nightfall', domain: 'nightfall.sh', origin: 'https://nightfall.sh',
    title: 'Nightfall — AI-native parametric CAD', description: 'Open-source, AI-native parametric CAD for macOS: exact NURBS geometry, full history, every part a program.',
    theme: 'paper', nav: [], other: 'autobot', repo: 'https://github.com/wckdboy/nightfall', license: 'see the repository', tagline: 'Every part is a program.', og: '/og/sovware.png',
  },
};

export const SITE = KEY;
export const meta = configs[KEY];

export const releases = releaseData as {
  generatedAt: string;
  autobot: ReleaseRepo;
  invincible: ReleaseRepo;
};

export const install = installData as {
  source: string;
  sha256: string;
  bytes: number;
  fetchedAt: string;
};

export interface ReleaseAsset {
  name: string;
  size: number;
  downloads: number;
  url: string;
}

export interface Release {
  tag: string;
  name: string;
  published: string;
  url: string;
  prerelease: boolean;
  body: string;
  assets: ReleaseAsset[];
}

export interface ReleaseRepo {
  name: string;
  description: string;
  stars: number;
  forks: number;
  license: string;
  pushed: string;
  latest: Release;
  releases: Release[];
  checksums: string | null;
  totalDownloads: number;
}

export const product = {
  autobot: releases.autobot,
  invincible: releases.invincible,
};

export const otherSite = configs[meta.other];
