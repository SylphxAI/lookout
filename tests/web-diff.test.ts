import { describe, expect, test } from 'bun:test';
import { Lookout } from '../src/sdk.ts';

describe('Lookout web_diff', () => {
  test('reports bounded word-level changes without network', async () => {
    const result = await Lookout.create().diff({
      before: 'release adds local cache',
      after: 'release adds local cache and source spans',
    });
    expect(result.status).toBe('ok');
    const answer = result.answer as { identical: boolean; addedWords: string[]; removedWords: string[] };
    expect(answer.identical).toBe(false);
    expect(answer.addedWords).toContain('spans');
    expect(answer.removedWords).toEqual([]);
  });
});
