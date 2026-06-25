import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const PACKAGE_ROOT = join(__dirname, '..', '..');
export const DEFAULT_SKILLS_TARGET = join(homedir(), '.agents', 'skills');
export const DEFAULT_CURSOR_SKILLS_TARGET = join(homedir(), '.cursor', 'skills');
export const DEFAULT_CLAUDE_SKILLS_TARGET = join(homedir(), '.claude', 'skills');
export const SKILLS_DIR = 'skills';

export const GLOBAL_TARGETS = [
  { label: 'Agents', dir: DEFAULT_SKILLS_TARGET },
  { label: 'Cursor', dir: DEFAULT_CURSOR_SKILLS_TARGET },
  { label: 'Claude Code', dir: DEFAULT_CLAUDE_SKILLS_TARGET },
];

export const PROJECT_IDE_DIRS = { cursor: '.cursor', claude: '.claude' };

export function resolveTargets(customFirst) {
  if (!customFirst || customFirst === DEFAULT_SKILLS_TARGET) return GLOBAL_TARGETS;
  return GLOBAL_TARGETS.map((t, i) => (i === 0 ? { ...t, dir: customFirst } : t));
}
