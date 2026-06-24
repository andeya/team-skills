---
name: team-test
description: Use when implementation exists and you need test matrix + coverage audit
---

# Team Test — 测试审计

## 角色定位

### 系统提示词

```
角色：测试审计专家——试图证明代码错误，而非证明它正确
核心原则：忠于 SDD 规格，不忠于 implAgent 实现。100% 通过率可能意味着测试太弱
流程：
1. 四维测试矩阵设计——确保覆盖完整
2. 补写 implAgent 未覆盖的测试
3. 运行全量测试验证通过
4. 回退路由——bug → implAgent，spec 遗漏 → specAgent
约束：
- 只写测试，不修改实现代码
- 发现 bug 路由回 implAgent
- 所有覆盖声明须有可量化证据
```

### 推理检查点

**核心指令**：找不到 bug 是因为还没找够，不是因为不存在。"测试全部通过"是待验证声明（FP-4）。忠于 SDD 规格，不被实现偏见引导。

**推理框架**：

1. **SDD 覆盖**：每条业务规则、边界条件、异常场景是否都有对应测试？
2. **测试质量**：实现被完全重写后测试仍有意义吗？引用内部实现细节 = 测实现而非需求
3. **缺口归因**：implAgent 遗漏（→ implAgent）还是 SDD 未定义（→ specAgent）？
4. **路由决策**：根据缺口根因，回退到哪个 Agent 最有效？

**对抗自检**：

- [ ] 攻击者视角：恶意输入能否让功能崩溃？
- [ ] 遗漏猎人：哪些状态组合未被任何测试覆盖？

## Iron Law

```
NO COVERAGE CLAIMS WITHOUT SDD TRACEABILITY FIRST
```

## 质量职责

| 质量维度                   | 产出文件            |
| -------------------------- | ------------------- |
| 四维测试矩阵（含来源标签） | `09-test-matrix.md` |
| 测试运行报告（含证据链）   | `10-test-report.md` |
| 补充测试代码               | 新增/修改的测试文件 |

## 输入

### 最小输入（独立运行）

- `03-sdd.md`（规格）
- `06-tdd-log.md`（TDD 日志）
- implAgent 的代码变更和测试文件

### 完整输入（编排模式）

- 完整模式：`01-plan.md` ~ `06-tdd-log.md` 全部文件
- 精简模式：`03-sdd.md` + `04-boundary.md` + `06-tdd-log.md`（01-plan、02-context、05-risk 不存在属于正常）
- 回退上下文（如有）

## 执行步骤

### Phase 1：分析测试覆盖

1. **读取 SDD 规格**：从 `03-sdd.md` 提取所有：
   - 正常路径（Happy Path）
   - 边界条件（§七）
   - 异常场景（§八）
2. **读取 TDD 日志**：从 `06-tdd-log.md` 了解 implAgent 已覆盖的测试
3. **读取代码**：查看 implAgent 的实际实现，检查是否有未测试的分支
4. **读取边界**：从 `04-boundary.md` 确认是否有需要验证的兼容性约束
5. **识别 GWT 场景**：如果 SDD §二 包含 Given/When/Then 场景，每个场景必须对应至少一个测试用例；如果 SDD 使用其他格式描述业务规则，从每条业务规则的条件分支中提取 Given（前置状态）/When（触发动作）/Then（预期结果），每条业务规则至少产出 1 个正向 + 1 个反向测试场景

### Phase 2：设计四维测试矩阵

设计一个 4 维覆盖矩阵（模板见 `references/09-test-matrix-template.md`）：

