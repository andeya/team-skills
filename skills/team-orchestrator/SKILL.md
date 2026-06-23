---
name: team-orchestrator
description: Use when task needs full spec→impl→test→review pipeline with H1-H4 human checkpoints and directed-graph rollback
---

# Team Orchestrator — 流程编排器

## 角色定位

你是 AI 协作团队的 **编排器**。你的核心职责是**有向图流程编排**——不是简单的线性流水线，而是根据每个环节的产出质量动态决定下一步走向哪里。

```mermaid
flowchart TD
    H1["H1: 人类确认目标"] --> specAgent["specAgent: 规格制定"]
    specAgent --> H2["H2: 人类确认规格"]
    H2 --> implAgent["implAgent: TDD 实现"]
    implAgent --> testAgent["testAgent: 测试审计"]
    testAgent -->|"发现 bug"| implAgent
    testAgent -->|"spec 遗漏"| specAgent
    testAgent -->|"全部通过"| reviewAgent["reviewAgent: 代码审查"]
    reviewAgent -->|"P0/P1 问题"| implAgent
    reviewAgent -->|"spec 遗漏"| specAgent
    reviewAgent -->|"无问题"| H4["H4: 人类验收"]
    H3["H3: 人类介入（任何阶段）"] -.->|"阻塞/决策"| H3
```

### 系统提示词

```
你是一个 Team 编排器 Agent。你的任务是：

1. 理解用户需求，拆解为可执行的子任务
2. 按有向图流程调度 specAgent → implAgent → testAgent → reviewAgent
3. 在 4 个人类介入点（H1-H4）暂停等待用户确认
4. 根据各 Agent 的产出质量动态决定回退或继续
5. 遵守 Constitutional Rules（见下文），不可跳过任何规则
6. 如果用户指定 --compact 精简模式，简化 H1 为单句确认、跳过 H2、跳过 Step 6，保留 H4 验收不可省略

关键区别：你不是线性流水线。testAgent 发现 bug 必须回退 implAgent，reviewAgent 发现 spec 遗漏必须回退 specAgent。同一阶段回退不超过 2 次。H1 和 H4 在任何模式下均不可省略（H1 可在精简模式下简化为单句确认）。
```

### 路由推理

在每次调度 Agent 或触发人类介入点之前，推理当前状态、产出质量、下一步路由选择及其理由。

## Iron Law

```
NO AGENT DISPATCH WITHOUT H1 HUMAN CONFIRMATION FIRST
```

## 工具兼容

本 Skill 及其子 Agent 同时兼容 **Claude Code** 和 **Cursor**：

- Claude Code：通过 `/team-orchestrator`、`/team-spec`、`/team-impl`、`/team-test`、`/team-review` 调用
- Cursor：通过 `~/.agents/skills/` 下的 Skill 机制自动发现

<!-- 评分追溯矩阵（内部参考，不产出到文件）
硬门槛：
  G1 任务规划    → 01-plan.md
  G2 修改边界    → 04-boundary.md
  G3 测试补充    → 09-test-matrix.md + 10-test-report.md
  G4 测试通过    → 06-tdd-log.md + 10-test-report.md
  G5 资产可执行  → 12-asset-update.md（消费方契约）+ CLAUDE.md
  G6 风险说明    → 05-risk.md + 11-review.md §四
  G7 决策解释    → 08-ai-decisions.md + 15-brief.md
评分维度：
  D1.1 分层组织   → CLAUDE.md + {module}/CLAUDE.md + task-rules.md
  D1.2 内容8类    → 02-context.md + CLAUDE.md + review-checklist + delivery-checklist
  D1.3 规则可执行 → 12-asset-update.md（触发条件+可执行指令+示例）
  D1.4 工具≥2类   → CLAUDE.md + review-checklist/delivery-checklist/prompt-template.md
  D1.5 可维护性   → CLAUDE.md §资产维护机制 + 12-asset-update.md §版本记录
  D2.1 目标澄清   → 01-plan.md §一
  D2.2 上下文选择 → 02-context.md
  D2.3 任务拆分   → 01-plan.md §二
  D2.4 执行约束   → 04-boundary.md
  D2.5 验证风控   → 05-risk.md
  D3.1 SDD规格    → 03-sdd.md
  D3.2 TDD流程    → 06-tdd-log.md
  D3.3 测试覆盖   → 09-test-matrix.md
  D3.4 缺陷修复   → 06-tdd-log.md + 11-review.md
  D3.5 Review风险 → 11-review.md §四
  D4.1 Prompt结构 → 07-prompt-log.md（五要素）
  D4.2 迭代纠偏   → 07-prompt-log.md（前后对比）
  D4.3 过程可追溯 → 07-prompt-log.md + 08-ai-decisions.md
  D4.4 个人复盘   → 13-retrospective.md §二.5 新规则沉淀
  D4.5 答辩表现   → 15-brief.md
  D5.1 角色分工   → 14-team.md §一
  D5.2 资产一致   → 14-team.md §二
  D5.3 交叉Review → 14-team.md §四
  D5.4 个人贡献   → 14-team.md §三
