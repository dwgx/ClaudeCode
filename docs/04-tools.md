# 04 · 内建工具

ClaudeCode runtime 暴露给 LLM 的工具集。命名尽量与 Anthropic Claude Code 一致以保证插件兼容。

## 内建工具清单（来自 opencode）

| 工具 | 用途 | 关键入参 |
|---|---|---|
| `read` | 读文件 / 目录 | path, offset?, limit? |
| `write` | 写文件 | path, content |
| `edit` | 精确字符串替换 | path, old_string, new_string, replace_all? |
| `apply_patch` | 应用结构化 patch | patch |
| `glob` | glob 模式匹配文件 | pattern, path? |
| `grep` | regex 搜索文件内容 | pattern, path?, type?, glob? |
| `bash` | 跑 shell 命令 | command, timeout?, cwd? |
| `webfetch` | fetch URL → text/markdown/html | url, prompt? |
| `websearch` | Web 搜索（Exa） | query |
| `codesearch` | 代码搜索（Exa code） | query |
| `lsp` | LSP definition/reference/diagnostics/symbol | action, position |
| `task` | 派生 sub-agent / 子任务 | subagent_type, prompt |
| `skill` | 触发已发现 skill | skill_name |
| `todowrite` | 更新 todo list | todos[] |
| `plan_exit` | plan mode 结束并请求 build | reason |
| `question` | 向用户提问（可选 `OPENCODE_ENABLE_QUESTION_TOOL`） | prompt, options |
| `invalid` | 模型错误工具调用兜底 | (内部) |

## 与 Anthropic Claude Code 的兼容

opencode 的工具语义接近 Claude Code，但**不是 drop-in**：
- 命名大致一致（Read / Write / Edit / Glob / Grep / Bash / WebFetch / WebSearch / Task）
- permission 模型不同
- hook event payload 不同
- tool result metadata 用 opencode/AI SDK 内部格式

ClaudeCode 在 plugin 兼容 adapter 层（详见 [ADR-0008](decisions/0008-plugin-protocol-compat.md)）做：
1. 工具名大小写归一化（`Read` ↔ `read`）
2. permission 事件映射（`PreToolUse` ↔ `permission.ask` + `tool.execute.before`）
3. tool result 字段对齐
4. Anthropic provider transformer 已处理 `tool_use` / `tool_result` 顺序问题

## 工具来源（运行时合并）

```
session prompt 阶段
  ├── 内建工具 registry (`packages/opencode/src/tool/registry.ts`)
  ├── plugin 工具
  │     ├── config.directories() 下 {tool,tools}/*.{js,ts}
  │     └── plugin hook 返回的 `tool` 字段
  └── MCP 工具
        └── packages/opencode/src/mcp/index.ts，按 server_tool 命名
              合并到统一 AI SDK tool set
```

## 权限模型

每个工具调用按以下规则决策：

```
1. 配置 config.permission.deny[] 命中 → 拒绝
2. 配置 config.permission.ask[] 命中 → 触发 PreToolUse / permission.ask hook
   ├── 用户确认 → 执行
   └── 用户拒绝 → 回报拒绝
3. 否则 auto-allow
```

env 临时覆盖：`CLAUDECODE_PERMISSION='{"ask": ["bash"]}'`

## 沙箱策略

- **macOS**：`sandbox-exec` 配 profile（来自 opencode）
- **Windows**：Job Object（部分工具）
- **Linux**：`bwrap` 可选
- **Bash 工具**：`OPENCODE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS` 控超时

具体策略 v0.1 沿用 opencode，v0.2 评估是否补强。

## 自定义工具加载点

### 通过 plugin 暴露

```typescript
// .claudecode/plugins/my-tool.ts
import { tool } from "@dwgx/claudecode-plugin"
import { z } from "zod"

export default {
  tools: [
    tool({
      name: "my_thing",
      description: "...",
      inputSchema: z.object({ x: z.string() }),
      async execute({ x }) { return { result: x } }
    })
  ]
}
```

### 通过 directory（独立文件）

`<repo>/.claudecode/tools/<name>.ts` 自动加载。

### MCP server

外部 MCP server 暴露的工具自动并入 tool set，命名 `<server>_<tool>`。

## 实验性工具（默认关闭）

| 工具 | flag |
|---|---|
| `lsp_tool` 增强 | `CLAUDECODE_EXPERIMENTAL_LSP_TOOL=true` |
| Plan Mode | `CLAUDECODE_EXPERIMENTAL_PLAN_MODE=true` |
| Markdown 渲染增强 | `CLAUDECODE_EXPERIMENTAL_MARKDOWN=true` |

完整列表见 [03-config.md](03-config.md) env 段。

## 工具调用 hook 顺序

```
[tool.definition]    → 注册时
─ user prompt ─
[tool.execute.before] → 每次调用前 (= PreToolUse)
─ 实际执行 ─
[tool.execute.after]  → 每次调用后 (= PostToolUse / PostToolUseFailure)
```

详见 [10-hooks.md](10-hooks.md)。
