import type {
  ProviderConfig,
  RouterConfig,
  RouterRequest,
  RoutingDecision,
  Scenario,
  Transformer,
  TransformerUseConfig,
} from "./types.ts"
import { TransformerRegistry } from "./transformer.ts"

export class Router {
  constructor(
    private config: RouterConfig,
    private registry: TransformerRegistry,
  ) {}

  async route(req: RouterRequest, hints?: { subagent?: string }): Promise<RoutingDecision> {
    void hints

    const scenario = await this.classifyScenario(req)
    const target = this.config.Router[scenario] ?? this.config.Router.default
    if (!target) throw new RoutingError(`no provider for scenario=${scenario}`)

    const parsed = parseTarget(target)
    if (!parsed) throw new RoutingError(`invalid route target: ${target}`)

    const provider = this.config.Providers.find((p) => p.name === parsed.providerName)
    if (!provider) throw new RoutingError(`provider not found: ${parsed.providerName}`)

    const chain = this.buildTransformerChain(provider, parsed.model)
    return { provider, model: parsed.model, scenario, transformerChain: chain }
  }

  private async classifyScenario(req: RouterRequest): Promise<Scenario> {
    // v0.1: only default + longContext. background/think/webSearch/image and
    // <CCR-SUBAGENT-MODEL> tag override are deferred to v0.2 — see ADR-0004.
    if (this.config.Router.longContext && this.estimateTokenCount(req) > this.longContextThreshold()) {
      return "longContext"
    }
    return "default"
  }

  private buildTransformerChain(provider: ProviderConfig, model: string): Transformer[] {
    const names = [
      ...readTransformerUse(provider.transformers ?? provider.transformer),
      ...readTransformerUse((provider.transformers ?? provider.transformer)?.[model]),
    ]

    return names.map((name) => {
      const transformer = this.registry.get(name)
      if (!transformer) throw new RoutingError(`transformer not found: ${name}`)
      return transformer
    })
  }

  private longContextThreshold(): number {
    return this.config.Defaults?.longContextThreshold ?? 60_000
  }

  private estimateTokenCount(req: RouterRequest): number {
    let chars = 0
    for (const message of req.messages) chars += countContentChars(message.content)
    if (req.tools) chars += stableJsonLength(req.tools)
    return Math.ceil(chars / 4)
  }
}

export class RoutingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RoutingError"
  }
}

function parseTarget(target: string): { providerName: string; model: string } | undefined {
  const comma = target.indexOf(",")
  if (comma <= 0 || comma === target.length - 1) return undefined

  const providerName = target.slice(0, comma).trim()
  const model = target.slice(comma + 1).trim()
  if (!providerName || !model) return undefined
  return { providerName, model }
}

function readTransformerUse(config: TransformerUseConfig | { use?: string[] } | string[] | undefined): string[] {
  if (!config) return []
  if (Array.isArray(config)) return config.filter((x): x is string => typeof x === "string")
  return (config.use ?? []).filter((x): x is string => typeof x === "string")
}

function countContentChars(content: string | unknown[]): number {
  if (typeof content === "string") return content.length
  return stableJsonLength(content)
}

function stableJsonLength(value: unknown): number {
  try {
    return JSON.stringify(value)?.length ?? 0
  } catch {
    return 0
  }
}
