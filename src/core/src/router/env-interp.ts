const ESCAPED_DOLLAR = "\u0000ROUTER_ESCAPED_DOLLAR\u0000"

export function interpolate<T>(value: T, env: Record<string, string | undefined>): T {
  return interpolateValue(value, env) as T
}

function interpolateValue(value: unknown, env: Record<string, string | undefined>): unknown {
  if (typeof value === "string") return interpolateString(value, env)
  if (Array.isArray(value)) return value.map((item) => interpolateValue(item, env))
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, interpolateValue(item, env)]))
  }
  return value
}

function interpolateString(value: string, env: Record<string, string | undefined>): string {
  return value
    .replaceAll("$$", ESCAPED_DOLLAR)
    .replace(/\$\{([A-Za-z0-9_]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (match, braced: string | undefined, bare: string | undefined) => {
      const key = braced ?? bare
      if (!key) return match
      return env[key] ?? match
    })
    .replaceAll(ESCAPED_DOLLAR, "$")
}
