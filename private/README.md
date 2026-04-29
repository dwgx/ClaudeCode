# private/ — 个人私有目录（永不入仓）

这个目录里的内容**绝对不会**进入任何 commit 或 push（除了少数公开占位文件）。

## 目录角色

- `CLAUDE.md` — 你给 Claude Code / 本仓的私人指令（覆盖公开默认）
- `AGENTS.md` — 你给 sub-agent 的私人提示
- `notes/` — 临时草稿、想法、未公开的 TODO
- `secrets/` — 本地凭据（建议改用 `.env`）

## 公开占位（会入仓）

- `private/README.md`（本文件，目录说明）
- `private/CLAUDE.example.md`（你私有 CLAUDE.md 的模板）
- `private/AGENTS.example.md`（你私有 AGENTS.md 的模板）
- `private/notes/.gitkeep`、`private/secrets/.gitkeep`（保住空目录）

## 使用方式

```bash
cp private/CLAUDE.example.md private/CLAUDE.md
$EDITOR private/CLAUDE.md
```

`private/CLAUDE.md` 在本仓 `.gitignore` 中被锁住，改后不会进 commit。

启动时 ClaudeCode runtime 优先读 `private/CLAUDE.md`，找不到则 fallback 到 `private/CLAUDE.example.md`（公开默认）。

## 三层防护

1. `.gitignore` 锁住 `private/` 内除占位以外所有内容
2. `scripts/git-hooks/pre-commit` 扫到禁止路径一律拒
3. 写入私有内容前先 `git status` 确认工作树干净

绝不要用 `git commit --no-verify` 绕过 hook。
