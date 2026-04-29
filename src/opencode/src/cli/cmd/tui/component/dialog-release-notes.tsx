import { createSignal, onMount } from "solid-js"
import { useDialog } from "@tui/ui/dialog"
import { useTheme } from "@tui/context/theme"
import { TextAttributes } from "@opentui/core"
import { spawn } from "child_process"

export function DialogReleaseNotes() {
  const { theme } = useTheme()
  const dialog = useDialog()
  const [version, setVersion] = createSignal<string>("...")
  const [log, setLog] = createSignal<string[]>([])
  const [error, setError] = createSignal<string>("")

  onMount(async () => {
    try {
      try {
        const fs = await import("fs/promises")
        const path = await import("path")
        const candidates = [
          path.join(process.cwd(), "package.json"),
          path.join(process.cwd(), "src", "opencode", "package.json"),
        ]
        for (const candidate of candidates) {
          try {
            const raw = await fs.readFile(candidate, "utf8")
            const obj = JSON.parse(raw) as { name?: string; version?: string }
            if (obj.name && obj.version && obj.name.includes("claudecode")) {
              setVersion(obj.version)
              break
            }
          } catch {}
        }
        if (version() === "...") setVersion("unknown")
      } catch {
        setVersion("unknown")
      }

      const lines = await new Promise<string[]>((resolve, reject) => {
        const child = spawn("git", ["log", "--oneline", "-20"], { cwd: process.cwd() })
        let buf = ""
        child.stdout.on("data", (d) => (buf += d.toString()))
        child.on("close", (code) => {
          if (code !== 0) reject(new Error(`git log exited ${code}`))
          else resolve(buf.split(/\r?\n/).filter(Boolean))
        })
        child.on("error", reject)
      })
      setLog(lines)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  })

  return (
    <box paddingLeft={2} paddingRight={2} gap={1} paddingBottom={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          Release notes - v{version()}
        </text>
        <text fg={theme.textMuted} onMouseUp={() => dialog.clear()}>
          esc
        </text>
      </box>
      {error() ? (
        <text fg={theme.error}>{error()}</text>
      ) : (
        <scrollbox maxHeight={20} scrollbarOptions={{ visible: true }}>
          <box gap={0}>
            {log().map((line) => (
              <text fg={theme.textMuted}>{line}</text>
            ))}
          </box>
        </scrollbox>
      )}
    </box>
  )
}
