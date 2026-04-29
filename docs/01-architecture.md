# 01 · 架构

> **状态：占位 stub**。这一节的实质内容（组件图、数据流、模块清单）依赖 Codex catalog 任务的输出（详见 [Task #6 → Task #7](#)），将在 src/ 移植后由主脑综合 4 份 catalog 填入。

## 高层视图（最终目标）

```
┌─────────────────────────────────────────────────────────────┐
│                        ClaudeCode CLI                       │
├─────────────────────────────────────────────────────────────┤
│  TUI (opentui/solid)                                        │
│  ────────────────────────────────────────────────────────── │
│  Orchestration Layer  ← Citadel /do, parallel fleet         │
│  ────────────────────────────────────────────────────────── │
│  Routing Layer        ← claude-code-router (transformers,   │
│                          scenario routing, presets)         │
│  ────────────────────────────────────────────────────────── │
│  Agent Runtime        ← opencode (sessions, tools, hooks)   │
│  ────────────────────────────────────────────────────────── │
│  Plugin / Skill Layer ← Anthropic-compatible loader         │
│  ────────────────────────────────────────────────────────── │
│  Provider Adapters    ← Anthropic / OpenAI / Gemini /       │
│                          DeepSeek / Ollama / 自托管         │
└─────────────────────────────────────────────────────────────┘
```

## 待填章节

- [ ] 组件分层（待 catalog-opencode 输出）
- [ ] 路由层模块（待 catalog-router 输出）
- [ ] 编排层模块（待 catalog-citadel 输出）
- [ ] 内置 skill / agent 列表（待 catalog-superclaude + catalog-citadel 输出）
- [ ] 数据流：从用户输入到模型响应
- [ ] 状态文件位置（per-project / 全局 / 私有）
- [ ] 进程模型（主进程 / TUI / sub-agent worker）

## 决策依据

详见 ADR：
- [0001-base-on-opencode.md](decisions/0001-base-on-opencode.md)
- [0004-routing-layer.md](decisions/0004-routing-layer.md)（待写）
- [0005-orchestration-layer.md](decisions/0005-orchestration-layer.md)（待写）
- [0006-builtin-skills.md](decisions/0006-builtin-skills.md)（待写）
