import { Flag } from "@dwgx/claudecode-core/flag/flag"
import { InstallationChannel, InstallationVersion } from "@dwgx/claudecode-core/installation/version"

export type Backend = "effect-httpapi" | "hono"

export type Selection = {
  backend: Backend
  reason: "env" | "stable" | "explicit"
}

export type Attributes = ReturnType<typeof attributes>

export function select(): Selection {
  if (Flag.CLAUDECODE_EXPERIMENTAL_HTTPAPI) return { backend: "effect-httpapi", reason: "env" }
  return { backend: "hono", reason: "stable" }
}

export function attributes(selection: Selection): Record<string, string> {
  return {
    "claudecode.server.backend": selection.backend,
    "claudecode.server.backend.reason": selection.reason,
    "claudecode.installation.channel": InstallationChannel,
    "claudecode.installation.version": InstallationVersion,
  }
}

export function force(selection: Selection, backend: Backend): Selection {
  return {
    backend,
    reason: selection.backend === backend ? selection.reason : "explicit",
  }
}
