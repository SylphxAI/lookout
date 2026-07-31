import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LookoutEngine } from '../src/engine.ts';

const runLive = process.env.LOOKOUT_LIVE === '1';

describe.skipIf(!runLive)('live search (LOOKOUT_LIVE=1)', () => {
  test('returns hits or structured adapter warnings', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'lookout-live-'));
    const eng = new LookoutEngine({ cacheDir: dir });
    const env = await eng.handle('web_search', { query: 'Model Context Protocol' });
    // Network/adapters can flake; accept ok with hits OR explicit no-hits/errors with engine telemetry
    expect(['ok', 'error']).toContain(env.status);
    if (env.status === 'ok') {
      const hits = (env.answer as { hits?: unknown[] })?.hits ?? [];
      expect(hits.length).toBeGreaterThan(0);
    } else {
      expect(env.code === 'NO_HITS' || env.warnings.length > 0).toBe(true);
    }
    rmSync(dir, { recursive: true, force: true });
  }, 60_000);
});
