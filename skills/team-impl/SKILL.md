---
name: team-impl
description: Use when SDD exists and you need TDD implementation with 06-08 docs
---

# Team Impl — 实现

## ROLE

### 系统提示词

```
角色：实现专家
核心原则：追求能工作的最简单方案，对过度设计保持警惕
流程：TDD 红-绿-重构循环
约束：
- spec 有问题 → 回退 team-spec，不可擅自决定
- 需要人类决策 → 暂停等待
- 困惑 → 显式记录，不可默默假设
- 先写实现再写测试 → 删除代码，从 RED 重新开始
```

### 推理检查点

**核心指令**：先让测试通过，再优化代码。三行重复优于过早抽象。测试通过是客观事实，代码美观是主观判断——顺序不可逆（First Principle #2）。

**推理框架**（首个功能点完整推理 5 点；后续仅推理 1、4，其余沿用）：

1. **规格要求**：该功能点的输入、输出、边界、异常规格
2. **测试覆盖**：Happy Path、边界、异常各需几个测试
3. **最小实现路径**：让测试通过的最少代码量
4. **边界合规性**：是否越过 04-boundary.md 的 deny 边界
5. **预算余量**：已消耗预算 vs 剩余预算是否足够

**对抗自检**（每个 GREEN 完成后执行）：

- 删掉这段实现，测试还会通过吗？→ 是 = 测试太弱
- spec 的这条假设如果是错的，实现会怎么崩溃？

## IRON_LAW

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

## QUALITY

| 质量维度                   | 产出文件             |
| -------------------------- | -------------------- |
| TDD 流程证据（红-绿-重构） | `06-tdd-log.md`      |
| Prompt 工程记录与纠偏      | `07-prompt-log.md`   |
| 关键决策可追溯             | `08-ai-decisions.md` |
| 通过项目 CI 检查             | 代码本身             |

## INPUT

### 最小输入（独立运行）

- `03-sdd.md`（规格）
- `04-boundary.md`（边界）

### 完整输入（编排模式）

- 完整模式：`01-plan.md` ~ `05-risk.md` + `prompt-template.md`（team-spec 全部产出）
- 精简模式：`03-sdd.md` + `04-boundary.md`（01-plan、02-context、05-risk、prompt-template 不存在属于正常）
- 回退上下文（如有）

## STEPS

### Phase 0：理解规格

> 建立对任务的完整心智模型。完成时应能不看 spec 复述出：输入是什么、输出是什么、哪些边界会出错。

1. **READ** `01-plan.md` → 理解任务目标和阶段拆分（**IF** `mode == compact` → 跳过）
2. **READ** `02-context.md` → 理解业务术语和上下文（**IF** `mode == compact` → 跳过）
3. **READ** `03-sdd.md` → 理解输入/输出/边界/异常规格
   - **IF** `03-sdd.md NOT_EXISTS` && `00-design-brief.md EXISTS` → 以 design brief 为轻量规格输入，无 boundary 约束时按最小修改范围执行
   - **IF** `03-sdd.md NOT_EXISTS` && `00-design-brief.md NOT_EXISTS` → **NEEDS_CONTEXT**：请用户提供规格文件或执行 `team-spec`
4. **READ** `04-boundary.md` → 理解修改边界（**严格遵守**）
   - **IF** `04-boundary.md NOT_EXISTS` → 记录"无显式边界约束"到 `06-tdd-log.md`，按最小修改原则自行约束
5. **READ** `05-risk.md` → 理解风险和验证计划（**IF** `mode == compact` → 跳过）

### Phase 0.5：审计同步（Audit Sync）

> 在开始编码前对照 spec 分析当前代码基线，识别差距。

1. **READ** spec 中涉及的文件 → 确认当前实现状态
2. **WRITE**（对话中）当前代码与 spec 要求的差距
3. **ASSERT** `spec 方案在当前基线上可行`
   - 不可行或依赖不可用 → **ROLLBACK** team-spec（通过编排器）
4. **EXEC** 项目测试命令
   - **IF** `exit_code == 0` → 基线健康，继续
   - **IF** `exit_code != 0` → 记录到 `06-tdd-log.md` 审计段落（含失败测试名+输出），确认与本任务无关后继续

