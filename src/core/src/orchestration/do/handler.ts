import type { DoContext, DoIntent, TierMatcher } from "./types.ts"

export class DoHandler {
  constructor(private matchers: TierMatcher[]) {}

  async handle(input: string, ctx: DoContext): Promise<DoIntent | null> {
    for (const matcher of this.matchers) {
      const intent = await matcher.match(input, ctx)
      if (intent) return intent
    }
    return null
  }
}
