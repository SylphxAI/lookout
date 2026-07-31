# Lookout — competitive positioning

## Job

Local-first web search/fetch/extract/cache

## Wedge

Tiny default: public search adapters + fetch/extract/cache with citeable excerpts; no required API key and no multi-GB warmup.

## Local-first

Default public adapters; no required API key; SSRF-safe fetch.

## Peer anchors (learn; do not clone)

| Peer | Gap we exploit |
| --- | --- |
| KnockOutEZ/wigolo | Local web stack for agents; often heavier browser/model warmup paths |
| Paid search API MCPs | API keys, quota, non-local |
| Raw fetch without extract/cache | No citeable excerpts or repeatable cache |

## Non-goals

- Becoming a cloud SaaS wrapper as the default path
- Multi-product monorepo for star aggregation
- Generative summaries as the sole evidence authority
