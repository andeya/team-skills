# Team Skills

AI 协作团队 Skills 仓库 — 托管 `team-` 前缀的一组关联 Skills，包括编排器、规格、实现、测试、审查五个 Agent Skills 及配套命令。

## Skills 清单

所有 Skills 统一使用 `team-` 前缀命名，便于在 `~/.agents/skills/` 中分组识别。

| Skill | 目录 | 说明 |
|-------|------|------|
| team-orchestrator | `skills/team-orchestrator/` | Team 编排器 — 串联 spec→impl→test→review 四个 Agent |
| team-spec-agent | `skills/team-spec-agent/` | 规格制定 Agent — 将需求转化为完整规格文档 |
| team-impl-agent | `skills/team-impl-agent/` | 实现 Agent — TDD 开发，产出代码 + 全过程证据链 |
| team-test-agent | `skills/team-test-agent/` | 测试 Agent — 四维测试覆盖 |
| team-review-agent | `skills/team-review-agent/` | 审查 Agent — 代码 Review + 风险识别 + AI 协作资产维护 |
| team-setup | `.claude/commands/team-setup.md` | 安装命令 — 将本仓库安装到 `~/.agents/skills/` |
| team-pull | `.claude/commands/team-pull.md` | 拉取命令 — git pull 更新 Skills |
| team-push | `.claude/commands/team-push.md` | 推送命令 — git commit + push 提交变更 |

## 安装

### 方式一：使用 /team-setup 命令（推荐）

在 Claude Code 中执行：

```
/team-setup
```

将本仓库所有内容安装到 `~/.agents/skills/`。也可指定目标目录：

```
/team-setup ~/.claude/skills
```

安装后效果（以默认目录为例）：

```
~/.agents/skills/
├── team-orchestrator/  → skills/team-orchestrator/    (Agent Skill)
├── team-spec-agent/    → skills/team-spec-agent/      (Agent Skill)
├── team-impl-agent/    → skills/team-impl-agent/      (Agent Skill)
├── team-test-agent/    → skills/team-test-agent/      (Agent Skill)
├── team-review-agent/  → skills/team-review-agent/    (Agent Skill)
├── team-setup/         → .claude/commands/team-setup.md  (Command Skill)
├── team-pull/          → .claude/commands/team-pull.md   (Command Skill)
└── team-push/          → .claude/commands/team-push.md   (Command Skill)

~/.claude/commands/          (兼容 Claude Code 斜杠命令)
├── team-setup.md       → .claude/commands/team-setup.md
├── team-pull.md        → .claude/commands/team-pull.md
└── team-push.md        → .claude/commands/team-push.md
```

### 方式二：手动安装

```bash
# 克隆仓库
git clone <repo-url> ~/team-skills
cd ~/team-skills

# 定义目标目录
TARGET=~/.agents/skills
mkdir -p "$TARGET"

# 安装 Agent Skills
ln -sf "$PWD/skills/team-orchestrator" "$TARGET/team-orchestrator"
ln -sf "$PWD/skills/team-spec-agent" "$TARGET/team-spec-agent"
ln -sf "$PWD/skills/team-impl-agent" "$TARGET/team-impl-agent"
ln -sf "$PWD/skills/team-test-agent" "$TARGET/team-test-agent"
ln -sf "$PWD/skills/team-review-agent" "$TARGET/team-review-agent"

# 安装 Command Skills（作为 Skill，Cursor 可发现）
for cmd in team-setup team-pull team-push; do
  mkdir -p "$TARGET/$cmd"
  ln -sf "$PWD/.claude/commands/$cmd.md" "$TARGET/$cmd/SKILL.md"
done

# 安装 Commands（兼容 Claude Code 斜杠命令）
mkdir -p ~/.claude/commands
ln -sf "$PWD/.claude/commands/team-setup.md" ~/.claude/commands/team-setup.md
ln -sf "$PWD/.claude/commands/team-pull.md" ~/.claude/commands/team-pull.md
ln -sf "$PWD/.claude/commands/team-push.md" ~/.claude/commands/team-push.md
```

## 使用

### 更新 Skills

拉取最新 Skills：

```
/team-pull
```

### 提交 Skills 变更

提交并推送本地 Skills 变更：

```
/team-push "feat: add new validation rules"
```

如不提供 commit message，默认使用 `chore: update team skills [YYYY-MM-DD]`。

## 命令参考

| 命令 | 说明 |
|------|------|
| `/team-setup [dir]` | 将本仓库安装到指定目录（默认 `~/.agents/skills`） |
| `/team-pull` | 执行 git pull 拉取最新 Skills |
| `/team-push [msg]` | 执行 git commit + git push 提交 Skills 变更 |

## 目录结构

```
team-skills/
├── .claude/
│   └── commands/
│       ├── team-setup.md        # /team-setup 命令
│       ├── team-pull.md         # /team-pull 命令
│       └── team-push.md         # /team-push 命令
├── skills/
│   ├── team-orchestrator/       # Team 编排器 Skill
│   │   └── SKILL.md
│   ├── team-spec-agent/         # 规格制定 Agent Skill
│   │   └── SKILL.md
│   ├── team-impl-agent/         # 实现 Agent Skill
│   │   └── SKILL.md
│   ├── team-test-agent/         # 测试 Agent Skill
│   │   └── SKILL.md
│   └── team-review-agent/       # 审查 Agent Skill
│       └── SKILL.md
└── README.md
```
