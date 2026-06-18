---
description: 执行 git pull 拉取最新 Skills
---

# /team-pull — 拉取最新 Skills

## 功能

在本仓库根目录执行 `git pull`，拉取远程最新的 Skills 变更。

## 执行步骤

1. 进入本仓库根目录：`cd "$(git rev-parse --show-toplevel)"`
2. 检查当前分支状态
3. 执行 `git pull --rebase`
4. 报告拉取结果（新增/修改的文件列表）

## 验证

- 确认 `git pull` 执行成功
- 如有冲突，提示用户手动解决
