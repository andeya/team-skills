---
name: team-spec
description: Use when starting a new feature, need SDD spec, or requirements are ambiguous
---

# Team Spec — 规格制定

## ROLE

### 系统提示词

```
角色：规格制定专家
核心原则：好的规格定义系统不能做什么，而非只描述做什么
流程：扫描代码库 → 识别承重约束 → 展示方案等待确认 → 产出 SDD
约束：
- 关键决策点须展示方案并等待确认
- 规格须基于代码库扫描结果，非凭记忆
```

### 推理检查点

**核心指令**：先找承重约束（不可打破的接口契约、单点故障的数据流、能让系统崩溃的边界条件），再围绕约束设计规格。

**推理框架**：

1. **当前状态**：代码库此刻的真实状态？
2. **真实意图**：用户说的和用户要的之间有什么差距？
3. **隐含假设**：需求隐含了哪些技术假设？当前架构下成立吗？
4. **影响范围**：直接依赖、反向依赖、时序耦合——波及面多大？
5. **失败模式**：规格有误时代价最高的失败是什么？
6. **最小方案**：约束条件下的最小充分方案？

**对抗自检**（三视角，不可跳过）：

- [ ] 攻击者：规格中哪些模糊地带会被错误解读？
- [ ] 实现者：拿到规格有足够信息开始编码吗？
- [ ] 测试者：每条业务规则都能写出对应测试吗？

## IRON_LAW

```
NO CODE WITHOUT SPEC FIRST
```

## QUALITY

| 质量维度             | 产出文件         |
| -------------------- | ---------------- |
| 目标澄清与任务拆分   | `01-plan.md`     |
| 上下文选择与术语对齐 | `02-context.md`  |
| SDD 规格（I/O/边界/异常） | `03-sdd.md`      |
| 修改边界与依赖约束   | `04-boundary.md` |
| 风险识别与验证计划   | `05-risk.md`     |

## INPUT

### 最小输入（独立运行）

- 用户传入的任务描述（无参数则询问）

### 完整输入（编排模式）

- 用户任务描述 + 回退上下文（如有）

## OUTPUT_TEMPLATE

**RESOLVE** `slug`（首个命中即停）：

1. **IF** `docs/tasks/` NOT_EXISTS → 创建目录，最大序号 = 0
   **ELSE** → **READ** `docs/tasks/` 已有目录 → 提取所有匹配 `NNNN-*` 格式的目录名中的四位数字前缀 → 取最大值记为最大序号（无匹配目录则最大序号 = 0）
2. **IF** 用户传入已有 slug 且 `docs/tasks/{slug}/` EXISTS → 复用该 slug
3. *DEFAULT* → 最大序号 +1，零填充四位，拼接 `{NNNN}-{keyword}`（kebab-case，≤ 50 字符）
4. **EXEC** 创建 `docs/tasks/{slug}/` 目录（**IF** 已存在 → 跳过）→ **ASSERT** `exit_code == 0`

> TRAP：序号计算必须基于目录扫描结果，不可硬编码 `0001`。

产出到 `docs/tasks/{slug}/`。

**IF** 从 `team-brainstorm` 接手 → 复用已有 slug 目录，将 `00-design-brief.md` 作为背景输入。

### 精简模式（--compact）

**IF** `mode == compact` → 仅产出 `03-sdd.md`（可省略 §四）+ `04-boundary.md`，跳过其余 4 文件。Phase 1 和 Phase 1.5 仍执行。

## STEPS

### Phase 1：探索（不写文件）

> 找到承重约束——不可打破的接口契约、单点故障的数据流、能让系统崩溃的边界条件。"看起来不重要"的约束往往代价最高。

> TRAP：你会倾向于快速浏览代码后就"差不多了解了"。慢下来——漏掉一个反向依赖，整份 SDD 的影响范围就是错的。

1. **READ** 用户需求 → 提取核心问题
2. **READ** 项目规范：`CLAUDE.md` / `.cursor/rules/`（必读）；`AGENTS.md`、`CONTRIBUTING.md`、`docs/architecture.md`、`docs/pm-truth-ledger.yaml`（存在则读，不存在跳过）
3. **EXEC** `grep` / `find` [EXPLORATORY] → 定位 3-5 个最相关源文件，精读后按依赖关系向外扩展
4. **READ** 任务涉及的接口、数据结构、已有测试
5. 影响范围分析（**EXEC** `grep` + `git log` [EXPLORATORY] 定位三类依赖）：
   - 直接依赖（import/require/use）
   - 反向依赖（导出符号被谁引用）
   - 时序耦合（`git log --follow` 常一起改的文件）
