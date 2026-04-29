import fs from "node:fs/promises"
import path from "node:path"
import { homedir } from "node:os"
import type { AnthropicHookSettings, AnthropicHookMatcher, AnthropicHookEventName } from "./types.ts"

// 默认搜索路径，按优先级（前面的覆盖后面的同 event）：
// 1. <repo>/.claudecode/settings.json (project)
// 2. ~/.claudecode/config/settings.json (user)
// 3. ~/.claude/settings.json (Anthropic CC 兼容)
export function defaultSettingsRoots(repoRoot: string, home = homedir()): string[] {
  return [
    path.join(repoRoot, ".claudecode", "settings.json"),
    path.join(home, ".claudecode", "config", "settings.json"),
    path.join(home, ".claude", "settings.json"),
  ]
}

export async function loadHookSettings(roots: string[]): Promise<AnthropicHookSettings> {
  const merged: Required<AnthropicHookSettings>["hooks"] = {}
  for (const file of roots) {
    const parsed = await readJsonSafe(file)
    if (!parsed || typeof parsed !== "object") continue
    const hooks = (parsed as AnthropicHookSettings).hooks
    if (!hooks) continue
    for (const [event, matchers] of Object.entries(hooks)) {
      if (!Array.isArray(matchers)) continue
      const key = event as AnthropicHookEventName
      const existing = merged[key] ?? []
      // project 覆盖 user 覆盖 anthropic：先来的优先；后来不能挤掉先来
      // 简化语义：append。让用户在每个文件里只配自己关心的事件。
      merged[key] = existing.concat(matchers as AnthropicHookMatcher[])
    }
  }
  return { hooks: merged }
}

async function readJsonSafe(file: string): Promise<unknown> {
  try {
    const text = await fs.readFile(file, "utf8")
    return JSON.parse(text)
  } catch {
    return undefined
  }
}
