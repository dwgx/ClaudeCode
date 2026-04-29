import { describe, expect, test } from "bun:test"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import {
  loadOutputStyles,
  loadCurrentStyleName,
  saveCurrentStyleName,
  formatOutputStyleForPrompt,
  DEFAULT_STYLE_NAME,
} from "../index.ts"

function tmp(): string {
  return mkdtempSync(path.join(tmpdir(), "ccstyle-"))
}

function write(file: string, content: string): string {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, content)
  return file
}

describe("output-style loader", () => {
  test("returns empty when both roots missing", async () => {
    const styles = await loadOutputStyles({ builtinRoot: "/no/such", userRoot: "/no/such2" })
    expect(styles).toEqual([])
  })

  test("loads builtins (using real builtin root)", async () => {
    const styles = await loadOutputStyles({ userRoot: "/no/such" })
    const names = styles.map((s) => s.name).sort()
    expect(names).toContain("concise")
    expect(names).toContain("explanatory")
    expect(names).toContain("learning")
    for (const s of styles) expect(s.source).toBe("builtin")
  })

  test("user overrides builtin on name conflict", async () => {
    const userRoot = tmp()
    write(
      path.join(userRoot, "concise.md"),
      `---
name: concise
description: my override
---

CUSTOM BODY
`,
    )
    const styles = await loadOutputStyles({ userRoot })
    const concise = styles.find((s) => s.name === "concise")
    expect(concise).toBeDefined()
    expect(concise!.source).toBe("user")
    expect(concise!.body).toBe("CUSTOM BODY")
  })

  test("rejects entries missing name or description or body", async () => {
    const userRoot = tmp()
    write(path.join(userRoot, "no-name.md"), `---\ndescription: x\n---\n\nbody\n`)
    write(path.join(userRoot, "no-desc.md"), `---\nname: x\n---\n\nbody\n`)
    write(path.join(userRoot, "no-body.md"), `---\nname: x\ndescription: y\n---\n`)
    const styles = await loadOutputStyles({ builtinRoot: "/no/such", userRoot })
    expect(styles.filter((s) => s.source === "user")).toHaveLength(0)
  })

  test("current style name defaults to 'default' when state file missing", async () => {
    const stateFile = path.join(tmp(), "output-style")
    expect(await loadCurrentStyleName(stateFile)).toBe(DEFAULT_STYLE_NAME)
  })

  test("save then load round-trips style name", async () => {
    const stateFile = path.join(tmp(), "nested", "output-style")
    await saveCurrentStyleName("concise", stateFile)
    expect(await loadCurrentStyleName(stateFile)).toBe("concise")
  })

  test("formatOutputStyleForPrompt empty -> empty string", () => {
    expect(formatOutputStyleForPrompt(undefined)).toBe("")
  })

  test("formatOutputStyleForPrompt wraps body in tagged block", () => {
    const out = formatOutputStyleForPrompt({
      name: "concise",
      description: "d",
      body: "Be terse.",
      source: "builtin",
      path: "/x",
    })
    expect(out).toContain('<output_style name="concise">')
    expect(out).toContain("Be terse.")
    expect(out).toContain("</output_style>")
  })
})
