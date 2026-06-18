---
description: 执行 git commit 和 git push 提交 Skills 变更
argument-hint: [commit-message]
---

# /team-push — 提交推送 Skills 变更

## 功能

将本仓库的 Skills 变更通过 `git commit` 和 `git push` 提交到远程仓库。

## 参数

- `$ARGUMENTS`：commit message（如不提供则使用默认消息）

## 执行步骤

1. 进入本仓库根目录：`cd "$(git rev-parse --show-toplevel)"`
2. 检查 `git status`，确认有变更需要提交
3. 执行 `git add -A`
4. 使用提供的 commit message 或默认消息执行 `git commit`
5. 执行 `git push`
6. 报告提交结果

## 默认 commit message

如未提供参数，使用：`"chore: update team skills [$(date +%Y-%m-%d)]"`
