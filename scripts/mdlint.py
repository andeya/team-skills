#!/usr/bin/env python3
"""
Team Skills Markdown Lint/Format — 零依赖，纯 Python 实现
=========================================================
本地用，CI 继续用 GitHub Action（不受网络影响）。

用法:
  python3 scripts/mdlint.py lint     # 检查
  python3 scripts/mdlint.py format   # 自动修复
"""

import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / ".markdownlint.json"

# 从配置读取禁用的规则
DISABLED = set()
if CONFIG.exists():
    import json
    try:
        disabled = json.loads(CONFIG.read_text())
        for k, v in disabled.items():
            if v is False:
                DISABLED.add(k.upper())
    except Exception:
        pass

EXCLUDE_DIRS = {"node_modules", ".git", ".venv", "__pycache__"}


def markdown_files():
    for f in ROOT.rglob("*.md"):
        if not any(p in f.parts for p in EXCLUDE_DIRS):
            yield f


def check_md032_blanks_around_lists(lines, path):
    """Lists should be surrounded by blank lines."""
    errors = []
    in_list = False
    for i, line in enumerate(lines):
        stripped = line.rstrip("\n")
        is_list_item = bool(re.match(r"^(\s*[-*+]\s|\s*\d+[.)]\s)", stripped))
        if is_list_item and not in_list:
            # First list item - check previous line is blank or start of file
            if i > 0 and lines[i - 1].strip() and not re.match(r"^##?\s", lines[i - 1]):
                errors.append((i + 1, stripped, "MD032"))
            in_list = True
        elif not is_list_item and in_list:
            # Just left a list - check this line is blank or heading
            if stripped and not re.match(r"^##?\s", stripped):
                errors.append((i + 1, stripped, "MD032"))
            in_list = False
    return errors


def check_md022_blanks_around_headings(lines, path):
    """Headings should be surrounded by blank lines."""
    errors = []
    for i, line in enumerate(lines):
        stripped = line.rstrip("\n")
        if re.match(r"^###?\s", stripped):
            # Check blank line before heading
            if i > 0 and lines[i - 1].strip():
                errors.append((i + 1, stripped, "MD022"))
    return errors


def check_md031_blanks_around_fences(lines, path):
    """Fenced code blocks should be surrounded by blank lines."""
    errors = []
    in_fence = False
    for i, line in enumerate(lines):
        stripped = line.rstrip("\n")
        if stripped.startswith("```"):
            if not in_fence:
                # Opening fence - check blank line before
                if i > 0 and lines[i - 1].strip():
                    errors.append((i + 1, stripped, "MD031"))
                in_fence = True
            else:
                # Closing fence - check blank line after
                if i + 1 < len(lines) and lines[i + 1].strip():
                    errors.append((i + 1, stripped, "MD031"))
                in_fence = False
    return errors


def check_md029_ol_prefix(lines, path):
    """Ordered list item prefix should be 1/2/3."""
    errors = []
    expected = 1
    in_ol = False
    for i, line in enumerate(lines):
        stripped = line.rstrip("\n")
        m = re.match(r"^(\s*)(\d+)[.)]\s", stripped)
        if m:
            num = int(m.group(2))
            if not in_ol:
                expected = 1
                in_ol = True
            if num != expected:
                errors.append((i + 1, stripped, f"MD029 (expected {expected}, got {num})"))
            expected = num + 1
        else:
            in_ol = False
    return errors


def check_md034_bare_urls(lines, path):
    """Bare URLs should be wrapped in angle brackets."""
    errors = []
    url_re = re.compile(r"https?://[^\s<>\"'()]+")
    for i, line in enumerate(lines):
        stripped = line.rstrip("\n")
        # Skip lines that are already in link syntax or code blocks
        if "```" in stripped or "](" in stripped or "<" in stripped:
            continue
        for m in url_re.finditer(stripped):
            url = m.group()
            # Skip if already wrapped
            pos = m.start()
            if pos > 0 and stripped[pos - 1] == "<":
                continue
            errors.append((i + 1, stripped[:60] + "...", "MD034"))
    return errors


def fix_md032_blanks_around_lists(lines):
    """Auto-fix: add blank lines around lists."""
    result = list(lines)
    in_list = False
    insertions = []
    for i, line in enumerate(result):
        stripped = line.rstrip("\n")
        is_list_item = bool(re.match(r"^(\s*[-*+]\s|\s*\d+[.)]\s)", stripped))
        if is_list_item and not in_list:
            if i > 0 and result[i - 1].strip() and not re.match(r"^##?\s", result[i - 1]):
                insertions.append(i)
            in_list = True
        elif not is_list_item and in_list:
            if stripped and not re.match(r"^##?\s", stripped):
                insertions.append(i)
            in_list = False
    for idx in reversed(insertions):
        result.insert(idx, "\n")
    return result


