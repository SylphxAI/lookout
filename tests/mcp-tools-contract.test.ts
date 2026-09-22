import { describe, expect, test } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CORE_TOOLS } from '../src/engine.ts';
import { createMcpServer } from '../src/mcp.ts';

describe('MCP tool contract', () => {
  test('MCP client sees core and advanced tools as separate registrations', async () => {
    const server = createMcpServer();
    const client = new Client({ name: 'lookout-contract-test', version: '0.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    try {
      const result = await client.listTools();
      expect(result.tools.map((tool) => tool.name)).toEqual([
        ...CORE_TOOLS,
        'web_cache',
        'web_crawl',
        'web_diff',
        'web_research',
      ]);
    } finally {
      await client.close();
      await server.close();
    }
  });
});
