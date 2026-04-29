import { describe, expect, test } from "bun:test"
import { classify } from "../scenario"
import type { RouterConfig, RouterRequest } from "../types"

const config: RouterConfig = {
  providers: {
    p: { models: { m: {} } },
    lc: { models: { big: {} } },
    bg: { models: { small: {} } },
    ws: { models: { search: {} } },
    img: { models: { vision: {} } },
    think: { models: { deep: {} } },
  },
  routes: {
    default: "p,m",
    longContext: "lc,big",
    background: "bg,small",
    webSearch: "ws,search",
    image: "img,vision",
    think: "think,deep",
  },
}

function req(overrides: Partial<RouterRequest> = {}): RouterRequest {
  return {
    model: "claude-sonnet",
    messages: [{ role: "user", content: "hello" }],
    ...overrides,
  }
}

describe("router scenario classifier", () => {
  test("picks default scenario when no special signals match", () => {
    expect(classify(req(), config, 1000)).toEqual({
      scenario: "default",
      providerID: "p",
      modelID: "m",
      reason: "default route",
    })
  })

  test("subagent tag override beats longContext", () => {
    const decision = classify(
      req({ messages: [{ role: "user", content: "<CCR-SUBAGENT-MODEL>x,y</CCR-SUBAGENT-MODEL>" }] }),
      config,
      90000,
    )

    expect(decision).toEqual({
      scenario: "default",
      providerID: "x",
      modelID: "y",
      reason: "subagent tag",
    })
  })

  test("longContext threshold uses longContext route", () => {
    const decision = classify(req(), config, 60000)
    expect(decision.scenario).toBe("longContext")
    expect(decision.providerID).toBe("lc")
    expect(decision.modelID).toBe("big")
    expect(decision.reason).toBe("longContext threshold")
  })

  test("longContext fallback band uses longContext route when configured", () => {
    const decision = classify(req(), config, 20000)
    expect(decision.scenario).toBe("longContext")
    expect(decision.reason).toBe("longContext fallback band")
  })

  test("background scenario matches claude haiku model names", () => {
    const decision = classify(req({ model: "claude-3-5-haiku" }), config, 1000)
    expect(decision.scenario).toBe("background")
    expect(decision.providerID).toBe("bg")
  })

  test("webSearch scenario matches web tool names", () => {
    const decision = classify(req({ tools: [{ name: "web_search" }] }), config, 1000)
    expect(decision.scenario).toBe("webSearch")
    expect(decision.providerID).toBe("ws")
    expect(decision.reason).toBe("webSearch tool")
  })

  test("image scenario matches nested image content", () => {
    const decision = classify(
      req({ messages: [{ role: "user", content: [{ type: "input", source: { type: "image" } }] }] }),
      config,
      1000,
    )
    expect(decision.scenario).toBe("image")
    expect(decision.providerID).toBe("img")
  })

  test("think scenario matches -thinking model names", () => {
    const decision = classify(req({ model: "claude-sonnet-thinking" }), config, 1000)
    expect(decision.scenario).toBe("think")
    expect(decision.providerID).toBe("think")
  })

  test("falls back to default when longContext route is missing", () => {
    const decision = classify(req(), { providers: config.providers, routes: { default: "p,m" } }, 90000)
    expect(decision.scenario).toBe("default")
    expect(decision.reason).toBe("longContext threshold fallback to default")
  })

  test("throws with a clear message when routes.default is missing", () => {
    expect(() => classify(req(), { providers: {}, routes: {} }, 1000)).toThrow("routes.default is required")
  })
})
