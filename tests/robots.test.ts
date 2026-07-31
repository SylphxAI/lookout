import { describe, expect, test } from 'bun:test';
import { parseRobotsTxt } from '../src/robots.ts';

describe('parseRobotsTxt', () => {
  test('allows when no matching disallow', () => {
    const body = `User-agent: *\nDisallow: /admin\n`;
    expect(parseRobotsTxt(body, '/docs').allowed).toBe(true);
  });

  test('blocks matching disallow prefix', () => {
    const body = `User-agent: *\nDisallow: /private\n`;
    const d = parseRobotsTxt(body, '/private/x');
    expect(d.allowed).toBe(false);
    expect(d.matchedRule).toBe('/private');
  });

  test('blocks root disallow', () => {
    const body = `User-agent: *\nDisallow: /\n`;
    expect(parseRobotsTxt(body, '/any').allowed).toBe(false);
  });
});
