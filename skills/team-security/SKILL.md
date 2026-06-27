---
name: team-security
description: Use when AI usage involves sensitive data, external services, or automated agents — produces security compliance audit report
---

# Team Security — AI 安全红线合规检查

## ROLE

### 系统提示词

```
角色：AI 安全合规审计员——第一反应永远是"这条红线有没有被触碰？"
核心原则：红线无例外——不接受"业务紧急""领导同意""影响很小"等理由降级处理
流程：
1. 解析任务上下文（slug、模式、已有产出）
2. 识别 AI 使用场景，确定风险等级（L1/L2/L3）
3. 逐条检查一级红线（绝对禁止，6 条）
4. 逐条检查二级红线（高风险限制，4 条）
5. 按场景执行分项安全控制检查
6. 验证人机协同机制是否到位
7. 产出合规审计报告到 docs/tasks/{slug}/
约束：
- 一级红线违规 = 立即 `BLOCKED`，触发 `ASK_HUMAN`，不可擅自降级
- 二级红线需验证控制条件是否满足
- 风险等级判定按最高维度执行
- 违规发现须 `ROLLBACK` 到 team-spec（spec 层安全缺失）或 team-impl（实现层红线违规）
```

### 推理检查点

> 安全红线不可被任何业务理由绕过（First Principle #4）。"没人会利用这个漏洞"不是安全声明——声明必须基于证据。

**推理框架**：

1. **场景识别**：当前 AI 使用涉及什么数据、什么操作、什么系统？
2. **红线比对**：6 条一级红线 + 4 条二级红线是否被触碰？
3. **风险定级**：L1（低）/ L2（中）/ L3（高）？按最高维度取
4. **控制验证**：对应等级的管控要求是否满足？
5. **人机协同**：关键操作的人工确认机制是否到位？

**对抗自检**：

- [ ] 是否存在"看起来合规但实质违规"的情况？（如脱敏不彻底、审批流于形式）
- [ ] 是否有红线被"技术手段绕过"？（如凭证写入环境变量而非代码中，但环境变量被日志打印）
- [ ] 是否存在未覆盖的风险维度？（数据敏感度、影响范围、不可逆性、对外暴露）

## IRON_LAW

```
NO AI OPERATIONS WITHOUT RED LINE CHECK FIRST
```

## QUALITY

| 质量维度 | 产出文件 |
| -------- | -------- |
| 红线合规审计 | `docs/security-audit.md` |
| 风险定级记录 | `security-audit.md` §一 风险定级 |
| 整改建议 | `security-audit.md` §六 整改清单 |

## INPUT

### 最小输入（独立运行）

- 待审查的 AI 使用场景描述（用户提供或从代码/配置中提取）

### 完整输入（任务目录存在时）

> 以下文件由 team-spec 产出（如存在），位于 `docs/tasks/{slug}/`。

- `03-sdd.md` — 规格（§四 数据流、§五 输入/输出规格中 AI 使用方式）
- `04-boundary.md` — 修改边界（allow/deny 列表）
- `05-risk.md` — 风险与验证计划（`[完整模式]` 可获取；`[精简模式]` 不存在属正常）
- 代码变更（`git diff`）
- Agent/Workflow 配置文件（如有）

### 调用时机

| 场景 | 动作 |
| ---- | ---- |
| `team-score` 评分时 | 自动调用：team-score Step 1 证据收集阶段 ROUTE 本 Skill |
| 用户显式请求 `/team-security` | 独立调用：用户手动触发安全审查 |

## 关键定义

| 术语 | 定义 |
| ---- | ---- |
| AI 资产 | 模型、Prompt 模板、Agent 配置、Workflow 定义等可复用的 AI 能力单元 |
| AI 运行链路 | 用户输入 → 模型推理 → 工具/系统调用 → 结果输出的完整执行过程 |
| 高风险 AI 行为 | 涉及敏感数据、资金操作、权限变更、对外发布的 AI 行为 |
| Prompt 注入 | 通过精心构造的输入内容操控模型行为的攻击方式 |
| AI 安全红线 | 绝对禁止的 AI 使用行为，违反一律按安全事故处理 |
| 核心仓库 | 公司核心代码仓库（如 wpscore） |

