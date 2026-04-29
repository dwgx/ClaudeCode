import { describe, expect, test } from "bun:test"
import {
  DoHandler,
  tier0PatternMatcher,
  tier1ActiveMatcher,
  tier2KeywordMatcher,
  tier3LlmMatcher,
  type DoContext,
} from "../index.ts"

const ctx: DoContext = { cwd: "D:/Project/ClaudeCode" }

function createHandler(): DoHandler {
  return new DoHandler([tier0PatternMatcher, tier1ActiveMatcher, tier2KeywordMatcher, tier3LlmMatcher])
}

describe("DoHandler", () => {
  test("matches Tier 0 typecheck pattern", async () => {
    const intent = await createHandler().handle("run typecheck please", ctx)

    expect(intent?.intent).toBe("typecheck")
    expect(intent?.tier).toBe("T0_pattern")
  })

  test("falls through Tier 0 and matches Tier 2 implement keywords", async () => {
    const intent = await createHandler().handle("add a new feature for parsing markdown", ctx)

    expect(intent?.intent).toContain("implement")
    expect(intent?.tier).toBe("T2_keyword")
  })

  test("returns null when no tier matches", async () => {
    const intent = await createHandler().handle("xyzzy quux", ctx)

    expect(intent).toBeNull()
  })
})