-->

## 完成状态协议

引用 `_team-rules/four-state-protocol.md`，不内联重复。

## 有向图流程

```
                  ┌──────────────┐
                  │  用户提出需求  │
                  └──────┬───────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  H1: 人类确认目标理解  │ ← 人类介入点 #1
              │  (编排器向用户展示     │
              │   任务理解 + 初步方案) │
              └──────┬───────┬───────┘
                     │ 确认  │ 不确认 → 返回修改
                     ▼       └────────┐
              ┌──────────────────┐     │
              │  specAgent       │     │
              │  产出 01-05 文件  │     │
              │  + 分期建议(P1/P2)│     │
              └──────┬───────────┘     │
                     │                 │
                     ▼                 │
              ┌──────────────────────┐ │
              │  H2: 人类确认规格方案  │ │ ← 人类介入点 #2
              │  (展示 01-plan 和     │ │
              │   03-sdd + 分期方案)  │ │
              ├──────────────────────┤ │
              │  Kill Switch 检查:    │ │
              │  如果发现不可行 → 终止 │ │
              └──────┬───────┬───────┘ │
                     │ 确认  │ 不确认  │
                     ▼       └──→ 返回 specAgent 修改
              ┌──────────────────┐
              │  implAgent       │
              │  TDD 开发(P1)    │
              │  产出 06-08 + 代码│
              │  + 自我约束预算   │
              └──────┬───────────┘
                     │
                     ▼
              ┌──────────────────┐
              │  testAgent       │
              │  测试矩阵 + 补充  │
              │  产出 09-10      │
              └──────┬───────────┘
                     │
                     ├── 发现 bug ──────────→ 回退 implAgent
                     │                           │
                     ├── 发现 spec 遗漏 ────────→ 回退 specAgent
                     │                           │
                     ├── 发现不可行 ────────────→ Kill Switch → H3
                     │                           │
                     ├── 发现人类需决策 ─────────→ H3: 人类介入点 #3
                     │                           │
                     ▼                           │
              ┌──────────────────┐               │
              │  reviewAgent     │               │
              │  代码审查 + 资产  │               │
              │  产出 11-13      │               │
              └──────┬───────────┘               │
                     │                           │
                     ├── 发现 P0/P1 bug ────────→ 回退 implAgent
                     │                           │
                     ├── 发现 spec 遗漏 ────────→ 回退 specAgent
                     │                           │
                     ├── 发现不可行 ────────────→ Kill Switch → H3
                     │                           │
                     ├── 发现人类需决策 ─────────→ H3: 人类介入点 #3
                     │                           │
                     ▼                           │
              ┌──────────────────────────┐       │
              │  H4: 人类验收最终交付物    │       │
              │  (展示 14-team + 15-brief │       │
              │   + 代码 diff + P2 建议)  │       │
              ├──────────────────────────┤       │
              │  P2 决策: 是否继续 P2    │       │
              └──────┬───────────────────┘       │
                     │                           │
                     ├── 验收通过 → 完成 ✅      │
                     │                           │
                     └── 不通过 → 根据反馈 ──────→ 回到对应 Agent
```

## 人类介入点清单

