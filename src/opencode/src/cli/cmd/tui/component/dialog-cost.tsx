import type { AssistantMessage, Message } from "@dwgx/claudecode-sdk/v2"
import { useDialog } from "@tui/ui/dialog"
import { DialogSelect } from "@tui/ui/dialog-select"
import { useRoute } from "@tui/context/route"
import { useSync } from "@tui/context/sync"
import { Locale } from "@/util/locale"
import { createMemo } from "solid-js"

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

type SessionTotals = {
  sessionID: string
  title: string
  cost: number
  tokensIn: number
  tokensOut: number
  models: Set<string>
}

type ModelTotals = {
  key: string
  cost: number
  tokensIn: number
  tokensOut: number
}

function aggregate(messages: Message[]): SessionTotals {
  const totals: SessionTotals = {
    sessionID: "",
    title: "",
    cost: 0,
    tokensIn: 0,
    tokensOut: 0,
    models: new Set(),
  }
  for (const m of messages) {
    if (m.role !== "assistant") continue
    const a = m as AssistantMessage
    totals.cost += a.cost ?? 0
    totals.tokensIn += a.tokens.input + a.tokens.cache.read + a.tokens.cache.write
    totals.tokensOut += a.tokens.output + a.tokens.reasoning
    totals.models.add(`${a.providerID}/${a.modelID}`)
  }
  return totals
}

function aggregateByModel(messages: Message[], out: Map<string, ModelTotals>): void {
  for (const m of messages) {
    if (m.role !== "assistant") continue
    const a = m as AssistantMessage
    const key = `${a.providerID}/${a.modelID}`
    let bucket = out.get(key)
    if (!bucket) {
      bucket = { key, cost: 0, tokensIn: 0, tokensOut: 0 }
      out.set(key, bucket)
    }
    bucket.cost += a.cost ?? 0
    bucket.tokensIn += a.tokens.input + a.tokens.cache.read + a.tokens.cache.write
    bucket.tokensOut += a.tokens.output + a.tokens.reasoning
  }
}

export function DialogCost() {
  const dialog = useDialog()
  const route = useRoute()
  const sync = useSync()

  const aggregates = createMemo(() => {
    const perSession: SessionTotals[] = []
    const perModel = new Map<string, ModelTotals>()
    let grandCost = 0
    let grandIn = 0
    let grandOut = 0
    for (const session of sync.data.session) {
      const messages = sync.data.message[session.id]
      if (!messages || messages.length === 0) continue
      const t = aggregate(messages)
      if (t.cost === 0 && t.tokensIn === 0 && t.tokensOut === 0) continue
      t.sessionID = session.id
      t.title = session.title || "(untitled)"
      perSession.push(t)
      aggregateByModel(messages, perModel)
      grandCost += t.cost
      grandIn += t.tokensIn
      grandOut += t.tokensOut
    }
    perSession.sort((a, b) => b.cost - a.cost)
    const models = [...perModel.values()].sort((a, b) => b.cost - a.cost)
    return { perSession, models, grandCost, grandIn, grandOut }
  })

  const currentSessionID = createMemo(() => (route.data.type === "session" ? route.data.sessionID : undefined))

  const options = createMemo(() => {
    const a = aggregates()
    const items: Array<{
      title: string
      value: string
      description?: string
      category?: string
      disabled?: boolean
    }> = []

    items.push({
      title: `Total: ${money.format(a.grandCost)}  ·  in ${Locale.number(a.grandIn)}  ·  out ${Locale.number(a.grandOut)}  ·  ${a.perSession.length} sessions`,
      value: "__total",
      category: "Summary",
      disabled: true,
    })

    for (const m of a.models) {
      items.push({
        title: `${m.key}`,
        value: `model:${m.key}`,
        description: `${money.format(m.cost)} · in ${Locale.number(m.tokensIn)} · out ${Locale.number(m.tokensOut)}`,
        category: "Per model",
        disabled: true,
      })
    }

    if (a.perSession.length === 0) {
      items.push({
        title: "No usage recorded yet",
        value: "__empty",
        category: "Sessions",
        disabled: true,
      })
    } else {
      for (const s of a.perSession) {
        const isCurrent = s.sessionID === currentSessionID()
        items.push({
          title: `${isCurrent ? "→ " : "  "}${Locale.truncate(s.title, 50)}`,
          value: `session:${s.sessionID}`,
          description: `${money.format(s.cost)} · in ${Locale.number(s.tokensIn)} · out ${Locale.number(s.tokensOut)}`,
          category: "Sessions",
        })
      }
    }

    return items
  })

  return (
    <DialogSelect
      title="Cost & token usage"
      options={options()}
      onSelect={(option) => {
        const v = String(option.value)
        if (v.startsWith("session:")) {
          route.navigate({ type: "session", sessionID: v.slice("session:".length) })
        }
        dialog.clear()
      }}
    />
  )
}
