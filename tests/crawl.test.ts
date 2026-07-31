import { describe, expect, test } from 'bun:test';
import { webCrawl } from '../src/crawl.ts';

describe('web_crawl', () => {
  test('rejects private seed', async () => {
    const r = await webCrawl('http://127.0.0.1/');
    expect(r.ok).toBe(false);
    expect(r.warnings.join(' ')).toMatch(/Blocked|private|loopback|127/i);
  });
});

import { extractDescription, extractTextExcerpt, extractTitle } from '../src/crawl.ts';

describe('crawl extract helpers', () => {
  test('reads title description and text excerpt', () => {
    const html = `<html><head>
      <title>Hello Crawl</title>
      <meta name="description" content="A short desc" />
      <script>var x=1</script>
    </head><body><p>Body content for agents.</p></body></html>`;
    expect(extractTitle(html)).toBe('Hello Crawl');
    expect(extractDescription(html)).toBe('A short desc');
    expect(extractTextExcerpt(html)).toContain('Body content');
    expect(extractTextExcerpt(html)).not.toContain('var x');
  });
});
