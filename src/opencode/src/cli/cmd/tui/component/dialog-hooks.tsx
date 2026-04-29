import { createEffect, createMemo, createSignal, onMount } from "solid-js"
import { DialogSelect, type DialogSelectOption } from "@tui/ui/dialog-select"
import { useToast } from "@tui/ui/toast"
import { promises as fs } from "fs"
import { existsSync } from "fs"
import path from "path"
import os from "os"
import { parse } from "jsonc-parser"

interface HookMatcher {
  matcher?: string
  hooks?: Array<{ type?: string; command?: string }>
}

function configPath(): string {
  const base = path.join(os.homedir(), ".claudecode", "config")
  for (const file of ["claudecode.jsonc", "claudecode.json", "config.json"]) {
    const candidate = path.join(base, file)
    if (existsSync(candidate)) return candidate
  }
  return path.join(base, "claudecode.jsonc")
}

function readHooks(src: string): Record<string, HookMatcher[]> {
  const root = parse(src) as { hook?: unknown; hooks?: unknown } | undefined
  const node = root?.hook ?? root?.hooks
  if (!node || typeof node !== "object") return {}
  const out: Record<string, HookMatcher[]> = {}
  for (const [event, value] of Object.entries(node as Record<string, unknown>)) {
    if (Array.isArray(value)) out[event] = value as HookMatcher[]
  }
  return out
}

export function DialogHooks() {
  const toast = useToast()
  const [src, setSrc] = createSignal<string>("")
  const [error, setError] = createSignal<string>("")

  onMount(async () => {
    const file = configPath()
    if (!existsSync(file)) {
      setError("No config file yet - run /init or write ~/.claudecode/config/claudecode.jsonc")
      return
    }
    try {
      const raw = await fs.readFile(file, "utf8")
      setSrc(raw)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  })

  createEffect(() => {
    if (!error()) return
    toast.show({ variant: "warning", title: "Hooks", message: error() })
  })

  const events = createMemo<DialogSelectOption<string>[]>(() => {
    if (!src()) return []
    const hooks = readHooks(src())
    return Object.entries(hooks).map(([event, matchers]) => {
      const totalCmds = matchers.reduce((sum, m) => sum + (m.hooks?.length ?? 0), 0)
      const matcherList = matchers
        .map((m) => m.matcher ?? "*")
        .filter((value, index, arr) => arr.indexOf(value) === index)
        .join(", ")
      return {
        title: event,
        value: event,
        description: `${totalCmds} command(s)`,
        footer: matcherList,
      }
    })
  })

  return (
    <DialogSelect
      title="Hooks (read-only)"
      options={events()}
      onSelect={(item) => {
        toast.show({
          variant: "info",
          title: item.value,
          message: `Edit ${configPath()} to change`,
        })
      }}
    />
  )
}
