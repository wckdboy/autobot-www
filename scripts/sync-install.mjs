#!/usr/bin/env node
/**
 * Mirrors Invincible's install script to this site so the documented command
 * (curl https://invincible.sh/install.sh | sh) does not depend on raw.github
 * staying in the critical path. The bytes are copied verbatim and the digest is
 * recorded for the install page. Run in CI before every deploy.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = 'https://raw.githubusercontent.com/wckdboy/invincible/main/install.sh';
const OUT = resolve(ROOT, 'public/install.sh');
const META = resolve(ROOT, 'src/data/install.json');

try {
  const res = await fetch(SOURCE, {
    headers: { 'User-Agent': 'wckd-www-build' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const body = await res.text();
  if (!body.includes('#!/bin/sh') || !body.includes('INVINCIBLE')) {
    throw new Error('the downloaded file does not look like the install script');
  }
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, body);
  await writeFile(
    META,
    JSON.stringify(
      {
        source: SOURCE,
        sha256: createHash('sha256').update(body).digest('hex'),
        bytes: Buffer.byteLength(body),
        fetchedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`→ public/install.sh  ${Buffer.byteLength(body)} bytes`);
} catch (error) {
  console.warn(`! install.sh: ${error.message} (keeping the committed mirror)`);
}