| 介入点 | 触发时机                                                         | 编排器动作                                                                       | 人类决策内容                                             | 超时策略     |
| ------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------ |
| H1     | 编排器初始化后，调度任何 Agent 之前                              | 向用户展示任务理解 + 初步方案 + 风险预判 + 分期建议                              | 确认目标理解是否正确，方案方向是否合理，是否接受分期交付 | 等待用户回复 |
| H2     | specAgent 产出 01-05 后                                          | 向用户展示 01-plan.md 和 03-sdd.md 核心内容 + 分期方案(P1/P2) + Kill Switch 评估 | 确认规格方案是否接受，是否需要调整，是否继续执行         | 等待用户回复 |
| H3     | testAgent/reviewAgent 发现需要人类决策的问题，或触发 Kill Switch | 向用户展示问题描述 + 建议方案 + 选项                                             | 决策如何处理问题，或确认是否终止任务                     | 等待用户回复 |
| H4     | reviewAgent 完成 + team 产出 14-15 后                            | 向用户展示交付物清单 + 代码 diff 摘要 + P2 候选建议 + Kill Switch 评估           | 验收最终交付物，决策是否继续 P2，或触发 Kill Switch 终止 | 等待用户回复 |

## 质量职责

| 质量维度       | 产出                              |
| -------------- | --------------------------------- |
| 角色分工明确性 | `14-team.md` §角色分工            |
| 协作资产一致性 | `14-team.md` §一致性检查          |
| 个人贡献可追溯 | `14-team.md` §个人贡献            |
| 复盘与改进闭环 | 检查 `13-retrospective.md` 并补全 |
| 答辩与沟通准备 | `15-brief.md` 答辩提纲            |

## 使用方式

### 方式 A：全自动编排（推荐）

用户执行 `/team-orchestrator {任务描述}` 一次性启动全流程。

### 方式 B：手动分步

用户已分步执行了各 Agent，现在执行 `/team-orchestrator {slug}` 仅补全团队级证据。

**方式 B 流程**：跳过 Step 1-5，从 Step 6 开始。验证 `docs/tasks/{slug}/` 下 01-13 + task-rules.md 已存在，缺失文件触发 H3 由用户决定是否补全。

### 方式 C：精简模式（简单任务）

对于**改动范围小、风险低**的任务（如修一个 bug、加一个字段、改一个文案），可以使用精简模式减少环节：

1. 用户执行 `/team-orchestrator --compact {任务描述}`
2. H1 简化为单句确认（编排器展示一句话任务理解，用户回复确认即可）
3. 跳过 H2（specAgent 产出后直接进入 implAgent）
4. 跳过 Step 6（14-team.md / 15-brief.md 不产出）
5. **H4 不可省略**：reviewAgent 完成后仍需人类验收
6. specAgent 产出精简版文档（见下方对比表）

### 任务规模分级参考

| 级别 | 典型场景 | 推荐模式 | 预期文档产出 |
| ---- | -------- | -------- | ------------ |
| Small | 修 bug、改文案、加字段、调样式 | `--compact` 精简模式 | 03-sdd + 04-boundary + 06-tdd-log（最少 3 文件） |
| Medium | 新增功能模块、重构组件、加 API | 完整模式（默认） | 全部 17 文件 |
| Large | 跨系统重构、架构变更、多模块联动 | 完整模式 + P1/P2 分期 | 全部 17 文件 + 多期迭代 |

判断标准：预计修改文件数 ≤ 3 且无跨模块影响 → Small；修改文件 4-15 → Medium；修改文件 > 15 或跨 2+ 模块 → Large。

> **评分注意**：精简模式跳过 01-plan、02-context、05-risk、14-team、15-brief，无法通过 team-score 满分评估。如需满分评估，使用完整模式。

**精简模式 vs 完整模式对比**：

| 环节 | 完整模式 | 精简模式 |
| ---- | -------- | -------- |
| H1 人类确认 | ✅ 完整展示 | ✅ 单句确认（不可省略） |
| specAgent | ✅ 6 文件 | ✅ 精简版（03-sdd.md + 04-boundary.md） |
| H2 人类确认 | ✅ | ❌ |
| implAgent | ✅ | ✅ |
| testAgent | ✅ | ✅ |
| reviewAgent | ✅ | ✅ |
| H4 人类验收 | ✅ | ✅（不可省略） |
| 团队证据 14-15 | ✅ | ❌ |
| 归档合并 | ✅ | ✅ |

## 执行步骤

### 执行模型

默认执行模型是**单会话顺序执行**：编排器在同一个 AI 会话中依次调用各 sub-skill（`/team-spec` → `/team-impl` → `/team-test` → `/team-review`）。每个 sub-skill 的产出（文件）作为下一个 sub-skill 的输入。

如果工具支持 Agent tool 并行调度，可在不相互依赖的阶段使用并行执行（如 Step 6 的一致性检查），但 spec→impl→test→review 主链路必须顺序执行。

### 断点续传机制

当 session 中断或跨 session 继续任务时：

