# Lookout

### The web from your machine. *(Sylphx Instruments)*

**Lookout** is a local-first **web instrument** for agents and apps: **search, fetch, extract, cache** with citeable excerpts — **no required API key**, **tiny default install**, same API on **SDK · CLI · MCP**.

Primary competitive anchor: [wigolo](https://github.com/KnockOutEZ/wigolo) (learn multi-surface + honesty; **do not** require multi-GB browser/model warmup).

## Install (dev)

```bash
git clone https://github.com/SylphxAI/lookout.git
cd lookout
bun install
./bin/lookout tools
./bin/lookout extract   # via engine with -- see CLI
```

```bash
# CLI
./bin/lookout doctor
./bin/lookout tools
./bin/lookout search "local-first agents"
./bin/lookout fetch https://example.com
./bin/lookout extract https://example.com
./bin/lookout cache stats

# MCP (stdio)
bun src/mcp.ts
# or: ./bin/lookout mcp
```

## SDK

```ts
import { Lookout } from '@sylphx/lookout'

const lookout = Lookout.create()
const search = await lookout.search('model context protocol')
const page = await lookout.fetch('https://example.com')
const extracted = await lookout.extract({ url: 'https://example.com' })
```

## Tools (clear, not merged)

| Tool | Job |
| --- | --- |
| `web_search` | Public adapters (DuckDuckGo HTML + Wikipedia), rank fusion, score explain |
| `web_fetch` | SSRF-safe HTTP(S) fetch, redirects, size limits, cite spans |
| `web_extract` | Title, description, JSON-LD, tables, spans from HTML/URL |
| `web_cache` | Local disk cache query/stats/clear (`LOOKOUT_CACHE_DIR` / `~/.cache/lookout`) |

## Safety

- Private IPv4/IPv6, localhost, link-local metadata hosts **denied**
- Only `http`/`https`
- Redirect cap + response size cap

## Family

Citra · Iris · Cue · Prism · Spine · **Lookout**  
SSOT: https://github.com/SylphxAI/architecture-reader-mcp/blob/main/docs/portfolio/sylphx-instruments-ssot.md  
Spec: https://github.com/SylphxAI/architecture-reader-mcp/blob/main/docs/portfolio/specs/lookout-product-spec-v0.md

## License

MIT
