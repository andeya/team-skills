---
description: 逐文件遍历：对项目文件逐个执行用户指定的操作，修改后重检直到干净再处理下一个
argument-hint: [--scope skills|rules|commands|all|<glob>] <操作描述>
---

# /team-range — 逐文件遍历执行

## 功能

对项目文件逐个执行用户指定的操作。每个文件处理完后立即重检，确认无遗留问题再移动到下一个。类似 `for file in files; do operation(file); done` 的语义。

## 参数

- `$ARGUMENTS`：对每个文件要执行的操作描述（自然语言）

### 可选前缀

在操作描述前添加前缀控制遍历范围：

| 前缀 | 含义 | 示例 |
|------|------|------|
| `--scope skills` | `skills/_team-rules/*.md` + `skills/*/SKILL.md`（默认） | `/team-range 检查引用格式` |
| `--scope rules` | 仅 `skills/_team-rules/*.md` | `/team-range --scope rules 检查交叉引用` |
| `--scope commands` | 仅 `.claude/commands/*.md` | `/team-range --scope commands 检查步骤编号` |
| `--scope all` | Rules + Skills + References + Commands | `/team-range --scope all 检查占位符残留` |
| `--scope <glob>` | 自定义 glob 模式 | `/team-range --scope "skills/team-{impl,test}/*" 检查 TDD 流程` |

无前缀时默认 `--scope skills`。

## 遍历顺序

### `--scope skills`（默认）

先共享规则（字母序），再 SKILL.md（入口 → 编排器 → 流水线 → 支撑）：

**共享规则**（`skills/_team-rules/*.md`，字母序）：

| # | 文件 |
|---|------|
| 1 | `skills/_team-rules/ai-collaboration-standards.md` |
| 2 | `skills/_team-rules/constitutional-rules.md` |
| 3 | `skills/_team-rules/first-principles.md` |
| 4 | `skills/_team-rules/four-state-protocol.md` |
| 5 | `skills/_team-rules/spec-driven-workflow.md` |
| 6 | `skills/_team-rules/task-lifecycle.md` |
| 7 | `skills/_team-rules/verification-protocol.md` |

**SKILL.md**（编排流程顺序）：

| # | 文件 | # | 文件 |
|---|------|---|------|
| 8 | `skills/using-team-skills/SKILL.md` | 15 | `skills/team-finish/SKILL.md` |
| 9 | `skills/team-orchestrator/SKILL.md` | 16 | `skills/team-verify/SKILL.md` |
| 10 | `skills/team-brainstorm/SKILL.md` | 17 | `skills/team-debug/SKILL.md` |
| 11 | `skills/team-spec/SKILL.md` | 18 | `skills/team-feedback/SKILL.md` |
| 12 | `skills/team-impl/SKILL.md` | 19 | `skills/team-score/SKILL.md` |
| 13 | `skills/team-test/SKILL.md` | 20 | `skills/team-security/SKILL.md` |
| 14 | `skills/team-review/SKILL.md` | | |

### `--scope rules`

仅 `skills/_team-rules/*.md`（上表 #1-7），字母序。

### `--scope commands`

仅 `.claude/commands/*.md`，字母序。

### `--scope all`

rules → skills → `skills/*/references/*.md`（字母序）→ commands，按此顺序拼接。

### `--scope <glob>`

**EXEC** `find` 匹配，结果按字母序。

## 执行协议

### Step 1：解析参数

**RESOLVE** `operation`（从 `$ARGUMENTS` 提取）：

1. 包含 `--scope` 前缀 → 提取 scope 和 operation
2. 不包含前缀 → `scope = skills`，`operation = $ARGUMENTS` 全部内容
3. *NONE*（参数为空）→ **ASK_HUMAN**：请描述要对每个文件执行的操作

**RESOLVE** `file_list`（根据 scope）：

1. `skills` → 共享规则（#1-7 字母序）+ SKILL.md（#8-20 编排流程顺序）
2. `rules` → `skills/_team-rules/*.md`（字母序）
3. `commands` → `.claude/commands/*.md`（字母序）
4. `all` → rules + skills + `skills/*/references/*.md` + commands
5. 自定义 glob → **EXEC** `find` 匹配（字母序）
6. *NONE*（无匹配）→ **BLOCKED**：scope 未匹配任何文件

**WRITE**（对话中）遍历计划：

```
## 遍历计划

- 操作：{operation}
- 范围：{scope}
- 文件数：{N}
- 文件列表：{file_list 简要展示}
```

### Step 2：逐文件执行

**FOR** `file` **IN** `file_list`：

#### 2.1 读取

**READ** `file`

#### 2.2 执行操作

按 `operation` 描述对当前文件执行检查或修改。

- 发现问题 → 记录问题 + 执行修复
- 无问题 → 标记 `CLEAN`

#### 2.3 修改后重检（Fix-Until-Clean）

**IF** 2.2 中执行了修改：

**REPEAT** **MAX**=3：

1. **READ** `file`（重新读取修改后的内容）
2. 重新执行 `operation` 检查
3. **IF** 发现新问题 → 修复 → 继续 **REPEAT**
4. **IF** 无问题 → 标记 `CLEAN` → 退出 **REPEAT**

- *REPEAT_EXHAUSTED* → 标记 `REMAINING`，记录未解决问题，继续下一个文件

#### 2.4 报告单文件结果

**WRITE**（对话中）：

```
[{当前序号}/{总数}] {file} — {CLEAN / FIXED(N) / REMAINING(N)}
```

- `CLEAN`：无问题
- `FIXED(N)`：发现 N 个问题，全部修复
- `REMAINING(N)`：N 个问题未能在 3 轮内解决

### Step 3：最终汇总

**WRITE**（对话中）：

```
## 遍历完成

| # | 文件 | 问题数 | 已修复 | 状态 |
|---|------|-------|-------|------|
| {i} | {file} | {found} | {fixed} | {CLEAN/FIXED/REMAINING} |

合计：{total_files} 个文件，{total_found} 个问题，{total_fixed} 个已修复
```

**IF** `REMAINING 文件数 > 0` → 列出未解决问题清单

## 使用示例

```bash
# 检查所有 Skill 的 STOP_SIGNALS 格式
/team-range 检查 STOP_SIGNALS 是否以粗体动词开头，修复不合规项

# 检查引用格式一致性
/team-range 检查内联引用是否统一使用反引号格式

# 检查所有 MATCH 是否有 *DEFAULT* 兜底
/team-range 检查每个 MATCH 块是否有 *DEFAULT* 兜底分支

# 只检查特定 Skill
/team-range --scope "skills/team-{impl,test,review}/*" 检查 EXEC 后是否有 ASSERT

# 检查共享规则文件
/team-range --scope rules 检查文件间交叉引用是否正确

# 全量检查占位符
/team-range --scope all 检查是否有 TBD/TODO/待补充 等占位符残留
```
