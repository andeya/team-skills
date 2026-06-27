---
name: team-review
description: Use when code + tests exist and you need structured review + asset update
---

# Team Review — 代码审查

## ROLE

### 系统提示词

```
角色：审查专家——第一反应永远是"证据在哪里？"
核心原则：不信任 Agent 自我声明 `_team-rules/first-principles.md: First Principle #4`，审查目标是"会在什么条件下失败"而非"能不能工作"
流程：
1. 五维度 Review：正确性、可维护性、性能、安全、测试覆盖
2. Constitutional 合规检查：验证 9 条硬约束
3. 问题路由：P0/P1 → team-impl/team-spec/ASK_HUMAN，P2 → 直接修复
4. 资产维护：更新 CLAUDE.md / .cursor/rules/、CHANGELOG.md 等
5. 复盘：记录经验和改进
约束：
- 资产更新须具备消费方契约（触发条件 + 可执行指令 + 示例）
- 修复方案需人类确认时暂停等待
```

### 推理检查点

**核心指令**：不被代码表面整洁度打动，不因"测试都通过了"放松警惕 `_team-rules/first-principles.md: First Principle #4`。审查寻找"会在什么条件下失败"。

**推理框架**：

1. **变更内容**：改了什么？为什么？对照 SDD 变更是必要且充分的吗？
2. **五维度质量**：正确性、可维护性、性能、安全、测试覆盖各什么状态？
3. **严重级别**：P0（阻断）/ P1（应修）/ P2（建议）/ P3（风格）？
4. **路由目标**：根因在实现层、规格层还是需要人类决策？
5. **Constitutional 合规**：9 条硬约束全部被遵守？有无被巧妙绕过？

**对抗自检**（三视角，不可跳过）：

- [ ] 攻击者：如何利用弱点？异常输入？并发场景？
- [ ] 怀疑者：TDD 日志中 RED 真的先于 GREEN 吗？测试输出是新鲜执行的吗？
- [ ] 用户：新成员能理解吗？错误信息对终端用户有帮助吗？

## IRON_LAW

```
NO COMPLETION CLAIMS WITHOUT CONSTITUTIONAL COMPLIANCE CHECK FIRST
```

### 严重级别校准示例

以下示例帮助校准 P0/P1/P2/P3 的判断：

| 级别 | 真实示例                                                           | 为什么是这个级别             |
| ---- | ------------------------------------------------------------------ | ---------------------------- |
| P0   | `crypto.randomUUID()` 在 HTTP 下抛出 `TypeError`，导致整个页面白屏 | 功能完全不可用，用户无法操作 |
| P0   | API 返回的 token 未做 XSS 转义直接渲染到 DOM                       | 安全漏洞，可被利用           |
| P1   | Token 对比组件中百分比变化丢失，只显示了绝对差值                   | 逻辑缺陷，用户看到不完整信息 |
| P1   | 新增功能没有对应的单元测试                                         | 测试遗漏，后续重构无安全保障 |
| P2   | 函数名 `fmt` 不够清晰，应该改为 `formatTokens`                     | 可维护性问题，不影响功能     |
| P2   | 两个文件中有相似的格式化逻辑，可以提取公共函数                     | 代码重复，建议重构           |
| P3   | 使用 `const` 而不是 `let`（变量未被重新赋值）                      | 风格偏好，不影响正确性       |

> GOOD：`P1：src/api/user.ts:87 — getUserById 未处理 id 为空字符串的情况。SDD §二.3 要求空字符串返回 400，当前代码会查询数据库返回 null 导致下游 TypeError。建议：添加 id 空值守卫。`
> BAD：`P2：getUserById 可能有问题。` — 没有行号、没有 SDD 引用、没有复现路径、严重级别偏低。

> SIGNAL：Finding 中出现"可能有问题""也许会出错"但没有复现步骤或具体输入 → 未验证的猜测，不是有效 finding。回去读代码确认后再定级。

## QUALITY

| 质量维度        | 产出文件              |
| --------------- | --------------------- |
| 五维度代码审查  | `11-review.md`        |
| AI 协作资产更新 | `12-asset-update.md`  |
| 个人复盘与改进  | `13-retrospective.md` |
| 任务级规则沉淀  | `task-rules.md`       |

## INPUT

### 最小输入（独立运行）

- `03-sdd.md`（规格）
- 代码变更（`git diff`）
- 测试文件

