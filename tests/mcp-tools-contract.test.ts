import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CORE_TOOLS } from '../src/engine.ts';

describe('MCP tool contract', () => {
  test('mcp.ts registers the same four core tools', () => {
    const src = readFileSync(join(import.meta.dir, '../src/mcp.ts'), 'utf8');
    for (const tool of CORE_TOOLS) {
      expect(src).toContain(`'${tool}'`);
    }
    // clear tools not merged into one god tool
    expect(CORE_TOOLS).toEqual(['web_search', 'web_fetch', 'web_extract', 'web_cache']);
    // advanced tools stay separate (not folded into core)
    expect(src).toContain("'web_crawl'");
  });
});
