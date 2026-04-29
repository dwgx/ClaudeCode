import type { Hooks, Plugin, PluginInput } from "@dwgx/claudecode-plugin"
import * as Log from "@dwgx/claudecode-core/util/log"
import { defaultMemoryRoot, formatMemoryForPrompt, loadMemory } from "@dwgx/claudecode-core/memory/index"

const log = Log.create({ service: "plugin.memory" })

// 启动时把 ~/.claudecode/data/memory/ 下的 memory 装入 system prompt 顶部。
// LLM 看到 <persistent_memory>...</persistent_memory> 段落，就会按其中事实/偏好回应。
export const MemoryInjectorPlugin: Plugin = async (_input: PluginInput) => {
  const root = defaultMemoryRoot()
  let cached: string | undefined

  async function refresh(): Promise<string> {
    const entries = await loadMemory(root)
    log.info("loaded", { count: entries.length, root })
    return formatMemoryForPrompt(entries)
  }

  cached = await refresh()

  const hooks: Hooks = {
    "experimental.chat.system.transform": async (_input, output) => {
      // 每个 session 都重新读，便于 in-flight 用 file edit 改 memory 立即生效。
      // 失败回退缓存，不阻塞 chat。
      try {
        cached = await refresh()
      } catch {
        // ignore, use cached
      }
      if (cached && cached.length > 0) {
        output.system.unshift(cached)
      }
    },
  }
  return hooks
}
