# 验证协议（5 步门禁）

> 共享规则文件。任何"测试通过""CI 通过""lint 通过"的声明 MUST 基于此协议。

## verify_cmd 解析流程

> 所有需要执行验证的 Skill（`team-impl`、`team-test`、`team-verify`、`team-feedback`、`team-finish`）统一遵循此流程解析验证命令，不可自行实现。

**RESOLVE** `verify_cmd`（首个命中即停）：

1. `READ("05-risk.md", "§一验证计划")`（精简模式下不存在属于正常）
2. `READ("CLAUDE.md").verify_cmd` / `READ(".cursor/rules/")`
3. `READ("package.json").scripts.test` / `READ("Makefile")` / `READ("Cargo.toml")` / `READ("CI 配置")`
4. 手动验证可行（截图 / curl / 日志对比）→ 标注验证方式，继续
5. *NONE* → **NEEDS_CONTEXT**：请用户提供验证命令

## 5 步验证流程

```

1. 确定验证命令 → 执行上方 verify_cmd 解析流程
2. 执行命令——不用缓存，不引用上一轮输出
3. 完整阅读输出——不截断，不跳过 warning。Warning 处理：退出码 = 0 时 warning 不阻塞通过声明，但必须在验证报告中列出 warning 内容供人类判断
4. 退出码 = 0 且失败数 = 0
5. 全部通过 → 声明通过。存在失败 → 记录详情，定位根因，修复或路由到对应 Agent，从步骤 2 重新执行完整验证。不可跳过失败项——违反 Rule #2

```

违反此协议的声明视为无效，`team-review` MUST 标记为 P0。

## 结构化证据格式

验证声明须包含以下证据，粘贴到 06-tdd-log.md 或 10-test-report.md：

```
验证命令：{实际执行的命令}
退出码：{$?}
输出摘要：{最后 10 行，含 pass/fail 统计}
判定：✅ 通过 / ❌ 失败
```

无退出码和输出的"测试通过"声明 = 未验证。

## 工具失败恢复

1. 记录失败原因和错误输出
2. 修复环境后重试（最多 2 次）
3. 仍失败 → BLOCKED，触发 ASK_HUMAN（状态不可为 DONE，只可 DONE_WITH_CONCERNS）
4. "工具失败" ≠ "验证通过"

## IRON_LAW

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

## 常见失败模式

| 声明 | 充分证据 | 不充分 |
| ---- | -------- | ------ |
| 测试通过 | `failures == 0` + `exit_code == 0` | 上一轮运行、"应该能过" |
| Lint 干净 | `errors == 0` + `exit_code == 0` | 部分检查、推测 |
| 构建成功 | `exit_code == 0` + 无 error | Lint 通过、日志看起来对 |
| Bug 修复 | 原始症状复现测试通过 + 回归通过 | 代码改了、假设修好了 |
| 回归测试通过 | 红-绿循环验证通过 | 测试通过一次 |
| Agent 完成 | `git diff` 显示变更 | Agent 报告"成功了" |
| 需求满足 | 逐条对照 checklist | 测试通过了 |
| 性能达标 | benchmark 通过 + baseline 对比 | "看起来快了"、仅 CI 通过 |
| 向后兼容 | 回归全通过 + 无 breaking API | "没改公共接口"但未运行旧版测试 |
| 文档已更新 | `git diff` 显示文档变更 + 链接检查通过 | "代码改了，文档应该也对" |
