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
