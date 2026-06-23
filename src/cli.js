import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { registerSetup } from './commands/setup.js';
import { registerUninstall } from './commands/uninstall.js';
import { registerInit } from './commands/init.js';
import { registerUpdate } from './commands/update.js';
import { registerList } from './commands/list.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const program = new Command();

program
  .name('team-skills')
  .description('AI Agent Skills framework — install, manage, and update team skills')
  .version(pkg.version);

registerSetup(program);
registerUninstall(program);
registerInit(program);
registerUpdate(program);
registerList(program);

program.parse();
