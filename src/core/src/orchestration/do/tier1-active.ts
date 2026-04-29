import type { DoContext, DoIntent, TierMatcher } from "./types.ts"

export const tier1ActiveMatcher: TierMatcher = {
  tier: "T1_active",
  match(_input: string, _ctx: DoContext): DoIntent | null {
    return null
  },
}
