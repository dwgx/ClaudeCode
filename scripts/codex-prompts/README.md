# scripts/codex-prompts/

发给本地 codex / gemini CLI 的 prompt 模板。**不直接喂**——主脑（Claude Code）在每次 dispatch 时拼装：

```
<模板正文> + <每次任务特定的输入参数> + <_footer.md 的红线段>
```

## 文件

| 文件 | 用途 | 类型 |
|---|---|---|
| `_footer.md` | 红线 + 报告格式 footer，所有 prompt 必须 append | 公共 |
| `catalog-opencode.md` | 调研 opencode 结构 | 调研 |
| `catalog-router.md` | 调研 claude-code-router 路由层 | 调研 |
| `catalog-citadel.md` | 调研 Citadel `/do` + fleet | 调研 |
| `catalog-superclaude.md` | 调研 SuperClaude 30/20/7 | 调研 |
| `rebrand-opencode.md` | 复制 + rebrand opencode 到 `src/` | 执行 |

## 调度方式

主脑在会话里调用 `codex-subagent` skill（或 `gemini-subagent`），把模板内容 + 任务参数喂进去。

调研类输出到 `_codex-out/<name>.md`（gitignored）。
执行类输出实际文件改动 + `_codex-out/<task>-report.md`。

## 加新模板时

- 必须以 `_footer.md` 红线结尾
- 必须明确 cwd / 输入 / 输出契约
- 必须有 "上限"（避免工人无止境读文件）
- 调研类不超过 35 文件 / 10 分钟
- 执行类必须列清楚白名单文件类型与映射规则
