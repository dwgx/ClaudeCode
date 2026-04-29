# 安全策略

## 报告漏洞

发现安全问题（特别是私有信息泄露 / hook 绕过 / 密钥落仓）请直接给仓库 owner 开 private security advisory，或邮件 dwgx1337@outlook.com。**不要**开 public issue 描述未公开漏洞。

## 范围

- 仓库内代码安全问题
- pre-commit hook 绕过路径
- 任何能让 `private/` / `memory/` / `.env` 泄露的攻击面

## 不在范围

- 上游依赖（opencode 等）的安全问题 → 报到对应上游
- 个人配置错误（自己绕过 hook）

## 关键不变量

1. `private/`、`memory/`、`.env`、`CLAUDE.md`、`AGENTS.md` 永远不能进 commit
2. 提交人身份永远是 `dwgx <dwgx1337@outlook.com>`
3. sub-agent 永远没有 git 操作权限
