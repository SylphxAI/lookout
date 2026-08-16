import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LookoutEngine } from '../src/engine.ts';

describe('LookoutEngine web_crawl contract', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('forwards robots and sitemap controls to the crawl implementation', async () => {
    const requested: string[] = [];
    const html = '<html><head><title>Lookout</title></head><body><p>Page content.</p></body></html>';
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      requested.push(url);
      if (url.endsWith('/sitemap.xml')) {
        return new Response(
          '<urlset><url><loc>https://example.com/guide</loc></url></urlset>',
          { status: 200, headers: { 'content-type': 'application/xml' } },
        );
      }
      return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } });
    }) as typeof fetch;

    const cacheDir = mkdtempSync(join(tmpdir(), 'lookout-engine-crawl-'));
    try {
      const engine = new LookoutEngine({ cacheDir });
      const envelope = await engine.handle('web_crawl', {
        url: 'https://example.com/',
        maxDepth: 0,
        maxPages: 2,
        respectRobots: false,
        useSitemap: true,
      });

      expect(envelope.status).toBe('ok');
      const answer = envelope.answer as { pages: { url: string }[]; warnings: string[] };
      expect(answer.warnings).toContain('sitemap.xml seeded 1 same-origin URLs');
      expect(answer.pages.map((page) => page.url)).toContain('https://example.com/guide');
      expect(requested.some((url) => url.endsWith('/robots.txt'))).toBe(false);
    } finally {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });
});
