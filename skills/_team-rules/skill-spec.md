# Markdown Skill Language v1.0

> 共享规则文件。所有 SKILL.md 的执行步骤、门禁、状态声明须遵循本规范。

## 设计原则

1. **Markdown 原生** — 仅使用 Markdown 已有语法构造（标题、粗体、反引号、列表、引用块、表格），不引入任何自定义符号或标签
2. **零歧义** — 每个 Markdown 构造在 Skill 上下文中有且仅有一个语义解释
3. **LLM 可执行** — 控制流、变量、门禁可被 LLM 机械提取并逐步执行，无需"读懂段落"
4. **有执行模型** — 顺序流、跳转、循环终止、分支穷尽性有明确定义（§执行模型）
5. **有变量模型** — 变量声明、引用、作用域、表达式语法有明确定义（§变量模型）
6. **有组合模型** — Skill 间调用、回退、状态持久化有明确协议（§组合模型）

## 12 条语义约定

| # | Markdown 构造 | Skill 语义 | 示例 |
|---|---------------|-----------|------|
| 1 | `###` 标题 | Step / Phase 作用域边界 | `### Step 1：确定验证命令` |
| 2 | `**全大写词**` | 语义关键词（指令动词 / 状态） | `**RESOLVE**` `**ASSERT**` `**DONE**` |
| 3 | `` `反引号` `` | 标识符 / 可求值表达式 | `` `exit_code == 0` `` `` `verify_cmd` `` |
| 4a | `1. 2. 3.` 有序列表 | 顺序执行（默认语义） | 步骤 1 → 步骤 2 → 步骤 3 |
| 4b | `**RESOLVE**` + `1. 2. 3.` | 优先级链（首个命中即停） | `**RESOLVE** \`var\``：1. 尝试 A  2. 尝试 B  3. *none* |
| 5 | `-` 无序列表 + 缩进 | 条件分支（顶层=条件，缩进子项=动作） | 二级缩进 = 二层嵌套 |
| 6 | `→` | 则（then）— 前面是条件/动作，后面是后续动作 | `失败 → 记录详情 → **GOTO** Step 2` |
| 7 | `- [ ]` 复选框 | **GATE** 断言条目（必须逐条验证，全部通过才放行） | `- [ ] exit_code == 0` |
| 8 | `>` 引用块 | WHY / 设计意图（不参与执行，不含关键词指令） | 解释规则存在的工程理由 |
| 9 | `*斜体*` | 兜底 / 缺省 / 空值 | `*none*` `*not found*` `*default*` |
| 10 | 表格 | 结构化映射（状态机、类型表、路由表） | 失败模式表、严重级别表 |
| 11 | `####` 四级标题 | 命名子步骤（用于拆分超过 2 层的嵌套） | `#### 子步骤 4.1：回退路由` |
| 12 | `[标签]` 方括号 | 条件注解（标记该指令的适用条件） | `[完整模式]` `[精简替代]` |

## 关键词词表

所有关键词以 `**全大写粗体**` 标记，分 5 类。**仅**以下词为关键词——其他粗体词（如概念名称 **YAGNI**、章节强调）不是关键词，LLM 不按指令解析。

| 类别 | 关键词 | 语义 |
|------|--------|------|
| 数据操作 | `**READ**` `**WRITE**` `**RESOLVE**` `**EXEC**` | 读取文件或输入、写入文件或展示给用户、按优先级链解析变量、执行 shell 命令 |
| 控制流 | `**IF**` `**ELSE**` `**MATCH**` `**FOR**` `**REPEAT**` `**GOTO**` | 条件、否则、模式匹配分发、遍历集合、有限重试、跳转 |
| 门禁 | `**ASSERT**` `**GATE**` | 单条件断言（失败则执行 fallback）、多条件检查点（全部通过才放行） |
| 状态 | `**DONE**` `**BLOCKED**` `**NEEDS_CONTEXT**` `**DONE_WITH_CONCERNS**` | 四态完成状态 |
| 路由 | `**ROLLBACK**` `**ROUTE**` `**H3**` | 回退到上游 Agent、路由到下游 Skill、触发人类介入 |

