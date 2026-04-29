# ADR-0013：内嵌 Web UI 决策

- 状态：🟡 草案
- 日期：2026-04-30
- 决策者：Claude Code 主脑

## 背景

opencode 上游曾有 Web/App UI。ClaudeCode 是个人 terminal-first 工具，需要决定是否保留内嵌 Web UI。

本次先检查了当前 `src/opencode` 体量：

| 项 | 当前数据 |
|---|---:|
| `src/app` | 不存在 |
| `app` | 不存在 |
| `src/opencode/app` / `web` / `dashboard` | 不存在 |
| `src/opencode/src/server/routes/ui.ts` | 49 行 / 2487 bytes |
| `src/opencode/src/cli/cmd/web.ts` | 69 行 / 2553 bytes |
| `src/opencode/script/build.ts` Web embed hook | 约 24 行；默认 `bun run --cwd ../../app build` |
| build embed 目标 | 从 `src/opencode/script` 解析为 `src/app/dist`，但 `src/app` 当前不存在 |
| runtime route | `server.ts` 把 `UIRoutes()` 挂在 `/` catch-all |

也就是说，当前仓库并没有实际 Web UI 源码或静态资源；只剩 server route、`web` 命令和 build-time embed 入口。默认 build 不加 `--skip-embed-web-ui` 会尝试构建缺失的 `src/app`。

## 决策

**v0.1 不内嵌 Web UI；保留 lazy-load 入口但默认关闭。**

具体规则：

| 问题 | 决策 |
|---|---|
| 完全去掉/保留/lazy-load | lazy-load：不打包 Web UI，不自动挂远端 UI；只保留显式入口 |
| 默认开关 | 默认关；TUI/CLI 启动不启动浏览器、不加载静态资源 |
| 触发条件 | `claudecode web`、`claudecode --web` 或 `CLAUDECODE_EXPERIMENTAL_WEB_UI=1` |
| 本地 UI 来源 | 后续用可选 plugin/package 提供，例如 `@dwgx/claudecode-web`；v0.1 不从 core bundle 提供 |
| build 行为 | release build 固定 `--skip-embed-web-ui`，或反转为 `--embed-web-ui` 才构建 |
| fallback 行为 | 删除当前 `app.github.com/dwgx/ClaudeCode` proxy fallback；缺 UI 时给明确错误和 `claudecode serve` 建议 |

### 影响量化

| 选择 | bundle/startup 影响 |
|---|---|
| 现状继续默认 embed | 当前不可用：`src/app` 缺失，build path 会失败 |
| 删除 Web embed hook | 立刻减少 build 风险；当前静态资源节省为 0，因为没有本地资源 |
| 删除 `web` 命令和 route | 可删约 118 行业务代码，但 `open` / `hono` 依赖仍被其他功能使用，依赖体量基本不变 |
| lazy-load | 保留未来扩展面；默认启动成本接近 0，只在显式 `web` 时加载 |

## 取舍

| 方案 | 利 | 弊 |
|---|---|---|
| **lazy-load 且默认不嵌入（采纳）** | terminal-first；release build 稳；保留未来 Web/API 调试入口 | 需要把当前 `web` 命令改成显式实验/插件加载 |
| 完全删除 Web UI | 最干净；少维护 route | 失去浏览器调试、远程 API 观察和未来 dashboard 入口 |
| 默认保留内嵌 Web UI | 用户有图形界面 | 当前缺源码；bundle 面和迁移面扩大；违背 ADR-0007 terminal-first |
| 继续远端 proxy fallback | 无需本地静态资源 | 外部依赖、隐私边界和 CSP/可用性不可控 |

## 后果

- `script/build.ts` 改成默认 skip embed；只有显式 `--embed-web-ui` 才寻找 `src/app`。
- `UIRoutes()` 不再 catch-all proxy 外部站点；无 UI 时返回本地 JSON/HTML 错误。
- `claudecode web` 标注 experimental：未安装 Web UI plugin 时不启动浏览器，只提示 `claudecode serve`。
- `CLAUDECODE_DISABLE_EMBEDDED_WEB_UI` 可保留到 v0.2，但新增正向开关 `CLAUDECODE_EXPERIMENTAL_WEB_UI` 更清晰。
- 文档和 README 不得宣称 ClaudeCode v0.1 有内嵌 dashboard。

## attribution（如有搬运）

当前不搬运 Web UI 源码。若未来恢复 opencode `app`/Web UI 文件，必须保留 opencode MIT header，并在文件头或目录 `ATTRIBUTION.md` 标注：

```ts
// SPDX-License-Identifier: MIT
// Adapted from opencode (MIT)
// Source: https://github.com/sst/opencode
// Modifications: ClaudeCode branding, auth, lazy-load packaging
```
