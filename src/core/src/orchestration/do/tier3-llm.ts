import type { DoContext, DoIntent, TierMatcher } from "./types.ts"

// v0.1 stub: returning null lets the handler fall through cleanly. v0.2 will
// invoke a small classifier model that produces SCOPE/COMPLEXITY/INTENT.
export const tier3LlmMatcher: TierMatcher = {
  tier: "T3_llm",
  match(_input: string, _ctx: DoContext): DoIntent | null {
    return null
  },
}
