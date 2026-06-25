import { resolve } from 'node:path';
import { PACKAGE_ROOT } from '../lib/constants.js';
import { discoverSkills, discoverSharedRules } from '../lib/inventory.js';
import { detectIDE } from '../lib/detect-ide.js';
import { installSkillsProject } from '../lib/installers.js';
import * as log from '../lib/logger.js';

export function registerInit(program) {
  program
    .command('init')
    .description('Copy skills into current project for the detected IDE(s)')
    .argument('[dir]', 'Project directory', '.')
    .option('--ide <type>', 'Force IDE type: claude, cursor, or both')
    .option('--with-score', 'Include team-score skill (hidden by default)', false)
    .option('--dry-run', 'Show what would be copied', false)
    .action(runInit);
}

function runInit(dir, opts) {
  dir = resolve(dir);
  const { ide, withScore, dryRun } = opts;
  const exclude = withScore ? [] : ['team-score'];
  const ides = detectIDE(dir, ide, { strict: true });

  log.heading('初始化 team-skills 到项目');
  log.info(`项目目录: ${dir}`);
  log.info(`目标 IDE: ${ides.join(', ')}`);

  const skills = discoverSkills(PACKAGE_ROOT, { exclude });
  const rules = discoverSharedRules();
  const count = installSkillsProject(dir, ides, skills, rules, { dryRun });

  log.done(`初始化完成${dryRun ? ' (dry-run)' : ''}！共 ${count} 个组件。`);
}
