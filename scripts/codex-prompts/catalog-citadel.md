# Codex 任务：catalog Citadel

**层级**：codex-deep
**目的**：摸清 Citadel 的 `/do` 编排层、parallel fleet、campaign 持久化、hooks 系统，回报吸收清单。
**预期耗时**：5–10 分钟
**输出**：`_codex-out/citadel-catalog.md`

---

## 你是谁

ClaudeCode 调研工人，专攻 Citadel。Citadel 是 "agent orchestration harness"——它在 Claude Code 之上加了一层智能编排。我们要把它的核心抽象吸收过来。

## 输入

- cwd：`D:/Project/ClaudeCode/`
- 目标：`ReferenceSource/Citadel-main/`
- License：MIT © 2026 Seth Gammon
- 已知顶层：agents/, skills/, hooks/, hooks_src/, core/, runtimes/, packages/, scripts/, examples/

## 输出契约

写到 `_codex-out/citadel-catalog.md`：

```markdown
# Citadel catalog

## 1. 顶层结构
<+ 一句话用途>

## 2. /do 命令（核心）
- 实现位置
- 4-tier 分发逻辑：
  - tier 1：直接 edit（无模型调用）
  - tier 2：单模型一次调用
  - tier 3：5-pass 结构化（如 review）
  - tier 4：parallel fleet
- 触发 tier 的判定算法

## 3. Skill 系统
- skill 目录结构
- SKILL.md frontmatter schema（关键字段）
- 触发与加载

## 4. Sub-agent 系统
- agent 定义格式
- 工具白/黑名单
- 怎么 spawn

## 5. Parallel fleet（重要）
- 多 agent 并行的协调机制
- 用 git worktree 还是别的隔离
- discovery 共享的实现
- session 文件位置

## 6. Hooks 系统
- 28 events 列表（如确实是 28）
- 每个 event 的触发时机 + payload schema
- 安装机制（hooks_src/ → 项目 .claude-plugin/...）
- 与官方 Anthropic Claude Code hook events 的对照

## 7. Campaign 持久化
- 数据结构
- 文件位置
- 跨 session 恢复机制
- 与"普通会话"的差异

## 8. 路由 quota 处理
- ROUTINE-QUOTA 文档说官方 Claude Code 路由有 15/24h 限制
- Citadel 怎么本地化这个 quota
- 我们的项目要不要复用

## 9. 与 Codex runtime 的兼容
- runtimes/codex 是干嘛的
- compat 层做了什么

## 10. 我们的建议（吸收清单）
每个模块给 verdict：ABSORB（重写）/ ABSORB（直接搬）/ INSPIRE / SKIP

## What changed / Decisions / Open / Next
```

## 怎么干

1. 读 README + QUICKSTART
2. 找 `/do` 命令注册（grep `do.md` 或 `commands/do`）
3. 读 `core/` 与 `runtimes/`
4. 抽样 3 个 skill + 3 个 agent 看格式
5. 读 hooks 安装脚本
6. 读 docs/ROUTINE-QUOTA.md 理解 quota 处理

## 上限

- 不超过 30 个文件
- 8–10 分钟内

---

<!-- footer -->
