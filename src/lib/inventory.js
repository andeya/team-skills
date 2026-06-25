import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PACKAGE_ROOT, SKILLS_DIR } from './constants.js';

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
