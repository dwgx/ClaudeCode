import { useDialog } from "@tui/ui/dialog"
import { DialogSelect } from "@tui/ui/dialog-select"
import { useSync } from "@tui/context/sync"
import { createResource, createMemo } from "solid-js"
import { runChecks, type CheckResult } from "@dwgx/claudecode-core/doctor/index"

export function DialogDoctor() {
  const dialog = useDialog()
  const sync = useSync()

  const [checks] = createResource(async () => runChecks())

  const providerCheck = createMemo<CheckResult>(() => {
    const providers = sync.data.provider ?? []
    if (providers.length === 0) {
      return { name: "Providers", status: "fail", detail: "no providers configured (run /connect)" }
    }
    return {
      name: "Providers",
      status: "ok",
      detail: `${providers.length} configured: ${providers.map((p) => p.id).join(", ")}`,
    }
  })

  const mcpCheck = createMemo<CheckResult>(() => {
    const list = Object.values(sync.data.mcp ?? {})
    if (list.length === 0) {
      return { name: "MCP servers", status: "ok", detail: "none configured (optional)" }
    }
    const failed = list.filter((m) => m.status === "failed")
    if (failed.length > 0) {
      return {
        name: "MCP servers",
        status: "warn",
        detail: `${failed.length} of ${list.length} failed to connect`,
      }
    }
    return { name: "MCP servers", status: "ok", detail: `${list.length} connected` }
  })

  const options = createMemo(() => {
    const items: Array<{
      title: string
      value: string
      description?: string
      category?: string
      disabled?: boolean
    }> = []
    const merged: CheckResult[] = [providerCheck(), mcpCheck(), ...(checks() ?? [])]
    if (!checks()) {
      items.push({ title: "Running checks…", value: "__loading", disabled: true })
      return items
    }
    for (const r of merged) {
      const dot = r.status === "ok" ? "●" : r.status === "warn" ? "⊙" : "✕"
      items.push({
        title: `${dot} ${r.name}`,
        value: `check:${r.name}`,
        description: r.detail,
        disabled: true,
      })
    }
    return items
  })

  return (
    <DialogSelect
      title="Doctor — system check"
      options={options()}
      flat={true}
      onSelect={() => dialog.clear()}
    />
  )
}
