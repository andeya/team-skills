import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const PACKAGE_ROOT = join(__dirname, '..', '..');
export const DEFAULT_SKILLS_TARGET = join(homedir(), '.agents', 'skills');
export const DEFAULT_COMMANDS_TARGET = join(homedir(), '.claude', 'commands');
export const CURSOR_HOOKS_DIR = join(homedir(), '.cursor', 'hooks');
export const CLAUDE_HOOKS_DIR = join(homedir(), '.claude', 'hooks');
export const SKILLS_DIR = 'skills';
export const HOOKS_DIR = 'hooks';
export const RULES_DIR = 'rules';
export const COMMANDS_DIR = join('.claude', 'commands');
