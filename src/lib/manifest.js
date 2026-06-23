import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { MANIFEST_FILE, PACKAGE_ROOT } from './constants.js';

export function readManifest(dir) {
  const p = join(dir, MANIFEST_FILE);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

export function writeManifest(dir, data) {
  const p = join(dir, MANIFEST_FILE);
  writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export function createManifest(packageVersion, fileHashes) {
  return {
    version: packageVersion,
    installedAt: new Date().toISOString(),
    sourceCommit: getSourceCommit(),
    files: fileHashes,
  };
}

function getSourceCommit() {
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: PACKAGE_ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

export function getPackageVersion() {
  const pkg = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8'));
  return pkg.version;
}
