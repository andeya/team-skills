# Delivery Checklist

> team-review 产出 | {slug} | {日期}

## 一、交付标准

- [ ] CI 全量检查通过（退出码 = 0）
- [ ] P0/P1 问题已全部修复或经人类决策豁免
- [ ] 04-boundary.md 的 deny 列表未被违反
- [ ] SDD 中所有 MUST 规则已被代码实现覆盖
- [ ] 无调试代码残留（console.log/debugger/TODO hack）
- [ ] 公共 API 有文档说明（参数、返回值、异常）
- [ ] CHANGELOG.md 已更新

## 二、AI 资产交付

- [ ] 项目 AI 规范（CLAUDE.md / .cursor/rules/）已更新（新规则含触发条件 + 可执行指令 + 示例）
- [ ] AGENTS.md 已更新（如有架构变更）
- [ ] docs/review-checklist.md 已更新
- [ ] docs/tasks/{slug}/task-rules.md 已产出

## 三、文档交付

- [ ] 06-tdd-log.md 每个功能点有完整 RED→GREEN→REFACTOR 记录（RED 含失败输出）
- [ ] 09-test-matrix.md 四维覆盖（功能/边界/异常/代码）
- [ ] 11-review.md 五维度审查完成
- [ ] 13-retrospective.md §三 新规则沉淀已写入目标文件

## 四、项目自定义交付项

> 根据项目实际情况追加检查项。
