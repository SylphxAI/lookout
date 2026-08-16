import { afterEach, describe, expect, test } from 'bun:test';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LookoutEngine } from '../src/engine.ts';

const ddgFixture = readFileSync(join(import.meta.dir, 'fixtures/ddg-html-sample.html'), 'utf8');

describe('web_research result status', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function runWithFetch(fetchImpl: typeof fetch) {
    globalThis.fetch = fetchImpl;
    const cacheDir = mkdtempSync(join(tmpdir(), 'lookout-research-status-'));
    return {
      engine: new LookoutEngine({ cacheDir }),
      cleanup: () => rmSync(cacheDir, { recursive: true, force: true }),
    };
  }

  test('returns an error when search produces no results', async () => {
    const { engine, cleanup } = runWithFetch(
      (async () => new Response('', { status: 503 })) as typeof fetch,
    );
    try {
      const envelope = await engine.handle('web_research', { query: 'unavailable' });
      expect(envelope.status).toBe('error');
      expect(envelope.code).toBe('NO_RESEARCH_RESULTS');
      expect(envelope.evidence).toEqual([]);
    } finally {
      cleanup();
    }
  });

  test('returns an error when hits cannot produce citeable spans', async () => {
    const { engine, cleanup } = runWithFetch(async (input: RequestInfo | URL) => {
      return String(input).startsWith('https://html.duckduckgo.com')
        ? new Response(ddgFixture, { status: 200, headers: { 'content-type': 'text/html' } })
        : new Response('', { status: 503 });
    });
    try {
      const envelope = await engine.handle('web_research', { query: 'unavailable' });
      expect(envelope.status).toBe('error');
      expect(envelope.code).toBe('NO_CITEABLE_EVIDENCE');
      expect(envelope.evidence).toEqual([]);
    } finally {
      cleanup();
    }
  });

  test('returns ok only when a page exposes citeable spans', async () => {
    const { engine, cleanup } = runWithFetch(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('https://html.duckduckgo.com')) {
        return new Response(ddgFixture, { status: 200, headers: { 'content-type': 'text/html' } });
      }
      if (url === 'https://modelcontextprotocol.io/') {
        return new Response(
          '<html><head><title>MCP</title></head><body><main><p>This page has enough content for a citeable research excerpt.</p></main></body></html>',
          { status: 200, headers: { 'content-type': 'text/html' } },
        );
      }
      return new Response('', { status: 503 });
    });
    try {
      const envelope = await engine.handle('web_research', { query: 'protocol', maxPages: 1 });
      expect(envelope.status).toBe('ok');
      expect(envelope.code).toBeUndefined();
      expect((envelope.evidence as { url: string; text: string }[]).length).toBeGreaterThan(0);
      expect((envelope.evidence as { url: string }[])[0]?.url).toBe('https://modelcontextprotocol.io/');
    } finally {
      cleanup();
    }
  });
});
