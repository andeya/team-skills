---
description: 安装 team-skills 的 Skills、斜杠命令和 Hooks 到全局目录
argument-hint: [target-dir]
---

# /team-setup — Skills 全局安装

## 功能

将 team-skills 的所有组件以 symlink 方式安装到全局目录，使 Claude Code 和 Cursor 都能发现并使用。

## 安装内容

| 组件 | 目标位置 | 说明 |
|------|----------|------|
| Agent Skills (Cursor) | `~/.agents/skills/{name}` | Cursor 自动发现 |
| Agent Skills (Claude) | `~/.claude/skills/{name}` | Claude Code 自动发现 |
| 共享规则 | `~/.agents/skills/_team-rules/` + `~/.claude/skills/_team-rules/` | 被所有 Skill 引用 |
| Hooks（可选） | `~/.cursor/hooks/` | session-start 自动加载 |

## 使用方式

```bash
# 基本安装
team-skills setup

# 含可选的 team-score 评分 Skill
team-skills setup --with-score

# 覆盖已有安装
team-skills setup --force

# 跳过 Hooks
team-skills setup --no-hooks

# 预览不执行
team-skills setup --dry-run

# 指定目标目录（默认 ~/.agents/skills）
team-skills setup /path/to/target
```

## 选项

| 选项 | 说明 |
|------|------|
| `--with-score` | 包含 team-score Skill（默认隐藏） |
| `--no-hooks` | 跳过 Hooks 安装 |
| `--force` | 覆盖已有的 symlink 和文件 |
| `--dry-run` | 只显示操作，不实际执行 |

## 验证

安装后会自动验证每个 symlink 是否正确创建。也可手动检查：

```bash
team-skills list
```

## 卸载

```bash
team-skills uninstall
```
