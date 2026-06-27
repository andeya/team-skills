# Spec-Driven 工作流

> 共享规则文件。定义从规格到实现到验证的完整工作流，包括 SDD 质量标准、TDD 纪律和有向图回退机制。

## §1 Spec-Driven 开发原则

### 1.1 规格先于代码

- 任何功能实现必须有对应的 SDD（Software Design Document）作为输入
- SDD 是 team-impl 和 team-test 的唯一规格来源——不依赖口头约定或聊天记录
- 修改类任务使用 Delta Spec（ADDED/MODIFIED/REMOVED），新建类任务使用完整 SDD

### 1.2 SDD 七部分质量标准

每份 SDD **MUST** 包含以下七部分（缺一不可）：

| 部分          | 内容                                                       | 消费方                       |
| ------------- | ---------------------------------------------------------- | ---------------------------- |
| 背景与动机    | 为什么做、痛点、用户场景                                   | 所有 Agent                   |
| 业务规则      | RFC 2119 强度标记（MUST/SHOULD/MAY）+ Given/When/Then 场景 | team-test → 直接映射测试用例 |
| 关键设计决策  | 选择方案 + 拒绝方案 + 拒绝理由                             | team-review → 审查决策合理性 |
| 数据流总览    | ASCII 架构图                                               | team-impl → 理解调用链路     |
| 输入/输出规格 | 参数类型、约束、默认值、示例                               | team-impl + team-test        |
| 边界条件      | 空值、极值、并发、格式异常                                 | team-test → 边界测试         |
| 异常场景      | 错误码、错误消息、HTTP 状态                                | team-test → 异常测试         |

### 1.3 规格驱动的验证链

```
SDD §二 业务规则（GWT 场景）
    ↓ 直接映射
team-test 测试用例
    ↓ 验证
team-impl 实现代码
    ↓ 审查
team-review 对照 SDD 逐条检查
```

每个验证环节 **MUST** 引用 SDD 条目编号（如 B1、E2、M1），形成闭环可追溯链。

## §2 TDD 工作流

### 2.1 红-绿-重构循环

```
RED:    从 SDD 提取场景 → 写测试 → 运行失败 → 记录到 06-tdd-log.md
GREEN:  写最小实现 → 运行通过 → 记录到 06-tdd-log.md
REFACTOR: 优化代码质量 → 运行仍通过 → 记录到 06-tdd-log.md
COMMIT: git commit（每个功能点一次，不攒多个功能点）
```

### 2.2 禁止事项

- **MUST NOT** 先写实现再补测试
- **MUST NOT** 修改测试让它通过（修改实现让测试通过）
- **MUST NOT** 跳过 RED 阶段（"我知道实现是对的"不是理由）
- **MUST NOT** 在无测试覆盖的代码上重构

### 2.3 增量提交策略

每完成一个功能点的红-绿-重构循环后立即 `git commit`：

- 测试提交：`test: {功能点描述}`
- 实现提交：`feat: {功能点描述}` 或 `fix: {功能点描述}`
- 重构提交：`refactor: {功能点描述}`

## §3 有向图回退规则

### 3.1 回退触发条件

| 发现者      | 问题类型         | 回退目标           |
| ----------- | ---------------- | ------------------ |
| team-test   | 实现 bug         | → team-impl        |
| team-test   | SDD 未定义的场景 | → team-spec        |
| team-review | P0/P1 实现 bug   | → team-impl        |
| team-review | spec 遗漏        | → team-spec        |
| 任何 Agent  | 任务不可行       | → Kill Switch → ASK_HUMAN |

### 3.2 回退携带上下文

回退时 **MUST** 提供：

- 具体问题描述（不是"有 bug"，而是"第 42 行空指针"）
- 复现步骤（包括命令和输出）
- 期望行为（引用 SDD 条目编号）
- 建议修复方向

### 3.3 回退次数上限

同一阶段回退 ≤ 2 次。第 3 次强制触发 ASK_HUMAN 人类介入。
