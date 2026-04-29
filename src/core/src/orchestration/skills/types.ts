export interface Skill {
  name: string
  description: string
  user_invocable?: boolean
  auto_trigger?: string[]
  tools?: string[]
  body: string
  source: string
}
