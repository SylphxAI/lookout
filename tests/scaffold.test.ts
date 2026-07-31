import { describe, expect, test } from 'bun:test';
import { Lookout } from '../src/sdk.ts';

describe('Lookout scaffold', () => {
  test('constructs', () => {
    const l = Lookout.create();
    expect(l).toBeTruthy();
  });

  test('search rejects until Phase 1', async () => {
    const l = Lookout.create();
    await expect(l.search('x')).rejects.toThrow(/Phase 1/);
  });
});
