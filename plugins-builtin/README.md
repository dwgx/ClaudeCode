# ClaudeCode Builtin Plugins

`plugins-builtin/` is the built-in plugin library shipped with ClaudeCode.
It contains small, focused plugins that can be loaded by ClaudeCode itself and
projected into the Anthropic Claude Code plugin layout.
The initial library starts with three skill-only plugins:
- `skill-confidence-check`
- `skill-self-check`
- `skill-repo-index`
Each child directory is an independent plugin.
You can install one plugin without installing the whole library.
## Compatibility

ClaudeCode keeps a dual-protocol plugin strategy.
The native direction follows the ClaudeCode/opencode runtime model.
The compatibility direction follows Anthropic Claude Code resources:
- `.claude-plugin/plugin.json`
- `skills/<name>/SKILL.md`
- optional `agents/`
- optional `commands/`
- optional `hooks/`
These built-in plugins use the Anthropic-compatible projection first because
skills are the most portable resource class.
ClaudeCode can read the same `SKILL.md` files through its adapter.
Anthropic Claude Code can read the same plugin directory through
`.claude-plugin/plugin.json`.
The compatibility policy is documented in `docs/decisions/0008-plugin-protocol-compat.md`.
## Layout

```text
plugins-builtin/
├── skill-confidence-check/
├── skill-self-check/
└── skill-repo-index/
```
Every plugin has:
- `.claude-plugin/plugin.json`
- `skills/<skill-name>/SKILL.md`
- `ATTRIBUTION.md`
- `README.md`
The manifest points at the skill file through `components.skills`.
The skill file uses YAML frontmatter plus a Markdown body.
The attribution file records concept sources and license notes.
## Install With ClaudeCode CLI

For ClaudeCode v0.2 CLI:
```bash
claudecode plugin install ./plugins-builtin/skill-confidence-check
claudecode plugin install ./plugins-builtin/skill-self-check
claudecode plugin install ./plugins-builtin/skill-repo-index
```
The CLI should install only the selected plugin directory.
It should not implicitly install dependencies for these skill-only plugins.
## Manual Install

You can also symlink a plugin into the Anthropic-compatible plugin location.
On Unix-like systems:
```bash
ln -s "$PWD/plugins-builtin/skill-confidence-check" ~/.claude/plugins/skill-confidence-check
```
On Windows PowerShell:
```powershell
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\plugins\skill-confidence-check" -Target "$PWD\plugins-builtin\skill-confidence-check"
```
Repeat the command for each plugin you want to enable.
## Built-In Plugin Goals

These plugins are intentionally boring.
They should be easy to inspect, copy, disable, and replace.
They should not start shells, mutate global state, or hide long-running hooks.
They should provide reusable operating protocols that improve engineering
quality at the moment they are needed.
## Current Plugins

`skill-confidence-check` verifies completion claims before the agent says a task
is done.
`skill-self-check` validates multi-step work against success criteria and real
evidence.
`skill-repo-index` builds or queries a lightweight repository path index before
falling back to grep.
## License

The built-in plugin library is MIT licensed.
Each plugin includes its own `ATTRIBUTION.md`.
Those files list upstream inspirations and confirm that the skill text is an
independent rewrite, not copied source.
