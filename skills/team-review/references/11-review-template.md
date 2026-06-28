# 代码审查报告

> team-review 产出 | {slug} | {日期}

## 一、审查范围

| 项 | 内容 |
|----|------|
| 审查文件数 | {N} |
| 变更行数 | +{N} / -{N} |
| 对照规格 | 03-sdd.md §{sections} |

## 二、问题清单

| ID | 级别 | 维度 | 文件:行号 | 问题描述 | SDD 引用 | 处理方式 |
|----|------|------|-----------|----------|----------|----------|
| R1 | P{0-3} | {维度} | {file}:{line} | {具体描述} | §{ref} | 报告/直接修/记录 |

## 三、修复记录（P2 自修）

| 问题 ID | 修复内容 | 验证结果（exit_code + output 摘要） |
|---------|----------|--------------------------------------|
| R{N} | {修改描述} | ✅ `exit_code == 0`，{N} tests passed |

## 四、Constitutional 合规检查

| Rule | 检查方式 | 证据 | 结果 |
|------|----------|------|------|
| {rule_name} | {how_checked} | {evidence} | ✅/❌ P{N} |

## 五、审查结论

状态：{DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED}

剩余风险：

- {risk_description}

路由决策：{→ team-review 通过 / → team-impl 修复 / → team-spec 补全 / → ASK_HUMAN}
