import { createSignal } from "solid-js"
import { useDialog } from "@tui/ui/dialog"
import { DialogPrompt } from "@tui/ui/dialog-prompt"
import { useToast } from "../ui/toast"
import { useSDK } from "@tui/context/sdk"
import { useSync } from "@tui/context/sync"
import type { McpLocalConfig, McpRemoteConfig } from "@dwgx/claudecode-sdk/v2"

type ParsedSpec =
  | { ok: true; name: string; config: McpLocalConfig | McpRemoteConfig }
  | { ok: false; reason: string }

function parseSpec(raw: string): ParsedSpec {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, reason: "Spec is empty" }

  const firstSpace = trimmed.indexOf(" ")
  if (firstSpace === -1) {
    return {
      ok: false,
      reason: "Expected '<name> <command-or-url>' (e.g. 'fs npx @modelcontextprotocol/server-filesystem /tmp')",
    }
  }
  const name = trimmed.slice(0, firstSpace).trim()
  const rest = trimmed.slice(firstSpace + 1).trim()
  if (!name) return { ok: false, reason: "Name is empty" }
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
    return { ok: false, reason: `Invalid name: '${name}' (use letters, digits, _, -)` }
  }
  if (!rest) return { ok: false, reason: "Command or URL is empty" }

  // remote if single token + http(s)://
  if (/^https?:\/\//.test(rest) && !/\s/.test(rest)) {
    return {
      ok: true,
      name,
      config: { type: "remote", url: rest } as McpRemoteConfig,
    }
  }

  // local: tokenize on whitespace (basic shell split — no quotes)
  const command = rest.split(/\s+/).filter(Boolean)
  if (command.length === 0) return { ok: false, reason: "Command is empty" }
  return {
    ok: true,
    name,
    config: { type: "local", command } as McpLocalConfig,
  }
}

export function DialogMcpAdd() {
  const dialog = useDialog()
  const toast = useToast()
  const sdk = useSDK()
  const sync = useSync()
  const [busy, setBusy] = createSignal(false)

  return (
    <DialogPrompt
      title="Add MCP server"
      placeholder="<name> <command-or-url>"
      busy={busy()}
      busyText="Adding MCP server..."
      onConfirm={async (raw) => {
        const parsed = parseSpec(raw)
        if (!parsed.ok) {
          toast.show({ variant: "error", title: "Invalid MCP spec", message: parsed.reason })
          return
        }
        setBusy(true)
        try {
          const result = await sdk.client.mcp.add({
            name: parsed.name,
            config: parsed.config,
          })
          if (result.data) {
            sync.set("mcp", result.data)
          }
          toast.show({
            variant: "info",
            title: "MCP added",
            message: `${parsed.name} (${parsed.config.type})`,
          })
          dialog.clear()
        } catch (err) {
          toast.show({
            variant: "error",
            title: "Failed to add MCP",
            message: err instanceof Error ? err.message : String(err),
          })
        } finally {
          setBusy(false)
        }
      }}
      onCancel={() => dialog.clear()}
    />
  )
}
