import fs from "node:fs/promises"
import path from "node:path"
import { homedir } from "node:os"
import { spawn } from "node:child_process"
import type { StatusLineConfig, StatusLineInput, StatusLineOutcome } from "./types.ts"

export const DEFAULT_TIMEOUT_MS = 3000

export function defaultConfigPath(home = homedir()): string {
  return path.join(home, ".claudecode", "config", "statusline.json")
}

export async function loadStatusLineConfig(file = defaultConfigPath()): Promise<StatusLineConfig | undefined> {
  let raw: string
  try {
    raw = await fs.readFile(file, "utf8")
  } catch {
    return undefined
  }
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return undefined
  }
  if (!data || typeof data !== "object") return undefined
  const obj = data as Record<string, unknown>
  if (obj.type !== "command") return undefined
  if (typeof obj.command !== "string" || !obj.command.trim()) return undefined
  const timeout = typeof obj.timeout === "number" && obj.timeout > 0 ? obj.timeout : undefined
  return { type: "command", command: obj.command, timeout }
}

export async function runStatusLine(
  cfg: StatusLineConfig,
  input: StatusLineInput,
): Promise<StatusLineOutcome> {
  const started = Date.now()
  const timeout = cfg.timeout ?? DEFAULT_TIMEOUT_MS

  return await new Promise<StatusLineOutcome>((resolve) => {
    const child = spawn(cfg.command, {
      shell: true,
      cwd: input.cwd,
      env: {
        ...process.env,
        CLAUDECODE_STATUSLINE: "1",
        CLAUDECODE_SESSION_ID: input.session_id ?? "",
        CLAUDECODE_MODEL: input.model ? `${input.model.providerID}/${input.model.modelID}` : "",
      },
    })
    let stdout = ""
    let stderr = ""
    let done = false
    let timedOut = false

    const finish = (exitCode: number) => {
      if (done) return
      done = true
      clearTimeout(timer)
      const text = stdout.split(/\r?\n/)[0]?.trim() ?? ""
      resolve({
        text,
        exitCode,
        durationMs: Date.now() - started,
        timedOut,
        stderr: stderr.trim() || undefined,
      })
    }

    const timer = setTimeout(() => {
      timedOut = true
      try {
        child.kill("SIGTERM")
      } catch {
        // ignore
      }
      // give the kill 250ms then escalate
      setTimeout(() => {
        if (!done) {
          try {
            child.kill("SIGKILL")
          } catch {
            // ignore
          }
          finish(124)
        }
      }, 250)
    }, timeout)

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8")
    })
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8")
    })
    child.on("error", () => finish(127))
    child.on("close", (code) => finish(code ?? 0))

    // Commands that don't consume stdin will close the pipe early. Suppress
    // EPIPE so it doesn't surface as an unhandled error.
    child.stdin?.on("error", () => {})
    try {
      child.stdin?.end(JSON.stringify(input))
    } catch {
      // some shells close stdin early; ignore
    }
  })
}
