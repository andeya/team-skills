import { join } from 'node:path';
import { existsSync } from 'node:fs';
import {
  PACKAGE_ROOT, LOCAL_INSTALL_DIR, SKILLS_DIR, HOOKS_DIR, COMMANDS_DIR,
} from '../lib/constants.js';
import { discoverSkills, discoverSharedRules, discoverCommands, discoverHooks, discoverSkillsModuleClaude } from '../lib/inventory.js';
import { copyRecursive, computeDirectoryHashes, ensureDir } from '../lib/fs-utils.js';
import { createManifest, writeManifest, readManifest, getPackageVersion } from '../lib/manifest.js';
import * as log from '../lib/logger.js';
import { copyFileSync as fsCopyFile } from 'node:fs';

export function registerInit(program) {
  program
    .command('init')
    .description('Copy skills into your project for version-controlled local use')
    .argument('[dir]', 'Project directory', '.')
    .option('--no-hooks', 'Skip hooks')
    .option('--no-commands', 'Skip command files')
    .option('--with-score', 'Include team-score skill (hidden by default)', false)
    .option('--dry-run', 'Show what would be copied', false)
    .action(runInit);
}

function runInit(dir, opts) {
  const { hooks, commands, withScore, dryRun } = opts;
  const installDir = join(dir, LOCAL_INSTALL_DIR);
  const exclude = withScore ? [] : ['team-score'];

  const existing = readManifest(installDir);
  if (existing) {
    log.error(`${installDir} 已存在（v${existing.version}）。使用 team-skills update 更新。`);
    process.exit(1);
  }

  const tag = dryRun ? '[dry-run] ' : '';
  let fileCount = 0;

  log.heading('初始化 team-skills 到项目');
  log.info(`目标目录: ${installDir}`);

  // Copy skills/
  log.heading('复制 Skills');
  const skillsDst = join(installDir, 'skills');
  const skills = discoverSkills(PACKAGE_ROOT, { exclude });
  const rules = discoverSharedRules();
  if (!dryRun) {
    ensureDir(skillsDst);
    for (const s of skills) copyRecursive(s.path, join(skillsDst, s.name));
    const rulesDst = join(skillsDst, '_team-rules');
    ensureDir(rulesDst);
    for (const r of rules) fsCopyFile(r.path, join(rulesDst, r.name));
  }
  fileCount += skills.length + rules.length;
  for (const s of skills) log.success(`${tag}Skill: ${s.name}`);
  for (const r of rules) log.success(`${tag}Rule: ${r.name}`);

  // Copy skills/CLAUDE.md if exists
  const skillsClaude = discoverSkillsModuleClaude();
  if (skillsClaude) {
    if (!dryRun) {
      fsCopyFile(skillsClaude, join(skillsDst, 'CLAUDE.md'));
    }
    log.success(`${tag}skills/CLAUDE.md`);
    fileCount++;
  }

  // Copy hooks/
  if (hooks !== false) {
    log.heading('复制 Hooks');
    const hookFiles = discoverHooks();
    const hooksDst = join(installDir, 'hooks');
    if (hookFiles.length > 0) {
      if (!dryRun) ensureDir(hooksDst);
      for (const h of hookFiles) {
        if (!dryRun) {
          fsCopyFile(h.path, join(hooksDst, h.name));
        }
        log.success(`${tag}Hook: ${h.name}`);
        fileCount++;
      }
    }
  }

  // Copy commands/
  if (commands !== false) {
    log.heading('复制 Commands');
    const cmds = discoverCommands();
    const cmdsDst = join(installDir, 'commands');
    if (cmds.length > 0) {
      if (!dryRun) ensureDir(cmdsDst);
      for (const c of cmds) {
        if (!dryRun) {
          fsCopyFile(c.path, join(cmdsDst, c.filename));
        }
        log.success(`${tag}Command: ${c.filename}`);
        fileCount++;
      }
    }
  }

  // Write manifest
  if (!dryRun) {
    const hashes = computeDirectoryHashes(installDir);
    const manifest = createManifest(getPackageVersion(), hashes);
    writeManifest(installDir, manifest);
    log.success('manifest.json 已生成');
  }

  log.done(`初始化完成${dryRun ? ' (dry-run)' : ''}！共 ${fileCount} 个组件。`);

  console.log(`
集成说明:
  Cursor:     将 ${installDir}/skills 设为 agent skills 目录
  Claude Code: 将 ${installDir}/commands/*.md 链接到 .claude/commands/
  Hooks:      将 ${installDir}/hooks/ 链接到 ~/.cursor/hooks/ 或 ~/.claude/hooks/
  更新:       运行 team-skills update
`);
}
