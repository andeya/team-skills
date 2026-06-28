# Constitutional Rules（不可覆盖的硬约束）

> 共享规则文件，被所有 Team Skill 引用。不可被任何任务覆盖。

## 规则列表

> 每条规则追溯到 `_team-rules/first-principles.md`（First Principle #1 ~ First Principle #4）。

1. **人类介入是一等公民** — CONFIRM_GOAL-HUMAN_ACCEPT 暂停等待确认；精简模式 CONFIRM_GOAL/CONFIRM_SPEC 可简化为单句确认，CONFIRM_GOAL/HUMAN_ACCEPT 不可省略（First Principle #1）
2. **有向图回退** — 发现问题立即回退，禁止延迟。测试失败 = 事实，忽略只会放大修复代价（First Principle #4）
3. **产出必须验证** — 不信任 Agent 自我声明，"我认为通过了" ≠ "确实通过了"（First Principle #4）
4. **Kill Switch** — 不可行立即暂停，在不可行基础上堆叠工作只会使失败更难诊断（First Principle #1 + First Principle #3）
5. **分期交付优先** — 修改文件 > 3 且跨模块影响 → 分期，每期独立序号和目录。单点失败只阻塞本期（First Principle #3）
6. **自我约束预算** — 超出砍范围，不放宽预算（First Principle #3）
7. **回退次数上限** — 同阶段 ≤ 2 次，超过触发 ASK_HUMAN。两次未解决 = 信息不足，需人类介入（First Principle #1）
8. **验证先行** — "通过"声明须基于当次新鲜执行的完整输出，上一轮结果是历史而非当前事实（First Principle #4）
9. **TDD 顺序不可逆** — RED + commit 先于 GREEN + commit。后写测试 = 测试你构建的；先写测试 = 测试需求的（First Principle #2）
10. **禁止外部规划工具替代 Skill 流程** — 不得使用 EnterPlanMode 等工具替代 SKILL.md 定义的 STEPS。每个 Skill 自身的 Phase/Step 就是完整的规划与执行流程，外部规划工具会绕过纪律流程（TDD、根因调查、有向图调度）（First Principle #4）

## 常见规避借口（不成立）

| 借口 | 正确做法 |
| ---- | -------- |
| "任务很简单不需要完整流程" | 简单任务自然快速通过流程 |
| "我已经知道答案" | 用证据验证 |
| "测试上一轮通过了" | 重新执行验证协议 |
| "改动太小不需要测试" | 至少运行相关测试 |
| "先实现再补测试" | 先测试再实现 |
| "代码已经写好了，补个测试就行" | 删除实现代码，从 RED 开始 |
| "先规划一下再按流程走" | Skill 的 STEPS 就是规划，不需要 EnterPlanMode |
| "先继续后面再修" | 立即修复，修复后重新验证 |
| "这个失败跟我的改动无关" | 验证无关性（git stash → 运行 → 仍失败 = 确认无关并记录）；未验证 = 掩盖 |
| "用户没要求写文档" | 文档是流程一部分 |
