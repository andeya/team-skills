---
name: using-team-skills
description: Use when starting any conversation with Team Skills - establishes how to find and use team skills, with skill selection matrix
---

# Using Team Skills

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

## 角色定位

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

## Iron Law

```
NO SKILL RECOMMENDATION WITHOUT SCENE ANALYSIS FIRST
```

## 质量职责

| 质量维度 | 产出文件 |
| -------- | -------- |
| 场景分析 | 推荐 Skill（对话中） |
| 推荐理由 | 推荐说明（对话中） |

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
| 需完整交付流水线 | team-orchestrator |

## 执行步骤

### Step 1：分析用户场景

**READ** 用户输入 → 提取阶段信号（需求/规格/实现/测试/审查/调试/完成）

**RESOLVE** `target_skill`（对照 Skill 选择矩阵，首个匹配即停）：

1. 需求模糊 / 用户不确定要做什么 → `team-brainstorm`
2. 需求明确但无规格 → `team-spec`
3. 规格已有（`03-sdd.md` 存在）→ `team-impl`
4. 实现已有，需测试审计 → `team-test`
5. 代码 + 测试已有，需审查 → `team-review`
6. 收到审查反馈 → `team-feedback`
7. 遇到 bug → `team-debug`
8. 声明完成，需验证 → `team-verify`
9. 实现完成，需处理分支 → `team-finish`
10. 评估 AI 协作成熟度 → `team-score`
11. 需完整流水线 → `team-orchestrator`
12. *none* → **NEEDS_CONTEXT**：请用户描述当前阶段和目标

### Step 2：推荐并说明理由

**WRITE**（对话中）推荐结果：推荐 Skill + 推荐理由 + 启动方式

### Step 3：可选 — 展示流程图

**IF** 用户需要了解全貌 → 展示 Mermaid 流程图

## 指令优先级

1. **用户显式指令**（CLAUDE.md / .cursor/rules/、直接请求）— 最高优先级
2. **Team Skills** — 覆盖默认系统行为
3. **默认系统提示** — 最低优先级

## 使用规则

**Invoke relevant skills BEFORE any response or action.** 首个匹配即停——找到最匹配的 skill 后立即推荐，不遍历全部。

## STOP Signals

- **跳过**场景分析直接推荐 Skill
- **推荐**实现类 Skill 给场景模糊的用户（应推荐 team-brainstorm）
- **凭记忆**推荐而不读取当前版本的选择矩阵

## Constitutional Rules 遵守

引用 `_team-rules/constitutional-rules.md`。分诊阶段尤其注意：

- **Rule #1 人类介入是一等公民**：推荐后等待用户确认再启动 skill，不可自动跳转（FP-1）
- **Rule #4 Kill Switch**：用户需求明显不可行时应告知而非推荐 skill 继续（FP-1 + FP-3）

## 自检门禁

**GATE** 产出前自检（全部通过才放行）：

- [ ] 已分析用户场景（需求/规格/实现/测试/审查/调试/完成？）
- [ ] `target_skill` 已 **RESOLVE** 且推荐理由与场景匹配
- [ ] **IF** 场景模糊 → 已推荐 `team-brainstorm`
- [ ] **IF** 用户需要完整流水线 → 已推荐 `team-orchestrator`

## 完成标志

**MATCH** `result`：

- 推荐已给出且用户确认 → **DONE**
- 多个 Skill 可能适用 → **DONE_WITH_CONCERNS**
- 场景无法判断 → **NEEDS_CONTEXT**
- 用户需求明显不可行 → **BLOCKED**
- *default* → **NEEDS_CONTEXT**

## 集成关系

**被谁调用：**

- Session hook（会话启动时自动加载）
- 用户直接调用

**配对使用：**

- `team-brainstorm` — 需求模糊时先讨论
- `team-orchestrator` — 需要完整流水线时使用
