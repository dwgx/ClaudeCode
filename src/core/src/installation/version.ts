declare global {
  const CLAUDECODE_VERSION: string
  const CLAUDECODE_CHANNEL: string
}

export const InstallationVersion = typeof CLAUDECODE_VERSION === "string" ? CLAUDECODE_VERSION : "local"
export const InstallationChannel = typeof CLAUDECODE_CHANNEL === "string" ? CLAUDECODE_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