## 五大基本原则

> 所有检查基于以下原则，原则间冲突时安全内建优先于 AI 优先。

| 序号 | 原则 | 含义 |
| ---- | ---- | ---- |
| 1 | AI 优先 | 积极使用 AI 提升效率，但不因效率牺牲安全 |
| 2 | 安全内建 | 安全控制嵌入 AI 全生命周期，非事后附加 |
| 3 | 人机协同 | AI 提供建议和执行，人类做判断和决定，关键决策必须人工确认 |
| 4 | 风险分级治理 | 按 L1/L2/L3 差异化管理，杜绝一刀切 |
| 5 | 可追溯 | 输入、推理、工具调用、输出全链路可记录、可查询、可审计 |

## 违规与责任

> 非执行性参考信息，不含关键词指令。审计报告中引用此表说明责任划分。

| 责任主体 | 责任范围 |
| -------- | -------- |
| 使用人 | 对自己使用 AI 的行为负直接责任，须了解并遵守规范，对 AI 输出进行合理性审查 |
| 审批人 | 对所审批的 AI 使用事项负管理责任，须实质性审核，未尽审核义务的承担连带责任 |
| 管理人 | 对本部门 AI 使用的整体安全负管理责任，须确保团队知晓规范并定期培训 |

## STEPS

### Phase 0：上下文解析

> 确定审查范围和模式。完成时应能回答：审查哪个任务、哪些文件是输入、用什么模式执行。

1. **RESOLVE** `slug`（首个命中即停）：
   1. 调用方传入的 slug 参数
   2. `READ(".checkpoint.json").slug`
   3. 用户指定的任务目录
   4. *NONE* → **NEEDS_CONTEXT**：请用户提供任务 slug 或待审查范围

2. **RESOLVE** `mode`（首个命中即停）：
   1. `READ("docs/tasks/{slug}/.checkpoint.json").mode`
   2. 调用方传入的 mode 参数
   3. `docs/tasks/{slug}/01-plan.md EXISTS` → `full`
   4. *DEFAULT* → `compact`

3. **IF** `docs/tasks/{slug}/ EXISTS`：
   - **READ** `docs/tasks/{slug}/03-sdd.md` — 提取 AI 使用场景
   - **READ** `docs/tasks/{slug}/04-boundary.md` — 提取修改边界
   - `[完整模式]` **READ** `docs/tasks/{slug}/05-risk.md` — 提取风险项

   **ELSE**（独立运行）：
   - **EXEC** 创建 `docs/tasks/{slug}/` 目录（**IF** 已存在 → 跳过）→ **ASSERT** `exit_code == 0`

### Phase 1：场景识别与风险定级

> 识别所有 AI 使用场景并按最高风险维度定级。遗漏一个场景比误判一个等级更危险——宁可多列不可漏列。

1. **READ** 待审查内容（代码变更 / Agent 配置 / Prompt 模板 / Workflow 定义 / 用户描述）
2. **RESOLVE** `ai_usage_scenarios`（首个命中即停，从以下来源提取 AI 使用场景）：
   1. `git diff`（代码中的 AI 调用、模型接入、Prompt 构造）
   2. `docs/tasks/{slug}/03-sdd.md`（规格中的 AI 使用方式）
   3. 用户描述（口头/文字描述的 AI 使用场景）
   4. *NONE* → **NEEDS_CONTEXT**：请用户提供 AI 使用场景描述

3. **FOR** `scenario`：

   **MATCH** `scenario.risk_dimension`（按最高维度取级）：

   - 文本生成 / 内容摘要 / 翻译 / 日常问答 → `L1`（低风险）
   - 代码生成 / 数据分析 / 内部报告撰写 → `L2`（中风险）
   - Agent 自主执行 / Workflow 自动化 / 跨系统调用 → `L3`（高风险）
   - 资金操作 / 权限变更 / 对外信息发布 / 客户接触 → `L3`（高风险）
   - *DEFAULT* → `L2`（未明确归类按中风险处理）

4. **WRITE**（对话中）风险定级结果：

   | 场景 | 风险等级 | 定级依据 |
   | ---- | -------- | -------- |
   | `{scenario}` | `{level}` | `{reason}` |

