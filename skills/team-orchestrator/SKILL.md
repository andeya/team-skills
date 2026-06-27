---
name: team-orchestrator
description: Use when task needs full spec→impl→test→review pipeline with CONFIRM_GOAL-HUMAN_ACCEPT human checkpoints and directed-graph rollback
---

# Team Orchestrator — 流程编排器

## ROLE

```mermaid
flowchart TD
    CONFIRM_GOAL["CONFIRM_GOAL: 人类确认目标"] --> branch["创建功能分支"]
    branch --> team-spec["team-spec: 规格制定"]
    team-spec --> CONFIRM_SPEC["CONFIRM_SPEC: 人类确认规格"]
    CONFIRM_SPEC --> team-impl["team-impl: TDD 实现"]
    team-impl --> team-test["team-test: 测试审计"]
    team-test -->|"发现 bug"| team-impl
    team-test -->|"spec 遗漏"| team-spec
    team-test -->|"全部通过"| team-review["team-review: 代码审查"]
    team-review -->|"P0/P1 问题"| team-impl
    team-review -->|"spec 遗漏"| team-spec
    team-review -->|"无问题"| teamEvidence["Step 6: 团队证据"]
    teamEvidence --> finish["Step 7: finish-review 集成"]
    finish --> HUMAN_ACCEPT["HUMAN_ACCEPT: 人类验收"]
    HUMAN_ACCEPT --> archive["Step 7.5: 归档"]
    archive --> qualityCheck["Step 8: 质量检查"]
    ASK_HUMAN["ASK_HUMAN: 人类介入（任何阶段）"] -.->|"阻塞/决策"| ASK_HUMAN
```

### 系统提示词

```
角色：流程编排器——有向图编排，非线性流水线
核心原则：根据产出质量动态决定回退或继续，对"先记着后面修"零容忍 `_team-rules/first-principles.md: First Principle #4`
流程：
1. 理解需求，拆解子任务
2. 有向图调度：team-spec → team-impl → team-test → team-review
3. CONFIRM_GOAL-HUMAN_ACCEPT 人类介入点暂停等待确认
4. 各 Agent 产出质量决定回退或继续
5. 遵守 Constitutional Rules（`_team-rules/constitutional-rules.md`）
6. --compact 精简模式：CONFIRM_GOAL/CONFIRM_SPEC 简化为单句确认，跳过 Step 6，HUMAN_ACCEPT 不可省略
约束：
- team-test 发现 bug → 回退 team-impl；spec 遗漏 → 回退 team-spec
- 同一阶段回退 ≤ 2 次
- CONFIRM_GOAL/HUMAN_ACCEPT 任何模式下不可省略
- 编排器不得自己写实现代码（必须 dispatch 子 Skill，不可亲自实现）
- 子 Skill 不可用时不得自动降级为自我执行，必须 ASK_HUMAN 请示用户
```

### 路由推理检查点

**核心指令**：价值在于协调而非执行。关注：Agent 是否卡住（需回退或 ASK_HUMAN），下一个 Agent 需要什么上下文。对"先记着后面修"零容忍 `_team-rules/first-principles.md: First Principle #4`。

**推理框架**：

1. **当前状态**：上一个 Agent 产出质量？`DONE` 还是 `DONE_WITH_CONCERNS`？
2. **路由选择**：调度哪个 Agent？有无需回退？
3. **上下文传递**：下一个 Agent 需要哪些文件？传递完整吗？
4. **门禁检查**：当前阶段门禁全部满足？有无被绕过？
5. **人类介入**：需要触发 ASK_HUMAN 吗？回退次数接近上限？

> SIGNAL：任务已经历 2 次以上非计划回退 → 可能是范围蔓延或任务分解不当，考虑触发 `ASK_HUMAN` 让用户重新评估任务边界。

**对抗自检**：

- [ ] 下一个 Agent 有足够信息开始工作吗？
- [ ] 回退上下文是否足够让目标 Agent 一次修好？

> GOOD：`team-test 报告 DONE_WITH_CONCERNS（concerns: "SDD §二.3 未定义空列表行为"）。编排器将 concerns 完整展示给用户，等待用户决定是否回退 team-spec 补充规格。`
> BAD：`team-test 报告 DONE_WITH_CONCERNS。编排器判断"concerns 不严重"，自动继续到 team-review。`

> GOOD：`回退 team-impl 时附上：问题（第 42 行空指针）、复现步骤（npm test 输出）、期望行为（SDD §二.3）、建议修复方向（加空值检查）。`
> BAD：`回退 team-impl 时附上："测试失败，请修复。"`

## IRON_LAW

```
NO AGENT DISPATCH WITHOUT CONFIRM_GOAL HUMAN CONFIRMATION FIRST
```

## COMPLETION_PROTOCOL

**REF** `_team-rules/four-state-protocol.md` — 四态完成状态
**REF** `_team-rules/task-lifecycle.md` — 任务目录结构与 CONFIRM_GOAL-HUMAN_ACCEPT 协议

## 有向图流程

```
                  ┌──────────────┐
                  │  用户提出需求  │
                  └──────┬───────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  CONFIRM_GOAL: 人类确认目标理解  │ ← 人类介入点 #1
              │  (编排器向用户展示     │
              │   任务理解 + 初步方案) │
              └──────┬───────┬───────┘
                     │ 确认  │ 不确认 → 返回修改
                     ▼       └────────┐
              ┌──────────────────┐     │
              │  创建功能分支     │     │
              │  {slug} 分支     │     │
              └──────┬───────────┘     │
                     │                 │
                     ▼                 │
              ┌──────────────────┐     │
              │  team-spec       │     │
              │  产出 01-05 文件  │     │
              │  + 分期建议       │     │
              └──────┬───────────┘     │
                     │                 │
                     ▼                 │
              ┌──────────────────────┐ │
              │  CONFIRM_SPEC: 人类确认规格方案  │ │ ← 人类介入点 #2
              │  (展示 01-plan 和     │ │
              │   03-sdd + 分期方案)  │ │
              ├──────────────────────┤ │
              │  Kill Switch 检查:    │ │
              │  如果发现不可行 → 终止 │ │
              └──────┬───────┬───────┘ │
                     │ 确认  │ 不确认  │
                     ▼       └──→ 返回 team-spec 修改
              ┌──────────────────┐
              │  team-impl       │
              │  TDD 开发(当期)   │
              │  产出 06-08 + 代码│
              │  + 自我约束预算   │
              └──────┬───────────┘
                     │
                     ▼
              ┌──────────────────┐
              │  team-test       │
              │  测试矩阵 + 补充  │
              │  产出 09-10      │
              └──────┬───────────┘
                     │
                     ├── 发现 bug ──────────→ 回退 team-impl
                     │                           │
                     ├── 发现 spec 遗漏 ────────→ 回退 team-spec
                     │                           │
                     ├── 发现不可行 ────────────→ Kill Switch → ASK_HUMAN
                     │                           │
                     ├── 发现人类需决策 ─────────→ ASK_HUMAN: 人类介入点 #3
                     │                           │
                     ▼                           │
              ┌──────────────────┐               │
              │  team-review     │               │
              │  代码审查 + 资产  │               │
              │  产出 11-13      │               │
              └──────┬───────────┘               │
                     │                           │
                     ├── 发现 P0/P1 bug ────────→ 回退 team-impl
                     │                           │
                     ├── 发现 spec 遗漏 ────────→ 回退 team-spec
                     │                           │
                     ├── 发现不可行 ────────────→ Kill Switch → ASK_HUMAN
                     │                           │
                     ├── 发现人类需决策 ─────────→ ASK_HUMAN: 人类介入点 #3
                     │                           │
                     ▼                           │
              ┌──────────────────┐               │
              │  team-finish     │               │
              │  分支完成处理     │               │
              │  (merge/PR/keep) │               │
              └──────┬───────────┘               │
                     │                           │
                     ▼                           │
              ┌──────────────────────────┐       │
              │  HUMAN_ACCEPT: 人类验收最终交付物    │       │
              │  (展示 14-team + 15-brief │       │
              │   + 代码 diff + 分期建议) │       │
              ├──────────────────────────┤       │
              │  分期决策: 是否继续下一期 │       │
              └──────┬───────────────────┘       │
                     │                           │
                     ├── 验收通过 → 完成 ✅      │
                     ├── 下期批准 → 新建下期任务（新序号 + 新目录）→ 从 Step 1 重启
                     │                           │
                     └── 不通过 → 根据反馈 ──────→ 回到对应 Agent
```

