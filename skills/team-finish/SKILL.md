---
name: team-finish
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - merge, PR, or cleanup
---

# Team Finish — 分支完成处理

## 角色定位

> **分支生命周期**：`team-orchestrator` 在 H1 确认后创建功能分支（Step 1.5），本 Skill 在流程尾部（Step 7）负责分支收尾。

### 系统提示词

```
角色：分支完成处理——验证测试 → 展示选项 → 执行选择 → 清理
核心原则：测试未通过不展示选项，用户未选择不执行操作
流程：
1. 验证所有测试通过
2. 确定基准分支
3. 展示 4 个结构化选项
4. 执行用户选择
5. 清理工作目录
约束：
- 测试未通过前禁止展示合并选项（FP-4）
- 丢弃须用户输入 "discard" 确认
- 禁止 force-push 除非用户明确要求
```

### 推理检查点

**核心指令**：测试未通过 = 不展示合并选项（FP-4）。用户未选择 = 不执行操作（FP-1）。每步有明确前置条件。

**推理框架**：

1. **门禁状态**：测试全部通过？（当次新鲜执行，非上一轮结果）
2. **基准确定**：相对于哪个基准分支？合并基点在哪？
3. **用户意图**：合并、创建 PR、保留还是丢弃？（须等待明确选择）
4. **操作风险**：不可逆后果是什么？（force-push、分支删除）
5. **清理验证**：操作完成后工作区干净吗？合并后测试仍通过吗？

**对抗自检**：

- [ ] 前置条件是否真的满足？未满足时最坏后果？
- [ ] 用户后悔时操作是否可逆？

## Iron Law

```
NO BRANCH COMPLETION WITHOUT TEST VERIFICATION FIRST
```

## 质量职责

| 质量维度 | 产出文件 |
| -------- | -------- |
| 测试验证 | 测试命令输出 |
| 分支处理 | 合并/PR 结果 |
| 清理确认 | 工作目录状态 |

## 执行步骤

### Step 1：验证测试

运行项目测试命令（声明"测试通过"前须执行 `_team-rules/verification-protocol.md` 的 5 个步骤）。如果测试失败：

```
Tests failing (<N> failures). Must fix before completing:
[Show failures]
Cannot proceed with merge/PR until tests pass.
```

**失败处理**：停止，不进入 Step 2。根据失败类型采取行动：

- **编排模式**：回退编排器，由编排器路由回 implAgent 修复（附上失败输出）
- **独立使用**：向用户展示失败详情，推荐使用 `team-debug` 定位根因，修复后重新执行 Step 1

不可忽略失败继续展示选项（FP-4）。

### Step 2：确定基准分支

按以下优先级确定基准分支：

1. **从 checkpoint 读取**：如果 `docs/tasks/{slug}/.checkpoint.json` 存在且包含 `base_branch` 字段，直接使用（orchestrator Step 1.5 已确定）
2. **从项目 AI 规范读取**：在 CLAUDE.md / .cursor/rules/ 中查找 `base_branch` 或 `default_branch` 配置项
3. **从 Git 远程推断**：`git symbolic-ref refs/remotes/origin/HEAD | sed 's|refs/remotes/origin/||'`
4. **常见分支名兜底**：按 `main` → `master` → `develop` 顺序检查本地是否存在
5. **全部失败** → 触发 H3：向用户展示 `git branch --list` 和 `git remote -v` 输出，让用户指定基准分支（不可自动猜测）

确定后运行 `git merge-base HEAD {base_branch}` 获取合并基点。

### Step 3：展示选项

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

### Step 4：执行选择

#### Option 1：本地合并

1. 切换到基准分支并拉取最新（`git checkout {base} && git pull`）
2. 合并功能分支（`git merge {branch} --no-ff`）
3. **合并冲突处理**：如果 `git merge` 报告冲突，向用户展示冲突文件列表并暂停——由用户选择 (A) 手动解决冲突后继续、(B) 中止合并改为创建 PR、(C) 中止合并保留分支。不自动解决冲突
4. 运行项目测试命令验证合并后无回归
5. 删除功能分支

> **验证协议**（步骤 4 声明"通过"前必须执行 `_team-rules/verification-protocol.md` 的 5 个步骤）

#### Option 2：创建 PR

1. 推送功能分支到远程（`git push -u origin {branch}`）。如果推送失败（auth 错误、远程未配置），向用户展示错误信息并暂停
2. 使用项目 PR 创建命令创建 Pull Request（优先从 CLAUDE.md / .cursor/rules/ 获取 PR 命令；如未配置则使用 `gh pr create`）
3. 向用户展示 PR URL，确认创建成功

#### Option 3：保留分支

报告：`Keeping branch <name>.`

#### Option 4：丢弃

**需要确认**：用户必须输入 "discard" 确认。

1. 切换到基准分支
2. 强制删除功能分支

### Step 5：清理工作目录

对于 Option 1、2、4：

1. 检查是否有关联的工作目录（如 `git worktree list`）
2. 如果存在，移除工作目录

## Constitutional Rules 遵守

引用 `_team-rules/constitutional-rules.md`。分支完成阶段尤其注意：

- **Rule #1 人类介入是一等公民**：所有分支操作（合并/PR/丢弃）必须等待用户明确选择（FP-1）
- **Rule #8 验证先行**：展示选项前必须通过新鲜测试执行验证（FP-4）
- **Rule #3 产出必须验证**：合并后必须重新运行测试确认无回归（FP-4）

## 自检门禁

在报告完成状态前，执行以下自检：

- [ ] 测试已验证通过（运行项目测试命令确认）
- [ ] 基准分支已确定
- [ ] 用户已选择选项（不是自行决定）
- [ ] 如果选择 discard → 用户已输入 "discard" 确认
- [ ] 工作目录已清理（如适用）
- [ ] 如果选择 merge → 合并后测试已通过

## 完成标志

```
状态：DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
选择：{merge / PR / keep / discard}
测试：{N} 通过，0 失败
分支：{branch-name} → {base-branch}
```

## STOP Signals

- 测试未通过就展示合并/PR 选项
- 合并后没有重新运行测试就声明完成
- 丢弃分支前没有要求用户输入 "discard" 确认
- 执行 force-push 但用户没有明确要求

## 集成关系

**被谁调用：**

- `team-orchestrator`（编排模式）
- 用户直接调用（独立使用）

**配对使用：**

- `team-review` — 合并前确认审查已完成
- `team-brainstorm` / `team-spec` — 下一个功能
