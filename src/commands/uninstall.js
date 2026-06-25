import { join } from 'node:path';
import {
  PACKAGE_ROOT, DEFAULT_SKILLS_TARGET, DEFAULT_COMMANDS_TARGET,
  DEFAULT_CLAUDE_SKILLS_TARGET,
  CURSOR_HOOKS_DIR, CLAUDE_HOOKS_DIR,
} from '../lib/constants.js';
import { discoverSkills, discoverSharedRules, discoverCommands, discoverHooks } from '../lib/inventory.js';
import { removeSymlinkSafe, rmdirIfEmpty } from '../lib/fs-utils.js';
import * as log from '../lib/logger.js';

export function registerUninstall(program) {
  program
    .command('uninstall')
    .description('Remove all team-skills symlinks')
    .argument('[target]', 'Target skills directory', DEFAULT_SKILLS_TARGET)
    .option('--no-hooks', 'Skip removing hooks')
    .option('--no-commands', 'Skip removing commands')
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
  const { hooks, commands, dryRun } = opts;
  let removed = 0;

  // Cursor Skills → ~/.agents/skills/
  log.heading('移除 Cursor Skills');
  const skills = discoverSkills();
  for (const skill of skills) {
    if (remove(join(target, skill.name), skill.path, `Skill: ${skill.name}`, dryRun)) removed++;
  }

  // Claude Code Skills → ~/.claude/skills/
  log.heading('移除 Claude Code Skills');
  const claudeSkillsTarget = DEFAULT_CLAUDE_SKILLS_TARGET;
  for (const skill of skills) {
    if (remove(join(claudeSkillsTarget, skill.name), skill.path, `Claude Skill: ${skill.name}`, dryRun)) removed++;
  }

  // Claude Code shared rules → ~/.claude/skills/_team-rules/
  log.heading('移除 Claude Code 共享规则');
  for (const rule of discoverSharedRules()) {
    if (remove(join(claudeSkillsTarget, '_team-rules', rule.name), rule.path, `Claude Rule: ${rule.name}`, dryRun)) removed++;
  }
  if (!dryRun) rmdirIfEmpty(join(claudeSkillsTarget, '_team-rules'));

  // Legacy: clean old ~/.claude/commands/ skill symlinks (backward compat)
  for (const skill of skills) {
    const legacyDest = join(DEFAULT_COMMANDS_TARGET, `${skill.name}.md`);
    const legacySource = join(skill.path, 'SKILL.md');
    if (remove(legacyDest, legacySource, `旧路径 ${skill.name}.md`, dryRun)) removed++;
  }

  // Shared rules
  log.heading('移除共享规则');
  for (const rule of discoverSharedRules()) {
    if (remove(join(target, '_team-rules', rule.name), rule.path, `Rule: ${rule.name}`, dryRun)) removed++;
  }
  if (!dryRun) rmdirIfEmpty(join(target, '_team-rules'));

  if (commands !== false) {
    log.heading('移除 CLI 辅助命令');
    for (const cmd of discoverCommands()) {
      // Cursor Skill directory
      const skillDest = join(target, cmd.name, 'SKILL.md');
      if (remove(skillDest, cmd.path, `Cursor Skill: ${cmd.name}`, dryRun)) {
        removed++;
        if (!dryRun) rmdirIfEmpty(join(target, cmd.name));
      }

      // Claude Code Skill directory
      const claudeSkillDest = join(claudeSkillsTarget, cmd.name, 'SKILL.md');
      if (remove(claudeSkillDest, cmd.path, `Claude Skill: ${cmd.name}`, dryRun)) {
        removed++;
        if (!dryRun) rmdirIfEmpty(join(claudeSkillsTarget, cmd.name));
      }

      // Legacy: old ~/.claude/commands/ path
      const legacyCmdDest = join(DEFAULT_COMMANDS_TARGET, cmd.filename);
      if (remove(legacyCmdDest, cmd.path, `旧路径 ${cmd.filename}`, dryRun)) removed++;
    }
  }

  if (hooks !== false) {
    log.heading('移除 Hooks');
    for (const hook of discoverHooks()) {
      const dirs = hook.name === 'hooks.json'
        ? [CURSOR_HOOKS_DIR]
        : [CURSOR_HOOKS_DIR, CLAUDE_HOOKS_DIR];
      for (const dir of dirs) {
        const dest = join(dir, hook.name);
        if (remove(dest, hook.path, `Hook: ${dest}`, dryRun)) removed++;
      }
    }
  }

  log.done(`卸载完成${dryRun ? ' (dry-run)' : ''}，共移除 ${removed} 个软链接。`);
  if (!dryRun) console.log('本仓库源文件未受影响。');
}
