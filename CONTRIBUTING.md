# 贡献指南

欢迎贡献！Team Skills 的目标是成为最好的 AI 协作框架，每一份贡献都很重要。

## 🚀 快速开始

1. **Fork** 本仓库
2. **Clone** 你的 fork：`git clone <<https://github.com/你的用户名/team-skills.git`>>
3. **创建分支**：`git checkout -b feat/你的功能`
4. **修改代码**（参见[开发指南](#-开发指南)）
5. **测试**你的修改
6. **提交**（遵循 Conventional Commits）
7. **推送**并发起 **Pull Request**

## 📋 开发指南

### 理解代码结构

- `skills/` — 所有 SKILL.md 文件，项目的核心
- `skills/_team-rules/` — 被所有 Skill 引用的共享规则文件
- `skills/*/references/` — 任务文档模板

### 添加新 Skill

1. 按照 `CLAUDE.md` §二 和 `skills/_team-rules/skill-spec.md` 定义的结构创建 `skills/你的-skill/SKILL.md`
2. 更新 `README.md` 中的 Skills 清单表格
3. 如果该 Skill 应被自动发现，更新 `using-team-skills/SKILL.md`

### 修改已有 Skill

- 遵循 **Spec-Driven** 原则：如果修改非 trivial，考虑对所有引用它的 Skill 的影响
- 如果修改是跨领域的，同步更新 `_team-rules/` 中的共享规则
- 保持 `SKILL.md` 聚焦——每个 Skill 只做好一件事

### 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat: 添加 team-debug skill，支持根因分析
fix: 修正验证协议步骤顺序
docs: 更新 README 中的 Skill 表格
refactor: 将共享规则抽取到 _team-rules/
style: 修正 SKILL.md 标题格式
test: 添加验证协议测试用例
```

### Pull Request 流程

1. 确保 PR 有清晰的描述，说明做了什么以及为什么
2. 如果 PR 改变了行为，更新相关文档
3. 关联相关 Issue
4. 维护者会在几天内审查你的 PR

## 🧪 测试

由于 Team Skills 是一个提示词和规则的框架，测试意味着：

- **可读性**：新用户能否一次读懂这个 Skill？
- **一致性**：是否遵循 `CLAUDE.md` §二 和 `skills/_team-rules/skill-spec.md` 中的规范？
- **完整性**：是否包含所有必需章节？
- **引用完整性**：所有交叉引用是否正确？

## 📖 风格指南

### SKILL.md 结构

每个 SKILL.md **MUST** 按以下顺序组织（详见 `CLAUDE.md` §二）：

```
# 标题

## 角色定位

### 系统提示词

### 推理检查点

## Iron Law

## 质量职责

## 输入

## 执行步骤

## STOP Signals

## Constitutional Rules 遵守

## 自检门禁

## 完成标志

## 集成关系

## 下一步
```

### 写作风格

- **直接**：不使用"让我们""我觉得""我们应该"
- **具体**：优先使用具体示例而非抽象规则
- **简洁**：每句话都应该值得存在
- **中文内容**：SKILL.md 内容使用中文（面向中文 AI Agent）
- **英文代码**：代码示例、命令、标识符使用英文

## 📝 Issue 指南

### Bug 报告

包含以下内容：

- 问题的清晰描述
- 复现步骤
- 期望行为 vs 实际行为
- 截图（如适用）
- 环境信息（Claude Code / Cursor，版本）

### 功能请求

包含以下内容：

- 解决什么问题？
- 谁会受益？
- 应该怎么工作？
- 是否有参考实现？

## 🤝 行为准则

请帮助我们保持 Team Skills 的开放和包容。阅读[行为准则](CODE_OF_CONDUCT.md)。

## ❓ 问题？

发起[讨论](https://github.com/andeya/team-skills/issues)或在 Issue 中提问。

---

**感谢贡献！** 每一个 PR、Issue 和讨论都让 Team Skills 变得更好。
