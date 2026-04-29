// 文件路径 ranking 加权辅助函数。返回 multiplier，可乘到 fuzzysort 等基础得分上。
// 设计目标：filename match > path-segment match > substring，源码优先于配置/数据。

const SOURCE_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "go",
  "py",
  "rs",
  "java",
  "kt",
  "swift",
  "rb",
  "php",
  "c",
  "cc",
  "cpp",
  "cxx",
  "h",
  "hpp",
  "cs",
  "scala",
  "ex",
  "exs",
  "erl",
  "clj",
  "lua",
  "vue",
  "svelte",
  "astro",
])

const DOC_EXTENSIONS = new Set(["md", "mdx", "rst", "txt", "adoc"])

const NOISE_EXTENSIONS = new Set([
  "lock",
  "log",
  "min.js",
  "map",
  "snap",
  "gen.ts",
  "d.ts",
])

const NOISE_DIR_HINTS = new Set([
  "node_modules",
  "dist",
  "build",
  "__pycache__",
  ".next",
  ".turbo",
  ".cache",
  "vendor",
])

export function basenameOf(filePath: string): string {
  const trimmed = filePath.endsWith("/") ? filePath.slice(0, -1) : filePath
  const slash = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"))
  return slash >= 0 ? trimmed.slice(slash + 1) : trimmed
}

export function extensionOf(name: string): string {
  // gen.ts / d.ts / min.js double-extension awareness
  for (const compound of NOISE_EXTENSIONS) {
    if (compound.includes(".") && name.toLowerCase().endsWith("." + compound)) return compound
  }
  const dot = name.lastIndexOf(".")
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ""
}

export function isTestPath(filePath: string): boolean {
  const lower = filePath.toLowerCase()
  return (
    /\b__tests__\b/.test(lower) ||
    /\.(test|spec)\.[a-z]+$/.test(lower) ||
    /\b__mocks__\b/.test(lower) ||
    /\bfixtures\b/.test(lower)
  )
}

export function isNoisePath(filePath: string): boolean {
  const lower = filePath.toLowerCase()
  for (const hint of NOISE_DIR_HINTS) {
    if (lower.includes("/" + hint + "/") || lower.startsWith(hint + "/")) return true
  }
  const ext = extensionOf(basenameOf(filePath))
  return NOISE_EXTENSIONS.has(ext)
}

export function isSourceFile(filePath: string): boolean {
  const ext = extensionOf(basenameOf(filePath))
  return SOURCE_EXTENSIONS.has(ext)
}

export function isDocFile(filePath: string): boolean {
  const ext = extensionOf(basenameOf(filePath))
  return DOC_EXTENSIONS.has(ext)
}

export interface RankInput {
  path: string
  query: string
  // 调用方来自 frecency 的归一化分（0~1）
  frecency?: number
  // 调用方判断 query 是否提及 "test/spec"（避免我们重复演算）
  queryWantsTest?: boolean
}

export interface RankBreakdown {
  multiplier: number
  hits: string[]
}

// 主入口：返回 multiplier ∈ [0.5, 4]。乘到 fuzzysort score 上排序。
export function rankMultiplier(input: RankInput): RankBreakdown {
  const path = input.path
  const query = input.query.trim().toLowerCase()
  const base = basenameOf(path).toLowerCase()
  const hits: string[] = []
  let mult = 1.0

  if (query) {
    if (base === query) {
      mult *= 3.0
      hits.push("basename:exact")
    } else if (base.startsWith(query)) {
      mult *= 1.8
      hits.push("basename:prefix")
    } else if (base.includes(query)) {
      mult *= 1.3
      hits.push("basename:contains")
    }
  }

  if (isSourceFile(path)) {
    mult *= 1.25
    hits.push("type:source")
  } else if (isDocFile(path)) {
    mult *= 1.1
    hits.push("type:doc")
  }

  const queryWantsTest =
    input.queryWantsTest ?? /\b(test|spec|fixture|mock)/i.test(input.query)
  if (isTestPath(path) && !queryWantsTest) {
    mult *= 0.7
    hits.push("test:demoted")
  }

  if (isNoisePath(path)) {
    mult *= 0.5
    hits.push("noise:demoted")
  }

  if (input.frecency && input.frecency > 0) {
    // 上限放宽：高频用过的路径 multiplier 最多 +50%
    const freBoost = 1 + Math.min(0.5, input.frecency * 0.5)
    mult *= freBoost
    hits.push(`frecency:${freBoost.toFixed(2)}`)
  }

  return { multiplier: Math.max(0.5, Math.min(4, mult)), hits }
}
