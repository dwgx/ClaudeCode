# skill-repo-index

`skill-repo-index` is a built-in ClaudeCode skill plugin.
It answers “where is X?” questions with a lightweight repository index.
The skill checks `.claudecode/repo-index.json` before broad grep.
If the cache is missing or stale, it rebuilds the index.
## What It Does

It records repository-relative paths and file metadata.
It avoids reading every file body during indexing.
It uses exact, substring, and fuzzy path matching.
It falls back to grep when the cache misses.
It returns candidate paths for the next `Read` step.
## When Triggered

The skill is auto-triggered by location/search language.
Examples:
- `where is`
- `find`
- `locate`
- `哪个文件`
- `在哪`
It is useful before expensive broad searches in large repositories.
It does not replace reading the final matched file.
## How To Enable

With ClaudeCode v0.2 CLI:
```bash
claudecode plugin install ./plugins-builtin/skill-repo-index
```
Manual Anthropic-compatible install:
```bash
ln -s "$PWD/plugins-builtin/skill-repo-index" ~/.claude/plugins/skill-repo-index
```
## Skill File

See `skills/repo-index/SKILL.md`.
## License

MIT © 2026 dwgx
