# ADR-0006：内置 skill / agent / mode 精选清单（v0.1）

- 状态：✅ 已采纳
- 日期：2026-04-30
- 决策者：Claude Code 主脑（基于 codex catalog `_codex-out/superclaude-catalog.md`）

## 背景

SuperClaude_Framework v4.3 提供 30 commands / 20 agents / 7 modes / 1 skill (confidence-check) / PM Agent 三件套。需要从中精选可移植部分进 `plugins-builtin/`，不直接用 Python 安装器。

awesome-claude-code-subagents 与 claude-skills 的精选放在后续 ADR。

## 决策

### v0.1 PORT（重写并入 plugins-builtin/）

**最高优先（top-10）**：

| 来源 | ClaudeCode 内 | 类型 | 备注 |
|---|---|---|---|
| `confidence-check` | `plugins-builtin/skill-confidence-check/` | Skill | 阈值保留 ≥0.90 / 0.70-0.89 / <0.70；触发条件改为按风险（安全/架构/依赖/API 变更强制，小修可跳过） |
| `SelfCheckProtocol` | `plugins-builtin/skill-self-check/` | Skill | 4 问 + hallucination 红旗；作为实现/修复任务默认收尾闸门 |
| `ReflexionPattern` | `plugins-builtin/skill-reflexion-lite/` | Skill | 错误学习；**改成透明可关闭**，落盘位置可配 |
| `/sc:index-repo` + `repo-index` | `plugins-builtin/skill-repo-index/` | Skill+Agent | 大仓 token 压缩 + 接手 briefing |
| `/sc:troubleshoot` + `root-cause-analyst` | `plugins-builtin/skill-troubleshoot/` | Skill+Agent | 证据驱动调试 |
| `/sc:research` + `deep-research-agent` + `MODE_DeepResearch` | `plugins-builtin/skill-research/` | Skill+Agent+Mode | 深度 research，confidence/citation |
| `/sc:brainstorm` + `requirements-analyst` + `MODE_Brainstorming` | `plugins-builtin/skill-brainstorm/` | Skill+Agent+Mode | 模糊需求 → specs |
| `/sc:spec-panel` | `plugins-builtin/skill-spec-panel/` | Skill | 多专家规格评审 |
| `/sc:test` + `quality-engineer` + `self-review` | `plugins-builtin/skill-quality-test/` | Skill+Agent | 测试质量闭环 |
| `/sc:pm-lite` | `plugins-builtin/skill-pm-lite/` | Skill | **只取协议，不取常驻人格 + 全局写入**——拒绝 always-active 模式 |

**其它高价值 PORT**：
- agents: `pm-agent`(lite)、`deep-research-agent`、`security-engineer`、`refactoring-expert`、`performance-engineer`、`requirements-analyst`、`technical-writer`、`self-review`
- skills: `MODE_Task_Management`（分层任务+checkpoint）

### v0.1 INSPIRE（不直接 PORT，参考设计）

- `MODE_Orchestration` —— 工具选择矩阵；改成内部 routing heuristics
- `/sc:select-tool` —— 同上，内部化
- `MODE_Token_Efficiency` —— 仅吸收"低上下文压缩"策略，不照搬 emoji 样式
- `business-panel-experts`、`socratic-mentor` —— 可作为可选模板
- `/sc:explain`、`/sc:design`、`/sc:document` —— 简单提示词，自行重写

### v0.1 SKIP

- ❌ `/sc:git` —— 与本仓 git 安全边界冲突（提交人锁定 dwgx，sub-agent 禁 git）
- ❌ `/sc:help`、`/sc` dispatcher —— Python 安装器时代产物
- ❌ `/sc:recommend` —— 1005 行提示词路由器过重
- ❌ `/sc:load` + `/sc:save` —— 强依赖 Serena memory；本仓有自己的 memory
- ❌ SuperClaude `SessionStart` shell hook —— 自动 shell 容易隐式读写全局状态

## PM Agent 三件套（重要）

| 件 | 处理 |
|---|---|
| ConfidenceChecker（5 项 weighted gate） | PORT，但**不每任务强制**——只对安全/依赖/架构/跨模块/大文件/多 agent 任务强制 |
| SelfCheckProtocol（4 问 + 红旗） | PORT，作为默认收尾闸门 |
| ReflexionPattern（错误学习） | PORT-lite，落盘位置可配，默认透明可关闭 |

不照搬 SuperClaude 的 `pm-agent.md` 692 行常驻人格 + 全局文档写入模式。

## 取舍

| 方案 | 利 | 弊 |
|---|---|---|
| **精选 + 重写（采纳）** | 控制质量、契合本仓 hook/agent API、对齐 license | 工作量大 |
| 全量 PORT | 拥有全部能力 | 大量未审的提示词、Python 安装器无意义、`/sc:*` 命名空间冲突 |
| 不 PORT 任何 | 极简 | 浪费已存在的成熟工程实践 |

## 后果

- `plugins-builtin/` 第一批约 10 个 skill + 10 个 agent + 3 个 mode
- 每个 skill 自带 `ATTRIBUTION.md`（指向 SuperClaude_Framework + commit + LICENSE）
- 不引入 SuperClaude 的全局自动行为；ClaudeCode 默认行为由本仓主导

## 后续 ADR

- ADR-0009：从 `awesome-claude-code-subagents` 精选 sub-agent
- ADR-0010：从 `claude-skills` / `claude-code-plugins-plus-skills` 精选 skill