### ASSERT 与 GATE 的区分

| 维度 | **ASSERT** | **GATE** |
|------|-----------|----------|
| 条件数 | 单条件（可用 `&&` 组合） | 多条件（复选框列表） |
| 失败行为 | 执行 fallback 动作（→ GOTO / ROLLBACK / BLOCKED） | 阻塞——全部通过才放行，不通过则补全后重检 |
| 典型场景 | 执行步骤中的即时检查 | 阶段转换前的准入门禁、自检清单 |
| 格式 | `**ASSERT** \`expression\`` + fallback 分支 | `**GATE** 描述` + `- [ ]` 复选框列表 |

### WRITE 的目标区分

`**WRITE**` 后面的目标决定动作类型：

| 写法 | 含义 | 示例 |
|------|------|------|
| `**WRITE** \`filepath\`` | 写入磁盘文件 | `**WRITE** \`06-tdd-log.md\`` |
| `**WRITE**（对话中）` | 展示给用户，不写文件 | `**WRITE**（对话中）推荐结果` |
| `**WRITE** checkpoint` | 更新 checkpoint 文件 | `**WRITE** checkpoint：...` |

## 执行模型

### 顺序流

`###` Step/Phase 按文档顺序执行。前一个 Step 的最后一条指令完成后，自动进入下一个 Step。

以下关键词中断顺序流：

| 关键词 | 效果 |
|--------|------|
| `**GOTO** Step N` | 无条件跳转到目标 Step/子步骤 |
| `**DONE**` / `**DONE_WITH_CONCERNS**` | 终止整个 Skill 执行 |
| `**BLOCKED**` / `**NEEDS_CONTEXT**` | 终止执行，等待外部输入 |
| `**ROLLBACK** agent` | 终止执行，回退到上游 |

### `####` 子步骤的返回行为

`####` 子步骤执行完后回到父 `###` 的下一条指令——除非子步骤以 GOTO/DONE/BLOCKED/ROLLBACK 结尾。被 GOTO 跳入的 `####` 同理：执行完后不自动返回跳出点。

### GOTO 目标约束

目标必须是当前文件中存在的 `###` 或 `####` 标题名称。跨文件跳转使用 `**ROUTE**`。

### MATCH 穷尽性

**MATCH** 的分支必须覆盖所有可能的值：

- 提供 `*default*` / `*none*` 兜底分支，或
- 枚举变量值域的全部值（适用于有限集合如四态状态）

未覆盖的值 = 未定义行为。

### FOR / REPEAT 终止

- **FOR**：遍历完集合后回到 FOR 块后的下一条指令
- **REPEAT** max=N：重试 N 次后触发 `*repeat exhausted*` 兜底（必须提供）
- FOR/REPEAT 内的 GOTO 立即跳出循环

### 有序列表语义消歧

有序列表（`1. 2. 3.`）在两种上下文中语义不同：

| 上下文 | 语义 | 行为 |
|--------|------|------|
| 默认 | 顺序执行 | 步骤 1 完成 → 步骤 2 → 步骤 3，全部执行 |
| `**RESOLVE**` 引导 | 优先级链 | 步骤 1 命中 → 停止；未命中 → 步骤 2；`*none*` = 全未命中 |

判定规则：有序列表前的最近关键词是 `**RESOLVE**` → 优先级链语义。其他情况 → 顺序执行语义。

## 变量模型

### 变量引入

变量通过以下关键词引入：

| 引入方式 | 产生的变量 | 作用域 | 示例 |
|----------|-----------|--------|------|
| `**RESOLVE** \`var\`` | 命名变量 `var` | Step 作用域 | `**RESOLVE** \`verify_cmd\`` |
| `**FOR** each \`item\`` | 循环变量 `item` | FOR 块内 | `**FOR** each \`feature_point\`` |
| `**MATCH** \`var\`` | 匹配目标 `var` | MATCH 块内 | `**MATCH** \`result\`` |
| `**EXEC** cmd` | 隐式 `exit_code` + `output` | 到下一个 EXEC | `**EXEC** \`git status\`` |
| `**READ** source` | 隐式读取内容 | 紧随的指令 | `**READ** \`03-sdd.md\`` |

