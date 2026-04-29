import { describe, expect, test } from "bun:test"
import { findSubagentTag, parseSubagentTag } from "../subagent-tag"

describe("router subagent tag parsing", () => {
  test("parses a well-formed tag from plain string content", () => {
    expect(parseSubagentTag("use <CCR-SUBAGENT-MODEL> provider , model </CCR-SUBAGENT-MODEL>")).toEqual({
      providerID: "provider",
      modelID: "model",
    })
  })

  test("finds tag in multi-part array content", () => {
    expect(
      findSubagentTag([
        { content: "older" },
        { content: [{ type: "text", text: "<CCR-SUBAGENT-MODEL>x,y</CCR-SUBAGENT-MODEL>" }] },
      ]),
    ).toEqual({ providerID: "x", modelID: "y" })
  })

  test("returns undefined for missing or malformed tags", () => {
    expect(parseSubagentTag("missing")).toBeUndefined()
    expect(parseSubagentTag("<CCR-SUBAGENT-MODEL>x</CCR-SUBAGENT-MODEL>")).toBeUndefined()
    expect(parseSubagentTag("<CCR-SUBAGENT-MODEL>,y</CCR-SUBAGENT-MODEL>")).toBeUndefined()
  })

  test("searches most recent messages first", () => {
    expect(
      findSubagentTag([
        { content: "<CCR-SUBAGENT-MODEL>old,model</CCR-SUBAGENT-MODEL>" },
        { content: "<CCR-SUBAGENT-MODEL>new,model</CCR-SUBAGENT-MODEL>" },
      ]),
    ).toEqual({ providerID: "new", modelID: "model" })
  })
})
