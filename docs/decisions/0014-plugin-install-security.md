# ADR-0014：外部 plugin 自动安装的安全模型

- 状态：📝 设计中（v0.2 实施）
- 日期：2026-04-30
- 决策者：Claude Code 主脑

## 背景

opencode 继承下来的 `PluginLoader.resolve` 行为：

1. 用户在 `~/.claudecode/config/claudecode.json` 的 `plugin` 字段写一个 spec（npm 名 / GitHub URL / 本地路径）
2. 启动时 `resolvePluginTarget(spec)` **自动 npm install** 这个包到 `~/.claudecode/data/npm/`
3. 然后 `await import(target)` 把 plugin **作为 ES 模块加载到主进程**
4. plugin 的 hook 在 user 进程内运行，与 ClaudeCode runtime 共享：
   - 文件系统访问权限（包括 `~/.ssh`、`~/.claudecode`、用户工作区）
   - 网络访问
   - 子进程 spawn
   - 共享 SDK client（已认证的 API 凭据）

**这等于任意远程代码执行（RCE）**：用户写错一个 spec、被人劫持 npm 包、依赖链出现恶意 transitive 依赖——任何一个都让攻击者拿到完整 user shell 权限。

ADR-0008（plugin 协议双向兼容）专注协议层，没有谈"信任谁"。ADR-0014 补这个洞。

## 决策

四层分级。**v0.2 落地 L1 + L3**，v0.3 补 L2 + L4。

### L1 · 信任前缀名单（machine-checked）

只有以下前缀的 spec 视为**默认信任**，自动安装无需 prompt：

- `@dwgx/claudecode-*` —— 仓库 owner 自己发布
- `@anthropic-ai/*` —— Anthropic 官方
- `@opencode-ai/*` —— opencode 上游
- 本地路径 `./*`、`../*`、绝对路径（用户自己写的代码视为已信任）

其它一律视为**第三方**，必须走 L3 流程。

实现：`src/core/src/orchestration/plugin-trust/prefixes.ts` 里维护这个列表，单元测试覆盖每个边界。

### L2 · sha256 锁文件（v0.3）

类似 npm `package-lock.json`：`~/.claudecode/state/plugin-allowlist.json` 记录每个第三方 plugin 的 `(spec, version, sha256)`。下次启动时：

- 已记录且 sha 一致 → 静默加载
- 未记录 → 走 L3
- 已记录但 sha 不一致 → **拒绝加载**，提示用户：包内容被改动，重新审核或用 `claudecode plugin trust <spec>` 接受新 sha

### L3 · 首次同意（interactive consent）

第一次见到第三方 spec 时：

1. 阻塞启动，弹 TUI 对话（或 CLI 提示，看是 TUI 还是 `claudecode run`）
2. 显示：
   - spec + 解析到的 npm 名
   - 包的最新 README 摘要（若可拉取，超时 3s 后跳过）
   - **GitHub repo URL + 维护者**（从 npm metadata 拿 `repository.url`）
   - **要求的权限声明**（见 L4）
3. 选项：
   - `Trust once` —— 本次启动加载，不写入 allowlist（v0.3）
   - `Trust always` —— 写入 allowlist（v0.3）
   - `Reject` —— 跳过该 plugin
4. 拒绝后用户可在 config 里删除该 spec，或用 `claudecode plugin reject <spec>` 永久标记

非交互场景（CI、`run` 一次性命令）：
- 默认 **Reject** 第三方 plugin
- 设置 `CLAUDECODE_PLUGIN_TRUST_ALL=1` 强制信任全部（仅用于沙箱环境）

### L4 · Plugin manifest 权限声明（v0.3）

参考 Anthropic Claude Code 的 `permissions:` 字段，扩展 plugin manifest：

```json
{
  "name": "my-plugin",
  "permissions": {
    "fs": { "read": ["${cwd}/**"], "write": ["${cwd}/.cache/**"] },
    "network": ["api.example.com"],
    "shell": ["git", "rg"]
  }
}
```

Plugin loader 在调用 hook 前装一层 `Proxy` 把不在白名单内的调用拒掉（fs / fetch / Bun.spawn）。**不做沙箱进程隔离**——cost 太高，依赖 Node/Bun runtime 行为而非操作系统级。这层的目标是 honest mistakes 防护，不是恶意攻击者防护。

## 取舍

| 方案 | 利 | 弊 |
|---|---|---|
| **四层分级（采纳）** | 渐进；零信任默认 + 用户主动 opt-in；不锁死生态 | L3 prompt 增加首次启动摩擦；L4 实现复杂 |
| 完全锁住，只允许内置 plugin | 安全最强 | 杀掉 plugin 生态价值 |
| 只做 L1 信任前缀 | 实现最简单 | 第三方 plugin 默认 RCE 风险，违背 zero-trust |
| 进程隔离（subprocess + IPC） | 真正安全 | 性能 / 复杂度 / hook 回调延迟激增 |

## 不做

- 不做 OS 级沙箱（Linux landlock / macOS sandbox-exec / Windows AppContainer）—— v1.0 才会重新评估
- 不引入第三方信任索引（如 npm trust scores、Socket.dev API）—— 用户可自己集成
- 不在 v0.2 做包内容签名验证（PGP）—— 复杂度太高、ROI 低；sha256 锁就够阻止 silent supply-chain 攻击

## 实施切分

- **v0.2 / 本 ADR 落地**：L1 信任前缀 + L3 交互式同意（TUI 对话 + CLI 非交互拒绝）
- **v0.3**：L2 锁文件 + L4 权限声明 proxy
- **v1.0 评估**：L5 进程隔离

## 后果

- 第三方 plugin 用户**首次启动多一步确认**——可接受
- CI 跑 `run` 命令默认拒绝第三方 plugin——破坏部分自动化用法，需文档说明 `CLAUDECODE_PLUGIN_TRUST_ALL=1` 转义
- 已在 npm 上发布的恶意 plugin 不再有"零摩擦 RCE"路径
- ClaudeCode 自有的 `@dwgx/*` 包享受零摩擦体验——保持 OOTB 可用性

## 相关

- ADR-0008：plugin 协议双向兼容
- 参考：Anthropic Claude Code permissions、npm `--ignore-scripts`、Socket.dev、Cargo `cargo audit`
