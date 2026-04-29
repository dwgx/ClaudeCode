# 12 · 路线图

## 现状

**v0.0.1 — 骨架完成 + 综合规划完成**（2026-04-30）

- [x] `.gitignore` + `private/` 三层防御
- [x] git hooks（pre-commit 39/39 PASS）
- [x] LICENSE + NOTICE + README + SECURITY + CONTRIBUTING（中文）
- [x] 13 + 3 篇 docs/（全部填实）
- [x] 5 篇 ADR + 8 个 codex prompt 模板
- [x] 4 路 Codex catalog 完成（opencode / router / citadel / superclaude）
- [x] docs/01,03-09 由 catalog 综合填实
- [x] ADR-0004 路由 / 0005 编排 / 0006 skill / 0007 TUI / 0008 兼容
- [x] github.com/dwgx/ClaudeCode public live
- [x] 第二次 commit + push（含全部填实的 docs）
- [x] dispatch Codex ingest opencode → src/ + rebrand
- [x] `bun install` smoke（1969 包装好；rebrand bug 已修；catalog 已加）
- [x] ADR-0009 / 0010 / 0011 / 0012 / 0013 草案（待主脑 review 后转 Accepted）
- [x] v0.1 路由层骨架（src/core/src/routing/，7 文件）
- [x] v0.1 编排层骨架（src/core/src/orchestration/，18 文件）
- [x] 前 3 个 builtin plugin（plugins-builtin/，13 文件）

## v0.1.0 — 可用最小核

**目标**：能跑通 `pnpm dev` 启动 TUI，与至少 2 个 Provider 联通，Anthropic 协议兼容 adapter 可加载现有 skill。

- [ ] `src/` 含 opencode 5 个核心 package（opencode / core / sdk / plugin / script）
- [ ] rebrand `opencode → claudecode` / `OPENCODE_* → CLAUDECODE_*` 完成
- [ ] embedded Web UI 决策（去/留/可选）（ADR-0013）
- [ ] env 前缀迁移策略（ADR-0012）
- [ ] 路由层（按 ADR-0004）：scenario classifier + 4 个 transformer（Anthropic/OpenAI/OpenRouter/Gemini）
- [ ] `/do` Tier 0+2 stub（pattern + keyword）
- [ ] Anthropic skill adapter（`~/.claude/skills/**/SKILL.md` 加载）
- [ ] Anthropic agent adapter
- [ ] Hook event 22-25 个落地（含映射表）
- [ ] `plugins-builtin/` 前 3 个：`confidence-check`、`self-check`、`repo-index`
- [ ] CI（GitHub Actions）：typecheck + lint + hook self-test
- [ ] 跨平台冒烟（Windows / macOS / Linux）

## v0.2.0 — 编排升级

- [ ] `/do` Tier 1+3（active state + LLM classifier）
- [ ] parallel fleet（work queue + 2-3 agents/wave + worktree 隔离）
- [ ] discovery JSONL 持久化
- [ ] campaign markdown 持久化
- [ ] preset 系统（导出/安装/分享配置）（ADR-0011）
- [ ] 自定义 router 函数加载
- [ ] tokenizer service（per-model）
- [ ] 项目级 Router override
- [ ] `plugins-builtin/` 完整 10 个 skill + 11 个 agent
- [ ] MCP CLI（list/add/remove/test/auto/logout/debug）

## v0.3.0 — 生态

- [ ] 完整 Anthropic plugin.json 兼容
- [ ] plugin marketplace（GitHub-based）
- [ ] `claudecode plugin install/upgrade/remove` CLI
- [ ] 自带 sub-agent 库（精选自 awesome-claude-code-subagents，ADR-0009）
- [ ] 自带 skill 库扩充（ADR-0010）
- [ ] `/watch` `/daemon` `/schedule` `/loop` 本地 runner
- [ ] 跨 Win/macOS/Linux 自动化测试
- [ ] 文档站（docs/ 渲染）

## v1.0.0 — 第一版稳定

- [ ] 所有功能文档化齐全
- [ ] 跨平台 release binary
- [ ] 决定是否发布 npm `@dwgx/claudecode`
- [ ] 中英文文档对齐
- [ ] 用户反馈通道（GitHub Discussions）
- [ ] LICENSE / NOTICE 审计

## 不在路线图

- ❌ SaaS / 云端
- ❌ 商业化 / 付费
- ❌ 取代官方 Anthropic Claude Code（这是补充，不是替代）
- ❌ 中央 plugin marketplace 服务
- ❌ 集成 awesome-claude-code（CC BY-NC-ND 协议禁止）
- ❌ 集成官方 Anthropic 闭源代码（许可证禁止）
