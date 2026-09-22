# Quickstart

## Install

```bash
npx -y @sylphx/lookout
```

For Claude Code:

```bash
claude mcp add lookout -- npx -y @sylphx/lookout
```

Then ask one concrete question and inspect the returned locators, route, warnings,
and gaps before relying on the answer.

## Predictable defaults

`fast` performs bounded local HTML search and fetch. Choose `quality` for richer
extraction, or `research` for explicit multi-step work with page and budget
limits. Browser rendering and model synthesis are opt-in.
