# skill-self-check

`skill-self-check` is a built-in ClaudeCode skill plugin.
It runs at the end of multi-step implementation or repair tasks.
The skill checks original success criteria against real evidence.
It blocks final PASS when verification is missing.
## What It Does

It reconstructs the task's success criteria.
It maps each criterion to a verification method.
It checks files, tests, grep results, build output, or runtime behavior.
It records PASS, FAIL, BLOCKED, or NOT_RUN per criterion.
The whole task only passes when every criterion passes.
## When Triggered

The skill is auto-triggered near task completion.
Examples:
- `完成`
- `收尾`
- `final`
- `ship`
It is useful after edits, migrations, packaging, and reports.
It is not a replacement for planning at task start.
## How To Enable

With ClaudeCode v0.2 CLI:
```bash
claudecode plugin install ./plugins-builtin/skill-self-check
```
Manual Anthropic-compatible install:
```bash
ln -s "$PWD/plugins-builtin/skill-self-check" ~/.claude/plugins/skill-self-check
```
## Skill File

See `skills/self-check/SKILL.md`.
## License

MIT © 2026 dwgx
