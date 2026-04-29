# 09 · MCP 集成

> **状态：占位 stub**。最终细节由 `catalog-opencode.md` 输出后填（opencode 已有完整 MCP 客户端实现）。

## 概念

[MCP (Model Context Protocol)](https://modelcontextprotocol.io/) 是 Anthropic 提的 LLM ↔ 工具/资源的标准协议。ClaudeCode 作为 MCP **客户端**，可以连接任意 MCP **服务器**。

## 计划

- 兼容官方 Claude Code 的 MCP 配置位置（`~/.claude/mcp.json`）
- 同时支持 opencode 自家的 MCP 入口
- 提供 `claudecode mcp list/add/remove/test` 子命令
- 推荐预设：context7、playwright、tavily、blender、sequential、serena ...（参考 SuperClaude 的清单）

## 待填章节

- [ ] MCP 配置 schema
- [ ] 内置/推荐 MCP 服务器清单
- [ ] 自定义 MCP server 模板
- [ ] 安全：哪些 MCP 工具默认 auto-allow
