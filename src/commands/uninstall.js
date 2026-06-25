import { join } from 'node:path';
import { DEFAULT_SKILLS_TARGET, resolveTargets } from '../lib/constants.js';
import { discoverSkills, discoverSharedRules } from '../lib/inventory.js';
import { removeSymlinkSafe, rmdirIfEmpty } from '../lib/fs-utils.js';
import * as log from '../lib/logger.js';

export function registerUninstall(program) {
  program
    .command('uninstall')
    .description('Remove all team-skills symlinks')
    .argument('[target]', 'Target skills directory', DEFAULT_SKILLS_TARGET)
    .option('--dry-run', 'Show what would be removed', false)
    .action(runUninstall);
}

function remove(dest, expectedSource, label, dryRun) {
  if (dryRun) {
    log.info(`[dry-run] 将移除: ${dest}`);
    return true;
  }
  const result = removeSymlinkSafe(dest, expectedSource);
  if (result === 'removed') {
    log.success(label);
    return true;
  } else if (result === 'foreign') {
    log.skip(`${label}（指向其他来源，跳过）`);
  }
  return false;
}

function runUninstall(target, opts) {
  const { dryRun } = opts;
  let removed = 0;

  const skills = discoverSkills();
  const rules = discoverSharedRules();
  const targets = resolveTargets(target);

  for (const t of targets) {
    log.heading(`移除 ${t.label} Skills`);
    for (const skill of skills) {
      if (remove(join(t.dir, skill.name), skill.path, `${t.label} Skill: ${skill.name}`, dryRun)) removed++;
    }

    log.heading(`移除 ${t.label} 共享规则`);
    for (const rule of rules) {
      if (remove(join(t.dir, '_team-rules', rule.name), rule.path, `${t.label} Rule: ${rule.name}`, dryRun)) removed++;
    }
    if (!dryRun) rmdirIfEmpty(join(t.dir, '_team-rules'));
  }

  log.done(`卸载完成${dryRun ? ' (dry-run)' : ''}，共移除 ${removed} 个软链接。`);
  if (!dryRun) console.log('本仓库源文件未受影响。');
}
