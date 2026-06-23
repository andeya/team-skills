---
description: 卸载 team-skills 的所有 symlink（Skills、Commands、Hooks）
argument-hint: [target-dir]
---

# /team-uninstall — 卸载 Skills

## 功能

移除 `/team-setup` 创建的所有软链接，不影响本仓库源文件。

## 参数

- `$1`（可选）：目标目录，默认为 `~/.agents/skills`

## 执行步骤

### 1. 确定目标目录

```bash
set -euo pipefail
TARGET="${1:-$HOME/.agents/skills}"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$(cd "$(dirname "$0")/../.." && pwd)")"
echo "卸载来源: $REPO_ROOT"
echo "目标目录: $TARGET"
removed=0
```

### 2. 移除 Agent Skills

```bash
for dir in "$REPO_ROOT/skills"/*/; do
  name="$(basename "$dir")"
  [ "$name" = "_team-rules" ] && continue
  if [ -L "$TARGET/$name" ]; then
    rm "$TARGET/$name"
    echo "  🗑️ Skill: $name"
    removed=$((removed + 1))
  fi
done
```

### 3. 移除共享规则

```bash
for f in "$REPO_ROOT/skills/_team-rules"/*; do
  [ -f "$f" ] || continue
  name="$(basename "$f")"
  if [ -L "$TARGET/_team-rules/$name" ]; then
    rm "$TARGET/_team-rules/$name"
    echo "  🗑️ Rule: $name"
    removed=$((removed + 1))
  fi
done
rmdir "$TARGET/_team-rules" 2>/dev/null || true
```

### 4. 移除 Command Skills

```bash
for cmd in "$REPO_ROOT/.claude/commands"/*.md; do
  [ -f "$cmd" ] || continue
  name="$(basename "$cmd" .md)"
  if [ -L "$TARGET/$name/SKILL.md" ]; then
    rm "$TARGET/$name/SKILL.md"
    rmdir "$TARGET/$name" 2>/dev/null || true
    echo "  🗑️ Command Skill: $name"
    removed=$((removed + 1))
  fi
done
```

### 5. 移除 Claude Code 命令

```bash
for cmd in "$REPO_ROOT/.claude/commands"/*.md; do
  [ -f "$cmd" ] || continue
  name="$(basename "$cmd")"
  if [ -L "$HOME/.claude/commands/$name" ]; then
    rm "$HOME/.claude/commands/$name"
    echo "  🗑️ Claude Command: $name"
    removed=$((removed + 1))
  fi
done
```

### 6. 移除 Hooks

```bash
for hook_dir in "$HOME/.cursor/hooks" "$HOME/.claude/hooks"; do
  for f in hooks.json session-start; do
    if [ -L "$hook_dir/$f" ]; then
      rm "$hook_dir/$f"
      echo "  🗑️ Hook: $hook_dir/$f"
      removed=$((removed + 1))
    fi
  done
done
```

### 7. 汇报

```bash
echo ""
echo "✅ 卸载完成，共移除 $removed 个软链接。"
echo "本仓库源文件未受影响。"
```
