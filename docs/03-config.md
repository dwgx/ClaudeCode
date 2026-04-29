# 03 · 配置

## 文件位置

| 配置 | 路径 | 格式 |
|---|---|---|
| 全局 | `$xdgConfig/claudecode/config.json` | JSON / JSONC |
| 项目 | `<repo>/claudecode.json(c)` 或 `<repo>/.claudecode/config.json(c)` | JSON / JSONC |
| TUI | `tui.json(c)` 或 env `CLAUDECODE_TUI_CONFIG` | JSON / JSONC |
| 私有覆盖 | `<repo>/private/CLAUDE.md`（gitignored） | Markdown |
| MCP | `<global>/mcp.json` | JSON |

XDG 路径在 Windows 上对应 `%APPDATA%\claudecode\`，macOS/Linux 对应 `~/.config/claudecode/`。

## 加载顺序（高 → 低优先级）

```
1. CLI flag                            --model gpt-5.5  --provider anthropic
2. 环境变量                            CLAUDECODE_*
3. 项目级 .claudecode/config.json(c)
4. 项目级 claudecode.json(c)（仓根）
5. CLAUDECODE_CONFIG（指向自定文件）
6. CLAUDECODE_CONFIG_CONTENT（直接 JSON 字符串）
7. CLAUDECODE_CONFIG_DIR（指向自定目录）
8. 全局 $xdgConfig/claudecode/config.json
9. 远端 well-known config（若开启）
10. 仓内默认 (defaults)
```

后者被前者覆盖。私有 `private/CLAUDE.md` 单独走 prompt 注入路径，不参与 config merge。

## 核心 schema 草稿

> v0.1 schema，会随 src/ 移植定型。完整 JSON Schema 待 src/ 移植后由生成器输出到 `https://claudecode.dwgx.dev/schema/config.json`。

```jsonc
{
  "$schema": "https://claudecode.dwgx.dev/schema/config.json",
  "version": 1,

  // ────── 服务运行参数 ──────
  "PORT": 3000,
  "HOST": "127.0.0.1",
  "APIKEY": "$CLAUDECODE_APIKEY",
  "PROXY_URL": "$HTTPS_PROXY",
  "LOG": true,
  "LOG_LEVEL": "info",                  // fatal/error/warn/info/debug/trace
  "API_TIMEOUT_MS": 60000,
  "NON_INTERACTIVE_MODE": false,

  // ────── Provider 列表 ──────
  "Providers": [
    {
      "name": "anthropic",
      "api_base_url": "https://api.anthropic.com/v1/messages",
      "api_key": "$ANTHROPIC_API_KEY",
      "models": ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
      "transformer": { "use": ["anthropic"] }
    },
    {
      "name": "openai",
      "api_base_url": "https://api.openai.com/v1/chat/completions",
      "api_key": "$OPENAI_API_KEY",
      "models": ["gpt-5.5", "gpt-5"],
      "transformer": {
        "use": ["openai"],
        "gpt-5.5": { "use": ["maxtoken", { "max_tokens": 65536 }] }
      }
    }
    // ...
  ],

  // ────── 路由表 ──────
  "Router": {
    "default":            "anthropic,claude-sonnet-4-6",
    "background":         "openai,gpt-5",
    "think":              "anthropic,claude-opus-4-7",
    "longContext":        "anthropic,claude-sonnet-4-6@1m",
    "longContextThreshold": 60000,
    "webSearch":          "openai,gpt-5.5-online",
    "image":              "openai,gpt-5.5-vision"
  },

  // ────── fallback ──────
  "fallback": {
    "default":     ["anthropic,claude-sonnet-4-6", "openai,gpt-5"],
    "longContext": ["anthropic,claude-sonnet-4-6@1m"]
  },

  // ────── 自定义 router（可选） ──────
  "CUSTOM_ROUTER_PATH": "./.claudecode/router.js",
  "REWRITE_SYSTEM_PROMPT": false,

  // ────── 全局自定义 transformer ──────
  "transformers": [
    { "path": "./.claudecode/transformers/my-tx.js", "options": { "...": "..." } }
  ],

  // ────── 插件 ──────
  "plugins": [
    "@dwgx/skill-confidence-check",
    ["./.claudecode/plugins/local.ts", { "verbose": true }]
  ],

  // ────── tokenizer ──────
  "tokenizer": {
    "default": { "type": "tiktoken", "encoding": "cl100k_base" }
  },

  // ────── 行为开关 ──────
  "skills": {
    "paths":  ["./skills", "./.claudecode/skills"],
    "urls":   [],
    "claudeCodeCompat": true              // 扫 ~/.claude/skills/**/SKILL.md
  },

  "permission": {
    "ask":  ["bash", "write", "edit"],
    "deny": ["task.shell"]
  },

  "experimental": {
    "fileWatcher": false,
    "planMode":    true
  }
}
```

