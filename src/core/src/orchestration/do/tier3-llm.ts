import type { DoContext, DoIntent, TierMatcher } from "./types.ts"

export const tier3LlmMatcher: TierMatcher = {
  tier: "T3_llm",
  match(_input: string, _ctx: DoContext): DoIntent | null {
    throw new Error("Tier 3 LLM classifier not implemented in v0.1")
  },
}
