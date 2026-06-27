# Team Skills — 项目开发规范

> 本文件是 team-skills **仓库本身**的开发规则，供贡献者编写或修改 Skill 时参考。
> Skill 运行时规则已提取到 `skills/_team-rules/`（随 skills 分发，不依赖本文件）。

## 一、项目结构

```
team-skills/
├── skills/                    # 所有 Skill 定义
│   ├── _team-rules/           # 共享规则文件（被所有 Skill 引用）
│   │   ├── first-principles.md         # 4 条第一性原理（First Principle #1 ~ First Principle #4）
│   │   ├── constitutional-rules.md     # 9 条 Constitutional Rules
│   │   ├── verification-protocol.md    # 5 步验证协议
│   │   ├── four-state-protocol.md      # 四态完成状态
│   │   ├── spec-driven-workflow.md     # Spec-Driven 开发原则 + TDD 工作流
│   │   ├── task-lifecycle.md           # 任务目录结构 + CONFIRM_GOAL-HUMAN_ACCEPT 介入点协议
│   │   └── ai-collaboration-standards.md # AI 协作资产 + Prompt 工程规范
│   ├── team-brainstorm/       # 讨论引导
│   ├── team-spec/             # 规格设计
│   ├── team-impl/             # TDD 实现
│   ├── team-test/             # 测试审计
│   ├── team-review/           # 代码审查
│   ├── team-finish/           # 分支完成
│   ├── team-orchestrator/     # 编排器
│   ├── team-verify/           # 验证协议
│   ├── team-debug/            # 系统调试
│   ├── team-feedback/         # 反馈应对
│   ├── team-score/            # 协作评分
│   ├── team-security/         # 安全审计
│   └── using-team-skills/     # meta-skill（入口路由）
├── src/                       # CLI 源码（setup/init/update/uninstall/list）
├── bin/                       # CLI 入口
├── .claude/commands/          # 开发者斜杠命令（不随 Skills 分发）
├── CLAUDE.md                  # 本文件：项目开发规范
├── CONTRIBUTING.md            # 贡献指南
└── README.md                  # 项目说明 + Skill 选择矩阵
```

## 二、SKILL.md 开发规范

> 本章是 skills/ 目录下所有 SKILL.md 的共享约定。

### 2.1 结构约定

每个 SKILL.md **MUST** 包含以下结构（顺序可调）：

1. **YAML Frontmatter**：`name` + `description`（`---` 分隔，非 `------`）
2. **ROLE**：系统提示词 + 推理指引
3. **IRON_LAW**（Discipline Skill 必须包含）
4. **QUALITY**：产出文件表
5. **INPUT**：读取哪些文件
6. **STEPS**：分 Phase 描述
7. **OUTPUT_TEMPLATE**：内联 Markdown 模板或引用 `references/` 目录下的模板文件。**如果 Skill 不产出文件（如纯对话输出或操作执行），或执行步骤中已包含完整输出骨架，可省略此章节**
8. **SELF_CHECK**：产出前强制自检清单
9. **COMPLETION**：四态状态 + 产出清单
10. **STOP_SIGNALS**：关键违规行为的即时停止信号
11. **INTEGRATION**：被谁调用 + 配对使用
12. **NEXT**：完成后推荐操作

**额外章节**（按需添加）：

- **CONSTITUTIONAL_RULES**：引用 `_team-rules/constitutional-rules.md`，列出本 Skill 最相关的规则

### 2.2 一致性规则

