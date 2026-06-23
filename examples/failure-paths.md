# 失败路径示例：回退、H3 介入与 Kill Switch

真实项目不会总走 happy path。本指南展示 Team Skills 在遇到问题时如何处理。

## 场景 1：testAgent 发现 bug → 回退 implAgent

```
用户: /team-orchestrator 实现金额计算功能

[H1 确认通过]
[specAgent 产出 01-05 文件]
[H2 确认通过]
[implAgent 完成 TDD 开发]

testAgent:
  发现 bug：边界条件未处理 — 当金额为 0 时，计算返回 NaN 而非 0
  路由决策：→ implAgent

编排器:
  回退计数：test→impl = 1（上限 2）
  传递上下文：
    - 问题：金额为 0 时返回 NaN
    - 复现步骤：calculateAmount(0) → NaN
    - 期望行为：calculateAmount(0) → 0（SDD §七 B3）
    - 建议方向：添加零值边界检查

implAgent（第二次）:
  1. RED: 写测试 expect(calculateAmount(0)).toBe(0) → 失败 ✓
  2. GREEN: 添加零值检查 → 通过 ✓
  3. REFACTOR: 无需重构
  git commit -m "fix: handle zero amount edge case"

testAgent（第二次）:
  全部通过 → reviewAgent
```

## 场景 2：reviewAgent 发现 spec 遗漏 → 回退 specAgent

```
reviewAgent:
  Phase 1.5 Constitutional 合规检查：
    发现 03-sdd.md 未定义并发场景 — 两个用户同时修改同一记录
    严重级别：P1（spec 遗漏）
  路由决策：→ specAgent

编排器:
  回退计数：review→spec = 1（上限 2）
  传递上下文：
    - 问题：并发修改场景未定义
    - 发现位置：11-review.md §一 正确性审查
    - 期望补充：03-sdd.md §七 添加并发边界条件
    - 建议方向：乐观锁 vs 悲观锁

specAgent（第二次）:
  更新 03-sdd.md：
    §七 新增 B5：并发修改 — 使用乐观锁，版本号冲突返回 409
  更新 04-boundary.md：新增并发约束

[重新走 impl → test → review]
```

## 场景 3：回退超限 → 触发 H3

```
testAgent 发现 bug → 回退 implAgent（计数 1）
implAgent 修复后 → testAgent 又发现新 bug → 回退 implAgent（计数 2）
implAgent 再次修复 → testAgent 又发现 bug

编排器:
  回退计数 test→impl = 3 → 超过上限（≤ 2）
  强制触发 H3！

H3 人类介入请求:
  触发来源：testAgent | 触发原因：回退超限
  问题描述：test→impl 已回退 3 次，可能存在架构问题
  已尝试：
    - 第 1 次：修复零值边界
    - 第 2 次：修复类型转换
    - 第 3 次：又发现精度丢失
  选项：
    - A: 重新审视 SDD 架构方案（回退 specAgent）
    - B: 人类直接介入修复
    - C: Kill Switch — 终止任务
  推荐：A — 反复出现的计算问题暗示底层数据类型选择有误

用户选择 A → 编排器回退到 specAgent，传递三次失败的完整上下文
```

## 场景 4：Kill Switch 激活

```
implAgent Phase 0.5（审计同步）:
  发现：spec 要求调用第三方支付 API，但该 API 文档标注 deprecated，
  将于下月下线。方案不可行。

编排器:
  触发 Kill Switch → H3

H3 人类介入请求:
  触发来源：implAgent | 触发原因：Kill Switch
  问题描述：第三方支付 API 已标记 deprecated，下月下线，SDD 方案不可行
  选项：
    - A: 回退 specAgent，改用新版 API 重新设计
    - B: 回退 specAgent，改用其他支付服务商
    - C: Kill Switch — 终止任务，等 API 迁移完成后再启动
  推荐：A — 新版 API 已上线且接口兼容性好

用户选择 C → 任务终止
进度账本记录：0005-payment | KILLED | 原因：第三方 API deprecated
```

## 场景 5：BLOCKED 状态

```
specAgent:
  Phase 1 探索：需要读取数据库 schema，但没有数据库访问权限
  状态：BLOCKED
  阻塞原因：无法访问 production DB schema
  需要：DBA 提供 schema dump 或只读访问

编排器:
  触发 H3
  用户提供 schema.sql → specAgent 继续
```
