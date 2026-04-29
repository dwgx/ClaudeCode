import type { MemoryEntry } from "./types.ts"

const TYPE_ORDER: Record<string, number> = { user: 0, feedback: 1, project: 2, reference: 3 }

// 注入到 system prompt 的 memory 块。LLM 看到的是这一段。
// 故意保持简短：每条 description + body，按类型分组。
export function formatMemoryForPrompt(entries: MemoryEntry[]): string {
  if (entries.length === 0) return ""

  const sorted = [...entries].sort((a, b) => {
    const ta = TYPE_ORDER[a.type] ?? 99
    const tb = TYPE_ORDER[b.type] ?? 99
    if (ta !== tb) return ta - tb
    return a.name.localeCompare(b.name)
  })

  const lines: string[] = []
  lines.push("<persistent_memory>")
  lines.push("# Persistent memory (loaded from ~/.claudecode/data/memory/)")
  lines.push("# These are facts/preferences/context the user has chosen to persist")
  lines.push("# across sessions. Use them to tailor your responses.")
  lines.push("")

  let lastType: string | undefined
  for (const e of sorted) {
    if (e.type !== lastType) {
      lines.push(`## ${e.type}`)
      lastType = e.type
    }
    lines.push(`### ${e.name}`)
    lines.push(`> ${e.description}`)
    lines.push("")
    lines.push(e.body)
    lines.push("")
  }

  lines.push("</persistent_memory>")
  return lines.join("\n")
}
