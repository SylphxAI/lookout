# Publish status — Lookout

This file records the package/release contract and the last verified registry
readback. The package manifest and publish workflow remain authoritative for
future releases.

| Field | Value |
| --- | --- |
| Canonical npm | `@sylphx/lookout` |
| Version last verified | `0.2.1` |
| Registry | **live** |
| Auth | GitHub org `NPM_TOKEN` via `publish-npm-package.yml` |

## Install

```bash
npm i -g @sylphx/lookout
```

Workflow: `.github/workflows/publish-npm-package.yml` (manual dispatch with
`confirm=PUBLISH`, self-hosted `sylphx-linux-standard` runner).

## Live

Last verified 2026-08-16: `@sylphx/lookout@0.2.1` — `npx -y @sylphx/lookout`.

The live package's CLI and MCP consumer paths were smoke-tested with `doctor`,
`search`, MCP `initialize`, and `tools/list`.
