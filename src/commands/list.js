import { join } from 'node:path';
import { existsSync, readlinkSync } from 'node:fs';
import {
  DEFAULT_SKILLS_TARGET, DEFAULT_COMMANDS_TARGET,
  CURSOR_HOOKS_DIR, CLAUDE_HOOKS_DIR, LOCAL_INSTALL_DIR,
} from '../lib/constants.js';
import { discoverSkills, discoverSharedRules, discoverCommands, discoverHooks } from '../lib/inventory.js';
import { isSymlink } from '../lib/fs-utils.js';
import { readManifest } from '../lib/manifest.js';
import * as log from '../lib/logger.js';

export function registerList(program) {
  program
    .command('list')
    .description('List installed skills and their status')
    .option('--target <dir>', 'Check a specific target directory', DEFAULT_SKILLS_TARGET)
    .option('--json', 'Output as JSON')
    .action(runList);
}

function runList(opts) {
  const { target, json } = opts;
  const results = { skills: [], rules: [], commands: [], hooks: [], localInit: null };

  // Check symlink-based install
  const skills = discoverSkills();
  for (const skill of skills) {
    const dest = join(target, skill.name);
    results.skills.push({
      name: skill.name,
      type: 'symlink',
      status: getStatus(dest, skill.path),
      path: dest,
    });
  }

  // Shared rules
  for (const rule of discoverSharedRules()) {
    const dest = join(target, '_team-rules', rule.name);
    results.rules.push({
      name: rule.name,
      status: getStatus(dest, rule.path),
      path: dest,
    });
  }

  // Commands
  for (const cmd of discoverCommands()) {
    const dest = join(DEFAULT_COMMANDS_TARGET, cmd.filename);
    results.commands.push({
      name: cmd.name,
      status: getStatus(dest, cmd.path),
      path: dest,
    });
  }

  // Hooks
  for (const dir of [CURSOR_HOOKS_DIR, CLAUDE_HOOKS_DIR]) {
    const platform = dir.includes('.cursor') ? 'Cursor' : 'Claude Code';
    for (const hook of discoverHooks()) {
      const dest = join(dir, hook.name);
      results.hooks.push({
        name: `${platform}/${hook.name}`,
        status: getStatus(dest, hook.path),
        path: dest,
      });
    }
  }

  // Check for local init
  const localManifest = readManifest(LOCAL_INSTALL_DIR);
  if (localManifest) {
    results.localInit = {
      version: localManifest.version,
      installedAt: localManifest.installedAt,
      sourceCommit: localManifest.sourceCommit,
      fileCount: Object.keys(localManifest.files).length,
    };
  }

  if (json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // Pretty print
  log.heading('Agent Skills');
  printTable(results.skills);

  log.heading('共享规则');
  printTable(results.rules);

  log.heading('Claude Code 命令');
  printTable(results.commands);

  log.heading('Hooks');
  printTable(results.hooks);

  if (results.localInit) {
    log.heading('项目内安装 (.team-skills/)');
    log.info(`版本: ${results.localInit.version}`);
    log.info(`安装时间: ${results.localInit.installedAt}`);
    log.info(`来源 commit: ${results.localInit.sourceCommit}`);
    log.info(`文件数: ${results.localInit.fileCount}`);
  }

  // Summary
  const installed = results.skills.filter(s => s.status === 'ok').length;
  const total = results.skills.length;
  console.log(`\nSkills: ${installed}/${total} 已安装`);
}

function getStatus(dest, expectedSource) {
  if (!existsSync(dest) && !isSymlink(dest)) return 'missing';
  if (isSymlink(dest)) {
    try {
      const actual = readlinkSync(dest);
      if (actual === expectedSource) return 'ok';
      return 'foreign';
    } catch {
      return 'broken';
    }
  }
  return 'file';
}

function printTable(items) {
  if (items.length === 0) {
    log.skip('（无）');
    return;
  }

  const maxName = Math.max(...items.map(i => i.name.length), 4);
  for (const item of items) {
    const name = item.name.padEnd(maxName);
    const icon = statusIcon(item.status);
    console.log(`  ${icon} ${name}  ${item.path}`);
  }
}

function statusIcon(status) {
  switch (status) {
    case 'ok': return '\x1b[32m✓\x1b[0m';
    case 'missing': return '\x1b[90m✗\x1b[0m';
    case 'broken': return '\x1b[31m!\x1b[0m';
    case 'foreign': return '\x1b[33m?\x1b[0m';
    case 'file': return '\x1b[36m◆\x1b[0m';
    default: return ' ';
  }
}
