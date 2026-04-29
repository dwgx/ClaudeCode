# ADR-0008：插件协议双向兼容策略

- 状态：✅ 已采纳
- 日期：2026-04-30
- 决策者：Claude Code 主脑

## 背景

ClaudeCode 既要兼容 Anthropic Claude Code 现有插件生态（`.claude-plugin/`、`skills/`、hook events），又基于 opencode 的代码导出 hook + npm/file spec + SDK client 模型。两者协议**不一致**。

## 决策

**三层兼容策略**：

### 层 1：原生协议 = opencode 风格（演进）

ClaudeCode 自己的插件协议沿用 opencode：
- `plugin` config 字段支持 string 或 `[specifier, options]`
- `.claudecode/plugin(s)/*.{ts,js}` 自动发现
- 14 hook events（来自 opencode + Citadel 综合）：
  `event`, `config`, `tool`, `auth`, `provider`, `chat.message`, `chat.params`, `chat.headers`, `permission.ask`, `command.execute.before`, `tool.execute.before`, `tool.execute.after`, `shell.env`, `tool.definition`

### 层 2：Anthropic 兼容 adapter（loader）

提供 loader 把 Anthropic Claude Code 风格的资源注册进我们的 runtime：

| Anthropic 资源 | 兼容路径 | 实现 |
|---|---|---|
| `~/.claude/skills/**/SKILL.md` | ✅ 直接扫描（opencode 已有） | 解析 frontmatter → 注册到本地 skill registry |
| `~/.claude/agents/*.md` | ✅ 直接扫描 | 同上，agent registry |
| `~/.claude/commands/*.md` | ✅ 扫描 | 注册为 slash command |
| `.claude/hooks/*.json` | ✅ 解析 + event 映射 | 把 Anthropic hook event ID 映射到我们的 14 events |
| `.claude-plugin/plugin.json` | 🟡 部分 | manifest 字段 → opencode plugin spec 转换；不能 1:1 完整支持 |

opencode 已有 `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS` flag——说明它已在做 Claude Code skill 兼容。我们继承并扩展为更完整 adapter。

### 层 3：双向输出（projection）

让本仓的 `plugins-builtin/` 也能被 Anthropic Claude Code 使用。每个 builtin plugin 同时输出：
- `claudecode/<plugin>/manifest.json`（原生）
- `claudecode/<plugin>/.claude-plugin/plugin.json`（Anthropic 兼容投影）

## hook event 映射表

| ClaudeCode（来自 opencode） | Anthropic Claude Code（来自 Citadel catalog） | Citadel normalized |
|---|---|---|
| `event` | (各种) | (envelope) |
| `chat.message` / `chat.params` | `UserPromptSubmit` 邻近 | `user_prompt` |
| `tool.execute.before` | `PreToolUse` | `pre_tool_use` |
| `tool.execute.after` | `PostToolUse` | `post_tool_use` |
| `permission.ask` | `PreToolUse`（被 PreToolUse 阻断） | `pre_tool_use` |
| `provider` | (no direct) | (omit) |
| (no direct) | `SessionStart` | `session_start` |
| (no direct) | `SessionEnd` / `Stop` / `StopFailure` | `session_end` / `stop` / `stop_failure` |
| (no direct) | `PreCompact` / `PostCompact` | `pre_compact` / `post_compact` |
| (no direct) | `SubagentStop` | `subagent_stop` |
| (no direct) | `TaskCreated` / `TaskCompleted` | `task_created` / `task_completed` |
| (no direct) | `WorktreeCreate` / `WorktreeRemove` | `worktree_create` / `worktree_remove` |

ClaudeCode 实际暴露的 event 集合 = opencode 14 个 ∪ Anthropic 14 个 = **去重后约 22-25 个**，由 capability detection 在运行时声明（参考 Citadel 模式）。

## 取舍

| 方案 | 利 | 弊 |
|---|---|---|
| **三层（采纳）** | 现有 Anthropic 插件无缝跑；opencode 风格新插件依然可用；本仓插件可双向被使用 | adapter + projection 维护成本 |
| 完全照搬 Anthropic 协议 | 兼容简单 | 丢失 opencode 强 typed plugin SDK；现有 opencode 插件需要重写 |
| 完全照搬 opencode 协议 | 实现简单 | 现有 Anthropic 插件需要 port；社区生态隔绝 |

## 不做

- 不复制 Anthropic Claude Code 的 plugin 加载/沙箱/权限提示对话框等专有 UI 体验
- 不实现 Anthropic plugin marketplace 中央注册表（直接基于 GitHub repo）
- v0.1 不做 plugin.json 的 1:1 完整字段支持，只做核心字段（name / description / hooks / skills / agents / commands）

## 后果

- skills/agents/commands 兼容性高（容易）
- hooks 兼容性中等（要做 event ID 映射 + payload 调整）
- plugin.json manifest 兼容性低（部分字段 drop，记录在 PR/Issue）
- 用户可以混用两种风格的资源
