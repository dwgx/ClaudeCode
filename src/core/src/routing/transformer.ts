import type { TransformContext, Transformer } from "./types.ts"

export class TransformerRegistry {
  private map = new Map<string, Transformer>()

  register(t: Transformer): void {
    this.map.set(t.name, t)
  }

  get(name: string): Transformer | undefined {
    return this.map.get(name)
  }

  list(): string[] {
    return [...this.map.keys()]
  }
}

export async function applyTransformerChain<T>(
  value: T,
  chain: Transformer[],
  hook: keyof Pick<
    Transformer,
    "transformRequestIn" | "transformRequestOut" | "transformResponseIn" | "transformResponseOut"
  >,
  ctx: TransformContext,
): Promise<T> {
  let v = value
  for (const t of chain) {
    const fn = t[hook]
    if (fn) v = await (fn as (value: T, ctx: TransformContext) => Promise<T> | T)(v, ctx)
  }
  return v
}
