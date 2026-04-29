# skill-confidence-check

`skill-confidence-check` is a built-in ClaudeCode skill plugin.
It runs before the agent claims a task is complete.
The skill forces every completion claim to receive a 0-1 confidence score.
Low-confidence claims are sent back through a verification loop.
## What It Does

It turns broad statements like “done” into small auditable claims.
Each claim gets one evidence sentence.
Each claim gets a confidence score.
Claims below `0.70` block the final ready state.
High-risk work should normally reach `0.90` for core claims.
## When Triggered

The skill is auto-triggered by completion language.
Examples:
- `搞定`
- `完成`
- `ready to ship`
- `done`
It is not meant to run at task start.
It is meant to run at the final gate.
## How To Enable

With ClaudeCode v0.2 CLI:
```bash
claudecode plugin install ./plugins-builtin/skill-confidence-check
```
Manual Anthropic-compatible install:
```bash
ln -s "$PWD/plugins-builtin/skill-confidence-check" ~/.claude/plugins/skill-confidence-check
```
## Skill File

See `skills/confidence-check/SKILL.md`.
## License

MIT © 2026 dwgx
