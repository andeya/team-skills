# Team Skills — Spec-Driven 通用最佳实践

> 本文件是 team-skills 体系的项目级规范。所有 Agent 和 Skill 在执行时自动继承本文件中的规则。
> 适用工具：Claude Code / Cursor / 任何支持 CLAUDE.md 的 AI 编码工具

## 一、Spec-Driven 开发原则

### 0. 快速开始：不确定从哪开始？

如果你不确定当前场景该用哪个 Skill，先加载 `using-team-skills` meta-skill：

```
Skill: using-team-skills
```

它会根据你的场景推荐合适的 Skill。也可直接参考 README.md 中的 Skill 选择矩阵。

### 1.1 规格先于代码

- 任何功能实现必须有对应的 SDD（Software Design Document）作为输入
- SDD 是 implAgent 和 testAgent 的唯一规格来源——不依赖口头约定或聊天记录
- 修改类任务使用 Delta Spec（ADDED/MODIFIED/REMOVED），新建类任务使用完整 SDD

### 1.2 规格的质量标准

每份 SDD **MUST** 包含以下七部分（缺一不可）：

| 部分          | 内容                                                       | 消费方                       |
| ------------- | ---------------------------------------------------------- | ---------------------------- |
| 背景与动机    | 为什么做、痛点、用户场景                                   | 所有 Agent                   |
| 业务规则      | RFC 2119 强度标记（MUST/SHOULD/MAY）+ Given/When/Then 场景 | testAgent → 直接映射测试用例 |
| 关键设计决策  | 选择方案 + 拒绝方案 + 拒绝理由                             | reviewAgent → 审查决策合理性 |
| 数据流总览    | ASCII 架构图                                               | implAgent → 理解调用链路     |
| 输入/输出规格 | 参数类型、约束、默认值、示例                               | implAgent + testAgent        |
| 边界条件      | 空值、极值、并发、格式异常                                 | testAgent → 边界测试         |
| 异常场景      | 错误码、错误消息、HTTP 状态                                | testAgent → 异常测试         |

### 1.3 规格驱动的验证链

```
SDD §二 业务规则（GWT 场景）
    ↓ 直接映射
testAgent 测试用例
    ↓ 验证
implAgent 实现代码
    ↓ 审查
reviewAgent 对照 SDD 逐条检查
```

每个验证环节 **MUST** 引用 SDD 条目编号（如 B1、E2、M1），形成闭环可追溯链。

## 二、TDD 工作流规范

### 2.1 红-绿-重构循环

```
RED:    从 SDD 提取场景 → 写测试 → 运行失败 → 记录到 06-tdd-log.md
GREEN:  写最小实现 → 运行通过 → 记录到 06-tdd-log.md
REFACTOR: 优化代码质量 → 运行仍通过 → 记录到 06-tdd-log.md
COMMIT: git commit（每个功能点一次，不攒多个功能点）
```

### 2.2 禁止事项

- **MUST NOT** 先写实现再补测试
- **MUST NOT** 修改测试让它通过（修改实现让测试通过）
- **MUST NOT** 跳过 RED 阶段（"我知道实现是对的"不是理由）
- **MUST NOT** 在无测试覆盖的代码上重构

### 2.3 增量提交策略

每完成一个功能点的红-绿-重构循环后立即 `git commit`：

- 测试提交：`test: {功能点描述}`
- 实现提交：`feat: {功能点描述}` 或 `fix: {功能点描述}`
- 重构提交：`refactor: {功能点描述}`

## 三、验证协议（5 步门禁）

任何"测试通过""CI 通过""lint 通过"的声明 **MUST** 基于以下协议：

```

1. 确定验证命令（从 CLAUDE.md 或 05-risk.md §一 获取）
2. 执行命令——不使用缓存结果，不引用上一轮输出
3. 完整阅读输出——不截断，不跳过 warning
4. 检查退出码 = 0 且失败数 = 0
5. 只有全部通过才可声明"✅ 通过"，否则记录失败详情

```

违反此协议的声明视为无效，reviewAgent **MUST** 标记为 P0 问题。

## 四、有向图回退规则

### 4.1 回退触发条件

| 发现者      | 问题类型         | 回退目标           |
| ----------- | ---------------- | ------------------ |
| testAgent   | 实现 bug         | → implAgent        |
| testAgent   | SDD 未定义的场景 | → specAgent        |
| reviewAgent | P0/P1 实现 bug   | → implAgent        |
| reviewAgent | spec 遗漏        | → specAgent        |
| 任何 Agent  | 任务不可行       | → Kill Switch → H3 |

