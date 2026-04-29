# Codex 任务：catalog claude-code-router

**层级**：codex-deep
**目的**：摸清 `ReferenceSource/claude-code-router-main/` 的路由层 + transformer 系统，回报"我们要吸收哪些设计、要移植哪些代码"。
**预期耗时**：5–8 分钟
**输出**：`_codex-out/router-catalog.md`

---

## 你是谁

ClaudeCode 项目的调研工人，专攻 claude-code-router 的路由层。主脑要把它的 scenario routing + transformer 思想吸收进 ClaudeCode。

## 输入

- cwd：`D:/Project/ClaudeCode/`
- 目标：`ReferenceSource/claude-code-router-main/`
- License：MIT © 2025 musistudio
- 已知 monorepo packages：cli / server / shared / ui

## 输出契约

写到 `_codex-out/router-catalog.md`：

```markdown
# claude-code-router catalog

## 1. 顶层结构
<目录 + 用途>

## 2. Routing 决策算法（最重要）
- 文件位置
- 主函数签名
- 决策流程（伪代码 5–10 行）
- 触发 scenario 的判定逻辑：
  - default
  - background
  - think
  - longContext
  - webSearch
  - image
  - 其它（如有）
- token 估算用了什么（tiktoken / cl100k_base / ...）

## 3. Transformer 系统
- transformer 定义协议（接口/抽象类）
- 内置 transformer 列表 + 一句话用途
- 注册机制
- 全局 vs Provider 级 vs Model 级 应用顺序

## 4. Provider 配置 schema
- Provider 字段一览
- 必填 / 选填
- env 变量插值规则（`$VAR` / `${VAR}`）

## 5. Preset 系统
- preset manifest schema
- export / install 流程
- 敏感字段处理（api_key 占位 ...）

## 6. CLI（ccr）命令
- `ccr start/stop/restart/status/code/model/preset/activate/ui/statusline` 各做什么
- 哪些值得我们移植

## 7. Sub-agent routing 标签
- `<CCR-SUBAGENT-MODEL>` 协议是什么
- 在哪解析

## 8. 我们的建议（吸收清单）
对每个核心模块给一个 verdict：
- `ABSORB（重写）` — 我们重新实现一份风格契合的
- `ABSORB（直接搬）` — 文件级拿过来，加 attribution
- `INSPIRE` — 看一眼记住设计，自己写
- `SKIP` — 不需要

## What changed / Decisions / Open / Next
（按 footer 格式）
```

## 怎么干

1. 看顶层 README 找到核心模块入口
2. 读 `packages/server/src/utils/router.ts`（路由核心）
3. 读 `packages/server/src/transformers/`（如存在）
4. 读 `packages/shared/src/preset/`
5. 读 `packages/cli/src/` 找命令注册
6. 抽样 2–3 个 transformer 看实现风格

## 上限

- 不超过 25 个文件读取
- 总耗时 8 分钟内

---

<!-- footer -->
