import { readFileSync } from "node:fs"
import type { DoContext, DoIntent, TierMatcher } from "./types.ts"

interface KeywordRule {
  keyword: string
  intent: string
}

const KEYWORDS = JSON.parse(
  readFileSync(new URL("./tier2-keywords.json", import.meta.url), "utf8"),
) as KeywordRule[]

function tokenize(input: string): Set<string> {
  return new Set(input.toLowerCase().match(/[\p{L}\p{N}_+#.-]+/gu) ?? [])
}

function detectScope(input: string): string[] | undefined {
  const matches = input.match(/(?:[A-Za-z]:[\\/]|\.{1,2}[\\/]|[\w.-]+[\\/])[\w./\\-]+/g)
  return matches?.length ? [...new Set(matches)] : undefined
}

export const tier2KeywordMatcher: TierMatcher = {
  tier: "T2_keyword",
  match(input: string, _ctx: DoContext): DoIntent | null {
    const tokens = tokenize(input)
    const raw = input.toLowerCase()
    const hits = KEYWORDS.filter((rule) => {
      const keyword = rule.keyword.toLowerCase()
      return keyword.includes(" ") ? raw.includes(keyword) : tokens.has(keyword)
    })

    if (hits.length === 0) return null

    const intents = [...new Set(hits.map((hit) => hit.intent))]
    const singleIntent = intents.length === 1

    return {
      tier: "T2_keyword",
      confidence: singleIntent ? Math.min(0.9, 0.7 + (hits.length - 1) * 0.03) : 0.4,
      intent: singleIntent ? intents[0] : "ambiguous",
      scope: detectScope(input),
      payload: {
        rawInput: input,
        matched: hits.map((hit) => `${hit.keyword}:${hit.intent}`).join(","),
      },
    }
  },
}
