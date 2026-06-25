---
description: 卸载 team-skills 的所有 symlink（Skills、斜杠命令、Hooks）
argument-hint: [target-dir]
---

# /team-uninstall — 卸载 Skills

## 功能

移除 `team-skills setup` 创建的所有软链接，不影响源文件。

## 移除内容

| 组件 | 位置 |
|------|------|
| Cursor Skills | `~/.agents/skills/team-*` |
| Claude Code Skills | `~/.claude/skills/team-*` |
| 共享规则 | `~/.agents/skills/_team-rules/` + `~/.claude/skills/_team-rules/` |
| Hooks | `~/.cursor/hooks/`、`~/.claude/hooks/` |

## 使用方式

```bash
# 完整卸载
team-skills uninstall

# 保留 Hooks
team-skills uninstall --no-hooks

# 预览不执行
team-skills uninstall --dry-run

# 指定目标目录
team-skills uninstall /path/to/target
```

## 选项

| 选项 | 说明 |
|------|------|
| `--no-hooks` | 跳过移除 Hooks |
| `--dry-run` | 只显示操作，不实际执行 |

## 安全机制

- 只移除指向 team-skills 源文件的 symlink
- 指向其他来源的同名 symlink 会跳过（标记为 `foreign`）
- 非 symlink 文件不会被删除
