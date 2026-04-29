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

## 计划中（按进度落实）

| # | 标题 | 触发 |
|---|---|---|
| 0009 | 从 awesome-claude-code-subagents 精选 sub-agent | v0.1 sub-agent 阶段 |
| 0010 | 从 claude-skills / claude-code-plugins-plus-skills 精选 skill | v0.1 skill 阶段 |
| 0011 | preset 系统设计 | v0.2 |
| 0012 | env 前缀迁移策略（OPENCODE_* → CLAUDECODE_*） | v0.1 ingest |
| 0013 | 是否保留 embedded Web UI | v0.1 ingest |
| 0014 | plugin 自动 install 安全策略 | v0.1 plugin loader |

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