### 4.2 回退携带上下文

回退时 **MUST** 提供：

- 具体问题描述（不是"有 bug"，而是"第 42 行空指针"）
- 复现步骤（包括命令和输出）
- 期望行为（引用 SDD 条目编号）
- 建议修复方向

### 4.3 回退次数上限

同一阶段回退 ≤ 2 次。第 3 次强制触发 H3 人类介入。

## 五、文档产出规范

### 5.1 任务目录结构

```
docs/tasks/{NNNN}-{keyword}/
├── 01-plan.md              # 任务规划（目标 + 分期 + 预算）
├── 02-context.md           # 上下文选择（术语 + 引用 + 排除）
├── 03-sdd.md               # SDD 规格（七部分完整）
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

### 5.2 Slug 命名规则

格式：`{NNNN}-{keyword}`

- 序号：扫描 `docs/tasks/` 已有目录取最大序号 +1，从 `0001` 起
- 关键词：从任务描述提取，kebab-case
- 整体 ≤ 50 字符
- 示例：`0001-add-tooltip`、`0012-refactor-auth`

### 5.3 信息来源标签

所有结论 **MUST** 标注来源：

| 标签          | 含义                | 使用场景                     |
| ------------- | ------------------- | ---------------------------- |
| `{extracted}` | 从源码/文档直接提取 | 接口定义、数据结构、已有测试 |
| `{inferred}`  | 基于证据推断        | 影响范围、修改建议           |
| `{ambiguous}` | 存在歧义，需确认    | 业务规则解释、不确定的边界   |

## 六、人类介入点协议

### 6.1 四个硬性介入点

| 介入点 | 时机             | 目的                               |
| ------ | ---------------- | ---------------------------------- |
| H1     | 编排器初始化后   | 确认目标理解 + 方案方向            |
| H2     | specAgent 产出后 | 确认规格方案 + 分期策略            |
| H3     | 发现阻塞/需决策  | 人类决策（Kill Switch / 方案选择） |
| H4     | 全部完成后       | 验收交付物 + P2 决策               |

### 6.2 禁止跳过

- 任何 Agent **MUST NOT** 自动确认人类介入点
- "用户没回复就默认同意"是违规行为
- 即使任务看起来简单，H1 和 H4 不可省略（精简模式下 H1 可简化为单句确认，H2 可跳过）

### 6.3 H3 结构化协议

H3 触发时，编排器 **MUST** 向用户展示以下结构化信息：

```markdown
## H3 人类介入请求

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

## 七、AI 协作资产管理

### 7.1 三层规则体系

```
项目级 CLAUDE.md          ← 全局规则，所有任务继承
  └─ 模块级 {module}/CLAUDE.md  ← 模块特有规则
      └─ 任务级 task-rules.md    ← 仅本任务适用
```

冲突时优先级：项目级 > 模块级 > 任务级

### 7.2 消费方契约原则

每条规则 **MUST** 包含三要素：

```markdown

### 规则：{规则名}

- **触发条件**：{什么时候适用}
- **可执行指令**：{具体做什么}
- **示例**：
  - ✅ 正确：{好的做法}
  - ❌ 错误：{坏的做法}

```

不满足三要素的规则视为"空口号"，reviewAgent **MUST** 补全或删除。

### 7.3 资产维护机制

| 触发事件              | 维护动作                                 |
| --------------------- | ---------------------------------------- |
| Review 发现新通用规则 | 追加到 CLAUDE.md 对应章节                |
| 缺陷修复发现新反模式  | 追加到编码规范                           |
| AI 输出偏差           | 追加到约束规则                           |
| 任务完成验收通过      | task-rules.md 中"可泛化"规则合并到项目级 |

### 7.4 版本记录

| 日期       | 更新者 | 更新内容                     | 关联任务        |
| ---------- | ------ | ---------------------------- | --------------- |
| 2026-06-18 | Andeya | 初始版本：Spec-Driven 全规范 | 项目初始化      |
| 2026-06-18 | Andeya | 第一性原理审查：14 项改进    | 首轮飞轮迭代    |
| 2026-06-19 | Andeya | team-score 校准 + 自评补全   | team-score 校准 |
| 2026-06-23 | Andeya | 竞品审查 18 项改进：P0 逻辑矛盾修复、P1 门禁强化、P2 完善度补齐 | 竞品对标审查 |

### 7.5 内容覆盖索引

8 类必覆盖内容在本框架中的定义位置：