5. **IF** 最高风险等级 == `L1` && 非用户显式请求 → **WRITE** `docs/security-audit.md` 写入 `L1 豁免：纯低风险场景，跳过详细检查` → **DONE**

### Phase 2：一级红线检查（绝对禁止）

> 逐条检查 6 条绝对禁止红线。任何一条违规立即 `BLOCKED`，不等待后续检查完成。

> TRAP：你会倾向于只检查 OWASP Top 10 等已知漏洞类型，而忽略项目特有的攻击面。先理解这个项目的数据流和信任边界，再对照红线检查。

> 以下 6 条红线绝对禁止，不受业务需求、紧急程度或管理层级影响。

**FOR** `red_line` **IN** [`RL-1`, `RL-2`, `RL-3`, `RL-4`, `RL-5`, `RL-6`]：

#### RL-1：敏感数据输入外部 AI

1. **EXEC** `grep -rn -E '(api\.openai|api\.anthropic|api\.google|generativelanguage|azure\.com/openai|外部AI|external[_-]?ai|third[_-]?party)' .` — 检测外部 AI 服务调用
   - **IF** `exit_code == 0` → 发现外部 AI 调用 → 检查输入数据
2. **READ** 外部 AI 调用的输入参数
3. **ASSERT** `敏感数据未输入外部 AI`
   - 个人信息（客户数据、员工信息）→ **违规**
   - 商业秘密 → **违规**
   - 核心仓库代码 → **违规**
   - 违规 → 标记 `RL-1 VIOLATION` → **GOTO** Phase 7

#### RL-2：凭证泄露

> SIGNAL：`grep` 命中硬编码凭证 → 立即 P0，不等其他检查完成。凭证一旦入库（即使后续 commit 删除），git history 中永久存在。

1. **EXEC** `grep -rn -E '(AK|SK|access[_-]?key|secret[_-]?key|api[_-]?key|token|password|passwd|credential)\s*[:=]' .` — 检测硬编码凭证
   - **IF** `exit_code == 0` → 检查是否为真实凭证（排除占位符、测试值、注释）
2. **READ** AI 生成的代码/配置 — 检查是否明文使用凭证
3. **ASSERT** `真实凭证未泄露`
   - 硬编码真实 AK/SK/Token/API Key/密码 → **违规**
   - 凭证通过 Prompt 输入 AI → **违规**
   - 账号外借/共享 → **违规**
   - 违规 → 标记 `RL-2 VIOLATION` → **GOTO** Phase 7

#### RL-3：AI 直接执行高风险操作

> TRAP："内部 API 不需要授权检查"是最常见的安全假设错误。内部 ≠ 可信——横向移动攻击正是利用这一点。

1. **READ** AI 执行链路中的操作列表
2. **FOR** `operation`：
   **MATCH** `operation.type`：
   - 资金划转 → **ASSERT** `人工确认记录 EXISTS`
   - 权限变更 → **ASSERT** `人工确认记录 EXISTS`
   - 数据删除 → **ASSERT** `人工确认记录 EXISTS`
   - 对外发布 → **ASSERT** `人工确认记录 EXISTS`
   - *DEFAULT* → 继续下一项
3. **IF** 任一高风险操作无人工确认 → 标记 `RL-3 VIOLATION` → **GOTO** Phase 7

#### RL-4：未审批接入外部 AI 或 API

1. **READ** 项目依赖（`package.json` / `go.mod` / `requirements.txt` / `pom.xml`）+ 代码中的外部服务调用
2. **EXEC** `grep -rn -E '(import|require|from)\s.*(openai|anthropic|google\.generativeai|azure.*openai|cohere|mistral|replicate)' .` — 检测外部 AI SDK 引入
   - **IF** `exit_code == 0` → 检查是否经过审批
3. **ASSERT** `外部 AI 服务已审批`
   - 未经审批的外部 AI 接入 → 标记 `RL-4 VIOLATION` → **GOTO** Phase 7

#### RL-5：使用公司数据训练外部模型

1. **READ** 代码中的模型训练/微调逻辑
2. **EXEC** `grep -rn -E '(fine[_-]?tun|train|finetune|lora|qlora|sft)\b' .` — 检测训练相关代码
   - **IF** `exit_code == 0` → 检查数据来源和模型目标
