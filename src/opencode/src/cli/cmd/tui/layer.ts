import { Layer } from "effect"
import { TuiConfig } from "./config/tui"
import { Npm } from "@dwgx/claudecode-core/npm"
import { Observability } from "@dwgx/claudecode-core/effect/observability"

export const CliLayer = Observability.layer.pipe(Layer.merge(TuiConfig.layer), Layer.provide(Npm.defaultLayer))
