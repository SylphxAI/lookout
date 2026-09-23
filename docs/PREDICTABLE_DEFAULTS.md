# Predictable defaults

There is no `fast`, `quality`, or `research` profile. The tool you name is the work that runs.

`web_search` queries public adapters and does not fetch the result pages. `web_fetch` and `web_extract` read one page. `web_research` is separate: search, then fetch and extract, default 3 pages and maximum 6. Cache is on unless you set `useCache` to false. Fetch does not run JavaScript, and it does not require an API key.

The numbers are in [defaults](./reference/defaults.md).
