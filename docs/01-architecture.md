# 01 · 架构

## 高层视图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ClaudeCode CLI                              │
│                         (bin: claudecode)                            │
├─────────────────────────────────────────────────────────────────────┤
│  TUI Layer                                                           │
│  └── @opentui/core + @opentui/solid (来自 opencode)                  │
│      thread / app / component / route / context / plugin runtime    │
├─────────────────────────────────────────────────────────────────────┤
│  Orchestration Layer  (吸收 Citadel)                                 │
│  ├── /do router (Tier 0/1/2/3 cascade)                              │
│  ├── parallel fleet (work queue + waves + worktree isolation)       │
│  ├── campaign 持久化 (.planning/campaigns/)                         │
│  └── discovery JSONL (.planning/discoveries/)                       │
├─────────────────────────────────────────────────────────────────────┤
│  Skill / Agent / Plugin Layer                                        │
│  ├── 原生 plugin 协议 (来自 opencode)                                │
│  ├── Anthropic Claude Code 兼容 adapter (.claude/skills 等)         │
│  └── plugins-builtin/ (精选自 SuperClaude / claude-skills 等)       │
├─────────────────────────────────────────────────────────────────────┤
│  Routing Layer  (吸收 claude-code-router)                            │
│  ├── scenario classifier (default/background/think/longContext/    │
│  │                        webSearch/image)                          │
│  ├── transformer chain (endpoint → provider → model)                │
│  ├── tokenizer service (cl100k_base + per-model)                    │
│  └── subagent tag <CCR-SUBAGENT-MODEL>                              │
├─────────────────────────────────────────────────────────────────────┤
│  Agent Runtime  (来自 opencode)                                      │
│  ├── session / worker / RPC                                          │
│  ├── tool registry (16+ 内建 + plugin tools + MCP tools)            │
│  └── permission / sandbox / approval                                 │
├─────────────────────────────────────────────────────────────────────┤
│  MCP Client (来自 opencode)                                          │
│  └── Stdio / Streamable-HTTP / SSE + OAuth dynamic registration     │
├─────────────────────────────────────────────────────────────────────┤
│  Provider Adapters                                                   │
│  Anthropic / OpenAI / Gemini / DeepSeek / OpenRouter / Vertex /     │
│  Groq / Cerebras / Ollama / 自托管                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## 包结构（ingest 后的 src/）

| 来源 package | 目标位置 | 处理 | 用途 |
|---|---|---|---|
| `opencode/packages/opencode/` | `src/opencode/` | KEEP（rebrand） | CLI / TUI / server / session / tool 主体 |
| `opencode/packages/core/` | `src/core/` | KEEP（rebrand） | filesystem / global path / flag / npm / log / flock 基础层 |
| `opencode/packages/sdk/js/` | `src/sdk/` | ADAPT | OpenAPI 生成的 client/server SDK；rename + 重生成 |
| `opencode/packages/plugin/` | `src/plugin/` | ADAPT | plugin SDK；桥接 Anthropic 协议 |
| `opencode/packages/script/` | `src/script/` | KEEP（原样） | semver/channel 辅助库 |
| ❌ `app` / `ui` / `desktop` / `desktop-electron` / `web` / `docs` | DROP | 不要 | Web/桌面/SaaS UI；与 v0.1 终端优先无关 |
| ❌ `console` / `enterprise` / `function` / `slack` | DROP | 不要 | SaaS 控制台与 cloud 函数 |
| ❌ `storybook` / `containers` / `identity` | DROP | 不要 | 故事书 / 容器构建上下文 / 品牌资产 |
| ⏸️ `extensions` (Zed) | DEFER | 暂缓 | IDE 集成；v0.2+ 再评估 |

## 关键执行链路

### CLI 启动

```
bin/claudecode → packages/opencode/bin → 平台/arch 选 binary
                                       → setup CLAUDECODE_* env
                                       → JSON→SQLite 一次性迁移
                                       → yargs commands 注册
                                       → $0 [project] = TUI 默认
```

### TUI 主流程