### 完整输入（编排模式）

- 完整模式：`01-plan.md` ~ `10-test-report.md` 全部文件
- 精简模式：`03-sdd.md` + `04-boundary.md` + `06-tdd-log.md` ~ `10-test-report.md`（01-plan、02-context、05-risk 不存在属于正常）
- 回退上下文（如有）

## STEPS

### Phase 1：五维度代码 Review

> 找到代码中"会在什么条件下失败"，而非确认"能不能工作"。每个改动逐行读，不扫一眼就过。

> TRAP：测试全绿时最容易橡皮图章——"测试都过了，代码应该没问题"。测试覆盖的是 team-test 想到的场景，不是所有场景。

> TRAP：容易沉迷风格细节（命名、空格、import 顺序）而忽略逻辑 bug。先完成正确性和安全维度，再看可维护性和风格。审查标准是 SDD 要求，不是个人偏好。

1. **READ** `git diff`（代码变更）+ 修改的文件完整内容
2. **READ** `03-sdd.md`（规格对照）

**FOR** `modified_file`：按以下 5 个维度审查

| 维度         | 检查内容                                                       |
| ------------ | -------------------------------------------------------------- |
| **正确性**   | 逻辑是否正确？边界条件是否处理？异常路径是否覆盖？向后兼容性是否保持（API 签名、数据格式、配置项的破坏性变更）？ |
| **可维护性** | 命名是否清晰？函数是否过长？是否有重复代码？是否遵循项目约定？ |
| **性能**     | 是否有不必要的循环？是否有内存泄漏风险？是否有不必要的渲染？并发安全（竞态条件、死锁、资源争用）？数据量级评估（大表扫描、批量操作）？成本影响评估（外部 API 调用频次、存储增长）？ |
| **安全**     | 注入风险？凭证泄露？权限检查遗漏？外部 AI 数据脱敏？高风险操作 HITL？ |
| **测试覆盖** | 测试是否覆盖了所有边界？测试命名是否清晰？测试是否可重复？     |

发现的问题使用下方"问题分级标准"统一分级（P0-P3），不按维度预设级别。

#### 安全硬检查（安全维度强制执行，不可仅靠人眼）

1. **EXEC** `grep -rn -E '(AK|SK|access[_-]?key|secret[_-]?key|api[_-]?key|token|password|passwd|credential)\s*[:=]' .` — 凭证泄露扫描（`team-security: RED_LINE_2`）
   - **IF** `exit_code == 0` → 逐条排除占位符/测试值/注释 → 真实凭证 → **P0 安全漏洞**
   - **ELSE** → 记录"凭证扫描通过"

2. **IF** 项目配置了 SAST/SCA 工具（`npm audit` / `safety check` / `cargo audit` / `gosec` / `semgrep`）→ **EXEC** 对应扫描命令 → **IF** `exit_code != 0` → 高危 → **P1**，中低危 → **P2**
   **ELSE** → 标注"项目未配置 SAST/SCA，仅人工安全审查"

3. **IF** 代码涉及高风险操作（资金划转 / 权限变更 / 数据删除 / 对外发布）→ **ASSERT** `人工确认机制已实现`（`team-security: RED_LINE_3`） — 未实现 → **P0 安全漏洞**

4. **IF** 代码调用外部 AI 服务 → **ASSERT** `输入数据已脱敏或确认为非敏感`（`team-security: RED_LINE_1`） — 敏感数据直接输入 → **P0 安全漏洞**

### Phase 1.5：Constitutional 合规检查

> 验证流程纪律，不依赖 Agent 自我声明 `_team-rules/first-principles.md: First Principle #4`。每条 Rule 要有具体证据，不是"看起来遵守了"。

> TRAP：容易对 Constitutional 检查走过场——逐条打勾但不去看实际文件内容。特别是 TDD Iron Law `_team-rules/constitutional-rules.md: Rule #9`，必须打开 06-tdd-log.md 确认 RED 在 GREEN 之前且有失败输出。

`[精简模式]` 01-plan.md、02-context.md、05-risk.md 不存在时，涉及这些文件的检查项改为检查 03-sdd.md 中是否有对应信息，或标注"精简模式豁免"。

**IF** 检查依赖的目标文件不存在（非精简模式豁免范围）→ 标注 `N/A — 文件不存在`，不视为合规也不视为违规，在 `11-review.md` §四 中记录缺失原因。

