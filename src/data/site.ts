import releaseData from './releases.json';
import installData from './install.json';

export type SiteKey = 'autobot' | 'invincible' | 'sovware';

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
    title: 'Autobot — private intelligence, on the metal',
    description:
      'A private AI agent for Android and iOS. Chat, agents, images and voice run on the phone’s NPU, GPU and CPU. Offline by default, redacted before the cloud, a receipt for every answer.',
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
    tagline: 'Private intelligence, on the metal.',
    og: '/og/autobot.png',
  },
  invincible: {
    key: 'invincible',
    name: 'Invincible',
    wordmark: 'INVINCIBLE',
    domain: 'invincible.sh',
    origin: 'https://invincible.sh',
    title: 'Invincible — the node you own',
    description:
      'A self-hosted AI node for a desktop, GPU box or VPS. Serves open models behind OpenAI and Anthropic compatible APIs, routes by policy, signs every receipt, and keeps working when the cloud is gone.',
    theme: 'ink',
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
    tagline: 'Intelligence that never relies solely on someone else.',
    og: '/og/invincible.png',
  },
  sovware: {
    key: 'sovware',
    name: 'Sovware',
    wordmark: 'SOVWARE',
    domain: 'sovware.io',
    origin: 'https://sovware.io',
    title: 'Sovware — sovereign software',
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
