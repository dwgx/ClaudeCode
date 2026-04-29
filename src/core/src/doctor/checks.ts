import fs from "node:fs/promises"
import path from "node:path"
import { homedir } from "node:os"
import { spawn } from "node:child_process"
import type { CheckContext, CheckResult } from "./types.ts"

export function defaultContext(): CheckContext {
  return {
    home: homedir(),
    cwd: process.cwd(),
  }
}

async function statRoot(p: string) {
  try {
    const s = await fs.stat(p)
    return { exists: true, sizeBytes: s.isFile() ? s.size : undefined, isDir: s.isDirectory() }
  } catch {
    return { exists: false }
  }
}

async function listDir(p: string): Promise<string[]> {
  try {
    return await fs.readdir(p)
  } catch {
    return []
  }
}

async function dirSize(p: string): Promise<number> {
  let total = 0
  let entries
  try {
    entries = await fs.readdir(p, { withFileTypes: true })
  } catch {
    return 0
  }
  for (const ent of entries) {
    const child = path.join(p, ent.name)
    try {
      if (ent.isFile()) {
        total += (await fs.stat(child)).size
      } else if (ent.isDirectory()) {
        total += await dirSize(child)
      }
    } catch {
      // ignore
    }
  }
  return total
}

function which(name: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const cmd = process.platform === "win32" ? "where" : "which"
    const child = spawn(cmd, [name], { shell: false, stdio: ["ignore", "pipe", "ignore"] })
    let out = ""
    child.stdout?.on("data", (b: Buffer) => (out += b.toString("utf8")))
    child.on("error", () => resolve(undefined))
    child.on("close", () => {
      const first = out.split(/\r?\n/)[0]?.trim()
      resolve(first || undefined)
    })
  })
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export async function runChecks(ctx: CheckContext = defaultContext()): Promise<CheckResult[]> {
  const home = ctx.home
  const root = path.join(home, ".claudecode")
  const config = path.join(root, "config")
  const data = path.join(root, "data")
  const log = path.join(root, "log")
  const memory = path.join(data, "memory")

  const results: CheckResult[] = []

  // 1. ~/.claudecode root
  {
    const s = await statRoot(root)
    results.push({
      name: "Home directory",
      status: s.exists && s.isDir ? "ok" : "warn",
      detail: s.exists && s.isDir ? root : `${root} missing — first run will create it`,
    })
  }

  // 2. config dir
  {
    const s = await statRoot(config)
    if (!s.exists) {
      results.push({ name: "Config dir", status: "warn", detail: `${config} missing` })
    } else {
      const files = (await listDir(config)).filter((f) => /\.(json|jsonc|toml)$/i.test(f))
      results.push({
        name: "Config dir",
        status: "ok",
        detail: `${config} (${files.length} config file${files.length === 1 ? "" : "s"})`,
      })
    }
  }

  // 3. data dir + memory subdir
  {
    const s = await statRoot(data)
    results.push({
      name: "Data dir",
      status: s.exists && s.isDir ? "ok" : "warn",
      detail: s.exists ? data : `${data} missing`,
    })
  }
  {
    const s = await statRoot(memory)
    if (!s.exists) {
      results.push({ name: "Memory store", status: "warn", detail: "no memory entries (optional)" })
    } else {
      const files = (await listDir(memory)).filter((f) => f.toLowerCase().endsWith(".md") && f.toUpperCase() !== "MEMORY.MD")
      results.push({
        name: "Memory store",
        status: "ok",
        detail: `${files.length} entr${files.length === 1 ? "y" : "ies"} at ${memory}`,
      })
    }
  }

  // 4. log dir size
  {
    const s = await statRoot(log)
    if (!s.exists) {
      results.push({ name: "Log dir", status: "ok", detail: `${log} (empty)` })
    } else {
      const size = await dirSize(log)
      const status = size > 500 * 1024 * 1024 ? "warn" : "ok"
      results.push({
        name: "Log dir",
        status,
        detail: `${log} · ${fmtBytes(size)}${status === "warn" ? " (consider rotating)" : ""}`,
      })
    }
  }

  // 5. required binaries
  for (const bin of ["git", "rg"]) {
    const found = await which(bin)
    results.push({
      name: `Binary: ${bin}`,
      status: found ? "ok" : "warn",
      detail: found ?? "not found in PATH",
    })
  }

  // 6. Node/Bun runtime
  {
    const bunVer = typeof Bun !== "undefined" ? `Bun ${Bun.version}` : "Bun not detected (running under Node?)"
    results.push({
      name: "Runtime",
      status: typeof Bun !== "undefined" ? "ok" : "warn",
      detail: bunVer,
    })
  }

  return results
}
