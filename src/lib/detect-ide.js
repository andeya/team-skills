import { join } from 'node:path';
import { existsSync } from 'node:fs';
import * as log from './logger.js';

export function detectIDE(projectDir, forceIDE, { strict = false } = {}) {
  if (forceIDE) {
    if (!['claude', 'cursor', 'both'].includes(forceIDE)) {
      log.error(`不支持的 IDE 类型: ${forceIDE}。可选: claude, cursor, both`);
      process.exit(1);
    }
    return forceIDE === 'both' ? ['claude', 'cursor'] : [forceIDE];
  }

  const detected = [];
  if (existsSync(join(projectDir, '.claude'))) detected.push('claude');
  if (existsSync(join(projectDir, '.cursor'))) detected.push('cursor');

  if (detected.length === 0 && strict) {
    log.error('未检测到项目级 IDE 配置（.claude/ 或 .cursor/ 目录）。');
    log.info('请使用 --ide 指定目标 IDE：');
    log.info('  --ide claude    仅安装 Claude Code 命令');
    log.info('  --ide cursor    仅安装 Cursor skills');
    log.info('  --ide both      同时安装两者');
    process.exit(1);
  }

  return detected;
}