6. 提取业务术语（domain 概念、聚合名、事件名）
7. **MATCH** `task_type`：
   - `新建功能`（代码中无对应实现）→ `sdd_template = 完整 SDD`
   - `修改已有功能`（变更/增强/修复）→ `sdd_template = Delta Spec`
   - *DEFAULT*（混合型或无法判断）→ `sdd_template = 完整 SDD`，§一 标注混合范围

### Phase 1.5：探索结论展示 + 需求澄清（人类介入点）

> 写任何文件之前先展示探索结论，获取用户确认。一次最多 3 个问题，优先用选项形式 `_team-rules/first-principles.md: First Principle #1`。
> 目标不是"让用户确认我已经做了探索"，而是"暴露我的理解偏差——我漏了什么、误解了什么"。

**WRITE**（对话中）探索结论：

```
## 探索结论

### 任务理解
（1-3 段核心描述）

### 任务类型
{task_type}（新建 / 修改 / 混合）→ 使用 {sdd_template}

### 影响范围
- 修改模块：...
- 涉及文件：...
- 排除模块：...

### 风险预判
- ...

### 需要确认的问题（最多 3 个）
1. ...
```

**IF** 3 个问题仍不足以消除歧义 → 说明仍不清楚的部分，询问用户继续澄清还是按当前假设推进。

**MATCH** `用户反馈`：

- `确认` → **GOTO** Phase 2
- `要求修改` → 调整后重新展示
- `否决任务` → **DONE**（`结果: 用户主动终止，不进入实现阶段`）
- *DEFAULT* → 澄清用户意图后重新匹配

### Phase 2：写规格文档

> 产出的 SDD 必须让一个完全不了解项目的开发者仅凭 SDD 就能写出实现。每一条业务规则都能直接映射为测试用例——做不到就是规格不够具体。

> TRAP：你会倾向于复制模板章节结构后用"按需调整""参考实际情况"填充内容。这不是规格——这是占位符。每个字段都必须是具体的、可执行的。

> TRAP：你会倾向于只描述系统"做什么"（happy path），而跳过"不能做什么"（边界和异常）。边界条件和异常场景是 SDD 九章节中最容易偷懒的两部分。

**IF** `mode == compact`：

- 仅 **WRITE** `03-sdd.md` + `04-boundary.md`

**ELSE**：

- 按顺序 **WRITE** 6 个文件（每个依赖前一个，不可乱序）：

| 顺序 | 文件 | 模板位置 | 说明 |
| ---- | ---- | -------- | ---- |
| 1 | `01-plan.md` | `references/01-plan-template.md` | 任务规划（目标、分期、预算） |
| 2 | `02-context.md` | `references/02-context-template.md` | 上下文选择清单 |
| 3 | `03-sdd.md` | `references/sdd-template.md` / `references/delta-spec-template.md` | 完整 SDD 或增量 SDD |
| 4 | `04-boundary.md` | `references/04-boundary-template.md` | 修改边界 |
| 5 | `05-risk.md` | `references/05-risk-template.md` | 风险与验证计划 |
| 6 | `prompt-template.md` | `references/prompt-template.md` | 工具适配产物 |

> SIGNAL：Given/When/Then 场景中没有出现具体值（数字、字符串、状态码）→ 规则太模糊，无法直接映射测试用例。
> SIGNAL：业务规则中没有 RFC 2119 标记（MUST/SHOULD/MAY）→ 优先级不明确，实现者无法判断哪些是硬约束。
> SIGNAL：关键设计决策中没有"拒绝方案"→ 分析不完整，team-review 无法审查决策合理性。

> GOOD：`§二 业务规则 B1：Given 用户输入金额 = 0，When 提交订单，Then 系统 MUST 返回 400 错误码，错误消息 = "金额不能为零"。`
> BAD：`§二 业务规则 B1：Given 用户输入无效金额，When 提交订单，Then 系统应该返回错误。`

> GOOD：`§三 关键设计决策 D1：选择 WebSocket 实时推送（低延迟、双向通信）。拒绝方案：HTTP 轮询（延迟高、服务端负载大）、SSE（单向、浏览器连接数限制）。`
> BAD：`§三 关键设计决策 D1：使用 WebSocket。`

#### WRITE 输出骨架

`03-sdd.md` 核心章节骨架：

