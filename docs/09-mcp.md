# 09 · MCP 集成

[MCP (Model Context Protocol)](https://modelcontextprotocol.io/) 是 Anthropic 提的 LLM ↔ 工具/资源标准协议。ClaudeCode 作为 MCP **客户端**，可连接任意 MCP **服务器**。

## 实现位置

来自 opencode：
- 客户端：`packages/opencode/src/mcp/index.ts`
- 配置 schema：`packages/opencode/src/config/mcp.ts`
- CLI 管理命令：`packages/opencode/src/cli/cmd/mcp.ts`（`mcp list/auth/logout/debug/add` 等）

## 配置位置

```
全局：$xdgConfig/claudecode/mcp.json
项目：<repo>/.claudecode/mcp.json   (优先)
```

兼容 Anthropic Claude Code 配置位置：扫 `~/.claude/mcp.json`（可关）。

## 连接方式

### 1. local stdio

```jsonc
{
  "mcpServers": {
    "context7": {
      "type": "local",
      "command": ["npx", "-y", "@upstash/context7-mcp"],
      "environment": { "CONTEXT7_API_KEY": "$CONTEXT7_API_KEY" },
      "enabled": true,
      "timeout": 30000
    }
  }
}
```

用 `StdioClientTransport`，cwd 是当前 instance directory。

### 2. remote HTTP / SSE

```jsonc
{
  "mcpServers": {
    "tavily": {
      "type": "remote",
      "url": "https://mcp.tavily.com/v1",
      "headers": { "Authorization": "Bearer $TAVILY_API_KEY" },
      "oauth": false,
      "enabled": true,
      "timeout": 60000
    }
  }
}
```

先试 `StreamableHTTPClientTransport`，再 fallback 到 `SSEClientTransport`。

### 3. OAuth dynamic client registration

设 `"oauth": true` 自动走 OAuth flow 并存储 token；不需要手动管理 client_id/secret。

## 工具命名

MCP 服务器暴露的工具按 `<server>_<tool>` 形式 sanitize 后并入统一 AI SDK tool set。

```
context7_search-docs        → context7 server 的 search-docs 工具
playwright_browser_click   → playwright server 的 browser_click 工具
```

## CLI 命令

```bash
claudecode mcp list                     # 列出已配置 server
claudecode mcp add <name> <command>     # 交互式添加
claudecode mcp remove <name>
claudecode mcp test <name>              # 测试连接 + 工具发现
claudecode mcp auth <name>              # OAuth login
claudecode mcp logout <name>
claudecode mcp debug <name>             # 显示通信日志
```

## 推荐 MCP server 清单

参考 SuperClaude 的 8 个 core servers + 我们的扩展：

### 默认推荐（直接价值高）

| MCP | 用途 | 默认安装？ |
|---|---|---|
| `context7` | 官方库文档查询（防止 LLM 幻觉过期 API） | ✅ |
| `playwright` | 浏览器自动化、E2E、可视验证 | ✅ |
| `repo-index` | 大仓索引 + briefing | ✅（自带） |

### 增强（按需）

| MCP | 用途 |
|---|---|
| `tavily` | Web search / 实时信息 |
| `serena` | 语义代码理解、project memory |
| `chrome-devtools` | 浏览器性能分析 |
| `sequential-thinking` | 多步推理（模型内建若不足时补充） |
| `mindbase` | 跨 session 记忆 |

### 不默认

| MCP | 原因 |
|---|---|
| `magic` | UI 组件生成；按需启用 |
| `morphllm-fast-apply` | 大规模 pattern transform；高风险 |

## tool 输出转换

MCP 返回的多种类型自动转换为 ClaudeCode 工具输出格式：

| MCP 类型 | ClaudeCode 输出 |
|---|---|
| text | tool result 文本 |
| image | attachment + data URL |
| resource | attachment + resource link |
| structured | tool result + JSON |

## 安全 / 权限

- 每个 MCP server 启用前需用户确认（或 config 显式 `enabled: true`）
- OAuth token 存储在 OS keychain（macOS Keychain / Windows Credential Manager / Linux Secret Service）
- HTTP headers / env 中的 secret 在日志中按 `***` 打码（详见 [13-privacy.md](13-privacy.md)）
- remote server 默认 timeout 60s，可在 config 调

## 默认 auto-allow 列表

只读类工具默认 auto-allow：
- `*_search`、`*_query`、`*_get`、`*_list`、`*_browse`、`*_fetch`、`*_read`

写类工具默认 ask：
- `*_create`、`*_update`、`*_delete`、`*_set`、`*_write`、`*_execute`

可在 config.permission 自定义。

## 自定义 MCP server 模板

将来在 `examples/mcp-server-template/` 提供（v0.2）：
- TypeScript / Bun
- 实现 `tools/list`、`tools/call`、`resources/list`、`resources/read`
- 自动 manifest 生成

## 实例：完整配置

```jsonc
// .claudecode/mcp.json
{
  "$schema": "https://claudecode.dwgx.dev/schema/mcp.json",
  "mcpServers": {
    "context7": {
      "type": "local",
      "command": ["npx", "-y", "@upstash/context7-mcp"]
    },
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp@latest"]
    },
    "tavily": {
      "type": "remote",
      "url": "https://mcp.tavily.com/v1",
      "headers": { "Authorization": "Bearer $TAVILY_API_KEY" }
    }
  }
}
```
