# 10 · Hooks

ClaudeCode 涉及两类 hook：

1. **Git hook**（仓库级）—— 三层隐私防御一部分
2. **运行时生命周期 hook**（runtime 级）—— 与 Anthropic Claude Code 双向兼容

---

## Git hooks

实现在 `scripts/git-hooks/`：
- `pre-commit`：路径黑名单 + 提交人身份 + 密钥指纹
- `install.sh`：把 `core.hooksPath` 指到 `scripts/git-hooks/` 并设 `user.name/email`
- `self-test.sh`：构造命中/不命中样例验证 hook 真的在拦
- `README.md`：模块说明

### 安装

```bash
bash scripts/git-hooks/install.sh
```

### 自测

```bash
bash scripts/git-hooks/self-test.sh
```

预期输出 `PASS=39 FAIL=0`。

### 不要绕过

`git commit --no-verify` 是核武器。绕过 = 私有文件公开。如果 hook 误报，**改 hook**，不要绕过。

---

## Lifecycle hooks（runtime）

ClaudeCode 继承 opencode 的 hook 系统并加一层 Anthropic 兼容映射。Anthropic Claude Code 风格的 hook（在 `~/.claude/settings.json` 里以 JSON 声明 + 触发 shell 命令）和 opencode 风格的 hook（在 plugin 模块里 export JS 函数）**都能用**。

### Anthropic CC ↔ opencode 事件映射表

| Anthropic CC event | opencode hook key | 可用情况 | 备注 |
|---|---|---|---|
| `UserPromptSubmit` | `chat.message` | ✅ | 用户发消息时触发；可改 parts |
| `PreToolUse` | `tool.execute.before` | ✅ | 工具执行前，可改 args；返回 `permission.ask` 等价 |
| `PostToolUse` | `tool.execute.after` | ✅ | 工具执行后，可改 output/title/metadata |
| `Notification` | `event`（filter `type=notification`）| ✅ | 通用 event hook 配过滤 |
| `Stop` | （无直接等价）| ⚠ v0.2 | 通过 `event` 事件 + state machine 判定后给 |
| `SubagentStop` | （无直接等价）| ⚠ v0.2 | 同上 |
| `PreCompact` | `experimental.session.compacting` | ✅ | 可改 compaction prompt |
| `PostCompact` | `experimental.compaction.autocontinue` | ✅ | 可决定是否自动 continue |
| `SessionStart` | `event`（filter `type=session.start`）| ✅ | 通用 event hook 配过滤 |
| `SessionEnd` | （无直接等价）| ⚠ v0.2 | 需补 |
| `TaskCreated` / `TaskCompleted` | （无直接等价）| ⚠ v0.2 | task 工具触发时补 |
| —— | `chat.params` | (opencode 独有) | 改 LLM 参数（temperature/topP/maxOutputTokens）|
| —— | `chat.headers` | (opencode 独有) | 改 HTTP headers（注 API key、X-Beta 等）|
| —— | `permission.ask` | (opencode 独有) | 权限决策（allow/deny/ask）|
| —— | `command.execute.before` | (opencode 独有) | slash command 执行前 |
| —— | `shell.env` | (opencode 独有) | 改 shell 环境变量 |
| —— | `experimental.chat.system.transform` | (opencode 独有) | 改 system prompt |
| —— | `experimental.chat.messages.transform` | (opencode 独有) | 改整段 message stream |
| —— | `experimental.text.complete` | (opencode 独有) | 文本生成完成时 |
| —— | `tool.definition` | (opencode 独有) | 改工具定义（description/parameters）|
| —— | `auth` | (opencode 独有) | 认证流程 hook |
| —— | `provider` | (opencode 独有) | provider 注册 hook |
| —— | `tool` | (opencode 独有) | 注册自定义 tool |

合计 **8 个 Anthropic 兼容事件**（5 个直接对应 + 3 个待补）+ **11 个 opencode 独有 hook**。

### 写 opencode 风格的 hook

最直接的方式。在你的 plugin（`.ts` / `.js`）里 export `Plugin` 函数，返回一个 `Hooks` 对象：

```ts
// my-plugin/index.ts
import type { Plugin } from "@dwgx/claudecode-plugin"

const plugin: Plugin = async (input) => {
  return {
    "chat.message": async (input, output) => {
      console.log("user said:", output.parts.map(p => p.text).join(" "))
    },
    "tool.execute.before": async (input, output) => {
      if (input.tool === "bash" && /rm -rf/.test(output.args.command)) {
        throw new Error("nope, not running rm -rf")
      }
    },
    "tool.execute.after": async (input, output) => {
      // log every tool result
    },
  }
}

export default plugin
```

把这个文件路径放进 `~/.claudecode/config/claudecode.json` 的 `plugin` 字段，启动时会被加载。

### 写 Anthropic CC 风格的 hook（v0.2 计划）

Anthropic Claude Code 的 hook 配置是这样：

```jsonc
// ~/.claude/settings.json (Anthropic) 或 ~/.claudecode/config/settings.json (我们)
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "/path/to/check.sh" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          { "type": "command", "command": "prettier --write \"$CLAUDE_FILE\"" }
        ]
      }
    ]
  }
}
```

每个 `command` 在事件触发时被 spawn，事件 payload 通过 **stdin (JSON)** 传入；命令的 **exit code** 决定 allow/deny；**stdout** 若是 JSON 可以改 output。

ClaudeCode v0.2 会做一个 adapter：读上面的配置，注册成等价的 opencode hook 函数，从而让上游的 Anthropic hook 配置直接能用。当前 v0.1 暂未实现，请用 opencode 原生风格。

### 缺 4 个事件（v0.2 待补）

| Event | 实现思路 |
|---|---|
| `Stop` | session loop 退出时（用户 interrupt 或 LLM 自主 stop）从 session 状态机给出 |
| `SessionEnd` | session 销毁前 fire（覆盖 Ctrl-C / `/exit` / process exit）|
| `TaskCreated` | `task` 工具调用进入时给 |
| `TaskCompleted` | `task` 工具完成（成功/失败/中断）时给 |
| `SubagentStop` | task 内部 subagent 退出时给（覆盖嵌套）|

### Hook envelope 标准（v0.2 之后由 adapter 保证）

不论从哪一侧（Anthropic/opencode/ClaudeCode 自己）触发，最终 hook 函数收到的 input 都符合：

```ts
{
  event_id: string         // ULID
  runtime: "claudecode"
  native_event_name: string  // 'chat.message' / 'tool.execute.before' / ...
  anthropic_event_name?: string  // 'UserPromptSubmit' / 'PreToolUse' / ...（如有映射）
  timestamp: ISO8601
  session_id: string
  turn_id?: string
  cwd: string
  transcript_path?: string
  model?: { providerID: string; modelID: string }
  tool_name?: string
  tool_input?: any
  raw: any  // 原始 input，便于 forward
}
```

参考 ADR-0005 「Common envelope」段。

### 调试

```bash
# 启动时打开 hook trace
CLAUDECODE_HOOK_TRACE=1 bun --cwd src/opencode dev
```

在 `~/.claudecode/log/*.log` 看每个 hook 的 invoke / duration / outcome。

---

## 相关 ADR

- [ADR-0005 编排层吸收 Citadel](decisions/0005-orchestration-layer.md) —— hook event 体系来源
- [ADR-0008 插件协议双向兼容](decisions/0008-plugin-protocol-compat.md) —— opencode ↔ Anthropic 兼容