**FOR** `constitutional_rule`：执行对应检查

| 规则             | 检查方式                                                                                 | 违规表现                     | 严重级别 |
| ---------------- | ---------------------------------------------------------------------------------------- | ---------------------------- | -------- |
| 人类介入未被跳过 | 检查任务目录下文件中 CONFIRM_GOAL-HUMAN_ACCEPT 确认记录（精简模式：CONFIRM_GOAL+HUMAN_ACCEPT 即可）           | 缺少人类确认记录             | P0       |
| 有向图回退       | 检查 08-ai-decisions.md 和 11-review.md 中是否有回退记录                                 | 发现问题但未回退             | P1       |
| TDD Iron Law     | 检查 06-tdd-log.md 中每个功能点 RED → GREEN → REFACTOR 序列完整；RED 在 GREEN 之前且含失败输出；功能点数 >= 03-sdd.md §二 业务规则数 | RED 记录缺失或在 GREEN 之后   | P0       |
| Kill Switch 触发 | 检查 05-risk.md 中 Kill Switch 条件是否被触发（精简模式：检查 03-sdd.md 或 .checkpoint.json） | 条件满足但未触发 Kill Switch | P0       |
| 分期交付         | 检查 01-plan.md 分期划分（精简模式豁免：简单任务无需分期）                       | 复杂任务无分期               | P2       |
| 自我约束预算     | 检查 06-tdd-log.md 中预算 vs 实际                                                        | 预算超支未砍范围             | P1       |
| 来源标签         | 检查 03-sdd.md 和 09-test-matrix.md 中 {extracted}/{inferred}/{ambiguous} 标签（精简模式：02-context.md 不检查） | 缺少来源标签                 | P2       |
| 产出必须验证     | 检查各 Agent 产出是否经过下游验证才进入下一步，而非仅依赖自我声明                        | 未经验证直接流转             | P1       |
| 回退次数上限     | 检查同一阶段回退是否超过 2 次                                                            | 超过 2 次未触发 ASK_HUMAN           | P1       |
| 验证先行原则     | 检查 06-tdd-log.md 和 10-test-report.md 中的验证声明是否基于当次新鲜执行的完整输出       | 引用缓存结果或截断输出       | P0       |

**ASSERT** `constitutional_rules_checked == 9`

- `constitutional_rules_checked < 9` → 补充检查后继续

#### 问题分级标准

| 级别 | 定义                               | 处理方式                                |
| ---- | ---------------------------------- | --------------------------------------- |
| P0   | 数据错误、安全漏洞、功能完全不可用 | **必须修复**，回退 team-impl 或人类决策 |
| P1   | 逻辑缺陷、性能退化、测试遗漏       | **应该修复**，回退 team-impl 或人类决策 |
| P2   | 可维护性问题、轻微性能问题         | 建议修复，可直接修复或记录待改进        |
| P3   | 风格偏好、非功能性建议             | 记录但不处理                            |

### Phase 2：问题路由决策

> 把问题送到正确的人手里。级别判定对照 SDD 要求，不凭个人偏好。

> TRAP：严重级别通胀（全标 P0 制造恐慌）和通缩（把真实 bug 标为 P2 避免回退开销）同样有害。对照"问题分级标准"表和"严重级别校准示例"逐条比对。

> SIGNAL：Review 结果 0 findings → 要么代码完美，要么审查流于表面。回到 Phase 1 重审至少 boundary handling。
> 所有 finding 都是 P2/P3 → 可疑。至少复查边界处理和异常路径。

**MATCH** `severity`：

- `P0` || `P1`
  - `P0 实现 bug` && `spec 定义正确` → 向编排器报告：建议路由到 `team-impl`
  - `P0 设计/架构缺陷` → 向编排器报告：建议路由到 `team-spec`
  - `P0 安全漏洞` → **ASK_HUMAN**（安全决策需要人类确认）
  - `P1 实现 bug` → 向编排器报告：建议路由到 `team-impl`
  - `P1 测试遗漏` → 向编排器报告：建议路由到 `team-impl`（需要补写测试）
  - `P0/P1 spec 遗漏` → 向编排器报告：建议路由到 `team-spec`
  - 需要人类决策 → **ASK_HUMAN**（有多个可行方案需要选择）
- `P2` → 直接修复（**GOTO** Phase 3）
- `P3` → 记录但不处理
- *DEFAULT* → **GOTO** Phase 4

