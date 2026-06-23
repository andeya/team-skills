import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { PACKAGE_ROOT, SKILLS_DIR, HOOKS_DIR, COMMANDS_DIR } from './constants.js';

export function discoverSkills(root = PACKAGE_ROOT, { exclude = [] } = {}) {
  const skillsDir = join(root, SKILLS_DIR);
  if (!existsSync(skillsDir)) return [];

  return readdirSync(skillsDir)
    .filter(name => {
      if (name.startsWith('_') || name === 'CLAUDE.md') return false;
      if (exclude.includes(name)) return false;
      const full = join(skillsDir, name);
      return statSync(full).isDirectory();
    })
    .map(name => ({
      name,
      path: join(skillsDir, name),
      hasReferences: existsSync(join(skillsDir, name, 'references')),
    }));
}

export function discoverSharedRules(root = PACKAGE_ROOT) {
  const rulesDir = join(root, SKILLS_DIR, '_team-rules');
  if (!existsSync(rulesDir)) return [];

  return readdirSync(rulesDir)
    .filter(name => name.endsWith('.md'))
    .map(name => ({
      name,
      path: join(rulesDir, name),
    }));
}

export function discoverCommands(root = PACKAGE_ROOT) {
  const cmdDir = join(root, COMMANDS_DIR);
  if (!existsSync(cmdDir)) return [];

  return readdirSync(cmdDir)
    .filter(name => name.endsWith('.md'))
    .map(name => ({
      name: basename(name, '.md'),
      filename: name,
      path: join(cmdDir, name),
    }));
}

export function discoverHooks(root = PACKAGE_ROOT) {
  const hooksDir = join(root, HOOKS_DIR);
  const files = [];

  for (const name of ['hooks.json', 'session-start']) {
    const full = join(hooksDir, name);
    if (existsSync(full)) {
      files.push({ name, path: full });
    }
  }

  return files;
}

export function discoverSkillsModuleClaude(root = PACKAGE_ROOT) {
  const p = join(root, SKILLS_DIR, 'CLAUDE.md');
  return existsSync(p) ? p : null;
}
