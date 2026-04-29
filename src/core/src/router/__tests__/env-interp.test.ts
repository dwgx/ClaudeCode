import { describe, expect, test } from "bun:test"
import { interpolate } from "../env-interp"

describe("router env interpolation", () => {
  test("substitutes bare variables", () => {
    expect(interpolate("$API_KEY", { API_KEY: "secret" })).toBe("secret")
  })

  test("substitutes braced variables with surrounding text", () => {
    expect(interpolate("Bearer ${TOKEN}", { TOKEN: "abc" })).toBe("Bearer abc")
  })

  test("leaves missing keys unchanged", () => {
    expect(interpolate("$NOPE", {})).toBe("$NOPE")
  })

  test("walks objects and arrays recursively while preserving primitives", () => {
    const result = interpolate(
      {
        url: "https://${HOST}/$PATH",
        headers: ["Bearer $TOKEN", 7, false],
        nested: { keep: null },
      },
      { HOST: "example.test", PATH: "v1", TOKEN: "tok" },
    )

    expect(result).toEqual({
      url: "https://example.test/v1",
      headers: ["Bearer tok", 7, false],
      nested: { keep: null },
    })
  })

  test("treats double dollars as escaped variables", () => {
    expect(interpolate("$$VAR", { VAR: "value" })).toBe("$VAR")
  })

  test("substitutes both forms in one string", () => {
    expect(interpolate("$A/${B}", { A: "one", B: "two" })).toBe("one/two")
  })
})
