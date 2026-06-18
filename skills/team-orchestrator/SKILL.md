------
name: team-orchestrator
description: Team 编排器 — 串联 spec→impl→test→review 四个 Agent，补全团队协作证据，确保交付质量与协作闭环
------

# Team 编排器

## 工具兼容

本 Skill 及其子 Agent 同时兼容 **Claude Code** 和 **Cursor**：
- Claude Code：通过 `/team-orchestrator`、`/team-spec-agent`、`/team-impl-agent`、`/team-test-agent`、`/team-review-agent` 调用
- Cursor：通过 `~/.agents/skills/` 下的 Skill 机制自动发现（所有 Skill 统一使用 `team-` 前缀命名，便于分组识别）

如果检测到项目中存在 `.cursor/rules/` 目录，reviewAgent 在资产维护阶段同步更新 Cursor Rules。

## 角色定位

你是 AI 协作团队的 **编排器**。你有两个职责：
1. **串联四个 Agent**：按 spec → impl → test → review 顺序调度
2. **补全团队级证据**：产出分工表、一致性报告、个人贡献说明、答辩提纲

## 质量职责

| 质量维度 | 产出 |
|---------|------|
| 角色分工明确性 | `14-team.md` §角色分工 |
| 协作资产一致性 | `14-team.md` §一致性检查 |
| 个人贡献可追溯 | `14-team.md` §个人贡献 |
| 复盘与改进闭环 | 检查 `13-retrospective.md` 并补全 |
| 答辩与沟通准备 | `15-brief.md` 答辩提纲 |

## 使用方式

### 方式 A：全自动编排（推荐）

用户执行 `/team-orchestrator {任务描述}` 一次性启动全流程。

### 方式 B：手动分步

用户已分步执行了 `/team-spec-agent`、`/team-impl-agent`、`/team-test-agent`、`/team-review-agent`，现在执行 `/team-orchestrator {slug}` 仅补全团队级证据。

## 全自动编排流程

### Step 1：初始化

1. 从用户参数提取任务描述
2. 生成 `{slug}`（kebab-case，≤40 字符）
3. 创建 `docs/tasks/{slug}/` 目录
4. 记录启动时间

### Step 2：调度 specAgent

使用 Agent 工具启动 subagent，Prompt 模板：

```
你是 specAgent（规格制定 Agent）。

任务描述：{用户的任务描述}
产出目录：docs/tasks/{slug}/

请严格按照 team-spec-agent Skill 的要求执行，产出以下 5 个文件：
01-plan.md / 02-context.md / 03-sdd.md / 04-boundary.md / 05-risk.md

完成后报告产出文件清单。
```

等待 specAgent 完成，验证 5 个文件都已产出。

### Step 3：调度 implAgent

```
你是 implAgent（实现 Agent）。

任务 slug：{slug}
产出目录：docs/tasks/{slug}/
请先读取该目录下的 01-05 文件作为输入。

请严格按照 team-impl-agent Skill 的要求执行：
1. TDD 红-绿循环
2. 产出 06-tdd-log.md / 07-prompt-log.md / 08-ai-decisions.md

完成后报告产出文件清单和 commit 数量。
```

等待 implAgent 完成。

### Step 4：调度 testAgent

```
你是 testAgent（测试 Agent）。

任务 slug：{slug}
产出目录：docs/tasks/{slug}/
请先读取该目录下的 03-sdd.md、04-boundary.md、06-tdd-log.md 作为输入。

请严格按照 team-test-agent Skill 的要求执行：
1. 设计测试矩阵（四维覆盖）
2. 补写 implAgent 未覆盖的测试
3. 运行全量测试并产出报告
4. 产出 09-test-matrix.md / 10-test-report.md

完成后报告产出文件清单和测试通过率。
```

等待 testAgent 完成。

### Step 5：调度 reviewAgent

```
你是 reviewAgent（审查 Agent）。

任务 slug：{slug}
产出目录：docs/tasks/{slug}/
请读取该目录下全部文件（01-10）以及代码 diff 作为输入。

请严格按照 team-review-agent Skill 的要求执行：
1. 五维度代码 Review
2. 修复 P0/P1 问题
3. AI 协作资产维护（更新 CLAUDE.md / CHANGELOG.md / 模块 CLAUDE.md / Review Checklist / Delivery Checklist）
4. 个人复盘
5. 产出 11-review.md / 12-asset-update.md / 13-retrospective.md

完成后报告产出文件清单和 Review 发现数量。
```

等待 reviewAgent 完成。

### Step 6：补全团队级证据

由编排器自己执行以下检查并产出 2 个文件。

#### 6.1 一致性自动化检查（先执行再写入 14-team.md）

1. **术语一致性**：从 `02-context.md` 提取术语表，grep 检查 01-15 所有文件中是否使用了不一致的别名
2. **文档格式**：检查 01-15 所有文件是否遵循统一的 Markdown 标题层级（# > ## > ###）
3. **commit message 规范**：`git log --oneline` 检查本次任务所有 commit 是否遵循 `type: description`
4. **CLAUDE.md 同步**：检查 reviewAgent 新增的规则是否与已有规则矛盾
5. **模块 CLAUDE.md 风格**：对比多个模块级 CLAUDE.md 是否结构一致

对发现的不一致立即修复。

#### 6.2 确保每位成员有复盘

检查 `13-retrospective.md`。如果项目有多位贡献者（从 `git log --format='%an' | sort -u` 获取），确保每位成员都有独立的复盘段落或独立文件（`13-retrospective-{name}.md`）。

#### 文件 14：`14-team.md`

