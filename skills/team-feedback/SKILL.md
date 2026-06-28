---
name: team-feedback
description: Use when receiving code review feedback, before implementing suggestions - requires technical verification, not performative agreement
---

# Team Feedback — 审查反馈应对

**CRITICAL: DO NOT use EnterPlanMode.** This skill defines its own structured workflow. Follow STEPS below directly.

## ROLE

### 系统提示词

```
角色：审查反馈应对——先验证再实施，禁止表演性同意
核心原则：忠于代码库健康，不忠于审查者感受
流程：
1. 完整阅读反馈，重述需求或提问澄清
2. 对照代码库验证技术正确性
3. 技术性回应或基于推理的推回
4. 逐项实施，每项单独测试
5. 反馈揭示 spec 遗漏 → 路由 team-spec；架构问题 → 触发 ASK_HUMAN
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

## IRON_LAW

```
NO IMPLEMENTATION WITHOUT TECHNICAL VERIFICATION FIRST
```

## QUALITY

| 质量维度 | 产出文件 |
| -------- | -------- |
| 反馈理解确认 | 重述确认（对话中） |
| 技术验证记录 | 验证结果（对话中） |
| 修改实施记录 | 代码 diff + 测试结果 |

## INPUT

- **required**：代码审查反馈内容
- **required**：项目测试/构建命令
- **RESOLVE**：`verify_cmd`（从 `CLAUDE.md` / `.cursor/rules/` 或 `05-risk.md` 获取）

## STEPS

### Phase 1：理解反馈

> 将每条反馈视为待验证假设——理解它、验证它、再决定接受或推回。跳过验证的"立即实施"是最常见的失败模式。

> TRAP：你会倾向于无条件接受反馈（people-pleasing），尤其当反馈来自资深审查者时。
> 技术正确性不因发出者的权威而改变——用 grep 验证，不凭印象或地位。

> TRAP：反过来，你也可能因为"我的代码是对的"而拒绝反馈。
> 拒绝必须基于代码证据，不基于自信程度。

1. **READ** 所有反馈项 — 不立即反应
2. **FOR** `feedback_item`：
   - 用自己的话重述审查者的要求
   - **IF** 含义不确定 → 先提问澄清，暂不处理该项
3. **FOR** `feedback_item`：
   - **EXEC** `grep` / **READ** 实际代码 — 验证该建议在当前代码库中的技术正确性
   - **IF** `exit_code != 0` && `output 为空` → 标记该项为未找到，记录无法验证
   - **ASSERT** `evidence_source != 印象`（验证基于代码证据，不凭印象）
4. **FOR** `feedback_item`：
   - **IF** 技术正确 → 记录确认，标记待实施
   - **ELSE** → 用技术理由推回（参考「推回指南」）
5. **IF** 存在「增加功能/完善」建议 → **GOTO** Phase 2
6. **IF** 存在外部反馈 → **GOTO** Phase 3
7. **GOTO** Phase 4

### Phase 2：YAGNI 检查

> 审查者建议"更完善"时，用代码证据判断是否真正需要。"将来可能有用"不是充分理由——当前有调用方才是。

1. **EXEC** `grep` 在代码库中查找该功能/接口的实际使用
   - **IF** `exit_code != 0` && `output 为空` → `usage_result` = 未找到

2. **MATCH** `usage_result`：
   - exported / public API 且有外部消费方可能 → 保留，即使当前项目未直接调用
   - internal 且无引用 → 建议删除，向审查者回应："该功能当前未被调用，建议删除（YAGNI）"
   - 有引用 → 按建议实现
   - *NOT_FOUND* 且无法确定 → 标注 `{ambiguous}` → **NEEDS_CONTEXT**：询问用户
   - *DEFAULT* → 标记待实施，在 Phase 4 中额外注意验证

### Phase 3：外部反馈处理

> 外部反馈可能基于不完整上下文。验证技术正确性之外，还需检查上下文完整性和决策一致性——反馈者看到的和你看到的可能不是同一份代码。

> SIGNAL：同一反馈被多个审查者重复提出 → 大概率是系统性问题，不是巧合。优先处理。

> SIGNAL：反馈与 SDD 矛盾 → 可能是 SDD 需要更新，不只是代码需要修改。先确认哪个是正确的。

> SIGNAL：反馈措辞模糊（如"提升性能""改善可读性"）→ 需要具体指标或示例才能行动。直接要求澄清。

1. **FOR** `external_feedback_item`：
   - **EXEC** `grep` / **READ** 实际代码 — 验证技术正确性（同 Phase 1 步骤 3）
   - **IF** `exit_code != 0` && `output 为空` → 标记该项为未找到
   - **READ** `08-ai-decisions.md` — 检查与已有决策是否冲突
   - **ASSERT** `evidence_source != 印象`（验证基于代码证据，不凭印象）

2. **MATCH** `check_result`：
   - 技术正确 + 无冲突 → 标记待实施（**GOTO** Phase 4）
   - 技术上不正确 → 用技术理由推回（参考「推回指南」）
   - 无法验证 → **NEEDS_CONTEXT**：明确回应"我需要 `{具体信息}` 才能验证这条建议"
   - 与已有决策冲突 → **ASK_HUMAN**：暂停，展示冲突点，等待用户决策
   - 反馈揭示 spec 遗漏 → 向编排器报告：建议路由到 `team-spec`
   - 反馈揭示架构问题 → **ASK_HUMAN**
   - *DEFAULT* → 记录情况 → **NEEDS_CONTEXT**

### Phase 4：实施

> 逐项实施、逐项测试。批量实施后再测试 = 出问题时无法定位是哪项修改引入的 `_team-rules/first-principles.md: First Principle #2`。全部单项通过后再跑全量测试确认无交叉回归。

