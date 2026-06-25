# Team Skills — 项目开发规范

> 本文件是 team-skills **仓库本身**的开发规则，供贡献者编写或修改 Skill 时参考。
> Skill 运行时规则已提取到 `skills/_team-rules/`（随 skills 分发，不依赖本文件）。

## 快速开始：不确定从哪开始？

如果你不确定当前场景该用哪个 Skill，先加载 `using-team-skills` meta-skill：

```
Skill: using-team-skills
```

它会根据你的场景推荐合适的 Skill。也可直接参考 README.md 中的 Skill 选择矩阵。

## 一、项目结构

```
team-skills/
├── skills/                    # 所有 Skill 定义
│   ├── _team-rules/           # 共享规则文件（被所有 Skill 引用）
│   ├── team-brainstorm/       # 讨论引导
│   ├── team-spec/             # 规格设计
│   ├── team-impl/             # TDD 实现
│   ├── team-test/             # 测试审计
│   ├── team-review/           # 代码审查
│   ├── team-finish/           # 分支完成
│   ├── team-orchestrator/     # 编排器
│   ├── team-verify/           # 验证协议
│   ├── team-debug/            # 系统调试
│   ├── team-feedback/         # 反馈应对
│   ├── team-score/            # 协作评分
│   ├── team-security/         # 安全审计
│   └── using-team-skills/     # meta-skill（入口路由）
├── src/                       # CLI 源码（setup/init/update/uninstall/list）
├── bin/                       # CLI 入口
├── .claude/commands/          # 开发者斜杠命令（不随 Skills 分发）
├── CLAUDE.md                  # 本文件：项目开发规范
├── CONTRIBUTING.md            # 贡献指南
└── README.md                  # 项目说明 + Skill 选择矩阵
```

## 二、SKILL.md 开发规范

> 本章是 skills/ 目录下所有 SKILL.md 的共享约定。

### 2.1 SKILL.md 结构约定

每个 SKILL.md **MUST** 包含以下结构（顺序可调）：

1. **YAML Frontmatter**：`name` + `description`（`---` 分隔，非 `------`）
2. **角色定位**：系统提示词 + 推理指引
3. **Iron Law**（Discipline Skill 必须包含）
4. **质量职责**：产出文件表
5. **输入**：读取哪些文件
6. **执行步骤**：分 Phase 描述
7. **产出文件模板**：内联 Markdown 模板或引用 `references/` 目录下的模板文件
8. **自检门禁**：产出前强制自检清单
9. **完成标志**：四态状态 + 产出清单
10. **STOP Signals**：关键违规行为的即时停止信号
11. **集成关系**：被谁调用 + 配对使用
12. **下一步**：完成后推荐操作

### 2.2 跨 Skill 一致性规则

- 验证协议引用：所有需要声明"通过"的 Skill **MUST** 引用 `_team-rules/verification-protocol.md`，不内联重复
- 四态协议引用：所有完成状态 **MUST** 引用 `_team-rules/four-state-protocol.md`，不内联重复
- Constitutional Rules 引用：所有涉及质量红线的 Skill **MUST** 引用 `_team-rules/constitutional-rules.md`
- 指令风格：优先使用正向指令（"每步必须：A → B → C"），减少负向禁止（"禁止 X"）
- 模板变量：使用 `{slug}`、`{日期}`、`{N}` 等统一占位符
- 完成状态：统一使用四态协议（DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED）

### 2.3 目录命名规范

本套 skills 设计为可全局安装到 `~/.agents/skills/`，与其它 skill 集共存：

| 规则 | 说明 | 示例 |
| ---- | ---- | ---- |
| Skill 目录统一 `team-` 前缀 | 避免与其它 skill 集命名冲突 | `team-spec`, `team-debug` |
| 内部目录以下划线 `_` 开头 | 非 skill 目录，排序靠前，不参与 skill 发现 | `_team-rules/` |
| Skill 名称保持 2 段式 | `team-{name}`，避免 3 段 | ✅ `team-feedback` ❌ `team-review-feedback` |
| 名称使用动词或名词 | 动词表示动作，名词表示角色 | `team-debug`(动词), `team-spec`(名词) |
| 不使用 `-agent` 后缀 | 冗余，skill 本身就是 agent | ✅ `team-spec` ❌ `team-spec-agent` |

