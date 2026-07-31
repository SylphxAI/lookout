import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LookoutCache } from '../src/cache.ts';
import { extractFromHtml } from '../src/extract.ts';
import { LookoutEngine } from '../src/engine.ts';

const html = `<!doctype html><html><head>
<title>Hello Lookout</title>
<meta name="description" content="A local-first web instrument" />
<script type="application/ld+json">{"@type":"WebPage","name":"Hello"}</script>
</head><body>
<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>
<p>Body text for agents.</p>
</body></html>`;

describe('extract', () => {
  test('pulls title description jsonld table spans', () => {
    const r = extractFromHtml(html, 'https://example.com');
    expect(r.ok).toBe(true);
    expect(r.title).toContain('Hello Lookout');
    expect(r.description).toContain('local-first');
    expect(r.jsonLd.length).toBe(1);
    expect(r.tables.length).toBe(1);
    expect(r.spans.some((s) => s.kind === 'title')).toBe(true);
  });
});

describe('cache', () => {
  test('put get query clear', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lookout-cache-'));
    const c = new LookoutCache(dir);
    c.put({ key: 'k1', kind: 'fetch', url: 'https://example.com', body: 'hello world' });
    expect(c.get('k1')?.body).toBe('hello world');
    expect(c.query('example').length).toBe(1);
    expect(c.stats().entries).toBe(1);
    expect(c.clear().removed).toBe(1);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('engine extract without network', () => {
  test('web_extract from html', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'lookout-eng-'));
    const eng = new LookoutEngine({ cacheDir: dir });
    const env = await eng.handle('web_extract', { html });
    expect(env.status).toBe('ok');
    expect((env.answer as { title?: string }).title).toContain('Hello Lookout');
    rmSync(dir, { recursive: true, force: true });
  });
});
