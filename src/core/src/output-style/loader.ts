import fs from "node:fs/promises"
import path from "node:path"
import { homedir } from "node:os"
import { fileURLToPath } from "node:url"
import { parseFrontmatterMarkdown } from "../orchestration/frontmatter.ts"
import type { OutputStyle } from "./types.ts"

export const DEFAULT_STYLE_NAME = "default"

export function defaultUserStylesRoot(home = homedir()): string {
  return path.join(home, ".claudecode", "config", "output-styles")
}

export function defaultStateFile(home = homedir()): string {
  return path.join(home, ".claudecode", "state", "output-style")
}

export function builtinStylesRoot(): string {
  // Resolve relative to this module so the path stays correct after bundling.
  const here = fileURLToPath(import.meta.url)
  return path.join(path.dirname(here), "builtins")
}

export async function loadOutputStyles(
  options: {
    builtinRoot?: string
    userRoot?: string
  } = {},
): Promise<OutputStyle[]> {
  const builtinRoot = options.builtinRoot ?? builtinStylesRoot()
  const userRoot = options.userRoot ?? defaultUserStylesRoot()

  const styles: OutputStyle[] = []
  for (const file of await listMarkdown(builtinRoot)) {
    const entry = await parse(file, "builtin")
    if (entry) styles.push(entry)
  }
  for (const file of await listMarkdown(userRoot)) {
    const entry = await parse(file, "user")
    if (entry) {
      // user override wins on name conflict
      const existing = styles.findIndex((s) => s.name === entry.name)
      if (existing >= 0) styles[existing] = entry
      else styles.push(entry)
    }
  }
  styles.sort((a, b) => a.name.localeCompare(b.name))
  return styles
}

export async function loadCurrentStyleName(stateFile = defaultStateFile()): Promise<string> {
  try {
    const raw = await fs.readFile(stateFile, "utf8")
    const trimmed = raw.trim()
    return trimmed || DEFAULT_STYLE_NAME
  } catch {
    return DEFAULT_STYLE_NAME
  }
}

export async function saveCurrentStyleName(name: string, stateFile = defaultStateFile()): Promise<void> {
  await fs.mkdir(path.dirname(stateFile), { recursive: true })
  await fs.writeFile(stateFile, `${name.trim()}\n`, "utf8")
}

async function listMarkdown(dir: string): Promise<string[]> {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const out: string[] = []
  for (const ent of entries) {
    if (ent.isFile() && ent.name.toLowerCase().endsWith(".md")) {
      out.push(path.join(dir, ent.name))
    }
  }
  return out
}

async function parse(file: string, source: "builtin" | "user"): Promise<OutputStyle | undefined> {
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
  const data = fm.frontmatter
  const name = typeof data.name === "string" ? data.name : undefined
  const description = typeof data.description === "string" ? data.description : undefined
  if (!name || !description) return undefined
  const body = fm.body.trim()
  if (!body) return undefined
  return { name, description, body, source, path: file }
}