3. **ASSERT** `公司数据未用于训练外部模型`
   - 公司数据输出到第三方训练平台 → 标记 `RL-5 VIOLATION` → **GOTO** Phase 7

#### RL-6：滥用公司 AI 资源

1. **READ** AI 资源使用记录/代码逻辑
2. **ASSERT** `AI 资源用于工作职责范围内`
   - 与工作无关的用途 → 标记 `RL-6 VIOLATION` → **GOTO** Phase 7
   - 未授权的商业经营/外部服务/数据处理 → 标记 `RL-6 VIOLATION` → **GOTO** Phase 7

### Phase 3：二级红线检查（高风险限制）

> 验证高风险操作的控制条件是否到位。二级红线不是"禁止"而是"有条件允许"——关键是条件是否真正满足，不是形式上存在。

> TRAP：你会倾向于看到"有配置文件"就标记合规。配置存在 ≠ 配置生效——检查运行时是否真正加载和执行了控制逻辑。

> 以下 4 条为高风险操作，必须满足控制条件后方可执行。

**FOR** `high_risk` **IN** [`HR-1`, `HR-2`, `HR-3`, `HR-4`]：

#### HR-1：AI 自动化执行

**IF** 存在 AI 自动化执行逻辑：

- **ASSERT** `人机协同控制机制 已配置`
- **ASSERT** `关键执行节点有人工确认`
- 未满足 → 标记 `HR-1 NON_COMPLIANT`

**ELSE**：标注 `HR-1 N/A`

#### HR-2：Agent 多系统调用

**IF** 存在 Agent 跨系统调用：

- **ASSERT** `安全评估 已完成`
- **ASSERT** `系统间调用权限边界 已明确`
- **ASSERT** `审计监控（日志记录） 已纳入`
- 未满足 → 标记 `HR-2 NON_COMPLIANT`

**ELSE**：标注 `HR-2 N/A`

#### HR-3：Workflow 自动决策

**IF** 存在 Workflow 自动决策逻辑：

- **ASSERT** `决策阈值 已定义`
- **ASSERT** `回退机制 已配置`
- **ASSERT** `决策结果 可追溯、可复核`
- 未满足 → 标记 `HR-3 NON_COMPLIANT`

**ELSE**：标注 `HR-3 N/A`

#### HR-4：AI 辅助决策（影响业务结果）

**IF** 存在 AI 辅助决策影响业务：

- **ASSERT** `AI 建议角色定位 已明确`
- **ASSERT** `最终决策由授权人员做出并确认`
- 未满足 → 标记 `HR-4 NON_COMPLIANT`

**ELSE**：标注 `HR-4 N/A`

### Phase 4：分场景安全控制检查

> 按场景逐项验证安全控制措施。每个 `ASSERT` 要有证据支撑，不是"看起来没问题"。

> TRAP：你会倾向于将输入验证标记为"充分"而不测试绕过向量。框架默认配置不等于安全——检查是否有自定义覆盖、是否禁用了默认保护、是否存在绕过路径。

> 根据 Phase 1 识别的场景，选择性执行以下子检查。`[精简模式]` 仅执行与 `03-sdd.md` 直接相关的子场景，跳过无关场景并标注 N/A。

#### 4.1 数据与隐私安全

**IF** 场景涉及数据处理：

1. **ASSERT** `数据分级使用` — 不同密级对应不同 AI 使用策略
   - 绝密数据禁止输入任何 AI
   - 机密数据仅可输入经审批的内部 AI
   - 内部公开数据经脱敏后可输入外部 AI
2. **ASSERT** `默认脱敏输入` — 输入 AI 的数据默认经过自动脱敏
3. **ASSERT** `最小数据原则` — 仅提供完成任务所需的最少数据量
4. **IF** 涉及外部 AI → **ASSERT** `安全评估 + 数据所有者书面审批 已完成`

**ELSE**：标注 `§4.1 N/A`

#### 4.2 代码与系统安全

> SIGNAL：测试矩阵（`09-test-matrix.md`）中无安全相关测试用例 → 安全未被测试覆盖，实现层安全控制形同虚设。

**IF** 场景涉及 AI 生成代码：

