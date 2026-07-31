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

import { webResearch } from '../src/research.ts';

describe('web_research offline pipeline', () => {
  test('search then extract with injected adapters', async () => {
    const html = `<!doctype html><html><head><title>Injected</title></head>
<body><main><h1>Injected page</h1><p>Content for offline research path with enough characters for main route preference.</p></main></body></html>`;
    const result = await webResearch('local first agents', {
      maxPages: 1,
      searchFn: async (query) => ({
        ok: true,
        query,
        hits: [
          {
            title: 'Injected',
            url: 'https://example.com/offline',
            snippet: 'offline',
            engine: 'test',
            score: 1,
            scoreExplain: ['test'],
          },
        ],
        route: 'test',
        warnings: [],
        engines: [{ name: 'test', ok: true }],
      }),
      fetchFn: async (url) => ({
        ok: true,
        url,
        finalUrl: url,
        body: html,
        route: 'test',
        warnings: [],
        status: 200,
        contentType: 'text/html',
      }),
    });
    expect(result.pages.length).toBe(1);
    expect(result.pages[0]?.fetchOk).toBe(true);
    expect(result.pages[0]?.extractRoute).toBe('html_main');
    expect(result.pages[0]?.textExcerpt).toContain('offline research');
    expect(result.pages[0]?.spans?.some((s) => s.kind === 'title' || s.kind === 'excerpt')).toBe(true);
  });
});
