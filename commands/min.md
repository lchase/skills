---
description: Fast single-pass code review — all lenses in one context, no subagents. For tight loops and small diffs.
argument-hint: "[base ref] [spec path]"
---

Use the **smart-review** skill in **min** mode on `$ARGUMENTS`, regardless of size/sensitivity heuristics.

Walk all six lenses in one context, merge per the skill's merge contract, and emit the report. If while scoping you find the diff touches a sensitive path (auth, crypto, raw SQL, deserialization, payments, PII), say so and recommend `/smart-review:max` before merge.
