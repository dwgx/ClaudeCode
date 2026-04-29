import type {
  ProviderConfig,
  RouterConfig,
  RouterDecision,
  RouterRequest,
  RouterResponse,
  TransformerContext,
  TransformerSpec,
} from "./types"

export interface ChainResult {
  url: string | undefined
  headers: Record<string, string>
  request: RouterRequest
}

export async function runRequestChain(
  decision: RouterDecision,
  config: RouterConfig,
  request: RouterRequest,
  env: Record<string, string | undefined>,
): Promise<ChainResult> {
  const { provider, model } = resolveTarget(decision, config)
  const ctx = createContext(decision, env)
  const url = firstEndPoint(provider.use, ctx)
  const headers = firstAuth(provider.use, ctx)
  let current = request

  for (const spec of provider.use ?? []) {
    current = (await spec.hooks.transformRequestIn?.(current, ctx)) ?? current
  }
  for (const spec of provider.use ?? []) {
    current = (await spec.hooks.transformRequestOut?.(current, ctx)) ?? current
  }
  for (const spec of model.use ?? []) {
    current = (await spec.hooks.transformRequestIn?.(current, ctx)) ?? current
  }
  for (const spec of model.use ?? []) {
    current = (await spec.hooks.transformRequestOut?.(current, ctx)) ?? current
  }

  return { url, headers, request: current }
}

export async function runResponseChain(
  decision: RouterDecision,
  config: RouterConfig,
  response: RouterResponse,
  env: Record<string, string | undefined>,
): Promise<RouterResponse> {
  const { provider, model } = resolveTarget(decision, config)
  const ctx = createContext(decision, env)
  let current = response

  for (const spec of reverse(model.use)) {
    current = (await spec.hooks.transformResponseOut?.(current, ctx)) ?? current
  }
  for (const spec of reverse(model.use)) {
    current = (await spec.hooks.transformResponseIn?.(current, ctx)) ?? current
  }
  for (const spec of reverse(provider.use)) {
    current = (await spec.hooks.transformResponseOut?.(current, ctx)) ?? current
  }
  for (const spec of reverse(provider.use)) {
    current = (await spec.hooks.transformResponseIn?.(current, ctx)) ?? current
  }

  return current
}

function resolveTarget(decision: RouterDecision, config: RouterConfig) {
  const provider = config.providers[decision.providerID]
  if (!provider) throw new Error(`Router provider "${decision.providerID}" is not configured`)
  const model = provider.models[decision.modelID]
  if (!model) throw new Error(`Router model "${decision.modelID}" is not configured on provider "${decision.providerID}"`)
  return { provider, model }
}

function createContext(decision: RouterDecision, env: Record<string, string | undefined>): TransformerContext {
  return {
    providerID: decision.providerID,
    modelID: decision.modelID,
    env,
  }
}

function firstEndPoint(specs: ProviderConfig["use"], ctx: TransformerContext): string | undefined {
  return specs?.find((spec) => spec.hooks.endPoint)?.hooks.endPoint?.(ctx)
}

function firstAuth(specs: ProviderConfig["use"], ctx: TransformerContext): Record<string, string> {
  return specs?.find((spec) => spec.hooks.auth)?.hooks.auth?.(ctx) ?? {}
}

function reverse(specs: TransformerSpec[] | undefined): TransformerSpec[] {
  return [...(specs ?? [])].reverse()
}
