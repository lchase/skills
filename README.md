# chase

Engineering skills for agentic development workflows, packaged as a Claude Code plugin marketplace.

## Install

```
/plugin marketplace add lchase/skills
/plugin install code-review@chase
```

Then the plugin's slash commands are available (namespaced by plugin):

- `/code-review:review` — auto (routes to min or max by size + sensitivity)
- `/code-review:min` — fast single-pass review
- `/code-review:max` — orchestrated ensemble review

The `code-review` skill also triggers automatically when you ask Claude to review a diff, PR, or branch — you don't have to invoke a command.

## Plugins

| Plugin | What it does |
|---|---|
| [`code-review`](plugins/code-review/) | Multi-lens code review: six lenses merged into one deduplicated, severity-ranked verdict. See its README for the design. |

## Repo layout

```
.claude-plugin/marketplace.json   # the marketplace catalog (name: "chase")
plugins/<name>/                    # one directory per plugin
  .claude-plugin/plugin.json       # plugin manifest
  skills/<name>/SKILL.md           # the skill(s)
  agents/                          # registered subagents
  commands/                        # slash commands
evals/<name>/                      # dev-only eval kits (not shipped to installers)
```

## Releasing

Pull changes with `/plugin marketplace update`. To pin releases instead, set `version` in a plugin's `plugin.json` and bump it per release.

Validate before pushing:

```
claude plugin validate .
claude plugin validate ./plugins/code-review
```
