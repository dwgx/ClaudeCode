import { createMemo, createSignal, onMount } from "solid-js"
import { DialogSelect, type DialogSelectOption } from "@tui/ui/dialog-select"
import { useToast } from "@tui/ui/toast"
import { Keybind } from "@/util/keybind"
import { promises as fs } from "fs"
import { existsSync } from "fs"
import path from "path"
import os from "os"
import {
  PERMISSION_KEYS,
  clearPermission,
  readPermissions,
  setPermission,
  type Action,
} from "@dwgx/claudecode-core/permissions-editor/index"

const cycleKey = Keybind.parse("space").at(0)
const clearKey = Keybind.parse("c").at(0)

function nextAction(cur: Action | "object" | undefined): Action {
  if (cur === undefined) return "ask"
  if (cur === "ask") return "allow"
  if (cur === "allow") return "deny"
  return "ask"
}

function configPath(): string {
  const base = path.join(os.homedir(), ".claudecode", "config")
  for (const file of ["claudecode.jsonc", "claudecode.json", "config.json"]) {
    const candidate = path.join(base, file)
    if (existsSync(candidate)) return candidate
  }
  return path.join(base, "claudecode.jsonc")
}

export function DialogPermissions() {
  const toast = useToast()
  const [src, setSrc] = createSignal<string>("")
  const [busy, setBusy] = createSignal(false)
  const [tick, setTick] = createSignal(0)

  onMount(async () => {
    try {
      const file = configPath()
      const raw = existsSync(file) ? await fs.readFile(file, "utf8") : "{}"
      setSrc(raw || "{}")
    } catch (err) {
      toast.show({
        variant: "error",
        title: "Failed to read config",
        message: err instanceof Error ? err.message : String(err),
      })
      setSrc("{}")
    }
  })

  const current = createMemo(() => {
    tick()
    return readPermissions(src())
  })

  const options = createMemo<DialogSelectOption<string>[]>(() =>
    PERMISSION_KEYS.map((key) => {
      const cur = current()[key]
      return {
        title: key,
        value: key,
        description: cur === "object" ? "complex (edit file)" : (cur ?? "unset"),
        category: undefined,
      }
    }),
  )

  const apply = async (key: string, op: "cycle" | "clear") => {
    if (busy()) return
    setBusy(true)
    try {
      const file = configPath()
      const raw = src()
      const cur = current()[key]
      let next: string
      if (op === "clear") {
        next = clearPermission(raw, key)
      } else {
        if (cur === "object") {
          toast.show({
            variant: "warning",
            title: "Object rule",
            message: `'${key}' has per-pattern rules; clear it first or edit the file directly.`,
          })
          return
        }
        next = setPermission(raw, key, nextAction(cur))
      }
      await fs.mkdir(path.dirname(file), { recursive: true })
      await fs.writeFile(file, next, "utf8")
      setSrc(next)
      setTick((value) => value + 1)
    } catch (err) {
      toast.show({
        variant: "error",
        title: "Failed to update permission",
        message: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <DialogSelect
      title="Permissions"
      options={options()}
      keybind={[
        {
          title: "cycle",
          keybind: cycleKey,
          disabled: busy(),
          onTrigger: (item) => void apply(item.value, "cycle"),
        },
        {
          title: "clear",
          keybind: clearKey,
          disabled: busy(),
          onTrigger: (item) => void apply(item.value, "clear"),
        },
      ]}
      onSelect={(item) => void apply(item.value, "cycle")}
    />
  )
}
