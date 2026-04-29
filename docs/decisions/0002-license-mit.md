# ADR-0002：License = MIT

- 状态：✅ 已采纳
- 日期：2026-04-30
- 决策者：dwgx

## 背景

需要为新仓库选 License。约束：
- 基线 opencode 是 MIT
- 借鉴的 Citadel / SuperClaude / claude-code-router / claude-skills 全是 MIT
- `awesome-claude-code` 是 CC BY-NC-ND 4.0（不能复制内容，仅引用）
- Anthropic 官方 Claude Code 是 commercial all-rights-reserved（不能复制代码）

## 决策

**MIT License，© 2026 dwgx。**

## 理由

- 与所有 MIT 上游兼容
- 用户可自由分发、修改、商用
- 个人项目，主理人不希望承担专利防御类许可（Apache 2）的复杂条款
- 不需要 GPL 风格的 copyleft 传染（个人定制版没必要绑定下游）

## 例外

- `awesome-claude-code` 内容不进仓（CC BY-NC-ND 不兼容 MIT）
- Anthropic 官方代码不进仓（商业条款不兼容）
- 各上游的 LICENSE 副本在对应位置原样保留

## 商标

`ClaudeCode` 仓名 ≠ "Claude" 商标授权。NOTICE.md 已声明 unaffiliated。
