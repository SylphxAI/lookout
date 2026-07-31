/**
 * Lookout MCP server — stdio tools: web_search, web_fetch, web_extract, web_cache
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { LookoutEngine } from './engine.ts';

const engine = new LookoutEngine();

function textResult(envelope: unknown, isError = false) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(envelope, null, 2) }],
    isError,
  };
}

const server = new McpServer({
  name: 'lookout',
  version: '0.1.0',
});

server.tool(
  'web_search',
  'Local-first web search via public adapters (no API key). Returns ranked hits with score explanations.',
  {
    query: z.union([z.string(), z.array(z.string())]).describe('Search query or queries'),
    useCache: z.boolean().optional(),
  },
  async (args) => {
    const envelope = await engine.handle('web_search', args as Record<string, unknown>);
    return textResult(envelope, envelope.status !== 'ok');
  },
);

server.tool(
  'web_fetch',
  'Fetch a URL with SSRF protection, redirect limits, and citeable body prefix spans.',
  {
    url: z.string().url().describe('http(s) URL to fetch'),
    useCache: z.boolean().optional(),
    maxBytes: z.number().int().positive().optional(),
    timeoutMs: z.number().int().positive().optional(),
  },
  async (args) => {
    const envelope = await engine.handle('web_fetch', args as Record<string, unknown>);
    return textResult(envelope, envelope.status !== 'ok');
  },
);

server.tool(
  'web_extract',
  'Extract title, description, JSON-LD, tables, and cite spans from HTML or by URL.',
  {
    url: z.string().url().optional(),
    html: z.string().optional(),
    useCache: z.boolean().optional(),
  },
  async (args) => {
    const envelope = await engine.handle('web_extract', args as Record<string, unknown>);
    return textResult(envelope, envelope.status !== 'ok');
  },
);

server.tool(
  'web_crawl',
  'Depth-limited same-origin crawl (advanced). SSRF-safe; not a full-site crawler.',
  {
    url: z.string().url(),
    maxDepth: z.number().int().min(0).max(3).optional(),
    maxPages: z.number().int().min(1).max(25).optional(),
  },
  async (args) => {
    const envelope = await engine.handle('web_crawl', args as Record<string, unknown>);
    return textResult(envelope, envelope.status !== 'ok');
  },
);

server.tool(
  'web_cache',
  'Query, stats, or clear the local Lookout cache.',
  {
    op: z.enum(['query', 'stats', 'clear']).optional(),
    operation: z.enum(['query', 'stats', 'clear']).optional(),
    query: z.string().optional(),
    limit: z.number().int().positive().optional(),
  },
  async (args) => {
    const envelope = await engine.handle('web_cache', args as Record<string, unknown>);
    return textResult(envelope, envelope.status !== 'ok');
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
