import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  fuse,
  normalizeResultUrl,
  parseDuckDuckGoHtml,
  parseWikipediaOpensearch,
} from '../src/search.ts';

const fixtures = join(import.meta.dir, 'fixtures');

describe('search parsers (offline)', () => {
  test('parses duckduckgo html results', () => {
    const html = readFileSync(join(fixtures, 'ddg-html-sample.html'), 'utf8');
    const hits = parseDuckDuckGoHtml(html);
    expect(hits.length).toBe(2);
    expect(hits[0]?.url).toContain('modelcontextprotocol.io');
    expect(hits[0]?.title).toContain('Model Context Protocol');
    expect(hits[0]?.engine).toBe('duckduckgo_html');
    expect(hits[0]?.scoreExplain.length).toBeGreaterThan(0);
    expect(hits[0]?.host).toBeTruthy();
  });

  test('parses wikipedia opensearch json', () => {
    const body = readFileSync(join(fixtures, 'wikipedia-opensearch.json'), 'utf8');
    const hits = parseWikipediaOpensearch(body);
    expect(hits.length).toBe(2);
    expect(hits[0]?.url).toContain('wikipedia.org');
    expect(hits[0]?.engine).toBe('wikipedia_opensearch');
  });

  test('fuses and dedupes by url preferring higher score', () => {
    const a = parseDuckDuckGoHtml(
      readFileSync(join(fixtures, 'ddg-html-sample.html'), 'utf8'),
    );
    const b = parseWikipediaOpensearch(
      readFileSync(join(fixtures, 'wikipedia-opensearch.json'), 'utf8'),
    );
    const fused = fuse([a, b]);
    const urls = new Set(fused.map((h) => h.url));
    expect(urls.size).toBe(fused.length);
    expect(fused[0]?.score).toBeGreaterThanOrEqual(fused[fused.length - 1]?.score ?? 0);
  });
});

describe('normalizeResultUrl', () => {
  test('unwraps duckduckgo uddg redirect', () => {
    const raw =
      'https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fdocs&rut=abc';
    expect(normalizeResultUrl(raw)).toBe('https://example.com/docs');
  });

  test('passes through plain https', () => {
    expect(normalizeResultUrl('https://example.com/x')).toBe('https://example.com/x');
  });
});

describe('fuse host diversity', () => {
  test('annotates final rank in scoreExplain', () => {
    const fused = fuse([
      [
        { title: 'a', url: 'https://a.com/1', snippet: '', engine: 't', score: 0.9, scoreExplain: [] as string[] },
        { title: 'b', url: 'https://b.com/1', snippet: '', engine: 't', score: 0.8, scoreExplain: [] as string[] },
      ],
    ]);
    expect(fused[0]?.scoreExplain.some((s) => s.startsWith('rank='))).toBe(true);
    expect(fused[0]?.scoreExplain).toContain('rank=1');
  });

  test('soft-penalizes repeated hostnames', () => {
    const a = [
      { title: '1', url: 'https://example.com/a', snippet: '', engine: 't', score: 0.9, scoreExplain: [] as string[] },
      { title: '2', url: 'https://example.com/b', snippet: '', engine: 't', score: 0.85, scoreExplain: [] as string[] },
      { title: '3', url: 'https://other.com/c', snippet: '', engine: 't', score: 0.8, scoreExplain: [] as string[] },
    ];
    const fused = fuse([a]);
    const other = fused.find((h) => h.url.includes('other.com'));
    const secondExample = fused.find((h) => h.url.endsWith('/b'));
    expect(other).toBeTruthy();
    expect(secondExample).toBeTruthy();
    // after penalty, other.com can rise above second example.com hit
    expect((other?.score ?? 0) >= (secondExample?.score ?? 0)).toBe(true);
  });
});
