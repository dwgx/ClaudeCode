import { findSubagentTag } from "./subagent-tag"
import type { RouterConfig, RouterDecision, RouterRequest, ScenarioName } from "./types"

const DEFAULT_LONG_CONTEXT_THRESHOLD = 60000
const DEFAULT_LONG_CONTEXT_FALLBACK = 20000

export function classify(req: RouterRequest, config: RouterConfig, tokenCount: number): RouterDecision {
  const tag = findSubagentTag(req.messages)
  if (tag) {
    return {
      scenario: "default",
      providerID: tag.providerID,
      modelID: tag.modelID,
      reason: "subagent tag",
    }
  }

  if (hasImageContent(req) && hasRoute(config, "image")) {
    return decisionFor(config, "image", "image content")
  }

  if (hasWebSearchTool(req) && hasRoute(config, "webSearch")) {
    return decisionFor(config, "webSearch", "webSearch tool")
  }

  if (req.model.includes("-thinking") && hasRoute(config, "think")) {
    return decisionFor(config, "think", "think model")
  }

  const threshold = config.longContextThreshold ?? DEFAULT_LONG_CONTEXT_THRESHOLD
  const fallback = config.longContextFallback ?? DEFAULT_LONG_CONTEXT_FALLBACK
  if (tokenCount >= threshold) {
    if (hasRoute(config, "longContext")) {
      return decisionFor(config, "longContext", "longContext threshold")
    }
    return decisionFor(config, "default", "longContext threshold fallback to default")
  }
  if (tokenCount >= fallback && hasRoute(config, "longContext")) {
    return decisionFor(config, "longContext", "longContext fallback band")
  }

  const lowerModel = req.model.toLowerCase()
  if (lowerModel.includes("claude") && lowerModel.includes("haiku") && hasRoute(config, "background")) {
    return decisionFor(config, "background", "background model")
  }

  return decisionFor(config, "default", "default route")
}

function hasRoute(config: RouterConfig, scenario: ScenarioName): boolean {
  return typeof config.routes[scenario] === "string"
}

function decisionFor(config: RouterConfig, scenario: ScenarioName, reason: string): RouterDecision {
  const route = config.routes[scenario]
  if (!route) {
    throw new Error(`Router route "${scenario}" is not configured and routes.default is required`)
  }
  const { providerID, modelID } = parseRoute(route, scenario)
  return { scenario, providerID, modelID, reason }
}

function parseRoute(route: string, scenario: ScenarioName): { providerID: string; modelID: string } {
  const [providerID = "", modelID = ""] = route.split(",", 2).map((part) => part.trim())
  if (!providerID || !modelID) {
    throw new Error(`Router route "${scenario}" must be "providerID,modelID"`)
  }
  return { providerID, modelID }
}

function hasWebSearchTool(req: RouterRequest): boolean {
  return (req.tools ?? []).some((tool) => {
    if (!tool || typeof tool !== "object" || !("name" in tool)) return false
    const name = (tool as { name: unknown }).name
    return typeof name === "string" && name.toLowerCase().includes("web")
  })
}

function hasImageContent(req: RouterRequest): boolean {
  return req.messages.some((message) => containsImagePart(message.content))
}

function containsImagePart(value: unknown): boolean {
  if (!value) return false
  if (Array.isArray(value)) return value.some((item) => containsImagePart(item))
  if (typeof value !== "object") return false
  const record = value as Record<string, unknown>
  if (record.type === "image") return true
  return Object.values(record).some((item) => containsImagePart(item))
}
