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
| Web search | `web_search` | ranked sources, adapters, citeable excerpts |
| Page fetch | `web_fetch` | source spans, redirects, SSRF-safe route |
| Structured extraction | `web_extract` | title, metadata, JSON-LD, tables, spans |
| Cache | `web_cache` | cached snapshots and freshness |
| Bounded crawl | `web_crawl` | same-origin, depth and page limits |
| Research | `web_research` | multi-step search, fetch and extraction with citations |
| Snapshot diff | `web_diff` | bounded word-level comparison of two snapshots or URLs |

## Evidence contract

Every result carries source URL, excerpt spans, routes, freshness, warnings and gaps. See [EVIDENCE_CONTRACT.md](./EVIDENCE_CONTRACT.md).

## Not owned

Paid search APIs as a requirement, default browser automation, model synthesis as evidence authority, and non-web evidence.
