import { useDialog } from "@tui/ui/dialog"
import { DialogSelect } from "@tui/ui/dialog-select"
import { useToast } from "../ui/toast"
import { createResource, Show } from "solid-js"
import {
  DEFAULT_STYLE_NAME,
  loadCurrentStyleName,
  loadOutputStyles,
  saveCurrentStyleName,
  type OutputStyle,
} from "@dwgx/claudecode-core/output-style/index"

export function DialogOutputStyle() {
  const dialog = useDialog()
  const toast = useToast()

  const [data] = createResource(async () => {
    const [styles, current] = await Promise.all([loadOutputStyles(), loadCurrentStyleName()])
    return { styles, current }
  })

  return (
    <Show
      when={data()}
      fallback={
        <DialogSelect
          title="Output style"
          options={[{ title: "Loading...", value: "__loading", disabled: true }]}
        />
      }
    >
      {(d) => (
        <DialogSelect
          title="Output style"
          current={d().current}
          flat={true}
          options={[
            {
              title: `default — built-in baseline (no extra style instructions)`,
              value: DEFAULT_STYLE_NAME,
              description: d().current === DEFAULT_STYLE_NAME ? "current" : undefined,
            },
            ...d().styles.map((s: OutputStyle) => ({
              title: `${s.name} — ${s.description}`,
              value: s.name,
              description:
                d().current === s.name
                  ? `current · ${s.source}`
                  : s.source,
            })),
          ]}
          onSelect={async (option) => {
            if (option.value === "__loading") return
            try {
              await saveCurrentStyleName(String(option.value))
              toast.show({
                variant: "info",
                title: "Output style set",
                message: String(option.value),
              })
            } catch (err) {
              toast.show({
                variant: "error",
                title: "Failed to save output style",
                message: err instanceof Error ? err.message : String(err),
              })
            }
            dialog.clear()
          }}
        />
      )}
    </Show>
  )
}
