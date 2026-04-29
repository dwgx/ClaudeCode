import { describe, expect, test } from "bun:test"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { loadMemory, formatMemoryForPrompt } from "../index.ts"

function makeRoot(): string {
  return mkdtempSync(path.join(tmpdir(), "ccmem-"))
}

function writeMemo(root: string, name: string, content: string): string {
  const file = path.join(root, name)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, content)
  return file
}

describe("memory loader", () => {
  test("returns [] when root missing", async () => {
    const list = await loadMemory("/no/such/dir")
    expect(list).toEqual([])
  })

  test("loads a single user memory", async () => {
    const root = makeRoot()
    writeMemo(
      root,
      "user_role.md",
      `---
name: user role
description: dwgx is a developer
type: user
---

dwgx works on ClaudeCode and prefers Bun runtime.
`,
    )
    const list = await loadMemory(root)
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe("user role")
    expect(list[0].type).toBe("user")
    expect(list[0].body).toContain("Bun runtime")
  })

  test("ignores files without complete frontmatter", async () => {
    const root = makeRoot()
    writeMemo(root, "missing.md", "no frontmatter here just text")
    writeMemo(
      root,
      "partial.md",
      `---
name: incomplete
---

body
`,
    )
    const list = await loadMemory(root)
    expect(list).toHaveLength(0)
  })

  test("ignores invalid type field", async () => {
    const root = makeRoot()
    writeMemo(
      root,
      "bad.md",
      `---
name: x
description: y
type: bogus
---

body
`,
    )
    const list = await loadMemory(root)
    expect(list).toHaveLength(0)
  })

  test("skips MEMORY.md index file", async () => {
    const root = makeRoot()
    writeMemo(root, "MEMORY.md", "- [user](user.md) — index entry")
    writeMemo(
      root,
      "user.md",
      `---
name: u
description: d
type: user
---

body
`,
    )
    const list = await loadMemory(root)
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe("u")
  })

  test("formatMemoryForPrompt empty -> empty string", () => {
    expect(formatMemoryForPrompt([])).toBe("")
  })

  test("formatMemoryForPrompt groups by type", () => {
    const entries = [
      { name: "fb1", description: "d1", type: "feedback" as const, body: "B1", source: "/x" },
      { name: "u1", description: "d2", type: "user" as const, body: "B2", source: "/y" },
      { name: "u2", description: "d3", type: "user" as const, body: "B3", source: "/z" },
    ]
    const out = formatMemoryForPrompt(entries)
    // user group should appear before feedback group
    const uIdx = out.indexOf("## user")
    const fbIdx = out.indexOf("## feedback")
    expect(uIdx).toBeGreaterThan(0)
    expect(fbIdx).toBeGreaterThan(uIdx)
    expect(out).toContain("<persistent_memory>")
    expect(out).toContain("</persistent_memory>")
  })
})
