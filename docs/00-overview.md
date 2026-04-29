# 00 · 项目总览

## 一句话

**ClaudeCode** = 一份个人定制的、可控的、跨平台的终端编码 agent CLI，把 opencode 的 runtime + claude-code-router 的多模型路由 + Citadel 的 `/do` 编排 + 社区精选 skill/agent 缝合成一套完整方案。

## 与官方 Claude Code 的关系

| 维度 | 官方 Claude Code | ClaudeCode（本项目） |
|---|---|---|
| 出品方 | Anthropic PBC | dwgx 个人项目 |
| 源码 | 闭源（npm 包内仅有混淆 dist） | MIT，完全开源 |
| 模型 | 仅 Anthropic | 任意 Provider（Anthropic / OpenAI / DeepSeek / Gemini / Ollama / 自托管 / ...） |
| 插件协议 | `.claude-plugin/`、`skills/`、hook events | **协议级兼容**——现有官方插件直接能跑 |
| Sub-agent | `~/.claude/agents/` | 兼容 + 自带 Citadel 风格 fleet |
| 路由 | 单模型 | scenario 路由（默认 / 思考 / 长上下文 / 后台 / web 搜索 / 图像） |
| `/do` 编排 | 无 | 有（来自 Citadel） |
| TUI | 自家 | opentui/solid（来自 opencode） |

## 设计原则

1. **可读 > 抽象**：保持代码扁平，能 200 行不写 500 行（Karpathy）
2. **协议兼容 > 自创**：能用官方协议就用官方协议，绝不自创不兼容方言
3. **隐私优先**：`private/` 与公开仓物理隔离，三层 hook 保护
4. **本地优先**：所有状态默认在本机，不上报匿名遥测
5. **子代理外包**：重型任务交给本地 codex / gemini CLI，主仓库主进程保持瘦身

## 角色

- **dwgx**：仓库主理人 / 唯一 commit 作者 / 决策者
- **Claude Code**（即本会话）：项目主脑 / 架构 / 协调 / 文档 / git
- **codex-spark**：低延迟批处理 sub-agent
- **codex-deep / gemini-deep**：长文件读 + 长代码生成 sub-agent

## 不做什么

- 不做 SaaS / 云服务
- 不收集任何用户数据
- 不做 Marketplace 的中央注册表（直接复用 GitHub）
- 不引入二进制混淆 / DRM / 反调试
- 不与官方 Anthropic Claude Code 抢 npm 包名

## 路线图速览

详见 [12-roadmap.md](12-roadmap.md)。当前阶段：**0.0.1 骨架完成 → 等待 src/ 移植**。