> TRAP：你会倾向于修改实现去匹配反馈，而不检查反馈是否与 SDD 一致。
> 实施前先确认：这项修改是让代码更接近 SDD，还是偏离 SDD？偏离 → 先路由 team-spec。

**RESOLVE** `verify_cmd`（首个命中即停）：

1. `READ("05-risk.md", "§一验证计划")`（精简模式下不存在属于正常）
2. `READ("CLAUDE.md").verify_cmd` / `READ(".cursor/rules/")`
3. `READ("package.json").scripts.test` / `READ("Makefile")` / `READ("Cargo.toml")` / `READ("CI 配置")`
4. 手动验证可行（截图 / curl / 日志对比）→ 标注验证方式，继续
5. *NONE* → **NEEDS_CONTEXT**：请用户提供验证命令

实施顺序：

1. **ASSERT** `不明确项 == 0`（所有不明确项已在 Phase 1 步骤 2 中澄清）
   - `不明确项 > 0` → **GOTO** Phase 1（从步骤 2 澄清后重试）
2. **ASSERT** `Phase 3 触发的 ASK_HUMAN 均已获得用户回复`（决策冲突/架构问题需人类裁决后才可实施）
   - `ASK_HUMAN 未回复` → **BLOCKED**，等待用户决策
3. 按优先级排序：阻塞问题 → 简单修复 → 复杂修复
4. **FOR** `impl_item`（按排序顺序）：
   - 实施修改
   - **EXEC** `verify_cmd` — 单独测试该项修改
   - **ASSERT** `exit_code == 0` && `failures == 0`
     - `exit_code != 0` → 立即定位原因并修复 → 重新测试当前项
5. **EXEC** `verify_cmd` — 全量测试，确认无回归
   - **ASSERT** `exit_code == 0` && `failures == 0`
     - `exit_code != 0` → 定位引入问题的修改 → 撤销该修改 → 重新实施 → 重新测试该项
6. **IF** 任务目录存在（编排模式）→ **WRITE** `08-ai-decisions.md` 每项修改的实施结果：

   | 反馈项 | 来源 | 决策 | 技术验证 | 修改内容 | 测试结果 |
   |--------|------|------|----------|----------|----------|
   | {feedback_desc} | {reviewer} | 接受 / 推回 / 部分接受 | {evidence} | {change_desc} | ✅/❌ `{test_output}` |

**验证协议**：步骤 3-4 声明"通过"前必须执行 `_team-rules/verification-protocol.md: 验证执行步骤`

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

## 反馈分流校准

> GOOD：审查者建议"这里应该用 Map 替代 Object"。
> `grep -n "new Map\|Map<" src/ → 项目中已有 Map 使用模式。该场景 key 为动态字符串且需频繁删除。技术正确，标记待实施。`

> GOOD：审查者建议"应该加个缓存层"。
> `grep -rn "cache\|memoize" src/ → 无现有缓存模式。检查 SDD §二 → 未提及缓存需求。推回："当前无性能瓶颈证据，建议作为后续优化项。"`

