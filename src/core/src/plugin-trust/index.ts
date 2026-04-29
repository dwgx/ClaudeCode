// L1 trust prefix gate — see ADR-0014.
// 用法：在 plugin install 前调一次，判断是否可零摩擦放行。

export type TrustLevel = "builtin" | "first-party" | "official-upstream" | "local-path" | "third-party"

export interface TrustVerdict {
  level: TrustLevel
  trusted: boolean
  reason: string
}

const FIRST_PARTY_PREFIXES = ["@dwgx/claudecode-", "@dwgx/"]
const OFFICIAL_UPSTREAM_PREFIXES = ["@anthropic-ai/", "@opencode-ai/"]

// 注意：此处只判断 spec 字符串的前缀。安装时实际下载内容的完整性需要 L2（sha256 锁）保证。
export function evaluateTrust(spec: string): TrustVerdict {
  const s = spec.trim()
  if (!s) return { level: "third-party", trusted: false, reason: "empty spec" }

  if (s.startsWith("./") || s.startsWith("../") || s.startsWith("/") || /^[A-Za-z]:[\\/]/.test(s) || s.startsWith("file:")) {
    return { level: "local-path", trusted: true, reason: "local file path — user-authored code" }
  }

  for (const prefix of FIRST_PARTY_PREFIXES) {
    if (s.startsWith(prefix)) {
      return { level: "first-party", trusted: true, reason: `first-party prefix ${prefix}` }
    }
  }

  for (const prefix of OFFICIAL_UPSTREAM_PREFIXES) {
    if (s.startsWith(prefix)) {
      return { level: "official-upstream", trusted: true, reason: `official upstream prefix ${prefix}` }
    }
  }

  return {
    level: "third-party",
    trusted: false,
    reason: "unrecognized prefix — third-party plugin requires explicit consent",
  }
}

// 环境变量 escape hatch（CI / 沙箱环境用）
export function trustAllOverride(): boolean {
  return process.env.CLAUDECODE_PLUGIN_TRUST_ALL === "1"
}
