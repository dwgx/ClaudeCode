import { Keybind } from "@/util/keybind"
import type { TuiPlugin, TuiPluginApi, TuiPluginModule, TuiPluginStatus } from "@dwgx/claudecode-plugin/tui"
import { useKeyboard, useTerminalDimensions } from "@opentui/solid"
import { fileURLToPath } from "url"
import { DialogSelect, type DialogSelectOption } from "@tui/ui/dialog-select"
import { Show, createEffect, createMemo, createSignal } from "solid-js"
import { evaluateTrust, trustAllOverride } from "@dwgx/claudecode-core/plugin-trust/index"

const id = "internal:plugin-manager"
const key = Keybind.parse("space").at(0)
const add = Keybind.parse("shift+i").at(0)
const tab = Keybind.parse("tab").at(0)

function state(api: TuiPluginApi, item: TuiPluginStatus) {
  if (!item.enabled) {
    return <span style={{ fg: api.theme.current.textMuted }}>disabled</span>
  }

  return (
    <span style={{ fg: item.active ? api.theme.current.success : api.theme.current.error }}>
      {item.active ? "active" : "inactive"}
    </span>
  )
}

function source(spec: string) {
  if (!spec.startsWith("file://")) return
  return fileURLToPath(spec)
}

function meta(item: TuiPluginStatus, width: number) {
  if (item.source === "internal") {
    if (width >= 120) return "Built-in plugin"
    return "Built-in"
  }
  const next = source(item.spec)
  if (next) return next
  return item.spec
}

async function doInstall(api: TuiPluginApi, mod: string, global: boolean): Promise<void> {
  const out = await api.plugins.install(mod, { global })
  if (!out.ok) {
    api.ui.toast({ variant: "error", message: out.message })
    if (out.missing) {
      api.ui.toast({
        variant: "info",
        message: "Check npm registry/auth settings and try again.",
      })
    }
    show(api)
    return
  }
  api.ui.toast({
    variant: "success",
    message: `Installed ${mod} (${global ? "global" : "local"}: ${out.dir})`,
  })
  if (!out.tui) {
    api.ui.toast({ variant: "info", message: "Package has no TUI target to load in this app." })
    show(api)
    return
  }
  const ok = await api.plugins.add(mod)
  if (!ok) {
    api.ui.toast({
      variant: "warning",
      message: "Installed plugin, but runtime load failed. See console/logs; restart TUI to retry.",
    })
    show(api)
    return
  }
  api.ui.toast({ variant: "success", message: `Loaded ${mod} in current session.` })
  show(api)
}

function Install(props: { api: TuiPluginApi }) {
  const [global, setGlobal] = createSignal(false)
  const [busy, setBusy] = createSignal(false)

  useKeyboard((evt) => {
    if (evt.name !== "tab") return
    evt.preventDefault()
    evt.stopPropagation()
    if (busy()) return
    setGlobal((x) => !x)
  })

  return (
    <props.api.ui.DialogPrompt
      title="Install plugin"
      placeholder="npm package name"
      busy={busy()}
      busyText="Installing plugin..."
      description={() => (
        <box flexDirection="row" gap={1}>
          <text fg={props.api.theme.current.textMuted}>scope:</text>
          <text fg={busy() ? props.api.theme.current.textMuted : props.api.theme.current.text}>
            {global() ? "global" : "local"}
          </text>
          <Show when={!busy()}>
            <text fg={props.api.theme.current.textMuted}>({Keybind.toString(tab)} toggle)</text>
          </Show>
        </box>
      )}
      onConfirm={(raw) => {
        if (busy()) return
        const mod = raw.trim()
        if (!mod) {
          props.api.ui.toast({
            variant: "error",
            message: "Plugin package name is required",
          })
          return
        }

        const verdict = evaluateTrust(mod)
        const proceed = () => {
          setBusy(true)
          void doInstall(props.api, mod, global()).finally(() => setBusy(false))
        }

        if (!verdict.trusted && !trustAllOverride()) {
          props.api.ui.dialog.replace(() => (
            <props.api.ui.DialogConfirm
              title="Untrusted plugin"
              message={
                `${mod}\n\n` +
                `${verdict.reason}.\n\n` +
                `Plugins run as code in this process and have full filesystem and network access. ` +
                `Only proceed if you trust the maintainer of this package.\n\n` +
                `(Set CLAUDECODE_PLUGIN_TRUST_ALL=1 to skip this prompt in CI.)`
              }
              onConfirm={proceed}
              onCancel={() => show(props.api)}
            />
          ))
          return
        }

        proceed()
      }}
      onCancel={() => {
        show(props.api)
      }}
    />
  )
}

