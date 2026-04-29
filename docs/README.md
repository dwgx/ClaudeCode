# docs/

ClaudeCode 分级文档。

| 文件 | 作用 | 状态 |
|---|---|---|
| [00-overview.md](00-overview.md) | 项目愿景 / 与官方的关系 | ✅ |
| [01-architecture.md](01-architecture.md) | 架构（含 ingest keep/drop 表 + 数据流 + 进程模型） | ✅ |
| [02-quickstart.md](02-quickstart.md) | 5 分钟跑通（alpha，src/ 移植后扩充） | 🟡 |
| [03-config.md](03-config.md) | 配置（schema 草案 + env 变量 + 加载顺序） | ✅ |
| [04-tools.md](04-tools.md) | 内建工具（17 个） | ✅ |
| [05-skills.md](05-skills.md) | Skill 协议 + 自带 10 个 | ✅ |
| [06-agents.md](06-agents.md) | Sub-agent 协议 + 自带 11 个 | ✅ |
| [07-routing.md](07-routing.md) | 6 scenario 路由 + transformer chain | ✅ |
| [08-plugins.md](08-plugins.md) | 插件协议双向兼容 + marketplace | ✅ |
| [09-mcp.md](09-mcp.md) | MCP 集成 + 推荐清单 | ✅ |
| [10-hooks.md](10-hooks.md) | Git hook + lifecycle hook | ✅ |
| [11-development.md](11-development.md) | 开发流程 | ✅ |
| [12-roadmap.md](12-roadmap.md) | 路线图 | ✅ |
| [13-privacy.md](13-privacy.md) | 隐私边界（必读） | ✅ |
| [14-subagent-dispatch.md](14-subagent-dispatch.md) | sub-agent 调度规则 | ✅ |
| [decisions/](decisions/) | ADR-0001~0008 已写 | ✅ |

## 阅读顺序建议

- 第一次读：00 → 13 → 14 → 11 → 02
- 想理解架构：01 → 07 → 05/06/08
- 想动手贡献：11 → 13 → ADR/0001~0008
- 维护文档：找对应章节直接改；改动决策同时写一条 ADR

## 状态说明

✅ = 内容完整  
🟡 = 部分完整或 alpha 阶段  
🔴 = 仅占位
