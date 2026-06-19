# Team Skills

**一套 Spec-Driven 的 AI 协作开发框架** — 让 AI Agent 团队按有向图流程完成从需求到交付的全闭环，内置质量门禁和人类介入点，确保交付物可验证、可追溯、可评分。

## 为什么需要 Team Skills？

| 痛点                        | 现状                                   | Team Skills 方案                                                   |
| --------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| AI 写代码没有规格约束       | 给 AI 一句话就开始写，产出随机         | **Spec-Driven**：先产出 SDD 规格（七部分完整），再按规格写代码     |
| 发现问题只能从头来          | 线性流水线，Review 发现 bug 只能人工修 | **有向图回退**：testAgent/reviewAgent 发现问题自动回退到对应 Agent |
| AI 自称"测试通过"但实际没跑 | 无法验证 AI 的声明                     | **5 步验证协议**：必须执行命令、读完整输出、检查退出码             |
| 不知道什么时候该让人介入    | AI 要么全自动要么全手动                | **4 个结构化介入点**（H1-H4）：确认目标→确认规格→处理阻塞→验收交付 |
| 每次协作都是从零开始        | 经验不沉淀，规则不积累                 | **三层资产体系**：项目级→模块级→任务级规则持续沉淀                 |
| 交付质量无法量化评估        | 凭感觉判断"做得好不好"                 | **100 分制评分**：7 硬门槛 + 5 维度 25 子项，每项有可检查证据      |

## 核心架构

```
用户提出需求
    │
    ▼
┌─────────────────────────┐
│ H1: 人类确认目标理解      │ ← 人类介入点 #1
└────────┬────────────────┘
         ▼
┌─────────────────────────┐
│ specAgent — 规格制定      │  产出 01-05 + prompt-template
│ Socratic 提问 → SDD 规格 │  支持完整 SDD / Delta Spec
└────────┬────────────────┘
         ▼
┌─────────────────────────┐
│ H2: 人类确认规格方案      │ ← 人类介入点 #2
└────────┬────────────────┘
         ▼
┌─────────────────────────┐
│ implAgent — TDD 实现      │  红-绿-重构循环
│ 增量提交 + 决策记录       │  产出 06-08 + 代码
└────────┬────────────────┘
         ▼
┌─────────────────────────┐     ┌──── 发现 bug → 回退 implAgent
│ testAgent — 四维测试      │────┤
│ 功能/边界/异常/代码分支   │     └──── spec 遗漏 → 回退 specAgent
└────────┬────────────────┘
         ▼
┌─────────────────────────┐     ┌──── P0/P1 → 回退 implAgent
│ reviewAgent — 五维审查    │────┤
│ 资产沉淀 + 复盘          │     └──── spec 遗漏 → 回退 specAgent
└────────┬────────────────┘
         ▼
┌─────────────────────────┐
│ H4: 人类验收交付物        │ ← 人类介入点 #4
└─────────────────────────┘
```

> H3（人类介入点 #3）在任何阶段发现阻塞或需要人类决策时触发。

## 关键特性

### Spec-Driven 开发

- SDD 规格包含七部分：背景/业务规则/设计决策/数据流/输入输出/边界条件/异常场景
- 业务规则用 RFC 2119 标记强度（MUST/SHOULD/MAY），关键场景用 Given/When/Then 格式
- 修改类任务使用 Delta Spec（ADDED/MODIFIED/REMOVED），减少 token 消耗
- 验收标准可执行化：每条成功标准含验证命令 + 预期结果，机器可检查

### 质量门禁

- **8 条 Constitutional Rules** — 不可被任何任务覆盖的硬约束
- **5 步验证协议** — 杜绝"我觉得测试通过了"的虚假声明
- **反规避条款** — 预判 6 种常见借口并逐一反驳
- **回退次数上限** — 同一阶段 ≤ 2 次回退，超过强制人类介入
- **第一性原理假设挑战** — specAgent 思维链强制列出隐含假设并逐个质疑
- **三视角对抗审查** — reviewAgent 从攻击者/怀疑者/用户视角反向验证发现

### 完整产出链

每个任务产出 17 个结构化文档 + 代码 + 测试：

| 阶段 | 产出                                                                    | 负责 Agent   |
| ---- | ----------------------------------------------------------------------- | ------------ |
| 规格 | 01-plan / 02-context / 03-sdd / 04-boundary / 05-risk / prompt-template | specAgent    |
| 实现 | 06-tdd-log / 07-prompt-log / 08-ai-decisions + 代码                     | implAgent    |
| 测试 | 09-test-matrix / 10-test-report + 补充测试                              | testAgent    |
| 审查 | 11-review / 12-asset-update / 13-retrospective / task-rules             | reviewAgent  |
| 交付 | 14-team / 15-brief                                                      | orchestrator |

