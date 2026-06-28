# 变更日志

本文件记录 Team Skills 的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
本项目遵循[语义化版本](https://semver.org/lang/zh-CN/spec/v2.0.0.html)。

## [Unreleased]

## [1.6.1] - 2026-06-28

### 变更

- team-spec: Phase 2.5 用户审阅从 REPEAT MAX=3 改为无限循环——用户未通过则持续迭代，每次修改/追加后主动请求确认

## [1.6.0] - 2026-06-28

### 新增

- team-spec: Phase 1.5 显式迭代澄清（REPEAT MAX=5），支持多轮需求修改和追加
- team-spec: Phase 2.5 用户审阅反馈循环（无次数限制，用户未通过则持续迭代），每次回复后重新请求确认
- team-spec: Phase 3 多角色轮审（实现者/测试者/攻击者/用户/运维者）+ 自动修复循环（REPEAT MAX=3），每角色有专属 SDD 章节审查焦点
- team-spec: Phase 3 前置说明——方案执行者是 AI Agent，规格须比人类版本更精确、零歧义
- team-spec: 反橡皮图章双 TRAP——每角色至少 1 条观察 + 每轮至少 1 个改进项
- team-spec: ROLE 对抗自检从 3 视角扩展为 5 视角（+用户、+运维者）
- team-finish: 新增默认 Option 1「合并到主分支并推送」（push 功能分支留档 → merge → push 主分支 → 清理本地功能分支）
- team-finish: 选项展示增加适用场景说明，帮助用户选择

### 变更

- team-finish: 选项从 5 个精简为 4 个，移除「仅本地合并」（团队协作反模式），重新编号
- team-orchestrator: Mermaid 流程图 Step 7 标签对齐实际标题「分支完成处理」
- team-orchestrator: Step 7 team-finish 选项描述更新为新选项名称
- team-orchestrator: NEXT 移除与 Step 7 重复的 team-finish 推荐
- team-spec: STOP_SIGNALS 从 4 项扩展为 6 项（+跳过 Phase 2.5 用户审阅、+跳过 Phase 3 多角色轮审）
- team-spec: SELF_CHECK 新增 Phase 2.5 用户审阅确认 + Phase 3 多角色轮审执行验证
- team-spec: ROLE 系统提示词流程描述补充 Phase 2.5 和 Phase 3
- team-debug: Rule #7 引用澄清——区分编排器跨 Agent 回退（≤ 2 次）vs Skill 内部修复重试（≤ 3 次）

### 修复

- 7 个 reference 模板对齐 SKILL.md 内联骨架：11-review-template（章节顺序+表结构重写）、12-asset-update-template（补充消费方契约列+8 类覆盖度表）、14-team-template（§编号+§四表结构）、15-brief-template（§编号+占位符）、13-retrospective-template（header 元数据）、review-checklist-template（性能+安全检查项）、delivery-checklist-template（章节引用）

## [1.5.3] - 2026-06-28

### 修复

- 全部 12 个 SKILL.md 在 frontmatter 后增加顶级 CRITICAL 约束，阻止 LLM 使用 EnterPlanMode 绕过 Skill 自身的结构化流程（有向图/TDD/根因调查）
- constitutional-rules.md 新增 Rule #10「禁止外部规划工具替代 Skill 流程」+ 常见规避借口补充
- team-orchestrator/team-impl/team-debug: ROLE 约束、Step 1 TRAP、STOP_SIGNALS、SELF_CHECK 四层防护
- 清理 docs/tasks 历史产出并加入 .gitignore

## [1.5.2] - 2026-06-28

### 修复

- team-review: Phase 2 P0/P1 路由硬化——从被动"向编排器报告：建议路由到"改为显式 `route_target` 赋值 + `GOTO Phase 3`，消除顺序流滑入自修的路径
- team-review: Phase 3 重排为 MATCH `route_target` 优先分发——P0/P1 以 `DONE_WITH_CONCERNS` 硬终止执行，P2 自修入口增加 GATE 准入断言（`severity != P0 && severity != P1`）
- team-review: COMPLETION 补充 P0/P1 路由回退的 `DONE_WITH_CONCERNS` 状态定义（仅产出 `11-review.md`，Phase 4/5 跳过）
- team-orchestrator: Step 5 先 READ 路由决策再完成验证——P0/P1 回退场景跳过文件完整性检查（避免 team-review 提前终止后因缺少 12/13/task-rules 文件被误判导致死循环）

## [1.5.1] - 2026-06-28

### 修复

- team-orchestrator: slug RESOLVE 链修复——READ 动作从 RESOLVE 中独立，消除 LLM"首个命中即停"导致的重复序号 bug
- team-orchestrator: Step 7.3.1 分期任务去掉独立 slug 解析，统一由 Step 1 处理（消除双重解析冲突）
- team-orchestrator: Step 1 步骤编号连续性修复（5,6 重复→7,8）

### 变更

- 共享内容一致性同步：verify_cmd RESOLVE 5 步链（5 个 skill）、slug 解析流程（3 个 skill）、回退四要素（2 个 skill）、失败模式表 4→10 行（verification-protocol + team-verify）——全部与 canonical source 完全一致
- CLAUDE.md §2.2：明确 REF 仅用于声明性章节（CONSTITUTIONAL_RULES/COMPLETION），STEPS 中操作性内容必须内联
- 5 个 skill 补充 spec-driven-workflow.md 声明性 REF（team-test/review/orchestrator/debug/feedback）
- 4 个 skill 补充 verification-protocol.md / task-lifecycle.md / ai-collaboration-standards.md 声明性 REF

## [1.5.0] - 2026-06-28

### 新增

- team-spec: `01-plan.md` 骨架新增"容量与成本预估"章节（数据量级/QPS/API 成本/存储增长）
- team-spec: `03-sdd.md` §八 异常场景后新增并发和兼容性 SIGNAL 提示
- team-spec: Phase 3 自检新增容量成本检查项
- team-test: 功能覆盖维度补充跨模块/跨服务集成路径端到端测试要求
- team-test: 新增 E2E/集成测试遗漏 TRAP
- team-impl: RED 阶段新增集成测试遗漏 TRAP
- team-review: 正确性维度新增向后兼容性检查（API 签名、数据格式、配置项破坏性变更）
- team-review: 性能维度新增并发安全、数据量级评估、成本影响评估
- team-orchestrator: 精简模式等效证据映射表（D2 五项 + G1/G6/G7 硬门槛映射）
- team-debug: Phase 4 补充 `debug-report.md` WRITE 指令，QUALITY 表同步更新
- ai-collaboration-standards: 三层体系项目级新增 AGENTS.md，§1.4 Review 标准和交付要求新增 checklist 文件引用
- spec-driven-workflow: §七 边界条件新增"兼容性变更"

### 变更

- team-score: D3 TDD 流程正确分值 5→8（对齐 L2 workshop 标准），移除 D4 评委自定(3)，D3 总分 27→30，D4 总分 13→10，总分保持 100
- team-orchestrator: Step 8 D3/D4 分值标注同步（27→30, 13→10）
- team-orchestrator: 精简模式 D2.2/D2.3/D2.5 从"跳过"改为等效证据 ASSERT 检查
- team-security: 一级红线标识 RL-1~6 → RED_LINE_1~6，二级红线 HR-1~4 → HIGH_RISK_1~4（遵循"缩写即缺陷"命名规范）
- 消费方引用格式统一：`（红线 RL-N）` → ``（`team-security: RED_LINE_N`）``（team-review/team-spec/team-impl/team-finish）

### 修复

- team-review: 复盘模板§编号对齐（§二.5→§三, §三→§四，与 13-retrospective-template.md 一致）
- ai-collaboration-standards: §1.4 代码结构引用计数修正（"17 文件"→"任务目录结构"）

## [1.4.0] - 2026-06-27

### 新增

- `team-range` 开发者命令：逐文件遍历项目文件执行用户指定操作，修改后重检直到干净再处理下一个

### 变更

- CLAUDE.md §2.2 引用规范更新：新增 `**REF**` 关键词统一外部规则引用格式，新增内联引用反引号格式规范
- README 对齐 CLAUDE.md 命名规范：Agent 类名 → Skill 名称、H1-H4 → 正式介入点名称（CONFIRM_GOAL/CONFIRM_SPEC/ASK_HUMAN/HUMAN_ACCEPT）、Mermaid 核心架构图节点标签同步更新
- `team-refine` 打磨顺序调整

### 修复

- 29 个文件全量一致性修复：22 处 Skill 名称反引号统一、4 处角色命名统一（"Agent" → "Skill"）、5 处模板章节编号修正
- README 事实修正：SDD 章节数 7→9、设计原则数 20→21、refine 维度数修正、开发者命令表补齐 `/team-range`

## [1.3.9] - 2026-06-27

### 新增

- team-impl: Phase 0 无 SDD 时 fallback 分支（design-brief 轻量替代 + boundary 缺失时最小修改约束）
- team-impl: 并行记录 section 意图说明（贯穿 Phase 1，非独立阶段）
- team-debug: Phase 3 假设验证 REPEAT MAX=5 迭代限制，超限后 GOTO Phase 5
- team-feedback: Phase 4 入口新增 ASK_HUMAN 回复状态断言
- team-review: Phase 1.5 Constitutional 检查统一文件缺失处理规则
- task-lifecycle: 目录结构补充 .checkpoint.json

### 变更

- SDD 章节编号统一：七部分→九章节，spec-driven-workflow + team-spec inline skeleton + task-lifecycle 同步更新
- team-brainstorm: Phase 6 跳过 spec 路由添加前置 ASSERT（需 design-brief 存在）
- team-security: Phase 2 改为"标记违规 + 继续检查"模式，全部 6 条红线检查完毕后统一路由
- team-score: OUTPUT_TEMPLATE 维度分数从 {n}/100 改为各维度实际满分（25/25/27/13/10）
- team-orchestrator: compact 模式文档计数 12→11、COMPLETION_STATUS→COMPLETION_PROTOCOL、13 个兜底标签 *default*/*none* → *DEFAULT*/*NONE*
- team-test: Phase 2 标题改为"设计并写入四维测试矩阵"
- 6 个 Skill INTEGRATION "被谁调用" 补充"用户直接调用"

### 修复

- 5 个 Skill SELF_CHECK 双重复选框 `- [ ] - [ ]` 修正 + 裸文本自问补 checkbox
- team-spec inline skeleton §六/§七 → §七/§八（对齐 sdd-template.md 实际编号）
- team-feedback Phase 4 步骤序号重复修正（3→4→5→6）
- spec-driven-workflow 追溯链示例 M1→D1（有效 SDD 条目编号）
- lint 结构检查规则与 SKILL.md 实际章节名对齐

## [1.3.8] - 2026-06-27

### 新增

- 编排器 Iron Law 强化：不得自己写实现代码、子 Skill 不可用不得自动降级
- Step 2/3/4/5 子 Skill 可用性 GATE 检查（team-spec/impl/test/review），不可用时 H3 请示用户
- H4 前协作文档完整性 GATE（full 11 文件 / compact 9 文件），不通过则 ROLLBACK 对应 Step

### 修复

- compact 模式文档计数 11→12，补齐 `12-asset-update.md`
- 引用段落更新（Step 3/4/5 → Step 2/3/4/5）

## [1.3.7] - 2026-06-26

### 修复

- 安装时自检：目标与源为同一文件时跳过删除/复制，防止误删源文件（`createSymlinkSafe` + `installSkillsProject` + `verifyGlobalSymlinks`）

## [1.3.6] - 2026-06-26

### 修复

- D12：移除 4 个 SKILL.md 中 `###` 标题后的 bare `>` 空行（using-team-skills×3、team-brainstorm×6、team-finish×6、team-verify×4），统一为标准空行格式
- D4：`verify_cmd` RESOLVE 链一致性修复——team-impl 和 team-test 补齐 `Cargo.toml`（与 team-verify/team-feedback 对齐）

## [1.3.5] - 2026-06-26

### 变更

- `team-refine` 每轮新增 Step 4：team-score 满分校验（硬门槛覆盖 + 评分维度覆盖 + 缺口修复），收敛条件同步强化
- 6 个 SKILL.md 质量修复：移除 bare `>` 空行（brainstorm）、`*none*` → `*default*` 兜底修正（review/security）、GATE 自检补充对抗性自问（brainstorm/orchestrator/score）
- CLI 模块化重构：提取 `installers.js` 共享模块（5 个函数），命令文件总行数 -278 行

### 修复

- 项目路径与全局路径重叠时保留 symlinks，跳过文件复制（避免 `update`/`init` 覆盖全局 symlinks）

## [1.3.4] - 2026-06-26

### 变更

- 全局安装目录从 2 个扩展为 3 个：新增 `~/.cursor/skills/`（Cursor 全局 Skills 目录）
- `setup`、`update`、`uninstall`、`list` 四个命令统一使用循环模式处理 3 个全局目标（Agents / Cursor / Claude Code）

## [1.3.3] - 2026-06-26

### 变更

- `update` 命令新增全局安装阶段：同步更新 `~/.agents/skills/` 和 `~/.claude/skills/`（含 team-score）
- `setup` 全局安装始终包含 team-score，移除 `--with-score` 参数
- `setup`、`init`、`update` 统一为默认覆盖模式，移除 `--force` 参数
- `init` 覆盖行为与 `update` 对齐：先清理再复制（`rmSync` + `copyRecursive`）

### 修复

- `update` 不再误删项目中已安装的 team-score（`cleanStaleSkills` 跳过被排除的 skill）
- `setup` 验证阶段补全 Claude Code 共享规则检查（之前仅验证 Cursor 路径）
- `update` 全局安装新增 symlink 验证阶段

## [1.3.2] - 2026-06-26

### 新增

- `team-refine` 开发者命令：融合 Spec ↔ Skills 对抗审计（10 维度）+ LLM 执行质量打磨（5 维度），按编排流程顺序逐 Skill 精炼
- `team-release` 开发者命令：版本发布自动化（更新 package.json + CHANGELOG + install/format/lint/cli-test）
- 3 个 `_team-rules/` 共享规则文件：`spec-driven-workflow.md`、`task-lifecycle.md`、`ai-collaboration-standards.md`
- README 新增"开发者斜杠命令"章节

### 变更

- CLAUDE.md 职责分离：仅保留项目开发规范，运行时规则提取到 `_team-rules/`（共享规则从 5 → 8 个）
- `team-adversarial` 命令重命名为 `team-refine`，默认轮次从 10 调整为 5
- skill-spec v1.0 重设计：移除 BNF/变量作用域/类型系统，新增引用块子类型 + 输出骨架 + GATE 自我审问 + 20 条设计原则
- `.claude/commands/` 不再发布和安装到用户端

### 移除

- `hooks/` 目录及全部 hooks 功能（`hooks.json`、`session-start`）：Skills 已通过 IDE 原生机制自动发现，无需 session hook 注入
- CLI `--no-hooks` 选项（`setup`、`uninstall` 命令）
- `package.json` `files` 数组中的 `hooks/` 条目
- 开发者命令 `team-pull`、`team-push`、`team-setup`、`team-uninstall`（功能可通过 git/CLI 直接完成）

## [1.1.2] - 2026-06-23

### 变更

- 所有 Skill 的项目规范引用从 `CLAUDE.md` 扩展为 `CLAUDE.md / .cursor/rules/`，支持 Cursor 项目
- `.claude/commands/team-setup.md` 和 `team-uninstall.md` 重写为 Node.js CLI 文档（原为过时的 bash 脚本）
- CHANGELOG.md 补齐 1.x 版本记录

### 修复

- hooks.json 仅安装到 Cursor hooks 目录（不再错误安装到 Claude Code）
- `cleanStaleSkills` 仅清理 `team-*` 前缀目录（保护用户自定义 Skill）
- `list` 命令 hooks.json 仅显示在 Cursor 下
- README/CHANGELOG 与代码实现对齐

## [1.1.1] - 2026-06-23

### 新增

- `setup` 为所有 Skill 创建 Claude Code 斜杠命令（`~/.claude/commands/{name}.md`）
- `init` 支持 Claude Code：将 SKILL.md 复制为斜杠命令
- `update` 支持 Claude Code 命令更新 + 过时命令清理
- `uninstall` 移除 Claude Code Skill 斜杠命令
- `list` 新增 "Claude Code Skill 斜杠命令" 独立展示区

### 修复

- P0: `--force` 处理目录时使用 `rmSync` 替代 `unlinkSync`
- P0: `update.js` 修复 shell 注入（`readFileSync` 替代 `execSync`）
- P0: `JSON.parse("1.1.0")` 崩溃修复

### 变更

- `skills/CLAUDE.md` 合并到根目录 `CLAUDE.md` §十三（SKILL.md 开发规范）

## [1.1.0] - 2026-06-22

### 新增

- Node.js CLI 工具（`bin/team-skills.js`），取代原有 bash 脚本
- 5 个命令：`setup`、`init`、`update`、`uninstall`、`list`
- `--ide` 选项：强制指定目标 IDE（claude/cursor/both）
- `--with-score` 选项：可选安装 team-score Skill
- `--dry-run` 选项：所有命令均支持
- `detectIDE` 共享模块：自动检测项目 IDE 类型
- `check-skill-structure.js` CI 检查脚本
- npm 发布配置（`package.json` 的 `files`、`bin`、`engines`）
- GitHub Actions release workflow：`v*` tag 自动发布到 npm

### 变更

- `team-score` 默认不安装，需 `--with-score` 显式启用
- 从其他 Skill 中移除 team-score 硬编码引用
- CI 简化为 npm scripts 驱动

### 移除

- Makefile（功能迁移到 npm scripts）
- `src/lib/manifest.js`（不再需要）
- `rules/` 目录（开发规范已合并到 CLAUDE.md）

## [0.2.0] - 2026-06-22

### 新增

- GitHub 社区标准文件：LICENSE、CONTRIBUTING、CODE_OF_CONDUCT、Issue/PR 模板
- GitHub Actions CI 工作流：Markdown 检查、链接检查、Skill 结构验证
- `examples/` 目录：快速开始指南和 Skill 使用示例
- README badges：星标、CI、许可证、工具兼容性、PR 欢迎

### 变更

- 完全重写 README：视觉层次、对比表格、快速开始流程
- 所有文档统一为中文

### 修复

- 所有 SKILL.md 文件标准化为一致的章节顺序
- 验证所有 Skill 间的交叉引用完整性

## [0.1.0] - 2026-06-18

### 新增

- 初始发布，包含 12 个核心 Skill
- Spec-Driven 开发框架，含 SDD 规格标准
- 有向图回退机制，支持测试/审查反馈自动回退
- 5 步验证协议，杜绝虚假通过声明
- 9 条 Constitutional Rules（不可覆盖的硬约束）
- 4 个人类介入点（H1-H4）
- 100 分制评分体系：7 项硬门槛 + 5 个维度
- 三层资产体系：项目级 → 模块级 → 任务级
- Delta Spec 支持修改类任务
- Session hook 自动加载 meta-skill
- 跨平台支持：Claude Code 和 Cursor
