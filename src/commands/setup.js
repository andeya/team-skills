import { join } from 'node:path';
import { homedir } from 'node:os';
import {
  PACKAGE_ROOT, DEFAULT_SKILLS_TARGET, DEFAULT_COMMANDS_TARGET,
  CURSOR_HOOKS_DIR, CLAUDE_HOOKS_DIR,
} from '../lib/constants.js';
import { discoverSkills, discoverSharedRules, discoverCommands, discoverHooks, discoverCursorRules } from '../lib/inventory.js';
import { createSymlinkSafe, ensureDir, isSymlink } from '../lib/fs-utils.js';
import * as log from '../lib/logger.js';

export function registerSetup(program) {
  program
    .command('setup')
    .description('Install skills via symlinks to global directories (developer mode)')
    .argument('[target]', 'Target skills directory', DEFAULT_SKILLS_TARGET)
    .option('--no-hooks', 'Skip hook installation')
    .option('--no-commands', 'Skip Claude Code command symlinks')
    .option('--with-score', 'Include team-score skill (hidden by default)', false)
    .option('--force', 'Overwrite existing symlinks', false)
    .option('--dry-run', 'Show what would be done without doing it', false)
    .action(runSetup);
}

function runSetup(target, opts) {
  const { hooks, commands, withScore, force, dryRun } = opts;
  const tag = dryRun ? '[dry-run] ' : '';
  const exclude = withScore ? [] : ['team-score'];
  let count = 0;

  log.heading('安装 Agent Skills');
  const skills = discoverSkills(PACKAGE_ROOT, { exclude });
  for (const skill of skills) {
    const dest = join(target, skill.name);
    const result = createSymlinkSafe(skill.path, dest, { force, dryRun });
    logResult(`${tag}Skill: ${skill.name}`, result, dest);
    if (result === 'created' || result === 'dry-run') count++;
  }

  log.heading('安装共享规则 (_team-rules)');
  const rules = discoverSharedRules();
  const rulesTarget = join(target, '_team-rules');
  if (!dryRun) ensureDir(rulesTarget);
  for (const rule of rules) {
    const dest = join(rulesTarget, rule.name);
    const result = createSymlinkSafe(rule.path, dest, { force, dryRun });
    logResult(`${tag}Rule: ${rule.name}`, result, dest);
    if (result === 'created' || result === 'dry-run') count++;
  }

  if (commands !== false) {
    log.heading('安装 Commands（Skill 形式 + Claude Code 斜杠命令）');
    const cmds = discoverCommands();
    for (const cmd of cmds) {
      // As Skill directory (for Cursor discovery)
      const skillDest = join(target, cmd.name);
      if (isSymlink(skillDest)) {
        log.skip(`Command Skill ${cmd.name} 跳过：已存在同名 Skill 目录`);
      } else {
        if (!dryRun) ensureDir(skillDest);
        const dest = join(skillDest, 'SKILL.md');
        const result = createSymlinkSafe(cmd.path, dest, { force, dryRun });
        logResult(`${tag}Command Skill: ${cmd.name}`, result, dest);
        if (result === 'created' || result === 'dry-run') count++;
      }

      // As Claude Code command
      const cmdDest = join(DEFAULT_COMMANDS_TARGET, cmd.filename);
      if (!dryRun) ensureDir(DEFAULT_COMMANDS_TARGET);
      const result = createSymlinkSafe(cmd.path, cmdDest, { force, dryRun });
      logResult(`${tag}Claude Command: ${cmd.filename}`, result, cmdDest);
      if (result === 'created' || result === 'dry-run') count++;
    }
  }

  if (hooks !== false) {
    log.heading('安装 Hooks');
    const hookFiles = discoverHooks();
    for (const dir of [CURSOR_HOOKS_DIR, CLAUDE_HOOKS_DIR]) {
      const platform = dir.includes('.cursor') ? 'Cursor' : 'Claude Code';
      if (!dryRun) ensureDir(dir);
      for (const hook of hookFiles) {
        const dest = join(dir, hook.name);
        const result = createSymlinkSafe(hook.path, dest, { force, dryRun });
        logResult(`${tag}${platform} ${hook.name}`, result, dest);
        if (result === 'created' || result === 'dry-run') count++;
      }
    }
  }

  // Cursor rules → ~/.cursor/rules/
  log.heading('安装 Cursor Rules');
  const cursorRules = discoverCursorRules();
  const cursorRulesDir = join(homedir(), '.cursor', 'rules');
  if (!dryRun) ensureDir(cursorRulesDir);
  for (const rule of cursorRules) {
    const dest = join(cursorRulesDir, rule.name);
    const result = createSymlinkSafe(rule.path, dest, { force, dryRun });
    logResult(`${tag}Cursor Rule: ${rule.name}`, result, dest);
    if (result === 'created' || result === 'dry-run') count++;
  }

  if (!dryRun) {
    log.heading('验证安装');
    let errors = 0;
    const verify = (label, dest) => {
      if (isSymlink(dest)) {
        log.success(label);
      } else {
        log.error(`${label} 未正确安装`);
        errors++;
      }
    };
    for (const skill of skills) verify(`Skill: ${skill.name}`, join(target, skill.name));
    for (const rule of rules) verify(`Rule: ${rule.name}`, join(rulesTarget, rule.name));
    if (commands !== false) {
      for (const cmd of discoverCommands()) {
        verify(`Command: ${cmd.filename}`, join(DEFAULT_COMMANDS_TARGET, cmd.filename));
      }
    }
    if (errors > 0) {
      log.error(`有 ${errors} 个组件安装异常，请检查。`);
      process.exit(1);
    }
  }

  log.done(`安装完成！${dryRun ? '(dry-run)' : `共处理 ${count} 个组件。`}`);
  if (!dryRun) {
    console.log('\n后续可通过 team-skills setup 重新安装，或 team-skills uninstall 卸载。');
  }
}

function logResult(label, result, dest) {
  switch (result) {
    case 'created':
    case 'dry-run':
      log.success(label);
      break;
    case 'exists':
      log.skip(`${label}（已存在，跳过）`);
      break;
    case 'conflict':
      log.warn(`${label}（已存在非 symlink，使用 --force 覆盖）`);
      break;
    default:
      log.info(label);
  }
}
