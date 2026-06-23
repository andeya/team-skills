#!/usr/bin/env bash
set -euo pipefail

# Verify Skill structure: SKILL.md existence, required sections, shared rules.
# Used by both `make lint` and CI (.github/workflows/ci.yml).

cd "$(git rev-parse --show-toplevel)"

failed=0

# --- 1. Check SKILL.md existence ---
for dir in skills/team-*/ skills/using-team-skills/; do
  name=$(basename "$dir")
  if [ ! -f "$dir/SKILL.md" ]; then
    echo "❌ $name: missing SKILL.md"
    failed=1
  fi
done

# --- 2. Check required sections in each SKILL.md ---
REQUIRED=("角色定位" "系统提示词" "推理指引|路由推理" "Iron Law" "执行步骤" "自检门禁" "完成标志" "STOP Signals")

for dir in skills/team-*/ skills/using-team-skills/; do
  name=$(basename "$dir")
  [ -f "$dir/SKILL.md" ] || continue
  for section in "${REQUIRED[@]}"; do
    found=false
    IFS='|' read -ra ALTS <<< "$section"
    for alt in "${ALTS[@]}"; do
      if grep -qE "^#{2,3} $alt" "$dir/SKILL.md" 2>/dev/null; then
        found=true
        break
      fi
    done
    if [ "$found" = false ]; then
      echo "❌ $name: missing section '$section'"
      failed=1
    fi
  done
done

# --- 3. Check shared rules files ---
SHARED=("constitutional-rules.md" "verification-protocol.md" "four-state-protocol.md")
for file in "${SHARED[@]}"; do
  if [ ! -f "skills/_team-rules/$file" ]; then
    echo "❌ Missing _team-rules/$file"
    failed=1
  fi
done

# --- Result ---
if [ "$failed" -ne 0 ]; then
  echo ""
  echo "Skill structure check failed."
  exit 1
fi

echo "✅ All skill structure checks passed."
