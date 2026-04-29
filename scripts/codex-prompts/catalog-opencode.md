# Codex 任务：catalog opencode

**层级**：codex-deep（GPT-5.5 / 准+深）
**目的**：摸清 `ReferenceSource/opencode/` 的结构，给主脑出"我们要 keep / adapt / drop"清单。
**预期耗时**：5–10 分钟
**输出**：写到 `_codex-out/opencode-catalog.md`（gitignored）

---

## 你是谁

你是 ClaudeCode 项目的 codex-deep 调研工人。主脑（Claude Code）把 opencode 目录交给你，让你回报一份结构化 catalog，方便他做"哪些 packages 我们搬进 `src/`、哪些丢弃、哪些重写"的决策。

## 输入

- 工作目录：`D:/Project/ClaudeCode/`
- 调研目标：`ReferenceSource/opencode/`（不要改动这里任何文件）
- 关键已知：
  - License: MIT © 2025 opencode
  - 提交：`a3f7ea25551d9d206d947d4d0a16739609208fb0` (branch `dev`)
  - 顶层 `package.json` 用 Bun + workspaces，packages 在 `packages/`
  - 已知 packages（来自 ls）: `app, console, containers, core, desktop, desktop-electron, docs, enterprise, extensions, function, identity, opencode, plugin, script, sdk, slack, storybook, ui, web`

## 输出契约

写一个 markdown 到 `_codex-out/opencode-catalog.md`，**严格**按以下章节：

```markdown
# opencode catalog

## 1. 顶层结构
<根目录文件 / 顶层目录的一句话用途清单>

## 2. packages/ 详表
| package | 用途 | 入口文件 | 关键依赖 | 行数估计 | 我们的建议 |
|---|---|---|---|---|---|
| opencode | 终端 CLI 主入口 | packages/opencode/src/index.ts | bun, @opentui/solid | ~XXXX | KEEP（rebrand） |
| ...     |     |       |       |       |       |

"我们的建议"列只能是这 5 个之一：
- `KEEP（rebrand）` — 直接搬进 src/，做 opencode→claudecode 改名
- `KEEP（原样）` — 搬进 src/，不改
- `ADAPT` — 搬进但需要改造（说清要改什么）
- `DROP` — 不搬（说清原因，例如 enterprise/saas/不需要）
- `DEFER` — 暂时不动，等 v0.2+ 再决定

## 3. 入口文件 + 启动链路
- CLI 入口：`packages/opencode/src/index.ts`（如非则改）
- 主进程做了什么 → TUI 启动 → 工具循环 ...（逻辑链路 5 行内说清）

## 4. 配置体系
- 配置文件：路径、格式（JSON/JSON5/...）、加载顺序
- env 变量：列出所有读到的 `OPENCODE_*` / `CLAUDECODE_*` / 其它
- 默认值：哪里写死的

## 5. 工具系统
- 工具定义在哪
- 工具列表（名字 + 一句话用途）
- 工具协议是否兼容 Anthropic Claude Code 风格

## 6. 插件 / Skill / Hook
- opencode 自家的 plugin / skill / hook 协议在哪
- 与 Anthropic Claude Code `.claude-plugin/` / `skills/` / hook events 的差异点
- 兼容性可行度评估（容易 / 中等 / 难）

## 7. MCP 集成
- MCP 客户端代码位置
- 配置方式

## 8. TUI
- 用什么栈（@opentui/solid / ink / blessed）
- 渲染入口
- 可独立单测吗

## 9. SDK
- packages/sdk 是干嘛的
- 我们要不要保留

## 10. 桌面 / 浏览器版
- desktop / desktop-electron / web / app 这些
- 我们建议 KEEP / DROP

## 11. CI / 构建
- bunfig / flake.nix / patches 是干嘛
- 跨平台支持现状

## 12. 风险 / 坑
- 任何看起来"搬过来会爆"的点
- 任何 vendored 二进制或 native 依赖
- 任何 license 子文件夹值得注意

## What changed
（按 footer 格式回报）

## Decisions
## Open
## Next
```

## 怎么干

1. 先用 `ls` / `tree -L 2` 摸清顶层
2. 读 `package.json` / `bunfig.toml` / `pnpm-workspace.yaml`（如有）了解 workspace
3. 依次进每个 `packages/<x>` 读 `package.json` + 入口文件第一屏
4. 抽样几个 `src/` 文件确认风格
5. **不要逐行读**——你的目的是 catalog，不是 review
6. 单文件超过 500 行只读前 100 行 + grep 关键 export
7. 全部写到 `_codex-out/opencode-catalog.md`，markdown 严格分节

## 上限

- 不要超过 30 个文件读取
- 单个 read 不超过 200 行（除非是 package.json 这种短文件）
- 总耗时不要超过 10 分钟

---

<!-- 主脑 dispatch 时会 append `_footer.md` 的红线段 -->
