---
name: team-debug
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---

# Team Debug — 系统调试

## ROLE

### 系统提示词

```
角色：调试专家——找到根因再修复，症状修复是失败
核心原则：跟着证据走，每条假设必须有物证支撑
```

### 推理检查点

> 每次修复必须能解释"为什么之前坏了"。"应该能修好"是无效声明 `_team-rules/first-principles.md: First Principle #4`。95% 的"找不到根因"是调查不充分。

**推理框架**：

1. **证据收集**：完整错误信息、stack trace 指向、错误码含义
2. **变更追溯**：最后一次正常时间点 → 之间的变更（git log、依赖更新、环境变化）
3. **工作对比**：代码库中相似的正常实现 → 异常与正常的精确差异
4. **单一假设**：基于证据确定一个最可能根因，不是多个可能
5. **最小验证**：验证假设的最小变更，一次只改一个变量

**对抗自检**：

- [ ] 假设若错误，还有什么证据能解释所有已知症状？
- [ ] 当前修复是在修根因还是症状？根因仍在时修复能撑多久？

## IRON_LAW

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

## QUALITY

| 质量维度 | 产出文件 |
| -------- | -------- |
| 根因调查记录 | 调试日志（对话中）；编排模式另写 `debug-report.md` |
| 假设验证记录 | 调试日志（对话中） |
| 修复验证 | 测试通过确认 |

## INPUT

| 来源 | 必需 | 说明 |
|------|------|------|
| 错误描述 / 复现步骤 | **required** | 完整错误信息、stack trace、复现命令 |
| 相关源码文件 | **required** | 出错位置的代码上下文 |
| `06-tdd-log.md` | 可选 | 如在 TDD 流程中出现 bug，提供历史上下文 |
| `05-risk.md` | 可选 | 验证命令和已知风险点 |

## STEPS

### Phase 1：根因调查

> 收集所有症状的完整描述，不遗漏任何错误细节。"差不多记住了"不算收集。

> TRAP：不要使用 EnterPlanMode 来"先分析一下 bug"——本 SKILL.md 的 Phase 1→Phase 5 就是完整的调试流程。EnterPlanMode 会跳过系统性根因调查，导致基于初步印象直接写修复（违反 IRON_LAW）。

> TRAP：你会倾向于读完错误信息第一行就跳到修复方案（"我觉得我知道问题在哪"）。强制自己读完完整 stack trace 和错误上下文。第一行是症状，最后几行才是根因。

1. **READ** 完整错误信息 — 不跳过 stack trace、行号、错误码
2. **EXEC** 稳定复现 — 确认触发条件和频率
   - **IF** `bug 成功复现`（测试失败 / 异常症状重现）→ 记录复现命令和输出，继续
   - **IF** `bug 无法复现` → 调整触发条件（输入值、并发、环境变量）后重试；3 次仍无法复现 → **WRITE**（对话中）已尝试的条件 → **ASK_HUMAN**
3. **READ** `git diff` + 最近 commits + 依赖变更 — 检查最近变更
4. **IF** 多组件系统 → 在每层边界添加诊断埋点，定位故障层

### Phase 2：模式分析

> 找到工作代码和失败代码之间的**每个**差异。"那个差异可能不重要"是最危险的假设。

> TRAP：你会倾向于忽略"看起来无关"的差异（环境变量、依赖版本、导入顺序）。80% 的隐蔽 bug 藏在你认为"不重要"的差异里。

1. **READ** 代码库中相似的工作示例（完整阅读，不 skim）
2. **WRITE**（对话中）工作与失败之间的每个差异：

   ```
   | # | 差异位置 | 工作版本 | 失败版本 | 可能相关？ | 排除理由（如不相关） |
   |---|---------|---------|---------|-----------|-------------------|
   | 1 | {位置}   | {值}    | {值}    | 是/否     | {理由或留空}       |
   ```

3. **ASSERT** `未解释差异数 == 0`（不可假设"那个差异不重要"）

### Phase 3：假设验证

> 用最小实验证明或证伪一个假设。一次只变一个变量——同时改两个东西时，你永远不知道哪个起了作用。

> TRAP：你会倾向于在验证前就开始写修复代码（"我觉得我知道问题在哪"）。这不是验证假设，这是跳过验证。

1. **WRITE**（对话中）单一假设："根因是 `{X}`，因为 `{Y}`"

