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
<main>
<h1>Primary heading</h1>
<p>Body text for agents with enough content to prefer main.</p>
<a href="https://example.com/docs">Docs</a>
<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>
</main>
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
    expect(r.headings.some((h) => h.level === 1 && h.text.includes('Primary'))).toBe(true);
    expect(r.links.some((l) => l.href.includes('/docs'))).toBe(true);
    expect(r.route).toBe('html_main');
    expect(r.textExcerpt).toContain('Body text for agents');
  });

  test('extracts canonical author og site metadata', () => {
    const rich = `<!doctype html><html><head>
<title>T</title>
<link rel="canonical" href="https://example.com/canon" />
<meta name="author" content="Ada" />
<meta property="og:site_name" content="Example Site" />
<meta property="og:title" content="OG Title" />
</head><body><main><p>Enough body content for the main content route preference path in extract.</p></main></body></html>`;
    const r = extractFromHtml(rich, 'https://example.com/x');
    expect(r.canonicalUrl).toBe('https://example.com/canon');
    expect(r.author).toBe('Ada');
    expect(r.siteName).toBe('Example Site');
    expect(r.spans.some((s) => s.kind === 'canonical')).toBe(true);
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

describe('extract robots + json body', () => {
  test('flags robots noindex', () => {
    const html = `<!doctype html><html><head>
<meta name="robots" content="noindex,nofollow" />
<title>X</title></head><body><main><p>Body content long enough for main preference in extractor path here.</p></main></body></html>`;
    const r = extractFromHtml(html);
    expect(r.warnings).toContain('robots_noindex');
  });
});

describe('engine json extract', () => {
  test('extracts json body without html', async () => {
    const eng = new LookoutEngine({ cacheDir: '/tmp/lookout-json-extract' });
    const env = await eng.handle('web_extract', {
      html: JSON.stringify({ hello: 'world', n: 1 }),
      contentType: 'application/json',
    });
    expect(env.status).toBe('ok');
    expect((env.answer as { route?: string }).route).toBe('json_body');
    expect(JSON.stringify(env.answer)).toContain('hello');
  });
});
