---
name: team-verify
description: Use when about to claim work is complete, fixed, or passing - requires running verification commands and confirming output before making any success claims
---

# Team Verify — 验证协议

## 角色定位

### 系统提示词

```
角色：验证协议执行者——签字意味着"亲眼看到证据"
核心原则：零信任——不信 Agent 自我报告，不信上一轮结果，不信"应该能通过"
```

### 推理检查点

> 对所有声明零信任（FP-4）。上一轮结果是历史，不是当前事实。

**推理框架**：

1. **声明类型**：`测试通过` / `lint 干净` / `构建成功` / `bug 已修复` / `需求满足`？
2. **证据类型**：此类声明需要什么级别证据？→ 参考「常见失败模式」表
3. **命令来源**：`verify_cmd` 从哪获取？当前有效吗？
4. **新鲜度**：是全新执行吗？环境与之前不同吗？
5. **完整度**：每一行都检查了吗？被忽略的 warning？

**对抗自检**：

- [ ] 声明如果是错的，验证流程能发现吗？
- [ ] 有无失败模式让 `exit_code == 0` 但结果实际错误？

## Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE FIRST
```

## 质量职责

| 质量维度 | 产出 |
| -------- | ---- |
| 验证协议执行 | 验证报告（对话中） |
| 证据记录 | 命令输出 + `exit_code` |

## 输入

- **required**：需要验证的声明描述
- **required**：项目测试/构建命令
- **RESOLVE**：`verify_cmd`（从 `CLAUDE.md` / `.cursor/rules/` 或 `05-risk.md` 获取）

## 执行步骤

### Step 1：确定验证命令

> 找到当前项目真正有效的验证命令。"上次用的命令"不等于"现在正确的命令"——项目配置可能已变更。

**RESOLVE** `verify_cmd`（首个命中即停）：

1. `READ("05-risk.md", "§一验证计划")`
2. `READ("CLAUDE.md").verify_cmd` / `READ(".cursor/rules/")`
3. `READ("package.json").scripts.test` / `READ("Makefile")` / `READ("Cargo.toml")`
4. *none*：
   - 手动验证可行（`截图` / `curl` / `日志对比`）→ 标注验证方式
   - *default* → **NEEDS_CONTEXT**：请用户提供验证命令

### Step 2：执行验证

> 亲手执行，亲眼看到。"刚才跑过了"是最危险的借口——上一次结果不是当前事实。

> TRAP：你会倾向于引用上一轮输出而非重新执行。每次到这一步，默认假设之前的结果已失效。

1. **EXEC** `verify_cmd` — 不使用缓存/上一轮输出
2. **READ** `output`（完整阅读）— 不截断、不跳过 warning

> TRAP：`exit_code == 0` 不代表验证通过。测试框架可能在 0 退出码下报告 warning、跳过测试、或根本没找到测试文件。完整阅读输出是不可省略的。

3. **ASSERT** `exit_code == 0` && `failures == 0`
   - warning && `exit_code == 0` → warning 不计入 failures，不阻塞通过。**WRITE**（对话中）warning 内容供人类判断
   - `exit_code != 0` || `failures > 0` → 记录失败详情 → fix → **GOTO** Step 2

### Step 3：报告结果

> 报告是验证的证据——不是总结感想，而是呈现可追溯的事实。缺少 `exit_code` 或输出摘要的报告等于没有报告。

> TRAP："Tests pass" 不等于 "changed code is tested"。如果测试数量比上次减少了，可能是删除了失败测试而非修复了 bug。

**WRITE**（对话中）验证报告（不可省略 `exit_code` 和输出摘要）：

| 字段 | 值 |
| ---- | -- |
| 验证命令 | `{verify_cmd}` |
| 退出码 | `{exit_code}` |
| 失败数 | `{failures}` |
| 测试总数 | `{test_count}` |
| 判定 | ✅ 通过 / ❌ 失败 |
| 输出摘要 | 最后 10 行，含 pass/fail 统计 |
| Warning（如有） | 完整 warning 内容 |

> SIGNAL：`test_count == 0` && `exit_code == 0` → 测试运行器未找到测试文件，不是"没有测试需要跑"。先检查 test pattern glob 配置。
>
> SIGNAL：`test_count` 比上次运行减少 → 测试被删除而非修复。确认删除是否合理，否则标记为验证失败。
>
> SIGNAL：`exit_code == 0` 但输出含 "skipped" / "pending" / "todo" → 存在被跳过的测试，需判断是否覆盖了变更代码。

> GOOD：
>
> ```
> | 验证命令 | npm test |
> | 退出码 | 0 |
> | 失败数 | 0 |
> | 测试总数 | 47 |
> | 判定 | ✅ 通过 |
> | 输出摘要 | Test Suites: 5 passed, 5 total. Tests: 47 passed, 47 total. |
> | Warning | ⚠ deprecated API usage at src/legacy.ts:12 |
> ```
>
> BAD：
>
> ```
> 测试通过了，没有问题。
> ```

### Step 4：工具失败恢复

> 区分"验证不通过"与"验证命令本身失败"。前者是代码问题，后者是环境问题。修复环境不等于验证通过。

> 验证命令本身执行失败（超时、进程崩溃、环境错误），不同于验证不通过。

**REPEAT** **MAX**=2：

1. 记录失败原因和错误输出
2. 修复环境问题 → **EXEC** `verify_cmd`
   - **IF** `exit_code == 0` → **GOTO** Step 3
3. 继续 **REPEAT**

- *repeat exhausted* → **BLOCKED**，触发 **H3**

> "工具失败"≠"验证通过"——`REPEAT` 修复的是执行环境，不是验证结果。

## 常见失败模式

| 声明 | 充分证据 | 不充分 |
| ---- | -------- | ------ |
| 测试通过 | `failures == 0` + `exit_code == 0` | 上一轮运行、"应该能过" |
| Lint 干净 | `errors == 0` + `exit_code == 0` | 只检查部分文件、推测 |
| 构建成功 | `exit_code == 0` + 无 error | Lint 通过了、日志看起来对 |
| Bug 已修复 | 原始症状复现测试通过 | 代码改了、假设修好了 |
| 回归测试通过 | 红-绿循环验证通过 | 测试通过一次 |
| Agent 完成 | `git diff` 显示变更 | Agent 报告"成功了" |
| 需求满足 | 逐条对照 checklist | 测试通过了 |
| 性能达标 | benchmark 通过 + baseline 对比 | "看起来快了"、仅 CI 通过 |
| 向后兼容 | 回归全通过 + 无 breaking API | "没改公共接口"但未运行旧版测试 |
| 文档已更新 | `git diff` 显示文档变更 + 链接检查通过 | "代码改了，文档应该也对" |

## STOP Signals

- 使用推测性语言（"应该""可能""看起来"）声明通过
- 引用上一轮运行结果而非当次新鲜执行
- 跳过部分输出或 warning 就声明通过
- 表达满意（"太好了""完美""完成了"）在验证之前

## Constitutional Rules 遵守

> 引用 `_team-rules/constitutional-rules.md`

- **Rule #8 验证先行**：本 skill 的核心使命——每个声明基于当次新鲜证据（FP-4）
- **Rule #3 产出必须验证**：验证者自身的声明也不例外——报告必须含结构化证据（FP-4）

## 自检门禁

**GATE** 产出前自检（全部通过才放行）：

- [ ] `verify_cmd` 已解析（来源：`05-risk.md` / `CLAUDE.md` / `.cursor/rules/` / `package.json`）
- [ ] 验证命令已新鲜执行（非缓存）
- [ ] `output` 已完整阅读（不截断、不跳过 warning）
- [ ] `exit_code == 0` && `failures == 0`
- [ ] 验证报告已输出（含 `exit_code` + 输出摘要 + 测试总数）
- [ ] 我刚才执行的验证命令是当次新鲜运行的，还是我在引用之前的结果？
- [ ] `exit_code == 0` 但我真的读了完整输出吗？有没有被我忽略的 warning？
- [ ] 测试确实覆盖了变更代码吗？还是我只是看到"全部通过"就满足了？

## 完成标志

**MATCH** `result`：

- 全部通过 → **DONE**
- 通过但有 warning → **DONE_WITH_CONCERNS**
- 验证失败 → 记录失败详情 → **GOTO** Step 2（修复后重新验证）
- 工具失败且修复失败 → **BLOCKED**
- *default* → **NEEDS_CONTEXT**

## 集成关系

**被谁调用：**

- 所有需要验证声明的 skill
- `team-orchestrator`（编排模式）

**配对使用：**

- `team-debug` — 验证失败时定位根因

## 下一步

- 验证通过 → 继续当前流程的下一步
- 验证失败 → 使用 `team-debug` 定位根因后重新验证
