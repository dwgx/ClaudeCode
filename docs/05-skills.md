# 05 · Skill 系统

## 概念

Skill 是一个**只在被触发时才加载到上下文**的复用知识/协议单元。零成本闲置——只有路由命中或用户显式调用时才把全文塞进 prompt。

## 协议（兼容 Anthropic Claude Code + Citadel）

```
skills/
└── <skill-name>/
    ├── SKILL.md           ← 主文件（YAML frontmatter + body）
    ├── references/        ← 可选辅助资料（按需 lazy 加载）
    └── scripts/           ← 可选脚本（hook 或工具调用）
```

### SKILL.md frontmatter

```yaml
---
name: confidence-check
description: 实现前 5 项 confidence gate（重复实现/架构/官方文档/OSS/根因），≥0.90 才实现
user-invocable: true
auto-trigger: false
last-updated: 2026-04-30
trigger_keywords:
  - confidence
  - preflight
  - assess
allowedTools:
  - Read
  - Grep
  - WebFetch
deniedTools:
  - Bash
  - Write
effort: medium             # low / medium / high
---
```

### 必需字段

- `name` — 唯一 skill 标识
- `description` — 一句话用途；用于 router 命中判断

### 可选字段

- `user-invocable` — 用户能否直接 `/skill-name` 调用
- `auto-trigger` — 是否允许 router 自动命中
- `last-updated` — 维护信号
- `trigger_keywords` — router keyword match 表
- `allowedTools` / `deniedTools` — tool 白/黑名单
- `effort` — 复杂度建议（影响默认 max_tokens）

### 标准 body 段（来自 Citadel）

```markdown
## Identity
你是一个 ___ 专家，目标是 ___。

## Orientation
读 ___ 文件了解上下文。

## Protocol
1. ___
2. ___

## Quality Gates
- 必须满足 ___ 才进入下一步。

## Exit Protocol
完成后输出 ___ 结构化报告。
```

不强制，但建议遵守——router/fleet 共享上下文时识别这些标记可以做更聪明的事。

## 加载顺序

```
1. <repo>/.claudecode/skills/<name>/SKILL.md          (项目级)
2. <repo>/skills/<name>/SKILL.md                      (项目级备选)
3. config.skills.paths[]                              (用户配置)
4. config.skills.urls[]                               (远端 URL)
5. plugin 提供的 skills                                (来自 plugins-builtin/ + 用户装的 plugin)
6. ~/.claudecode/skills/<name>/SKILL.md               (用户全局)
7. ~/.claude/skills/<name>/SKILL.md                   (Anthropic 兼容；可关 `claudeCodeCompat: false`)
```

后者被前者覆盖（同 name 时）。

## 触发方式

### 1. 用户显式

```
/<skill-name>           # 调用 user-invocable: true 的 skill
```

### 2. router auto-trigger

`/do` 编排层 Tier 2 用 `trigger_keywords` 匹配用户 prompt；命中则 inject skill 全文。

### 3. plugin 触发

plugin 在自定义 hook 里调用 `skill.invoke(name, ctx)`。

### 4. agent 加载

agent frontmatter 的 `skills:` 列表会预加载该 agent 可用的 skill 集。

## 自带精选 skill（plugins-builtin/）

来源：精选自 SuperClaude / claude-skills / claude-code-plugins-plus-skills。详见 [ADR-0006](decisions/0006-builtin-skills.md)。

第一批（v0.1，10 个）：

| skill | 来源 | 触发 | 说明 |
|---|---|---|---|
| `confidence-check` | SuperClaude | 风险高任务前 | 5 项 weighted gate；阈值 ≥0.90 |
| `self-check` | SuperClaude | 实现/修复后 | 4 问 + 红旗扫描 |
| `reflexion-lite` | SuperClaude | 失败后 | 错误学习；可关 |
| `repo-index` | SuperClaude | 接手大仓 | token 压缩 + briefing |
| `troubleshoot` | SuperClaude | "为什么/error/bug" | RCA |
| `research` | SuperClaude | "研究/对比" | 深度 web research |
| `brainstorm` | SuperClaude | "我想做.../需求" | 苏格拉底问答 |
| `spec-panel` | SuperClaude | 规格评审 | 多专家审稿 |
| `quality-test` | SuperClaude | "test/coverage" | 测试质量闭环 |
| `pm-lite` | SuperClaude | 多 agent 任务 | plan/checkpoint/evidence |

每个 skill 自带 `ATTRIBUTION.md`，说明上游来源 + LICENSE + 改动摘要。

## 解析实现

参考 Citadel `core/skills/parse-skill.js`：
- 简单 frontmatter parser；支持 scalar 和 block `description: >-`
- ⚠ 我们要**增强 YAML list 解析**——Citadel 自身对 `trigger_keywords:` list 解析能力有限
- `validateParsedSkill()` 检查 required frontmatter 和 required sections

## 性能

- skill 闲置 0 token 占用
- router 路由阶段只扫 frontmatter（非全文）
- 命中后才 inject 全文 → token 计入当次会话

## 与 Anthropic 官方 skill 的差异

| 维度 | Anthropic | ClaudeCode |
|---|---|---|
| 文件格式 | `SKILL.md` (YAML frontmatter) | ✅ 一致 |
| 必需字段 | `name`, `description` | ✅ 一致 |
| 触发 | LLM 上下文感知 | router keyword 表 + LLM 兜底 |
| 工具限制 | `allowedTools` | ✅ 一致 + `deniedTools` |
| effort 覆盖 | yes | ✅ 一致 |
| references/ scripts/ | 支持 | ✅ 一致 |

兼容程度：高——Anthropic 现有 skill **直接放进 `skills/` 即可被 ClaudeCode 加载**。
