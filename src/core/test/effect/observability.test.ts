import { afterEach, describe, expect, test } from "bun:test"
import { resource } from "@dwgx/claudecode-core/effect/observability"

const otelResourceAttributes = process.env.OTEL_RESOURCE_ATTRIBUTES
const claudecodeClient = process.env.CLAUDECODE_CLIENT

afterEach(() => {
  if (otelResourceAttributes === undefined) delete process.env.OTEL_RESOURCE_ATTRIBUTES
  else process.env.OTEL_RESOURCE_ATTRIBUTES = otelResourceAttributes

  if (claudecodeClient === undefined) delete process.env.CLAUDECODE_CLIENT
  else process.env.CLAUDECODE_CLIENT = claudecodeClient
})

describe("resource", () => {
  test("parses and decodes OTEL resource attributes", () => {
    process.env.OTEL_RESOURCE_ATTRIBUTES =
      "service.namespace=dwgx,team=platform%2Cobservability,label=hello%3Dworld,key%2Fname=value%20here"

    expect(resource().attributes).toMatchObject({
      "service.namespace": "dwgx",
      team: "platform,observability",
      label: "hello=world",
      "key/name": "value here",
    })
  })

  test("drops OTEL resource attributes when any entry is invalid", () => {
    process.env.OTEL_RESOURCE_ATTRIBUTES = "service.namespace=dwgx,broken"

    expect(resource().attributes["service.namespace"]).toBeUndefined()
    expect(resource().attributes["claudecode.client"]).toBeDefined()
  })

  test("keeps built-in attributes when env values conflict", () => {
    process.env.CLAUDECODE_CLIENT = "cli"
    process.env.OTEL_RESOURCE_ATTRIBUTES =
      "claudecode.client=web,service.instance.id=override,service.namespace=dwgx"

    expect(resource().attributes).toMatchObject({
      "claudecode.client": "cli",
      "service.namespace": "dwgx",
    })
    expect(resource().attributes["service.instance.id"]).not.toBe("override")
  })
})
