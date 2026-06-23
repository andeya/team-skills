# Team Skills — Makefile
#
# Usage:
#   make deps      安装依赖 (npm install)
#   make lint      检查 Markdown 格式 + Skill 结构
#   make format    自动修复 Markdown 格式
#   make setup     安装 git hooks
#   make help      查看帮助

.PHONY: deps lint format setup help

help:
	@echo "Team Skills 开发命令"
	@echo "  make deps      安装依赖 (npm install)"
	@echo "  make lint      检查 Markdown 格式"
	@echo "  make format    自动修复 Markdown 格式"
	@echo "  make setup     安装 git hooks（提交前自动 format）"

deps:
	npm install

lint:
	npm run lint

format:
	npm run format

setup:
	git config core.hooksPath .githooks
	chmod +x .githooks/pre-commit
	@echo "✅ git hooks 已安装"
