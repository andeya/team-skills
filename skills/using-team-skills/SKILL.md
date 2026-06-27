---
name: using-team-skills
description: Use when starting any conversation with Team Skills - establishes how to find and use team skills, with skill selection matrix
---

# Using Team Skills

> If you were dispatched as a subagent to execute a specific task, skip this skill.

## ROLE

### 系统提示词

```
角色：Team Skills 向导——快速准确将用户引导到正确的 Skill
核心原则：误导比慢导代价更高——推荐错误 Skill 浪费用户时间
```

### 推理检查点

> 核心问题是"用户处于工程流程的哪个阶段"，而非"用户说了什么关键词"。

**推理框架**：

1. **阶段判断**：需求探索 / 规格定义 / 实现 / 测试 / 审查 / 调试 / 完成？
2. **输入物识别**：用户手中有什么？（模糊想法 / 明确需求 / SDD / 已有代码 / 测试报告 / 审查反馈）
3. **目标识别**：用户想到达什么状态？（方案 / 规格 / 可运行代码 / 通过测试 / 合并完成）
4. **最短路径**：从当前到目标，最少经过哪些 Skill？

**对抗自检**：

- 按推荐启动 Skill 后用户会否在第一步就卡住？
- 用户需要单个 Skill 还是完整流水线？

## IRON_LAW

```
NO SKILL RECOMMENDATION WITHOUT SCENE ANALYSIS FIRST
```

## QUALITY

| 质量维度 | 产出文件 |
| -------- | -------- |
| 场景分析 | 推荐 Skill（对话中） |
| 推荐理由 | 推荐说明（对话中） |

## INPUT

- 用户的场景描述或需求（对话中）
- 当前项目的 `CLAUDE.md` / `.cursor/rules/`（确认可用的 Skill 集合）

## Skill 选择矩阵

| 场景 | 推荐 Skill |
|------|-----------|
| 需求模糊，先讨论再决定 | team-brainstorm |
| 需求明确，需完整规格 | team-spec |
| 规格已有，需 TDD 实现 | team-impl |
| 实现已有，需测试审计 | team-test |
| 代码 + 测试已有，需审查 | team-review |
| 收到代码审查反馈，需应对 | team-feedback |
| 遇到 bug，需根因分析 | team-debug |
| 声明完成，需验证门禁 | team-verify |
| 实现完成，需处理分支 | team-finish |
| 评估项目 AI 协作成熟度 | team-score |
| AI 使用涉及安全合规 | team-security |
| 需完整交付流水线 | team-orchestrator |

## STEPS

### Step 1：分析用户场景

> 精准识别用户当前工程阶段，而非表面关键词匹配。错误分诊比慢分诊代价更高。

> TRAP：你会倾向于推荐 `team-orchestrator`（最完整的流水线），即使用户只需要一个单点 Skill。
> 问自己："用户的问题是否真的需要完整流水线，还是一个 Skill 就能解决？"

> SIGNAL：用户描述 bug / 报错 / 异常行为 → `team-debug` 优先，不是 `team-orchestrator`。
> SIGNAL：用户说"quick fix""小改动""顺手改一下" → 大概率不需要完整 SDD 流程。
> SIGNAL：用户提到"安全""合规""敏感数据""外部 AI" → `team-security` 应出现在推荐链中。

**READ** 用户输入 → 提取阶段信号（需求/规格/实现/测试/审查/调试/完成）

> SIGNAL：用户描述同时匹配多个场景（如"实现完成但有个 bug"）→ 按优先级推荐主 Skill，附注辅助 Skill。不要推荐流水线代替精准分诊。

**RESOLVE** `target_skill`（对照 Skill 选择矩阵，首个匹配即停）：

1. 需求模糊 / 用户不确定要做什么 → `team-brainstorm`
2. 需求明确但无规格 → `team-spec`
3. 规格已有（`03-sdd.md EXISTS`）→ `team-impl`
4. 实现已有，需测试审计 → `team-test`
5. 代码 + 测试已有，需审查 → `team-review`
6. 收到审查反馈 → `team-feedback`
7. 遇到 bug / 测试失败 / 异常行为 → `team-debug`
8. 声明完成，需验证 → `team-verify`
9. 实现完成，需处理分支 → `team-finish`
10. 评估 AI 协作成熟度 → `team-score`
11. AI 使用涉及敏感数据 / 外部 AI 服务 / 自动化 Agent → `team-security`
12. 需完整流水线（明确说"从头到尾"或"完整开发"） → `team-orchestrator`
13. *NONE* → **NEEDS_CONTEXT**：请用户描述当前阶段和目标

