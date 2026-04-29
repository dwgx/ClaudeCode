import { describe, expect, test } from "bun:test"
import { evaluateTrust } from "../index.ts"

describe("evaluateTrust", () => {
  test("first-party @dwgx scope is trusted", () => {
    const v = evaluateTrust("@dwgx/claudecode-some-plugin")
    expect(v.trusted).toBe(true)
    expect(v.level).toBe("first-party")
  })

  test("@anthropic-ai upstream is trusted", () => {
    const v = evaluateTrust("@anthropic-ai/sdk")
    expect(v.trusted).toBe(true)
    expect(v.level).toBe("official-upstream")
  })

  test("@opencode-ai upstream is trusted", () => {
    const v = evaluateTrust("@opencode-ai/plugin")
    expect(v.trusted).toBe(true)
  })

  test("relative path is treated as local user code", () => {
    expect(evaluateTrust("./my-plugin").trusted).toBe(true)
    expect(evaluateTrust("../local-plugin").trusted).toBe(true)
  })

  test("absolute path is local", () => {
    expect(evaluateTrust("/abs/path/to/plugin").trusted).toBe(true)
    expect(evaluateTrust("C:\\abs\\path").trusted).toBe(true)
    expect(evaluateTrust("file:///abs/path").trusted).toBe(true)
  })

  test("unknown npm names are third-party", () => {
    const v = evaluateTrust("totally-random-plugin")
    expect(v.trusted).toBe(false)
    expect(v.level).toBe("third-party")
  })

  test("empty spec is rejected", () => {
    const v = evaluateTrust("   ")
    expect(v.trusted).toBe(false)
  })
})