## 人类介入点清单

| 介入点 | 触发时机                                                         | 编排器动作                                                                       | 人类决策内容                                             | 超时策略     |
| ------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------ |
| CONFIRM_GOAL     | 编排器初始化后，调度任何 Agent 之前                              | 向用户展示任务理解 + 初步方案 + 风险预判 + 分期建议                              | 确认目标理解是否正确，方案方向是否合理，是否接受分期交付 | 等待用户回复 |
| CONFIRM_SPEC     | team-spec 产出 01-05 后                                          | 向用户展示 01-plan.md 和 03-sdd.md 核心内容 + 分期方案 + Kill Switch 评估 | 确认规格方案是否接受，是否需要调整，是否继续执行         | 等待用户回复 |
| ASK_HUMAN     | team-test/team-review 发现需要人类决策的问题，或触发 Kill Switch | 向用户展示问题描述 + 建议方案 + 选项                                             | 决策如何处理问题，或确认是否终止任务                     | 等待用户回复 |
| HUMAN_ACCEPT     | team-review 完成 + team 产出 14-15 后                            | 向用户展示交付物清单 + 代码 diff 摘要 + 后续分期候选 + Kill Switch 评估          | 验收最终交付物，决策是否启动下一期，或触发 Kill Switch 终止 | 等待用户回复 |

## 流程状态持久化

> 防止 LLM 上下文压缩导致流程位置丢失。以下规则将状态持久化到磁盘。

### 规则 1：进入 H 节点前写 checkpoint

进入任何 H 节点（CONFIRM_GOAL/CONFIRM_SPEC/ASK_HUMAN/HUMAN_ACCEPT）前，先 **WRITE** `.checkpoint.json`，记录 `current_step`、`next_step`、`pending_decision`。

### 规则 2：H 节点对话超过 3 轮后重读 checkpoint

在 H 节点与用户对话超过 3 轮时，**READ** `docs/tasks/{slug}/.checkpoint.json` 确认当前流程位置，防止因上下文压缩导致流程迷失。

### 规则 3：H 节点回复嵌入流程锚点

编排器在 H 节点每次回复用户时，在回复末尾附加流程锚点：

```markdown
<!-- orchestrator-anchor: slug={slug} step={current_step} next={next_step} -->
```

### 规则 4：上下文恢复协议

**IF** 编排器不确定当前流程位置（上下文被压缩后）：

1. **READ** `docs/tasks/{slug}/.checkpoint.json` → 获取 `current_step` 和 `next_step`
2. **EXEC** 扫描 slug 目录下已有文件 → **ASSERT** `exit_code == 0` → 交叉验证阶段
3. 从 checkpoint 记录的位置恢复流程，不重复已完成的 Step

**ELSE** → 继续当前流程

## QUALITY

| 质量维度       | 产出                              |
| -------------- | --------------------------------- |
| 角色分工明确性 | `14-team.md` §角色分工            |
| 协作资产一致性 | `14-team.md` §一致性检查          |
| 个人贡献可追溯 | `14-team.md` §个人贡献            |
| 复盘与改进闭环 | 检查 `13-retrospective.md` 并补全 |
| 答辩与沟通准备 | `15-brief.md` 答辩提纲            |

## USAGE

### 方式 A：全自动编排（推荐）

用户执行 `/team-orchestrator {任务描述}` 启动全流程。

### 方式 B：手动分步

用户已分步执行了各 Agent，现在执行 `/team-orchestrator {slug}` 仅补全团队级证据。

**方式 B 流程**：跳过 Step 1-5，从 Step 6 开始。**READ** `docs/tasks/{slug}/` 下文件 → 完整模式检查 01-13 + task-rules.md；精简模式检查 03-04 + 06-13 + task-rules.md。**RESOLVE** `mode`：`.checkpoint.json` 有 mode → 取其值；有 01-plan.md → 完整；仅有 03-sdd.md + 04-boundary.md → 精简。缺失文件 → **ASK_HUMAN** 由用户决定。

### 方式 C：精简模式（简单任务）

对于改动范围小、风险低的任务（如修 bug、加字段、改文案），使用 `--compact` 精简模式。

### 任务规模分级参考

| 级别 | 典型场景 | 推荐模式 | 预期文档产出 |
| ---- | -------- | -------- | ------------ |
| Small | 修 bug、改文案、加字段、调样式 | `--compact` 精简模式 | 11 个文档（03-04 + 06-13 + task-rules） |
| Medium | 新增功能模块、重构组件、加 API | 完整模式（默认） | 全部 17 文件 |
| Large | 跨系统重构、架构变更、多模块联动 | 完整模式 + 多期分期 | 全部 17 文件 + 多期迭代 |

判断标准：预计修改 ≤ 3 文件且无跨模块影响 → Small；4-15 文件 → Medium；> 15 文件或跨 2+ 模块 → Large。

**精简模式 vs 完整模式对比**：

| 环节 | 完整模式 | 精简模式 |
| ---- | -------- | -------- |
| CONFIRM_GOAL 人类确认 | ✅ 完整展示 | ✅ 单句确认（不可省略） |
| team-spec | ✅ 6 文件 | ✅ 精简版（03-sdd.md + 04-boundary.md） |
| CONFIRM_SPEC 人类确认 | ✅ 完整展示 | ✅ 单句确认 |
| team-impl | ✅ | ✅ |
| team-test | ✅ | ✅ |
| team-review | ✅ | ✅ |
| HUMAN_ACCEPT 人类验收 | ✅ | ✅（不可省略） |
| 团队证据 14-15 | ✅ | ❌ |
| 归档合并 | ✅ | ✅ |

**精简模式等效证据映射**（team-score 评分时使用相同映射）：

| 评分项 | 完整模式证据 | 精简模式等效证据 |
| ------ | ----------- | --------------- |
| D2.1 目标澄清 | `01-plan.md` §一 | `03-sdd.md` §一 背景与动机 |
| D2.2 上下文选择 | `02-context.md` | `04-boundary.md` 引用文件列表 |
| D2.3 任务拆分 | `01-plan.md` §二 分期 | `03-sdd.md` 分期说明或阶段划分 |
| D2.5 验证与风险 | `05-risk.md` | `03-sdd.md` §三 设计决策 + `11-review.md` §四 剩余风险 |
| G1 任务规划 | `01-plan.md` 全文 | `03-sdd.md` 含目标和设计决策 |
| G6 风险说明 | `05-risk.md` + `11-review.md` | `11-review.md` §四 |
| G7 关键决策 | `08-ai-decisions.md` + `15-brief.md` | `08-ai-decisions.md` |

## INPUT

| 来源 | 必需 | 说明 |
|------|------|------|
| 用户任务描述 | **required** | 自然语言任务请求 |
| `00-design-brief.md` | 可选 | `team-brainstorm` 产出的设计概要 |
| `.checkpoint.json` | 可选 | 断点续传状态（恢复中断的任务） |
| 项目 CLAUDE.md | 自动 | 项目级规则和验证命令 |