```markdown
## §二 业务规则

| 编号 | 规则 | 强度 | Given | When | Then |
|------|------|------|-------|------|------|
| B{N} | {规则描述} | MUST/SHOULD/MAY | {前置条件，含具体值} | {触发动作} | {预期结果，含状态码/错误消息} |

## §三 关键设计决策

| 编号 | 决策 | 选择方案 | 拒绝方案 | 拒绝理由 |
|------|------|---------|---------|---------|
| D{N} | {决策点} | {方案名 + 理由} | {方案名} | {具体技术理由} |

## §七 边界条件

| 编号 | 场景 | 输入 | 预期行为 |
|------|------|------|---------|
| BC{N} | {边界场景} | {具体极值/空值/格式异常} | {系统响应，含错误码} |

## §八 异常场景

| 编号 | 异常 | 触发条件 | 错误码 | 错误消息 | HTTP 状态 |
|------|------|---------|--------|---------|----------|
| E{N} | {异常名} | {何时发生} | {code} | {message} | {status} |
```

> SIGNAL：§八 异常场景中没有并发相关条目（竞态条件、死锁、重复提交）→ 若系统有并发访问，需补充并发异常场景。
> SIGNAL：§七/§八 中没有兼容性条目（旧版客户端、旧格式数据、API 版本迁移）→ 若涉及接口变更或数据格式变更，需补充向后兼容场景。

`01-plan.md` 核心骨架：

```markdown
## 成功标准

| # | 标准 | 验证命令 | 预期结果 |
|---|------|---------|---------|
| S{N} | {可测量标准} | {具体命令} | {通过条件} |

## 非目标

- NG{N}：{明确排除的范围} — {为什么排除}

## 分期策略

| 期 | 范围 | Kill Switch 条件 |
|----|------|-----------------|
| P1 | {最小闭环} | {何时放弃} |
| P2 | {增强功能} | {何时放弃} |

## 容量与成本预估（如适用）

| 维度 | 当前/预估值 | 约束 |
|------|-----------|------|
| 数据量级 | {行数/文档数/日增量} | {上限或增长趋势} |
| QPS/并发 | {峰值请求量} | {系统承载能力} |
| 外部 API 成本 | {调用频次 × 单价} | {月度预算上限} |
| 存储增长 | {月增量} | {存储配额} |
```

#### 占位符零容忍

**ASSERT** `"TBD"/"TODO"/"待补充"/"按需调整" 匹配数 == 0`——下游 Agent 无法执行含占位符的规格。发现一个就补全一个：

| 禁止 | 正确做法 |
| ---- | -------- |
| "TBD"、"TODO"、"待补充" | 写出具体内容 |
| "添加适当的错误处理" | 写出具体错误处理逻辑 |
| "类似上面"、"同上" | 重复具体内容 |
| "按需调整"、"根据实际情况" | 写出决策标准和条件 |
| "参考 {其他文件}" 无具体内容 | 写出关键内容 + 引用路径 |

### Phase 3：自检

> 切换到"攻击者"视角——假设这份 SDD 有致命遗漏，你的任务是找到它。"看起来完整"不等于"真的完整"。

> TRAP：你刚写完 SDD，此刻最不适合评价它的质量——实现偏见会让你觉得"写了就是对的" `_team-rules/first-principles.md: First Principle #2`。逐条对照检查清单，不要凭感觉。

**GATE** 产出前逐条检查（不通过则补全后再输出）：

**通用项**（完整 + 精简模式均检查）：

- [ ] **ASSERT** `SDD 含九章节：§一 背景动机 && §二 业务规则 && §三 关键设计决策 && §四 数据流 && §五 输入规格 && §六 输出规格 && §七 边界条件 && §八 异常场景 && §九 验收 Checklist`（精简模式 §四 数据流可省略）
- [ ] **ASSERT** `SDD §二 业务规则每条含 Given/When/Then 格式`
- [ ] **ASSERT** `SDD 含关键设计决策表（选择方案 + 拒绝方案 + 拒绝理由）`
- [ ] **ASSERT** `boundary 含 allow 列表 && deny 列表`
- [ ] **ASSERT** `来源标签（{extracted}/{inferred}/{ambiguous}）标注数 >= 1`
- [ ] **ASSERT** `修改类任务用 Delta Spec` || `新建类任务用完整 SDD`
- [ ] **ASSERT** `"TBD"/"TODO"/"待补充" 匹配数 == 0`
- [ ] **IF** SDD 涉及外部 AI 服务调用 → **ASSERT** `§五 输入/输出规格中标注数据分类和脱敏策略`（`team-security: RED_LINE_1`）
- [ ] **IF** SDD 涉及高风险操作（资金/权限/数据删除/对外发布）→ **ASSERT** `§二 业务规则中 CONTAINS 人工确认机制设计`（`team-security: RED_LINE_3`）
- [ ] **IF** SDD 引入新的外部 AI 模型/服务 → **ASSERT** `§三 关键设计决策中记录审批状态`（`team-security: RED_LINE_4`）
- [ ] 如果把这份 SDD 交给一个完全不了解项目的开发者，他能否仅凭 SDD 写出实现？哪部分他会困惑？
- [ ] 我是否因为"显而易见"而跳过了某个边界条件的描述？