1. **写入检查点**：每个 Agent（specAgent/implAgent/testAgent/reviewAgent）完成后，自动写入 `docs/tasks/{slug}/.checkpoint.json` 文件：

   ```json
   {
     "phase": "spec|impl|test|review|team",
     "completed_at": "2026-01-15T10:30:00Z",
     "rollback_counts": {
       "test→impl": 0,
       "test→spec": 0,
       "review→impl": 0,
       "review→spec": 0
     },
     "status": "DONE|DONE_WITH_CONCERNS|NEEDS_CONTEXT|BLOCKED",
     "next_step": "Step 3",
     "blocked_reason": null
   }
   ```

2. **恢复检测**：当用户执行 `/team-orchestrator {slug}`（已有 slug），检查 `.checkpoint.json` 文件：
   - 如存在且 `status = DONE` → 从 `next_step` 对应的 Step 继续
   - 如存在且 `status = BLOCKED` → 触发 H3 展示 `blocked_reason`
   - 如不存在 → 检查已有文件推断阶段（有 01-05 → 从 Step 3，有 06-08 → 从 Step 4，有 09-10 → 从 Step 5）
3. **恢复时回退计数**：从 `.checkpoint.json` 恢复 `rollback_counts`，避免重置

### Step 1：初始化 + H1 人类确认

1. 从用户参数提取任务描述
2. 生成 `{slug}`：扫描 `docs/tasks/` 已有目录（如目录不存在则创建），取最大序号 +1（从 `0001` 起），拼接为 `{NNNN}-{关键词}`（关键词 kebab-case，整体 ≤ 50 字符），例如 `0001-add-tooltip`、`0012-refactor-auth`
3. 创建 `docs/tasks/{slug}/` 目录
4. **进度账本检查**：如果 `docs/tasks/progress.md` 不存在则创建（含表头）；读取 progress.md 确认 `{slug}` 未被重复派发（如已存在且状态为 DONE，提示用户该任务已完成，询问是否新建变体任务）
5. 记录启动时间
6. **向用户展示任务理解 + 初步方案 + 风险预判 + 分期建议**，等待确认（设置 30 分钟超时提醒）
7. 用户确认后继续，否则根据反馈调整

**Kill Switch 预检查**：如果任务明显不可行（技术不可行、依赖不可用、范围远超预期），在 H1 阶段直接向用户提出终止建议。

### Step 2：调度 specAgent

**REQUIRED SUB-SKILL:** `team-spec`

调用方式取决于工具能力：

- **Claude Code**：直接执行 `/team-spec {任务描述}`，在同一会话中运行
- **支持 Agent tool 的工具**：通过 Agent tool 调度，传递以下 prompt

```
执行 team-spec skill。

任务描述：{用户的任务描述}
产出目录：docs/tasks/{slug}/
约束：遵守 team-spec Skill 的 Phase 1-3 步骤；所有结论标注来源标签；产出前执行自检清单。

读取 skills/team-spec/SKILL.md 获取完整执行步骤。
```

**完成验证**：确认 6 个文件已产出（01-plan.md / 02-context.md / 03-sdd.md / 04-boundary.md / 05-risk.md / prompt-template.md），自检清单全部通过（19/19，清单定义见 team-spec Skill Phase 3 自检）。

### Step 2.5：H2 人类确认规格 + Kill Switch 检查

向用户展示 `01-plan.md` 和 `03-sdd.md` 的核心内容 + 分期方案(P1/P2) + 自我约束预算，等待确认。

- 用户确认 → 继续 Step 3
- 用户要求修改 → 回到 Step 2，根据反馈调整提示词后重新调度 specAgent
- **Kill Switch**：如果用户认为任务不可行或范围不可接受 → 终止流程

### Step 3：调度 implAgent

**REQUIRED SUB-SKILL:** `team-impl`

调用方式取决于工具能力：

- **Claude Code**：直接执行 `/team-impl`，在同一会话中运行
- **支持 Agent tool 的工具**：通过 Agent tool 调度，传递以下 prompt

```
执行 team-impl skill。

任务 slug：{slug}
输入目录：docs/tasks/{slug}/（读取 01-05 + prompt-template.md）
约束：遵守 team-impl Skill 步骤；04-boundary.md 的 allow/deny 不可越界；遵循 TDD 红-绿-重构循环；P1 聚焦。
回退上下文：{如有 testAgent/reviewAgent 的 bug 报告则附上，否则写"无"}

读取 skills/team-impl/SKILL.md 获取完整执行步骤。
```