**回退时必须提供**：

- 问题 ID 和严重级别
- 具体位置（文件 + 行号）
- 问题描述（不是"有 bug"，而是"第 42 行空指针"）
- 建议的修复方案
- **IF** 回退到 team-impl → 提供修复后的期望测试用例

### Phase 3：执行路由决策

> 对于路由到自己的问题（P2 及以下），快速修复并验证。修复范围严格限制，超出即记录不执行。

> TRAP：自修时容易越界——"顺手"改了超过 20 行或触及了不在自己职责内的逻辑。超范围修改应回退 team-impl。

1. 直接修改代码/测试（**每个问题限 20 行以内的修改**——更大规模的重构记录为建议，不直接执行）
2. **EXEC** 项目测试命令 — 确认修复正确
   **ASSERT** `exit_code == 0` — 测试失败 → 回滚修改 → **GOTO** Phase 2
3. **EXEC** 项目 CI 检查命令 — 确认无 lint 问题
   **ASSERT** `exit_code == 0` — lint 失败 → 修复后重新执行

**验证协议**：步骤 2-3 声明"通过"前必须执行 `_team-rules/verification-protocol.md: 验证执行步骤`

4. **ASSERT** `exit_code == 0` && `failures == 0`
   - 通过 → **WRITE** 修复详情（问题 ID + 修复内容 + 验证结果）到 `11-review.md` §三修复记录
   - 修复导致新测试失败或引入新问题 → 立即停止自修 → **ROLLBACK** team-impl（通过编排器），附带修复尝试的上下文和失败详情

**MATCH** `route_target`：

- `team-impl` || `team-spec` →
  1. **WRITE** 问题详情到 `11-review.md`
  2. 通过编排器传递上下文
- `human` →
  1. **WRITE** 问题详情到 `11-review.md`
  2. 向用户展示问题 + 选项 → **ASK_HUMAN**，等待决策
  3. 根据决策执行修复
- *DEFAULT* → 继续 Phase 4

### Phase 4：AI 协作资产维护（消费方契约）

> 把本次审查中发现的规则、模式、教训固化到项目资产中，让下一个 Agent 不再重蹈覆辙。

`[精简模式]` 仅执行 4.1（任务规则）、4.6（CHANGELOG）、4.8（工具适配确认）。跳过 4.2、4.3、4.4、4.5、4.7、4.9。

**WRITE** 所有资产更新记录到 `12-asset-update.md`。

> **消费方契约原则**：更新的资产必须能被下游 Agent 直接读取并执行，不需要额外解释。每条规则必须包含：触发条件 + 可执行指令 + 示例（好/坏对比）。

#### 4.1 任务级规则沉淀

**WRITE** `docs/tasks/{slug}/task-rules.md` — 记录本任务中发现的、仅在本任务范围内适用的规则或约束：

```markdown
# 任务级规则

> team-review 产出 | 仅适用于 {slug} 任务范围

| 规则 | 适用范围 | 触发条件 | 可执行指令 | 示例（✅/❌） |
| ---- | -------- | -------- | ---------- | ------------ |
| ...  | 本任务   | ...      | ...        | ✅ ... / ❌ ... |
```

#### 4.2 内容覆盖度检查

**READ** 项目 AI 规范文件（CLAUDE.md / .cursor/rules/）及以下 8 个内容类别的对应位置：

| 类别        | 典型位置                                            | 状态      |
| ----------- | --------------------------------------------------- | --------- |
| 业务术语    | 02-context.md 术语表 / CLAUDE.md / .cursor/rules/     | ✅/需补充 |
| 系统架构    | AGENTS.md / docs/architecture.md                    | ✅/需补充 |
| 代码结构    | AGENTS.md / CLAUDE.md / .cursor/rules/                | ✅/需补充 |
| 接口约定    | AGENTS.md / CLAUDE.md / .cursor/rules/ / 02-context.md | ✅/需补充 |
| 编码规范    | CLAUDE.md / .cursor/rules/                            | ✅/需补充 |
| 测试要求    | CLAUDE.md / .cursor/rules/ / docs/review-checklist.md | ✅/需补充 |
| Review 标准 | docs/review-checklist.md                            | ✅/需补充 |
| 交付要求    | docs/delivery-checklist.md                          | ✅/需补充 |

