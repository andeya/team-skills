import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const PACKAGE_ROOT = join(__dirname, '..', '..');
export const DEFAULT_SKILLS_TARGET = join(homedir(), '.agents', 'skills');
export const DEFAULT_CLAUDE_SKILLS_TARGET = join(homedir(), '.claude', 'skills');
export const SKILLS_DIR = 'skills';
