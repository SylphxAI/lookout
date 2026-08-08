import { ADVANCED_TOOLS, CORE_TOOLS, LookoutEngine } from './engine.ts';
import { defaultCacheDir } from './cache.ts';
import { assertSafeUrl } from './ssrf.ts';

export type DoctorReport = {
  ok: boolean;
  product: string;
  version: string;
  checks: { name: string; status: 'ok' | 'warn' | 'fail'; message: string }[];
};

export function runDoctor(version = '0.2.1'): DoctorReport {
  const checks: DoctorReport['checks'] = [];
  checks.push({
    name: 'family_envelope_v1',
    status: 'ok',
    message:
      'Lookout advertises envelope_version=1 product=lookout engine=lookout-ts (src/engine.ts withFamilyEnvelope)',
  });
  checks.push({
    name: 'core_tools',
    status: CORE_TOOLS.length === 3 ? 'ok' : 'fail',
    message: `core: ${CORE_TOOLS.join(', ')}; advanced: ${ADVANCED_TOOLS.join(', ')}`,
  });
  const cacheDir = defaultCacheDir();
  checks.push({
    name: 'cache_dir',
    status: 'ok',
    message: `cache dir ${cacheDir} (created on first use)`,
  });
  const maxAge = process.env.LOOKOUT_CACHE_MAX_AGE_MS?.trim();
  checks.push({
    name: 'cache_max_age_env',
    status: 'ok',
    message: maxAge
      ? `LOOKOUT_CACHE_MAX_AGE_MS=${maxAge}`
      : 'LOOKOUT_CACHE_MAX_AGE_MS unset (cache entries not age-limited)',
  });
  const ua = process.env.LOOKOUT_USER_AGENT?.trim();
  checks.push({
    name: 'user_agent_env',
    status: 'ok',
    message: ua
      ? `LOOKOUT_USER_AGENT set (${ua.slice(0, 48)})`
      : 'LOOKOUT_USER_AGENT unset (default Lookout UA)',
  });
  const fetchTimeout = process.env.LOOKOUT_FETCH_TIMEOUT_MS?.trim();
  const fetchMax = process.env.LOOKOUT_FETCH_MAX_BYTES?.trim();
  checks.push({
    name: 'fetch_limits_env',
    status: 'ok',
    message: `timeout=${fetchTimeout || 'default'} maxBytes=${fetchMax || 'default'}`,
  });
  const ssrf = assertSafeUrl('http://127.0.0.1/');
  checks.push({
    name: 'ssrf_blocks_loopback',
    status: ssrf.ok ? 'fail' : 'ok',
    message: ssrf.ok ? 'loopback incorrectly allowed' : 'loopback denied',
  });
  const eng = new LookoutEngine({ cacheDir });
  checks.push({
    name: 'engine_construct',
    status: eng ? 'ok' : 'fail',
    message: 'LookoutEngine ready',
  });
  checks.push({
    name: 'runtime',
    status: typeof fetch === 'function' ? 'ok' : 'fail',
    message: typeof fetch === 'function' ? 'global fetch available' : 'fetch missing',
  });
  checks.push({
    name: 'engine_honesty',
    status: 'ok',
    message: 'Production engine is TypeScript (lookout-ts); not sole-Rust — see docs/ENGINE_HONESTY.md',
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
