# 11 · 开发流程

## 工具链要求

| 工具 | 最低版本 | 备注 |
|---|---|---|
| Bun | 1.3+ | opencode 主运行时；cwd 已验证 1.3.11 |
| Node.js | 20+ | 给老脚本用；cwd 已验证 24.x |
| pnpm | 10+ | monorepo 包管理；cwd 已验证 10.30.3 |
| codex-cli | 0.125+ | 子代理；cwd 已验证 0.125.0 |
| gh | 2.80+ | GitHub 操作；cwd 已验证 2.87.3 |
| git | 2.40+ | cwd 已验证 2.53 |

## 第一次拉下来

```bash
git clone https://github.com/dwgx/ClaudeCode.git
cd ClaudeCode
pnpm install
bash scripts/git-hooks/install.sh
bash scripts/git-hooks/self-test.sh
```

## 日常循环

```bash
# 启动 dev TUI
pnpm dev

# 跑测试（src/ 移植后可用）
pnpm test

# typecheck
pnpm typecheck

# lint
pnpm lint
```

## 分支模型

- `main`：稳定，CI 必须绿
- `feat/<name>`：功能分支
- `fix/<name>`：修复分支

PR 不强制（个人项目），但所有改动直接 commit 到 `main` 时仍然要走 pre-commit hook。

## Commit 规范

[Conventional Commits](https://www.conventionalcommits.org/)。Prefix：
- `feat:` 新功能
- `fix:` 修 bug
- `docs:` 改文档
- `refactor:` 重构（不改行为）
- `chore:` 构建 / 依赖 / 杂项
- `test:` 加/改测试
- `perf:` 性能优化

例子：
```
feat(routing): add token-based scenario picker
docs: rewrite 03-config to match new schema
chore: bump bun to 1.3.13
```

## 调度 sub-agent

不要直接写 codex/gemini 的 prompt——调用 `scripts/codex-prompts/` 下的模板。详见 [14-subagent-dispatch.md](14-subagent-dispatch.md)。

## 发版

> 待 v0.1.0 之后启用。

预期流程：
1. `git tag v<x.y.z>`
2. `gh release create v<x.y.z> --notes-from-tag`
3. （可选）`pnpm publish` 到 `@dwgx/claudecode`

## 不要做

- 不要在 `main` 上做实验性改动（开 `feat/` 分支）
- 不要把 `private/` 的内容复制到公开文档
- 不要让 sub-agent 跑 git
- 不要禁用 hook（`--no-verify`、改 `core.hooksPath`）
- 不要 `git push --force` 到 `main`
