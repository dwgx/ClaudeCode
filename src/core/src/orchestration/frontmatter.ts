export interface ParsedMarkdown {
  frontmatter: Record<string, unknown>
  body: string
}

export function parseFrontmatterMarkdown(markdown: string): ParsedMarkdown {
  const text = markdown.replace(/^\uFEFF/, "")
  const lines = text.split(/\r?\n/)

  if (lines[0]?.trim() !== "---") {
    return { frontmatter: {}, body: text }
  }

  const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---")
  if (end === -1) {
    throw new Error("Missing closing frontmatter delimiter")
  }

  return {
    frontmatter: parseYamlSubset(lines.slice(1, end)),
    body: lines.slice(end + 1).join("\n").replace(/^\n/, ""),
  }
}

export function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}

export function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

export function readStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const items = value.filter((item): item is string => typeof item === "string" && item.length > 0)
    return items.length ? items : undefined
  }
  if (typeof value === "string" && value.length > 0) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return undefined
}

function parseYamlSubset(lines: string[]): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  for (let index = 0; index < lines.length; ) {
    const line = lines[index]
    if (!line.trim() || line.trimStart().startsWith("#")) {
      index++
      continue
    }

    const match = /^([A-Za-z0-9_-]+):(?:\s*(.*))?$/.exec(line)
    if (!match) {
      index++
      continue
    }

    const key = match[1]
    const rawValue = match[2] ?? ""

    if (rawValue === "") {
      const list: unknown[] = []
      let cursor = index + 1

      while (cursor < lines.length) {
        const item = /^\s*-\s*(.*)$/.exec(lines[cursor])
        if (!item) break
        list.push(parseScalar(item[1]))
        cursor++
      }

      data[key] = list.length ? list : ""
      index = cursor
      continue
    }

    if (rawValue === ">" || rawValue === ">-" || rawValue === "|" || rawValue === "|-") {
      const block: string[] = []
      let cursor = index + 1

      while (cursor < lines.length) {
        if (/^[A-Za-z0-9_-]+:/.test(lines[cursor])) break
        block.push(lines[cursor].replace(/^\s{2}/, ""))
        cursor++
      }

      data[key] = rawValue.startsWith(">") ? block.join(" ").trim() : block.join("\n").trim()
      index = cursor
      continue
    }

    data[key] = parseScalar(rawValue)
    index++
  }

  return data
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim()
  if (trimmed === "true") return true
  if (trimmed === "false") return false
  if (trimmed === "null") return null
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed)

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim()
    if (!inner) return []
    return inner.split(",").map((item) => parseScalar(item))
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}
