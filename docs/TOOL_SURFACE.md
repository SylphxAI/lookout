# Tool surface

## Core

`web_search`, `web_fetch`, `web_extract`

Use these first. Search ranks public hits. Fetch and extract read a page and return spans. Search does not fetch the hits, and it does not call `web_research`.

## Advanced

`web_cache`, `web_crawl`, `web_research`, `web_diff`

Each one runs only when you call it.

| Tool | What you are asking for |
| --- | --- |
| `web_cache` | Read or change the on-disk cache |
| `web_crawl` | A same-origin crawl with depth and page caps |
| `web_research` | Search, then fetch and extract the top pages (default 3, maximum 6) |
| `web_diff` | Added and removed words between two texts or two URLs |

## What is not a tool

Lookout has no profile argument and no hidden quality mode. It does not render a browser and it does not summarize with a model. A repeated search or fetch can come from the cache when `useCache` is left on. That cache is a replay of an earlier network response, not a substitute for the network.
