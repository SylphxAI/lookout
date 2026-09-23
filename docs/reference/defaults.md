# Defaults

Lookout has no `fast`, `quality`, or `research` profile. Name the tool.

| Behavior | Default |
| --- | --- |
| Search adapters | DuckDuckGo HTML, Wikipedia OpenSearch, npm registry, and Hacker News Algolia, queried together |
| Search fetches result pages | No |
| `web_research` | Only when you call it. Default 3 pages, maximum 6 |
| `useCache` on search and fetch | On. Set `false` to skip the disk cache |
| Cache directory | `~/.cache/lookout`, or `LOOKOUT_CACHE_DIR` |
| Fetch size | 1,500,000 bytes |
| Fetch timeout | 20 seconds |
| Redirects | At most 5 |
| `web_fetch` `respectRobots` | Off |
| `web_crawl` `respectRobots` | On |
| Crawl depth | 1, maximum 3 |
| Crawl pages | 10, maximum 25 |
| Fetch body | The HTTP response. No JavaScript |

Private, loopback, and link-local addresses are rejected. A failed adapter, a non-200 response, a truncated body, or an empty extract is reported.
