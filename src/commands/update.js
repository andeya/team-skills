import { join } from 'node:path';
import { existsSync, readdirSync, statSync, copyFileSync as fsCopyFile } from 'node:fs';
import { LOCAL_INSTALL_DIR, PACKAGE_ROOT, SKILLS_DIR, HOOKS_DIR, COMMANDS_DIR } from '../lib/constants.js';
import { computeDirectoryHashes, computeFileHash, ensureDir } from '../lib/fs-utils.js';
import { readManifest, writeManifest, createManifest, getPackageVersion } from '../lib/manifest.js';
import * as log from '../lib/logger.js';
import { dirname } from 'node:path';

export function registerUpdate(program) {
  program
    .command('update')
    .description('Update previously init\'d skills to latest version')
    .argument('[dir]', 'Project directory', '.')
    .option('--force', 'Overwrite locally modified files (creates .bak backup)', false)
    .option('--dry-run', 'Show what would change', false)
    .action(runUpdate);
}

function runUpdate(dir, opts) {
  const { force, dryRun } = opts;
  const installDir = join(dir, LOCAL_INSTALL_DIR);
  const manifest = readManifest(installDir);

  if (!manifest) {
    log.error(`未找到 ${installDir}/manifest.json。请先运行 team-skills init。`);
    process.exit(1);
  }

  const currentVersion = getPackageVersion();
  log.info(`已安装版本: ${manifest.version} | 最新版本: ${currentVersion}`);

  const tag = dryRun ? '[dry-run] ' : '';
  const sourceMap = buildSourceMap();

  let updated = 0;
  let skipped = 0;
  let added = 0;

  log.heading('检查文件更新');

  for (const [relPath, sourceFullPath] of Object.entries(sourceMap)) {
    const installedPath = join(installDir, relPath);
    const sourceHash = computeFileHash(sourceFullPath);

    if (!existsSync(installedPath)) {
      if (!dryRun) {
        ensureDir(dirname(installedPath));
        fsCopyFile(sourceFullPath, installedPath);
      }
      log.success(`${tag}新增: ${relPath}`);
      added++;
      continue;
    }

    const installedHash = computeFileHash(installedPath);
    if (installedHash === sourceHash) continue;

    const manifestHash = manifest.files[relPath];
    if (manifestHash && installedHash !== manifestHash && !force) {
      log.warn(`跳过: ${relPath}（本地已修改，使用 --force 覆盖）`);
      skipped++;
      continue;
    }

    if (!dryRun) {
      if (force && manifestHash && installedHash !== manifestHash) {
        fsCopyFile(installedPath, installedPath + '.bak');
        log.info(`备份: ${relPath}.bak`);
      }
      fsCopyFile(sourceFullPath, installedPath);
    }
    log.success(`${tag}更新: ${relPath}`);
    updated++;
  }

  for (const relPath of Object.keys(manifest.files)) {
    if (!sourceMap[relPath]) {
      log.warn(`源文件已删除: ${relPath}（如不再需要请手动删除）`);
    }
  }

  if (!dryRun) {
    const newHashes = computeDirectoryHashes(installDir);
    delete newHashes['manifest.json'];
    const newManifest = createManifest(currentVersion, newHashes);
    writeManifest(installDir, newManifest);
  }

  log.done(`更新完成${dryRun ? ' (dry-run)' : ''}！更新 ${updated}，新增 ${added}，跳过 ${skipped}。`);
}

function buildSourceMap() {
  const map = {};

  const skillsDir = join(PACKAGE_ROOT, SKILLS_DIR);
  if (existsSync(skillsDir)) scanRecursive(skillsDir, 'skills', map);

  const hooksDir = join(PACKAGE_ROOT, HOOKS_DIR);
  if (existsSync(hooksDir)) scanRecursive(hooksDir, 'hooks', map);

  const cmdsDir = join(PACKAGE_ROOT, COMMANDS_DIR);
  if (existsSync(cmdsDir)) scanRecursive(cmdsDir, 'commands', map);

  return map;
}

function scanRecursive(baseDir, prefix, map) {
  const entries = readdirSync(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(baseDir, entry.name);
    const relPath = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      scanRecursive(fullPath, relPath, map);
    } else {
      map[relPath] = fullPath;
    }
  }
}
