import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { LookoutEngine } from '../src/engine.ts';

const root = new URL('..', import.meta.url);

describe('public copy', () => {
  test('fixture extract keeps the release-notes title, description, and redirects table', async () => {
    const html = readFileSync(new URL('./fixtures/sample-release-notes.html', import.meta.url), 'utf8');
    const envelope = await new LookoutEngine().handle('web_extract', {
      html,
      url: 'https://example.com/releases',
    });
    const answer = envelope.answer as {
      title?: string;
      description?: string;
      tables?: { rows: string[][] }[];
    };
    expect(envelope.status).toBe('ok');
    expect(answer.title).toBe('Release notes');
    expect(answer.description).toBe('What changed in the 2.4 client.');
    const rows = answer.tables?.flatMap((table) => table.rows) ?? [];
    expect(rows).toContainEqual(['Redirects', '5']);
  });

  test('package and server descriptions do not say local-first or offline', () => {
    for (const file of ['package.json', 'server.json']) {
      const description = JSON.parse(readFileSync(new URL(file, root), 'utf8')).description as string;
      expect(description).toBe(
        'Lookout — web answers with source-level proof. Search and fetch citeable excerpts, no API key.',
      );
      expect(description.toLowerCase()).not.toContain('local-first');
      expect(description.toLowerCase()).not.toContain('offline');
    }
  });
});
