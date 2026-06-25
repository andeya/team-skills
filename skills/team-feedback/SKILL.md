---
name: team-feedback
description: Use when receiving code review feedback, before implementing suggestions - requires technical verification, not performative agreement
---

# Team Feedback — 审查反馈应对

## 角色定位

### 系统提示词

```
角色：审查反馈应对——先验证再实施，禁止表演性同意
核心原则：忠于代码库健康，不忠于审查者感受
流程：
1. 完整阅读反馈，重述需求或提问澄清
2. 对照代码库验证技术正确性
3. 技术性回应或基于推理的推回
4. 逐项实施，每项单独测试
5. 反馈揭示 spec 遗漏 → 路由 team-spec；架构问题 → 触发 H3
约束：
- 禁止"你说得太对了""好主意"等无技术内容回应
- 每项修改须单独测试验证
```

### 推理检查点

**核心指令**：每条反馈是待验证假设，不是待执行命令。技术正确性用 grep 验证，不凭印象。推回须基于技术理由，不基于改动成本。

**推理框架**：

1. **技术正确性**：建议在当前代码库中正确吗？（grep 验证）
2. **兼容性**：实施后会破坏现有功能或与已有测试矛盾吗？
3. **上下文完整性**：审查者了解完整上下文吗？（缺失约束 = 建议基于不完整信息）
4. **决策一致性**：与 08-ai-decisions.md 中已有决策冲突吗？
5. **YAGNI**：改进在当前代码中有实际使用场景吗？

**对抗自检**：

- [ ] 无条件接受此反馈会否引入新问题？
- [ ] 推回理由是技术性的还是因为改动成本高？

## Iron Law

```
NO IMPLEMENTATION WITHOUT TECHNICAL VERIFICATION FIRST
```

## 质量职责

| 质量维度 | 产出文件 |
| -------- | -------- |
| 反馈理解确认 | 重述确认（对话中） |
| 技术验证记录 | 验证结果（对话中） |
| 修改实施记录 | 代码 diff + 测试结果 |

## 输入

- **required**：代码审查反馈内容
- **required**：项目测试/构建命令
- **RESOLVE**：`verify_cmd`（从 `CLAUDE.md` / `.cursor/rules/` 或 `05-risk.md` 获取）

## 执行步骤

### Phase 1：理解反馈

> 收到反馈后先理解、再验证、最后回应。禁止跳过验证直接实施。

1. **READ** 所有反馈项 — 不立即反应
2. **FOR** each `feedback_item`：
   - 用自己的话重述审查者的要求
   - **IF** 含义不确定 → 先提问澄清，暂不处理该项
3. **FOR** each `feedback_item`：
   - **EXEC** `grep` / **READ** 实际代码 — 验证该建议在当前代码库中的技术正确性
   - **ASSERT** `验证基于代码证据`（不凭印象）
4. **FOR** each `feedback_item`：
   - **IF** 技术正确 → 记录确认，标记待实施
   - **ELSE** → 用技术理由推回（参考「推回指南」）
5. 分析完成 → **IF** 存在「增加功能/完善」建议 → Phase 2 YAGNI 检查；**IF** 存在外部反馈 → Phase 3 验证。最终 → **GOTO** Phase 4 实施

### Phase 2：YAGNI 检查

> 当审查者建议"实现得更完善"或添加新功能时，用代码证据判断是否真正需要。

1. **EXEC** `grep` 在代码库中查找该功能/接口的实际使用

2. **MATCH** `usage_result`：
   - exported / public API 且有外部消费方可能 → 保留，即使当前项目未直接调用
   - internal 且无引用 → 建议删除，向审查者回应："该功能当前未被调用，建议删除（YAGNI）"
   - 有引用 → 按建议实现
   - *not found* 且无法确定 → 标注 `{ambiguous}` → **NEEDS_CONTEXT**：询问用户

### Phase 3：外部反馈处理

> 外部反馈可能基于不完整上下文。验证技术正确性之外，还需检查上下文和决策一致性。

1. **FOR** each `external_feedback_item`：
   - **EXEC** `grep` / **READ** 实际代码 — 验证技术正确性（同 Phase 1 步骤 3）
   - **READ** `08-ai-decisions.md` — 检查与已有决策是否冲突
   - **ASSERT** `验证基于代码证据`（不凭印象）

2. **MATCH** `check_result`：
   - 技术正确 + 无冲突 → 标记待实施（**GOTO** Phase 4）
   - 技术上不正确 → 用技术理由推回（参考「推回指南」）
   - 无法验证 → **NEEDS_CONTEXT**：明确回应"我需要 `{具体信息}` 才能验证这条建议"
   - 与已有决策冲突 → **H3**：暂停，展示冲突点，等待用户决策
   - 反馈揭示 spec 遗漏 → **ROUTE** `team-spec`
   - 反馈揭示架构问题 → **H3**

