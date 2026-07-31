# Lookout

### The web from your machine. *(Sylphx Instruments)*

**Lookout** is a local-first **web instrument** for agents and apps: **search, fetch, extract, cache** with citeable excerpts — **no required API key**, **tiny default install**, same API on **SDK · CLI · MCP**.

Primary competitive anchor: [wigolo](https://github.com/KnockOutEZ/wigolo) (learn multi-surface + honesty; **do not** require multi-GB browser/model warmup).


## Agent skill surface

See [`skills/lookout/SKILL.md`](./skills/lookout/SKILL.md).

## Why Lookout (vs multi-GB “local web” stacks)

| Typical agent web path | Lookout |
| --- | --- |
| Paid search API keys | Default **public adapters**, $0/query |
| Multi-GB browser + model warmup | **Tiny default** — HTML search/fetch/extract |
| Opaque snippets | **Cite spans** + extract route + warnings |
| One mega-tool | **Clear tools**: search · fetch · extract · cache (+ advanced crawl) |

Primary competitive anchor: [wigolo](https://github.com/KnockOutEZ/wigolo) — learn multi-surface honesty; **do not** require heavy browser/model installs on the default path.

Evidence is a **result contract** (spans, routes, warnings) — not a tool named `evidence_first`.

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
./bin/lookout crawl https://example.com --depth 0 --pages 2

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
| `web_cache` | Local disk cache query/stats/clear/prune (`LOOKOUT_CACHE_DIR`, optional max age) |
| `web_crawl` *(advanced)* | Same-origin, depth-limited crawl (not a full-site crawler) |
| `web_research` *(advanced)* | Search then fetch/extract top pages with citeable excerpts |

## Environment

| Var | Purpose |
| --- | --- |
| `LOOKOUT_CACHE_DIR` | Cache directory (default `~/.cache/lookout`) |
| `LOOKOUT_CACHE_MAX_AGE_MS` | Optional max age for search/fetch cache hits |
| `LOOKOUT_LIVE=1` | Enable optional live network tests |
| `LOOKOUT_USER_AGENT` | Optional User-Agent override for fetch |

## Safety

- Private IPv4/IPv6, localhost, link-local metadata hosts **denied**
- Only `http`/`https`
- Redirect cap + response size cap

## Family

Citra · Iris · Cue · Prism · Spine · **Lookout**

Company portfolio knowledge (docs only — not a product monorepo):
https://github.com/SylphxAI/instruments

Lookout is an independent product repository. Sibling instruments are not vendored here.

## License

MIT
