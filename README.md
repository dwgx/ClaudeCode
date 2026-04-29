# JeeBacode

> 个人定制版终端编码 agent CLI。基于 [opencode](https://github.com/anomalyco/opencode) 二次开发，融合 [claude-code-router](https://github.com/musistudio/claude-code-router) 的多 Provider 路由、[Citadel](https://github.com/SethGammon/Citadel) 的 `/do` 编排、以及精选自 [SuperClaude](https://github.com/SuperClaude-Org/SuperClaude_Framework) / [claude-skills](https://github.com/alirezarezvani/claude-skills) 等社区资源的命令、skill 与 sub-agent。
>
> **此项目与 Anthropic PBC 无任何隶属、合作或背书关系。** "Claude" / "Claude Code" 是 Anthropic 的商标，本仓库使用同名仅出于技术研究目的。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: Alpha](https://img.shields.io/badge/Status-Alpha-orange.svg)](#状态)

## 它是什么

把官方 Claude Code 体验重新组装一份完全可控的版本：
- **核心 agent runtime**：fork 自 opencode（Bun + TypeScript + SolidJS TUI）
- **多模型路由**：吸收 claude-code-router——按 token 量 / 任务类型 / 子代理标签自动选模型
- **`/do` 智能编排**：吸收 Citadel——意图分发、平行 agent fleet、campaign 持久化
- **精选官方插件包**：自带一组从 SuperClaude / claude-skills 等精挑细选并重写过的 commands / skills / sub-agents
- **协议双向兼容**：保留对 Anthropic Claude Code `.claude-plugin/`、`skills/`、hook events 的兼容，现有插件无需改动直接能跑

## 它不是什么

- 不是 Anthropic 出品
- 不是官方 Claude Code 的源代码（官方 CLI 不开源）
- 不打算自动 1:1 同步官方版本特性
- 不接受秘密 / 凭据 / 任何个人私有内容入仓

## 快速开始

```bash
git clone https://github.com/dwgx/ClaudeCode.git
cd ClaudeCode
pnpm install
bash scripts/git-hooks/install.sh        # 启用 hook 保护
pnpm dev                                  # 启动开发版
```

详见 [docs/02-quickstart.md](docs/02-quickstart.md)。

## 目录速览

```
README.md              本文件
LICENSE                MIT
NOTICE.md              第三方归属
SECURITY.md            漏洞披露
CONTRIBUTING.md        贡献指南（个人项目，简化版）
.gitignore             私有路径锁
docs/                  分级文档
  00-overview.md       项目愿景
  01-architecture.md   架构
  02-quickstart.md     5 分钟跑通
  03-config.md         配置
  04-tools.md          内建工具
  05-skills.md         Skill 系统
  06-agents.md         Sub-agent 系统
  07-routing.md        模型路由
  08-plugins.md        插件协议
  09-mcp.md            MCP 集成
  10-hooks.md          Git/Lifecycle hook
  11-development.md    开发流程
  12-roadmap.md        路线图
  13-privacy.md        隐私边界（重要）
  14-subagent-dispatch.md  子代理调度规则
  decisions/           ADR
src/                   核心代码（来自 opencode 改造）
plugins-builtin/       自带精选插件
skills/                自带精选 skill
scripts/               git-hooks / codex-prompts / 工具脚本
private/               【gitignored】个人私有内容
ReferenceSource/       【gitignored】第三方源码本地参考
```

## 状态

**Alpha。** 仓库刚建好，src/ 还在从 opencode 移植中。所有命令/插件/skill 列表会随移植进度持续填充。

## 隐私边界（必读）

`private/`、`memory/`、`ReferenceSource/`、所有 `CLAUDE.md` / `AGENTS.md` 在仓内一律被 `.gitignore` 锁住，并由 `scripts/git-hooks/pre-commit` 二次拦截。详见 [docs/13-privacy.md](docs/13-privacy.md)。

## License

MIT。各上游归属见 [NOTICE.md](NOTICE.md)。