```
TuiThreadCommand
  ├── 解析 project / session / model / prompt
  ├── chdir 到目标目录
  ├── 启动 worker.ts（local server + runtime）
  ├── app.tsx：createCliRenderer() + render()
  └── RPC: fetch / event-source 暴露给 TUI
```

### Session prompt 阶段

```
用户 prompt
  ↓
[orchestration] /do router 分发
  ├── Tier 0: pattern match（无模型）
  ├── Tier 1: active campaign/fleet 恢复
  ├── Tier 2: keyword skill 命中
  └── Tier 3: LLM classifier
  ↓
[skill/agent loader] 加载选中的 skill / agent
  ↓
[tool merge] 内建 tools + plugin tools + MCP tools → AI SDK tool({inputSchema, execute})
  ↓
[routing] scenario classifier → 选 provider/model
  ↓
[transformer chain] endpoint(out) → provider use[](in) → model use[](in) → 发送
  ↓
[response] model use[](out, 反序) → provider use[](out, 反序) → endpoint(in)
  ↓
[processor] tool call/result 记录 → discovery JSONL
```

### Hook lifecycle

详见 [10-hooks.md](10-hooks.md) 与 [ADR-0008](decisions/0008-plugin-protocol-compat.md)。

## 数据存储位置

| 数据 | 路径 | 来源 |
|---|---|---|
| 全局配置 | `$xdgConfig/claudecode/config.json` | core/global.ts |
| 项目配置 | `<repo>/claudecode.json(c)` 或 `<repo>/.claudecode/config.json(c)` | 同上 |
| TUI 配置 | `tui.json(c)` 或 env `CLAUDECODE_TUI_CONFIG` | tui/config |
| Session DB | `$xdgData/claudecode/db.sqlite` | drizzle-orm bun-sqlite |
| Campaign 状态 | `<repo>/.planning/campaigns/<slug>.md` | 来自 Citadel |
| Fleet session | `<repo>/.planning/fleet/session-<slug>.md` | 同上 |
| Discovery JSONL | `<repo>/.planning/discoveries/YYYY-MM-DD.jsonl` | 同上 |
| Coordination | `<repo>/.planning/coordination/{instances,claims}/` | 同上 |
| MCP 配置 | `<global>/mcp.json` | mcp/index.ts |
| 私有覆盖 | `<repo>/private/CLAUDE.md`（gitignored） | 本仓自定 |

## 进程模型

```
master (CLI 主进程, Bun)
  ├── worker (本地 HTTP server + runtime, Worker_threads)
  │     ├── session storage (SQLite)
  │     ├── MCP 客户端（local stdio + remote http/sse）
  │     └── provider HTTP clients
  ├── TUI renderer (Worker thread, Solid + opentui)
  └── sub-agent spawn (Agent({isolation: 'worktree'}))
        └── 跑在 git worktree 里的独立子进程
```

## 与 Anthropic Claude Code 的差异 / 对齐

| 维度 | Anthropic 官方 | ClaudeCode |
|---|---|---|
| 语言 | 闭源 dist | 开源 Bun/TS |
| 模型 | 仅 Anthropic | 多 Provider 路由 |
| Skill 协议 | `.claude-plugin/skills/` | ✅ 兼容 + 原生 |
| Agent 协议 | `~/.claude/agents/*.md` | ✅ 兼容 + 原生 |
| Hook events | ~14 种 | 22-25 种（合并 opencode + Anthropic） |
| `/do` 智能编排 | 无 | ✅ 有（Citadel 风格） |
| Parallel fleet | 无 | ✅ 有 |
| Routine quota | 15/24h cloud | 默认本地 runner，不消耗 quota |
| Marketplace | 中央 | 直接基于 GitHub |

## 相关 ADR

- [0001 base on opencode](decisions/0001-base-on-opencode.md)
- [0004 routing layer](decisions/0004-routing-layer.md)
- [0005 orchestration layer](decisions/0005-orchestration-layer.md)
- [0006 builtin skills](decisions/0006-builtin-skills.md)
- [0007 TUI = opentui/solid](decisions/0007-tui-opentui-solid.md)
- [0008 plugin protocol compat](decisions/0008-plugin-protocol-compat.md)