| 内容类别    | 定义位置                                                          |
| ----------- | ----------------------------------------------------------------- |
| 业务术语    | specAgent `02-context.md` 模板（术语表）                          |
| 系统架构    | orchestrator 有向图流程图 + specAgent `03-sdd.md` §四 数据流      |
| 代码结构    | CLAUDE.md §五 文档产出规范（17 文件目录结构）                     |
| 接口约定    | specAgent `02-context.md`（接口约束表）+ `03-sdd.md` §五/§六      |
| 编码规范    | CLAUDE.md §二 TDD + §十一.3 输出质量约束 + implAgent 各阶段禁止项 |
| 测试要求    | CLAUDE.md §三 验证协议 + testAgent 四维测试矩阵                   |
| Review 标准 | reviewAgent 五维度审查 + 严重级别校准（P0-P3 实例）               |
| 交付要求    | orchestrator Step 8 完整性检查                                    |

### 7.6 共享规则文件

以下共享文件被所有 Skill 引用，不内联重复：

| 文件 | 内容 |
| ---- | ---- |
| `skills/_team-rules/constitutional-rules.md` | 8 条 Constitutional Rules + 常见规避借口 |
| `skills/_team-rules/verification-protocol.md` | 5 步验证协议 + Iron Law + 常见失败模式 |
| `skills/_team-rules/four-state-protocol.md` | 四态完成状态（DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED） |

## 八、完成状态协议

每个 Agent 完成后 **MUST** 报告以下状态之一：

| 状态                   | 含义               | 编排器动作         |
| ---------------------- | ------------------ | ------------------ |
| **DONE**               | 全部完成，无遗留   | 继续下一步         |
| **DONE_WITH_CONCERNS** | 已完成但有保留意见 | 展示担忧，用户决定 |
| **NEEDS_CONTEXT**      | 缺少关键上下文     | 回退或触发 H3      |
| **BLOCKED**            | 被阻塞             | 触发 H3 人类介入   |

## 九、质量红线（Constitutional Rules）

> 完整规则定义见 `skills/_team-rules/constitutional-rules.md`（单一来源），以下为速览。

8 条不可被任何任务覆盖的硬约束：**人类介入是一等公民** | **有向图回退** | **产出必须验证** | **Kill Switch** | **分期交付优先** | **自我约束预算** | **回退次数上限** | **验证先行**

详细说明、常见规避借口及应对方式，请参阅 `skills/_team-rules/constitutional-rules.md`。

## 十、进度追踪

### 10.1 进度账本

文件：`docs/tasks/progress.md`

```markdown
| Slug | 日期 | 状态 | Commit 范围 | 摘要 |
| ---- | ---- | ---- | ----------- | ---- |
```

- 编排器初始化时创建（如不存在）
- 任务完成后追加记录
- 防止跨 session 任务重复派发

### 10.2 归档与知识合并

任务验收通过后执行：

1. task-rules.md 中"可泛化"规则 → 合并到项目级/模块级 CLAUDE.md
2. SDD 快照 → 归档到 `docs/specs/`（如存在）
3. 进度账本 → 追加记录
4. AGENTS.md → 如有架构变更则同步更新

## 十一、Prompt 工程规范

### 11.1 五要素结构

每个关键 Prompt **MUST** 包含：

```
目标：一句话描述要做什么
上下文：引用的文件/代码/约束
边界：不可做的事/限制条件
输出格式：期望的输出结构
验证标准：如何判断输出正确
```

### 11.2 纠偏记录

当 AI 输出偏离预期时 **MUST** 记录：

- 偏离描述
- 纠偏方式（调整了什么）
- 纠偏前后对比

### 11.3 Agent 输出质量约束

所有 Agent 的文本输出（文档、注释、日志）**MUST** 遵守以下规则：

| 规则         | 说明                                             | 违规示例                           |
| ------------ | ------------------------------------------------ | ---------------------------------- |
| 禁止空洞开头 | 不以"好的""当然""让我来"等无信息词开头           | ❌ "好的，我来分析一下这个问题..." |
| 禁止重复总结 | 不在每个段落末尾重复该段落已说过的内容           | ❌ "综上所述，我们刚才讨论了..."   |
| 禁止虚假权威 | 不使用"众所周知""显然""毫无疑问"等无证据断言     | ❌ "显然这个方案是最优的"          |
| 禁止过度修饰 | 产出文档使用直接陈述，不用"非常""极其""至关重要" | ❌ "这个功能至关重要，极其关键"    |
| 结论先行     | 先给结论再给推理过程，不做悬念铺垫               | ❌ "经过仔细分析...最终得出..."    |

## 十二、工具兼容性