### 作用域规则

- **RESOLVE 变量**：从声明点到所属 `###` 末尾。`###` 之前声明的变量可见到文件末尾
- **FOR 循环变量**：仅在 FOR 块（包括其缩进子项）内可见
- **EXEC 隐式变量**（`exit_code`、`output`）：仅在紧随的条件/断言中有效。下一个 EXEC 覆盖前值
- **同名覆盖**：后声明覆盖前声明，无警告

### 表达式语法

反引号内可使用以下运算。运算符两侧为标识符或字面值：

| 运算 | 写法 | 示例 |
|------|------|------|
| 相等 | `==` `!=` | `` `mode == compact` `` |
| 比较 | `>=` `<=` `>` `<` | `` `failures == 0` `` |
| 逻辑 | `&&` &#124;&#124; | `` `exit_code == 0` && `failures == 0` `` |
| 存在性 | `X 存在` `X 不存在` | `` `docs/specs/` 存在 `` |
| 属性访问 | `.` | `` `READ("file").field` `` |
| 否定 | `非` `!` | `` `output` 非空 `` |
| 多值 | &#124;&#124; 在 MATCH 分支 | `` `DONE` \|\| `DONE_WITH_CONCERNS` `` |

逻辑运算 `&&` 的多个反引号子表达式可以分别用独立反引号包裹：`` `exit_code == 0` && `failures == 0` ``。

### 常用变量约定

以下变量名跨 Skill 统一使用（非关键词，是命名约定）：

| 名称 | 含义 | 典型引入方式 |
|------|------|-------------|
| `mode` | `full` / `compact` | RESOLVE |
| `slug` | 任务标识符 `{NNNN}-{keyword}` | RESOLVE |
| `exit_code` | 命令退出码 | EXEC 隐式 |
| `output` | 命令标准输出 | EXEC 隐式 |
| `verify_cmd` | 项目验证命令 | RESOLVE |
| `base_branch` | 基准分支名 | RESOLVE |
| `result` | 完成状态匹配目标 | MATCH |

## 组合模型

### ROUTE 协议

`**ROUTE** skill-name` 调用另一个 Skill。调用约定：

1. ROUTE 后跟代码块 = 提示模板，传递给目标 Skill 的执行上下文
2. 模板中 `{var}` = 当前作用域变量插值
3. ROUTE 后的"完成验证"段落 = 目标 Skill 返回后的后置条件检查

```markdown
**ROUTE** `team-test`

\`\`\`
任务 slug：{slug}
模式：{mode}
输入：docs/tasks/{slug}/ 下的文件
\`\`\`

**完成验证**（产出门禁）：
**FOR** each file in [`09-test-matrix.md`, `10-test-report.md`]：
- **ASSERT** 文件存在且有效行数 ≥ 5
```

### ROLLBACK 协议

`**ROLLBACK** agent-name` 回退到上游 Agent。必须携带四要素：

| 要素 | 必须 | 示例 |
|------|------|------|
| 问题描述 | 是 | "`exit_code != 0`，测试失败 3 个" |
| 位置 | 是 | "Step 4 产出门禁" |
| 期望行为 | 是 | "引用 SDD §二.3 条目" |
| 建议修复 | 是 | "检查边界条件处理" |

ROLLBACK 可附带跳转目标：`**ROLLBACK** implAgent（**GOTO** Step 3，附 bug 上下文）`。

### Checkpoint 模型

`**WRITE** checkpoint：...` 持久化跨步骤状态，用于断点续传。

标准字段约定：

| 字段 | 类型 | 含义 |
|------|------|------|
| `current_step` | string | 当前执行到的 Step |
| `next_step` | string | 下一个待执行 Step |
| `phase` | string | 当前阶段名 |
| `completed_steps` | string[] | 已完成的 Step 列表 |
| `status` | 四态之一 | 任务整体状态 |
| `rollback_counts` | object | `{source→target: count}` 回退计数 |

