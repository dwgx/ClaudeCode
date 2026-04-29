#!/usr/bin/env bash
# self-test：分别验证 .gitignore 和 pre-commit hook 都在工作
#
# 关键：
#   1. preserve()/restore() —— 测试路径若与真文件冲突，先备份后还原
#   2. reset_index() —— 每个 case 之前清空 index，避免污染
#   3. --no-index —— layer-1 单测 .gitignore 规则不被 staged 状态干扰
#
# 用法：bash scripts/git-hooks/self-test.sh

set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

# 收尾必须把 index 还原到 self-test 跑之前的状态——简单 read-tree HEAD
# 会把调用者已经 staged 的改动也清掉。所以先备份 .git/index，trap 时还原。
__SELFTEST_INDEX_BACKUP="$(mktemp 2>/dev/null || echo "$REPO_ROOT/.git/.selftest-index.bak")"
if [[ -f "$REPO_ROOT/.git/index" ]]; then
  cp -f -- "$REPO_ROOT/.git/index" "$__SELFTEST_INDEX_BACKUP" 2>/dev/null || true
fi
trap '
  if [[ -f "$__SELFTEST_INDEX_BACKUP" ]]; then
    cp -f -- "$__SELFTEST_INDEX_BACKUP" "$REPO_ROOT/.git/index" 2>/dev/null || true
    rm -f -- "$__SELFTEST_INDEX_BACKUP" 2>/dev/null || true
  else
    git read-tree HEAD 2>/dev/null || true
  fi
' EXIT

PASS=0
FAIL=0

reset_index() {
  git read-tree --empty 2>/dev/null || true
}

# 测试若覆盖到真文件——先备份，事后还原
preserve() {
  local file="$1"
  if [[ -e "$file" ]]; then
    cp -af -- "$file" "$file.__selftest_backup__" 2>/dev/null || true
  fi
}
restore() {
  local file="$1"
  if [[ -e "$file.__selftest_backup__" ]]; then
    mv -f -- "$file.__selftest_backup__" "$file" 2>/dev/null || true
  fi
}

# ========== layer-1: gitignore ==========
echo "── Layer 1: .gitignore ──"

test_gitignore() {
  local file="$1"
  local should_ignore="$2"
  preserve "$file"
  mkdir -p "$(dirname -- "$file")"
  echo "selftest" > "$file"

  if git check-ignore --no-index -q -- "$file" 2>/dev/null; then
    actual="yes"
  else
    actual="no"
  fi

  rm -f -- "$file"
  restore "$file"

  if [[ "$actual" == "$should_ignore" ]]; then
    echo "  ✓ $file → ignored=$actual"
    PASS=$((PASS+1))
  else
    echo "  ✗ $file → ignored=$actual (期望 $should_ignore)"
    FAIL=$((FAIL+1))
  fi
}

test_gitignore "private/test-secret.md"     "yes"
test_gitignore "private/notes/secret.md"     "yes"
test_gitignore "private/secrets/key.txt"     "yes"
test_gitignore "memory/test.md"              "yes"
test_gitignore "_codex-out/test.md"          "yes"
test_gitignore "ReferenceSource/test.md"     "yes"
test_gitignore "CLAUDE.md"                    "yes"
test_gitignore "src/CLAUDE.md"               "yes"
test_gitignore ".env"                         "yes"
test_gitignore ".env.production"              "yes"
test_gitignore "test.secret"                  "yes"
test_gitignore "docs/test.md"                "no"
test_gitignore "private/CLAUDE.example.md"   "no"
test_gitignore "private/AGENTS.example.md"   "no"
test_gitignore "private/README.md"            "no"
test_gitignore ".env.example"                 "no"
test_gitignore "private/notes/.gitkeep"       "no"
test_gitignore "private/secrets/.gitkeep"     "no"

# ========== layer-2: pre-commit ==========
echo ""
echo "── Layer 2: pre-commit hook（路径 + 指纹）──"

ORIG_NAME="$(git config user.name 2>/dev/null || true)"
ORIG_EMAIL="$(git config user.email 2>/dev/null || true)"
git config user.name dwgx >/dev/null
git config user.email dwgx1337@outlook.com >/dev/null

test_hook() {
  local name="$1"
  local file="$2"
  local should_block="$3"

  preserve "$file"
  reset_index
  mkdir -p "$(dirname -- "$file")"
  echo "selftest" > "$file"
  git add -f -- "$file" >/dev/null 2>&1

  if bash scripts/git-hooks/pre-commit >/dev/null 2>&1; then
    actual="no"
  else
    actual="yes"
  fi

  reset_index
  rm -f -- "$file"
  restore "$file"

  if [[ "$actual" == "$should_block" ]]; then
    echo "  ✓ $name"
    PASS=$((PASS+1))
  else
    echo "  ✗ $name (期望 block=$should_block, 实际 block=$actual)"
    FAIL=$((FAIL+1))
  fi
}

