import { describe, expect, test } from 'bun:test';
import { webCrawl } from '../src/crawl.ts';

describe('web_crawl', () => {
  test('rejects private seed', async () => {
    const r = await webCrawl('http://127.0.0.1/');
    expect(r.ok).toBe(false);
    expect(r.warnings.join(' ')).toMatch(/Blocked|private|loopback|127/i);
  });
});