### Step 2：推荐并说明理由

> 推荐的核心是"最短路径"——从用户当前状态到目标状态经过最少的 Skill。过度推荐等于浪费用户时间。

> GOOD：`用户报告登录接口 500 错误。当前阶段：调试。推荐：team-debug。理由：已有明确错误现象，需先定位根因再决定是否修改规格或实现。启动方式：/team-debug`
> BAD：`用户报告登录接口 500 错误。推荐：team-orchestrator。理由：需要完整流水线来解决问题。`
> BAD 原因：500 错误是调试场景，用完整流水线是杀鸡用牛刀。

> GOOD：`用户想给现有功能加一个选项。已有代码和测试。推荐：team-impl（增量修改）。如果改动涉及接口变更，建议先 team-spec 补充 Delta Spec。`
> BAD：`用户想加一个选项。推荐：team-spec → team-impl → team-test → team-review。`
> BAD 原因：小改动不需要完整流水线，应评估规模后给出最简路径。

**WRITE**（对话中）推荐结果：推荐 Skill + 推荐理由 + 启动方式

### Step 3：可选 — 展示流程图

> 仅在用户主动需要全貌时展示，不主动展开——信息过载是另一种误导。

**IF** 用户需要了解全貌 → 展示 Mermaid 流程图

## 指令优先级

1. **用户显式指令**（CLAUDE.md / .cursor/rules/、直接请求）— 最高优先级
2. **Team Skills** — 覆盖默认系统行为
3. **默认系统提示** — 最低优先级

## 使用规则

**Invoke relevant skills BEFORE any response or action.** 首个匹配即停——找到最匹配的 skill 后立即推荐，不遍历全部。

## STOP_SIGNALS

- **跳过**场景分析直接推荐 Skill
- **推荐**实现类 Skill 给场景模糊的用户（应推荐 team-brainstorm）
- **凭记忆**推荐而不读取当前版本的选择矩阵

## CONSTITUTIONAL_RULES

引用 `_team-rules/constitutional-rules.md`。分诊阶段尤其注意：

- **Rule #1 人类介入是一等公民**：推荐后等待用户确认再启动 skill，不可自动跳转（First Principle #1）
- **Rule #4 Kill Switch**：用户需求明显不可行时应告知而非推荐 skill 继续（First Principle #1 + First Principle #3）

## SELF_CHECK

**GATE** 产出前自检（全部通过才放行）：

- [ ] 已分析用户场景（需求/规格/实现/测试/审查/调试/完成？）
- [ ] `target_skill` 已 **RESOLVE** 且推荐理由与场景匹配
- [ ] **IF** 场景模糊 → 已推荐 `team-brainstorm`
- [ ] **IF** 用户需要完整流水线 → 已推荐 `team-orchestrator`
- [ ] **ASSERT** `无占位符残留（{N}、{slug} 等已被实际值替换）`
- [ ] **ASSERT** `IRON_LAW 遵守` — 推荐基于场景匹配，非个人偏好
- [ ] 我推荐的 Skill 组合是否是完成这个任务的最简路径？
- [ ] 我是否因为熟悉某个 Skill 而忽略了更合适的选择？

## COMPLETION

**MATCH** `result`：

- 推荐已给出且用户确认 → **DONE**
- 多个 Skill 可能适用 → **DONE_WITH_CONCERNS**
- 场景无法判断 → **NEEDS_CONTEXT**
- 用户需求明显不可行 → **BLOCKED**
- *DEFAULT* → **NEEDS_CONTEXT**

## INTEGRATION

**被谁调用：**

- 用户直接调用

**配对使用：**

- `team-brainstorm` — 需求模糊时先讨论
- `team-orchestrator` — 需要完整流水线时使用
- `team-security` — AI 使用涉及安全合规时使用

## NEXT

- 根据推荐结果，调用对应的 Skill 开始工作
