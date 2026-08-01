import { describe, expect, test } from 'bun:test';
import { CORE_TOOLS, Lookout } from '../src/sdk.ts';

describe('Lookout SDK surface', () => {
  test('core tools are clear and separate', () => {
    expect([...CORE_TOOLS]).toEqual(['web_search', 'web_fetch', 'web_extract']);
  });

  test('constructs', () => {
    expect(Lookout.create()).toBeTruthy();
  });
});
