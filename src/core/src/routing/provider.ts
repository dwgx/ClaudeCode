import type { RouterRequest, RouterResponse, RoutingDecision, TransformContext } from "./types.ts"
import { applyTransformerChain } from "./transformer.ts"

export interface ProviderClient {
  request(req: RouterRequest, decision: RoutingDecision): Promise<RouterResponse>
  abort(): void
}

export class FetchClient implements ProviderClient {
  private controller?: AbortController

  async request(req: RouterRequest, decision: RoutingDecision): Promise<RouterResponse> {
    this.controller = new AbortController()

    const ctx: TransformContext = {
      provider: decision.provider,
      model: decision.model,
      scenario: decision.scenario,
    }

    let outbound = await applyTransformerChain(req, decision.transformerChain, "transformRequestIn", ctx)
    outbound = await applyTransformerChain(outbound, decision.transformerChain, "transformRequestOut", ctx)

    const endpoint = resolveEndpoint(outbound, decision, ctx)
    const headers = {
      "content-type": "application/json",
      ...resolveAuthHeaders(decision, ctx),
      ...endpoint.headers,
    }

    const response = await fetch(endpoint.url, {
      method: "POST",
      headers,
      body: JSON.stringify(outbound),
      signal: this.controller.signal,
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      throw new Error(`provider request failed: ${response.status} ${response.statusText}${body ? ` ${body}` : ""}`)
    }

    const reverseChain = [...decision.transformerChain].reverse()
    let inbound = (await response.json()) as RouterResponse
    inbound = await applyTransformerChain(inbound, reverseChain, "transformResponseIn", ctx)
    inbound = await applyTransformerChain(inbound, reverseChain, "transformResponseOut", ctx)
    return inbound
  }

  abort(): void {
    this.controller?.abort()
    this.controller = undefined
  }
}

function resolveEndpoint(
  req: RouterRequest,
  decision: RoutingDecision,
  ctx: TransformContext,
): { url: string; headers?: Record<string, string> } {
  for (const transformer of decision.transformerChain) {
    const endpoint = transformer.endPoint?.(req, ctx)
    if (endpoint) return endpoint
  }

  return { url: providerBaseURL(decision.provider) }
}

function resolveAuthHeaders(decision: RoutingDecision, ctx: TransformContext): Record<string, string> {
  const apiKey = providerApiKey(decision.provider)
  const headers: Record<string, string> = apiKey ? { authorization: `Bearer ${apiKey}` } : {}

  for (const transformer of decision.transformerChain) {
    Object.assign(headers, transformer.auth?.(ctx))
  }

  return headers
}

function providerBaseURL(provider: RoutingDecision["provider"]): string {
  return provider.baseURL || provider.api_base_url || ""
}

function providerApiKey(provider: RoutingDecision["provider"]): string | undefined {
  return provider.apiKey || provider.api_key
}
