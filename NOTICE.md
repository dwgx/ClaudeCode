# NOTICE — 第三方代码与归属

ClaudeCode 项目本身按 MIT 授权。它在以下上游开源项目的基础上构建或受其启发，必要时保留每个上游对应的 LICENSE 文件副本与原作者署名。

## 直接复用代码（保留 LICENSE）

### opencode
- 仓库: https://github.com/anomalyco/opencode
- 提交: `a3f7ea25551d9d206d947d4d0a16739609208fb0` (branch `dev`)
- License: **MIT** © 2025 opencode
- 用途: 终端编码 agent 的基线代码（src/ 层）
- LICENSE 副本: `src/LICENSE-opencode` (落地后写入)

## 设计借鉴 / 选择性移植（按需保留 attribution）

### Citadel
- 仓库: https://github.com/SethGammon/Citadel
- License: **MIT** © 2026 Seth Gammon
- 借鉴: `/do` 意图路由、parallel fleet、campaign 持久化、hook 安装模式
- 落地: `docs/decisions/0005-orchestration-layer.md` 标注 attribution

### claude-code-router
- 仓库: https://github.com/musistudio/claude-code-router
- License: **MIT** © 2025 musistudio
- 借鉴: 多 Provider 路由、transformer 系统、token-based scenario routing、preset
- 落地: `docs/decisions/0004-routing-layer.md` 标注 attribution

### SuperClaude_Framework
- 仓库: https://github.com/SuperClaude-Org/SuperClaude_Framework
- License: **MIT** © 2024 SuperClaude Framework Contributors
- 借鉴: 命令/agent/mode 命名约定与精选列表（不直接搬代码，只重写）
- 落地: `docs/decisions/0006-builtin-skills.md` 标注 attribution

### claude-code-plugins-plus-skills
- 仓库: https://github.com/jeremylongshore/claude-code-plugins-plus-skills
- License: **MIT** © 2025 Jeremy Longshore
- 借鉴: 部分 skill / plugin 设计；各 skill 单独评估其 LICENSE 后才会移植
- 落地: 移植任何 skill 时在该 skill 目录写入 `ATTRIBUTION.md`

### claude-skills
- 仓库: https://github.com/alirezarezvani/claude-skills
- License: **MIT** © 2025 Alireza Rezvani
- 借鉴: 同上

### awesome-claude-code-subagents
- 仓库: https://github.com/VoltAgent/awesome-claude-code-subagents
- License: **MIT** © 2025 VoltAgent
- 借鉴: 部分 sub-agent 设计；移植前单独评估

## 仅作引用，不复制内容

### awesome-claude-code
- 仓库: https://github.com/hesreallyhim/awesome-claude-code
- License: **CC BY-NC-ND 4.0** © 2025 hesreallyhim
- 限制: 禁商用、禁改、禁衍生 → **不复制任何内容**，只在 README / 文档中以链接方式引用

### Anthropic Claude Code (官方)
- 仓库: https://github.com/anthropics/claude-code
- License: **Anthropic 商业条款，All Rights Reserved**
- 限制: 不复制代码；公开协议（plugin format / hook events / skill format）作为兼容目标参考
- ClaudeCode 项目与 Anthropic PBC **无任何隶属、合作或背书关系**

## 商标声明

"Claude" 与 "Claude Code" 是 Anthropic PBC 的商标。本仓库名 `ClaudeCode` 仅供个人技术研究/二次开发使用，**不代表官方产品**，不得用于暗示与 Anthropic 的关联。

如 Anthropic 提出商标关切，仓库主理人 dwgx 将在合理时间内调整命名。

## 第三方动态依赖

通过 `package.json` 引入的运行时依赖按各自 LICENSE 处置；执行 `pnpm licenses list` 可生成完整清单。
