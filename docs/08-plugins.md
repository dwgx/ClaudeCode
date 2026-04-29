# 08 · 插件系统

策略：**双向兼容**——既支持 opencode 风格原生插件，也支持 Anthropic Claude Code `.claude-plugin/`。详见 [ADR-0008](decisions/0008-plugin-protocol-compat.md)。

## 原生协议（opencode 风格）

### 配置入口

`config.plugins[]`：

```jsonc
"plugins": [
  "@dwgx/skill-confidence-check",                         // npm 包名
  ["./.claudecode/plugins/local.ts", { "verbose": true }], // 本地路径 + options
  "github:dwgx/some-plugin#main"                          // GitHub spec
]
```

### 自动发现

```
<repo>/.claudecode/plugin/*.{ts,js}
<repo>/.claudecode/plugins/*.{ts,js}
```

### Plugin 接口（来自 `packages/plugin/src/index.ts`）

```typescript
import type { Plugin } from "@dwgx/claudecode-plugin"

const plugin: Plugin = async (input) => ({
  name: "my-plugin",
  
  // 提供工具
  tools: [
    tool({
      name: "my_tool",
      description: "...",
      inputSchema: z.object({...}),
      async execute(params) { ... }
    })
  ],
  
  // 提供 hooks
  hooks: {
    "tool.execute.before": async (ctx) => { ... },
    "chat.message":        async (ctx) => { ... },
  },
  
  // 提供 skills（路径，自动加载 SKILL.md）
  skills: [{ path: "./skills/my-skill" }],
  
  // 提供 agents
  agents: [{ path: "./agents/my-agent.md" }],
})

export default plugin
```

### TUI 插件

`packages/plugin/src/tui.ts` 定义 route / slot / dialog / theme / keybind / prompt API；运行时在 `packages/opencode/src/cli/cmd/tui/plugin/runtime.ts`。

## Anthropic 兼容 adapter

```
plugins/<plugin-name>/
└── .claude-plugin/
    └── plugin.json       ← Anthropic manifest
└── skills/               ← 直接被 SKILL adapter 加载
└── agents/               ← 直接被 agent adapter 加载
└── commands/             ← 注册为 slash 命令
└── hooks/*.json          ← event 映射后注册
```

### plugin.json 兼容字段

```jsonc
{
  "name":        "my-plugin",
  "version":     "1.0.0",
  "description": "...",
  "skills":      ["skills/foo", "skills/bar"],
  "agents":      ["agents/baz.md"],
  "commands":    ["commands/qux.md"],
  "hooks":       "hooks/hooks.json"
}
```

v0.1 支持核心字段（name/version/description/skills/agents/commands/hooks）；其它字段忽略并 warn（不报错）。

## hook event 映射（adapter）

| Anthropic event | ClaudeCode 映射 | 说明 |
|---|---|---|
| `SessionStart` | `event:session_start` | 来自 Citadel |
| `PreToolUse` | `tool.execute.before` + `permission.ask` | opencode 已有等价 |
| `PostToolUse` | `tool.execute.after` | opencode 已有等价 |
| `PostToolUseFailure` | `tool.execute.after`（含 error） | 同上 |
| `PreCompact` / `PostCompact` | `event:pre_compact` / `event:post_compact` | 新增 |
| `Stop` / `StopFailure` | `event:stop` / `event:stop_failure` | 新增 |
| `SessionEnd` | `event:session_end` | 新增 |
| `SubagentStop` | `event:subagent_stop` | 新增 |
| `TaskCreated` / `TaskCompleted` | `event:task_created` / `event:task_completed` | 新增 |
| `WorktreeCreate` / `WorktreeRemove` | `event:worktree_create` / `event:worktree_remove` | 新增 |
| `UserPromptSubmit` | `chat.message` 邻近 | opencode 已有等价 |

详见 [10-hooks.md](10-hooks.md)。

## Marketplace

不做中央注册表。直接基于 GitHub repo：

```bash
claudecode plugin install github:owner/repo
```

读取目标 repo 根的 `claudecode-marketplace.json`（如不存在则按"单 plugin"模式直接装）。

### 单 plugin repo

repo 根有 `.claudecode/plugin.json` 或 `package.json`（npm 包）即可被装。

### Marketplace repo（一组 plugin）

```jsonc
// claudecode-marketplace.json
{
  "name": "dwgx-curated",
  "plugins": [
    { "name": "skill-confidence-check", "path": "plugins/skill-confidence-check/" },
    { "name": "agent-deep-research",    "path": "plugins/agent-deep-research/" }
  ]
}
```

## 装/卸/升级 CLI

```bash
claudecode plugin install <spec>
claudecode plugin remove <name>
claudecode plugin upgrade <name>
claudecode plugin list
claudecode plugin info <name>
claudecode plugin enable <name>
claudecode plugin disable <name>
```

## 安全 / 沙箱

- ⚠ opencode 默认会按 npm/file spec **自动 install** 插件依赖——这是潜在攻击面
- ClaudeCode v0.1 默认 **关闭自动 install**，每次显式确认（参考 [ADR-0008](decisions/0008-plugin-protocol-compat.md)）
- plugin 触发 hook 走与内建 tool 相同的 permission 模型
- 插件不能默认获得 `Bash` / `Write` / `Edit` 权限——需在 `permission` config 显式 allowlist

## 加载顺序

```
1. plugins-builtin/               (本仓自带，最高优先级覆盖能力)
2. <repo>/.claudecode/plugin(s)/   (项目级)
3. config.plugins[]                (用户配置)
4. ~/.claudecode/plugins/          (用户全局)
5. ~/.claude/plugins/              (Anthropic 兼容；可关 claudeCodeCompat: false)
```

## 完整 plugin.json schema（v0.1 草案）

```jsonc
{
  "name": "string",              // 必填，唯一
  "version": "semver",
  "description": "string",
  "author": "string",
  "license": "string",
  "homepage": "url",
  "repository": "url",
  
  "skills": ["path or pattern"],
  "agents": ["path or pattern"],
  "commands": ["path or pattern"],
  "hooks": "path-to-hooks.json",
  "tools": ["path-to-tool-module.ts"],
  
  "permissions": {
    "tools": ["bash", "write"]   // 该 plugin 需要的工具权限（用户安装时确认）
  },
  
  "compatibility": {
    "claudecode": ">=0.1.0",
    "claudeCode": ">=2.1.84"     // 标注与 Anthropic 兼容性
  }
}
```

完整 JSON Schema 在 v0.2 发布到 `https://claudecode.dwgx.dev/schema/plugin.json`。
