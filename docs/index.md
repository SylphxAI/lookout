---
layout: home

hero:
  name: Lookout
  text: Web answers with source-level proof.
  tagline: Search and fetch citeable excerpts. No API key. The call uses the network; the result keeps the URL, the span, and the gaps.
  image:
    src: /logo.svg
    alt: Lookout — a lens mark
  actions:
    - theme: brand
      text: Get started
      link: /guide/quickstart
    - theme: alt
      text: Star on GitHub
      link: https://github.com/SylphxAI/lookout
---

<div class="lk-section">
  <span class="lk-eyebrow">The difference</span>
  <h2 class="lk-h2">A search snippet is not the page.<br />An excerpt you can point at is.</h2>
  <p class="lk-lead">A title and a URL leave the agent to paraphrase a page it never opened. Lookout returns the hit, then the fetched text, with spans a person can check. If a page is blocked, truncated, or empty, the result says so.</p>
  <div class="lk-compare" style="margin-top:28px">
    <div class="side">
      <h3>What a bare snippet says</h3>
      <p>“Release notes” · example.com · no table, no span, no warning if the body never arrived.</p>
    </div>
    <div class="side good">
      <h3>What Lookout returns</h3>
      <p>title <span class="lk-cite">Release notes</span> · excerpt span · table Limit / Value / Redirects / 5 · warnings empty when the body was actually read.</p>
    </div>
  </div>
</div>

## One extract. Spans included.

```json
{
  "status": "ok",
  "tool": "web_extract",
  "route": { "engine": "lookout-ts", "path": "html_main" },
  "warnings": [],
  "gaps": [],
  "answer": {
    "url": "https://example.com/releases",
    "title": "Release notes",
    "description": "What changed in the 2.4 client.",
    "language": "en",
    "headings": [{ "level": 1, "text": "Release notes" }],
    "tables": [{ "rows": [["Limit", "Value"], ["Redirects", "5"]] }],
    "spans": [
      { "kind": "title", "text": "Release notes" },
      { "kind": "meta_description", "text": "What changed in the 2.4 client." },
      { "kind": "excerpt", "text": "Release notes The 2.4 client adds citeable excerpts. See the table for the default limits. Limit Value Redirects 5" }
    ]
  }
}
```

<p class="lk-fine">Excerpt of a real <code>web_extract</code> result for <code>tests/fixtures/sample-release-notes.html</code> (the heading span is omitted here). The page in that file is sample HTML, not a live site. Fetch reads the HTTP body. It does not run JavaScript.</p>

<div class="lk-section">
  <span class="lk-eyebrow">How it works</span>
  <h2 class="lk-h2">Three steps from a question to a citation</h2>
  <div class="lk-steps" style="margin-top:26px">
    <div class="lk-step">
      <div class="n">Step 1</div>
      <h3>Add it to your agent</h3>
      <p>One <code>npx</code> line. A stdio MCP server starts for Claude, Cursor, VS Code, Codex, or any other MCP client.</p>
    </div>
    <div class="lk-step">
      <div class="n">Step 2</div>
      <h3>Search, then open the page</h3>
      <p><code>web_search</code> ranks public hits. <code>web_fetch</code> or <code>web_extract</code> reads the page you mean to cite. Neither call runs a multi-step research pass.</p>
    </div>
    <div class="lk-step">
      <div class="n">Step 3</div>
      <h3>Cite the span</h3>
      <p>Use the URL, the excerpt, and the warnings. If they are empty, do not invent the page.</p>
    </div>
  </div>
</div>