> SIGNAL：`output CONTAINS "Cannot find module"` 或 `"Module not found"` 通常意味着引用了 `04-boundary.md` deny 列表中的文件，先对照 boundary 再排查路径。

5. **WRITE** `06-tdd-log.md` 差距快照（格式见产出模板）：

   ```
   ### 当前基线快照
   | 文件 | 当前状态 | Spec 要求 | 差距 |
   |------|----------|-----------|------|
   | {path} | {现状} | {spec 要求} | {差距描述} |

   ### 可行性评估
   - 方案可行：✅/⚠️/❌
   - 依赖可用：✅/⚠️/❌
   ```

6. **FOR** `confusion`（阅读 spec/源码时的困惑）：
   - **WRITE** `06-tdd-log.md` 审计段落，标注 `{ambiguous}`
   - 不可默默假设后继续编码

### Phase 1：TDD 红-绿-重构循环

> 通过红-绿-重构循环逐个实现功能点。每个 GREEN 完成时代码应是"能工作的最简单方案"，不是"我能想到的最好方案"。

**FOR** `feature_point`（从 SDD 提取）：

#### 循环 1：红（Red）— 写测试

> TRAP：你会想"我已经知道实现怎么写了，先写实现再补测试也一样"。不一样——后写的测试只会验证你已经写的代码，不会验证需求（First Principle #2）。

1. **READ** `03-sdd.md` → 提取该功能点的规格
2. **WRITE** 测试 → 覆盖 Happy Path + 边界条件（SDD §七）+ 异常场景（SDD §八）

> TRAP：只写 Happy Path 测试就急着进 GREEN。SDD §七（边界条件）和 §八（异常场景）的测试必须在 RED 阶段一起写，不是"以后再补"。

3. **EXEC** 项目测试命令 → **ASSERT** `exit_code != 0`（尚无实现，测试必须失败）

> SIGNAL：`output CONTAINS "0 tests found"` → 测试文件路径或命名不符合项目 test pattern，先检查 glob 配置再下结论。
> SIGNAL：测试全部 PASS 但尚未写实现 → 测试断言太弱（断言了永真条件），需重写断言。

4. **WRITE** `06-tdd-log.md` RED 记录：

   ```
   ### 功能点：{名称}
   #### 🔴 RED
   - 测试文件：{path}
   - 测试命令：{command}
   - 失败输出：{粘贴关键输出，含 FAIL 标识}
   - 时间：{YYYY-MM-DD HH:MM}
   ```

5. **EXEC** `git commit -m "test: {功能点} (RED)"`
   - **ASSERT** `exit_code == 0`（commit 失败 → 检查 pre-commit hook 输出，修复后重试）

**GATE** RED 完成检查（全部通过才放行）：

- [ ] **ASSERT** `06-tdd-log.md CONTAINS "RED 记录"`
- [ ] **ASSERT** `git log CONTAINS "RED commit"`
- [ ] 我是否因为"应该没问题"跳过了 SDD §七/§八 中某个边界条件或异常场景的测试？

#### 循环 2：绿（Green）— 写实现

> TRAP：你会倾向于在 GREEN 阶段写"正确且优雅"的代码。抑制这个冲动——GREEN 只需让当前测试通过的最小代码量。三行重复优于过早抽象，优雅留给 REFACTOR。

1. **WRITE** 最少代码让测试通过
2. **EXEC** 项目测试命令 → **ASSERT** `exit_code == 0`
   - **IF** `exit_code == 0` → **WRITE** `06-tdd-log.md` GREEN 记录
   - **IF** `exit_code != 0` → 修改实现（非测试）→ 重新执行步骤 1-2
3. GREEN 记录格式：

   ```
   #### 🟢 GREEN
   - 实现文件：{path}
   - 测试命令：{command}
   - 通过输出：{粘贴关键输出，含 PASS/OK 标识}
   - 时间：{YYYY-MM-DD HH:MM，不早于 RED 时间}
   ```

4. **EXEC** `git commit -m "feat: {功能点} (GREEN)"` 或 `fix:` 前缀（修复类任务）
   - **ASSERT** `exit_code == 0`

