# AI 任务提示词模板

> specAgent 产出 | 2026-06-23

## 目标

在 README.md 中插入 Mermaid 流程图，展示 12 个 Skill 的关系和使用路径。

## 上下文

读取 `docs/tasks/0003-readme-mermaid-map/` 下的 01-05 文件。

## 边界

严格遵循 04-boundary.md 的 allow/deny 列表。

## 输出格式

修改后的 README.md，在「## 📦 包含 12 个可独立使用的 Skill」章节之前插入 Mermaid 流程图。

## 验证标准

- Mermaid 语法正确
- 全部 12 个 Skill 在图中出现
- 区分用户主动调用和编排器自动调度
- 上下游依赖关系正确
