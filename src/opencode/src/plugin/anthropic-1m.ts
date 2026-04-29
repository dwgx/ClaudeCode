import type { Hooks, Plugin, PluginInput } from "@dwgx/claudecode-plugin"
import * as Log from "@dwgx/claudecode-core/util/log"

const log = Log.create({ service: "plugin.anthropic-1m" })

const BETA_HEADER = "anthropic-beta"
const BETA_VALUE = "context-1m-2025-08-07"

// 启用方式：CLAUDECODE_ANTHROPIC_1M=1 环境变量，或者 model id 含 "1m" / "long"。
// 运行时会给 Anthropic provider 的 HTTP 请求加 anthropic-beta header，启用 1M context window。
export const Anthropic1MPlugin: Plugin = async (_input: PluginInput) => {
  const envEnabled = process.env.CLAUDECODE_ANTHROPIC_1M === "1"
  log.info("init", { envEnabled })

  const hooks: Hooks = {
    "chat.headers": async (input, output) => {
      if (input.model.providerID !== "anthropic") return

      const wantBeta = envEnabled || /1m|long/i.test(input.model.id ?? "")
      if (!wantBeta) return

      // 合并已有 anthropic-beta（其它 plugin / opencode 内部可能已设）
      const existing = output.headers[BETA_HEADER] ?? output.headers[BETA_HEADER.toLowerCase()]
      if (existing) {
        if (!existing.includes(BETA_VALUE)) {
          output.headers[BETA_HEADER] = `${existing},${BETA_VALUE}`
        }
      } else {
        output.headers[BETA_HEADER] = BETA_VALUE
      }
    },
  }
  return hooks
}