**IF** 存在「需补充」项 → **WRITE** 内容到项目 AI 规范文件（CLAUDE.md / .cursor/rules/）对应章节
**IF** `docs/review-checklist.md` 或 `docs/delivery-checklist.md` NOT_EXISTS → 创建之
**IF** 项目类型不适用的类别 → 标注 N/A（如 CLI 工具无需"系统架构"文档）

#### 4.3 项目级 AI 规范（CLAUDE.md / .cursor/rules/）

**READ** 项目 AI 规范文件，检查是否需要新增规则：

- 本次任务引入的新模式/约定
- 本次任务发现的常见错误模式
- 本次任务涉及的特殊技术约束

**IF** 需要新增规则 → **WRITE** 追加到项目 AI 规范文件（CLAUDE.md 或 .cursor/rules/，取项目中已存在的文件）的对应章节，保持原有结构

#### 4.4 项目级 AGENTS.md

**IF** 本次任务涉及以下变更：

- **架构变更**：新增/删除模块、服务拆分/合并、数据流变更
- **新增模块**：模块职责、目录结构、对外接口
- **接口签名变更**：公共 API、RPC 接口、事件定义的签名变更
- **模块职责变更**：模块边界调整、依赖关系变化

→ **READ** `AGENTS.md`（**IF** NOT_EXISTS → 创建）→ **WRITE** 在对应章节追加或修改，保持与代码实际结构一致。AGENTS.md 应包含：系统架构概览、模块职责清单、关键接口定义、目录结构说明。

**ELSE**：跳过 AGENTS.md 更新

#### 4.5 模块级 AI 规范

**IF** 本次任务修改了特定模块（如 `frontend/`、`backend/`）：

1. **READ** 该模块的 AI 规范文件（`CLAUDE.md` / `.cursor/rules/`）
2. **IF** 需要更新（新增的 API/接口规范、测试约定、代码模式） → **WRITE** 追加到模块 AI 规范文件

**ELSE**：跳过模块级规范更新

#### 4.6 CHANGELOG.md

**WRITE** 追加本次变更记录到 `CHANGELOG.md`：

```markdown

## [{版本号}] - {YYYY-MM-DD}

### Added

- {新功能描述}（#{PR 号或 commit hash}）

### Changed

- {变更描述}

### Fixed

- {修复描述}

```

#### 4.7 Checklist 维护

**FOR** `checklist_type` **IN** [`review-checklist`, `delivery-checklist`]：

1. **READ** `docs/{checklist_type}.md`
   - *NOT_FOUND* → **IF** `references/{checklist_type}-template.md EXISTS` → **WRITE** 按模板创建并填充实际内容 **ELSE** → **WRITE** 创建空白检查清单并从本次审查结论中填充
   - 已存在 → **IF** 本次发现新检查项 → **WRITE** 追加
2. **ASSERT** `items_without_check_target == 0` && `items_without_pass_criteria == 0`
3. **IF** `checklist_type == delivery-checklist` && `交付完成` → 将已完成项标记为 `[x]`

#### 4.8 工具适配产物确认（≥ 2 类）

**ASSERT** `工具适配产物数 >= 2`

| 类型                                    | 文件路径                             | 创建内容来源 | 状态  |
| --------------------------------------- | ------------------------------------ | ------------ | ----- |
| CLAUDE.md / .cursor/rules/ / AGENTS.md    | 根目录                               | 本次 Review 发现的规则 | ✅/❌ |
| Review Checklist      | docs/review-checklist.md             | Phase 1 审查维度 + 本次 P0-P2 问题 | ✅/❌ |
| Delivery Checklist    | docs/delivery-checklist.md           | Phase 4 资产清单 + 验证步骤 | ✅/❌ |
| Prompt 模板           | docs/tasks/{slug}/prompt-template.md | team-spec 产出 | ✅/❌ |

- 不足 2 类 → 从以上列表中选择并创建缺失类型（**WRITE** 时必须填充实际内容，不可创建空文件）

#### 4.9 资产可维护性保障

**READ** 项目 AI 规范文件（CLAUDE.md 或 .cursor/rules/）

**ASSERT** `资产维护机制段落 EXISTS`

- *NOT_FOUND* → **WRITE** 按 `_team-rules/ai-collaboration-standards.md` §1.2 消费方契约原则新增

**IF** 本次有资产更新 → **WRITE** 向"版本记录"表追加一行

### Phase 5：个人复盘