function row(api: TuiPluginApi, item: TuiPluginStatus, width: number): DialogSelectOption<string> {
  return {
    title: item.id,
    value: item.id,
    category: item.source === "internal" ? "Internal" : "External",
    description: meta(item, width),
    footer: state(api, item),
    disabled: item.id === id,
  }
}

function showInstall(api: TuiPluginApi) {
  api.ui.dialog.replace(() => <Install api={api} />)
}

function View(props: { api: TuiPluginApi }) {
  const size = useTerminalDimensions()
  const [list, setList] = createSignal(props.api.plugins.list())
  const [cur, setCur] = createSignal<string | undefined>()
  const [lock, setLock] = createSignal(false)

  createEffect(() => {
    const width = size().width
    if (width >= 128) {
      props.api.ui.dialog.setSize("xlarge")
      return
    }
    if (width >= 96) {
      props.api.ui.dialog.setSize("large")
      return
    }
    props.api.ui.dialog.setSize("medium")
  })

  const rows = createMemo(() =>
    [...list()]
      .sort((a, b) => {
        const x = a.source === "internal" ? 1 : 0
        const y = b.source === "internal" ? 1 : 0
        if (x !== y) return x - y
        return a.id.localeCompare(b.id)
      })
      .map((item) => row(props.api, item, size().width)),
  )

  const flip = (x: string) => {
    if (lock()) return
    const item = list().find((entry) => entry.id === x)
    if (!item) return
    setLock(true)
    const task = item.active ? props.api.plugins.deactivate(x) : props.api.plugins.activate(x)
    void task
      .then((ok) => {
        if (!ok) {
          props.api.ui.toast({
            variant: "error",
            message: `Failed to update plugin ${item.id}`,
          })
        }
        setList(props.api.plugins.list())
      })
      .finally(() => {
        setLock(false)
      })
  }

  return (
    <DialogSelect
      title="Plugins"
      options={rows()}
      current={cur()}
      onMove={(item) => setCur(item.value)}
      keybind={[
        {
          title: "toggle",
          keybind: key,
          disabled: lock(),
          onTrigger: (item) => {
            setCur(item.value)
            flip(item.value)
          },
        },
        {
          title: "install",
          keybind: add,
          disabled: lock(),
          onTrigger: () => {
            showInstall(props.api)
          },
        },
      ]}
      onSelect={(item) => {
        setCur(item.value)
        flip(item.value)
      }}
    />
  )
}

function show(api: TuiPluginApi) {
  api.ui.dialog.replace(() => <View api={api} />)
}

const tui: TuiPlugin = async (api) => {
  api.command.register(() => [
    {
      title: "Plugins",
      value: "plugins.list",
      keybind: "plugin_manager",
      category: "System",
      slash: { name: "plugins", aliases: ["plugin"] },
      onSelect() {
        show(api)
      },
    },
    {
      title: "Install plugin",
      value: "plugins.install",
      category: "System",
      slash: { name: "plugin-install" },
      onSelect() {
        showInstall(api)
      },
    },
  ])
}

const plugin: TuiPluginModule & { id: string } = {
  id,
  tui,
}

export default plugin
