import { createSignal, onCleanup, onMount } from "solid-js"
import { useSDK } from "@tui/context/sdk"
import { useSync } from "@tui/context/sync"
import { useDialog } from "@tui/ui/dialog"
import { useToast } from "@tui/ui/toast"
import { useTheme } from "@tui/context/theme"
import { Link } from "@tui/ui/link"
import { useKeyboard } from "@opentui/solid"
import * as Clipboard from "@tui/util/clipboard"
import { TextAttributes } from "@opentui/core"

interface DialogMcpAuthProps {
  name: string
}

const POLL_MS = 2000
const TIMEOUT_MS = 5 * 60 * 1000

export function DialogMcpAuth(props: DialogMcpAuthProps) {
  const { theme } = useTheme()
  const sdk = useSDK()
  const sync = useSync()
  const dialog = useDialog()
  const toast = useToast()
  const [url, setUrl] = createSignal<string>("")
  const [phase, setPhase] = createSignal<"starting" | "waiting" | "done" | "error">("starting")
  const [error, setError] = createSignal<string>("")

  let pollTimer: ReturnType<typeof setInterval> | undefined
  let timeoutTimer: ReturnType<typeof setTimeout> | undefined
  let cancelled = false

  const stop = () => {
    if (pollTimer) clearInterval(pollTimer)
    if (timeoutTimer) clearTimeout(timeoutTimer)
    pollTimer = undefined
    timeoutTimer = undefined
  }

  useKeyboard((evt) => {
    if (evt.name === "c" && !evt.ctrl && !evt.meta) {
      const currentUrl = url()
      if (!currentUrl) return
      Clipboard.copy(currentUrl)
        .then(() => toast.show({ variant: "info", message: "URL copied" }))
        .catch(() => toast.show({ variant: "error", message: "Copy failed" }))
    }
  })

  onCleanup(() => {
    cancelled = true
    stop()
  })

  onMount(async () => {
    try {
      const start = await sdk.client.mcp.auth.start({ name: props.name })
      if (cancelled) return
      if (start.error || !start.data?.authorizationUrl) {
        setPhase("error")
        setError(typeof start.error === "object" ? JSON.stringify(start.error) : String(start.error ?? "no url returned"))
        return
      }
      setUrl(start.data.authorizationUrl)
      setPhase("waiting")

      try {
        const open = await import("open")
        await open.default(start.data.authorizationUrl)
      } catch {}

      timeoutTimer = setTimeout(() => {
        if (cancelled) return
        stop()
        setPhase("error")
        setError("Authorization timed out after 5 minutes")
      }, TIMEOUT_MS)

      pollTimer = setInterval(async () => {
        if (cancelled) return
        try {
          const status = await sdk.client.mcp.status()
          if (cancelled) return
          if (status.data) {
            sync.set("mcp", status.data)
            const current = status.data[props.name]
            if (current && current.status !== "needs_auth") {
              stop()
              setPhase("done")
              if (current.status === "connected") {
                toast.show({
                  variant: "info",
                  title: "MCP authorized",
                  message: props.name,
                })
              } else if (current.status === "failed") {
                toast.show({
                  variant: "error",
                  title: "MCP failed after auth",
                  message: current.error,
                })
              }
              dialog.clear()
            }
          }
        } catch {}
      }, POLL_MS)
    } catch (err) {
      setPhase("error")
      setError(err instanceof Error ? err.message : String(err))
    }
  })

  return (
    <box paddingLeft={2} paddingRight={2} gap={1} paddingBottom={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text attributes={TextAttributes.BOLD} fg={theme.text}>
          Authorize {props.name}
        </text>
        <text fg={theme.textMuted} onMouseUp={() => dialog.clear()}>
          esc
        </text>
      </box>
      {phase() === "starting" && <text fg={theme.textMuted}>Starting OAuth flow...</text>}
      {phase() === "waiting" && (
        <box gap={1}>
          <Link href={url()} fg={theme.primary} />
          <text fg={theme.textMuted}>Opened in your browser. Complete the flow to continue.</text>
          <text fg={theme.textMuted}>Waiting for authorization...</text>
          <text fg={theme.text}>
            c <span style={{ fg: theme.textMuted }}>copy URL</span>
          </text>
        </box>
      )}
      {phase() === "error" && (
        <box gap={1}>
          <text fg={theme.error}>{error()}</text>
          <text fg={theme.textMuted}>Press esc to close.</text>
        </box>
      )}
    </box>
  )
}