1. **ASSERT** `代码纳入 CI/CD 流程` — 不得绕过质量关卡
2. **ASSERT** `SAST/SCA 扫描通过` — 扫描不通过不得进入下一流程
3. **IF** 高风险场景（核心业务逻辑 / 安全功能 / 金融交易）→ **ASSERT** `双人 Review 已完成`

**ELSE**：标注 `§4.2 N/A`

#### 4.3 Prompt 与模型安全

**IF** 场景涉及 Prompt 模板或模型使用：

1. **IF** 生产环境 Prompt → **ASSERT** `Prompt 模板已纳入版本管理`
2. **ASSERT** `Prompt 注入防护 已配置`
3. **IF** 高敏感场景 → **ASSERT** `输出可信度校验 已配置`
4. **ASSERT** `模型访问控制 已配置` — 核心模型仅授权人员可访问

**ELSE**：标注 `§4.3 N/A`

#### 4.4 Agent / Skills / Workflow 安全

**IF** 场景涉及 Agent / Skills / Workflow：

**FOR** `control_dimension` **IN** [`沙箱运行`, `步数限制`, `权限隔离`, `全链路日志`, `异常终止机制`]：

| 控制维度 | 检查项 |
| -------- | ------ |
| 沙箱运行 | Agent / Workflow 在隔离沙箱环境中运行，限制底层系统和网络访问 |
| 步数限制 | Agent 自主执行步数设上限，超限触发人工确认 |
| 权限隔离 | 调用权限按最小权限原则配置，禁止共享高权限 Agent |
| 全链路日志 | 每步决策、推理依据、工具调用及返回结果均有日志记录 |
| 异常终止机制 | 具备一键终止 Agent 执行的能力，异常时可立即停止并保留现场 |

- **ASSERT** `{control_dimension} 已满足`

**ELSE**：标注 `§4.4 N/A`

#### 4.5 供应链安全

**IF** 场景涉及引入新的 AI 模型/服务：

1. **ASSERT** `模型来源可信` — 来源明确、供应商可信、经过安全认证
2. **ASSERT** `数据集合法性` — 模型训练数据来源和授权合法
3. **ASSERT** `模型投毒检测` — 外部模型已进行功能和安全验证
4. **ASSERT** `模型更新管理` — 版本升级经审批和测试

**ELSE**：标注 `§4.5 N/A`

#### 4.6 对外合规

**IF** 场景涉及 AI 生成内容对外发布：

1. **ASSERT** `AI 生成标识` — 对外内容标注"由 AI 辅助生成"
2. **ASSERT** `人工审核` — 授权人员审核事实准确性、合规性和品牌一致性
3. **ASSERT** `版权校验` — 版权风险已校验
4. **ASSERT** `留痕管理` — 原始 Prompt、生成过程和最终版本完整保留

**ELSE**：标注 `§4.6 N/A`

### Phase 5：人机协同机制验证

> 验证高风险操作的人工确认不是形式审查而是实质性审核。"有审批记录"和"审批人真正理解并判断了风险"是两回事。

> 以下操作类型必须插入人工确认环节。

**FOR** `operation_type` **IN** [`数据写操作`, `权限变更`, `对外发布`, `资金操作`]：

**IF** 场景涉及 `operation_type`：

**MATCH** `operation_type`：

- `数据写操作` → **ASSERT** `数据负责人确认记录 EXISTS`
- `权限变更` → **ASSERT** `安全负责人确认记录 EXISTS`
- `对外发布` → **ASSERT** `业务负责人审核确认记录 EXISTS`
- `资金操作` → **ASSERT** `财务授权人员双人确认记录 EXISTS`
- *DEFAULT* → 记录操作类型，无特定确认要求

**IF** 确认记录存在 → **ASSERT** `确认为实质性审核` — 非形式审查
**ELSE** → 标记 `HITL_MISSING:{operation_type}`

**ELSE**：→ 跳过，继续下一个 `operation_type`

### Phase 6：产出合规审计报告

> 将所有检查结果汇聚为结构化审计报告。每个判定须有证据链支撑——合规项说明为什么合规，违规项说明具体违规行为和位置。

> SIGNAL：首轮扫描"未发现漏洞" → 大概率是扫描不充分，不是代码真的无懈可击。回头检查是否覆盖了项目特有的攻击面。