- 引用规范：`**REF**` 关键词**仅用于声明性章节**（CONSTITUTIONAL_RULES 和 COMPLETION），格式为 `**REF** \`_team-rules/{file}.md\` — {一句话说明}`。STEPS 中的操作性内容（RESOLVE 链、回退上下文、验证流程等）**MUST** 直接内联，不可用 REF 指向外部文件——LLM 可能不会 READ 被引用的文件，导致执行跳过关键步骤。`_team-rules/` 是人类维护的 canonical source，SKILL.md 中的内联 copy 必须与之一致
- 内联引用：正文中标注规则来源时，统一使用反引号格式 `` `_team-rules/filename.md: 章节描述` ``。这是注释性标注（说明"为什么有这条规则"），不是让 LLM 去 READ 外部文件的操作指令
- 指令风格：优先使用正向指令（"每步必须：A → B → C"），减少负向禁止
- 模板变量：使用 `{slug}`、`{日期}`、`{N}` 等统一占位符
- 完成状态：统一使用四态协议（DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED）
- 工具无关性：Skill 定义中 **MUST NOT** 硬编码特定工具的命令（如 `bun test`），使用"项目测试命令"等通用表述，具体命令从项目的 CLAUDE.md / package.json / Makefile 中动态获取
- Key-Value 结构：章节标题、关键词、标识用英文全大写（Key），说明、意图、TRAP、SIGNAL 等内容用中文（Value）。骨架一眼可识别，内容自然可理解
- 角色命名统一：引用子 Skill 时使用标准 Skill 名称（`team-impl`/`team-spec`/`team-test`/`team-review`），不使用 Agent 类名（`team-impl`/`team-spec`/`team-test`/`team-review`）

### 2.3 目录命名

| 规则 | 说明 | 示例 |
| ---- | ---- | ---- |
| Skill 目录统一 `team-` 前缀 | 避免与其它 skill 集命名冲突 | `team-spec`, `team-debug` |
| 内部目录以下划线 `_` 开头 | 非 skill 目录，排序靠前，不参与 skill 发现 | `_team-rules/` |
| Skill 名称保持 2 段式 | `team-{name}`，避免 3 段 | ✅ `team-feedback` ❌ `team-review-feedback` |
| 名称使用动词或名词 | 动词表示动作，名词表示角色 | `team-debug`(动词), `team-spec`(名词) |
| 不使用 `-agent` 后缀 | 冗余，skill 本身就是 agent | ✅ `team-spec` ❌ `team-spec-agent` |

### 2.4 IRON_LAW

每个 Discipline Skill **MUST** 包含一条 IRON_LAW — 全大写、代码块、不可协商的原则：

```
NO {违规行为} WITHOUT {前置条件} FIRST
```

示例：

| Skill | IRON_LAW |
|-------|----------|
| team-debug | `NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST` |
| team-verify | `NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE FIRST` |
| team-finish | `NO BRANCH COMPLETION WITHOUT TEST VERIFICATION FIRST` |

IRON_LAW **MUST** 出现在 STEPS 之前，作为不可协商的门禁。

### 2.5 STOP_SIGNALS

每个 Skill **MUST** 包含 `## STOP_SIGNALS` 章节，从该 Skill 最关键的 3-4 个违规行为中提炼，每条以动词开头。

### 2.6 SELF_CHECK

每个 Skill **MUST** 在产出前执行自检，至少包含：

1. 产出文件完整性检查
2. 占位符残留检查（`{N}`、`{slug}` 等是否被实际值替换）
3. IRON_LAW 遵守检查（如果有）
4. 四态状态声明

### 2.7 格式规范（Skill Spec）

> 本规范定义 SKILL.md 的格式约定和关键词参考，供贡献者编写或修改 Skill 时遵守。
> **LLM 执行 SKILL.md 时不依赖本规范**——所有关键词和构造必须是自解释的。

#### 2.7.1 设计原则

