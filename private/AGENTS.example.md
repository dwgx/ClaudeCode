# 这是占位模板。复制为 `private/AGENTS.md` 后写入你的 sub-agent 私人提示。
# `private/AGENTS.md` 在 .gitignore 锁住，绝不入仓。
#
#   cp private/AGENTS.example.md private/AGENTS.md

## 默认 sub-agent 行为

- 工作目录强制 `D:/Project/ClaudeCode/`
- 禁止读写 `private/`、`memory/`、`.claude/`
- 禁止运行 `git add / commit / push / tag / branch -D / reset --hard`
- 完成后回报结构化摘要（What changed / Decisions / Risks / Next）

## 子代理身份

- codex-spark：低延迟，批处理 grep/列表/简单 edit
- codex-deep：长文件读+总结+长代码生成
- gemini-deep：替补 codex-deep
