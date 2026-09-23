# Capabilities — Lookout

## Surfaces

| Surface | Identity |
| --- | --- |
| MCP | `io.github.SylphxAI/lookout` over stdio, `npx -y @sylphx/lookout` |
| CLI | `lookout` |
| SDK | `@sylphx/lookout` |

## Owned capabilities

| Capability | Tool | Evidence |
| --- | --- | --- |
| Web search | `web_search` | ranked hits, the adapter name on each hit, adapter warnings |
| Page fetch | `web_fetch` | body, redirect list, body-prefix span, SSRF check |
| Structured extraction | `web_extract` | title, metadata, JSON-LD, tables, spans |
| Cache | `web_cache` | on-disk snapshots; a hit replays an earlier response |
| Bounded crawl | `web_crawl` | same-origin, depth and page limits |
| Multi-step read | `web_research` | search, then fetch and extract (default 3, maximum 6). Not called by `web_search` |
| Snapshot diff | `web_diff` | added and removed words; lists capped at 200, counts are full |

## Evidence contract

Search hits name a URL and an adapter. Fetch and extract add excerpt spans. Warnings and gaps stay on the result. See [EVIDENCE_CONTRACT.md](./EVIDENCE_CONTRACT.md).

## Not owned

A required paid search API, browser rendering, a model-written summary as the evidence, and evidence that is not from the web.