| 编号 | 名称 | 要点 |
|------|------|------|
| DP-1 | 视觉锚定 | `**粗体大写**` 关键词是 LLM 扫描文档的注意力锚点 |
| DP-2 | 模式驱动 | 示例 > 形式语法，每个构造用示例定义而非 BNF |
| DP-3 | 显式优先 | 反引号表达式 > 描述性文本 |
| DP-4 | Markdown 原生 | 仅使用标准 Markdown 语法，不引入自定义标记 |
| DP-5 | 最小充分 | 关键词集覆盖 95% 场景，LLM 已具备的能力不重复规定 |
| DP-6 | 信噪分离 | 设计解释放在 `>` 引用块中，不混入执行规则 |
| DP-7 | 单义映射 | 每个 Markdown 构造有且仅有一个语义。例外：`**RESOLVE**` 后的有序列表为优先级链 |
| DP-8 | 格式即角色 | 粗体=执行，反引号=引用，纯文本=代码块 |
| DP-9 | 关键词即 API | 关键词表封闭，表外 `**粗体大写**` 不是关键词 |
| DP-10 | 描述性是退路 | `READ`/`WRITE`/`EXEC` 后首选反引号确切值 |
| DP-11 | RESOLVE 唯一切换 | 有序列表语义由前置标记（`**RESOLVE**`）唯一确定 |
| DP-12 | 显式集合优先 | `**FOR** ... **IN** [...]` 显式枚举优先于隐式推断 |
| DP-13 | ASSERT ≠ GATE | `**ASSERT**`（单条件断言）失败执行 fallback 动作；`**GATE**`（多条件门禁）失败阻塞放行 |
| DP-14 | 变量是名字 | 无形式作用域/类型系统，LLM 从上下文自然理解 |
| DP-15 | 表达式是伪代码 | 传达意图即可，无需精确到可编译 |
| DP-16 | 默认安全 | 未捕获错误 → `**BLOCKED**` + `**ASK_HUMAN**`（Human intervention required） |
| DP-17 | 对抗认知偏差 | `> TRAP：`（认知陷阱）/ `> SIGNAL：`（诊断信号）/ `> GOOD：`/`> BAD：`（校准示例）在 LLM 即将犯错的精确位置触发自我审视 |
| DP-18 | 骨架消灭模糊 | `**WRITE**` 后附带结构模板，消除"写什么"的猜测空间 |
| DP-19 | 门禁要审问 | `**GATE**`（多条件检查点）中至少包含一条第一人称自我审问，检测偷懒和模糊 |
| DP-20 | 意图赋予纠偏 | `###` 后紧跟 `>` 意图行，让 LLM 在边缘情况自主纠偏 |
| DP-21 | English Self-Explanatory | 所有关键词、运算符、构造定义**必须使用英文**，且自解释。LLM 即使没读过本规范也能从自然语言猜出含义。禁止中文定义规格关键词 |

#### 2.7.2 Markdown ↔ Skill 语义映射

| 构造 | 语义 | 示例 |
|------|------|------|
| `###` heading | Step / Phase 边界 | `### Phase 1：根因调查` |
| `**ALLCAPS**` | 执行关键词 | `**READ**` `**ASSERT**` `**DONE**` |
| `` `backtick` `` | 标识符 / 可求值表达式 | `` `exit_code == 0` `` |
| `1. 2. 3.` ordered list | 顺序执行（全部执行） | 步骤 1 → 2 → 3 |
| `-` unordered + indent | 条件分支 | 顶层=条件，缩进子项=动作 |
| `→` | Then | `失败 → **GOTO** Step 2` |
| `>` blockquote | 非执行注解（不参与控制流） | 设计意图、认知陷阱、诊断信号 |
| `*ALLCAPS italic*` | 兜底标签 | `*DEFAULT*` `*NONE*` `*NOT_FOUND*` `*REPEAT_EXHAUSTED*` |
| `####` | 命名子步骤（嵌套超 2 层时提取使用） | `#### 子步骤 1.1` |
| `A / B` | 二选一，`/` 连接两个完整关键词语句 | `全部通过 / 发现 bug` |
| `[标签]` | 条件注解，同行的多个互斥 | `[完整模式]` `[精简替代]` |

**引用块子类型**（不参与控制流，提供校准信号）：

| 前缀 | 含义 | 何时使用 |
|------|------|---------|
| 无前缀 / `> WHY：` | 设计意图 | 解释规则或步骤存在的工程理由 |
| `> TRAP：` | 认知陷阱 | 命名 LLM 在此步骤最可能犯的具体错误 |
| `> SIGNAL：` | 诊断信号 | 将 output 特征映射到可能原因 |
| `> GOOD：` / `> BAD：` | 校准示例 | 好产出 vs 坏产出的具体对比 |

