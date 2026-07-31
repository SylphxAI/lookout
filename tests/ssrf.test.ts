import { describe, expect, test } from 'bun:test';
import { assertSafeUrl } from '../src/ssrf.ts';

describe('SSRF policy', () => {
  test('allows public https', () => {
    const r = assertSafeUrl('https://example.com/path');
    expect(r.ok).toBe(true);
  });

  test('blocks localhost', () => {
    const r = assertSafeUrl('http://localhost:8080/');
    expect(r.ok).toBe(false);
  });

  test('blocks private ipv4', () => {
    expect(assertSafeUrl('http://127.0.0.1/').ok).toBe(false);
    expect(assertSafeUrl('http://10.0.0.5/').ok).toBe(false);
    expect(assertSafeUrl('http://192.168.1.1/').ok).toBe(false);
    expect(assertSafeUrl('http://169.254.169.254/latest/meta-data/').ok).toBe(false);
  });

  test('blocks non-http schemes', () => {
    expect(assertSafeUrl('file:///etc/passwd').ok).toBe(false);
  });
});