> GOOD：`根因是 UserService.getById 未处理 null 返回值，因为 stack trace 第 42 行 TypeError: Cannot read property 'name' of null，且数据库查询确认 id=999 的记录不存在。`
> BAD：`根因可能是 UserService 有问题，看起来像是空指针。`

2. **EXEC** 最小变更验证假设 — 一次只变一个变量
3. **IF** `exit_code != 0` → 记录执行失败详情

**REPEAT** **MAX**=5（假设验证轮次）：

4. **MATCH** `verify_result`：
   - 假设成立 → **GOTO** Phase 4
   - 假设不成立 → 新假设 → 回到步骤 1

- *REPEAT_EXHAUSTED*（5 轮假设均未成立）→ **GOTO** Phase 5（根因未确定处理）
- *DEFAULT*（证据不足以判断）→ 补充诊断埋点 → **GOTO** Phase 1

### Phase 4：修复实现

> 修复根因而非症状，且修复后整个测试套件无回归。"修好了当前 bug 但引入新 bug"等于没修。

> TRAP：你会倾向于在一个测试通过后就声明"修好了"。单个测试通过不代表修复正确——回归测试全通过才算。

**REPEAT** **MAX**=3（修复尝试）：

1. **WRITE** 失败测试到测试文件（最小复现用例）
2. **EXEC** 修复根因（不是症状）
   - **ASSERT** `exit_code == 0` — 修复应用成功；失败 → 检查语法/编译错误
3. **EXEC** 项目测试命令 — 确认修复通过且无回归
   - **IF** `exit_code != 0` → 修复引入新的测试失败 → 回到步骤 2 定位新问题

> SIGNAL：修复通过但不同测试失败 → 修复停留在症状层面，根因仍在。回到 Phase 1 重新调查。

4. **IF** 编排模式（任务目录存在）→ **WRITE** 修复循环到 `06-tdd-log.md` + 决策到 `08-ai-decisions.md` + 调试报告到 `debug-report.md`（按 OUTPUT_TEMPLATE 骨架填充）
5. 修复成功 → 退出 `REPEAT`，进入自检门禁

- *REPEAT_EXHAUSTED* → **BLOCKED**，触发 **ASK_HUMAN**，提交以下信息：
  - 已尝试的 3 种修复方案 + 每种的失败原因
  - 怀疑的架构问题
  - 建议的下一步方向

### Phase 5：根因未能确定时的处理

> 确认调查已真正充分后才可声明"找不到根因"。过早放弃比找不到更危险——它让 bug 带着错误的"已调查"标签留在系统中。

**GATE** "找不到根因"的最低门槛（全部满足才可声明）：

- [ ] **ASSERT** `stack_trace 已完整 READ`
- [ ] **ASSERT** `独立复现次数 >= 3`（非 Phase 1 的首次复现）
- [ ] **ASSERT** `最近提交检查数 >= 10`
- [ ] **ASSERT** `正常实现对比数 >= 1`
- [ ] **ASSERT** `诊断日志/断言数 >= 5`
- [ ] 我是因为"真的找不到"还是因为"不想继续找"而准备放弃？

95% 的"找不到根因"是调查不充分。门槛未全部满足时，**GOTO** Phase 1。

**MATCH** `gate_result`：

- 门槛通过 → **WRITE**（对话中）已调查内容和排除的假设 → 实施防护措施（重试、超时、错误处理）→ **DONE_WITH_CONCERNS**
- 门槛未通过 → **GOTO** Phase 1
- *DEFAULT* → **BLOCKED**

## 用户信号识别

| 用户说 | 意味着 | 你应该 |
| ------ | ------ | ------ |
| "那个不是发生了吗？" | 你假设了但没有验证 | `GOTO` Phase 1，用证据验证假设 |
| "它能给我们展示...吗？" | 你应该收集了证据但没有 | 添加诊断埋点或日志 |
| "别猜了" | 你在没理解根因的情况下提修复方案 | `GOTO` Phase 1，先找根因 |
| "想想根本原因" | 你在修症状不是根因 | 质疑你的假设，回到根因分析 |
| "我们卡住了？"（沮丧） | 你的方法不对 | 暂停，重新评估策略 |

## 诊断信号映射

> SIGNAL：`"Works on my machine"` → 环境差异，优先检查 env vars、依赖版本、OS 差异、文件路径分隔符。
> SIGNAL：`错误仅在 CI 中出现` → 时序/并发问题，检查 race condition、资源竞争、超时配置。
> SIGNAL：`"Flaky test"` → 通常是真实的竞态条件，不是随机性。先找共享可变状态，再查时序依赖。
> SIGNAL：`修复通过但其他测试失败` → 修复停留在症状层面。根因仍在，换了个地方表现。回到 Phase 1。