Checkpoint 在每个 Step 完成后更新，在恢复时通过 `**READ** checkpoint` → `**MATCH** \`checkpoint.status\`` 决定继续点。

## 常见模式

### 模式 1：RESOLVE 优先级链

按优先级依次查找，首个命中即停，末尾 `*none*` 为兜底。

```markdown
**RESOLVE** `verify_cmd`（首个命中即停）：

1. `READ("05-risk.md", "§一验证计划")`
2. `READ("CLAUDE.md").test_cmd` / `READ(".cursor/rules/")`
3. `READ("package.json").scripts.test` / `READ("Makefile")`
4. *none* → **NEEDS_CONTEXT**：请用户提供验证命令
```

**规则**：每个 RESOLVE 链必须有 `*none*` / `*default*` / `*not found*` 兜底项。

### 模式 2：ASSERT 单条件断言

断言必须为真，否则执行 fallback 动作。

```markdown
**ASSERT** `exit_code == 0` && `failures == 0`
- `exit_code != 0` → 记录失败 → **GOTO** Step N
- warning && `exit_code == 0` → **WRITE** warning 到报告，不阻塞
```

### 模式 3：GATE 多条件检查点

多个条件组成的准入门禁，全部通过才放行。

```markdown
**GATE** 产出前自检（全部通过才放行）：

- [ ] `06-tdd-log.md` 存在且有效行数 ≥ 5
- [ ] 每个功能点有 RED → GREEN 序列
- [ ] `exit_code == 0` && `failures == 0`
```

### 模式 4：MATCH 状态分发

根据变量值分发到不同动作。`**MATCH**` 后必须跟反引号变量名。

```markdown
**MATCH** `result`：

- 全部通过 → **DONE**
- 通过但有 warning → **DONE_WITH_CONCERNS**
- 验证失败 → 记录失败详情
- 工具失败 → **BLOCKED**，触发 **H3**
```

**规则**：`**MATCH**` 后必须跟 `` `变量名` ``（反引号包裹），不用自然语言描述。

### 模式 5：FOR 遍历

遍历集合中的每个元素，对每个执行相同操作。

```markdown
**FOR** each `feedback_item`：

1. **READ** 实际代码 → 验证技术正确性
2. **ASSERT** 验证基于代码证据
3. **IF** 技术正确 → 标记待实施
   **ELSE** → 用技术理由推回
```

### 模式 6：IF / ELSE 条件

#### 条件的两种合法形式

| 形式 | 写法 | 适用场景 | 示例 |
|------|------|---------|------|
| 反引号 | `**IF** \`expr\`` | 可求值变量/表达式（mode、exit_code、文件是否存在） | `**IF** \`mode == compact\`` |
| 描述 | `**IF** 描述条件` | 上下文判断、需要人类/LLM 感知的场景 | `**IF** 多组件系统 →` |

描述条件须简短（≤15 字）且可判定。如判定方式不明显，加括号注明：`**IF** 编排模式（任务目录存在）→`

#### 守卫 IF vs 分支 IF

| 类型 | 形式 | ELSE 要求 | 隐含语义 |
|------|------|----------|---------|
| 守卫 IF | `**IF** cond → action`（单行） | 不需要 ELSE | 条件不满足时继续下一步 |
| 分支 IF | `**IF** cond：` + 缩进子项（多行） | 需要 `**ELSE**` 或 `*default*` | 两条路径都有明确动作 |

**守卫 IF**（单行，不需要 ELSE）：

```markdown
**IF** `docs/specs/` 存在 → **WRITE** 合并规格
```

**分支 IF**（多行，需要 ELSE）：

```markdown
**IF** `mode == compact`：
- 精简产出，跳过 01-plan 等文件

**ELSE**：
- 完整产出，包含全部 17 个文件
```

**嵌套形式**（无序列表 + 缩进表达多层条件，最多 2 层）：

```markdown
- `severity == P0` || `severity == P1`
  - `问题在实现层` → **ROUTE** implAgent
  - `问题在规格层` → **ROUTE** specAgent
- `severity == P2` → 自行修复
- *default* → 记录但不处理
```

