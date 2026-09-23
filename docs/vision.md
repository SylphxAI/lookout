# Vision — Lookout

Lookout is the local-first web tool for agents.

- **Identity:** package `@sylphx/lookout`, bin `lookout`, MCP `io.github.SylphxAI/lookout`, site <https://sylphxai.github.io/lookout/>.
- **User:** an agent that must research, read or extract from the public web with citeable evidence.
- **Job:** search public adapters in parallel, fetch and extract pages, cache and diff snapshots, and run bounded research.
- **Promise:** results carry source URLs, excerpt spans, fetch routes, freshness signals, warnings and gaps; no API key is required for the default path and no multi-GB browser is required.
- **Defaults:** `fast` uses local HTML search and fetch; `quality` enables richer extraction; `research` is explicit and bounded by page and budget limits; browser rendering and model synthesis are opt-in.
- **Boundaries:** Lookout owns web evidence. It does not own paid search APIs, default browser automation, or model synthesis as evidence authority.