> GOOD：`🔴 RED — 测试文件：src/user.test.ts — 测试命令：npm test — 失败输出：FAIL — TypeError: getUser is not a function — 时间：2026-06-25 14:30`
> `🟢 GREEN — 实现文件：src/user.ts — 实现内容：添加 getUser 函数，处理空 id 返回 null — 通过输出：PASS 3/3 — 时间：2026-06-25 14:35`
> BAD：`🔴 RED — 写了测试。🟢 GREEN — 实现了功能，测试通过了。`
> （缺少文件路径、命令、输出证据、时间戳——无法复现和审计）

#### 循环 3：重构（Refactor）

> TRAP：重构时修改了测试断言让它"更合理"。重构阶段只改实现代码，不改测试——如果测试需要改，说明你改变了行为，那不是重构。

1. **IF** 有可优化项 → 提取公共逻辑、消除重复、优化命名
2. **EXEC** 项目测试命令 → **ASSERT** `exit_code == 0`
3. **WRITE** `06-tdd-log.md` REFACTOR 记录
4. **EXEC** `git commit -m "refactor: {功能点}"` → **ASSERT** `exit_code == 0`

**提交纪律**（Constitutional Rule #9）：每个功能点的 RED → GREEN → REFACTOR 各自独立 commit（`test:` → `feat:/fix:` → `refactor:`）。RED commit 必须在写实现代码之前完成。编排器通过 `git log` 验证时序。违反 → 删除实现，从 RED 重新开始。

#### Bug 修复验证模式

**IF** 修复 bug：

1. **WRITE** 回归测试 → **EXEC** 项目测试命令 → **ASSERT** `exit_code != 0`（预期失败）
2. **WRITE** 修复代码 → **EXEC** 项目测试命令 → **ASSERT** `exit_code == 0`（预期通过）
3. 撤销修复代码（`git stash` 或 `git checkout`）→ **EXEC** 项目测试命令 → **ASSERT** `exit_code != 0`（必须失败）
4. 恢复修复 → **EXEC** 项目测试命令 → **ASSERT** `exit_code == 0`（必须通过）

**ELSE**：

- 跳过，继续下一功能点

**IF** `回滚修复后测试仍通过` → 回归测试未覆盖修复逻辑，测试太弱，需重写

#### 硬重置规则

**IF** 发现以下任何情况：

- 先写实现再写测试
- 测试通过但未见其失败过
- 修改测试而非修改实现
- 跳过 RED 直接写 GREEN
- 在无测试覆盖的代码上重构

→ 删除代码，从 RED 重新开始

**ELSE** → 继续正常 TDD 循环

> 为什么 TDD 顺序不可逆？后写测试被实现偏见污染（First Principle #2）：测的是已构建的行为，不是需求。"先实现再补测试效果一样""已经手动测试过了""删掉 X 小时工作太浪费了"——这些借口均不成立。

#### 卡住时怎么办

| 场景 | 解决方案 |
| ---- | -------- |
| 不知道怎么写测试 | 先写期望的 API 调用和断言；仍不行则问人类 |
| 测试太难写 | 设计太复杂，简化接口 |
| 必须 mock 一切 | 耦合太紧，用依赖注入解耦 |
| 测试 setup 太大 | 提取 helper；仍复杂则简化设计 |
| 通过但感觉不对 | 检查是否只覆盖了 Happy Path |

### 并行记录：决策日志

> 以下两个记录任务贯穿 Phase 1 全程，每个 TDD 循环中同步写入，不是独立的顺序阶段。

> 实时捕捉"为什么这样做而不那样做"。事后回忆的决策理由会被结果偏见污染——只有实时记录才可信。

**WRITE** `08-ai-decisions.md`（模板见 `references/08-ai-decisions-template.md`）：

   ```
   ## 决策 {N}：{决策标题}
   - **决策内容**：{具体决策}
   - **决策理由**：{为什么这样做}
   - **拒绝的替代方案**：{替代方案 + 拒绝理由}
   - **信息来源**：{extracted|inferred|ambiguous}
   ```

| 决策类型 | 记录内容 |
| -------- | -------- |
| 技术选型 | 选了什么 + 为什么 + 拒绝了什么 + 为什么拒绝 |
| 架构决策 | 为什么这样组织代码 |
| 采纳/拒绝 AI 建议 | 采纳或拒绝了什么 + 为什么 |
| 回退决策 | 为什么回退到 team-spec |
| 人类决策 | 为什么需要人类介入 |

