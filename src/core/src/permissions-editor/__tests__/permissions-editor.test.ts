import { describe, expect, test } from "bun:test"
import { parse } from "jsonc-parser"
import { clearPermission, readPermissions, setPermission } from "../index.ts"

describe("permissions-editor", () => {
  test("readPermissions returns empty object for empty source", () => {
    expect(readPermissions("")).toEqual({})
  })

  test("readPermissions reads shorthand actions", () => {
    expect(readPermissions('{"permission":{"bash":"deny","read":"allow"}}')).toEqual({
      bash: "deny",
      read: "allow",
    })
  })

  test("readPermissions maps object values to object", () => {
    expect(readPermissions('{"permission":{"bash":{"git push":"deny","*":"allow"}}}')).toEqual({
      bash: "object",
    })
  })

  test("setPermission adds a shorthand action", () => {
    const result = setPermission("{}", "bash", "ask")
    expect(parse(result).permission.bash).toBe("ask")
  })

  test("setPermission preserves existing comments", () => {
    const src = `{
  // user notes
  "permission": {
    "read": "allow"
  }
}`
    const result = setPermission(src, "bash", "deny")
    expect(result).toContain("// user notes")
    expect(parse(result)).toEqual({
      permission: {
        read: "allow",
        bash: "deny",
      },
    })
  })

  test("clearPermission removes a key", () => {
    const parsed = parse(clearPermission('{"permission":{"bash":"deny"}}', "bash"))
    expect(parsed.permission ?? {}).toEqual({})
  })
})
