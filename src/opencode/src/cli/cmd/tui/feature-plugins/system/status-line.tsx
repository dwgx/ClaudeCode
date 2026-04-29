import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@dwgx/claudecode-plugin/tui"
import { createMemo, createResource, createSignal, Show } from "solid-js"
import {
  loadStatusLineConfig,
  runStatusLine,
  type StatusLineConfig,
} from "@dwgx/claudecode-core/statusline/index"

const id = "internal:status-line"

function View(props: { api: TuiPluginApi; sessionID?: string }) {
  const theme = () => props.api.theme.current

  const [cfgVersion, bumpCfg] = createSignal(0)
  const [cfg] = createResource<StatusLineConfig | undefined, number>(
    cfgVersion,
    async () => loadStatusLineConfig(),
  )

  // Run config refresh on each render of fresh sessions to pick up edits.
  setTimeout(() => bumpCfg((v) => v + 1), 0)

  const cwd = createMemo(() => props.api.state.path.directory || process.cwd())
  const branch = createMemo(() => props.api.state.vcs?.branch ?? undefined)
  const lastModel = createMemo(() => {
    if (!props.sessionID) return undefined
    const msgs = props.api.state.session.messages(props.sessionID)
    const last = msgs.findLast((m) => m.role === "assistant")
    if (!last) return undefined
    return { providerID: last.providerID, modelID: last.modelID }
  })

  const trigger = createMemo(() => ({
    cwd: cwd(),
    branch: branch(),
    sessionID: props.sessionID,
    model: lastModel(),
    cfg: cfg(),
  }))

  const [output] = createResource(
    trigger,
    async (t) => {
      if (!t.cfg) return ""
      const outcome = await runStatusLine(t.cfg, {
        session_id: t.sessionID,
        cwd: t.cwd,
        model: t.model,
        branch: t.branch,
      })
      return outcome.text
    },
  )

  const text = createMemo(() => output() ?? "")

  return (
    <Show when={cfg() && text().length > 0}>
      <box width="100%" paddingLeft={2} paddingRight={2} flexShrink={0}>
        <text fg={theme().textMuted}>{text()}</text>
      </box>
    </Show>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 100,
    slots: {
      home_status_line() {
        return <View api={api} />
      },
      session_status_line(_ctx, props) {
        return <View api={api} sessionID={(props as { session_id?: string }).session_id} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id,
  tui,
}

export default plugin
