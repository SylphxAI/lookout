# Quickstart

## Install

```bash
npx -y @sylphx/lookout
```

For Claude Code:

```bash
claude mcp add lookout -- npx -y @sylphx/lookout
```

Then ask for a search or a page. Read the URL, the excerpt span, the warnings, and the gaps before relying on the answer.

## What runs

There is no profile switch. The tool you name is the work that runs.

| Call | What it does |
| --- | --- |
| `web_search` | Queries DuckDuckGo HTML, Wikipedia OpenSearch, the npm registry, and Hacker News Algolia. It does not fetch those pages. |
| `web_fetch` | One HTTP GET. Default 1,500,000 bytes, 20 seconds, at most 5 redirects. |
| `web_extract` | Title, metadata, tables, and spans from HTML you pass, or from a URL it fetches. |
| `web_research` | Separate tool. Search, then fetch and extract the top pages (default 3, maximum 6). Search does not call it. |

`useCache` defaults on for search and fetch. A cache hit replays an earlier response. The first call still needs the network. Fetch reads the HTTP body and does not run JavaScript. Private addresses are rejected.
