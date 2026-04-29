# Architecture Decision Records (ADR)

记录我们做过的、不可逆或难以回滚的架构决策。每条决策回答：背景 → 选项 → 决策 → 后果。

## 已记录

| # | 标题 | 状态 |
|---|---|---|
| [0001](0001-base-on-opencode.md) | 基线选 opencode | ✅ |
| [0002](0002-license-mit.md) | License = MIT | ✅ |
| [0003](0003-private-overlay.md) | 私有 overlay = 仓内 `private/` + gitignore | ✅ |
| [0004](0004-routing-layer.md) | 路由层吸收 claude-code-router | ✅ |
| [0005](0005-orchestration-layer.md) | 编排层吸收 Citadel | ✅ |
| [0006](0006-builtin-skills.md) | 内置 skill / agent / mode 精选清单（v0.1） | ✅ |
| [0007](0007-tui-opentui-solid.md) | TUI = `@opentui/solid` | ✅ |
| [0008](0008-plugin-protocol-compat.md) | 插件协议双向兼容 | ✅ |
| [0009](0009-builtin-subagents-shortlist.md) | 从 awesome-claude-code-subagents 精选 sub-agent | 🟡 草案 |
| [0010](0010-skills-shortlist-expansion.md) | 从 claude-skills / agents 精选 skill 扩充 | 🟡 草案 |
| [0011](0011-preset-system.md) | preset 系统设计 | 🟡 草案 |
| [0012](0012-env-prefix-migration.md) | env 前缀迁移（OPENCODE_* → CLAUDECODE_*） | 🟡 草案 |
| [0013](0013-embedded-web-ui.md) | 内嵌 Web UI lazy-load 决策 | 🟡 草案 |
| [0014](0014-plugin-install-security.md) | 外部 plugin 自动安装的安全模型 | 📝 设计中 |

## 计划中（按进度落实）

_（无）_

## 模板

```md
# ADR-NNNN：<标题>
- 状态：Proposed / Accepted / Superseded by NNNN
- 日期：YYYY-MM-DD
- 决策者：...

## 背景
## 决策
## 取舍
## 后果
```
