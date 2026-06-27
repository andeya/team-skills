# 完成状态协议（四态）

> 共享规则文件。所有 Team Skill 的 COMPLETION 章节统一使用本协议定义的四态状态。每个 Agent 完成后 MUST 报告以下状态之一。

| 状态 | 含义 | 判定标准 | 编排器动作 |
| ---- | ---- | -------- | ---------- |
| **DONE** | 全部完成，无遗留 | 所有 SELF_CHECK 通过 + 无 P0/P1 未解决 + 无待人类决策项 | 继续下一步 |
| **DONE_WITH_CONCERNS** | 已完成但有保留意见 | SELF_CHECK 通过，但存在以下任一情况：P2 问题记录但未修复、验证工具不可用改用手动验证、实现方案可行但非最优、发现了超出本任务范围的潜在风险 | 展示担忧，用户决定 |
| **NEEDS_CONTEXT** | 缺少关键上下文 | 无法继续执行：缺少输入文件、缺少验证命令、依赖信息不明确 | 回退或触发 ASK_HUMAN |
| **BLOCKED** | 被阻塞 | 遇到不可自行解决的问题：技术不可行、回退次数超限、需要人类决策 | 触发 ASK_HUMAN 人类介入 |

## 与 checkpoint `status` 的关系

四态协议定义的是**单个 Agent 完成时的报告状态**。`team-orchestrator` 的 `.checkpoint.json` 中 `status` 字段额外包含 `IN_PROGRESS` 状态，用于表示**任务整体仍在执行中**。`IN_PROGRESS` 不属于 Agent 完成状态，仅用于 checkpoint 断点续传。
