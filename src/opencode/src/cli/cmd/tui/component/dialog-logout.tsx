import { createMemo, createSignal } from "solid-js"
import { useSDK } from "@tui/context/sdk"
import { useSync } from "@tui/context/sync"
import { DialogConfirm } from "@tui/ui/dialog-confirm"
import { DialogSelect, type DialogSelectOption } from "@tui/ui/dialog-select"
import { useDialog } from "@tui/ui/dialog"
import { useToast } from "@tui/ui/toast"

export function DialogLogout() {
  const sync = useSync()
  const sdk = useSDK()
  const dialog = useDialog()
  const toast = useToast()
  const [busy, setBusy] = createSignal<string | null>(null)

  const options = createMemo<DialogSelectOption<string>[]>(() => {
    const all = sync.data.provider_next.all
    const connected = new Set(sync.data.provider_next.connected)
    return all
      .filter((provider) => connected.has(provider.id))
      .map((provider) => ({
        title: provider.name,
        value: provider.id,
        description: busy() === provider.id ? "logging out..." : "connected",
      }))
  })

  const doLogout = (providerID: string, name: string) => {
    dialog.replace(() => (
      <DialogConfirm
        title="Sign out"
        message={`Remove credentials for ${name}? You'll need to re-authenticate to use this provider again.`}
        onConfirm={async () => {
          setBusy(providerID)
          try {
            const result = await sdk.client.auth.remove({ providerID })
            if (result.error) {
              toast.show({
                variant: "error",
                title: "Logout failed",
                message: JSON.stringify(result.error),
              })
            } else {
              await sdk.client.instance.dispose()
              await sync.bootstrap()
              toast.show({
                variant: "info",
                title: "Signed out",
                message: name,
              })
            }
          } catch (err) {
            toast.show({
              variant: "error",
              title: "Logout failed",
              message: err instanceof Error ? err.message : String(err),
            })
          } finally {
            setBusy(null)
            dialog.clear()
          }
        }}
        onCancel={() => dialog.replace(() => <DialogLogout />)}
      />
    ))
  }

  return (
    <DialogSelect
      title="Sign out provider"
      options={options()}
      onSelect={(item) => {
        const provider = sync.data.provider_next.all.find((value) => value.id === item.value)
        doLogout(item.value, provider?.name ?? item.value)
      }}
    />
  )
}
