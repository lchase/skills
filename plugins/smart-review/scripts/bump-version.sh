#!/usr/bin/env bash
# Set the version across every manifest at once.
# Usage: scripts/bump-version.sh 0.5.0

set -euo pipefail
cd "$(dirname "$0")/.."

new="${1:-}"
if [[ ! "$new" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "usage: $0 <major.minor.patch>" >&2; exit 1
fi

files=(
  .claude-plugin/plugin.json
  .cursor-plugin/plugin.json
  .codex-plugin/plugin.json
  ../../gemini-extension.json
)

for f in "${files[@]}"; do
  python3 - "$f" "$new" <<'PY'
import json, sys
path, new = sys.argv[1], sys.argv[2]
d = json.load(open(path))
d["version"] = new
json.dump(d, open(path, "w"), indent=2)
open(path, "a").write("\n")
PY
  echo "set $f -> $new"
done

./scripts/validate-adapters.sh