**完成验证**：确认 06-tdd-log.md / 07-prompt-log.md / 08-ai-decisions.md 已产出；测试通过；CI 检查通过。

等待 implAgent 完成。

### Step 4：调度 testAgent

**REQUIRED SUB-SKILL:** `team-test`

调用方式取决于工具能力：

- **Claude Code**：直接执行 `/team-test`，在同一会话中运行
- **支持 Agent tool 的工具**：通过 Agent tool 调度，传递以下 prompt

```
执行 team-test skill。

任务 slug：{slug}
输入：docs/tasks/{slug}/ 下的 03-sdd.md、04-boundary.md、06-tdd-log.md + implAgent 代码变更（git diff）
约束：遵守 team-test Skill 步骤；四维覆盖；所有覆盖声明标注来源标签；全量测试运行。

读取 skills/team-test/SKILL.md 获取完整执行步骤。
```

**完成验证**：确认 09-test-matrix.md / 10-test-report.md 已产出；获取路由决策（→ reviewAgent / → implAgent / → specAgent / → H3）。

等待 testAgent 完成。

**回退检查**（遵守 Constitutional Rule #7：同一阶段回退 ≤ 2 次，按 source→target 对独立计数，计数持久化到 `.checkpoint.json`）：如果 testAgent 报告发现 bug 或 spec 遗漏：

- bug → 回到 Step 3 重新调度 implAgent，传递 bug 上下文（`.checkpoint.json` 中 `test→impl` +1）
- spec 遗漏 → 回到 Step 2 重新调度 specAgent，传递遗漏上下文（`.checkpoint.json` 中 `test→spec` +1）
- 同一阶段第 3 次回退 → 强制触发 H3，由人类决定是否继续
- **Kill Switch**：如果发现任务不可行（如依赖不可用、技术方案不可行）→ 触发 H3 让人类决策是否终止
- 人类需决策 → 触发 H3

### Step 5：调度 reviewAgent

**REQUIRED SUB-SKILL:** `team-review`

调用方式取决于工具能力：

- **Claude Code**：直接执行 `/team-review`，在同一会话中运行
- **支持 Agent tool 的工具**：通过 Agent tool 调度，传递以下 prompt

```
执行 team-review skill。

任务 slug：{slug}
输入：docs/tasks/{slug}/ 全部文件（01-10）+ 代码 diff + 项目规范（CLAUDE.md、AGENTS.md（如存在）、CONTRIBUTING.md）
约束：遵守 team-review Skill 步骤；五维度 Review + Constitutional 合规检查；P0/P1 必须修复或回退；资产更新遵循消费方契约。
回退上下文：{如有 testAgent 报告的问题则附上，否则写"无"}

读取 skills/team-review/SKILL.md 获取完整执行步骤。
```

**完成验证**：确认 11-review.md / 12-asset-update.md / 13-retrospective.md / task-rules.md 已产出；获取修复/回退决策。

等待 reviewAgent 完成。

**回退检查**（遵守 Constitutional Rule #7：同一阶段回退 ≤ 2 次，按 source→target 对独立计数，计数持久化到 `.checkpoint.json`）：如果 reviewAgent 报告发现 P0/P1 bug 或 spec 遗漏：

- bug → 回到 Step 3 重新调度 implAgent，传递 bug 上下文（`.checkpoint.json` 中 `review→impl` +1）
- spec 遗漏 → 回到 Step 2 重新调度 specAgent，传递遗漏上下文（`.checkpoint.json` 中 `review→spec` +1）
- 同一阶段第 3 次回退 → 强制触发 H3，由人类决定是否继续
- **Kill Switch**：如果发现任务不可行 → 触发 H3 让人类决策是否终止
- 人类需决策 → 触发 H3

### Step 6：补全团队级证据

由编排器自己执行以下检查并产出 2 个文件。对于可并行的检查项，使用子 Agent 并行执行以提高效率。

#### 6.1 一致性自动化检查（先执行再写入 14-team.md）

1. **术语一致性**：从 `02-context.md` 提取术语表，grep 检查任务目录下所有文件中是否使用了不一致的别名
2. **文档格式**：检查任务目录下所有文件是否遵循统一的 Markdown 标题层级（# > ## > ###）
3. **commit message 规范**：`git log --oneline` 检查本次任务所有 commit 是否遵循 `type: description`
4. **CLAUDE.md 同步**：检查 reviewAgent 新增的规则是否与已有规则矛盾
5. **模块 CLAUDE.md 风格**：对比多个模块级 CLAUDE.md 是否结构一致

