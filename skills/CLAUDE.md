# Skills 模块级规范

> 本文件是 skills/ 目录下所有 SKILL.md 的共享约定（模块级），继承项目级 CLAUDE.md，被任务级 task-rules.md 覆盖。

## 一、SKILL.md 结构约定

每个 SKILL.md **MUST** 包含以下结构（顺序可调）：

1. **YAML Frontmatter**：`name` + `description`（`---` 分隔，非 `------`）
2. **角色定位**：系统提示词 + 思维链
3. **质量职责**：产出文件表
4. **输入**：读取哪些文件
5. **执行步骤**：分 Phase 描述
6. **产出文件模板**：Markdown 模板（含占位符）
7. **完成标志**：四态状态 + 产出清单

## 二、跨 Skill 一致性规则

- 验证协议引用：所有需要声明"通过"的 Skill **MUST** 引用 `CLAUDE.md §三 验证协议`，不内联重复
- 禁止项风格：动词短语 + 竖线分隔，如 `直接写文件不先读源码 | 全量塞入上下文不精选`
- 模板变量：使用 `{slug}`、`{日期}`、`{N}` 等统一占位符
- 完成状态：统一使用四态协议（DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED）

## 三、工具无关性

- **MUST NOT** 硬编码特定工具命令（如 `bun test`、`cargo test`）
- 使用"项目测试命令""项目 CI 检查命令"等通用表述
- 具体命令从项目 CLAUDE.md / package.json / Makefile 中动态获取
