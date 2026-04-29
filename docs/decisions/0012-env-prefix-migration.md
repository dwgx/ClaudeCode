# ADR-0012：env 前缀迁移策略 OPENCODE_* → CLAUDECODE_*

- 状态：🟡 草案
- 日期：2026-04-30
- 决策者：Claude Code 主脑

## 背景

源码已经大规模 rebrand 到 `CLAUDECODE_*`，但用户的 shell rc、Docker Compose、CI、旧 opencode wrapper 里可能仍有 `OPENCODE_*`。直接硬切会导致配置、server port、plugin/skill disable flag、binary path override 等静默失效。

当前源码证据：

| 位置 | 现状 |
|---|---|
| `src/core/src/flag/flag.ts` | 直接读 `process.env["CLAUDECODE_*"]`，没有统一 alias 层 |
| `src/opencode/bin/claudecode` | 仍读 `process.env.OPENCODE_BIN_PATH`，binary 名也仍带 `opencode` |
| `docs/03-config.md` | 已写 v0.1 同时识别 `OPENCODE_*` 与 `CLAUDECODE_*`，但指向旧 ADR 编号 |

## 决策

**v0.1-v0.2 双读；v1.0 移除 OPENCODE alias。**

### 版本窗口

| 版本 | 行为 |
|---|---|
| v0.1 | 识别 `CLAUDECODE_*` 和已知 `OPENCODE_*` alias；使用 OPENCODE-only 时 warn once per process |
| v0.2 | 继续双读；warning 文案加入“will be removed in v1.0”；CI 可用 `CLAUDECODE_STRICT_ENV=1` 把 legacy env 变成错误 |
| v0.3+ | 仍双读直到 v1.0，但 release notes 每次列迁移提醒 |
| v1.0 | 默认只认 `CLAUDECODE_*`；保留 `claudecode env migrate` 工具 |

### 读取优先级

| 情况 | 行为 |
|---|---|
| 只设置 `CLAUDECODE_FOO` | 使用 `CLAUDECODE_FOO` |
| 只设置 `OPENCODE_FOO` | 使用 alias 值，并输出 deprecation warning |
| 两者都设置且值相同 | 使用 `CLAUDECODE_FOO`，不 warn |
| 两者都设置但值不同 | 使用 `CLAUDECODE_FOO`，warn conflict，不打印值 |

### 实现位置

采用**统一 alias 表 + 迁移工具分离**：

- `src/core/src/env/aliases.ts`：维护 `CLAUDECODE_* -> OPENCODE_*` 映射和 warning 去重。
- `Flag` / `config-loader` 只能通过 `Env.get("CLAUDECODE_FOO")`、`Env.truthy()`、`Env.number()` 读取。
- `Config.boolean()` 这类 Effect config 读取必须包一层，避免绕过 alias。
- `src/opencode/bin/claudecode` 同时支持 `CLAUDECODE_BIN_PATH` 和 `OPENCODE_BIN_PATH`，前者优先。

### alias 范围

只为**已知公开变量**建 alias，不接受任意 `OPENCODE_*` 透传。

首批必须覆盖：

- `OPENCODE_CONFIG` → `CLAUDECODE_CONFIG`
- `OPENCODE_CONFIG_CONTENT` → `CLAUDECODE_CONFIG_CONTENT`
- `OPENCODE_CONFIG_DIR` → `CLAUDECODE_CONFIG_DIR`
- `OPENCODE_DISABLE_AUTOUPDATE` → `CLAUDECODE_DISABLE_AUTOUPDATE`
- `OPENCODE_DISABLE_SHARE` → `CLAUDECODE_DISABLE_SHARE`
- `OPENCODE_DISABLE_AUTOCOMPACT` → `CLAUDECODE_DISABLE_AUTOCOMPACT`
- `OPENCODE_DISABLE_DEFAULT_PLUGINS` → `CLAUDECODE_DISABLE_DEFAULT_PLUGINS`
- `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS` → `CLAUDECODE_DISABLE_CLAUDE_CODE_SKILLS`
- `OPENCODE_DISABLE_EXTERNAL_SKILLS` → `CLAUDECODE_DISABLE_EXTERNAL_SKILLS`
- `OPENCODE_PERMISSION` → `CLAUDECODE_PERMISSION`
- `OPENCODE_PORT` → `CLAUDECODE_PORT`
- `OPENCODE_DB` → `CLAUDECODE_DB`
- `OPENCODE_PURE` → `CLAUDECODE_PURE`
- `OPENCODE_TUI_CONFIG` → `CLAUDECODE_TUI_CONFIG`
- `OPENCODE_EXPERIMENTAL_*` → 对应 `CLAUDECODE_EXPERIMENTAL_*`
- `OPENCODE_BIN_PATH` → `CLAUDECODE_BIN_PATH`

### 用户迁移工具

`claudecode env migrate` 默认只打印报告，不写文件。

| 命令 | 行为 |
|---|---|
| `claudecode env migrate` | 扫描当前 shell env 和当前 repo 常见配置文件，输出 legacy var 报告 |
| `claudecode env migrate --path <file-or-dir>` | 扫描用户指定路径 |
| `claudecode env migrate --write --path <file-or-dir>` | 原地替换变量名，先写 `.bak`，不打印 secret value |
| `claudecode env migrate --format json` | 给 CI 使用的机器可读报告 |

扫描目标包括 `.env`、`.envrc`、shell rc、PowerShell profile、Docker Compose、GitHub Actions、CI YAML。自动写入必须显式 `--write`；默认不修改用户 shell 配置。

## 取舍

| 方案 | 利 | 弊 |
|---|---|---|
| **双读到 v1.0（采纳）** | 不破坏旧环境；用户有迁移窗口；可用 warning 推动清理 | alias 层要维护到 v1.0 |
| v0.1 直接硬切 | 实现最简单；品牌干净 | 大量旧配置静默失效，debug 成本高 |
| 永久双读 | 最兼容 | rebrand 永远不干净，文档和支持成本长期存在 |

## 后果

- `Flag` 不得再直接读 `process.env["CLAUDECODE_*"]`；新增 lint/test 防止绕过 alias helper。
- warning 日志必须只打印变量名，不打印值。
- config docs 要把 `docs/03-config.md` 中“见 ADR-0009”修正为 ADR-0012。
- release notes 需要列出 legacy env 使用示例和迁移命令。
- v1.0 前新增测试：CLAUDECODE-only、OPENCODE-only、both same、both conflict、strict mode。

## attribution（如有搬运）

无代码搬运。env alias/migration 逻辑为 ClaudeCode 自有实现。
