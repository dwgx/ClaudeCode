export interface StatusLineConfig {
  type: "command"
  command: string
  // 默认 3000ms。命令执行超过该时长会被强制终止。
  timeout?: number
}

export interface StatusLineInput {
  session_id?: string
  cwd: string
  model?: { providerID: string; modelID: string }
  branch?: string
}

export interface StatusLineOutcome {
  text: string
  exitCode: number
  durationMs: number
  timedOut: boolean
  stderr?: string
}
