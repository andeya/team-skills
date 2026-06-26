import {
  mkdirSync, symlinkSync, unlinkSync, readlinkSync,
  lstatSync, existsSync, readdirSync, statSync,
  copyFileSync, chmodSync, rmSync, realpathSync,
} from 'node:fs';
import { join, dirname } from 'node:path';

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

export function createSymlinkSafe(source, target, { force = false, dryRun = false } = {}) {
  if (dryRun) return 'dry-run';

  if (isSymlink(target)) {
    if (readlinkSync(target) === source) return 'exists';
    if (!force) return 'conflict';
    unlinkSync(target);
  } else if (existsSync(target)) {
    // 目标存在但不是软连接 — 解析真实路径，如果是同一文件则视为已安装
    try {
      if (realpathSync(target) === realpathSync(source)) return 'exists';
    } catch {
      // 任一无法解析，继续走 force 逻辑
    }
    if (!force) return 'conflict';
    rmSync(target, { recursive: true });
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