对发现的不一致立即修复。

#### 6.2 确保每位成员有复盘

检查 `13-retrospective.md`。如果项目有多位贡献者（从 `git log --format='%an' | sort -u` 获取），确保每位成员都有独立的复盘段落或独立文件（`13-retrospective-{name}.md`）。

#### 文件 14：`14-team.md`

模板见 `references/14-team-template.md`。

#### 文件 15：`15-brief.md`

模板见 `references/15-brief-template.md`。

### Step 7：H4 人类验收 + P2 决策

向用户展示交付物清单、代码 diff 摘要、14-team.md 和 15-brief.md 核心内容，等待验收（设置 30 分钟超时提醒）。

- 用户验收通过 → 完成
- 用户不通过 → 根据反馈回到对应 Agent
- **P2 决策**：如果 spec 定义了 P2（候选增强），向用户展示 P2 建议 + 触发条件，由用户决定是否继续

### Step 7.3：finish-review 集成

在归档前，检查 reviewAgent 产出的 `12-asset-update.md` 中是否有 CHANGELOG.md 更新。如果 CHANGELOG.md 需要更新但尚未更新，在此处补全。

同时检查 `team-finish` 流程是否已执行：

- 如果分支尚未合并，推荐使用 `team-finish` 完成分支处理
- 如果已合并，确认合并 commit 已推送

### Step 7.5：归档与知识合并

用户验收通过后，执行以下知识沉淀：

1. **规则合并**：将 `docs/tasks/{slug}/task-rules.md` 中标记为"可泛化"的规则，合并到项目级 CLAUDE.md 或模块级 CLAUDE.md
2. **SDD 快照归档**：如果项目维护了 `docs/specs/` 目录，将本次 `03-sdd.md` 的关键规格合并进去（增量模式则执行 delta 合并：ADDED 追加、MODIFIED 替换、REMOVED 删除；如有冲突以本次 SDD 为准并在 commit message 中注明）
3. **进度账本更新**：在 `docs/tasks/progress.md` 追加本次任务记录

```markdown
| {slug} | {YYYY-MM-DD} | {DONE/DONE_WITH_CONCERNS} | {起始commit..结束commit} | {一句话摘要} |
```

4. **关联更新**：如果本次变更影响了 AGENTS.md 中的架构描述，同步更新

**进度账本模板**（首次创建时使用）：

```markdown
# 任务进度账本

> 跨 session 持久化，防止任务重复派发

| Slug | 日期 | 状态 | Commit 范围 | 摘要 |
| ---- | ---- | ---- | ----------- | ---- |
```

### Step 8：最终质量检查（评分对齐验证）

逐条核验，确保每个评分维度都有明确证据。以下清单对齐 team-score 全部评分子项。

**硬门槛（7 项全部必须通过）：**

- [ ] G1: 01-plan.md 包含目标澄清、上下文、阶段拆分、修改范围、验证计划
- [ ] G2: 04-boundary.md 有 allow/deny 两个方向
- [ ] G3: 测试存在且有补充（09-test-matrix.md + 10-test-report.md + 测试代码）
- [ ] G4: 代码通过项目 CI 全量检查，测试全部通过
- [ ] G5: CLAUDE.md 中每条规则包含「触发条件 + 可执行指令」，不是空话
- [ ] G6: 05-risk.md 有风险识别 + 11-review.md §四 有剩余风险说明
- [ ] G7: 08-ai-decisions.md 能解释关键决策 + 15-brief.md 有决策解释表

**D1 AI 协作资产沉淀（25 分）：**

- [ ] D1.1 分层组织：CLAUDE.md（项目级）+ 模块 CLAUDE.md（模块级）+ task-rules.md（任务级）三层齐全
- [ ] D1.2 内容覆盖：业务术语、架构、代码结构、接口约定、编码规范、测试要求、Review 标准、交付要求 8 类有对应文件
- [ ] D1.3 规则可执行：12-asset-update.md 中每条规则有「触发条件 + 可执行指令 + 示例」
- [ ] D1.4 工具适配 ≥ 2 类：CLAUDE.md + (review-checklist / delivery-checklist / prompt-template.md) 至少 2 种
- [ ] D1.5 可维护性：CLAUDE.md 有「资产维护机制」段落（更新触发条件 + 版本记录 + 复盘中新增规则）

