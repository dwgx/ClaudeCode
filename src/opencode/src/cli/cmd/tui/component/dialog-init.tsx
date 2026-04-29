import { createSignal } from "solid-js"
import { useDialog } from "@tui/ui/dialog"
import { useToast } from "@tui/ui/toast"
import { DialogConfirm } from "@tui/ui/dialog-confirm"
import { promises as fs } from "fs"
import { existsSync } from "fs"
import path from "path"

const TEMPLATE = `{
  // ClaudeCode project config - see https://github.com/dwgx/ClaudeCode
  // This file is project-local and tracked. Personal/private settings
  // belong in ~/.claudecode/config/claudecode.jsonc instead.
  "$schema": "https://claudecode.dev/config-schema.json",
  "permission": {
    "edit": "ask",
    "bash": "ask"
  }
}
`

export function DialogInit() {
  const dialog = useDialog()
  const toast = useToast()
  const [busy, setBusy] = createSignal(false)

  const target = path.join(process.cwd(), ".claudecode", "claudecode.jsonc")

  return (
    <DialogConfirm
      title="Initialize ClaudeCode in this project?"
      message={`Will create ${target} with a starter config.`}
      onConfirm={async () => {
        if (busy()) return
        setBusy(true)
        try {
          if (existsSync(target)) {
            toast.show({
              variant: "warning",
              title: "Config already exists",
              message: target,
            })
            return
          }
          await fs.mkdir(path.dirname(target), { recursive: true })
          await fs.writeFile(target, TEMPLATE, "utf8")
          toast.show({
            variant: "info",
            title: "ClaudeCode initialized",
            message: target,
          })
        } catch (err) {
          toast.show({
            variant: "error",
            title: "Init failed",
            message: err instanceof Error ? err.message : String(err),
          })
        } finally {
          setBusy(false)
          dialog.clear()
        }
      }}
      onCancel={() => dialog.clear()}
    />
  )
}