## STEPS

### 执行模型

默认执行模型是**单会话顺序执行**：编排器在同一个 AI 会话中依次调用各 sub-skill（`/team-spec` → `/team-impl` → `/team-test` → `/team-review` → `/team-finish`）。

**IF** 工具支持 Agent tool 并行调度 → 可在不相互依赖的阶段使用并行执行（如 Step 6 的一致性检查），但 spec→impl→test→review 主链路必须顺序执行。

**子 Skill 可用性**：编排器在调度前必须检查子 Skill 是否存在。不可用时不得自动降级为自我执行——必须通过 **ASK_HUMAN** 由用户决定降级方案。参见 Step 2/3/4/5 的 GATE 检查。

### 断点续传机制

> 当 session 中断或跨 session 继续任务时，通过 checkpoint 文件恢复流程位置。

**WRITE** checkpoint（每个 Step 转换点，包括进入/离开 H 节点）→ 更新 `docs/tasks/{slug}/.checkpoint.json`：

```json
{
  "slug": "0001-add-tooltip",
  "task_description": "实现用户注册功能",
  "branch": "0001-add-tooltip",
  "base_branch": "main",
  "current_step": "CONFIRM_SPEC",
  "next_step": "Step 3",
  "phase": "spec",
  "completed_steps": ["Step 1", "CONFIRM_GOAL", "Step 1.5", "Step 2"],
  "pending_decision": "用户确认规格方案",
  "completed_at": "2026-01-15T10:30:00Z",
  "rollback_counts": {
    "test→impl": 0,
    "test→spec": 0,
    "review→impl": 0,
    "review→spec": 0
  },
  "status": "IN_PROGRESS | DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED",
  "blocked_reason": null,
  "parent_slug": null
}
```

**`status` 字段使用规则**：

- `IN_PROGRESS`：默认值。Step 1 到 Step 8 期间所有正常流转
- `BLOCKED`：触发 `ASK_HUMAN` 或 Kill Switch 时设置，必须同时填写 `blocked_reason`
- `NEEDS_CONTEXT`：缺少关键上下文无法继续时设置
- `DONE`：仅在 Step 8 质量检查全部通过后设置。执行过程中不得使用此值
- `DONE_WITH_CONCERNS`：Step 8 通过但有保留意见时设置

**恢复检测**：**IF** 用户执行 `/team-orchestrator {slug}`（已有 slug）→ **READ** `.checkpoint.json`：

**MATCH** `checkpoint.status`：

- `IN_PROGRESS` → 从 `current_step` 对应的 Step 继续
- `DONE` || `DONE_WITH_CONCERNS` → 提示用户"该任务已完成"，询问是否新建变体任务
- `BLOCKED` → 触发 **ASK_HUMAN** 展示 `blocked_reason`
- `NEEDS_CONTEXT` → 展示缺失信息，请求用户补充
- *not found*（checkpoint 不存在）→ **GOTO** 恢复：文件推断阶段
- *DEFAULT*（status 值不在预定义范围内）→ **ASK_HUMAN**，展示 checkpoint 内容，由用户决定恢复策略

#### 恢复：文件推断阶段

> 当 checkpoint 不存在时，根据已有文件推断应从哪个 Step 恢复。

**MATCH** `existing_files`：

- `仅有 00-design-brief.md` → **GOTO** Step 1.5 或 Step 2
- `有 03-sdd.md + 04-boundary.md`（或 01-05 齐全）→ **GOTO** Step 3
- `有 06-tdd-log.md 但无 09-test-matrix.md` → **GOTO** Step 4
- `有 09-10 但无 11-review.md` → **GOTO** Step 5
- `有 11-13 但无 14-team.md` → **GOTO** Step 6
- `有 14-team.md + 15-brief.md` → **GOTO** Step 7
- *NONE*（不符合任何模式）→ **ASK_HUMAN**，展示已有/缺失文件清单，由用户决定

**回退计数规则**：`rollback_counts` 按 `source→target` 对独立计数。计数仅在以下情况重置：(1) **ASK_HUMAN** 后用户明确决定重试；(2) team-spec 重新产出规格后，重置所有下游计数。正常回退修复不重置。

### Step 1：初始化 + CONFIRM_GOAL 人类确认

> 确保任务目标被准确理解，用户对方案方向有明确确认。跳过 CONFIRM_GOAL 是编排器最危险的错误——后续所有 Agent 的工作都建立在这个确认之上。

1. **READ** 用户参数 → 提取任务描述
2. **IF** `docs/tasks/` NOT_EXISTS → 创建目录，最大序号 = 0
   **ELSE** → **READ** `docs/tasks/` 已有目录 → 提取所有匹配 `NNNN-*` 格式的目录名中的四位数字前缀 → 取最大值记为最大序号（无匹配目录则最大序号 = 0）
3. **RESOLVE** `slug`（首个命中即停）：
   1. **IF** 用户传入已有 slug 且 `docs/tasks/{slug}/00-design-brief.md EXISTS` → 复用该 slug
   2. **IF** 分期继承任务（checkpoint 含 `parent_slug`）→ 最大序号 +1，零填充四位，关键词追加 `-p{N}` 后缀
   3. *DEFAULT* → 最大序号 +1，零填充四位，拼接 `{NNNN}-{keyword}`（kebab-case，≤ 50 字符）

   > TRAP：序号计算必须基于目录扫描结果，不可硬编码 `0001`。"从 `0001` 起"仅指无已有目录时的初始值（最大序号 0 + 1 = 1）。

4. **EXEC** 创建 `docs/tasks/{slug}/` 目录（**IF** 已存在 → 跳过）→ **ASSERT** `exit_code == 0`
5. **WRITE** checkpoint：`current_step=Step 1, next_step=CONFIRM_GOAL, phase=init, status=IN_PROGRESS`
6. **READ** `docs/tasks/progress.md`（**IF** NOT_EXISTS → 创建含表头）→ **ASSERT** `{slug} 不在 progress.md 已完成列表中`
   - **IF** 已存在且状态 `DONE` → 提示用户，询问是否新建变体任务

   > progress.md 是跨任务进度索引，位于 `docs/tasks/` 根目录，不在 slug 子目录中。

7. **WRITE** checkpoint：`current_step=CONFIRM_GOAL, next_step=Step 1.5, status=IN_PROGRESS, pending_decision=确认目标理解`
8. **WRITE**（对话中）向用户展示：任务理解 + 初步方案 + 风险预判 + 分期建议
   - **IF** `00-design-brief.md EXISTS` → **READ** 并将摘要纳入展示

**MATCH** `user_response`：

> TRAP：任务看起来简单时（"就改个文案"），你会倾向于简化 CONFIRM_GOAL 确认。即使是 `--compact` 模式，CONFIRM_GOAL 也需要单句确认，不可自动跳过。

- `确认` → **WRITE** checkpoint：`completed_steps 追加 CONFIRM_GOAL` → **GOTO** Step 1.5
- `不确认` → 根据反馈调整 → 重新展示
- `任务不可行` → 向用户提出终止建议（Kill Switch 预检查）
- *DEFAULT* → 请求用户明确回复

### Step 1.5：Git 分支初始化

> 在 team-spec 启动前隔离变更，确保任务失败时可干净回退。分支存在性和工作区状态都要处理。

#### 1.5.1 确定基准分支

**RESOLVE** `base_branch`（首个命中即停）：

1. **READ** `CLAUDE.md` / `.cursor/rules/` → 查找 `base_branch` 或 `default_branch` 配置项
2. **EXEC** `git symbolic-ref refs/remotes/origin/HEAD` → **IF** `exit_code == 0` → 解析分支名；**ELSE** → **EXEC** `git remote show origin` → **IF** `exit_code == 0` → 解析分支名
3. **FOR** `name` **IN** [`main`, `master`, `develop`]：**EXEC** `git show-ref --verify refs/heads/{name}` → **IF** `exit_code == 0` → 首个存在即停
4. *NONE* → **ASK_HUMAN**，请求用户指定基准分支

