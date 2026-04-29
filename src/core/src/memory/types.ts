// 与 Claude Code auto-memory 同型：~/.claudecode/data/memory/MEMORY.md (索引)
// + 各 memory 文件（frontmatter + body）

export type MemoryType = "user" | "feedback" | "project" | "reference"

export interface MemoryEntry {
  name: string
  description: string
  type: MemoryType
  body: string
  source: string  // 绝对路径
  originSessionId?: string
}

export interface MemoryIndex {
  entries: MemoryEntry[]
}
