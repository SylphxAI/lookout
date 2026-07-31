#!/usr/bin/env bun
/**
 * Lookout release gate — offline deterministic checks + doctor.
 * Live network is optional (LOOKOUT_LIVE=1) and never required for ship.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runDoctor } from '../src/doctor.ts';
import { LookoutEngine, ADVANCED_TOOLS, CORE_TOOLS } from '../src/engine.ts';
import { extractFromHtml } from '../src/extract.ts';
import { normalizeResultUrl, parseDuckDuckGoHtml } from '../src/search.ts';
import { assertSafeUrl } from '../src/ssrf.ts';

type Check = { id: string; status: 'passed' | 'failed'; message: string };

const checks: Check[] = [];
function add(id: string, ok: boolean, message: string) {
  checks.push({ id, status: ok ? 'passed' : 'failed', message });
}

add('core_tools_count', CORE_TOOLS.length === 4, `core=${CORE_TOOLS.join(',')}`);
add(
  'advanced_tools',
  ADVANCED_TOOLS.includes('web_crawl') && ADVANCED_TOOLS.includes('web_research'),
  `advanced=${ADVANCED_TOOLS.join(',')}`,
);

const ssrf = assertSafeUrl('http://127.0.0.1/');
add('ssrf_loopback_denied', !ssrf.ok, ssrf.ok ? 'loopback allowed' : 'loopback denied');

const html = `<!doctype html><html><head><title>Gate</title></head><body><main><h1>Hi</h1><p>Body text for agents that is intentionally long enough to prefer the main content region over the full document body fallback path.</p></main></body></html>`;
const extracted = extractFromHtml(html, 'https://example.com');
add('extract_main_route', extracted.route === 'html_main', `route=${extracted.route}`);
add('extract_heading', extracted.headings.some((h) => h.level === 1), 'has h1');

const uddg = normalizeResultUrl(
  'https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fx&rut=1',
);
add('ddg_unwrap', uddg === 'https://example.com/x', uddg);

const eng = new LookoutEngine({ cacheDir: join(process.cwd(), '.lookout-gate-cache') });
const researchMissing = await eng.handle('web_research', {});
add('research_requires_query', researchMissing.status === 'error', researchMissing.code ?? '');

const doctor = runDoctor();
add('doctor_ok', doctor.ok, doctor.ok ? 'doctor ok' : 'doctor fail');
add('agent_skill', existsSync(join(process.cwd(), 'skills/lookout/SKILL.md')), 'skills/lookout/SKILL.md');
add('public_proof_script', existsSync(join(process.cwd(), 'scripts/public-proof.ts')), 'scripts/public-proof.ts');
add('brand_publish_doc', existsSync(join(process.cwd(), 'docs/BRAND_PUBLISH.md')), 'docs/BRAND_PUBLISH.md');

const report = {
  profile: 'lookout_release_gate',
  generated_at: new Date().toISOString(),
  status: checks.every((c) => c.status === 'passed') ? 'passed' : 'failed',
  summary: {
    total: checks.length,
    passed: checks.filter((c) => c.status === 'passed').length,
    failed: checks.filter((c) => c.status === 'failed').length,
  },
  checks,
};

const outDir = process.env.MCP_LOOKOUT_BENCHMARK_OUTPUT_DIR ?? 'benchmark-artifacts';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'lookout_release_gate.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.status === 'passed' ? 0 : 1);
