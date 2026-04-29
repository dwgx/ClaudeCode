export type ScenarioName = "default" | "background" | "think" | "longContext" | "webSearch" | "image"

export interface RouterDecision {
  scenario: ScenarioName
  providerID: string
  modelID: string
  reason: string
}

export interface RouterRequest {
  model: string
  messages: Array<{ role: string; content: unknown }>
  tools?: unknown[]
  tokenCount?: number
  [key: string]: unknown
}

export interface RouterResponse {
  [key: string]: unknown
}

export interface TransformerHooks {
  endPoint?: (config: TransformerContext) => string | undefined
  auth?: (config: TransformerContext) => Record<string, string> | undefined
  transformRequestIn?: (req: RouterRequest, ctx: TransformerContext) => RouterRequest | Promise<RouterRequest>
  transformRequestOut?: (req: RouterRequest, ctx: TransformerContext) => RouterRequest | Promise<RouterRequest>
  transformResponseIn?: (res: RouterResponse, ctx: TransformerContext) => RouterResponse | Promise<RouterResponse>
  transformResponseOut?: (res: RouterResponse, ctx: TransformerContext) => RouterResponse | Promise<RouterResponse>
}

export interface TransformerContext {
  providerID: string
  modelID: string
  env: Record<string, string | undefined>
}

export interface TransformerSpec {
  name: string
  hooks: TransformerHooks
  config?: Record<string, unknown>
}

export interface RouterConfig {
  providers: Record<string, ProviderConfig>
  routes: Partial<Record<ScenarioName, string>>
  longContextThreshold?: number
  longContextFallback?: number
}

export interface ProviderConfig {
  apiKey?: string
  apiBaseUrl?: string
  models: Record<string, ModelConfig>
  use?: TransformerSpec[]
}

export interface ModelConfig {
  use?: TransformerSpec[]
}
