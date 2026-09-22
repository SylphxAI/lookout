# Lookout North Star

## Outcome

An agent or app should be able to turn a web question into trustworthy,
locatable evidence from its own machine, without a required cloud API key or a
heavy runtime install.

## North Star metric

**Successful evidence-backed retrievals (SEBR) per active consumer session.**

Count one SEBR when a consumer request produces at least one source URL and a
non-empty citeable span through either:

- `web_research`, where a page has `fetchOk: true` and at least one span; or
- the explicit `web_search` → `web_fetch`/`web_extract` journey, where the
  final result has the same source-and-span evidence.

The consumer (SDK, CLI wrapper, or MCP host) owns session-level counting because
Lookout is local-first and does not phone home. A request counts at most once.

## Floors

- Core search, fetch, and extract work without a required API key.
- Every result keeps the result contract, route, warnings, gaps, and source
  locators intact.
- SSRF protections and redirect/size limits stay enabled on fetch paths.
- SDK, CLI, and MCP remain semantically aligned.

## Anti-proxies

Raw search count, hit count, cache-hit count, npm downloads, star count, and
green CI are useful diagnostics but are not customer value. A run with no
citeable span does not advance the North Star.

## Current proof

The offline release gate and public proof exercise the evidence shape. Live
consumer smoke is `npx -y @sylphx/lookout doctor`, `search`, and MCP stdio
initialization plus `tools/list`; network availability is reported separately
from offline correctness.
