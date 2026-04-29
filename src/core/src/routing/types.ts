export type Scenario = "default" | "background" | "think" | "longContext" | "webSearch" | "image"

export interface Message {
  role: "system" | "user" | "assistant" | "tool"
  content: string | unknown[]
  name?: string
  tool_call_id?: string
  tool_calls?: unknown[]
  [key: string]: unknown
}

export interface RouterRequest {
  model: string
  messages: Message[]
  tools?: unknown[]
  stream?: boolean
  [key: string]: unknown
}

export interface RouterResponse {
  id: string
  choices: { message: Message; finish_reason: string }[]
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens?: number }
  [key: string]: unknown
}

export interface Transformer {
  name: string
  transformRequestIn?(req: RouterRequest, ctx: TransformContext): Promise<RouterRequest> | RouterRequest
  transformRequestOut?(req: RouterRequest, ctx: TransformContext): Promise<RouterRequest> | RouterRequest
  transformResponseIn?(res: RouterResponse, ctx: TransformContext): Promise<RouterResponse> | RouterResponse
  transformResponseOut?(res: RouterResponse, ctx: TransformContext): Promise<RouterResponse> | RouterResponse
  endPoint?(req: RouterRequest, ctx: TransformContext): { url: string; headers?: Record<string, string> }
  auth?(ctx: TransformContext): Record<string, string>
}

export interface TransformContext {
  provider: ProviderConfig
  model: string
  scenario: Scenario
}

export type TransformerUseConfig = {
  use?: string[]
  [model: string]: { use?: string[] } | string[] | undefined
}

export interface ProviderConfig {
  name: string
  baseURL: string
  apiKey?: string
  models: string[]
  transformers?: TransformerUseConfig
  api_base_url?: string
  api_key?: string
  transformer?: TransformerUseConfig
  [key: string]: unknown
}

export interface RouterConfig {
  Providers: ProviderConfig[]
  Router: Partial<Record<Scenario, string>>
  Defaults?: { longContextThreshold?: number; longContextFallback?: number }
}

export interface RoutingDecision {
  provider: ProviderConfig
  model: string
  scenario: Scenario
  transformerChain: Transformer[]
}