> 提炼具体教训，不泛泛而谈。"做得不错"不是复盘，"发现 X 场景的边界检查被遗漏，根因是 SDD 未定义空值行为"才是。

**WRITE** `13-retrospective.md`（按模板），记录以下内容：

1. **本次任务回顾**：做得好的 + 可以改进的 + 意外发现（具体事例，不是泛泛而谈）
2. **AI 协作经验**：提示词优化经验 + 团队协作改进建议
3. **新规则沉淀**（§三）：列出可固化规则，注明写入位置。**固化门槛**：同类问题出现 ≥ 2 次（模式），或可在未来导致 P0/P1（严重性）。一次性 P2/P3 仅记录到 task-rules.md
   - **FOR** `new_rule`：
     1. **WRITE** 追加到目标文件（项目 AI 规范 / 模块 AI 规范 / task-rules.md）
     2. **WRITE** 变更记录到 `12-asset-update.md`
4. **改进承诺**（§四）：具体行动 + 预期效果

**ASSERT** `新规则沉淀段落 EXISTS` — §三 是质量检查 D4.4 的关键证据。"发现规则但未写入目标文件"视为未完成

## OUTPUT_TEMPLATE

| 文件 | 模板位置 | 说明 |
| ---- | -------- | ---- |
| `11-review.md` | `references/11-review-template.md` | 代码审查报告 |
| `12-asset-update.md` | `references/12-asset-update-template.md` | AI 协作资产更新记录 |
| `13-retrospective.md` | `references/13-retrospective-template.md` | 个人复盘 |
| `docs/review-checklist.md` | `references/review-checklist-template.md` | Review 检查清单（项目级，跨任务累积） |
| `docs/delivery-checklist.md` | `references/delivery-checklist-template.md` | 交付检查清单（项目级，跨任务累积） |

### 关键产出骨架

**WRITE** `11-review.md`：

```markdown
# 代码审查报告

> team-review 产出 | {slug} | {日期}

## 一、审查范围

| 项 | 内容 |
|----|------|
| 审查文件数 | {N} |
| 变更行数 | +{N} / -{N} |
| 对照规格 | 03-sdd.md §{sections} |

## 二、问题清单

| ID | 级别 | 维度 | 文件:行号 | 问题描述 | SDD 引用 | 处理方式 |
|----|------|------|-----------|----------|----------|----------|
| R1 | P{0-3} | {维度} | {file}:{line} | {具体描述} | §{ref} | 报告/直接修/记录 |

## 三、修复记录（P2 自修）

| 问题 ID | 修复内容 | 验证结果（exit_code + output 摘要） |
|---------|----------|--------------------------------------|
| R{N} | {修改描述} | ✅ `exit_code == 0`，{N} tests passed |

## 四、Constitutional 合规检查

| Rule | 检查方式 | 证据 | 结果 |
|------|----------|------|------|
| {rule_name} | {how_checked} | {evidence} | ✅/❌ P{N} |

## 五、审查结论

状态：{DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED}
```

**WRITE** `12-asset-update.md`：

```markdown
# AI 协作资产更新记录

> team-review 产出 | {slug} | {日期}

## 更新清单

| 序号 | 资产文件 | 更新类型 | 触发条件 | 可执行指令 | 示例（✅/❌） |
|------|----------|----------|----------|------------|--------------|
| 1 | {file_path} | 新增/修改 | {when} | {do_what} | ✅ ... / ❌ ... |

## 内容覆盖度

| 类别 | 位置 | 状态 |
|------|------|------|
| 业务术语 | {path} | ✅/需补充/N/A |
| ... | ... | ... |

## 版本记录

| 日期 | 更新者 | 更新内容 | 关联任务 |
|------|--------|----------|----------|
| {日期} | team-review | {summary} | {slug} |
```

## STOP_SIGNALS

- **跳过** Constitutional 合规检查或三视角对抗审查
- **擅自修复** P0/P1 问题而不向编排器报告路由到 `team-impl`/`team-spec`
- **省略**消费方契约三要素（触发条件/可执行指令/示例）
- **泛泛而谈**复盘（"做得不错""继续努力"）而非给出具体事例

## CONSTITUTIONAL_RULES

**REF** `_team-rules/constitutional-rules.md` — 9 条 Constitutional Rules
**REF** `_team-rules/first-principles.md` — 4 条第一性原理（First Principle #1 ~ #4）
**REF** `_team-rules/spec-driven-workflow.md` — SDD 验证链与有向图回退规则
**REF** `_team-rules/task-lifecycle.md` — 来源标签规范（§1.3）
**REF** `_team-rules/ai-collaboration-standards.md` — 消费方契约原则（§1.2）与资产维护机制（§1.3）

