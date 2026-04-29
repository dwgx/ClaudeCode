// @ts-nocheck

import { ClaudeCode } from "@dwgx/claudecode-core"
import { ReadTool } from "@dwgx/claudecode-core/tools"

const claudecode = ClaudeCode.make({})

claudecode.tool.add(ReadTool)

claudecode.tool.add({
  name: "bash",
  schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The command to run.",
      },
    },
    required: ["command"],
  },
  execute(input, ctx) {},
})

claudecode.auth.add({
  provider: "openai",
  type: "api",
  value: process.env.OPENAI_API_KEY,
})

claudecode.agent.add({
  name: "build",
  permissions: [],
  model: {
    id: "gpt-5-5",
    provider: "openai",
    variant: "xhigh",
  },
})

const sessionID = await claudecode.session.create({
  agent: "build",
})

claudecode.subscribe((event) => {
  console.log(event)
})

await claudecode.session.prompt({
  sessionID,
  text: "hey what is up",
})

await claudecode.session.prompt({
  sessionID,
  text: "what is up with this",
  files: [
    {
      mime: "image/png",
      uri: "data:image/png;base64,xxxx",
    },
  ],
})

await claudecode.session.wait()

console.log(await claudecode.session.messages(sessionID))
