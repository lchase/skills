#!/usr/bin/env bash
# Checks every per-harness manifest: valid JSON, matching version, resolvable paths.
# Run before pushing (no CI). Requires: python3.

set -euo pipefail
cd "$(dirname "$0")/.."

manifests=(
  .claude-plugin/plugin.json
  .cursor-plugin/plugin.json
  .codex-plugin/plugin.json
  ../../gemini-extension.json
)

fail=0
ref_version=""

for m in "${manifests[@]}"; do
  if [ ! -f "$m" ]; then
    echo "MISSING  $m"; fail=1; continue
  fi
  if ! python3 -c "import json,sys; json.load(open('$m'))" 2>/dev/null; then
    echo "BAD JSON $m"; fail=1; continue
  fi
  v=$(python3 -c "import json; print(json.load(open('$m')).get('version',''))")
  if [ -z "$ref_version" ]; then
    ref_version="$v"
  elif [ "$v" != "$ref_version" ]; then
    echo "VERSION  $m has '$v', expected '$ref_version'"; fail=1
  fi
  # skills path, if declared, must resolve
  s=$(python3 -c "import json; print(json.load(open('$m')).get('skills',''))")
  if [ -n "$s" ] && [ ! -d "$s" ]; then
    echo "PATH     $m skills='$s' does not resolve"; fail=1
  fi
  echo "OK       $m (v$v)"
done

# marketplace entry version should track plugin.json (entries carry no version today;
# this stays a no-op unless one is added)
mkt=$(python3 -c "
import json
d = json.load(open('../../.claude-plugin/marketplace.json'))
e = next((p for p in d['plugins'] if p['name'] == 'smart-review'), {})
print(e.get('version',''))
" 2>/dev/null || echo "")
if [ -n "$mkt" ] && [ "$mkt" != "$ref_version" ]; then
  echo "VERSION  marketplace.json smart-review entry has '$mkt', expected '$ref_version'"; fail=1
fi

# every reviewer agent must name its source lens checklist
for a in agents/*-reviewer.md; do
  lens=$(basename "$a" -reviewer.md)
  if ! grep -q "references/lenses/$lens.md" "$a"; then
    echo "SYNC     $a does not reference references/lenses/$lens.md"; fail=1
  fi
done

if [ "$fail" -eq 0 ]; then
  echo "all adapters consistent"
else
  echo "adapter validation FAILED" >&2
fi
exit $fail
