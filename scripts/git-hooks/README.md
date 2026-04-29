# scripts/git-hooks/

仓库私有文件保护的最后一道防线。

## 安装

```bash
bash scripts/git-hooks/install.sh
```

这会：
- 设置 `core.hooksPath = scripts/git-hooks`（不是 symlink，跨平台）
- 强制 `user.name = dwgx` / `user.email = dwgx1337@outlook.com`

## 自测

```bash
bash scripts/git-hooks/self-test.sh
```

## hook 列表

| hook | 作用 |
|---|---|
| `pre-commit` | (1) 路径黑名单 (2) 提交人身份 (3) 密钥指纹 |

## 路径黑名单（命中即拒）

- `private/`、`_private/`、`.private/`
- `memory/`、`notes/`、`_codex-out/`、`_gemini-out/`、`_research/`、`_scratch/`
- `ReferenceSource/`
- `.claude/`、`.codex/`、`.gemini/`
- `CLAUDE.md`、`AGENTS.md`、`AGENT.md`、`GEMINI.md`（根级或任何子目录）
- `.env`、`.env.*`（除 `.env.example`）
- `*.secret`、`*.key`、`*.pem`、`*.pfx`
- `credentials.json`、`service-account*.json`

## 白名单例外（允许入仓）

- `*.example.*`、`*.template.*`
- `private/README.md`（说明文件本身）
- `.gitkeep`

## 密钥指纹（命中即拒）

- AWS access key (`AKIA...`)
- OpenAI key (`sk-...`)
- Anthropic key (`sk-ant-...`)
- GitHub PAT (`ghp_/ghs_...`)
- Google API key (`AIza...`)
- PEM private key 头

## 提交人身份强制

```
user.name  == dwgx
user.email == dwgx1337@outlook.com
```

不一致直接拒绝。改 global config 不会影响这里 —— per-repo 覆盖优先。

## 不要绕过

`--no-verify` 是核武器。绕过 = 把私有文件公开。  
真要紧急绕过：先把 hook 改对，commit 完再恢复。