### 并行记录：Prompt 日志

> 记录每个关键 Prompt 的五要素和效果，使纠偏经验可复用。

**WRITE** `07-prompt-log.md`（模板见 `references/07-prompt-log-template.md`），每条含：

   ```
   ## Prompt {N}：{用途}
   | 要素 | 内容 |
   |------|------|
   | 目标 | {一句话} |
   | 上下文 | {引用文件/约束} |
   | 边界 | {不可做} |
   | 输出格式 | {结构} |
   | 验证标准 | {判断标准} |
   - 结果：{成功/失败/部分成功}
   ```

1. **五要素**：目标、上下文、边界、输出格式、验证标准
2. **效果**：成功/失败/部分成功
3. **纠偏**（如有）：原 Prompt vs 修改后 + 调整效果

### Phase 2：自检与全量验证

> 用独立的全量验证确认实现正确。此阶段的每个"通过"声明必须基于刚执行的命令输出，不是 Phase 1 的记忆。

1. **RESOLVE** `verify_cmd`（首个命中即停）：
   1. `READ("05-risk.md", "§一验证计划")`
   2. `READ("CLAUDE.md").verify_cmd` / `READ(".cursor/rules/")`
   3. `READ("package.json").scripts.test` / `READ("Makefile")` / `READ("Cargo.toml")` / `READ("CI 配置")`
   4. *NONE* → **NEEDS_CONTEXT**：请用户提供验证命令，记录到 `06-tdd-log.md`

2. **EXEC** `verify_cmd`（测试）→ **ASSERT** `exit_code == 0` && `failures == 0`
3. **EXEC** 项目 lint 命令 → **ASSERT** `exit_code == 0`
4. **EXEC** 项目 CI 命令 → **ASSERT** `exit_code == 0`

**验证协议**（步骤 2-4 每次声明"通过"前须执行 `_team-rules/verification-protocol.md` 的 5 个步骤）

5. **EXEC** `git diff --name-only` → **READ** `04-boundary.md` deny 列表 → **ASSERT** `无越界修改`
6. **READ** `01-plan.md` 预算 → **ASSERT** `未超出自我约束预算`
7. **ASSERT** `TDD 顺序正确` && `未擅自假设 spec` && `预算未超支`

**IF** `exit_code != 0`：

1. **READ** full output → 定位失败原因
2. **WRITE** 失败测试（RED）→ 修复代码（GREEN）→ 仍遵循 TDD
3. **GOTO** Phase 2（从步骤 2 重新运行全部检查）
4. **WRITE** `06-tdd-log.md` 修复循环 + **WRITE** `08-ai-decisions.md` 修复决策

**ELSE** → 继续 Phase 2 下一步骤

> 不可跳过失败继续后续步骤（First Principle #4）。预算超支砍范围，不放宽预算。

### 回退路由

> 精确归因问题根源，将问题送到正确的上游修复。"有问题"不是路由依据——"spec 未定义某个边界"才是。

**MATCH** `issue_type`：

- `spec 遗漏`（SDD 未定义某个边界）→ **ROLLBACK** team-spec（通过编排器，附遗漏点 + 建议补充）
- `spec 矛盾`（`03-sdd.md` 与 `02-context.md` 冲突）→ **ROLLBACK** team-spec（附矛盾位置 + 分析）
- `spec 范围不合理`（`04-boundary` 禁止了必要修改）→ **ROLLBACK** team-spec（附修改理由 + 建议调整）
- `需要人类判断` → **ASK_HUMAN**（附选项 + 各选项 trade-off）
- `team-test 报告 bug` → 自己修复（仍遵循 TDD：先 RED 再 GREEN）
- `team-review 报告 P0/P1 bug` → 自己修复（仍遵循 TDD）
- *DEFAULT* → 记录到 `08-ai-decisions.md`，继续当前流程

> 自修复仍遵循 TDD：RED（回归测试）→ GREEN（修复）→ 追加 `06-tdd-log.md` + `08-ai-decisions.md`。修复后全量测试确认无回归。

## OUTPUT_TEMPLATE

