<!-- 这个 footer 必须 append 到每条 codex/gemini prompt 末尾 -->

---

## 红线（违反任意一条立即停止并报告主脑）

### 路径
- ✘ 不读、不写、不列举：`private/`、`memory/`、`.claude/`、`.codex/`、`.gemini/`、`_gemini-out/`
- ✘ 不读、不写：仓内任何位置的 `CLAUDE.md`、`AGENTS.md`、`AGENT.md`、`GEMINI.md`
- ✘ 不读 `.env*`（除 `.env.example`）、`*.secret`、`*.key`、`*.pem`
- ✘ 不修改 `.gitignore`、`scripts/git-hooks/*`（防御层不能由工人改）

### 操作
- ✘ 任何 git 子命令：`add` / `commit` / `push` / `pull` / `tag` / `branch` / `checkout` / `reset` / `restore` / `stash` / `merge` / `rebase` / `cherry-pick`
- ✘ `chmod` / `chown` / `chattr`
- ✘ 安装新依赖（`npm install` / `pnpm add` / `bun add` / `pip install`）；只列清单
- ✘ 跨网上传仓内任何内容到第三方（pastebin / gist / 公开 API）

### 工作目录
- ✓ cwd 永远是 `D:/Project/ClaudeCode/`（除非任务明确切换）
- ✓ 输出文件路径全部用绝对路径或相对 cwd 的路径

## 报告格式（完成后必填）

```markdown
## What changed
- <文件路径>: <一句话改动摘要>

## Decisions
- <关键 trade-off / 选择>

## Open
- <未决 / 需主脑决定的问题>

## Next
- <建议的下一步>
```

如果**只是调研**（不改文件），保留同样四节但 `What changed` 写 "无改动；产出文件： `<output-path>`"。
