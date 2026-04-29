# ADR-0001：基线选 opencode

- 状态：✅ 已采纳
- 日期：2026-04-30
- 决策者：dwgx + Claude Code（主脑）

## 背景

要做一个"完美的 Claude Code 二次分发"，可选基线：

1. fork **opencode**（Bun/TS，MIT，完整 agent runtime + TUI + sdk + extensions + desktop）
2. 基于官方 `@anthropic-ai/claude-code` npm 包做 wrapper / harness
3. 从零写

## 决策

**采用方案 1：以 `ReferenceSource/opencode/` (commit a3f7ea25) 为代码基线**，本地拷贝进新仓 `dwgx/ClaudeCode`，**不**通过 GitHub 的 fork 机制建立 upstream 关系（因此不会有"100 commits behind"的累赘提示）。

保留 opencode 的 LICENSE 与所有原始 copyright header，并在 `NOTICE.md` 与 `src/LICENSE-opencode` 标注归属。

## 取舍

| 方案 | 利 | 弊 |
|---|---|---|
| **1. fork opencode（采纳）** | MIT 自由、完整 runtime、跨平台已就绪、社区活跃 | 体量大，需要做大量 rebrand / 精简 |
| 2. wrap 官方 npm | 体量小、行为最贴近官方 | 官方 CLI 不开源、闭源 dist 不可改造、Anthropic 商业条款限制再分发 |
| 3. 从零写 | 完全自由 | 几个月起步、质量风险高 |

## 后果

- 必须在 NOTICE.md / `src/LICENSE-opencode` 保留 opencode 原 LICENSE
- 必须保留 opencode 的 commit 信息或在 `CREDITS.md` 标识"derived from opencode @ a3f7ea25"
- 修改自由 + 商用自由 + 再分发自由（MIT）
- 与 Anthropic 官方 Claude Code 不存在代码层面的法律关系，但 brand 上需声明 unaffiliated

## 不做

- 不接受未标 attribution 的 opencode 代码搬运
- 不在 commit msg 中删 opencode 历史归属
- 不去 GitHub 上点 "Fork" 按钮（建独立 repo）
