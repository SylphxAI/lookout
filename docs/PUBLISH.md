# Publish status — Lookout

| Field | Value |
| --- | --- |
| Package | `@sylphx/lookout` |
| Repo version | `0.1.0` |
| Registry state | **not on npm (404)** |
| npm auth in this environment | `ENEEDAUTH` (external credential blocker) |

## In-repo readiness

- CI/tests/release-gate green on tip
- `npm pack --dry-run` produces a valid TS package (~23KB)
- Live `npm publish` blocked only by missing `@sylphx` registry auth in this environment

## Install until publish lands

```bash
git clone https://github.com/SylphxAI/lookout.git
cd lookout
bun install
./bin/lookout doctor
```
