# Tool surface — this product

Policy: **few, powerful, obvious** tools. Prefer the primary read tool first.

| Tool | Role |
| --- | --- |
| `web_search` | Local-first public search adapters |
| `web_fetch` | SSRF-aware fetch |
| `web_extract` | Main-content extract with citeable spans |
| `web_cache` | Cache stats/control |
| `web_crawl` | Advanced crawl |
| `web_research` | Advanced multi-step research |

## Rules

1. Do not add near-duplicate tools that only differ by vanity naming.
2. Advanced tools must be labeled advanced in README/skill.
3. Schema fields should be agent-obvious; fail closed on unsafe input.
4. Composition with sibling products is via public contracts, not monorepo imports.