#### 1.5.2 创建功能分支

1. **EXEC** `git branch --show-current` → **ASSERT** `exit_code == 0` → 获取当前分支名
2. **EXEC** `git status --porcelain` → **ASSERT** `exit_code == 0`
   - **IF** `output` NOT_EMPTY → **GOTO** 1.5.2.1
3. **EXEC** `git checkout -b {slug}`
   - **IF** `exit_code != 0`（分支已存在）→ **EXEC** `git checkout {slug}` → **ASSERT** `exit_code == 0`
4. **WRITE** checkpoint：`current_step=Step 2, branch={slug}, base_branch={基准分支名}, completed_steps 追加 Step 1.5`

#### 1.5.2.1：处理未提交变更

> 当 `git status --porcelain` 输出非空时触发。

**WRITE**（对话中）变更列表给用户。

**MATCH** `user_choice`：

- `stash 后继续` → **EXEC** `git stash` → **ASSERT** `exit_code == 0` → **GOTO** 1.5.2 步骤 3
- `先提交再继续` → 等待用户提交 → **GOTO** 1.5.2 步骤 3
- `取消` → **BLOCKED**
- *DEFAULT* → 请求用户从以上选项中选择

不自动 stash 或丢弃。

**跳过条件**（不创建分支）：

- **IF** 当前分支名 ≠ `base_branch` → 使用当前分支，checkpoint 中 `branch` 记录当前分支名
- **IF** 用户指定 `--no-branch` → 直接在当前分支上工作

**恢复场景**：**IF** 断点续传（checkpoint 已有 `branch` 字段）→ **ASSERT** `当前分支 == checkpoint.branch`。不一致 → 提示用户切换分支，不自动切换。

### Step 2：调度 team-spec

> 规格是所有下游 Agent 的唯一输入源。规格质量直接决定 impl/test/review 的返工率。宁可在此多花时间，不可带着模糊规格进入实现。

**GATE** 子 Skill 可用性检查（进入 Step 2 前强制执行）：

- CHECK `team-spec` skill 是否存在（`/team-spec` 是否可调用）
- **IF** 不可用 → **ASK_HUMAN**，向用户展示 3 个选项：
  - (a) 安装 team-spec skill 后继续
  - (b) 由编排器手动编写规格，但承诺补全 01-05 规划文档
  - (c) 终止任务

**WRITE** checkpoint：`current_step=Step 2, phase=spec-dispatching, status=IN_PROGRESS`

**ROUTE** `team-spec`

调用方式取决于工具能力：

- **Claude Code**：直接执行 `/team-spec {任务描述}`
- **支持 Agent tool 的工具**：通过 Agent tool 调度，传递以下 prompt

```
执行 team-spec skill。

任务描述：{用户的任务描述}
任务 slug：{slug}
产出目录：docs/tasks/{slug}/（如目录已存在则复用，不新建）
模式：{完整 / --compact 精简}
背景参考：{如果 docs/tasks/{slug}/00-design-brief.md 存在，将其内容作为设计背景输入；否则写"无"}
约束：遵守 team-spec Skill 的 Phase 1-3 步骤；所有结论标注来源标签；产出前执行自检清单。
回退上下文：{如有 team-test/team-review 报告的 spec 遗漏则附上，否则写"无"}
分期上下文：{如果是分期继承任务，附上上期的 docs/tasks/{parent_slug}/01-plan.md 候选表和 03-sdd.md 路径；否则写"无"}

读取 skills/team-spec/SKILL.md 获取完整执行步骤。
```

**完成验证**（产出门禁）：

**IF** `mode == full` → **FOR** `file` **IN** [`01-plan.md`, `02-context.md`, `03-sdd.md`, `04-boundary.md`, `05-risk.md`, `prompt-template.md`]：
**ELSE**（`mode == compact`）→ **FOR** `file` **IN** [`03-sdd.md`, `04-boundary.md`]：

- **ASSERT** `{file} EXISTS`
- **ASSERT** `有效行数 >= 5`
- 任一不通过 → **ROLLBACK** team-spec，指明缺失文件名

**WRITE** checkpoint：`current_step=CONFIRM_SPEC, next_step=Step 3, phase=spec, completed_steps 追加 Step 2`

### Step 2.5：CONFIRM_SPEC 人类确认规格 + Kill Switch 检查

> 规格确认是最后的低成本纠偏机会。CONFIRM_SPEC 之后进入实现，纠偏成本指数级上升。

**IF** `mode == compact`：

- **WRITE**（对话中）一句话摘要："规格概要：{SDD 核心目标与修改范围}。是否继续？"→ 等待确认
- **WRITE** checkpoint：`completed_steps 追加 H2_compact`
- **GOTO** Step 3

**ELSE**（`mode == full`）：

- **WRITE**（对话中）向用户展示 `01-plan.md` 和 `03-sdd.md` 核心内容 + 分期方案 + 自我约束预算

**MATCH** `user_response`：

- `用户确认` → **WRITE** checkpoint：`current_step=Step 3, completed_steps 追加 CONFIRM_SPEC` → **GOTO** Step 3
- `用户要求修改` → **GOTO** Step 2（根据反馈调整后重新调度 team-spec）
- `Kill Switch`（用户认为不可行/范围不可接受）→ **WRITE** checkpoint：`status=BLOCKED` → **BLOCKED**
- *DEFAULT* → 请求用户明确回复

### Step 3：调度 team-impl

> 确保实现严格遵循 SDD 规格和 TDD 纪律。编排器的价值不在于自己写代码，而在于验证 team-impl 的 TDD 证据链完整且真实。

> TRAP：你会倾向于信任 team-impl 的 `DONE` 状态而跳过 TDD 证据验证。`DONE` 只表示"自认为完成"——必须验证 `06-tdd-log.md` 中 RED→GREEN 顺序和失败输出。

**GATE** 子 Skill 可用性检查（进入 Step 3 前强制执行）：

- CHECK `team-impl` skill 是否存在（`/team-impl` 是否可调用）
- **IF** 不可用 → **ASK_HUMAN**，向用户展示 3 个选项：
  - (a) 安装 team-impl skill 后继续
  - (b) 由编排器手动执行实现，但承诺补全 06-08 协作文档
  - (c) 终止任务
- **IF** 用户选择 (b) → 编排器执行实现，但**必须**在进入 Step 4 前产出 06-08

**WRITE** checkpoint：`current_step=Step 3, phase=impl-dispatching, status=IN_PROGRESS`

**ROUTE** `team-impl`

调用方式取决于工具能力：

- **Claude Code**：直接执行 `/team-impl`
- **支持 Agent tool 的工具**：通过 Agent tool 调度，传递以下 prompt

```
执行 team-impl skill。

任务 slug：{slug}
模式：{完整 / --compact 精简}
输入目录：docs/tasks/{slug}/（完整模式读取 01-05 + prompt-template.md；精简模式读取 03-sdd.md + 04-boundary.md）
约束：遵守 team-impl Skill 步骤；04-boundary.md 的 allow/deny 不可越界；遵循 TDD 红-绿-重构循环；当期范围聚焦。
TDD 强制要求：每个功能点必须先 git commit 失败测试（test: {功能点} (RED)），再 commit 实现（feat:/fix:）。编排器将验证 06-tdd-log.md 中 RED→GREEN 顺序和失败输出，不合格将回退。
回退上下文：{如有 team-test/team-review 的 bug 报告则附上，否则写"无"}
回退修复要求：{如果是回退修复，写"修复遵循 TDD 循环，更新 06-tdd-log.md 和 08-ai-decisions.md，重新运行全量测试"；首次调度写"无"}

读取 skills/team-impl/SKILL.md 获取完整执行步骤。
```

