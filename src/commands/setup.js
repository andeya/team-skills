import { PACKAGE_ROOT, DEFAULT_SKILLS_TARGET, resolveTargets } from '../lib/constants.js';
import { discoverSkills, discoverSharedRules } from '../lib/inventory.js';
import { installSkillsGlobal, verifyGlobalSymlinks } from '../lib/installers.js';
import * as log from '../lib/logger.js';

export function registerSetup(program) {
  program
    .command('setup')
    .description('Install skills via symlinks to global directories')
    .argument('[target]', 'Target skills directory', DEFAULT_SKILLS_TARGET)
    .option('--dry-run', 'Show what would be done without doing it', false)
    .action(runSetup);
}

function runSetup(target, opts) {
  const { dryRun } = opts;
  const skills = discoverSkills(PACKAGE_ROOT);
  const rules = discoverSharedRules();
  const targets = resolveTargets(target);

  const count = installSkillsGlobal(targets, skills, rules, { dryRun });

  if (!dryRun) {
    const errors = verifyGlobalSymlinks(targets, skills, rules);
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