### 12.1 支持的工具

| 工具        | 调用方式                | 自动发现              |
| ----------- | ----------------------- | --------------------- |
| Claude Code | `/team-{name}` 斜杠命令 | `~/.claude/commands/` |
| Cursor      | Skill 机制              | `~/.agents/skills/`   |

### 12.2 工具无关性原则

- Skill 定义中 **MUST NOT** 硬编码特定工具的命令（如 `bun test`）
- 使用"项目测试命令""项目 CI 检查命令"等通用表述
- 具体命令从项目的 CLAUDE.md / package.json / Makefile 中动态获取

## 十三、SKILL.md 开发规范

> 本章是 skills/ 目录下所有 SKILL.md 的共享约定，供贡献者编写或修改 Skill 时参考。

### 13.1 SKILL.md 结构约定

每个 SKILL.md **MUST** 包含以下结构（顺序可调）：

1. **YAML Frontmatter**：`name` + `description`（`---` 分隔，非 `------`）
2. **角色定位**：系统提示词 + 推理指引
3. **Iron Law**（Discipline Skill 必须包含）
4. **质量职责**：产出文件表
5. **输入**：读取哪些文件
6. **执行步骤**：分 Phase 描述
7. **产出文件模板**：内联 Markdown 模板或引用 `references/` 目录下的模板文件
8. **自检门禁**：产出前强制自检清单
9. **完成标志**：四态状态 + 产出清单
10. **STOP Signals**：关键违规行为的即时停止信号
11. **集成关系**：被谁调用 + 配对使用
12. **下一步**：完成后推荐操作

### 13.2 跨 Skill 一致性规则

- 验证协议引用：所有需要声明"通过"的 Skill **MUST** 引用 `_team-rules/verification-protocol.md`，不内联重复
- 四态协议引用：所有完成状态 **MUST** 引用 `_team-rules/four-state-protocol.md`，不内联重复
- Constitutional Rules 引用：所有涉及质量红线的 Skill **MUST** 引用 `_team-rules/constitutional-rules.md`
- 指令风格：优先使用正向指令（"每步必须：A → B → C"），减少负向禁止（"禁止 X"）
- 模板变量：使用 `{slug}`、`{日期}`、`{N}` 等统一占位符
- 完成状态：统一使用四态协议（DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED）

### 13.3 目录命名规范

本套 skills 设计为可全局安装到 `~/.agents/skills/`，与其它 skill 集共存：

| 规则 | 说明 | 示例 |
| ---- | ---- | ---- |
| Skill 目录统一 `team-` 前缀 | 避免与其它 skill 集命名冲突 | `team-spec`, `team-debug` |
| 内部目录以下划线 `_` 开头 | 非 skill 目录，排序靠前，不参与 skill 发现 | `_team-rules/` |
| Skill 名称保持 2 段式 | `team-{name}`，避免 3 段 | ✅ `team-feedback` ❌ `team-review-feedback` |
| 名称使用动词或名词 | 动词表示动作，名词表示角色 | `team-debug`(动词), `team-spec`(名词) |
| 不使用 `-agent` 后缀 | 冗余，skill 本身就是 agent | ✅ `team-spec` ❌ `team-spec-agent` |

### 13.4 Iron Law 规范

每个 Discipline Skill **MUST** 包含一条 Iron Law — 全大写、代码块、不可协商的原则：

```
NO {违规行为} WITHOUT {前置条件} FIRST
```

示例：

| Skill | Iron Law |
|-------|----------|
| team-debug | `NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST` |
| team-verify | `NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE` |
| team-finish | `NO BRANCH COMPLETION WITHOUT TEST VERIFICATION FIRST` |

Iron Law **MUST** 出现在执行步骤之前，作为不可协商的门禁。

### 13.5 STOP Signals 规范

每个 Skill **MUST** 包含 `## STOP Signals` 章节，从该 Skill 最关键的 3-4 个违规行为中提炼，每条以动词开头。

### 13.6 自检门禁规范

每个 Skill **MUST** 在产出前执行自检，至少包含：

1. 产出文件完整性检查
2. 占位符残留检查（`{N}`、`{slug}` 等是否被实际值替换）
3. Iron Law 遵守检查（如果有）
4. 四态状态声明

### 13.7 集成关系规范

每个 Skill **MUST** 包含 `## 集成关系` 章节，记录：

- **被谁调用**：哪些上游 Skill 或场景会调用本 Skill
- **配对使用**：本 Skill 完成后应该调用哪些下游 Skill，标注 REQUIRED（必须）或推荐
