# 贡献指南

这是一个个人项目，主理人 [@dwgx](https://github.com/dwgx)。外部 PR 看到会回复但不一定合并。

## 本地开发

```bash
git clone https://github.com/dwgx/ClaudeCode.git
cd ClaudeCode
pnpm install
bash scripts/git-hooks/install.sh
```

## 提交前必读

- 不要在 commit 里包含 `CLAUDE.md`、`AGENTS.md`、`private/`、`memory/`、任何凭据。pre-commit hook 会拦，但人是最后一道。
- 提交人必须是 `dwgx <dwgx1337@outlook.com>`。
- 不许 `--no-verify`。

## Commit 风格

[Conventional Commits](https://www.conventionalcommits.org/)：
- `feat:` 新功能
- `fix:` 修 bug
- `docs:` 改文档
- `refactor:` 重构（不改行为）
- `chore:` 杂项

## Sub-agent 协作

任何把工作交给 codex / gemini 的步骤，prompt 里必须含：
1. `cwd: D:/Project/ClaudeCode/`
2. 禁止 git 操作
3. 禁止读写 `private/`、`memory/`、`.claude/`、`CLAUDE.md`、`AGENTS.md`
4. 报告结构化摘要

详见 [docs/14-subagent-dispatch.md](docs/14-subagent-dispatch.md)。