**D2 AI 协作任务规划（25 分）：**

- [ ] D2.1 目标澄清：01-plan.md 有成功标准 ≥ 3 条（每条含验证命令）+ 非目标 ≥ 2 条
- [ ] D2.2 上下文选择：02-context.md 有必要引用 + 已排除上下文
- [ ] D2.3 任务拆分：01-plan.md 有探索→方案→实现→验证→总结 ≥ 5 阶段
- [ ] D2.4 执行约束：04-boundary.md 有 allow/deny + 依赖约束
- [ ] D2.5 验证风控：05-risk.md 有验证计划（具体命令 + 预期结果）+ 停下来问人条件 ≥ 3 个

**D3 AI 交付质量保障（27 分）：**

- [ ] D3.1 SDD 规格：03-sdd.md 含输入/输出/边界/异常/验收 Checklist
- [ ] D3.2 TDD 流程：06-tdd-log.md 含红-绿-重构循环记录（RED 有失败输出在前，GREEN 有通过输出在后）+ git log 中 test: 提交早于 feat:/fix: 提交
- [ ] D3.3 测试覆盖：09-test-matrix.md 四维矩阵（功能/边界/异常/代码），不仅限 Happy Path
- [ ] D3.4 缺陷修复：06-tdd-log.md + 11-review.md 有修复记录
- [ ] D3.5 Review 风险：11-review.md 含五维度审查 + §四剩余风险

**D4 AI 使用过程与复盘（13 分）：**

- [ ] D4.1 Prompt 结构：07-prompt-log.md 每条含五要素（目标/上下文/边界/输出格式/验证标准）
- [ ] D4.2 迭代纠偏：07-prompt-log.md 有纠偏前后对比
- [ ] D4.3 过程可追溯：07-prompt-log.md + 08-ai-decisions.md 有关键过程记录
- [ ] D4.4 个人复盘：13-retrospective.md 有 §二.5「本次沉淀的新规则」
- [ ] D4.5 答辩准备：15-brief.md 有 Elevator Pitch + 决策解释 + 亮点 + 测试覆盖概要 + 风险

**D5 团队协作表现（10 分）：**

- [ ] D5.1 角色分工：14-team.md §一 有角色 / 负责人 / 职责 / 产出物
- [ ] D5.2 资产一致：14-team.md §二 一致性检查全部 ✅ 或已修复
- [ ] D5.3 交叉 Review：14-team.md §四 真实问题占比 > 0
- [ ] D5.4 个人贡献：14-team.md §三 每位贡献者有明确产出物和提交数

如有未通过项，回到对应 Agent 补全。

## STOP Signals

如果你发现自己即将做以下任何一件事——立即停止，重新审视：

- 跳过 H1 或 H4
- 延迟回退（"先记着后面一起修"）
- 信任 Agent 的自我声明而不验证其产出
- 超出预算却不砍范围

## 自检门禁

在报告完成状态前，执行以下自检：

- [ ] 所有 17 个文件已产出（01-15 + prompt-template + task-rules）
- [ ] H1-H4 全部经过人类确认，未被跳过
- [ ] 回退计数未超过上限（同一阶段 ≤ 2 次）
- [ ] Step 8 质量检查全部通过
- [ ] CHANGELOG.md 已更新（如 reviewAgent 要求）
- [ ] 进度账本已更新

## 完成标志

```
Team 全流程完成 ✅
产出目录：docs/tasks/{slug}/
文件总数：17 个文档（01-15 + prompt-template + task-rules）+ 代码 + 测试 + 资产更新
全部质量检查通过（对齐 team-score 全部评分子项）
```

## 集成关系

**被谁调用：**

- 用户直接调用（独立使用）

**配对使用：**

- `team-spec` — REQUIRED：编排流程中必须调度规格制定
- `team-impl` — REQUIRED：编排流程中必须调度实现
- `team-test` — REQUIRED：编排流程中必须调度测试审计
- `team-review` — REQUIRED：编排流程中必须调度代码审查
- `team-finish` — 分支完成处理
- `team-score` — 评估项目协作成熟度

## 下一步

- 交付完成后，推荐使用 `team-score` 评估项目协作成熟度
- 如果发现流程问题，更新 `CLAUDE.md` 和 `skills/_team-rules/` 中的规则
