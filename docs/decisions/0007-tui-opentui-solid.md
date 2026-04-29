# ADR-0007：TUI 沿用 opencode 的 `@opentui/solid`

- 状态：✅ 已采纳
- 日期：2026-04-30
- 决策者：Claude Code 主脑（基于 codex catalog `_codex-out/opencode-catalog.md`）

## 背景

需要为 ClaudeCode CLI 选 terminal UI 栈。候选：
1. `@opentui/core` + `@opentui/solid`（opencode 在用，SolidJS）
2. ink（React for CLI）
3. blessed（旧 OG）
4. 自写

## 决策

**沿用 `@opentui/core` + `@opentui/solid` + `solid-js`**（与 opencode 一致）。

## 理由

- opencode `packages/opencode/src/cli/cmd/tui/*` 已是完整可用实现，含 Windows 特化（`win32DisableProcessedInput`、Ctrl-C guard、Ctrl-Z undo 调整）
- SolidJS reactive 模型契合 streaming token / live tool result 场景
- 跨平台（Windows / macOS / Linux）已就绪
- 我们的基线就是 fork opencode（ADR-0001），换 TUI 等于重写 60K+ TS

## 取舍

| 方案 | 利 | 弊 |
|---|---|---|
| **opentui/solid（采纳）** | 已就绪、跨平台、Windows 路径已修复 | SolidJS + JSX 在终端的范式相对小众；调试链路较新 |
| ink | React 阵营熟、生态丰富 | 整体重写、丢失 opencode 已修过的 Windows 输入坑、丢 streaming patches |
| blessed | 经典稳定 | 老旧、维护少、缺少现代响应式组件模型 |
| 自写 | 完全控制 | 数月起步 |

## 不做

- 不引入 desktop / web UI（opencode 的 `app` / `ui` / `desktop` / `desktop-electron` 全部 DROP，详见 ADR-0001 keep/drop 表）
- 不嵌入 Web UI 到 CLI build——会显著增加迁移面，opencode 的 `--skip-embed-web-ui` build 路径要单独跑通

## 后果

- 保留 opencode 的 patches/（含 solid-js patch、Korean IME 修补）
- TUI 调试需要 opentui 知识；文档要给个最小入门
- 可独立单测：纯 helper 可以；renderer + worker 联动需要端到端 terminal/screenshot 测试

## 复审条件

- 若 opentui/solid 项目长期不维护
- 若主理人需要图形化 desktop 版本（届时另选 Tauri / Electron）