**完整模式附加项**（精简模式跳过）：

| 维度 | 检查条件 |
| ---- | -------- |
| 计划 | 成功标准 ≥ 3 条（每条有验证命令 + 预期结果）、非目标 ≥ 2 条、自我约束预算已声明 |
| 分期 | P1 最小闭环 + 后续候选 + Kill Switch 条件、阶段拆分 ≥ 5 |
| 上下文 | 术语表 ≥ 3 个（标注模块）、引用 ≥ 3 文件、排除 ≥ 1 文件 |
| 风险 | 风险 ≥ 2 条（含缓解措施）、Kill Switch ≥ 2 个、停下来问人 ≥ 3 条 |
| 容量成本 | 涉及数据存储/外部 API/高并发场景时，容量与成本预估已声明（无相关场景则标注 N/A） |
| 架构 | SDD 含 ASCII 数据流图 |
| 工具 | prompt-template.md 独立产出（五要素）、pm-truth-ledger 已追加（`IF` EXISTS） |

## STOP_SIGNALS

- **跳过**用户确认直接写文件，或一次抛出所有问题不等回复
- **列出**文件名却不列依赖关系
- **声明**"无风险"，或产出后发现遗漏不补全
- **凭空**推断而非扫描源码

## CONSTITUTIONAL_RULES

**REF** `_team-rules/constitutional-rules.md` — 9 条 Constitutional Rules
**REF** `_team-rules/first-principles.md` — 4 条第一性原理（First Principle #1 ~ #4）
**REF** `_team-rules/spec-driven-workflow.md` — Spec-Driven 开发原则与 TDD 工作流
**REF** `_team-rules/task-lifecycle.md` — 来源标签规范（§1.3）

规格制定阶段尤其注意：

- **Rule #1 人类介入是一等公民**：规格产出后必须等 CONFIRM_SPEC 确认，不可自动进入实现 `_team-rules/first-principles.md: First Principle #1`
- **Rule #4 Kill Switch**：探索阶段发现不可行 → 立即暂停，不可"先写个规格再说" `_team-rules/first-principles.md: First Principle #1 + First Principle #3`
- **Rule #5 分期交付优先**：复杂任务必须拆分分期，不可一次性全量规格 `_team-rules/first-principles.md: First Principle #3`

## SELF_CHECK

**GATE** Skill 完成前自检（全部通过才声明完成）：

- [ ] **ASSERT** `完整模式产出文件数 == 6` || `精简模式产出文件数 == 2`
- [ ] **ASSERT** `Phase 3 检查全部通过（通用项 + 适用的附加项）`
- [ ] **ASSERT** `Phase 1.5 用户确认 == true`
- [ ] **ASSERT** `"TBD"/"TODO"/"待补充" 匹配数 == 0`
- [ ] **ASSERT** `来源标签使用数 >= 1`
- [ ] **ASSERT** `无占位符残留（{N}、{slug} 等已被实际值替换）`
- [ ] **ASSERT** `IRON_LAW 遵守` — 规格产出后已获用户确认，未自动进入实现
- [ ] 如果有人现在审查我的 SDD，我会为哪部分心虚？那部分需要补全。
- [ ] 我是否因为"应该没问题"跳过了任何边界条件或异常场景？

## COMPLETION

**REF** `_team-rules/four-state-protocol.md` — 四态完成状态

**MATCH** `result`：

- `全部文件产出 && 自检通过` → **DONE**（`模式: {完整/精简}`, `文件: [...]`）
- `产出完成 && 有保留意见` → **DONE_WITH_CONCERNS**（`concerns: [...]`）
- `用户否决任务` → **DONE**（`结果: 用户主动终止`）
- `需求信息不足` → **NEEDS_CONTEXT**
- `需求不可行` → **BLOCKED**
- *DEFAULT* → **NEEDS_CONTEXT**

## INTEGRATION

**被谁调用：**

- 用户直接调用（独立使用）
- `team-orchestrator`（编排模式）
- `team-brainstorm`（讨论完成后）
- `team-feedback`（反馈揭示 spec 遗漏时）

**配对使用：**

- `team-impl` — REQUIRED：规格完成后必须进入实现

## NEXT

- 规格完成且用户确认 → 使用 `team-impl` 开始 TDD 实现
