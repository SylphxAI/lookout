# Evidence contract — Lookout

Result contract v1. A locator is a URL, a rank, or an excerpt span.
`route.engine` is `lookout-ts`.
A gap can be an SSRF deny, a robots deny, or an adapter failure.
The primary path does not require a paid API key.

## Implemented wire fields (v1)

Every tool result includes:

- `envelope_version: "1"`
- `status`, `tool`, `product`, `product_version`
- `route` as `{ engine, path? }`
- `warnings` and `gaps` arrays (may be empty)
- the domain payload on `answer`
