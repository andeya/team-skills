import { join } from 'node:path';
import { existsSync, readdirSync, rmSync, copyFileSync } from 'node:fs';
import { createSymlinkSafe, ensureDir, isSymlink, copyRecursive } from './fs-utils.js';
import { PROJECT_IDE_DIRS } from './constants.js';
import * as log from './logger.js';

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

  const verify = (label, dest) => {
    if (isSymlink(dest)) {
      log.success(label);
    } else {
      log.error(`${label} 未正确安装`);
      errors++;
    }
  };

  for (const t of targets) {
    for (const skill of skills) {
      verify(`${t.label} Skill: ${skill.name}`, join(t.dir, skill.name));
    }
    for (const rule of rules) {
      verify(`${t.label} Rule: ${rule.name}`, join(t.dir, '_team-rules', rule.name));
    }
  }

  return errors;
}

export function installSkillsProject(projectDir, ides, skills, rules, { dryRun, verb = '复制' }) {
  const tag = dryRun ? '[dry-run] ' : '';
  let count = 0;

  for (const ideName of ides) {
    const ideSubdir = PROJECT_IDE_DIRS[ideName];
    if (!ideSubdir) continue;

    const skillsDst = join(projectDir, ideSubdir, 'skills');
    log.heading(`${verb} → ${skillsDst}`);

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

    const rulesDst = join(skillsDst, '_team-rules');
    if (!dryRun) ensureDir(rulesDst);
    for (const r of rules) {
      if (!dryRun) copyFileSync(r.path, join(rulesDst, r.name));
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
