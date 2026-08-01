# Lookout — local-first web instrument for agents

Use Lookout when agents need **search/fetch/extract with citeable spans** without paid API keys or multi-GB browser stacks.

## Install

```bash
npx @sylphx/lookout
./bin/lookout doctor
./bin/lookout search "model context protocol"
./bin/lookout fetch https://example.com
./bin/lookout extract https://example.com
./bin/lookout research "local-first agents" --pages 3
./bin/lookout cache stats
./bin/lookout cache prune
```

## Tools

| Tool | Job |
| --- | --- |
| `web_search` | Public adapters (DDG HTML + Wikipedia + **npm registry + HN Algolia**), rank fusion, query-term boost, **hostsInclude/hostsExclude** |
| `web_fetch` | SSRF-safe fetch + body prefix spans |
| `web_extract` | Title, headings, links, tables, canonical/author/og, main/json route |
| `web_cache` (advanced) | query/stats/clear/**prune** |
| `web_crawl` *(advanced)* | Same-origin crawl + excerpts; robots honor; optional **useSitemap** |
| `web_research` *(advanced)* | Search then extract top pages with evidence |

## Environment

| Var | Purpose |
| --- | --- |
| `LOOKOUT_CACHE_DIR` | Cache directory |
| `LOOKOUT_CACHE_MAX_AGE_MS` | Max age for cache hits |
| `LOOKOUT_USER_AGENT` | Fetch User-Agent |
| `LOOKOUT_FETCH_TIMEOUT_MS` | Fetch timeout |
| `LOOKOUT_FETCH_MAX_BYTES` | Max body bytes |
| `LOOKOUT_LIVE=1` | Optional live tests |

## Evidence contract

Results include routes, warnings, and cite spans. There is **no** `evidence_first` tool.

## Rules

1. Default path: no required API key; cache on machine.
2. Deny private/metadata hosts (SSRF policy).
3. Prefer core tools first; advanced tools only when needed.

## Independence

This repository is product SSOT. No central Instruments monorepo.
