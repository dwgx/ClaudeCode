import type { Hooks, Plugin, PluginInput } from "@dwgx/claudecode-plugin"
import * as Log from "@dwgx/claudecode-core/util/log"
import {
  defaultSettingsRoots,
  loadHookSettings,
  matcherFits,
  runHookCommand,
  type AnthropicHookEventName,
  type AnthropicHookMatcher,
  type HookEnvelope,
} from "@dwgx/claudecode-core/orchestration/hooks/index"
import { randomUUID } from "node:crypto"

const log = Log.create({ service: "plugin.anthropic-hooks" })

function ulidish(): string {
  return Date.now().toString(36) + "-" + randomUUID().slice(0, 8)
}

async function dispatch(
  matchers: AnthropicHookMatcher[] | undefined,
  toolName: string | undefined,
  envelope: HookEnvelope,
  blockable: boolean,
): Promise<void> {
  if (!matchers || matchers.length === 0) return
  for (const matcher of matchers) {
    if (!matcherFits(matcher.matcher, toolName)) continue
    for (const cmd of matcher.hooks) {
      const outcome = await runHookCommand(cmd, envelope)
      log.info("hook", {
        event: envelope.anthropic_event_name,
        tool: toolName,
        cmd: cmd.command,
        exit: outcome.exitCode,
        ms: outcome.durationMs,
        timedOut: outcome.timedOut,
      })
      if (blockable && outcome.exitCode !== 0) {
        const reason = outcome.stderr.trim() || `hook ${cmd.command} exited ${outcome.exitCode}`
        throw new Error(`[anthropic-hook] ${envelope.anthropic_event_name} blocked: ${reason}`)
      }
    }
  }
}

export const AnthropicHooksPlugin: Plugin = async (input: PluginInput) => {
  const repoRoot = input.directory ?? process.cwd()
  const settings = await loadHookSettings(defaultSettingsRoots(repoRoot))

  const all = settings.hooks ?? {}
  const has = (event: AnthropicHookEventName) => Boolean(all[event]?.length)

  const total = Object.values(all).reduce((acc, arr) => acc + (arr?.length ?? 0), 0)
  log.info("loaded", { events: Object.keys(all).filter((k) => all[k as AnthropicHookEventName]?.length), total })

  const hooks: Hooks = {}

  if (has("UserPromptSubmit")) {
    hooks["chat.message"] = async (i, _o) => {
      const envelope: HookEnvelope = {
        event_id: ulidish(),
        runtime: "claudecode",
        native_event_name: "chat.message",
        anthropic_event_name: "UserPromptSubmit",
        timestamp: new Date().toISOString(),
        session_id: i.sessionID,
        cwd: repoRoot,
        model: i.model,
        raw: i,
      }
      await dispatch(all.UserPromptSubmit, undefined, envelope, true)
    }
  }

  if (has("PreToolUse")) {
    hooks["tool.execute.before"] = async (i, o) => {
      const envelope: HookEnvelope = {
        event_id: ulidish(),
        runtime: "claudecode",
        native_event_name: "tool.execute.before",
        anthropic_event_name: "PreToolUse",
        timestamp: new Date().toISOString(),
        session_id: i.sessionID,
        cwd: repoRoot,
        tool_name: i.tool,
        tool_input: o.args,
        raw: { input: i, output: o },
      }
      await dispatch(all.PreToolUse, i.tool, envelope, true)
    }
  }

  if (has("PostToolUse")) {
    hooks["tool.execute.after"] = async (i, o) => {
      const envelope: HookEnvelope = {
        event_id: ulidish(),
        runtime: "claudecode",
        native_event_name: "tool.execute.after",
        anthropic_event_name: "PostToolUse",
        timestamp: new Date().toISOString(),
        session_id: i.sessionID,
        cwd: repoRoot,
        tool_name: i.tool,
        tool_input: i.args,
        raw: { input: i, output: o },
      }
      await dispatch(all.PostToolUse, i.tool, envelope, false)
    }
  }

  if (has("PreCompact")) {
    hooks["experimental.session.compacting"] = async (i, _o) => {
      const envelope: HookEnvelope = {
        event_id: ulidish(),
        runtime: "claudecode",
        native_event_name: "experimental.session.compacting",
        anthropic_event_name: "PreCompact",
        timestamp: new Date().toISOString(),
        session_id: i.sessionID,
        cwd: repoRoot,
        raw: i,
      }
      await dispatch(all.PreCompact, undefined, envelope, true)
    }
  }

  return hooks
}