### 模式 7：REPEAT 重试

有限次重试，`*repeat exhausted*` 为兜底。

```markdown
**REPEAT** max=2：

1. 记录失败原因
2. 修复 → **EXEC** `verify_cmd`
   - 通过 → **GOTO** Step N
   - 仍失败 → 继续 REPEAT

- *repeat exhausted* → **BLOCKED**，触发 **H3**
```

### 模式 8：GOTO 跳转

显式跳转到指定 Step/Phase，避免隐式流转。目标必须是当前文件中存在的 `###` 或 `####` 标题名称。

```markdown
修复完成 → **GOTO** Step 2（重新执行验证）
```

### 模式 9：WRITE 目标区分

`**WRITE**` 的目标决定动作类型：

| 写法 | 含义 | 示例 |
|------|------|------|
| `**WRITE** \`filepath\`` | 写入磁盘文件 | `**WRITE** \`06-tdd-log.md\`` |
| `**WRITE**（对话中）` | 展示给用户，不写文件 | `**WRITE**（对话中）推荐结果` |
| `**WRITE** checkpoint` | 更新 checkpoint 状态 | `**WRITE** checkpoint：...` |

### 模式 10：内联守卫

在主指令上附加括号内守卫条件，不影响主指令的后续流：

```markdown
**EXEC** 创建目录（**IF** 已存在 → 跳过）
```

规则：`（**IF** cond → action）` 是附加在主指令上的前置检查。条件不满足时执行 action（通常是"跳过"），然后继续下一条指令。

### 模式 11：条件注解

在 GATE 检查项或指令前标注适用条件，LLM 根据当前上下文选择执行哪段：

```markdown
- [ ] G1: `[完整模式]` **ASSERT** `01-plan.md` 包含目标澄清
       `[精简替代]` **ASSERT** `03-sdd.md` 包含任务目标
```

规则：`[标签]` 方括号注解标记适用条件。同一行的多个注解互斥——根据当前 `mode` 选择匹配的注解段执行。

### 模式 12：多值匹配

MATCH 分支条件可用 `||` 合并多个值，匹配任意一个即执行该分支：

```markdown
**MATCH** `checkpoint.status`：

- `DONE` || `DONE_WITH_CONCERNS` → 提示用户任务已完成
- `BLOCKED` → 触发 **H3**
- *default* → 恢复执行
```

## 形式语法

简化 BNF 参考。不追求 parser-ready，但足够精确地定义每个构造的合法形式。

