import {
  mkdirSync, symlinkSync, unlinkSync, readlinkSync,
  lstatSync, existsSync, readdirSync, statSync,
  copyFileSync, readFileSync, chmodSync, rmSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';

export function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

export function isSymlink(p) {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

export function isSymlinkTo(p, target) {
  try {
    return lstatSync(p).isSymbolicLink() && readlinkSync(p) === target;
  } catch {
    return false;
  }
}

export function createSymlinkSafe(source, target, { force = false, dryRun = false } = {}) {
  if (dryRun) return 'dry-run';

  if (isSymlink(target)) {
    if (readlinkSync(target) === source) return 'exists';
    if (!force) return 'conflict';
    unlinkSync(target);
  } else if (existsSync(target)) {
    if (!force) return 'conflict';
    unlinkSync(target);
  }

  ensureDir(dirname(target));

  const isDir = statSync(source).isDirectory();
  symlinkSync(source, target, isDir ? 'dir' : 'file');
  return 'created';
}

export function removeSymlinkSafe(target, expectedSource) {
  if (!isSymlink(target)) return 'not-found';

  if (expectedSource) {
    const actual = readlinkSync(target);
    if (actual !== expectedSource) return 'foreign';
  }

  unlinkSync(target);
  return 'removed';
}

export function computeFileHash(filePath) {
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

export function copyRecursive(source, target) {
  ensureDir(target);
  const entries = readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(source, entry.name);
    const dstPath = join(target, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, dstPath);
    } else {
      copyFileSync(srcPath, dstPath);
      try {
        const srcStat = statSync(srcPath);
        chmodSync(dstPath, srcStat.mode);
      } catch {
        // best-effort permission copy
      }
    }
  }
}

export function computeDirectoryHashes(dirPath, prefix = '') {
  const hashes = {};
  if (!existsSync(dirPath)) return hashes;

  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      Object.assign(hashes, computeDirectoryHashes(fullPath, relPath));
    } else {
      hashes[relPath] = computeFileHash(fullPath);
    }
  }

  return hashes;
}

export function rmdirIfEmpty(dir) {
  try {
    const entries = readdirSync(dir);
    if (entries.length === 0) {
      rmSync(dir);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}
