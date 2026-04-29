# 12 · 路线图

## 现状

**v0.0.1 — 骨架完成**

- [x] `.gitignore` + `private/` 隔离
- [x] git hooks（pre-commit 三层防御）
- [x] LICENSE + NOTICE + README
- [x] docs 树（部分完成 + 部分待 Codex catalog 后填充）
- [x] Codex prompt 模板包
- [ ] 4 个 Codex catalog 任务并行 dispatch
- [ ] 综合 catalog 输出填 docs 的 stub
- [ ] 从 opencode 移植 src/ + rebrand
- [ ] git init + 首次 commit + push
- [ ] gh repo create dwgx/ClaudeCode --public

## v0.1.0 — 可用最小核

- [ ] `src/` 完整移植自 opencode dev 分支并跑通 `pnpm dev`
- [ ] 基础多 Provider 路由（Anthropic + OpenAI + 一个本地）
- [ ] `/do` 命令 stub
- [ ] 兼容官方 `.claude-plugin/` 协议加载
- [ ] 兼容官方 `skills/` 协议加载
- [ ] 自带 5 个精选 skill（重写过、attribution 齐全）
- [ ] CI（typecheck + lint + hook self-test）

## v0.2.0 — 编排升级

- [ ] Citadel `/do` 完整路由（4 tier 分发）
- [ ] parallel agent fleet（git worktree 隔离）
- [ ] campaign 持久化
- [ ] preset 系统（来自 claude-code-router）

## v0.3.0 — 插件生态

- [ ] 自带 20 个精选 sub-agent
- [ ] plugin marketplace 协议（直接复用 GitHub repo + manifest）
- [ ] 装/卸/升级 plugin 的 CLI

## v1.0.0 — 第一版稳定

- [ ] 所有功能文档化
- [ ] 跨 Win/macOS/Linux 自动化测试
- [ ] 发布 npm `@dwgx/claudecode`（决定保留与否后再启）
- [ ] 中文 + 英文文档对齐

## 不在路线图

- SaaS / 云端
- 商业化
- 取代官方 Claude Code（这是补充，不是替代）
