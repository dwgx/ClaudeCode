export interface SubagentTag {
  providerID: string
  modelID: string
}

const TAG_RE = /<CCR-SUBAGENT-MODEL>([^<,]+),([^<]+)<\/CCR-SUBAGENT-MODEL>/

export function parseSubagentTag(input: string): SubagentTag | undefined {
  const match = TAG_RE.exec(input)
  if (!match) return
  const providerID = match[1].trim()
  const modelID = match[2].trim()
  if (!providerID || !modelID) return
  return { providerID, modelID }
}

export function findSubagentTag(messages: Array<{ content: unknown }>): SubagentTag | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    const text = stringifyContent(msg.content)
    const tag = parseSubagentTag(text)
    if (tag) return tag
  }
  return
}

function stringifyContent(content: unknown): string {
  if (typeof content === "string") return content
  if (!content) return ""
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part
        if (part && typeof part === "object" && "text" in part && typeof (part as { text: unknown }).text === "string") {
          return (part as { text: string }).text
        }
        return ""
      })
      .join(" ")
  }
  if (typeof content === "object" && "text" in content && typeof (content as { text: unknown }).text === "string") {
    return (content as { text: string }).text
  }
  return ""
}
