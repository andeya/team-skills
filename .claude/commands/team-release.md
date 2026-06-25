---
description: 版本发布：更新 package.json + CHANGELOG.md，运行 install/format/lint/cli-test 验证
argument-hint: [patch|minor|major|x.y.z, 默认 patch]
---

# /team-release — 版本发布

## 功能

自动化版本发布流程：计算新版本号 → 更新 package.json 和 CHANGELOG.md → npm install 同步 lock 文件 → format + lint + cli-test 验证。

## 参数

- `$ARGUMENTS`：版本类型或显式版本号
  - `patch`（默认）：`1.3.1` → `1.3.2`
  - `minor`：`1.3.1` → `1.4.0`
  - `major`：`1.3.1` → `2.0.0`
  - 显式版本号（如 `1.4.0`）：直接使用

## 执行步骤

### Step 1：读取当前版本

**READ** `package.json` → 提取 `version` 字段（当前版本）

### Step 2：计算新版本

根据 `$ARGUMENTS` 计算目标版本：

- `patch` / `minor` / `major` → semver 递增
- `x.y.z` 格式 → 直接使用（必须大于当前版本）
- 参数为空 → 默认 `patch`

**输出**：`{当前版本}` → `{新版本}`，请用户确认

### Step 3：前置检查

**READ** `CHANGELOG.md` → 检查 `## [Unreleased]` 段是否有实际内容

- 有内容 → 继续
- 无内容（空或仅有分类标题） → **BLOCKED**：没有变更记录，不应发版。请先在 `[Unreleased]` 下记录变更内容

### Step 4：更新文件

按以下顺序更新：

1. **`package.json`**：将 `version` 字段更新为新版本号

2. **`CHANGELOG.md`**：
   - 将 `## [Unreleased]` 下的全部内容移入新段 `## [{新版本}] - {YYYY-MM-DD}`
   - 在文件顶部保留空的 `## [Unreleased]` 占位（紧跟文件头说明之后）

### Step 5：同步依赖

```bash
npm install
```

确保 `package-lock.json` 与 `package.json` 版本同步。

### Step 6：格式化 + 验证

依次运行：

```bash
npm run format
npm run lint
npm run cli-test
```

- 全部通过 → 完成
- 任一失败 → 修复问题后重新运行

## 使用方式

```bash
# 默认 patch 升级（1.3.1 → 1.3.2）
/team-release

# minor 升级（1.3.1 → 1.4.0）
/team-release minor

# major 升级（1.3.1 → 2.0.0）
/team-release major

# 显式版本号
/team-release 2.0.0
```

## 关联

- **GitHub Actions Release**：`.github/workflows/release.yml`，`v*` tag push 触发自动发布到 npm
- **CHANGELOG 格式**：[Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)
- **版本规范**：[语义化版本 2.0.0](https://semver.org/lang/zh-CN/)
