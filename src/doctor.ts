import { existsSync } from 'node:fs';
import { CORE_TOOLS, LookoutEngine } from './engine.ts';
import { defaultCacheDir } from './cache.ts';
import { assertSafeUrl } from './ssrf.ts';

export type DoctorReport = {
  ok: boolean;
  product: string;
  version: string;
  checks: { name: string; status: 'ok' | 'warn' | 'fail'; message: string }[];
};

export function runDoctor(version = '0.1.0'): DoctorReport {
  const checks: DoctorReport['checks'] = [];
  checks.push({
    name: 'core_tools',
    status: CORE_TOOLS.length === 4 ? 'ok' : 'fail',
    message: `tools: ${CORE_TOOLS.join(', ')}`,
  });
  const cacheDir = defaultCacheDir();
  checks.push({
    name: 'cache_dir',
    status: 'ok',
    message: `cache dir ${cacheDir} (created on first use)`,
  });
  const ssrf = assertSafeUrl('http://127.0.0.1/');
  checks.push({
    name: 'ssrf_blocks_loopback',
    status: ssrf.ok ? 'fail' : 'ok',
    message: ssrf.ok ? 'loopback incorrectly allowed' : 'loopback denied',
  });
  const eng = new LookoutEngine({ cacheDir: cacheDir });
  checks.push({
    name: 'engine_construct',
    status: eng ? 'ok' : 'fail',
    message: 'LookoutEngine ready',
  });
  // runtime
  checks.push({
    name: 'runtime',
    status: typeof fetch === 'function' ? 'ok' : 'fail',
    message: typeof fetch === 'function' ? 'global fetch available' : 'fetch missing',
  });
  const ok = checks.every((c) => c.status !== 'fail');
  return { ok, product: 'Lookout', version, checks };
}

export function formatDoctorReport(r: DoctorReport): string {
  const lines = [`Lookout doctor — ${r.ok ? 'OK' : 'FAIL'} (v${r.version})`];
  for (const c of r.checks) {
    lines.push(`  [${c.status.toUpperCase()}] ${c.name}: ${c.message}`);
  }
  return lines.join('\n');
}
