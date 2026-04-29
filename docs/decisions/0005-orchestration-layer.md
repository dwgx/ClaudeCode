# ADR-0005：编排层设计吸收自 Citadel

- 状态：✅ 已采纳
- 日期：2026-04-30
- 决策者：Claude Code 主脑（基于 codex catalog `_codex-out/citadel-catalog.md`）

## 背景

需要一个 `/do` 风格的智能编排层：意图分发 + 平行 agent fleet + campaign 持久化。[Citadel](https://github.com/SethGammon/Citadel) (MIT) 已实现一套完整方案。

## 决策

**核心抽象 ABSORB（重写）；envelope 与 schema ABSORB（直接搬）；高阶资源 INSPIRE 或 SKIP**。

### `/do` 路由（重写）

吸收 Citadel 的 cheap-first cascade，但不直接搬 markdown protocol —— 实现成代码：
- **Tier 0** — pattern match（无模型调用）：typecheck / build / test / status / typo / rename / commit / rollback
- **Tier 1** — active state short-circuit：读 active campaign / fleet session，`continue` 时恢复
- **Tier 2** — keyword match：触发表数据化（不塞在 `/do` 文档里），高置信单 skill 直接 invoke；多 skill 命中进入 LLM classifier
- **Tier 3** — LLM complexity classifier（~500 tokens）：输出 `SCOPE / COMPLEXITY / INTENT / REQUIRES_PERSISTENCE / REQUIRES_PARALLEL`
- proportionality check：短输入降级 / single-file 禁 fleet / budget > $50 需确认

### Skill 协议（直接搬 + 增强 YAML 解析）

`SKILL.md` frontmatter 与 5-section body 简单可移植：
- required: `name`, `description`, `user-invocable`
- optional: `auto-trigger`, `last-updated`, `trigger_keywords`
- 标准段：`Identity` / `Orientation` / `Protocol` / `Quality Gates` / `Exit Protocol`
- ⚠ 增强 YAML list 解析（Citadel 自身解析能力有限）

### Agent 角色（重写）

frontmatter：`name`, `description`, `model`, `maxTurns`, `effort`, `tools` (allowlist), `disallowedTools` (denylist), `skills` (loadable)。  
重写以契合本仓 spawn API。

### Fleet（重写 work queue + 直接搬 discovery JSONL）

- work queue + wave (2-3 agents/wave) + discovery relay：核心资产，重写
- discovery 持久化：`.planning/discoveries/YYYY-MM-DD.jsonl`，schema `{session, agent, wave, scope, status, handoff_items, decisions, files_touched, failures}` —— 直接搬
- worktree 隔离：INSPIRE，但不让 sub-agent 自由 git；coordinator 外部管理

### Hook events（capability detection 生成，不静态）

实测 14 events / 22 entries / 15 normalized event ids（**不是 README 写的 28**）：

| event | 触发 | profile |
|---|---|---|
| SessionStart | session 开始（含 compact 恢复） | safe |
| PreToolUse | tool 前 | safe |
| PostToolUse | tool 后 | safe |
| PostToolUseFailure | tool 失败 | safe |
| PreCompact | compact 前 | safe |
| PostCompact | compact 后 | latest（≥2.1.76） |
| Stop | session stop | safe |
| StopFailure | stop 失败 | latest（≥2.1.78） |
| SessionEnd | session 结束 | safe |
| SubagentStop | subagent 结束 | safe |
| TaskCreated | task 创建 | latest（≥2.1.84） |
| TaskCompleted | task 完成 | latest（≥2.1.83） |
| WorktreeCreate | worktree 创建 | latest（≥2.1.84） |
| WorktreeRemove | worktree 删除 | latest（≥2.1.84） |
| UserPromptSubmit | 用户 prompt 提交 | normalized only（template 未安装） |

#### Common envelope（直接搬）

```js
{
  event_id, runtime, native_event_name, timestamp,
  session_id, turn_id, cwd, transcript_path,
  model, tool_name, tool_input, raw
}
```

### Campaign 持久化（直接搬 markdown，重写 parser）

- `.planning/campaigns/{slug}.md`，phase: research/plan/build/wire/verify/prune
- sections: Claimed Scope / Phases / Feature Ledger / Decision Log / Active Context / Continuation State
- 跨 session 恢复：`/do continue` Tier 1 查 active campaign

### Routine quota（重写为本地 runner）

- `/watch` → 本地 poll runner
- `/daemon` → subprocess 循环
- `/schedule` → OS cron / Task Scheduler
- `/loop` → 前台 session 或后台 daemon
- 默认 local，避免 Anthropic Claude Code 的 15/24h routine quota

### 跳过

- ❌ Worktree pool V4（Citadel 自身未实现）
- ❌ 直接搬 Codex runtime adapter（按本仓 capability 重做）

## 取舍

| 方案 | 利 | 弊 |
|---|---|---|
| **吸收 Citadel 设计 + 重写（采纳）** | 设计成熟、避坑明显、协议可控 | 工作量大 |
| Fork Citadel 整套 | 起步最快 | docs 与实现漂移；Codex adapter 实现 partial；事件版本管理复杂 |
| 自创 | 完全自由 | 数月起步 |

## 后果

- 编排层独立于 runtime，可发到本仓或第三方使用
- hook events 与 Anthropic Claude Code 上游版本号绑定，capability detection 必须正确
- discovery 协议成为我们事实上的"知识总线"

## attribution

直接搬的文件（如 normalize-event.js、discovery-writer.js schema）头部加：
```
// SPDX-License-Identifier: MIT
// Adapted from Citadel (MIT)
//   © 2026 Seth Gammon - https://github.com/SethGammon/Citadel
```