### 2.4 Iron Law 规范

每个 Discipline Skill **MUST** 包含一条 Iron Law — 全大写、代码块、不可协商的原则：

```
NO {违规行为} WITHOUT {前置条件} FIRST
```

示例：

| Skill | Iron Law |
|-------|----------|
| team-debug | `NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST` |
| team-verify | `NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE FIRST` |
| team-finish | `NO BRANCH COMPLETION WITHOUT TEST VERIFICATION FIRST` |

Iron Law **MUST** 出现在执行步骤之前，作为不可协商的门禁。

### 2.5 STOP Signals 规范

每个 Skill **MUST** 包含 `## STOP Signals` 章节，从该 Skill 最关键的 3-4 个违规行为中提炼，每条以动词开头。

### 2.6 自检门禁规范

每个 Skill **MUST** 在产出前执行自检，至少包含：

1. 产出文件完整性检查
2. 占位符残留检查（`{N}`、`{slug}` 等是否被实际值替换）
3. Iron Law 遵守检查（如果有）
4. 四态状态声明

### 2.7 集成关系规范

每个 Skill **MUST** 包含 `## 集成关系` 章节，记录：

- **被谁调用**：哪些上游 Skill 或场景会调用本 Skill
- **配对使用**：本 Skill 完成后应该调用哪些下游 Skill，标注 REQUIRED（必须）或推荐

## 三、工具兼容性

### 3.1 支持的工具

| 工具        | 调用方式                | 自动发现              |
| ----------- | ----------------------- | --------------------- |
| Claude Code | `/team-{name}` 斜杠命令 | `~/.claude/skills/` |
| Cursor      | Skill 机制              | `~/.agents/skills/`   |

### 3.2 工具无关性原则

- Skill 定义中 **MUST NOT** 硬编码特定工具的命令（如 `bun test`）
- 使用"项目测试命令""项目 CI 检查命令"等通用表述
- 具体命令从项目的 CLAUDE.md / package.json / Makefile 中动态获取

## 四、共享规则文件索引

以下共享文件位于 `skills/_team-rules/`，被所有 Skill 引用，不内联重复：

| 文件 | 内容 |
| ---- | ---- |
| `first-principles.md` | 4 条第一性原理（FP-1 ~ FP-4）+ 使用指南 |
| `constitutional-rules.md` | 9 条 Constitutional Rules + 常见规避借口 |
| `verification-protocol.md` | 5 步验证协议 + Iron Law + 常见失败模式 |
| `four-state-protocol.md` | 四态完成状态（DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED） |
| `skill-spec.md` | Skill Spec：格式约定 + 关键词参考 + 引用块子类型 + 20 条设计原则 |
| `spec-driven-workflow.md` | Spec-Driven 开发原则 + TDD 工作流 + 有向图回退规则 |
| `task-lifecycle.md` | 任务目录结构 + 人类介入点协议（H1-H4）+ 进度追踪 |
| `ai-collaboration-standards.md` | AI 协作资产管理 + Prompt 工程规范 + Agent 输出质量约束 |

## 五、贡献指南

详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 六、版本记录

