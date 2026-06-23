import { join } from 'node:path';
import { existsSync, copyFileSync as fsCopyFile, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { PACKAGE_ROOT } from '../lib/constants.js';
import { discoverSkills, discoverSharedRules, discoverCommands, discoverHooks, discoverSkillsModuleClaude } from '../lib/inventory.js';
import { copyRecursive, ensureDir } from '../lib/fs-utils.js';
import * as log from '../lib/logger.js';

export function registerUpdate(program) {
  program
    .command('update')
    .description('Upgrade team-skills package and update project installations')
    .argument('[dir]', 'Project directory', '.')
    .option('--ide <type>', 'Force IDE type: claude, cursor, or both')
    .option('--no-hooks', 'Skip hooks')
    .option('--no-commands', 'Skip command files')
    .option('--with-score', 'Include team-score skill (hidden by default)', false)
    .option('--skip-self', 'Skip self-upgrade, only update project', false)
    .option('--dry-run', 'Show what would change', false)
    .action(runUpdate);
}

function upgradeSelf(dryRun) {
  log.heading('升级 team-skills 包');
  try {
    const current = JSON.parse(
      execSync('npm view team-skills version --registry https://registry.npmjs.org 2>/dev/null', { encoding: 'utf8' }).trim()
    );
    const local = JSON.parse(
      execSync(`node -e "console.log(require('${join(PACKAGE_ROOT, 'package.json')}').version)"`, { encoding: 'utf8' }).trim()
    );
    if (current === local) {
      log.skip(`已是最新版本 (${local})`);
      return;
    }
    log.info(`${local} → ${current}`);
    if (!dryRun) {
      execSync('npm install -g team-skills@latest --registry https://registry.npmjs.org', { stdio: 'inherit' });
      log.success(`已升级到 ${current}`);
    } else {
      log.success(`[dry-run] 将升级到 ${current}`);
    }
  } catch {
    log.warn('自升级跳过（无法访问 npm registry 或非全局安装）');
  }
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
  return detected;
}

function runUpdate(dir, opts) {
  const { ide, hooks, commands, withScore, skipSelf, dryRun } = opts;

  // Step 1: self-upgrade
  if (!skipSelf) upgradeSelf(dryRun);

  // Step 2: update project if IDE detected
  const exclude = withScore ? [] : ['team-score'];
  const ides = detectIDE(dir, ide);

  if (ides.length === 0) {
    log.info('当前项目未检测到 IDE 配置（.claude/ 或 .cursor/），跳过项目更新。');
    return;
  }

  const tag = dryRun ? '[dry-run] ' : '';
  let count = 0;

  log.heading('更新项目中的 team-skills');
  log.info(`项目目录: ${dir}`);
  log.info(`目标 IDE: ${ides.join(', ')}`);

  // Cursor skills → .cursor/skills/
  if (ides.includes('cursor')) {
    const skillsDst = join(dir, '.cursor', 'skills');
    log.heading(`更新 Skills → ${skillsDst}`);

    const skills = discoverSkills(PACKAGE_ROOT, { exclude });
    if (!dryRun) ensureDir(skillsDst);
    for (const skill of skills) {
      const dest = join(skillsDst, skill.name);
      if (!dryRun) {
        if (existsSync(dest)) rmSync(dest, { recursive: true });
        copyRecursive(skill.path, dest);
      }
      log.success(`${tag}Skill: ${skill.name}`);
      count++;
    }

    const rules = discoverSharedRules();
    const rulesDst = join(skillsDst, '_team-rules');
    if (!dryRun) ensureDir(rulesDst);
    for (const r of rules) {
      if (!dryRun) fsCopyFile(r.path, join(rulesDst, r.name));
      log.success(`${tag}Rule: ${r.name}`);
      count++;
    }

    const skillsClaude = discoverSkillsModuleClaude();
    if (skillsClaude) {
      if (!dryRun) fsCopyFile(skillsClaude, join(skillsDst, 'CLAUDE.md'));
      log.success(`${tag}skills/CLAUDE.md`);
      count++;
    }

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

  // Claude Code commands → .claude/commands/
  if (commands !== false && ides.includes('claude')) {
    const cmdsDst = join(dir, '.claude', 'commands');
    log.heading(`更新 Commands → ${cmdsDst}`);

    const cmds = discoverCommands();
    if (!dryRun) ensureDir(cmdsDst);
    for (const c of cmds) {
      if (!dryRun) fsCopyFile(c.path, join(cmdsDst, c.filename));
      log.success(`${tag}Command: ${c.filename}`);
      count++;
    }

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

  log.done(`更新完成${dryRun ? ' (dry-run)' : ''}！共 ${count} 个组件。`);
}
