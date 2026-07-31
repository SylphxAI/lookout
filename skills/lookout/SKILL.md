# Lookout — local-first web instrument for agents

Use Lookout when agents need **search/fetch/extract with citeable spans** without paid API keys or multi-GB browser stacks.

## Install

```bash
npx @sylphx/lookout          # MCP stdio (when published)
./bin/lookout doctor
./bin/lookout search "model context protocol"
./bin/lookout fetch https://example.com
./bin/lookout extract https://example.com
./bin/lookout research "local-first agents" --pages 3
```

## Tools

| Tool | Job |
| --- | --- |
| `web_search` | Public adapters (DDG HTML + Wikipedia), rank fusion |
| `web_fetch` | SSRF-safe fetch + body prefix spans |
| `web_extract` | Title, headings, links, tables, main-route text |
| `web_cache` | Local cache query/stats/clear |
| `web_crawl` *(advanced)* | Same-origin depth-limited crawl |
| `web_research` *(advanced)* | Search then extract top pages with evidence |

## Evidence contract

Results include routes, warnings, and cite spans. There is **no** `evidence_first` tool.

## Rules

1. Default path: no required API key; cache on machine.
2. Deny private/metadata hosts (SSRF policy).
3. Prefer core tools first; advanced tools only when needed.
4. Family knowledge: https://github.com/SylphxAI/instruments