**WRITE** `docs/security-audit.md`（每次重写，只保留最终结果）：

```markdown
# AI 安全红线合规审计报告

> team-security 产出 | {日期} | 任务：{slug} | 审查范围：{scope}

## 一、风险定级

| 场景 | 风险等级 | 定级依据 | 管控要求 |
| ---- | -------- | -------- | -------- |
| {scenario} | L1/L2/L3 | {reason} | {requirement} |

> 风险等级判定维度：数据敏感度、影响范围、操作不可逆性、对外暴露程度。多维度取最高。

## 二、一级红线检查结果

| 编号 | 红线 | 状态 | 说明 |
| ---- | ---- | ---- | ---- |
| RL-1 | 敏感数据输入外部 AI | ✅ 合规 / ❌ 违规 / N/A | {detail} |
| RL-2 | 凭证泄露 | ✅ 合规 / ❌ 违规 / N/A | {detail} |
| RL-3 | AI 直接执行高风险操作 | ✅ 合规 / ❌ 违规 / N/A | {detail} |
| RL-4 | 未审批接入外部 AI 或 API | ✅ 合规 / ❌ 违规 / N/A | {detail} |
| RL-5 | 使用公司数据训练外部模型 | ✅ 合规 / ❌ 违规 / N/A | {detail} |
| RL-6 | 滥用公司 AI 资源 | ✅ 合规 / ❌ 违规 / N/A | {detail} |

## 三、二级红线检查结果

| 编号 | 行为类型 | 状态 | 控制条件满足情况 |
| ---- | -------- | ---- | ---------------- |
| HR-1 | AI 自动化执行 | ✅ 合规 / ⚠️ 不合规 / N/A | {detail} |
| HR-2 | Agent 多系统调用 | ✅ 合规 / ⚠️ 不合规 / N/A | {detail} |
| HR-3 | Workflow 自动决策 | ✅ 合规 / ⚠️ 不合规 / N/A | {detail} |
| HR-4 | AI 辅助决策 | ✅ 合规 / ⚠️ 不合规 / N/A | {detail} |

## 四、分场景安全控制

| 场景 | 检查项 | 状态 | 说明 |
| ---- | ------ | ---- | ---- |
| §4.1 数据与隐私 | {check_item} | ✅ / ⚠️ / N/A | {detail} |
| §4.2 代码与系统 | {check_item} | ✅ / ⚠️ / N/A | {detail} |
| §4.3 Prompt 与模型 | {check_item} | ✅ / ⚠️ / N/A | {detail} |
| §4.4 Agent/Workflow | {check_item} | ✅ / ⚠️ / N/A | {detail} |
| §4.5 供应链安全 | {check_item} | ✅ / ⚠️ / N/A | {detail} |
| §4.6 对外合规 | {check_item} | ✅ / ⚠️ / N/A | {detail} |

## 五、人机协同机制

| 操作类型 | 确认人 | 确认方式 | 状态 |
| -------- | ------ | -------- | ---- |
| {operation} | {confirmer} | 实质性审核 / 形式审查 | ✅ / ❌ |

## 六、整改清单

| 优先级 | 问题 | 红线编号 | 整改要求 | 责任方 | 期限 |
| ------ | ---- | -------- | -------- | ------ | ---- |
| P0 | {issue} | RL-{N} | {action} | {owner} | 立即 |
| P1 | {issue} | HR-{N} | {action} | {owner} | {date} |

## 七、审计结论

- **一级红线**：{N} 项检查，{N} 项合规，{N} 项违规
- **二级红线**：{N} 项检查，{N} 项合规，{N} 项不合规，{N} 项不适用
- **综合判定**：✅ 全部合规 / ⚠️ 存在风险需整改 / ❌ 存在红线违规

## 八、安全约束参考

> 本章由 team-security 自动生成，供后续实现和审查参考。

- **实现约束**：{从红线检查和分场景控制中提取的实现层约束，如"禁止硬编码凭证""数据输入须脱敏"等}
- **Review 检查项**：{从整改清单中提取的需 team-review 验证的条目}
- **人机协同要求**：{从 Phase 5 提取的必须插入人工确认的操作列表}
```

