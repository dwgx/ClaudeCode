// Anthropic Claude Code 风格的 hook 配置 —— 与 opencode 内置 plugin Hooks 不同。
// 这是 settings.json 里声明式的（command-based），需要在 runtime 动态绑定到
// opencode 的 Hooks 对象上。

export type AnthropicHookEventName =
  | "UserPromptSubmit"
  | "PreToolUse"
  | "PostToolUse"
  | "Notification"
  | "Stop"
  | "SubagentStop"
  | "PreCompact"
  | "PostCompact"
  | "SessionStart"
  | "SessionEnd"
  | "TaskCreated"
  | "TaskCompleted"

export interface AnthropicHookCommand {
  type: "command"
  command: string
  timeout?: number
  // 当 command 退出非 0：deny（PreToolUse/PreCompact 时阻断）；其它语义忽略
  // 命令收到 stdin: JSON event payload
  // 命令 stdout: 若为 JSON，会作为 output 改写返回值（仅部分事件支持）
}

export interface AnthropicHookMatcher {
  matcher?: string  // tool name pattern (PreToolUse/PostToolUse) 或 event sub-type
  hooks: AnthropicHookCommand[]
}

export interface AnthropicHookSettings {
  hooks?: Partial<Record<AnthropicHookEventName, AnthropicHookMatcher[]>>
}

// runtime 内部统一 envelope，opencode 风格 hook 也最终能拿到这个
export interface HookEnvelope {
  event_id: string
  runtime: "claudecode"
  native_event_name: string
  anthropic_event_name?: AnthropicHookEventName
  timestamp: string
  session_id: string
  turn_id?: string
  cwd: string
  transcript_path?: string
  model?: { providerID: string; modelID: string }
  tool_name?: string
  tool_input?: unknown
  raw: unknown
}
