# Architecture Decision Records (ADR)

记录我们做过的、不可逆或难以回滚的架构决策。每条决策回答：背景 → 选项 → 决策 → 后果。

## 已记录

| # | 标题 | 状态 |
|---|---|---|
| [0001](0001-base-on-opencode.md) | 基线选 opencode | ✅ 已采纳 |
| [0002](0002-license-mit.md) | License = MIT | ✅ 已采纳 |
| [0003](0003-private-overlay.md) | 私有 overlay 用仓内 `private/` + gitignored | ✅ 已采纳 |

## 待写（依赖 Codex catalog 输出）

| # | 标题 | 触发 |
|---|---|---|
| 0004 | 路由层吸收 claude-code-router | 等 catalog-router |
| 0005 | 编排层吸收 Citadel /do | 等 catalog-citadel |
| 0006 | 内置 skill / agent 精选清单 | 等 catalog-superclaude + catalog-citadel |
| 0007 | TUI 沿用 opentui/solid | 等 catalog-opencode |
| 0008 | 兼容官方插件协议的具体边界 | 等 catalog-opencode |

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
