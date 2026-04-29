# scripts/ingest/rebrand.ps1
# 把 src/ 里 opencode 的 5 个 package 做 opencode → claudecode 改名
#
# 假设：
#   - src/{opencode,core,sdk/js,plugin,script}/ 已经从 ReferenceSource/opencode/ 拷过来了
#   - src/LICENSE-opencode 已经存在（保持不动）
#
# 用法：pwsh -File scripts/ingest/rebrand.ps1
# 一次性脚本，可重跑（幂等：再跑一次不应改任何东西）

[CmdletBinding()]
param(
  [string]$RepoRoot = (Resolve-Path "$PSScriptRoot/../..").Path
)

$ErrorActionPreference = 'Stop'
Set-Location $RepoRoot

if (-not (Test-Path "$RepoRoot/src")) {
  Write-Error "src/ 不存在，先跑 ingest 拷贝"
  exit 1
}

# ============================================================
# Phase A: 字符串映射（顺序敏感，长前缀优先）
# ============================================================
$mappings = @(
  @{ src = '@opencode-ai/sdk';     dst = '@dwgx/claudecode-sdk' }
  @{ src = '@opencode-ai/core';    dst = '@dwgx/claudecode-core' }
  @{ src = '@opencode-ai/plugin';  dst = '@dwgx/claudecode-plugin' }
  @{ src = '@opencode-ai/script';  dst = '@dwgx/claudecode-script' }
  @{ src = '@opencode-ai/ui';      dst = '@dwgx/claudecode-ui' }
  @{ src = 'opencode-ai/sdk';      dst = '@dwgx/claudecode-sdk' }
  @{ src = 'opencode-ai/core';     dst = '@dwgx/claudecode-core' }
  @{ src = 'opencode-ai/plugin';   dst = '@dwgx/claudecode-plugin' }
  @{ src = 'opencode-ai/ui';       dst = '@dwgx/claudecode-ui' }
  @{ src = 'opencode-ai';          dst = '@dwgx/claudecode' }
  @{ src = '@opencode-ai';         dst = '@dwgx' }
  @{ src = 'OPENCODE_';            dst = 'CLAUDECODE_' }
  @{ src = 'OpenCode';             dst = 'ClaudeCode' }
  @{ src = 'sst.dev/anomalyco';    dst = 'github.com/dwgx' }
  @{ src = 'opencode.ai';          dst = 'github.com/dwgx/ClaudeCode' }
  @{ src = 'anomalyco/opencode';   dst = 'dwgx/ClaudeCode' }
  @{ src = 'anomalyco';            dst = 'dwgx' }
  @{ src = 'opencode';             dst = 'claudecode' }
)

$allowedExt = @(
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.json', '.json5', '.jsonc',
  '.toml', '.yaml', '.yml',
  '.md', '.mdx',
  '.sh', '.ps1', '.cmd', '.bat',
  '.nix',
  '.html', '.css', '.scss'
)

# 不替换：LICENSE* / 二进制 / lock
$nameSkip = @('LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENSE-opencode', 'NOTICE', 'NOTICE.md')

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$files = Get-ChildItem -Path "$RepoRoot/src" -Recurse -File -Force `
  | Where-Object {
      $allowedExt -contains $_.Extension.ToLowerInvariant() `
      -and $nameSkip -notcontains $_.Name `
      -and $_.Name -notlike 'LICENSE*'
    }

Write-Host "── Phase A: 字符串替换 ──"
Write-Host "扫描 $($files.Count) 个文件"

$totalHits = 0
$filesModified = 0
$perMapping = @{}
foreach ($m in $mappings) { $perMapping[$m.src] = 0 }

foreach ($f in $files) {
  $content = [IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
  $orig = $content
  foreach ($m in $mappings) {
    if ($content.Contains($m.src)) {
      # 计数后替换
      $count = ($content.Length - $content.Replace($m.src, '').Length) / $m.src.Length
      $perMapping[$m.src] += $count
      $content = $content.Replace($m.src, $m.dst)
    }
  }
  if ($content -ne $orig) {
    [IO.File]::WriteAllText($f.FullName, $content, $utf8NoBom)
    $filesModified += 1
    $changed = ($orig.Length - $content.Length)
    $totalHits += [Math]::Abs($changed)
  }
}

Write-Host "  $filesModified 个文件已修改"
foreach ($m in $mappings) {
  if ($perMapping[$m.src] -gt 0) {
    Write-Host ("  {0,-30} → {1,-30}  hits={2}" -f $m.src, $m.dst, $perMapping[$m.src])
  }
}

# ============================================================
# Phase B: 重写关键 package.json 元信息
# ============================================================
Write-Host ""
Write-Host "── Phase B: package.json 元信息 ──"

$packageOverrides = @{
  'src/opencode/package.json' = @{
    name = '@dwgx/claudecode'
    bin  = $null   # 后面单独处理
  }
  'src/core/package.json' = @{
    name = '@dwgx/claudecode-core'
  }
  'src/sdk/js/package.json' = @{
    name = '@dwgx/claudecode-sdk'
  }
  'src/plugin/package.json' = @{
    name = '@dwgx/claudecode-plugin'
  }
  'src/script/package.json' = @{
    name = '@dwgx/claudecode-script'
  }
}

$repoUrl = 'https://github.com/dwgx/ClaudeCode.git'
$homeUrl = 'https://github.com/dwgx/ClaudeCode'
$bugsUrl = 'https://github.com/dwgx/ClaudeCode/issues'
$author  = 'dwgx <dwgx1337@outlook.com>'

foreach ($entry in $packageOverrides.GetEnumerator()) {
  $rel  = $entry.Key
  $full = Join-Path $RepoRoot $rel
  if (-not (Test-Path $full)) {
    Write-Warning "  缺失：$rel"
    continue
  }

  $json = Get-Content $full -Raw | ConvertFrom-Json -AsHashtable

  # 字符串替换已经把 name 改了；这里覆盖到我们想要的形态
  $json.name       = $entry.Value.name
  $json.version    = '0.0.1'
  $json.repository = @{ type = 'git'; url = $repoUrl }
  $json.homepage   = $homeUrl
  $json.bugs       = @{ url = $bugsUrl }
  $json.author     = $author
  if (-not $json.license) { $json.license = 'MIT' }

  # 删除可能指向 opencode 域的字段
  if ($json.publishConfig -and $json.publishConfig.registry) {
    $json.publishConfig.Remove('registry')
  }
  $json.Remove('funding')

  $out = $json | ConvertTo-Json -Depth 32
  [IO.File]::WriteAllText($full, $out + "`n", $utf8NoBom)
  Write-Host "  ✓ $rel  (name=$($entry.Value.name))"
}

