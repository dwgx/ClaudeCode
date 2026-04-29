# ADR-0004：路由层设计吸收自 claude-code-router

- 状态：✅ 已采纳
- 日期：2026-04-30
- 决策者：Claude Code 主脑（基于 codex catalog `_codex-out/router-catalog.md`）

## 背景

ClaudeCode 需要一个多 Provider 的路由层：根据请求的 token 量、任务类型、子代理标签自动选模型。已有方案：[claude-code-router](https://github.com/musistudio/claude-code-router) (MIT) 已经实现成熟的 6-scenario routing + transformer 链路。

## 决策

**设计层吸收，实现重写**。

吸收的核心抽象：
- `RouterDecision` 数据结构 + scenario classifier
- Transformer 协议（6 hook：`transformRequest{In,Out}`、`transformResponse{In,Out}`、`endPoint`、`auth`）
- Provider/Model 级 transformer chain（先 endpoint → provider use[] → model use[]，response 反序）
- env 变量插值（`$VAR` / `${VAR}`，缺失保留原文）
- subagent routing tag `<CCR-SUBAGENT-MODEL>provider,model</CCR-SUBAGENT-MODEL>`
- token-based scenario routing：default / background / think / longContext / webSearch / image
- longContext 阈值默认 60000，fallback 20000
- background 触发条件：model 名同时含 `claude` 和 `haiku`

## 重要修正

catalog 发现 README 说的 `packages/server/src/utils/router.ts` 在该版本**不存在**——真实路径是 `packages/core/src/utils/router.ts`。我们的设计文档以实现为准。

## 直接搬运候选（保留 attribution）

以下复杂转换代码值得文件级搬运，加 MIT attribution 与回归测试：
- Anthropic transformer（涉及 `tool_use`/`tool_result` 顺序、streaming edge cases）
- Gemini transformer（endpoint/auth/SSE 适配）
- OpenRouter transformer（reasoning/tool id/cache/image 兼容）

其余小 transformer（maxtoken / cleancache / sampling / customparams / streamoptions / forcereasoning）按我们 schema 重写。

## 取舍

| 方案 | 利 | 弊 |
|---|---|---|
| **设计吸收 + 实现重写（采纳）** | 命名/类型契合本仓风格；测试可控；不背 CCR 的 Fastify/configService 耦合 | 工作量略高于直接搬 |
| 直接 fork CCR core | 起步快 | 强耦合 Fastify、configService、session project lookup；命名不一致 |
| 自创 | 完全自由 | 浪费已有成熟设计 |

## 不做

- 不照搬 CCR 的 preset 系统（v0.1 不是核心）
- 不照搬 image agent（prompt 注入风险，仅做 `Router.image` 直路由）
- response transformer unwind 顺序在第一个多 transformer case 写测试确认后再定型
- v0.1 不支持 project/session 级 Router override（先把核心稳住）

## 后果

- 路由层独立于 runtime，可被 CLI / SDK / plugin 复用
- 配置文件中 `Providers` / `Router` 字段命名与 CCR 保持兼容（用户可平滑迁移）
- 复杂 transformer 文件保留 attribution，未来可同步上游 bug fix

## attribution 要求

文件级搬运的 transformer 头部必须含：
```
// SPDX-License-Identifier: MIT
// Adapted from claude-code-router (MIT)
//   © 2025 musistudio - https://github.com/musistudio/claude-code-router
// Modifications: <changes summary>
```
