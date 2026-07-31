# Lookout

### The web from your machine. *(Sylphx Instruments)*

**Lookout** is a local-first **web instrument** for agents and apps: search, fetch, extract, and cache with citeable excerpts — **no required API key**, **tiny default install**, same API on **SDK · CLI · MCP**.

> Scaffold / greenfield. Spec:  
> https://github.com/SylphxAI/architecture-reader-mcp/blob/main/docs/portfolio/specs/lookout-product-spec-v0.md

## Why

| Cloud web tools | Lookout (target) |
| --- | --- |
| API keys + metered cost | $0 core path, no required key |
| Opaque host search | Portable MCP/SDK/CLI |
| Heavy local stacks (~GB warmup) | **Light default**; optional heavy profile later |

Primary competitive anchor: [wigolo](https://github.com/KnockOutEZ/wigolo) — learn multi-surface + honest results; **do not** require multi-GB browser/model init for the default path.

## Surfaces (target)

| Surface | Status in this scaffold |
| --- | --- |
| Core | Rust crate stub `lookout-core` |
| CLI | `bin/lookout` stub |
| MCP | planned tools: `web_search`, `web_fetch`, `web_extract`, `web_cache` |
| SDK | TypeScript `src/sdk.ts` stub |
| Tests | placeholder |

## Tools (clear, not merged)

**Core:** `web_search` · `web_fetch` · `web_extract` · `web_cache`  
**Advanced (later):** crawl · similar · diff/watch · research  

## Install (not published yet)

```bash
# after first release
# npm i -g @sylphx/lookout
# lookout search "local-first agents"
```

## Family

Part of **Sylphx Instruments**: Citra · Iris · Cue · Prism · Spine · **Lookout**  
SSOT: https://github.com/SylphxAI/architecture-reader-mcp/blob/main/docs/portfolio/sylphx-instruments-ssot.md

## License

MIT