| 日期       | 更新者 | 更新内容                     | 关联任务        |
| ---------- | ------ | ---------------------------- | --------------- |
| 2026-06-18 | Andeya | 初始版本：Spec-Driven 全规范 | 项目初始化      |
| 2026-06-18 | Andeya | 第一性原理审查：14 项改进    | 首轮飞轮迭代    |
| 2026-06-19 | Andeya | team-score 校准 + 自评补全   | team-score 校准 |
| 2026-06-23 | Andeya | 竞品审查 18 项改进：P0 逻辑矛盾修复、P1 门禁强化、P2 完善度补齐 | 竞品对标审查 |
| 2026-06-23 | Andeya | IDE 对等：所有 Skill 引用扩展为 CLAUDE.md / .cursor/rules/ | IDE 对等改进 |
| 2026-06-23 | Andeya | 文档布局标准化：brainstorm 纳入 slug 体系（00-design-brief.md）| 文档布局改进 |
| 2026-06-23 | Andeya | 全量缺陷修复：compact 模式一致性（9 文件）、断点续传增强、回退计数规则、质量检查条件化 | 场景模拟缺陷修复 |
| 2026-06-23 | Andeya | CLAUDE.md/AGENTS.md 区分说明 + TDD 纪律强制执行 + 交付清单模板与追踪 | 交互细节审查修复 |
| 2026-06-23 | Andeya | 第一性原理注魂：§第零原则（FP-1~FP-4）+ 12 个 Skill 推理指引升级 + Constitutional Rules WHY 追溯 | 角色专精与第一性原理渗透 |
| 2026-06-23 | Andeya | 第一性原理下沉：FP 定义迁移到 `_team-rules/first-principles.md`，skills 内所有 `CLAUDE.md §` 引用改为指向共享规则文件 | 分发兼容性修复 |
| 2026-06-25 | Andeya | skill-spec v0.3→v1.0：执行模型 + 变量模型 + 组合模型 + 形式语法（BNF）+ 12 约定/12 模式/12 反模式 | 编程语言级审查 |
| 2026-06-25 | Andeya | AP#10/AP#11 conformance：MATCH 兜底补全（team-spec/team-finish）+ EXEC exit_code 检查补全（3 文件 6 处） | v1.0 conformance 修复 |
| 2026-06-25 | Andeya | 5 轮 LLM 消费者视角审查：R1 ASSERT 表达式化 + 关键词粗体化、R2 执行流歧义修复、R3 术语一致性、R4 跨文件结构对齐、R5 LLM 模拟执行终审（test_cmd 排序修复 + AP#4 残留清零） | 全量 SKILL.md 打磨 |
| 2026-06-25 | Andeya | 逐字符 3 轮打磨（12 skills）：R1 结构/逻辑、R2 语言/信噪比、R3 韵律/优雅 + 跨 skill 流转连接 3 轮：集成关系修正 + RESOLVE 链一致性 + 完成→下游衔接验证 | 诗级打磨 |
| 2026-06-25 | Andeya | Score+AI-consumer 双审查 3 轮：R1 业务规则GWT门禁+TDD commit数量验证+测试覆盖量化+风格一致性检查+功能点数交叉验证+模板阈值提升（5文件8处）、R2 SDD七部分ASSERT准确化、R3 24项AI稳定性验证全通过 | 双审查迭代修复 |
| 2026-06-26 | Andeya | skill-spec 重设计：删除 BNF/变量作用域/类型系统（-30%行数），新增引用块子类型（TRAP/SIGNAL/GOOD-BAD）+ 输出骨架 + GATE 自我审问 + Step 意图 + 错误处理；20 条 DP 设计原则；EACH/MAX 关键词移除 | LLM 执行质量优化 |
| 2026-06-26 | Andeya | CLAUDE.md 职责分离：运行时规则提取到 `_team-rules/`（spec-driven-workflow + task-lifecycle + ai-collaboration-standards），CLAUDE.md 仅保留项目开发规范 | 架构解耦 |
| 2026-06-26 | Andeya | team-adversarial → team-refine：融合 LLM 执行质量打磨（5 维度）到对抗审计（10 维度），默认 10→5 轮，按编排流程顺序逐 Skill 精炼 | 开发者命令升级 |
| 2026-06-26 | Andeya | 开发者命令精简：删除 team-pull/push/setup/uninstall（4 个），新增 team-release（版本发布），team-refine 优化（199→131 行）；hooks 全量清理；v1.3.2 发布 | 命令瘦身 + 发版 |
