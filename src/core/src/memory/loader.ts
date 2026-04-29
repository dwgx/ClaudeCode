import fs from "node:fs/promises"
import path from "node:path"
import { homedir } from "node:os"
import { parseFrontmatterMarkdown } from "../orchestration/frontmatter.ts"
import type { MemoryEntry, MemoryType } from "./types.ts"

const VALID_TYPES = new Set<MemoryType>(["user", "feedback", "project", "reference"])

export function defaultMemoryRoot(home = homedir()): string {
  return path.join(home, ".claudecode", "data", "memory")
}

export async function loadMemory(root: string): Promise<MemoryEntry[]> {
  let stat
  try {
    stat = await fs.stat(root)
  } catch {
    return []
  }
  if (!stat.isDirectory()) return []

  const files = await listMarkdown(root)
  const entries: MemoryEntry[] = []
  for (const file of files) {
    const base = path.basename(file)
    if (base.toUpperCase() === "MEMORY.MD") continue  // 索引文件本身不算 entry
    const entry = await parseMemoryFile(file)
    if (entry) entries.push(entry)
  }
  entries.sort((a, b) => a.name.localeCompare(b.name))
  return entries
}

async function listMarkdown(dir: string): Promise<string[]> {
  const out: string[] = []
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      out.push(...(await listMarkdown(full)))
    } else if (ent.isFile() && ent.name.toLowerCase().endsWith(".md")) {
      out.push(full)
    }
  }
  return out
}

async function parseMemoryFile(file: string): Promise<MemoryEntry | undefined> {
  let raw: string
  try {
    raw = await fs.readFile(file, "utf8")
  } catch {
    return undefined
  }

  let fm
  try {
    fm = parseFrontmatterMarkdown(raw)
  } catch {
    return undefined
  }

  // 没有 frontmatter 块时 frontmatter 是 {}，不是 memory 文件
  if (Object.keys(fm.frontmatter).length === 0) return undefined

  const data = fm.frontmatter
  const name = typeof data.name === "string" ? data.name : undefined
  const description = typeof data.description === "string" ? data.description : undefined
  const type = typeof data.type === "string" ? (data.type as MemoryType) : undefined

  if (!name || !description || !type) return undefined
  if (!VALID_TYPES.has(type)) return undefined

  const originSessionId = typeof data.originSessionId === "string" ? data.originSessionId : undefined

  return {
    name,
    description,
    type,
    body: fm.body.trim(),
    source: file,
    originSessionId,
  }
}
