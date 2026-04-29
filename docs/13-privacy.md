# 13 · 隐私边界

> 这是整个项目最重要的一条规则：**没有任何私人内容应该出现在公开仓库里。**

## 三层防御

### 层 1：`.gitignore`

仓库根的 `.gitignore` 用正则锁死所有私有路径模式。即便你不小心 `git add .`，git 也不会把它们 stage。

涵盖：
- `private/`、`_private/`、`.private/`
- `memory/`、`notes/`、`_codex-out/`、`_gemini-out/`、`_research/`、`_scratch/`
- `ReferenceSource/`
- `.claude/`、`.codex/`、`.gemini/`
- `CLAUDE.md`（任何子目录）、`AGENTS.md`、`AGENT.md`、`GEMINI.md`
- `.env*`（除 `.env.example`）
- `*.secret`、`*.key`、`*.pem`、`*.pfx`、`credentials.json`、`service-account*.json`

### 层 2：`scripts/git-hooks/pre-commit`

即便 `.gitignore` 被绕过（例如 `git add -f`），pre-commit hook 会在 commit 真正发生前再扫一次 staged 区。命中黑名单 → exit 1，commit 不发生。

同时校验：
- `user.name == dwgx`
- `user.email == dwgx1337@outlook.com`

不一致也直接拒。

### 层 3：内容指纹扫描

pre-commit 还会扫 staged 文件内容，匹配以下密钥指纹一律拒：
- AWS access key (`AKIA...`)
- OpenAI key (`sk-...`)
- Anthropic key (`sk-ant-...`)
- GitHub PAT (`ghp_/ghs_...`)
- Google API key (`AIza...`)
- PEM 私钥头

## 公私文件对照

| 公开版本 | 私人版本 | 说明 |
|---|---|---|
| `private/CLAUDE.example.md` | `private/CLAUDE.md` | Claude Code 个人指令 |
| `private/AGENTS.example.md` | `private/AGENTS.md` | sub-agent 个人提示 |
| `.env.example`（仅占位） | `.env` | 凭据 |
| 不存在 | `private/notes/` | 草稿 |
| 不存在 | `private/secrets/` | 本地备份的凭据 |
| 不存在 | `memory/`（在仓外，由 Claude Code 维护） | 长期记忆 |

## 启动加载顺序

ClaudeCode runtime 启动时按这个顺序合并配置：

```
1. <仓内默认>          ← 公开默认值
2. private/CLAUDE.example.md   ← 团队约定（公开）
3. private/CLAUDE.md   ← 你的私人覆盖（如果存在）
4. ~/.claudecode/CLAUDE.md  ← 全局个人覆盖
```

后者覆盖前者。私人版只写 diff，不必复制公开版。

## 日常自查清单

每次 `git push` 前自问：
- [ ] `git status` 列表里没有 `private/...`？
- [ ] `git log --since=...` 看不到 CLAUDE.md / AGENTS.md？
- [ ] pre-commit hook 在 `core.hooksPath` 上？（`git config core.hooksPath` 应输出 `scripts/git-hooks`）
- [ ] `git config user.email` 是 dwgx1337@outlook.com？

如果用 sub-agent 委托代码工作，prompt 里必须明令禁止它读写 `private/`、`memory/`，并且禁止 git 操作（详见 [14-subagent-dispatch.md](14-subagent-dispatch.md)）。

## 应急预案：私有内容已经 push 了

1. **立刻** rotate 涉及的所有凭据
2. `git filter-repo --invert-paths --path <leaked-file>` 清历史
3. `git push --force` 覆盖远端（需 owner 执行；小心 collaborator 的 reflog）
4. 在 GitHub 仓库设置中触发 cache purge
5. 内容已被搜索引擎/克隆抓取的视为永久泄露，无法挽回——所以**预防是唯一选项**