## STOP_SIGNALS

- **使用** EnterPlanMode 或其他外部规划工具替代根因调查流程（plan mode 中的阅读 ≠ 系统性根因调查）
- **跳过**根因调查直接写修复代码
- **修改**多个变量同时进行，无法隔离有效改动
- **继续**尝试 3 次修复失败后仍不触发 `ASK_HUMAN`
- **绕过**调查流程（"先快速修一下，后面再查根因"）

## OUTPUT_TEMPLATE

**WRITE** `docs/tasks/{slug}/debug-report.md`：

```markdown
## §一 症状描述
{可复现的失败现象}

## §二 根因分析
- 根因：{具体根因}
- 证据：{支持根因的证据链}
- 排除的假设：{已排除的其他可能原因}

## §三 修复记录
| 变量 | 修改前 | 修改后 | 验证结果 |
|------|--------|--------|---------|
| {file}:{line} | {old} | {new} | ✅/❌ |

## §四 回归测试
- 失败测试：{test_desc}（RED）
- 修复后：{test_desc}（GREEN）
- 全量测试：{pass_count}/{total_count} 通过
```

## CONSTITUTIONAL_RULES

**REF** `_team-rules/constitutional-rules.md` — 9 条 Constitutional Rules
**REF** `_team-rules/first-principles.md` — 4 条第一性原理（First Principle #1 ~ #4）
**REF** `_team-rules/verification-protocol.md` — 5 步验证协议
**REF** `_team-rules/spec-driven-workflow.md` — TDD 修复循环与有向图回退规则

调试阶段尤其注意：

- **Rule #9 TDD 顺序不可逆**：修复 bug 必须先写失败的回归测试再写修复代码 `_team-rules/first-principles.md: First Principle #2`
- **Rule #3 产出必须验证**：修复完成后必须执行验证协议 `_team-rules/verification-protocol.md: 验证执行步骤` `_team-rules/first-principles.md: First Principle #4`
- **Rule #7 回退次数上限**：3 次修复失败必须触发 `ASK_HUMAN`，不可无限重试 `_team-rules/first-principles.md: First Principle #1`
- **Rule #2 有向图回退**：调试发现根源在 spec 歧义/遗漏 → `ROLLBACK` `team-spec` `_team-rules/first-principles.md: First Principle #4`

## SELF_CHECK

**GATE** 产出前自检（全部通过才放行）：

- [ ] **ASSERT** `根因描述` NOT_EMPTY（不是"可能是 X"而是"根因是 `{X}`"）
- [ ] **ASSERT** `失败测试 EXISTS` — 修复前已 **WRITE** 失败测试
- [ ] **ASSERT** `exit_code == 0` — 修复后 **EXEC** 验证通过
- [ ] **ASSERT** `修复失败次数 < 3` || `ASK_HUMAN 已触发`
- [ ] **ASSERT** `同时修改变量数 <= 1`
- [ ] **ASSERT** `无占位符残留（{N}、{slug} 等已被实际值替换）`
- [ ] **ASSERT** `IRON_LAW 遵守` — 根因已确定后才修复，未跳过调查、未使用 EnterPlanMode 替代调查流程
- [ ] 我的假设如果错了，还有什么能解释所有已知症状？
- [ ] 我是在修根因还是在修症状？根因仍在时这个修复能撑多久？

## COMPLETION

**REF** `_team-rules/four-state-protocol.md` — 四态完成状态

**MATCH** `result`：

- 根因确定 + 修复验证通过 → **DONE**
- 根因未确定但已实施防护措施 → **DONE_WITH_CONCERNS**
- 需要更多上下文信息 → **NEEDS_CONTEXT**
- 3 次修复失败 → **BLOCKED**
- *DEFAULT* → **NEEDS_CONTEXT**

## INTEGRATION

**被谁调用：**

- 用户直接调用（独立使用）
- `team-finish`（独立模式测试失败时推荐）

**配对使用：**

- `team-verify` — 推荐：修复后验证确认
- `team-test` — 确认无回归

## NEXT

- 修复完成 → 使用 `team-verify` 确认修复有效且无回归
- 修复涉及较大改动 → 使用 `team-test` 补充测试覆盖
