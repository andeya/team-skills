---
description: 将当前仓库的 skills 和 commands 安装到指定目录（默认 ~/.agents/skills）
argument-hint: [target-dir]
---

# /team-setup — Skills 安装命令

## 功能

将本仓库的所有内容软链接到目标目录，使 Claude Code 和 Cursor 都能发现并使用，且后续通过 `/team-pull` 即可同步更新。

安装内容：

- `skills/*` → `{target-dir}/`（Agent Skills，含 team-score 评分 Skill）
- `.claude/commands/*` → `{target-dir}/{name}/SKILL.md`（Commands 也作为 Skill 安装，Cursor 可发现）
- `.claude/commands/*` → `~/.claude/commands/`（兼容 Claude Code 斜杠命令）

## 参数

- `$1`（可选）：目标目录，默认为 `~/.agents/skills`

## 执行步骤

### 1. 确定目标目录

若 `$1` 不为空则使用 `$1`，否则使用 `~/.agents/skills`。创建目标目录（如不存在）。

### 2. 安装 Agent Skills

对本仓库 `skills/` 下的每个子目录，在目标目录下创建同名软链接。

### 3. 安装 Commands（作为 Skill）

对本仓库 `.claude/commands/` 下的每个 `.md` 文件，在目标目录下创建 `{name}/SKILL.md` 软链接，使其作为 Skill 可被 Cursor 发现。

### 4. 安装 Commands（兼容 Claude Code）

对本仓库 `.claude/commands/` 下的每个 `.md` 文件，在 `~/.claude/commands/` 下创建同名软链接，使其可作为斜杠命令在 Claude Code 中使用。

## 验证

- 确认目标目录下每个 Agent Skill 目录都是指向本仓库的软链接
- 确认目标目录下每个 Command Skill 的 `SKILL.md` 都是指向本仓库命令文件的软链接
- 确认 `~/.claude/commands/` 下每个命令文件都是指向本仓库的软链接
- 提示用户可通过 `/team-pull` 拉取更新
