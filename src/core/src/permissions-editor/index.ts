import { applyEdits, modify, parse } from "jsonc-parser"

export const PERMISSION_KEYS = [
  "read",
  "edit",
  "glob",
  "grep",
  "list",
  "bash",
  "task",
  "external_directory",
  "todowrite",
  "question",
  "webfetch",
  "websearch",
  "codesearch",
  "lsp",
  "doom_loop",
  "skill",
] as const

export type PermissionKey = (typeof PERMISSION_KEYS)[number]
export type Action = "ask" | "allow" | "deny"

export function readPermissions(src: string): Record<string, Action | "object" | undefined> {
  const root = parse(src) as { permission?: unknown } | undefined
  const out: Record<string, Action | "object" | undefined> = {}
  const perm = root?.permission
  if (!perm || typeof perm !== "object") return out
  for (const [key, value] of Object.entries(perm as Record<string, unknown>)) {
    if (value === "ask" || value === "allow" || value === "deny") out[key] = value
    else if (value && typeof value === "object") out[key] = "object"
  }
  return out
}

export function setPermission(src: string, key: string, action: Action): string {
  const edits = modify(src, ["permission", key], action, {
    formattingOptions: { insertSpaces: true, tabSize: 2 },
  })
  return applyEdits(src, edits)
}

export function clearPermission(src: string, key: string): string {
  const edits = modify(src, ["permission", key], undefined, {
    formattingOptions: { insertSpaces: true, tabSize: 2 },
  })
  return applyEdits(src, edits)
}

export * as PermissionsEditor from "."
