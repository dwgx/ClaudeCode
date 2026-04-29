# 04 · 内建工具

> **状态：占位 stub**。最终列表由 `catalog-opencode.md` 输出后填。

ClaudeCode 提供给 LLM 的工具集，按官方 Claude Code 协议命名（保证插件兼容）。

## 预期内建工具（来自 opencode）

- `Read` — 读文件
- `Write` — 写文件
- `Edit` — 精确字符串替换
- `Glob` — glob 模式搜文件
- `Grep` — 内容搜索（ripgrep）
- `Bash` — 跑 shell
- `WebFetch` — 抓 URL
- `WebSearch` — 搜
- `Agent` — 起 sub-agent
- `Task*` — 任务编排（sub-agent 内）

## 待填

- [ ] 完整签名 + 入参 schema
- [ ] 与官方 Claude Code 工具的差异（如有）
- [ ] 自定义工具加载点
- [ ] 工具权限（auto-allow / ask / deny）
- [ ] 沙箱策略（macOS sandbox-exec / Windows job object / Linux bwrap？）