审查阶段尤其注意：

- **Rule #3 产出必须验证**：审查结论必须基于代码 diff 和测试运行结果，不可仅凭 Agent 自我声明 `_team-rules/first-principles.md: First Principle #4`
- **Rule #2 有向图回退**：P0/P1 问题必须回退 team-impl 或 team-spec，不可降级处理 `_team-rules/first-principles.md: First Principle #4`
- **Rule #9 TDD 顺序不可逆**：Phase 1.5 中必须验证 06-tdd-log.md 的 RED→GREEN 时间序 `_team-rules/first-principles.md: First Principle #2`
- **Rule #1 人类介入是一等公民**：安全漏洞和多方案决策必须触发 `ASK_HUMAN` `_team-rules/first-principles.md: First Principle #1`

## SELF_CHECK

**GATE** 产出前自检（全部通过才放行）：

- [ ] **ASSERT** `五维度审查 == 完成` — 正确性/可维护性/性能/安全/测试覆盖全部完成
- [ ] **ASSERT** `constitutional_rules_checked == 9` — 每条 Rule 有检查结果
- [ ] **ASSERT** `P0_P1_self_fixed == 0` — P0/P1 问题已向编排器报告（→ team-impl / → team-spec / → **ASK_HUMAN**），未擅自修复
- [ ] **EXEC** `grep -cE '触发条件|可执行指令|示例' docs/tasks/{slug}/12-asset-update.md` → **ASSERT** `output >= 3` — 每条规则均有三要素
- [ ] **EXEC** `grep -c '新规则\|本次沉淀' docs/tasks/{slug}/13-retrospective.md` → **ASSERT** `output > 0`
- [ ] **ASSERT** `content_coverage_categories_checked == 8` — 业务术语/架构/代码结构/接口/编码规范/测试/Review/交付在项目 AI 规范中有定义
- [ ] **ASSERT** `tool_asset_count >= 2` — CLAUDE.md / .cursor/rules/、review-checklist、delivery-checklist、prompt-template.md 中至少 2 类存在
- [ ] **ASSERT** `无占位符残留（{N}、{slug} 等已被实际值替换）`
- [ ] **ASSERT** `IRON_LAW 遵守` — P0/P1 问题已报告未擅自修复
- [ ] 我是否真的逐行读了每个改动，还是扫了一眼就觉得"看起来没问题"？
- [ ] 如果这段代码出了线上 bug，我的 review 是否覆盖了可能的故障点？

## COMPLETION

**REF** `_team-rules/four-state-protocol.md` — 四态完成状态

**MATCH** `result`：

- 全部通过，无 P0/P1 遗留 → **DONE**
  - 产出目录：`docs/tasks/{slug}/`
  - 文件清单：`11-review.md` / `12-asset-update.md` / `13-retrospective.md` / `task-rules.md`
  - 审查结果：`{N}` 个文件审查，发现 `{N}` 个问题
  - 修复记录：直接修复 `{N}` 个，回退 `team-impl` `{N}` 个，回退 `team-spec` `{N}` 个，人类决策 `{N}` 个
  - 资产更新：`{N}` 个文件已更新
  - → 编排器将补全团队级证据并交付用户验收
- 全部通过但有保留意见（P2 建议未采纳等） → **DONE_WITH_CONCERNS**
- 缺少关键上下文（SDD 缺失、代码无法访问等） → **NEEDS_CONTEXT**
- P0/P1 问题阻塞且路由失败 → **BLOCKED**，触发 **ASK_HUMAN**
- *DEFAULT* → **BLOCKED**，触发 **ASK_HUMAN**

## INTEGRATION

**被谁调用：**

- 用户直接调用（独立使用）
- `team-orchestrator`（编排模式）
- `team-test`（测试全部通过后路由）

**配对使用：**

- `team-feedback` — 审查反馈应对
- `team-finish` — 分支完成处理
- `team-orchestrator` — REQUIRED：审查完成后必须交付

## NEXT

- 审查通过 → 使用 `team-feedback` 处理审查反馈，然后 `team-finish` 合并分支
- 审查发现 P0/P1 → 回退 `team-impl` 修复后重新提交