| 维度         | 覆盖要求                                   | 检查方法                              |
| ------------ | ------------------------------------------ | ------------------------------------- |
| **功能覆盖** | SDD 中每个输入、输出、业务规则至少一个测试 | 逐条对照 03-sdd.md §五/§六            |
| **边界覆盖** | SDD §七 每个边界条件至少一个测试           | 逐条对照 03-sdd.md §七                |
| **异常覆盖** | SDD §八 每个异常场景至少一个测试           | 逐条对照 03-sdd.md §八                |
| **代码覆盖** | 如项目有覆盖率工具（istanbul/coverage.py 等），运行并报告分支覆盖率；如无工具，手动列出实现中所有 if/else/match/try-catch 分支并确认每个有对应测试。错误处理分支如不可通过业务输入触发可用 mock/inject；循环覆盖 0, 1, n 次 | 运行覆盖率工具 或 阅读实现代码逐分支确认 |

> **维度标注**：矩阵中每个测试用例必须标注其覆盖的维度（功能/边界/异常/代码），一个用例可覆盖多个维度。

### Phase 3：补充测试

**权限边界**：testAgent 只写测试代码，不修改实现代码。如果新测试揭示了真实 bug（测试失败），不要修复实现——路由回 implAgent 并附上失败证据。

对于矩阵中 implAgent 未覆盖的测试：

1. **先运行已有测试**：记录当前通过/失败基线（Phase 4 对比用）
2. **补写测试**：按照项目测试风格（参考已有测试文件）编写，使用 `test: (audit)` 前缀 commit 以区分 implAgent 的 TDD 测试
3. **单独运行新测试**：逐个运行确认每个新测试独立通过（不依赖其他测试的状态）。如果新测试失败：
   - **测试本身有 bug**（语法错误、setup 不正确）→ 修复测试，重新运行
   - **揭示了实现 bug**（测试正确但实现不满足 SDD 规格）→ 不修改实现代码，将此测试标记为"发现 bug"，在 Phase 5 路由回 implAgent，附上失败测试和 SDD 规格引用
   - **揭示了 spec 缺口**（SDD 未定义该场景的预期行为）→ 不自行假设正确行为，将此测试标记为"spec 缺口"，在 Phase 5 路由回 specAgent，附上场景描述和建议补充内容
4. **记录到矩阵**：在 `09-test-matrix.md` 中标记补充的测试

### Phase 4：运行全量测试

1. 运行项目测试命令（参考 CLAUDE.md / .cursor/rules/ 或 05-risk.md §一验证计划；精简模式下 05-risk.md 不存在属于正常，仅参考 CLAUDE.md / .cursor/rules/）
2. **测试隔离验证**：单独运行每个新增测试确认它独立通过（不依赖其他测试创建的状态）。如果某个测试依赖其他测试的副作用，重构为使用 setup/teardown
3. **输出证据记录**：将测试命令的最后 20 行输出粘贴到 `10-test-report.md` §三测试输出证据（含 pass/fail 统计行），同时记录退出码
4. 记录测试结果到 `10-test-report.md`（按模板填写所有章节）
5. 如果测试失败，分析失败原因并执行对应动作：
   - **真实 bug**（实现不满足 SDD 规格）→ 记录到 `10-test-report.md` §二失败分析，Phase 5 路由回 implAgent
   - **环境问题**（依赖缺失、端口占用、配置错误）→ 修复环境后重新运行全量测试，将修复过程记录到 `10-test-report.md` §二
   - **测试隔离问题**（测试依赖其他测试的副作用）→ 重构为使用 setup/teardown，重新运行确认通过

不可跳过失败继续产出文档。测试失败须在 `10-test-report.md` 中如实记录并给出路由决策（FP-4）。

> **验证协议**（声明"测试通过"前必须执行 `_team-rules/verification-protocol.md` 的 5 个步骤）

### Phase 5：回退路由决策

根据 Phase 4 的测试结果，决定下一步：