## env 变量

### 主流程（ClaudeCode 自家）

| 变量 | 用途 |
|---|---|
| `CLAUDECODE_CONFIG` | 强制读这个 config 文件 |
| `CLAUDECODE_CONFIG_CONTENT` | 直接传 JSON 字符串（CI 友好） |
| `CLAUDECODE_CONFIG_DIR` | 指向 config 目录 |
| `CLAUDECODE_DISABLE_AUTOUPDATE` | 关闭自动升级检查 |
| `CLAUDECODE_DISABLE_SHARE` | 关闭分享 |
| `CLAUDECODE_DISABLE_AUTOCOMPACT` | 关闭自动 compact |
| `CLAUDECODE_DISABLE_DEFAULT_PLUGINS` | 关闭默认插件 |
| `CLAUDECODE_DISABLE_EXTERNAL_SKILLS` | 不扫 `~/.claude/skills/**` |
| `CLAUDECODE_PERMISSION` | 临时覆盖权限 |
| `CLAUDECODE_PORT` | 本地 server 端口 |
| `CLAUDECODE_DB` | SQLite DB 路径 |
| `CLAUDECODE_PURE` | 纯净模式（无外部副作用） |
| `CLAUDECODE_FAST_BOOT` | 跳过非关键启动步骤 |
| `CLAUDECODE_EXPERIMENTAL_*` | 实验功能开关 |
| `CLAUDECODE_TUI_CONFIG` | TUI 配置文件位置 |

### Provider 凭据（标准）

`ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` / `DEEPSEEK_API_KEY` / `OPENROUTER_API_KEY` / 等。

### 兼容（来自 opencode）

opencode `OPENCODE_*` 在 v0.1 同时被识别（迁移期）；后续版本会逐步只认 `CLAUDECODE_*`。具体迁移策略见 ADR-0009（待写）。

## env 插值规则

任何字符串值里 `$VAR_NAME` 或 `${VAR_NAME}` 会被替换为环境变量值：

| 形式 | 匹配 | 缺失行为 |
|---|---|---|
| `$VAR_NAME` | 必须 `[A-Z_][A-Z0-9_]*` | 保留原文（不报错） |
| `${VAR_NAME}` | 任何非 `}` 字符 | 保留原文 |

支持出现在字符串任意位置（不必整段都是变量），可多次出现。**缺失环境变量不报错**——这是来自 claude-code-router 的安全设计，避免 CI 缺一个不重要的 key 就崩。

## preset 系统（v0.2+）

打包一组 Providers + Router + transformers + 默认值为可分享 preset；详见后续设计（ADR-0011 待写）。

## 最小可用配置

```jsonc
// claudecode.json
{
  "Providers": [
    {
      "name": "anthropic",
      "api_base_url": "https://api.anthropic.com/v1/messages",
      "api_key": "$ANTHROPIC_API_KEY",
      "models": ["claude-sonnet-4-6"]
    }
  ],
  "Router": { "default": "anthropic,claude-sonnet-4-6" }
}
```

只设这些，加 `ANTHROPIC_API_KEY` 环境变量，CLI 就能跑。

## 自定义 router 函数（可选）

```javascript
// .claudecode/router.js
module.exports = async function router(req, config, { event }) {
  // 返回 "provider,model" 字符串覆盖路由；返回 null 走默认逻辑
  if (req.body.metadata?.user_id?.includes("ci-job")) {
    return "openai,gpt-5";
  }
  return null;
};
```

`CUSTOM_ROUTER_PATH` 指向此文件即可启用。优先级最高（覆盖所有内建规则）。