# ============================================================
# Phase C: bin/opencode → bin/claudecode
# ============================================================
Write-Host ""
Write-Host "── Phase C: bin 改名 ──"

$binOld = "$RepoRoot/src/opencode/bin/opencode"
$binNew = "$RepoRoot/src/opencode/bin/claudecode"

if (Test-Path $binOld) {
  Move-Item -LiteralPath $binOld -Destination $binNew -Force
  Write-Host "  ✓ $binOld → $binNew"
} elseif (Test-Path $binNew) {
  Write-Host "  (已存在 $binNew，跳过)"
} else {
  Write-Warning "  $binOld 与 $binNew 都不存在"
}

# 同步 src/opencode/package.json 的 bin 字段
$opPkgPath = "$RepoRoot/src/opencode/package.json"
if (Test-Path $opPkgPath) {
  $op = Get-Content $opPkgPath -Raw | ConvertFrom-Json -AsHashtable
  if ($op.bin -is [string]) {
    $op.bin = './bin/claudecode'
  } elseif ($op.bin -is [System.Collections.IDictionary] -or $op.bin -is [hashtable]) {
    $newBin = @{}
    foreach ($k in @($op.bin.Keys)) {
      $v = $op.bin[$k]
      $nk = $k -replace 'opencode', 'claudecode'
      $nv = $v -replace 'opencode', 'claudecode'
      $newBin[$nk] = $nv
    }
    $op.bin = $newBin
  }
  $out = $op | ConvertTo-Json -Depth 32
  [IO.File]::WriteAllText($opPkgPath, $out + "`n", $utf8NoBom)
  Write-Host "  ✓ src/opencode/package.json bin 字段 已对齐"
}

# ============================================================
# Phase D: 顶层 monorepo package.json
# ============================================================
Write-Host ""
Write-Host "── Phase D: 顶层 package.json ──"

$rootPkg = "$RepoRoot/package.json"
if (Test-Path $rootPkg) {
  Write-Warning "  顶层 package.json 已存在；不覆盖。请人工合并。"
} else {
  $top = [ordered]@{
    '$schema'       = 'https://json.schemastore.org/package.json'
    name            = 'claudecode'
    version         = '0.0.1'
    description     = 'Personal terminal coding agent CLI distribution (opencode-based, MIT). Not affiliated with Anthropic.'
    private         = $true
    type            = 'module'
    packageManager  = 'bun@1.3.13'
    license         = 'MIT'
    author          = $author
    homepage        = $homeUrl
    repository      = @{ type = 'git'; url = $repoUrl }
    bugs            = @{ url = $bugsUrl }
    scripts         = [ordered]@{
      dev          = 'bun run --cwd src/opencode --conditions=browser src/index.ts'
      typecheck    = 'bun turbo typecheck'
      'self-test'  = 'bash scripts/git-hooks/self-test.sh'
      test         = "echo 'do not run tests from root' && exit 1"
    }
    workspaces      = @('src/opencode', 'src/core', 'src/sdk/js', 'src/plugin', 'src/script')
  }
  $out = $top | ConvertTo-Json -Depth 32
  [IO.File]::WriteAllText($rootPkg, $out + "`n", $utf8NoBom)
  Write-Host "  ✓ 创建 package.json (root)"
}

# ============================================================
# Phase E: 最后审计
# ============================================================
Write-Host ""
Write-Host "── Phase E: 残留扫描 ──"

# 扫剩余的 'opencode' / 'OPENCODE_' / 'OpenCode' 字面量
$residualPatterns = @('opencode', 'OPENCODE_', 'OpenCode')
foreach ($pat in $residualPatterns) {
  $hits = 0
  $hitFiles = 0
  foreach ($f in $files) {
    if (-not (Test-Path $f.FullName)) { continue }
    $content = [IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $count = ($content.Length - $content.Replace($pat, '').Length) / $pat.Length
    if ($count -gt 0) {
      $hits += $count
      $hitFiles += 1
    }
  }
  Write-Host ("  '{0}': {1} hits in {2} files" -f $pat, $hits, $hitFiles)
}

Write-Host ""
Write-Host "完成。下一步：人工抽样审 src/ 的 key 文件，再决定 commit。"
