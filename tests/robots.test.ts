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


  test('longer Allow overrides shorter Disallow', () => {
    const body = `User-agent: *\nDisallow: /private\nAllow: /private/public\n`;
    const d = parseRobotsTxt(body, '/private/public/doc');
    expect(d.allowed).toBe(true);
    expect(String(d.matchedRule)).toMatch(/Allow/i);
  });

  test('Disallow still blocks when no Allow match', () => {
    const body = `User-agent: *\nDisallow: /private\nAllow: /private/public\n`;
    expect(parseRobotsTxt(body, '/private/secret').allowed).toBe(false);
  });
