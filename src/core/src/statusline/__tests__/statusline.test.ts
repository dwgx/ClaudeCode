import { describe, expect, test } from "bun:test"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { loadStatusLineConfig, runStatusLine } from "../index.ts"

function tmp(): string {
  return mkdtempSync(path.join(tmpdir(), "ccsl-"))
}

describe("statusline loader", () => {
  test("returns undefined when file missing", async () => {
    expect(await loadStatusLineConfig("/no/such/file.json")).toBeUndefined()
  })

  test("returns undefined when JSON invalid", async () => {
    const file = path.join(tmp(), "statusline.json")
    writeFileSync(file, "{ not json")
    expect(await loadStatusLineConfig(file)).toBeUndefined()
  })

  test("returns undefined when type missing", async () => {
    const file = path.join(tmp(), "statusline.json")
    writeFileSync(file, JSON.stringify({ command: "echo x" }))
    expect(await loadStatusLineConfig(file)).toBeUndefined()
  })

  test("returns undefined when command missing", async () => {
    const file = path.join(tmp(), "statusline.json")
    writeFileSync(file, JSON.stringify({ type: "command" }))
    expect(await loadStatusLineConfig(file)).toBeUndefined()
  })

  test("loads valid config", async () => {
    const file = path.join(tmp(), "statusline.json")
    writeFileSync(file, JSON.stringify({ type: "command", command: "echo hi", timeout: 5000 }))
    const cfg = await loadStatusLineConfig(file)
    expect(cfg).toEqual({ type: "command", command: "echo hi", timeout: 5000 })
  })
})

describe("statusline runner", () => {
  test("captures first line of stdout", async () => {
    const out = await runStatusLine(
      { type: "command", command: process.platform === "win32" ? "echo hello" : "echo hello" },
      { cwd: process.cwd() },
    )
    expect(out.exitCode).toBe(0)
    expect(out.text).toBe("hello")
    expect(out.timedOut).toBe(false)
  })

  test("returns non-zero exit on failing command", async () => {
    const out = await runStatusLine(
      { type: "command", command: "node -e \"process.exit(7)\"" },
      { cwd: process.cwd() },
    )
    expect(out.exitCode).toBe(7)
  })

  test("times out long-running commands", async () => {
    const out = await runStatusLine(
      { type: "command", command: "node -e \"setTimeout(()=>{}, 5000)\"", timeout: 200 },
      { cwd: process.cwd() },
    )
    expect(out.timedOut).toBe(true)
  }, 5000)
})
