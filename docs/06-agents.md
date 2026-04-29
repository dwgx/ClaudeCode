# 06 · Sub-agent 系统

## 概念区分

| 词 | 含义 | 文档位置 |
|---|---|---|
| **Sub-agent**（runtime 内） | spawn 出去、有自己上下文窗口的子 agent；用 `Agent({subagent_type, prompt, isolation})` 调用 | 本文档 |
| **本地 sub-agent CLI**（仓外） | 调本机 `codex` / `gemini` 二进制做大体力活 | [14-subagent-dispatch.md](14-subagent-dispatch.md) |

本文专讲第一种。

## 协议（兼容 Anthropic + opencode + Citadel）

```
agents/
└── <agent-name>.md       ← YAML frontmatter + system prompt body
```

### frontmatter

```yaml
---
name: deep-research-agent
description: 深度 research，adaptive strategies，evidence synthesis
model: claude-opus-4-7        # 或 "$DEFAULT_DEEP_MODEL"
maxTurns: 150                  # 该 agent 最多 turn 数
effort: high                   # low/medium/high → 反映到 max_tokens 等
tools:                         # allowlist；缺省 = 继承父 session
  - Read
  - Grep
  - WebFetch
  - WebSearch
  - Task
disallowedTools:               # denylist；优先级高于 allowlist
  - Bash
  - Write
skills:                        # 该 agent 默认加载的 skill
  - research
  - confidence-check
isolation: worktree            # worktree | none | sandbox
---
你是 ___，目标 ___。

## Protocol
...
```

## 加载顺序

```
1. <repo>/.claudecode/agents/<name>.md           (项目级)
2. <repo>/agents/<name>.md                       (项目级备选)
3. config.agents.paths[]                         (用户配置)
4. plugin 提供的 agents                           (plugins-builtin + 用户装的)
5. ~/.claudecode/agents/<name>.md                (用户全局)
6. ~/.claude/agents/<name>.md                    (Anthropic 兼容；可关)
```

## Spawn 机制

### 通过 `task` 工具（runtime 自带）

```typescript
Agent({
  subagent_type: "deep-research-agent",
  prompt: "深入调研 X 主题...",
  isolation: "worktree"   // 可选；继承 agent 默认
})
```

### Fleet 多 agent 并发（来自 Citadel）

`/fleet` 命令构造 work queue，每 wave 起 2-3 agents，wave 完成后 collect HANDOFF → compress discovery → 下一 wave。详见 [01-architecture.md](01-architecture.md) "Fleet 编排" 段。

## isolation 模式

| 模式 | 行为 | 适用 |
|---|---|---|
| `worktree` | 起 git worktree，agent 在独立分支工作 | 多 agent 并行修改不同区域 |
| `none` | 与父 session 共享文件树 | 只读 / 调研类 |
| `sandbox` | 完全隔离的临时目录 | 不信任 / 实验性 agent |

worktree 隔离的安装/清理由 `WorktreeCreate` / `WorktreeRemove` hook 接管（详见 [10-hooks.md](10-hooks.md)）。

## 通信

```
父 session
  ├── Agent.spawn(...)
  │     └── 子 agent 在隔离上下文运行
  ├── 子 agent 完成
  └── 输出 HANDOFF block
       ├── What changed: 文件列表 + 改动摘要
       ├── Decisions: trade-off
       ├── Open: 未决
       └── Next: 建议
```

HANDOFF 格式严格——fleet 解析它做 wave 间 discovery 共享。

## Discovery JSONL

每个 wave 的 agent 把"我学到了什么"写进 `<repo>/.planning/discoveries/YYYY-MM-DD.jsonl`：

```jsonl
{"session":"abc","agent":"refactoring-expert","wave":1,"scope":"src/router","status":"done","handoff_items":["..."],"decisions":["..."],"files_touched":["src/router/x.ts"],"failures":[]}
```

下一 wave 的 agent 自动读到这些 discovery（以 brief 形式 inject 进 system prompt）。详见 [ADR-0005](decisions/0005-orchestration-layer.md)。

## 自带精选 sub-agent（plugins-builtin/）

第一批（v0.1，10 个）：

| agent | 来源 | 用途 |
|---|---|---|
| `pm-agent-lite` | SuperClaude | plan/checkpoint/evidence（不常驻） |
| `deep-research-agent` | SuperClaude | 深度 research |
| `repo-index` | SuperClaude | 仓库索引 + briefing |
| `root-cause-analyst` | SuperClaude | 证据驱动 RCA |
| `requirements-analyst` | SuperClaude | 需求 → spec |
| `quality-engineer` | SuperClaude | 测试策略 |
| `security-engineer` | SuperClaude | 漏洞识别 |
| `performance-engineer` | SuperClaude | 测量驱动优化 |
| `refactoring-expert` | SuperClaude | 系统重构 |
| `self-review` | SuperClaude | 实现后 validation |
| `technical-writer` | SuperClaude | 技术文档 |

每个自带 `ATTRIBUTION.md`。

## 与 Anthropic 官方 sub-agent 的差异

| 维度 | Anthropic | ClaudeCode |
|---|---|---|
| 目录 | `~/.claude/agents/` | ✅ 兼容 + 原生 `~/.claudecode/agents/` |
| frontmatter `name` / `description` | ✅ | ✅ |
| frontmatter `tools` | ✅ allowlist | ✅ + `disallowedTools` |
| `model` 覆盖 | ✅ | ✅ |
| `maxTurns` | ✅ | ✅ |
| `effort` | (有) | ✅ |
| `skills` 预加载 | (无) | ✅（来自 Citadel） |
| `isolation: worktree` | ✅（spawn 时指定） | ✅（agent 默认 + spawn 覆盖） |

兼容程度：高——Anthropic 现有 agent **直接放进 `agents/` 可加载**。
