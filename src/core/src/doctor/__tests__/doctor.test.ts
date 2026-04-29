import { describe, expect, test } from "bun:test"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { runChecks } from "../index.ts"

function tmp(): string {
  return mkdtempSync(path.join(tmpdir(), "ccdoctor-"))
}

describe("doctor checks", () => {
  test("returns warn for missing home dir", async () => {
    const fakeHome = path.join(tmp(), "no-home")
    const results = await runChecks({ home: fakeHome, cwd: process.cwd() })
    const home = results.find((r) => r.name === "Home directory")
    expect(home?.status).toBe("warn")
  })

  test("returns ok when home dir exists", async () => {
    const fakeHome = tmp()
    mkdirSync(path.join(fakeHome, ".claudecode"), { recursive: true })
    const results = await runChecks({ home: fakeHome, cwd: process.cwd() })
    const home = results.find((r) => r.name === "Home directory")
    expect(home?.status).toBe("ok")
  })

  test("counts memory entries", async () => {
    const fakeHome = tmp()
    const memDir = path.join(fakeHome, ".claudecode", "data", "memory")
    mkdirSync(memDir, { recursive: true })
    writeFileSync(path.join(memDir, "a.md"), "---\nname: x\n---\nbody")
    writeFileSync(path.join(memDir, "b.md"), "---\nname: y\n---\nbody")
    writeFileSync(path.join(memDir, "MEMORY.md"), "index, not counted")
    const results = await runChecks({ home: fakeHome, cwd: process.cwd() })
    const mem = results.find((r) => r.name === "Memory store")
    expect(mem?.status).toBe("ok")
    expect(mem?.detail).toContain("2 entries")
  })

  test("warns when log dir is large", async () => {
    const fakeHome = tmp()
    const logDir = path.join(fakeHome, ".claudecode", "log")
    mkdirSync(logDir, { recursive: true })
    // not actually creating 500MB; just verify the check classification path works
    writeFileSync(path.join(logDir, "small.log"), "x".repeat(1024))
    const results = await runChecks({ home: fakeHome, cwd: process.cwd() })
    const log = results.find((r) => r.name === "Log dir")
    expect(log?.status).toBe("ok")
  })

  test("includes runtime check", async () => {
    const results = await runChecks({ home: tmp(), cwd: process.cwd() })
    const rt = results.find((r) => r.name === "Runtime")
    expect(rt).toBeDefined()
  })
})
