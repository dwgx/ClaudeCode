# 02 · 快速开始

> 当前是 **alpha 阶段**，src/ 还在移植；本文档先给出未来稳定版的预期流程。骨架阶段只能跑 hook 自测和文档浏览。

## 系统要求

- Bun ≥ 1.3
- Node.js ≥ 20
- pnpm ≥ 10
- git ≥ 2.40

## 拉代码

```bash
git clone https://github.com/dwgx/ClaudeCode.git
cd ClaudeCode
```

## 装依赖

```bash
pnpm install
```

## 装 git hooks（推荐立即做）

```bash
bash scripts/git-hooks/install.sh
bash scripts/git-hooks/self-test.sh
```

## 配置

> 详见 [03-config.md](03-config.md)（待 src/ 移植后填充）。

最小 `.env`：

```bash
cp .env.example .env
# 填入你的 ANTHROPIC_API_KEY 或其它 Provider key
```

## 跑起来

```bash
# 开发 TUI（src/ 移植后）
pnpm dev

# CLI（src/ 移植后）
pnpm cli .
```

## 首次使用

> 移植完后填这一节，给出常用命令例子（`/do review`、`/do fix`、`/model` 切换等）。

## 私人指令

把你的私人偏好写到 `private/CLAUDE.md`（不会入仓）。模板：

```bash
cp private/CLAUDE.example.md private/CLAUDE.md
$EDITOR private/CLAUDE.md
```

## 卸载

```bash
cd .. && rm -rf ClaudeCode/
```
