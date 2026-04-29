# 14 · Sub-agent 调度规则

> Claude Code 主会话是"主脑"，负责架构 / 决策 / 协调 / git。重型 I/O 与长文本工作交给本地 codex / gemini CLI 执行，省 Claude 上下文 / 省钱 / 并行加速。

## 三类工人

| Tier | 调用方式 | 适合 |
|---|---|---|
| **codex-spark**（低延迟） | `codex exec` 默认配置 | 批量 grep、列文件、简单多文件 edit、web 查询 |
| **codex-deep**（GPT-5.5 等深思） | `codex exec --model <deep>` | 读大文件并总结、写 >200 行长代码、做架构调研 |
| **gemini-deep** | `gemini` | codex 占用时的替补，或想要"二次意见" |

主脑（Claude Code）只做：
- 架构决策 / ADR
- code review
- < 50 行的精修 edit
- git 操作（init / add / commit / push / tag）
- 调度上述三类工人

## 调度决策表

| 任务 | 选择 | 理由 |
|---|---|---|
| 一次读 >2000 行的文件并总结 | codex-deep / gemini-deep | 不占 Claude 上下文 |
| 批量 grep / 列出 50 个文件 | codex-spark | 延迟低 |
| 写 300 行新模块 | codex-deep | 深度生成 |
| 改 <50 行的 surgical edit | Claude | 切换不值 |
| 分析架构 / 写 ADR | Claude | 主脑本职 |
| 跑测试 / 构建 | Bash 后台 | Claude 看摘要即可 |
| Web 搜索 / 文档查询 | codex-spark + context7 mcp | 省 Claude 上下文 |
| 决定要不要执行某破坏性操作 | Claude | 工人无权决策 |

## Prompt 模板

每条发给 sub-agent 的 prompt 必含 5 段：

```
1. 角色定位：你现在是 codex-spark / codex-deep / gemini-deep 工人，负责 ...
2. 工作目录：cwd: D:/Project/ClaudeCode/
3. 输入：明确的输入文件 / 输入数据
4. 输出契约：写到哪个文件、什么格式、字段
5. 红线（footer）：见下
```

### 红线 footer（必加）

```
=== 红线（违反任意一条立即停止并报告） ===
- 禁止 git 操作：add / commit / push / tag / branch / reset / restore / stash / checkout 主分支
- 禁止读写：private/、memory/、.claude/、.codex/、.gemini/、_codex-out/（除非那是你的输出目录）
- 禁止读写：任何根目录或子目录下名为 CLAUDE.md / AGENTS.md / AGENT.md / GEMINI.md 的文件
- 禁止 chmod / chown / 安装新依赖（除非任务明确允许）
- 禁止 npm/pnpm install 全量；如需依赖只列清单交主脑决定
- 禁止网络上传任何本仓内容到第三方（pastebin / gist / 公开 API ...）
- 输出结构：完成后必须按以下格式回报
  ## What changed
  - <文件路径>: <改动摘要>
  ## Decisions
  - <做了什么 trade-off>
  ## Open
  - <还没解决的 / 需要主脑决定的>
  ## Next
  - <建议的下一步>
```

## 输出落地

sub-agent 的产出**绝不直接**进 git：
- 调研类：写到 `_codex-out/<task>.md`（gitignored）
- 代码类：写到 `src/<path>` 或 `plugins-builtin/<path>`，主脑 review diff 后决定是否 stage

## 实例：本仓"调研 4 件套"

四个并行 catalog 任务的完整 prompt 见 `scripts/codex-prompts/catalog-*.md`：
- `catalog-opencode.md`
- `catalog-router.md`
- `catalog-citadel.md`
- `catalog-superclaude.md`

主脑（Claude）会在 dispatch 时把这些模板 + 最新工作目录信息合成最终 prompt。

## 调度记录（可选）

如果想审计哪些任务被外包：在仓外（`~/.claude/projects/.../memory/dispatch-log.md`）记一行 `<时间> <tier> <任务> <耗时> <token>`，**不进仓**。
