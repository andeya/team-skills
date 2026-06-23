import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import {
  PACKAGE_ROOT, DEFAULT_SKILLS_TARGET, DEFAULT_COMMANDS_TARGET,
  CURSOR_HOOKS_DIR, CLAUDE_HOOKS_DIR,
} from '../lib/constants.js';
import { discoverSkills, discoverSharedRules, discoverCommands, discoverHooks, discoverCursorRules } from '../lib/inventory.js';
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

function runUninstall(target, opts) {
  const { hooks, commands, dryRun } = opts;
  let removed = 0;

  log.heading('移除 Agent Skills');
  for (const skill of discoverSkills()) {
    const dest = join(target, skill.name);
    if (dryRun) {
      log.info(`[dry-run] 将移除: ${dest}`);
      removed++;
      continue;
    }
    const result = removeSymlinkSafe(dest, skill.path);
    if (result === 'removed') {
      log.success(`Skill: ${skill.name}`);
      removed++;
    } else if (result === 'foreign') {
      log.skip(`${skill.name}（指向其他来源，跳过）`);
    }
  }

  log.heading('移除共享规则');
  for (const rule of discoverSharedRules()) {
    const dest = join(target, '_team-rules', rule.name);
    if (dryRun) {
      log.info(`[dry-run] 将移除: ${dest}`);
      removed++;
      continue;
    }
    const result = removeSymlinkSafe(dest, rule.path);
    if (result === 'removed') {
      log.success(`Rule: ${rule.name}`);
      removed++;
    }
  }
  if (!dryRun) rmdirIfEmpty(join(target, '_team-rules'));

  if (commands !== false) {
    log.heading('移除 Command Skills + Claude Code 命令');
    for (const cmd of discoverCommands()) {
      // Command Skill directory
      const skillDest = join(target, cmd.name, 'SKILL.md');
      if (!dryRun) {
        const result = removeSymlinkSafe(skillDest, cmd.path);
        if (result === 'removed') {
          log.success(`Command Skill: ${cmd.name}`);
          removed++;
          rmdirIfEmpty(join(target, cmd.name));
        }
      } else {
        log.info(`[dry-run] 将移除: ${skillDest}`);
        removed++;
      }

      // Claude Code command
      const cmdDest = join(DEFAULT_COMMANDS_TARGET, cmd.filename);
      if (!dryRun) {
        const result = removeSymlinkSafe(cmdDest, cmd.path);
        if (result === 'removed') {
          log.success(`Claude Command: ${cmd.filename}`);
          removed++;
        }
      } else {
        log.info(`[dry-run] 将移除: ${cmdDest}`);
        removed++;
      }
    }
  }

  if (hooks !== false) {
    log.heading('移除 Hooks');
    const hookFiles = discoverHooks();
    for (const dir of [CURSOR_HOOKS_DIR, CLAUDE_HOOKS_DIR]) {
      for (const hook of hookFiles) {
        const dest = join(dir, hook.name);
        if (!dryRun) {
          const result = removeSymlinkSafe(dest, hook.path);
          if (result === 'removed') {
            log.success(`Hook: ${dest}`);
            removed++;
          }
        } else {
          log.info(`[dry-run] 将移除: ${dest}`);
          removed++;
        }
      }
    }
  }

  log.heading('移除 Cursor Rules');
  const cursorRulesDir = join(homedir(), '.cursor', 'rules');
  for (const rule of discoverCursorRules()) {
    const dest = join(cursorRulesDir, rule.name);
    if (!dryRun) {
      const result = removeSymlinkSafe(dest, rule.path);
      if (result === 'removed') {
        log.success(`Cursor Rule: ${rule.name}`);
        removed++;
      }
    } else {
      log.info(`[dry-run] 将移除: ${dest}`);
      removed++;
    }
  }

  log.done(`卸载完成${dryRun ? ' (dry-run)' : ''}，共移除 ${removed} 个软链接。`);
  if (!dryRun) console.log('本仓库源文件未受影响。');
}
