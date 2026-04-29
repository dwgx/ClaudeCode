// SPDX-License-Identifier: MIT
// Adapted from claude-code-router (MIT)
//   © 2025 musistudio - https://github.com/musistudio/claude-code-router
// Modifications: rewritten for ClaudeCode router skeleton

import type { Message, RouterRequest, RouterResponse, TransformContext, Transformer } from "../types.ts"

type AnthropicContentBlock = {
  type?: string
  text?: string
  [key: string]: unknown
}

type AnthropicResponse = {
  id?: string
  content?: string | AnthropicContentBlock[]
  stop_reason?: string | null
  usage?: {
    input_tokens?: number
    output_tokens?: number
  }
}

export const AnthropicTransformer: Transformer = {
  name: "anthropic",

  transformRequestIn(req: RouterRequest, ctx: TransformContext): RouterRequest {
    const system = req.messages
      .filter((message) => message.role === "system")
      .map((message) => contentToText(message.content))
      .filter((text) => text.length > 0)
      .join("\n\n")

    const messages: Message[] = req.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        ...message,
        role: message.role === "tool" ? "user" : message.role,
        content: normalizeAnthropicContent(message.content),
      }))

    const out: RouterRequest = {
      model: ctx.model,
      messages,
    }

    if (system) out.system = system
    copyNumber(req, out, "max_tokens")
    copyNumber(req, out, "temperature")
    copyNumber(req, out, "top_p")
    copyNumber(req, out, "top_k")
    copyUnknown(req, out, "stop_sequences")
    if (req.tools) out.tools = req.tools
    if (req.stream !== undefined) out.stream = req.stream

    return out
  },

  transformResponseIn(res: RouterResponse): RouterResponse {
    const anthropic = res as unknown as AnthropicResponse
    const content = anthropicContentToOpenAI(anthropic.content)
    const promptTokens = anthropic.usage?.input_tokens ?? 0
    const completionTokens = anthropic.usage?.output_tokens ?? 0

    return {
      id: anthropic.id ?? "anthropic-response",
      choices: [
        {
          message: { role: "assistant", content },
          finish_reason: mapStopReason(anthropic.stop_reason),
        },
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
    }
  },

  endPoint(_req: RouterRequest, ctx: TransformContext): { url: string; headers?: Record<string, string> } {
    return {
      url: ctx.provider.baseURL || ctx.provider.api_base_url || "https://api.anthropic.com/v1/messages",
      headers: { "anthropic-version": "2023-06-01" },
    }
  },

  auth(ctx: TransformContext): Record<string, string> {
    const apiKey = ctx.provider.apiKey || ctx.provider.api_key
    return apiKey ? { "x-api-key": apiKey, "anthropic-version": "2023-06-01" } : { "anthropic-version": "2023-06-01" }
  },
}

function normalizeAnthropicContent(content: string | unknown[]): string | unknown[] {
  if (typeof content === "string") return content
  return content
}

function contentToText(content: string | unknown[]): string {
  if (typeof content === "string") return content
  return content
    .map((block) => {
      if (isRecord(block) && typeof block.text === "string") return block.text
      return ""
    })
    .filter(Boolean)
    .join("\n")
}

function anthropicContentToOpenAI(content: AnthropicResponse["content"]): string | unknown[] {
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return ""

  const text = content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")

  return text || content
}

function mapStopReason(reason: string | null | undefined): string {
  switch (reason) {
    case "end_turn":
      return "stop"
    case "max_tokens":
      return "length"
    case "tool_use":
      return "tool_calls"
    default:
      return reason ?? "stop"
  }
}

function copyNumber(source: RouterRequest, target: RouterRequest, key: string): void {
  const value = source[key]
  if (typeof value === "number") target[key] = value
}

function copyUnknown(source: RouterRequest, target: RouterRequest, key: string): void {
  if (source[key] !== undefined) target[key] = source[key]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
