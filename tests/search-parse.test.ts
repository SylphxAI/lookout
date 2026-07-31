import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  filterHitsByHosts,
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

describe('fuse query terms', () => {
  test('boosts titles matching query terms', () => {
    const fused = fuse(
      [
        [
          { title: 'Unrelated page', url: 'https://a.com/1', snippet: '', engine: 't', score: 0.85, scoreExplain: [] as string[] },
          { title: 'Local first agents guide', url: 'https://b.com/1', snippet: 'local', engine: 't', score: 0.8, scoreExplain: [] as string[] },
        ],
      ],
      'local first agents',
    );
    const top = fused[0];
    expect(top?.url).toContain('b.com');
    expect(top?.scoreExplain.some((s) => s.startsWith('query_term_boost'))).toBe(true);
  });
});


describe('filterHitsByHosts', () => {
  test('includes and excludes by host', () => {
    const hits = [
      { title: 'a', url: 'https://docs.example.com/a', snippet: '', engine: 't', score: 1, scoreExplain: [], host: 'docs.example.com' },
      { title: 'b', url: 'https://spam.bad/x', snippet: '', engine: 't', score: 1, scoreExplain: [], host: 'spam.bad' },
      { title: 'c', url: 'https://github.com/x', snippet: '', engine: 't', score: 1, scoreExplain: [], host: 'github.com' },
    ];
    const onlyDocs = filterHitsByHosts(hits, { include: ['example.com'] });
    expect(onlyDocs.map((h) => h.host)).toEqual(['docs.example.com']);
    const noSpam = filterHitsByHosts(hits, { exclude: ['spam.bad'] });
    expect(noSpam.every((h) => h.host !== 'spam.bad')).toBe(true);
  });
});
