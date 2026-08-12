# chase

Engineering skills for agentic development workflows, packaged as a Claude Code plugin marketplace.

## Install

```
/plugin marketplace add lchase/skills
/plugin install smart-review@chase
```

Then the plugin's slash commands are available (namespaced by plugin):

- `/smart-review:review` — auto (routes to min or max by size + sensitivity)
- `/smart-review:min` — fast single-pass review
- `/smart-review:max` — orchestrated ensemble review
- `/smart-review:pr <PR number or URL>` — reviews a GitHub PR and, after you confirm what to publish, posts the findings as PR comments
- `/smart-review:pr-comments <PR number or URL>` — triages a PR's existing unresolved review comments, fixes or explains each after your approval, replies, and resolves the thread

The `smart-review` skill also triggers automatically when you ask Claude to review a diff, PR, or branch — you don't have to invoke a command.

## Plugins

| Plugin | What it does |
|---|---|
| [`smart-review`](plugins/smart-review/) | Multi-lens code review: six lenses merged into one deduplicated, severity-ranked verdict. See its README for the design. |

## Skills
 
### smart-review
 
*An ensemble code review: several specialized lenses, one merged verdict — not another pile of comments.*
 
Most code review, human or AI, is one reviewer making a single pass and leaving a list of comments. This runs six specialized lenses instead — spec-conformance, correctness, security, performance, design, and tests — each in its own isolated context so their blind spots don't line up, then merges the results into one verdict: duplicates collapsed, findings that several lenses independently raise weighted up, conflicting advice reconciled, severity rolled up, structural problems first, nits capped. The merge is the point — an ensemble without it is just louder, and a longer checklist handed to one reviewer only dilutes its attention and repeats its own misses.
 
Two modes: a fast single pass (`min`) for tight loops, and an orchestrated ensemble (`max`) that fans the lenses out as parallel, optionally cross-model, subagents for pre-merge review. Plain `/smart-review:review` routes between them by change size and sensitivity.
 
```
/smart-review:review    # auto — routes to min or max
/smart-review:min       # fast single pass
/smart-review:max       # full ensemble, for pre-merge
/smart-review:pr <PR>   # reviews a GitHub PR, then posts confirmed findings as comments
/smart-review:pr-comments <PR>  # triages unresolved PR comments, fixes/replies/resolves after your approval
```
 
It also triggers on its own when you ask Claude to review a diff, PR, or branch. Design and internals: [`plugins/smart-review/`](plugins/smart-review/).

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
claude plugin validate ./plugins/smart-review
```
