import type { TransformerHooks, TransformerSpec } from "./types"

export const noopHooks: TransformerHooks = {
  transformRequestIn: (req) => req,
  transformRequestOut: (req) => req,
  transformResponseIn: (res) => res,
  transformResponseOut: (res) => res,
}

export function createNoopTransformer(name: string): TransformerSpec {
  return { name, hooks: noopHooks }
}

export function withAttribution(spec: TransformerSpec, attribution: string): TransformerSpec {
  return { ...spec, config: { ...(spec.config ?? {}), attribution } }
}
