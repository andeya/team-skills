import { join } from 'node:path';
import { existsSync, copyFileSync as fsCopyFile } from 'node:fs';
import { PACKAGE_ROOT } from '../lib/constants.js';
import { discoverSkills, discoverSharedRules, discoverCommands, discoverHooks, discoverSkillsModuleClaude } from '../lib/inventory.js';
import { copyRecursive, ensureDir } from '../lib/fs-utils.js';
import * as log from '../lib/logger.js';

export function registerInit(program) {
  program
    .command('init')
    .description('Copy skills into current project for the detected IDE(s)')
    .argument('[dir]', 'Project directory', '.')
    .option('--ide <type>', 'Force IDE type: claude, cursor, or both')
    .option('--no-hooks', 'Skip hooks')
    .option('--no-commands', 'Skip command files')
    .option('--with-score', 'Include team-score skill (hidden by default)', false)
    .option('--dry-run', 'Show what would be copied', false)
    .action(runInit);
}

function detectIDE(projectDir, forceIDE) {
  if (forceIDE) {
    if (!['claude', 'cursor', 'both'].includes(forceIDE)) {
      log.error(`不支持的 IDE 类型: ${forceIDE}。可选: claude, cursor, both`);
      process.exit(1);
    }
    return forceIDE === 'both' ? ['claude', 'cursor'] : [forceIDE];
  }

  const detected = [];
  if (existsSync(join(projectDir, '.claude'))) detected.push('claude');
  if (existsSync(join(projectDir, '.cursor'))) detected.push('cursor');

  if (detected.length === 0) {
    log.error('未检测到项目级 IDE 配置（.claude/ 或 .cursor/ 目录）。');
    log.info('请使用 --ide 指定目标 IDE：');
    log.info('  --ide claude    仅安装 Claude Code 的 commands 和 hooks');
    log.info('  --ide cursor    仅安装 Cursor 的 skills 和 hooks');
    log.info('  --ide both      同时安装两者');
    process.exit(1);
  }

  return detected;
}

function runInit(dir, opts) {
  const { ide, hooks, commands, withScore, dryRun } = opts;
  const exclude = withScore ? [] : ['team-score'];
  const ides = detectIDE(dir, ide);

  const tag = dryRun ? '[dry-run] ' : '';
  let count = 0;

  log.heading('初始化 team-skills 到项目');
  log.info(`项目目录: ${dir}`);
  log.info(`目标 IDE: ${ides.join(', ')}`);

  // Cursor: skills → .cursor/skills/
  if (ides.includes('cursor')) {
    const skillsDst = join(dir, '.cursor', 'skills');
    log.heading(`复制 Skills → ${skillsDst}`);

    const skills = discoverSkills(PACKAGE_ROOT, { exclude });
    if (!dryRun) ensureDir(skillsDst);
    for (const skill of skills) {
      const dest = join(skillsDst, skill.name);
      if (!dryRun) copyRecursive(skill.path, dest);
      log.success(`${tag}Skill: ${skill.name}`);
      count++;
    }

    // Shared rules
    const rules = discoverSharedRules();
    const rulesDst = join(skillsDst, '_team-rules');
    if (!dryRun) ensureDir(rulesDst);
    for (const r of rules) {
      if (!dryRun) fsCopyFile(r.path, join(rulesDst, r.name));
      log.success(`${tag}Rule: ${r.name}`);
      count++;
    }

    // skills/CLAUDE.md
    const skillsClaude = discoverSkillsModuleClaude();
    if (skillsClaude) {
      if (!dryRun) fsCopyFile(skillsClaude, join(skillsDst, 'CLAUDE.md'));
      log.success(`${tag}skills/CLAUDE.md`);
      count++;
    }

    // Cursor hooks → .cursor/hooks/
    if (hooks !== false) {
      const hookFiles = discoverHooks();
      const hooksDst = join(dir, '.cursor', 'hooks');
      if (hookFiles.length > 0) {
        if (!dryRun) ensureDir(hooksDst);
        for (const h of hookFiles) {
          if (!dryRun) fsCopyFile(h.path, join(hooksDst, h.name));
          log.success(`${tag}Cursor Hook: ${h.name}`);
          count++;
        }
      }
    }
  }

  // Claude Code: commands → .claude/commands/
  if (commands !== false && ides.includes('claude')) {
    const cmdsDst = join(dir, '.claude', 'commands');
    log.heading(`复制 Commands → ${cmdsDst}`);

    const cmds = discoverCommands();
    if (!dryRun) ensureDir(cmdsDst);
    for (const c of cmds) {
      if (!dryRun) fsCopyFile(c.path, join(cmdsDst, c.filename));
      log.success(`${tag}Command: ${c.filename}`);
      count++;
    }

    // Also install as Cursor skills if both IDEs detected
    if (ides.includes('cursor')) {
      const skillsDst = join(dir, '.cursor', 'skills');
      for (const c of cmds) {
        const skillDir = join(skillsDst, c.name);
        if (!existsSync(skillDir) || dryRun) {
          if (!dryRun) { ensureDir(skillDir); fsCopyFile(c.path, join(skillDir, 'SKILL.md')); }
          log.success(`${tag}Command → Skill: ${c.name}`);
          count++;
        }
      }
    }

    // Claude Code hooks → .claude/hooks/
    if (hooks !== false) {
      const hookFiles = discoverHooks();
      const hooksDst = join(dir, '.claude', 'hooks');
      if (hookFiles.length > 0) {
        if (!dryRun) ensureDir(hooksDst);
        for (const h of hookFiles) {
          if (!dryRun) fsCopyFile(h.path, join(hooksDst, h.name));
          log.success(`${tag}Claude Hook: ${h.name}`);
          count++;
        }
      }
    }
  }

  log.done(`初始化完成${dryRun ? ' (dry-run)' : ''}！共 ${count} 个组件。`);
}
