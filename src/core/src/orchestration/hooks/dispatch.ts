import { spawn } from "node:child_process"
import type { AnthropicHookCommand, HookEnvelope } from "./types.ts"

export interface HookOutcome {
  exitCode: number
  stdout: string
  stderr: string
  durationMs: number
  timedOut: boolean
}

const DEFAULT_TIMEOUT_MS = 60_000

// 跑一条 Anthropic 风格的 hook command，把 envelope 通过 stdin 传 JSON。
// 兼容 PowerShell/bash/cmd —— 走 system shell（cross-platform）。
export async function runHookCommand(cmd: AnthropicHookCommand, envelope: HookEnvelope): Promise<HookOutcome> {
  const timeout = cmd.timeout ?? DEFAULT_TIMEOUT_MS
  const start = Date.now()
  return new Promise<HookOutcome>((resolve) => {
    const child = spawn(cmd.command, {
      shell: true,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        CLAUDECODE_HOOK_EVENT: envelope.anthropic_event_name ?? envelope.native_event_name,
        CLAUDECODE_HOOK_SESSION: envelope.session_id,
        CLAUDECODE_HOOK_CWD: envelope.cwd,
      },
    })

    let stdout = ""
    let stderr = ""
    let timedOut = false

    const timer = setTimeout(() => {
      timedOut = true
      child.kill("SIGTERM")
    }, timeout)

    child.stdout?.on("data", (d) => {
      stdout += String(d)
    })
    child.stderr?.on("data", (d) => {
      stderr += String(d)
    })

    child.on("close", (code) => {
      clearTimeout(timer)
      resolve({
        exitCode: typeof code === "number" ? code : 1,
        stdout,
        stderr,
        durationMs: Date.now() - start,
        timedOut,
      })
    })

    child.on("error", (err) => {
      clearTimeout(timer)
      resolve({
        exitCode: 127,
        stdout: "",
        stderr: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
        timedOut,
      })
    })

    try {
      child.stdin?.end(JSON.stringify(envelope) + "\n")
    } catch {
      // child died before we could write
    }
  })
}

// matcher 匹配。当前仅 string 等于或 glob-ish "*" 全匹配。
export function matcherFits(matcher: string | undefined, target: string | undefined): boolean {
  if (!matcher || matcher === "*") return true
  if (!target) return false
  return matcher === target
}
