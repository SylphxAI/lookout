import { afterEach, describe, expect, test } from 'bun:test';
import { webFetch } from '../src/fetch.ts';

describe('web_fetch response limits', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('streams and cancels instead of buffering beyond maxBytes', async () => {
    const encoder = new TextEncoder();
    let arrayBufferCalled = false;
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('0123456789'));
        controller.enqueue(encoder.encode('more bytes that must not be retained'));
      },
      cancel() {
        cancelled = true;
      },
    });
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/plain' }),
      body,
      arrayBuffer: async () => {
        arrayBufferCalled = true;
        throw new Error('unbounded arrayBuffer path used');
      },
    })) as typeof fetch;

    const result = await webFetch('https://example.com/', { maxBytes: 4 });

    expect(result.ok).toBe(true);
    expect(result.body).toBe('0123');
    expect(result.truncated).toBe(true);
    expect(result.warnings).toContain('Response truncated to 4 bytes');
    expect(arrayBufferCalled).toBe(false);
    expect(cancelled).toBe(true);
  });
});
