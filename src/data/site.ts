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
    title: 'Invincible — the node you own',
    description:
      'The node you own: one gateway for every model you run, text, speech and images today, on the hardware you have and across the machines you own, with decentralized fine-tuning to make them yours, frontier models only by your policy, a signed receipt for every call, and the hard parts of AI made plain.',
    theme: 'paper',
    nav: [
      { label: 'Why', href: '/#why' },
      { label: 'Cluster', href: '/#cluster' },
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
    title: 'Sovware — sovereign software and hardware',
    description:
      'Sovware is the non-profit community behind WCKD\'s software: it advocates for sovereign software and hardware and makes sure the stack actually is, with mirrors, archives, security across every repository and a verifier kernel.',
    theme: 'paper',
    nav: [
      { label: 'Sovereign', href: '/#sovereign' },
      { label: 'The org', href: '/#work' },
      { label: 'Stack', href: '/#stack' },
      { label: 'Kernel', href: '/#kernel' },
      { label: 'Source', href: 'https://github.com/wckdboy' },
    ],
    other: 'autobot',
    repo: 'https://github.com/wckdboy/sovware',
    license: 'Apache-2.0',
    tagline: 'The org that keeps it sovereign.',
    og: '/og/sovware.png',
  },
  wckd: {
    key: 'wckd', name: 'WCKD', wordmark: 'wckd', domain: 'wckd.ai', origin: 'https://wckd.ai',
    title: 'WCKD — one lab, one system', description: 'The WCKD lab and its brand kit: Sovware, Autobot, Invincible, Omnie, Nightfall and Niobium, each a lowercase letter in pixels and one color.',
    theme: 'paper', nav: [], other: 'autobot', repo: 'https://github.com/wckdboy', license: 'Apache-2.0 / MIT', tagline: 'One lab, one system.', og: '/og/sovware.png',
  },
  omnie: {
    key: 'omnie', name: 'Omnie', wordmark: 'omnie', domain: 'omnie.sh', origin: 'https://omnie.sh',
    title: 'Omnie — an IDE for iOS and iPadOS', description: 'An offline-first IDE for agent-assisted development on iPad and iPhone: a native editor, git, a local model, and a sandbox that runs the project\'s own tests.',
    theme: 'paper', nav: [], other: 'autobot', repo: 'https://github.com/wckdboy/omnie-dev', license: 'Apache-2.0', tagline: 'The IDE on the iPad.', og: '/og/sovware.png',
  },
  nightfall: {
    key: 'nightfall', name: 'Nightfall', wordmark: 'nightfall', domain: 'nightfall.sh', origin: 'https://nightfall.sh',
    title: 'Nightfall — AI-native CAD', description: 'AI-native CAD: a fork of FreeCAD where an agent edits the model as a program, across the sketcher, part design, assemblies, PCB and KiCad, drafting and BIM.',
    theme: 'paper', nav: [], other: 'autobot', repo: 'https://github.com/wckdboy/nightfall', license: 'LGPL-2.1+', tagline: 'Every part is a program.', og: '/og/nightfall.png',
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
