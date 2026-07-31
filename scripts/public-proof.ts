#!/usr/bin/env bun
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LookoutEngine, CORE_TOOLS, ADVANCED_TOOLS } from '../src/engine.ts';
import { extractFromHtml } from '../src/extract.ts';
import { normalizeResultUrl } from '../src/search.ts';
import { runDoctor } from '../src/doctor.ts';

const root = join(import.meta.dir, '..');
const outDir = process.env.MCP_LOOKOUT_BENCHMARK_OUTPUT_DIR
  ? join(root, process.env.MCP_LOOKOUT_BENCHMARK_OUTPUT_DIR)
  : join(root, 'benchmark-artifacts');

const html = `<!doctype html><html><head><title>Lookout Proof</title>
<meta name="description" content="local-first web instrument" />
</head><body><main>
<h1>Proof heading</h1>
<p>Offline extract proof for agents with enough body content to prefer main.</p>
<a href="https://example.com/docs">docs</a>
</main></body></html>`;

const started = performance.now();
const extracted = extractFromHtml(html, 'https://example.com/proof');
const uddg = normalizeResultUrl(
  'https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fdocs&rut=1',
);
const eng = new LookoutEngine({ cacheDir: join(outDir, '.lookout-proof-cache') });
const researchBad = await eng.handle('web_research', {});
const doctor = runDoctor();
const ms = performance.now() - started;

const report = {
  product: 'Lookout',
  ms,
  coreTools: CORE_TOOLS,
  advancedTools: ADVANCED_TOOLS,
  extractRoute: extracted.route,
  extractTitle: extracted.title,
  headings: extracted.headings.length,
  ddgUnwrapOk: uddg === 'https://example.com/docs',
  researchRequiresQuery: researchBad.status === 'error',
  doctorOk: doctor.ok,
  hasSkill: existsSync(join(root, 'skills/lookout/SKILL.md')),
  ok:
    extracted.route === 'html_main' &&
    uddg === 'https://example.com/docs' &&
    researchBad.status === 'error' &&
    doctor.ok,
  generatedAt: new Date().toISOString(),
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'lookout_public_proof.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