> BAD：审查者建议"这里应该用 Map 替代 Object"。
> `"好主意！让我现在改。" → 未验证 Map 在当前场景是否合适就直接实施。`

> BAD：审查者建议"应该加个缓存层"。
> `"不需要。" → 无技术理由的拒绝，未检查代码也未解释原因。`

> GOOD：审查者说"这段代码可读性差"。
> `要求具体指出哪些行、期望什么风格 → 模糊反馈需要具体化才能行动。`

> BAD：审查者说"这段代码可读性差"。
> `立即重写整段代码 → 在不确定具体问题时过度反应，可能引入新问题。`

## STOP_SIGNALS

- **实施**反馈建议前没有验证技术正确性
- **回应**"你说得太对了""好主意"等表演性同意
- **跳过**逐项测试而批量实施多项反馈
- **忽略**外部反馈与代码库现实的冲突而不推回

## CONSTITUTIONAL_RULES

**REF** `_team-rules/constitutional-rules.md` — 10 条 Constitutional Rules
**REF** `_team-rules/first-principles.md` — 4 条第一性原理（First Principle #1 ~ #4）
**REF** `_team-rules/spec-driven-workflow.md` — TDD 逐项验证与有向图回退规则
**REF** `_team-rules/verification-protocol.md` — verify_cmd 解析流程与 5 步验证协议

反馈处理阶段尤其注意：

- **Rule #9 TDD 顺序不可逆**：每项修改必须单独测试，不可批量实施后再测试 `_team-rules/first-principles.md: First Principle #2`
- **Rule #2 有向图回退**：反馈揭示 spec 遗漏 → 回退 `team-spec`，不可擅自决定 `_team-rules/first-principles.md: First Principle #4`
- **Rule #1 人类介入是一等公民**：反馈揭示架构问题 → 触发 `ASK_HUMAN` `_team-rules/first-principles.md: First Principle #1`

## SELF_CHECK

**GATE** 产出前自检（全部通过才放行）：

- [ ] **ASSERT** `每项反馈.技术验证 == true`
- [ ] **ASSERT** `不明确项 == 0`
- [ ] **ASSERT** `每项修改.单独测试 == passed`
- [ ] **ASSERT** `全量测试.exit_code == 0`
- [ ] **ASSERT** `无占位符残留（{N}、{slug} 等已被实际值替换）`
- [ ] **ASSERT** `IRON_LAW 遵守` — 每项修改单独测试，未批量实施
- [ ] **IF** 反馈揭示 spec 遗漏 → 已向编排器报告路由到 `team-spec`
- [ ] **IF** 反馈揭示架构问题 → 已触发 **ASK_HUMAN**
- [ ] 我是否因为反馈来自权威人士就未经验证地接受了？
- [ ] 我拒绝的反馈真的不合理，还是我在为自己的实现辩护？
- [ ] 我是否把风格偏好类反馈当成了 P0 优先处理，而忽略了实质性 bug？

## COMPLETION

**REF** `_team-rules/four-state-protocol.md` — 四态完成状态

**WRITE**（对话中）反馈处理摘要：

```
## 反馈处理结果
- 总反馈项：{N}
- 已实施：{N}（含技术验证通过）
- 已推回：{N}（含技术理由）
- 路由 team-spec：{N}（spec 遗漏）
- 全量测试：{pass/fail}
```

**MATCH** `result`：

- 全部实施且测试通过 → **DONE**（`反馈项: {N}`, `已实施: {N}`, `已推回: {N}`）
- 已实施但有保留意见 → **DONE_WITH_CONCERNS**（`concerns: [...]`）
- 缺少关键信息无法验证 → **NEEDS_CONTEXT**（`missing: [...]`）
- 被阻塞 → **BLOCKED** → **ASK_HUMAN**
- *DEFAULT* → **NEEDS_CONTEXT**

## INTEGRATION

**被谁调用：**

- `team-review`（审查产出后）
- 用户直接调用（独立使用）

**配对使用：**

- `team-impl` — 修复实现
- `team-spec` — 反馈揭示 spec 遗漏时
- `team-finish` — 分支完成处理

## NEXT

- 反馈含实现修复项 → 使用 `team-impl` 按反馈修复
- 反馈揭示 spec 遗漏 → 使用 `team-spec` 补全规格
- 反馈全部处理完毕 → 使用 `team-finish` 完成分支
