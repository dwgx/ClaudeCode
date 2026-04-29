import type { Hooks, Plugin, PluginInput } from "@dwgx/claudecode-plugin"
import * as Log from "@dwgx/claudecode-core/util/log"
import {
  DEFAULT_STYLE_NAME,
  formatOutputStyleForPrompt,
  loadCurrentStyleName,
  loadOutputStyles,
} from "@dwgx/claudecode-core/output-style/index"

const log = Log.create({ service: "plugin.output-style" })

// 启动时加载已选 output style，把样式指令塞进 system prompt 顶部。
// 选择 default 时不注入（与原行为一致）。
export const OutputStylePlugin: Plugin = async (_input: PluginInput) => {
  async function resolve(): Promise<string> {
    const name = await loadCurrentStyleName()
    if (!name || name === DEFAULT_STYLE_NAME) return ""
    const styles = await loadOutputStyles()
    const found = styles.find((s) => s.name === name)
    if (!found) {
      log.warn("style not found, falling back to default", { name })
      return ""
    }
    return formatOutputStyleForPrompt(found)
  }

  let cached = await resolve()
  log.info("init", { hasStyle: cached.length > 0 })

  const hooks: Hooks = {
    "experimental.chat.system.transform": async (_input, output) => {
      try {
        cached = await resolve()
      } catch {
        // ignore, use cached
      }
      if (cached) output.system.unshift(cached)
    },
  }
  return hooks
}
