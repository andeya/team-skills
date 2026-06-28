---
name: team-finish
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - merge, PR, or cleanup
---

# Team Finish — 分支完成处理

**CRITICAL: DO NOT use EnterPlanMode.** This skill defines its own structured workflow. Follow STEPS below directly.

## ROLE

> **分支生命周期**：`team-orchestrator` 在 CONFIRM_GOAL 确认后创建功能分支（Step 1.5），本 Skill 在流程尾部（Step 7）负责分支收尾。

### 系统提示词

```
角色：分支完成处理——验证测试 → 展示选项 → 执行选择 → 清理
核心原则：测试未通过不展示选项，用户未选择不执行操作
```

### 推理检查点

> 测试未通过 = 不展示合并选项 `_team-rules/first-principles.md: First Principle #4`。用户未选择 = 不执行操作 `_team-rules/first-principles.md: First Principle #1`。每步有明确前置条件。

**推理框架**：

1. **门禁状态**：测试全部通过？（当次新鲜执行，非上一轮结果）
2. **基准确定**：相对于哪个基准分支？合并基点在哪？
3. **用户意图**：合并、创建 PR、保留还是丢弃？（须等待明确选择）
4. **操作风险**：不可逆后果是什么？（force-push、分支删除）
5. **清理验证**：操作完成后工作区干净吗？合并后测试仍通过吗？

**对抗自检**：

- [ ] 前置条件是否真的满足？未满足时最坏后果？
- [ ] 用户后悔时操作是否可逆？

## IRON_LAW

```
NO BRANCH COMPLETION WITHOUT TEST VERIFICATION FIRST
```

## QUALITY

| 质量维度 | 产出文件 |
| -------- | -------- |
| 测试验证 | 测试命令输出 |
| 分支处理 | 合并/PR 结果 |
| 清理确认 | 工作目录状态 |
| 知识沉淀 | `13-retrospective.md`、`15-brief.md`（编排模式） |
| 进度追踪 | `progress.md` 更新（编排模式） |

## INPUT

| 来源 | 必需 | 说明 |
|------|------|------|
| 功能分支（全部测试通过） | **required** | 待合并的工作分支 |
| `base_branch` | **required** | 合并目标分支（通常为 main/master） |
| `task-rules.md` | 可选 | 任务级规则（`mode == orchestrated` 时需合并到项目级） |
| `progress.md` | 可选 | 进度账本（`mode == orchestrated` 时需更新） |

## STEPS

### Step 1：验证测试

> 用新鲜执行结果确认代码可交付。"上次跑过了"不是证据——只有当次输出才是。

> TRAP：你会倾向于引用上一轮的测试结果来跳过重新执行。Iron Law 不允许——每次进入 finish 都必须重新运行。

**RESOLVE** `verify_cmd`（首个命中即停）：

1. `READ("05-risk.md", "§一验证计划")`（精简模式下不存在属于正常）
2. `READ("CLAUDE.md").verify_cmd` / `READ(".cursor/rules/")`
3. `READ("package.json").scripts.test` / `READ("Makefile")` / `READ("Cargo.toml")` / `READ("CI 配置")`
4. 手动验证可行（截图 / curl / 日志对比）→ 标注验证方式，继续
5. *NONE* → **NEEDS_CONTEXT**：请用户提供验证命令

**EXEC** `verify_cmd` → **ASSERT** `exit_code == 0` && `failures == 0`

- 通过 → **GOTO** Step 1.5
- 失败 → **MATCH** `mode`：
  - `orchestrated` → **ROLLBACK** 编排器，向编排器报告：建议路由到 `team-impl`（附上失败输出）
  - *DEFAULT* → **WRITE**（对话中）失败详情，推荐 `team-debug`，修复后 **GOTO** Step 1

> 不可忽略失败继续展示选项 `_team-rules/first-principles.md: First Principle #4`。

### Step 1.5：凭证泄露扫描

> 推送前最后一道安全防线。凭证泄露一旦进入远程仓库，撤回成本极高。

**EXEC** `grep -rn -E '(AK|SK|access[_-]?key|secret[_-]?key|api[_-]?key|token|password|passwd|credential)\s*[:=]' .` — 推送前凭证扫描（`team-security: RED_LINE_2`）

- **IF** `exit_code == 0` → 逐条排除占位符/测试值/注释 → 真实凭证 → **BLOCKED**，**WRITE**（对话中）凭证位置，要求修复后重新验证
- **ELSE** → **GOTO** Step 2

### Step 2：确定基准分支

> 精确找到合并目标。基准错误 = 合并到错误分支，后果比不合并更糟。

**RESOLVE** `base_branch`（首个命中即停）：

1. `READ("docs/tasks/{slug}/.checkpoint.json").base_branch`
2. `READ("CLAUDE.md").base_branch` / `READ(".cursor/rules/").default_branch`
3. `EXEC("git symbolic-ref refs/remotes/origin/HEAD")` → 解析分支名
4. **FOR** `name` **IN** [`main`, `master`, `develop`] → `EXEC("git show-ref --verify refs/heads/{name}")` 首个存在即停
5. *NONE* → **ASK_HUMAN**：向用户展示 `git branch --list` 和 `git remote -v`，让用户指定

