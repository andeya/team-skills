# 任务生命周期

> 共享规则文件。定义任务目录结构、人类介入点和进度追踪。

## §1 文档产出规范

### 1.1 任务目录结构

```
docs/tasks/{NNNN}-{keyword}/
├── .checkpoint.json          # 编排器断点续传状态（team-orchestrator 产出）
├── 00-design-brief.md      # 设计概要（team-brainstorm 产出，可选）
├── 01-plan.md              # 任务规划（目标 + 分期 + 预算）
├── 02-context.md           # 上下文选择（术语 + 引用 + 排除）
├── 03-sdd.md               # SDD 规格（九章节完整）
├── 04-boundary.md          # 修改边界（allow + deny）
├── 05-risk.md              # 风险 + 验证计划
├── prompt-template.md      # AI 任务提示词模板
├── 06-tdd-log.md           # TDD 日志（红-绿-重构循环）
├── 07-prompt-log.md        # Prompt 工程记录（五要素 + 纠偏）
├── 08-ai-decisions.md      # AI 决策记录（选择 + 拒绝 + 理由）
├── 09-test-matrix.md       # 四维测试矩阵
├── 10-test-report.md       # 测试运行报告（证据链）
├── 11-review.md            # 代码审查报告（五维度 + 合规）
├── 12-asset-update.md      # 资产更新记录（消费方契约）
├── 13-retrospective.md     # 个人复盘（新规则沉淀）
├── task-rules.md           # 任务级规则
├── 14-team.md              # 团队协作记录
└── 15-brief.md             # 答辩提纲
```

### 1.2 Slug 命名规则

格式：`{NNNN}-{keyword}`

- 序号：扫描 `docs/tasks/` 已有目录取最大序号 +1，从 `0001` 起
- 关键词：从任务描述提取，kebab-case
- 整体 ≤ 50 字符
- 示例：`0001-add-tooltip`、`0012-refactor-auth`
- 分期继承任务：在上期关键词后追加 `-p{N}`（N 从 2 起），使用新序号。如 `0001-add-tooltip`（P1）→ `0002-add-tooltip-p2`（P2）→ `0005-add-tooltip-p3`（P3）

### 1.3 信息来源标签

所有结论 **MUST** 标注来源：

| 标签          | 含义                | 使用场景                     |
| ------------- | ------------------- | ---------------------------- |
| `{extracted}` | 从源码/文档直接提取 | 接口定义、数据结构、已有测试 |
| `{inferred}`  | 基于证据推断        | 影响范围、修改建议           |
| `{ambiguous}` | 存在歧义，需确认    | 业务规则解释、不确定的边界   |

## §2 人类介入点协议

### 2.1 四个硬性介入点

| 介入点 | 时机             | 目的                               |
| ------ | ---------------- | ---------------------------------- |
| CONFIRM_GOAL     | 编排器初始化后   | 确认目标理解 + 方案方向            |
| CONFIRM_SPEC     | team-spec 产出后 | 确认规格方案 + 分期策略            |
| ASK_HUMAN     | 发现阻塞/需决策  | 人类决策（Kill Switch / 方案选择） |
| HUMAN_ACCEPT     | 全部完成后       | 验收交付物 + P2 决策               |

### 2.2 禁止跳过

- 任何 Agent **MUST NOT** 自动确认人类介入点
- "用户没回复就默认同意"是违规行为
- 即使任务看起来简单，CONFIRM_GOAL 和 HUMAN_ACCEPT 不可省略（精简模式下 CONFIRM_GOAL 和 CONFIRM_SPEC 可简化为单句确认）

### 2.3 ASK_HUMAN 结构化协议

ASK_HUMAN 触发时，编排器 **MUST** 向用户展示以下结构化信息：

```markdown
## ASK_HUMAN 人类介入请求

**触发来源**：{Agent 名称} | **触发原因**：{阻塞 / Kill Switch / 需决策}

### 问题描述
{具体问题，含文件路径、行号、错误信息等}

### 已尝试
{已执行的操作及结果}

### 选项
- A: {方案描述} — {预期效果}
- B: {方案描述} — {预期效果}
- C: Kill Switch — 终止任务

### 推荐
{推荐选项及理由}
```

用户决策后，编排器记录决策到 `14-team.md` 并按选择继续或终止。

## §3 进度追踪

### 3.1 进度账本

文件：`docs/tasks/progress.md`

```markdown
| Slug | 日期 | 状态 | Commit 范围 | 摘要 |
| ---- | ---- | ---- | ----------- | ---- |
```

- 编排器初始化时创建（如不存在）
- 任务完成后追加记录
- 防止跨 session 任务重复派发

### 3.2 归档与知识合并

任务验收通过后执行：

1. task-rules.md 中"可泛化"规则 → 合并到项目级/模块级 AI 规范文件
2. SDD 快照 → 归档到 `docs/specs/`（如存在）
3. 进度账本 → 追加记录
4. AGENTS.md → 如有架构变更则同步更新（注意：AGENTS.md 是架构文档，不承载流程规则）
