# ADR-0009：自带 sub-agent 库的精选策略

- 状态：🟡 草案
- 日期：2026-04-30
- 决策者：Claude Code 主脑

## 背景

ClaudeCode v0.3 计划提供一批开箱即用的 sub-agent，但不能把社区 catalog 全量塞进 `plugins-builtin/`。候选上游是 [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) (MIT)。

本次调研读取了上游 README 与 `categories/` 一级目录。GitHub API 当前显示：

| 项 | 数据 |
|---|---:|
| license | MIT |
| 一级分类 | 10 |
| 本地 agent 定义文件 | 144 个（不含各分类 README） |
| README badge | `subagents-131+` |
| pushed_at | 2026-04-20 |
| updated_at | 2026-04-29 |

上游按 plugin 分桶安装：`voltagent-core-dev`、`voltagent-lang`、`voltagent-infra`、`voltagent-qa-sec` 等。ClaudeCode 的策略应是**内置高频通用角色，长尾按 plugin marketplace 安装**。

## 决策

**v0.3 自带 23 个 VoltAgent sub-agent；其余 121 个留给 `claudecode plugin install`。**

### 选取标准

| 标准 | 解释 |
|---|---|
| 覆盖度 | 覆盖日常代码、主流语言、基础设施、review/security、DX，而不是堆满单一领域 |
| 通用性 | 跨项目复用；不绑定行业、公司职能、特定云产品或冷门框架 |
| 维护活跃度 | 上游 repo 活跃、MIT；但单个 agent 仍需审 prompt、工具权限和 model frontmatter |
| 不重复 | ADR-0006 已有 SuperClaude `security-engineer`、`performance-engineer`、`technical-writer` 等时，不再收同名/近义角色 |
| 权限可控 | 默认最小 tools；review/audit 类只读，writer 类才给 Write/Edit |

### keep-list

| 分桶 | 内置 agent |
|---|---|
| Core Development | `api-designer`、`backend-developer`、`frontend-developer`、`ui-designer` |
| Language Specialists | `typescript-pro`、`python-pro`、`golang-pro`、`rust-engineer`、`sql-pro`、`powershell-7-expert` |
| Infrastructure | `devops-engineer`、`docker-expert`、`kubernetes-specialist`、`cloud-architect` |
| Quality & Security | `code-reviewer`、`debugger`、`security-auditor`、`test-automator` |
| Data & AI | `llm-architect` |
| Developer Experience | `documentation-engineer`、`dependency-manager`、`mcp-developer`、`legacy-modernizer` |

### drop-list

默认不内置、走 marketplace：

| drop 桶 | 处理 |
|---|---|
| 长尾语言/框架 | `java-architect`、`csharp-developer`、`php-pro`、`rails-expert`、`vue-expert`、`react-specialist`、`nextjs-developer` 等按项目安装 |
| 细分架构角色 | `fullstack-developer`、`microservices-architect`、`graphql-architect`、`websocket-engineer` 与 keep-list 重叠，默认不带 |
| 高风险主动测试 | `penetration-tester`、`chaos-engineer`、`ad-security-reviewer` 只允许用户显式安装并确认权限 |
| 业务/市场/法务 | `sales-engineer`、`content-marketer`、`legal-advisor`、`scrum-master`、`wordpress-master` 不属于 terminal-first 工程核心 |
| 专业行业域 | `healthcare-admin`、`fintech-engineer`、`quant-analyst`、`m365-admin`、`payment-integration`、`blockchain-developer`、`game-developer` 按需安装 |
| Meta 编排 | `agent-installer`、`multi-agent-coordinator`、`workflow-orchestrator` 与 ClaudeCode 自己的 fleet/PM-lite 重叠 |
| 外部工具条目 | README 中的 `airis-mcp-gateway`、`pied-piper`、`taskade` 是外链项目，不 vendoring 到 builtin |

## 取舍

| 方案 | 利 | 弊 |
|---|---|---|
| **精选 23 个内置（采纳）** | 首次使用就有关键角色；覆盖主流工程面；bundle 和权限面可控 | 仍要维护 prompt 审计与上游同步 |
| 全量内置 144 个 | 看起来能力最全 | 启动元数据膨胀、权限审计困难、长尾角色噪音大 |
| 全部 marketplace | 核心最瘦 | 新用户缺少可用默认值；fleet/agent demo 不完整 |

## 后果

- `plugins-builtin/agents/` 新增 23 个 agent，每个 agent 同时输出原生 manifest 与 Anthropic-compatible `.claude-plugin` 投影。
- Agent loader 需要支持同名冲突策略：项目级 > 用户级 > marketplace > builtin；builtin 内部不得与 ADR-0006 agent 重名。
- 每个内置 agent 必须有最小工具权限测试：review/audit agent 不得默认带 Write/Edit/Bash。
- 文档新增 `docs/builtin-agents.md`：列 keep-list、来源、权限、推荐 model tier。

## attribution（如有搬运）

直接改写或复制 VoltAgent agent prompt 时，目标 `.md` 顶部加：

```markdown
<!-- SPDX-License-Identifier: MIT -->
<!-- Adapted from VoltAgent/awesome-claude-code-subagents (MIT) -->
<!-- Source: https://github.com/VoltAgent/awesome-claude-code-subagents -->
<!-- Modifications: ClaudeCode frontmatter/tools/model/compat projection -->
```

每个 builtin agent 目录附 `ATTRIBUTION.md`，记录上游路径、license、同步日期、改动摘要。禁止搬运没有 MIT 归属的外链项目内容。
