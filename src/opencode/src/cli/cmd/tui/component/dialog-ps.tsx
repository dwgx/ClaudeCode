import { useDialog } from "@tui/ui/dialog"
import { DialogSelect } from "@tui/ui/dialog-select"
import { useRoute } from "@tui/context/route"
import { useSync } from "@tui/context/sync"
import { useSDK } from "@tui/context/sdk"
import { useToast } from "../ui/toast"
import { Locale } from "@/util/locale"
import { Keybind } from "@/util/keybind"
import { createMemo } from "solid-js"

type Row = {
  id: string
  title: string
  parentTitle?: string
  state: "busy" | "retry" | "idle"
  ageMs: number
  retryAttempt?: number
  retryMessage?: string
}

const SUBAGENT_IDLE_HORIZON_MS = 30 * 60 * 1000

export function DialogPs() {
  const dialog = useDialog()
  const route = useRoute()
  const sync = useSync()
  const sdk = useSDK()
  const toast = useToast()

  const rows = createMemo<Row[]>(() => {
    const now = Date.now()
    const sessions = sync.data.session
    const status = sync.data.session_status
    const sessionByID = new Map(sessions.map((s) => [s.id, s]))
    const out: Row[] = []
    for (const s of sessions) {
      const st = status[s.id]
      const state = (st?.type ?? "idle") as Row["state"]
      const isSub = !!s.parentID
      if (state === "idle" && !isSub) continue
      if (state === "idle" && isSub && now - (s.time.updated ?? 0) > SUBAGENT_IDLE_HORIZON_MS) continue
      const parent = s.parentID ? sessionByID.get(s.parentID) : undefined
      out.push({
        id: s.id,
        title: s.title || "(untitled)",
        parentTitle: parent?.title,
        state,
        ageMs: Math.max(0, now - (s.time.updated ?? now)),
        retryAttempt: state === "retry" ? (st as { attempt?: number }).attempt : undefined,
        retryMessage: state === "retry" ? (st as { message?: string }).message : undefined,
      })
    }
    out.sort((a, b) => {
      const rank = (r: Row) => (r.state === "busy" ? 0 : r.state === "retry" ? 1 : 2)
      const d = rank(a) - rank(b)
      return d !== 0 ? d : a.ageMs - b.ageMs
    })
    return out
  })

  const options = createMemo(() => {
    const list = rows()
    if (list.length === 0) {
      return [
        {
          title: "No running tasks",
          value: "__empty",
          description: "Press ESC to close",
          disabled: true,
        },
      ]
    }
    return list.map((r) => {
      const dot = r.state === "busy" ? "●" : r.state === "retry" ? "⊙" : "○"
      const age = Locale.duration(r.ageMs)
      const tag =
        r.state === "busy"
          ? `running · ${age}`
          : r.state === "retry"
            ? `retry${r.retryAttempt !== undefined ? ` ${r.retryAttempt}` : ""} · ${age}${r.retryMessage ? ` · ${r.retryMessage}` : ""}`
            : `idle · ${age}`
      const parentSuffix = r.parentTitle ? ` ← ${Locale.truncate(r.parentTitle, 30)}` : ""
      return {
        title: `${dot} ${Locale.truncate(r.title, 50)}${parentSuffix}`,
        value: r.id,
        description: tag,
      }
    })
  })

  return (
    <DialogSelect
      title="Running tasks"
      options={options()}
      flat={true}
      onSelect={(option) => {
        if (option.value === "__empty") {
          dialog.clear()
          return
        }
        route.navigate({ type: "session", sessionID: option.value })
        dialog.clear()
      }}
      keybind={[
        {
          keybind: Keybind.parse("ctrl+x")[0],
          title: "cancel",
          onTrigger: async (option) => {
            if (option.value === "__empty") return
            const row = rows().find((x) => x.id === option.value)
            if (!row || row.state === "idle") {
              toast.show({ variant: "info", title: "Already idle", message: row?.title ?? "" })
              return
            }
            await sdk.client.session.abort({ sessionID: option.value }).catch(() => {})
            toast.show({ variant: "info", title: "Cancel sent", message: row.title })
          },
        },
      ]}
    />
  )
}
