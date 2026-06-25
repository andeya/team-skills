import { join } from 'node:path';
import { existsSync, readlinkSync } from 'node:fs';
import {
  DEFAULT_SKILLS_TARGET,
  DEFAULT_CLAUDE_SKILLS_TARGET,
} from '../lib/constants.js';
import { discoverSkills, discoverSharedRules } from '../lib/inventory.js';
import { isSymlink } from '../lib/fs-utils.js';
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
  const results = { skills: [], rules: [], skillCommands: [] };

  // Check symlink-based install
  const skills = discoverSkills();
  for (const skill of skills) {
    const dest = join(target, skill.name);
    results.skills.push({
      name: skill.name,
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

  // Claude Code Skills
  const claudeSkillsTarget = DEFAULT_CLAUDE_SKILLS_TARGET;
  for (const skill of skills) {
    const dest = join(claudeSkillsTarget, skill.name);
    results.skillCommands.push({
      name: skill.name,
      status: getStatus(dest, skill.path),
      path: dest,
    });
  }

  // Claude Code shared rules
  for (const rule of discoverSharedRules()) {
    const claudeRuleDest = join(claudeSkillsTarget, '_team-rules', rule.name);
    results.rules.push({
      name: `Claude/${rule.name}`,
      status: getStatus(claudeRuleDest, rule.path),
      path: claudeRuleDest,
    });
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

  log.heading('Claude Code Skills');
  printTable(results.skillCommands);

  // Summary
  const installed = results.skills.filter(s => s.status === 'ok' || s.status === 'file').length;
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
