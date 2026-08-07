# Evidence contract — Lookout

Family envelope v1. Locators: URL, rank, excerpt spans.
Route must state engine (`lookout-ts` until a Rust core ships).
Gaps: SSRF deny, robots deny, adapter failure.
No paid API key required for primary path.
No `evidence_first` tool.

## Implemented family wire fields (v1)

Every tool result includes:

- `envelope_version: "1"`
- `status`, `tool`, `product`, `product_version`
- `route` as `{ engine, path? }`
- `warnings` and `gaps` arrays (may be empty)
- domain payload (often also as top-level twin/results/answer for compatibility)

Schema: `SylphxAI/skills` `schemas/instrument-evidence-envelope.schema.json`.
