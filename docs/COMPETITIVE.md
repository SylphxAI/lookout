# Where Lookout sits

Lookout gives an agent search hits and fetched excerpts it can cite, without an API key. It is not a hosted search API and it does not render pages in a browser.

The everyday calls are `web_search`, `web_fetch`, and `web_extract`. `web_research` is a separate multi-step tool. It is not what search does.

## Peers

| Peer | What they are | What Lookout does |
| --- | --- | --- |
| [Firecrawl](https://www.firecrawl.dev/) | A hosted crawl and scrape API. You send a key. It can return page content as markdown and can run a browser. | Lookout runs as a stdio process next to the agent. `web_fetch` reads the HTTP body and stops at the size, time, and redirect caps. It does not execute JavaScript. |
| [Tavily](https://tavily.com/) | A hosted search API for agents. A key returns results and can include extracted page content. | `web_search` does not call Tavily. It queries DuckDuckGo HTML, Wikipedia OpenSearch, the npm registry, and Hacker News Algolia, and it names the adapter on each hit. Opening a page is `web_fetch` or `web_extract`. |
| [wigolo](https://github.com/KnockOutEZ/wigolo) | An MCP server for search, fetch, crawl, and research. Its repository says that path does not require an API key. | Lookout also searches and fetches without an API key. Crawl and multi-step research are tools you call by name. `web_search` does not crawl and does not fetch the result pages. |

No latency comparison is claimed. A failed adapter stays a warning.

## Not the job

- A required paid search API.
- Browser rendering or a model-written summary as the evidence.
- Treating `web_research` as the default call.

## Install

```bash
npx -y @sylphx/lookout
```

Bare invoke starts the MCP stdio server. The same package serves the CLI subcommands.