### 评分体系

内置 `team-score` 评分 Skill，按 100 分制评估项目的 AI 协作成熟度：

- **7 项硬门槛**：任一不过则整体不通过
- **5 个维度**：资产沉淀(25) + 任务规划(25) + 交付质量(27) + 过程复盘(13) + 团队协作(10)

## 体系来源

Team Skills 融合了业界两大 AI 协作框架的精华，并在此基础上构建了独有的有向图回退和评分追溯体系：

| 来源                      | 吸收的精华                                                                |
| ------------------------- | ------------------------------------------------------------------------- |
| **SuperPowers** (obra)    | 5 步验证协议、四态完成状态、反规避条款、Socratic 探索、进度账本           |
| **OpenSpec** (Fission AI) | Delta Spec 增量规格、RFC 2119 + Given/When/Then、归档与知识合并           |
| **Karpathy Skills**       | 过度抽象防御、死代码清理、困惑管理、最少代码原则                          |
| **Agent-Style**           | 5 条 LLM 输出质量约束（禁止空洞开头/虚假权威/重复总结/过度修饰+结论先行）|
| **独创**                  | 有向图回退、评分追溯矩阵、消费方契约、结构化人类介入点（H1-H4）、三视角对抗审查 |

## Skills 清单

| Skill               | 说明                                            |
| ------------------- | ----------------------------------------------- |
| `team-orchestrator` | 编排器 — 有向图流程调度，4 个人类介入点         |
| `team-spec-agent`   | 规格 Agent — Socratic 需求澄清 + SDD 规格产出   |
| `team-impl-agent`   | 实现 Agent — TDD 红-绿-重构循环开发             |
| `team-test-agent`   | 测试 Agent — 四维测试矩阵 + 补充测试 + 回退路由 |
| `team-review-agent` | 审查 Agent — 五维 Review + 资产沉淀 + 复盘      |
| `team-score`        | 评分 Skill — 100 分制扫描评估                   |
| `team-setup`        | 安装命令 — 一键安装到 `~/.agents/skills/`       |
| `team-pull`         | 拉取本仓库 — git pull 更新                      |
| `team-push`         | 提交推送本仓库 — git commit + push              |

## 快速开始

### 安装

在 Claude Code 中执行：

```
/team-setup
```

安装后目录结构：

```
~/.agents/skills/
├── team-orchestrator/    (编排器)
├── team-spec-agent/      (规格 Agent)
├── team-impl-agent/      (实现 Agent)
├── team-test-agent/      (测试 Agent)
├── team-review-agent/    (审查 Agent)
└── team-score/           (评分 Skill)

~/.claude/commands/
├── team-setup.md         (安装)
├── team-pull.md          (拉取)
└── team-push.md          (推送)
```

### 使用

**全自动编排**（推荐）：

```
/team-orchestrator 实现用户登录功能
```

编排器自动调度 specAgent → implAgent → testAgent → reviewAgent，在 H1-H4 暂停等待确认。

**手动分步**：

```
/team-spec-agent 实现用户登录功能    # 产出规格
/team-impl-agent 0001-user-login     # TDD 实现
/team-test-agent 0001-user-login     # 测试补充
/team-review-agent 0001-user-login   # 审查沉淀
/team-orchestrator 0001-user-login   # 补全团队证据
```

**评分**：

```
/team-score
```

**更新 / 推送**：

```
/team-pull                           # 拉取最新
/team-push "feat: add login skill"   # 提交变更
```

## 兼容性

| 工具        | 调用方式                | 自动发现机制          |
| ----------- | ----------------------- | --------------------- |
| Claude Code | `/team-{name}` 斜杠命令 | `~/.claude/commands/` |
| Cursor      | Skill 自动发现          | `~/.agents/skills/`   |

## 项目结构

```
team-skills/
├── CLAUDE.md                         # Spec-Driven 通用最佳实践
├── README.md
├── .claude/commands/
│   ├── team-setup.md                 # /team-setup 安装命令
│   ├── team-pull.md                  # /team-pull 拉取命令
│   └── team-push.md                  # /team-push 推送命令
└── skills/
    ├── team-orchestrator/SKILL.md    # 编排器
    ├── team-spec-agent/SKILL.md      # 规格 Agent
    ├── team-impl-agent/SKILL.md      # 实现 Agent
    ├── team-test-agent/SKILL.md      # 测试 Agent
    ├── team-review-agent/SKILL.md    # 审查 Agent
    └── team-score/SKILL.md           # 评分 Skill
```