#### 2.7.3 关键词参考

**关键词视觉格式**：关键词**永远全大写**。Step 内的指令行用 `**KEYWORD**`（粗体），引用块/表格中用 `` `KEYWORD` ``（反引号），代码块中用纯大写。

**关键词表**：

| 类别 | 关键词 | 语义 |
|------|--------|------|
| 动作 | `READ` `WRITE` `EXEC` `RESOLVE` | 读取、写入、执行命令、按优先级解析变量 |
| 控制流 | `IF` `ELSE` `MATCH` `FOR` `IN` `REPEAT` `MAX` `GOTO` | 条件、否则、多路分发、遍历、集合/成员、有限重试、上限、跳转 |
| 验证 | `ASSERT` `GATE` | 单条件断言（失败执行 fallback）、多条件门禁（全部通过才放行） |
| 状态 | `DONE` `DONE_WITH_CONCERNS` `NEEDS_CONTEXT` `BLOCKED` | 四态完成状态 |
| 引用 | `REF` | 声明本 Skill 依赖的外部规则文件（仅限 CONSTITUTIONAL_RULES / COMPLETION 章节） |
| 组合 | `ROUTE` `ROLLBACK` `ASK_HUMAN` | 调用 Skill、回退上游、人类介入 |

**表达式运算符**（反引号内使用，不加粗）：`EXISTS` `NOT_EXISTS` `NOT_EMPTY` `CONTAINS` `==` `!=` `&&` `||` `.`

**各关键词使用方式**：

- **READ** `file` — 读取文件。**READ** `file` §章节 — 读取指定章节
- **WRITE** `file` — 写入文件。**WRITE**（对话中）— 展示给用户。**WRITE** checkpoint：`{...}` — 更新断点
- **WRITE** 后可附带结构模板（输出骨架），LLM 按骨架填充内容
- **EXEC** `command` — 执行命令。后必须 **ASSERT** `exit_code == 0`
- **EXEC** `grep/find/git log` [EXPLORATORY] — 探索性命令，exit_code != 0 仅表示未找到，不阻塞
- **RESOLVE** `var`：— 按优先级链解析变量，首个命中即停。**必须**以 `*NONE*` / `*DEFAULT*` 结尾
- **IF** `cond` → action — 守卫形式（单行，不满足则跳过）
- **IF** `cond`：... **ELSE**：... — 分支形式（多行）
- **MATCH** `var`：— 多路分发。分支**必须**穷尽（`*DEFAULT*` 兜底）
- **FOR** `item` **IN** `[...]`：— 遍历显式集合
- **REPEAT** **MAX**=N：— 有限重试。`*REPEAT_EXHAUSTED*` 兜底**必须**提供
- **GOTO** Step N — 跳转到 `###` 或 `####` 标题
- **ASSERT** `expr` — 单条件断言，失败执行 fallback 分支
- **GATE** — 多条件检查点，全部通过才放行。不通过则补全重检，仍不通过 → `**BLOCKED**`
- **ROUTE** `team-xxx` — 调用另一个 Skill。仅编排器或直接调度方使用。子 Skill 应写"向编排器报告：建议路由到 `team-xxx`"
- **ROLLBACK** agent — 回退上游。必须携带：问题、位置、期望、建议
- **ASK_HUMAN** — 暂停执行，触发人类介入
- **DONE** / **DONE_WITH_CONCERNS** / **NEEDS_CONTEXT** / **BLOCKED** — 四态终止状态
- **REF** `_team-rules/{file}.md` — 声明外部规则引用。**仅用于** CONSTITUTIONAL_RULES（Rule 列表前）和 COMPLETION（MATCH 前）章节。STEPS 中不可使用 REF 替代内联内容

#### 2.7.4 文档结构与执行顺序

