# 变更日志

本文件记录 Team Skills 的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
本项目遵循[语义化版本](https://semver.org/lang/zh-CN/spec/v2.0.0.html)。

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
- 8 条 Constitutional Rules（不可覆盖的硬约束）
- 4 个人类介入点（H1-H4）
- 100 分制评分体系：7 项硬门槛 + 5 个维度
- 三层资产体系：项目级 → 模块级 → 任务级
- Delta Spec 支持修改类任务
- Session hook 自动加载 meta-skill
- 跨平台支持：Claude Code 和 Cursor
