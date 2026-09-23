# Tool reference

Every result includes `status`, `tool`, `route`, `warnings`, and `gaps`. Domain fields sit on `answer`. A warning means the call finished with something you should read. An error means it did not do the thing you asked.

Start with `web_search`, `web_fetch`, or `web_extract`. The other tools are explicit.

## web_search

Ranked hits from four public adapters, queried together. No API key.

| Argument | Required | Behavior |
| --- | --- | --- |
| `query` | yes | String or array of strings |
| `useCache` | no | Default on. A hit replays a previous result for that query from disk. |
| `hostsInclude` | no | Keep hits whose host matches any entry |
| `hostsExclude` | no | Drop hits whose host matches any entry |

Each hit has `title`, `url`, `snippet`, `engine`, `score`, and `scoreExplain`. `engine` is one of `duckduckgo_html`, `duckduckgo_lite`, `wikipedia_opensearch`, `npm_registry`, or `hn_algolia`. Adapters that fail are listed in `warnings`. An empty hit list is not filled in.

This tool does not fetch the result pages.

## web_fetch

One HTTP GET.

| Argument | Required | Behavior |
| --- | --- | --- |
| `url` | yes | `http` or `https` |
| `useCache` | no | Default on |
| `maxBytes` | no | Default 1,500,000 |
| `timeoutMs` | no | Default 20,000 |
| `respectRobots` | no | Default off. Set `true` to honor `robots.txt` Disallow. |

Private, loopback, and link-local addresses are rejected before the request. At most 5 redirects. The answer includes the body (truncated when over the cap), redirect list, and a `body_prefix` span of the first 240 characters. A non-200 status is an error with the status in `warnings`.

Fetch reads the response body. It does not run JavaScript.

## web_extract

| Argument | Required | Behavior |
| --- | --- | --- |
| `url` | one of url or html | Fetched first, with the same cache and SSRF rules as `web_fetch` |
| `html` | one of url or html | Parsed directly. No network when you pass HTML. |
| `useCache` | no | Used only when Lookout has to fetch `url` |

From HTML it returns title, description, language, canonical URL, headings, links, JSON-LD, tables, text excerpt, and spans (`title`, `meta_description`, `heading_h1`, `excerpt`, and others when present). Missing title, missing description, or an empty excerpt is a warning. JSON and plain-text bodies take a shorter path and say so on `route`.

## web_cache

| Argument | Required | Behavior |
| --- | --- | --- |
| `op` or `operation` | no | `query` (default), `stats`, `clear`, or `prune` |
| `query` | no | Filter for `query` |
| `limit` | no | Cap for `query` |
| `maxAgeMs` | no | Age cutoff for `prune` |

The cache directory is `~/.cache/lookout` unless `LOOKOUT_CACHE_DIR` is set. `LOOKOUT_CACHE_MAX_AGE_MS` limits how old a hit may be. Unset means entries are not expired by age.

## web_crawl

Same-origin crawl. Not a full-site crawler.

| Argument | Required | Behavior |
| --- | --- | --- |
| `url` | yes | Seed URL |
| `maxDepth` | no | Default 1, maximum 3 |
| `maxPages` | no | Default 10, maximum 25 |
| `respectRobots` | no | Default on |
| `useSitemap` | no | When true, seed more same-origin URLs from `/sitemap.xml` |

Links that leave the origin are not followed.

## web_research

Advanced. Not called by `web_search`.

| Argument | Required | Behavior |
| --- | --- | --- |
| `query` | yes | Question or keywords |
| `maxPages` | no | Default 3, maximum 6 |
| `hostsInclude` | no | Keep hits from these hosts before fetching |
| `hostsExclude` | no | Drop hits from these hosts before fetching |

It searches with the same adapters, then fetches and extracts up to `maxPages` hits. Each page reports `fetchOk`, an excerpt, and its own warnings. A page that fails to fetch stays in the result with `fetchOk: false`.

## web_diff

| Argument | Required | Behavior |
| --- | --- | --- |
| `before` / `after` | text pair, or the URL pair | The two snapshots |
| `beforeUrl` / `afterUrl` | URL pair, or the text pair | Fetched with the same rules as `web_fetch` |
| `useCache` | no | Used when fetching URLs |

The answer lists added and removed words after whitespace is collapsed. The lists are capped at 200 words. `addedCount` and `removedCount` are the full counts.