```bnf
skill           ::= frontmatter section+
frontmatter     ::= '---' NL 'name:' TEXT NL 'description:' TEXT NL '---'

section         ::= step_heading instruction*
step_heading    ::= '###' step_label '：' title
step_label      ::= 'Step' NUMBER | 'Phase' NUMBER
substep_heading ::= '####' substep_label '：' title

instruction     ::= keyword_stmt
                   | ordered_list
                   | unordered_branch
                   | gate_block
                   | blockquote

(* 关键词语句 *)
keyword_stmt    ::= '**' KEYWORD '**' target action*
KEYWORD         ::= 'READ' | 'WRITE' | 'RESOLVE' | 'EXEC'
                   | 'IF' | 'ELSE' | 'MATCH' | 'FOR' | 'REPEAT' | 'GOTO'
                   | 'ASSERT' | 'GATE'
                   | 'DONE' | 'BLOCKED' | 'NEEDS_CONTEXT' | 'DONE_WITH_CONCERNS'
                   | 'ROLLBACK' | 'ROUTE' | 'H3'
target          ::= backtick_expr | write_target | description
write_target    ::= backtick_expr | '（对话中）' | 'checkpoint'
action          ::= '→' keyword_stmt
                   | '→' description

(* 表达式 *)
backtick_expr   ::= '`' expression '`'
expression      ::= term (logical_op term)*
term            ::= identifier compare_op value
                   | identifier existence
                   | identifier '.' identifier
                   | function_call
compare_op      ::= '==' | '!=' | '>=' | '<=' | '>' | '<'
logical_op      ::= '&&' | '||'
existence       ::= '存在' | '不存在' | '非空'
function_call   ::= identifier '(' string (',' string)* ')'

(* 条件 *)
if_guard        ::= '**IF**' condition '→' action     (* 单行守卫，无 ELSE *)
if_branch       ::= '**IF**' condition '：' NL body ('**ELSE**' '：' NL body)?
condition       ::= backtick_expr | short_description
inline_guard    ::= '（' '**IF**' condition '→' action '）'

(* 分支 *)
match_block     ::= '**MATCH**' backtick_expr '：' NL match_branch+
match_branch    ::= '-' match_pattern '→' action
match_pattern   ::= backtick_expr ('||' backtick_expr)*
                   | '*' fallback_label '*'
fallback_label  ::= 'none' | 'default' | 'not found' | 'repeat exhausted'

(* 循环 *)
for_block       ::= '**FOR**' 'each' backtick_expr '：' NL body
repeat_block    ::= '**REPEAT**' 'max=' NUMBER '：' NL body NL fallback_branch

(* 门禁 *)
gate_block      ::= '**GATE**' description '：' NL checkbox+
checkbox        ::= '- [ ]' (annotation)? assertion
annotation      ::= '[' label ']'
assertion       ::= '**ASSERT**' backtick_expr

(* 有序列表 *)
ordered_list    ::= ordered_item+                      (* 默认：顺序执行 *)
resolve_chain   ::= '**RESOLVE**' backtick_expr NL ordered_item+ fallback_branch
                                                       (* RESOLVE 引导：优先级链 *)
fallback_branch ::= '-' '*' fallback_label '*' '→' action

(* 非执行 *)
blockquote      ::= '>' TEXT                           (* WHY / 设计意图，不含关键词 *)
```

## 反模式

| # | 反模式 | 问题 | 正确做法 |
|---|--------|------|---------|
| 1 | 纯段落描述条件逻辑 | LLM 需"读懂段落"才能提取分支 | 用 `**IF**` / `**MATCH**` + 缩进分支 |
| 2 | 指令动词不加粗大写 | 动词淹没在句子中，无法扫描 | 所有指令动词用 `**全大写粗体**` 标记 |
| 3 | 优先级链无兜底 | 所有选项都不命中时行为未定义 | 末尾加 `*none*` → 兜底动作 |
| 4 | ASSERT 无表达式 | "确认测试通过"不可机械验证 | `**ASSERT** \`exit_code == 0\` && \`failures == 0\`` |
| 5 | 状态声明用自然语言 | "任务完成"歧义——完成还是有保留？ | 用四态关键词：`**DONE**` / `**DONE_WITH_CONCERNS**` / ... |
| 6 | 引用块中含执行指令 | 违反约定 #8（引用块=WHY） | 执行指令移出引用块，引用块仅保留设计意图 |
| 7 | MATCH 后跟自然语言 | LLM 无法提取待匹配变量 | `**MATCH**` 后必须跟 `` `变量名` `` |
| 8 | MATCH 分支用 emoji 做标识符 | emoji 与关键词语义重复，LLM 可能匹配 emoji 而非文本 | 分支用文本描述，状态用关键词（`**DONE**` 等） |
| 9 | 超过 2 层嵌套未提取子步骤 | LLM 丢失层级追踪，解析出错 | 3 层以上嵌套提取为命名子步骤（`####`），用 `**GOTO**` 连接 |
| 10 | MATCH 缺少兜底且未穷尽枚举 | 未覆盖的值 = 未定义行为 | 提供 `*default*` 兜底或枚举全部值域 |
| 11 | EXEC 后跳过 exit_code 检查 | "执行了"≠"执行成功" | `**EXEC**` 后必须 `**ASSERT** \`exit_code == 0\`` 或说明无需检查的理由 |
| 12 | 编排级 ROUTE 无提示模板 | 目标 skill 缺少执行上下文 | 编排器调度子 skill 时，`**ROUTE**` 后跟代码块提示模板。MATCH 内简单路由可省略 |
