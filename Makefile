# Team Skills — Makefile
#
# Usage:
#   make lint      检查 Markdown 格式
#   make format    自动修复 Markdown 格式
#   make check     完整本地检查（lint + 链接）
#   make setup     安装 git hooks
#   make help      查看帮助

SHELL := /bin/bash

.PHONY: lint format check setup help

help:
	@echo "Team Skills 开发命令"
	@echo ""
	@echo "  make lint      检查 Markdown 格式（CI 标准）"
	@echo "  make format    自动修复可修复的 Markdown 格式问题"
	@echo "  make check     完整本地检查（lint + 链接验证）"
	@echo "  make setup     安装 git hooks（提交前自动 format）"
	@echo ""

lint:
	@echo "=== Markdown Lint ==="
	@python3 scripts/mdlint.py lint
	@echo ""

format:
	@echo "=== Markdown Format (auto-fix) ==="
	@python3 scripts/mdlint.py format
	@echo ""

check: lint
	@echo "=== 链接检查 ==="
	@echo "（CI 中运行 lychee，本地可跳过）"
	@echo ""

setup:
	@echo "=== 安装 git hooks ==="
	@git config core.hooksPath .githooks
	@chmod +x .githooks/pre-commit
	@echo "✅ git hooks 已安装（路径：.githooks/）"
	@echo "   提交前将自动执行 make format"
