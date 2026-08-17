import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LookoutEngine } from '../src/engine.ts';
import { webResearch } from '../src/research.ts';
import { webFetch } from '../src/fetch.ts';

const ddgFixture = readFileSync(join(import.meta.dir, 'fixtures/ddg-html-sample.html'), 'utf8');

describe('web_research customer journey', () => {
  test('normalizes query, preserves redirect metadata, and returns source offsets', async () => {
    let seenQuery = '';
    let seenMaxBytes: number | undefined;
    const result = await webResearch('  local first  ', {
      maxPages: 1,
      maxBytes: 4096,
      searchFn: async (query) => {
        seenQuery = query;
        return {
          ok: true,
          query,
          hits: [{
            title: 'Redirected page',
            url: 'https://example.com/requested',
            snippet: '',
            engine: 'test',
            score: 1,
            scoreExplain: [],
          }],
          route: 'test',
          warnings: [],
          engines: [],
        };
      },
      fetchFn: async (url, options) => {
        seenMaxBytes = options?.maxBytes;
        return {
          ok: true,
          url,
          finalUrl: 'https://example.com/final',
          status: 200,
          contentType: 'text/html',
          body: `<!doctype html><html><head><title>Final page</title><meta name="description" content="A citeable page" /></head><body><main><h1>Evidence heading</h1><p>Enough content for the research extraction path to produce a stable citeable span.</p></main></body></html>`,
          route: 'test',
          warnings: [],
          redirects: ['https://example.com/final'],
          truncated: false,
        };
      },
    });

    expect(seenQuery).toBe('local first');
    expect(seenMaxBytes).toBe(4096);
    expect(result.query).toBe('local first');
    expect(result.pages[0]?.status).toBe('ok');
    expect(result.pages[0]?.finalUrl).toBe('https://example.com/final');
    expect(result.pages[0]?.redirects).toEqual(['https://example.com/final']);
    const span = result.pages[0]?.spans?.[0];
    expect(span?.kind).toBe('title');
    expect(span?.start).toBeGreaterThanOrEqual(0);
    expect(span?.end).toBeGreaterThan(span?.start ?? 0);
  });

  test('turns search adapter exceptions into a recoverable result', async () => {
    const result = await webResearch('question', {
      searchFn: async () => {
        throw new Error('adapter unavailable');
      },
    });

    expect(result.query).toBe('question');
    expect(result.hits).toEqual([]);
    expect(result.pages).toEqual([]);
    expect(result.warnings).toContain('search_failed: adapter unavailable');
  });

  test('propagates URL admission failures from the owning fetch path', async () => {
    const result = await webResearch('private target', {
      maxPages: 1,
      searchFn: async (query) => ({
        ok: true,
        query,
        hits: [{
          title: 'Private target',
          url: 'http://127.0.0.1/admin',
          snippet: '',
          engine: 'test',
          score: 1,
          scoreExplain: [],
        }],
        route: 'test',
        warnings: [],
        engines: [],
      }),
      fetchFn: webFetch,
    });

    expect(result.pages[0]?.status).toBe('error');
    expect(result.pages[0]?.fetchCode).toBe('BLOCKED_IP');
    expect(result.pages[0]?.warnings.some((warning) => warning.includes('private IPv4'))).toBe(true);
  });
});

describe('web_research envelope recovery', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('returns an error when search has no admitted results', async () => {
    globalThis.fetch = (async () => new Response('', { status: 503 })) as typeof fetch;
    const cacheDir = mkdtempSync(join(tmpdir(), 'lookout-research-no-results-'));
    try {
      const envelope = await new LookoutEngine({ cacheDir }).handle('web_research', {
        query: 'unavailable',
      });
      expect(envelope.status).toBe('error');
      expect(envelope.code).toBe('NO_RESEARCH_RESULTS');
      expect(envelope.evidence).toEqual([]);
    } finally {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  test('returns an error when hits cannot produce citeable evidence', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      return String(input).startsWith('https://html.duckduckgo.com')
        ? new Response(ddgFixture, { status: 200, headers: { 'content-type': 'text/html' } })
        : new Response('', { status: 503 });
    }) as typeof fetch;
    const cacheDir = mkdtempSync(join(tmpdir(), 'lookout-research-no-evidence-'));
    try {
      const envelope = await new LookoutEngine({ cacheDir }).handle('web_research', {
        query: 'unavailable',
        maxPages: 1,
      });
      expect(envelope.status).toBe('error');
      expect(envelope.code).toBe('NO_CITEABLE_EVIDENCE');
      expect(envelope.evidence).toEqual([]);
    } finally {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  test('returns partial evidence when one selected page fails', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('https://html.duckduckgo.com')) {
        return new Response(ddgFixture, { status: 200, headers: { 'content-type': 'text/html' } });
      }
      if (url.startsWith('https://modelcontextprotocol.io/')) {
        return new Response(
          '<html><head><title>MCP</title><meta name="description" content="A source page" /></head><body><main><p>This page has enough content for a citeable research excerpt.</p></main></body></html>',
          { status: 200, headers: { 'content-type': 'text/html' } },
        );
      }
      return new Response('', { status: 503 });
    }) as typeof fetch;

    const cacheDir = mkdtempSync(join(tmpdir(), 'lookout-research-locators-'));
    try {
      const envelope = await new LookoutEngine({ cacheDir }).handle('web_research', {
        query: 'protocol',
        maxPages: 2,
      });
      expect(envelope.status).toBe('partial');
      expect(envelope.code).toBeUndefined();
      expect((envelope.evidence as { start: number; end: number; finalUrl: string }[]).length).toBeGreaterThan(0);
      const evidence = (envelope.evidence as { start: number; end: number; finalUrl: string }[])[0]!;
      expect(evidence.start).toBeGreaterThanOrEqual(0);
      expect(evidence.end).toBeGreaterThan(evidence.start);
      expect(evidence.finalUrl).toBe('https://modelcontextprotocol.io/');
      expect((envelope.warnings ?? []).some((w) => w.startsWith('research pages degraded:'))).toBe(true);
    } finally {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });
});
