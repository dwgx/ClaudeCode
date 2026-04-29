import { describe, expect, test } from "bun:test"
import {
  basenameOf,
  extensionOf,
  isTestPath,
  isNoisePath,
  isSourceFile,
  isDocFile,
  rankMultiplier,
} from "../index.ts"

describe("path helpers", () => {
  test("basenameOf strips path", () => {
    expect(basenameOf("a/b/c.ts")).toBe("c.ts")
    expect(basenameOf("a\\b\\c.ts")).toBe("c.ts")
    expect(basenameOf("c.ts")).toBe("c.ts")
    expect(basenameOf("a/b/")).toBe("b")
  })

  test("extensionOf detects compound extensions", () => {
    expect(extensionOf("foo.ts")).toBe("ts")
    expect(extensionOf("foo.gen.ts")).toBe("gen.ts")
    expect(extensionOf("foo.d.ts")).toBe("d.ts")
    expect(extensionOf("README")).toBe("")
  })

  test("isTestPath matches common test conventions", () => {
    expect(isTestPath("src/__tests__/foo.test.ts")).toBe(true)
    expect(isTestPath("src/foo.spec.ts")).toBe(true)
    expect(isTestPath("src/foo.ts")).toBe(false)
    expect(isTestPath("test/fixtures/data.json")).toBe(true)
  })

  test("isNoisePath catches build artifacts", () => {
    expect(isNoisePath("node_modules/foo/index.js")).toBe(true)
    expect(isNoisePath("dist/bundle.js")).toBe(true)
    expect(isNoisePath("src/foo.ts")).toBe(false)
    expect(isNoisePath("bun.lock")).toBe(true)
  })

  test("isSourceFile / isDocFile classify correctly", () => {
    expect(isSourceFile("src/foo.ts")).toBe(true)
    expect(isSourceFile("src/foo.go")).toBe(true)
    expect(isSourceFile("README.md")).toBe(false)
    expect(isDocFile("README.md")).toBe(true)
    expect(isDocFile("src/foo.ts")).toBe(false)
  })
})

describe("rankMultiplier", () => {
  test("exact basename match dominates", () => {
    const a = rankMultiplier({ path: "src/loader.ts", query: "loader.ts" })
    const b = rankMultiplier({ path: "src/foo/loader-test.ts", query: "loader.ts" })
    expect(a.multiplier).toBeGreaterThan(b.multiplier)
    expect(a.hits).toContain("basename:exact")
  })

  test("prefix match beats substring", () => {
    const a = rankMultiplier({ path: "src/foobar.ts", query: "foo" })
    const b = rankMultiplier({ path: "src/x/yfoo.ts", query: "foo" })
    expect(a.multiplier).toBeGreaterThan(b.multiplier)
  })

  test("source file beats noise file", () => {
    const a = rankMultiplier({ path: "src/util.ts", query: "util" })
    const b = rankMultiplier({ path: "node_modules/util/index.js", query: "util" })
    expect(a.multiplier).toBeGreaterThan(b.multiplier)
  })

  test("test path demoted unless query mentions test", () => {
    const a = rankMultiplier({ path: "src/foo.ts", query: "foo" })
    const b = rankMultiplier({ path: "src/__tests__/foo.test.ts", query: "foo" })
    expect(a.multiplier).toBeGreaterThan(b.multiplier)

    // when query says "test", demotion lifts
    const c = rankMultiplier({ path: "src/foo.ts", query: "foo test" })
    const d = rankMultiplier({ path: "src/__tests__/foo.test.ts", query: "foo test" })
    expect(d.multiplier).toBeGreaterThanOrEqual(c.multiplier * 0.95) // d not penalized
  })

  test("frecency boosts within bounds", () => {
    const cold = rankMultiplier({ path: "src/foo.ts", query: "foo" })
    const hot = rankMultiplier({ path: "src/foo.ts", query: "foo", frecency: 0.8 })
    expect(hot.multiplier).toBeGreaterThan(cold.multiplier)
    expect(hot.multiplier).toBeLessThanOrEqual(4)
  })
})
