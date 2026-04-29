import path from "path"
import fs from "fs/promises"
import os from "os"
import { Context, Effect, Layer } from "effect"
import { Flock } from "./util/flock"

const app = "claudecode"

// 扁平布局：单根 ~/.claudecode/{config,data,cache,state,log,bin}。跨平台一致，
// 用户期望一个可见的总目录，而不是 xdg 风格的四散路径。
// 高级用户可用 CLAUDECODE_HOME 覆盖根目录。
const root = process.env.CLAUDECODE_HOME ?? path.join(os.homedir(), `.${app}`)

const data = path.join(root, "data")
const cache = path.join(root, "cache")
const config = path.join(root, "config")
const state = path.join(root, "state")

const paths = {
  get home() {
    return process.env.CLAUDECODE_TEST_HOME ?? os.homedir()
  },
  data,
  bin: path.join(root, "bin"),
  log: path.join(root, "log"),
  cache,
  config,
  state,
  root,
}

export const Path = paths

Flock.setGlobal({ state })

await Promise.all([
  fs.mkdir(Path.data, { recursive: true }),
  fs.mkdir(Path.config, { recursive: true }),
  fs.mkdir(Path.state, { recursive: true }),
  fs.mkdir(Path.log, { recursive: true }),
  fs.mkdir(Path.bin, { recursive: true }),
])

export class Service extends Context.Service<Service, Interface>()("@claudecode/Global") {}

export interface Interface {
  readonly home: string
  readonly data: string
  readonly cache: string
  readonly config: string
  readonly state: string
  readonly bin: string
  readonly log: string
}

export const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    return Service.of({
      home: Path.home,
      data: Path.data,
      cache: Path.cache,
      config: Path.config,
      state: Path.state,
      bin: Path.bin,
      log: Path.log,
    })
  }),
)

export * as Global from "./global"
