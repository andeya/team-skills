import { join, resolve } from 'node:path';
import { existsSync, copyFileSync as fsCopyFile, rmSync, readdirSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import {
  PACKAGE_ROOT, DEFAULT_SKILLS_TARGET, DEFAULT_CLAUDE_SKILLS_TARGET,
} from '../lib/constants.js';
import { discoverSkills, discoverSharedRules } from '../lib/inventory.js';
import { copyRecursive, ensureDir, createSymlinkSafe, isSymlink } from '../lib/fs-utils.js';
import { detectIDE } from '../lib/detect-ide.js';
import * as log from '../lib/logger.js';

export function registerUpdate(program) {
  program
    .command('update')
    .description('Upgrade team-skills package and update global & project installations')
    .argument('[dir]', 'Project directory', '.')
    .option('--ide <type>', 'Force IDE type: claude, cursor, or both')
    .option('--with-score', 'Include team-score skill in project (hidden by default)', false)
    .option('--skip-self', 'Skip self-upgrade, only update installations', false)
    .option('--dry-run', 'Show what would change', false)
    .action(runUpdate);
}

function upgradeSelf(dryRun) {
  log.heading('升级 team-skills 包');
  try {
    const current = execSync(
      'npm view team-skills version --registry https://registry.npmjs.org 2>/dev/null',
      { encoding: 'utf8' },
    ).trim();
    const local = JSON.parse(
      readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8'),
    ).version;
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

function cleanStaleSkills(targetDir, currentNames, dryRun, exclude = []) {
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

function runUpdate(dir, opts) {
  dir = resolve(dir);
  const { ide, withScore, skipSelf, dryRun } = opts;

  if (!skipSelf) upgradeSelf(dryRun);

  const exclude = withScore ? [] : ['team-score'];
  const tag = dryRun ? '[dry-run] ' : '';
  let count = 0;

  // ── Global: always include team-score ──
  const allSkills = discoverSkills(PACKAGE_ROOT);
  const rules = discoverSharedRules();
  const allSkillNames = new Set(allSkills.map(s => s.name));

  log.heading('更新全局 Skills');

  // Cursor global: ~/.agents/skills/
  const cursorGlobal = DEFAULT_SKILLS_TARGET;
  log.heading(`更新 Skills → ${cursorGlobal}`);
  cleanStaleSkills(cursorGlobal, allSkillNames, dryRun);
  if (!dryRun) ensureDir(cursorGlobal);
  for (const skill of allSkills) {
    const dest = join(cursorGlobal, skill.name);
    const result = createSymlinkSafe(skill.path, dest, { force: true, dryRun });
    logGlobalResult(`${tag}Skill: ${skill.name}`, result);
    if (result === 'created' || result === 'dry-run') count++;
  }
  const cursorRulesDst = join(cursorGlobal, '_team-rules');
  if (!dryRun) ensureDir(cursorRulesDst);
  for (const r of rules) {
    const dest = join(cursorRulesDst, r.name);
    const result = createSymlinkSafe(r.path, dest, { force: true, dryRun });
    logGlobalResult(`${tag}Rule: ${r.name}`, result);
    if (result === 'created' || result === 'dry-run') count++;
  }

  // Claude Code global: ~/.claude/skills/
  const claudeGlobal = DEFAULT_CLAUDE_SKILLS_TARGET;
  log.heading(`更新 Skills → ${claudeGlobal}`);
  cleanStaleSkills(claudeGlobal, allSkillNames, dryRun);
  if (!dryRun) ensureDir(claudeGlobal);
  for (const skill of allSkills) {
    const dest = join(claudeGlobal, skill.name);
    const result = createSymlinkSafe(skill.path, dest, { force: true, dryRun });
    logGlobalResult(`${tag}Skill: ${skill.name}`, result);
    if (result === 'created' || result === 'dry-run') count++;
  }
  const claudeRulesDst = join(claudeGlobal, '_team-rules');
  if (!dryRun) ensureDir(claudeRulesDst);
  for (const r of rules) {
    const dest = join(claudeRulesDst, r.name);
    const result = createSymlinkSafe(r.path, dest, { force: true, dryRun });
    logGlobalResult(`${tag}Rule: ${r.name}`, result);
    if (result === 'created' || result === 'dry-run') count++;
  }

  // Verify global symlinks
  if (!dryRun) {
    log.heading('验证全局安装');
    let errors = 0;
    const verify = (label, dest) => {
      if (isSymlink(dest)) {
        log.success(label);
      } else {
        log.error(`${label} 未正确安装`);
        errors++;
      }
    };
    for (const skill of allSkills) {
      verify(`Cursor Skill: ${skill.name}`, join(cursorGlobal, skill.name));
      verify(`Claude Skill: ${skill.name}`, join(claudeGlobal, skill.name));
    }
    for (const r of rules) {
      verify(`Rule: ${r.name}`, join(cursorRulesDst, r.name));
      verify(`Claude Rule: ${r.name}`, join(claudeRulesDst, r.name));
    }
    if (errors > 0) {
      log.error(`有 ${errors} 个全局组件安装异常，请检查。`);
    }
  }

  // ── Project: respect --with-score ──
  const ides = detectIDE(dir, ide);

  if (ides.length === 0) {
    log.info('当前项目未检测到 IDE 配置（.claude/ 或 .cursor/），跳过项目更新。');
    log.done(`更新完成${dryRun ? ' (dry-run)' : ''}！共 ${count} 个组件。`);
    return;
  }

  const projectSkills = discoverSkills(PACKAGE_ROOT, { exclude });
  const projectSkillNames = new Set(projectSkills.map(s => s.name));

  log.heading('更新项目中的 team-skills');
  log.info(`项目目录: ${dir}`);
  log.info(`目标 IDE: ${ides.join(', ')}`);

  if (ides.includes('cursor')) {
    const skillsDst = join(dir, '.cursor', 'skills');
    log.heading(`更新 Skills → ${skillsDst}`);

    cleanStaleSkills(skillsDst, projectSkillNames, dryRun, exclude);

    if (!dryRun) ensureDir(skillsDst);
    for (const skill of projectSkills) {
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
      if (!dryRun) fsCopyFile(r.path, join(rulesDst, r.name));
      log.success(`${tag}Rule: ${r.name}`);
      count++;
    }
  }

  if (ides.includes('claude')) {
    const skillsDst = join(dir, '.claude', 'skills');
    log.heading(`更新 Skills → ${skillsDst}`);

    cleanStaleSkills(skillsDst, projectSkillNames, dryRun, exclude);

    if (!dryRun) ensureDir(skillsDst);
    for (const skill of projectSkills) {
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
      if (!dryRun) fsCopyFile(r.path, join(rulesDst, r.name));
      log.success(`${tag}Rule: ${r.name}`);
      count++;
    }
  }

  log.done(`更新完成${dryRun ? ' (dry-run)' : ''}！共 ${count} 个组件。`);
}

function logGlobalResult(label, result) {
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
