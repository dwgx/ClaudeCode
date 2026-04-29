import { describe, expect, test } from "bun:test"
import { writeFileSync, mkdirSync, mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { loadHookSettings, defaultSettingsRoots } from "../index.ts"

function makeFixtureFile(content: object): string {
  const dir = mkdtempSync(path.join(tmpdir(), "cchooks-"))
  const file = path.join(dir, "settings.json")
  writeFileSync(file, JSON.stringify(content))
  return file
}

describe("hooks loader", () => {
  test("returns empty when no files exist", async () => {
    const result = await loadHookSettings(["/no/such/file.json"])
    expect(result.hooks).toEqual({})
  })

  test("loads single PreToolUse hook", async () => {
    const file = makeFixtureFile({
      hooks: {
        PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "echo hi" }] }],
      },
    })
    const result = await loadHookSettings([file])
    expect(result.hooks?.PreToolUse).toHaveLength(1)
    expect(result.hooks?.PreToolUse?.[0].matcher).toBe("Bash")
    expect(result.hooks?.PreToolUse?.[0].hooks[0].command).toBe("echo hi")
  })

  test("merges hooks from multiple files (append semantics)", async () => {
    const a = makeFixtureFile({
      hooks: { PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "a" }] }] },
    })
    const b = makeFixtureFile({
      hooks: { PreToolUse: [{ matcher: "Edit", hooks: [{ type: "command", command: "b" }] }] },
    })
    const result = await loadHookSettings([a, b])
    expect(result.hooks?.PreToolUse).toHaveLength(2)
  })

  test("ignores invalid JSON / missing files silently", async () => {
    const real = makeFixtureFile({
      hooks: { Stop: [{ hooks: [{ type: "command", command: "/usr/bin/true" }] }] },
    })
    const result = await loadHookSettings(["/no/such", real, "/also/no"])
    expect(result.hooks?.Stop).toHaveLength(1)
  })

  test("defaultSettingsRoots returns 3 paths", () => {
    const roots = defaultSettingsRoots("/repo", "/home/user")
    expect(roots).toHaveLength(3)
    expect(roots[0]).toContain(".claudecode")
    expect(roots[2]).toContain(".claude")
  })
})