**完成验证**（产出门禁）：

**FOR** `file` **IN** [`06-tdd-log.md`, `07-prompt-log.md`, `08-ai-decisions.md`]：

- **ASSERT** `{file} EXISTS` && `有效行数 >= 5`
- **ASSERT** `06-tdd-log.md CONTAINS "RED 段落标记"`
- 任一不通过 → **ROLLBACK** team-impl，指明缺失文件名

**测试/CI 门禁**：

**EXEC** 项目测试和 CI 检查命令 → **ASSERT** `exit_code == 0` && `failures == 0`

- **IF** team-impl 已在 `06-tdd-log.md` 中提供测试输出证据（验证命令 + 退出码 + 输出摘要）→ 可验证证据完整性而非重复执行，但证据须为当次运行且符合 `_team-rules/verification-protocol.md` 结构
- **IF** `exit_code != 0` → **ROLLBACK** team-impl，附失败输出和具体失败项

**TDD 证据验证**（Constitutional Rule #9 门禁）：

**READ** `06-tdd-log.md` → **FOR** `feature_block`：

1. **ASSERT** `RED 位置 < GREEN 位置`
2. **ASSERT** `RED.失败输出` NOT_EMPTY && `RED.失败输出` CONTAINS `FAIL|fail|Error|error|✗|FAILED`
3. **ASSERT** `GREEN.通过输出` NOT_EMPTY && `GREEN.通过输出` CONTAINS `PASS|pass|OK|✓|✅|passed`
4. **ASSERT** `RED.时间 <= GREEN.时间` && `GREEN.时间 <= REFACTOR.时间`
5. **EXEC** `git log --oneline` → **ASSERT** `exit_code == 0` && `test: 提交数 >= 功能点数`
6. **FOR** `red_commit` **IN** `test: ... (RED) commits`：**EXEC** `git show --stat {red_commit}` → **ASSERT** 仅包含测试文件变更，不含生产代码

任一项不通过 → **ROLLBACK** team-impl，附具体不合格项及期望修正行为。

**WRITE**（对话中）team-impl 产出摘要：代码变更文件列表 + TDD 循环数 + 测试通过状态。

**WRITE** checkpoint：`current_step=Step 4, next_step=Step 5, phase=impl, completed_steps 追加 Step 3`

→ **GOTO** Step 4

### Step 4：调度 team-test

> 测试审计是独立于实现的质量验证。编排器必须完整传递 team-test 的路由决策（回退 team-impl/回退 team-spec），不可自行过滤或降级。

> SIGNAL：team-test 报告 `spec 遗漏` 通常意味着 SDD 的边界条件或异常场景章节不完整，不是 team-impl 的问题——回退到 team-spec 而非 team-impl。

**GATE** 子 Skill 可用性检查：

- CHECK `team-test` skill 是否存在
- **IF** 不可用 → **ASK_HUMAN**，展示选项：(a) 安装后继续 (b) 编排器手动执行但承诺补全 09-10 (c) 终止

**WRITE** checkpoint：`current_step=Step 4, phase=test-dispatching, status=IN_PROGRESS`

**ROUTE** `team-test`

调用方式取决于工具能力：

- **Claude Code**：直接执行 `/team-test`
- **支持 Agent tool 的工具**：通过 Agent tool 调度，传递以下 prompt

```
执行 team-test skill。

任务 slug：{slug}
模式：{完整 / --compact 精简}
输入：docs/tasks/{slug}/ 下的文件（完整模式：01-plan.md ~ 06-tdd-log.md 全部；精简模式：03-sdd.md + 04-boundary.md + 06-tdd-log.md）+ team-impl 代码变更（git diff）
约束：遵守 team-test Skill 步骤；四维覆盖；所有覆盖声明标注来源标签；全量测试运行。精简模式下 01-plan、02-context、05-risk 不存在属于正常。

读取 skills/team-test/SKILL.md 获取完整执行步骤。
```

**完成验证**（产出门禁）：

**FOR** `file` **IN** [`09-test-matrix.md`, `10-test-report.md`]：

- **ASSERT** `{file} EXISTS` && `有效行数 >= 5`
- **ASSERT** `10-test-report.md CONTAINS 测试输出证据（含退出码）`
- 任一不通过 → **ROLLBACK** team-test，指明缺失文件名

**READ** `10-test-report.md` 中 team-test 路由决策（→ team-review / → team-impl / → team-spec / → **ASK_HUMAN**）

**WRITE**（对话中）team-test 产出摘要：测试矩阵覆盖率 + 新增/修改测试数 + 路由决策（继续/回退）。

**WRITE** checkpoint：`current_step=Step 5, next_step=Step 6, phase=test, completed_steps 追加 Step 4`

**回退检查**（Constitutional Rule #7：同一 source→target 对回退 ≤ 2 次）：

**IF** team-test 报告发现 bug 或 spec 遗漏：

**MATCH** `test_issue`：

- `bug` → **WRITE** checkpoint：`rollback_counts test→impl +1` → **ROLLBACK** team-impl（**GOTO** Step 3，附 bug 上下文）
- `spec 遗漏` → **WRITE** checkpoint：`rollback_counts test→spec +1` → **ROLLBACK** team-spec（**GOTO** Step 2，附遗漏上下文）
- `同一对第 3 次回退` → **WRITE** checkpoint：`status=BLOCKED` → 强制 **ASK_HUMAN**
- `Kill Switch`（任务不可行）→ **WRITE** checkpoint：`status=BLOCKED` → **ASK_HUMAN**
- `人类需决策` → **WRITE** checkpoint：`status=BLOCKED` → **ASK_HUMAN**
- *DEFAULT* → 记录问题 → **GOTO** Step 5

**ELSE** → 测试全部通过 → **GOTO** Step 5

> SIGNAL：同一 `source→target` 对回退达到 2 次时，第 3 次不是"再试一次"——是系统性问题（SDD 不完整、架构不适配等），必须触发 `ASK_HUMAN` 让用户介入。

### Step 5：调度 team-review

> 代码审查是交付前最后的质量门禁。编排器必须确认 team-review 的五维度审查全部完成，且 P0/P1 问题已触发回退而非被标记为"后续处理"。

> TRAP：team-review 返回 `DONE_WITH_CONCERNS` 时，你会倾向于视为"基本完成"而继续流程。必须将 concerns 完整展示给用户，由用户决定是否继续。

**GATE** 子 Skill 可用性检查：

- CHECK `team-review` skill 是否存在
- **IF** 不可用 → **ASK_HUMAN**，展示选项：(a) 安装后继续 (b) 编排器手动执行但承诺补全 11-13 + task-rules (c) 终止

**WRITE** checkpoint：`current_step=Step 5, phase=review-dispatching, status=IN_PROGRESS`

**ROUTE** `team-review`

调用方式取决于工具能力：

- **Claude Code**：直接执行 `/team-review`
- **支持 Agent tool 的工具**：通过 Agent tool 调度，传递以下 prompt

```
执行 team-review skill。

任务 slug：{slug}
模式：{完整 / --compact 精简}
输入：docs/tasks/{slug}/ 全部文件（完整模式 01-10；精简模式 03-04 + 06-10）+ 代码 diff + 项目规范（CLAUDE.md / .cursor/rules/、AGENTS.md（如存在）、CONTRIBUTING.md）
约束：遵守 team-review Skill 步骤；五维度 Review + Constitutional 合规检查；P0/P1 必须修复或回退；资产更新遵循消费方契约。精简模式下 01-plan、02-context、05-risk 不存在属于正常，不标记为缺失。
回退上下文：{如有 team-test 报告的问题则附上，否则写"无"}

读取 skills/team-review/SKILL.md 获取完整执行步骤。
```

