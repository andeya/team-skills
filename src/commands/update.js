import { join, resolve } from 'node:path';
import { existsSync, copyFileSync as fsCopyFile, rmSync, readdirSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { PACKAGE_ROOT } from '../lib/constants.js';
import { discoverSkills, discoverSharedRules, discoverCommands } from '../lib/inventory.js';
import { copyRecursive, ensureDir } from '../lib/fs-utils.js';
import { detectIDE } from '../lib/detect-ide.js';
import * as log from '../lib/logger.js';

export function registerUpdate(program) {
  program
    .command('update')
    .description('Upgrade team-skills package and update project installations')
    .argument('[dir]', 'Project directory', '.')
    .option('--ide <type>', 'Force IDE type: claude, cursor, or both')
    .option('--with-score', 'Include team-score skill (hidden by default)', false)
    .option('--skip-self', 'Skip self-upgrade, only update project', false)
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

function cleanStaleSkills(targetDir, currentNames, dryRun) {
  if (!existsSync(targetDir)) return;
  const existing = readdirSync(targetDir).filter(
    name => !name.startsWith('_') && name !== 'CLAUDE.md' && name.startsWith('team-'),
  );
  for (const name of existing) {
    if (!currentNames.has(name)) {
      const tag = dryRun ? '[dry-run] ' : '';
      if (!dryRun) rmSync(join(targetDir, name), { recursive: true });
      log.warn(`${tag}移除旧 Skill: ${name}`);
    }
  }
}

function cleanStaleCommands(cmdDir, currentNames, dryRun) {
  if (!existsSync(cmdDir)) return;
  const existing = readdirSync(cmdDir).filter(
    name => name.startsWith('team-') && name.endsWith('.md'),
  );
  for (const name of existing) {
    const skillName = name.slice(0, -3);
    if (!currentNames.has(skillName)) {
      const tag = dryRun ? '[dry-run] ' : '';
      if (!dryRun) rmSync(join(cmdDir, name));
      log.warn(`${tag}移除旧命令: ${name}`);
    }
  }
}

function runUpdate(dir, opts) {
  dir = resolve(dir);
  const { ide, withScore, skipSelf, dryRun } = opts;

  if (!skipSelf) upgradeSelf(dryRun);

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

  const skills = discoverSkills(PACKAGE_ROOT, { exclude });
  const rules = discoverSharedRules();
  const cmds = discoverCommands();
  const currentSkillNames = new Set(skills.map(s => s.name));
  const currentCmdNames = new Set(cmds.map(c => c.name));

  // Cursor: skills → .cursor/skills/
  if (ides.includes('cursor')) {
    const skillsDst = join(dir, '.cursor', 'skills');
    log.heading(`更新 Skills → ${skillsDst}`);

    cleanStaleSkills(skillsDst, currentSkillNames, dryRun);

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
      if (!dryRun) fsCopyFile(r.path, join(rulesDst, r.name));
      log.success(`${tag}Rule: ${r.name}`);
      count++;
    }
  }

  // Claude Code: skills as commands + CLI helpers → .claude/commands/
  if (ides.includes('claude')) {
    const cmdsDst = join(dir, '.claude', 'commands');
    log.heading(`更新 Commands → ${cmdsDst}`);

    cleanStaleCommands(cmdsDst, new Set([...currentSkillNames, ...currentCmdNames]), dryRun);

    if (!dryRun) ensureDir(cmdsDst);

    // Each skill's SKILL.md becomes a slash command
    for (const skill of skills) {
      const src = join(skill.path, 'SKILL.md');
      const dest = join(cmdsDst, `${skill.name}.md`);
      if (!dryRun) fsCopyFile(src, dest);
      log.success(`${tag}/${skill.name}`);
      count++;
    }

    // CLI helper commands
    for (const c of cmds) {
      if (!dryRun) fsCopyFile(c.path, join(cmdsDst, c.filename));
      log.success(`${tag}Command: ${c.filename}`);
      count++;
    }
  }

  log.done(`更新完成${dryRun ? ' (dry-run)' : ''}！共 ${count} 个组件。`);
}
