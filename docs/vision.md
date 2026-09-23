# Vision — Lookout

Lookout — web answers with source-level proof. Search and fetch citeable excerpts, no API key.

- **Identity:** package `@sylphx/lookout`, bin `lookout`, MCP `io.github.SylphxAI/lookout`, site <https://sylphxai.github.io/lookout/>.
- **User:** an agent that needs a public-web hit, or a page it can cite.
- **Job:** rank hits from public adapters, then fetch and extract the page you mean to cite. Keep the URL, the span, the warnings, and the gaps.
- **Promise:** that path does not require an API key. Fetch reads the HTTP body. It does not run JavaScript, and it does not write a model summary.
- **Defaults:** the tool you name is the work that runs. There is no profile switch. `web_research` is an explicit multi-step tool (default 3 pages, maximum 6) and is not what `web_search` does.
- **Boundaries:** Lookout does not require a paid search API, does not render a browser, and does not treat a model summary as the evidence.
