import { join } from 'node:path';
import { existsSync, readdirSync, rmSync, copyFileSync, realpathSync } from 'node:fs';
import { createSymlinkSafe, ensureDir, isSymlink, copyRecursive } from './fs-utils.js';
import { GLOBAL_TARGETS, PROJECT_IDE_DIRS } from './constants.js';
import * as log from './logger.js';

const globalDirSet = new Set(GLOBAL_TARGETS.map(t => t.dir));

export function isGlobalTarget(dir) {
  return globalDirSet.has(dir);
}

export function logInstallResult(label, result) {
  switch (result) {
    case 'created':
    case 'dry-run':
      log.success(label);
      break;
    case 'exists':
      log.skip(`${label}（已存在，跳过）`);
      break;
    default:
      log.info(label);
  }
}

export function installSkillsGlobal(targets, skills, rules, { dryRun, verb = '安装' }) {
  const tag = dryRun ? '[dry-run] ' : '';
  let count = 0;
  const currentRuleNames = new Set(rules.map(r => r.name));

  for (const t of targets) {
    log.heading(`${verb} → ${t.label}`);
    if (!dryRun) ensureDir(t.dir);

    for (const skill of skills) {
      const dest = join(t.dir, skill.name);
      const result = createSymlinkSafe(skill.path, dest, { force: true, dryRun });
      logInstallResult(`${tag}Skill: ${skill.name}`, result);
      if (result === 'created' || result === 'dry-run') count++;
    }

    const rulesDir = join(t.dir, '_team-rules');
    cleanStaleRules(t.dir, currentRuleNames, { dryRun });
    if (!dryRun) ensureDir(rulesDir);
    for (const rule of rules) {
      const dest = join(rulesDir, rule.name);
      const result = createSymlinkSafe(rule.path, dest, { force: true, dryRun });
      logInstallResult(`${tag}Rule: ${rule.name}`, result);
      if (result === 'created' || result === 'dry-run') count++;
    }
  }

  return count;
}

export function verifyGlobalSymlinks(targets, skills, rules) {
  log.heading('验证安装');
  let errors = 0;

  for (const t of targets) {
    for (const skill of skills) {
      const dest = join(t.dir, skill.name);
      const label = `${t.label} Skill: ${skill.name}`;
      if (isSymlink(dest)) {
        log.success(label);
      } else if (existsSync(dest)) {
        try {
          if (realpathSync(dest) === realpathSync(skill.path)) {
            log.skip(`${label}（已存在，跳过）`);
            continue;
          }
        } catch { /* 忽略解析失败 */ }
        log.error(`${label} 未正确安装`);
        errors++;
      } else {
        log.error(`${label} 未正确安装`);
        errors++;
      }
    }
    for (const rule of rules) {
      const dest = join(t.dir, '_team-rules', rule.name);
      const label = `${t.label} Rule: ${rule.name}`;
      if (isSymlink(dest)) {
        log.success(label);
      } else if (existsSync(dest)) {
        try {
          if (realpathSync(dest) === realpathSync(rule.path)) {
            log.skip(`${label}（已存在，跳过）`);
            continue;
          }
        } catch { /* 忽略解析失败 */ }
        log.error(`${label} 未正确安装`);
        errors++;
      } else {
        log.error(`${label} 未正确安装`);
        errors++;
      }
    }
  }

  return errors;
}

export function installSkillsProject(projectDir, ides, skills, rules, { dryRun, verb = '复制' }) {
  const tag = dryRun ? '[dry-run] ' : '';
  let count = 0;
  const currentRuleNames = new Set(rules.map(r => r.name));

  for (const ideName of ides) {
    const ideSubdir = PROJECT_IDE_DIRS[ideName];
    if (!ideSubdir) continue;

    const skillsDst = join(projectDir, ideSubdir, 'skills');

    if (globalDirSet.has(skillsDst)) {
      log.skip(`${skillsDst} 与全局路径重叠，保留 symlinks，跳过复制`);
      continue;
    }

    log.heading(`${verb} → ${skillsDst}`);

    if (!dryRun) ensureDir(skillsDst);
    for (const skill of skills) {
      const dest = join(skillsDst, skill.name);
      if (!dryRun) {
        // 如果目标就是源文件本身，跳过删除+复制（否则删了就复制不了）
        if (existsSync(dest)) {
          try {
            if (realpathSync(dest) === realpathSync(skill.path)) {
              log.skip(`${tag}Skill: ${skill.name}（自身，跳过）`);
              continue;
            }
          } catch { /* 忽略解析失败 */ }
          rmSync(dest, { recursive: true });
        }
        copyRecursive(skill.path, dest);
      }
      log.success(`${tag}Skill: ${skill.name}`);
      count++;
    }

    const rulesDst = join(skillsDst, '_team-rules');
    if (!dryRun) ensureDir(rulesDst);
    cleanStaleRules(skillsDst, currentRuleNames, { dryRun });
    for (const r of rules) {
      if (!dryRun) {
        const ruleDest = join(rulesDst, r.name);
        // 如果目标就是源文件本身，跳过复制
        if (existsSync(ruleDest)) {
          try {
            if (realpathSync(ruleDest) === realpathSync(r.path)) {
              log.skip(`${tag}Rule: ${r.name}（自身，跳过）`);
              continue;
            }
          } catch { /* 忽略解析失败 */ }
        }
        copyFileSync(r.path, ruleDest);
      }
      log.success(`${tag}Rule: ${r.name}`);
      count++;
    }
  }

  return count;
}

export function cleanStaleSkills(targetDir, currentNames, { dryRun, exclude = [] }) {
  if (!existsSync(targetDir)) return;
  const existing = readdirSync(targetDir).filter(
    name => !name.startsWith('_') && name !== 'CLAUDE.md' && name.startsWith('team-'),
  );
  for (const name of existing) {
    if (!currentNames.has(name) && !exclude.includes(name)) {
      const tag = dryRun ? '[dry-run] ' : '';
      if (!dryRun) rmSync(join(targetDir, name), { recursive: true });
      log.warn(`${tag}移除旧 Skill: ${name}`);
    }
  }
}

export function cleanStaleRules(targetDir, currentRuleNames, { dryRun }) {
  const rulesDir = join(targetDir, '_team-rules');
  if (!existsSync(rulesDir)) return;
  const existing = readdirSync(rulesDir).filter(name => name.endsWith('.md'));
  for (const name of existing) {
    if (!currentRuleNames.has(name)) {
      const tag = dryRun ? '[dry-run] ' : '';
      if (!dryRun) rmSync(join(rulesDir, name), { recursive: true });
      log.warn(`${tag}移除旧规则: ${name}`);
    }
  }
}
