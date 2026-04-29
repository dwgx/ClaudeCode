# ADR-0010：自带 skill 库的扩充策略

- 状态：🟡 草案
- 日期：2026-04-30
- 决策者：Claude Code 主脑

## 背景

ADR-0006 已确定 v0.1 第一批内置 skill/agent/mode 精选自 SuperClaude，包括 `confidence-check`、`self-check`、`repo-index`、`troubleshoot`、`research`、`brainstorm`、`spec-panel`、`quality-test`、`pm-lite` 等。

本 ADR 只决定是否在这批基础上继续扩充 5-10 个 skill。候选源：

| 来源 | license | 当前验证结果 |
|---|---|---|
| `wshobson/claude-skills` | 未确认 | GitHub API 当前返回 404；疑似已迁移/合并 |
| [wshobson/agents](https://github.com/wshobson/agents) | MIT | 可访问；README 写 150 skills，本次 tree 看到 152 个 `SKILL.md` |
| [obra/superpowers](https://github.com/obra/superpowers) | MIT | 可访问；14 个顶层 `skills/*/SKILL.md` |
| SuperClaude catalog | MIT | ADR-0006 已吸收最高价值部分；本 ADR 不再重复扩大 |

## 决策

**再扩充 8 个内置 skill；其余保留 marketplace。**

新增 skill 必须走“重写优先、少量直接搬运”的策略：保留上游协议思想，但把触发条件、工具权限、输出格式改成 ClaudeCode 风格。

### 建议自带

| skill | 来源 | 处理 | 理由 |
|---|---|---|---|
| `adr-writer` | wshobson `architecture-decision-records` | PORT-lite | 本仓已经 ADR 驱动；通用、低风险、可直接提升决策记录质量 |
| `code-review-excellence` | wshobson | PORT-lite | 补足 self-check 之外的 PR/review 结构化审查 |
| `openapi-spec-generation` | wshobson | PORT-lite | SDK/API adapter 会需要契约输出和回归对照 |
| `dependency-upgrade` | wshobson | PORT-lite | v0.x 迁移 opencode/CCR/SuperClaude 时会频繁处理 breaking change |
| `secrets-management` | wshobson | PORT-lite | 配置、CI、provider key、plugin marketplace 都需要默认安全基线 |
| `threat-modeling-stride` | wshobson `stride-analysis-patterns` | PORT-lite | 与用户安全工程场景匹配；默认输出防御性威胁模型 |
| `llm-evaluation` | wshobson | INSPIRE/PORT-lite | ClaudeCode 自身有 router/model/agent 评估需求；先做轻量 eval plan |
| `tdd` | obra `test-driven-development` | PORT-lite | 弥补 `quality-test` 偏测试质量、不是红绿重构流程的问题 |

### 留给 marketplace

| skill/类别 | 原因 |
|---|---|
| obra `systematic-debugging` | 与 `troubleshoot` 重叠；可把 root-cause-tracing 思想并入现有 skill |
| obra `verification-before-completion` | 与 `self-check` 重叠；作为 self-check 增强而非新 skill |
| obra `dispatching-parallel-agents` / `subagent-driven-development` | 与 ADR-0005 fleet/PM-lite 重叠；编排应在 runtime，不在 prompt 里重复实现 |
| obra `using-git-worktrees` / `finishing-a-development-branch` | git/worktree 行为受 ClaudeCode coordinator 控制，不让 skill 自行驱动 |
| wshobson 语言/框架技能包 | Python/TS/K8s/RAG/UI 等按项目安装；全内置会变成长尾 marketplace |
| wshobson `accessibility-compliance` | 价值高但偏前端产品；默认不适合 terminal-first 核心 |
| wshobson `security-requirement-extraction` | 与 STRIDE skill 配套，先放 marketplace，等安全包成套后再评估 |

## 取舍

| 方案 | 利 | 弊 |
|---|---|---|
| **新增 8 个通用 skill（采纳）** | 覆盖 ADR/API/review/security/upgrade/TDD/LLM eval；不显著膨胀默认库 | 仍需逐个重写和做触发测试 |
| 只保留 ADR-0006 的 10 个 | 默认最瘦 | 缺 API/security/upgrade/TDD 等高频工程能力 |
| 大量导入 wshobson/obra | 能力面广 | prompt 体量、触发噪音、license attribution 和质量审计成本高 |

## 后果

- `plugins-builtin/skills/` 从第一批约 10 个扩到约 18 个。
- Router Tier 2 需要为新增 skill 增加触发关键词，但默认必须保守：安全/升级/API/TDD 类只在明确命中时加载。
- 需要新增 skill fixture：frontmatter parse、trigger match、permission allowlist、sample output。
- `docs/05-skills.md` 与 `docs/builtin-skills.md` 需要区分“core builtin”和“marketplace recommended”。

## attribution（如有搬运）

直接搬运上游 `SKILL.md` 或 references 时，Markdown 文件顶部加：

```markdown
<!-- SPDX-License-Identifier: MIT -->
<!-- Adapted from <owner>/<repo> (MIT) -->
<!-- Source: <upstream path/url> -->
<!-- Modifications: ClaudeCode trigger/tools/output/compat changes -->
```

每个 skill 目录必须包含 `ATTRIBUTION.md`：上游 repo、commit 或访问日期、license、搬运文件列表、改写摘要。若只借鉴结构并重写文本，仍写 attribution，但不需要逐文件 SPDX 头。
