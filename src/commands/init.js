import { join } from 'node:path';
import { copyFileSync as fsCopyFile } from 'node:fs';
import { PACKAGE_ROOT } from '../lib/constants.js';
import { discoverSkills, discoverSharedRules, discoverCommands } from '../lib/inventory.js';
import { copyRecursive, ensureDir } from '../lib/fs-utils.js';
import { detectIDE } from '../lib/detect-ide.js';
import * as log from '../lib/logger.js';

export function registerInit(program) {
  program
    .command('init')
    .description('Copy skills into current project for the detected IDE(s)')
    .argument('[dir]', 'Project directory', '.')
    .option('--ide <type>', 'Force IDE type: claude, cursor, or both')
    .option('--with-score', 'Include team-score skill (hidden by default)', false)
    .option('--dry-run', 'Show what would be copied', false)
    .action(runInit);
}

function runInit(dir, opts) {
  const { ide, withScore, dryRun } = opts;
  const exclude = withScore ? [] : ['team-score'];
  const ides = detectIDE(dir, ide, { strict: true });

  const tag = dryRun ? '[dry-run] ' : '';
  let count = 0;

  log.heading('初始化 team-skills 到项目');
  log.info(`项目目录: ${dir}`);
  log.info(`目标 IDE: ${ides.join(', ')}`);

  const skills = discoverSkills(PACKAGE_ROOT, { exclude });
  const rules = discoverSharedRules();

  // Cursor: skills → .cursor/skills/
  if (ides.includes('cursor')) {
    const skillsDst = join(dir, '.cursor', 'skills');
    log.heading(`复制 Skills → ${skillsDst}`);

    if (!dryRun) ensureDir(skillsDst);
    for (const skill of skills) {
      const dest = join(skillsDst, skill.name);
      if (!dryRun) copyRecursive(skill.path, dest);
      log.success(`${tag}Skill: ${skill.name}`);
      count++;
    }

    const rulesDst = join(skillsDst, '_team-rules');
    if (!dryRun) ensureDir(rulesDst);
    for (const r of rules) {
      if (!dryRun) fsCopyFile(r.path, join(rulesDst, r.name));
      log.success(`${tag}Rule: ${r.name}`);
      count++;
    }
  }

  // Claude Code: commands → .claude/commands/
  if (ides.includes('claude')) {
    const cmdsDst = join(dir, '.claude', 'commands');
    log.heading(`复制 Commands → ${cmdsDst}`);

    const cmds = discoverCommands();
    if (!dryRun) ensureDir(cmdsDst);
    for (const c of cmds) {
      if (!dryRun) fsCopyFile(c.path, join(cmdsDst, c.filename));
      log.success(`${tag}Command: ${c.filename}`);
      count++;
    }
  }

  log.done(`初始化完成${dryRun ? ' (dry-run)' : ''}！共 ${count} 个组件。`);
  log.info('提示：Hooks 仅在全局安装 (setup) 模式下生效，init 不安装 hooks。');
}
