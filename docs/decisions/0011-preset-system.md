# ADR-0011：preset 系统设计

- 状态：🟡 草案
- 日期：2026-04-30
- 决策者：Claude Code 主脑

## 背景

claude-code-router 有 preset：把 Providers、Router、transformers、StatusLine、用户输入 schema、敏感字段占位等打包成 `manifest.json`。ClaudeCode 也需要让用户分享一份 router/skill/agent/env 配置，一键导入到全局或项目。

约束：

- 本仓主配置是 JSON / JSONC（见 `docs/03-config.md`）
- Router/Provider schema 已吸收 CCR 的 `Providers` / `Router` 命名
- preset 可能包含 provider key 的引用，但绝不能保存明文 secret
- 项目级 preset 应可随 repo 分享；全局 preset 应可供多个 repo 复用

## 决策

**采用严格 JSON manifest，目录级 preset，默认 fail-on-conflict 合并。**

### 文件格式

文件名：`preset.json`。不采用 YAML/TOML。

```jsonc
{
  "$schema": "https://claudecode.dwgx.dev/schema/preset.json",
  "name": "local-fast-router",
  "version": 1,
  "description": "Router + builtin skills for local daily coding",
  "license": "MIT",
  "source": "github:owner/repo/path",

  "config": {
    "Providers": [],
    "Router": {},
    "fallback": {},
    "transformers": [],
    "tokenizer": {}
  },

  "skills": {
    "enable": ["confidence-check", "self-check", "repo-index"]
  },

  "agents": {
    "enable": ["code-reviewer", "debugger"],
    "defaults": {
      "code-reviewer": { "model": "anthropic,claude-opus" }
    }
  },

  "env": {
    "defaults": {
      "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
    },
    "required": ["ANTHROPIC_API_KEY"]
  },

  "inputs": []
}
```

JSONC 可作为本地编辑体验后续支持，但导出、发布、校验、checksum 一律使用 strict JSON。

### 存储位置

| 作用域 | 路径 | 优先级 |
|---|---|---:|
| 项目级 | `<repo>/.claudecode/presets/<name>/preset.json` | 高 |
| 全局 | `$xdgConfig/claudecode/presets/<name>/preset.json` | 中 |
| 兼容别名 | `~/.claudecode/presets/<name>/preset.json` | 低；迁移到 XDG 后只读 |

项目级同名 preset 覆盖全局 preset。`CLAUDECODE_CONFIG_DIR` 指向自定义配置目录时，全局 preset 跟随该目录。

### CLI

| 命令 | 行为 |
|---|---|
| `claudecode preset export <name>` | 从当前有效 config 导出，默认 sanitize secrets |
| `claudecode preset import <url-or-path>` | 校验、保存到全局；默认不 apply |
| `claudecode preset list [--global|--project]` | 列 preset 名、来源、版本 |
| `claudecode preset info <name>` | 展示 manifest 摘要、需要的 env、将改哪些 key |
| `claudecode preset apply <name>` | dry-run diff 后应用；默认 fail-on-conflict |
| `claudecode preset diff <name>` | 只输出将要变更的配置 |
| `claudecode preset remove <name>` | 删除已安装 preset，不回滚已应用 config |

### 作用域

| section | 必含 | 说明 |
|---|---|---|
| `name` / `version` / `description` | ✅ | metadata |
| `config.Router` | 可选 | scenario slot、threshold、fallback route |
| `config.Providers` | 可选 | provider definitions；api_key 必须是 env placeholder |
| `config.transformers` | 可选 | 只允许内置 transformer 名或已安装 plugin transformer |
| `skills.enable` | 可选 | 启用 builtin/installed skill |
| `agents.enable` / `agents.defaults` | 可选 | 启用 agent 和默认 model/tools |
| `env.defaults` / `env.required` | 可选 | 只保存变量名和占位符，不保存值 |
| `plugins.required` | 可选 | 只声明依赖；安装必须二次确认 |

### 合并语义

默认：**fail-on-conflict**。

- `Providers[]` 按 `name` 合并；同名且字段不同则冲突。
- `transformers[]` 按 `name` 或 `path` 合并；不同 options 冲突。
- `skills.enable` / `agents.enable` 是 set union。
- `Router` / `fallback` / `tokenizer` 是 object merge；已有 key 不同则冲突。
- `env.defaults` 只补缺；不会覆盖用户已有 shell/env。
- `--force` 才覆盖已有 key。
- `--additive` 只做新增，冲突 key 跳过并报告。

## 取舍

| 方案 | 利 | 弊 |
|---|---|---|
| **JSON manifest + fail-on-conflict（采纳）** | 与 config/schema/checksum 统一；CI 和 marketplace 易校验；默认不破坏用户配置 | 手写不如 YAML 舒服 |
| YAML | 人类可写性好 | JS/Bun 需额外 parser；注释/锚点会让分享语义复杂 |
| TOML | 配置感强 | 嵌套 arrays/objects 表达 Providers/Router 较笨 |
| 直接套用 CCR manifest | 有现成设计 | 带 CCR 字段和 UI/statusline 语义；不完全契合 ClaudeCode |

## 后果

- 新增 `preset` schema 与 CLI。
- `config-loader` 需要提供 dry-run merge API，输出结构化 conflict 列表。
- `preset export` 必须 sanitize 敏感字段：`api_key`、`token`、`secret`、`password`、`private_key` 等一律转 env placeholder。
- 文档新增 preset authoring guide 和安全规则。
- Marketplace 安装 preset 时必须把 manifest 作为 untrusted data 校验，不执行其中脚本。

## attribution（如有搬运）

本 ADR 只吸收 claude-code-router preset 设计，不直接搬代码。若后续搬运 CCR `packages/shared/src/preset/*` 的 schema/sanitize 逻辑，文件头必须加：

```ts
// SPDX-License-Identifier: MIT
// Adapted from claude-code-router (MIT)
//   © 2025 musistudio - https://github.com/musistudio/claude-code-router
// Modifications: ClaudeCode preset schema, env sanitization, merge semantics
```
