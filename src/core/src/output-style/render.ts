import type { OutputStyle } from "./types.ts"

export function formatOutputStyleForPrompt(style: OutputStyle | undefined): string {
  if (!style) return ""
  return ["<output_style name=\"" + style.name + "\">", style.body, "</output_style>"].join("\n")
}
