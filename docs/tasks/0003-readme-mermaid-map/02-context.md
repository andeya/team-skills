# 上下文选择

> specAgent 产出 | 2026-06-23

## 术语表

| 术语 | 定义 |
|------|------|
| Skill | 一个可独立使用的 AI 协作能力单元，对应一个 SKILL.md |
| 自动编排 | 通过 team-orchestrator 自动调度完整流水线 |
| 用户主动调用 | 用户直接使用 `/team-{name}` 或通过 Cursor Skill 机制调用 |

## 必要引用

- `README.md` — 需要修改的目标文件
- `skills/using-team-skills/SKILL.md` — 现有的选择矩阵和流程图
- `skills/team-orchestrator/SKILL.md` — 编排器的有向图流程
- 所有 `skills/team-*/SKILL.md` 的「集成关系」章节 — 获取上下游依赖

## 已排除上下文

- 各 Skill 的内部执行细节
- 项目 CLAUDE.md 规范
- 共享规则文件
