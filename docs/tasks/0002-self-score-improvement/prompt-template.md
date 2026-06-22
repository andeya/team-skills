# AI 任务提示词模板

> specAgent 产出 | 2026-06-23

## 目标

对 Team Skills 项目进行 team-score 评分，修复所有非满分项，迭代直到 100/100。

## 上下文

读取 `docs/tasks/0002-self-score-improvement/` 下的 01-05 文件。

## 边界

严格遵循 04-boundary.md 的 allow/deny 列表。

## 输出格式

评分报告输出到对话，包含硬门槛检查、5 维度评分明细、总分、改进建议。

## 验证标准

- 所有 12 个 SKILL.md 包含 8 个必需章节
- 所有 12 个 SKILL.md 包含「质量职责」和「Common Rationalizations」
- 章节顺序正确（完成标志 > Red Flags > Common Rationalizations > 集成关系 > 下一步）
