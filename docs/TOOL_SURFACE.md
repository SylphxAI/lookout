# Tool surface — Lookout

Policy: **few, powerful, obvious** tools.

## Primary

| Tool | Role |
| --- | --- |
| `web_search` | Local-first public search adapters (no paid key required) |
| `web_fetch` | SSRF-aware fetch |
| `web_extract` | Main-content extract with citeable spans |

## Advanced

| Tool | Role |
| --- | --- |
| `web_cache` | Cache stats/control |
| `web_crawl` | Multi-page crawl |
| `web_research` | Multi-step research orchestration |

## Rules

1. Default agent path: **search → fetch → extract**.
2. Advanced tools must be labeled advanced in README/skill.
3. No paid API key required for primary path.
4. Local-first means process runs locally; network is inherent to web.