test_hook "private/CLAUDE.md 应被拦"            "private/CLAUDE.md"               "yes"
test_hook "memory/foo.md 应被拦"                 "memory/foo.md"                   "yes"
test_hook "根 CLAUDE.md 应被拦"                  "CLAUDE.md"                       "yes"
test_hook "AGENTS.md 应被拦"                     "AGENTS.md"                       "yes"
test_hook ".env 应被拦"                           ".env"                            "yes"
test_hook "ReferenceSource/x 应被拦"             "ReferenceSource/x.md"            "yes"
test_hook "私钥文件应被拦"                       "deploy.key"                      "yes"
test_hook "docs/_test-doc.md 不该拦"             "docs/_test-doc.md"               "no"
test_hook "private/CLAUDE.example.md.bak 白名单" "private/CLAUDE.example.md.bak"   "no"
test_hook "private/README.md 白名单"             "private/README.md"               "no"
test_hook ".gitkeep 白名单"                       "src/_selftest/.gitkeep"          "no"
test_hook "src/_selftest_normal.ts 不该拦"       "src/_selftest_normal.ts"         "no"

# ========== layer-2b: 内容指纹 ==========
echo ""
echo "── Layer 2b: 密钥指纹 ──"

test_fingerprint() {
  local name="$1"
  local content="$2"
  local should_block="$3"
  local file="docs/_fp-test.md"

  preserve "$file"
  reset_index
  mkdir -p "$(dirname -- "$file")"
  echo "$content" > "$file"
  git add -f -- "$file" >/dev/null 2>&1

  if bash scripts/git-hooks/pre-commit >/dev/null 2>&1; then
    actual="no"
  else
    actual="yes"
  fi

  reset_index
  rm -f -- "$file"
  restore "$file"

  if [[ "$actual" == "$should_block" ]]; then
    echo "  ✓ $name"
    PASS=$((PASS+1))
  else
    echo "  ✗ $name (期望 block=$should_block, 实际 block=$actual)"
    FAIL=$((FAIL+1))
  fi
}

test_fingerprint "AWS key 应被拦"        "AKIA1234567890ABCDEF"               "yes"
test_fingerprint "OpenAI key 应被拦"      "sk-abcdef1234567890abcdef1234567890abcdef" "yes"
test_fingerprint "Anthropic key 应被拦"   "sk-ant-abc123def456ghi789jkl"             "yes"
test_fingerprint "PEM 头应被拦"           "-----BEGIN RSA PRIVATE KEY-----"           "yes"
test_fingerprint "正常文本不拦"            "Hello, this is a normal markdown file."   "no"

# ========== layer-2c: 身份校验 ==========
echo ""
echo "── Layer 2c: 身份校验 ──"

test_identity() {
  local name="$1"
  local set_name="$2"
  local set_email="$3"
  local should_block="$4"
  local file="docs/_id-test.md"

  preserve "$file"
  reset_index
  mkdir -p "$(dirname -- "$file")"
  echo "x" > "$file"
  git add -f -- "$file" >/dev/null 2>&1

  git config user.name  "$set_name"  >/dev/null
  git config user.email "$set_email" >/dev/null

  if bash scripts/git-hooks/pre-commit >/dev/null 2>&1; then
    actual="no"
  else
    actual="yes"
  fi

  reset_index
  rm -f -- "$file"
  restore "$file"

  if [[ "$actual" == "$should_block" ]]; then
    echo "  ✓ $name"
    PASS=$((PASS+1))
  else
    echo "  ✗ $name (期望 block=$should_block, 实际 block=$actual)"
    FAIL=$((FAIL+1))
  fi
}

test_identity "正确身份不拦"   "dwgx"     "dwgx1337@outlook.com"  "no"
test_identity "错误邮箱拦"      "dwgx"     "wrong@example.com"     "yes"
test_identity "错误名字拦"      "someone"  "dwgx1337@outlook.com"  "yes"
test_identity "空身份拦"         ""         ""                       "yes"

# 还原
git config user.name dwgx >/dev/null
git config user.email dwgx1337@outlook.com >/dev/null
reset_index

# 清残留 sandbox
rmdir docs/_id-test.md 2>/dev/null || true
rmdir src/_selftest 2>/dev/null
rmdir src 2>/dev/null

echo ""
echo "═════════════════════"
echo "  PASS=$PASS  FAIL=$FAIL"
echo "═════════════════════"
[[ $FAIL -eq 0 ]] || exit 1