def fix_md022_blanks_around_headings(lines):
    """Auto-fix: add blank line before headings."""
    result = list(lines)
    insertions = []
    for i, line in enumerate(result):
        stripped = line.rstrip("\n")
        if re.match(r"^###?\s", stripped):
            if i > 0 and result[i - 1].strip():
                insertions.append(i)
    for idx in reversed(insertions):
        result.insert(idx, "\n")
    return result


def fix_md031_blanks_around_fences(lines):
    """Auto-fix: add blank lines around fenced code blocks."""
    result = list(lines)
    insertions = []
    in_fence = False
    for i, line in enumerate(result):
        stripped = line.rstrip("\n")
        if stripped.startswith("```"):
            if not in_fence:
                if i > 0 and result[i - 1].strip():
                    insertions.append(i)
                in_fence = True
            else:
                if i + 1 < len(result) and result[i + 1].strip():
                    insertions.append(i + 1)
                in_fence = False
    for idx in reversed(insertions):
        result.insert(idx, "\n")
    return result


def fix_md029_ol_prefix(lines):
    """Auto-fix: renumber ordered lists."""
    result = list(lines)
    in_ol = False
    expected = 1
    for i in range(len(result)):
        stripped = result[i].rstrip("\n")
        m = re.match(r"^(\s*)(\d+)([.)]\s)", stripped)
        if m:
            num = int(m.group(2))
            if not in_ol:
                expected = 1
                in_ol = True
            if num != expected:
                result[i] = f"{m.group(1)}{expected}{m.group(3)}{stripped[m.end():]}\n"
            expected = num + 1
        else:
            in_ol = False
    return result


def fix_md034_bare_urls(lines):
    """Auto-fix: wrap bare URLs in angle brackets."""
    url_re = re.compile(r"(https?://[^\s<>\"'()]+)")
    result = []
    for line in lines:
        stripped = line.rstrip("\n")
        if "```" in stripped or "](" in stripped:
            result.append(line)
            continue
        new_line = url_re.sub(r"<\1>", stripped)
        result.append(new_line + "\n")
    return result


def run_check():
    all_errors = []
    checkers = [
        ("MD032", check_md032_blanks_around_lists),
        ("MD022", check_md022_blanks_around_headings),
        ("MD031", check_md031_blanks_around_fences),
        ("MD029", check_md029_ol_prefix),
        ("MD034", check_md034_bare_urls),
    ]
    for f in markdown_files():
        lines = f.read_text().splitlines(keepends=True)
        for rule_name, checker in checkers:
            if rule_name in DISABLED:
                continue
            errors = checker(lines, f)
            for lineno, content, rule in errors:
                rel = f.relative_to(ROOT)
                all_errors.append((rel, lineno, content, rule))
    return all_errors


def run_format():
    fixers = [
        ("MD032", fix_md032_blanks_around_lists),
        ("MD022", fix_md022_blanks_around_headings),
        ("MD031", fix_md031_blanks_around_fences),
        ("MD029", fix_md029_ol_prefix),
        ("MD034", fix_md034_bare_urls),
    ]
    fixed_count = 0
    for f in markdown_files():
        original = f.read_text()
        lines = original.splitlines(keepends=True)
        for rule_name, fixer in fixers:
            if rule_name in DISABLED:
                continue
            lines = fixer(lines)
        new_content = "".join(lines)
        if new_content != original:
            f.write_text(new_content)
            rel = f.relative_to(ROOT)
            print(f"  📝 {rel}")
            fixed_count += 1
    return fixed_count


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ("lint", "format"):
        print("用法: python3 scripts/mdlint.py lint|format")
        sys.exit(1)

    command = sys.argv[1]

    if command == "lint":
        errors = run_check()
        if errors:
            print(f"\n❌ 发现 {len(errors)} 个问题:\n")
            for rel, lineno, content, rule in errors:
                print(f"  {rel}:{lineno}  {rule}  {content.strip()[:60]}")
            sys.exit(1)
        else:
            print("✅ 全部通过")
    else:
        print("=== Markdown Format (auto-fix) ===")
        count = run_format()
        if count:
            print(f"✅ 已修复 {count} 个文件")
        else:
            print("✅ 无需修复")


if __name__ == "__main__":
    main()