```
---
name: skill-name
description: one-line description
---
# Skill Title
## ROLE / IRON_LAW / INPUT ...
## STEPS
### Phase 1：标题       ← Step 边界（###）
1. **READ** ...          ← 顺序执行
2. **EXEC** ...
#### 子步骤 1.1：标题   ← 命名子步骤（####）
### Phase 2：标题
## SELF_CHECK / COMPLETION / INTEGRATION ...
```

**顺序流**：`###` Step 按文档顺序执行。`**GOTO**` / `**DONE**` / `**BLOCKED**` / `**ROLLBACK**` / `**ASK_HUMAN**` 中断顺序流。

**子步骤返回**：`####` 执行完后回到父 `###` 的下一条指令。被 `**GOTO**` 跳入的子步骤执行完后向下继续（不返回跳出点）。

#### 2.7.5 变量与表达式

| 产生方式 | 变量 | 有效期 |
|----------|------|--------|
| `**EXEC**` | `exit_code`、`output` | 到下一个 `**EXEC**` |
| `**RESOLVE**` | 解析结果 | 当前 Step 及后续 |
| `**READ**` | 读取内容进入 LLM 上下文 | 后续指令可自然引用 |

表达式运算符在反引号内使用：`==` `!=` `>=` `<=` `>` `<` `&&` `||` `EXISTS` `NOT_EXISTS` `NOT_EMPTY` `CONTAINS` `IN` `.` `!`

#### 2.7.6 错误处理

| 错误场景 | 默认行为 |
|----------|---------|
| `**READ**` 目标不存在 | `**BLOCKED**` + `**ASK_HUMAN**` |
| `**EXEC**` 失败且无 ASSERT fallback | `**BLOCKED**` + `**ASK_HUMAN**` |
| `**GOTO**` 目标不存在 | `**BLOCKED**`（Skill 编写错误） |
| `**MATCH**` 无匹配且无 `*DEFAULT*` | `**BLOCKED**`（分支未穷尽） |
| `**GATE**` 补全重检仍不通过 | `**BLOCKED**` + `**ASK_HUMAN**` |
| `**REPEAT**` 次数耗尽 | 执行 `*REPEAT_EXHAUSTED*` 兜底分支 |

**传播链**：构造级 fallback → Step 级 ASSERT → `**BLOCKED**` + `**ASK_HUMAN**`。

#### 2.7.7 反模式

| # | 反模式 | 问题 | 正确做法 |
|---|--------|------|---------|
| 1 | EXEC 后不检查 exit_code | "执行了"≠"成功了" | `**ASSERT** \`exit_code == 0\`` |
| 2 | 段落描述条件逻辑 | LLM 需读懂段落才能提取分支 | 用 `**IF**` / `**MATCH**` + 缩进分支 |
| 3 | 指令动词不加粗大写 | 动词淹没在句子中，无法扫描 | 所有指令动词 `**全大写粗体**` |
| 4 | RESOLVE / MATCH 无兜底 | 所有选项未命中时行为未定义 | `*NONE*` / `*DEFAULT*` 兜底 |
| 5 | ASSERT 用自然语言 | "确认测试通过"不可机械验证 | `**ASSERT** \`exit_code == 0\`` |
| 6 | 引用块含执行指令 | 引用块不参与控制流 | 指令移出引用块 |
| 7 | MATCH 后跟自然语言 | 无法提取匹配变量 | `**MATCH**` 后必须跟 `` `变量名` `` |
| 8 | 嵌套超 2 层未提取子步骤 | LLM 丢失层级追踪 | 提取为 `####` 命名子步骤 |
| 9 | WRITE 无输出骨架 | LLM 产出格式和精度随机波动 | 附带结构模板 |
| 10 | GATE 全是形式断言无自我审问 | 只检测客观错误，放过偷懒和模糊 | 至少一条第一人称自我审问 |
| 11 | Step 无意图只有指令 | LLM 无法在边缘情况自主纠偏 | `###` 后紧跟 `>` 意图行 |
