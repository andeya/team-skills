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
```

### 推理检查点

> 测试未通过 = 不展示合并选项（FP-4）。用户未选择 = 不执行操作（FP-1）。每步有明确前置条件。

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

**EXEC** 项目测试命令（声明"通过"前须执行 `_team-rules/verification-protocol.md` 的 5 个步骤）

**ASSERT** `exit_code == 0` && `failures == 0`

- 通过 → **GOTO** Step 1.5
- 失败 → **MATCH** `mode`：
  - `orchestrated` → **ROLLBACK** 编排器，由编排器 **ROUTE** implAgent（附上失败输出）
  - *default* → **WRITE**（对话中）失败详情，推荐 `team-debug`，修复后 **GOTO** Step 1

> 不可忽略失败继续展示选项（FP-4）。

### Step 1.5：凭证泄露扫描

**EXEC** `grep -rn -E '(AK|SK|access[_-]?key|secret[_-]?key|api[_-]?key|token|password|passwd|credential)\s*[:=]' .` — 推送前凭证扫描（RL-2）

- **IF** `exit_code == 0` → 逐条排除占位符/测试值/注释 → 真实凭证 → **BLOCKED**，**WRITE**（对话中）凭证位置，要求修复后重新验证
- **ELSE** → **GOTO** Step 2

### Step 2：确定基准分支

**RESOLVE** `base_branch`（首个命中即停）：

1. `READ("docs/tasks/{slug}/.checkpoint.json").base_branch`
2. `READ("CLAUDE.md").base_branch` / `READ(".cursor/rules/").default_branch`
3. `EXEC("git symbolic-ref refs/remotes/origin/HEAD")` → 解析分支名
4. **FOR** each `name` in [`main`, `master`, `develop`] → `EXEC("git show-ref --verify refs/heads/{name}")` 首个存在即停
5. *none* → **H3**：向用户展示 `git branch --list` 和 `git remote -v`，让用户指定

**EXEC** `git merge-base HEAD {base_branch}` → 获取合并基点

**ASSERT** `exit_code == 0`

- 失败（分支无公共祖先）→ **BLOCKED**，触发 **H3**

### Step 3：展示选项

**WRITE**（对话中）选项列表：

```
实现完成。请选择后续操作：

1. 本地合并到 {base_branch}
2. 推送并创建 Pull Request
3. 保留当前分支（稍后处理）
4. 丢弃本次工作

请选择：
```

### Step 4：执行选择

**MATCH** `user_choice`：

- `Option 1`（本地合并）：
  1. **EXEC** `git checkout {base_branch} && git pull`
     - **ASSERT** `exit_code == 0`
       - 失败 → **WRITE**（对话中）错误信息，**BLOCKED**
  2. **EXEC** `git merge {branch} --no-ff`
     - **IF** 合并冲突：
       - **GOTO** 子步骤 4.1：冲突处理
     - **ELSE**：
       - 继续下一步
  3. **EXEC** 项目测试命令（声明"通过"前须执行 `_team-rules/verification-protocol.md` 的 5 个步骤）
     - **ASSERT** `exit_code == 0` && `failures == 0`
       - 失败 → 记录回归详情 → **BLOCKED**
  4. **EXEC** `git branch -d {branch}`
     - **IF** `exit_code != 0` → **WRITE**（对话中）"分支未完全合并，需 -D 强制删除？"，等待用户确认

- `Option 2`（创建 PR）：
  1. **EXEC** `git push -u origin {branch}`
     - **ASSERT** `exit_code == 0`
       - 失败（auth 错误、远程未配置）→ **WRITE**（对话中）错误信息给用户，**BLOCKED**
  2. **RESOLVE** `pr_cmd`（首个命中即停）：
     1. `READ("CLAUDE.md").pr_cmd` / `READ(".cursor/rules/").pr_cmd`
     2. *default* → `gh pr create`
  3. **EXEC** `{pr_cmd}`
     - **ASSERT** `exit_code == 0`
       - 通过 → **WRITE**（对话中）PR URL
       - 失败 → **WRITE**（对话中）错误信息，**BLOCKED**

- `Option 3`（保留分支）：
  **WRITE**（对话中）"保留分支 {branch}。"

- `Option 4`（丢弃）：
  **ASSERT** `user_input == "discard"`
  1. **EXEC** `git checkout {base_branch}`
     - **ASSERT** `exit_code == 0`
  2. **EXEC** `git branch -D {branch}`
     - **ASSERT** `exit_code == 0`

- *default*（无效输入）→ **WRITE**（对话中）"请选择 1-4"，重新展示选项

#### 子步骤 4.1：冲突处理

**WRITE**（对话中）冲突文件列表（不自动解决冲突）

**MATCH** `conflict_choice`：

- `A` → 手动解决冲突后继续
- `B` → 中止合并，改为创建 PR
- `C` → 中止合并，保留分支
- *default* → **WRITE**（对话中）"请选择 A/B/C"

### Step 5：清理工作目录

**IF** `user_choice` in [`Option 1`, `Option 2`, `Option 4`]：

1. **EXEC** `git worktree list`
   - **IF** `output` 包含关联工作目录 → 移除工作目录

**ELSE**：

- 无需清理

## STOP Signals

- **展示**选项在测试未通过时
- **声明**完成在合并后未重新测试时
- **丢弃**分支前未要求用户输入 "discard"
- **执行** force-push 前未获用户明确授权

## Constitutional Rules 遵守

引用 `_team-rules/constitutional-rules.md`。分支完成阶段尤其注意：

- **Rule #1 人类介入是一等公民**：所有分支操作（合并/PR/丢弃）必须等待用户明确选择（FP-1）
- **Rule #8 验证先行**：展示选项前必须通过新鲜测试执行验证（FP-4）
- **Rule #3 产出必须验证**：合并后必须重新运行测试确认无回归（FP-4）

## 自检门禁

**GATE** 完成前自检（全部通过才放行）：

- [ ] **ASSERT** `exit_code == 0` && `failures == 0`（测试已通过）
- [ ] **ASSERT** `base_branch` 非空
- [ ] **ASSERT** `user_choice` 非空（用户已选择，非自行决定）
- [ ] `[Option 4]` **ASSERT** `user_input == "discard"`
- [ ] **IF** `user_choice == Option 1` → **ASSERT** `merge_test_exit_code == 0`（合并后测试通过）
- [ ] **IF** `user_choice` in [`Option 1`, `Option 2`, `Option 4`] → **ASSERT** `worktree` 已清理

## 完成标志

**MATCH** `result`：

- `操作成功` → **DONE**
- `操作成功但有 warning` → **DONE_WITH_CONCERNS**
- `无法确定基准分支` → **NEEDS_CONTEXT**
- `测试失败` || `合并冲突` → **BLOCKED**
- *default* → **BLOCKED**，触发 **H3**

## 集成关系

**被谁调用：**

- `team-orchestrator`（编排模式）
- 用户直接调用（独立使用）

**配对使用：**

- `team-review` — 合并前确认审查已完成
- `team-brainstorm` / `team-spec` — 下一个功能