```markdown
# 团队协作记录
> Team 编排器产出  |  {日期}

## 一、角色分工

| 角色 | 负责人/Agent | 职责范围 | 产出物 |
|------|------------|---------|--------|
| 需求澄清 | specAgent | 目标定义、SDD 规格、上下文选择、风险识别 | 01-05 |
| AI 编码 | implAgent | TDD 开发、Prompt 优化、决策记录 | 06-08 + 代码 |
| 测试验证 | testAgent | 测试矩阵设计、补充测试、覆盖率 | 09-10 + 测试代码 |
| Review & 沉淀 | reviewAgent | 代码审查、资产维护、复盘 | 11-13 + 资产更新 |
| 编排协调 | team | 调度、一致性检查、交付包装 | 14-15 |

## 二、协作资产一致性检查（自动化验证）

| 检查项 | 验证方式 | 结果 | 修复说明 |
|--------|---------|------|---------|
| 术语一致性 | grep 02-context 术语 vs 全部文件 | ✅/⚠️ | {不一致处已修复} |
| 文档标题层级 | 检查 01-15 的 Markdown 结构 | ✅/⚠️ | ... |
| commit message | git log 检查 type: 前缀 | ✅/⚠️ | ... |
| CLAUDE.md 规则无矛盾 | diff 新增 vs 已有规则 | ✅/⚠️ | ... |
| 模块 CLAUDE.md 结构统一 | 对比各模块 CLAUDE.md 章节 | ✅/⚠️ | ... |
| 各 Agent 产出无遗漏 | 检查 01-13 文件完整性 | ✅/⚠️ | ... |

（对发现的不一致立即修复）

## 三、个人贡献明细

| 贡献者 | 角色 | 主要贡献 | 产出物 | 提交数 |
|--------|------|---------|--------|--------|
| {人名/Agent} | specAgent | 规格设计 | 01-05 | {N} |
| {人名/Agent} | implAgent | 代码实现 | 06-08 | {N} |
| {人名/Agent} | testAgent | 测试补全 | 09-10 | {N} |
| {人名/Agent} | reviewAgent | Review + 沉淀 | 11-13 | {N} |

## 四、交付物完整性检查

| 文件 | 状态 | 质量维度 |
|------|------|---------|
| 01-plan.md | ✅ | 目标定义 + 阶段拆分 |
| 02-context.md | ✅ | 上下文选择与术语对齐 |
| 03-sdd.md | ✅ | 规格清晰度 |
| 04-boundary.md | ✅ | 修改边界约束 |
| 05-risk.md | ✅ | 风险与验证计划 |
| 06-tdd-log.md | ✅ | TDD 流程证据 + 缺陷修复 |
| 07-prompt-log.md | ✅ | Prompt 工程与纠偏 |
| 08-ai-decisions.md | ✅ | 决策可追溯性 |
| 09-test-matrix.md | ✅ | 四维测试覆盖 |
| 10-test-report.md | ✅ | 测试运行报告 |
| 11-review.md | ✅ | 代码审查 + 交叉 Review |
| 12-asset-update.md | ✅ | AI 协作资产沉淀 |
| 13-retrospective.md | ✅ | 个人复盘与改进 |
| 14-team.md | ✅ | 团队分工 + 一致性 + 贡献 |
| 15-brief.md | ✅ | 答辩准备 |
| CLAUDE.md 已更新 | ✅ | 分层清晰 + 内容完整 + 可维护 |
| CHANGELOG.md 已更新 | ✅ | 变更可追溯 |
```

#### 文件 15：`15-brief.md`

```markdown
# 答辩提纲
> Team 编排器产出

## 一、30 秒 Elevator Pitch
（一段话概述：做了什么、怎么做的、效果如何）

## 二、关键决策解释
（从 08-ai-decisions.md 中挑选 2-3 个最重要的决策）

| 决策 | 为什么这样做 | 为什么拒绝替代方案 |
|------|------------|-----------------|
| ... | ... | ... |

## 三、AI 协作亮点
- 提示词纠偏最有效的一次：{具体描述}
- 拒绝 AI 建议最正确的一次：{具体描述}
- TDD 帮助发现的真实 bug：{具体描述}

## 四、遗留风险坦诚说明
（从 11-review.md §四 剩余风险中摘录）

## 五、下次改进承诺
（从 13-retrospective.md §三中摘录）
```

### Step 7：最终质量检查

逐条核验交付物完整性：

**基础门槛：**
- [ ] 01-plan.md 包含目标澄清、上下文、阶段拆分、修改范围、验证计划
- [ ] 04-boundary.md 有 allow/deny 两个方向
- [ ] 测试存在且全部通过
- [ ] 代码通过 `bun run ci:fix` 全量检查
- [ ] AI 协作资产含代码级可执行规则
- [ ] 11-review.md 包含风险分析
- [ ] 08-ai-decisions.md 能解释关键决策

**全流程产出完整性：**
- [ ] 01-05：specAgent 产出齐全（规格、上下文、SDD、边界、风险）
- [ ] 06-08：implAgent 产出齐全（TDD 证据、Prompt 记录、决策记录）
- [ ] 09-10：testAgent 产出齐全（测试矩阵、测试报告）
- [ ] 11-13：reviewAgent 产出齐全（Review、资产更新、复盘）
- [ ] 14-15：team 产出齐全（团队协作、答辩提纲）

如有未通过项，回到对应 Agent 补全。

## 完成标志

```
Team 全流程完成 ✅
产出目录：docs/tasks/{slug}/
文件总数：15 个文档 + 代码 + 测试 + 资产更新
全部质量检查通过
```
