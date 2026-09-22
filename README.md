# Lookout

### Web research with source-level proof

Lookout gives agents a small, fast, local web product: search, fetch,
extract, cache, crawl, and research with citeable excerpts.

```bash
npx -y @sylphx/lookout
```

For Claude Code:

```bash
claude mcp add lookout -- npx -y @sylphx/lookout
```

## The fastest useful workflow

```bash
npx -y @sylphx/lookout search "Model Context Protocol"
npx -y @sylphx/lookout fetch https://example.com
npx -y @sylphx/lookout extract https://example.com
```

The MCP server exposes the same workflow to agents. Results include source
URLs, excerpt spans, fetch routes, freshness signals, warnings, and gaps.

## Jobs Lookout is built for

| Ask your agent | Lookout returns |
| --- | --- |
| “Research this topic.” | ranked sources with citeable excerpts |
| “Read this page.” | clean content and source spans |
| “Extract this table or schema.” | structured page data |
| “What changed since yesterday?” | cached page diff |
| “Find similar sources.” | related pages and concepts |

## Tool surface

| Tool | Purpose |
| --- | --- |
| `web_search` | Search public adapters in parallel |
| `web_fetch` | Fetch a URL with SSRF protections |
| `web_extract` | Extract title, metadata, tables, and citeable spans |
| `web_cache` | Query and manage local cache |
| `web_crawl` | Bounded same-origin crawl |
| `web_research` | Multi-step search, fetch, extract, and source synthesis |
| `web_diff` | Compare two snapshots or URLs with bounded word-level diff |

## Predictable defaults

- `fast` uses local HTML search and fetch with no API key.
- `quality` explicitly enables richer extraction and local cache expansion.
- `research` is an explicit multi-step operation with page and budget limits.
- Browser rendering and model synthesis are opt-in.
- Private addresses, unsupported schemes, oversized responses, and blocked
  pages fail honestly.

## Why agents trust it

Lookout returns excerpts pinned to source spans and labels stale cache,
failed engines, redirects, blocked pages, and extraction gaps. It does not
turn a challenge page or a thin response into a confident answer.

## Companion MCP tools

| Product | Job |
| --- | --- |
| [Citra](https://github.com/SylphxAI/citra) | PDF answers with page-level proof |
| [Iris](https://github.com/SylphxAI/iris) | Image facts and pixel evidence |
| [Cue](https://github.com/SylphxAI/cue) | Video timelines and timestamp evidence |
| [Spine](https://github.com/SylphxAI/spine) | Repository architecture and impact |
| [Locus](https://github.com/SylphxAI/locus) | Exact code-chunk retrieval |

Each product is independent. Install only the tools your agent needs.

## Development

```bash
bun install
bun test
bun run doctor
bun run benchmark:public-proof
bun run benchmark:release-gate
```

## License

MIT