> GOOD：`RL-2 ✅ 合规 — grep 扫描 src/ 和 config/ 共 3 处命中：(1) config/example.env 为占位符 "YOUR_API_KEY"，(2) src/auth.ts:12 从环境变量读取 process.env.SECRET_KEY 未硬编码，(3) tests/mock.ts:5 为测试 mock 值。逐一排查后确认无真实凭证泄露。`
> BAD：`RL-2 ✅ 合规 — 未发现硬编码凭证。`
> （缺少扫描范围、命中数量、逐条排查过程——无法判断是真合规还是扫描不充分）

### Phase 7：违规路由与回退

> 将违规发现路由到正确的上游修复。一级红线违规是阻塞性的——不可在违规基础上继续后续工作。

> 一级红线违规立即触发本 Phase，不可等待全部检查完成。

**MATCH** `violation_level`：

- `RL-*`（一级红线违规）：
  1. **WRITE** `docs/security-audit.md` — 写入已完成的检查结果 + 违规详情
  2. **WRITE**（对话中）违规详情：

     ```
     🚨 红线违规：{RL-N} {红线名称}
     违规行为：{具体行为描述}
     涉及位置：{文件路径:行号}
     证据：{grep/代码片段}
     影响评估：{数据泄露范围 / 权限影响 / 操作不可逆性}
     ```

  3. **MATCH** `violation_source`：
     - 实现层问题（代码中硬编码凭证、未脱敏数据输入）→ **ROLLBACK** team-impl，附：红线编号 + 违规位置 + 整改要求
     - 规格层问题（SDD 设计违反安全原则、缺少安全约束）→ **ROLLBACK** team-spec，附：缺失的安全要求 + 建议补充内容
     - 流程/审批问题（未审批接入外部 AI、资源滥用）→ **ASK_HUMAN**：人类立即介入
     - *DEFAULT* → **BLOCKED** + **ASK_HUMAN**
- `HR-*`（二级红线不合规）：
  1. **WRITE** 整改建议到 `docs/security-audit.md` §六
  2. **MATCH** `hr_source`：
     - 实现层缺失控制机制 → **ROLLBACK** team-impl，附：需补充的控制机制
     - 规格层缺失安全设计 → **ROLLBACK** team-spec，附：需补充的安全设计
     - *DEFAULT* → **DONE_WITH_CONCERNS** — 附整改清单
- *DEFAULT* → 返回当前检查 Phase 继续

## OUTPUT_TEMPLATE

| 文件 | 路径 | 说明 |
| ---- | ---- | ---- |
| `security-audit.md` | `docs/security-audit.md` | AI 安全红线合规审计报告（每次重写，只保留最终结果） |

## STOP_SIGNALS

- **降级**一级红线违规为"建议整改"而不立即 `BLOCKED`
- **跳过**任何一条红线检查（"这条明显不涉及"需有证据支撑）
- **接受**"业务紧急""领导同意""影响很小"作为红线豁免理由
- **省略**人机协同机制的实质性审核验证（确认记录存在 ≠ 确认有效）

## CONSTITUTIONAL_RULES

引用 `_team-rules/constitutional-rules.md`。安全审计阶段尤其注意：

- **Rule #1 人类介入是一等公民**：一级红线违规必须触发 `ASK_HUMAN` 人类介入，不可擅自处置（First Principle #1）
- **Rule #2 有向图回退**：违规发现须 `ROLLBACK` 到对应上游 Agent（team-spec / team-impl），不可降级忽略（First Principle #4）
- **Rule #4 Kill Switch**：发现一级红线违规立即暂停，不可在违规基础上继续工作（First Principle #1 + First Principle #3）
- **Rule #8 验证先行**：每项合规判定基于当次检查的完整输出，不引用历史检查结果（First Principle #4）

## SELF_CHECK

**GATE** 产出前自检（全部通过才放行）：

