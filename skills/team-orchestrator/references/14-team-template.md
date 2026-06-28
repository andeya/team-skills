# 团队协作记录

> Team 编排器产出 | {日期}

## §一 角色分工

| 角色          | 负责人/Agent | 职责范围                                 | 产出物                        |
| ------------- | ------------ | ---------------------------------------- | ----------------------------- |
| 需求澄清      | team-spec    | 目标定义、SDD 规格、上下文选择、风险识别 | 01-05 + prompt-template       |
| AI 编码       | team-impl    | TDD 开发、Prompt 优化、决策记录          | 06-08 + 代码                  |
| 测试验证      | team-test    | 测试矩阵设计、补充测试、覆盖率           | 09-10 + 测试代码              |
| Review & 沉淀 | team-review  | 代码审查、资产维护、复盘                 | 11-13 + task-rules + 资产更新 |
| 编排协调      | team-orchestrator | 调度、一致性检查、交付包装               | 14-15                         |

## §二 协作资产一致性检查（自动化验证）

| 检查项                  | 验证方式                               | 结果  | 修复说明         |
| ----------------------- | -------------------------------------- | ----- | ---------------- |
| 术语一致性              | grep 02-context 术语 vs 全部文件       | ✅/⚠️ | {不一致处已修复} |
| 文档标题层级            | 检查任务目录下所有文件的 Markdown 结构 | ✅/⚠️ | ...              |
| commit message 类型前缀 | git log 检查每条 commit 含 type: 前缀（feat/fix/test/refactor/docs/chore） | ✅/⚠️ | ...              |
| AI 规范规则无矛盾       | diff 新增 vs 已有规则                  | ✅/⚠️ | ...              |
| 模块 AI 规范结构统一    | 对比各模块 AI 规范章节                 | ✅/⚠️ | ...              |
| 各 Agent 产出无遗漏     | 检查全部文档文件完整性（§五清单逐项）  | ✅/⚠️ | ...              |

> commit type 清单：`feat` / `fix` / `test` / `refactor` / `docs` / `chore` / `style` / `perf`

## §三 个人贡献明细

| 贡献者       | 角色        | 主要贡献      | 产出物 | 提交数 |
| ------------ | ----------- | ------------- | ------ | ------ |
| {人名/Agent} | team-spec   | 规格设计      | 01-05  | {N}    |
| {人名/Agent} | team-impl   | 代码实现      | 06-08  | {N}    |
| {人名/Agent} | team-test   | 测试补全      | 09-10  | {N}    |
| {人名/Agent} | team-review | Review + 沉淀 | 11-13  | {N}    |

## §四 质量审查数据

| 维度 | 真实问题数 | P0 | P1 | P2 |
| ---- | ---------- | -- | -- | -- |
| {dimension} | {count} | {n} | {n} | {n} |

## §五 交付物完整性检查

| 文件                | 状态 | 质量维度                      |
| ------------------- | ---- | ----------------------------- |
| 01-plan.md          | ✅   | 目标定义 + 阶段拆分           |
| 02-context.md       | ✅   | 上下文选择与术语对齐          |
| 03-sdd.md           | ✅   | 规格清晰度                    |
| 04-boundary.md      | ✅   | 修改边界约束                  |
| 05-risk.md          | ✅   | 风险与验证计划                |
| prompt-template.md  | ✅   | AI 任务提示词（工具适配产物） |
| 06-tdd-log.md       | ✅   | TDD 流程证据 + 缺陷修复       |
| 07-prompt-log.md    | ✅   | Prompt 工程与纠偏             |
| 08-ai-decisions.md  | ✅   | 决策可追溯性                  |
| 09-test-matrix.md   | ✅   | 四维测试覆盖                  |
| 10-test-report.md   | ✅   | 测试运行报告                  |
| 11-review.md        | ✅   | 代码审查 + 交叉 Review        |
| 12-asset-update.md  | ✅   | AI 协作资产沉淀               |
| 13-retrospective.md | ✅   | 个人复盘与改进 + 新规则沉淀   |
| task-rules.md       | ✅   | 任务级规则（三层体系）        |
| 14-team.md          | ✅   | 团队分工 + 一致性 + 贡献      |
| 15-brief.md         | ✅   | 答辩准备                      |
| AI 规范已更新       | ✅   | 分层清晰 + 内容完整 + 可维护  |
| CHANGELOG.md 已更新 | ✅   | 变更可追溯                    |
| docs/review-checklist.md | ✅ | Review 标准沉淀              |
| docs/delivery-checklist.md | ✅ | 交付标准沉淀               |