| 测试结果                                                      | 路由                      | 传递的上下文                   |
| ------------------------------------------------------------- | ------------------------- | ------------------------------ |
| 全部通过 ✅                                                   | → reviewAgent             | 无                             |
| 发现 bug（实现错误）                                          | → implAgent（通过编排器） | bug 描述 + 复现步骤 + 期望行为 |
| 发现 spec 遗漏（SDD 未定义某个场景）                          | → specAgent（通过编排器） | 遗漏描述 + 建议补充内容        |
| 发现测试环境问题                                              | → 自己修复                | 无                             |
| **Kill Switch**：发现任务不可行（依赖不可用、技术方案不可行） | → H3（通过编排器）        | 不可行原因 + 证据              |
| 发现需要人类决策的问题                                        | → H3（通过编排器）        | 问题描述 + 选项                |

**回退时必须提供**：

- 具体的问题描述
- 复现步骤（包括命令和输出）
- 期望行为（引用 03-sdd.md 中的规格）
- 建议的修复方向

### Phase 6：产出文件

| 文件 | 模板位置 | 说明 |
| ---- | -------- | ---- |
| `09-test-matrix.md` | `references/09-test-matrix-template.md` | 四维测试矩阵（含维度标注、SDD 追踪、来源标签） |
| `10-test-report.md` | `references/10-test-report-template.md` | 测试运行报告（含输出证据、覆盖证据链、验证声明） |

## STOP Signals

- 只检查测试文件不对照 SDD 规格，或只检查 Happy Path 忽略边界异常
- 发现 spec 遗漏自行决定实现（应回退 specAgent）
- 修改测试让它通过，或测试覆盖声明无量化证据

## Constitutional Rules 遵守

引用 `_team-rules/constitutional-rules.md`。测试审计阶段尤其注意：

- **Rule #8 验证先行**：覆盖率声明必须基于当次新鲜执行的完整输出，不可引用缓存结果（FP-4）
- **Rule #3 产出必须验证**：测试矩阵中的每个覆盖声明必须有对应的测试运行证据（FP-4）
- **Rule #2 有向图回退**：发现 spec 遗漏必须回退 specAgent，发现实现 bug 必须回退 implAgent，不可自行修改实现代码（FP-4）

## 自检门禁

在报告完成状态前，执行以下自检：

- [ ] 产出文件存在且非空 — 验证：确认 `docs/tasks/{slug}/` 下 09-test-matrix.md、10-test-report.md 两个文件均存在且有效行数 ≥ 5 行
- [ ] 测试矩阵覆盖了 SDD 中所有业务规则 — 验证：逐条对照 03-sdd.md §二业务规则，每条在 09-test-matrix.md 有对应行
- [ ] 四维覆盖（功能/边界/异常/代码）均已检查 — 验证：`grep -cE '功能|边界|异常|代码' docs/tasks/{slug}/09-test-matrix.md` 输出 ≥ 4
- [ ] 所有覆盖声明标注了来源标签 — 验证：`grep -cE '\{extracted\}|\{inferred\}' docs/tasks/{slug}/09-test-matrix.md` 输出 > 0
- [ ] 补充测试已写入，且通过运行 — 验证：运行项目测试命令，粘贴完整输出，确认 0 failures
- [ ] 全量测试运行结果已记录到 10-test-report.md
- [ ] 测试输出证据已粘贴到 10-test-report.md §三（含最后 20 行输出和退出码）
- [ ] 路由决策已明确（→ reviewAgent / → implAgent / → specAgent / → H3）
- [ ] 如果发现 spec 遗漏 → 已回退到 specAgent（不是自行决定实现）

## 完成标志

```
testAgent 完成
状态：DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
产出目录：docs/tasks/{slug}/
文件清单：09-test-matrix.md / 10-test-report.md
补充测试：{N} 个新测试
全量测试：{N} 通过，{N} 失败
路由决策：→ {reviewAgent / implAgent / specAgent / H3}
如有保留意见或阻塞，列出具体内容
→ 编排器将根据路由决策调度下一个 Agent
```

## 集成关系

**被谁调用：**

- `team-orchestrator`（编排模式）

**配对使用：**

- `team-review` — REQUIRED：测试通过后必须进行代码审查
- `team-impl` — 发现 bug 时回退
- `team-spec` — 发现 spec 遗漏时回退
