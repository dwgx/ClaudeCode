# ADR-0003：私有 overlay 用仓内 `private/` + gitignored

- 状态：✅ 已采纳
- 日期：2026-04-30
- 决策者：dwgx + Claude Code（主脑）

## 背景

需要在公开仓库里写入"个人版"指令（CLAUDE.md / AGENTS.md），同时**绝对**保证不入 commit。可选：

1. 仓内 `private/` 目录 + `.gitignore`
2. 仓外 `_private/`（在 `D:/Project/ClaudeCode/_private/`）+ symlink 注入
3. 把所有私有内容只放在 `~/.claudecode/`

## 决策

**采用方案 1**：

- 仓内放 `private/`，`.gitignore` 锁住整个目录
- pre-commit hook 二次拦截
- 仓内放 `*.example.md` 作为公开模板，runtime 优先读 `private/CLAUDE.md`，找不到 fallback 到 `*.example.md`

## 取舍

| 方案 | 利 | 弊 |
|---|---|---|
| **1. 仓内 + gitignore（采纳）** | 单仓单目录，模板与私版并排易对照，版本控制可只保护 git 维度 | 物理上文件就在仓内，依赖 .gitignore 与 hook 不出错 |
| 2. 仓外 + symlink | 物理隔离，最安全 | symlink 在 Win 跨用户场景容易踩坑；新机配置麻烦 |
| 3. 仅 `~/.claudecode/` | 全局唯一私版，最简单 | 一台机器一份，跨项目混用 |

方案 2 是最安全的，但对个人开发流程麻烦——主理人在 Windows 上同时跑多个项目，symlink 的成本不值。  
方案 1 + 三层 hook 已经把"误推私有"概率压到极低，足够。

## 三层防御

详见 [docs/13-privacy.md](../13-privacy.md)。

## 复审条件

如果将来：
- 仓库变成多人协作
- Windows symlink 在新版有更好支持
- 出现一次实际的"差点泄露"事件

则切换到方案 2。
