import { readdir, readFile } from "node:fs/promises"
import { homedir } from "node:os"
import { extname, join, resolve } from "node:path"
import {
  parseFrontmatterMarkdown,
  readNumber,
  readString,
  readStringArray,
} from "../frontmatter.ts"
import type { AgentDef } from "./types.ts"

export interface AgentLoaderOptions {
  roots: string[]
}

export function defaultAgentRoots(repoRoot: string, homeDir = homedir()): string[] {
  return [join(repoRoot, ".claude", "agents"), join(homeDir, ".claude", "agents")]
}

export async function loadAgents(options: AgentLoaderOptions): Promise<AgentDef[]> {
  const files = await collectMarkdownFiles(options.roots)
  const agents = new Map<string, AgentDef>()

  for (const file of files) {
    const agent = await parseAgentFile(file)
    if (!agents.has(agent.name)) {
      agents.set(agent.name, agent)
    }
  }

  return [...agents.values()].sort((left, right) => left.source.localeCompare(right.source))
}

export async function parseAgentFile(source: string): Promise<AgentDef> {
  return parseAgentMarkdown(await readFile(source, "utf8"), source)
}

export function parseAgentMarkdown(markdown: string, source: string): AgentDef {
  const parsed = parseFrontmatterMarkdown(markdown)
  const name = readString(parsed.frontmatter.name)
  const description = readString(parsed.frontmatter.description)

  if (!name || !description) {
    throw new Error(`Invalid agent frontmatter in ${source}: name and description are required`)
  }

  return {
    name,
    description,
    tools: readStringArray(parsed.frontmatter.tools),
    disallowedTools: readStringArray(
      parsed.frontmatter.disallowedTools ??
        parsed.frontmatter.disallowed_tools ??
        parsed.frontmatter["disallowed-tools"],
    ),
    model: readString(parsed.frontmatter.model),
    maxTurns: readNumber(parsed.frontmatter.maxTurns ?? parsed.frontmatter.max_turns),
    effort: readEffort(parsed.frontmatter.effort),
    skills: readStringArray(parsed.frontmatter.skills),
    body: parsed.body,
    source: resolve(source),
  }
}

async function collectMarkdownFiles(roots: string[]): Promise<string[]> {
  const files: string[] = []
  for (const root of roots) {
    files.push(...(await walkForMarkdown(root)))
  }
  return files
}

async function walkForMarkdown(root: string): Promise<string[]> {
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
      files.push(...(await walkForMarkdown(fullPath)))
      continue
    }
    if (entry.isFile() && extname(entry.name) === ".md") {
      files.push(fullPath)
    }
  }
  return files
}

function readEffort(value: unknown): AgentDef["effort"] | undefined {
  return value === "low" || value === "medium" || value === "high" ? value : undefined
}

function isMissingPath(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}
