import { describe, expect, test } from 'bun:test';
import { parseSitemapXml } from '../src/sitemap.ts';

describe('parseSitemapXml', () => {
  test('extracts loc URLs', () => {
    const body = `<?xml version="1.0"?>
<urlset>
  <url><loc>https://example.com/a</loc></url>
  <url><loc>https://example.com/b</loc></url>
</urlset>`;
    expect(parseSitemapXml(body)).toEqual([
      'https://example.com/a',
      'https://example.com/b',
    ]);
  });
});
