import { describe, expect, test } from "bun:test"
import { runRequestChain, runResponseChain } from "../chain"
import { createNoopTransformer } from "../transformer"
import type { RouterConfig, RouterDecision, RouterRequest, RouterResponse, TransformerSpec } from "../types"

const decision: RouterDecision = {
  scenario: "default",
  providerID: "p",
  modelID: "m",
  reason: "test",
}

function appendTrace(name: string): TransformerSpec {
  return {
    name,
    hooks: {
      transformRequestIn: (req) => appendRequest(req, `${name}:requestIn`),
      transformRequestOut: (req) => appendRequest(req, `${name}:requestOut`),
      transformResponseIn: (res) => appendResponse(res, `${name}:responseIn`),
      transformResponseOut: (res) => appendResponse(res, `${name}:responseOut`),
    },
  }
}

function appendRequest(value: RouterRequest, item: string): RouterRequest {
  return { ...value, trace: [...readTrace(value), item] }
}

function appendResponse(value: RouterResponse, item: string): RouterResponse {
  return { ...value, trace: [...readTrace(value), item] }
}

function readTrace(value: Record<string, unknown>): string[] {
  return Array.isArray(value.trace) && value.trace.every((item) => typeof item === "string") ? value.trace : []
}

describe("router transformer chain", () => {
  test("noop transformers leave request structurally equal to input", async () => {
    const request: RouterRequest = { model: "m", messages: [{ role: "user", content: "hi" }] }
    const config: RouterConfig = {
      providers: {
        p: {
          models: { m: {} },
          use: [createNoopTransformer("provider")],
        },
      },
      routes: { default: "p,m" },
    }

    const result = await runRequestChain(decision, config, request, {})

    expect(result.request).toEqual(request)
    expect(result.url).toBeUndefined()
    expect(result.headers).toEqual({})
  })

  test("provider endPoint hook returns url and missing hook leaves url undefined", async () => {
    const withUrl: RouterConfig = {
      providers: {
        p: {
          models: { m: {} },
          use: [{ name: "endpoint", hooks: { endPoint: () => "https://provider.test/v1" } }],
        },
      },
      routes: { default: "p,m" },
    }
    const withoutUrl: RouterConfig = {
      providers: { p: { models: { m: {} } } },
      routes: { default: "p,m" },
    }
    const request: RouterRequest = { model: "m", messages: [] }

    await expect(runRequestChain(decision, withUrl, request, {})).resolves.toMatchObject({
      url: "https://provider.test/v1",
    })
    await expect(runRequestChain(decision, withoutUrl, request, {})).resolves.toMatchObject({
      url: undefined,
    })
  })

  test("provider auth hook returns headers from the first matching provider spec", async () => {
    const request: RouterRequest = { model: "m", messages: [] }
    const config: RouterConfig = {
      providers: {
        p: {
          models: { m: {} },
          use: [
            { name: "auth1", hooks: { auth: () => ({ Authorization: "Bearer one" }) } },
            { name: "auth2", hooks: { auth: () => ({ Authorization: "Bearer two" }) } },
          ],
        },
      },
      routes: { default: "p,m" },
    }

    const result = await runRequestChain(decision, config, request, {})

    expect(result.headers).toEqual({ Authorization: "Bearer one" })
  })

  test("provider and model transformers run declared order on request and reverse order on response", async () => {
    const config: RouterConfig = {
      providers: {
        p: {
          use: [appendTrace("p1"), appendTrace("p2")],
          models: { m: { use: [appendTrace("m1"), appendTrace("m2")] } },
        },
      },
      routes: { default: "p,m" },
    }
    const request: RouterRequest = { model: "m", messages: [], trace: [] }
    const response: RouterResponse = { trace: [] }

    const requestResult = await runRequestChain(decision, config, request, {})
    const responseResult = await runResponseChain(decision, config, response, {})

    expect(requestResult.request.trace).toEqual([
      "p1:requestIn",
      "p2:requestIn",
      "p1:requestOut",
      "p2:requestOut",
      "m1:requestIn",
      "m2:requestIn",
      "m1:requestOut",
      "m2:requestOut",
    ])
    expect(responseResult.trace).toEqual([
      "m2:responseOut",
      "m1:responseOut",
      "m2:responseIn",
      "m1:responseIn",
      "p2:responseOut",
      "p1:responseOut",
      "p2:responseIn",
      "p1:responseIn",
    ])
  })

  test("throws a clear error for missing provider or model", async () => {
    const request: RouterRequest = { model: "m", messages: [] }
    const config: RouterConfig = { providers: { p: { models: {} } }, routes: { default: "p,m" } }

    await expect(runRequestChain({ ...decision, providerID: "missing" }, config, request, {})).rejects.toThrow(
      'Router provider "missing" is not configured',
    )
    await expect(runRequestChain(decision, config, request, {})).rejects.toThrow(
      'Router model "m" is not configured on provider "p"',
    )
  })
})
