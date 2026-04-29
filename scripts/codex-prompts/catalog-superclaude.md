# Codex 任务：catalog SuperClaude_Framework

**层级**：codex-deep
**目的**：盘点 SuperClaude 的 30 commands / 20 agents / 7 modes，给主脑一份"我们精选并重写哪些"的候选名单。
**预期耗时**：5–8 分钟
**输出**：`_codex-out/superclaude-catalog.md`

---

## 你是谁

ClaudeCode 调研工人，专攻 SuperClaude_Framework。这个项目是基于 Python，把 30 个 slash 命令、20 个 agent、7 个 mode 装进 `~/.claude/`。我们不直接用它的 Python 安装器；我们要的是**命名、设计、提示词的精选移植清单**。

## 输入

- cwd：`D:/Project/ClaudeCode/`
- 目标：`ReferenceSource/SuperClaude_Framework-master/`
- License：MIT © 2024 SuperClaude Framework Contributors
- 已知关键路径：`src/superclaude/commands/`、`src/superclaude/agents/`、`src/superclaude/modes/`、`src/superclaude/skills/`

## 输出契约

写到 `_codex-out/superclaude-catalog.md`：

```markdown
# SuperClaude catalog

## 1. 顶层结构
<+ 一句话用途>

## 2. Commands（30 个）
列**全部**：
| 名字 | 一句话用途 | 行数 | 我们的建议 |
|---|---|---|---|
| /sc:pm | 产品经理协议 | 200 | PORT |
| ...   |    |    |    |

verdict：
- `PORT` — 我们要重写并入 plugins-builtin/
- `INSPIRE` — 设计有意思，写法借鉴
- `SKIP` — 不需要

## 3. Agents（20 个）
同上表式

## 4. Modes（7 个）
列出 7 个 mode + 用途 + 是否值得吸收

## 5. Skills
SuperClaude 自带的 skill（confidence-check 等）— 哪些 PORT

## 6. Hooks
src/superclaude/hooks/ 里有什么；与官方 hook events 的关系

## 7. PM Agent 三大模式
- ConfidenceChecker
- SelfCheckProtocol
- ReflexionPattern
是否值得做成 ClaudeCode 内建能力

## 8. MCP 推荐清单
SuperClaude 推荐了哪些 MCP server；我们的预设清单要不要对齐

## 9. 整体精选建议
- 一定要 PORT 的 top-10
- 想要 INSPIRE 的 top-5
- 明确 SKIP 的 top-5（说清原因）

## What changed / Decisions / Open / Next
```

## 怎么干

1. 读 README + CLAUDE.md 理解 v4.3 架构
2. 进 commands/ 列文件名 + 抽 5 个读 frontmatter
3. 同样处理 agents/ 与 modes/
4. 读 PM Agent 三大类源码（confidence.py / self_check.py / reflexion.py）头部
5. 看 docs/ 里有 quality-comparison / planning 等高级文档摘要

## 上限

- 不超过 35 个文件
- 8 分钟内

---

<!-- footer -->