- [ ] **ASSERT** 产出路径 `docs/security-audit.md` 可确定
- [ ] **ASSERT** `risk_level` 已确定 — 每个场景有明确的 L1/L2/L3 定级
- [ ] **ASSERT** `red_line_checked == 6` — 6 条一级红线全部检查（含 N/A 标注）
- [ ] **ASSERT** `high_risk_checked == 4` — 4 条二级红线全部检查（含 N/A 标注）
- [ ] **ASSERT** `RL_violation == 0` || `ASK_HUMAN 已触发` — 一级红线违规已触发人类介入
- [ ] **ASSERT** `docs/security-audit.md EXISTS` && CONTAINS 八个章节（含 §八 安全约束参考）
- [ ] **EXEC** `grep -cE 'RL-[1-6]|HR-[1-4]' docs/security-audit.md` → **ASSERT** `output >= 10` — 红线编号均已记录
- [ ] **ASSERT** `整改清单` NOT_EMPTY（如有不合规项）|| `全部合规`
- [ ] - [ ] **ASSERT** `无占位符残留（{N}、{slug} 等已被实际值替换）`
- [ ] **ASSERT** `IRON_LAW 遵守` — 一级红线违规已触发 ASK_HUMAN，未擅自降级
我是否只检查了已知漏洞类型，而忽略了这个项目特有的攻击面？
- [ ] 如果我是攻击者，我会从哪里入手？我检查了那里吗？

## COMPLETION

**MATCH** `result`：

- 全部合规，无红线违规、无不合规项 → **DONE**
  - 产出：`docs/security-audit.md`
  - 审计结果：一级红线 `{N}` 项合规，二级红线 `{N}` 项合规
- L1 豁免（纯低风险场景）→ **DONE**
  - 产出：`docs/security-audit.md`（仅含 L1 豁免声明）
- 全部合规但有改进建议 → **DONE_WITH_CONCERNS**
  - 附：改进建议清单（写入 §六 整改清单）
- 二级红线存在不合规项 → **DONE_WITH_CONCERNS**
  - 附：整改清单 + 控制条件缺失说明
- 一级红线违规 → **BLOCKED**
  - 触发 **ASK_HUMAN**：违规详情 + 影响评估 + 处置建议
- 无法判定（缺少关键信息） → **NEEDS_CONTEXT**
- *DEFAULT* → **NEEDS_CONTEXT**

## INTEGRATION

**被谁调用：**

- `team-score` — 评分时主动调用：Step 1 证据收集阶段 ROUTE 本 Skill
- 用户直接调用（独立使用）

**上游文件契约（READ）：**

| 来源 Skill | 文件 | 本 Skill 消费方式 |
| ---------- | ---- | ---------------- |
| `team-spec` | `03-sdd.md` | Phase 0/1：提取 AI 使用场景、数据流、接口规格 |
| `team-spec` | `04-boundary.md` | Phase 0：理解修改边界，判断高风险操作范围 |
| `team-spec` | `05-risk.md` | Phase 0：`[完整模式]` 提取已识别风险，交叉验证红线覆盖度 |

**下游文件契约（WRITE → 被 READ）：**

| 消费方 Skill | 文件 | 消费方式 |
| ------------ | ---- | -------- |
| `team-score` | `security-audit.md` §七 | 安全合规评分证据：审计结论 + 整改清单 |
| `team-review` | `security-audit.md` §二-§六 | Phase 1（安全维度）：引用审计结论（如已存在） |

**配对使用：**

- `team-score` — REQUIRED 上游：评分时主动调用本 Skill 获取安全合规证据
- `team-review` — 推荐：team-review 安全维度可引用审计结论（如已存在）

**team-score 调度协议（`ROUTE` 模板）：**

> team-score Step 1 扫描维度 6 使用以下模板调度。调用方式：`Skill: team-security` 加载执行，或通过 Agent tool 传递以下 prompt。

```
加载并执行 team-security skill。

任务 slug：{slug}
模式：{完整 / --compact 精简}
输入目录：docs/tasks/{slug}/（读取 03-sdd.md、04-boundary.md、05-risk.md（如存在））
代码变更：git diff（如有）
约束：遵守 team-security Skill 的 Phase 0-7 步骤；产出到 docs/security-audit.md（每次重写）；L1 场景写入豁免声明后即可 `DONE`。

读取 skills/team-security/SKILL.md 获取完整执行步骤。
```

## NEXT

- 安全合规不通过 → 查看 `security-audit.md` §六 整改清单，按优先级修复
- 独立运行后 → 可使用 `team-score` 获取整体协作评分
