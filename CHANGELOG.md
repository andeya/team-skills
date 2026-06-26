# 变更日志

本文件记录 Team Skills 的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
本项目遵循[语义化版本](https://semver.org/lang/zh-CN/spec/v2.0.0.html)。

## [Unreleased]

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