**READ** `11-review.md` 中 team-review 修复/回退决策

**IF** team-review 报告 `DONE_WITH_CONCERNS` 且 `route_target IN [team-impl, team-spec]`（P0/P1 回退场景，team-review 提前终止是正确行为）：

> team-review 发现 P0/P1 问题后以 DONE_WITH_CONCERNS 终止执行，仅产出 11-review.md，不产出 12-asset-update.md / 13-retrospective.md / task-rules.md。这是有向图回退的正确行为，跳过完成验证直接进入回退检查。

→ **WRITE**（对话中）team-review 回退摘要：P0/P1 问题描述 + 路由决策（→ team-impl / → team-spec）
→ 直接进入下方回退检查

**ELSE**（team-review 正常完成）：

**完成验证**（产出门禁）：

**FOR** `file` **IN** [`11-review.md`, `12-asset-update.md`, `13-retrospective.md`, `task-rules.md`]：

- **ASSERT** `{file} EXISTS` && `有效行数 >= 5`
- **ASSERT** `13-retrospective.md CONTAINS "新规则" || CONTAINS "本次沉淀"`
- 任一不通过 → **ROLLBACK** team-review，指明缺失文件名

**WRITE**（对话中）team-review 产出摘要：五维度审查结论 + P0/P1 问题数 + 路由决策（继续/回退）。**IF** `status == DONE_WITH_CONCERNS` → 完整展示 concerns 给用户。

**WRITE** checkpoint：`current_step=Step 6, next_step=Step 7, phase=review, completed_steps 追加 Step 5`

**回退检查**（Constitutional Rule #7：同一 source→target 对回退 ≤ 2 次）：

**IF** team-review 报告发现 P0/P1 bug 或 spec 遗漏：

**MATCH** `review_issue`：

- `bug` → **WRITE** checkpoint：`rollback_counts review→impl +1` → **ROLLBACK** team-impl（**GOTO** Step 3，附 bug 上下文）
- `spec 遗漏` → **WRITE** checkpoint：`rollback_counts review→spec +1` → **ROLLBACK** team-spec（**GOTO** Step 2，附遗漏上下文）
- `同一对第 3 次回退` → **WRITE** checkpoint：`status=BLOCKED` → 强制 **ASK_HUMAN**
- `Kill Switch` → **WRITE** checkpoint：`status=BLOCKED` → **ASK_HUMAN**
- `人类需决策` → **WRITE** checkpoint：`status=BLOCKED` → **ASK_HUMAN**
- *DEFAULT* → 记录问题 → **GOTO** Step 6

**ELSE** → 审查全部通过 → **GOTO** Step 6

### Step 6：补全团队级证据

> 团队级证据是协作可追溯性的保障。一致性检查必须在写入 14-team.md 之前完成，否则是"先写结论再找证据"。

**IF** `mode == compact` → 跳过此步，**GOTO** Step 7。checkpoint 中 `completed_steps` 不含 Step 6。

> Step 6 的检查和产出由编排器自身完成，不调度子 Skill。

#### 6.1 一致性自动化检查（先执行再写入 14-team.md）

1. **READ** `02-context.md` → 提取术语表 → **EXEC** `grep` 检查任务目录下所有文件中的不一致别名 → **ASSERT** `不一致别名数 == 0`
2. **EXEC** 检查任务目录下所有文件是否遵循统一 Markdown 标题层级 → **ASSERT** `标题层级一致`
3. **EXEC** `git log --oneline` → **ASSERT** `exit_code == 0` && `commit 消息格式 == type: description`
4. **READ** team-review 新增规则 → **ASSERT** `新增规则与已有规则无矛盾`
5. **IF** 多个模块级 AI 规范文件存在 → **ASSERT** `规范文件结构一致`
6. **READ** 任务目录下所有文件 → **ASSERT** `来源标签使用一致` && `表格格式统一` && `引用块风格统一`

**IF** 发现不一致 → 立即修复。

#### 6.2 确保每位成员有复盘

**READ** `13-retrospective.md` → **EXEC** `git log --format='%an' | sort -u` → **ASSERT** `exit_code == 0` → **IF** 多位贡献者 → **ASSERT** `每位成员有独立复盘段落或独立文件`。

#### 文件 14：`14-team.md`

**WRITE** `14-team.md`（模板见 `references/14-team-template.md`）：

```markdown
## §一 角色分工
| 角色 | 负责人 | 职责 | 产出物 |
|------|--------|------|--------|
| {role} | {person} | {responsibility} | {deliverable} |

## §二 一致性检查
| 检查项 | 结果 | 修复动作 |
|--------|------|---------|
| 术语一致性 | ✅/❌ | {action} |
| 标题层级一致性 | ✅/❌ | {action} |
| commit 消息格式 | ✅/❌ | {action} |

## §三 个人贡献
| 贡献者 | 产出物 | 提交数 |
|--------|--------|--------|
| {contributor} | {deliverables} | {count} |

## §四 质量审查数据
| 维度 | 真实问题数 | P0 | P1 | P2 |
|------|-----------|----|----|-----|
| {dimension} | {count} | {n} | {n} | {n} |
```

**IF** 仅 1 位人类作者 → §一 角色分工填写"用户 + AI Agent 团队"，§三 将用户审查/确认决策也计入贡献，§四 正常填写 team-review 审查数据。

#### 文件 15：`15-brief.md`

**WRITE** `15-brief.md`（模板见 `references/15-brief-template.md`）：

```markdown
## §一 Elevator Pitch
{3 句话：问题 → 方案 → 结果}

## §二 关键决策
| 决策点 | 选择 | 拒绝方案 | 理由 |
|--------|------|---------|------|
| {decision} | {chosen} | {rejected} | {why} |

## §三 AI 协作亮点
- {highlight_from_prompt_log_or_tdd_log}

## §四 测试覆盖概要
| 维度 | 用例数 | 通过 | 覆盖率 |
|------|--------|------|--------|
| {dimension} | {n} | {n} | {pct} |

## §五 遗留风险
- {risk_from_review}

## §六 改进承诺
- {commitment_from_retrospective}
```

填写方式：

- §一 Elevator Pitch：从 `01-plan.md` + `03-sdd.md` + `10-test-report.md` 提炼 3 句话
- §二 关键决策：从 `08-ai-decisions.md` 挑选 2-3 个最重要决策
- §三 AI 协作亮点：从 `07-prompt-log.md` 纠偏记录 + `06-tdd-log.md` bug 发现中提取
- §四 测试覆盖概要：从 `09-test-matrix.md` + `10-test-report.md` 提取
- §五 遗留风险：从 `11-review.md` §四 摘录
- §六 改进承诺：从 `13-retrospective.md` §三 摘录

**WRITE** checkpoint：`current_step=Step 7, next_step=Step 7.3, phase=finish, completed_steps 追加 Step 6`

### Step 7：分支完成处理

> 确保所有技术工作在人类验收前就绪。用户验收时看到的应该是可交付状态，不是半成品。

**READ** `12-asset-update.md` → **IF** CHANGELOG.md 需要更新但尚未更新 → 补全。

**ROUTE** `team-finish`：

- 传递 checkpoint 中的 `branch` 和 `base_branch` 信息
- `team-finish` 将验证测试 → 展示选项（merge/PR/keep/discard）→ 执行用户选择

**IF** `team-finish` 报告测试不通过 → **ROLLBACK** team-impl（附失败详情），修复完成后 **GOTO** Step 7。

**MATCH** `finish_result`：

