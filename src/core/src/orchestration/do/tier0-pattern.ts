import type { DoContext, DoIntent, TierMatcher } from "./types.ts"

interface PatternRule {
  intent: string
  pattern: RegExp
}

const TIER0_PATTERNS: PatternRule[] = [
  { intent: "typecheck", pattern: /\b(typecheck|type check|tsc|tsgo)\b/i },
  { intent: "build", pattern: /\b(build|compile|bundle)\b/i },
  { intent: "test", pattern: /\b(test|tests|unit test|bun test)\b/i },
  { intent: "status", pattern: /\b(status|progress|state|where are we|what'?s changed)\b/i },
  { intent: "typo", pattern: /\b(typo|spelling|misspell|copy edit|错别字)\b/i },
  { intent: "rename", pattern: /\b(rename|renaming|move this|change name)\b/i },
  { intent: "commit", pattern: /\b(commit|提交)\b/i },
  { intent: "rollback", pattern: /\b(rollback|revert|undo|roll back|回滚)\b/i },
  { intent: "continue", pattern: /\b(continue|resume|pick up|继续)\b/i },
  { intent: "explain", pattern: /\b(explain|describe|walk me through|解释|说明)\b/i },
]

function detectScope(input: string): string[] | undefined {
  const matches = input.match(/(?:[A-Za-z]:[\\/]|\.{1,2}[\\/]|[\w.-]+[\\/])[\w./\\-]+/g)
  return matches?.length ? [...new Set(matches)] : undefined
}

export const tier0PatternMatcher: TierMatcher = {
  tier: "T0_pattern",
  match(input: string, _ctx: DoContext): DoIntent | null {
    for (const rule of TIER0_PATTERNS) {
      const matched = input.match(rule.pattern)?.[0]
      if (!matched) continue
      return {
        tier: "T0_pattern",
        confidence: 0.95,
        intent: rule.intent,
        scope: detectScope(input),
        payload: { rawInput: input, matched },
      }
    }
    return null
  },
}
