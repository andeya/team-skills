---
description: spec ↔ skills 对抗迭代，双向审计全部 SKILL.md 与 skill-spec.md 的一致性并修复到收敛
argument-hint: [轮次数, 默认10]
---

# /team-adversarial — Spec ↔ Skills 对抗迭代

## 功能

对 `skills/_team-rules/skill-spec.md`（语言规范）与 `skills/*/SKILL.md`（全部消费方）进行双向对抗审计。每轮发现全部问题 → 修复全部问题 → 验证修复，循环直到收敛或达到轮次上限。

## 红线原则

以下两条红线贯穿每轮审计的每个维度，违反即为缺陷：

1. **零阅读门槛**：skill-spec 定义的语法必须让 LLM 即使从未读过 skill-spec.md 也能理解用该语法写出的 SKILL.md 的含义。如果某个语法构造需要查阅规范才能理解，该构造的设计有问题。
2. **关键词全大写粗体英文**：skill-spec 语言中所有关键词（包括 `EACH`、`IN`、`MAX` 等语法辅助词）必须是 `**全大写粗体英文**`。表达式运算符（EXISTS/NOT_EXISTS/NOT_EMPTY/CONTAINS）因 Markdown 反引号内无法渲染粗体，在反引号表达式内使用纯大写。

## 参数

- `$ARGUMENTS`：最大轮次数（正整数，默认 10）

## 审计范围

- **规范文件**：`skills/_team-rules/skill-spec.md`
- **消费方文件**：`skills/*/SKILL.md`（所有 `team-` 前缀的 skill 目录 + `using-team-skills`）
- **共享规则文件**：`skills/_team-rules/*.md`（constitutional-rules、verification-protocol、four-state-protocol、first-principles）

## 审计维度清单（10 维度）

每轮审计必须覆盖全部 10 个维度，不可选择性跳过：

| # | 维度 | 检查内容 | 常见问题 |
|---|------|----------|----------|
| 1 | 关键词格式 | 所有关键词（IF/ELSE/FOR/EACH/IN/MAX/MATCH/RESOLVE 等）在执行上下文中是否 `**全大写粗体**` | `each`/`in` 小写或无粗体 |
| 2 | 控制流完备性 | 多行 IF 是否有 ELSE 或 fallback、MATCH/RESOLVE 是否有 `*default*`/`*none*` 兜底 | MATCH 无 default 分支 |
| 3 | BNF ↔ 用法一致性 | spec 的 BNF 产生式能否解析 skill 中所有实际出现的语法构造 | skill 用了 spec 未定义的语法 |
| 4 | 跨文件变量一致性 | 约定变量名（如 `verify_cmd`、`slug`、`mode`）在所有 skill 中是否统一 | 同一概念用不同变量名 |
| 5 | 结构合规性 | 每个 SKILL.md 是否包含 CLAUDE.md §13.1 定义的 12 个必要章节 | 缺少「下一步」或「集成关系」章节 |
| 6 | 表达式语言一致性 | 反引号表达式中是否使用英文运算符，不混用中文（存在/不存在/包含/非空） | `IF 文件 存在` 应为 `IF \`文件 EXISTS\`` |
| 7 | spec 覆盖率 | skill-spec 定义的每个构造（REPEAT/GATE/ROUTE 等）是否至少被 1 个 skill 使用 | spec 定义了 REPEAT 但无 skill 使用 |
| 8 | 零阅读门槛验证 | 模拟未读过 spec 的 LLM，检查每个语法构造是否自解释 | `*none*` 含义不直观 |
| 9 | 引用完整性 | GOTO 目标标题是否存在、ASSERT 是否有 fallback 动作、RESOLVE 链是否有兜底 | GOTO 指向不存在的标题 |
| 10 | 关键词语义唯一 | 同一关键词是否只承载一种语义，不在不同场景表达不同含义 | ROLLBACK 既表示回退 Agent 又表示撤销代码 |

## 单轮执行协议（5 步）

每轮严格按以下 5 步执行：

### Step 1：读取全部文件

读取 `skills/_team-rules/skill-spec.md` 和所有 `skills/*/SKILL.md`。每轮必须重新读取（不使用缓存或上一轮记忆），因为上一轮修复可能引入新问题。

### Step 2：逐维度全量扫描

按 10 个维度逐一扫描全部文件。对每个维度，扫描所有文件的每一行——不抽样、不跳过。

产出：问题清单，每个问题包含：

- 文件路径 + 行号
- 所属维度编号
- 问题描述（具体到"第 X 行的 `each` 应为 `**EACH**`"，不是"存在格式问题"）
- 修复方案

### Step 3：执行修复

按问题清单逐一修复。修复策略：

- 如果问题在 skill 端（用法不合规）→ 修改 skill
- 如果问题在 spec 端（规则缺失或不合理）→ 修改 spec
- 如果问题涉及红线违反 → 优先修改 spec（让语法自解释），其次修改 skill

### Step 4：验证修复

重新读取被修改的文件，逐条验证修复是否正确。检查修复是否引入新问题（如修改 GOTO 目标后目标标题是否存在、修改关键词后上下文是否合理）。

### Step 5：输出本轮报告

```markdown
## Round {N} 报告

- 发现问题：{total} 个
- 修复成功：{fixed} 个
- 新引入问题：{new} 个（如有）
- 各维度分布：D1({n}) D2({n}) ... D10({n})

### 问题明细

| # | 文件 | 行号 | 维度 | 问题 | 修复 | 状态 |
|---|------|------|------|------|------|------|
| 1 | team-impl/SKILL.md | 42 | D1 | `each` 未加粗大写 | → `**EACH**` | ✅ |
```

## 迭代控制

1. **收敛退出**：连续 2 轮发现 0 个问题 → 提前结束，输出收敛报告
2. **轮次上限**：达到 `$ARGUMENTS`（默认 10）轮 → 停止，输出当前状态报告
3. **死循环检测**：如果连续 3 轮发现的问题集合完全相同（同文件同行号同维度）→ 标记为"无法自动修复"，停止并报告

## 误报防护

以下情况不是缺陷，扫描时跳过：

- **YAGNI** 等概念名称的粗体标注——不是关键词（spec 第 37 行已声明）
- 反引号代码块/BNF 中的原样大写——代码环境不需要粗体
- `**required**`/`**optional**` 小写粗体——是输入标注约定，不是关键词
- EXEC 函数调用表达式如 `EXEC("command")` 在 RESOLVE 链中——是值表达式
- `####` 标题作为 GOTO 目标——四级标题是有效跳转目标

## 产出

执行完毕后输出总结：

```markdown
# 对抗迭代总结

- 执行轮次：{N} / {max}
- 收敛轮次：Round {N}（连续 2 轮零发现）
- 累计发现：{total} 个问题
- 累计修复：{fixed} 个
- 修改文件：{files} 个
- 各维度累计：D1({n}) D2({n}) ... D10({n})
```