<div class="lk-section">
  <span class="lk-eyebrow">What you call</span>
  <h2 class="lk-h2">Search and fetch first. The rest is named.</h2>
  <p class="lk-lead">The everyday tools are <code>web_search</code>, <code>web_fetch</code>, and <code>web_extract</code>. Cache, crawl, diff, and multi-step research are separate tools. Nothing calls them for you.</p>
  <div class="lk-grid three" style="margin-top:26px">
    <div class="lk-card">
      <div class="lk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg></div>
      <h3>web_search</h3>
      <p>Queries DuckDuckGo HTML, Wikipedia, the npm registry, and Hacker News. Ranked hits name the adapter. No API key.</p>
    </div>
    <div class="lk-card">
      <div class="lk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg></div>
      <h3>web_fetch</h3>
      <p>Reads one HTTP response. Private addresses are rejected. Redirects, size, and timeout are capped. A prefix span cites the body.</p>
    </div>
    <div class="lk-card">
      <div class="lk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5" /><path d="M8 13h8" /><path d="M8 17h5" /></svg></div>
      <h3>web_extract</h3>
      <p>Title, description, headings, links, JSON-LD, tables, and spans from HTML you pass or from a URL it fetches first.</p>
    </div>
    <div class="lk-card">
      <div class="lk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h10" /></svg></div>
      <h3>web_cache</h3>
      <p>Query, stats, clear, or prune the on-disk cache. A cache hit replays an earlier response. It is not a search of the web.</p>
    </div>
    <div class="lk-card">
      <div class="lk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="2" /><circle cx="18" cy="12" r="2" /><circle cx="6" cy="18" r="2" /><path d="M8 6h8M8 18h8M16 12H8" /></svg></div>
      <h3>web_crawl</h3>
      <p>Same-origin only. Default depth 1 (max 3) and 10 pages (max 25). Robots are honored unless you turn that off.</p>
    </div>
    <div class="lk-card">
      <div class="lk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16" /><path d="M4 12h10" /><path d="M4 18h7" /><path d="m15 15 4 3-4 3" /></svg></div>
      <h3>web_research and web_diff</h3>
      <p><code>web_research</code> searches, then fetches the top pages (default 3, max 6). <code>web_diff</code> reports added and removed words. Call them by name.</p>
    </div>
  </div>
</div>

<div class="lk-section">
  <span class="lk-eyebrow">Limits</span>
  <h2 class="lk-h2">The defaults are the caps, not a benchmark.</h2>
  <div class="lk-limits" style="margin-top:26px">
    <div class="stat"><div class="num">4</div><div class="lbl">public search adapters on every <code>web_search</code>: DuckDuckGo HTML, Wikipedia OpenSearch, the npm registry, Hacker News Algolia</div></div>
    <div class="stat"><div class="num">None</div><div class="lbl">API key on that path. A failed adapter is a warning, not a hidden success.</div></div>
    <div class="stat"><div class="num">1,500,000</div><div class="lbl">byte default fetch cap. The default timeout is 20 seconds.</div></div>
    <div class="stat"><div class="num">5</div><div class="lbl">redirects, then fetch stops. Loopback, link-local, and other private addresses are rejected.</div></div>
  </div>
  <p class="lk-fine">These are the limits in the current search and fetch path, not a measured speed claim. A repeated call can be served from the on-disk cache. The first search still needs the network. Lookout does not render a page in a browser and does not write a model summary.</p>
</div>

## Install

```bash
npx -y @sylphx/lookout
```

::: code-group
```json [Claude Desktop / Cursor / VS Code]
{
  "mcpServers": {
    "lookout": { "command": "npx", "args": ["-y", "@sylphx/lookout"] }
  }
}
```

```bash [Claude Code]
claude mcp add lookout -- npx -y @sylphx/lookout
```

```bash [Any agent / CLI]
npx -y @sylphx/lookout
```
:::

<div class="lk-cta">
  <h2>Search the page. Cite the span.</h2>
  <p>No API key. <code>web_search</code> and <code>web_fetch</code> are the call. Multi-step research stays a tool you name.</p>
  <p style="margin-top:18px"><a class="VPButton brand" href="./guide/quickstart">Read the quickstart</a> <a class="VPButton alt" href="https://github.com/SylphxAI/lookout">Star the repo</a></p>
</div>
