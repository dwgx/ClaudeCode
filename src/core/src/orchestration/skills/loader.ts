import { readdir, readFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join, resolve } from "node:path"
import {
  parseFrontmatterMarkdown,
  readBoolean,
  readString,
  readStringArray,
} from "../frontmatter.ts"
import type { Skill } from "./types.ts"

export interface SkillLoaderOptions {
  roots: string[]
}

export function defaultSkillRoots(repoRoot: string, homeDir = homedir()): string[] {
  return [join(repoRoot, ".claude", "skills"), join(homeDir, ".claude", "skills")]
}

export async function loadSkills(options: SkillLoaderOptions): Promise<Skill[]> {
  const files = await collectNamedFiles(options.roots, "SKILL.md")
  const skills = new Map<string, Skill>()

  for (const file of files) {
    const skill = await parseSkillFile(file)
    if (!skills.has(skill.name)) {
      skills.set(skill.name, skill)
    }
  }

  return [...skills.values()].sort((left, right) => left.source.localeCompare(right.source))
}

export async function parseSkillFile(source: string): Promise<Skill> {
  return parseSkillMarkdown(await readFile(source, "utf8"), source)
}

export function parseSkillMarkdown(markdown: string, source: string): Skill {
  const parsed = parseFrontmatterMarkdown(markdown)
  const name = readString(parsed.frontmatter.name)
  const description = readString(parsed.frontmatter.description)

  if (!name || !description) {
    throw new Error(`Invalid skill frontmatter in ${source}: name and description are required`)
  }

  return {
    name,
    description,
    user_invocable: readBoolean(parsed.frontmatter.user_invocable ?? parsed.frontmatter["user-invocable"]),
    auto_trigger: readStringArray(
      parsed.frontmatter.auto_trigger ??
        parsed.frontmatter["auto-trigger"] ??
        parsed.frontmatter.trigger_keywords,
    ),
    tools: readStringArray(parsed.frontmatter.tools ?? parsed.frontmatter.allowedTools),
    body: parsed.body,
    source: resolve(source),
  }
}

async function collectNamedFiles(roots: string[], fileName: string): Promise<string[]> {
  const files: string[] = []

  for (const root of roots) {
    files.push(...(await walkForFile(root, fileName)))
  }

  return files
}

async function walkForFile(root: string, fileName: string): Promise<string[]> {
  let entries
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch (error) {
    if (isMissingPath(error)) return []
    throw error
  }

  const files: string[] = []
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const fullPath = join(root, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walkForFile(fullPath, fileName)))
      continue
    }
    if (entry.isFile() && entry.name === fileName) {
      files.push(fullPath)
    }
  }
  return files
}

function isMissingPath(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}
