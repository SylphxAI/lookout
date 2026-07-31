import { describe, expect, test } from 'bun:test';
import { LookoutEngine, ADVANCED_TOOLS } from '../src/engine.ts';

describe('web_research', () => {
  test('is listed as advanced tool', () => {
    expect(ADVANCED_TOOLS).toContain('web_research');
  });

  test('requires query', async () => {
    const eng = new LookoutEngine({ cacheDir: '/tmp/lookout-research-test' });
    const env = await eng.handle('web_research', {});
    expect(env.status).toBe('error');
    expect(env.code).toBe('INVALID_INPUT');
  });
});
