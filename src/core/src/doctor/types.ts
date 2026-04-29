export type CheckStatus = "ok" | "warn" | "fail"

export interface CheckResult {
  name: string
  status: CheckStatus
  detail?: string
}

export interface CheckContext {
  home: string
  cwd: string
  // 可注入 mock 用于测试
  fs?: {
    statRoot(path: string): Promise<{ exists: boolean; sizeBytes?: number; isDir?: boolean }>
    listDir(path: string): Promise<string[]>
  }
  exec?: {
    which(name: string): Promise<string | undefined>
  }
}
