export type DoTier = "T0_pattern" | "T1_active" | "T2_keyword" | "T3_llm"

export interface DoIntent {
  tier: DoTier
  confidence: number
  intent: string
  scope?: string[]
  payload: { rawInput: string; matched?: string }
}

export interface DoContext {
  cwd: string
  activeCampaign?: string
  activeFleet?: string
  budgetUSD?: number
}

export interface TierMatcher {
  tier: DoTier
  match(input: string, ctx: DoContext): Promise<DoIntent | null> | DoIntent | null
}
