#!/usr/bin/env bash
# 把 scripts/git-hooks/ 注册到当前仓库的 hooksPath
# 用法：bash scripts/git-hooks/install.sh

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# 用 core.hooksPath 而不是 symlink —— 跨平台一致
git config core.hooksPath scripts/git-hooks

# 给 hook 加可执行位（Windows 下 git 会自动忽略，但 macOS/Linux 必须）
chmod +x scripts/git-hooks/pre-commit 2>/dev/null || true

# 强制 user.name / user.email 为 dwgx
git config user.name "dwgx"
git config user.email "dwgx1337@outlook.com"

echo "✓ core.hooksPath = scripts/git-hooks"
echo "✓ user.name      = dwgx"
echo "✓ user.email     = dwgx1337@outlook.com"
echo ""
echo "下一步：bash scripts/git-hooks/self-test.sh"
