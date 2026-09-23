# No API key — Lookout

Lookout is not an offline product and not a local-first product. Search and fetch use the network.

- Primary search, fetch, and extract do not require an API key.
- The process runs next to the agent. The first search still needs the network. A later call can replay a cached response when `useCache` is left on.
- Fetch reads the HTTP body. It does not launch a browser.
- The production engine is TypeScript. See [ENGINE_HONESTY.md](./ENGINE_HONESTY.md).
