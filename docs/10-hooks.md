# 10 · Hooks

ClaudeCode 涉及两类 hook：

1. **Git hook**（仓库级，本文件主讲）
2. **运行时生命周期 hook**（runtime 级，与 Anthropic Claude Code 兼容；详见 [08-plugins.md](08-plugins.md)）

## Git hooks

实现在 `scripts/git-hooks/`：
- `pre-commit`：路径黑名单 + 提交人身份 + 密钥指纹
- `install.sh`：把 `core.hooksPath` 指到 `scripts/git-hooks/` 并设 `user.name/email`
- `self-test.sh`：构造命中/不命中样例验证 hook 真的在拦
- `README.md`：模块说明

### 安装

```bash
bash scripts/git-hooks/install.sh
```

### 自测

```bash
bash scripts/git-hooks/self-test.sh
```

预期输出全部 ✓。

### 不要绕过

`git commit --no-verify` 是核武器。绕过 = 私有文件公开。如果 hook 误报，**改 hook**，不要绕过。

## Lifecycle hooks（runtime）

> 这一节在 `src/` 移植后由 Codex catalog 任务（Task #6）填充。

预期与 Anthropic Claude Code hook events 兼容，覆盖至少：
- `SessionStart` / `SessionEnd`
- `PreToolUse` / `PostToolUse`
- `Stop`
- `TaskCompleted`
- `UserPromptSubmit`
- `PreCompact` / `PostCompact`

opencode 已有自己的 hook 系统；移植后会做兼容映射，让官方 plugin 的 hook 直接能跑。

落地后本节会附：完整 event 列表 + payload schema + 例子。