**EXEC** `git merge-base HEAD {base_branch}` → 获取合并基点

**ASSERT** `exit_code == 0`

- 失败（分支无公共祖先）→ **BLOCKED**，触发 **ASK_HUMAN**

### Step 3：展示选项

> 让用户在完整信息下做选择。选项列表必须覆盖所有合理路径，不替用户预判。

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

> 严格按用户选择执行，不添加未要求的操作。不可逆操作必须二次确认。

> TRAP：合并成功后你会倾向于跳过重新测试（"刚才不是通过了吗"）。合并引入的代码交互可能导致回归——必须重新验证。

**MATCH** `user_choice`：

- `Option 1`（本地合并）：
  1. **EXEC** `git checkout {base_branch} && git pull`
     - **ASSERT** `exit_code == 0`
       - 失败 → **WRITE**（对话中）错误信息，**BLOCKED**
  2. **EXEC** `git merge {branch} --no-ff`
     - **IF** 合并冲突：
       - **GOTO** 子步骤 4.1
     - **ELSE**：
       - 继续下一步
  3. **EXEC** 项目测试命令 — 声明"通过"前须执行验证协议 `_team-rules/verification-protocol.md: 验证执行步骤`
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
     2. *DEFAULT* → `gh pr create --title "{slug}: {一句话描述}" --body "{变更摘要}"`
  3. **EXEC** `{pr_cmd}`
     - **ASSERT** `exit_code == 0`
       - 通过 → **WRITE**（对话中）PR URL
       - 失败 → **WRITE**（对话中）错误信息，**BLOCKED**

- `Option 3`（保留分支）：
  **WRITE**（对话中）"保留分支 {branch}。"

- `Option 4`（丢弃）：
  **ASSERT** `user_input == "discard"`
  - 未确认 → **WRITE**（对话中）"请输入 discard 确认丢弃"，重新等待
  1. **EXEC** `git checkout {base_branch}`
     - **ASSERT** `exit_code == 0`
  2. **EXEC** `git branch -D {branch}`
     - **ASSERT** `exit_code == 0`

- *DEFAULT*（无效输入）→ **WRITE**（对话中）"请选择 1-4"，重新展示选项

#### 子步骤 4.1：冲突处理

**WRITE**（对话中）冲突文件列表（不自动解决冲突）

**MATCH** `conflict_choice`：

- `A` → 手动解决冲突后继续
- `B` → 中止合并，改为创建 PR
- `C` → 中止合并，保留分支
- *DEFAULT* → **WRITE**（对话中）"请选择 A/B/C"

### Step 5：清理工作目录

> 操作完成后工作区必须干净。残留的 worktree 或未提交变更是下次操作的隐患。

> SIGNAL：`git status` 显示未提交变更 → 提交纪律不完整，有文件遗漏在 commit 之外。
> SIGNAL：`git worktree list` 仍有关联目录 → 清理未完成，可能影响后续分支操作。

**IF** `user_choice` **IN** [`Option 1`, `Option 2`, `Option 4`]：

1. **EXEC** `git worktree list`
   - **IF** `output` CONTAINS 关联工作目录 → 移除工作目录

**ELSE**：

- 无需清理

### Step 5.5：知识沉淀

> 完成是知识固化的唯一窗口。"下次再整理"等于永远不整理——知识随 context window 关闭而丢失。

> TRAP：你会因为"终于要结束了"而跳过知识沉淀。这一步的价值不亚于代码本身——未沉淀的经验下次会重复踩坑。

> SIGNAL：`task-rules.md` 存在可泛化规则但未合并到 CLAUDE.md → 知识流失，下个任务不会继承本次经验。
> SIGNAL：测试通过但没有新增测试 → 覆盖率可能存在缺口，需在 retrospective 中记录。

**IF** `mode == orchestrated`：

1. **IF** `docs/tasks/{slug}/task-rules.md EXISTS` → **READ** `task-rules.md`，将"可泛化"规则合并到项目级 CLAUDE.md / `.cursor/rules/`
2. **IF** `docs/tasks/progress.md EXISTS` → 追加本任务记录
   - **ELSE** → 创建 `progress.md`，追加记录
3. **WRITE** `docs/tasks/{slug}/13-retrospective.md`：

   ```markdown
   # 个人复盘 — {slug}

   ## 任务概要
   | 维度 | 内容 |
   |------|------|
   | 目标 | {一句话目标} |
   | 实际耗时 | {Phase 数} 个阶段，{回退次数} 次回退 |
   | 最终状态 | {DONE / DONE_WITH_CONCERNS} |

   ## 做得好的
   - {具体行为 + 产生的正面效果}

   ## 待改进的
   - {具体问题 + 建议改进方式}

   ## 新规则沉淀
   | 规则 | 触发条件 | 可执行指令 | 已合并到 |
   |------|----------|-----------|---------|
   | {规则名} | {何时适用} | {具体做什么} | 项目 CLAUDE.md / 未合并 |
   ```

