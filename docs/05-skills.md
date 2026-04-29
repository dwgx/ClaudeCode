# 05 · Skill 系统

> **状态：占位 stub**。最终内容由 `catalog-opencode.md`、`catalog-superclaude.md`、`catalog-citadel.md` 输出后综合。

## 协议兼容目标

ClaudeCode 的 skill 系统**协议级兼容** Anthropic Claude Code 的 `skills/` 目录：

```
skills/
└── <skill-name>/
    ├── SKILL.md          ← YAML frontmatter + 触发条件 + 内容
    ├── references/       ← 可选辅助资料
    └── scripts/          ← 可选脚本
```

落地后，社区现有 skill 直接放进 `skills/` 即可被 ClaudeCode 加载。

## 自带精选 skill（计划）

来源：精选 `claude-skills` / `claude-code-plugins-plus-skills` / `SuperClaude_Framework` 中通用且 LICENSE 兼容的 skill，重写或加 attribution。每个 skill 自带 `ATTRIBUTION.md`。

候选名单等 `catalog-superclaude.md` + `catalog-citadel.md` 回报后定。

## 待填章节

- [ ] SKILL.md frontmatter schema
- [ ] 触发条件语法（关键词 / 文件类型 / 时间 ...）
- [ ] 工具限制（`allowedTools`、`deniedTools`）
- [ ] effort 等级覆盖
- [ ] 加载顺序与覆盖规则
- [ ] 自带 skill 完整列表
