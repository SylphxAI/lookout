<div align="center">

<img src="docs/public/logo.svg" alt="Lookout" width="108" height="108" />

# Lookout

### Web answers with source-level proof.

**Search and fetch citeable excerpts. No API key.** Hits name the adapter. Fetches keep a span, warnings, and gaps. Multi-step research is a separate tool.

[![npm](https://img.shields.io/npm/v/@sylphx/lookout?style=flat-square&labelColor=070b0c&color=5eead4)](https://www.npmjs.com/package/@sylphx/lookout)
[![license](https://img.shields.io/badge/license-MIT-5eead4?style=flat-square&labelColor=070b0c)](LICENSE)

**npm** [`@sylphx/lookout`](https://www.npmjs.com/package/@sylphx/lookout) · **bin** `lookout` · **MCP** `io.github.SylphxAI/lookout`

</div>

---

## The problem

A search snippet is a title and a URL. The agent then paraphrases a page it never opened. When the body is missing, a confident summary is worse than a gap.

## The difference

| A snippet says | Lookout returns |
| --- | --- |
| “Release notes” and a URL | title, description, excerpt span, and any table rows it could read |
| nothing when the fetch fails | a warning or an error: blocked address, HTTP status, truncation, empty extract |

Fetch reads the HTTP response. It does not run JavaScript, and it does not write a model summary.

## Search, then open the page

```bash
npx -y @sylphx/lookout search "Model Context Protocol"
npx -y @sylphx/lookout fetch https://example.com
npx -y @sylphx/lookout extract https://example.com
```

`search` queries DuckDuckGo HTML, Wikipedia OpenSearch, the npm registry, and Hacker News Algolia, then ranks the hits. It does not fetch those pages and it does not run `web_research`.

## Install

```bash
npx -y @sylphx/lookout
```

That starts a stdio MCP server. No API key.

| Your client | Setup |
| --- | --- |
| **Any agent / CLI** | `npx -y @sylphx/lookout` |
| **Claude Code** | `claude mcp add lookout -- npx -y @sylphx/lookout` |
| **Claude Desktop / Cursor / VS Code / Codex** | `"command": "npx", "args": ["-y", "@sylphx/lookout"]` |

```json
{
  "mcpServers": {
    "lookout": { "command": "npx", "args": ["-y", "@sylphx/lookout"] }
  }
}
```

## Tools

| Tool | When to call it |
| --- | --- |
| `web_search` | Ranked hits from the four public adapters. No API key. |
| `web_fetch` | One URL. SSRF checks, redirect cap, size cap, body-prefix span. |
| `web_extract` | Title, metadata, tables, and spans from HTML or a URL. |
| `web_cache` | Query or manage the on-disk cache. Not a web search. |
| `web_crawl` | Bounded same-origin crawl. Not the search default. |
| `web_research` | Named multi-step tool: search, then fetch and extract the top pages (default 3, max 6). |
| `web_diff` | Added and removed words between two texts or two URLs. |

There is no profile switch. The tool you name is the work that runs. Cache is on for search and fetch unless you pass `useCache: false`. A cache hit replays an earlier response from disk. The first search still needs the network.

Reference: [tools](https://sylphxai.github.io/lookout/reference/tools) · [defaults](https://sylphxai.github.io/lookout/reference/defaults)

## What it will not pretend

- Private, loopback, and link-local addresses are rejected.
- A failed adapter, a non-200 response, a truncated body, or an empty extract is reported. It is not turned into a clean answer.
- `web_fetch` does not honor `robots.txt` unless you set `respectRobots: true`. `web_crawl` honors it unless you turn that off.
- Lookout does not render a browser and does not synthesize an answer.

## Companion MCP tools

| Product | Job |
| --- | --- |
| [Citra](https://github.com/SylphxAI/citra) | PDF answers with page-level proof |
| [Iris](https://github.com/SylphxAI/iris) | Image facts and pixel evidence |
| [Cue](https://github.com/SylphxAI/cue) | Video timelines and timestamp evidence |
| [Spine](https://github.com/SylphxAI/spine) | Repository architecture and impact |
| [Locus](https://github.com/SylphxAI/locus) | Exact code-chunk retrieval |

Each product is independent. Install only the tools your agent needs.

## Documentation

| | |
| --- | --- |
| Website | [sylphxai.github.io/lookout](https://sylphxai.github.io/lookout/) |
| Quickstart | [Install and first call](https://sylphxai.github.io/lookout/guide/quickstart) |
| Compare | [Firecrawl, Tavily, and what Lookout actually does](https://sylphxai.github.io/lookout/COMPETITIVE) |

## Development

```bash
bun install
bun test
bun run doctor
bun run docs:build
```

## License

MIT
