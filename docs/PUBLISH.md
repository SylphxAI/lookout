# Publish status

| Field | Value |
| --- | --- |
| Package | `@sylphx/lookout` |
| Repo version | `0.1.0` |
| Registry state | **not_on_registry** |
| npm auth in this environment | `ENEEDAUTH` (cannot live-publish here) |

## Install paths

### npm (when published)

```bash
npm i -g @sylphx/lookout
```

### Git (always available; product SSOT)

```bash
git clone https://github.com/SylphxAI/lookout.git
cd lookout
bun install
```

### Residual

Live `npm publish` for unpublished packages requires `@sylphx` automation token / 2FA on a trusted publisher machine. That is an **external credential blocker**, not a product design gap.

See also [BRAND_PUBLISH.md](./BRAND_PUBLISH.md) when present.
