# Evidence contract — Lookout

Family envelope v1. Locators: requested URL, final URL, page/span order, and
raw-body excerpt spans (`start`/`end` offsets).
Route must state engine (`lookout-ts` until a Rust core ships).
Gaps: SSRF deny, robots deny, adapter failure.
No paid API key required for primary path.
No `evidence_first` tool.

## Research journey

`web_research` admits a non-empty query, searches, fetches each selected result
through the same SSRF-safe `web_fetch` path, and extracts citeable spans from
the retained page body. Each research page reports its requested `url`,
redirected `finalUrl`, HTTP/content metadata, truncation, fetch/extract status,
warnings, and spans with raw-body offsets. Top-level `evidence` repeats those
locators with stable `pageIndex` and `spanIndex` values so consumers can cite a
result without guessing which source or byte range produced it.

Research status is truthful: `ok` means every selected page produced
citeable, non-truncated evidence; `partial` means at least one page degraded
while another still produced evidence; `error` means no search result or no
page produced citeable evidence. Page-level warnings remain attached for
recovery and diagnosis, and a failed page does not discard evidence from
successful pages.

## Implemented family wire fields (v1)

Every tool result includes:

- `envelope_version: "1"`
- `status`, `tool`, `product`, `product_version`
- `route` as `{ engine, path? }`
- `warnings` and `gaps` arrays (may be empty)
- domain payload (often also as top-level twin/results/answer for compatibility)

Schema: `SylphxAI/skills` `schemas/instrument-evidence-envelope.schema.json`.
