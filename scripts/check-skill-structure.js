#!/usr/bin/env node

/**
 * Verify Skill structure: SKILL.md existence, required sections, shared rules.
 * Used by both `npm run lint` and CI.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const root = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();

const REQUIRED_SECTIONS = [
  ['角色定位'],
  ['系统提示词'],
  ['推理指引', '路由推理'],
  ['Iron Law'],
  ['执行步骤'],
  ['自检门禁'],
  ['完成标志'],
  ['STOP Signals'],
];

const SHARED_RULES = [
  'constitutional-rules.md',
  'verification-protocol.md',
  'four-state-protocol.md',
  'first-principles.md',
];

let failed = false;

// 1. Discover skill directories
const skillDirs = [];
const skillsPath = join(root, 'skills');
for (const name of readdirSync(skillsPath)) {
  if (name.startsWith('_') || name === 'CLAUDE.md') continue;
  const dir = join(skillsPath, name);
  try {
    if (!readdirSync(dir)) continue;
  } catch { continue; }
  skillDirs.push({ name, dir });
}

// 2. Check SKILL.md existence
for (const { name, dir } of skillDirs) {
  const skillFile = join(dir, 'SKILL.md');
  if (!existsSync(skillFile)) {
    console.error(`❌ ${name}: missing SKILL.md`);
    failed = true;
  }
}

// 3. Check required sections
for (const { name, dir } of skillDirs) {
  const skillFile = join(dir, 'SKILL.md');
  if (!existsSync(skillFile)) continue;

  const content = readFileSync(skillFile, 'utf8');

  for (const alternatives of REQUIRED_SECTIONS) {
    const found = alternatives.some(alt => {
      const pattern = new RegExp(`^#{2,3} ${alt}`, 'm');
      return pattern.test(content);
    });

    if (!found) {
      const label = alternatives.join('|');
      console.error(`❌ ${name}: missing section '${label}'`);
      failed = true;
    }
  }
}

// 4. Check shared rules
for (const file of SHARED_RULES) {
  const p = join(root, 'skills', '_team-rules', file);
  if (!existsSync(p)) {
    console.error(`❌ Missing _team-rules/${file}`);
    failed = true;
  }
}

if (failed) {
  console.error('\nSkill structure check failed.');
  process.exit(1);
}

console.log('✅ All skill structure checks passed.');
