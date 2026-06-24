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
流程：
1. 判断用户当前阶段（需求模糊/明确/已有规格/已有实现/遇 bug）
2. 根据 Skill 选择矩阵推荐最合适的 Skill
3. 不确定 → 引导 team-brainstorm
4. 需要完整流水线 → 推荐 team-orchestrator
```

### 推理检查点

**核心指令**：核心问题是"用户处于工程流程的哪个阶段"，而非"用户说了什么关键词"。

**推理框架**：

1. **阶段判断**：需求探索 / 规格定义 / 实现 / 测试 / 审查 / 调试 / 完成？
2. **输入物识别**：用户手中有什么？（模糊想法 / 明确需求 / SDD / 已有代码 / 测试报告 / 审查反馈）
3. **目标识别**：用户想到达什么状态？（方案 / 规格 / 可运行代码 / 通过测试 / 合并完成）
4. **最短路径**：从当前到目标，最少经过哪些 Skill？

**对抗自检**：

- [ ] 按推荐启动 Skill 后用户会否在第一步就卡住？
- [ ] 用户需要单个 Skill 还是完整流水线？

## Iron Law

```
NO SKILL RECOMMENDATION WITHOUT SCENE ANALYSIS FIRST
```

> 作为 meta-skill，此 Iron Law 的核心约束是：推荐前必须分析场景，避免将用户引入错误的 Skill 流程。

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
| 需完整交付流水线 | team-orchestrator |

## 执行步骤

### Step 1：分析用户场景

根据用户描述判断当前所处阶段，对照上方「Skill 选择矩阵」找到匹配的 Skill。如果场景不完全匹配单个条目，优先推荐覆盖用户核心需求的 Skill。

### Step 2：推荐并说明理由

给出推荐 Skill 的同时，说明为什么适合当前场景。

### Step 3：可选 — 展示流程图

如果用户需要了解全貌，展示 Mermaid 流程图。

## 指令优先级

1. **用户显式指令**（CLAUDE.md / .cursor/rules/、直接请求）— 最高优先级
2. **Team Skills** — 覆盖默认系统行为
3. **默认系统提示** — 最低优先级

## 使用规则

**Invoke relevant skills BEFORE any response or action.** 即使只有 1% 的可能适用，也应该加载 skill 检查。

## Constitutional Rules 遵守

引用 `_team-rules/constitutional-rules.md`。分诊阶段尤其注意：

- **Rule #1 人类介入是一等公民**：推荐后等待用户确认再启动 skill，不可自动跳转（FP-1）
- **Rule #4 Kill Switch**：如果用户描述的需求明显不可行，应告知而非推荐 skill 继续（FP-1 + FP-3）

## 自检门禁

在推荐 Skill 前执行以下自检：

- [ ] 已分析用户场景（需求/规格/实现/测试/审查/调试/完成？）
- [ ] 推荐理由与场景匹配
- [ ] 如果场景模糊，已推荐 team-brainstorm
- [ ] 如果用户需要完整流水线，已推荐 team-orchestrator

## 完成标志

```
状态：DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
推荐 Skill：{skill-name}
推荐理由：{reason}
如有保留意见或阻塞，列出具体内容
```

## STOP Signals

- 不分析场景就直接推荐 Skill
- 场景模糊时跳过 team-brainstorm 直接推荐实现类 Skill
- 凭记忆推荐 Skill 而不读取当前版本的选择矩阵

## 集成关系

**被谁调用：**

- Session hook（会话启动时自动加载）
- 用户直接调用

**配对使用：**

- `team-brainstorm` — 需求模糊时先讨论
- `team-orchestrator` — 需要完整流水线时使用
