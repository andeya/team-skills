import { join } from 'node:path';
import {
  PACKAGE_ROOT, DEFAULT_SKILLS_TARGET, DEFAULT_CLAUDE_SKILLS_TARGET,
  CURSOR_HOOKS_DIR, CLAUDE_HOOKS_DIR,
} from '../lib/constants.js';
import { discoverSkills, discoverSharedRules, discoverHooks } from '../lib/inventory.js';
import { createSymlinkSafe, ensureDir, isSymlink } from '../lib/fs-utils.js';
import * as log from '../lib/logger.js';

export function registerSetup(program) {
  program
    .command('setup')
    .description('Install skills via symlinks to global directories')
    .argument('[target]', 'Target skills directory', DEFAULT_SKILLS_TARGET)
    .option('--no-hooks', 'Skip hook installation')
    .option('--with-score', 'Include team-score skill (hidden by default)', false)
    .option('--force', 'Overwrite existing symlinks', false)
    .option('--dry-run', 'Show what would be done without doing it', false)
    .action(runSetup);
}

function runSetup(target, opts) {
  const { hooks, withScore, force, dryRun } = opts;
  const tag = dryRun ? '[dry-run] ' : '';
  const exclude = withScore ? [] : ['team-score'];
  let count = 0;

  // Skills → ~/.agents/skills/ (Cursor auto-discovers from here)
  log.heading('安装 Skills → Cursor');
  const skills = discoverSkills(PACKAGE_ROOT, { exclude });
  for (const skill of skills) {
    const dest = join(target, skill.name);
    const result = createSymlinkSafe(skill.path, dest, { force, dryRun });
    logResult(`${tag}Skill: ${skill.name}`, result, dest);
    if (result === 'created' || result === 'dry-run') count++;
  }

  // Shared rules → ~/.agents/skills/_team-rules/
  log.heading('安装共享规则');
  const rules = discoverSharedRules();
  const rulesTarget = join(target, '_team-rules');
  if (!dryRun) ensureDir(rulesTarget);
  for (const rule of rules) {
    const dest = join(rulesTarget, rule.name);
    const result = createSymlinkSafe(rule.path, dest, { force, dryRun });
    logResult(`${tag}Rule: ${rule.name}`, result, dest);
    if (result === 'created' || result === 'dry-run') count++;
  }

  // Skills → ~/.claude/skills/ (Claude Code auto-discovers from here)
  log.heading('安装 Skills → Claude Code');
  const claudeSkillsTarget = DEFAULT_CLAUDE_SKILLS_TARGET;
  if (!dryRun) ensureDir(claudeSkillsTarget);
  for (const skill of skills) {
    const dest = join(claudeSkillsTarget, skill.name);
    const result = createSymlinkSafe(skill.path, dest, { force, dryRun });
    logResult(`${tag}Skill: ${skill.name}`, result, dest);
    if (result === 'created' || result === 'dry-run') count++;
  }

  // Shared rules → ~/.claude/skills/_team-rules/
  log.heading('安装 Claude Code 共享规则');
  const claudeRulesTarget = join(claudeSkillsTarget, '_team-rules');
  if (!dryRun) ensureDir(claudeRulesTarget);
  for (const rule of rules) {
    const dest = join(claudeRulesTarget, rule.name);
    const result = createSymlinkSafe(rule.path, dest, { force, dryRun });
    logResult(`${tag}Rule: ${rule.name}`, result, dest);
    if (result === 'created' || result === 'dry-run') count++;
  }

  if (hooks !== false) {
    log.heading('安装 Hooks');
    const hookFiles = discoverHooks();
    for (const hook of hookFiles) {
      // hooks.json is Cursor-specific, session-start works for both
      const dirs = hook.name === 'hooks.json'
        ? [CURSOR_HOOKS_DIR]
        : [CURSOR_HOOKS_DIR, CLAUDE_HOOKS_DIR];
      for (const dir of dirs) {
        const platform = dir.includes('.cursor') ? 'Cursor' : 'Claude Code';
        if (!dryRun) ensureDir(dir);
        const dest = join(dir, hook.name);
        const result = createSymlinkSafe(hook.path, dest, { force, dryRun });
        logResult(`${tag}${platform} ${hook.name}`, result, dest);
        if (result === 'created' || result === 'dry-run') count++;
      }
    }
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
    for (const skill of skills) {
      verify(`Cursor Skill: ${skill.name}`, join(target, skill.name));
      verify(`Claude Skill: ${skill.name}`, join(claudeSkillsTarget, skill.name));
    }
    for (const rule of rules) verify(`Rule: ${rule.name}`, join(rulesTarget, rule.name));
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