- `merge` → **ASSERT** `merge_commit EXISTS`
- `PR` → **ASSERT** `PR 已创建`
- `keep` || `discard` → 记录用户决策
- *DEFAULT* → **ASK_HUMAN**，请求用户选择分支处理方式

**WRITE** checkpoint：`current_step=Step 7.3, next_step=Step 7.5, phase=finish, completed_steps 追加 Step 7`

### Step 7.3：HUMAN_ACCEPT 人类验收 + 分期决策

> HUMAN_ACCEPT 是用户对整个交付物的最终确认，不可省略。展示内容必须让用户在不读代码的情况下做出有效判断。

**GATE** 协作文档完整性检查（进入 HUMAN_ACCEPT 前强制执行）：

**IF** `mode == full`：

- **FOR** `file` **IN** [`06-tdd-log.md`, `07-prompt-log.md`, `08-ai-decisions.md`, `09-test-matrix.md`, `10-test-report.md`, `11-review.md`, `12-asset-update.md`, `13-retrospective.md`, `14-team.md`, `15-brief.md`, `task-rules.md`]：
  - **ASSERT** `{file} EXISTS` && `有效行数 >= 5`
  - 任一不通过 → **ROLLBACK** 对应 Step（06-08 → Step 3；09-10 → Step 4；11-13/task-rules → Step 5；14-15 → Step 6），附缺失文件名

**ELSE**（`mode == compact`）：

- **FOR** `file` **IN** [`06-tdd-log.md`, `07-prompt-log.md`, `08-ai-decisions.md`, `09-test-matrix.md`, `10-test-report.md`, `11-review.md`, `12-asset-update.md`, `13-retrospective.md`, `task-rules.md`]：
  - **ASSERT** `{file} EXISTS` && `有效行数 >= 5`
  - 任一不通过 → **ROLLBACK** 对应 Step

**WRITE**（对话中）向用户展示：交付物清单 + 代码 diff 摘要。

- **IF** `mode == full` → 还展示 `14-team.md` 和 `15-brief.md` 核心内容
- **IF** `mode == compact` → 展示 `11-review.md` 审查结论 + `13-retrospective.md` 改进承诺

**IF** `docs/delivery-checklist.md EXISTS` → **READ** 检查 `- [ ]` 项完成情况 → 未完成项列入 HUMAN_ACCEPT 展示，供用户判断。

**MATCH** `user_decision`：

- `验收通过` → **WRITE** checkpoint：`completed_steps 追加 HUMAN_ACCEPT` → **GOTO** Step 7.5
- `验收不通过` → 根据反馈回退对应 Step（spec 问题 → **GOTO** Step 2；实现问题 → **GOTO** Step 3；测试问题 → **GOTO** Step 4；审查问题 → **GOTO** Step 5）
- `后续分期` → **IF** `01-plan.md` §二 定义了后续分期候选 → **GOTO** 7.3.1
- *DEFAULT* → 请求用户明确决策

#### 7.3.1：后续分期启动

> 用户验收通过后，如 `01-plan.md` 定义了后续分期候选，启动下一期任务。

1. **WRITE**（对话中）候选项 + 触发条件给用户
2. **IF** 用户批准：
   - **WRITE** checkpoint：`phase=phasing, parent_slug={当前slug}, next_phase_n={N}`
   - **GOTO** Step 1（CONFIRM_GOAL 简化为单句确认；Step 1 的 RESOLVE `slug` 将检测 checkpoint 中 `parent_slug` 触发分期任务分支，自动扫描目录生成新序号）
   - team-spec 调度时额外传递上期 `01-plan.md` 候选表和 `03-sdd.md` 路径

   **ELSE** → 记录用户决策，流程结束

### Step 7.5：归档与知识合并

> 知识沉淀是任务的长期价值。可泛化规则必须合并到项目级规范，否则下个任务会重复踩坑。

1. **READ** `docs/tasks/{slug}/task-rules.md` → **WRITE** 标记为"可泛化"的规则到项目级/模块级 AI 规范文件
2. **IF** 项目维护 `docs/specs/` 目录 → **WRITE** 本次 `03-sdd.md` 关键规格合并进去
   - **IF** 增量模式 → 执行 delta 合并（ADDED 追加、MODIFIED 替换、REMOVED 删除）
   - **IF** 冲突 → 以本次 SDD 为准，在 commit message 中注明
3. **WRITE** `docs/tasks/progress.md`（**注意是 `docs/tasks/` 根目录**）追加：

```markdown
| {slug} | {YYYY-MM-DD} | `DONE` / `DONE_WITH_CONCERNS` | {起始commit..结束commit} | {一句话摘要} |
```

4. **IF** 本次变更影响 AGENTS.md 架构描述 → **WRITE** 同步更新

**进度账本模板**（首次创建时使用）：

```markdown
# 任务进度账本

> 跨 session 持久化，防止任务重复派发

| Slug | 日期 | 状态 | Commit 范围 | 摘要 |
| ---- | ---- | ---- | ----------- | ---- |
```

### Step 8：最终质量检查

> 最终质量检查是流程的守门员。所有检查项必须基于新鲜执行结果，不可引用之前步骤的缓存输出。

> SIGNAL：`unchecked_items > 3` 通常意味着某个 Agent 被跳过或产出不完整——不是逐条补全的问题，而是需要回退对应 Agent 重新执行。

**RESOLVE** `mode`（首个命中即停）：

1. `READ("docs/tasks/{slug}/.checkpoint.json").mode`
2. *DEFAULT* → `full`

**IF** `mode == compact`：

- `[完整模式]` 项跳过
- `[精简替代]` 项替换原项
- D5 整组跳过

**ELSE**：

- 所有检查项正常执行

**GATE** 全部检查项通过才可声明质量检查通过：

**硬门槛（7 项全部必须通过）：**

- [ ] G1: `[完整模式]` **ASSERT** `01-plan.md CONTAINS 目标澄清、上下文、阶段拆分、修改范围、验证计划`。`[精简替代]` **ASSERT** `03-sdd.md CONTAINS 任务目标和关键设计决策`
- [ ] G2: **ASSERT** `04-boundary.md 有 allow/deny 两个方向`
- [ ] G3: **ASSERT** `09-test-matrix.md EXISTS` && `10-test-report.md EXISTS` && `测试代码 EXISTS`
- [ ] G4: **EXEC** 项目 CI 全量检查 → **ASSERT** `exit_code == 0` && `failures == 0`
- [ ] G5: **ASSERT** `项目 AI 规范中每条规则 CONTAINS 触发条件 + 可执行指令`
- [ ] G6: `[完整模式]` **ASSERT** `05-risk.md 有风险识别` && `11-review.md §四 有剩余风险说明`。`[精简替代]` **ASSERT** `11-review.md §四 有剩余风险说明`
- [ ] G7: `[完整模式]` **ASSERT** `08-ai-decisions.md 能解释关键决策` && `15-brief.md 有决策解释表`。`[精简替代]` **ASSERT** `08-ai-decisions.md 能解释关键决策`

**D1 AI 协作资产沉淀（25 分）：**

- [ ] D1.1 **ASSERT** `分层组织：项目级 + 模块级 + task-rules.md 三层齐全`
- [ ] D1.2 **ASSERT** `8 类内容覆盖`（业务术语/架构/代码结构/接口/编码规范/测试/Review/交付有对应文件）。不满足 → **ROLLBACK** team-review 补建
- [ ] D1.3 **ASSERT** `12-asset-update.md 中每条规则有触发条件 + 可执行指令 + 示例`
- [ ] D1.4 **ASSERT** `工具适配 >= 2 类`
- [ ] D1.5 **ASSERT** `项目 AI 规范有资产维护机制段落`

**D2 AI 协作任务规划（25 分）：**