4. **WRITE** `docs/tasks/{slug}/15-brief.md`：

   ```markdown
   # 答辩提纲 — {slug}

   ## 一句话总结
   {做了什么 + 为什么做 + 结果如何}

   ## 关键决策
   | 决策点 | 选择 | 拒绝方案 | 理由 |
   |--------|------|---------|------|
   | {决策} | {选项} | {备选} | {为什么} |

   ## 质量证据
   - 测试：{通过数}/{总数}，覆盖率 {N}%
   - Review：P0={N} P1={N} P2={N}（全部已修复 / 有遗留）
   - TDD 循环：{N} 个功能点，{N} 次 commit

   ## 遗留事项
   | 事项 | 严重级别 | 处理计划 |
   |------|---------|---------|
   | {事项} | P{N} | {计划} |
   ```

**ELSE**：

- 无需知识沉淀（独立使用模式）

## STOP_SIGNALS

- **展示**选项在测试未通过时
- **声明**完成在合并后未重新测试时
- **丢弃**分支前未要求用户输入 "discard"
- **执行** force-push 前未获用户明确授权

## 完成质量校准

> GOOD：测试新鲜通过 → 凭证扫描干净 → 用户选择合并 → 合并后重新测试通过 → `progress.md` 已更新 → `task-rules.md` 中可泛化规则已合并到 CLAUDE.md → 分支已删除 → 工作区干净。
> 每一步有证据链，不依赖记忆。

> BAD：引用"上次测试通过了"跳过 Step 1 → 合并后未重新测试 → `progress.md` 未更新 → `task-rules.md` 有可泛化规则但"下次再合并" → 工作区残留未提交文件。
> 典型的"终于要结束了"心态——降低标准换取速度。

## CONSTITUTIONAL_RULES

**REF** `_team-rules/constitutional-rules.md` — 10 条 Constitutional Rules
**REF** `_team-rules/first-principles.md` — 4 条第一性原理（First Principle #1 ~ #4）
**REF** `_team-rules/verification-protocol.md` — verify_cmd 解析流程与 5 步验证协议
**REF** `_team-rules/task-lifecycle.md` — 进度追踪与知识合并（§3）

分支完成阶段尤其注意：

- **Rule #1 人类介入是一等公民**：所有分支操作（合并/PR/丢弃）必须等待用户明确选择 `_team-rules/first-principles.md: First Principle #1`
- **Rule #8 验证先行**：展示选项前必须通过新鲜测试执行验证 `_team-rules/first-principles.md: First Principle #4`
- **Rule #3 产出必须验证**：合并后必须重新运行测试确认无回归 `_team-rules/first-principles.md: First Principle #4`

## SELF_CHECK

**GATE** 完成前自检（全部通过才放行）：

- [ ] **ASSERT** `exit_code == 0` && `failures == 0`（测试已通过）
- [ ] **ASSERT** `base_branch` NOT_EMPTY
- [ ] **ASSERT** `user_choice` NOT_EMPTY（用户已选择，非擅自决定）
- [ ] `[Option 4]` **ASSERT** `user_input == "discard"`
- [ ] **IF** `user_choice == Option 1` → **ASSERT** `merge_test_exit_code == 0`（合并后测试通过）
- [ ] **IF** `user_choice` **IN** [`Option 1`, `Option 2`, `Option 4`] → **ASSERT** `worktree` 已清理
- [ ] **ASSERT** `无占位符残留（{N}、{slug} 等已被实际值替换）`
- [ ] **ASSERT** `IRON_LAW 遵守` — 测试通过后才展示选项，未跳过验证
- [ ] **IF** `mode == orchestrated` → **ASSERT** `progress.md` 已更新
- [ ] **IF** `mode == orchestrated` && `task-rules.md` 有可泛化规则 → **ASSERT** 已合并到 CLAUDE.md
- [ ] 如果我明天用全新视角审视这个交付物，哪部分会让我不安？
- [ ] 我是否因为"终于要结束了"而降低了完成标准？

## COMPLETION

**REF** `_team-rules/four-state-protocol.md` — 四态完成状态

**MATCH** `result`：

- `操作成功` → **DONE**
- `操作成功但有 warning` → **DONE_WITH_CONCERNS**
- `无法确定基准分支` → **NEEDS_CONTEXT**
- `测试失败` || `合并冲突` → **BLOCKED**
- *DEFAULT* → **BLOCKED**，触发 **ASK_HUMAN**

## INTEGRATION

**被谁调用：**

- `team-orchestrator`（编排模式）
- 用户直接调用（独立使用）

**配对使用：**

- `team-review` — 合并前确认审查已完成
- `team-brainstorm` / `team-spec` — 下一个功能

## NEXT

- 分支合并完成 → 开始下一个功能的 `team-brainstorm` 或 `team-spec`
- 合并前审查未完成 → 先使用 `team-review`