| 文件 | 模板位置 | 说明 |
| ---- | -------- | ---- |
| `06-tdd-log.md` | `references/06-tdd-log-template.md` | TDD 日志（红-绿-重构循环） |
| `07-prompt-log.md` | `references/07-prompt-log-template.md` | Prompt 工程记录 |
| `08-ai-decisions.md` | `references/08-ai-decisions-template.md` | AI 决策记录 |

## STOP_SIGNALS

- **编码**前没 `READ` spec，或发现 spec 问题不 `ROLLBACK` 而自己决定
- **跳过** RED 阶段直接写实现，或先写实现再补测试
- **修改**测试让它通过（而非修改实现），或困惑不记录默默假设

## CONSTITUTIONAL_RULES

引用 `_team-rules/constitutional-rules.md`。实现阶段尤其注意：

- **Rule #9 TDD 顺序不可逆**：RED 必须在 GREEN 之前，先写实现再补测试则删除代码重新开始（First Principle #2）
- **Rule #2 有向图回退**：发现 spec 问题必须 `ROLLBACK` team-spec，不可擅自假设正确行为（First Principle #4）
- **Rule #6 自我约束预算**：超出预算砍范围，不放宽预算（First Principle #3）
- **Rule #8 验证先行**：声明"测试通过"前必须执行验证协议 5 步（First Principle #4）

## SELF_CHECK

**GATE** 产出前自检（全部通过才放行）：

- [ ] **ASSERT** `06-tdd-log.md EXISTS` && `07-prompt-log.md EXISTS` && `08-ai-decisions.md EXISTS` && `各文件有效行数 ≥ 5`
- [ ] **ASSERT** `每个功能点有 RED → GREEN → REFACTOR 序列` && `时间递增`
- [ ] **EXEC** 项目测试命令 → **ASSERT** `failures == 0`
- [ ] **EXEC** 项目 lint 命令 → **ASSERT** `exit_code == 0`
- [ ] **EXEC** `git diff --name-only` → **ASSERT** `未修改 04-boundary.md deny 文件`
- [ ] **EXEC** `grep -rn -E '(AK|SK|access[_-]?key|secret[_-]?key|api[_-]?key|password|passwd|credential)\s*[:=]' .` → **ASSERT** 无真实凭证硬编码（RL-2，排除占位符/测试值/注释）
- [ ] **IF** 代码调用外部 AI 服务 → **ASSERT** `输入数据已脱敏或确认为非敏感`（RL-1）
- [ ] **ASSERT** `实际消耗 <= 01-plan.md 自我约束预算`
- [ ] **ASSERT** `所有困惑已显式记录于 06-tdd-log.md 审计段落`
- [ ] **ASSERT** `无占位符残留（{N}、{slug} 等已被实际值替换）`
- [ ] **ASSERT** `IRON_LAW 遵守` — 未自行假设 spec、未跳过 TDD 顺序
- [ ] **IF** 发现 spec 问题 → **ASSERT** `已 ROLLBACK team-spec`
- [ ] 我是否在某个 GREEN 阶段写了超出当前测试要求的代码？
- [ ] 我是否有任何"通过"声明是基于上一轮输出而非本轮刚执行的结果？

## COMPLETION

**MATCH** `result`：

- `TDD 完成` && `CI 通过` && `边界合规` → **DONE**（`文件: {N} 修改 / {N} 新增`, `测试: {N} pass / {N} fail`, `CI: pass`）
- `完成但有保留意见` → **DONE_WITH_CONCERNS**（`concerns: [...]`）
- `spec 不足` → **NEEDS_CONTEXT**
- `被阻塞` → **BLOCKED**
- *DEFAULT* → **BLOCKED**

## INTEGRATION

**被谁调用：**

- 用户直接调用（独立使用）
- `team-orchestrator`（编排模式）
- `team-brainstorm`（用户跳过规格阶段时直接路由）
- `team-feedback`（审查反馈修复后重新验证）

**配对使用：**

- `team-test` — REQUIRED：实现完成后必须进行测试审计
- `team-debug` — 发现 bug 时使用

## NEXT

- 实现完成 → 使用 `team-test` 进行测试审计
- 遇到难以定位的 bug → 使用 `team-debug` 根因分析