- [ ] D2.1 `[完整模式]` **ASSERT** `01-plan.md 有成功标准 >= 3 条` && `非目标 >= 2 条`。`[精简替代]` **ASSERT** `03-sdd.md §一 有明确目标`
- [ ] D2.2 `[完整模式]` **ASSERT** `02-context.md 有必要引用 + 已排除上下文`。`[精简替代]` **ASSERT** `04-boundary.md 有引用文件列表`
- [ ] D2.3 `[完整模式]` **ASSERT** `01-plan.md 有 >= 5 阶段拆分`。`[精简替代]` **ASSERT** `03-sdd.md 有分期说明或阶段划分`
- [ ] D2.4 **ASSERT** `04-boundary.md 有 allow/deny + 依赖约束`
- [ ] D2.5 `[完整模式]` **ASSERT** `05-risk.md 有验证计划` && `停下来问人条件 >= 3 个`。`[精简替代]` **ASSERT** `03-sdd.md §三 有风险相关设计决策` || `11-review.md §四 有剩余风险说明`

**D3 AI 交付质量保障（30 分）：**

- [ ] D3.1 **ASSERT** `03-sdd.md 含输入/输出/边界/异常/验收 Checklist`
- [ ] D3.2 **READ** `06-tdd-log.md` → **ASSERT** `RED 失败输出在前` && `GREEN 通过输出在后` && `git log 中 test: 提交早于 feat:/fix:`
- [ ] D3.3 **ASSERT** `09-test-matrix.md 四维矩阵 EXISTS` && `10-test-report.md §八 回归验证 EXISTS`
- [ ] D3.4 **ASSERT** `06-tdd-log.md 有修复记录` && `11-review.md 有修复记录`
- [ ] D3.5 **ASSERT** `11-review.md 含五维度审查` && `§四 剩余风险 EXISTS`

**D4 AI 使用过程与复盘（10 分）：**

- [ ] D4.1 **ASSERT** `07-prompt-log.md 每条含五要素`
- [ ] D4.2 **ASSERT** `07-prompt-log.md 每条含效果记录`；**IF** 存在偏离 → **ASSERT** `有纠偏前后对比`
- [ ] D4.3 **ASSERT** `07-prompt-log.md 有关键过程记录` && `08-ai-decisions.md 有关键过程记录`
- [ ] D4.4 **ASSERT** `13-retrospective.md 有「本次沉淀的新规则」`
- [ ] D4.5 `[完整模式]` **ASSERT** `15-brief.md 有 Elevator Pitch + 决策解释 + 亮点 + 测试覆盖 + 风险`。`[精简替代]` 跳过

**D5 团队协作表现（10 分）：**

**IF** `mode == compact` → D5 整组跳过。

- [ ] D5.1 **ASSERT** `14-team.md §一 有角色/负责人/职责/产出物`
- [ ] D5.2 **ASSERT** `14-team.md §二 一致性检查全部通过或已修复`
- [ ] D5.3 **ASSERT** `14-team.md §四 真实问题占比 > 0`
- [ ] D5.4 **ASSERT** `14-team.md §三 每位贡献者有明确产出物和提交数`
- [ ] 我是否因为检查项太多而对某些项草草通过了？

**IF** `unchecked_items > 0` → 回退对应 Step 补全（D1/D3 缺失 → **GOTO** Step 5；D2 缺失 → **GOTO** Step 2；D4 缺失 → **GOTO** Step 3；D5 缺失 → **GOTO** Step 6）。

全部通过 → **WRITE** checkpoint：`status=DONE, completed_steps 追加 Step 7.5 和 Step 8`。

此时且仅此时 `status` 设为 `DONE`（如有保留意见则设为 `DONE_WITH_CONCERNS`）。

## STOP_SIGNALS

- **跳过** CONFIRM_GOAL 或 HUMAN_ACCEPT 人类介入点
- **延迟**回退（"先记着后面一起修"）
- **信任** Agent 自我声明而不验证产出
- **超出**预算不砍范围，或亲自执行实现代码而非 dispatch 子 Skill

## CONSTITUTIONAL_RULES

**REF** `_team-rules/constitutional-rules.md` — 9 条 Constitutional Rules
**REF** `_team-rules/first-principles.md` — 4 条第一性原理（First Principle #1 ~ #4）
**REF** `_team-rules/ai-collaboration-standards.md` — AI 协作资产与 Prompt 工程规范
**REF** `_team-rules/spec-driven-workflow.md` — 有向图回退规则与回退次数上限

编排阶段尤其注意：

- **Rule #1 人类介入是一等公民**：CONFIRM_GOAL-HUMAN_ACCEPT 不可被任何 Agent 自动确认，"用户没回复就默认同意"是违规 `_team-rules/first-principles.md: First Principle #1`
- **Rule #2 有向图回退**：team-test/team-review 发现问题必须 `ROLLBACK` 对应 Agent，不可"先记着后面一起修" `_team-rules/first-principles.md: First Principle #4`
- **Rule #7 回退次数上限**：同一 source→target 对回退 ≤ 2 次，第 3 次强制触发 `ASK_HUMAN` `_team-rules/first-principles.md: First Principle #1`
- **Rule #9 TDD 顺序不可逆**：team-impl 完成后必须验证 `06-tdd-log.md` 中 RED 在 GREEN 之前 `_team-rules/first-principles.md: First Principle #2`

## SELF_CHECK

**GATE** 产出前自检（全部通过才可声明完成）：

- [ ] **IF** `mode == full` → **ASSERT** `17 个文件已产出`；**IF** `mode == compact` → **ASSERT** `核心文件已产出`
- [ ] **ASSERT** `CONFIRM_GOAL 和 HUMAN_ACCEPT 经过人类确认`（完整模式还需 CONFIRM_SPEC；精简模式需 CONFIRM_SPEC 单句确认）
- [ ] **ASSERT** `回退计数未超上限`（同一对 <= 2 次）
- [ ] **ASSERT** `Step 8 质量检查全部通过`
- [ ] **IF** team-review 要求 → **ASSERT** `CHANGELOG.md 已更新`
- [ ] **ASSERT** `进度账本已更新`
- [ ] **ASSERT** `无占位符残留（{N}、{slug} 等已被实际值替换）`
- [ ] **ASSERT** `IRON_LAW 遵守` — 未自己写实现代码、未跳过人类介入点
- [ ] 我是否因为"这步很简单"而跳过了某个人类介入点？
- [ ] 我是否把所有 Agent 的 concerns 都传达给了用户，还是悄悄忽略了某些？
- [ ] 我是否在回退时传递了完整的四要素上下文（问题、位置、期望、建议），还是只说了"有 bug"？

## COMPLETION

**REF** `_team-rules/four-state-protocol.md` — 四态完成状态

**MATCH** `result`：

- `全流程完成 + 质量检查通过` → **DONE**（`模式: {完整/精简}`, `文件: {17/11}`, `质量检查: pass`）
- `完成但有保留意见` → **DONE_WITH_CONCERNS**（`concerns: [...]`）
- `缺少关键上下文` → **NEEDS_CONTEXT**
- `被阻塞`（Kill Switch / 人类决策）→ **BLOCKED** → **ASK_HUMAN**
- *DEFAULT* → **BLOCKED** → **ASK_HUMAN**

## INTEGRATION

**被谁调用：**

- 用户直接调用（独立使用）

**配对使用：**

- `team-spec` — REQUIRED：编排流程中必须调度规格制定
- `team-impl` — REQUIRED：编排流程中必须调度实现
- `team-test` — REQUIRED：编排流程中必须调度测试审计
- `team-review` — REQUIRED：编排流程中必须调度代码审查
- `team-finish` — 分支完成处理

## NEXT

- 编排完成 → 使用 `team-finish` 合并分支
- 需要协作评分 → 使用 `team-score` 获取质量评分
