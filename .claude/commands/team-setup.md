---
description: 将当前仓库的 skills 和 commands 安装到指定目录（默认 ~/.agents/skills），含 _team-rules/ 共享规则
argument-hint: [target-dir]
---

# /team-setup — Skills 安装命令

## 功能

将本仓库的所有内容软链接到目标目录，使 Claude Code 和 Cursor 都能发现并使用，且后续通过 `/team-pull` 即可同步更新。

安装内容：

- `skills/*` → `{target-dir}/`（Agent Skills，含 team-score 评分 Skill 和 using-team-skills meta-skill）
- `skills/_team-rules/*` → `{target-dir}/_team-rules/`（共享规则文件，被所有 Skill 引用）
- `.claude/commands/*` → `{target-dir}/{name}/SKILL.md`（Commands 也作为 Skill 安装，Cursor 可发现）
- `.claude/commands/*` → `~/.claude/commands/`（兼容 Claude Code 斜杠命令）
- `hooks/hooks.json` → Cursor/Claude Code hooks 目录（可选，用于 session-start 注入）

## 参数

- `$1`（可选）：目标目录，默认为 `~/.agents/skills`

## 执行步骤

### 1. 确定目标目录

```bash
set -euo pipefail
TARGET="${1:-$HOME/.agents/skills}"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$(cd "$(dirname "$0")/../.." && pwd)")"
mkdir -p "$TARGET"
echo "目标目录: $TARGET"
echo "仓库根目录: $REPO_ROOT"
```

### 2. 安装 Agent Skills

对本仓库 `skills/` 下的每个子目录（排除 `_team-rules` 和 `CLAUDE.md`），在目标目录下创建同名软链接。

```bash
for dir in "$REPO_ROOT/skills"/*/; do
  name="$(basename "$dir")"
  # 跳过 _team-rules（单独处理）
  [ "$name" = "_team-rules" ] && continue
  ln -sfn "$dir" "$TARGET/$name"
  echo "  ✅ Skill: $name → $TARGET/$name"
done
```

### 3. 安装共享规则（_team-rules）

```bash
mkdir -p "$TARGET/_team-rules"
for f in "$REPO_ROOT/skills/_team-rules"/*; do
  [ -f "$f" ] || continue
  ln -sf "$f" "$TARGET/_team-rules/$(basename "$f")"
  echo "  ✅ Rule: $(basename "$f")"
done
```

### 4. 安装 Commands（作为 Skill，供 Cursor 发现）

对本仓库 `.claude/commands/` 下的每个 `.md` 文件，在目标目录下创建 `{name}/SKILL.md` 软链接。

```bash
for cmd in "$REPO_ROOT/.claude/commands"/*.md; do
  [ -f "$cmd" ] || continue
  name="$(basename "$cmd" .md)"
  # 跳过已作为 Skill 安装的同名目录，避免写入跟随 symlink
  if [ -L "$TARGET/$name" ]; then
    echo "  ⚠️  Command Skill $name 跳过：已存在同名 Skill 目录"
    continue
  fi
  mkdir -p "$TARGET/$name"
  ln -sf "$cmd" "$TARGET/$name/SKILL.md"
  echo "  ✅ Command Skill: $name → $TARGET/$name/SKILL.md"
done
```

### 5. 安装 Commands（兼容 Claude Code 斜杠命令）

```bash
mkdir -p "$HOME/.claude/commands"
for cmd in "$REPO_ROOT/.claude/commands"/*.md; do
  [ -f "$cmd" ] || continue
  name="$(basename "$cmd")"
  ln -sf "$cmd" "$HOME/.claude/commands/$name"
  echo "  ✅ Claude Command: $name → $HOME/.claude/commands/$name"
done
```

### 6. 安装 Hooks（可选）

如果目标平台支持 hooks（Cursor / Claude Code），将 `hooks/hooks.json` 和 `hooks/session-start` 安装到对应平台的 hooks 目录。

```bash
install_hooks() {
  local hook_dir="$1"
  local platform="$2"
  mkdir -p "$hook_dir"
  if [ -f "$REPO_ROOT/hooks/hooks.json" ]; then
    ln -sf "$REPO_ROOT/hooks/hooks.json" "$hook_dir/hooks.json"
    echo "  ✅ ${platform} hooks.json"
  fi
  if [ -f "$REPO_ROOT/hooks/session-start" ]; then
    ln -sf "$REPO_ROOT/hooks/session-start" "$hook_dir/session-start"
    chmod +x "$hook_dir/session-start" 2>/dev/null || true
    echo "  ✅ ${platform} session-start"
  fi
}

# Cursor hooks
install_hooks "$HOME/.cursor/hooks" "Cursor"
# Claude Code hooks
install_hooks "$HOME/.claude/hooks" "Claude Code"
```

## 验证

```bash
echo ""
echo "=== 验证安装 ==="

# 确认每个 Agent Skill 目录是软链接
errors=0
for dir in "$REPO_ROOT/skills"/*/; do
  name="$(basename "$dir")"
  [ "$name" = "_team-rules" ] && continue
  if [ -L "$TARGET/$name" ] && [ -d "$TARGET/$name" ]; then
    echo "  ✅ $name → $(readlink "$TARGET/$name")"
  else
    echo "  ❌ $name 未正确安装"
    errors=$((errors + 1))
  fi
done

# 确认 _team-rules 规则文件
for f in "$REPO_ROOT/skills/_team-rules"/*; do
  [ -f "$f" ] || continue
  name="$(basename "$f")"
  if [ -L "$TARGET/_team-rules/$name" ]; then
    echo "  ✅ _team-rules/$name → $(readlink "$TARGET/_team-rules/$name")"
  else
    echo "  ❌ _team-rules/$name 未正确安装"
    errors=$((errors + 1))
  fi
done

# 确认 Command Skills
for cmd in "$REPO_ROOT/.claude/commands"/*.md; do
  [ -f "$cmd" ] || continue
  name="$(basename "$cmd" .md)"
  if [ -L "$TARGET/$name/SKILL.md" ]; then
    echo "  ✅ Command Skill $name → $(readlink "$TARGET/$name/SKILL.md")"
  else
    echo "  ❌ Command Skill $name 未正确安装"
    errors=$((errors + 1))
  fi
done

# 确认 Claude Code 命令
for cmd in "$REPO_ROOT/.claude/commands"/*.md; do
  [ -f "$cmd" ] || continue
  name="$(basename "$cmd")"
  if [ -L "$HOME/.claude/commands/$name" ]; then
    echo "  ✅ Claude Command $name → $(readlink "$HOME/.claude/commands/$name")"
  else
    echo "  ❌ Claude Command $name 未正确安装"
    errors=$((errors + 1))
  fi
done

if [ "$errors" -eq 0 ]; then
  echo ""
  echo "🎉 安装完成！所有组件已正确安装。"
  echo ""
  echo "后续可通过 /team-pull 拉取更新。"
else
  echo ""
  echo "⚠️  有 $errors 个组件安装异常，请检查。"
fi
```
