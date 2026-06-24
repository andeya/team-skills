# 验证协议（5 步门禁）

> 共享规则文件。任何"测试通过""CI 通过""lint 通过"的声明 MUST 基于此协议。

## 5 步验证流程

```

1. 确定验证命令（优先级从高到低）：
   - 05-risk.md §一验证计划
   - CLAUDE.md / .cursor/rules/
   - package.json scripts / Makefile / Cargo.toml
   - 以上均无 → NEEDS_CONTEXT，请求用户提供
   - 项目无自动化验证 → 10-test-report.md 标注，改用手动验证（截图/curl/日志对比），不可跳过
2. 执行命令——不用缓存，不引用上一轮输出
3. 完整阅读输出——不截断，不跳过 warning。Warning 处理：退出码 = 0 时 warning 不阻塞通过声明，但必须在验证报告中列出 warning 内容供人类判断
4. 退出码 = 0 且失败数 = 0
5. 全部通过 → 声明通过。存在失败 → 记录详情，定位根因，修复或路由到对应 Agent，从步骤 2 重新执行完整验证。不可跳过失败项——违反 Rule #2

```

违反此协议的声明视为无效，reviewAgent MUST 标记为 P0。

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
3. 仍失败 → BLOCKED，触发 H3（状态不可为 DONE，只可 DONE_WITH_CONCERNS）
4. "工具失败" ≠ "验证通过"

## Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

## 常见失败模式

| 声明 | 充分证据 | 不充分 |
| ---- | -------- | ------ |
| 测试通过 | 0 failures + 退出码 0 | 上一轮运行、"应该能过" |
| Lint 干净 | 0 errors + 退出码 0 | 部分检查、推测 |
| 构建成功 | exit 0 + 无 error | Lint 通过、日志看起来对 |
| Bug 修复 | 原始症状通过 + 回归通过 | 代码改了、假设修好了 |