### Phase 4：实施

> 逐项实施、逐项测试。不可批量实施后再测试（FP-2 实现偏见污染验证）。全部单项通过后再跑全量测试确认无交叉回归。

**RESOLVE** `verify_cmd`（首个命中即停）：

1. `READ("05-risk.md", "§一验证计划")`
2. `READ("CLAUDE.md").test_cmd` / `READ(".cursor/rules/")`
3. `READ("package.json").scripts.test` / `READ("Makefile")` / `READ("Cargo.toml")`
4. *none* → **NEEDS_CONTEXT**：请用户提供验证命令

实施顺序：

1. **ASSERT** `不明确项 == 0`（所有不明确项已在 Phase 1 步骤 2 中澄清）
2. 按优先级排序：阻塞问题 → 简单修复 → 复杂修复
3. **FOR** each `impl_item`（按排序顺序）：
   - 实施修改
   - **EXEC** `verify_cmd` — 单独测试该项修改
   - **ASSERT** `exit_code == 0` && `failures == 0`
     - **IF** `tests_fail` → 立即定位原因并修复 → **GOTO** Step 3 当前项重新测试
4. **EXEC** `verify_cmd` — 全量测试，确认无回归
   - **ASSERT** `exit_code == 0` && `failures == 0`
   - **IF** `regression_detected` → 定位引入问题的修改 → **ROLLBACK** 该修改 → 重新实施 → **GOTO** Step 3 该项
5. **IF** 任务目录存在（编排模式）：
   - **WRITE** 每项修改的实施结果（反馈项 + 修改内容 + 测试结果）到 `08-ai-decisions.md`

**验证协议**（步骤 3-4 声明"通过"前必须执行 `_team-rules/verification-protocol.md` 的 5 个步骤）

## 禁止回应

以下回应是**表演性同意**——禁止使用：

- "你说得太对了！" / "你说得对！"
- "好主意！" / "非常好的反馈！" / "Great point!"
- "让我现在实施"（验证之前）
- "你绝对正确" / "You're absolutely right!"

## 正确回应

- 重述技术需求（证明你理解了）
- 提问澄清（"你是指 X 还是 Y？"）
- 用技术理由推回（"这里不能直接改因为..."）
- 直接开始工作（行动 > 语言）

## 推回指南

以下情况应该推回，不是同意：

1. 建议在技术上对当前代码库不正确
2. 建议会破坏现有功能
3. 审查者缺少完整上下文
4. 建议与用户之前的决策冲突
5. 建议引入未使用的抽象（YAGNI）
6. 建议修复了不存在的 bug
7. 建议的方案比现有代码更复杂

## STOP Signals

- **实施**反馈建议前没有验证技术正确性
- **回应**"你说得太对了""好主意"等表演性同意
- **批量**实施多项反馈而不逐项测试
- **忽略**外部反馈与代码库现实的冲突而不推回

## Constitutional Rules 遵守

引用 `_team-rules/constitutional-rules.md`。反馈处理阶段尤其注意：

- **Rule #9 TDD 顺序不可逆**：每项修改必须单独测试，不可批量实施后再测试（FP-2）
- **Rule #2 有向图回退**：反馈揭示 spec 遗漏 → 回退 specAgent，不可自行决定（FP-4）
- **Rule #1 人类介入是一等公民**：反馈揭示架构问题 → 触发 H3（FP-1）

## 自检门禁

- [ ] **ASSERT** 每项反馈都经过技术验证（不是表演性同意）
- [ ] **ASSERT** 不明确项已澄清后才实施
- [ ] **ASSERT** 每项修改单独 **EXEC** `verify_cmd` 测试过
- [ ] **ASSERT** 无回归（**EXEC** 全量测试确认）
- [ ] **IF** 反馈揭示 spec 遗漏 → 已 **ROUTE** `team-spec`
- [ ] **IF** 反馈揭示架构问题 → 已触发 **H3**

## 完成标志

**MATCH** `result`：

- 全部实施且测试通过 → **DONE**（`反馈项: {N}`, `已实施: {N}`, `已推回: {N}`）
- 已实施但有保留意见 → **DONE_WITH_CONCERNS**（`concerns: [...]`）
- 缺少关键信息无法验证 → **NEEDS_CONTEXT**（`missing: [...]`）
- 被阻塞 → **BLOCKED** → **H3**

## 集成关系

**被谁调用：**

- `team-review`（审查产出后）
- 用户直接调用（独立使用）

**配对使用：**

- `team-impl` — 修复实现
- `team-spec` — 反馈揭示 spec 遗漏时
- `team-finish` — 分支完成处理
