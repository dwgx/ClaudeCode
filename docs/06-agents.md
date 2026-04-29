# 06 · Sub-agent 系统

> **状态：占位 stub**。最终内容由 `catalog-opencode.md`、`catalog-citadel.md`、`catalog-superclaude.md` 输出后综合。

## 概念区分

| 词 | 含义 |
|---|---|
| **Sub-agent**（仓内概念） | runtime 里 spawn 出去、有自己上下文窗口的子进程式 agent，调用方式 `Agent({subagent_type: "..."})` |
| **本地 sub-agent CLI**（仓外） | 调用本机 `codex` / `gemini` 二进制做大体力活；详见 [14-subagent-dispatch.md](14-subagent-dispatch.md) |

本文档专讲第一种。

## 协议兼容目标

兼容 Anthropic Claude Code `~/.claude/agents/` 与 opencode `agents/` 两种格式：

```
agents/
└── <agent-name>.md       ← YAML frontmatter (name, description, tools)
                          + system prompt
```

## 自带精选 sub-agent（计划）

候选来源：
- `awesome-claude-code-subagents`（MIT，可移植，需 attribution）
- Citadel 的 `agents/`
- SuperClaude 的 20 个 `@*-agent`

最终选哪些 + 重写程度等 catalog 输出后定。

## 待填章节

- [ ] agent 定义 schema
- [ ] 工具白/黑名单
- [ ] context 隔离机制
- [ ] 平行 fleet（来自 Citadel）
- [ ] 命名约定
- [ ] 自带 agent 列表
