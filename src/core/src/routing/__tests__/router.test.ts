import { describe, expect, test } from "bun:test"
import { Router, RoutingError } from "../router.ts"
import { TransformerRegistry } from "../transformer.ts"
import { AnthropicTransformer } from "../transformers/anthropic.ts"
import type { RouterConfig, RouterRequest, RouterResponse, TransformContext } from "../types.ts"

describe("routing.Router", () => {
  test("throws RoutingError when no route target exists", async () => {
    const router = new Router({ Providers: [], Router: {} }, new TransformerRegistry())

    await expect(router.route({ model: "any", messages: [] })).rejects.toThrow(RoutingError)
  })

  test("routes default scenario to configured provider and model", async () => {
    const config: RouterConfig = {
      Providers: [
        {
          name: "anthropic",
          baseURL: "https://api.anthropic.com/v1/messages",
          apiKey: "test-key",
          models: ["claude-sonnet"],
        },
      ],
      Router: { default: "anthropic,claude-sonnet" },
    }

    const decision = await new Router(config, new TransformerRegistry()).route({ model: "ignored", messages: [] })

    expect(decision.provider.name).toBe("anthropic")
    expect(decision.model).toBe("claude-sonnet")
    expect(decision.scenario).toBe("default")
    expect(decision.transformerChain).toEqual([])
  })

  test("converts simple OpenAI-style text request and Anthropic response", async () => {
    const ctx: TransformContext = {
      provider: {
        name: "anthropic",
        baseURL: "https://api.anthropic.com/v1/messages",
        apiKey: "test-key",
        models: ["claude-sonnet"],
      },
      model: "claude-sonnet",
      scenario: "default",
    }
    const request: RouterRequest = {
      model: "ignored",
      max_tokens: 128,
      messages: [{ role: "user", content: "hi" }],
    }

    const anthropicRequest = await AnthropicTransformer.transformRequestIn!(request, ctx)

    expect(anthropicRequest.model).toBe("claude-sonnet")
    expect(anthropicRequest.max_tokens).toBe(128)
    expect(anthropicRequest.messages).toEqual([{ role: "user", content: "hi" }])

    const response = await AnthropicTransformer.transformResponseIn!(
      {
        id: "msg_1",
        content: [{ type: "text", text: "hello" }],
        stop_reason: "end_turn",
        usage: { input_tokens: 1, output_tokens: 2 },
      } as unknown as RouterResponse,
      ctx,
    )

    expect(response.id).toBe("msg_1")
    expect(response.choices[0]?.message).toEqual({ role: "assistant", content: "hello" })
    expect(response.choices[0]?.finish_reason).toBe("stop")
    expect(response.usage).toEqual({ prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 })
  })
})
