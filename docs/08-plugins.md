# 08 · 插件系统

> **状态：占位 stub**。最终细节由 `catalog-opencode.md` + 对官方 `.claude-plugin/` 协议的兼容性测试后定。

## 兼容目标

ClaudeCode 兼容 Anthropic Claude Code 的插件协议：

```
plugins/
└── <plugin-name>/
    ├── .claude-plugin/
    │   └── plugin.json       ← manifest
    ├── skills/               ← 该插件提供的 skill
    ├── agents/               ← 该插件提供的 sub-agent
    ├── commands/             ← 该插件提供的 slash 命令
    └── hooks/                ← 该插件提供的生命周期 hook
```

落地后社区现有插件直接 drop-in 即可。

## 加载方式

- `plugins-builtin/` — 仓内自带
- `~/.claudecode/plugins/` — 用户全局装
- `<repo>/.claudecode/plugins/` — 项目级装
- 通过 marketplace（GitHub repo）安装

## Marketplace

不做中央注册表，直接复用 GitHub：
```
claudecode plugin install github:owner/repo
```
读取目标 repo 的 `claudecode-marketplace.json` manifest。

## 待填章节

- [ ] plugin.json 完整 schema
- [ ] hook events 列表与 payload
- [ ] marketplace.json schema
- [ ] 装/卸/升级 CLI
- [ ] 沙箱与权限模型
