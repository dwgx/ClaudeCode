export interface AgentDef {
  name: string
  description: string
  tools?: string[]
  disallowedTools?: string[]
  model?: string
  maxTurns?: number
  effort?: "low" | "medium" | "high"
  skills?: string[]
  body: string
  source: string
}
