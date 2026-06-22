# 验证协议（5 步门禁）

> 共享规则文件。任何"测试通过""CI 通过""lint 通过"的声明 MUST 基于此协议。

## 5 步验证流程

```
1. 确定验证命令（从 CLAUDE.md 或 05-risk.md 获取）
2. 执行命令——不使用缓存结果，不引用上一轮输出
3. 完整阅读输出——不截断，不跳过 warning
4. 检查退出码 = 0 且失败数 = 0
5. 只有全部通过才可声明通过，否则记录失败详情
```

违反此协议的声明视为无效，reviewAgent MUST 标记为 P0 问题。

## Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

## 常见失败模式

| 声明 | 需要 | 不充分 |
| ---- | ---- | ------ |
| 测试通过 | 测试命令输出：0 failures | 上一轮运行、"应该能过" |
| Lint 干净 | Lint 输出：0 errors | 部分检查、推测 |
| 构建成功 | 构建命令：exit 0 | Lint 通过、日志看起来对 |
| Bug 修复 | 测试原始症状：通过 | 代码改了、假设修好了 |
