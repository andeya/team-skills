import { join, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { PACKAGE_ROOT, GLOBAL_TARGETS, PROJECT_IDE_DIRS } from '../lib/constants.js';
import { discoverSkills, discoverSharedRules } from '../lib/inventory.js';
import { detectIDE } from '../lib/detect-ide.js';
import {
  installSkillsGlobal, verifyGlobalSymlinks,
  installSkillsProject, cleanStaleSkills,
} from '../lib/installers.js';
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

function runUpdate(dir, opts) {
  dir = resolve(dir);
  const { ide, withScore, skipSelf, dryRun } = opts;

  if (!skipSelf) upgradeSelf(dryRun);

  const allSkills = discoverSkills(PACKAGE_ROOT);
  const rules = discoverSharedRules();
  const allSkillNames = new Set(allSkills.map(s => s.name));

  log.heading('更新全局 Skills');
  for (const t of GLOBAL_TARGETS) {
    cleanStaleSkills(t.dir, allSkillNames, { dryRun });
  }
  let count = installSkillsGlobal(GLOBAL_TARGETS, allSkills, rules, { dryRun, verb: '更新' });

  if (!dryRun) {
    const errors = verifyGlobalSymlinks(GLOBAL_TARGETS, allSkills, rules);
    if (errors > 0) {
      log.error(`有 ${errors} 个全局组件安装异常，请检查。`);
    }
  }

  const ides = detectIDE(dir, ide);
  if (ides.length === 0) {
    log.info('当前项目未检测到 IDE 配置（.claude/ 或 .cursor/），跳过项目更新。');
    log.done(`更新完成${dryRun ? ' (dry-run)' : ''}！共 ${count} 个组件。`);
    return;
  }

  const exclude = withScore ? [] : ['team-score'];
  const projectSkills = discoverSkills(PACKAGE_ROOT, { exclude });
  const projectSkillNames = new Set(projectSkills.map(s => s.name));

  log.heading('更新项目中的 team-skills');
  log.info(`项目目录: ${dir}`);
  log.info(`目标 IDE: ${ides.join(', ')}`);

  for (const ideName of ides) {
    const skillsDst = join(dir, PROJECT_IDE_DIRS[ideName], 'skills');
    cleanStaleSkills(skillsDst, projectSkillNames, { dryRun, exclude });
  }

  count += installSkillsProject(dir, ides, projectSkills, rules, { dryRun, verb: '更新' });

  log.done(`更新完成${dryRun ? ' (dry-run)' : ''}！共 ${count} 个组件。`);
}
