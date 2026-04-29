import { createMemo, createSignal } from "solid-js"
import { useLocal } from "@tui/context/local"
import { DialogSelect } from "@tui/ui/dialog-select"
import { useDialog } from "@tui/ui/dialog"
import { useSDK } from "@tui/context/sdk"
import { useToast } from "@tui/ui/toast"
import { DialogPrompt } from "@tui/ui/dialog-prompt"
import { Keybind } from "@/util/keybind"

export function DialogAgent() {
  const local = useLocal()
  const dialog = useDialog()

  function Generate(props: { onClose: () => void }) {
    const sdk = useSDK()
    const toast = useToast()
    const dialog = useDialog()
    const [busy, setBusy] = createSignal(false)

    return (
      <DialogPrompt
        title="Generate agent"
        placeholder="Describe what this agent should do..."
        busy={busy()}
        busyText="Generating..."
        onConfirm={async (raw) => {
          const desc = raw.trim()
          if (!desc) return
          setBusy(true)
          try {
            const client = sdk.client as {
              agent?: {
                generate?: (p: { description: string }) => Promise<{
                  data?: { identifier?: string }
                  error?: unknown
                }>
              }
            }
            if (!client.agent?.generate) {
              toast.show({
                variant: "info",
                title: "Agent generation",
                message: "Not available in this build.",
              })
              props.onClose()
              return
            }
            const result = await client.agent.generate({ description: desc })
            if (result.error) {
              toast.show({
                variant: "error",
                title: "Generation failed",
                message: JSON.stringify(result.error),
              })
            } else {
              toast.show({
                variant: "info",
                title: "Agent generated",
                message: `${result.data?.identifier ?? "agent"} - add it to your config to use.`,
              })
            }
          } catch (err) {
            toast.show({
              variant: "error",
              title: "Generation failed",
              message: err instanceof Error ? err.message : String(err),
            })
          } finally {
            setBusy(false)
            dialog.clear()
          }
        }}
        onCancel={() => props.onClose()}
      />
    )
  }

  const options = createMemo(() =>
    local.agent.list().map((item) => {
      return {
        value: item.name,
        title: item.name,
        description: item.native ? "native" : item.description,
      }
    }),
  )

  return (
    <DialogSelect
      title="Select agent"
      current={local.agent.current()?.name}
      options={options()}
      keybind={[
        {
          title: "generate",
          keybind: Keybind.parse("g")[0],
          onTrigger: () => {
            dialog.replace(() => <Generate onClose={() => dialog.clear()} />)
          },
        },
      ]}
      onSelect={(option) => {
        local.agent.set(option.value)
        dialog.clear()
      }}
    />
  )
}
